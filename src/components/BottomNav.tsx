import React from 'react';
import { LayoutDashboard, FileText, Share2, Menu } from 'lucide-react';
import { LedgerSettings } from '../types/ledger';

interface BottomNavProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSettings: () => void;
  settings: LedgerSettings;
  unverifiedCount?: number;
}

export function BottomNav({
  currentTab,
  onSelectTab,
  onOpenSettings,
  settings,
  unverifiedCount = 0,
}: BottomNavProps) {
  const isHi = settings.language === 'hi';

  const navItems = [
    {
      id: 'dashboard',
      label: isHi ? 'डैशबोर्ड' : 'Dashboard',
      icon: LayoutDashboard,
    },
    {
      id: 'ledger',
      label: isHi ? 'बहीखाता' : 'Ledger',
      icon: FileText,
      badge: unverifiedCount,
    },
    {
      id: 'reports',
      label: isHi ? 'शेयर/रिपोर्ट' : 'Reports',
      icon: Share2,
    },
    {
      id: 'menu',
      label: isHi ? 'मेनू' : 'Menu',
      icon: Menu,
      action: onOpenSettings,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-stone-200 px-3 py-1.5 shadow-lg">
      <div className="grid grid-cols-4 items-center max-w-sm mx-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  onSelectTab(item.id);
                }
              }}
              className={`flex flex-col items-center justify-center py-1 rounded-xl transition-all cursor-pointer ${
                isActive
                  ? 'text-emerald-800 font-bold'
                  : 'text-stone-500 font-medium hover:text-stone-800'
              }`}
            >
              <div
                className={`relative p-1 rounded-lg transition-transform ${
                  isActive ? 'bg-emerald-50 scale-105' : ''
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${
                    isActive ? 'text-emerald-800 stroke-[2.2]' : 'text-stone-500'
                  }`}
                />
                {item.badge && item.badge > 0 ? (
                  <span className="absolute -top-0.5 -right-1 bg-amber-500 text-white text-[9px] font-bold px-1 rounded-full min-w-3.5 text-center">
                    {item.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] tracking-tight mt-0.5">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
