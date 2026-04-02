import pytest
from geoalchemy2.shape import from_shape
from shapely.geometry import Polygon

from app import create_app
from app.config import BaseConfig
from app.extensions import db
from app.models import Building


class TestConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:admin@localhost:5432/geo_test"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    LOAD_RAW_DATA_ON_STARTUP = False


@pytest.fixture
def client():
    """Фикстура клиента с очисткой таблицы buildings"""
    app = create_app(TestConfig)
    
    with app.app_context():
        db.session.query(Building).delete()
        db.session.commit()
        
        with app.test_client() as client:
            yield client
        
        db.session.query(Building).delete()
        db.session.commit()


def create_test_building(external_id, name, height, lon, lat):
    polygon = Polygon([
        [lon, lat],
        [lon + 0.001, lat],
        [lon + 0.001, lat + 0.001],
        [lon, lat + 0.001],
        [lon, lat]
    ])
    
    return Building(
        external_id=external_id,
        name=name,
        building_type="commercial",
        height_agl=height,
        geom=from_shape(polygon, srid=4326),
        attributes_json={"test": True},
        data_source="test"
    )


def test_geo_endpoint_success(client):
    with client.application.app_context():
        building = create_test_building(
            external_id="test_001",
            name="Test Building 1",
            height=25.5,
            lon=30.306923,
            lat=59.933907
        )
        db.session.add(building)
        db.session.commit()
    
    response = client.get("/api/coordinates/geo")
    
    assert response.status_code == 200
    data = response.get_json()
    
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 1
    
    feature = data["features"][0]
    assert feature["type"] == "Feature"
    assert feature["geometry"]["type"] == "Polygon"
    
    assert feature["properties"]["external_id"] == "test_001"
    assert feature["properties"]["height"] == 25.5
    assert feature["properties"]["Address_street"] == "Test Building 1"


def test_geo_endpoint_multiple_buildings(client):
    """Тест 2: Несколько зданий в базе"""
    with client.application.app_context():
        buildings = [
            create_test_building("test_001", "Building A", 10.0, 30.3069, 59.9339),
            create_test_building("test_002", "Building B", 20.0, 30.3070, 59.9340),
            create_test_building("test_003", "Building C", 30.0, 30.3071, 59.9341)
        ]
        db.session.add_all(buildings)
        db.session.commit()
    
    response = client.get("/api/coordinates/geo")
    data = response.get_json()
    
    assert len(data["features"]) == 3
    
    external_ids = [f["properties"]["external_id"] for f in data["features"]]
    assert "test_001" in external_ids
    assert "test_002" in external_ids
    assert "test_003" in external_ids
    
    heights = {f["properties"]["external_id"]: f["properties"]["height"] 
               for f in data["features"]}
    assert heights["test_001"] == 10.0
    assert heights["test_002"] == 20.0
    assert heights["test_003"] == 30.0


def test_geo_endpoint_empty(client):
    """Тест 3: Пустая база данных (нет зданий)"""
    response = client.get("/api/coordinates/geo")
    
    assert response.status_code == 200
    data = response.get_json()
    assert data["type"] == "FeatureCollection"
    assert len(data["features"]) == 0


def test_geo_endpoint_properties_format(client):
    """Тест 4: Проверка формата свойств здания"""
    with client.application.app_context():
        building = create_test_building(
            external_id="test_prop_001",
            name="Property Test",
            height=15.5,
            lon=30.3000,
            lat=59.9400
        )
        db.session.add(building)
        db.session.commit()
    
    response = client.get("/api/coordinates/geo")
    data = response.get_json()
    
    feature = data["features"][0]
    properties = feature["properties"]
    
    assert "height" in properties
    assert "external_id" in properties
    assert "Address_street" in properties
    
    assert properties["height"] == 15.5
    assert properties["external_id"] == "test_prop_001"
    assert properties["Address_street"] == "Property Test"


def test_geo_endpoint_geometry_valid(client):
    """Тест 5: Проверка валидности геометрии"""
    with client.application.app_context():
        building = create_test_building(
            external_id="test_geom",
            name="Geometry Test",
            height=10.0,
            lon=30.306923,
            lat=59.933907
        )
        db.session.add(building)
        db.session.commit()
    
    response = client.get("/api/coordinates/geo")
    data = response.get_json()
    
    feature = data["features"][0]
    geometry = feature["geometry"]
    
    assert geometry["type"] == "Polygon"
    assert "coordinates" in geometry
    assert len(geometry["coordinates"]) == 1 
    assert len(geometry["coordinates"][0]) >= 4 
    
    coords = geometry["coordinates"][0]
    assert coords[0] == coords[-1]


def test_geo_endpoint_different_heights(client):
    """Тест 6: Здания с разной высотой"""
    with client.application.app_context():
        buildings = [
            create_test_building("low", "Low Building", 5.0, 30.3069, 59.9339),
            create_test_building("medium", "Medium Building", 25.0, 30.3070, 59.9340),
            create_test_building("high", "High Building", 50.0, 30.3071, 59.9341)
        ]
        db.session.add_all(buildings)
        db.session.commit()
    
    response = client.get("/api/coordinates/geo")
    data = response.get_json()
    
    heights = {f["properties"]["external_id"]: f["properties"]["height"] 
               for f in data["features"]}
    
    assert heights["low"] == 5.0
    assert heights["medium"] == 25.0
    assert heights["high"] == 50.0


def test_geo_endpoint_no_duplicates(client):
    """Тест 7: Проверка отсутствия дубликатов"""
    with client.application.app_context():
        building = create_test_building(
            external_id="unique_001",
            name="Unique Building",
            height=10.0,
            lon=30.3069,
            lat=59.9339
        )
        db.session.add(building)
        db.session.commit()
    
    response = client.get("/api/coordinates/geo")
    data = response.get_json()
    
    external_ids = [f["properties"]["external_id"] for f in data["features"]]
    assert len(external_ids) == len(set(external_ids))  


def test_geo_endpoint_response_time(client):
    import time
    
    with client.application.app_context():
        buildings = []
        for i in range(10):
            building = create_test_building(
                external_id=f"perf_test_{i}",
                name=f"Performance Building {i}",
                height=float(i * 10),
                lon=30.3069 + i * 0.0001,
                lat=59.9339 + i * 0.0001
            )
            buildings.append(building)
        db.session.add_all(buildings)
        db.session.commit()
    
    start_time = time.time()
    response = client.get("/api/coordinates/geo")
    end_time = time.time()
    
    assert response.status_code == 200
    assert (end_time - start_time) < 2.0 


def test_geo_endpoint_large_buildings(client):
    """Тест 9: Здания с большими координатами"""
    with client.application.app_context():
        building = create_test_building(
            external_id="large_001",
            name="Large Building",
            height=100.0,
            lon=180.0,
            lat=90.0    
        )
        db.session.add(building)
        db.session.commit()
    
    response = client.get("/api/coordinates/geo")
    data = response.get_json()
    
    assert response.status_code == 200
    feature = data["features"][0]
    assert feature["properties"]["height"] == 100.0