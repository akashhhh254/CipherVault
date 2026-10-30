"""
CipherVault - User Security Model with Argon2id Hashing
"""

from datetime import datetime
from flask_login import UserMixin
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from . import db

ph = PasswordHasher(
    time_cost=3,
    memory_cost=65536,
    parallelism=4,
    hash_len=32,
    salt_len=16
)

class User(UserMixin, db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False, index=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    role = db.Column(db.String(32), default='cryptographer')
    
    # Asymmetric Cryptography: RSA-3072 Key Storage
    public_key_pem = db.Column(db.Text, nullable=False)
    public_key_fingerprint = db.Column(db.String(64), nullable=False, index=True)
    
    # Protected Private Key (Encrypted via Scrypt + AES-256-GCM)
    encrypted_private_key = db.Column(db.LargeBinary, nullable=False)
    private_key_salt = db.Column(db.LargeBinary, nullable=False)
    private_key_nonce = db.Column(db.LargeBinary, nullable=False)
    private_key_auth_tag = db.Column(db.LargeBinary, nullable=False)
    
    # Metadata & Session Tracking
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_login = db.Column(db.DateTime)
    failed_login_attempts = db.Column(db.Integer, default=0)
    is_locked = db.Column(db.Boolean, default=False)
    
    # Relationships
    images = db.relationship('EncryptedImage', backref='owner', lazy=True, cascade='all, delete-orphan')
    audit_logs = db.relationship('SecurityAuditLog', backref='user', lazy=True)
    
    def set_password(self, password: str):
        """Hashes password using memory-hard Argon2id."""
        self.password_hash = ph.hash(password)
        
    def check_password(self, password: str) -> bool:
        """Verifies candidate password against stored Argon2id hash."""
        try:
            return ph.verify(self.password_hash, password)
        except VerifyMismatchError:
            return False
            
    def __repr__(self):
        return f"<User {self.username} ({self.role})>"
