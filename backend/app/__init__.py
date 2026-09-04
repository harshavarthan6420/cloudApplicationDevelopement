from flask import Flask
from flask_cors import CORS
from config import Config


def create_app(config_object=Config):
    app = Flask(__name__)
    app.config.from_object(config_object)

    CORS(app, resources={r"/*": {"origins": app.config["FRONTEND_URL"]}}, supports_credentials=True)

    from app.routes.health import health_bp
    from app.routes.auth import auth_bp
    from app.routes.games import games_bp
    from app.routes.library import library_bp
    from app.routes.wishlist import wishlist_bp
    from app.routes.reviews import reviews_bp
    from app.routes.dashboard import dashboard_bp
    app.register_blueprint(health_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(games_bp)
    app.register_blueprint(library_bp)
    app.register_blueprint(wishlist_bp)
    app.register_blueprint(reviews_bp)
    app.register_blueprint(dashboard_bp)

    return app
