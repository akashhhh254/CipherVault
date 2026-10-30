import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent

class Config:
    """Base application security and environment configuration."""
    SECRET_KEY = os.environ.get('SECRET_KEY', os.urandom(32).hex())
    
    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # Upload & Storage constraints
    MAX_CONTENT_LENGTH = 25 * 1024 * 1024  # 25 MB max upload
    UPLOAD_FOLDER = BASE_DIR / 'instance' / 'vault_storage'
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'webp'}
    
    # Cryptographic Parameters
    RSA_KEY_SIZE = 3072                    # NIST SP 800-57 recommended key size
    RSA_PUBLIC_EXPONENT = 65537            # Standard F4 exponent
    AES_KEY_SIZE = 32                      # 256-bit symmetric keys
    AES_GCM_NONCE_SIZE = 12                # 96-bit standard nonce
    AES_GCM_TAG_SIZE = 16                  # 128-bit authentication tag
    
    # Password Hashing & Key Derivation (Argon2id & Scrypt)
    ARGON2_TIME_COST = 3                   # 3 iterations
    ARGON2_MEMORY_COST = 65536             # 64 MB RAM
    ARGON2_PARALLELISM = 4                 # 4 lanes
    SCRYPT_N = 16384                       # Scrypt work factor
    SCRYPT_R = 8
    SCRYPT_P = 1
    
    # Session Security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = 1800      # 30-minute session expiry

class DevelopmentConfig(Config):
    DEBUG = True
    SESSION_COOKIE_SECURE = False          # Allow HTTP in local development
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DEV_DATABASE_URL',
        f"sqlite:///{BASE_DIR / 'instance' / 'ciphervault_dev.sqlite'}"
    )

class TestingConfig(Config):
    TESTING = True
    WTF_CSRF_ENABLED = False
    SESSION_COOKIE_SECURE = False
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'

class ProductionConfig(Config):
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL')
    if SQLALCHEMY_DATABASE_URI and SQLALCHEMY_DATABASE_URI.startswith('postgres://'):
        SQLALCHEMY_DATABASE_URI = SQLALCHEMY_DATABASE_URI.replace('postgres://', 'postgresql://', 1)

config_by_name = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig,
}
