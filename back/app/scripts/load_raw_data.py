from __future__ import annotations
from shapely.geometry import shape
from geoalchemy2.shape import from_shape
import json
from pathlib import Path
from typing import Iterable
from datetime import datetime, timezone
from flask import current_app

from app.extensions import db
from app.models import Building
from shapely.geometry import Point as ShapelyPoint
from geoalchemy2.shape import from_shape
import h3
import h3.api.basic_int as h3_int
from app.extensions import ch
from app.scripts.clickhouse_setup import ensure_clickhouse_tables

def _raw_data_dir() -> Path:
    return Path(current_app.root_path) / "raw_data"


def _load_json_any_encoding(path: Path) -> dict:
    for enc in ("utf-8", "cp1251"):
        try:
            with path.open("r", encoding=enc) as f:
                return json.load(f)
        except UnicodeDecodeError:
            continue
    with path.open("r", encoding="utf-8") as f:
        return json.load(f)


def load_raw_data_if_needed(app) -> None:
    with app.app_context():
        raw_dir = _raw_data_dir()
        if not raw_dir.exists() or not raw_dir.is_dir():
            return

        has_buildings = Building.query.first() is not None

        
        for path in sorted(raw_dir.iterdir()):
            if not path.is_file():
                continue

            name = path.name.lower()

            if name.startswith("points") and name.endswith(".json"):
                _load_points_to_clickhouse(path)
                has_points = True

            elif (
                name.startswith("buildings")
                and (name.endswith(".geojson") or name.endswith(".json"))
                and not has_buildings
            ):
                _load_buildings_from_file(path)
                has_buildings = True


def _load_buildings_from_file(path: Path) -> None:
    payload = _load_json_any_encoding(path)
    features: Iterable[dict] = payload.get("features", [])

    to_insert: list[Building] = []
    for feature in features:
        props = feature.get("properties", {}) or {}
        geom_dict = feature.get("geometry")
        
        if not geom_dict:
            continue

        try:
            shapely_geom = shape(geom_dict)
            geo_geom = from_shape(shapely_geom, srid=4326)
            
            external_id = props.get("ID_build") or props.get("Polygon_ID")
            name = props.get("Address_street")
            b_type = props.get("Type")
            
            agl_raw = props.get("AGL")
            try:
                height_agl = float(agl_raw) if agl_raw is not None else None
            except (TypeError, ValueError):
                height_agl = None

            exclude = {"ID_build", "Polygon_ID", "AGL", "Address_street", "Type"}
            attributes = {k: v for k, v in props.items() if k not in exclude}

            building = Building(
                external_id=str(external_id) if external_id else None,
                name=name,
                building_type=b_type,
                height_agl=height_agl,
                geom=geo_geom, 
                attributes_json=attributes,
                data_source="raw_file",
            )
            to_insert.append(building)
            
        except Exception as e:
            print(f"Ошибка обработки объекта: {e}")
            continue

    if to_insert:
        db.session.bulk_save_objects(to_insert)
        db.session.commit()
        print(f"Загружено {len(to_insert)} зданий в PostgreSQL")

def reload_points_data():
    """Перезагружает данные в ClickHouse"""
    if not ch.client:
        print("ClickHouse клиент не инициализирован")
        return
    
    try:
        if not ensure_clickhouse_tables():
            print("Не удалось подготовить таблицу")
            return
        
        ch.client.query("TRUNCATE TABLE IF EXISTS points_h3")
        print("Старые данные удалены")
        
        raw_dir = _raw_data_dir()
        for path in sorted(raw_dir.iterdir()):
            if path.is_file() and path.name.lower().startswith("points") and path.name.lower().endswith(".json"):
                _load_points_to_clickhouse(path)
                break
                
    except Exception as e:
        print(f"Ошибка перезагрузки: {e}")


def _load_points_to_clickhouse(path: Path) -> None:
    if not ch.client:
        print("ClickHouse клиент не инициализирован.")
        return
    
    if not ensure_clickhouse_tables():
        print("Не удалось создать/проверить таблицу")
        return
    
    payload = _load_json_any_encoding(path)
    items = payload.get("data", [])
    if not items:
        print(f"Нет данных в файле {path}")
        return

    H3_RESOLUTION = 15
    data_for_ch = []
    errors = 0
    
    print(f"Начинаем загрузку {len(items)} точек...")
    print(f"Resolution H3: {H3_RESOLUTION}")
    
    for idx, item in enumerate(items):
        lat = item.get('latitude')
        lon = item.get('longitude')
        alt = item.get('height')
        props = item.get('properties', {}) or {}
        
        if lat is not None and lon is not None:
            try:
                h3_index = h3_int.latlng_to_cell(float(lat), float(lon), H3_RESOLUTION)
                altitude = float(alt) if alt is not None else 0.0
                if idx < 5:
                    print(f"Точка {idx}:")
                    print(f"  H3 индекс: {h3_index}")
                    print(f"  Высота: {altitude}")
                    print(f"  Координаты: ({lat}, {lon})")
                
                data_for_ch.append([
                    int(h3_index),
                    datetime.now(timezone.utc).replace(microsecond=0),
                    float(lon),
                    float(lat),
                    altitude,
                    json.dumps(props, ensure_ascii=False)
                ])
                
                    
            except Exception as e:
                errors += 1
                print(f"Ошибка обработки точки {idx}: {e}")
                continue

    if data_for_ch:
        try:
            ch.client.insert(
                'points_h3',
                data_for_ch,
                column_names=[
                    'h3_index',
                    'created_at',
                    'longitude',
                    'latitude',
                    'altitude',
                    'properties_json'
                ]
            )
            print(f"Загружено {len(data_for_ch)} точек в ClickHouse")
            print(f"Ошибок: {errors}")
            
        except Exception as e:
            print(f"Ошибка вставки в ClickHouse: {e}")
    else:
        print("Нет данных для вставки")
        print(f"Ошибок: {errors}")