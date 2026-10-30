# CipherVault: Threat Model & Security Posture

## 1. Threat Modeling Methodology

CipherVault utilizes the Microsoft **STRIDE** methodology (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) combined with NIST Special Publication 800-30 framework to establish its security posture.

---

## 2. Identified Assets

1. **Confidential Plaintext Images:** Raw unencrypted imagery uploaded by authorized analysts.
2. **User Private Keys:** 3072-bit RSA private keys governing decryption authority.
3. **AES Session Keys:** 256-bit symmetric keys governing bulk payload confidentiality.
4. **User Credentials & Hash Digests:** Master passwords and Argon2id hash records.
5. **Security Audit Log Records:** Append-only chronological trace of access events and tamper detections.

---

## 3. Threat Actors & Capabilities

| Threat Actor | Motivation | Capabilities |
| :--- | :--- | :--- |
| **Untrusted Storage Provider / Cloud Host** | Mass data harvesting, insider eavesdropping | Physical and logical access to disk volumes, database files, and network traffic. |
| **Active Network Man-in-the-Middle (MitM)** | Intercept and manipulate transmitted payloads | Packet inspection, bit-flipping, session hijacking, replay attacks. |
| **Malicious Authenticated User (Tenant)** | Cross-tenant espionage | Valid system access attempting privilege escalation and unauthorized file decryption. |
| **External Cyber Adversary** | Remote code execution, credential compromise | Submitting crafted image files with embedded executable payloads, exploiting web vulnerabilities. |

---

## 4. STRIDE Threat Analysis & Mitigations

### A. Spoofing Identity
- **Threat:** Adversary submits stolen credentials or forged tokens to impersonate legitimate cryptographers.
- **Mitigations:**
  - Memory-hard Argon2id password hashing prevents dictionary attacks on breached databases.
  - Rate limiting (60 requests/minute per IP) halts credential stuffing.
  - HttpOnly, Secure, SameSite session cookies prevent cross-site token theft.

### B. Tampering with Data
- **Threat:** Adversary modifies ciphertext blocks, alters metadata, or swaps out nonces to induce controlled plaintext corruption or bypass authentication.
- **Mitigations:**
  - **AES-256-GCM AEAD Tag Enforcement:** Any 1-bit alteration in ciphertext, nonce, or tag causes `crypto.subtle.decrypt` / `AESGCM.decrypt` to raise an immediate `InvalidTag` exception.
  - Zero plaintext bytes are output when authentication tag validation fails.

### C. Repudiation
- **Threat:** User performs unauthorized file deletion or attempts to access restricted files and denies action.
- **Mitigations:**
  - Immutable Security Audit Trail logging all actions with UTC timestamps, client IP addresses, actor identities, and cryptographic checksums.

### D. Information Disclosure
- **Threat:** Eavesdropping on storage volumes or memory dumps to extract plaintext imagery or keys.
- **Mitigations:**
  - Zero plaintext images stored to persistent disk.
  - RSA private keys protected at rest using Scrypt KDF + AES-256-GCM encryption.
  - EXIF metadata (GPS coordinates, camera serials) purged via canvas re-rasterization before encryption.

### E. Denial of Service (DoS)
- **Threat:** Submitting gigabyte-sized files or decompression bombs to exhaust server memory and CPU.
- **Mitigations:**
  - Strict 25 MB content length threshold enforced at reverse proxy and application layer.
  - Magic byte validation immediately rejects non-image containers before allocating decoding buffers.

### F. Elevation of Privilege
- **Threat:** User B attempts to decrypt User A's confidential file.
- **Mitigations:**
  - Database row-level ownership validation on every file route.
  - Cryptographic mathematical boundary: User A's AES session key is wrapped with User A's RSA public key; User B's private key cannot decrypt it.
