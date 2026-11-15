'use client';

import React from 'react';
import { Gamepad2, Swords, Award, User as UserIcon, RefreshCw } from 'lucide-react';

export type ActiveTab = 'katalog' | 'team' | 'capaian' | 'profil';

interface NavigationTabsProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  onRefresh: () => void;
  isRefreshing?: boolean;
}

export default function NavigationTabs({
  activeTab,
  onTabChange,
  onRefresh,
  isRefreshing = false
}: NavigationTabsProps) {
  const tabs = [
    { id: 'katalog' as ActiveTab, label: 'Katalog Game', icon: Gamepad2 },
    { id: 'team' as ActiveTab, label: 'Team Battle', icon: Swords },
    { id: 'capaian' as ActiveTab, label: 'Capaian & Rekomendasi', icon: Award },
    { id: 'profil' as ActiveTab, label: 'Profil & Avatar', icon: UserIcon }
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6 border-b border-[#1f293d] pb-3">
      {/* Tab Buttons Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap select-none ${
                isActive
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-[#111827] text-slate-300 hover:bg-[#1e293b] hover:text-white border border-[#1f293d]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Action Right: Segarkan Data */}
      <div className="flex items-center justify-end">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#111827] hover:bg-[#1e293b] border border-[#1f293d] text-slate-300 hover:text-white text-xs font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : 'text-slate-400'}`} />
          <span>Segarkan Data</span>
        </button>
      </div>
    </div>
  );
}

