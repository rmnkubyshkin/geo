from app.crawler.deduplicator import Deduplicator

def test_deduplication():
    data = [
        {"place_id": "1"},
        {"place_id": "1"},
        {"place_id": "2"}
    ]

    result = Deduplicator().dedup(data)

    assert len(result) == 2