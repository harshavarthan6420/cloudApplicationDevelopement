from datetime import datetime, timezone

from app import create_app


class FakeInsertResult:
    inserted_id = "fake-id"


class FakeUsersCollection:
    def __init__(self):
        self.documents = {}
        self.unique_username = False

    def create_index(self, field, unique=False):
        if field == "username" and unique:
            self.unique_username = True

    def insert_one(self, document):
        username = document["username"]
        if self.unique_username and username in self.documents:
            from pymongo.errors import DuplicateKeyError

            raise DuplicateKeyError("duplicate username")
        self.documents[username] = document
        return FakeInsertResult()

    def find_one(self, query):
        username = query.get("username")
        return self.documents.get(username)


class TestConfig:
    TESTING = True
    FRONTEND_URL = "http://localhost:5173"



def _create_client(monkeypatch):
    fake_users = FakeUsersCollection()

    from app.services import auth_service

    monkeypatch.setattr(auth_service, "get_users_collection", lambda: fake_users)

    app = create_app(TestConfig)
    return app.test_client(), fake_users


def test_register_valid_returns_201(monkeypatch):
    client, _ = _create_client(monkeypatch)

    response = client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "secret123"},
    )

    assert response.status_code == 201
    assert response.get_json() == {"message": "User registered successfully"}


def test_register_missing_username_returns_400(monkeypatch):
    client, _ = _create_client(monkeypatch)

    response = client.post(
        "/api/auth/register",
        json={"password": "secret123"},
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "Username and password are required"}


def test_register_missing_password_returns_400(monkeypatch):
    client, _ = _create_client(monkeypatch)

    response = client.post(
        "/api/auth/register",
        json={"username": "alice"},
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "Username and password are required"}


def test_register_duplicate_username_returns_409(monkeypatch):
    client, _ = _create_client(monkeypatch)

    first = client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "secret123"},
    )
    second = client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "different-password"},
    )

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.get_json() == {"error": "Username already exists"}


def test_register_stores_hashed_password(monkeypatch):
    client, users = _create_client(monkeypatch)

    response = client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "secret123"},
    )

    assert response.status_code == 201
    stored_user = users.find_one({"username": "alice"})
    assert stored_user is not None
    assert stored_user["password_hash"] != "secret123"
    assert stored_user["password_hash"].startswith("scrypt:")
    assert isinstance(stored_user["created_at"], datetime)
    assert stored_user["created_at"].tzinfo == timezone.utc


def test_login_correct_credentials_returns_200(monkeypatch):
    client, _ = _create_client(monkeypatch)

    client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "secret123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "alice", "password": "secret123"},
    )

    assert response.status_code == 200
    assert response.get_json() == {"message": "Login successful", "username": "alice"}


def test_login_incorrect_password_returns_401(monkeypatch):
    client, _ = _create_client(monkeypatch)

    client.post(
        "/api/auth/register",
        json={"username": "alice", "password": "secret123"},
    )
    response = client.post(
        "/api/auth/login",
        json={"username": "alice", "password": "wrong-password"},
    )

    assert response.status_code == 401
    assert response.get_json() == {"error": "Invalid username or password"}


def test_login_unknown_username_returns_401(monkeypatch):
    client, _ = _create_client(monkeypatch)

    response = client.post(
        "/api/auth/login",
        json={"username": "nobody", "password": "secret123"},
    )

    assert response.status_code == 401
    assert response.get_json() == {"error": "Invalid username or password"}


def test_login_missing_credentials_returns_400(monkeypatch):
    client, _ = _create_client(monkeypatch)

    response = client.post(
        "/api/auth/login",
        json={"username": "alice"},
    )

    assert response.status_code == 400
    assert response.get_json() == {"error": "Username and password are required"}
