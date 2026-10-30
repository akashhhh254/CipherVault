# CipherVault: System Architecture & Cryptographic Protocols

## 1. Executive Summary

CipherVault is an enterprise-grade cryptographic image vault designed to protect confidential imagery (satellite surveillance, intelligence schematics, biometric captures, proprietary CAD blueprints) across hostile storage and transmission networks.

The application employs a **Hybrid Envelope Encryption Architecture** that isolates high-throughput bulk symmetric streams (AES-256-GCM) from asymmetric key distribution and access governance channels (RSA-3072 OAEP).

---

## 2. Cryptographic Architecture

```
+-----------------------------------------------------------------------------------+
|                              CIPHERVAULT DATA PIPELINE                            |
+-----------------------------------------------------------------------------------+

 [Confidential Image] ──> [Magic Byte Validation] ──> [EXIF & Metadata Sanitizer]
                                                                │
                                                        [Clean Pixel Buffer]
                                                                │
                     +──────────────────────────────────────────┴─────────────────+
                     │                                                            │
                     ▼                                                            ▼
         [Generate Random AES Key]                                  [Read User RSA Public Key]
             (256-bit CSPRNG)                                              (3072-bit SPKI)
                     │                                                            │
                     ├──────────────────────┐                                     │
                     │                      │                                     │
                     ▼                      ▼                                     ▼
        [Generate 96-bit Nonce]    [AES-256-GCM Encrypt]               [RSA-OAEP Wrap AES Key]
                     │                      │                             (SHA-256 / MGF1)
                     │                      │                                     │
                     │                      ▼                                     │
                     │           [Ciphertext + 128-bit Tag]                       │
                     │                      │                                     │
                     +──────────────────────┼─────────────────────────────────────+
                                            │
                                            ▼
                           [.cvault Cryptographic Envelope]
                           ├── Nonce (96 bits)
                           ├── Auth Tag (128 bits)
                           ├── Wrapped AES Key (384 bytes)
                           ├── Ciphertext Stream
                           └── SHA-256 Verification Digest
```

---

## 3. Cryptographic Primitives & Specifications

| Component | Standard / Algorithm | Key Length / Parameters | Rationale |
| :--- | :--- | :--- | :--- |
| **Symmetric Bulk Cipher** | AES-256-GCM | 256 bits, 96-bit IV, 128-bit Tag | Authenticated Encryption with Associated Data (AEAD). Provides confidentiality and mathematical tamper detection. |
| **Asymmetric Key Exchange** | RSA-OAEP | 3072 bits, $e=65537$, SHA-256 | Compliant with NIST SP 800-57 recommendation for security margin beyond 2030 (~128-bit symmetric equivalence). |
| **Key Derivation (KDF)** | Scrypt / Argon2id | $N=16384, r=8, p=1$ | Memory-hard key derivation to resist ASIC/GPU dictionary and brute-force attacks against master passwords. |
| **Password Hashing** | Argon2id | Memory: 64MB, Iterations: 3, Parallelism: 4 | Winner of Password Hashing Competition; immune to side-channel cache attacks and GPU acceleration. |
| **Integrity Digest** | SHA-256 | 256 bits | Fast, cryptographically secure hash for preimage and second preimage resistance. |

---

## 4. Key Management & Protection at Rest

1. **Ephemeral Symmetric Session Keys:**
   - Generated per image using operating system CSPRNG (`crypto.getRandomValues` / `os.urandom`).
   - Plaintext symmetric keys exist solely in transient memory buffers during encryption/decryption routines and are cleared immediately upon task completion.

2. **User RSA-3072 Private Keys:**
   - Never stored in plaintext in any database, filesystem, or log file.
   - Encrypted at rest using AES-256-GCM. The key is derived from the user's master password via Scrypt with a 32-byte unique salt.
   - Decrypted exclusively upon explicit user authentication.

3. **Key Rotation Protocol:**
   - Users can generate a fresh RSA-3072 key pair at any time.
   - Existing encrypted files are re-wrapped using the new public key without needing to re-encrypt bulk ciphertext payloads.
