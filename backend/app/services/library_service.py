from datetime import datetime, timezone

from bson import ObjectId
from bson.errors import InvalidId
from pymongo.errors import DuplicateKeyError

from app.database.mongo import get_library_collection

VALID_STATUSES = {"Backlog", "Playing", "Completed", "Dropped"}


def ensure_library_indexes():
    collection = get_library_collection()
    if collection is None:
        return
    collection.create_index([("username", 1), ("rawg_id", 1)], unique=True)


def _serialize_library_item(document):
    created_at = document.get("date_added")
    return {
        "id": str(document.get("_id")),
        "username": document.get("username"),
        "rawg_id": document.get("rawg_id"),
        "status": document.get("status"),
        "hours_played": document.get("hours_played"),
        "date_added": created_at.isoformat() if created_at else None,
    }


def _validate_status(status):
    if status not in VALID_STATUSES:
        return False
    return True


def _validate_hours(hours_played):
    if not isinstance(hours_played, (int, float)):
        return False
    if hours_played < 0:
        return False
    return True


def add_library_item(username, rawg_id, status, hours_played):
    collection = get_library_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    if not isinstance(rawg_id, int) or rawg_id <= 0:
        return {"error": "rawg_id must be a positive integer"}, 400
    if not _validate_status(status):
        return {"error": "Invalid status value"}, 400
    if not _validate_hours(hours_played):
        return {"error": "hours_played must be a non-negative number"}, 400

    ensure_library_indexes()

    payload = {
        "username": username,
        "rawg_id": rawg_id,
        "status": status,
        "hours_played": hours_played,
        "date_added": datetime.now(timezone.utc),
    }

    try:
        inserted = collection.insert_one(payload)
        payload["_id"] = inserted.inserted_id
        return _serialize_library_item(payload), 201
    except DuplicateKeyError:
        return {"error": "Game already exists in your library"}, 409


def list_library_items(username):
    collection = get_library_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    documents = collection.find({"username": username})
    items = [_serialize_library_item(document) for document in documents]
    return {"items": items}, 200


def update_library_item(username, item_id, status, hours_played):
    collection = get_library_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    if not _validate_status(status):
        return {"error": "Invalid status value"}, 400
    if not _validate_hours(hours_played):
        return {"error": "hours_played must be a non-negative number"}, 400

    try:
        object_id = ObjectId(item_id)
    except (InvalidId, TypeError):
        return {"error": "Invalid library item id"}, 400

    updated = collection.update_one(
        {"_id": object_id, "username": username},
        {"$set": {"status": status, "hours_played": hours_played}},
    )

    if updated.matched_count == 0:
        return {"error": "Library item not found"}, 404

    document = collection.find_one({"_id": object_id, "username": username})
    return _serialize_library_item(document), 200


def delete_library_item(username, item_id):
    collection = get_library_collection()
    if collection is None:
        return {"error": "Database is not configured"}, 500

    try:
        object_id = ObjectId(item_id)
    except (InvalidId, TypeError):
        return {"error": "Invalid library item id"}, 400

    deleted = collection.delete_one({"_id": object_id, "username": username})
    if deleted.deleted_count == 0:
        return {"error": "Library item not found"}, 404

    return {"message": "Library item removed"}, 200
