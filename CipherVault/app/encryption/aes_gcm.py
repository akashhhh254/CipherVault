"""
CipherVault - AES-256-GCM Authenticated Encryption Engine
Standard: NIST SP 800-38D / FIPS 197
"""

import os
from typing import Tuple
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.exceptions import InvalidTag

class AESGCMCipher:
    """Provides high-assurance AES-256-GCM authenticated encryption and decryption."""
    
    KEY_SIZE_BYTES = 32      # 256 bits
    NONCE_SIZE_BYTES = 12    # 96 bits (standard recommended GCM nonce length)
    TAG_SIZE_BYTES = 16      # 128 bits authentication tag
    
    @classmethod
    def generate_key(cls) -> bytes:
        """Generates a cryptographically secure 256-bit AES key using CSPRNG."""
        return AESGCM.generate_key(bit_length=256)
    
    @classmethod
    def generate_nonce(cls) -> bytes:
        """Generates a unique 96-bit random nonce for GCM."""
        return os.urandom(cls.NONCE_SIZE_BYTES)
    
    @classmethod
    def encrypt(cls, key: bytes, plaintext: bytes, associated_data: bytes = None) -> Tuple[bytes, bytes, bytes]:
        """
        Encrypts plaintext bytes using AES-256-GCM.
        Returns: (nonce, ciphertext, auth_tag)
        """
        if len(key) != cls.KEY_SIZE_BYTES:
            raise ValueError(f"Invalid key length: expected {cls.KEY_SIZE_BYTES} bytes, got {len(key)}")
        
        nonce = cls.generate_nonce()
        aesgcm = AESGCM(key)
        
        # cryptography library appends the 16-byte auth tag to the end of ciphertext
        encrypted_data = aesgcm.encrypt(nonce, plaintext, associated_data)
        
        ciphertext = encrypted_data[:-cls.TAG_SIZE_BYTES]
        auth_tag = encrypted_data[-cls.TAG_SIZE_BYTES:]
        
        return nonce, ciphertext, auth_tag
    
    @classmethod
    def decrypt(cls, key: bytes, nonce: bytes, ciphertext: bytes, auth_tag: bytes, associated_data: bytes = None) -> bytes:
        """
        Decrypts ciphertext bytes using AES-256-GCM and verifies the 128-bit authentication tag.
        Raises InvalidTag if ciphertext, nonce, or tag has been modified.
        """
        if len(key) != cls.KEY_SIZE_BYTES:
            raise ValueError(f"Invalid key length: expected {cls.KEY_SIZE_BYTES} bytes, got {len(key)}")
        if len(nonce) != cls.NONCE_SIZE_BYTES:
            raise ValueError(f"Invalid nonce length: expected {cls.NONCE_SIZE_BYTES} bytes, got {len(nonce)}")
        if len(auth_tag) != cls.TAG_SIZE_BYTES:
            raise ValueError(f"Invalid auth tag length: expected {cls.TAG_SIZE_BYTES} bytes, got {len(auth_tag)}")
            
        aesgcm = AESGCM(key)
        combined = ciphertext + auth_tag
        
        try:
            plaintext = aesgcm.decrypt(nonce, combined, associated_data)
            return plaintext
        except InvalidTag as exc:
            raise ValueError("AES-256-GCM Authentication Verification Failed: Ciphertext, Nonce, or Tag has been tampered with!") from exc
