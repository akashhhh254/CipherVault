"""
CipherVault - RSA-3072 OAEP Key Wrapping Engine
Standard: PKCS#1 v2.2 / RFC 8017 / NIST SP 800-56B
"""

from typing import Tuple
from cryptography.hazmat.primitives.asymmetric import rsa, padding
from cryptography.hazmat.primitives import hashes, serialization

class RSAOAEPWrapper:
    """Manages RSA-3072 key pair generation, key wrapping, and unwrapping using OAEP with SHA-256."""
    
    MODULUS_SIZE = 3072
    PUBLIC_EXPONENT = 65537
    
    @classmethod
    def generate_key_pair(cls) -> Tuple[rsa.RSAPrivateKey, rsa.RSAPublicKey]:
        """Generates a NIST-compliant 3072-bit RSA key pair with e=65537."""
        private_key = rsa.generate_private_key(
            public_exponent=cls.PUBLIC_EXPONENT,
            key_size=cls.MODULUS_SIZE
        )
        return private_key, private_key.public_key()
    
    @classmethod
    def wrap_key(cls, public_key: rsa.RSAPublicKey, symmetric_key: bytes) -> bytes:
        """
        Wraps (encrypts) a 256-bit AES symmetric key using RSA-OAEP with SHA-256.
        """
        wrapped = public_key.encrypt(
            symmetric_key,
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
        return wrapped
    
    @classmethod
    def unwrap_key(cls, private_key: rsa.RSAPrivateKey, wrapped_key: bytes) -> bytes:
        """
        Unwraps (decrypts) a wrapped AES symmetric key using RSA-OAEP with SHA-256.
        """
        try:
            symmetric_key = private_key.decrypt(
                wrapped_key,
                padding.OAEP(
                    mgf=padding.MGF1(algorithm=hashes.SHA256()),
                    algorithm=hashes.SHA256(),
                    label=None
                )
            )
            return symmetric_key
        except Exception as exc:
            raise ValueError("RSA-OAEP Unwrapping Failed: Private key mismatch or corrupted key envelope.") from exc
    
    @classmethod
    def serialize_public_key(cls, public_key: rsa.RSAPublicKey) -> str:
        """Serializes RSA public key to PEM string."""
        pem_bytes = public_key.public_bytes(
            encoding=serialization.Encoding.PEM,
            format=serialization.PublicFormat.SubjectPublicKeyInfo
        )
        return pem_bytes.decode('utf-8')
    
    @classmethod
    def load_public_key(cls, pem_str: str) -> rsa.RSAPublicKey:
        """Loads RSA public key from PEM string."""
        return serialization.load_pem_public_key(pem_str.encode('utf-8'))
