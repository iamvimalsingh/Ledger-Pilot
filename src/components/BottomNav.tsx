import React from 'react';
import { Camera, Sparkles, CheckCircle2, BarChart3, Share2, AlertOctagon } from 'lucide-react';
import { LedgerSettings } from '../types/ledger';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  unverifiedCount: number;
  exceptionCount?: number;
  settings: LedgerSettings;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  unverifiedCount,
  exceptionCount = 0,
  settings,
}) => {
  const isHi = settings.language === 'hi';

  const navItems = [
    {
      id: 'upload',
      label: isHi ? 'फोटो' : 'Capture',
      icon: Camera,
      badge: 0,
      highlight: true,
    },
    {
      id: 'inbox',
      label: isHi ? 'आपत्तियां' : 'Inbox',
      icon: AlertOctagon,
      badge: exceptionCount,
    },
    {
      id: 'review',
      label: isHi ? 'AI रिव्यू' : 'Review',
      icon: Sparkles,
      badge: unverifiedCount,
    },
    {
      id: 'ledger',
      label: isHi ? 'लेजर' : 'Ledger',
      icon: CheckCircle2,
      badge: 0,
    },
    {
      id: 'summary',
      label: isHi ? 'हिसाब' : 'Summary',
      icon: BarChart3,
      badge: 0,
    },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-2 py-1.5 safe-area-pb shadow-lg">
      <div className="grid grid-cols-5 items-center">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`flex flex-col items-center justify-center py-1 px-1 rounded-xl transition-all relative ${
                isActive ? 'text-amber-700 font-bold' : 'text-stone-500 font-medium hover:text-stone-800'
              }`}
            >
              <div
                className={`relative p-1 rounded-lg transition-transform ${
                  isActive ? 'bg-amber-100/70 scale-105' : ''
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'text-amber-700' : 'text-stone-500'}`} />
                {item.badge > 0 && (
                  <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full min-w-4 text-center shadow-xs">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5 leading-tight">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
