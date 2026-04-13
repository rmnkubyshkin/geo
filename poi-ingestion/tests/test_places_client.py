from app.clients.google_places_client import GooglePlacesClient

def test_places_client_returns_data(mocker):
  client = GooglePlacesClient()

  mock_responce = [
    {
      "place_id": "1",
      "name": "Cafe Test",
      "lat": 59.9,
      "lon": 30.3
    }
  ]

  mocker.patch.object(client, "search_nearby", return_value=mock_responce)

  result = client.search_nearby(59.9, 30.3, 500)

  assert len(result) == 1
  assert result[0]["place_id"] == "1"

