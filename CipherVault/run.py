from flask import Flask, jsonify, request
import os
import hashlib
import time

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'ciphervault-secure-key-32-bytes')

@app.route('/', methods=['GET'])
def index():
    return jsonify({
        "service": "CipherVault-Backend-Flask",
        "status": "HEALTHY",
        "version": "2.0.0",
        "standard": "NIST SP 800-38D / FIPS 197",
        "algorithms": ["AES-256-GCM", "RSA-3072-OAEP", "Scrypt", "PBKDF2"]
    })

@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        "status": "HEALTHY",
        "service": "CipherVault-Flask-Service",
        "timestamp": time.time()
    })

@app.route('/security/des-benchmark', methods=['GET'])
def des_benchmark():
    return jsonify({
        "des": {
            "algorithm": "DES (Data Encryption Standard)",
            "keyBits": 56,
            "blockBits": 64,
            "keyspace": "72,057,594,037,927,936 (7.2 × 10^16)",
            "historicalBreak": "EFF Deep Crack, July 1998 (56 hours)",
            "modernBreakCost": "$10 - $20 on cloud FPGA cluster (< 5 minutes)",
            "status": "WITHDRAWN / BROKEN (NIST 2005)"
        },
        "aes256": {
            "algorithm": "AES-256-GCM",
            "keyBits": 256,
            "blockBits": 128,
            "keyspace": "1.15 × 10^77",
            "modernBreakCost": "Mathematically impossible with all computing resources on Earth",
            "quantumSafety": "128-bit security margin under Grover’s Algorithm",
            "status": "CURRENT NIST FIPS 197 & NSA TOP SECRET STANDARD"
        }
    })

@app.route('/security/verify-hash', methods=['POST'])
def verify_hash():
    data = request.get_json(silent=True) or {}
    payload = data.get('payload', '')
    expected_hash = data.get('hash', '')
    
    computed_hash = hashlib.sha256(payload.encode('utf-8')).hexdigest()
    is_valid = (computed_hash == expected_hash)
    
    return jsonify({
        "valid": is_valid,
        "computed_sha256": computed_hash,
        "expected_sha256": expected_hash
    })

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port)
