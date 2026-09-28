import React from 'react';
import {
  BookOpen,
  Sparkles,
  Camera,
  CheckCircle2,
  BarChart3,
  Share2,
  Settings,
  Users,
  AlertTriangle,
  Languages,
  FolderPlus,
  AlertOctagon,
} from 'lucide-react';
import { LedgerSettings } from '../types/ledger';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unverifiedCount: number;
  duplicateCount: number;
  exceptionCount?: number;
  settings: LedgerSettings;
  onUpdateSettings: (newSettings: LedgerSettings) => void;
  onOpenSettings: () => void;
  onOpenCreateProject?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onSelectTab,
  unverifiedCount,
  duplicateCount,
  exceptionCount = 0,
  settings,
  onUpdateSettings,
  onOpenSettings,
  onOpenCreateProject,
}) => {
  const toggleLanguage = () => {
    const nextLang = settings.language === 'hi' ? 'en' : 'hi';
    onUpdateSettings({ ...settings, language: nextLang });
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6">
        <div className="flex items-center justify-between h-15">
          {/* Logo & App Name */}
          <div
            className="flex items-center gap-2.5 cursor-pointer select-none"
            onClick={() => onSelectTab('dashboard')}
          >
            <div className="w-9 h-9 rounded-xl bg-amber-600 flex items-center justify-center text-white shadow-sm shadow-amber-600/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-lg text-stone-900 tracking-tight">LedgerPilot</span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">
                  AI
                </span>
              </div>
              <p
                className="text-[11px] text-stone-500 font-medium leading-none truncate max-w-[150px] sm:max-w-xs"
                title={settings.projectName || 'New Ledger'}
              >
                {settings.projectName || 'New Ledger'}
              </p>
            </div>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              {settings.language === 'hi' ? 'डैशबोर्ड' : 'Dashboard'}
            </button>

            <button
              onClick={() => onSelectTab('upload')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'upload'
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Camera className="w-4 h-4 text-amber-600" />
              <span>{settings.language === 'hi' ? 'फोटो / स्कैन' : 'Capture / Upload'}</span>
            </button>

            <button
              onClick={() => onSelectTab('review')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 relative transition-colors ${
                currentTab === 'review'
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>{settings.language === 'hi' ? 'AI समीक्षा' : 'AI Review'}</span>
              {unverifiedCount > 0 && (
                <span className="ml-0.5 bg-amber-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {unverifiedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('inbox')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 relative transition-colors ${
                currentTab === 'inbox'
                  ? 'bg-rose-50 text-rose-900 font-bold'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <AlertOctagon className="w-4 h-4 text-rose-600" />
              <span>{settings.language === 'hi' ? 'आपत्तियां (Inbox)' : 'Inbox'}</span>
              {exceptionCount > 0 && (
                <span className="ml-0.5 bg-rose-600 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                  {exceptionCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onSelectTab('ledger')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'ledger'
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{settings.language === 'hi' ? 'सत्यापित लेजर' : 'Verified Ledger'}</span>
            </button>

            <button
              onClick={() => onSelectTab('summary')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'summary'
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <BarChart3 className="w-4 h-4 text-blue-600" />
              <span>{settings.language === 'hi' ? 'हिसाब सारांश' : 'Summary'}</span>
            </button>

            <button
              onClick={() => onSelectTab('households')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'households'
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>{settings.language === 'hi' ? 'परिवार / सदस्य' : 'Households'}</span>
            </button>

            <button
              onClick={() => onSelectTab('reports')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'reports'
                  ? 'bg-amber-50 text-amber-800'
                  : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
              }`}
            >
              <Share2 className="w-4 h-4 text-teal-600" />
              <span>{settings.language === 'hi' ? 'रिपोर्ट्स' : 'Reports'}</span>
            </button>
            <button
              onClick={() => onSelectTab('local-ocr-test')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition-colors ${
                currentTab === 'local-ocr-test'
                  ? 'bg-amber-100 text-amber-950 font-bold border border-amber-300'
                  : 'text-amber-800 bg-amber-50/70 hover:bg-amber-100/80 border border-amber-200/60'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{settings.language === 'hi' ? 'लोकल OCR लैब' : 'Local OCR Test'}</span>
            </button>
          </nav>

          {/* Action Icons */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Duplicates pill if any */}
            {duplicateCount > 0 && (
              <button
                onClick={() => onSelectTab('duplicates')}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 text-xs font-semibold hover:bg-rose-100 transition animate-pulse"
                title={`${duplicateCount} संभावित duplicate`}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                <span className="hidden sm:inline">Duplicate:</span>
                <span>{duplicateCount}</span>
              </button>
            )}

            {/* Language Toggle */}
            <button
              onClick={toggleLanguage}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-stone-700 bg-stone-100 hover:bg-stone-200 transition border border-stone-200/80"
              title="Change Language / भाषा बदलें"
            >
              <Languages className="w-3.5 h-3.5 text-stone-500" />
              <span>{settings.language === 'hi' ? 'EN' : 'हिन्दी'}</span>
            </button>

            {/* New Project Button */}
            {onOpenCreateProject && (
              <button
                onClick={onOpenCreateProject}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-900 bg-amber-100/90 hover:bg-amber-200 transition border border-amber-300/80 shadow-2xs"
                title={settings.language === 'hi' ? 'नया प्रोजेक्ट शुरू करें' : 'Create New Project'}
              >
                <FolderPlus className="w-3.5 h-3.5 text-amber-700" />
                <span className="hidden sm:inline">
                  {settings.language === 'hi' ? 'नया प्रोजेक्ट' : 'New Project'}
                </span>
              </button>
            )}

            {/* Settings button */}
            <button
              onClick={onOpenSettings}
              className="p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition"
              title="Settings / सेटिंग्स"
            >
              <Settings className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
