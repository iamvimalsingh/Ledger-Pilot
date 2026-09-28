import React, { useState } from 'react';
import { X, FolderPlus, Sparkles, Check, BookOpen } from 'lucide-react';

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (projectName: string, initialCategories: string[]) => void;
  language: 'hi' | 'en';
}

const PRESETS = [
  {
    id: 'general',
    nameHi: 'सामान्य वित्तीय (General Financial)',
    nameEn: 'General Financial',
    categories: ['Donation', 'Contribution', 'Member Fee', 'Expense', 'Maintenance', 'Operations', 'Other'],
  },
  {
    id: 'society',
    nameHi: 'सोसाइटी / कॉलोनी (Housing Society)',
    nameEn: 'Housing Society / Welfare',
    categories: ['Maintenance Fee', 'Security', 'Electricity & Water', 'Facility Booking', 'Repairs', 'Expense', 'Other'],
  },
  {
    id: 'school',
    nameHi: 'स्कूल / ट्रस्ट (School / Institution)',
    nameEn: 'School / Institution / Trust',
    categories: ['Tuition Fee', 'Development Fund', 'Exam Fee', 'Staff Salary', 'Supplies', 'Maintenance', 'Other'],
  },
];

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  language,
}) => {
  const isHi = language === 'hi';
  const [projectName, setProjectName] = useState<string>('');
  const [selectedPreset, setSelectedPreset] = useState<string>('general');
  const [error, setError] = useState<string>('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = projectName.trim();
    if (!trimmed) {
      setError(isHi ? 'कृपया प्रोजेक्ट का नाम दर्ज करें' : 'Please enter a project name');
      return;
    }

    const preset = PRESETS.find((p) => p.id === selectedPreset) || PRESETS[0];
    onCreate(trimmed, preset.categories);
    setProjectName('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl border border-stone-200 my-auto animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-4 border-b border-stone-200">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-600 text-white flex items-center justify-center shadow-xs">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">
                {isHi ? 'नया लेजर प्रोजेक्ट बनाएं' : 'Create New Project'}
              </h3>
              <p className="text-[11px] text-stone-500">
                {isHi ? 'अपने खाते अथवा संग्रह का नाम तय करें' : 'Set up a clean new ledger project'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-stone-400 hover:text-stone-700 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Project Name Input */}
          <div>
            <label className="font-semibold text-stone-800 text-xs block mb-1">
              {isHi ? 'प्रोजेक्ट का नाम (Project Name) *' : 'Project Name *'}
            </label>
            <input
              type="text"
              autoFocus
              value={projectName}
              onChange={(e) => {
                setProjectName(e.target.value);
                if (error) setError('');
              }}
              placeholder={isHi ? 'उदा. स्कूल वार्षिक कोष, वेलफेयर ट्रस्ट, क्लब 2026' : 'e.g. School Annual Fund, Welfare Society, Q3 Audit'}
              className={`w-full px-3.5 py-2.5 border rounded-xl text-sm font-medium transition focus:outline-none focus:ring-2 ${
                error
                  ? 'border-rose-400 focus:ring-rose-200'
                  : 'border-stone-300 focus:ring-amber-500/20 focus:border-amber-500'
              }`}
            />
            {error ? (
              <span className="text-[11px] text-rose-600 mt-1 block font-medium">{error}</span>
            ) : (
              <span className="text-[10px] text-stone-500 mt-1 block">
                {isHi
                  ? 'यह नाम डैशबोर्ड, लेजर, प्रिंट, और WhatsApp रिपोर्ट में दिखाई देगा।'
                  : 'This name appears across your Dashboard, Verified Ledger, Reports, Print, and WhatsApp exports.'}
              </span>
            )}
          </div>

          {/* Category Preset Picker */}
          <div>
            <label className="font-semibold text-stone-800 text-xs block mb-1.5">
              {isHi ? 'श्रेणी टेम्पलेट (Category Template)' : 'Category Template'}
            </label>
            <div className="space-y-2">
              {PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <div
                    key={preset.id}
                    onClick={() => setSelectedPreset(preset.id)}
                    className={`p-2.5 rounded-xl border cursor-pointer transition text-xs flex items-center justify-between ${
                      isSelected
                        ? 'border-amber-600 bg-amber-50/60 ring-1 ring-amber-600/30'
                        : 'border-stone-200 hover:border-stone-300 bg-white'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-stone-900 block">
                        {isHi ? preset.nameHi : preset.nameEn}
                      </span>
                      <span className="text-[10px] text-stone-500 line-clamp-1 mt-0.5">
                        {preset.categories.slice(0, 4).join(', ')}...
                      </span>
                    </div>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-amber-600 text-white flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-stone-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-stone-600 hover:bg-stone-100 transition"
            >
              {isHi ? 'रद्द करें' : 'Cancel'}
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white shadow-xs transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isHi ? 'प्रोजेक्ट शुरू करें' : 'Create Project'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
