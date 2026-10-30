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
import { Input } from '../ui/Input';

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
4. Centralized Key Theft: Private RSA keys are wrapped locally using user-defined master passphrases via high-iteration PBKDF2/Scrypt.`,
    },
    {
      id: 'sec-encrypt-guide',
      number: '02',
      title: 'Step-by-Step Guide: Encrypting an Image',
      category: 'User Manual',
      content: `Follow these exact steps to encrypt any confidential image (PNG, JPG, JPEG, WEBP):

Step 1: Open the 'Encrypt' module from the top navigation bar.
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

Step 1: Open the 'Decrypt' module from the navigation bar.
Step 2: Choose your input mode: upload a .cvault container, select from saved vault files, or paste raw JSON.
Step 3: Enter your Master Passphrase to unlock your protected local RSA-3072 private key.
Step 4: Click 'Decrypt & Authenticate Container'.
Step 5: The engine unwraps the symmetric AES session key using RSA-3072 OAEP.
Step 6: WebCrypto validates the 128-bit Galois authentication tag. If even 1 bit in ciphertext or nonce was modified in transit, decryption will fail immediately with OperationError.
Step 7: If authentication passes, original image bytes are reconstructed with 100% byte-exact SHA-256 integrity match.
Step 8: Click 'Download Image' to save your pristine restored photo.`,
    },
    {
      id: 'sec-tamper-lab',
      number: '04',
      title: 'Understanding the Adversarial Tamper Lab',
      category: 'Security Verification',
      content: `Why does AES-256-GCM prevent tampering?
Unlike legacy block modes (such as CBC without HMAC), Galois/Counter Mode (GCM) is an Authenticated Encryption with Associated Data (AEAD) algorithm.

How to verify this yourself in the Tamper Lab:
1. Select an encrypted image package.
2. Click '1-Bit Ciphertext Flip' to mutate byte 0x04.
3. Click 'Attempt Authenticated Decryption'.
4. Observe the result: The browser's native WebCrypto subsystem detects that the computed Galois hash differs from the 128-bit tag, throwing an OperationError and aborting decryption before any corrupt bytes can be passed to memory.`,
    },
    {
      id: 'sec-des-obsolescence',
      number: '05',
      title: 'Why 56-bit DES is Obsolete & Insecure',
      category: 'Cryptanalysis',
      content: `The Data Encryption Standard (DES) was standardized in 1977 with a 56-bit key length and 64-bit block size.

Reasons DES is strictly prohibited in modern systems:
1. Insufficient Keyspace (56 bits): Total possible keys are 2^56 (approx 72 quadrillion). Modern GPU/FPGA clusters exhaust this in under 5 minutes for ~$20.
2. Short 64-bit Block Size: Vulnerable to Sweet32 birthday collision attacks after processing just 32 GB of data.
3. Electronic Codebook (ECB) Leakage: Identical 64-bit plaintext blocks map to identical ciphertext blocks, visibly leaking image structures and silhouettes.
NIST officially withdrew DES in 2005 and disallowed Triple-DES (3DES) in 2023.`,
    },
    {
      id: 'sec-key-mgmt',
      number: '06',
      title: 'Key Lifecycle, Passphrases & At-Rest Protection',
      category: 'Key Management',
      content: `Your private RSA key never exists in plaintext in unencrypted storage.

Key Protection Architecture:
- Key Generation: WebCrypto generates an RSA-PSS/OAEP key pair with a 3072-bit modulus and public exponent e=65537.
- Key Derivation: When you set a Master Passphrase, PBKDF2/Scrypt derives a 256-bit AES key using high computational iterations and a unique salt.
- Private Key Wrap at Rest: The PKCS#8 private key binary is encrypted using AES-256-GCM. Only entering your master passphrase can temporarily unwrap the key in browser memory.
- Key Backup: You can export an encrypted .cvaultkey envelope to transfer your cryptographic identity securely.`,
    },
  ];

  const filteredSections = sections.filter((s) => {
    const q = searchQuery.toLowerCase();
    return (
      s.title.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.content.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-[#666666] mb-1">
            <span>Documentation &amp; User Manual</span>
            <span aria-hidden="true">·</span>
            <span>Cryptographic Architecture</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            CipherVault Help Center
          </h1>
          <p className="text-sm text-[#666666] mt-1 max-w-2xl leading-relaxed">
            Step-by-step operational workflows, mathematical threat models, and architectural specifications for enterprise image encryption.
          </p>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search documentation..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Accordion Sections */}
      <div className="space-y-3">
        {filteredSections.map((section) => {
          const isExpanded = expandedSection === section.id;
          return (
            <div
              key={section.id}
              className="border border-[#E5E5E5] bg-white rounded-xl shadow-xs overflow-hidden"
            >
              <button
                onClick={() => setExpandedSection(isExpanded ? '' : section.id)}
                className="w-full p-5 text-left flex items-center justify-between gap-4 hover:bg-[#FAFAFA] transition-colors cursor-pointer"
                aria-expanded={isExpanded}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <span className="font-mono text-xs font-bold text-[#888888] shrink-0">
                    {section.number}
                  </span>
                  <div className="min-w-0">
                    <div className="font-bold text-sm sm:text-base text-[#111111] truncate">
                      {section.title}
                    </div>
                    <div className="text-[11px] text-[#666666] mt-0.5">{section.category}</div>
                  </div>
                </div>

                <div className="shrink-0 text-[#888888]">
                  {isExpanded ? (
                    <ChevronDown className="w-5 h-5 text-[#111111]" />
                  ) : (
                    <ChevronRight className="w-5 h-5" />
                  )}
                </div>
              </button>

              {isExpanded && (
                <div className="p-5 border-t border-[#E5E5E5] bg-[#F7F7F7] text-xs sm:text-sm text-[#111111] leading-relaxed whitespace-pre-line font-normal">
                  {section.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
