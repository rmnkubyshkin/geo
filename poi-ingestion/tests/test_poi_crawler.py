from app.crawler.poi_crawler import POICrawler

def test_poi_crawler_calls_api(mocker):
    crawler = POICrawler()

    mocker.patch.object(
        crawler.client,
        "search_nearby",
        return_value=[
            {"place_id": "1", "lat": 59.9, "lon": 30.3}
        ]
    )

    result = crawler.crawl_cell("891f1d48947ffff", "restaurant")

    assert isinstance(result, list)
    assert len(result) == 1
    assert result[0]["place_id"] == "1"