import React, { useState } from 'react';
import { KeyRound, Download, RefreshCw, X, Lock, Copy, Check } from 'lucide-react';
import { vaultStore } from '../../lib/vaultStore';
import { generateAndProtectRsaKeyPair } from '../../lib/cryptoEngine';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { useToast } from '../ui/Toast';

interface KeyManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyManagementModal: React.FC<KeyManagementModalProps> = ({ isOpen, onClose }) => {
  const { addToast } = useToast();
  const [copied, setCopied] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [rotationPassword, setRotationPassword] = useState('');
  const [showRotationForm, setShowRotationForm] = useState(false);

  if (!isOpen) return null;

  const keyBundle = vaultStore.getKeyBundle();

  const handleCopyPublicKey = () => {
    if (!keyBundle) return;
    navigator.clipboard.writeText(keyBundle.publicKeyPem);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    addToast('info', 'Copied Public Key', 'SPKI PEM copied to clipboard.');
  };

  const handleDownloadPublicKey = () => {
    if (!keyBundle) return;
    const blob = new Blob([keyBundle.publicKeyPem], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ciphervault_rsa3072_${keyBundle.publicKeyFingerprint.substring(0, 8)}.pub`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'Exported Public Key', 'Saved RSA-3072 .pub file.');
  };

  const handleDownloadEncryptedBackup = () => {
    if (!keyBundle) return;
    const backupEnvelope = {
      backup_type: 'CIPHERVAULT_PROTECTED_KEY_BUNDLE',
      algorithm: 'RSA-3072-OAEP',
      private_key_protection: 'AES-256-GCM + PBKDF2-SHA256 (600k rounds)',
      public_key_fingerprint: keyBundle.publicKeyFingerprint,
      public_key_pem: keyBundle.publicKeyPem,
      encrypted_private_key_b64: keyBundle.encryptedPrivateKeyBase64,
      salt_b64: keyBundle.saltBase64,
      nonce_b64: keyBundle.nonceBase64,
      auth_tag_b64: keyBundle.authTagBase64,
      exported_at: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(backupEnvelope, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ciphervault_backup_${keyBundle.publicKeyFingerprint.substring(0, 8)}.cvaultkey`;
    a.click();
    URL.revokeObjectURL(url);
    addToast('info', 'Downloaded Key Backup', 'Saved encrypted .cvaultkey envelope.');
  };

  const handleRotateKeyPair = async () => {
    setIsRotating(true);
    try {
      const pwd = rotationPassword.trim() || 'MasterP@ssw0rd!2026';
      const newBundle = await generateAndProtectRsaKeyPair(pwd);
      vaultStore.setKeyBundle(newBundle);
      vaultStore.addAuditLog({
        id: `aud_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: 'key_system',
        filename: 'key_rotation',
        action: 'KEY_ROTATION',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `RSA-3072 key pair rotated. New fingerprint: ${newBundle.publicKeyFingerprint.substring(0, 16)}...`,
      });
      setShowRotationForm(false);
      setRotationPassword('');
      addToast('success', 'Key Pair Rotated', 'New 3072-bit RSA key pair active in session.');
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans">
      <div className="relative w-full max-w-xl border border-[#262626] bg-[#111111] shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#242424]">
          <div className="flex items-center gap-2 text-white font-semibold text-xs font-mono uppercase">
            <KeyRound className="w-3.5 h-3.5 text-[#B5A27E]" />
            <span>Asymmetric Key Vault: RSA-3072</span>
          </div>
          <button onClick={onClose} className="text-[#666666] hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-3 bg-[#0A0A0A] border border-[#222222] text-[11px] space-y-1 font-mono text-[#CCCCCC]">
          <div className="font-semibold text-[#B5A27E] uppercase">Private Key Protection Invariant:</div>
          <p className="text-[#888888] leading-relaxed text-[10px]">
            The RSA-3072 private key never resides in plaintext. It is encrypted with 256-bit AES-GCM using a key derived via PBKDF2-SHA256 (600,000 rounds) with a 32-byte salt.
          </p>
        </div>

        {keyBundle ? (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 bg-[#0A0A0A] border border-[#242424]">
                <div className="text-[#666666] text-[10px] mb-0.5 uppercase">Modulus Length</div>
                <div className="text-white font-semibold">3072 Bits</div>
              </div>
              <div className="p-2.5 bg-[#0A0A0A] border border-[#242424]">
                <div className="text-[#666666] text-[10px] mb-0.5 uppercase">Exponent (e)</div>
                <div className="text-white font-semibold">65537</div>
              </div>
            </div>

            <div>
              <div className="text-[11px] font-mono text-[#888888] uppercase mb-1">
                SHA-256 Public Fingerprint:
              </div>
              <div className="p-2 bg-[#0A0A0A] border border-[#242424] font-mono text-[11px] text-[#B5A27E] break-all select-all">
                {keyBundle.publicKeyFingerprint}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-[11px] font-mono text-[#888888] uppercase mb-1">
                <span>Public Key (SPKI PEM):</span>
                <button
                  onClick={handleCopyPublicKey}
                  className="flex items-center gap-1 text-[10px] text-[#B5A27E] hover:underline"
                >
                  {copied ? <Check className="w-3 h-3 text-[#B5A27E]" /> : <Copy className="w-3 h-3" />}
                  <span>{copied ? 'Copied' : 'Copy PEM'}</span>
                </button>
              </div>
              <pre className="p-2.5 bg-[#0A0A0A] border border-[#242424] font-mono text-[10px] text-[#888888] max-h-28 overflow-y-auto leading-relaxed">
                {keyBundle.publicKeyPem}
              </pre>
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#242424]">
              <Button
                variant="outline"
                size="xs"
                onClick={handleDownloadPublicKey}
                leftIcon={<Download className="w-3 h-3" />}
              >
                Export .pub
              </Button>

              <Button
                variant="secondary"
                size="xs"
                onClick={handleDownloadEncryptedBackup}
                leftIcon={<Lock className="w-3 h-3 text-[#B5A27E]" />}
              >
                Download .cvaultkey Backup
              </Button>

              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowRotationForm(!showRotationForm)}
                className="text-[#B5A27E] hover:text-white ml-auto"
                leftIcon={<RefreshCw className="w-3 h-3" />}
              >
                Rotate Keys
              </Button>
            </div>

            {showRotationForm && (
              <div className="p-3.5 bg-[#141414] border border-[#333333] space-y-2.5">
                <div className="text-xs font-semibold text-white uppercase font-mono">
                  Key Rotation Confirmation
                </div>
                <Input
                  label="Master Password (to seal new private key):"
                  type="password"
                  placeholder="MasterP@ssw0rd!2026"
                  value={rotationPassword}
                  onChange={(e) => setRotationPassword(e.target.value)}
                />
                <div className="flex justify-end gap-2 pt-1">
                  <Button
                    variant="ghost"
                    size="xs"
                    onClick={() => setShowRotationForm(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="xs"
                    onClick={handleRotateKeyPair}
                    isLoading={isRotating}
                  >
                    Confirm Rotation
                  </Button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-6 text-xs text-[#666666] font-mono">
            No active RSA-3072 key pair in session.
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[#242424]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};
