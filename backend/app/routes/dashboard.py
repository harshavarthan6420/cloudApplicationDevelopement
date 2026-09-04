from flask import Blueprint, jsonify, request

from app.services.dashboard_service import get_dashboard_stats
from app.utils.request_auth import get_authenticated_username

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api/dashboard")


@dashboard_bp.get("/stats")
def dashboard_stats():
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    payload, status_code = get_dashboard_stats(username)
    return jsonify(payload), status_code
