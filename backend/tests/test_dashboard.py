from datetime import datetime, timezone

from app import create_app
from tests.fake_db import FakeCollection


class TestConfig:
    TESTING = True
    FRONTEND_URL = "http://localhost:5173"


def test_dashboard_stats_structure(monkeypatch):
    library = FakeCollection()
    wishlist = FakeCollection()
    reviews = FakeCollection()

    now = datetime.now(timezone.utc)

    library.insert_one(
        {
            "username": "alice",
            "rawg_id": 1,
            "status": "Playing",
            "hours_played": 5,
            "date_added": now,
        }
    )
    library.insert_one(
        {
            "username": "alice",
            "rawg_id": 2,
            "status": "Completed",
            "hours_played": 10,
            "date_added": now,
        }
    )
    wishlist.insert_one({"username": "alice", "rawg_id": 3, "date_added": now})
    reviews.insert_one(
        {
            "username": "alice",
            "rawg_id": 1,
            "rating": 9,
            "review_text": "Great",
            "date_created": now,
            "date_updated": now,
        }
    )

    from app.services import dashboard_service

    monkeypatch.setattr(dashboard_service, "get_library_collection", lambda: library)
    monkeypatch.setattr(dashboard_service, "get_wishlist_collection", lambda: wishlist)
    monkeypatch.setattr(dashboard_service, "get_reviews_collection", lambda: reviews)

    app = create_app(TestConfig)
    client = app.test_client()

    response = client.get("/api/dashboard/stats", headers={"X-Username": "alice"})
    assert response.status_code == 200

    payload = response.get_json()
    assert payload["total_games"] == 2
    assert payload["currently_playing"] == 1
    assert payload["completed_games"] == 1
    assert payload["wishlist_count"] == 1
    assert payload["review_count"] == 1
    assert payload["charts"]["games_by_status"]["Playing"] == 1
    assert payload["charts"]["rating_distribution"]["9"] == 1
