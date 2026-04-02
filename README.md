# Geo Platform

## О проекте

Платформа для визуализации геоданных (здания и точки).

**Стек:**
- Backend: Flask, PostgreSQL (здания), ClickHouse (точки)
- Frontend: React, Mapbox GL, Deck.gl

## Быстрый старт

### Backend

```bash
cd back
pip install -r requirements.txt
flask run
```

### Frontend

```bash
cd front
npm install
npm start
```

### Тесты

```bash
pytest tests/ -v
```
### API

- /api/coordinates/points	GET	Получение точек (ClickHouse)  
- /api/coordinates/geo	GET	Получение зданий (PostgreSQL)

### Структура
text
back/           # Flask backend   
front/          # React frontend    
tests/          # Тесты