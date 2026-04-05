from __future__ import annotations
import json
from flask import Blueprint, request, jsonify, g
from app.models import Building
from geoalchemy2.shape import to_shape
from app.extensions import ch
from app.scripts.timer import timer_decorator
bp = Blueprint("main", __name__)
import time


def log_request_time(start_time: float, endpoint: str):
    duration = (time.time() - start_time) * 1000
    print(f"[API TIMER] {endpoint} - {duration:.2f} мс")

@bp.before_request
@timer_decorator
def before_request():
    g.start_time = time.time()

@bp.after_request
def after_request(response):
    if hasattr(g, 'start_time'):
        duration = (time.time() - g.start_time) * 1000
        print(f"[API TIMER] {request.method} {request.path} - {duration:.2f} мс")
    return response


@bp.route("/api/coordinates/points", methods=["GET"])
@timer_decorator
def get_points_coordinates():
    if not ch.client:
        return jsonify({"error": "Database connection error"}), 500

    query = "SELECT longitude, latitude, altitude FROM default.points_h3 LIMIT 100000"
    
    try:
        result = ch.client.query(query)
        data = []
        for row in result.result_rows:
            point = {
                "longitude": float(row[0]) if row[0] is not None else 0,
                "latitude": float(row[1]) if row[1] is not None else 0,
                "altitude": float(row[2]) if row[2] is not None else 0
            }
            data.append(point)
        
        print(f"Загружено {len(data)} точек из ClickHouse")
        if data:
            print(f"Пример точки: {data[0]}")
            
        return jsonify(data)
    except Exception as e:
        print(f"Ошибка выполнения запроса: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

@bp.route("/api/coordinates/geo", methods=["GET"])
def get_geo_coordinates():
    buildings = Building.query.all()

    features = []
    for b in buildings:
        try:
            geometry = to_shape(b.geom).__geo_interface__
        except json.JSONDecodeError:
            geometry = None

        if not geometry:
            continue

        properties = {
            "height": b.height_agl,
            "external_id": b.external_id,
            "Address_street": b.name,
        }

        features.append(
            {
                "type": "Feature",
                "properties": properties,
                "geometry": geometry,
            }
        )

    collection = {"type": "FeatureCollection", "features": features}
    return jsonify(collection)

@bp.route("/api/points/h3/indexes/simple", methods=["GET"])
@timer_decorator
def get_h3_indexes_simple():
    """Получить только H3 индексы (простой список)"""
    if not ch.client:
        return jsonify({"error": "Database connection error"}), 500
    
    limit = request.args.get('limit', 10000, type=int)
    
    query = "SELECT h3_index FROM default.points_h3 LIMIT %(limit)s"
    
    try:
        # Для HTTP клиента используем query метод
        result = ch.client.query(query, parameters={'limit': limit})
        
        indexes = [row[0] for row in result.result_rows]
        
        return jsonify(indexes)
    except Exception as e:
        print(f"Ошибка: {e}")
        return jsonify({"error": str(e)}), 500

