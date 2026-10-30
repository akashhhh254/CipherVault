import React, { useEffect, useState } from 'react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [fadeState, setFadeState] = useState<'enter' | 'visible' | 'exit'>('enter');

  useEffect(() => {
    // Stage 1: Fade-in and stabilize
    const visibleTimer = setTimeout(() => {
      setFadeState('visible');
    }, 100);

    // Stage 2: Begin smooth fade-out after 1.8 seconds
    const exitTimer = setTimeout(() => {
      setFadeState('exit');
    }, 1900);

    // Stage 3: Complete transition after 2.4 seconds
    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2400);

    return () => {
      clearTimeout(visibleTimer);
      clearTimeout(exitTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-black transition-opacity duration-500 select-none ${
        fadeState === 'exit' ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      aria-label="CipherVault Launch Screen"
    >
      <div className="flex flex-col items-center text-center px-6">
        {/* Minimal geometric cryptographic seal */}
        <div className="mb-8 relative flex items-center justify-center">
          <div className="w-16 h-16 border border-[#B5A27E]/40 flex items-center justify-center rotate-45 transition-transform duration-1000 ease-out transform">
            <div className="w-8 h-8 border border-[#B5A27E] -rotate-45 flex items-center justify-center">
              <div className="w-2 h-2 bg-[#B5A27E]" />
            </div>
          </div>
        </div>

        {/* Primary Typography */}
        <h1 className="text-3xl md:text-4xl lg:text-5xl font-light tracking-[0.35em] text-white uppercase font-sans">
          Cipher Vault
        </h1>

        {/* Accent Tagline */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-8 bg-[#B5A27E]/50" />
          <p className="text-xs md:text-sm font-medium tracking-[0.25em] text-[#B5A27E] uppercase font-mono">
            Secure Image Protection
          </p>
          <div className="h-px w-8 bg-[#B5A27E]/50" />
        </div>

        {/* Security architecture indicator */}
        <p className="mt-8 text-[11px] font-mono tracking-widest text-[#777777] uppercase">
          Hybrid AES-256-GCM · RSA-3072 OAEP · Zero-Knowledge
        </p>
      </div>

      {/* Subtle skip button for instant interaction */}
      <button
        onClick={onComplete}
        className="absolute bottom-8 text-xs font-mono tracking-wider text-[#777777] hover:text-[#B5A27E] transition-colors px-4 py-2"
      >
        Press to continue →
      </button>
    </div>
  );
};
