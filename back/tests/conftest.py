import pytest
from app import create_app
from app.config import BaseConfig
from app.extensions import db

class TestConfig(BaseConfig):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "postgresql://postgres:admin@localhost:5432/geo_test"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    LOAD_RAW_DATA_ON_STARTUP = False

@pytest.fixture(scope='session')
def app():
    """Создание тестового приложения"""
    test_app = create_app(TestConfig)
    
    with test_app.app_context():
        db.create_all()
        yield test_app
        db.drop_all()

@pytest.fixture
def client(app):
    """Тестовый клиент"""
    return app.test_client()

@pytest.fixture
def runner(app):
    """CLI runner"""
    return app.test_cli_runner()

def _create_app_with_data(config_class=TestConfig):
    app = create_app(config_class)
    return app