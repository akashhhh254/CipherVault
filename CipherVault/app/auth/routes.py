"""
CipherVault - Authentication & Session Management Routes
"""

from flask import Blueprint, render_template, redirect, url_for, flash, request, jsonify
from flask_login import login_user, logout_user, login_required, current_user
from ..models import db, User, SecurityAuditLog
from ..encryption.rsa_oaep import RSAOAEPWrapper
from ..encryption.key_manager import KeyManager

auth_bp = Blueprint('auth', __name__)

@auth_bp.route('/register', methods=['GET', 'POST'])
def register():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
        
    if request.method == 'POST':
        data = request.form or request.get_json() or {}
        username = data.get('username', '').strip()
        email = data.get('email', '').strip()
        password = data.get('password', '').strip()
        
        if not username or not email or not password:
            flash('All credential fields are required.', 'danger')
            return render_template('auth/register.html'), 400
            
        if User.query.filter((User.username == username) | (User.email == email)).first():
            flash('Username or email already exists in vault authority.', 'danger')
            return render_template('auth/register.html'), 400
            
        # Generate NIST RSA-3072 key pair for user
        private_key, public_key = RSAOAEPWrapper.generate_key_pair()
        public_key_pem = RSAOAEPWrapper.serialize_public_key(public_key)
        
        # Protect private key at rest using Scrypt KDF + AES-256-GCM
        salt, nonce, ciphertext, auth_tag = KeyManager.protect_private_key(private_key, password)
        
        import hashlib
        fingerprint = hashlib.sha256(public_key_pem.encode('utf-8')).hexdigest()
        
        user = User(
            username=username,
            email=email,
            public_key_pem=public_key_pem,
            public_key_fingerprint=fingerprint,
            encrypted_private_key=ciphertext,
            private_key_salt=salt,
            private_key_nonce=nonce,
            private_key_auth_tag=auth_tag
        )
        user.set_password(password)
        
        db.session.add(user)
        db.session.commit()
        
        # Log audit event
        audit = SecurityAuditLog(
            user_id=user.id,
            username=user.username,
            ip_address=request.remote_addr or '127.0.0.1',
            event_type='USER_REGISTER',
            severity='INFO',
            details=f"User {user.username} registered with Argon2id credentials and RSA-3072 key envelope."
        )
        db.session.add(audit)
        db.session.commit()
        
        flash('Registration successful. You may now authenticate.', 'success')
        return redirect(url_for('auth.login'))
        
    return render_template('auth/register.html')

@auth_bp.route('/login', methods=['GET', 'POST'])
def login():
    if current_user.is_authenticated:
        return redirect(url_for('dashboard.index'))
        
    if request.method == 'POST':
        data = request.form or request.get_json() or {}
        username = data.get('username', '').strip()
        password = data.get('password', '').strip()
        
        user = User.query.filter_by(username=username).first()
        if not user or not user.check_password(password):
            if user:
                user.failed_login_attempts += 1
                db.session.commit()
                
            audit = SecurityAuditLog(
                username=username,
                ip_address=request.remote_addr or '127.0.0.1',
                event_type='LOGIN_FAILED',
                severity='WARNING',
                details=f"Failed login attempt for username '{username}'."
            )
            db.session.add(audit)
            db.session.commit()
            
            flash('Invalid cryptographic credentials.', 'danger')
            return render_template('auth/login.html'), 401
            
        login_user(user, remember=False)
        user.failed_login_attempts = 0
        from datetime import datetime
        user.last_login = datetime.utcnow()
        
        audit = SecurityAuditLog(
            user_id=user.id,
            username=user.username,
            ip_address=request.remote_addr or '127.0.0.1',
            event_type='USER_LOGIN',
            severity='INFO',
            details=f"User {user.username} successfully authenticated via Argon2id."
        )
        db.session.add(audit)
        db.session.commit()
        
        return redirect(url_for('dashboard.index'))
        
    return render_template('auth/login.html')

@auth_bp.route('/logout')
@login_required
def logout():
    audit = SecurityAuditLog(
        user_id=current_user.id,
        username=current_user.username,
        ip_address=request.remote_addr or '127.0.0.1',
        event_type='USER_LOGOUT',
        severity='INFO',
        details=f"User {current_user.username} terminated session."
    )
    db.session.add(audit)
    db.session.commit()
    
    logout_user()
    flash('Session securely terminated.', 'info')
    return redirect(url_for('auth.login'))
