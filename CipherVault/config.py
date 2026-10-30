import os

class Config:
    SECRET_KEY = os.environ.get('SECRET_KEY', 'ciphervault-secure-key-32-bytes')
    MAX_CONTENT_LENGTH = 25 * 1024 * 1024
    RSA_KEY_SIZE = 3072
    AES_KEY_SIZE = 32
