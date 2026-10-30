"""
CipherVault - Key Management & At-Rest Protection Service
Standard: NIST SP 800-132 / PKCS#8 / Scrypt KDF
"""

import os
import base64
from typing import Tuple
from cryptography.hazmat.primitives.kdf.scrypt import Scrypt
from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric import rsa
from .aes_gcm import AESGCMCipher
from .rsa_oaep import RSAOAEPWrapper

class KeyManager:
    """Safeguards user RSA private keys at rest using memory-hard Scrypt key derivation and AES-256-GCM."""
    
    SALT_SIZE = 32
    
    @classmethod
    def derive_protection_key(cls, password: str, salt: bytes) -> bytes:
        """Derives a 256-bit encryption key from password using Scrypt KDF."""
        kdf = Scrypt(
            salt=salt,
            length=32,
            n=16384,
            r=8,
            p=1
        )
        return kdf.derive(password.encode('utf-8'))
    
    @classmethod
    def protect_private_key(cls, private_key: rsa.RSAPrivateKey, password: str) -> Tuple[bytes, bytes, bytes, bytes]:
        """
        Exports RSA private key to PKCS#8 DER bytes and encrypts with AES-256-GCM.
        Returns: (salt, nonce, ciphertext, auth_tag)
        """
        pkcs8_der = private_key.private_bytes(
            encoding=serialization.Encoding.DER,
            format=serialization.PrivateFormat.PKCS8,
            encryption_algorithm=serialization.NoEncryption()
        )
        
        salt = os.urandom(cls.SALT_SIZE)
        derived_key = cls.derive_protection_key(password, salt)
        
        nonce, ciphertext, auth_tag = AESGCMCipher.encrypt(derived_key, pkcs8_der)
        return salt, nonce, ciphertext, auth_tag
    
    @classmethod
    def unlock_private_key(cls, salt: bytes, nonce: bytes, ciphertext: bytes, auth_tag: bytes, password: str) -> rsa.RSAPrivateKey:
        """
        Unlocks and decrypts user private key using master password.
        Raises ValueError if password or envelope is invalid.
        """
        derived_key = cls.derive_protection_key(password, salt)
        try:
            pkcs8_der = AESGCMCipher.decrypt(derived_key, nonce, ciphertext, auth_tag)
            private_key = serialization.load_der_private_key(pkcs8_der, password=None)
            return private_key
        except Exception as exc:
            raise ValueError("Authentication Failed: Invalid password or corrupted private key envelope.") from exc
