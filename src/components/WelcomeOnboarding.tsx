import React, { useRef } from 'react';
import { BookOpen, FolderOpen, Plus, ShieldCheck, Sparkles, Smartphone, Lock } from 'lucide-react';

interface WelcomeOnboardingProps {
  onStartNewProject: () => void;
  onRestoreBackup: (file: File) => void;
  onLoadDemo?: () => void;
  language?: 'hi' | 'en';
}

export function WelcomeOnboarding({
  onStartNewProject,
  onRestoreBackup,
  onLoadDemo,
  language = 'hi',
}: WelcomeOnboardingProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onRestoreBackup(file);
    }
  };

  const isHindi = language === 'hi';

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-between p-4 sm:p-8">
      {/* Top Brand Bar */}
      <header className="max-w-2xl w-full mx-auto flex items-center justify-between pt-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-white shadow-sm">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-stone-900">LedgerPilot</h1>
            <p className="text-xs text-stone-500 font-medium">Digital Khata Diary</p>
          </div>
        </div>
      </header>

      {/* Hero Welcome Card */}
      <main className="max-w-lg w-full mx-auto my-auto py-10 text-center">
        {/* Visual Glyph */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-800 shadow-sm">
          <BookOpen className="w-10 h-10" />
        </div>

        {/* Headlines */}
        <h2 className="text-3xl sm:text-4xl font-extrabold text-stone-900 tracking-tight mb-3">
          {isHindi ? 'अपना हिसाब, आसान तरीके से' : 'Your Ledger, Made Simple'}
        </h2>
        <p className="text-stone-600 text-base sm:text-lg mb-8 leading-relaxed max-w-md mx-auto">
          {isHindi
            ? 'अपनी आय और खर्च का सरल डिजिटल बहीखाता।'
            : 'Simple digital ledger for your income and expenses.'}
        </p>

        {/* Primary & Secondary Action Buttons */}
        <div className="flex flex-col gap-3.5 max-w-sm mx-auto mb-8">
          <button
            onClick={onStartNewProject}
            className="w-full h-13 px-6 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-semibold text-base flex items-center justify-center gap-2.5 shadow-md shadow-emerald-900/10 transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
            <span>{isHindi ? '+ नया हिसाब शुरू करें' : '+ Start New Ledger'}</span>
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            onClick={() => fileInputRef.current?.click()}
            className="w-full h-12 px-6 rounded-xl bg-white hover:bg-stone-100 active:bg-stone-200 text-stone-700 font-medium text-sm sm:text-base border border-stone-300 flex items-center justify-center gap-2.5 transition-colors cursor-pointer"
          >
            <FolderOpen className="w-4 h-4 text-stone-500" />
            <span>{isHindi ? '📂 पुराना हिसाब वापस लाएँ' : '📂 Restore Previous Ledger'}</span>
          </button>
        </div>

        {/* Trust Badges - Clean metadata text without pills */}
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-4 text-xs font-medium text-stone-500 pt-4 border-t border-stone-200">
          <div className="flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isHindi ? '100% निजी व सुरक्षित' : '100% Private & Secure'}</span>
          </div>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <div className="flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isHindi ? 'ऑफलाइन उपलब्ध' : 'Works Completely Offline'}</span>
          </div>
          <span aria-hidden="true" className="text-stone-300">·</span>
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
            <span>{isHindi ? 'कोई लॉगिन जरूरी नहीं' : 'No Account or Login Required'}</span>
          </div>
        </div>
      </main>

      {/* Footer / Demo Preview Option */}
      <footer className="max-w-md w-full mx-auto text-center pb-4">
        {onLoadDemo && (
          <button
            onClick={onLoadDemo}
            className="text-xs text-stone-500 hover:text-stone-800 underline underline-offset-4 transition-colors cursor-pointer py-2"
          >
            {isHindi
              ? '💡 देखना चाहते हैं कैसा दिखेगा? डेमो डेटा लोड करें'
              : '💡 Want to see how it looks? Load sample demo ledger'}
          </button>
        )}
      </footer>
    </div>
  );
}
