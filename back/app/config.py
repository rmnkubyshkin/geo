import os

class BaseConfig:
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get("DATABASE_URL", "postgresql://postgres:admin@localhost:5432/geo_db")
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    CLICKHOUSE_HOST = os.environ.get('CLICKHOUSE_HOST', '127.0.0.1')
    CLICKHOUSE_PORT = int(os.environ.get('CLICKHOUSE_PORT', 8123))
    CLICKHOUSE_USER = os.environ.get('CLICKHOUSE_USER', 'default')
    CLICKHOUSE_PASSWORD = os.environ.get('CLICKHOUSE_PASSWORD', '12345')
    CLICKHOUSE_DB = os.environ.get('CLICKHOUSE_DB', 'default')
    LOAD_RAW_DATA_ON_STARTUP = os.environ.get("LOAD_RAW_DATA", "True") == "True"

class DevelopmentConfig(BaseConfig):
    DEBUG = True

class ProductionConfig(BaseConfig):
    DEBUG = False

