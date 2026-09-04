from flask import Blueprint, jsonify, request

from app.services.auth_service import authenticate_user, get_user_profile, register_user

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


def _get_credentials(payload):
    username = (payload.get("username") or "").strip()
    password = payload.get("password") or ""
    return username, password


@auth_bp.post("/register")
def register():
    payload = request.get_json(silent=True) or {}
    username, password = _get_credentials(payload)

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    success, body, status_code = register_user(username, password)
    return jsonify(body), status_code


@auth_bp.post("/login")
def login():
    payload = request.get_json(silent=True) or {}
    username, password = _get_credentials(payload)

    if not username or not password:
        return jsonify({"error": "Username and password are required"}), 400

    success, body, status_code = authenticate_user(username, password)
    return jsonify(body), status_code


@auth_bp.get("/profile")
def profile():
    username = (request.headers.get("X-Username") or request.args.get("username") or "").strip()
    if not username:
        return jsonify({"error": "Username is required"}), 400

    success, body, status_code = get_user_profile(username)
    return jsonify(body), status_code
