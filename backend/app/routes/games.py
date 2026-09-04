from flask import Blueprint, jsonify, request

from app.services.rawg_service import RawgServiceError, get_game_details, search_games

games_bp = Blueprint("games", __name__, url_prefix="/api/games")


@games_bp.get("/search")
def search():
    query = (request.args.get("query") or "").strip()
    if not query:
        return jsonify({"error": "query is required"}), 400

    try:
        items = search_games(query)
        return jsonify({"items": items}), 200
    except RawgServiceError as service_error:
        return jsonify({"error": service_error.message}), service_error.status_code


@games_bp.get("/<rawg_id>")
def details(rawg_id):
    try:
        parsed_id = int(rawg_id)
    except ValueError:
        return jsonify({"error": "rawg_id must be a positive integer"}), 400

    if parsed_id <= 0:
        return jsonify({"error": "rawg_id must be a positive integer"}), 400

    try:
        item = get_game_details(parsed_id)
        return jsonify(item), 200
    except RawgServiceError as service_error:
        return jsonify({"error": service_error.message}), service_error.status_code
