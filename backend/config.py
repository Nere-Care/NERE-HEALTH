from pathlib import Path
from dotenv import load_dotenv
import os

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / '.env')


def normalize_database_url(url: str) -> str:
    if not url:
        return url

    normalized = url.replace('postgres://', 'postgresql://', 1)

    try:
        import pg8000  # noqa: F401
        if normalized.startswith('postgresql://'):
            normalized = normalized.replace('postgresql://', 'postgresql+pg8000://', 1)
    except ImportError:
        pass

    return normalized


def parse_comma_list(value: str | None, default: str) -> list[str]:
    if value is None or value.strip() == '':
        value = default
    values = [item.strip() for item in value.split(',') if item.strip()]
    if not values and default:
        values = [item.strip() for item in default.split(',') if item.strip()]
    return values


class Settings:
    DATABASE_URL: str = normalize_database_url(
        os.getenv(
            'DATABASE_URL',
            'postgresql://nere_user:nere_pass@localhost:5434/nere_db'
        )
    )
    CORS_ORIGINS = parse_comma_list(os.getenv('CORS_ORIGINS'), '*')
    ENVIRONMENT: str = os.getenv('ENVIRONMENT', 'development')
    DEBUG: bool = ENVIRONMENT == 'development'
    API_PREFIX: str = os.getenv('API_PREFIX', '')
    SECRET_KEY: str = os.getenv('SECRET_KEY', '')
    ALLOWED_HOSTS = parse_comma_list(os.getenv('ALLOWED_HOSTS'), 'localhost,127.0.0.1')

    if not SECRET_KEY:
        if DEBUG:
            SECRET_KEY = 'change-me'
        else:
            raise ValueError('SECRET_KEY must be set in production')

    if SECRET_KEY == 'change-me' and not DEBUG:
        raise ValueError('SECRET_KEY must be changed before production')

    if CORS_ORIGINS == ['*'] and not DEBUG:
        raise ValueError('CORS_ORIGINS must be restricted in production')

    if not ALLOWED_HOSTS:
        ALLOWED_HOSTS = ['localhost', '127.0.0.1']


settings = Settings()
