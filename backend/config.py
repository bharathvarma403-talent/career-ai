import os
from pathlib import Path
from dotenv import load_dotenv

# Base directory
BACKEND_DIR = Path(__file__).resolve().parent
BASE_DIR = BACKEND_DIR.parent

# Load environment variables from backend/.env or .env in root
if (BACKEND_DIR / ".env").exists():
    load_dotenv(dotenv_path=str(BACKEND_DIR / ".env"))
if (BASE_DIR / ".env").exists():
    load_dotenv(dotenv_path=str(BASE_DIR / ".env"))

# Security
SECRET_KEY = os.getenv("SECRET_KEY", "change-this-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30 * 24 * 7  # 7 days
GOOGLE_CLIENT_ID = os.getenv("GOOGLE_CLIENT_ID", "")

# AI Configuration
AI_PROVIDER = os.getenv("AI_PROVIDER", "gemini")
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-flash-latest")

# Environment detection
IS_VERCEL = os.getenv("VERCEL") == "1"

# Database - use SQLite for development if no PostgreSQL URL set
# For production, set DATABASE_URL to a PostgreSQL connection string
if IS_VERCEL:
    DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:////tmp/dev.db")
    UPLOAD_DIR = Path("/tmp/uploads")
    TEMPLATES_DIR = Path("/tmp/templates")
    STATIC_DIR = Path("/tmp/static")
else:
    DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{str(BASE_DIR / 'dev.db')}")
    UPLOAD_DIR = BASE_DIR / "uploads"
    TEMPLATES_DIR = BASE_DIR / "templates"
    STATIC_DIR = BASE_DIR / "static"

# File Upload
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
ALLOWED_EXTENSIONS = {"pdf", "docx"}

# Ensure directories exist
try:
    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    TEMPLATES_DIR.mkdir(parents=True, exist_ok=True)
    STATIC_DIR.mkdir(parents=True, exist_ok=True)
except Exception:
    pass

# Application
DEBUG = os.getenv("DEBUG", "True").lower() == "true"