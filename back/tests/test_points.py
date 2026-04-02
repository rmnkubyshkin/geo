import pytest
from unittest.mock import MagicMock, patch

from app import create_app
from app.config import BaseConfig


class TestConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:admin@localhost:5432/geo_test"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    LOAD_RAW_DATA_ON_STARTUP = False


@pytest.fixture
def client():
    """Фикстура клиента - не трогаем PostgreSQL"""
    app = create_app(TestConfig)
    return app.test_client()


def test_points_endpoint_success(client):
    """Тест: Успешное получение точек из ClickHouse"""
    with patch('app.extensions.ch.client') as mock_ch:
        # Мокаем ответ ClickHouse
        mock_result = MagicMock()
        mock_result.result_rows = [
            [30.306923, 59.933907, 45.0],  # longitude, latitude, altitude
            [30.305614, 59.9344, 34.0]
        ]
        mock_ch.query.return_value = mock_result
        
        response = client.get("/api/coordinates/points")
        
        assert response.status_code == 200
        data = response.get_json()
        assert len(data) == 2
        assert data[0]["longitude"] == 30.306923
        assert data[0]["latitude"] == 59.933907
        assert data[0]["altitude"] == 45.0
        assert data[1]["longitude"] == 30.305614
        assert data[1]["latitude"] == 59.9344
        assert data[1]["altitude"] == 34.0


def test_points_endpoint_empty(client):
    """Тест: Пустой результат от ClickHouse"""
    with patch('app.extensions.ch.client') as mock_ch:
        mock_result = MagicMock()
        mock_result.result_rows = []
        mock_ch.query.return_value = mock_result
        
        response = client.get("/api/coordinates/points")
        
        assert response.status_code == 200
        data = response.get_json()
        assert data == []


def test_points_endpoint_clickhouse_error(client):
    """Тест: Ошибка подключения к ClickHouse"""
    with patch('app.extensions.ch.client') as mock_ch:
        mock_ch.query.side_effect = Exception("ClickHouse connection failed")
        
        response = client.get("/api/coordinates/points")
        
        assert response.status_code == 500
        data = response.get_json()
        assert "error" in data


def test_points_endpoint_null_altitude(client):
    """Тест: Обработка NULL значения altitude"""
    with patch('app.extensions.ch.client') as mock_ch:
        mock_result = MagicMock()
        mock_result.result_rows = [
            [30.0, 59.0, None]  # altitude = None
        ]
        mock_ch.query.return_value = mock_result
        
        response = client.get("/api/coordinates/points")
        data = response.get_json()
        
        assert len(data) == 1
        assert data[0]["altitude"] == 0  # None должен стать 0


def test_points_endpoint_data_types(client):
    """Тест: Проверка типов данных"""
    with patch('app.extensions.ch.client') as mock_ch:
        mock_result = MagicMock()
        mock_result.result_rows = [
            [30.5, 59.5, 10.5]
        ]
        mock_ch.query.return_value = mock_result
        
        response = client.get("/api/coordinates/points")
        data = response.get_json()[0]
        
        assert isinstance(data["longitude"], float)
        assert isinstance(data["latitude"], float)
        assert isinstance(data["altitude"], float)