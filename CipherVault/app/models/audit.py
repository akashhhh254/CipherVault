"""
CipherVault - Immutable Security Audit Log Model
"""

from datetime import datetime
from . import db

class SecurityAuditLog(db.Model):
    __tablename__ = 'security_audit_logs'
    
    id = db.Column(db.Integer, primary_key=True)
    timestamp = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True, index=True)
    username = db.Column(db.String(64), nullable=True)
    ip_address = db.Column(db.String(64), nullable=False)
    
    event_type = db.Column(db.String(64), nullable=False, index=True)
    severity = db.Column(db.String(16), nullable=False, index=True)  # INFO, WARNING, CRITICAL
    details = db.Column(db.Text, nullable=False)
    metadata_json = db.Column(db.Text, nullable=True)
    
    def __repr__(self):
        return f"<SecurityAuditLog [{self.severity}] {self.event_type} at {self.timestamp}>"
