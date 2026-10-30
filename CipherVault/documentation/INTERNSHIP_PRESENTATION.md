# CipherVault: Internship Project Presentation & Technical Briefing

## Title: Secure Image Encryption Using Advanced Cryptographic Algorithms
**Candidate:** Senior Cybersecurity Engineering Intern  
**Project Domain:** Applied Cryptography, Web Application Security, Key Management  
**Supervising Authority:** Security Engineering Review Board  

---

## Slide 1: Problem Statement & Industrial Need
- **The Challenge:** Digital imagery in defense, medical diagnostics, and intellectual property frequently contains sensitive raster data and high-risk operational metadata (GPS tags, device identifiers).
- **The Vulnerability in Legacy Systems:** Many platforms rely on unauthenticated symmetric ciphers (e.g., DES, 3DES, or AES-CBC without MAC), leaving payloads vulnerable to:
  1. Exhaustive keyspace brute-forcing (56-bit DES cracked in minutes).
  2. Malleability and bit-flipping attacks.
  3. Electronic Codebook (ECB) pattern leakage.
  4. OPSEC disclosure via unstripped EXIF headers.

---

## Slide 2: Core Engineering Objectives
1. Implement a **Hybrid Cryptographic Architecture** pairing AES-256-GCM symmetric encryption with RSA-3072 asymmetric key wrapping.
2. Ensure **Authenticated Encryption with Associated Data (AEAD)** to provide simultaneous confidentiality and tamper verification.
3. Protect asymmetric private keys at rest using memory-hard **Scrypt Key Derivation** ($N=16384, r=8, p=1$).
4. Implement proactive **Input Sanitization**: magic byte validation and offscreen rasterization to purge EXIF tags.
5. Provide an **Automated Cryptographic Test Suite** proving mathematical resilience against active attacks.

---

## Slide 3: Technical Architecture & The Envelope Protocol
- **Ephemeral Session Key:** Every image upload triggers generation of a unique 256-bit random AES key via operating system CSPRNG.
- **Nonce Generation:** A 96-bit unique nonce ($IV$) is generated per image. Nonces are NEVER reused under the same key.
- **Key Wrapping:** The AES key is wrapped with the recipient's RSA-3072 public key using Optimal Asymmetric Encryption Padding (OAEP) with SHA-256 and MGF1.
- **Envelope Storage Format (`.cvault`):**
  - Header: Format version & cipher parameters.
  - Nonce: 96-bit initialization vector.
  - Auth Tag: 128-bit Galois Message Authentication Code.
  - Wrapped Key: 384-byte RSA ciphertext.
  - Ciphertext: Bulk encrypted image payload.

---

## Slide 4: Educational Analysis: Why DES is Strictly Obsolete
- **56-bit Key Space:** Only $2^{56} \approx 7.2 \times 10^{16}$ possible keys. Cracked by EFF Deep Crack in 1998 in 56 hours; crackable today in $< 5$ minutes on a modern FPGA cluster.
- **64-bit Block Size:** Sweet32 collision attacks (CVE-2016-2183) compromise ciphertext after only $2^{32}$ blocks (32 GB).
- **AES-256-GCM Contrast:** $2^{256} \approx 1.15 \times 10^{77}$ keys. Quantum resistance with 128-bit Grover search security margin.

---

## Slide 5: Automated Testing & Verification
- 10 automated test suites verifying:
  - Roundtrip decryption byte fidelity ($100\%$ SHA-256 match).
  - Immediate exception on 1-bit ciphertext tampering.
  - Immediate exception on nonce mutation or auth tag corruption.
  - Disguised Windows PE (`MZ`) and Linux ELF executable upload rejection.
  - Cross-user tenant isolation.
