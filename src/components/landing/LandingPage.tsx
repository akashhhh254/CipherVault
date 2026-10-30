import React from 'react';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  FileSearch,
  Fingerprint,
  Cpu,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Download,
  HelpCircle,
  FileCode,
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
  onOpenAuth: () => void;
  onOpenHelp: () => void;
  onExploreArchitecture: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onGetStarted,
  onOpenAuth,
  onOpenHelp,
  onExploreArchitecture,
}) => {
  return (
    <div className="min-h-screen bg-[#090909] text-[#EDEDED] font-sans selection:bg-[#B5A27E]/30 selection:text-[#B5A27E]">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#242424] bg-[#090909]/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 border border-[#B5A27E] flex items-center justify-center">
              <div className="w-2.5 h-2.5 bg-[#B5A27E]" />
            </div>
            <div>
              <span className="font-semibold tracking-[0.2em] text-white text-base font-sans uppercase">
                CipherVault
              </span>
              <span className="block text-[10px] font-mono tracking-widest text-[#777777] uppercase">
                Enterprise Cryptography
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider text-[#A0A0A0]">
            <a href="#capabilities" className="hover:text-white transition-colors">
              Capabilities
            </a>
            <a href="#how-it-works" className="hover:text-white transition-colors">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-white transition-colors">
              Hybrid Architecture
            </a>
            <button
              onClick={onOpenHelp}
              className="hover:text-[#B5A27E] transition-colors flex items-center gap-1.5"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>User Manual</span>
            </button>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAuth}
              className="text-xs font-mono tracking-wider text-[#EDEDED] hover:text-[#B5A27E] px-3 py-2 transition-colors"
            >
              Client Sign In
            </button>
            <button
              onClick={onGetStarted}
              className="px-4 py-2 bg-[#B5A27E] text-[#090909] text-xs font-medium tracking-wider uppercase hover:bg-[#c2ad82] transition-colors flex items-center gap-2"
            >
              <span>Access Vault</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 border-b border-[#242424] overflow-hidden">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          {/* Institution Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-[#333333] bg-[#141414] text-[11px] font-mono text-[#B5A27E] tracking-widest uppercase mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-[#B5A27E] animate-pulse" />
            NIST SP 800-38D · FIPS 197 Compliant Cryptographic Architecture
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light tracking-tight text-white leading-tight">
            Your Images.{' '}
            <span className="block font-normal text-[#B5A27E] mt-2">
              Protected by Advanced Cryptography.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-[#999999] max-w-2xl mx-auto font-normal leading-relaxed">
            CipherVault enables defense, financial institutions, and privacy-conscious professionals
            to securely encrypt, store, and decrypt confidential imagery through a unified zero-trust
            cryptographic system.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-3.5 bg-[#B5A27E] text-[#090909] text-xs font-semibold tracking-widest uppercase hover:bg-[#c2ad82] transition-colors flex items-center justify-center gap-2"
            >
              <span>Encrypt Image Container</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onExploreArchitecture}
              className="w-full sm:w-auto px-7 py-3.5 border border-[#333333] bg-[#141414] text-white text-xs font-medium tracking-widest uppercase hover:border-[#B5A27E] hover:text-[#B5A27E] transition-colors"
            >
              Inspect Security Specs
            </button>
          </div>

          {/* Core Security Assurance Badges */}
          <div className="mt-16 pt-10 border-t border-[#1C1C1C] grid grid-cols-2 md:grid-cols-4 gap-6 text-left">
            <div className="border-l border-[#242424] pl-4">
              <span className="text-[10px] font-mono tracking-widest text-[#777777] uppercase block">
                Payload Cipher
              </span>
              <span className="text-sm font-semibold text-white tracking-wide mt-1 block">
                AES-256-GCM AEAD
              </span>
              <span className="text-[11px] text-[#777777] block mt-0.5">
                Galois 128-bit tag
              </span>
            </div>
            <div className="border-l border-[#242424] pl-4">
              <span className="text-[10px] font-mono tracking-widest text-[#777777] uppercase block">
                Key Wrapping
              </span>
              <span className="text-sm font-semibold text-white tracking-wide mt-1 block">
                RSA-3072 OAEP
              </span>
              <span className="text-[11px] text-[#777777] block mt-0.5">
                SHA-256 Mask Gen MGF1
              </span>
            </div>
            <div className="border-l border-[#242424] pl-4">
              <span className="text-[10px] font-mono tracking-widest text-[#777777] uppercase block">
                Private Key Protection
              </span>
              <span className="text-sm font-semibold text-white tracking-wide mt-1 block">
                PBKDF2 / Argon2id
              </span>
              <span className="text-[11px] text-[#777777] block mt-0.5">
                600,000 salt iterations
              </span>
            </div>
            <div className="border-l border-[#242424] pl-4">
              <span className="text-[10px] font-mono tracking-widest text-[#777777] uppercase block">
                Metadata Cleansing
              </span>
              <span className="text-sm font-semibold text-white tracking-wide mt-1 block">
                Zero-EXIF Privacy
              </span>
              <span className="text-[11px] text-[#777777] block mt-0.5">
                GPS & camera tags scrubbed
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Problem & Threat Matrix */}
      <section className="py-20 border-b border-[#242424] bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-mono tracking-widest text-[#B5A27E] uppercase">
              Threat Intelligence
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mt-2">
              Why Unencrypted Image Storage is a Catastrophic Exposure
            </h2>
            <p className="mt-3 text-sm text-[#999999] leading-relaxed">
              Medical scans, architectural blueprints, trade secrets, and identity documents are routinely
              stored in cloud buckets with basic server-side encryption that fails against insider threats,
              subpoenas, and data tampering.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[#242424] bg-[#111111] p-6">
              <div className="w-10 h-10 border border-[#444] flex items-center justify-center text-white mb-4">
                <AlertTriangle className="w-5 h-5 text-[#B5A27E]" />
              </div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Passive EXIF Geolocation Leaks
              </h3>
              <p className="text-xs text-[#888888] mt-2 leading-relaxed">
                Raw camera images contain embedded latitude, longitude, altitude, device serial numbers,
                and timestamp metadata. CipherVault wipes all metadata before cryptographic hashing.
              </p>
            </div>

            <div className="border border-[#242424] bg-[#111111] p-6">
              <div className="w-10 h-10 border border-[#444] flex items-center justify-center text-white mb-4">
                <Lock className="w-5 h-5 text-[#B5A27E]" />
              </div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Silent Bit-Flip Tampering
              </h3>
              <p className="text-xs text-[#888888] mt-2 leading-relaxed">
                Legacy unauthenticated encryption modes (CBC/CTR) permit adversarial ciphertext tampering
                without detection. Our AES-256-GCM AEAD detects single-bit alterations and aborts decryption.
              </p>
            </div>

            <div className="border border-[#242424] bg-[#111111] p-6">
              <div className="w-10 h-10 border border-[#444] flex items-center justify-center text-white mb-4">
                <Fingerprint className="w-5 h-5 text-[#B5A27E]" />
              </div>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Centralized Custodian Vulnerability
              </h3>
              <p className="text-xs text-[#888888] mt-2 leading-relaxed">
                If the server holds the plaintext decryption key, your data is never truly private.
                CipherVault keeps RSA private keys strictly client-controlled and password-wrapped.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 8 Core Capabilities */}
      <section id="capabilities" className="py-20 border-b border-[#242424] bg-[#090909]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-mono tracking-widest text-[#B5A27E] uppercase">
              System Specification
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mt-2">
              Eight Cryptographic Defenses
            </h2>
            <p className="text-xs text-[#888888] mt-2">
              Every stage of the file lifecycle adheres to rigorous cryptographic discipline.
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Layers,
                title: 'Hybrid AES-256-GCM',
                desc: 'Generates a unique 256-bit AES key and 96-bit CSPRNG IV per file to prevent keystream reuse.',
              },
              {
                icon: KeyRound,
                title: 'RSA-3072 OAEP Wrapping',
                desc: 'Envelopes the ephemeral symmetric key with asymmetric RSA-3072 using SHA-256 padding.',
              },
              {
                icon: ShieldCheck,
                title: '128-Bit GMAC Integrity',
                desc: 'Cryptographic authentication tag guarantees byte-for-byte fidelity and rejects tampered payloads.',
              },
              {
                icon: FileSearch,
                title: 'EXIF Sanitization Canvas',
                desc: 'Decodes image raster data and writes to clean buffer, stripping device signatures and GPS coordinates.',
              },
              {
                icon: FileCode,
                title: 'Magic Byte Validation',
                desc: 'Inspects binary file headers (e.g. 89 50 4E 47) to block polyglot malware and disguised binaries.',
              },
              {
                icon: Cpu,
                title: 'Scrypt / PBKDF2 Key Derivation',
                desc: 'Private keys are never exposed in plaintext; they are password-wrapped with memory-hard KDFs.',
              },
              {
                icon: Fingerprint,
                title: 'Adversarial Tamper Lab',
                desc: 'Interactive lab simulating active MITM byte-tampering and proving AEAD integrity enforcement.',
              },
              {
                icon: Download,
                title: 'Portable .cvault Envelopes',
                desc: 'Self-contained encrypted containers with complete cryptographic manifests for offline recovery.',
              },
            ].map((cap, idx) => (
              <div
                key={idx}
                className="p-5 border border-[#242424] bg-[#111111] hover:border-[#B5A27E]/60 transition-colors"
              >
                <div className="w-8 h-8 border border-[#333] flex items-center justify-center text-[#B5A27E] mb-4">
                  <cap.icon className="w-4 h-4" />
                </div>
                <h3 className="text-xs font-semibold text-white tracking-wide uppercase">
                  {cap.title}
                </h3>
                <p className="text-[12px] text-[#777777] mt-2 leading-relaxed font-sans">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3-Step Lifecycle */}
      <section id="how-it-works" className="py-20 border-b border-[#242424] bg-[#0D0D0D]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl">
            <span className="text-xs font-mono tracking-widest text-[#B5A27E] uppercase">
              Cryptographic Workflow
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mt-2">
              Three-Step End-to-End Image Protection
            </h2>
            <p className="text-xs text-[#888888] mt-2">
              Zero-knowledge client-side pipeline executing directly inside your browser.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="border border-[#242424] bg-[#111111] p-6 relative">
              <span className="text-3xl font-mono text-[#B5A27E]/40 font-bold block mb-4">
                01
              </span>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Sanitize & Ingest
              </h3>
              <p className="text-xs text-[#888888] mt-2 leading-relaxed">
                User selects confidential image. The client validates magic bytes to prevent polyglots,
                wipes EXIF/GPS tags via canvas recreation, and calculates a SHA-256 pre-encryption digest.
              </p>
            </div>

            <div className="border border-[#242424] bg-[#111111] p-6 relative">
              <span className="text-3xl font-mono text-[#B5A27E]/40 font-bold block mb-4">
                02
              </span>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Dual Cryptographic Lock
              </h3>
              <p className="text-xs text-[#888888] mt-2 leading-relaxed">
                A 256-bit AES key is minted via WebCrypto CSPRNG. The image is encrypted under AES-GCM
                producing ciphertext and a 128-bit authentication tag. The AES key is then wrapped under RSA-3072.
              </p>
            </div>

            <div className="border border-[#242424] bg-[#111111] p-6 relative">
              <span className="text-3xl font-mono text-[#B5A27E]/40 font-bold block mb-4">
                03
              </span>
              <h3 className="text-sm font-semibold text-white uppercase tracking-wider">
                Verify & Decrypt
              </h3>
              <p className="text-xs text-[#888888] mt-2 leading-relaxed">
                To decrypt, the user authenticates with their master passphrase to unwrap the RSA private key,
                recovers the AES key, and verifies the GMAC tag. If intact, the original image is displayed.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Hybrid Architecture Diagram Section */}
      <section id="architecture" className="py-20 border-b border-[#242424] bg-[#090909]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-14">
            <span className="text-xs font-mono tracking-widest text-[#B5A27E] uppercase">
              Envelope Cryptography
            </span>
            <h2 className="text-2xl sm:text-3xl font-light text-white tracking-tight mt-2">
              Hybrid Cryptographic Architecture
            </h2>
            <p className="text-xs text-[#888888] mt-2">
              Combining the high-throughput performance of symmetric AES with the key distribution security of asymmetric RSA.
            </p>
          </div>

          <div className="border border-[#242424] bg-[#111111] p-8 max-w-4xl mx-auto font-mono text-xs">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <div className="border border-[#262626] bg-[#161616] p-4">
                  <div className="flex items-center justify-between text-[#B5A27E] mb-2 font-semibold">
                    <span>1. DATA LAYER (Symmetric)</span>
                    <span className="text-[10px] px-2 py-0.5 border border-[#B5A27E]/40">FAST</span>
                  </div>
                  <p className="text-[#888888] text-[11px] leading-relaxed">
                    Plaintext Image Data + 256-bit AES Key + 96-bit Nonce → AES-256-GCM → Ciphertext + 128-bit Auth Tag
                  </p>
                </div>

                <div className="border border-[#262626] bg-[#161616] p-4">
                  <div className="flex items-center justify-between text-[#B5A27E] mb-2 font-semibold">
                    <span>2. KEY LAYER (Asymmetric)</span>
                    <span className="text-[10px] px-2 py-0.5 border border-[#B5A27E]/40">SECURE</span>
                  </div>
                  <p className="text-[#888888] text-[11px] leading-relaxed">
                    256-bit AES Key + RSA-3072 Public Key → RSA-OAEP (SHA-256) → 384-Byte Wrapped AES Key
                  </p>
                </div>

                <div className="border border-[#262626] bg-[#161616] p-4">
                  <div className="flex items-center justify-between text-[#B5A27E] mb-2 font-semibold">
                    <span>3. KEY PROTECTION LAYER</span>
                    <span className="text-[10px] px-2 py-0.5 border border-[#B5A27E]/40">ZERO-KNOWLEDGE</span>
                  </div>
                  <p className="text-[#888888] text-[11px] leading-relaxed">
                    Master Passphrase + Salt → PBKDF2 (600k iter) → Wrapped RSA Private Key
                  </p>
                </div>
              </div>

              <div className="border border-[#242424] bg-[#0A0A0A] p-5 space-y-3 text-[11px]">
                <div className="text-[#B5A27E] font-semibold border-b border-[#242424] pb-2 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>CIPHERVAULT CONTAINER (.cvault)</span>
                </div>
                <div className="space-y-1.5 text-[#AAAAAA]">
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Magic Header:</span>
                    <span className="text-white">CVAULT_SEC_V1</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Payload Cipher:</span>
                    <span className="text-white">AES-256-GCM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Nonce (IV):</span>
                    <span className="text-white">96-bit (12 bytes)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Authentication Tag:</span>
                    <span className="text-white">128-bit (16 bytes GMAC)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Key Envelopment:</span>
                    <span className="text-white">RSA-3072 OAEP-SHA256</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#777777]">Tamper Resistance:</span>
                    <span className="text-[#B5A27E]">Strict Abort on Mismatch</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#242424] bg-[#090909] py-12 text-[#777777] font-mono text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-5 h-5 border border-[#B5A27E] flex items-center justify-center">
              <div className="w-1.5 h-1.5 bg-[#B5A27E]" />
            </div>
            <span className="text-white tracking-widest uppercase">CipherVault</span>
            <span>—</span>
            <span>Secure Image Encryption & Decryption Platform</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[11px]">
            <span>NIST SP 800-38D</span>
            <span>FIPS 197</span>
            <span>RFC 8017 PKCS#1</span>
            <button onClick={onOpenHelp} className="hover:text-white transition-colors underline">
              Help Center & Manual
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
