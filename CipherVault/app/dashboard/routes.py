"""
CipherVault - Dashboard, Image Ingestion, and Decryption Routes
"""

import os
import uuid
import hashlib
import json
from flask import Blueprint, render_template, request, flash, redirect, url_for, send_file, current_app, jsonify, abort
from flask_login import login_required, current_user
from ..models import db, EncryptedImage, SecurityAuditLog
from ..security.image_sanitizer import ImageSanitizer
from ..encryption.aes_gcm import AESGCMCipher
from ..encryption.rsa_oaep import RSAOAEPWrapper
from ..encryption.key_manager import KeyManager

dashboard_bp = Blueprint('dashboard', __name__)

@dashboard_bp.route('/')
@login_required
def index():
    images = EncryptedImage.query.filter_by(user_id=current_user.id).order_by(EncryptedImage.created_at.desc()).all()
    total_bytes = sum(img.encrypted_size_bytes for img in images)
    return render_template('dashboard/index.html', images=images, total_bytes=total_bytes)

@dashboard_bp.route('/upload', methods=['GET', 'POST'])
@login_required
def upload():
    if request.method == 'POST':
        if 'image' not in request.files:
            flash('No image file payload provided.', 'danger')
            return redirect(request.url)
            
        file = request.files['image']
        if file.filename == '':
            flash('No file selected.', 'danger')
            return redirect(request.url)
            
        raw_bytes = file.read()
        
        # Step 1: Magic byte validation
        is_valid, mime, msg = ImageSanitizer.validate_magic_bytes(raw_bytes)
        if not is_valid:
            audit = SecurityAuditLog(
                user_id=current_user.id,
                username=current_user.username,
                ip_address=request.remote_addr or '127.0.0.1',
                event_type='MALICIOUS_FILE_REJECTED',
                severity='CRITICAL',
                details=f"Rejected malicious upload attempt: {file.filename} ({msg})"
            )
            db.session.add(audit)
            db.session.commit()
            flash(f"Upload Rejected: {msg}", 'danger')
            return redirect(request.url)
            
        # Step 2: EXIF Sanitization & Re-encoding
        try:
            sanitized_bytes, report = ImageSanitizer.sanitize_and_strip_exif(raw_bytes, target_format="PNG")
        except Exception as exc:
            flash(f"Sanitization Failed: {str(exc)}", 'danger')
            return redirect(request.url)
            
        # Step 3: Hybrid AES-256-GCM + RSA-3072 Encryption
        sha256_original = hashlib.sha256(sanitized_bytes).hexdigest()
        aes_session_key = AESGCMCipher.generate_key()
        nonce, ciphertext, auth_tag = AESGCMCipher.encrypt(aes_session_key, sanitized_bytes)
        sha256_cipher = hashlib.sha256(ciphertext).hexdigest()
        
        # Step 4: RSA Key Wrapping
        public_key = RSAOAEPWrapper.load_public_key(current_user.public_key_pem)
        wrapped_key = RSAOAEPWrapper.wrap_key(public_key, aes_session_key)
        
        # Step 5: Save ciphertext securely outside web root
        file_id = str(uuid.uuid4())
        storage_path = os.path.join(current_app.config['UPLOAD_FOLDER'], f"{file_id}.enc")
        with open(storage_path, 'wb') as f:
            f.write(ciphertext)
            
        # Step 6: Create database record
        image_record = EncryptedImage(
            id=file_id,
            user_id=current_user.id,
            original_filename=file.filename,
            mime_type=report['mime_type'],
            original_size_bytes=len(raw_bytes),
            encrypted_size_bytes=len(ciphertext),
            sha256_original_hash=sha256_original,
            sha256_ciphertext_hash=sha256_cipher,
            algorithm='AES-256-GCM',
            nonce=nonce,
            auth_tag=auth_tag,
            wrapped_aes_key=wrapped_key,
            ciphertext_path=storage_path,
            exif_stripped=True,
            tags_stripped_count=report['exif_tags_stripped']
        )
        db.session.add(image_record)
        
        audit = SecurityAuditLog(
            user_id=current_user.id,
            username=current_user.username,
            ip_address=request.remote_addr or '127.0.0.1',
            event_type='IMAGE_ENCRYPTED',
            severity='INFO',
            details=f"Encrypted '{file.filename}' via AES-256-GCM. Wrapped key with RSA-3072."
        )
        db.session.add(audit)
        db.session.commit()
        
        flash('Confidential image successfully sanitized, encrypted, and stored in vault.', 'success')
        return redirect(url_for('dashboard.index'))
        
    return render_template('dashboard/upload.html')

@dashboard_bp.route('/decrypt/<image_id>', methods=['POST'])
@login_required
def decrypt(image_id):
    image = EncryptedImage.query.filter_by(id=image_id, user_id=current_user.id).first_or_404()
    password = request.form.get('password', '').strip()
    
    if not password:
        flash('Master password required to unlock RSA private key.', 'danger')
        return redirect(url_for('dashboard.index'))
        
    try:
        # Step 1: Unlock private key
        private_key = KeyManager.unlock_private_key(
            current_user.private_key_salt,
            current_user.private_key_nonce,
            current_user.encrypted_private_key,
            current_user.private_key_auth_tag,
            password
        )
        
        # Step 2: Unwrap AES key
        aes_key = RSAOAEPWrapper.unwrap_key(private_key, image.wrapped_aes_key)
        
        # Step 3: Read ciphertext and decrypt with AES-256-GCM
        with open(image.ciphertext_path, 'rb') as f:
            ciphertext = f.read()
            
        plaintext = AESGCMCipher.decrypt(aes_key, image.nonce, ciphertext, image.auth_tag)
        
        # Verify SHA-256 integrity
        recovered_sha = hashlib.sha256(plaintext).hexdigest()
        if recovered_sha != image.sha256_original_hash:
            raise ValueError("Integrity check failed: Plaintext SHA-256 mismatch!")
            
        import io
        return send_file(
            io.BytesIO(plaintext),
            mimetype=image.mime_type,
            as_attachment=True,
            download_name=f"decrypted_{image.original_filename}"
        )
    except Exception as exc:
        audit = SecurityAuditLog(
            user_id=current_user.id,
            username=current_user.username,
            ip_address=request.remote_addr or '127.0.0.1',
            event_type='TAMPER_DETECTED',
            severity='CRITICAL',
            details=f"Decryption failed for image {image.id}: {str(exc)}"
        )
        db.session.add(audit)
        db.session.commit()
        flash(f"Decryption Error: {str(exc)}", 'danger')
        return redirect(url_for('dashboard.index'))
