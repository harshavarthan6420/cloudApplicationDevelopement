def get_authenticated_username(request):
    username = (request.headers.get("X-Username") or "").strip()
    if not username:
        return None, ({"error": "Authentication required"}, 401)
    return username, None
