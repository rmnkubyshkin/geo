from typing import Optional
import clickhouse_connect
from clickhouse_connect.driver import Client
import h3
from datetime import datetime
import json
from app.config import (
    CLICKHOUSE_HOST,
    CLICKHOUSE_PORT,
    CLICKHOUSE_USER,
    CLICKHOUSE_PASSWORD,
    CLICKHOUSE_DB,
)

class ClickHouseWriter:
    def __init__(self, host, port, user, password, database):
        self.client = clickhouse_connect.get_client(
            host=CLICKHOUSE_HOST,
            port=CLICKHOUSE_PORT,
            username=CLICKHOUSE_USER,
            password=CLICKHOUSE_PASSWORD,
            database=CLICKHOUSE_DB,
        )

    def insert_pois(self, pois):
        assert self.client is not None

        rows = []

        all_ids = [p["place_id"] for p in pois if p.get("place_id")]
        existing_ids = self.get_existing_place_ids(all_ids)
        new_pois = [p for p in pois if p["place_id"] not in existing_ids]

        for p in new_pois:
            try:
                row = [
                    h3.str_to_int(p["h3_index"]),

                    p.get("created_at", datetime.utcnow()), 

                    p.get("longitude"),
                    p.get("latitude"),   
                    p.get("altitude", 0.0),  

                    p.get("place_id", ""),
                    p.get("name", ""),

                    p.get("primary_type", ""),
                    p.get("types", []),

                    float(p.get("rating", 0.0)),
                    int(p.get("user_ratings_total", 0)),
                    int(p.get("price_level", 0)),

                    int(p.get("open_now", 0)),
                    p.get("business_status", ""),

                    json.dumps(p, ensure_ascii=False, default=self.json_serializer),
                ]

                rows.append(row)

            except Exception as e:
                print(f"Skip bad row: {e}")
                continue

        if not rows:
            print("Нет валидных данных для вставки")
            return

        self.client.insert(
            table="places_h3",
            data=rows,
            column_names=[
                "h3_index",
                "created_at",
                "longitude",
                "latitude",
                "altitude",

                "place_id",
                "name",

                "primary_type",
                "types",

                "rating",
                "user_ratings_total",
                "price_level",

                "open_now",
                "business_status",

                "properties_json",
            ],
        )

        print(f"Вставлено строк: {len(rows)}")

    def json_serializer(self, obj):
        if isinstance(obj, datetime):
            return obj.isoformat()
        raise TypeError(f"Type not serializable: {type(obj)}")
    
    def get_existing_place_ids(self, place_ids):
        if not place_ids:
            return set()

        query = """
            SELECT place_id
            FROM places_h3
            WHERE place_id IN %(ids)s
        """

        result = self.client.query(query, {"ids": tuple(place_ids)})
        return {row[0] for row in result.result_rows}