
from app.pipelines.run_city_ingestion import CityIngestionPipeline
from app.clients.google_places_client import GooglePlacesClient

print("__name__ =", __name__)

def main():
  print("START")
  bbox = {
    "lat_min": 59.925,
    "lat_max": 59.935,
    "lon_min": 30.300,
    "lon_max": 30.320
  }

  pipeline = CityIngestionPipeline()

  pois = pipeline.run(bbox, category="restaurant")

  print(f"Loaded POIs: {pois}")
  

if __name__== "__main__":
    main()