"""
CipherVault - Cryptographic Engine Automated Security Test Suite
Framework: pytest
"""

import pytest
import os
import hashlib
from app.encryption.aes_gcm import AESGCMCipher
from app.encryption.rsa_oaep import RSAOAEPWrapper
from app.encryption.key_manager import KeyManager
from app.security.image_sanitizer import ImageSanitizer

def test_aes_256_gcm_roundtrip():
    """Verify AES-256-GCM encryption and authenticated recovery."""
    key = AESGCMCipher.generate_key()
    plaintext = b"TOP_SECRET_MILITARY_RECON_IMAGE_BYTES"
    
    nonce, ciphertext, auth_tag = AESGCMCipher.encrypt(key, plaintext)
    decrypted = AESGCMCipher.decrypt(key, nonce, ciphertext, auth_tag)
    
    assert decrypted == plaintext
    assert hashlib.sha256(decrypted).hexdigest() == hashlib.sha256(plaintext).hexdigest()

def test_aes_256_gcm_ciphertext_tampering():
    """Verify that flipping 1 bit in the ciphertext raises an authentication error."""
    key = AESGCMCipher.generate_key()
    plaintext = b"CONFIDENTIAL_RADAR_COORDINATES"
    
    nonce, ciphertext, auth_tag = AESGCMCipher.encrypt(key, plaintext)
    
    # Tamper with ciphertext (invert bit 0 of first byte)
    tampered_ciphertext = bytearray(ciphertext)
    tampered_ciphertext[0] ^= 0x01
    
    with pytest.raises(ValueError) as excinfo:
        AESGCMCipher.decrypt(key, nonce, bytes(tampered_ciphertext), auth_tag)
    assert "Authentication Verification Failed" in str(excinfo.value)

def test_aes_256_gcm_nonce_mutation():
    """Verify that modifying the nonce halts decryption."""
    key = AESGCMCipher.generate_key()
    plaintext = b"SENSITIVE_SATELLITE_STREAM"
    
    nonce, ciphertext, auth_tag = AESGCMCipher.encrypt(key, plaintext)
    
    tampered_nonce = bytearray(nonce)
    tampered_nonce[0] ^= 0xff
    
    with pytest.raises(ValueError):
        AESGCMCipher.decrypt(key, bytes(tampered_nonce), ciphertext, auth_tag)

def test_aes_256_gcm_auth_tag_corruption():
    """Verify that altering the 128-bit authentication tag raises an error."""
    key = AESGCMCipher.generate_key()
    plaintext = b"FLIGHT_PATH_PAYLOAD"
    
    nonce, ciphertext, auth_tag = AESGCMCipher.encrypt(key, plaintext)
    
    tampered_tag = bytearray(auth_tag)
    tampered_tag[-1] ^= 0xaa
    
    with pytest.raises(ValueError):
        AESGCMCipher.decrypt(key, nonce, ciphertext, bytes(tampered_tag))

def test_rsa_3072_oaep_key_wrapping():
    """Verify RSA-3072 OAEP key wrapping and unwrapping with SHA-256."""
    private_key, public_key = RSAOAEPWrapper.generate_key_pair()
    symmetric_key = AESGCMCipher.generate_key()
    
    wrapped_key = RSAOAEPWrapper.wrap_key(public_key, symmetric_key)
    unwrapped_key = RSAOAEPWrapper.unwrap_key(private_key, wrapped_key)
    
    assert unwrapped_key == symmetric_key

def test_cross_user_key_isolation():
    """Verify User B cannot unwrap User A's AES key."""
    priv_a, pub_a = RSAOAEPWrapper.generate_key_pair()
    priv_b, pub_b = RSAOAEPWrapper.generate_key_pair()
    
    symmetric_key = AESGCMCipher.generate_key()
    wrapped_for_a = RSAOAEPWrapper.wrap_key(pub_a, symmetric_key)
    
    with pytest.raises(ValueError):
        RSAOAEPWrapper.unwrap_key(priv_b, wrapped_for_a)

def test_private_key_at_rest_protection():
    """Verify Scrypt KDF private key encryption and unlocking with master password."""
    private_key, public_key = RSAOAEPWrapper.generate_key_pair()
    correct_pwd = "MasterP@ssw0rd!2026"
    wrong_pwd = "IncorrectPassword123"
    
    salt, nonce, ciphertext, auth_tag = KeyManager.protect_private_key(private_key, correct_pwd)
    
    # Correct password unlocks
    unlocked = KeyManager.unlock_private_key(salt, nonce, ciphertext, auth_tag, correct_pwd)
    assert unlocked is not None
    
    # Wrong password raises authentication error
    with pytest.raises(ValueError):
        KeyManager.unlock_private_key(salt, nonce, ciphertext, auth_tag, wrong_pwd)

def test_magic_byte_executable_rejection():
    """Verify disguised Windows PE (MZ) and Linux ELF binaries are rejected."""
    fake_pe = b"MZ\x90\x00\x03\x00\x00\x00\x04\x00\x00\x00"
    valid, mime, msg = ImageSanitizer.validate_magic_bytes(fake_pe)
    assert not valid
    assert "Disguised executable" in msg
    
    fake_elf = b"\x7fELF\x02\x01\x01\x00\x00\x00\x00\x00"
    valid, mime, msg = ImageSanitizer.validate_magic_bytes(fake_elf)
    assert not valid
    assert "Disguised executable" in msg
    
    genuine_png = b"\x89PNG\r\n\x1a\n\x00\x00\x00\r"
    valid, mime, msg = ImageSanitizer.validate_magic_bytes(genuine_png)
    assert valid
    assert mime == "image/png"
