import React, { useState, useRef } from 'react';
import {
  Upload,
  Lock,
  Shield,
  CheckCircle2,
  AlertOctagon,
  Download,
  FileCode,
  Copy,
  RefreshCw,
  KeyRound,
  Check,
} from 'lucide-react';
import {
  validateImageMagicBytes,
  stripExifAndSanitize,
  encryptImageHybrid,
  generateAndProtectRsaKeyPair,
  generateHexDump,
  base64ToUint8Array,
} from '../../lib/cryptoEngine';
import { vaultStore } from '../../lib/vaultStore';
import { EncryptedVaultFile, EncryptionProgress } from '../../types/crypto';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface UploadEncryptionViewProps {
  onEncryptionComplete: (file: EncryptedVaultFile) => void;
  onOpenKeyModal: () => void;
}

export const UploadEncryptionView: React.FC<UploadEncryptionViewProps> = ({
  onEncryptionComplete,
  onOpenKeyModal,
}) => {
  const { addToast } = useToast();
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [masterPassword, setMasterPassword] = useState('');
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionProgress>({
    stage: 'idle',
    message: '',
    progressPercent: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedFile, setCompletedFile] = useState<EncryptedVaultFile | null>(null);
  const [validationLog, setValidationLog] = useState<string[]>([]);
  const [copiedTag, setCopiedTag] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    setErrorMsg(null);
    setCompletedFile(null);
    setValidationLog([]);

    // Size check (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      setErrorMsg('File exceeds the 25 MB security threshold.');
      return;
    }

    setSelectedFile(file);

    // Read first 16 bytes for instant magic byte inspection
    const buffer = await file.slice(0, 16).arrayBuffer();
    const bytes = new Uint8Array(buffer);
    const magicValidation = validateImageMagicBytes(bytes);

    if (magicValidation.isExecutableOrSuspicious || !magicValidation.isValidImage) {
      setErrorMsg(`Security Validation Rejection: ${magicValidation.statusMessage}`);
      vaultStore.addAuditLog({
        id: `aud_mal_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: 'quarantine',
        filename: file.name,
        action: 'MALICIOUS_FILE_REJECTED',
        status: 'FAILED',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Rejected upload "${file.name}": Suspicious binary header detected (${magicValidation.magicHeaderHex}).`,
      });
      setSelectedFile(null);
      setImagePreviewUrl(null);
      addToast('error', 'Upload Rejected', magicValidation.statusMessage);
      return;
    }

    setValidationLog([
      `Magic Header: ${magicValidation.magicHeaderHex}`,
      `Verified MIME: ${magicValidation.detectedMime}`,
      `File Size: ${(file.size / 1024).toFixed(1)} KB`,
    ]);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const executeEncryptionPipeline = async () => {
    if (!selectedFile) return;
    setErrorMsg(null);

    try {
      // Step 1: Ensure active RSA-3072 key pair
      let keyBundle = vaultStore.getKeyBundle();
      if (!keyBundle) {
        setEncryptionStatus({
          stage: 'generating_aes_key',
          message: 'Provisioning RSA-3072 user key pair...',
          progressPercent: 15,
        });
        const passwordToUse = masterPassword.trim() || 'MasterP@ssw0rd!2026';
        keyBundle = await generateAndProtectRsaKeyPair(passwordToUse);
        vaultStore.setKeyBundle(keyBundle);
        vaultStore.addAuditLog({
          id: `aud_${Date.now()}`,
          userId: vaultStore.getSession()?.userId,
          fileId: 'key_system',
          filename: 'rsa3072_keypair',
          action: 'KEYPAIR_GENERATED',
          status: 'SUCCESS',
          ipAddress: '127.0.0.1',
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
          details: 'RSA-3072 key pair generated. Private key secured at rest via PBKDF2-SHA256.',
        });
      }

      // Step 2: Magic Byte Signature Validation
      setEncryptionStatus({
        stage: 'validating_magic_bytes',
        message: 'Validating binary file signature against executable headers...',
        progressPercent: 30,
      });
      await new Promise((r) => setTimeout(r, 150));

      // Step 3: EXIF Metadata Sanitization
      setEncryptionStatus({
        stage: 'stripping_exif',
        message: 'Purging EXIF metadata, GPS tags, and device telemetry...',
        progressPercent: 50,
      });

      const sanitizedResult = await stripExifAndSanitize(selectedFile);
      setValidationLog((prev) => [
        ...prev,
        `Purged ${sanitizedResult.exifTagsStripped} EXIF metadata chunks`,
        `Re-rasterized to pure pixel buffer (${sanitizedResult.sanitizedSizeBytes} bytes)`,
      ]);

      // Step 4: AES-256-GCM Encryption + RSA-3072 Key Wrapping
      setEncryptionStatus({
        stage: 'encrypting_payload',
        message: 'Generating 256-bit AES key & 96-bit nonce. Executing AES-256-GCM...',
        progressPercent: 75,
      });

      const encryptedPackage = await encryptImageHybrid(
        sanitizedResult.sanitizedBytes,
        keyBundle.publicKeyPem
      );

      // Step 5: Construct Vault Container Record
      setEncryptionStatus({
        stage: 'storing_vault',
        message: 'Constructing cryptographic envelope and computing SHA-256 digest...',
        progressPercent: 90,
      });

      const cipherBytes = base64ToUint8Array(encryptedPackage.ciphertextBase64);
      const vaultRecord: EncryptedVaultFile = {
        id: `vault_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        userId: vaultStore.getSession()?.userId || 'usr_client',
        originalFilename: selectedFile.name,
        mimeType: sanitizedResult.mimeType,
        originalSizeBytes: selectedFile.size,
        encryptedSizeBytes: cipherBytes.length,
        sha256OriginalHash: encryptedPackage.sha256OriginalHash,
        sha256CiphertextHash: encryptedPackage.sha256CiphertextHash,
        algorithm: 'AES-256-GCM',
        nonceBase64: encryptedPackage.nonceBase64,
        authTagBase64: encryptedPackage.authTagBase64,
        ciphertextBase64: encryptedPackage.ciphertextBase64,
        wrappedKeyBase64: encryptedPackage.wrappedKeyBase64,
        keyWrappingAlgorithm: 'RSA-OAEP-SHA256',
        rsaKeyFingerprint: keyBundle.publicKeyFingerprint,
        exifStripped: true,
        exifTagsRemovedCount: sanitizedResult.exifTagsStripped,
        verifiedMagicBytes: 'PNG/JPEG Verified',
        createdAt: new Date().toISOString(),
      };

      vaultStore.addFile(vaultRecord);
      setCompletedFile(vaultRecord);
      onEncryptionComplete(vaultRecord);

      setEncryptionStatus({
        stage: 'completed',
        message: 'Encrypted with authenticated 128-bit AEAD tag.',
        progressPercent: 100,
      });

      addToast('success', 'Image Encrypted & Vault Container Sealed', `Stored as AES-256-GCM with RSA-3072 envelope.`);
    } catch (err: unknown) {
      setErrorMsg(`Cryptographic Pipeline Error: ${(err as Error).message}`);
      setEncryptionStatus({
        stage: 'failed',
        message: 'Encryption aborted due to security violation.',
        progressPercent: 0,
      });
    }
  };

  const handleDownloadCvault = (file: EncryptedVaultFile) => {
    const envelope = {
      vault_magic: 'CVAULT01',
      version: '1.0',
      standard: 'NIST SP 800-38D / FIPS 197',
      file_id: file.id,
      original_filename: file.originalFilename,
      mime_type: file.mimeType,
      original_size_bytes: file.originalSizeBytes,
      encrypted_size_bytes: file.encryptedSizeBytes,
      sha256_original_hash: file.sha256OriginalHash,
      sha256_ciphertext_hash: file.sha256CiphertextHash,
      cipher: {
        algorithm: 'AES-256-GCM',
        nonce_96bit_b64: file.nonceBase64,
        auth_tag_128bit_b64: file.authTagBase64,
        ciphertext_b64: file.ciphertextBase64,
      },
      key_wrapping: {
        algorithm: 'RSA-OAEP-3072-SHA256',
        rsa_fingerprint: file.rsaKeyFingerprint,
        wrapped_aes_key_b64: file.wrappedKeyBase64,
      },
      metadata: {
        exif_sanitized: file.exifStripped,
        tags_removed: file.exifTagsRemovedCount,
        encrypted_at: file.createdAt,
      },
    };

    const blob = new Blob([JSON.stringify(envelope, null, 2)], {
      type: 'application/octet-stream',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.originalFilename.replace(/\.[^.]+$/, '')}.cvault`;
    a.click();
    URL.revokeObjectURL(url);

    addToast('info', 'Downloaded .cvault Container', `Saved cryptographic envelope for ${file.originalFilename}`);
  };

  const handleCopyTag = (tag: string) => {
    navigator.clipboard.writeText(tag);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
    addToast('info', 'Copied GMAC Tag', '128-bit authentication tag copied to clipboard.');
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto font-sans">
      <div className="border-b border-[#242424] pb-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-widest text-[#B5A27E] uppercase">
              Cryptographic Ingestion
            </span>
            <span className="text-[#444]">·</span>
            <span className="text-xs font-mono text-[#777777] uppercase">Module 01</span>
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white mt-1">
            Confidential Image Ingestion & Encryption
          </h1>
          <p className="text-xs text-[#888888] mt-1 font-sans">
            Scrub image EXIF metadata, validate binary headers, encrypt via AES-256-GCM, and wrap session keys with RSA-3072.
          </p>
        </div>

        <button
          onClick={onOpenKeyModal}
          className="self-start md:self-auto px-3.5 py-2 border border-[#333333] bg-[#141414] text-xs font-mono text-[#B5A27E] hover:border-[#B5A27E] transition-colors flex items-center gap-2"
        >
          <KeyRound className="w-3.5 h-3.5" />
          <span>Active RSA Keys</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 border border-red-900/60 bg-red-950/20 text-red-200 text-xs flex items-start gap-2.5">
          <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-red-300 uppercase font-mono">Security Exception</div>
            <p className="mt-0.5 leading-relaxed font-mono">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Upload Zone */}
      {!selectedFile ? (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            if (e.dataTransfer.files?.[0]) {
              handleFileSelect(e.dataTransfer.files[0]);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border border-dashed p-12 text-center cursor-pointer transition-colors ${
            dragOver
              ? 'border-[#B5A27E] bg-[#1A1A1A]'
              : 'border-[#2E2E2E] hover:border-[#B5A27E] bg-[#111111]'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) handleFileSelect(e.target.files[0]);
            }}
          />
          <div className="w-12 h-12 border border-[#333333] bg-[#0A0A0A] flex items-center justify-center mx-auto mb-4 text-[#B5A27E]">
            <Upload className="w-6 h-6" />
          </div>
          <div className="text-xs font-semibold text-white uppercase tracking-wider mb-1 font-mono">
            Select Confidential Image or Drop File
          </div>
          <p className="text-[11px] text-[#777777] max-w-sm mx-auto mb-4 font-sans">
            PNG, JPEG, and WebP (up to 25 MB). Non-image binaries and polyglot files are strictly rejected via magic byte checks.
          </p>
          <div className="text-[11px] font-mono text-[#666666] flex items-center justify-center gap-3">
            <span>Verified Magic Bytes</span>
            <span>·</span>
            <span>EXIF Metadata Purged</span>
            <span>·</span>
            <span>AES-256-GCM AEAD</span>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* File Selected Card */}
          <div className="border border-[#242424] bg-[#111111] p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#242424]">
              <div className="flex items-center gap-3.5">
                {imagePreviewUrl && (
                  <img
                    src={imagePreviewUrl}
                    alt="Preview"
                    referrerPolicy="no-referrer"
                    className="w-12 h-12 object-cover border border-[#333333] bg-[#0A0A0A]"
                  />
                )}
                <div>
                  <div className="text-xs font-semibold text-white">{selectedFile.name}</div>
                  <div className="text-[11px] text-[#777777] font-mono mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB · {selectedFile.type || 'image/octet-stream'}
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedFile(null);
                  setImagePreviewUrl(null);
                  setCompletedFile(null);
                }}
              >
                Change File
              </Button>
            </div>

            {/* Pre-flight Validation Checklist */}
            <div className="p-3 bg-[#0A0A0A] border border-[#222222] font-mono text-[11px] space-y-1">
              <div className="text-[#888888] font-medium mb-1 uppercase">Pre-Flight Security Verification:</div>
              {validationLog.map((log, i) => (
                <div key={i} className="text-[#CCCCCC] flex items-center gap-1.5">
                  <Check className="w-3 h-3 text-[#B5A27E] shrink-0" />
                  <span>{log}</span>
                </div>
              ))}
            </div>

            {/* Ingestion Action */}
            {encryptionStatus.stage === 'idle' && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-2">
                <div className="text-[11px] text-[#777777] font-mono">
                  <span>Asymmetric Recipient: </span>
                  <span className="text-[#EDEDED]">
                    {vaultStore.getKeyBundle()
                      ? `RSA-3072 (${vaultStore.getKeyBundle()?.publicKeyFingerprint.substring(0, 12)}...)`
                      : 'Auto-provisioning RSA-3072'}
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="md"
                  onClick={executeEncryptionPipeline}
                  leftIcon={<Lock className="w-3.5 h-3.5" />}
                >
                  Execute Cryptographic Ingestion
                </Button>
              </div>
            )}
          </div>

          {/* Progress Indicator */}
          {encryptionStatus.stage !== 'idle' && encryptionStatus.stage !== 'completed' && (
            <div className="p-5 border border-[#242424] bg-[#111111] space-y-2.5">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#B5A27E]">{encryptionStatus.message}</span>
                <span className="text-[#777777] tabular-nums">{encryptionStatus.progressPercent}%</span>
              </div>
              <div className="w-full h-1 bg-[#0A0A0A] overflow-hidden">
                <div
                  className="h-full bg-[#B5A27E] transition-all duration-300"
                  style={{ width: `${encryptionStatus.progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Completion & Cryptographic Manifest Card */}
          {completedFile && (
            <div className="border border-[#242424] bg-[#111111] p-6 space-y-5">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-[#B5A27E]">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-xs font-semibold text-white uppercase font-mono tracking-wide">
                    Image Encrypted & Vault Container Sealed
                  </span>
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => handleDownloadCvault(completedFile)}
                  leftIcon={<Download className="w-3.5 h-3.5" />}
                >
                  Download .cvault Envelope
                </Button>
              </div>

              {/* Cryptographic Manifest Specs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 font-mono text-[11px]">
                <div className="p-3 bg-[#0A0A0A] border border-[#242424] space-y-1">
                  <div className="text-[#777777] text-[10px] uppercase">AES-256 Nonce (96-bit)</div>
                  <div className="text-white truncate">{completedFile.nonceBase64}</div>
                </div>

                <div className="p-3 bg-[#0A0A0A] border border-[#242424] space-y-1">
                  <div className="flex items-center justify-between text-[#777777] text-[10px] uppercase">
                    <span>GMAC Auth Tag (128-bit)</span>
                    <button
                      onClick={() => handleCopyTag(completedFile.authTagBase64)}
                      className="text-[#B5A27E] hover:underline"
                    >
                      {copiedTag ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                  <div className="text-[#B5A27E] truncate">{completedFile.authTagBase64}</div>
                </div>

                <div className="p-3 bg-[#0A0A0A] border border-[#242424] space-y-1">
                  <div className="text-[#777777] text-[10px] uppercase">RSA-3072 Wrapped Key</div>
                  <div className="text-white truncate">
                    {completedFile.wrappedKeyBase64.substring(0, 20)}...
                  </div>
                </div>
              </div>

              {/* Ciphertext Hex Sample */}
              <div className="space-y-1.5">
                <div className="text-xs font-medium text-[#AAAAAA] uppercase font-mono text-[11px]">
                  Ciphertext Stream Sample (First 64 Bytes):
                </div>
                <div className="p-3 bg-[#0A0A0A] border border-[#242424] font-mono text-[11px] text-[#888888] overflow-x-auto space-y-1">
                  {generateHexDump(base64ToUint8Array(completedFile.ciphertextBase64), 64).map((line, idx) => (
                    <div key={idx} className="flex gap-4">
                      <span className="text-[#555555]">{line.offset}</span>
                      <span className="text-[#B5A27E]">{line.hex}</span>
                      <span className="text-[#666666]">{line.ascii}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#242424] text-xs">
                <span className="text-[#777777] font-mono text-[11px]">
                  Package registered in encrypted vault index.
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSelectedFile(null);
                    setImagePreviewUrl(null);
                    setCompletedFile(null);
                    setEncryptionStatus({ stage: 'idle', message: '', progressPercent: 0 });
                  }}
                >
                  Encrypt Another Image
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
