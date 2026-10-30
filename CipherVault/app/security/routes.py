"""
CipherVault - Security Auditing, Tamper Lab, and Educational Cryptanalysis
"""

from flask import Blueprint, render_template, request, jsonify
from flask_login import login_required, current_user
from ..models import db, SecurityAuditLog, EncryptedImage

security_bp = Blueprint('security', __name__)

@security_bp.route('/audit-logs')
@login_required
def audit_logs():
    severity = request.args.get('severity')
    query = SecurityAuditLog.query.order_by(SecurityAuditLog.timestamp.desc())
    if severity and severity != 'ALL':
        query = query.filter_by(severity=severity)
    logs = query.limit(100).all()
    return render_template('security/audit_logs.html', logs=logs)

@security_bp.route('/des-benchmark')
def des_benchmark():
    return jsonify({
        "educational_disclaimer": "DES is obsolete. Do NOT use for production data.",
        "algorithms": {
            "DES": {
                "key_bits": 56,
                "block_bits": 64,
                "rounds": 16,
                "keyspace": 2**56,
                "crack_time": "< 5 minutes via FPGA",
                "status": "WITHDRAWN"
            },
            "AES_256_GCM": {
                "key_bits": 256,
                "block_bits": 128,
                "rounds": 14,
                "keyspace": 2**256,
                "crack_time": "Astronomical (> 10^50 years)",
                "status": "NIST FIPS 197 / NSA TOP SECRET"
            }
        }
    })
