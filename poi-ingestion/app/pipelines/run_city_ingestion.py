from app.crawler.deduplicator import Deduplicator
from app.crawler.city_grid_builder import CityGridBuilder
from app.crawler.poi_crawler import POICrawler

CATEGORIES = ["restaurant"]

class CityIngestionPipeline:
  def run(self, bbox):
    grid = CityGridBuilder().build(bbox, resolution=7)

    all_pois = []

    crawler = POICrawler()

    for cell in grid:
      for category in CATEGORIES:
          pois = crawler.crawl_cell(cell, category)
          all_pois.extend(pois)
    result = Deduplicator().dedup(all_pois)

    return result