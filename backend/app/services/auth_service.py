from datetime import datetime, timezone

from pymongo.errors import DuplicateKeyError
from werkzeug.security import check_password_hash, generate_password_hash

from app.database.mongo import get_users_collection


def ensure_user_indexes():
    users = get_users_collection()
    if users is None:
        return
    users.create_index("username", unique=True)


def register_user(username, password):
    users = get_users_collection()
    if users is None:
        return False, {"error": "Database is not configured"}, 500

    ensure_user_indexes()

    document = {
        "username": username,
        "password_hash": generate_password_hash(password),
        "created_at": datetime.now(timezone.utc),
    }

    try:
        users.insert_one(document)
        return True, {"message": "User registered successfully"}, 201
    except DuplicateKeyError:
        return False, {"error": "Username already exists"}, 409


def authenticate_user(username, password):
    users = get_users_collection()
    if users is None:
        return False, {"error": "Database is not configured"}, 500

    user = users.find_one({"username": username})
    if not user or not check_password_hash(user.get("password_hash", ""), password):
        return False, {"error": "Invalid username or password"}, 401

    return True, {"message": "Login successful", "username": username}, 200


def get_user_profile(username):
    users = get_users_collection()
    if users is None:
        return False, {"error": "Database is not configured"}, 500

    user = users.find_one({"username": username})
    if not user:
        return False, {"error": "User not found"}, 404

    created_at = user.get("created_at")
    created_at_iso = created_at.isoformat() if created_at else None

    return (
        True,
        {
            "username": user.get("username"),
            "created_at": created_at_iso,
        },
        200,
    )
