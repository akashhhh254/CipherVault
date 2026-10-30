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
  Upload,
  FileCode,
  Lock,
  CheckCircle2,
} from 'lucide-react';
import {
  decryptImageHybrid,
  unlockPrivateKey,
  base64ToUint8Array,
} from '../../lib/cryptoEngine';
import { vaultStore } from '../../lib/vaultStore';
import { useToast } from '../ui/Toast';
import { EncryptedVaultFile } from '../../types/crypto';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

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
    vaultStore.getSessionPassword() || 'MasterP@ssw0rd!2026'
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

        const ciphertext = parsed.ciphertextBase64 || parsed.ciphertext_base64;
        const wrappedKey = parsed.wrappedKeyBase64 || parsed.wrapped_key_base64;
        const nonce = parsed.nonceBase64 || parsed.nonce_base64;
        const authTag = parsed.authTagBase64 || parsed.auth_tag_base64;

        if (!ciphertext || !wrappedKey || !nonce) {
          throw new Error('Invalid CipherVault container format: Missing required cryptographic payloads.');
        }

        const normalized: Partial<EncryptedVaultFile> = {
          originalFilename: parsed.originalFilename || parsed.original_filename || file.name.replace('.cvault', ''),
          mimeType: parsed.mimeType || parsed.mime_type || 'image/png',
          algorithm: parsed.algorithm || 'AES-256-GCM',
          keyWrappingAlgorithm: parsed.keyWrappingAlgorithm || parsed.key_wrapping || 'RSA-OAEP-SHA256',
          rsaKeyFingerprint: parsed.rsaKeyFingerprint || parsed.recipient_fingerprint || '',
          nonceBase64: nonce,
          authTagBase64: authTag || '',
          wrappedKeyBase64: wrappedKey,
          ciphertextBase64: ciphertext,
          sha256OriginalHash: parsed.sha256OriginalHash || parsed.sha256_original_hash || '',
          sha256CiphertextHash: parsed.sha256CiphertextHash || parsed.sha256_ciphertext_hash || '',
        };

        setActiveEnvelope(normalized);
        setRawContainerJson(text);
        setDecryptedImageUrl(null);
        setDecryptionError(null);
        addToast('success', 'Container Loaded', `Loaded ${normalized.originalFilename}`);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Failed to parse file';
        setDecryptionError(`Envelope parsing error: ${message}`);
        addToast('error', 'Invalid Container', message);
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

  // Execute Decryption
  const handleExecuteDecryption = async () => {
    if (!activeEnvelope || !activeEnvelope.ciphertextBase64 || !activeEnvelope.wrappedKeyBase64) {
      setDecryptionError('No cryptographic package loaded to decrypt.');
      return;
    }

    setIsDecrypting(true);
    setDecryptionError(null);
    setDecryptedImageUrl(null);
    setDecryptedMeta(null);

    const startTime = performance.now();

    try {
      let privateKeyToUse: CryptoKey | string;

      if (useCustomKey) {
        if (!customPrivateKeyPem.trim()) {
          throw new Error('Please provide the raw PKCS#8 RSA private key PEM.');
        }
        privateKeyToUse = customPrivateKeyPem.trim();
      } else {
        if (!keyBundle) {
          throw new Error('No RSA key pair found in active session. Generate or import a key pair.');
        }
        if (!masterPassword.trim()) {
          throw new Error('Master Passphrase is required to unlock your protected RSA-3072 private key.');
        }

        // Unlock memory-hard protected key
        privateKeyToUse = await unlockPrivateKey(keyBundle, masterPassword.trim());
      }

      // Reconstruct full package if needed
      const pkgToDecrypt = {
        ciphertextBase64: activeEnvelope.ciphertextBase64,
        nonceBase64: activeEnvelope.nonceBase64 || '',
        authTagBase64: activeEnvelope.authTagBase64 || '',
        wrappedKeyBase64: activeEnvelope.wrappedKeyBase64,
        sha256OriginalHash: activeEnvelope.sha256OriginalHash || '',
        sha256CiphertextHash: activeEnvelope.sha256CiphertextHash || '',
      };

      const result = await decryptImageHybrid(pkgToDecrypt, privateKeyToUse);
      const endTime = performance.now();

      // Convert recovered bytes to viewable Blob
      const mime = activeEnvelope.mimeType || 'image/png';
      const blob = new Blob([result.plaintextBytes as Uint8Array<ArrayBuffer>], { type: mime });
      const objectUrl = URL.createObjectURL(blob);

      setDecryptedImageUrl(objectUrl);
      setDecryptedMeta({
        originalFilename: activeEnvelope.originalFilename || 'recovered_image.png',
        mimeType: mime,
        fileSizeBytes: result.plaintextBytes.length,
        sha256Hash: result.recoveredSha256,
        verifiedTag: activeEnvelope.authTagBase64 || 'GF(2^128) Validated',
        decryptionTimeMs: Math.round(endTime - startTime),
      });

      // Audit log success
      vaultStore.addAuditLog({
        id: `aud_dec_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: activeEnvelope.id || 'decrypted_container',
        filename: activeEnvelope.originalFilename || 'container',
        action: 'DECRYPTION_SUCCESS',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Authenticated AES-256-GCM decryption completed in ${Math.round(endTime - startTime)}ms. Integrity verified.`,
      });

      addToast('success', 'Decryption Successful', '128-bit authentication tag verified byte-exact integrity.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Cryptographic decryption failed';
      setDecryptionError(message);

      // Audit log failure
      vaultStore.addAuditLog({
        id: `aud_fail_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: activeEnvelope.id || 'unknown',
        filename: activeEnvelope.originalFilename || 'unknown',
        action: 'DECRYPTION_INTEGRITY_FAILURE',
        status: 'FAILED',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Decryption rejection: ${message}`,
      });

      addToast('error', 'Decryption Failed', message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDownloadDecryptedImage = () => {
    if (!decryptedImageUrl || !decryptedMeta) return;
    const a = document.createElement('a');
    a.href = decryptedImageUrl;
    a.download = `restored_${decryptedMeta.originalFilename}`;
    a.click();
    addToast('info', 'Image Downloaded', `Saved ${decryptedMeta.originalFilename}`);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans">
      {/* Page Header */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <div className="flex items-center gap-2 text-xs text-[#666666] mb-1 font-mono">
          <span>AES-256-GCM AEAD</span>
          <span aria-hidden="true">·</span>
          <span>Galois Tag Verification</span>
          <span aria-hidden="true">·</span>
          <span>RSA-3072 Unwrapping</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          Decrypt Container
        </h1>
        <p className="text-sm text-[#666666] mt-1 max-w-2xl leading-relaxed">
          Authenticate and decrypt a CipherVault container file. The engine validates the 128-bit authentication tag over GF(2¹²⁸), unwraps the symmetric AES session key, and restores the pristine image.
        </p>
      </div>

      {/* Mode Selector Tabs */}
      <div className="flex items-center gap-1 p-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg">
        <button
          onClick={() => setInputMode('upload')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
            inputMode === 'upload'
              ? 'bg-white text-[#111111] font-semibold shadow-xs'
              : 'text-[#666666] hover:text-[#111111]'
          }`}
        >
          Upload .cvault File
        </button>
        <button
          onClick={() => setInputMode('select')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
            inputMode === 'select'
              ? 'bg-white text-[#111111] font-semibold shadow-xs'
              : 'text-[#666666] hover:text-[#111111]'
          }`}
        >
          Select from Vault ({vaultFiles.length})
        </button>
        <button
          onClick={() => setInputMode('json')}
          className={`flex-1 py-2 text-xs font-medium rounded-md transition-colors cursor-pointer text-center ${
            inputMode === 'json'
              ? 'bg-white text-[#111111] font-semibold shadow-xs'
              : 'text-[#666666] hover:text-[#111111]'
          }`}
        >
          Paste Raw JSON
        </button>
      </div>

      {/* Input Selection Content */}
      <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 shadow-xs space-y-6">
        {inputMode === 'upload' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-[#E5E5E5] hover:border-[#CCCCCC] rounded-lg p-8 text-center cursor-pointer bg-[#FAFAFA] hover:bg-[#F5F5F5] transition-colors"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".cvault,.json"
              className="hidden"
              onChange={handleFileUpload}
            />
            <div className="w-10 h-10 rounded-full bg-white border border-[#E5E5E5] flex items-center justify-center mx-auto text-[#111111] mb-3 shadow-xs">
              <Upload className="w-5 h-5" />
            </div>
            <div className="text-sm font-semibold text-[#111111]">
              Select CipherVault container (.cvault or .json)
            </div>
            <div className="text-xs text-[#666666] mt-1">
              Click to browse your local files
            </div>
          </div>
        )}

        {inputMode === 'select' && (
          <div className="space-y-3">
            <label className="block text-xs font-semibold text-[#111111]">
              Choose from Stored Vault Files
            </label>
            {vaultFiles.length === 0 ? (
              <p className="text-xs text-[#666666] p-4 bg-[#F7F7F7] rounded-md border border-[#E5E5E5]">
                No files in vault yet. Encrypt an image first.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {vaultFiles.map((f) => (
                  <button
                    key={f.id}
                    onClick={() => handleSelectVaultFile(f.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xs transition-colors flex items-center justify-between cursor-pointer ${
                      selectedVaultFileId === f.id
                        ? 'border-[#111111] bg-[#F7F7F7]'
                        : 'border-[#E5E5E5] bg-white hover:bg-[#FAFAFA]'
                    }`}
                  >
                    <div className="min-w-0 pr-3">
                      <div className="font-semibold text-[#111111] truncate">{f.originalFilename}</div>
                      <div className="text-[11px] text-[#666666] font-mono mt-0.5">
                        {f.algorithm} · {(f.encryptedSizeBytes / 1024).toFixed(1)} KB · {new Date(f.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    {selectedVaultFileId === f.id && (
                      <span className="text-[11px] font-semibold text-[#111111]">Selected</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {inputMode === 'json' && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-[#111111]">
              Raw Container JSON
            </label>
            <textarea
              rows={4}
              value={rawContainerJson}
              onChange={(e) => {
                setRawContainerJson(e.target.value);
                try {
                  const parsed = JSON.parse(e.target.value);
                  setActiveEnvelope(parsed);
                  setDecryptionError(null);
                } catch {
                  // Wait for valid JSON
                }
              }}
              placeholder='Paste full {"ciphertextBase64": "...", "nonceBase64": "...", "authTagBase64": "...", "wrappedKeyBase64": "..."}'
              className="w-full border border-[#E5E5E5] rounded-md p-3 text-xs font-mono text-[#111111] bg-white placeholder-[#888888] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none"
            />
          </div>
        )}

        {/* Loaded Container Info */}
        {activeEnvelope && (
          <div className="p-4 border border-[#E5E5E5] bg-[#F7F7F7] rounded-lg text-xs space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
              <span className="font-semibold text-[#111111]">Target Container</span>
              <span className="text-[#16A34A] font-medium flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Payload Loaded
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#666666]">
              <div>
                File: <span className="font-medium text-[#111111]">{activeEnvelope.originalFilename || 'Unknown'}</span>
              </div>
              <div>
                Algorithm: <span className="font-mono text-[#111111]">{activeEnvelope.algorithm || 'AES-256-GCM'}</span>
              </div>
              <div className="sm:col-span-2">
                Recipient Fingerprint:{' '}
                <span className="font-mono text-[#111111] break-all">
                  {activeEnvelope.rsaKeyFingerprint || 'Associated with current RSA pair'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Passphrase / Private Key Options */}
        <div className="space-y-4 pt-2 border-t border-[#E5E5E5]">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
              Cryptographic Authentication
            </span>
            <button
              onClick={() => setUseCustomKey(!useCustomKey)}
              className="text-xs text-[#666666] hover:text-[#111111] cursor-pointer"
            >
              {useCustomKey ? 'Use Master Passphrase' : 'Use Custom Private Key PEM'}
            </button>
          </div>

          {!useCustomKey ? (
            <div className="space-y-1.5">
              <Input
                label="Master Passphrase (Unlocks Protected RSA-3072 Private Key)"
                type="password"
                value={masterPassword}
                onChange={(e) => setMasterPassword(e.target.value)}
                placeholder="Enter your master passphrase..."
                helperText="Derives the unwrap key via PBKDF2/Scrypt to access your local private key."
              />
            </div>
          ) : (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-[#111111]">
                Custom RSA-3072 Private Key (PKCS#8 PEM)
              </label>
              <textarea
                rows={4}
                value={customPrivateKeyPem}
                onChange={(e) => setCustomPrivateKeyPem(e.target.value)}
                placeholder="-----BEGIN PRIVATE KEY-----&#10;...&#10;-----END PRIVATE KEY-----"
                className="w-full border border-[#E5E5E5] rounded-md p-3 text-xs font-mono text-[#111111] bg-white placeholder-[#888888] focus:border-[#111111] focus:ring-1 focus:ring-[#111111] outline-none"
              />
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleExecuteDecryption}
            isLoading={isDecrypting}
            leftIcon={<Unlock className="w-4 h-4" />}
            className="w-full justify-center"
            disabled={!activeEnvelope || !activeEnvelope.ciphertextBase64}
          >
            Decrypt & Authenticate Container
          </Button>
        </div>
      </div>

      {/* Error Alert Box */}
      {decryptionError && (
        <div className="p-4 border border-[#FECACA] bg-[#FEF2F2] rounded-lg text-xs flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#DC2626]">
              Cryptographic Integrity Rejection
            </div>
            <p className="text-[#991B1B] mt-0.5 leading-relaxed break-words font-mono text-[11px]">
              {decryptionError}
            </p>
            <p className="text-[#666666] mt-2 text-[11px]">
              Tip: In authenticated AES-256-GCM, any modified bit in ciphertext or nonce causes the Galois MAC calculation to fail instantly, preventing any recovery of corrupted plaintext.
            </p>
          </div>
        </div>
      )}

      {/* Decryption Success & Image Preview */}
      {decryptedImageUrl && decryptedMeta && (
        <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#111111]">
                  Authentication Passed & Image Restored
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666] mt-0.5">
                  <span className="text-[#16A34A] font-semibold">100% Byte-for-Byte Integrity Verified</span>
                  <span aria-hidden="true">·</span>
                  <span className="font-mono">{decryptedMeta.decryptionTimeMs} ms</span>
                </div>
              </div>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleDownloadDecryptedImage}
              leftIcon={<Download className="w-4 h-4" />}
            >
              Download Image
            </Button>
          </div>

          {/* Restored Image Preview */}
          <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-4 flex flex-col items-center justify-center">
            <div className="text-xs font-semibold text-[#666666] mb-3 self-start">
              Restored Plaintext Display
            </div>
            <img
              src={decryptedImageUrl}
              alt="Restored plaintext"
              className="max-h-80 max-w-full object-contain rounded border border-[#E5E5E5] bg-white shadow-xs"
            />
          </div>

          {/* Verification Details Table */}
          <div className="border border-[#E5E5E5] rounded-lg overflow-hidden text-xs">
            <div className="bg-[#F7F7F7] p-3 font-semibold text-[#111111] border-b border-[#E5E5E5]">
              Integrity Assertions
            </div>
            <div className="divide-y divide-[#E5E5E5] bg-white text-[#666666]">
              <div className="p-3 flex justify-between items-center">
                <span>Recovered Filename</span>
                <span className="font-medium text-[#111111]">{decryptedMeta.originalFilename}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span>Restored Size</span>
                <span className="font-mono text-[#111111]">
                  {(decryptedMeta.fileSizeBytes / 1024).toFixed(1)} KB ({decryptedMeta.fileSizeBytes.toLocaleString()} bytes)
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span>SHA-256 Checksum</span>
                <span className="font-mono text-[#111111] break-all text-[11px]">
                  {decryptedMeta.sha256Hash}
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span>Galois Authentication Tag</span>
                <span className="font-mono text-[#16A34A] font-semibold">
                  Valid 128-bit Match
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
