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
        result = ch.client.query(
            """
            SELECT
                lower(hex(h3_index)) AS h3_index,
                count() AS pointCount
            FROM places_h3
            GROUP BY h3_index
            ORDER BY pointCount DESC
            LIMIT %(limit)s
            """,
            {"limit": limit}
        )
        
        data = [{"h3Index": str(row[0]), "pointCount": row[1]} for row in result.result_rows]
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@bp.route("/api/points/by-h3", methods=["GET"])
def get_place_by_h3():
    h3_index = request.args.get("h3_index")
    
    if not h3_index:
        return jsonify({"error": "h3_index required"}), 400

    if not ch.client:
        return jsonify({"error": "client not initialized"}), 500

    try:
        result = ch.client.query(
            """
            SELECT
                place_id,
                name,
                latitude,
                longitude,
                rating,
                user_ratings_total,
                price_level,
                open_now,
                business_status
            FROM places_h3
            WHERE h3_index = %(h3)s
            """,
            {"h3": int(h3_index)}
        )

        data = [
            {
                "place_id": row[0],
                "name": row[1],
                "latitude": row[2],
                "longitude": row[3],
                "rating": row[4],
                "reviews": row[5],
                "price": row[6],
                "open_now": row[7],
                "status": row[8],
            }
            for row in result.result_rows
        ]

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500