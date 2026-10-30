/**
 * CipherVault - Core Cryptographic & Security Type Definitions
 * Strict typing for AES-256-GCM, RSA-3072 OAEP, Key Management, and Audit Logs
 */

export interface UserSession {
  userId: string;
  username: string;
  email: string;
  role: 'analyst' | 'admin' | 'cryptographer';
  keyFingerprint: string;
  token: string;
  loginTimestamp: string;
  ipAddress: string;
}

export interface StoredKeyPair {
  publicKeyPem: string;
  publicKeyFingerprint: string;
  encryptedPrivateKeyBase64: string; // AES-256-GCM encrypted PKCS#8 private key
  privateKeySalt: string;            // Salt for Scrypt/PBKDF2 key derivation
  privateKeyNonce: string;           // 96-bit nonce for private key AES-GCM
  privateKeyTag: string;             // 128-bit authentication tag
  keyLengthBits: number;             // 3072
  createdAt: string;
  algorithm: 'RSA-OAEP-3072';
}

export interface EncryptedVaultFile {
  id: string;
  userId: string;
  originalFilename: string;
  mimeType: string;
  originalSizeBytes: number;
  encryptedSizeBytes: number;
  sha256OriginalHash: string;        // SHA-256 of original plaintext image
  sha256CiphertextHash: string;      // SHA-256 of ciphertext for integrity check
  
  // AES-256-GCM components
  algorithm: 'AES-256-GCM';
  nonceBase64: string;               // 96-bit IV (12 bytes)
  authTagBase64: string;             // 128-bit authentication tag (16 bytes)
  ciphertextBase64: string;          // Encrypted payload
  
  // RSA-3072 Key Wrapping
  wrappedKeyBase64: string;          // 256-bit AES key encrypted with RSA-3072 OAEP
  keyWrappingAlgorithm: 'RSA-OAEP-SHA256';
  rsaKeyFingerprint: string;
  
  // Metadata & Security sanitization
  exifStripped: boolean;
  exifTagsRemovedCount: number;
  verifiedMagicBytes: string;
  createdAt: string;
  lastDecryptedAt?: string;
  isTamperedSimulation?: boolean;
}

export interface SecurityAuditLog {
  id: string;
  timestamp: string;
  eventType: 
    | 'USER_REGISTER'
    | 'USER_LOGIN'
    | 'USER_LOGOUT'
    | 'LOGIN_FAILED'
    | 'KEYPAIR_GENERATED'
    | 'KEY_ROTATION'
    | 'IMAGE_ENCRYPTED'
    | 'IMAGE_DECRYPTED'
    | 'DECRYPTION_SUCCESS'
    | 'DECRYPTION_FAILED'
    | 'INTEGRITY_VERIFIED'
    | 'TAMPER_DETECTED'
    | 'TAMPER_TEST_RUN'
    | 'FILE_DELETED'
    | 'EXIF_SANITIZED'
    | 'MALICIOUS_FILE_REJECTED'
    | 'SECURITY_TEST_SUITE_RUN'
    | 'SYSTEM_AUDIT';
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  userId?: string;
  username?: string;
  ipAddress: string;
  details: string;
  fileId?: string;
  action?: string;
  filename?: string;
  status?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface EncryptionProgress {
  stage: 'idle' | 'validating_magic_bytes' | 'stripping_exif' | 'generating_aes_key' | 'encrypting_payload' | 'wrapping_key_rsa' | 'storing_vault' | 'completed' | 'failed';
  message: string;
  progressPercent: number;
}

export interface DecryptionResult {
  success: boolean;
  dataUrl?: string;
  error?: string;
  decryptionDurationMs: number;
  integrityVerified: boolean;
  recoveredFilename: string;
  mimeType: string;
  recoveredSizeBytes: number;
}

export interface SecurityTestResult {
  id: string;
  name: string;
  category: 'Cryptographic Correctness' | 'Tamper Detection' | 'Access Control' | 'Input Validation' | 'Key Security';
  description: string;
  expectedResult: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  durationMs?: number;
  logs: string[];
  assertionsPassed: number;
  totalAssertions: number;
}
