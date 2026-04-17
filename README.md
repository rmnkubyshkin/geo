# 🌍 Geo Intelligence Platform

![Status](https://img.shields.io/badge/status-active_development-orange)
![Python](https://img.shields.io/badge/python-3.11+-blue)
![Backend](https://img.shields.io/badge/backend-Flask-lightgrey)
![Database](https://img.shields.io/badge/database-ClickHouse-yellow)
![Frontend](https://img.shields.io/badge/frontend-React-61dafb)
![License](https://img.shields.io/badge/license-MIT-green)

---

## 📌 Overview

**Geo Intelligence Platform** is a modular system for collecting, processing, and visualizing geospatial Points of Interest (POI), such as restaurants, cafés, and urban businesses.

The platform is designed for:
- spatial analytics of urban environments
- POI density analysis
- heatmap generation
- geo-data-driven insights

---

## 🧱 System Architecture

```text
Google Places API
        │
        ▼
Ingestion Service (H3 Grid Crawler)
        │
        ▼
ClickHouse (POI Analytics Storage)
        │
        ▼
Backend API (Flask)
        │
        ▼
Frontend (React + Mapbox GL)
```

---

## ⚙️ Tech Stack
### Backend
- Flask
- ClickHouse
- PostgreSQL (optional for geometry data)
- H3 (hexagonal spatial indexing)

### Ingestion Service
- Google Places API
- H3 grid traversal
- Deduplication layer
- Data enrichment pipeline

### Frontend
- React
- Mapbox GL
- Deck.gl (heatmaps & visualization layers)


 ## 🚀 Quick Start
 ### 📦 Backend
 ```
 cd back
pip install -r requirements.txt
flask run
```

## Frontend
```
cd front
npm install
npm start
```

### 🛰 Ingestion Service
```
cd poi-ingestion
python run_ingestion_demo.py
```


## 🧪 Tests

```
pytest tests/ -v
```

## 🧩 Key Features
- 📍 Google Places ingestion pipeline
- 🧱 H3-based spatial indexing
- 🔁 Deduplication engine
- 📊 ClickHouse analytics storage
- 🗺 Map visualization (heatmaps, clusters)
- ⚡ Scalable ingestion architecture

## 📡 API Endpoints
### 📍 Points of Interest (ClickHouse)
| Method | Endpoint                  | Description         |
| ------ | ------------------------- | ------------------- |
| GET    | `/api/coordinates/points` | Retrieve POI points |


### 🏢 Geo Data (PostgreSQL)
| Method | Endpoint                  | Description         |
| ------ | ------------------------- | ------------------- |
| GET    | `/api/coordinates/points` | Retrieve POI points |


## 📂 Project Structure
```
geo-platform/
│
├── back/               # Backend API (Flask)
├── front/              # Frontend (React)
├── poi-ingestion/      # Data ingestion service (crawler)
│
└── README.md
```