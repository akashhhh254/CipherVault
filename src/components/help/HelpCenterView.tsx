import React, { useState } from 'react';
import {
  Search,
  BookOpen,
  ShieldCheck,
  KeyRound,
  FileLock2,
  FileCheck2,
  AlertTriangle,
  HelpCircle,
  Cpu,
  ChevronDown,
  ChevronRight,
  Download,
  Unlock,
  CheckCircle2,
} from 'lucide-react';

export const HelpCenterView: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedSection, setExpandedSection] = useState<string>('sec-encrypt-guide');

  const sections = [
    {
      id: 'sec-overview',
      number: '01',
      title: 'Product Architecture & Threat Model',
      category: 'Architecture',
      content: `CipherVault is an enterprise cryptographic image defense platform engineered according to NIST Special Publication 800-38D (Recommendation for Block Cipher Modes of Operation: Galois/Counter Mode) and FIPS 197 (Advanced Encryption Standard). 

Threats Mitigated:
1. Cloud Storage Snooping & Insider Compromise: All image data is encrypted in the browser with an ephemeral 256-bit symmetric key prior to transmission.
2. Metadata Profiling & Location Tracking: Embedded EXIF tags (camera serial numbers, GPS lat/long, altitude, timestamps) are stripped before encryption.
3. Silent Tampering & Malleability: Unauthenticated encryption (such as AES-CBC or AES-CTR without HMAC) is vulnerable to bit-flipping attacks. AES-256-GCM produces a 128-bit authentication tag calculated over Galois field GF(2^128) ensuring absolute integrity.
4. Centralized Key Theft: Private RSA keys are wrapped locally using user-defined master passphrases via high-iteration PBKDF2.`,
    },
    {
      id: 'sec-encrypt-guide',
      number: '02',
      title: 'Step-by-Step Guide: Encrypting an Image',
      category: 'User Manual',
      content: `Follow these exact steps to encrypt any confidential image (PNG, JPG, JPEG, WEBP):

Step 1: Open the 'Encrypt Image' module from the top navigation bar.
Step 2: Drag and drop or browse to select your source image.
Step 3: Magic Byte Validation runs automatically to confirm the binary signature matches the reported MIME type, protecting against polyglot file execution.
Step 4: Check or toggle 'Sanitize EXIF Metadata'. When enabled, the canvas engine re-renders raw raster pixels to a pristine buffer, wiping all GPS coordinates, camera identifiers, and software tags.
Step 5: Click 'Execute Cryptographic Encryption'. 
Step 6: The system generates a cryptographically secure 256-bit AES key and a unique 96-bit CSPRNG IV/nonce.
Step 7: The image binary is encrypted using AES-256-GCM, producing ciphertext and a 128-bit GMAC tag.
Step 8: The 256-bit AES key is encrypted under your RSA-3072 public key using OAEP padding with SHA-256.
Step 9: Download the generated .cvault container file or retain it in your local secure vault.`,
    },
    {
      id: 'sec-decrypt-guide',
      number: '03',
      title: 'Step-by-Step Guide: Decrypting an Image Container (.cvault)',
      category: 'User Manual',
      content: `To recover and verify an encrypted image from a .cvault container:

Step 1: Open the 'Decrypt Image' module from the top navigation bar.
Step 2: Choose your container input method:
   - Upload .cvault file: Drop or select any exported CipherVault container.
   - Select from Vault: Pick an existing record from your current session.
   - Direct JSON: Paste raw JSON cryptographic manifest.
Step 3: Enter your Master Passphrase (default: MasterP@ssw0rd!2026 or your custom password configured during key generation).
Step 4: Click 'Execute Cryptographic Decryption'.
Step 5: The engine unwraps your RSA-3072 private key using your passphrase, decrypts the ephemeral AES-256 key, and invokes AES-256-GCM decryption.
Step 6: The 128-bit Galois tag is verified against the ciphertext. If any single bit was modified in transit, decryption immediately aborts with an integrity violation.
Step 7: If integrity is confirmed, the recovered original image is displayed on screen and made available for high-resolution lossless download.`,
    },
    {
      id: 'sec-hybrid',
      number: '04',
      title: 'Understanding Hybrid Cryptography (AES-256-GCM + RSA-3072)',
      category: 'Cryptography',
      content: `Why not use RSA alone? RSA is computationally expensive and mathematically incapable of directly encrypting data larger than its key modulus minus padding overhead (for RSA-3072 with OAEP-SHA256, maximum direct plaintext is 318 bytes).

Why not use AES alone? Pure symmetric encryption requires both the sender and recipient to share the exact same key beforehand, introducing a severe key distribution hazard.

The Hybrid Solution:
1. Symmetric Speed: Bulk binary image payloads (megabytes in size) are encrypted in milliseconds using hardware-accelerated AES-256-GCM.
2. Asymmetric Distribution: The compact 32-byte AES key is encrypted using RSA-3072 OAEP. Only the possessor of the private key can unwrap the AES key.`,
    },
    {
      id: 'sec-exif',
      number: '05',
      title: 'Why EXIF & Metadata Sanitization is Critical',
      category: 'Privacy',
      content: `Digital cameras, smartphones, and scanners embed Exchangeable Image File Format (EXIF) metadata inside standard JPEG, PNG, and TIFF headers.

Leaked Data Vectors:
- GPS Latitude, Longitude, and Altitude: Pinpoints the exact physical location where classified or private documents were photographed.
- Device Identifiers: Phone model, firmware version, lens serial number.
- Thumbnail Images: Embedded miniature unedited previews that might reveal redacted portions.

CipherVault's Sanitization Pipeline:
Before any cryptographic operations, images undergo canvas-level raster pixel extraction. Only the raw RGB/RGBA pixel matrix is transferred to the encryption buffer, completely stripping all header metadata.`,
    },
    {
      id: 'sec-keymgmt',
      number: '06',
      title: 'Key Management: Master Password & Key Bundles',
      category: 'Cryptography',
      content: `Cryptographic keys are generated client-side using the Web Cryptography API (CSPRNG):

- RSA-3072 Key Pair: Generated with public exponent e = 65537, modulus 3072 bits, and SHA-256 hash algorithm.
- Private Key Protection at Rest: The private key is never stored in plaintext. It is encrypted under AES-256-GCM using a key derived from the user's master passphrase via PBKDF2 (Password-Based Key Derivation Function 2) configured with a minimum of 600,000 SHA-256 iterations and a 16-byte random salt.
- Fingerprints: Public keys have a calculated SHA-256 fingerprint formatted in hex pairs (e.g., 3A:7F:...) for out-of-band verification.`,
    },
    {
      id: 'sec-container',
      number: '07',
      title: 'The .cvault File Format & Manifest',
      category: 'Specifications',
      content: `A .cvault container is a JSON-standardized cryptographic envelope with the following specification:

{
  "version": "1.0",
  "magic": "CVAULT_SEC_V1",
  "originalFilename": "blueprint.png",
  "mimeType": "image/png",
  "algorithm": "AES-256-GCM",
  "keyWrappingAlgorithm": "RSA-OAEP-SHA256",
  "nonceBase64": "96-bit initialization vector",
  "authTagBase64": "128-bit GMAC authentication tag",
  "wrappedKeyBase64": "384-byte RSA encrypted AES key",
  "ciphertextBase64": "AES-256-GCM encrypted image bytes",
  "sha256CiphertextHash": "hex digest of ciphertext",
  "sha256OriginalHash": "hex digest of sanitized image",
  "createdAt": "ISO 8601 timestamp"
}`,
    },
    {
      id: 'sec-tamper-lab',
      number: '08',
      title: 'Adversarial Tamper Detection Lab Guide',
      category: 'Security Testing',
      content: `The Tamper Lab provides an interactive testbed to verify AEAD security guarantees:

1. Select any encrypted file in the vault.
2. Use the byte flipper to flip a single bit in the ciphertext or nonce.
3. Attempt to decrypt the manipulated payload.
4. Result: The cryptographic engine calculates the Galois MAC over the manipulated ciphertext. Because the MAC does not equal the stored 128-bit auth tag, the operation immediately throws 'OperationError: Decryption authentication failed'.
5. Zero decrypted bytes are ever leaked or written to memory when tampering is detected.`,
    },
    {
      id: 'sec-des-obsolete',
      number: '09',
      title: 'Why DES is Obsolete & Banned in Modern Security',
      category: 'Education',
      content: `The Data Encryption Standard (DES) was standardized in 1977 with a 56-bit effective key length (7 bytes).

Why DES is Broken:
1. Tiny Keyspace: 2^56 keys = 72 quadrillion possibilities.
2. Fast Exhaustive Search: In 1999, EFF's 'Deep Crack' machine broke a DES key in 22 hours. Today, modern distributed GPU clusters can crack any DES key in less than a few hours for under $50.
3. Small Block Size (64-bit): Susceptible to birthday attacks and sweet32 collisions after encrypting just ~32 GB of data under the same key.

AES-256 Contrast:
AES-256 has 2^256 possible keys (1.15 x 10^77). Breaking a 256-bit key by brute force would require all the computers on Earth running for billions of times the age of the known universe.`,
    },
    {
      id: 'sec-testing-suite',
      number: '10',
      title: 'Automated 10-Point Security Test Suite Explanation',
      category: 'Verification',
      content: `CipherVault features an automated test runner executing 10 deterministic security validations:

1. AES-256-GCM Roundtrip: Verifies lossless encryption and decryption.
2. Single-Bit Tamper Rejection: Confirms 1-bit ciphertext modification fails GMAC.
3. Nonce Mutation Detection: Asserts changing the IV breaks authentication.
4. Tag Corruption Abort: Confirms altered 128-bit tag halts decryption.
5. RSA-3072 Key Wrapping: Verifies OAEP SHA-256 key encapsulation and unwrapping.
6. Wrong Private Key Rejection: Ensures unauthorized RSA keys cannot unwrap AES keys.
7. Magic Byte Polyglot Defense: Rejects executable files disguised with .png extensions.
8. EXIF Metadata Scrubbing: Verifies stripping of GPS and EXIF markers.
9. CSPRNG Nonce Uniqueness: Verifies 100 consecutive nonces are collision-free.
10. PBKDF2 Master Passphrase Hardening: Confirms correct key derivation resistance.`,
    },
    {
      id: 'sec-auth-zk',
      number: '11',
      title: 'Authentication & Zero-Knowledge Architecture',
      category: 'Architecture',
      content: `Authentication is managed through secure Firebase Authentication with Google Sign-In and institutional RBAC.

Zero-Knowledge Principles:
- The server stores authenticated session tokens and encrypted .cvault records.
- Plaintext images are NEVER transmitted over the wire or stored on backend disks.
- Decryption keys are held in volatile client memory only during active user sessions and are purged on logout.`,
    },
    {
      id: 'sec-offline',
      number: '12',
      title: 'Offline Decryption & Disaster Recovery',
      category: 'Operations',
      content: `Because .cvault files contain the full cryptographic manifest and enveloped key, you can decrypt your images completely offline:

1. Download your .cvault files and export your RSA Private Key PEM.
2. Store your Master Passphrase in an encrypted offline password manager.
3. Even if all internet connectivity is lost or backend servers are offline, your files can be decrypted locally using standard OpenSSL command-line tools or the local CipherVault engine.`,
    },
    {
      id: 'sec-faq',
      number: '13',
      title: 'Frequently Asked Questions (FAQ)',
      category: 'FAQ',
      content: `Q: What image formats are supported?
A: PNG, JPEG, JPG, and WEBP. All images are normalized and validated against header magic bytes.

Q: What happens if I forget my master passphrase?
A: Because CipherVault is a zero-knowledge architecture, no one—not even administrators—can recover your private key without your passphrase. Always store your passphrase in a secure credential manager.

Q: Does encryption reduce image quality?
A: Absolutely not. AES-256-GCM operates on raw binary streams. Decrypted images are byte-for-byte identical to the sanitized original.

Q: Is this system safe against quantum computing threats?
A: AES-256 provides 128 bits of post-quantum security against Grover's algorithm. RSA-3072 is classical; migration to Post-Quantum Cryptography (ML-KEM / Kyber) is on our technical roadmap.`,
    },
    {
      id: 'sec-troubleshooting',
      number: '14',
      title: 'Security Troubleshooting & Error Codes Reference',
      category: 'Troubleshooting',
      content: `Error Reference Table:

- ERR_CIPHER_TAG_MISMATCH: The 128-bit GMAC tag failed verification. The ciphertext has been modified or corrupted.
- ERR_KEY_UNWRAP_FAILED: The RSA private key was unable to unwrap the AES key. Usually caused by an incorrect master passphrase or attempting to decrypt a file encrypted for a different user.
- ERR_INVALID_MAGIC_BYTES: The uploaded file has an image extension, but its first 4-8 bytes do not match PNG/JPEG/WEBP specifications.
- ERR_PASS_DERIVATION: The master passphrase could not decrypt the RSA private key bundle.
- ERR_EXIF_STRIP_FAILURE: Browser canvas context could not render the source image for sanitization.`,
    },
  ];

  const filteredSections = sections.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-[#242424] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-widest text-[#B5A27E] uppercase">
              Operational Documentation
            </span>
            <span className="text-[#444]">·</span>
            <span className="text-xs font-mono text-[#777777] uppercase">Section 11</span>
          </div>
          <h1 className="text-2xl font-light text-white tracking-tight mt-1">
            Help Center & Cryptographic Manual
          </h1>
          <p className="text-xs text-[#888888] mt-1 font-sans">
            Comprehensive 14-section operational guide, cryptographic specifications, troubleshooting matrices, and user manuals.
          </p>
        </div>

        {/* Search Input */}
        <div className="w-full md:w-72 relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#666666]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search manual & FAQs..."
            className="w-full bg-[#111111] border border-[#242424] pl-9 pr-4 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-[#B5A27E] font-mono"
          />
        </div>
      </div>

      {/* Quick Navigation Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 border border-[#242424] bg-[#111111]">
          <span className="text-[#777777] block text-[10px] uppercase">Manual Sections</span>
          <span className="text-white font-semibold text-sm">14 Chapters</span>
        </div>
        <div className="p-3 border border-[#242424] bg-[#111111]">
          <span className="text-[#777777] block text-[10px] uppercase">Standard</span>
          <span className="text-white font-semibold text-sm">NIST SP 800-38D</span>
        </div>
        <div className="p-3 border border-[#242424] bg-[#111111]">
          <span className="text-[#777777] block text-[10px] uppercase">Cipher</span>
          <span className="text-[#B5A27E] font-semibold text-sm">AES-256-GCM</span>
        </div>
        <div className="p-3 border border-[#242424] bg-[#111111]">
          <span className="text-[#777777] block text-[10px] uppercase">Key Wrapping</span>
          <span className="text-white font-semibold text-sm">RSA-3072 OAEP</span>
        </div>
      </div>

      {/* Accordion List */}
      <div className="space-y-3">
        {filteredSections.length === 0 ? (
          <div className="p-8 text-center border border-[#242424] bg-[#111111] text-[#777777] text-xs">
            No documentation sections matched your search query "{searchQuery}".
          </div>
        ) : (
          filteredSections.map((sec) => {
            const isExpanded = expandedSection === sec.id;
            return (
              <div
                key={sec.id}
                className={`border transition-colors ${
                  isExpanded
                    ? 'border-[#B5A27E]/80 bg-[#141414]'
                    : 'border-[#242424] bg-[#0E0E0E] hover:border-[#333333]'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setExpandedSection(isExpanded ? '' : sec.id)}
                  className="w-full p-4 flex items-center justify-between text-left focus:outline-none"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-[#B5A27E] font-bold">
                      {sec.number}
                    </span>
                    <span className="text-xs font-mono text-[#666666] uppercase px-1.5 py-0.5 border border-[#222]">
                      {sec.category}
                    </span>
                    <span className="text-xs sm:text-sm font-medium text-white tracking-wide">
                      {sec.title}
                    </span>
                  </div>
                  <div className="text-[#777777]">
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-[#B5A27E]" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-6 pb-6 pt-2 border-t border-[#1F1F1F] text-xs text-[#AAAAAA] leading-relaxed font-sans whitespace-pre-line">
                    {sec.content}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Standards Certification Footer Box */}
      <div className="p-5 border border-[#242424] bg-[#111111] flex flex-col md:flex-row items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-[#B5A27E]" />
          <div>
            <span className="text-white font-semibold">Institutional Cryptographic Guarantee</span>
            <p className="text-[11px] text-[#777777]">
              Adheres to strict Zero-Knowledge Architecture, client-side encryption, and deterministic AEAD verification.
            </p>
          </div>
        </div>

        <div className="text-right text-[11px] text-[#888888]">
          <span>Security Clearance Level: </span>
          <span className="text-[#B5A27E] font-semibold">ENTERPRISE-CONFIDENTIAL</span>
        </div>
      </div>
    </div>
  );
};
