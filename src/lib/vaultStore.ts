/**
 * CipherVault - State Management & Storage Service
 * Manages user session, encrypted vault records, active RSA keys, and audit logging.
 */

import { EncryptedVaultFile, SecurityAuditLog, UserSession } from '../types/crypto';
import { UserKeyPairBundle, unlockPrivateKey as cryptoUnlockPrivateKey } from './cryptoEngine';

const STORAGE_KEYS = {
  USER_SESSION: 'ciphervault_session',
  KEY_BUNDLE: 'ciphervault_key_bundle',
  VAULT_FILES: 'ciphervault_files',
  AUDIT_LOGS: 'ciphervault_audit_logs',
};

// Initial default auditor session
const DEFAULT_SESSION: UserSession = {
  userId: 'usr_sec_99182',
  username: 'Alex_Vance_SecLead',
  email: 'a.vance@ciphervault.internal',
  role: 'cryptographer',
  keyFingerprint: '9f83a21b8c04e57819ad24f63c87e12e0482bca9473210e756c87123aa4b90e1',
  token: 'cv_jwt_sec_8847192847192',
  loginTimestamp: new Date().toISOString(),
  ipAddress: '127.0.0.1 (Client-Side Encrypted)',
};

// Seed audit logs
const INITIAL_AUDIT_LOGS: SecurityAuditLog[] = [
  {
    id: 'log_001',
    timestamp: new Date(Date.now() - 3600000 * 4).toISOString(),
    eventType: 'USER_LOGIN',
    severity: 'INFO',
    userId: DEFAULT_SESSION.userId,
    username: DEFAULT_SESSION.username,
    ipAddress: DEFAULT_SESSION.ipAddress,
    details: 'Mutual TLS and Argon2id session authentication successful.',
  },
  {
    id: 'log_002',
    timestamp: new Date(Date.now() - 3600000 * 3.5).toISOString(),
    eventType: 'KEYPAIR_GENERATED',
    severity: 'INFO',
    userId: DEFAULT_SESSION.userId,
    username: DEFAULT_SESSION.username,
    ipAddress: DEFAULT_SESSION.ipAddress,
    details: 'RSA-3072 key pair provisioned. Private key secured at rest with PBKDF2-SHA256.',
    metadata: { modulus: 3072, publicExponent: 65537 },
  },
  {
    id: 'log_003',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(),
    eventType: 'SECURITY_TEST_SUITE_RUN',
    severity: 'INFO',
    userId: DEFAULT_SESSION.userId,
    username: DEFAULT_SESSION.username,
    ipAddress: DEFAULT_SESSION.ipAddress,
    details: 'Automated 10-point cryptographic regression suite executed. 10/10 assertions verified.',
  },
];

class VaultStore {
  private session: UserSession | null = null;
  private keyBundle: UserKeyPairBundle | null = null;
  private files: EncryptedVaultFile[] = [];
  private auditLogs: SecurityAuditLog[] = [];
  private listeners: Set<() => void> = new Set();
  private sessionPassword: string | null = 'MasterP@ssw0rd!2026';

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    if (typeof window === 'undefined') return;

    try {
      const storedSession = localStorage.getItem(STORAGE_KEYS.USER_SESSION);
      this.session = storedSession ? JSON.parse(storedSession) : DEFAULT_SESSION;

      const storedKeys = localStorage.getItem(STORAGE_KEYS.KEY_BUNDLE);
      this.keyBundle = storedKeys ? JSON.parse(storedKeys) : null;

      const storedFiles = localStorage.getItem(STORAGE_KEYS.VAULT_FILES);
      this.files = storedFiles ? JSON.parse(storedFiles) : [];

      const storedLogs = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
      this.auditLogs = storedLogs ? JSON.parse(storedLogs) : INITIAL_AUDIT_LOGS;
    } catch (e) {
      console.warn('Failed to load vault store from localStorage:', e);
      this.session = DEFAULT_SESSION;
      this.auditLogs = INITIAL_AUDIT_LOGS;
    }
  }

  private saveToStorage() {
    if (typeof window === 'undefined') return;

    try {
      if (this.session) {
        localStorage.setItem(STORAGE_KEYS.USER_SESSION, JSON.stringify(this.session));
      }
      if (this.keyBundle) {
        localStorage.setItem(STORAGE_KEYS.KEY_BUNDLE, JSON.stringify(this.keyBundle));
      }
      localStorage.setItem(STORAGE_KEYS.VAULT_FILES, JSON.stringify(this.files));
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(this.auditLogs));
    } catch (e) {
      console.warn('Failed to persist vault store:', e);
    }
    this.notify();
  }

  private notify() {
    this.listeners.forEach((listener) => listener());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  // Session & Auth
  public getSession(): UserSession | null {
    return this.session;
  }

  public setSession(session: UserSession | null) {
    this.session = session;
    this.saveToStorage();
  }

  public setSessionPassword(pwd: string | null) {
    this.sessionPassword = pwd;
  }

  public getSessionPassword(): string | null {
    return this.sessionPassword;
  }

  // Key Management
  public getKeyBundle(): UserKeyPairBundle | null {
    return this.keyBundle;
  }

  public setKeyBundle(bundle: UserKeyPairBundle) {
    this.keyBundle = bundle;
    if (this.session) {
      this.session.keyFingerprint = bundle.publicKeyFingerprint;
    }
    this.saveToStorage();
  }

  public async unlockPrivateKey(password: string): Promise<CryptoKey> {
    if (!this.keyBundle) {
      throw new Error('No RSA key pair present in current vault session.');
    }
    return cryptoUnlockPrivateKey(this.keyBundle, password);
  }

  // Encrypted Files
  public getFiles(): EncryptedVaultFile[] {
    return [...this.files];
  }

  public getFileById(id: string): EncryptedVaultFile | undefined {
    return this.files.find((f) => f.id === id);
  }

  public addFile(file: EncryptedVaultFile) {
    this.files.unshift(file);
    this.logEvent({
      eventType: 'IMAGE_ENCRYPTED',
      severity: 'INFO',
      details: `File "${file.originalFilename}" (${file.originalSizeBytes} bytes) encrypted via AES-256-GCM. Session key wrapped with RSA-3072.`,
      metadata: {
        fileId: file.id,
        authTag: file.authTagBase64.substring(0, 8) + '...',
        algorithm: file.algorithm,
      },
    });
    this.saveToStorage();
  }

  public deleteFile(id: string) {
    const file = this.getFileById(id);
    if (!file) return;

    this.files = this.files.filter((f) => f.id !== id);
    this.logEvent({
      eventType: 'FILE_DELETED',
      severity: 'WARNING',
      details: `Encrypted file "${file.originalFilename}" (ID: ${file.id}) securely expunged from vault store.`,
    });
    this.saveToStorage();
  }

  public updateFile(file: EncryptedVaultFile) {
    this.files = this.files.map((f) => (f.id === file.id ? file : f));
    this.saveToStorage();
  }

  // Audit Logs
  public getAuditLogs(): SecurityAuditLog[] {
    return [...this.auditLogs];
  }

  public logEvent(event: Omit<SecurityAuditLog, 'id' | 'timestamp' | 'ipAddress' | 'userId' | 'username'>) {
    const newLog: SecurityAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: this.session?.userId,
      username: this.session?.username,
      ipAddress: this.session?.ipAddress || '127.0.0.1 (Localhost)',
      ...event,
    };
    this.auditLogs.unshift(newLog);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    this.saveToStorage();
  }

  public addAuditLog(log: Partial<SecurityAuditLog>) {
    const fullLog: SecurityAuditLog = {
      id: log.id || `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: log.timestamp || new Date().toISOString(),
      eventType: (log.eventType || (log.action as SecurityAuditLog['eventType']) || 'SYSTEM_AUDIT') as SecurityAuditLog['eventType'],
      severity: log.severity || (log.status === 'FAILED' ? 'WARNING' : 'INFO'),
      userId: log.userId || this.session?.userId,
      username: log.username || this.session?.username,
      ipAddress: log.ipAddress || this.session?.ipAddress || '127.0.0.1',
      details: log.details || 'Operational record logged.',
      fileId: log.fileId,
      filename: log.filename,
      action: log.action,
      status: log.status,
      userAgent: log.userAgent,
      metadata: log.metadata,
    };
    this.auditLogs.unshift(fullLog);
    if (this.auditLogs.length > 200) {
      this.auditLogs = this.auditLogs.slice(0, 200);
    }
    this.saveToStorage();
  }

  public clearLogs() {
    this.auditLogs = [];
    this.saveToStorage();
  }
}

export const vaultStore = new VaultStore();
