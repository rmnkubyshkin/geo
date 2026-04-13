from app.pipelines.run_city_ingestion import CityIngestionPipeline

def test_pipeline_runs(mocker):
    pipeline = CityIngestionPipeline()

    mocker.patch(
        "app.crawler.city_grid_builder.CityGridBuilder.build",
        return_value=[111, 222]
    )

    mocker.patch(
        "app.crawler.poi_crawler.POICrawler.crawl_cell",
        return_value=[
            {"place_id": "1", "lat": 59.9, "lon": 30.3}
        ]
    )

    result = pipeline.run({
        "lat_min": 59.8,
        "lat_max": 60.0,
        "lon_min": 30.1,
        "lon_max": 30.5
    })

    assert isinstance(result, list)
    assert len(result) > 0