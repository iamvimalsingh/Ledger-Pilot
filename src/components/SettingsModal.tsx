import React, { useState, useRef } from 'react';
import {
  X,
  Settings,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Check,
  FolderDown,
  FolderOpen,
  AlertTriangle,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { LedgerSettings, LedgerProject, LedgerEntry } from '../types/ledger';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: LedgerSettings;
  onSaveSettings: (settings: LedgerSettings) => void;
  activeProject?: LedgerProject | null;
  onUpdateProjectName?: (newName: string) => void;
  onExportBackup: () => void;
  onRestoreBackupFile: (file: File, mode: 'replace' | 'import_new') => void;
  onLoadDemoData?: () => void;
  onResetAllData?: () => void;
  language?: 'hi' | 'en';
}

export function SettingsModal({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  activeProject,
  onUpdateProjectName,
  onExportBackup,
  onRestoreBackupFile,
  onLoadDemoData,
  onResetAllData,
  language = 'hi',
}: SettingsModalProps) {
  if (!isOpen) return null;

  const isHi = language === 'hi';
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [projectName, setProjectName] = useState(
    activeProject?.name || settings.projectName || 'My Ledger'
  );
  const [categories, setCategories] = useState<string[]>([...settings.categories]);
  const [newCat, setNewCat] = useState('');
  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restorePreview, setRestorePreview] = useState<{
    version: number;
    projectsCount: number;
    entriesCount: number;
    projectNames: string[];
  } | null>(null);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleAddCategory = () => {
    const trimmed = newCat.trim();
    if (!trimmed || categories.includes(trimmed)) return;
    setCategories([...categories, trimmed]);
    setNewCat('');
  };

  const handleRemoveCategory = (cat: string) => {
    setCategories(categories.filter((c) => c !== cat));
  };

  const handleSave = () => {
    if (onUpdateProjectName && projectName.trim() && projectName !== activeProject?.name) {
      onUpdateProjectName(projectName.trim());
    }

    onSaveSettings({
      ...settings,
      projectName: projectName.trim(),
      categories,
    });
    onClose();
  };

  // Inspect file before restoring
  const handleFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreFile(file);
    setRestoreError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Check if v2 format or v1 format
        let pCount = 0;
        let eCount = 0;
        let pNames: string[] = [];

        if (parsed.version === 2 && Array.isArray(parsed.projects)) {
          pCount = parsed.projects.length;
          pNames = parsed.projects.map((p: any) => p.name);
          eCount = Array.isArray(parsed.entries) ? parsed.entries.length : 0;
        } else if (Array.isArray(parsed.records)) {
          // v1 format
          pCount = 1;
          pNames = [parsed.settings?.projectName || 'Restored Ledger'];
          eCount = parsed.records.length;
        } else {
          throw new Error('Unrecognized LedgerPilot format');
        }

        setRestorePreview({
          version: parsed.version || 1,
          projectsCount: pCount,
          entriesCount: eCount,
          projectNames: pNames,
        });
      } catch (err) {
        setRestoreError(
          isHi
            ? 'अमान्य बैकअप फ़ाइल। कृपया सही LedgerPilot JSON फ़ाइल चुनें।'
            : 'Invalid backup file format. Please choose a valid LedgerPilot JSON.'
        );
        setRestorePreview(null);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">
                {isHi ? 'सेटिंग्स एवं बैकअप' : 'Settings & Backup'}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {isHi ? 'खाते का नाम, श्रेणियां और डेटा बैकअप' : 'Manage ledger name, categories & backup'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto space-y-5 flex-1 pr-1">
          {/* 1. Active Ledger Name */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              {isHi ? 'वर्तमान हिसाब का नाम' : 'Current Ledger Name'}
            </label>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              className="w-full h-11 px-3.5 rounded-xl border border-stone-300 text-sm font-semibold text-stone-900 focus:outline-none focus:border-stone-900"
            />
          </div>

          {/* 2. Categories Manager */}
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1.5">
              {isHi ? 'मद / श्रेणियां (Categories)' : 'Categories'}
            </label>

            <div className="flex gap-2 mb-2.5">
              <input
                type="text"
                value={newCat}
                onChange={(e) => setNewCat(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCategory();
                  }
                }}
                placeholder={isHi ? 'नई श्रेणी लिखें...' : 'New category name...'}
                className="flex-1 h-10 px-3 rounded-xl border border-stone-300 text-xs text-stone-900 focus:outline-none focus:border-stone-900"
              />
              <button
                type="button"
                onClick={handleAddCategory}
                className="h-10 px-3.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                {isHi ? '+ जोड़ें' : '+ Add'}
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-2 bg-stone-50 rounded-xl border border-stone-200">
              {categories.map((cat) => (
                <div
                  key={cat}
                  className="px-2.5 py-1 rounded-lg bg-white border border-stone-200 text-xs font-medium text-stone-800 flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{cat}</span>
                  {categories.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveCategory(cat)}
                      className="text-stone-400 hover:text-rose-600 cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* 3. Backup & Restore Section */}
          <div className="pt-3 border-t border-stone-200">
            <h4 className="text-xs font-bold text-stone-900 uppercase tracking-wider mb-2.5">
              {isHi ? 'बैकअप एवं डेटा रीस्टोर' : 'Backup & Data Portability'}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Export Backup Button */}
              <button
                type="button"
                onClick={onExportBackup}
                className="h-11 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <FolderDown className="w-4 h-4 text-emerald-700" />
                <span>{isHi ? 'हिसाब सुरक्षित करें (बैकअप)' : 'Export Backup (JSON)'}</span>
              </button>

              {/* Restore Button Trigger */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="h-11 px-4 rounded-xl border border-stone-300 bg-white hover:bg-stone-50 text-stone-800 text-xs font-semibold flex items-center justify-center gap-2 shadow-2xs transition-colors cursor-pointer"
              >
                <FolderOpen className="w-4 h-4 text-indigo-700" />
                <span>{isHi ? 'पुराना हिसाब वापस लाएँ' : 'Restore Backup'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFilePicked}
                className="hidden"
              />
            </div>

            {/* Restore Preview Dialog if file selected */}
            {restorePreview && restoreFile && (
              <div className="mt-3 p-3.5 rounded-xl bg-indigo-50/70 border border-indigo-200 text-xs space-y-2">
                <p className="font-bold text-indigo-950">
                  {isHi ? 'बैकअप फ़ाइल जांची गई:' : 'Backup verified:'}
                </p>
                <p className="text-indigo-800">
                  {isHi
                    ? `खाते: ${restorePreview.projectNames.join(', ')} (${restorePreview.entriesCount} प्रविष्टियां)`
                    : `Ledgers: ${restorePreview.projectNames.join(', ')} (${restorePreview.entriesCount} entries)`}
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onRestoreBackupFile(restoreFile, 'import_new');
                      setRestoreFile(null);
                      setRestorePreview(null);
                      onClose();
                    }}
                    className="h-8 px-3 rounded-lg bg-indigo-700 hover:bg-indigo-800 text-white font-semibold transition-colors cursor-pointer"
                  >
                    {isHi ? 'नए खाते के रूप में जोड़ें' : 'Import as New Ledger'}
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onRestoreBackupFile(restoreFile, 'replace');
                      setRestoreFile(null);
                      setRestorePreview(null);
                      onClose();
                    }}
                    className="h-8 px-3 rounded-lg border border-indigo-300 bg-white hover:bg-indigo-50 text-indigo-900 font-semibold transition-colors cursor-pointer"
                  >
                    {isHi ? 'वर्तमान डेटा बदलकर रीस्टोर करें' : 'Replace All Data'}
                  </button>
                </div>
              </div>
            )}

            {restoreError && (
              <p className="text-xs text-rose-600 font-medium mt-2">{restoreError}</p>
            )}
          </div>

          {/* 4. Demo Data & Reset (Advanced) */}
          <div className="pt-3 border-t border-stone-200 space-y-2">
            <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-1">
              {isHi ? 'डेमो एवं रीसेट विकल्प' : 'Sample Data & Reset'}
            </h4>

            <div className="flex flex-wrap items-center justify-between gap-2">
              {onLoadDemoData && (
                <button
                  type="button"
                  onClick={() => {
                    onLoadDemoData();
                    onClose();
                  }}
                  className="text-xs font-semibold text-stone-600 hover:text-stone-900 underline underline-offset-4 cursor-pointer py-1"
                >
                  {isHi ? '💡 नमूना (डेमो) डेटा लोड करें' : 'Load sample demo ledger'}
                </button>
              )}

              {onResetAllData && !showResetConfirm && (
                <button
                  type="button"
                  onClick={() => setShowResetConfirm(true)}
                  className="text-xs font-semibold text-rose-600 hover:text-rose-800 cursor-pointer py-1"
                >
                  {isHi ? 'सभी डेटा साफ़ करें (Reset)' : 'Reset All Data'}
                </button>
              )}
            </div>

            {showResetConfirm && onResetAllData && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs space-y-2 mt-2">
                <p className="font-bold text-rose-900">
                  {isHi
                    ? 'चेतावनी: सारा डेटा हमेशा के लिए हट जाएगा।'
                    : 'Warning: All ledger data will be deleted permanently.'}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onResetAllData();
                      setShowResetConfirm(false);
                      onClose();
                    }}
                    className="h-8 px-3 rounded-lg bg-rose-700 hover:bg-rose-800 text-white font-semibold cursor-pointer"
                  >
                    {isHi ? 'हां, सब साफ़ करें' : 'Yes, Delete Everything'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(false)}
                    className="h-8 px-3 rounded-lg border border-stone-300 bg-white text-stone-700 font-semibold cursor-pointer"
                  >
                    {isHi ? 'रद्द करें' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-stone-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="h-10 px-4 rounded-xl border border-stone-300 text-xs font-semibold text-stone-700 hover:bg-stone-50 cursor-pointer"
          >
            {isHi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="h-10 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-xs font-semibold text-white shadow-2xs cursor-pointer flex items-center gap-1.5"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>{isHi ? 'सहेजें' : 'Save'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
