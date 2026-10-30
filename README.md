# CipherVault: Secure Image Encryption Using Advanced Cryptographic Algorithms

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Runtime: Node.js 22](https://img.shields.io/badge/Runtime-Node.js%2022-brightgreen.svg)]()
[![NIST Standard](https://img.shields.io/badge/NIST-FIPS%20197%20%7C%20SP%20800--38D-cyan.svg)](https://csrc.nist.gov/)
[![Security: AES-256-GCM](https://img.shields.io/badge/Cipher-AES--256--GCM-blue.svg)]()
[![Asymmetric: RSA-3072](https://img.shields.io/badge/Asymmetric-RSA--3072%20OAEP-indigo.svg)]()

> **CipherVault** is a production-oriented cybersecurity platform demonstrating hybrid envelope image encryption, asymmetric key wrapping, memory-hard private key protection at rest, EXIF sanitization, authenticated AEAD integrity verification, and automated cryptographic security testing.

---

## Key Features

1. **Hybrid Envelope Cryptography:**
   - **AES-256-GCM:** Authenticated symmetric encryption using unique 256-bit ephemeral keys and 96-bit nonces.
   - **RSA-3072 OAEP:** Asymmetric key wrapping using SHA-256 and MGF1 padding.
2. **Private Key Protection at Rest:**
   - User RSA private keys are encrypted with AES-256-GCM using keys derived from master passwords via **PBKDF2/Scrypt** work factors.
3. **OPSEC & Image Ingestion Sanitization:**
   - Validates authentic magic bytes (PNG, JPEG, WebP) and blocks disguised executables (Windows PE `MZ`, Linux ELF).
   - Strips EXIF metadata (GPS coordinates, camera serials, timestamps) via offscreen rasterization.
4. **Adversarial Tamper & AEAD Lab:**
   - Interactive 1-bit flipping and nonce mutation testing, demonstrating mathematical rejection of tampered ciphertexts.
5. **Educational Comparative Cryptanalysis:**
   - Isolated analysis demonstrating why 56-bit DES is obsolete, including visual Electronic Codebook (ECB) pattern leakage simulation and keyspace complexity analysis.
6. **Automated Security Test Suite:**
   - Automated cryptographic test suites with assertions against tampering, wrong-key attacks, cross-user isolation, and executable injection.
7. **Immutable Audit Logging:**
   - SIEM-compatible audit trail recording all cryptographic operations, IP addresses, actor identities, and security alerts.

---

## Running in AI Studio / Local

```bash
# Install dependencies
npm install

# Run dev server on port 3000
npm run dev

# Run build
npm run build
```
