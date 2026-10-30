import React from 'react';
import {
  Lock,
  Unlock,
  ShieldCheck,
  ArrowRight,
  FileText,
  Download,
  AlertTriangle,
  KeyRound,
  FileCheck2,
  HardDrive,
  Cpu,
  Layers,
  Bug,
} from 'lucide-react';
import { EncryptedVaultFile, SecurityAuditLog, UserSession } from '../../types/crypto';
import { Button } from '../ui/Button';

interface OverviewViewProps {
  files: EncryptedVaultFile[];
  auditLogs: SecurityAuditLog[];
  session: UserSession | null;
  onNavigate: (tab: string) => void;
  onSelectFileForTamper: (fileId: string) => void;
  onSelectFileForDecrypt: (fileId: string) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  files,
  auditLogs,
  session,
  onNavigate,
  onSelectFileForTamper,
  onSelectFileForDecrypt,
}) => {
  const totalEncryptedBytes = files.reduce((acc, f) => acc + f.encryptedSizeBytes, 0);
  const totalOriginalBytes = files.reduce((acc, f) => acc + f.originalSizeBytes, 0);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const recentFiles = files.slice(0, 5);
  const criticalAuditEvents = auditLogs.filter(
    (l) => l.severity === 'CRITICAL' || l.severity === 'WARNING'
  ).length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto font-sans">
      {/* Top Banner / Hero Card */}
      <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-[#666666]">
              <span className="font-semibold text-[#111111]">NIST FIPS 197</span>
              <span aria-hidden="true">·</span>
              <span>AES-256-GCM AEAD</span>
              <span aria-hidden="true">·</span>
              <span>RSA-3072 OAEP</span>
              <span aria-hidden="true">·</span>
              <span className="inline-flex items-center gap-1.5 text-[#16A34A] font-medium">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Engine Active
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#111111]">
              Cryptographic Security Dashboard
            </h1>

            <p className="text-sm sm:text-base text-[#666666] leading-relaxed max-w-2xl">
              High-assurance image encryption using authenticated envelope cryptography. Every file undergoes magic byte validation, EXIF metadata sanitization, symmetric encryption with unique 256-bit AES-GCM keys, and asymmetric wrapping with RSA-3072 OAEP.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('encrypt')}
                leftIcon={<Lock className="w-4 h-4" />}
              >
                Encrypt Image
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigate('decrypt')}
                leftIcon={<Unlock className="w-4 h-4" />}
              >
                Decrypt Container
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigate('security-tests')}
                leftIcon={<ShieldCheck className="w-4 h-4" />}
              >
                Run Security Tests
              </Button>
            </div>
          </div>

          {/* Quick Security Status Box */}
          <div className="lg:col-span-4 bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-5 space-y-3.5 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-[#E5E5E5]">
              <span className="font-semibold text-[#111111]">Security Environment</span>
              <span className="text-[#16A34A] font-semibold">Verified</span>
            </div>

            <div className="space-y-2 text-[#666666]">
              <div className="flex justify-between items-center">
                <span>Key Wrapping</span>
                <span className="font-mono text-[#111111] font-medium">RSA-3072 / SHA-256</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Payload Cipher</span>
                <span className="font-mono text-[#111111] font-medium">AES-256-GCM (128-bit Tag)</span>
              </div>
              <div className="flex justify-between items-center">
                <span>IV/Nonce Size</span>
                <span className="font-mono text-[#111111] font-medium">96 bits CSPRNG</span>
              </div>
              <div className="flex justify-between items-center">
                <span>EXIF Sanitizer</span>
                <span className="text-[#16A34A] font-medium">Enabled (Active)</span>
              </div>
              <div className="flex justify-between items-center pt-1 border-t border-[#E5E5E5]">
                <span>Active Fingerprint</span>
                <span className="font-mono text-[11px] text-[#111111] truncate max-w-[140px]">
                  {session?.keyFingerprint?.substring(0, 14)}...
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="border border-[#E5E5E5] bg-white rounded-lg p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#666666]">Protected Files</div>
          <div className="text-2xl sm:text-3xl font-bold text-[#111111] mt-2 tracking-tight">
            {files.length}
          </div>
          <div className="text-xs text-[#888888] mt-1 font-mono">
            {formatBytes(totalEncryptedBytes)} encrypted
          </div>
        </div>

        <div className="border border-[#E5E5E5] bg-white rounded-lg p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#666666]">Original Plaintext</div>
          <div className="text-2xl sm:text-3xl font-bold text-[#111111] mt-2 tracking-tight">
            {formatBytes(totalOriginalBytes)}
          </div>
          <div className="text-xs text-[#16A34A] mt-1 font-medium">
            100% integrity guaranteed
          </div>
        </div>

        <div className="border border-[#E5E5E5] bg-white rounded-lg p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#666666]">Cryptographic Events</div>
          <div className="text-2xl sm:text-3xl font-bold text-[#111111] mt-2 tracking-tight">
            {auditLogs.length}
          </div>
          <div className="text-xs text-[#666666] mt-1">
            {criticalAuditEvents > 0 ? (
              <span className="text-[#DC2626] font-medium">{criticalAuditEvents} warnings caught</span>
            ) : (
              <span>Immutable SIEM trail</span>
            )}
          </div>
        </div>

        <div className="border border-[#E5E5E5] bg-white rounded-lg p-5 shadow-xs">
          <div className="text-xs font-semibold text-[#666666]">Security Assurance</div>
          <div className="text-2xl sm:text-3xl font-bold text-[#111111] mt-2 tracking-tight">
            128-bit
          </div>
          <div className="text-xs text-[#888888] mt-1 font-mono">
            Galois Auth Tag GF(2¹²⁸)
          </div>
        </div>
      </div>

      {/* Main Action Modules: Encrypt & Decrypt Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Encrypt Card */}
        <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-[#111111] text-white flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111111]">
              Encrypt New Image
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
              Upload any image file (PNG, JPEG, WebP). The system validates magic bytes, strips all EXIF GPS metadata, generates an ephemeral 256-bit AES key, and produces a tamper-proof container.
            </p>
            <ul className="text-xs text-[#666666] space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                Zero unencrypted storage
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                Automated EXIF & GPS coordinate scrub
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                RSA-3072 envelope key wrapping
              </li>
            </ul>
          </div>
          <div>
            <Button
              variant="primary"
              size="md"
              className="w-full justify-center"
              onClick={() => onNavigate('encrypt')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Encryption Studio
            </Button>
          </div>
        </div>

        {/* Decrypt Card */}
        <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-xl p-6 sm:p-7 flex flex-col justify-between space-y-6">
          <div className="space-y-3">
            <div className="w-10 h-10 rounded-lg bg-white border border-[#E5E5E5] text-[#111111] flex items-center justify-center shadow-xs">
              <Unlock className="w-5 h-5" />
            </div>
            <h2 className="text-lg sm:text-xl font-bold text-[#111111]">
              Decrypt Container (.cvault)
            </h2>
            <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
              Authenticate and decrypt an existing container file. The engine validates the 128-bit Galois authentication tag, unwraps the AES session key, and verifies byte-for-byte integrity before rendering.
            </p>
            <ul className="text-xs text-[#666666] space-y-1.5 pt-1">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                Instant mathematical tamper detection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                Byte-level SHA-256 match confirmation
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#111111]" />
                Client-side private key decryption
              </li>
            </ul>
          </div>
          <div>
            <Button
              variant="secondary"
              size="md"
              className="w-full justify-center"
              onClick={() => onNavigate('decrypt')}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open Decryption Studio
            </Button>
          </div>
        </div>
      </div>

      {/* Recent Files Table / List */}
      <div className="border border-[#E5E5E5] bg-white rounded-xl shadow-xs overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-[#E5E5E5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-[#111111]">
              Secure Vault Files
            </h2>
            <p className="text-xs text-[#666666] mt-0.5">
              Ciphertexts stored in client storage with individual AES session keys
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onNavigate('vault')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All ({files.length})
          </Button>
        </div>

        {recentFiles.length === 0 ? (
          <div className="p-10 text-center text-[#666666]">
            <Lock className="w-8 h-8 mx-auto text-[#888888] mb-3 stroke-[1.5]" />
            <p className="text-sm font-semibold text-[#111111]">Vault is currently empty</p>
            <p className="text-xs text-[#666666] mt-1">
              Encrypt your first confidential image to see it listed here.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('encrypt')}
              className="mt-4"
            >
              Encrypt First Image
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F7F7F7] border-b border-[#E5E5E5] text-[#666666] uppercase font-mono text-[11px]">
                <tr>
                  <th className="py-3 px-4 font-semibold">Filename</th>
                  <th className="py-3 px-4 font-semibold">Cipher</th>
                  <th className="py-3 px-4 font-semibold">Original / Encrypted</th>
                  <th className="py-3 px-4 font-semibold hidden md:table-cell">Ciphertext Hash</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5E5] text-[#111111]">
                {recentFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#FAFAFA] transition-colors">
                    <td className="py-3.5 px-4 font-medium flex items-center gap-2.5">
                      <FileCheck2 className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <div className="min-w-0">
                        <div className="font-semibold text-sm truncate max-w-[180px] sm:max-w-xs">
                          {file.originalFilename}
                        </div>
                        <div className="text-[11px] text-[#666666] font-mono">
                          {new Date(file.createdAt).toLocaleDateString()} · {file.mimeType}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <span className="font-semibold">{file.algorithm}</span>
                      <div className="text-[#666666] text-[10px]">96b Nonce · 128b Tag</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div>{formatBytes(file.originalSizeBytes)}</div>
                      <div className="text-[#666666] text-[10px]">→ {formatBytes(file.encryptedSizeBytes)}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-[11px] text-[#666666] hidden md:table-cell">
                      <span className="font-mono" title={file.sha256CiphertextHash}>
                        {file.sha256CiphertextHash.substring(0, 16)}...
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => onSelectFileForDecrypt(file.id)}
                          leftIcon={<Unlock className="w-3 h-3" />}
                        >
                          Decrypt
                        </Button>
                        <Button
                          variant="outline"
                          size="xs"
                          onClick={() => onSelectFileForTamper(file.id)}
                          leftIcon={<Bug className="w-3 h-3" />}
                        >
                          Tamper Lab
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

      {/* Security Architecture Reference */}
      <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-xl p-6 sm:p-7 space-y-4">
        <h3 className="text-sm font-bold uppercase tracking-wider text-[#111111]">
          Cryptographic Flow & Defense in Depth
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="border border-[#E5E5E5] bg-white p-4 rounded-lg space-y-1.5 shadow-xs">
            <div className="font-mono text-[11px] font-semibold text-[#888888]">STEP 01</div>
            <div className="font-bold text-[#111111]">Magic Byte Validation</div>
            <p className="text-[#666666] leading-relaxed">
              Examines raw byte signatures to block disguised polyglots, Windows PE, and ELF binaries.
            </p>
          </div>

          <div className="border border-[#E5E5E5] bg-white p-4 rounded-lg space-y-1.5 shadow-xs">
            <div className="font-mono text-[11px] font-semibold text-[#888888]">STEP 02</div>
            <div className="font-bold text-[#111111]">EXIF Sanitization</div>
            <p className="text-[#666666] leading-relaxed">
              Rerenders raster pixels offscreen to strip camera serial numbers, GPS lat/long, and timestamps.
            </p>
          </div>

          <div className="border border-[#E5E5E5] bg-white p-4 rounded-lg space-y-1.5 shadow-xs">
            <div className="font-mono text-[11px] font-semibold text-[#888888]">STEP 03</div>
            <div className="font-bold text-[#111111]">AES-256-GCM AEAD</div>
            <p className="text-[#666666] leading-relaxed">
              Generates ephemeral 256-bit symmetric key and produces 128-bit authentication tag over GF(2¹²⁸).
            </p>
          </div>

          <div className="border border-[#E5E5E5] bg-white p-4 rounded-lg space-y-1.5 shadow-xs">
            <div className="font-mono text-[11px] font-semibold text-[#888888]">STEP 04</div>
            <div className="font-bold text-[#111111]">RSA-3072 Key Wrapping</div>
            <p className="text-[#666666] leading-relaxed">
              Wraps the AES session key using RSA-OAEP with SHA-256 padding. Private key protected by passphrase.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
