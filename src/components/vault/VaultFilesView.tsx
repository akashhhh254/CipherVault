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
  Check,
  Bug,
  FileCheck2,
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

  // Decryption modal state
  const [decryptPassword, setDecryptPassword] = useState(
    vaultStore.getSessionPassword() || 'MasterP@ssw0rd!2026'
  );
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

  const handleExecuteModalDecryption = async () => {
    if (!selectedFileForModal) return;
    setIsDecrypting(true);
    setDecryptError(null);

    const startTime = performance.now();
    try {
      const keyBundle = vaultStore.getKeyBundle();
      if (!keyBundle) {
        throw new Error('No RSA key pair registered in current session.');
      }

      const unlockedKeyPem = await unlockPrivateKey(keyBundle, decryptPassword);

      const pkg = {
        ciphertextBase64: selectedFileForModal.ciphertextBase64,
        nonceBase64: selectedFileForModal.nonceBase64,
        authTagBase64: selectedFileForModal.authTagBase64,
        wrappedKeyBase64: selectedFileForModal.wrappedKeyBase64,
        sha256OriginalHash: selectedFileForModal.sha256OriginalHash,
        sha256CiphertextHash: selectedFileForModal.sha256CiphertextHash,
      };

      const result = await decryptImageHybrid(pkg, unlockedKeyPem);
      const endTime = performance.now();

      const blob = new Blob([result.plaintextBytes as Uint8Array<ArrayBuffer>], {
        type: selectedFileForModal.mimeType || 'image/png',
      });
      const objectUrl = URL.createObjectURL(blob);

      setDecryptedImageSrc(objectUrl);
      setDecryptionStats({
        durationMs: Math.round(endTime - startTime),
        sha256Recovered: result.recoveredSha256,
        integrityVerified: result.recoveredSha256 === selectedFileForModal.sha256OriginalHash,
      });

      addToast('success', 'File Decrypted', 'Integrity verified and image restored.');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Decryption failed';
      setDecryptError(message);
      addToast('error', 'Decryption Failed', message);
    } finally {
      setIsDecrypting(false);
    }
  };

  const handleDownloadContainer = (file: EncryptedVaultFile) => {
    const container = {
      cipher_vault_version: '2.0.0',
      standard: 'NIST-SP-800-38D',
      algorithm: file.algorithm,
      key_wrapping: file.keyWrappingAlgorithm,
      recipient_fingerprint: file.rsaKeyFingerprint,
      original_filename: file.originalFilename,
      mime_type: file.mimeType,
      sha256_original_hash: file.sha256OriginalHash,
      sha256_ciphertext_hash: file.sha256CiphertextHash,
      nonce_base64: file.nonceBase64,
      auth_tag_base64: file.authTagBase64,
      wrapped_key_base64: file.wrappedKeyBase64,
      ciphertext_base64: file.ciphertextBase64,
      exif_sanitized: file.exifStripped,
      created_at: file.createdAt,
    };

    const blob = new Blob([JSON.stringify(container, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${file.originalFilename.replace(/\.[^/.]+$/, '')}.cvault`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'Exported Container', `Saved ${file.originalFilename}.cvault`);
  };

  const handleDeleteFile = (fileId: string, filename: string) => {
    if (window.confirm(`Permanently remove "${filename}" from vault storage?`)) {
      vaultStore.deleteFile(fileId);
      addToast('info', 'File Deleted', `Removed ${filename}`);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header & Search */}
      <div className="border-b border-[#E5E5E5] pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-[#666666] mb-1 font-mono">
            <span>Client Vault Storage</span>
            <span aria-hidden="true">·</span>
            <span>{files.length} Secure Images</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Vault Files & History
          </h1>
        </div>

        <div className="w-full sm:w-72">
          <Input
            placeholder="Search files by name or algorithm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4" />}
          />
        </div>
      </div>

      {/* Files Table Card */}
      <div className="border border-[#E5E5E5] bg-white rounded-xl shadow-xs overflow-hidden">
        {filteredFiles.length === 0 ? (
          <div className="p-12 text-center text-[#666666]">
            <Lock className="w-8 h-8 mx-auto text-[#888888] mb-3 stroke-[1.5]" />
            <p className="text-sm font-semibold text-[#111111]">No files matching search criteria</p>
            <p className="text-xs text-[#666666] mt-1">
              Try adjusting your query or encrypt a new image.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666] uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Filename</th>
                  <th className="py-3 px-4 font-semibold">Algorithm</th>
                  <th className="py-3 px-4 font-semibold">Size</th>
                  <th className="py-3 px-4 font-semibold hidden lg:table-cell">128-bit Auth Tag</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Created</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-[#111111]">
                {filteredFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2.5">
                      <FileCheck2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate max-w-[160px] sm:max-w-xs">
                          {file.originalFilename}
                        </div>
                        <div className="text-[11px] text-[#666666] font-mono">
                          {file.mimeType} · {file.exifStripped ? 'EXIF Scrubbed' : 'Raw'}
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="font-semibold">{file.algorithm}</span>
                      <div className="text-[#666666] text-[10px]">RSA-OAEP Wrap</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>{formatBytes(file.encryptedSizeBytes)}</div>
                      <div className="text-[#666666] text-[10px]">Orig: {formatBytes(file.originalSizeBytes)}</div>
                    </td>

                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666] hidden lg:table-cell">
                      <span className="truncate max-w-[120px] inline-block font-mono" title={file.authTagBase64}>
                        {file.authTagBase64.substring(0, 14)}...
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-[#666666] text-xs hidden md:table-cell whitespace-nowrap">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5 flex-wrap">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => handleStartDecryption(file)}
                          leftIcon={<Unlock className="w-3 h-3" />}
                        >
                          Decrypt
                        </Button>

                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => setInspectModalFile(file)}
                          leftIcon={<Eye className="w-3 h-3" />}
                          className="hidden sm:inline-flex"
                        >
                          Inspect
                        </Button>

                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => onSelectTamper(file.id)}
                          leftIcon={<Bug className="w-3 h-3" />}
                          className="hidden sm:inline-flex"
                        >
                          Tamper
                        </Button>

                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDownloadContainer(file)}
                          aria-label="Download container"
                          title="Download container"
                        >
                          <Download className="w-3.5 h-3.5 text-[#111111]" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="xs"
                          onClick={() => handleDeleteFile(file.id, file.originalFilename)}
                          aria-label="Delete file"
                          title="Delete file"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-[#DC2626]" />
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

      {/* Decrypt Modal Dialog */}
      {selectedFileForModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="border border-[#E5E5E5] bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <h2 className="text-base font-bold text-[#111111]">
                  Decrypt & Verify Container
                </h2>
                <p className="text-xs text-[#666666] truncate max-w-sm mt-0.5 font-mono">
                  {selectedFileForModal.originalFilename}
                </p>
              </div>
              <button
                onClick={() => setSelectedFileForModal(null)}
                className="text-[#888888] hover:text-[#111111] p-1 rounded-sm cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <Input
                label="Master Passphrase"
                type="password"
                value={decryptPassword}
                onChange={(e) => setDecryptPassword(e.target.value)}
                placeholder="Enter passphrase to unlock private key..."
              />
              <Button
                variant="primary"
                size="md"
                onClick={handleExecuteModalDecryption}
                isLoading={isDecrypting}
                className="w-full justify-center"
              >
                Authenticate & Decrypt
              </Button>
            </div>

            {decryptError && (
              <div className="p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-md text-xs text-[#DC2626]">
                {decryptError}
              </div>
            )}

            {decryptedImageSrc && decryptionStats && (
              <div className="space-y-4 pt-3 border-t border-[#E5E5E5]">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#16A34A] font-semibold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Integrity Verified
                  </span>
                  <span className="font-mono text-[#666666]">{decryptionStats.durationMs} ms</span>
                </div>

                <div className="p-2 border border-[#E5E5E5] rounded-lg bg-[#F7F7F7] flex items-center justify-center">
                  <img
                    src={decryptedImageSrc}
                    alt="Decrypted result"
                    className="max-h-56 max-w-full object-contain rounded"
                  />
                </div>

                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const a = document.createElement('a');
                    a.href = decryptedImageSrc;
                    a.download = `decrypted_${selectedFileForModal.originalFilename}`;
                    a.click();
                  }}
                  leftIcon={<Download className="w-4 h-4" />}
                  className="w-full justify-center"
                >
                  Download Decrypted Image
                </Button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Inspect Modal Dialog */}
      {inspectModalFile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="border border-[#E5E5E5] bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-5">
            <div className="flex items-start justify-between pb-3 border-b border-[#E5E5E5]">
              <div>
                <h2 className="text-base font-bold text-[#111111]">
                  Cryptographic Envelope Inspection
                </h2>
                <p className="text-xs text-[#666666] truncate max-w-md mt-0.5 font-mono">
                  {inspectModalFile.originalFilename}
                </p>
              </div>
              <button
                onClick={() => setInspectModalFile(null)}
                className="text-[#888888] hover:text-[#111111] p-1 rounded-sm cursor-pointer"
                aria-label="Close dialog"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg space-y-2">
                <div className="font-semibold text-[#111111]">Envelope Properties</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#666666]">
                  <div>Cipher: <span className="font-mono text-[#111111]">{inspectModalFile.algorithm}</span></div>
                  <div>Key Wrap: <span className="font-mono text-[#111111]">{inspectModalFile.keyWrappingAlgorithm}</span></div>
                  <div>Plaintext Size: <span className="font-mono text-[#111111]">{formatBytes(inspectModalFile.originalSizeBytes)}</span></div>
                  <div>Encrypted Size: <span className="font-mono text-[#111111]">{formatBytes(inspectModalFile.encryptedSizeBytes)}</span></div>
                </div>
              </div>

              <div>
                <div className="font-semibold text-[#111111] mb-1">128-bit Authentication Tag (GMAC)</div>
                <div className="p-2.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded font-mono text-[11px] text-[#111111] break-all">
                  {inspectModalFile.authTagBase64}
                </div>
              </div>

              <div>
                <div className="font-semibold text-[#111111] mb-1">96-bit Nonce / IV</div>
                <div className="p-2.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded font-mono text-[11px] text-[#111111] break-all">
                  {inspectModalFile.nonceBase64}
                </div>
              </div>

              <div>
                <div className="font-semibold text-[#111111] mb-1">SHA-256 Ciphertext Digest</div>
                <div className="p-2.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded font-mono text-[11px] text-[#111111] break-all">
                  {inspectModalFile.sha256CiphertextHash}
                </div>
              </div>

              <div>
                <div className="font-semibold text-[#111111] mb-1">Wrapped AES Session Key (RSA-3072 OAEP)</div>
                <div className="p-2.5 bg-[#F7F7F7] border border-[#E5E5E5] rounded font-mono text-[11px] text-[#111111] break-all max-h-24 overflow-y-auto">
                  {inspectModalFile.wrappedKeyBase64}
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setInspectModalFile(null)}
              >
                Close Inspector
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
