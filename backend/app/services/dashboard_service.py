from app.database.mongo import (
    get_library_collection,
    get_reviews_collection,
    get_wishlist_collection,
)


def get_dashboard_stats(username):
    library = get_library_collection()
    wishlist = get_wishlist_collection()
    reviews = get_reviews_collection()

    if library is None or wishlist is None or reviews is None:
        return {"error": "Database is not configured"}, 500

    library_items = list(library.find({"username": username}))
    wishlist_items = list(wishlist.find({"username": username}))
    review_items = list(reviews.find({"username": username}))

    status_counts = {"Backlog": 0, "Playing": 0, "Completed": 0, "Dropped": 0}
    total_hours = 0
    for item in library_items:
        status = item.get("status")
        if status in status_counts:
            status_counts[status] += 1
        total_hours += float(item.get("hours_played") or 0)

    rating_distribution = {}
    for review in review_items:
        rating = str(review.get("rating"))
        if rating:
            rating_distribution[rating] = rating_distribution.get(rating, 0) + 1

    payload = {
        "total_games": len(library_items),
        "currently_playing": status_counts["Playing"],
        "completed_games": status_counts["Completed"],
        "backlog_games": status_counts["Backlog"],
        "dropped_games": status_counts["Dropped"],
        "wishlist_count": len(wishlist_items),
        "review_count": len(review_items),
        "total_hours_played": total_hours,
        "charts": {
            "games_by_status": status_counts,
            "library_vs_wishlist": {
                "library": len(library_items),
                "wishlist": len(wishlist_items),
            },
            "rating_distribution": rating_distribution,
        },
    }

    return payload, 200
