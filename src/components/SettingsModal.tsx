import React, { useState } from 'react';
import {
  X,
  Settings,
  Plus,
  Trash2,
  Download,
  Upload,
  RotateCcw,
  Sparkles,
  Check,
} from 'lucide-react';
import { LedgerSettings } from '../types/ledger';

interface SettingsModalProps {
  settings: LedgerSettings;
  onSaveSettings: (settings: LedgerSettings) => void;
  onResetSampleData: () => void;
  onExportJSON: () => void;
  onImportJSON: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onClose: () => void;
  language: 'hi' | 'en';
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  settings,
  onSaveSettings,
  onResetSampleData,
  onExportJSON,
  onImportJSON,
  onClose,
  language,
}) => {
  const isHi = language === 'hi';
  const [formData, setFormData] = useState<LedgerSettings>({ ...settings });
  const [newCategory, setNewCategory] = useState<string>('');

  const handleAddCategory = () => {
    if (!newCategory.trim()) return;
    if (formData.categories.includes(newCategory.trim())) return;
    setFormData({
      ...formData,
      categories: [...formData.categories, newCategory.trim()],
    });
    setNewCategory('');
  };

  const handleRemoveCategory = (cat: string) => {
    setFormData({
      ...formData,
      categories: formData.categories.filter((c) => c !== cat),
    });
  };

  const handleSave = () => {
    onSaveSettings(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-auto">
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
              <Settings className="w-4.5 h-4.5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">
                {isHi ? 'सिस्टम सेटिंग्स एवं विन्यास' : 'System Settings & Config'}
              </h3>
              <p className="text-[11px] text-stone-500">
                {isHi ? 'श्रेणियां, इवेंट का नाम और डेटा बैकअप' : 'Categories, project details & data backup'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-stone-400 hover:text-stone-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* Project Name */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              {isHi ? 'प्रोजेक्ट का नाम (Project Name)' : 'Project Name'}
            </label>
            <input
              type="text"
              value={formData.projectName || formData.eventOrColony || ''}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  projectName: e.target.value,
                  eventOrColony: e.target.value,
                })
              }
              className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm font-medium"
              placeholder={
                isHi
                  ? 'उदा. स्कूल वार्षिक कोष, वेलफेयर ट्रस्ट 2026'
                  : 'e.g. School Annual Fund, Welfare Trust 2026'
              }
            />
          </div>

          {/* Categories Manager */}
          <div>
            <label className="font-semibold text-stone-700 block mb-1">
              {isHi ? 'संग्रह श्रेणियां (Configurable Categories)' : 'Collection Categories'}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <input
                type="text"
                placeholder={isHi ? 'नई श्रेणी जोड़ें (उदा. संचालन व्यय)' : 'Add new category (e.g. Operations)'}
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                className="flex-1 px-3 py-1.5 border border-stone-300 rounded-lg text-xs"
              />
              <button
                onClick={handleAddCategory}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isHi ? 'जोड़ें' : 'Add'}</span>
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-stone-50 rounded-lg border border-stone-200">
              {formData.categories.map((cat) => (
                <span
                  key={cat}
                  className="inline-flex items-center gap-1 text-[11px] font-medium bg-white text-stone-800 border border-stone-200 px-2 py-0.5 rounded-md shadow-2xs"
                >
                  <span>{cat}</span>
                  <button
                    onClick={() => handleRemoveCategory(cat)}
                    className="text-stone-400 hover:text-rose-600 ml-0.5"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Data Backup & Restore */}
          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-2">
            <span className="font-bold text-stone-800 block">
              {isHi ? 'डेटा बैकअप एवं रीसेट (Data Management)' : 'Backup & Reset'}
            </span>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={onExportJSON}
                className="px-3 py-1.5 bg-white text-stone-800 border border-stone-300 rounded-lg font-semibold hover:bg-stone-100 transition flex items-center gap-1.5 shadow-2xs"
              >
                <Download className="w-3.5 h-3.5 text-stone-600" />
                <span>{isHi ? 'बैकअप डाउनलोड (Export JSON)' : 'Export JSON'}</span>
              </button>

              <label className="px-3 py-1.5 bg-white text-stone-800 border border-stone-300 rounded-lg font-semibold hover:bg-stone-100 transition flex items-center gap-1.5 shadow-2xs cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-stone-600" />
                <span>{isHi ? 'बैकअप अपलोड (Import)' : 'Import JSON'}</span>
                <input type="file" accept=".json" onChange={onImportJSON} className="hidden" />
              </label>

              <button
                onClick={onResetSampleData}
                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg font-semibold hover:bg-rose-100 transition flex items-center gap-1.5 ml-auto"
                title="Reset to sample dataset"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{isHi ? 'नमूना डेटा लोड करें' : 'Reset Sample'}</span>
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 mt-5 pt-3 border-t border-stone-200">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100"
          >
            {isHi ? 'रद्द करें' : 'Cancel'}
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2 rounded-xl text-xs font-bold bg-stone-900 hover:bg-stone-800 text-white shadow-xs"
          >
            {isHi ? 'सहेजें (Save)' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};
