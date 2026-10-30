/**
 * CipherVault - Isolated Educational Module: DES vs AES-256-GCM Cryptographic Analysis
 * Strictly for academic comparison. Demonstrates why 56-bit DES is obsolete and vulnerable.
 */

export interface AlgorithmSpec {
  name: string;
  keyLengthBits: number;
  blockSizeBits: number;
  structure: string;
  rounds: number;
  authenticatedEncryption: boolean;
  bruteForceComplexity: string;
  timeToCrackModernGpu: string;
  securityMargin: 'BROKEN_INSECURE' | 'LEGACY_DEPRECATED' | 'MILITARY_GRADE';
  primaryVulnerabilities: string[];
}

export const ALGORITHM_SPECS: Record<'DES' | '3DES' | 'AES_256_GCM', AlgorithmSpec> = {
  DES: {
    name: 'Data Encryption Standard (DES)',
    keyLengthBits: 56,
    blockSizeBits: 64,
    structure: '16-round Feistel Network',
    rounds: 16,
    authenticatedEncryption: false,
    bruteForceComplexity: '2^56 ≈ 7.205 × 10^16 possible keys',
    timeToCrackModernGpu: '< 5 minutes (via FPGA cluster or hashcat)',
    securityMargin: 'BROKEN_INSECURE',
    primaryVulnerabilities: [
      'Tiny 56-bit key space trivial to exhaustively brute-force since 1998 (EFF Deep Crack).',
      'Small 64-bit block size vulnerable to Sweet32 collision attacks after only 32 GB of data.',
      'Susceptible to Linear Cryptanalysis (Matsui, 1993) requiring 2^43 known plaintexts.',
      'Lack of message authentication (malleable ciphertext susceptible to bit-flipping attacks).',
      'Officially withdrawn by NIST in 2005 (FIPS 46-3 withdrawal).',
    ],
  },
  '3DES': {
    name: 'Triple DES (3DES / TDEA)',
    keyLengthBits: 112, // Effective 112 bits due to Meet-in-the-Middle attack on 168-bit
    blockSizeBits: 64,
    structure: '48-round Encrypt-Decrypt-Encrypt Feistel',
    rounds: 48,
    authenticatedEncryption: false,
    bruteForceComplexity: '2^112 (effective against Meet-in-the-Middle)',
    timeToCrackModernGpu: 'Impractical today for brute force, but deprecated',
    securityMargin: 'LEGACY_DEPRECATED',
    primaryVulnerabilities: [
      'Still bound by 64-bit block size: vulnerable to Birthday / Sweet32 attacks.',
      'Extremely slow in software (3x computational overhead of DES).',
      'Disallowed by NIST SP 800-131A Rev 2 for all applications since 2023.',
    ],
  },
  AES_256_GCM: {
    name: 'AES-256-GCM (Galois/Counter Mode)',
    keyLengthBits: 256,
    blockSizeBits: 128,
    structure: 'Substitution-Permutation Network (SPN)',
    rounds: 14,
    authenticatedEncryption: true,
    bruteForceComplexity: '2^256 ≈ 1.157 × 10^77 possible keys',
    timeToCrackModernGpu: 'Astronomical (> age of universe across all computers on Earth)',
    securityMargin: 'MILITARY_GRADE',
    primaryVulnerabilities: [
      'Zero known practical cryptanalytic attacks after 25+ years of intense public scrutiny.',
      'Provides Post-Quantum 128-bit security margin against Grover search algorithm.',
      'AEAD (Authenticated Encryption with Associated Data) with 128-bit GMAC authentication tag.',
      'Hardware-accelerated AES-NI instructions in modern CPUs providing gigabyte/sec throughput.',
      'Current NIST FIPS 197 & NSA Suite B standard for Top Secret communications.',
    ],
  },
};

// Calculate Shannon entropy of byte data (0.0 to 8.0 bits/byte)
export function calculateShannonEntropy(bytes: Uint8Array): number {
  if (bytes.length === 0) return 0;
  const frequencies = new Array(256).fill(0);
  for (let i = 0; i < bytes.length; i++) {
    frequencies[bytes[i]]++;
  }

  let entropy = 0;
  const len = bytes.length;
  for (let i = 0; i < 256; i++) {
    if (frequencies[i] > 0) {
      const p = frequencies[i] / len;
      entropy -= p * Math.log2(p);
    }
  }
  return Number(entropy.toFixed(4));
}

// Visual ECB pattern leakage simulation:
// Demonstrates the classic "ECB Penguin" leakage vs GCM pseudorandom diffusion
export function simulateEcbPatternLeakage(width: number = 64, height: number = 64): {
  plaintextPixels: number[];
  ecbCiphertextPixels: number[];
  gcmCiphertextPixels: number[];
} {
  const total = width * height;
  const plaintext = new Array(total).fill(255); // White background

  // Draw a high-contrast geometric vault emblem in the center
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const dx = x - width / 2;
      const dy = y - height / 2;
      const dist = Math.sqrt(dx * dx + dy * dy);
      // Outer ring
      if (dist > 18 && dist < 24) {
        plaintext[y * width + x] = 30; // Dark ring
      }
      // Inner cross
      if (Math.abs(dx) < 4 && Math.abs(dy) < 14) {
        plaintext[y * width + x] = 40;
      }
      if (Math.abs(dy) < 4 && Math.abs(dx) < 14) {
        plaintext[y * width + x] = 40;
      }
    }
  }

  // In ECB mode: identical 8-byte/16-byte blocks map to identical cipher blocks!
  // High pattern redundancy leaks visual shape
  const ecbCipher = new Array(total);
  const blockMapping: Record<number, number> = {
    255: 180, // White plaintext block always maps to same medium-gray cipher block
    30: 45,   // Dark ring block always maps to same dark cipher block
    40: 85,   // Cross block always maps to same slate cipher block
  };

  for (let i = 0; i < total; i++) {
    const val = plaintext[i];
    ecbCipher[i] = blockMapping[val] ?? 128;
    // Add tiny pseudo-deterministic block jitter for realism
    const blockIndex = Math.floor(i / 8);
    ecbCipher[i] = Math.min(255, Math.max(0, ecbCipher[i] + ((blockIndex * 7) % 15) - 7));
  }

  // In AES-GCM: Galois Counter Mode with unique nonce produces pure white noise / uniform distribution
  const gcmCipher = new Array(total);
  for (let i = 0; i < total; i++) {
    // High-entropy pseudorandom uniform noise
    gcmCipher[i] = Math.floor(Math.random() * 256);
  }

  return {
    plaintextPixels: plaintext,
    ecbCiphertextPixels: ecbCipher,
    gcmCiphertextPixels: gcmCipher,
  };
}
