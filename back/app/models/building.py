"""SQLAlchemy model for a building polygon."""

import json
from datetime import datetime, timezone
from sqlalchemy.dialects.postgresql import JSONB
from geoalchemy2 import Geometry
from geoalchemy2.shape import to_shape
from ..extensions import db


class Building(db.Model):
    __tablename__ = "buildings"

    id = db.Column(db.Integer, primary_key=True)
    external_id = db.Column(db.String(128), nullable=True, index=True)
    name = db.Column(db.String(255), nullable=True)  # building_name
    building_type = db.Column(db.String(100), nullable=True)
    height_agl = db.Column(db.Float, nullable=True)  # height
    geom = db.Column(Geometry(geometry_type='GEOMETRY', srid=4326), nullable=False)
    attributes_json = db.Column(JSONB, nullable=True)
    data_source = db.Column(db.String(100), nullable=True)
    
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc), nullable=False)
    updated_at = db.Column(
        db.DateTime, default=datetime.now(timezone.utc), onupdate=datetime.now(timezone.utc), nullable=False
    )

    
    def __init__(self, **kwargs):
            super(Building, self).__init__(**kwargs)
            
    def to_dict(self) -> dict:
        geometry = None
        if self.geom:
            geometry = to_shape(self.geom).__geo_interface__

        return {
            "id": self.id,
            "geometry": geometry,
            "height": self.height_agl,
            "building_name": self.name,
            "building_type": self.building_type,
            "attributes": self.attributes_json,
            "external_id": self.external_id,
            "data_source": self.data_source,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
        }

