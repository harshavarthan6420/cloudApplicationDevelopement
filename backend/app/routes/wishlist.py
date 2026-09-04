from flask import Blueprint, jsonify, request

from app.services.wishlist_service import (
    add_wishlist_item,
    delete_wishlist_item,
    list_wishlist_items,
)
from app.utils.request_auth import get_authenticated_username

wishlist_bp = Blueprint("wishlist", __name__, url_prefix="/api/wishlist")


@wishlist_bp.get("")
def list_wishlist():
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    payload, status_code = list_wishlist_items(username)
    return jsonify(payload), status_code


@wishlist_bp.post("")
def create_wishlist_item():
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    payload = request.get_json(silent=True) or {}
    rawg_id = payload.get("rawg_id")

    response, status_code = add_wishlist_item(username, rawg_id)
    return jsonify(response), status_code


@wishlist_bp.delete("/<item_id>")
def delete_wishlist(item_id):
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    response, status_code = delete_wishlist_item(username, item_id)
    return jsonify(response), status_code
