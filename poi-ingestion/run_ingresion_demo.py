
from app.pipelines.run_city_ingestion import CityIngestionPipeline
from app.clients.google_places_client import GooglePlacesClient

print("__name__ =", __name__)

def main():
  print("START")
  bbox = {
        "lat_min": 59.8,
        "lat_max": 60.0,
        "lon_min": 30.1,
        "lon_max": 30.5
  }

  pipeline = CityIngestionPipeline()

  pois = pipeline.run(bbox, category="restaurant")

  print(f"Loaded POIs: {len(pois)}")
  print(pois[:5])

if __name__== "__main__":
    main()