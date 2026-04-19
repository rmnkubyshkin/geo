
from app.pipelines.run_city_ingestion import CityIngestionPipeline
from app.clients.google_places_client import GooglePlacesClient

print("__name__ =", __name__)

def main():
  print("START")
  bbox = {
      "lat_min": 59.932,
      "lat_max": 59.948,
      "lon_min": 30.225,
      "lon_max": 30.265
  }

  pipeline = CityIngestionPipeline()

  pois = pipeline.run(bbox, category="restaurant")

  print(f"Loaded POIs: {pois}")
  

if __name__== "__main__":
    main()