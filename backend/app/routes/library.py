from flask import Blueprint, jsonify, request

from app.services.library_service import (
    add_library_item,
    delete_library_item,
    list_library_items,
    update_library_item,
)
from app.utils.request_auth import get_authenticated_username

library_bp = Blueprint("library", __name__, url_prefix="/api/library")


@library_bp.get("")
def list_library():
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    payload, status_code = list_library_items(username)
    return jsonify(payload), status_code


@library_bp.post("")
def create_library_item():
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    payload = request.get_json(silent=True) or {}
    rawg_id = payload.get("rawg_id")
    status = payload.get("status") or "Backlog"
    hours_played = payload.get("hours_played", 0)

    response, status_code = add_library_item(username, rawg_id, status, hours_played)
    return jsonify(response), status_code


@library_bp.put("/<item_id>")
def update_library(item_id):
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    payload = request.get_json(silent=True) or {}
    status = payload.get("status")
    hours_played = payload.get("hours_played")

    if status is None or hours_played is None:
        return jsonify({"error": "status and hours_played are required"}), 400

    response, status_code = update_library_item(username, item_id, status, hours_played)
    return jsonify(response), status_code


@library_bp.delete("/<item_id>")
def delete_library(item_id):
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    response, status_code = delete_library_item(username, item_id)
    return jsonify(response), status_code
