class POINormalizer:
    def normalize(self, raw_places):
        normalized = []

        for place in raw_places:
            normalized.append({
                "place_id": place.get("place_id"),
                "name": place.get("name"),
                "lat": place["geometry"]["location"]["lat"],
                "lon": place["geometry"]["location"]["lng"],
                "rating": place.get("rating"),
                "types": place.get("types", [])
            })

        return normalized