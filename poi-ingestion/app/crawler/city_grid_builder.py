import h3
from shapely.geometry import Polygon
import h3.api.basic_int as h3_int


class CityGridBuilder:
    def build(self, bbox, resolution):
        polygon = Polygon([
            (bbox["lat_min"], bbox["lon_min"]),
            (bbox["lat_min"], bbox["lon_max"]),
            (bbox["lat_max"], bbox["lon_max"]),
            (bbox["lat_max"], bbox["lon_min"]),
        ])

        geojson = {
            "type": "Polygon",
            "coordinates": [list(polygon.exterior.coords)]
        }

        return list(h3.geo_to_cells(geojson, resolution))