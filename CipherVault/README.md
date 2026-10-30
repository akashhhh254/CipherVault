# CipherVault: Secure Image Encryption Using Advanced Cryptographic Algorithms

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Python: 3.11+](https://img.shields.io/badge/Python-3.11+-brightgreen.svg)](https://python.org)
[![NIST Standard](https://img.shields.io/badge/NIST-FIPS%20197%20%7C%20SP%20800--38D-cyan.svg)](https://csrc.nist.gov/)
[![Security: AES-256-GCM](https://img.shields.io/badge/Cipher-AES--256--GCM-blue.svg)]()
[![Asymmetric: RSA-3072](https://img.shields.io/badge/Asymmetric-RSA--3072%20OAEP-indigo.svg)]()

> **CipherVault** is a production-oriented cybersecurity project demonstrating hybrid envelope image encryption, asymmetric key wrapping, memory-hard private key protection at rest, EXIF sanitization, authenticated AEAD integrity verification, and automated cryptographic security testing.

---

## Key Features

1. **Hybrid Envelope Cryptography:**
   - **AES-256-GCM:** Authenticated symmetric encryption using unique 256-bit ephemeral keys and 96-bit nonces.
   - **RSA-3072 OAEP:** Asymmetric key wrapping using SHA-256 and MGF1 padding.
2. **Private Key Protection at Rest:**
   - User RSA private keys are encrypted with AES-256-GCM using keys derived from master passwords via **Scrypt** ($N=16384, r=8, p=1$).
3. **OPSEC & Image Ingestion Sanitization:**
   - Validates authentic magic bytes (PNG, JPEG, WebP) and blocks disguised executables (Windows PE `MZ`, Linux ELF).
   - Strips EXIF metadata (GPS coordinates, camera serials, timestamps) via offscreen rasterization.
4. **Adversarial Tamper & AEAD Lab:**
   - Interactive 1-bit flipping and nonce mutation testing, demonstrating mathematical rejection of tampered ciphertexts.
5. **Educational Comparative Cryptanalysis:**
   - Isolated analysis demonstrating why 56-bit DES is obsolete, including visual Electronic Codebook (ECB) pattern leakage simulation and keyspace complexity analysis.
6. **Automated Security Test Suite:**
   - 10 automated test suites with assertions against tampering, wrong-key attacks, cross-user isolation, and executable injection.
7. **Immutable Audit Logging:**
   - SIEM-compatible audit trail recording all cryptographic operations, IP addresses, actor identities, and security alerts.

---

## Directory Structure

```
CipherVault/
├── app/
│   ├── auth/              # User registration, login, Argon2id hashing
│   ├── dashboard/         # Image upload, encryption, decryption, vault view
│   ├── encryption/        # AES-256-GCM, RSA-3072 OAEP, KeyManager
│   ├── decryption/        # Authenticated decryption routines
│   ├── security/          # Image sanitization, tamper detection, audit logs
│   ├── models/            # SQLAlchemy User, EncryptedImage, SecurityAuditLog
│   ├── templates/         # Clean responsive HTML5 views
│   └── static/            # Static assets
├── documentation/
│   ├── ARCHITECTURE.md    # Cryptographic protocols & pipeline diagrams
│   ├── THREAT_MODEL.md    # STRIDE threat model & attack surfaces
│   ├── SECURITY_ASSESSMENT.md # Audit assessment & test results
│   └── INTERNSHIP_PRESENTATION.md # Technical presentation briefing
├── tests/
│   └── test_cryptography.py # Automated pytest security test suite
├── Dockerfile             # Hardened unprivileged production container
├── docker-compose.yml     # Multi-container setup with PostgreSQL
├── requirements.txt       # Python dependencies
├── config.py              # Environment configuration
├── run.py                 # Application entry point
└── README.md
```

---

## Quickstart Guide

### Option 1: Direct Python Execution

```bash
# 1. Clone repository and navigate to directory
cd CipherVault

# 2. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 3. Install dependencies
pip install -r requirements.txt

# 4. Run automated test suite
pytest tests/ -v

# 5. Launch development server
python run.py
```

Server will be running at `http://localhost:5000`.

### Option 2: Docker Deployment

```bash
docker-compose up --build -d
```

---

## Automated Security Testing

Run the automated security regression suite:

```bash
pytest tests/test_cryptography.py -v -s
```

All 10 cryptographic security properties will be evaluated, including 1-bit tampering detection, nonce mutation, RSA key wrapping, and executable upload rejection.
