from app import create_app
from app.services.rawg_service import RawgServiceError


class TestConfig:
    TESTING = True
    FRONTEND_URL = "http://localhost:5173"


def test_rawg_search_success(monkeypatch):
    app = create_app(TestConfig)
    client = app.test_client()

    def fake_search_games(query):
        assert query == "zelda"
        return [{"rawg_id": 1, "name": "The Legend of Zelda"}]

    from app.routes import games

    monkeypatch.setattr(games, "search_games", fake_search_games)

    response = client.get("/api/games/search?query=zelda")
    assert response.status_code == 200
    assert response.get_json()["items"][0]["name"] == "The Legend of Zelda"


def test_rawg_search_empty_query_returns_400():
    app = create_app(TestConfig)
    client = app.test_client()

    response = client.get("/api/games/search")
    assert response.status_code == 400
    assert response.get_json() == {"error": "query is required"}


def test_rawg_search_failure_returns_502(monkeypatch):
    app = create_app(TestConfig)
    client = app.test_client()

    from app.routes import games

    def fake_search_games(_query):
        raise RawgServiceError("RAWG request failed", 502)

    monkeypatch.setattr(games, "search_games", fake_search_games)

    response = client.get("/api/games/search?query=test")
    assert response.status_code == 502
    assert response.get_json() == {"error": "RAWG request failed"}


def test_rawg_game_details_success(monkeypatch):
    app = create_app(TestConfig)
    client = app.test_client()

    from app.routes import games

    monkeypatch.setattr(
        games,
        "get_game_details",
        lambda rawg_id: {"rawg_id": rawg_id, "name": "Elden Ring"},
    )

    response = client.get("/api/games/3498")
    assert response.status_code == 200
    assert response.get_json() == {"rawg_id": 3498, "name": "Elden Ring"}
