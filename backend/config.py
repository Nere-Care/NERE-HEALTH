"""
🔐 Configuration sécurisée pour NERE APP - AUDIT DE SÉCURITÉ
Toute la logique de sécurité de la configuration est centralisée ici.
Version: 2.0 (Production-Ready)
"""
from pathlib import Path
from dotenv import load_dotenv
import os
from pydantic_settings import BaseSettings
from pydantic import Field, field_validator, model_validator, ConfigDict

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT.parent / '.env', override=False)


def _mask_secret(secret: str, chars_visible: int = 4) -> str:
    """Masquer un secret pour les logs: 'sk_live_12345678...' → 'sk_live_****'"""
    if not secret or len(secret) <= chars_visible:
        return '***'
    return secret[:chars_visible] + '****'


def _validate_secret_key(key: str, env: str) -> str:
    """Valider la clé secrète principale"""
    if not key or not key.strip():
        if env == 'production':
            raise ValueError(
                '🔴 CRITIQUE: SECRET_KEY est obligatoire en production\n'
                'Générez une clé: python -c "import secrets; print(secrets.token_urlsafe(64))"'
            )
        return 'dev-insecure-change-me'

    key = key.strip()

    testing = os.getenv('TESTING', '0') == '1'

    if key == 'change-me':
        if env == 'production' and not testing:
            raise ValueError(
                '🔴 CRITIQUE: SECRET_KEY="change-me" est interdite en production\n'
                'Utilisez une clé générée aléatoirement (minimum 64 caractères)'
            )
        return key

    if env == 'production' and len(key) < 64:
        raise ValueError(
            f'🔴 CRITIQUE: SECRET_KEY doit faire minimum 64 caractères '
            f'(reçu: {len(key)})'
        )

    return key


def _validate_database_url(url: str, env: str) -> str:
    """Valider l'URL de base de données"""
    testing = os.getenv('TESTING', '0') == '1'

    if not url or not url.strip():
        if env == 'production':
            raise ValueError(
                '🔴 CRITIQUE: DATABASE_URL est obligatoire en production'
            )
        if testing:
            return 'postgresql://nere_user:nere_pass@localhost:5433/nere_db'
        return 'postgresql://dev:dev@localhost:5432/dev_nere_db'

    url = url.strip()

    if url.startswith('sqlite:///'):
        if not testing and env != 'testing':
            raise ValueError('SQLite n’est autorisé que pour les tests')
        return url

    if not url.startswith('postgresql://') and not url.startswith('postgres://'):
        raise ValueError('DATABASE_URL doit démarrer par postgresql://')

    if testing:
        return url

    # Détecter les credentials dangereux
    dangerous_passwords = ['pass', 'password', '123456', 'admin', 'nere_pass']
    if env not in ('production', 'staging'):
        # En dev/test, permettre 'nere_pass' pour les exemples
        dangerous_passwords = ['pass', 'password', '123456', 'admin']
    for dangerous in dangerous_passwords:
        if f':{dangerous}@' in url:
            raise ValueError(
                f'🔴 CRITIQUE: DATABASE_URL contient mot de passe dangereux "{dangerous}"\n'
                'Utilisez une passe sécurisée (minimum 32 caractères aléatoires)'
            )

    return url


def normalize_database_url(url: str) -> str:
    """Normaliser l'URL PostgreSQL"""
    if not url:
        return url

    normalized = url.replace('postgres://', 'postgresql://', 1)

    try:
        import pg8000  # noqa: F401
        if normalized.startswith('postgresql://'):
            normalized = normalized.replace(
                'postgresql://',
                'postgresql+pg8000://',
                1
            )
    except ImportError:
        pass

    return normalized


def normalize_api_prefix(prefix: str | None) -> str:
    """Normaliser le préfixe API"""
    if not prefix:
        return ''

    prefix = prefix.strip()
    if not prefix:
        return ''

    if not prefix.startswith('/'):
        prefix = '/' + prefix

    return prefix.rstrip('/')


def parse_comma_list(value: str | None, default: str) -> list[str]:
    """Parser une liste séparée par des virgules"""
    if value is None or value.strip() == '':
        value = default
    values = [item.strip() for item in value.split(',') if item.strip()]
    if not values and default:
        values = [item.strip() for item in default.split(',') if item.strip()]
    return values


def _validate_cors_origins(origins: list[str], env: str) -> list[str]:
    """Valider les origines CORS"""
    if origins == ['*']:
        if env == 'production':
            raise ValueError(
                '🔴 CRITIQUE: CORS_ORIGINS=* est interdite en production\n'
                'Spécifiez les domaines autorisés: CORS_ORIGINS=https://yourdomain.com'
            )
    return origins


def _validate_allowed_hosts(hosts: list[str], env: str) -> list[str]:
    """Valider les hosts autorisés"""
    if not hosts or (len(hosts) == 1 and hosts[0] == ''):
        if env == 'production':
            raise ValueError(
                '🔴 CRITIQUE: ALLOWED_HOSTS vide en production\n'
                'Spécifiez: ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com'
            )
        return ['localhost', '127.0.0.1']
    return hosts


def _validate_environment(env: str) -> str:
    """Valider l'environnement"""
    env = env.lower().strip()
    if env not in ('development', 'staging', 'production', 'testing'):
        raise ValueError(
            f'🔴 ERREUR: ENVIRONMENT doit être development|staging|production|testing (reçu: {env})'
        )
    return env


class Settings(BaseSettings):
    """Configuration centralisée sécurisée - AUDIT v2.0"""

    model_config = ConfigDict(env_file=ROOT.parent / '.env', extra='ignore', env_prefix='')

    @model_validator(mode='before')
    @classmethod
    def _load_environment_variables(cls, values):
        if values is None:
            values = {}

        values = dict(values)

        if not values.get('ENVIRONMENT'):
            values['ENVIRONMENT'] = os.getenv('ENVIRONMENT', 'development')

        if not values.get('DATABASE_URL_RAW'):
            values['DATABASE_URL_RAW'] = os.getenv('DATABASE_URL', '')

        if not values.get('SECRET_KEY'):
            values['SECRET_KEY'] = os.getenv('SECRET_KEY', '')

        if not values.get('CORS_ORIGINS'):
            values['CORS_ORIGINS'] = os.getenv('CORS_ORIGINS', values.get('CORS_ORIGINS', '*'))

        if not values.get('ALLOWED_HOSTS'):
            values['ALLOWED_HOSTS'] = os.getenv('ALLOWED_HOSTS', values.get('ALLOWED_HOSTS', 'localhost'))

        if not values.get('STRIPE_API_KEY'):
            values['STRIPE_API_KEY'] = os.getenv('STRIPE_API_KEY', '')

        if not values.get('STRIPE_WEBHOOK_SECRET'):
            values['STRIPE_WEBHOOK_SECRET'] = os.getenv('STRIPE_WEBHOOK_SECRET', '')

        return values

    # Environnement
    ENVIRONMENT: str = 'development'
    DEBUG: bool = False

    # Base de données
    DATABASE_URL_RAW: str = Field('')

    # Sécurité principal
    SECRET_KEY: str = ''

    # CORS et Hosts
    CORS_ORIGINS: str | list[str] = '*'
    ALLOWED_HOSTS: str | list[str] = 'localhost'

    # API
    API_PREFIX: str = '/api'

    # Phase 3: IA & Paiements
    OPENAI_API_KEY: str = ''
    OPENAI_MODEL: str = 'gpt-4o-mini'
    STRIPE_API_KEY: str = ''
    STRIPE_WEBHOOK_SECRET: str = ''
    STRIPE_SUCCESS_URL: str = 'https://nere.app/payment/success'
    STRIPE_CANCEL_URL: str = 'https://nere.app/payment/cancel'

    @field_validator('ENVIRONMENT')
    @classmethod
    def validate_environment(cls, v):
        v = v.lower().strip()
        if v not in ('development', 'staging', 'production', 'testing'):
            raise ValueError(
                f'🔴 ERREUR: ENVIRONMENT doit être development|staging|production|testing (reçu: {v})'
            )
        return v

    @field_validator('SECRET_KEY')
    @classmethod
    def validate_secret_key(cls, v, info):
        env = info.data.get('ENVIRONMENT', 'development')
        testing = os.getenv('TESTING', '0') == '1'

        if not v or not v.strip():
            if env == 'production' and not testing:
                raise ValueError(
                    '🔴 CRITIQUE: SECRET_KEY est obligatoire en production\n'
                    'Générez une clé: python -c "import secrets; print(secrets.token_urlsafe(64))"'
                )
            return 'dev-insecure-change-me'

        v = v.strip()

        if v == 'change-me':
            if env == 'production' and not testing:
                raise ValueError(
                    '🔴 CRITIQUE: SECRET_KEY="change-me" est interdite en production\n'
                    'Utilisez une clé générée aléatoirement (minimum 64 caractères)'
                )
            return v

        if env == 'production' and len(v) < 64:
            raise ValueError(
                f"🔴 CRITIQUE: SECRET_KEY doit faire minimum 64 caractères "
                f"(reçu: {len(v)})"
            )

        return v

    @field_validator('DATABASE_URL_RAW', mode='before')
    @classmethod
    def validate_database_url_raw(cls, v, info):
        env = info.data.get('ENVIRONMENT', 'development')
        testing = os.getenv('TESTING', '0') == '1'

        # Fallback explicite pour DATABASE_URL lorsque Pydantic ne le charge pas.
        if not v or not str(v).strip():
            v = os.getenv('DATABASE_URL', '').strip()

        if not v or not str(v).strip():
            if env == 'production':
                raise ValueError(
                    '🔴 CRITIQUE: DATABASE_URL est obligatoire en production'
                )
            if testing:
                return 'sqlite:///./test.db'
            return 'postgresql://dev:dev@localhost:5432/dev_nere_db'

        v = str(v).strip()

        if v.startswith('sqlite:///'):
            if not testing and env != 'testing':
                raise ValueError("SQLite n'est autorisé que pour les tests")
            return v

        if not v.startswith('postgresql://') and not v.startswith('postgres://'):
            raise ValueError('DATABASE_URL doit démarrer par postgresql://')

        if testing:
            return v

        # Détecter les credentials dangereux
        dangerous_passwords = ['pass', 'password', '123456', 'admin', 'nere_pass']
        if env not in ('production', 'staging'):
            dangerous_passwords = ['pass', 'password', '123456', 'admin']
        for dangerous in dangerous_passwords:
            if f':{dangerous}@' in v:
                raise ValueError(
                    f'🔴 CRITIQUE: DATABASE_URL contient mot de passe dangereux "{dangerous}"\n'
                    'Utilisez une passe sécurisée (minimum 32 caractères aléatoires)'
                )

        return v

    @property
    def DATABASE_URL(self) -> str:
        database_url_raw = self.DATABASE_URL_RAW
        if not database_url_raw:
            return ''

        normalized = database_url_raw.replace('postgres://', 'postgresql://', 1)

        try:
            import pg8000
            if normalized.startswith('postgresql://'):
                normalized = normalized.replace(
                    'postgresql://',
                    'postgresql+pg8000://',
                    1
                )
        except ImportError:
            pass

        return normalized

    @field_validator('API_PREFIX')
    @classmethod
    def validate_api_prefix(cls, v):
        if not v:
            return ''

        v = v.strip()
        if not v:
            return ''

        if not v.startswith('/'):
            v = '/' + v

        return v.rstrip('/')

    @field_validator('CORS_ORIGINS', mode='before')
    @classmethod
    def validate_cors_origins(cls, v, info):
        env = info.data.get('ENVIRONMENT', 'development')

        if isinstance(v, str):
            if v == '*':
                v = ['*']
            else:
                v = [item.strip() for item in v.split(',') if item.strip()]

        if v == ['*'] and env == 'production':
            raise ValueError(
                '🔴 CRITIQUE: CORS_ORIGINS=* est interdite en production\n'
                'Spécifiez les domaines autorisés: CORS_ORIGINS=https://yourdomain.com'
            )

        return v

    @field_validator('ALLOWED_HOSTS', mode='before')
    @classmethod
    def validate_allowed_hosts(cls, v, info):
        env = info.data.get('ENVIRONMENT', 'development')
        testing = os.getenv('TESTING', '0') == '1'

        if isinstance(v, str):
            v = [item.strip() for item in v.split(',') if item.strip()]

        if not v or (len(v) == 1 and v[0] == ''):
            if env == 'production':
                raise ValueError(
                    '🔴 CRITIQUE: ALLOWED_HOSTS vide en production\n'
                    'Spécifiez: ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com'
                )
            return ['localhost', '127.0.0.1', 'testserver']

        # Ajouter testserver pour les tests
        if testing or env == 'testing':
            if 'testserver' not in v:
                v = v + ['testserver']

        return v

    @model_validator(mode='after')
    def validate_production_config(self):
        """Validation globale de la configuration en production"""
        testing = os.getenv('TESTING', '0') == '1'
        if self.ENVIRONMENT == 'production' and not testing:
            # Tous les paramètres critiques doivent être configurés
            if not self.SECRET_KEY or self.SECRET_KEY == 'dev-insecure-change-me':
                raise ValueError(
                    '🔴 CRITIQUE: SECRET_KEY invalide en production\n'
                    'Générez une clé sécurisée avec: python -c "import secrets; print(secrets.token_urlsafe(64))"'
                )
            if len(self.SECRET_KEY) < 64:
                raise ValueError(
                    f'🔴 CRITIQUE: SECRET_KEY doit faire minimum 64 caractères (reçu: {len(self.SECRET_KEY)})'
                )
            if self.CORS_ORIGINS == ['*']:
                raise ValueError(
                    '🔴 CRITIQUE: CORS_ORIGINS=* est interdite en production\n'
                    'Spécifiez les domaines autorisés'
                )
            if not self.ALLOWED_HOSTS or self.ALLOWED_HOSTS == ['localhost', '127.0.0.1']:
                raise ValueError(
                    '🔴 CRITIQUE: ALLOWED_HOSTS doit être configuré pour des domaines réels en production'
                )
            if not self.DATABASE_URL_RAW or self.DATABASE_URL_RAW.startswith('sqlite://'):
                raise ValueError(
                    '🔴 CRITIQUE: DATABASE_URL doit pointer vers une base PostgreSQL en production'
                )
        return self


# Instance globale unique - LAZY LOADING pour les tests
class _SettingsProxy:
    """Proxy pour accéder aux settings de manière lazy"""
    _instance = None

    def __getattr__(self, name):
        if _SettingsProxy._instance is None:
            _SettingsProxy._instance = Settings()
        return getattr(_SettingsProxy._instance, name)

def _reset_settings():
    """Reset l'instance globale des settings (pour les tests)"""
    _SettingsProxy._instance = None

def _get_settings_instance():
    """Obtenir ou créer l'instance settings (pour les tests)"""
    if _SettingsProxy._instance is None:
        _SettingsProxy._instance = Settings()
    return _SettingsProxy._instance

# Instance globale
settings = _SettingsProxy()


def log_startup_configuration():
    """Log la configuration sécurisée lors du démarrage en production."""
    settings_instance = _get_settings_instance()
    testing = os.getenv('TESTING', '0') == '1'
    if testing or settings_instance.DEBUG:
        return

    print(f"""
╔════════════════════════════════════════════════════════════════════════════╗
║              🚀 NERE APP - DÉMARRAGE SÉCURISÉ                      ║
╠════════════════════════════════════════════════════════════════════════════╣
║ 🔐 ENVIRONMENT      : {settings_instance.ENVIRONMENT.upper()}
║ 🔐 DEBUG            : {'✓ ON (DEV)' if settings_instance.DEBUG else '✗ OFF (PROD)'}
║ 🔐 CORS_ORIGINS     : {len(settings_instance.CORS_ORIGINS)} domaine(s) autorisé(s)
║ 🔐 ALLOWED_HOSTS    : {len(settings_instance.ALLOWED_HOSTS)} host(s) autorisé(s)
║ 🔐 SECRET_KEY       : {_mask_secret(settings_instance.SECRET_KEY)}
║ 🔐 STRIPE_KEY       : {_mask_secret(settings_instance.STRIPE_API_KEY) if settings_instance.STRIPE_API_KEY else '⚠️  NON CONFIGURÉ'}
║ 🔐 DATABASE         : {settings_instance.DATABASE_URL_RAW[:40]}...
╚════════════════════════════════════════════════════════════════════════════════════╝
    """)
