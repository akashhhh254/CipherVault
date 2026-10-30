import React, { useState, useEffect } from 'react';
import { Bug, ShieldAlert, CheckCircle2, RefreshCw, Unlock, AlertTriangle, Cpu, Terminal, ArrowRight } from 'lucide-react';
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
    addToast('info', 'Restored Authentic State', 'Payload is back in pristine cryptographic condition.');
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
    modified[0] ^= 0xff;
    setWorkingNonce(modified);
    setIsTampered(true);
    setTamperType('Nonce/IV Counter Desynchronization');
    setTestResult(null);
    setTamperLogs((prev) => [
      ...prev,
      `[ATTACK] Inverted byte 0 of 96-bit Nonce to desync counter stream.`,
    ]);
    addToast('error', 'Nonce Mutated', 'Desynchronized counter block stream.');
  };

  const handleTamperTag = () => {
    if (!workingTag) return;
    const modified = new Uint8Array(workingTag);
    modified[modified.length - 1] ^= 0xaa;
    setWorkingTag(modified);
    setIsTampered(true);
    setTamperType('128-bit Authentication Tag Bit Flip');
    setTestResult(null);
    setTamperLogs((prev) => [
      ...prev,
      `[ATTACK] Corrupted 128-bit GMAC Authentication Tag bits.`,
    ]);
    addToast('error', 'Auth Tag Corrupted', 'Modified GMAC signature bits.');
  };

  const executeTamperTest = async () => {
    if (!activeFile || !workingCiphertext || !workingNonce || !workingTag) return;

    try {
      const keyBundle = vaultStore.getKeyBundle();
      if (!keyBundle) throw new Error('No RSA key pair found.');

      const privateKey = await unlockPrivateKey(keyBundle, 'MasterP@ssw0rd!2026');

      const pkg = {
        nonceBase64: bufferToBase64(workingNonce),
        authTagBase64: bufferToBase64(workingTag),
        ciphertextBase64: bufferToBase64(workingCiphertext),
        wrappedKeyBase64: activeFile.wrappedKeyBase64,
      };

      const result = await decryptImageHybrid(pkg, privateKey);

      setTestResult({
        attempted: true,
        success: true,
        message: 'Decryption Succeeded: Integrity Verified',
        details: `Payload SHA-256: ${result.recoveredSha256}`,
      });
      setTamperLogs((prev) => [
        ...prev,
        `[DECIPHER] Authentication tag validated by GCM engine. Byte fidelity 100%.`,
      ]);
      addToast('success', 'Authenticity Confirmed', 'Decryption succeeded without tampering.');
    } catch (err: unknown) {
      const errorMsg = (err as Error).message;
      setTestResult({
        attempted: true,
        success: false,
        message: 'Decryption Rejected: AEAD Integrity Verification Failed',
        details: errorMsg,
      });

      setTamperLogs((prev) => [
        ...prev,
        `[VIOLATION] ${errorMsg}`,
        `[ACTION] Plaintext stream aborted. Zero data leaked to adversary.`,
      ]);

      vaultStore.addAuditLog({
        id: `aud_tamper_${Date.now()}`,
        userId: vaultStore.getSession()?.userId,
        fileId: activeFile.id,
        filename: activeFile.originalFilename,
        action: 'TAMPER_DETECTED',
        status: 'FAILED',
        ipAddress: '127.0.0.1',
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        details: `Adversary tampering detected in lab: ${errorMsg}`,
      });

      addToast('error', 'Tampering Detected & Blocked', 'Galois/Counter Mode refused decryption.');
    }
  };

  if (!activeFile) {
    return (
      <div className="text-center py-16 border border-[#242424] bg-[#111111]">
        <Bug className="w-8 h-8 text-[#555555] mx-auto mb-2" />
        <h2 className="text-xs font-semibold text-white uppercase font-mono">No Encrypted Files Available</h2>
        <p className="text-[11px] text-[#777777] mt-1 font-sans">
          Encrypt an image first to test bit-flipping attacks in the lab.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans">
      <div className="border-b border-[#242424] pb-4">
        <div className="flex items-center gap-2 text-xs font-mono text-[#B5A27E] uppercase mb-1">
          <span>Authenticated Encryption Integrity Verifier</span>
          <span>·</span>
          <span>AEAD / GMAC</span>
        </div>
        <h1 className="text-2xl font-light tracking-tight text-white mb-1">
          Adversarial Tampering & Cryptanalysis Lab
        </h1>
        <p className="text-xs text-[#888888] max-w-2xl leading-relaxed">
          Unlike legacy unauthenticated modes (DES-CBC / AES-CBC), AES-256-GCM calculates a Galois Field GF(2^128) authentication tag. Mutate individual bits in ciphertext, nonces, or tags to prove that tampered payloads are mathematically impossible to forge and will trigger immediate decryption aborts.
        </p>
      </div>

      {/* Target Selector */}
      <div className="p-4 border border-[#242424] bg-[#111111] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 border border-[#333333] bg-[#0A0A0A] text-[#B5A27E]">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] text-[#777777] font-mono uppercase">Target Container:</div>
            <div className="text-xs font-semibold text-white">{activeFile.originalFilename}</div>
          </div>
        </div>

        <select
          value={activeFile.id}
          onChange={(e) => {
            const file = files.find((f) => f.id === e.target.value);
            if (file) setActiveFile(file);
          }}
          className="px-3 py-1.5 text-xs bg-[#0A0A0A] border border-[#242424] text-white font-mono outline-none focus:border-[#B5A27E]"
        >
          {files.map((f) => (
            <option key={f.id} value={f.id}>
              {f.originalFilename} ({f.algorithm})
            </option>
          ))}
        </select>
      </div>

      {/* Attack Injection Controls */}
      <div className="p-5 border border-[#242424] bg-[#111111] space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs font-semibold text-white uppercase font-mono tracking-wider">
            Adversarial Manipulation Controls:
          </div>
          {isTampered && (
            <span className="text-[11px] font-mono text-[#B5A27E] flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>{tamperType || 'Tampered State Active'}</span>
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <button
            onClick={handleTamperCiphertextBit}
            className="p-3 text-left border border-[#242424] bg-[#0A0A0A] hover:border-[#B5A27E] transition-colors cursor-pointer"
          >
            <div className="text-xs font-semibold text-[#EDEDED] mb-0.5 font-mono">Flip 1 Bit in Ciphertext</div>
            <div className="text-[10px] text-[#777777]">Inverts bit 0 at byte offset 0x0004.</div>
          </button>

          <button
            onClick={handleTamperNonce}
            className="p-3 text-left border border-[#242424] bg-[#0A0A0A] hover:border-[#B5A27E] transition-colors cursor-pointer"
          >
            <div className="text-xs font-semibold text-[#EDEDED] mb-0.5 font-mono">Mutate 96-bit Nonce</div>
            <div className="text-[10px] text-[#777777]">Inverts IV byte to desync counter.</div>
          </button>

          <button
            onClick={handleTamperTag}
            className="p-3 text-left border border-[#242424] bg-[#0A0A0A] hover:border-[#B5A27E] transition-colors cursor-pointer"
          >
            <div className="text-xs font-semibold text-[#EDEDED] mb-0.5 font-mono">Corrupt 128-bit Tag</div>
            <div className="text-[10px] text-[#777777]">Alters GMAC authentication tag.</div>
          </button>

          <button
            onClick={resetToOriginal}
            className="p-3 text-left border border-[#242424] bg-[#0A0A0A] hover:border-white transition-colors cursor-pointer"
          >
            <div className="text-xs font-semibold text-[#B5A27E] mb-0.5 flex items-center gap-1.5 font-mono">
              <RefreshCw className="w-3 h-3" />
              <span>Restore Authentic</span>
            </div>
            <div className="text-[10px] text-[#777777]">Reverts to clean envelope.</div>
          </button>
        </div>

        <div className="pt-2 flex justify-end">
          <Button
            variant="primary"
            size="md"
            onClick={executeTamperTest}
            leftIcon={<Unlock className="w-3.5 h-3.5" />}
          >
            Test Decryption on Current Payload
          </Button>
        </div>
      </div>

      {/* Test Outcome Banner */}
      {testResult && (
        <div
          className={`p-4 border text-xs space-y-1 font-mono ${
            testResult.success
              ? 'bg-[#141414] border-[#B5A27E] text-[#EDEDED]'
              : 'bg-red-950/20 border-red-900/60 text-red-200'
          }`}
        >
          <div className="flex items-center gap-2 font-semibold">
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-[#B5A27E]" />
            ) : (
              <ShieldAlert className="w-4 h-4 text-red-400" />
            )}
            <span className="text-xs uppercase">{testResult.message}</span>
          </div>
          {testResult.details && (
            <div className="font-mono text-[11px] text-[#AAAAAA] pt-0.5">
              {testResult.details}
            </div>
          )}
        </div>
      )}

      {/* Hex Inspector and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="p-4 border border-[#242424] bg-[#111111] space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-[#EDEDED]">
            <span className="font-mono uppercase text-[11px]">Ciphertext Buffer (Hex Dump):</span>
            <span className="font-mono text-[10px] text-[#777777]">Offset 0x00 - 0x40</span>
          </div>
          <div className="p-3 bg-[#0A0A0A] border border-[#242424] font-mono text-[10px] text-[#888888] overflow-x-auto space-y-1">
            {workingCiphertext &&
              generateHexDump(workingCiphertext, 64).map((line, idx) => (
                <div key={idx} className="flex gap-3">
                  <span className="text-[#555555]">{line.offset}</span>
                  <span className={idx === 0 && isTampered ? 'text-red-400 font-bold' : 'text-[#B5A27E]'}>
                    {line.hex}
                  </span>
                  <span className="text-[#666666]">{line.ascii}</span>
                </div>
              ))}
          </div>
        </div>

        <div className="p-4 border border-[#242424] bg-[#111111] space-y-2 flex flex-col">
          <div className="text-xs font-mono uppercase text-[#EDEDED] text-[11px]">Cryptanalysis Activity Log:</div>
          <div className="flex-1 p-3 bg-[#0A0A0A] border border-[#242424] font-mono text-[11px] text-[#888888] overflow-y-auto max-h-48 space-y-1.5">
            {tamperLogs.map((log, i) => (
              <div
                key={i}
                className={
                  log.includes('ATTACK')
                    ? 'text-[#B5A27E]'
                    : log.includes('VIOLATION')
                    ? 'text-red-400'
                    : 'text-[#AAAAAA]'
                }
              >
                {log}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
