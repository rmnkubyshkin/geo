from app.crawler.city_grid_builder import CityGridBuilder
from app.crawler.poi_crawler import POICrawler
from app.transformers.poi_normalizer import POINormalizer
from app.transformers.h3_enricher import H3Enricher
from app.crawler.deduplicator import Deduplicator

CATEGORIES = ["restaurant"]

class CityIngestionPipeline:

  def __init__(self):
     self.grid_builder = CityGridBuilder()
     self.crawler = POICrawler()
     self.normalizer = POINormalizer()
     self.enricher = H3Enricher()
     self.deduplicator = Deduplicator()
  
  def run(self, bbox, category="restaurant"):
    cells = self.grid_builder.build(bbox, resolution=7)

    print(f"Всего H3 ячеек: {len(cells)}")

    all_pois = []

    for i, cell in enumerate(cells):
        print(f"[{i+1}/{len(cells)}] Обработка ячейки: {cell}")

        raw = self.crawler.crawl_cell(cell, category)
        print(f"  → найдено raw: {len(raw)}")

        normalized = self.normalizer.normalize(raw)
        all_pois.extend(normalized)

    print("Нормализация завершена")

    enriched = self.enricher.enrich(all_pois)
    print("H3 enrichment завершён")

    deduped = self.deduplicator.deduplicate(enriched)
    print(f"После дедупликации: {len(deduped)}")

    return deduped