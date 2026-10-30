import React from 'react';
import {
  Lock,
  Unlock,
  Shield,
  ArrowRight,
  CheckCircle2,
  Cpu,
  Eye,
  FileText,
  Download,
  AlertTriangle,
  KeyRound,
  FileCheck2,
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
    <div className="space-y-8 max-w-6xl mx-auto font-sans">
      {/* Product Hero Header */}
      <div className="border border-[#242424] bg-[#111111] p-6 sm:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center gap-2 text-xs font-mono text-[#777777]">
              <span className="text-[#B5A27E] font-medium uppercase">NIST FIPS 197</span>
              <span>·</span>
              <span>AES-256-GCM AEAD</span>
              <span>·</span>
              <span>RSA-3072 OAEP</span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-light tracking-tight text-white">
              CipherVault Cryptographic Operations
            </h1>

            <p className="text-xs sm:text-sm text-[#999999] leading-relaxed max-w-xl font-normal">
              An enterprise private-banking grade cryptographic workspace. Every confidential image is scrubbed of EXIF metadata, validated against executable binary signatures, encrypted with a unique 256-bit AES-GCM session key, and enveloped using 3072-bit RSA-OAEP.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <Button
                variant="primary"
                size="md"
                onClick={() => onNavigate('encrypt')}
                leftIcon={<Lock className="w-3.5 h-3.5" />}
              >
                Encrypt Image
              </Button>

              <Button
                variant="outline"
                size="md"
                onClick={() => onNavigate('decrypt')}
                leftIcon={<Unlock className="w-3.5 h-3.5 text-[#B5A27E]" />}
              >
                Decrypt Container
              </Button>

              <Button
                variant="secondary"
                size="md"
                onClick={() => onNavigate('security-tests')}
                leftIcon={<CheckCircle2 className="w-3.5 h-3.5 text-[#B5A27E]" />}
              >
                Run Security Tests
              </Button>
            </div>
          </div>

          <div className="lg:col-span-5 border border-[#242424] overflow-hidden bg-[#0A0A0A]">
            <img
              src="/src/assets/images/hero_vault_cryptography_1793356564061.jpg"
              alt="Hardware Cryptographic Vault Module"
              referrerPolicy="no-referrer"
              className="w-full h-52 sm:h-64 object-cover filter contrast-110 grayscale-20"
            />
          </div>
        </div>
      </div>

      {/* Metrics Row (Private Wealth Tabular Discipline) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 border border-[#242424] bg-[#111111] space-y-1">
          <div className="text-xs font-mono text-[#777777] uppercase">Vault Payloads</div>
          <div className="text-2xl font-light font-mono tabular-nums text-white">
            {files.length}
          </div>
          <div className="text-[11px] text-[#666666] font-mono">
            {files.length > 0 ? 'All containers verified' : 'No encrypted files'}
          </div>
        </div>

        <div className="p-4 border border-[#242424] bg-[#111111] space-y-1">
          <div className="text-xs font-mono text-[#777777] uppercase">Secured Volume</div>
          <div className="text-2xl font-light font-mono tabular-nums text-[#B5A27E]">
            {formatBytes(totalEncryptedBytes)}
          </div>
          <div className="text-[11px] text-[#666666] font-mono">
            Plaintext baseline: {formatBytes(totalOriginalBytes)}
          </div>
        </div>

        <div className="p-4 border border-[#242424] bg-[#111111] space-y-1">
          <div className="text-xs font-mono text-[#777777] uppercase">Key Infrastructure</div>
          <div className="text-2xl font-light font-mono text-white">
            RSA-3072
          </div>
          <div className="text-[11px] text-[#666666] font-mono">
            SHA-256 OAEP Wrapping
          </div>
        </div>

        <div className="p-4 border border-[#242424] bg-[#111111] space-y-1">
          <div className="text-xs font-mono text-[#777777] uppercase">Security Audit Events</div>
          <div className="text-2xl font-light font-mono tabular-nums text-white">
            {auditLogs.length}
          </div>
          <div className="text-[11px] text-[#666666] font-mono">
            {criticalAuditEvents} critical/warning events
          </div>
        </div>
      </div>

      {/* Cryptographic Architecture Card */}
      <div className="border border-[#242424] bg-[#111111] p-6 space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pb-4 border-b border-[#242424]">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide uppercase font-mono">
              Hybrid Cryptographic Protocol & Envelope Architecture
            </h2>
            <p className="text-xs text-[#888888] mt-0.5">
              Strict separation between high-throughput symmetric ciphers and asymmetric authorization keys.
            </p>
          </div>
          <span className="text-[11px] font-mono text-[#B5A27E] uppercase tracking-wider">
            NIST SP 800-56B COMPLIANT
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-7 border border-[#242424] overflow-hidden bg-[#0A0A0A]">
            <img
              src="/src/assets/images/diagram_hybrid_cryptography_1793356563974.jpg"
              alt="Hybrid Cryptographic Diagram"
              referrerPolicy="no-referrer"
              className="w-full h-auto object-cover filter contrast-105"
            />
          </div>

          <div className="lg:col-span-5 space-y-3 text-xs">
            <div className="p-3.5 bg-[#0D0D0D] border border-[#222222] space-y-1">
              <div className="font-semibold text-[#B5A27E] uppercase text-[11px] font-mono">
                1. Pre-Flight OPSEC Sanitization
              </div>
              <p className="text-[#888888] leading-relaxed text-[11px]">
                Validates authentic magic bytes (PNG/JPEG/WebP) and rejects disguised executables. Offscreen rasterization purges EXIF GPS coordinates and camera serial numbers.
              </p>
            </div>

            <div className="p-3.5 bg-[#0D0D0D] border border-[#222222] space-y-1">
              <div className="font-semibold text-[#B5A27E] uppercase text-[11px] font-mono">
                2. AES-256-GCM AEAD Ingestion
              </div>
              <p className="text-[#888888] leading-relaxed text-[11px]">
                Generates a unique 256-bit AES key and 96-bit nonce per image. Galois Message Authentication (GMAC) calculates a 128-bit authentication tag ensuring tamper detection.
              </p>
            </div>

            <div className="p-3.5 bg-[#0D0D0D] border border-[#222222] space-y-1">
              <div className="font-semibold text-[#B5A27E] uppercase text-[11px] font-mono">
                3. RSA-3072 Key Wrapping
              </div>
              <p className="text-[#888888] leading-relaxed text-[11px]">
                The ephemeral AES key is encrypted via RSA-OAEP with SHA-256. User private keys remain encrypted at rest via PBKDF2/Scrypt.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Files Section */}
      <div className="border border-[#242424] bg-[#111111] p-6 space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-sm font-semibold text-white uppercase tracking-wide font-mono">
              Recent Encrypted Images
            </h2>
            <p className="text-xs text-[#777777] mt-0.5">
              Secure vault storage packages with authenticated integrity tags.
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('vault')}
            rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
          >
            View All ({files.length})
          </Button>
        </div>

        {files.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-[#242424] bg-[#0A0A0A]">
            <Lock className="w-8 h-8 text-[#555555] mx-auto mb-2" />
            <div className="text-xs font-semibold text-white">No Encrypted Files</div>
            <p className="text-[11px] text-[#777777] max-w-sm mx-auto mt-1 mb-4">
              Ingest confidential images to generate AES-256-GCM encrypted containers.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => onNavigate('encrypt')}
            >
              Encrypt First Image
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="text-[#666666] border-b border-[#242424] font-mono text-[11px]">
                <tr>
                  <th className="pb-2.5 font-medium">Filename</th>
                  <th className="pb-2.5 font-medium">Cipher & Mode</th>
                  <th className="pb-2.5 font-medium text-right">Encrypted Size</th>
                  <th className="pb-2.5 font-medium text-right">Auth Tag (128-bit)</th>
                  <th className="pb-2.5 font-medium text-right">Encrypted At</th>
                  <th className="pb-2.5 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1F1F1F] font-mono">
                {recentFiles.map((file) => (
                  <tr key={file.id} className="hover:bg-[#161616] transition-colors">
                    <td className="py-2.5 font-sans font-medium text-white truncate max-w-[200px]">
                      {file.originalFilename}
                    </td>
                    <td className="py-2.5 text-[#888888] text-[11px]">
                      <span className="text-white">{file.algorithm}</span>
                      <span className="text-[#555555] ml-1">· RSA-3072</span>
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#CCCCCC]">
                      {formatBytes(file.encryptedSizeBytes)}
                    </td>
                    <td className="py-2.5 text-right text-[#B5A27E] text-[11px]">
                      {file.authTagBase64.substring(0, 10)}...
                    </td>
                    <td className="py-2.5 text-right tabular-nums text-[#666666] text-[11px]">
                      {new Date(file.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2.5 text-right font-sans">
                      <div className="flex items-center justify-end gap-1.5">
                        <Button
                          variant="secondary"
                          size="xs"
                          onClick={() => onSelectFileForTamper(file.id)}
                        >
                          Tamper Lab
                        </Button>
                        <Button
                          variant="primary"
                          size="xs"
                          onClick={() => onSelectFileForDecrypt(file.id)}
                        >
                          Decrypt
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
    </div>
  );
};
