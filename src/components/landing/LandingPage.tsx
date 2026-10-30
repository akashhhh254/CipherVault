import React from 'react';
import {
  ShieldCheck,
  Lock,
  Unlock,
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
  Shield,
  FileCheck2,
} from 'lucide-react';
import { Button } from '../ui/Button';

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
    <div className="min-h-screen bg-white text-[#111111] font-sans">
      {/* Navigation Bar */}
      <header className="sticky top-0 z-40 w-full border-b border-[#E5E5E5] bg-white/95 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-sm tracking-tighter shrink-0 shadow-xs">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                <circle cx="12" cy="16" r="1.5" fill="currentColor"></circle>
              </svg>
            </div>
            <div>
              <span className="font-bold tracking-tight text-[#111111] text-base leading-none">
                CipherVault
              </span>
              <span className="block text-[10px] text-[#666666] tracking-wider uppercase font-medium mt-0.5">
                Cryptographic Platform
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-[#666666]">
            <a href="#capabilities" className="hover:text-[#111111] transition-colors">
              Capabilities
            </a>
            <a href="#how-it-works" className="hover:text-[#111111] transition-colors">
              How It Works
            </a>
            <a href="#architecture" className="hover:text-[#111111] transition-colors">
              Hybrid Architecture
            </a>
            <button
              onClick={onOpenHelp}
              className="hover:text-[#111111] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              <span>User Manual</span>
            </button>
          </nav>

          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onOpenAuth}
            >
              Sign In
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={onGetStarted}
              rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Access Vault
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-16 sm:pt-24 pb-16 sm:pb-20 border-b border-[#E5E5E5] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F7F7F7] border border-[#E5E5E5] rounded-full text-xs text-[#666666] font-medium">
            <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
            NIST SP 800-38D · FIPS 197 Cryptographic Architecture
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#111111] leading-[1.15]">
            High-Assurance Image Encryption &amp; Decryption
          </h1>

          <p className="text-base sm:text-lg text-[#666666] max-w-2xl mx-auto leading-relaxed">
            Protect confidential images with client-side authenticated envelope cryptography. Zero unencrypted storage, automatic EXIF scrubbing, and 128-bit mathematical tamper rejection.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
            <Button
              variant="primary"
              size="lg"
              onClick={onGetStarted}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Launch Vault Dashboard
            </Button>
            <Button
              variant="secondary"
              size="lg"
              onClick={onOpenHelp}
              leftIcon={<BookOpenIcon className="w-4 h-4" />}
            >
              Read Cryptographic Specs
            </Button>
          </div>

          {/* Architectural Diagram Box */}
          <div className="mt-12 p-6 sm:p-8 bg-[#F7F7F7] border border-[#E5E5E5] rounded-xl text-left shadow-xs">
            <div className="flex items-center justify-between pb-4 border-b border-[#E5E5E5]">
              <span className="text-xs font-bold uppercase tracking-wider text-[#111111]">
                Cryptographic Pipeline Execution
              </span>
              <span className="text-xs text-[#16A34A] font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#16A34A]" />
                Zero-Knowledge Local Execution
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-5 text-xs">
              <div className="p-4 bg-white border border-[#E5E5E5] rounded-lg space-y-1.5 shadow-xs">
                <div className="font-mono text-[10px] text-[#888888] font-bold">STAGE 1</div>
                <div className="font-bold text-[#111111]">Binary Sanitization</div>
                <p className="text-[#666666] leading-relaxed">
                  Checks authentic magic bytes and strips EXIF GPS &amp; device metadata.
                </p>
              </div>

              <div className="p-4 bg-white border border-[#E5E5E5] rounded-lg space-y-1.5 shadow-xs">
                <div className="font-mono text-[10px] text-[#888888] font-bold">STAGE 2</div>
                <div className="font-bold text-[#111111]">AES-256-GCM AEAD</div>
                <p className="text-[#666666] leading-relaxed">
                  Encrypts image using ephemeral 256-bit symmetric key and 96-bit CSPRNG IV.
                </p>
              </div>

              <div className="p-4 bg-white border border-[#E5E5E5] rounded-lg space-y-1.5 shadow-xs">
                <div className="font-mono text-[10px] text-[#888888] font-bold">STAGE 3</div>
                <div className="font-bold text-[#111111]">RSA-3072 Key Wrap</div>
                <p className="text-[#666666] leading-relaxed">
                  Asymmetrically wraps the AES session key using OAEP with SHA-256 padding.
                </p>
              </div>

              <div className="p-4 bg-white border border-[#E5E5E5] rounded-lg space-y-1.5 shadow-xs">
                <div className="font-mono text-[10px] text-[#888888] font-bold">STAGE 4</div>
                <div className="font-bold text-[#111111]">Container Export</div>
                <p className="text-[#666666] leading-relaxed">
                  Exports verifiable .cvault container with 128-bit Galois authentication tag.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Core Capabilities */}
      <section id="capabilities" className="py-16 sm:py-24 border-b border-[#E5E5E5] bg-[#F7F7F7]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              Engineered for Zero-Trust Defense
            </h2>
            <p className="text-sm text-[#666666] leading-relaxed">
              Every operation follows strict cryptographic boundaries to eliminate single points of failure.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 sm:p-7 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#111111] text-white flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111111]">
                Galois Authenticated Integrity
              </h3>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                AES-GCM computes a 128-bit Galois Field tag over ciphertext and nonce. Any transmission bit corruption or tampering causes mathematical rejection.
              </p>
            </div>

            <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 sm:p-7 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#111111] text-white flex items-center justify-center">
                <KeyRound className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111111]">
                Memory-Hard Key Protection
              </h3>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                User RSA private keys are wrapped at rest using keys derived via high-work-factor PBKDF2 and Scrypt algorithms, preventing offline brute-force extraction.
              </p>
            </div>

            <div className="border border-[#E5E5E5] bg-white rounded-xl p-6 sm:p-7 shadow-xs space-y-3">
              <div className="w-10 h-10 rounded-lg bg-[#111111] text-white flex items-center justify-center">
                <FileSearch className="w-5 h-5" />
              </div>
              <h3 className="text-base font-bold text-[#111111]">
                Magic Byte Ingestion Filter
              </h3>
              <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                Validates authentic file signatures to prevent polyglot execution attacks, rejecting disguised Windows PE executables and ELF binaries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 sm:py-24 border-b border-[#E5E5E5] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
              How CipherVault Works
            </h2>
            <p className="text-sm text-[#666666]">
              Simple workflow for users, rigorous cryptography under the hood.
            </p>
          </div>

          <div className="space-y-6">
            <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-xl p-6 flex flex-col sm:flex-row items-start gap-5">
              <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0">
                1
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#111111]">Upload and Sanitize Image</h4>
                <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                  Select your confidential image. EXIF metadata (camera serials, GPS coordinates, timestamps) is wiped completely via browser canvas rasterization.
                </p>
              </div>
            </div>

            <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-xl p-6 flex flex-col sm:flex-row items-start gap-5">
              <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0">
                2
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#111111]">Hybrid Envelope Encryption</h4>
                <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                  A unique 256-bit AES session key is generated with a 96-bit CSPRNG IV. The image is encrypted and the session key is wrapped under your RSA-3072 public key.
                </p>
              </div>
            </div>

            <div className="border border-[#E5E5E5] bg-[#F7F7F7] rounded-xl p-6 flex flex-col sm:flex-row items-start gap-5">
              <div className="w-8 h-8 rounded-full bg-[#111111] text-white flex items-center justify-center font-bold text-xs shrink-0">
                3
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-bold text-[#111111]">Export Verifiable .cvault Container</h4>
                <p className="text-xs sm:text-sm text-[#666666] leading-relaxed">
                  Download the container or store it in your encrypted vault. Decryption requires your master passphrase and verifies byte-exact integrity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Footer Section */}
      <section className="py-16 sm:py-20 bg-[#F7F7F7] border-b border-[#E5E5E5] text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-5">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111111]">
            Ready to Protect Your Sensitive Images?
          </h2>
          <p className="text-sm text-[#666666] max-w-xl mx-auto">
            Experience private banking grade cryptography running directly in your browser.
          </p>
          <div className="pt-2">
            <Button
              variant="primary"
              size="lg"
              onClick={onGetStarted}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Open CipherVault Dashboard
            </Button>
          </div>
        </div>
      </section>

      {/* Minimalist Monochrome Footer */}
      <footer className="py-8 bg-white text-xs text-[#666666]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#111111]">CipherVault</span>
            <span aria-hidden="true">·</span>
            <span>NIST FIPS 197 &amp; SP 800-38D Compliant</span>
          </div>
          <div className="flex items-center gap-6 text-[11px]">
            <button onClick={onOpenHelp} className="hover:text-[#111111] cursor-pointer">
              User Manual
            </button>
            <button onClick={onGetStarted} className="hover:text-[#111111] cursor-pointer">
              Dashboard
            </button>
            <span>RSA-3072 OAEP / AES-256-GCM</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

function BookOpenIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}
