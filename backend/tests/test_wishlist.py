from app import create_app
from tests.fake_db import FakeCollection


class TestConfig:
    TESTING = True
    FRONTEND_URL = "http://localhost:5173"


def _client_with_fake_wishlist(monkeypatch):
    fake_collection = FakeCollection()

    from app.services import wishlist_service

    monkeypatch.setattr(wishlist_service, "get_wishlist_collection", lambda: fake_collection)

    app = create_app(TestConfig)
    return app.test_client(), fake_collection


def _headers(username="alice"):
    return {"X-Username": username}


def test_wishlist_create_read_delete(monkeypatch):
    client, _ = _client_with_fake_wishlist(monkeypatch)

    create_response = client.post("/api/wishlist", json={"rawg_id": 333}, headers=_headers())
    assert create_response.status_code == 201

    list_response = client.get("/api/wishlist", headers=_headers())
    assert list_response.status_code == 200
    item_id = list_response.get_json()["items"][0]["id"]

    delete_response = client.delete(f"/api/wishlist/{item_id}", headers=_headers())
    assert delete_response.status_code == 200


def test_wishlist_duplicate_prevention(monkeypatch):
    client, _ = _client_with_fake_wishlist(monkeypatch)

    first = client.post("/api/wishlist", json={"rawg_id": 555}, headers=_headers())
    second = client.post("/api/wishlist", json={"rawg_id": 555}, headers=_headers())

    assert first.status_code == 201
    assert second.status_code == 409
