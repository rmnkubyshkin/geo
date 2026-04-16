import h3
from shapely.geometry import Polygon
import h3.api.basic_int as h3_int
from h3 import LatLngPoly

class CityGridBuilder:
    def build(self, bbox, resolution):
        polygon = LatLngPoly([
            (bbox["lat_min"], bbox["lon_min"]),
            (bbox["lat_min"], bbox["lon_max"]),
            (bbox["lat_max"], bbox["lon_max"]),
            (bbox["lat_max"], bbox["lon_min"]),
        ])

        cells = h3.polygon_to_cells(polygon, resolution)

        return list(cells)