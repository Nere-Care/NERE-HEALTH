from pathlib import Path
from dotenv import load_dotenv
import os

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / '.env')


def normalize_database_url(url: str) -> str:
    if not url:
        return url
    return url.replace('postgres://', 'postgresql://', 1)


class Settings:
    DATABASE_URL: str = normalize_database_url(
        os.getenv(
            'DATABASE_URL',
            'postgresql://nere_user:nere_pass@localhost:5432/nere_db'
        )
    )
    CORS_ORIGINS = [
        origin.strip()
        for origin in os.getenv('CORS_ORIGINS', '*').split(',')
        if origin.strip()
    ]
    if CORS_ORIGINS == ['*']:
        CORS_ORIGINS = ['*']

    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')
    API_PREFIX: str = os.getenv('API_PREFIX', '')
    SECRET_KEY: str = os.getenv('SECRET_KEY', 'change-me')
    ALLOWED_HOSTS = [
        host.strip()
        for host in os.getenv('ALLOWED_HOSTS', 'localhost,127.0.0.1').split(',')
        if host.strip()
    ]

settings = Settings()
