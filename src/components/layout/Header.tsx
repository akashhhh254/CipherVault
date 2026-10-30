import React, { useState } from 'react';
import {
  Shield,
  KeyRound,
  Lock,
  Unlock,
  Menu,
  X,
  User,
  ChevronRight,
  HelpCircle,
  LogOut,
  FolderLock,
  ExternalLink,
} from 'lucide-react';
import { UserSession } from '../../types/crypto';
import { Button } from '../ui/Button';

interface HeaderProps {
  session: UserSession | null;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOpenKeyModal: () => void;
  onOpenAuthModal: () => void;
  onViewLanding?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  session,
  activeTab,
  setActiveTab,
  onOpenKeyModal,
  onOpenAuthModal,
  onViewLanding,
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { id: 'overview', label: 'Overview' },
    { id: 'encrypt', label: 'Encrypt Image' },
    { id: 'decrypt', label: 'Decrypt Image' },
    { id: 'vault', label: 'My Secure Files' },
    { id: 'tamper', label: 'Tamper Lab' },
    { id: 'des-compare', label: 'DES vs AES' },
    { id: 'security-tests', label: 'Security Tests' },
    { id: 'audit-logs', label: 'Security Activity' },
    { id: 'help', label: 'Help Center' },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-[#090909]/95 backdrop-blur-md border-b border-[#242424]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <div className="w-7 h-7 border border-[#B5A27E] bg-[#111111] flex items-center justify-center text-[#B5A27E] group-hover:border-white transition-colors">
              <div className="w-2 h-2 bg-[#B5A27E]" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-sm font-semibold tracking-[0.15em] text-white uppercase font-sans">
                CipherVault
              </span>
              <span className="text-[10px] font-mono tracking-widest text-[#777777] hidden md:inline uppercase">
                SP 800-38D
              </span>
            </div>
          </button>
        </div>

        {/* Zone 2: Primary Desktop Navigation */}
        <nav className="hidden xl:flex items-center gap-1 text-xs font-medium">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-3 py-1.5 transition-colors whitespace-nowrap cursor-pointer text-xs font-mono tracking-wider ${
                activeTab === item.id
                  ? 'border-b-2 border-[#B5A27E] text-white font-semibold bg-[#161616]'
                  : 'text-[#888888] hover:text-white hover:bg-[#141414]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Medium Screen Dropdown or Selected Tab */}
        <div className="hidden lg:flex xl:hidden items-center gap-1">
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`px-2.5 py-1 text-xs font-mono transition-colors whitespace-nowrap ${
                activeTab === item.id
                  ? 'border-b-2 border-[#B5A27E] text-white font-semibold bg-[#161616]'
                  : 'text-[#888888] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
          <button
            onClick={() => handleNavClick('help')}
            className={`px-2 py-1 text-xs font-mono ${
              activeTab === 'help' ? 'text-white' : 'text-[#888888] hover:text-white'
            }`}
          >
            Help
          </button>
        </div>

        {/* Zone 3: Primary Action & Controls */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={onOpenKeyModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-mono text-[#D4D4D4] hover:text-white bg-[#141414] hover:bg-[#1E1E1E] border border-[#2B2B2B] transition-colors"
            title="Inspect RSA-3072 Keys"
          >
            <KeyRound className="w-3 h-3 text-[#B5A27E]" />
            <span>RSA-3072</span>
          </button>

          <Button
            variant="primary"
            size="xs"
            onClick={() => setActiveTab('encrypt')}
            leftIcon={<Lock className="w-3 h-3" />}
          >
            Encrypt
          </Button>

          <Button
            variant="outline"
            size="xs"
            onClick={() => setActiveTab('decrypt')}
            leftIcon={<Unlock className="w-3 h-3 text-[#B5A27E]" />}
          >
            Decrypt
          </Button>

          {/* Account Profile / Auth */}
          <button
            onClick={onOpenAuthModal}
            className="w-8 h-8 bg-[#141414] border border-[#2B2B2B] hover:border-[#B5A27E] flex items-center justify-center text-[#888888] hover:text-white transition-colors cursor-pointer"
            title={session ? `Signed in as ${session.username}` : 'Authenticate'}
          >
            <User className="w-3.5 h-3.5" />
          </button>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 text-[#888888] hover:text-white border border-[#262626] bg-[#121212]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="xl:hidden border-b border-[#242424] bg-[#0E0E0E] px-4 py-3 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 text-xs font-mono transition-colors ${
                activeTab === item.id
                  ? 'bg-[#1C1C1C] text-[#B5A27E] font-semibold'
                  : 'text-[#888888] hover:text-white hover:bg-[#161616]'
              }`}
            >
              <span>{item.label}</span>
              <ChevronRight className="w-3.5 h-3.5 text-[#555555]" />
            </button>
          ))}

          <div className="pt-2 mt-2 border-t border-[#1F1F1F] flex items-center justify-between">
            <button
              onClick={() => {
                onOpenKeyModal();
                setMobileMenuOpen(false);
              }}
              className="flex items-center gap-1.5 text-xs font-mono text-[#888888] hover:text-white py-1"
            >
              <KeyRound className="w-3.5 h-3.5 text-[#B5A27E]" />
              <span>Inspect RSA-3072 Keys</span>
            </button>
            {onViewLanding && (
              <button
                onClick={() => {
                  onViewLanding();
                  setMobileMenuOpen(false);
                }}
                className="text-xs font-mono text-[#B5A27E] hover:underline py-1 flex items-center gap-1"
              >
                <span>Landing Page</span>
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
