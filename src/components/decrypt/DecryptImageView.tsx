import React, { useState, useRef } from 'react';
import {
  Unlock,
  KeyRound,
  FileCheck2,
  AlertOctagon,
  Download,
  Eye,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  Cpu,
  FileCode,
} from 'lucide-react';
import {
  decryptImageHybrid,
  base64ToUint8Array,
} from '../../lib/cryptoEngine';
import { vaultStore } from '../../lib/vaultStore';
import { useToast } from '../ui/Toast';
import { EncryptedVaultFile } from '../../types/crypto';

interface DecryptImageViewProps {
  onOpenKeyModal: () => void;
  presetFile?: EncryptedVaultFile | null;
}

export const DecryptImageView: React.FC<DecryptImageViewProps> = ({
  onOpenKeyModal,
  presetFile,
}) => {
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [inputMode, setInputMode] = useState<'upload' | 'select' | 'json'>('upload');
  const [selectedVaultFileId, setSelectedVaultFileId] = useState<string>(
    presetFile ? presetFile.id : ''
  );
  const [rawContainerJson, setRawContainerJson] = useState<string>('');
  const [masterPassword, setMasterPassword] = useState<string>(
    vaultStore.getSessionPassword() || ''
  );
  const [customPrivateKeyPem, setCustomPrivateKeyPem] = useState<string>('');
  const [useCustomKey, setUseCustomKey] = useState<boolean>(false);

  // Decryption state
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);
  const [decryptedImageUrl, setDecryptedImageUrl] = useState<string | null>(null);
  const [decryptedMeta, setDecryptedMeta] = useState<{
    originalFilename: string;
    mimeType: string;
    fileSizeBytes: number;
    sha256Hash: string;
    verifiedTag: string;
    decryptionTimeMs: number;
  } | null>(null);
  const [decryptionError, setDecryptionError] = useState<string | null>(null);
  const [activeEnvelope, setActiveEnvelope] = useState<Partial<EncryptedVaultFile> | null>(
    presetFile || null
  );
  const [copiedHex, setCopiedHex] = useState<boolean>(false);

  const vaultFiles = vaultStore.getFiles();
  const keyBundle = vaultStore.getKeyBundle();

  // Handle uploaded .cvault or JSON container file
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        if (!parsed.ciphertextBase64 || !parsed.wrappedKeyBase64 || !parsed.nonceBase64) {
          throw new Error('Invalid CipherVault container format: Missing required cryptographic payloads.');
        }

        setActiveEnvelope(parsed);
        setRawContainerJson(text);
        setDecryptedImageUrl(null);
        setDecryptionError(null);
        addToast('success', `Container loaded: ${parsed.originalFilename || file.name}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to parse file';
        setDecryptionError(`Envelope parsing error: ${message}`);
        addToast('error', 'Invalid container format');
      }
    };
    reader.readAsText(file);
  };

  // Handle selection from existing vault files
  const handleSelectVaultFile = (fileId: string) => {
    setSelectedVaultFileId(fileId);
    const found = vaultFiles.find((f) => f.id === fileId);
    if (found) {
      setActiveEnvelope(found);
      setDecryptedImageUrl(null);
      setDecryptionError(null);
    }
  };

  // Execute Decryption Pipeline
  const handleExecuteDecryption = async () => {
    if (!activeEnvelope) {
      addToast('error', 'Please provide or select an encrypted container');
      return;
    }

    if (!activeEnvelope.ciphertextBase64 || !activeEnvelope.wrappedKeyBase64 || !activeEnvelope.nonceBase64) {
      addToast('error', 'Incomplete cryptographic package in container');
      return;
    }

    setIsDecrypting(true);
    setDecryptionError(null);
    const startTime = performance.now();

    try {
      let rsaPrivateKey: CryptoKey | string = '';

      if (useCustomKey) {
        if (!customPrivateKeyPem.trim()) {
          throw new Error('Please enter your RSA-3072 Private Key PEM.');
        }
        rsaPrivateKey = customPrivateKeyPem.trim();
      } else {
        if (!keyBundle) {
          throw new Error('No RSA cryptographic key bundle found in current session. Generate or import keys.');
        }
        if (!masterPassword) {
          throw new Error('Master password is required to decrypt and unwrap your stored RSA private key.');
        }

        // Unlock RSA private key using master password
        try {
          const unlockedKey = await vaultStore.unlockPrivateKey(masterPassword);
          rsaPrivateKey = unlockedKey;
        } catch {
          throw new Error('Authentication failed: Master password incorrect or cryptographic key corrupted.');
        }
      }

      // Reconstruct package
      const pkg = {
        ciphertextBase64: activeEnvelope.ciphertextBase64,
        wrappedKeyBase64: activeEnvelope.wrappedKeyBase64,
        nonceBase64: activeEnvelope.nonceBase64,
        authTagBase64: activeEnvelope.authTagBase64 || '',
        sha256CiphertextHash: activeEnvelope.sha256CiphertextHash || '',
        sha256OriginalHash: activeEnvelope.sha256OriginalHash || '',
      };

      // Perform hybrid decryption (Unwrap AES key -> Authenticated AES-256-GCM Decrypt -> Tag Verification)
      const decryptedPayload = await decryptImageHybrid(pkg, rsaPrivateKey);
      const elapsed = Math.round(performance.now() - startTime);

      // Create blob URL for secure preview
      const mime = activeEnvelope.mimeType || 'image/png';
      const blob = new Blob([decryptedPayload.plaintextBytes.buffer as ArrayBuffer], { type: mime });
      const url = URL.createObjectURL(blob);

      setDecryptedImageUrl(url);
      setDecryptedMeta({
        originalFilename: activeEnvelope.originalFilename || 'decrypted_image',
        mimeType: mime,
        fileSizeBytes: decryptedPayload.plaintextBytes.length,
        sha256Hash: decryptedPayload.recoveredSha256 || 'Verified',
        verifiedTag: activeEnvelope.authTagBase64 || 'Verified 128-bit GMAC',
        decryptionTimeMs: elapsed,
      });

      // Audit log entry
      vaultStore.addAuditLog({
        id: `aud_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: vaultStore.getSession()?.userId,
        fileId: activeEnvelope.id || 'direct_upload',
        filename: activeEnvelope.originalFilename || 'unnamed_container',
        action: 'DECRYPTION_SUCCESS',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1 (Client-Side)',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Decrypted ${decryptedPayload.plaintextBytes.length} bytes in ${elapsed}ms via AES-256-GCM. GMAC tag validated.`,
      });

      addToast('success', `Decryption verified successfully in ${elapsed}ms!`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Decryption failed';
      setDecryptionError(message);

      vaultStore.addAuditLog({
        id: `aud_err_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: activeEnvelope.id || 'direct_upload',
        filename: activeEnvelope.originalFilename || 'unknown',
        action: 'DECRYPTION_FAILED',
        status: 'FAILED',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Decryption failure: ${message}`,
      });

      addToast('error', `Decryption aborted: ${message}`);
    } finally {
      setIsDecrypting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="border-b border-[#242424] pb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-widest text-[#B5A27E] uppercase">
              Cryptographic Ingestion
            </span>
            <span className="text-[#444]">·</span>
            <span className="text-xs font-mono text-[#777777] uppercase">Module 02</span>
          </div>
          <h1 className="text-2xl font-light text-white tracking-tight mt-1">
            Image Decryption & GMAC Verification
          </h1>
          <p className="text-xs text-[#888888] mt-1 font-sans">
            Unwrap ephemeral AES-256 symmetric keys using RSA-3072 private key, authenticate 128-bit Galois tag, and recover original image.
          </p>
        </div>

        <button
          onClick={onOpenKeyModal}
          className="self-start md:self-auto px-3.5 py-2 border border-[#333333] bg-[#141414] text-xs font-mono text-[#B5A27E] hover:border-[#B5A27E] transition-colors flex items-center gap-2"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Manage RSA Keys</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Container Input & Key Unlock (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Container Source Selector */}
          <div className="border border-[#242424] bg-[#111111] p-5">
            <label className="text-xs font-mono text-[#B5A27E] tracking-wider uppercase block mb-3">
              1. Select Container Source
            </label>

            <div className="grid grid-cols-3 gap-2 p-1 bg-[#0A0A0A] border border-[#242424] mb-4 text-xs font-mono">
              <button
                type="button"
                onClick={() => setInputMode('upload')}
                className={`py-2 text-center transition-colors ${
                  inputMode === 'upload'
                    ? 'bg-[#242424] text-white font-semibold'
                    : 'text-[#777777] hover:text-white'
                }`}
              >
                Upload File (.cvault)
              </button>
              <button
                type="button"
                onClick={() => setInputMode('select')}
                className={`py-2 text-center transition-colors ${
                  inputMode === 'select'
                    ? 'bg-[#242424] text-white font-semibold'
                    : 'text-[#777777] hover:text-white'
                }`}
              >
                Select from Vault ({vaultFiles.length})
              </button>
              <button
                type="button"
                onClick={() => setInputMode('json')}
                className={`py-2 text-center transition-colors ${
                  inputMode === 'json'
                    ? 'bg-[#242424] text-white font-semibold'
                    : 'text-[#777777] hover:text-white'
                }`}
              >
                Direct JSON
              </button>
            </div>

            {/* Mode 1: File Upload */}
            {inputMode === 'upload' && (
              <div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept=".cvault,.json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-dashed border-[#333333] hover:border-[#B5A27E] bg-[#0E0E0E] p-8 text-center cursor-pointer transition-colors"
                >
                  <Unlock className="w-8 h-8 text-[#B5A27E] mx-auto mb-3" />
                  <p className="text-xs text-white font-medium">
                    Click to select or drop <span className="font-mono text-[#B5A27E]">.cvault</span> container
                  </p>
                  <p className="text-[11px] text-[#666666] mt-1 font-mono">
                    Accepts cryptographic envelope containers generated by CipherVault
                  </p>
                </div>
              </div>
            )}

            {/* Mode 2: Select from Vault */}
            {inputMode === 'select' && (
              <div>
                {vaultFiles.length === 0 ? (
                  <p className="text-xs text-[#777777] p-4 text-center border border-[#242424] bg-[#0A0A0A]">
                    No files found in your local vault. Please encrypt an image first or upload a container.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                    {vaultFiles.map((f) => (
                      <div
                        key={f.id}
                        onClick={() => handleSelectVaultFile(f.id)}
                        className={`p-3 border text-xs cursor-pointer flex items-center justify-between transition-colors ${
                          selectedVaultFileId === f.id
                            ? 'border-[#B5A27E] bg-[#1A1A1A] text-white'
                            : 'border-[#242424] bg-[#0A0A0A] text-[#888888] hover:border-[#444]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <FileCode className="w-4 h-4 text-[#B5A27E]" />
                          <div>
                            <span className="font-semibold text-white block">
                              {f.originalFilename}
                            </span>
                            <span className="text-[10px] text-[#666666] font-mono">
                              AES-256-GCM · {(f.encryptedSizeBytes / 1024).toFixed(1)} KB
                            </span>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono text-[#B5A27E]">
                          {selectedVaultFileId === f.id ? 'SELECTED' : 'SELECT'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Mode 3: Direct JSON input */}
            {inputMode === 'json' && (
              <div>
                <textarea
                  value={rawContainerJson}
                  onChange={(e) => {
                    setRawContainerJson(e.target.value);
                    try {
                      const p = JSON.parse(e.target.value);
                      setActiveEnvelope(p);
                    } catch {}
                  }}
                  rows={4}
                  placeholder='Paste {"ciphertextBase64": "...", "wrappedKeyBase64": "...", "nonceBase64": "..."}'
                  className="w-full bg-[#0A0A0A] border border-[#242424] p-3 text-[11px] font-mono text-[#CCCCCC] focus:outline-none focus:border-[#B5A27E]"
                />
              </div>
            )}
          </div>

          {/* Cryptographic Envelope Manifest */}
          {activeEnvelope && (
            <div className="border border-[#242424] bg-[#111111] p-5">
              <div className="flex items-center justify-between border-b border-[#242424] pb-2 mb-3">
                <span className="text-xs font-mono text-[#B5A27E] tracking-wider uppercase">
                  Envelope Manifest
                </span>
                <span className="text-[10px] font-mono text-[#777777]">
                  {activeEnvelope.id || 'EXTERNAL CONTAINER'}
                </span>
              </div>

              <div className="space-y-2 text-xs font-mono text-[#999999]">
                <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
                  <span className="text-[#666666]">Original Filename:</span>
                  <span className="text-white font-medium">{activeEnvelope.originalFilename || 'unnamed'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
                  <span className="text-[#666666]">Cipher Suite:</span>
                  <span className="text-white">{activeEnvelope.algorithm || 'AES-256-GCM'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
                  <span className="text-[#666666]">Key Wrapping:</span>
                  <span className="text-white">{activeEnvelope.keyWrappingAlgorithm || 'RSA-OAEP-SHA256'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
                  <span className="text-[#666666]">Nonce (IV):</span>
                  <span className="text-white truncate max-w-[200px]" title={activeEnvelope.nonceBase64}>
                    {activeEnvelope.nonceBase64 ? `${activeEnvelope.nonceBase64.substring(0, 16)}...` : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#1A1A1A]">
                  <span className="text-[#666666]">128-bit GMAC Tag:</span>
                  <span className="text-[#B5A27E] truncate max-w-[200px]" title={activeEnvelope.authTagBase64}>
                    {activeEnvelope.authTagBase64 ? `${activeEnvelope.authTagBase64.substring(0, 16)}...` : 'N/A'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Key Authentication & Passphrase */}
          <div className="border border-[#242424] bg-[#111111] p-5">
            <div className="flex items-center justify-between mb-3">
              <label className="text-xs font-mono text-[#B5A27E] tracking-wider uppercase">
                2. Cryptographic Key Unlock
              </label>
              <button
                type="button"
                onClick={() => setUseCustomKey(!useCustomKey)}
                className="text-[10px] font-mono text-[#777777] hover:text-[#B5A27E] underline"
              >
                {useCustomKey ? 'Use Stored Vault Key' : 'Manual PEM Input'}
              </button>
            </div>

            {useCustomKey ? (
              <div>
                <label className="text-[11px] text-[#777777] block mb-1 font-mono">
                  Enter RSA-3072 Private Key (PEM format):
                </label>
                <textarea
                  value={customPrivateKeyPem}
                  onChange={(e) => setCustomPrivateKeyPem(e.target.value)}
                  rows={4}
                  placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                  className="w-full bg-[#0A0A0A] border border-[#242424] p-3 text-[11px] font-mono text-[#CCCCCC] focus:outline-none focus:border-[#B5A27E]"
                />
              </div>
            ) : (
              <div>
                <p className="text-xs text-[#888888] mb-3">
                  Your RSA private key is encrypted at rest using PBKDF2/Scrypt. Enter your master passphrase to unwrap:
                </p>
                <div className="relative">
                  <input
                    type="password"
                    value={masterPassword}
                    onChange={(e) => setMasterPassword(e.target.value)}
                    placeholder="Enter Master Passphrase (e.g. MasterP@ssw0rd!2026)"
                    className="w-full bg-[#0A0A0A] border border-[#242424] px-4 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-[#B5A27E]"
                  />
                </div>
              </div>
            )}

            {/* Execute Button */}
            <button
              onClick={handleExecuteDecryption}
              disabled={isDecrypting || !activeEnvelope}
              className="w-full mt-5 py-3 bg-[#B5A27E] hover:bg-[#c2ad82] text-[#090909] text-xs font-bold tracking-widest uppercase transition-colors flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {isDecrypting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Decrypting & Authenticating GMAC...</span>
                </>
              ) : (
                <>
                  <Unlock className="w-4 h-4" />
                  <span>Execute Cryptographic Decryption</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Decryption Outcome & Image Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {decryptionError && (
            <div className="border border-red-900/60 bg-red-950/20 p-5 text-red-200">
              <div className="flex items-center gap-2 mb-2 font-semibold text-xs tracking-wider uppercase text-red-400">
                <AlertOctagon className="w-4 h-4" />
                <span>Decryption Integrity Violation</span>
              </div>
              <p className="text-xs leading-relaxed font-mono">
                {decryptionError}
              </p>
              <div className="mt-3 pt-3 border-t border-red-900/40 text-[11px] text-red-400/80">
                Possible causes: Tampered ciphertext, corrupted authentication tag, or incorrect private key / passphrase.
              </div>
            </div>
          )}

          {decryptedImageUrl && decryptedMeta ? (
            <div className="border border-[#242424] bg-[#111111] p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-[#242424] pb-3">
                <div className="flex items-center gap-2 text-xs font-mono text-[#B5A27E] uppercase">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Integrity Confirmed</span>
                </div>
                <span className="text-[10px] font-mono text-[#777777]">
                  {decryptedMeta.decryptionTimeMs} ms
                </span>
              </div>

              {/* Decrypted image canvas preview */}
              <div className="border border-[#242424] bg-[#0A0A0A] p-2 flex items-center justify-center min-h-[220px] max-h-[360px] overflow-hidden">
                <img
                  src={decryptedImageUrl}
                  alt={decryptedMeta.originalFilename}
                  className="max-h-[340px] max-w-full object-contain"
                />
              </div>

              {/* Integrity stats */}
              <div className="space-y-1.5 text-[11px] font-mono text-[#888888]">
                <div className="flex justify-between">
                  <span>File:</span>
                  <span className="text-white">{decryptedMeta.originalFilename}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span className="text-white">{(decryptedMeta.fileSizeBytes / 1024).toFixed(1)} KB</span>
                </div>
                <div className="flex justify-between">
                  <span>Format:</span>
                  <span className="text-white">{decryptedMeta.mimeType}</span>
                </div>
                <div className="flex justify-between">
                  <span>GMAC Tag:</span>
                  <span className="text-[#B5A27E]">128-bit Verified</span>
                </div>
              </div>

              {/* Download Action */}
              <a
                href={decryptedImageUrl}
                download={decryptedMeta.originalFilename}
                className="w-full py-2.5 border border-[#B5A27E] bg-[#141414] hover:bg-[#B5A27E] text-[#B5A27E] hover:text-[#090909] text-xs font-mono font-medium tracking-wider uppercase transition-colors flex items-center justify-center gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Decrypted Image</span>
              </a>
            </div>
          ) : (
            <div className="border border-[#242424] bg-[#111111] p-8 text-center">
              <Cpu className="w-8 h-8 text-[#444444] mx-auto mb-3" />
              <h3 className="text-xs font-semibold text-white tracking-wider uppercase">
                Awaiting Cryptographic Payload
              </h3>
              <p className="text-[11px] text-[#777777] mt-1 font-sans max-w-xs mx-auto">
                Select an envelope container on the left, authenticate with your master passphrase, and run decryption to preview the authenticated image.
              </p>
            </div>
          )}

          {/* Cryptographic Standards Note */}
          <div className="border border-[#1E1E1E] bg-[#0A0A0A] p-4 text-[11px] text-[#666666] font-mono space-y-1">
            <span className="text-[#B5A27E] uppercase block font-semibold">
              Security Guarantee:
            </span>
            <p>
              Unlike legacy CBC mode, AES-256-GCM guarantees non-malleability. Any alteration to the ciphertext or nonce will trigger a cryptographic authentication failure before any plaintext is released.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
