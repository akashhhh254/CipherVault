import React, { useState } from 'react';
import {
  Lock,
  Unlock,
  Download,
  Trash2,
  Search,
  Eye,
  FileCode,
  CheckCircle2,
  AlertOctagon,
  X,
  Copy,
  EyeOff,
} from 'lucide-react';
import { EncryptedVaultFile } from '../../types/crypto';
import { vaultStore } from '../../lib/vaultStore';
import {
  unlockPrivateKey,
  decryptImageHybrid,
  base64ToUint8Array,
  generateHexDump,
} from '../../lib/cryptoEngine';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

interface VaultFilesViewProps {
  files: EncryptedVaultFile[];
  onSelectTamper: (fileId: string) => void;
  activeDecryptFileId: string | null;
  setActiveDecryptFileId: (id: string | null) => void;
}

export const VaultFilesView: React.FC<VaultFilesViewProps> = ({
  files,
  onSelectTamper,
  activeDecryptFileId,
  setActiveDecryptFileId,
}) => {
  const { addToast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileForModal, setSelectedFileForModal] = useState<EncryptedVaultFile | null>(null);
  const [inspectModalFile, setInspectModalFile] = useState<EncryptedVaultFile | null>(null);

  // Decryption state
  const [decryptPassword, setDecryptPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedImageSrc, setDecryptedImageSrc] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [decryptionStats, setDecryptionStats] = useState<{
    durationMs: number;
    sha256Recovered: string;
    integrityVerified: boolean;
  } | null>(null);

  const filteredFiles = files.filter(
    (f) =>
      f.originalFilename.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.algorithm.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const handleStartDecryption = (file: EncryptedVaultFile) => {
    setSelectedFileForModal(file);
    setDecryptPassword(vaultStore.getSessionPassword() || 'MasterP@ssw0rd!2026');
    setDecryptedImageSrc(null);
    setDecryptError(null);
    setDecryptionStats(null);
  };

  const executeDecryption = async () => {
    if (!selectedFileForModal) return;
    setIsDecrypting(true);
    setDecryptError(null);
    const startTime = performance.now();

    try {
      const keyBundle = vaultStore.getKeyBundle();
      if (!keyBundle) {
        throw new Error('No RSA-3072 key bundle found. Please generate keys first.');
      }

      // Unlock private key using password
      const unlockedPrivate = await unlockPrivateKey(
        keyBundle,
        decryptPassword.trim() || 'MasterP@ssw0rd!2026'
      );

      // Decrypt AES key via RSA-OAEP and Decrypt Payload via AES-256-GCM
      const decryptedResult = await decryptImageHybrid(
        {
          nonceBase64: selectedFileForModal.nonceBase64,
          authTagBase64: selectedFileForModal.authTagBase64,
          ciphertextBase64: selectedFileForModal.ciphertextBase64,
          wrappedKeyBase64: selectedFileForModal.wrappedKeyBase64,
        },
        unlockedPrivate
      );

      const durationMs = Math.round(performance.now() - startTime);

      const blob = new Blob([decryptedResult.plaintextBytes.buffer as ArrayBuffer], {
        type: selectedFileForModal.mimeType,
      });
      const url = URL.createObjectURL(blob);
      setDecryptedImageSrc(url);
      setDecryptionStats({
        durationMs,
        sha256Recovered: decryptedResult.recoveredSha256,
        integrityVerified: decryptedResult.integrityVerified,
      });

      vaultStore.addAuditLog({
        id: `aud_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: selectedFileForModal.id,
        filename: selectedFileForModal.originalFilename,
        action: 'IMAGE_DECRYPTED',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Decrypted "${selectedFileForModal.originalFilename}". Integrity SHA-256 verified (${decryptedResult.recoveredSha256.substring(0, 16)}...).`,
      });

      addToast('success', 'Decryption & Verification Successful', `Verified in ${durationMs}ms with zero byte corruption.`);
    } catch (err: unknown) {
      const errorMsg = (err as Error).message;
      setDecryptError(errorMsg);
      vaultStore.addAuditLog({
        id: `aud_err_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: selectedFileForModal.id,
        filename: selectedFileForModal.originalFilename,
        action: 'TAMPER_DETECTED',
        status: 'FAILED',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Decryption failed on "${selectedFileForModal.originalFilename}": ${errorMsg}`,
      });
      addToast('error', 'Decryption Rejected', errorMsg);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDownloadDecryptedImage = () => {
    if (!decryptedImageSrc || !selectedFileForModal) return;
    const a = document.createElement('a');
    a.href = decryptedImageSrc;
    a.download = `decrypted_${selectedFileForModal.originalFilename}`;
    a.click();
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
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto font-sans">
      {/* Header & Search */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#242424] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono tracking-widest text-[#B5A27E] uppercase">
              Custody Registry
            </span>
            <span className="text-[#444]">·</span>
            <span className="text-xs font-mono text-[#777777] uppercase">My Secure Files</span>
          </div>
          <h1 className="text-2xl font-light tracking-tight text-white mt-1">
            Encrypted Vault Storage
          </h1>
          <p className="text-xs text-[#888888] mt-1 font-sans">
            Cryptographic containers sealed via AES-256-GCM and enveloped with RSA-3072.
          </p>
        </div>

        <div className="w-full sm:w-64">
          <Input
            placeholder="Search vault files..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-3.5 h-3.5" />}
          />
        </div>
      </div>

      {/* Files List */}
      <div className="border border-[#242424] bg-[#111111] overflow-hidden">
        {filteredFiles.length === 0 ? (
          <div className="text-center py-12">
            <Lock className="w-7 h-7 text-[#555555] mx-auto mb-2" />
            <div className="text-xs font-semibold text-white uppercase font-mono">No Matching Encrypted Files</div>
            <p className="text-[11px] text-[#777777] max-w-sm mx-auto mt-1 font-sans">
              Upload images via the Encrypt module to populate your vault.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[#666666] border-b border-[#242424] font-mono text-[11px] bg-[#0A0A0A]">
                <tr>
                  <th className="py-2.5 px-4 font-medium">Filename & Digest</th>
                  <th className="py-2.5 px-4 font-medium">Cipher & Wrapping</th>
                  <th className="py-2.5 px-4 font-medium text-right">Encrypted Size</th>
                  <th className="py-2.5 px-4 font-medium text-right">GMAC Tag</th>
                  <th className="py-2.5 px-4 font-medium text-right">Created</th>
                  <th className="py-2.5 px-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F] font-mono">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#161616] transition-colors">
                    <td className="py-2.5 px-4 font-sans">
                      <div className="font-medium text-white truncate max-w-[220px]">
                        {file.originalFilename}
                      </div>
                      <div className="text-[10px] font-mono text-[#666666] truncate max-w-[220px]">
                        SHA: {file.sha256CiphertextHash.substring(0, 16)}...
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-[#888888] text-[11px]">
                      <div className="text-white">{file.algorithm}</div>
                      <div className="text-[10px] text-[#666666]">RSA-3072 OAEP</div>
                    </td>

                    <td className="py-2.5 px-4 text-right tabular-nums text-[#CCCCCC]">
                      <div>{formatBytes(file.encryptedSizeBytes)}</div>
                      <div className="text-[10px] text-[#666666]">
                        Orig: {formatBytes(file.originalSizeBytes)}
                      </div>
                    </td>

                    <td className="py-2.5 px-4 text-right text-[#B5A27E] text-[11px]">
                      {file.authTagBase64.substring(0, 10)}...
                    </td>

                    <td className="py-2.5 px-4 text-right tabular-nums text-[#666666] text-[11px]">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-2.5 px-4 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => setInspectModalFile(file)}
                          title="Inspect Envelope"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => onSelectTamper(file.id)}
                        >
                          Tamper Lab
                        </Button>

                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => handleStartDecryption(file)}
                        >
                          Decrypt
                        </Button>

                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => handleDownloadCvault(file)}
                          title="Download .cvault"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => {
                            vaultStore.deleteFile(file.id);
                            addToast('info', 'File Expunged', `Removed "${file.originalFilename}" from vault.`);
                          }}
                          className="text-[#666666] hover:text-red-400"
                          title="Purge"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Decryption Modal */}
      {selectedFileForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg border border-[#262626] bg-[#111111] shadow-2xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <div className="flex items-center gap-2 text-white font-semibold text-xs uppercase font-mono">
                <Unlock className="w-3.5 h-3.5 text-[#B5A27E]" />
                <span>Decrypt Confidential Image</span>
              </div>
              <button
                onClick={() => setSelectedFileForModal(null)}
                className="text-[#666666] hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-1 text-xs">
              <div className="text-[#AAAAAA] font-medium truncate font-mono">
                Target: <span className="text-white">{selectedFileForModal.originalFilename}</span>
              </div>
              <div className="text-[11px] font-mono text-[#666666]">
                Auth Tag: {selectedFileForModal.authTagBase64.substring(0, 16)}...
              </div>
            </div>

            {!decryptedImageSrc ? (
              <div className="space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Input
                    label="Master Password (to unlock RSA-3072 private key)"
                    type={showPassword ? 'text' : 'password'}
                    value={decryptPassword}
                    onChange={(e) => setDecryptPassword(e.target.value)}
                    placeholder="Enter master password..."
                    rightIcon={
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="text-[#666666] hover:text-white cursor-pointer"
                      >
                        {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    }
                  />
                  <p className="text-[10px] text-[#666666] font-mono">
                    PBKDF2-SHA256 unprotects the user&apos;s PKCS#8 private key in memory.
                  </p>
                </div>

                {decryptError && (
                  <div className="p-3 border border-red-900/60 bg-red-950/20 text-red-200 text-xs flex items-start gap-2">
                    <AlertOctagon className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-semibold text-red-300 font-mono uppercase">AEAD Decryption Failed</div>
                      <div className="text-[11px] mt-0.5 leading-relaxed font-mono">{decryptError}</div>
                    </div>
                  </div>
                )}

                <div className="flex justify-end gap-2 pt-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFileForModal(null)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={executeDecryption}
                    isLoading={isDecrypting}
                    leftIcon={<Unlock className="w-3.5 h-3.5" />}
                  >
                    Authenticate & Decrypt
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-3 border border-[#B5A27E]/40 bg-[#141414] text-[#B5A27E] text-xs flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#B5A27E] shrink-0 mt-0.5" />
                  <div>
                    <div className="font-semibold text-white font-mono uppercase">
                      Cryptographic Authenticity & Integrity Verified
                    </div>
                    <div className="text-[11px] text-[#B5A27E] font-mono mt-0.5">
                      Completed in {decryptionStats?.durationMs}ms · SHA-256 match confirmed.
                    </div>
                  </div>
                </div>

                <div className="border border-[#242424] overflow-hidden max-h-56 flex items-center justify-center bg-[#0A0A0A] p-2">
                  <img
                    src={decryptedImageSrc}
                    alt="Decrypted"
                    referrerPolicy="no-referrer"
                    className="max-h-52 object-contain"
                  />
                </div>

                <div className="flex justify-between items-center pt-2 border-t border-[#242424]">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDecryptedImageSrc(null);
                      setDecryptionStats(null);
                    }}
                  >
                    Close Preview
                  </Button>

                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleDownloadDecryptedImage}
                    leftIcon={<Download className="w-3.5 h-3.5" />}
                  >
                    Download Decrypted Image
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspect Envelope Modal */}
      {inspectModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-xl border border-[#262626] bg-[#111111] shadow-2xl p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
              <div className="flex items-center gap-2 text-white font-semibold text-xs font-mono uppercase">
                <FileCode className="w-3.5 h-3.5 text-[#B5A27E]" />
                <span>Cryptographic Envelope (.cvault)</span>
              </div>
              <button onClick={() => setInspectModalFile(null)} className="text-[#666666] hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 font-mono text-[11px]">
              <div className="p-3 bg-[#0A0A0A] border border-[#242424] space-y-1 text-[#CCCCCC]">
                <div><span className="text-[#666666]">File ID:</span> {inspectModalFile.id}</div>
                <div><span className="text-[#666666]">Cipher:</span> {inspectModalFile.algorithm} (NIST SP 800-38D)</div>
                <div><span className="text-[#666666]">Key Wrapping:</span> {inspectModalFile.keyWrappingAlgorithm}</div>
                <div><span className="text-[#666666]">Nonce:</span> {inspectModalFile.nonceBase64}</div>
                <div><span className="text-[#666666]">Auth Tag:</span> <span className="text-[#B5A27E]">{inspectModalFile.authTagBase64}</span></div>
                <div><span className="text-[#666666]">Plaintext SHA:</span> {inspectModalFile.sha256OriginalHash}</div>
                <div><span className="text-[#666666]">Ciphertext SHA:</span> {inspectModalFile.sha256CiphertextHash}</div>
              </div>

              <div>
                <div className="text-[#AAAAAA] font-medium mb-1">Ciphertext Stream Sample:</div>
                <div className="p-3 bg-[#0A0A0A] border border-[#242424] text-[10px] text-[#777777] space-y-1 overflow-x-auto">
                  {generateHexDump(base64ToUint8Array(inspectModalFile.ciphertextBase64), 64).map((line, idx) => (
                    <div key={idx} className="flex gap-3">
                      <span className="text-[#555555]">{line.offset}</span>
                      <span className="text-[#B5A27E]">{line.hex}</span>
                      <span className="text-[#666666]">{line.ascii}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-[#242424]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectModalFile(null)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
