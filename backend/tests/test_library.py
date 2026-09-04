from app import create_app
from tests.fake_db import FakeCollection


class TestConfig:
    TESTING = True
    FRONTEND_URL = "http://localhost:5173"


def _client_with_fake_library(monkeypatch):
    fake_collection = FakeCollection()

    from app.services import library_service

    monkeypatch.setattr(library_service, "get_library_collection", lambda: fake_collection)

    app = create_app(TestConfig)
    return app.test_client(), fake_collection


def _headers(username="alice"):
    return {"X-Username": username}


def test_library_create_read_update_delete(monkeypatch):
    client, _ = _client_with_fake_library(monkeypatch)

    create_response = client.post(
        "/api/library",
        json={"rawg_id": 123, "status": "Playing", "hours_played": 4},
        headers=_headers(),
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/library", headers=_headers())
    assert list_response.status_code == 200
    item = list_response.get_json()["items"][0]
    assert item["rawg_id"] == 123

    update_response = client.put(
        f"/api/library/{item['id']}",
        json={"status": "Completed", "hours_played": 12},
        headers=_headers(),
    )
    assert update_response.status_code == 200
    assert update_response.get_json()["status"] == "Completed"

    delete_response = client.delete(f"/api/library/{item['id']}", headers=_headers())
    assert delete_response.status_code == 200


def test_library_duplicate_prevention(monkeypatch):
    client, _ = _client_with_fake_library(monkeypatch)

    first = client.post(
        "/api/library",
        json={"rawg_id": 777, "status": "Backlog", "hours_played": 0},
        headers=_headers(),
    )
    second = client.post(
        "/api/library",
        json={"rawg_id": 777, "status": "Backlog", "hours_played": 0},
        headers=_headers(),
    )

    assert first.status_code == 201
    assert second.status_code == 409


def test_library_invalid_status_returns_400(monkeypatch):
    client, _ = _client_with_fake_library(monkeypatch)

    response = client.post(
        "/api/library",
        json={"rawg_id": 123, "status": "InvalidStatus", "hours_played": 0},
        headers=_headers(),
    )
    assert response.status_code == 400


def test_library_invalid_hours_returns_400(monkeypatch):
    client, _ = _client_with_fake_library(monkeypatch)

    response = client.post(
        "/api/library",
        json={"rawg_id": 123, "status": "Playing", "hours_played": -3},
        headers=_headers(),
    )
    assert response.status_code == 400


def test_library_user_isolation(monkeypatch):
    client, _ = _client_with_fake_library(monkeypatch)

    create_response = client.post(
        "/api/library",
        json={"rawg_id": 900, "status": "Backlog", "hours_played": 0},
        headers=_headers("alice"),
    )
    item_id = create_response.get_json()["id"]

    forbidden_update = client.put(
        f"/api/library/{item_id}",
        json={"status": "Dropped", "hours_played": 1},
        headers=_headers("bob"),
    )

    forbidden_delete = client.delete(f"/api/library/{item_id}", headers=_headers("bob"))

    assert forbidden_update.status_code == 404
    assert forbidden_delete.status_code == 404
