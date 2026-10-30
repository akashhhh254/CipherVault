import React, { useState, useRef } from 'react';
import {
  Upload,
  Lock,
  ShieldCheck,
  CheckCircle2,
  AlertOctagon,
  Download,
  FileCode,
  Copy,
  Check,
  RefreshCw,
  KeyRound,
  FileText,
  Eye,
  Sliders,
  ArrowRight,
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
  const [sanitizeExif, setSanitizeExif] = useState(true);
  const [masterPassword, setMasterPassword] = useState(vaultStore.getSessionPassword() || 'MasterP@ssw0rd!2026');
  const [encryptionStatus, setEncryptionStatus] = useState<EncryptionProgress>({
    stage: 'idle',
    message: '',
    progressPercent: 0,
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedFile, setCompletedFile] = useState<EncryptedVaultFile | null>(null);
  const [validationLog, setValidationLog] = useState<string[]>([]);
  const [copiedTag, setCopiedTag] = useState(false);
  const [copiedHash, setCopiedHash] = useState(false);
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
      `Verified Format: ${magicValidation.detectedMime}`,
      `Raw Size: ${(file.size / 1024).toFixed(1)} KB`,
    ]);

    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const executeEncryption = async () => {
    if (!selectedFile) return;

    setErrorMsg(null);
    setCompletedFile(null);

    try {
      // 1. Stage: Magic Byte Inspection
      setEncryptionStatus({
        stage: 'validating_magic_bytes',
        message: 'Validating magic bytes and verifying authentic binary headers...',
        progressPercent: 20,
      });

      const fileBuffer = await selectedFile.arrayBuffer();
      const rawBytes = new Uint8Array(fileBuffer);
      const magicCheck = validateImageMagicBytes(rawBytes);

      if (!magicCheck.isValidImage) {
        throw new Error(`File failed cryptographic verification: ${magicCheck.statusMessage}`);
      }

      await new Promise((r) => setTimeout(r, 150));

      // 2. Stage: EXIF Stripping
      let sanitizedBytes: Uint8Array = rawBytes;
      let tagsStripped = 0;

      if (sanitizeExif) {
        setEncryptionStatus({
          stage: 'stripping_exif',
          message: 'Scrubbing EXIF metadata, camera serial numbers, and GPS coordinates...',
          progressPercent: 45,
        });

        const sanitizeResult = await stripExifAndSanitize(selectedFile);
        sanitizedBytes = new Uint8Array(sanitizeResult.sanitizedBytes);
        tagsStripped = sanitizeResult.exifTagsStripped;
        await new Promise((r) => setTimeout(r, 150));
      }

      // 3. Stage: Ensure RSA Key Pair
      setEncryptionStatus({
        stage: 'generating_aes_key',
        message: 'Verifying recipient RSA-3072 public key and envelope configuration...',
        progressPercent: 65,
      });

      let keyBundle = vaultStore.getKeyBundle();
      if (!keyBundle) {
        const passwordToUse = masterPassword.trim() || 'MasterP@ssw0rd!2026';
        keyBundle = await generateAndProtectRsaKeyPair(passwordToUse);
        vaultStore.setKeyBundle(keyBundle);
        vaultStore.setSessionPassword(passwordToUse);
      }

      await new Promise((r) => setTimeout(r, 150));

      // 4. Stage: AES-256-GCM Encryption & RSA Wrapping
      setEncryptionStatus({
        stage: 'encrypting_payload',
        message: 'Executing AES-256-GCM AEAD encryption and wrapping session key...',
        progressPercent: 85,
      });

      const encryptedPackage = await encryptImageHybrid(
        sanitizedBytes,
        keyBundle.publicKeyPem
      );

      await new Promise((r) => setTimeout(r, 150));

      // 5. Build Vault Record
      const newFileRecord: EncryptedVaultFile = {
        id: `ciphervault_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        userId: vaultStore.getSession()?.userId || 'usr_client_local',
        originalFilename: selectedFile.name,
        mimeType: magicCheck.detectedMime,
        originalSizeBytes: sanitizedBytes.length,
        encryptedSizeBytes: base64ToUint8Array(encryptedPackage.ciphertextBase64).length,
        sha256OriginalHash: encryptedPackage.sha256OriginalHash,
        sha256CiphertextHash: encryptedPackage.sha256CiphertextHash,
        algorithm: 'AES-256-GCM',
        nonceBase64: encryptedPackage.nonceBase64,
        authTagBase64: encryptedPackage.authTagBase64,
        ciphertextBase64: encryptedPackage.ciphertextBase64,
        wrappedKeyBase64: encryptedPackage.wrappedKeyBase64,
        keyWrappingAlgorithm: 'RSA-OAEP-SHA256',
        rsaKeyFingerprint: keyBundle.publicKeyFingerprint,
        exifStripped: sanitizeExif,
        exifTagsRemovedCount: tagsStripped,
        verifiedMagicBytes: magicCheck.statusMessage,
        createdAt: new Date().toISOString(),
      };

      // Save to store
      vaultStore.addFile(newFileRecord);
      setCompletedFile(newFileRecord);

      setEncryptionStatus({
        stage: 'completed',
        message: 'Encryption complete! Authentic cryptographic package generated.',
        progressPercent: 100,
      });

      addToast(
        'success',
        'Encryption Successful',
        `${selectedFile.name} protected with AES-256-GCM & RSA-3072.`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown cryptographic error';
      setErrorMsg(message);
      setEncryptionStatus({
        stage: 'idle',
        message: '',
        progressPercent: 0,
      });
      addToast('error', 'Encryption Failed', message);
    }
  };

  const handleDownloadContainer = () => {
    if (!completedFile) return;
    const container = {
      cipher_vault_version: '2.0.0',
      standard: 'NIST-SP-800-38D',
      algorithm: completedFile.algorithm,
      key_wrapping: completedFile.keyWrappingAlgorithm,
      recipient_fingerprint: completedFile.rsaKeyFingerprint,
      original_filename: completedFile.originalFilename,
      mime_type: completedFile.mimeType,
      sha256_original_hash: completedFile.sha256OriginalHash,
      sha256_ciphertext_hash: completedFile.sha256CiphertextHash,
      nonce_base64: completedFile.nonceBase64,
      auth_tag_base64: completedFile.authTagBase64,
      wrapped_key_base64: completedFile.wrappedKeyBase64,
      ciphertext_base64: completedFile.ciphertextBase64,
      exif_sanitized: completedFile.exifStripped,
      created_at: completedFile.createdAt,
    };

    const blob = new Blob([JSON.stringify(container, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${completedFile.originalFilename.replace(/\.[^/.]+$/, '')}.cvault`;
    a.click();
    URL.revokeObjectURL(url);

    addToast('info', 'Container Exported', 'Saved tamper-evident .cvault container.');
  };

  const handleCopyTag = () => {
    if (!completedFile) return;
    navigator.clipboard.writeText(completedFile.authTagBase64);
    setCopiedTag(true);
    setTimeout(() => setCopiedTag(false), 2000);
    addToast('info', 'Tag Copied', '128-bit authentication tag copied to clipboard.');
  };

  const handleCopyHash = () => {
    if (!completedFile) return;
    navigator.clipboard.writeText(completedFile.sha256CiphertextHash);
    setCopiedHash(true);
    setTimeout(() => setCopiedHash(false), 2000);
    addToast('info', 'Hash Copied', 'SHA-256 ciphertext hash copied.');
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto font-sans">
      {/* Page Header */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <div className="flex items-center gap-2 text-xs text-[#666666] mb-1 font-mono">
          <span>AES-256-GCM AEAD</span>
          <span aria-hidden="true">·</span>
          <span>RSA-3072 OAEP</span>
          <span aria-hidden="true">·</span>
          <span>EXIF Scrubbing</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          Encrypt Image
        </h1>
        <p className="text-sm text-[#666666] mt-1 max-w-2xl leading-relaxed">
          Select an image to encrypt. Before encryption, metadata is removed and binary headers are validated. An ephemeral 256-bit AES key is generated for this image and wrapped under your RSA public key.
        </p>
      </div>

      {/* Error Alert Box */}
      {errorMsg && (
        <div className="p-4 border border-[#FECACA] bg-[#FEF2F2] rounded-lg text-xs flex items-start gap-3">
          <AlertOctagon className="w-5 h-5 text-[#DC2626] shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-[#DC2626]">Encryption Blocked</div>
            <p className="text-[#991B1B] mt-0.5 leading-relaxed break-words">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Upload & Dropzone Area */}
      {!selectedFile && (
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-xl p-8 sm:p-12 text-center transition-all cursor-pointer bg-white ${
            dragOver
              ? 'border-[#111111] bg-[#F7F7F7]'
              : 'border-[#E5E5E5] hover:border-[#CCCCCC] hover:bg-[#FAFAFA]'
          }`}
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              fileInputRef.current?.click();
            }
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              if (e.target.files && e.target.files[0]) {
                handleFileSelect(e.target.files[0]);
              }
            }}
          />

          <div className="w-12 h-12 rounded-full bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center mx-auto text-[#111111] mb-4 shadow-xs">
            <Upload className="w-5 h-5" />
          </div>

          <h2 className="text-base font-semibold text-[#111111]">
            Drop your image here, or browse files
          </h2>
          <p className="text-xs text-[#666666] mt-1.5 max-w-sm mx-auto">
            Supported formats: PNG, JPEG, and WebP (up to 25 MB). Disguised executables and scripts are automatically rejected.
          </p>

          <div className="mt-5">
            <Button
              variant="secondary"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                fileInputRef.current?.click();
              }}
            >
              Browse Files
            </Button>
          </div>
        </div>
      )}

      {/* Selected File Card & Configuration */}
      {selectedFile && !completedFile && (
        <div className="space-y-6">
          <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center shrink-0">
                  <FileText className="w-5 h-5 text-[#111111]" />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-sm sm:text-base text-[#111111] truncate max-w-xs sm:max-w-md">
                    {selectedFile.name}
                  </div>
                  <div className="text-xs text-[#666666] flex flex-wrap items-center gap-2 mt-0.5">
                    <span>{(selectedFile.size / 1024).toFixed(1)} KB</span>
                    <span aria-hidden="true">·</span>
                    <span>{selectedFile.type || 'image/unknown'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#16A34A] font-medium">Header Validated</span>
                  </div>
                </div>
              </div>

              <Button
                variant="outline"
                size="xs"
                onClick={() => {
                  setSelectedFile(null);
                  setImagePreviewUrl(null);
                  setCompletedFile(null);
                  setErrorMsg(null);
                }}
              >
                Change File
              </Button>
            </div>

            {/* Image Preview Area */}
            {imagePreviewUrl && (
              <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-4 flex flex-col items-center justify-center">
                <div className="text-xs font-semibold text-[#666666] mb-2 self-start">
                  Plaintext Preview (Pre-Encryption)
                </div>
                <img
                  src={imagePreviewUrl}
                  alt="Plaintext preview"
                  className="max-h-56 max-w-full object-contain rounded border border-[#E5E5E5] bg-white shadow-xs"
                />
              </div>
            )}

            {/* Cryptographic Options */}
            <div className="space-y-4 pt-2">
              <div className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Security Configuration
              </div>

              {/* EXIF Toggle */}
              <label className="flex items-start gap-3 p-3.5 border border-[#E5E5E5] rounded-lg bg-[#FAFAFA] cursor-pointer hover:bg-[#F5F5F5] transition-colors">
                <input
                  type="checkbox"
                  checked={sanitizeExif}
                  onChange={(e) => setSanitizeExif(e.target.checked)}
                  className="mt-0.5 accent-[#111111] rounded cursor-pointer"
                />
                <div className="text-xs">
                  <div className="font-semibold text-[#111111]">
                    Sanitize EXIF Metadata (Recommended)
                  </div>
                  <p className="text-[#666666] mt-0.5 leading-relaxed">
                    Strips GPS coordinates, camera serial numbers, device orientation, and timestamps by rasterizing raw pixel buffers.
                  </p>
                </div>
              </label>

              {/* Algorithm Details Box */}
              <div className="p-3.5 border border-[#E5E5E5] rounded-lg bg-[#F7F7F7] text-xs space-y-1.5">
                <div className="flex justify-between items-center text-[#666666]">
                  <span>Symmetric Payload Cipher</span>
                  <span className="font-mono text-[#111111] font-medium">AES-256-GCM (NIST FIPS 197)</span>
                </div>
                <div className="flex justify-between items-center text-[#666666]">
                  <span>IV / Nonce Generation</span>
                  <span className="font-mono text-[#111111] font-medium">96-bit CSPRNG unique per file</span>
                </div>
                <div className="flex justify-between items-center text-[#666666]">
                  <span>Key Wrapping Scheme</span>
                  <span className="font-mono text-[#111111] font-medium">RSA-3072 OAEP (SHA-256)</span>
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#E5E5E5]">
              <div className="text-xs text-[#666666]">
                Recipient: <span className="font-mono text-[#111111]">Current RSA-3072 Key Pair</span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Button
                  variant="primary"
                  size="md"
                  onClick={executeEncryption}
                  isLoading={encryptionStatus.stage !== 'idle' && encryptionStatus.stage !== 'completed'}
                  leftIcon={<Lock className="w-4 h-4" />}
                  className="w-full sm:w-auto"
                >
                  Execute Cryptographic Encryption
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Processing Indicator */}
      {encryptionStatus.stage !== 'idle' && encryptionStatus.stage !== 'completed' && (
        <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#111111]">Processing Cryptographic Pipeline</span>
            <span className="font-mono text-[#666666]">{encryptionStatus.progressPercent}%</span>
          </div>
          <div className="w-full bg-[#F0F0F0] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[#111111] h-full transition-all duration-300"
              style={{ width: `${encryptionStatus.progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-[#666666] font-mono leading-relaxed">
            {encryptionStatus.message}
          </p>
        </div>
      )}

      {/* Completed Encryption Result Box */}
      {completedFile && (
        <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 sm:p-7 shadow-xs space-y-6">
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-[#E5E5E5]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#F0FDF4] border border-[#BBF7D0] text-[#16A34A] flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#111111]">
                  Encryption Successful
                </h2>
                <p className="text-xs text-[#666666] mt-0.5">
                  Package generated with authenticated 128-bit integrity tag
                </p>
              </div>
            </div>

            <Button
              variant="outline"
              size="xs"
              onClick={() => {
                setSelectedFile(null);
                setImagePreviewUrl(null);
                setCompletedFile(null);
                setEncryptionStatus({ stage: 'idle', message: '', progressPercent: 0 });
              }}
            >
              Encrypt Another
            </Button>
          </div>

          {/* Cryptographic Parameters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="border border-[#E5E5E5] bg-[#F7F7F7] p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111111]">Authentication Tag (GMAC)</span>
                <button
                  onClick={handleCopyTag}
                  className="text-[#666666] hover:text-[#111111] flex items-center gap-1 cursor-pointer"
                  title="Copy Tag"
                >
                  {copiedTag ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-mono">Copy</span>
                </button>
              </div>
              <div className="font-mono text-[11px] text-[#111111] bg-white border border-[#E5E5E5] p-2 rounded break-all">
                {completedFile.authTagBase64}
              </div>
              <div className="text-[11px] text-[#666666]">
                128-bit Galois Field tag guarantees tamper evidence
              </div>
            </div>

            <div className="border border-[#E5E5E5] bg-[#F7F7F7] p-4 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111111]">Ciphertext Hash (SHA-256)</span>
                <button
                  onClick={handleCopyHash}
                  className="text-[#666666] hover:text-[#111111] flex items-center gap-1 cursor-pointer"
                  title="Copy Hash"
                >
                  {copiedHash ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px] font-mono">Copy</span>
                </button>
              </div>
              <div className="font-mono text-[11px] text-[#111111] bg-white border border-[#E5E5E5] p-2 rounded break-all">
                {completedFile.sha256CiphertextHash}
              </div>
              <div className="text-[11px] text-[#666666]">
                Pre-decryption checksum for transport verification
              </div>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-[#E5E5E5] rounded-lg overflow-hidden text-xs">
            <div className="bg-[#F7F7F7] p-3 font-semibold text-[#111111] border-b border-[#E5E5E5]">
              Package Metadata
            </div>
            <div className="divide-y divide-[#E5E5E5] bg-white text-[#666666]">
              <div className="p-3 flex justify-between items-center">
                <span>Original File</span>
                <span className="font-medium text-[#111111]">{completedFile.originalFilename}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span>Original Size / Encrypted Size</span>
                <span className="font-mono text-[#111111]">
                  {(completedFile.originalSizeBytes / 1024).toFixed(1)} KB → {(completedFile.encryptedSizeBytes / 1024).toFixed(1)} KB
                </span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span>96-bit Nonce (IV)</span>
                <span className="font-mono text-[#111111] break-all">{completedFile.nonceBase64}</span>
              </div>
              <div className="p-3 flex justify-between items-center">
                <span>EXIF Scrubbing Status</span>
                <span className="text-[#16A34A] font-medium">
                  {completedFile.exifStripped ? `Stripped (${completedFile.exifTagsRemovedCount} metadata tags wiped)` : 'Bypassed'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
            <Button
              variant="primary"
              size="md"
              onClick={handleDownloadContainer}
              leftIcon={<Download className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Download Container (.cvault)
            </Button>

            <Button
              variant="secondary"
              size="md"
              onClick={() => onEncryptionComplete(completedFile)}
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              View in Vault Files
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
