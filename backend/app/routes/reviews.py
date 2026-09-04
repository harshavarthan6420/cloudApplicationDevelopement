from flask import Blueprint, jsonify, request

from app.services.reviews_service import (
    create_review,
    delete_review,
    list_reviews,
    update_review,
)
from app.utils.request_auth import get_authenticated_username

reviews_bp = Blueprint("reviews", __name__, url_prefix="/api/reviews")


@reviews_bp.get("")
def get_reviews():
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    payload, status_code = list_reviews(username)
    return jsonify(payload), status_code


@reviews_bp.post("")
def create_review_route():
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    payload = request.get_json(silent=True) or {}
    rawg_id = payload.get("rawg_id")
    rating = payload.get("rating")
    review_text = payload.get("review_text")

    if rating is None:
        return jsonify({"error": "rating is required"}), 400

    response, status_code = create_review(username, rawg_id, rating, review_text)
    return jsonify(response), status_code


@reviews_bp.put("/<review_id>")
def update_review_route(review_id):
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    payload = request.get_json(silent=True) or {}
    rating = payload.get("rating")
    review_text = payload.get("review_text")

    if rating is None:
        return jsonify({"error": "rating is required"}), 400

    response, status_code = update_review(username, review_id, rating, review_text)
    return jsonify(response), status_code


@reviews_bp.delete("/<review_id>")
def delete_review_route(review_id):
    username, auth_error = get_authenticated_username(request)
    if auth_error:
        payload, code = auth_error
        return jsonify(payload), code

    response, status_code = delete_review(username, review_id)
    return jsonify(response), status_code
