from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError

from app.database.mongo import get_reviews_collection


def ensure_reviews_indexes():
    collection = get_reviews_collection()
    if collection is None:
        return
    collection.create_index([("username", 1), ("rawg_id", 1)], unique=True)


def _serialize_review(document):
    created_at = document.get("date_created")
    updated_at = document.get("date_updated")
    return {
        "id": str(document.get("_id")),
        "username": document.get("username"),
        "rawg_id": document.get("rawg_id"),
        "rating": document.get("rating"),
        "review_text": document.get("review_text"),
        "date_created": created_at.isoformat() if created_at else None,
        "date_updated": updated_at.isoformat() if updated_at else None,
    }


def _valid_rating(rating):
    return isinstance(rating, int) and 1 <= rating <= 10


def create_review(username, rawg_id, rating, review_text):
    collection = get_reviews_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    if not isinstance(rawg_id, int) or rawg_id <= 0:
        return {"error": "rawg_id must be a positive integer"}, 400
    if not _valid_rating(rating):
        return {"error": "rating must be an integer between 1 and 10"}, 400

    ensure_reviews_indexes()

    now = datetime.now(timezone.utc)
    payload = {
        "username": username,
        "rawg_id": rawg_id,
        "rating": rating,
        "review_text": (review_text or "").strip(),
        "date_created": now,
        "date_updated": now,
    }

    try:
        inserted = collection.insert_one(payload)
        payload["_id"] = inserted.inserted_id
        return _serialize_review(payload), 201
    except DuplicateKeyError:
        return {"error": "Review already exists for this game"}, 409


def list_reviews(username):
    collection = get_reviews_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    documents = collection.find({"username": username})
    items = [_serialize_review(document) for document in documents]
    return {"items": items}, 200


def update_review(username, review_id, rating, review_text):
    collection = get_reviews_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    if not _valid_rating(rating):
        return {"error": "rating must be an integer between 1 and 10"}, 400

    try:
        object_id = ObjectId(review_id)
    except (InvalidId, TypeError):
        return {"error": "Invalid review id"}, 400

    updated = collection.update_one(
        {"_id": object_id, "username": username},
        {
            "$set": {
                "rating": rating,
                "review_text": (review_text or "").strip(),
                "date_updated": datetime.now(timezone.utc),
            }
        },
    )

    if updated.matched_count == 0:
        return {"error": "Review not found"}, 404

    document = collection.find_one({"_id": object_id, "username": username})
    return _serialize_review(document), 200


def delete_review(username, review_id):
    collection = get_reviews_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    try:
        object_id = ObjectId(review_id)
    except (InvalidId, TypeError):
        return {"error": "Invalid review id"}, 400

    deleted = collection.delete_one({"_id": object_id, "username": username})
    if deleted.deleted_count == 0:
        return {"error": "Review not found"}, 404

    return {"message": "Review removed"}, 200
