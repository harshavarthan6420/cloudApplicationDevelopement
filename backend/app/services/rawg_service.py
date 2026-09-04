import json
from urllib import error, parse, request

from flask import current_app


class RawgServiceError(Exception):
    def __init__(self, message, status_code=502):
        super().__init__(message)
        self.message = message
        self.status_code = status_code


def _request_json(path, params=None):
    api_key = current_app.config.get("RAWG_API_KEY", "")
    if not api_key:
        raise RawgServiceError("RAWG API key is not configured", 500)

    base_url = current_app.config.get("RAWG_BASE_URL", "https://api.rawg.io/api")
    timeout = current_app.config.get("HTTP_TIMEOUT_SECONDS", 10)

    query = params.copy() if params else {}
    query["key"] = api_key

    query_string = parse.urlencode(query)
    target_url = f"{base_url.rstrip('/')}/{path.lstrip('/')}?{query_string}"

    try:
        with request.urlopen(target_url, timeout=timeout) as response:
            payload = response.read().decode("utf-8")
            return json.loads(payload)
    except error.HTTPError as http_error:
        if http_error.code == 404:
            raise RawgServiceError("Game not found", 404) from http_error
        raise RawgServiceError("RAWG request failed", 502) from http_error
    except error.URLError as url_error:
        raise RawgServiceError("RAWG service is unavailable", 502) from url_error
    except json.JSONDecodeError as decode_error:
        raise RawgServiceError("RAWG returned an invalid response", 502) from decode_error


def _normalize_game_summary(item):
    return {
        "rawg_id": item.get("id"),
        "name": item.get("name"),
        "cover_image": item.get("background_image"),
        "release_date": item.get("released"),
        "rating": item.get("rating"),
        "genres": [genre.get("name") for genre in item.get("genres", []) if genre.get("name")],
        "platforms": [
            platform.get("platform", {}).get("name")
            for platform in item.get("platforms", [])
            if platform.get("platform", {}).get("name")
        ],
    }


def _normalize_game_detail(item):
    return {
        "rawg_id": item.get("id"),
        "name": item.get("name"),
        "cover_image": item.get("background_image"),
        "release_date": item.get("released"),
        "rating": item.get("rating"),
        "genres": [genre.get("name") for genre in item.get("genres", []) if genre.get("name")],
        "platforms": [
            platform.get("platform", {}).get("name")
            for platform in item.get("platforms", [])
            if platform.get("platform", {}).get("name")
        ],
        "developers": [dev.get("name") for dev in item.get("developers", []) if dev.get("name")],
        "publishers": [pub.get("name") for pub in item.get("publishers", []) if pub.get("name")],
        "description": item.get("description_raw") or item.get("description") or "",
    }


def search_games(query):
    cleaned_query = (query or "").strip()
    if not cleaned_query:
        return []

    response = _request_json("games", {"search": cleaned_query, "page_size": 12})
    results = response.get("results") or []
    return [_normalize_game_summary(item) for item in results]


def get_game_details(rawg_id):
    response = _request_json(f"games/{rawg_id}")
    return _normalize_game_detail(response)
