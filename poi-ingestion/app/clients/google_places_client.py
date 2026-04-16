import requests
import time
import os
from app.config import GOOGLE_API_KEY


class GooglePlacesClient:
    def __init__(self):
        self.api_key = GOOGLE_API_KEY
        if not self.api_key:
            raise ValueError("GOOGLE_API_KEY is not loaded. Check .env file")
        
        self.base_url = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"

    def search_nearby(self, lat, lon, radius=500, keyword=None):
        params = {
            "location": f"{lat},{lon}",
            "radius": radius,
            "key": self.api_key,
        }

        if keyword:
            params["keyword"] = keyword

        results = []

        while True:
            response = requests.get(self.base_url, params=params, timeout=30)            
            data = response.json()

            status = data.get("status")
            print("STATUS:", status)

            if status not in ("OK", "ZERO_RESULTS"):
                if status == "INVALID_REQUEST":
                    print("Ждём next_page_token...")
                    time.sleep(2)
                    continue
                else:
                    print("Ошибка API:", data)
                    break

            results.extend(data.get("results", []))

            next_page = data.get("next_page_token")
            if not next_page:
                break
            
            time.sleep(2)

            params = {
                "pagetoken": next_page,
                "key": self.api_key
            }

        return results