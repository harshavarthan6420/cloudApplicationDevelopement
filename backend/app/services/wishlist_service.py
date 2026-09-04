from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError

from app.database.mongo import get_wishlist_collection


def ensure_wishlist_indexes():
    collection = get_wishlist_collection()
    if collection is None:
        return
    collection.create_index([("username", 1), ("rawg_id", 1)], unique=True)


def _serialize_wishlist_item(document):
    created_at = document.get("date_added")
    return {
        "id": str(document.get("_id")),
        "username": document.get("username"),
        "rawg_id": document.get("rawg_id"),
        "date_added": created_at.isoformat() if created_at else None,
    }


def add_wishlist_item(username, rawg_id):
    collection = get_wishlist_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    if not isinstance(rawg_id, int) or rawg_id <= 0:
        return {"error": "rawg_id must be a positive integer"}, 400

    ensure_wishlist_indexes()

    payload = {
        "username": username,
        "rawg_id": rawg_id,
        "date_added": datetime.now(timezone.utc),
    }

    try:
        inserted = collection.insert_one(payload)
        payload["_id"] = inserted.inserted_id
        return _serialize_wishlist_item(payload), 201
    except DuplicateKeyError:
        return {"error": "Game already exists in your wishlist"}, 409


def list_wishlist_items(username):
    collection = get_wishlist_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    documents = collection.find({"username": username})
    items = [_serialize_wishlist_item(document) for document in documents]
    return {"items": items}, 200


def delete_wishlist_item(username, item_id):
    collection = get_wishlist_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    try:
        object_id = ObjectId(item_id)
    except (InvalidId, TypeError):
        return {"error": "Invalid wishlist item id"}, 400

    deleted = collection.delete_one({"_id": object_id, "username": username})
    if deleted.deleted_count == 0:
        return {"error": "Wishlist item not found"}, 404

    return {"message": "Wishlist item removed"}, 200
