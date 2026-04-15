import h3
from app.clients.google_places_client import GooglePlacesClient

class POICrawler:
    def __init__(self):
        self.client = GooglePlacesClient()

    def crawl_cell(self, h3_cell, category):
        lat, lon = h3.cell_to_latlng(h3_cell)

        return self.client.search_nearby(
            lat,
            lon,
            radius=500,
            keyword=category
        )