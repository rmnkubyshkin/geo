
from flask import Flask
from flask_cors import CORS

from .config import DevelopmentConfig
from .extensions import db, migrate
from .routes import bp as routes_bp
from .scripts.load_raw_data import load_raw_data_if_needed, reload_points_data
from app.extensions import db, ch

def create_app(config_object: type = DevelopmentConfig) -> Flask:
    app = Flask(__name__)
    app.config.from_object(config_object)
    #reload_points_data()
    db.init_app(app)
    ch.init_app(app)
    migrate.init_app(app, db)
    CORS(app)

    with app.app_context():
        db.create_all()

    app.register_blueprint(routes_bp)

    if app.config.get("LOAD_RAW_DATA_ON_STARTUP", True):
        load_raw_data_if_needed(app)

    return app

