import React, { useState } from 'react';
import {
  KeyRound,
  User,
  Menu,
  X,
  Lock,
  Unlock,
  Shield,
  FileText,
  Activity,
  Layers,
  HelpCircle,
  FolderLock,
  ChevronRight,
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

  const primaryNavItems = [
    { id: 'overview', label: 'Dashboard' },
    { id: 'encrypt', label: 'Encrypt' },
    { id: 'decrypt', label: 'Decrypt' },
    { id: 'vault', label: 'Vault Files' },
  ];

  const secondaryNavItems = [
    { id: 'tamper', label: 'Tamper Lab' },
    { id: 'des-compare', label: 'DES vs AES' },
    { id: 'security-tests', label: 'Security Tests' },
    { id: 'audit-logs', label: 'Audit Logs' },
    { id: 'help', label: 'Help' },
  ];

  const allNavItems = [...primaryNavItems, ...secondaryNavItems];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#E5E5E5] shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-3">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-6 shrink-0">
            <button
              onClick={() => handleNavClick('overview')}
              className="flex items-center gap-2.5 text-left group cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111111] rounded p-1 -ml-1"
            >
              <div className="w-8 h-8 rounded-md bg-[#111111] text-white flex items-center justify-center font-bold text-sm tracking-tighter shrink-0 shadow-xs">
                {/* Minimalist geometric vault logo */}
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  <circle cx="12" cy="16" r="1.5" fill="currentColor"></circle>
                </svg>
              </div>
              <div className="flex flex-col">
                <span className="text-base font-bold tracking-tight text-[#111111] leading-none">
                  CipherVault
                </span>
                <span className="text-[10px] text-[#666666] tracking-wider uppercase font-medium mt-0.5">
                  Cryptographic Engine
                </span>
              </div>
            </button>

            {/* Desktop Primary Navigation */}
            <nav className="hidden lg:flex items-center gap-1 ml-2">
              {allNavItems.map((item) => {
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer select-none whitespace-nowrap ${
                      isActive
                        ? 'bg-[#111111] text-white font-semibold shadow-xs'
                        : 'text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7]'
                    }`}
                  >
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Landing Link */}
            {onViewLanding && (
              <button
                onClick={onViewLanding}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-[#666666] hover:text-[#111111] font-medium transition-colors"
                title="View product overview"
              >
                <span>Product Tour</span>
              </button>
            )}

            {/* Key Pair Management */}
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenKeyModal}
              leftIcon={<KeyRound className="w-3.5 h-3.5" />}
              className="hidden sm:inline-flex"
            >
              <span>Key Pair</span>
            </Button>

            {/* Authentication / Profile Button */}
            <Button
              variant="primary"
              size="sm"
              onClick={onOpenAuthModal}
              leftIcon={<User className="w-3.5 h-3.5" />}
            >
              <span className="truncate max-w-[120px]">
                {session ? session.username.split(' ')[0] : 'Sign In'}
              </span>
            </Button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7] rounded-md transition-colors cursor-pointer"
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#E5E5E5] bg-white px-4 pt-3 pb-6 space-y-4 shadow-md max-h-[80vh] overflow-y-auto">
          <div className="space-y-1">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#888888]">
              Main Modules
            </div>
            {primaryNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#111111] text-white font-semibold'
                    : 'text-[#111111] hover:bg-[#F7F7F7]'
                }`}
              >
                <span>{item.label}</span>
                {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            ))}
          </div>

          <div className="space-y-1 pt-2 border-t border-[#E5E5E5]">
            <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-[#888888]">
              Verification & Tools
            </div>
            {secondaryNavItems.map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full text-left px-3 py-2 text-sm font-medium rounded-md transition-colors flex items-center justify-between cursor-pointer ${
                  activeTab === item.id
                    ? 'bg-[#111111] text-white font-semibold'
                    : 'text-[#666666] hover:text-[#111111] hover:bg-[#F7F7F7]'
                }`}
              >
                <span>{item.label}</span>
                {activeTab === item.id && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
              </button>
            ))}
          </div>

          <div className="pt-3 border-t border-[#E5E5E5] flex flex-col gap-2">
            <Button
              variant="outline"
              size="md"
              onClick={() => {
                onOpenKeyModal();
                setMobileMenuOpen(false);
              }}
              leftIcon={<KeyRound className="w-4 h-4" />}
              className="w-full justify-center"
            >
              Manage RSA-3072 Keys
            </Button>
            {onViewLanding && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  onViewLanding();
                  setMobileMenuOpen(false);
                }}
                className="w-full justify-center text-xs"
              >
                View Landing Page
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
