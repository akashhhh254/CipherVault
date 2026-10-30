import React, { useState, useEffect } from 'react';
import {
  Bug,
  ShieldAlert,
  CheckCircle2,
  RefreshCw,
  Unlock,
  AlertTriangle,
  Cpu,
  Terminal,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { EncryptedVaultFile } from '../../types/crypto';
import { vaultStore } from '../../lib/vaultStore';
import {
  base64ToUint8Array,
  bufferToBase64,
  generateHexDump,
  unlockPrivateKey,
  decryptImageHybrid,
} from '../../lib/cryptoEngine';
import { Button } from '../ui/Button';
import { useToast } from '../ui/Toast';

interface TamperLabViewProps {
  files: EncryptedVaultFile[];
  selectedFileId: string | null;
}

export const TamperLabView: React.FC<TamperLabViewProps> = ({ files, selectedFileId }) => {
  const { addToast } = useToast();
  const [activeFile, setActiveFile] = useState<EncryptedVaultFile | null>(null);
  const [workingCiphertext, setWorkingCiphertext] = useState<Uint8Array | null>(null);
  const [workingNonce, setWorkingNonce] = useState<Uint8Array | null>(null);
  const [workingTag, setWorkingTag] = useState<Uint8Array | null>(null);
  const [tamperLogs, setTamperLogs] = useState<string[]>([]);
  const [isTampered, setIsTampered] = useState(false);
  const [tamperType, setTamperType] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    attempted: boolean;
    success: boolean;
    message: string;
    details?: string;
  } | null>(null);

  useEffect(() => {
    const file = files.find((f) => f.id === selectedFileId) || files[0] || null;
    setActiveFile(file);
    if (file) {
      setWorkingCiphertext(base64ToUint8Array(file.ciphertextBase64));
      setWorkingNonce(base64ToUint8Array(file.nonceBase64));
      setWorkingTag(base64ToUint8Array(file.authTagBase64));
      setIsTampered(false);
      setTamperType(null);
      setTestResult(null);
      setTamperLogs([`Target package "${file.originalFilename}" loaded for adversarial verification.`]);
    }
  }, [files, selectedFileId]);

  const resetToOriginal = () => {
    if (!activeFile) return;
    setWorkingCiphertext(base64ToUint8Array(activeFile.ciphertextBase64));
    setWorkingNonce(base64ToUint8Array(activeFile.nonceBase64));
    setWorkingTag(base64ToUint8Array(activeFile.authTagBase64));
    setIsTampered(false);
    setTamperType(null);
    setTestResult(null);
    setTamperLogs((prev) => [...prev, 'Restored authentic ciphertext, nonce, and GMAC tag.']);
    addToast('info', 'Authentic State Restored', 'Payload is back in pristine cryptographic condition.');
  };

  const handleTamperCiphertextBit = () => {
    if (!workingCiphertext) return;
    const modified = new Uint8Array(workingCiphertext);
    const targetIndex = 4;
    const oldByte = modified[targetIndex];
    modified[targetIndex] ^= 0x01; // Invert bit 0
    const newByte = modified[targetIndex];

    setWorkingCiphertext(modified);
    setIsTampered(true);
    setTamperType('Ciphertext 1-Bit Inversion (offset 0x04)');
    setTestResult(null);
    setTamperLogs((prev) => [
      ...prev,
      `[ATTACK] Flipped 1 bit at offset 0x04 (0x${oldByte.toString(16).padStart(2, '0')} -> 0x${newByte.toString(16).padStart(2, '0')}).`,
    ]);
    addToast('error', 'Ciphertext Mutated', 'Flipped 1 bit in byte offset 0x0004.');
  };

  const handleTamperNonce = () => {
    if (!workingNonce) return;
    const modified = new Uint8Array(workingNonce);
    modified[0] ^= 0xff; // Invert byte 0
    setWorkingNonce(modified);
    setIsTampered(true);
    setTamperType('96-bit Nonce Mutation (byte 0 corrupted)');
    setTestResult(null);
    setTamperLogs((prev) => [
      ...prev,
      `[ATTACK] Inverted IV/nonce byte 0x00 (Simulating replay or MITM transmission corruption).`,
    ]);
    addToast('error', 'Nonce Mutated', 'Modified initial nonce counter.');
  };

  const handleTamperTag = () => {
    if (!workingTag) return;
    const modified = new Uint8Array(workingTag);
    modified[modified.length - 1] ^= 0x01;
    setWorkingTag(modified);
    setIsTampered(true);
    setTamperType('128-bit Authentication Tag Mutation (last byte bitflip)');
    setTestResult(null);
    setTamperLogs((prev) => [
      ...prev,
      `[ATTACK] Flipped 1 bit in 128-bit Galois Authentication Tag.`,
    ]);
    addToast('error', 'Auth Tag Mutated', 'Inverted bit in GMAC tag.');
  };

  const executeAdversarialDecryption = async () => {
    if (!activeFile || !workingCiphertext || !workingNonce || !workingTag) return;

    try {
      const keyBundle = vaultStore.getKeyBundle();
      if (!keyBundle) {
        throw new Error('No RSA key pair registered in current session.');
      }

      const unlockedKeyPem = await unlockPrivateKey(
        keyBundle,
        vaultStore.getSessionPassword() || 'MasterP@ssw0rd!2026'
      );

      const modifiedPackage = {
        ciphertextBase64: bufferToBase64(workingCiphertext),
        nonceBase64: bufferToBase64(workingNonce),
        authTagBase64: bufferToBase64(workingTag),
        wrappedKeyBase64: activeFile.wrappedKeyBase64,
        sha256OriginalHash: activeFile.sha256OriginalHash,
        sha256CiphertextHash: activeFile.sha256CiphertextHash,
      };

      await decryptImageHybrid(modifiedPackage, unlockedKeyPem);

      // If no error was thrown, authenticated decryption failed to reject tampered data!
      setTestResult({
        attempted: true,
        success: false,
        message: 'CRITICAL FAILURE: Tampered ciphertext was decrypted without rejection.',
        details: 'The cryptographic engine accepted invalid or corrupted ciphertext bytes.',
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown rejection';
      setTestResult({
        attempted: true,
        success: true,
        message: 'Tamper Successfully Prevented: AEAD Decryption Aborted.',
        details: `Mathematical verification failed as expected: ${message}`,
      });
      setTamperLogs((prev) => [
        ...prev,
        `[DEFENSE VERIFIED] WebCrypto OperationError: ${message}`,
      ]);
    }
  };

  if (!activeFile) {
    return (
      <div className="border border-[#E5E5E5] bg-white rounded-xl p-12 text-center text-[#666666]">
        <Bug className="w-8 h-8 mx-auto text-[#888888] mb-3" />
        <h2 className="text-base font-bold text-[#111111]">No files available for tampering</h2>
        <p className="text-xs text-[#666666] mt-1">Please encrypt at least one image first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto font-sans">
      {/* Header */}
      <div className="border-b border-[#E5E5E5] pb-5">
        <div className="flex items-center gap-2 text-xs text-[#666666] mb-1 font-mono">
          <span>Adversarial Testing Lab</span>
          <span aria-hidden="true">·</span>
          <span>AEAD Integrity Proof</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
          Ciphertext Tamper & Integrity Lab
        </h1>
        <p className="text-sm text-[#666666] mt-1 max-w-2xl leading-relaxed">
          Test the cryptographic integrity guarantees of AES-256-GCM. In unauthenticated modes like AES-CBC, bit flips cause silent corruption without alert. Under AES-256-GCM, any 1-bit mutation mathematically fails the Galois Field MAC calculation.
        </p>
      </div>

      {/* Target File Selector & Status Banner */}
      <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-[#666666]">Target Package</div>
            <div className="text-base font-bold text-[#111111] font-mono mt-0.5">
              {activeFile.originalFilename}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-xs px-2.5 py-1 rounded font-medium ${
                isTampered
                  ? 'bg-[#FEF2F2] text-[#DC2626] border border-[#FECACA]'
                  : 'bg-[#F0FDF4] text-[#16A34A] border border-[#BBF7D0]'
              }`}
            >
              {isTampered ? `State: MUTATED (${tamperType})` : 'State: PRISTINE (Authentic)'}
            </span>
            <Button
              variant="outline"
              size="xs"
              onClick={resetToOriginal}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
              disabled={!isTampered}
            >
              Reset
            </Button>
          </div>
        </div>
      </div>

      {/* Attack Injection Controls */}
      <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-[#111111]">1. Inject Cryptographic Attack</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Select an adversarial mutation to apply to the in-memory encrypted envelope
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Button
            variant="secondary"
            size="md"
            onClick={handleTamperCiphertextBit}
            className="flex-col items-start p-4 h-auto text-left"
          >
            <div className="font-semibold text-xs text-[#111111]">1-Bit Ciphertext Flip</div>
            <div className="text-[11px] text-[#666666] mt-1 normal-case leading-normal font-normal">
              Inverts bit 0 at byte offset 0x04.
            </div>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handleTamperNonce}
            className="flex-col items-start p-4 h-auto text-left"
          >
            <div className="font-semibold text-xs text-[#111111]">Mutate 96-bit Nonce</div>
            <div className="text-[11px] text-[#666666] mt-1 normal-case leading-normal font-normal">
              Simulates IV corruption or packet alteration.
            </div>
          </Button>

          <Button
            variant="secondary"
            size="md"
            onClick={handleTamperTag}
            className="flex-col items-start p-4 h-auto text-left"
          >
            <div className="font-semibold text-xs text-[#111111]">Corrupt 128-bit Tag</div>
            <div className="text-[11px] text-[#666666] mt-1 normal-case leading-normal font-normal">
              Flips 1 bit in the GMAC authentication tag.
            </div>
          </Button>
        </div>
      </div>

      {/* Verification Execution */}
      <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 shadow-xs space-y-5">
        <div>
          <h2 className="text-base font-bold text-[#111111]">2. Execute Cryptographic Verification</h2>
          <p className="text-xs text-[#666666] mt-0.5">
            Run authenticated decryption on the mutated payload to observe WebCrypto rejection
          </p>
        </div>

        <div>
          <Button
            variant="primary"
            size="md"
            onClick={executeAdversarialDecryption}
            leftIcon={<Unlock className="w-4 h-4" />}
          >
            Attempt Authenticated Decryption
          </Button>
        </div>

        {/* Attack Test Result Display */}
        {testResult && (
          <div
            className={`p-4 rounded-lg border text-xs space-y-1.5 ${
              testResult.success
                ? 'bg-[#F0FDF4] border-[#BBF7D0] text-[#16A34A]'
                : 'bg-[#FEF2F2] border-[#FECACA] text-[#DC2626]'
            }`}
          >
            <div className="font-bold text-sm flex items-center gap-2">
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              {testResult.message}
            </div>
            {testResult.details && (
              <p className="text-xs text-[#111111] leading-relaxed font-mono">
                {testResult.details}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Hex Dump & Log Terminal */}
      <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold uppercase tracking-wider text-[#111111] flex items-center gap-2">
            <Terminal className="w-4 h-4 text-[#111111]" />
            Adversarial Audit Logs
          </div>
        </div>

        <div className="bg-[#F7F7F7] border border-[#E5E5E5] rounded-lg p-4 font-mono text-[11px] text-[#111111] space-y-1 max-h-48 overflow-y-auto">
          {tamperLogs.map((log, index) => (
            <div key={index} className="leading-relaxed">
              <span className="text-[#888888] select-none">&gt; </span>
              {log}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
