import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  onClick: () => void;
  language?: 'hi' | 'en';
}

export function FloatingActionButton({ onClick, language = 'hi' }: FloatingActionButtonProps) {
  const isHi = language === 'hi';

  return (
    <button
      onClick={onClick}
      aria-label={isHi ? 'नया हिसाब जोड़ें' : 'Add new entry'}
      className="md:hidden fixed bottom-20 right-4 z-40 h-13 px-4 rounded-full bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-950/20 transition-transform active:scale-95 cursor-pointer"
    >
      <Plus className="w-5 h-5 stroke-[2.5]" />
      <span>{isHi ? 'नया हिसाब' : 'Add Entry'}</span>
    </button>
  );
}
