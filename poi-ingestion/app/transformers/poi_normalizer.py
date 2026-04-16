from datetime import datetime
import json

class POINormalizer:
    def normalize(self, raw_place):
        geometry = raw_place.get("geometry", {})
        location = geometry.get("location", {})

        lat = location.get("lat")
        lon = location.get("lng")
        place_id = raw_place.get("place_id")

        if not place_id or lat is None or lon is None:
            return None

        return {
            "place_id": place_id,
            "name": raw_place.get("name"),
            "latitude": lat,
            "longitude": lon,

            "primary_type": raw_place.get("types", [None])[0],
            "types": raw_place.get("types", []),

            "rating": raw_place.get("rating", 0.0),
            "user_ratings_total": raw_place.get("user_ratings_total", 0),
            "price_level": raw_place.get("price_level", 0),

            "open_now": int(raw_place.get("opening_hours", {}).get("open_now", False)),
            "business_status": raw_place.get("business_status"),

            "created_at": datetime.utcnow(),
            "altitude": 0.0,

            "properties_json": json.dumps(raw_place, ensure_ascii=False)
        }