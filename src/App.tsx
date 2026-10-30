import React, { useState, useEffect } from 'react';
import { Header } from './components/layout/Header';
import { OverviewView } from './components/dashboard/OverviewView';
import { UploadEncryptionView } from './components/upload/UploadEncryptionView';
import { DecryptImageView } from './components/decrypt/DecryptImageView';
import { VaultFilesView } from './components/vault/VaultFilesView';
import { TamperLabView } from './components/tamper/TamperLabView';
import { DesComparisonView } from './components/des/DesComparisonView';
import { SecurityTestingView } from './components/testing/SecurityTestingView';
import { AuditLogsView } from './components/audit/AuditLogsView';
import { HelpCenterView } from './components/help/HelpCenterView';
import { KeyManagementModal } from './components/keys/KeyManagementModal';
import { AuthModal } from './components/auth/AuthModal';
import { SplashScreen } from './components/splash/SplashScreen';
import { LandingPage } from './components/landing/LandingPage';
import { ToastProvider } from './components/ui/Toast';
import { vaultStore } from './lib/vaultStore';
import {
  generateAndProtectRsaKeyPair,
  encryptImageHybrid,
  base64ToUint8Array,
} from './lib/cryptoEngine';
import { auth, onAuthStateChanged } from './lib/firebase';
import { EncryptedVaultFile } from './types/crypto';

export default function App() {
  const [showSplash, setShowSplash] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('ciphervault_splash_shown') !== 'true';
  });

  const [currentView, setCurrentView] = useState<'landing' | 'dashboard'>('dashboard');
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [files, setFiles] = useState<EncryptedVaultFile[]>(vaultStore.getFiles());
  const [auditLogs, setAuditLogs] = useState(vaultStore.getAuditLogs());
  const [session, setSession] = useState(vaultStore.getSession());
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [selectedTamperFileId, setSelectedTamperFileId] = useState<string | null>(null);
  const [activeDecryptFileId, setActiveDecryptFileId] = useState<string | null>(null);

  // Subscribe to store updates
  useEffect(() => {
    const unsubscribe = vaultStore.subscribe(() => {
      setFiles(vaultStore.getFiles());
      setAuditLogs(vaultStore.getAuditLogs());
      setSession(vaultStore.getSession());
    });
    return () => unsubscribe();
  }, []);

  // Sync Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const token = await firebaseUser.getIdToken();
        const existingSession = vaultStore.getSession();
        vaultStore.setSession({
          userId: firebaseUser.uid,
          username: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Authenticated Client',
          email: firebaseUser.email || 'client@ciphervault.internal',
          role: 'cryptographer',
          keyFingerprint: existingSession?.keyFingerprint || 'f9a8b7c6d5e4f3a2b1c0',
          token,
          loginTimestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1 (Authenticated Client TLS)',
        });
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Initialize default key pair and seed sample encrypted file if empty
  useEffect(() => {
    async function initializeVault() {
      let keyBundle = vaultStore.getKeyBundle();
      if (!keyBundle) {
        keyBundle = await generateAndProtectRsaKeyPair('MasterP@ssw0rd!2026');
        vaultStore.setKeyBundle(keyBundle);
        vaultStore.setSessionPassword('MasterP@ssw0rd!2026');
      }

      if (vaultStore.getFiles().length === 0) {
        // Create synthetic high-resolution confidential defense diagram PNG
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Minimal monochrome banking & defense grid
          ctx.fillStyle = '#090909';
          ctx.fillRect(0, 0, 256, 256);

          // Subtle grid lines
          ctx.strokeStyle = '#222222';
          ctx.lineWidth = 1;
          for (let i = 0; i < 256; i += 32) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i, 256);
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(0, i);
            ctx.lineTo(256, i);
            ctx.stroke();
          }

          // Gold cryptographic target rings
          ctx.strokeStyle = '#B5A27E';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(128, 128, 70, 0, Math.PI * 2);
          ctx.stroke();

          ctx.strokeStyle = '#665b44';
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.arc(128, 128, 35, 0, Math.PI * 2);
          ctx.stroke();

          // Confidential watermark
          ctx.fillStyle = '#EDEDED';
          ctx.font = 'bold 11px monospace';
          ctx.fillText('CIPHERVAULT // CONFIDENTIAL', 32, 35);
          ctx.fillStyle = '#B5A27E';
          ctx.font = '9px monospace';
          ctx.fillText('PAYLOAD: SATELLITE_ORBITAL_RECON', 36, 230);
        }

        canvas.toBlob(async (blob) => {
          if (!blob) return;
          const buf = await blob.arrayBuffer();
          const bytes = new Uint8Array(buf);

          const pkg = await encryptImageHybrid(bytes, keyBundle!.publicKeyPem);
          const sampleRecord: EncryptedVaultFile = {
            id: 'vault_sample_recon_01',
            userId: 'usr_sec_99182',
            originalFilename: 'satellite_recon_orbital_grid.png',
            mimeType: 'image/png',
            originalSizeBytes: bytes.length,
            encryptedSizeBytes: base64ToUint8Array(pkg.ciphertextBase64).length,
            sha256OriginalHash: pkg.sha256OriginalHash,
            sha256CiphertextHash: pkg.sha256CiphertextHash,
            algorithm: 'AES-256-GCM',
            nonceBase64: pkg.nonceBase64,
            authTagBase64: pkg.authTagBase64,
            ciphertextBase64: pkg.ciphertextBase64,
            wrappedKeyBase64: pkg.wrappedKeyBase64,
            keyWrappingAlgorithm: 'RSA-OAEP-SHA256',
            rsaKeyFingerprint: keyBundle!.publicKeyFingerprint,
            exifStripped: true,
            exifTagsRemovedCount: 4,
            verifiedMagicBytes: 'PNG Signature Verified',
            createdAt: new Date().toISOString(),
          };

          vaultStore.addFile(sampleRecord);
        }, 'image/png');
      }
    }

    initializeVault();
  }, []);

  const handleSplashComplete = () => {
    sessionStorage.setItem('ciphervault_splash_shown', 'true');
    setShowSplash(false);
  };

  const handleSelectFileForTamper = (fileId: string) => {
    setSelectedTamperFileId(fileId);
    setActiveTab('tamper');
  };

  const handleSelectFileForDecrypt = (fileId: string) => {
    setActiveDecryptFileId(fileId);
    setActiveTab('decrypt');
  };

  return (
    <ToastProvider>
      {/* Splash Screen on initial entry */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {currentView === 'landing' ? (
        <LandingPage
          onGetStarted={() => setCurrentView('dashboard')}
          onOpenAuth={() => setIsAuthModalOpen(true)}
          onOpenHelp={() => {
            setCurrentView('dashboard');
            setActiveTab('help');
          }}
          onExploreArchitecture={() => {
            setCurrentView('dashboard');
            setActiveTab('overview');
          }}
        />
      ) : (
        <div className="min-h-screen bg-[#090909] text-[#EDEDED] flex flex-col font-sans selection:bg-[#B5A27E]/30 selection:text-[#B5A27E]">
          {/* Top Navigation */}
          <Header
            session={session}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenKeyModal={() => setIsKeyModalOpen(true)}
            onOpenAuthModal={() => setIsAuthModalOpen(true)}
            onViewLanding={() => setCurrentView('landing')}
          />

          {/* Main Dashboard Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {activeTab === 'overview' && (
              <OverviewView
                files={files}
                auditLogs={auditLogs}
                session={session}
                onNavigate={setActiveTab}
                onSelectFileForTamper={handleSelectFileForTamper}
                onSelectFileForDecrypt={handleSelectFileForDecrypt}
              />
            )}

            {activeTab === 'encrypt' && (
              <UploadEncryptionView
                onEncryptionComplete={() => setActiveTab('vault')}
                onOpenKeyModal={() => setIsKeyModalOpen(true)}
              />
            )}

            {activeTab === 'decrypt' && (
              <DecryptImageView
                onOpenKeyModal={() => setIsKeyModalOpen(true)}
                presetFile={activeDecryptFileId ? vaultStore.getFileById(activeDecryptFileId) : null}
              />
            )}

            {activeTab === 'vault' && (
              <VaultFilesView
                files={files}
                onSelectTamper={handleSelectFileForTamper}
                activeDecryptFileId={activeDecryptFileId}
                setActiveDecryptFileId={setActiveDecryptFileId}
              />
            )}

            {activeTab === 'tamper' && (
              <TamperLabView files={files} selectedFileId={selectedTamperFileId} />
            )}

            {activeTab === 'des-compare' && <DesComparisonView />}

            {activeTab === 'security-tests' && <SecurityTestingView />}

            {activeTab === 'audit-logs' && <AuditLogsView logs={auditLogs} />}

            {activeTab === 'help' && <HelpCenterView />}
          </main>

          {/* Private Banking Minimalist Footer */}
          <footer className="w-full border-t border-[#242424] bg-[#090909] py-8 mt-12 text-center text-xs text-[#777777] font-mono">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2.5">
                <div className="w-2 h-2 bg-[#B5A27E]" />
                <span className="font-semibold text-white tracking-wider uppercase font-sans">
                  CipherVault
                </span>
                <span className="text-[#444444]">·</span>
                <span>Hybrid AES-256-GCM / RSA-3072 OAEP</span>
              </div>
              <div className="flex items-center gap-6 text-[11px] text-[#666666]">
                <button
                  onClick={() => setCurrentView('landing')}
                  className="hover:text-white transition-colors uppercase font-mono"
                >
                  Landing Page
                </button>
                <button
                  onClick={() => setActiveTab('help')}
                  className="hover:text-white transition-colors uppercase font-mono"
                >
                  User Manual
                </button>
                <span>NIST SP 800-38D</span>
                <span>FIPS 197</span>
              </div>
            </div>
          </footer>

          {/* Key Management & Authentication Modals */}
          <KeyManagementModal
            isOpen={isKeyModalOpen}
            onClose={() => setIsKeyModalOpen(false)}
          />

          <AuthModal
            isOpen={isAuthModalOpen}
            onClose={() => setIsAuthModalOpen(false)}
          />
        </div>
      )}
    </ToastProvider>
  );
}
