from app.crawler.city_grid_builder import CityGridBuilder

def test_h3_grid_generation():
    bbox = {
        "lat_min": 59.8,
        "lat_max": 60.0,
        "lon_min": 30.1,
        "lon_max": 30.5
    }

    grid = CityGridBuilder().build(bbox, resolution=7)

    assert isinstance(grid, list)
    assert len(grid) > 0
    assert all(isinstance(cell, str) for cell in grid)