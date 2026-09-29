import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  ChevronDown,
  Plus,
  Settings,
  Languages,
  FolderDown,
  Check,
  Camera,
  FileText,
  Share2,
  LayoutDashboard,
} from 'lucide-react';
import { LedgerSettings, LedgerProject } from '../types/ledger';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  projects: LedgerProject[];
  activeProject?: LedgerProject | null;
  onSelectProject: (id: string) => void;
  onOpenCreateProject: () => void;
  onOpenBackupModal: () => void;
  onOpenSettings: () => void;
  settings: LedgerSettings;
  onUpdateSettings: (newSettings: LedgerSettings) => void;
  unverifiedCount?: number;
}

export function Navbar({
  currentTab,
  onSelectTab,
  projects,
  activeProject,
  onSelectProject,
  onOpenCreateProject,
  onOpenBackupModal,
  onOpenSettings,
  settings,
  onUpdateSettings,
  unverifiedCount = 0,
}: NavbarProps) {
  const isHi = settings.language === 'hi';
  const [isProjectDropdownOpen, setIsProjectDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsProjectDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleLanguage = () => {
    const nextLang = settings.language === 'hi' ? 'en' : 'hi';
    onUpdateSettings({ ...settings, language: nextLang });
  };

  const navItems = [
    { id: 'dashboard', labelHi: 'डैशबोर्ड', labelEn: 'Dashboard', icon: LayoutDashboard },
    { id: 'ledger', labelHi: 'बहीखाता', labelEn: 'Ledger', icon: FileText },
    { id: 'reports', labelHi: 'शेयर एवं रिपोर्ट', labelEn: 'Reports & Share', icon: Share2 },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-15">
          {/* Left: Brand + Project Switcher */}
          <div className="flex items-center gap-3">
            {/* Logo */}
            <div
              onClick={() => onSelectTab('dashboard')}
              className="flex items-center gap-2 cursor-pointer select-none"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-2xs">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="font-extrabold text-lg text-stone-900 tracking-tight hidden sm:inline">
                LedgerPilot
              </span>
            </div>

            {/* Project Switcher Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsProjectDropdownOpen(!isProjectDropdownOpen)}
                className="h-9 px-3 rounded-xl bg-stone-100 hover:bg-stone-200/80 text-stone-800 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer max-w-[160px] sm:max-w-xs"
              >
                <span className="truncate">{activeProject?.name || settings.projectName || 'My Ledger'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-stone-500 shrink-0" />
              </button>

              {isProjectDropdownOpen && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-1.5 text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
                    {isHi ? 'मेरे हिसाब' : 'My Ledgers'}
                  </div>

                  <div className="max-h-56 overflow-y-auto divide-y divide-stone-100">
                    {projects.map((proj) => {
                      const isActive = proj.id === activeProject?.id;
                      return (
                        <button
                          key={proj.id}
                          type="button"
                          onClick={() => {
                            onSelectProject(proj.id);
                            setIsProjectDropdownOpen(false);
                          }}
                          className="w-full px-3 py-2 text-left text-xs flex items-center justify-between hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                          <span className={`font-semibold truncate ${isActive ? 'text-emerald-800' : 'text-stone-800'}`}>
                            {proj.name}
                          </span>
                          {isActive && <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3] shrink-0" />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-1.5 mt-1 border-t border-stone-100 px-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        setIsProjectDropdownOpen(false);
                        onOpenCreateProject();
                      }}
                      className="w-full h-8 px-2.5 rounded-lg text-xs font-semibold text-emerald-800 hover:bg-emerald-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isHi ? '+ नया हिसाब शुरू करें' : '+ Start New Ledger'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Center: Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer ${
                    isActive
                      ? 'bg-stone-100 text-stone-900'
                      : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{isHi ? item.labelHi : item.labelEn}</span>
                  {item.id === 'scan' && unverifiedCount > 0 && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                  )}
                </button>
              );
            })}
          </nav>

          {/* Right: Quick Utilities (Language, Backup, Settings) */}
          <div className="flex items-center gap-1.5">
            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              title={isHi ? 'Switch to English' : 'हिंदी में बदलें'}
              className="h-9 px-2.5 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
            >
              <Languages className="w-3.5 h-3.5 text-stone-500" />
              <span>{isHi ? 'EN' : 'हिं'}</span>
            </button>

            {/* Backup Quick Trigger */}
            <button
              onClick={onOpenBackupModal}
              title={isHi ? 'बैकअप एवं रीस्टोर' : 'Backup & Restore'}
              className="w-9 h-9 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <FolderDown className="w-4 h-4" />
            </button>

            {/* Settings Trigger */}
            <button
              onClick={onOpenSettings}
              title={isHi ? 'सेटिंग्स' : 'Settings'}
              className="w-9 h-9 rounded-xl border border-stone-200 hover:bg-stone-50 text-stone-700 flex items-center justify-center transition-colors cursor-pointer"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
