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

    query = "SELECT longitude, latitude, altitude FROM default.points_h3 LIMIT 1000"
    
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
def get_h3_indexes_simple():
    
    if not ch.client:
        return jsonify({"error": "Database connection error"}), 500
    
    limit = request.args.get('limit', 10000, type=int)
    
    try:
        result = ch.client.query(f"SELECT h3_index, altitude FROM places_h3 LIMIT {limit}")
        
        data = [{"h3Index": str(row[0]), "altitude": row[1]} for row in result.result_rows]
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/api/places/<place_id>", methods=["GET"])
def get_place_details(place_id):
    if not ch.client:
        return jsonify({"error": "Database connection error"}), 500

    try:
        result = ch.client.query("""
            SELECT 
                place_id,
                any(name) as name,
                any(primary_type) as primary_type,
                any(types) as types,

                any(latitude) as latitude,
                any(longitude) as longitude,
                any(altitude) as altitude,

                any(rating) as rating,
                any(user_ratings_total) as user_ratings_total,
                any(price_level) as price_level,

                any(open_now) as open_now,
                any(business_status) as business_status,

                any(created_at) as created_at
            FROM points_h3
            WHERE place_id = %(place_id)s
            GROUP BY place_id
            LIMIT 1
        """, {"place_id": place_id})

        if not result.result_rows:
            return jsonify({"error": "Place not found"}), 404

        row = result.result_rows[0]

        return jsonify({
            "place_id": row[0],
            "name": row[1],
            "primary_type": row[2],
            "types": row[3],

            "latitude": row[4],
            "longitude": row[5],
            "altitude": row[6],

            "rating": row[7],
            "user_ratings_total": row[8],
            "price_level": row[9],

            "open_now": bool(row[10]),
            "business_status": row[11],

            "created_at": row[12]
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 500