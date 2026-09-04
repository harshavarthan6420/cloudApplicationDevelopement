import os
from pymongo import MongoClient
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "")
MONGO_DB = os.getenv("MONGO_DB", "gamevault")

if MONGO_URI:
    client = MongoClient(MONGO_URI)
    db = client[MONGO_DB]
else:
    client = None
    db = None


def get_db():
    return db


def get_users_collection():
    database = get_db()
    if database is None:
        return None
    return database["users"]


def get_library_collection():
    database = get_db()
    if database is None:
        return None
    return database["library"]


def get_wishlist_collection():
    database = get_db()
    if database is None:
        return None
    return database["wishlist"]


def get_reviews_collection():
    database = get_db()
    if database is None:
        return None
    return database["reviews"]
