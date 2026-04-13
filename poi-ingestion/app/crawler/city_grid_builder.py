import h3

class CityGridBuilder:
    def build (self, bbox, resolution): # быстрое mvp
        cells = set()

        lat = bbox["lat_min"]
        while lat <= bbox["lat_min"]:
          lon = bbox["lon_min"]
          while lon <= bbox["lon_max"]:
            cell = h3.latlng_to_cell(lat, lon, resolution)
            cells.add(cell)
            lon += 0.05
          lat+=0.05
        return list(cells)
        