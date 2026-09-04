import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    FLASK_ENV = os.getenv("FLASK_ENV", "development")
    MONGO_URI = os.getenv("MONGO_URI", "")
    MONGO_DB = os.getenv("MONGO_DB", "gamevault")
    FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:5173")
    RAWG_API_KEY = os.getenv("RAWG_API_KEY", "")
    RAWG_BASE_URL = os.getenv("RAWG_BASE_URL", "https://api.rawg.io/api")
    HTTP_TIMEOUT_SECONDS = int(os.getenv("HTTP_TIMEOUT_SECONDS", "10"))
