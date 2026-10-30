"""
CipherVault - Encrypted Image Container Model
"""

from datetime import datetime
from . import db

class EncryptedImage(db.Model):
    __tablename__ = 'encrypted_images'
    
    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    original_filename = db.Column(db.String(255), nullable=False)
    mime_type = db.Column(db.String(64), nullable=False)
    original_size_bytes = db.Column(db.Integer, nullable=False)
    encrypted_size_bytes = db.Column(db.Integer, nullable=False)
    
    # Cryptographic Invariants
    sha256_original_hash = db.Column(db.String(64), nullable=False)
    sha256_ciphertext_hash = db.Column(db.String(64), nullable=False)
    algorithm = db.Column(db.String(32), default='AES-256-GCM', nullable=False)
    
    # AES-256-GCM components
    nonce = db.Column(db.LargeBinary, nullable=False)       # 96-bit IV
    auth_tag = db.Column(db.LargeBinary, nullable=False)    # 128-bit authentication tag
    wrapped_aes_key = db.Column(db.LargeBinary, nullable=False) # RSA-3072 encrypted AES key
    ciphertext_path = db.Column(db.String(512), nullable=False) # Stored outside web root
    
    # Sanitization
    exif_stripped = db.Column(db.Boolean, default=True)
    tags_stripped_count = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_decrypted_at = db.Column(db.DateTime)
    
    def __repr__(self):
        return f"<EncryptedImage {self.original_filename} ({self.id})>"
