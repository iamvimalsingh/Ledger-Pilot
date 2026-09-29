import React, { useState } from 'react';
import { X, BookOpen, Check } from 'lucide-react';
import { ProjectType } from '../types/ledger';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectName: string, initialCategories: string[], type: ProjectType) => void;
  language?: 'hi' | 'en';
}

const PRESETS: Array<{
  id: ProjectType;
  labelHi: string;
  labelEn: string;
  categories: string[];
}> = [
  {
    id: 'general',
    labelHi: 'सामान्य',
    labelEn: 'General',
    categories: ['Donation', 'Member Fee', 'Expense', 'Maintenance', 'Operations', 'Other'],
  },
  {
    id: 'personal',
    labelHi: 'घरेलू / व्यक्तिगत',
    labelEn: 'Personal / Home',
    categories: ['राशन/किराना', 'दूध/सब्जी', 'बिजली/पानी बिल', 'दवा/चिकित्सा', 'वेतन/आय', 'अन्य खर्च'],
  },
  {
    id: 'business',
    labelHi: 'दुकान / व्यापार',
    labelEn: 'Shop / Business',
    categories: ['बिक्री/कमाई', 'माल खरीद', 'दुकान किराया', 'मजदूरी/स्टाफ', 'अन्य खर्च'],
  },
  {
    id: 'society',
    labelHi: 'सोसायटी / ट्रस्ट',
    labelEn: 'Society / Trust',
    categories: ['मेंटेनेंस', 'सुरक्षा', 'बिजली-पानी', 'चंदा/सहयोग', 'मरम्मत', 'अन्य'],
  },
];

export function CreateProjectModal({
  isOpen,
  onClose,
  onCreate,
  language = 'hi',
}: CreateProjectModalProps) {
  const isHi = language === 'hi';
  const [projectName, setProjectName] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<ProjectType>('general');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) {
      setError(isHi ? 'कृपया खाते का नाम लिखें' : 'Please enter a ledger name');
      return;
    }

    const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];
    onCreate(trimmed, preset.categories, selectedPreset);
    setProjectName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3.5 mb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shadow-xs">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">
                {isHi ? 'नया हिसाब शुरू करें' : 'Create New Ledger'}
              </h3>
              <p className="text-xs text-stone-500 font-medium">
                {isHi ? 'अपने बहीखाते का नाम तय करें' : 'Give your new ledger a clear name'}
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name Input */}
          <div>
            <label className="font-semibold text-stone-700 text-xs block mb-1.5">
              {isHi ? 'हिसाब का नाम *' : 'Ledger Name *'}
            </label>
            <input
              type="text"
              autoFocus
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (error) setError('');
              }}
              placeholder={isHi ? 'जैसे: दुकान का हिसाब, घरेलू खर्च, चंदा रजिस्टर' : 'e.g. Shop Daily Khata, Home Expenses, Fund'}
              className={`w-full h-12 px-3.5 rounded-xl border bg-white text-base text-stone-900 focus:outline-none transition-all ${
                error
                  ? 'border-rose-500 ring-2 ring-rose-100'
                  : 'border-stone-300 focus:border-stone-900 focus:ring-2 focus:ring-stone-200'
              }`}
            />
            {error && <p className="text-xs text-rose-600 font-medium mt-1">{error}</p>}
          </div>

          {/* Preset Category Selector */}
          <div>
            <label className="font-semibold text-stone-700 text-xs block mb-1.5">
              {isHi ? 'प्रकार चुनें (Preset)' : 'Choose Type'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`h-11 px-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-emerald-700 bg-emerald-50/80 text-emerald-900 ring-1 ring-emerald-700'
                        : 'border-stone-200 bg-stone-50 hover:bg-stone-100 text-stone-700'
                    }`}
                  >
                    <span>{isHi ? preset.labelHi : preset.labelEn}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-emerald-700 stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-stone-200 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="h-11 px-4 rounded-xl border border-stone-300 text-stone-700 text-sm font-semibold hover:bg-stone-100 transition-colors cursor-pointer"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="h-11 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-sm font-semibold flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[2.5]" />
              <span>{isHi ? 'हिसाब शुरू करें' : 'Start Ledger'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
