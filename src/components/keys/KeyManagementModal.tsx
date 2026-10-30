import React, { useState } from 'react';
import { KeyRound, Download, RefreshCw, X, Lock, Copy, Check, ShieldCheck } from 'lucide-react';
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
    addToast('info', 'Public Key Copied', 'SPKI PEM copied to clipboard.');
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
    addToast('info', 'Public Key Exported', 'Saved RSA-3072 .pub file.');
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
    addToast('info', 'Key Backup Downloaded', 'Saved encrypted .cvaultkey envelope.');
  };

  const handleRotateKeyPair = async () => {
    if (!rotationPassword.trim()) {
      addToast('error', 'Passphrase Required', 'Please enter a master passphrase to protect the new private key.');
      return;
    }

    setIsRotating(true);
    try {
      const newBundle = await generateAndProtectRsaKeyPair(rotationPassword.trim());
      vaultStore.setKeyBundle(newBundle);
      vaultStore.setSessionPassword(rotationPassword.trim());

      vaultStore.addAuditLog({
        id: `aud_rot_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: 'key_manager',
        filename: 'rsa_keypair',
        action: 'KEY_PAIR_ROTATION',
        status: 'SUCCESS',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Generated new RSA-3072 key pair. New fingerprint: ${newBundle.publicKeyFingerprint.substring(0, 16)}...`,
      });

      addToast('success', 'Key Pair Rotated', 'New RSA-3072 key pair active and protected at rest.');
      setShowRotationForm(false);
      setRotationPassword('');
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Rotation error';
      addToast('error', 'Rotation Failed', message);
    } finally {
      setIsRotating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="border border-[#E5E5E5] bg-white rounded-xl shadow-xl max-w-xl w-full max-h-[90vh] overflow-y-auto p-6 space-y-6 font-sans">
        {/* Modal Header */}
        <div className="flex items-start justify-between pb-4 border-b border-[#E5E5E5]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#F7F7F7] border border-[#E5E5E5] flex items-center justify-center text-[#111111]">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111111]">
                RSA-3072 Key Pair Management
              </h2>
              <p className="text-xs text-[#666666]">
                Asymmetric key wrapping under NIST SP 800-57 guidelines
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#888888] hover:text-[#111111] p-1 rounded-sm cursor-pointer"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Key Fingerprint Card */}
        {keyBundle ? (
          <div className="space-y-4">
            <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-lg p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#111111]">Public Key SHA-256 Fingerprint</span>
                <span className="text-[#16A34A] font-medium flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> 3072-bit Active
                </span>
              </div>
              <div className="font-mono text-[11px] text-[#111111] bg-white border border-[#E5E5E5] p-2 rounded break-all">
                {keyBundle.publicKeyFingerprint}
              </div>
              <div className="text-[11px] text-[#666666]">
                Private Key Protection: AES-256-GCM + Scrypt/PBKDF2 encrypted in client storage
              </div>
            </div>

            {/* Public Key SPKI PEM Viewer */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-[#111111]">Public Key (SPKI PEM)</span>
                <button
                  onClick={handleCopyPublicKey}
                  className="text-[#666666] hover:text-[#111111] flex items-center gap-1 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-[#16A34A]" /> : <Copy className="w-3.5 h-3.5" />}
                  <span className="text-[11px]">Copy</span>
                </button>
              </div>
              <textarea
                readOnly
                rows={5}
                value={keyBundle.publicKeyPem}
                className="w-full bg-[#F7F7F7] border border-[#E5E5E5] rounded p-2.5 font-mono text-[11px] text-[#111111] resize-none outline-none"
              />
            </div>

            {/* Key Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadPublicKey}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Download .pub File
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleDownloadEncryptedBackup}
                leftIcon={<Download className="w-3.5 h-3.5" />}
              >
                Export Encrypted .cvaultkey
              </Button>
            </div>
          </div>
        ) : (
          <div className="p-6 text-center text-[#666666] text-xs">
            No RSA key pair currently initialized.
          </div>
        )}

        {/* Rotate Key Pair Form */}
        <div className="pt-4 border-t border-[#E5E5E5] space-y-4">
          {!showRotationForm ? (
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#111111]">Need a new key pair?</div>
                <div className="text-[11px] text-[#666666]">
                  Generating a new pair will not delete previously encrypted files.
                </div>
              </div>
              <Button
                variant="outline"
                size="xs"
                onClick={() => setShowRotationForm(true)}
                leftIcon={<RefreshCw className="w-3 h-3" />}
              >
                Rotate Key Pair
              </Button>
            </div>
          ) : (
            <div className="space-y-3 p-4 bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg">
              <div className="text-xs font-semibold text-[#111111]">
                Rotate RSA-3072 Key Pair
              </div>
              <Input
                label="Master Passphrase (Protects Private Key)"
                type="password"
                value={rotationPassword}
                onChange={(e) => setRotationPassword(e.target.value)}
                placeholder="Enter strong passphrase..."
              />
              <div className="flex items-center justify-end gap-2 pt-1">
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
                  Generate New Keys
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-[#E5E5E5] flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
};
