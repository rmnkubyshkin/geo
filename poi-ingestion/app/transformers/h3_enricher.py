import h3

class H3Enricher:
  def __init__(self, resolution=7):
    self.resolution = resolution

  def enrich(self, pois):
    for poi in pois:
      poi["h3_index"] = h3.latlng_to_cell(
        poi["latitude"],
        poi["longitude"],
        self.resolution
      )
    return pois