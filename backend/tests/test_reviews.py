from app import create_app
from tests.fake_db import FakeCollection


class TestConfig:
    TESTING = True
    FRONTEND_URL = "http://localhost:5173"


def _client_with_fake_reviews(monkeypatch):
    fake_collection = FakeCollection()

    from app.services import reviews_service

    monkeypatch.setattr(reviews_service, "get_reviews_collection", lambda: fake_collection)

    app = create_app(TestConfig)
    return app.test_client(), fake_collection


def _headers(username="alice"):
    return {"X-Username": username}


def test_reviews_create_read_update_delete(monkeypatch):
    client, _ = _client_with_fake_reviews(monkeypatch)

    create_response = client.post(
        "/api/reviews",
        json={"rawg_id": 100, "rating": 9, "review_text": "Excellent"},
        headers=_headers(),
    )
    assert create_response.status_code == 201

    list_response = client.get("/api/reviews", headers=_headers())
    assert list_response.status_code == 200
    review = list_response.get_json()["items"][0]

    update_response = client.put(
        f"/api/reviews/{review['id']}",
        json={"rating": 8, "review_text": "Great"},
        headers=_headers(),
    )
    assert update_response.status_code == 200
    assert update_response.get_json()["rating"] == 8

    delete_response = client.delete(f"/api/reviews/{review['id']}", headers=_headers())
    assert delete_response.status_code == 200


def test_reviews_invalid_rating(monkeypatch):
    client, _ = _client_with_fake_reviews(monkeypatch)

    response = client.post(
        "/api/reviews",
        json={"rawg_id": 100, "rating": 11, "review_text": "Too high"},
        headers=_headers(),
    )
    assert response.status_code == 400


def test_reviews_duplicate_prevention(monkeypatch):
    client, _ = _client_with_fake_reviews(monkeypatch)

    first = client.post(
        "/api/reviews",
        json={"rawg_id": 200, "rating": 9, "review_text": "Nice"},
        headers=_headers(),
    )
    second = client.post(
        "/api/reviews",
        json={"rawg_id": 200, "rating": 7, "review_text": "Duplicate"},
        headers=_headers(),
    )

    assert first.status_code == 201
    assert second.status_code == 409
