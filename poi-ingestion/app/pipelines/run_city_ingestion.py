from app.crawler.city_grid_builder import CityGridBuilder
from app.crawler.poi_crawler import POICrawler
from app.transformers.poi_normalizer import POINormalizer
from app.transformers.h3_enricher import H3Enricher
from app.crawler.deduplicator import Deduplicator
from app.storage.clickhouse_writer import ClickHouseWriter
import traceback
import os


CATEGORIES = ["restaurant"]

class CityIngestionPipeline:

    def __init__(self):
        self.grid_builder = CityGridBuilder()
        self.crawler = POICrawler()
        self.normalizer = POINormalizer()
        self.enricher = H3Enricher()
        self.deduplicator = Deduplicator()
        self.ch = ClickHouseWriter(
            host=os.getenv("CLICKHOUSE_HOST"),
            port=os.getenv("CLICKHOUSE_PORT"),
            user=os.getenv("CLICKHOUSE_USER"),
            password=os.getenv("CLICKHOUSE_PASSWORD"),
            database=os.getenv("CLICKHOUSE_DB"),
        )

    def run(self, bbox, category="restaurant"):
        cells = self.grid_builder.build(bbox, resolution=9)

        print(f"Всего H3 ячеек: {len(cells)}")

        total_inserted = 0

        for i, cell in enumerate(cells):
            print(f"\n[{i+1}/{len(cells)}] Ячейка: {cell}")

            raw = self.crawler.crawl_cell(cell, category)
            print(f"  raw: {len(raw)}")

            if not raw:
                print("  → пусто, skip")
                continue

            normalized = []
            for item in raw:
                p = self.normalizer.normalize(item)
                if p:
                    normalized.append(p)

            if not normalized:
                print("  → после нормализации пусто")
                continue

            enriched = self.enricher.enrich(normalized)
            deduped = self.deduplicator.dedup(enriched)

            if not deduped:
                print("  → после дедупа пусто")
                continue
            
            try:
                self.ch.insert_pois(deduped)
                inserted = len(deduped)
                total_inserted += inserted

                print(f"Вставлено: {inserted} | total: {total_inserted}")

            except Exception as e:
                print(f"Ошибка вставки: {e}")
                traceback.print_exc()
                continue 

        print(f"\nГОТОВО. Всего вставлено: {total_inserted}")
        cells = self.grid_builder.build(bbox, resolution=7)
        print("DEBUG cells:", len(cells))
        print("SAMPLE:", cells[:5])
        return total_inserted
      