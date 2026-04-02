from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
import clickhouse_connect
from typing import Optional
from clickhouse_connect.driver import Client

class ClickHouseWrapper:
    def __init__(self, app=None):
        self.client: Optional[Client] = None

        if app:
            self.init_app(app)
    
    def init_app(self, app):
        try:
            self.client = clickhouse_connect.get_client(
            host=app.config.get('CLICKHOUSE_HOST'),
            port=app.config['CLICKHOUSE_PORT'],
            username=app.config['CLICKHOUSE_USER'],
            password=app.config['CLICKHOUSE_PASSWORD'],
            database=app.config['CLICKHOUSE_DB']
            )

            self.client.command('SELECT 1')
            print("Успешное подключение к ClickHouse")
        except Exception as e:
            print(f"Ошибка подключения к ClickHouse: {e}")
            self.client = None


db = SQLAlchemy()
migrate = Migrate()
ch = ClickHouseWrapper()
