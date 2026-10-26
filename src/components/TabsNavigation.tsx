import React from 'react';
import { TabType, TextSizeMode } from '../types';

interface TabsNavigationProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
  counts: {
    libros: number;
    no_leidos: number;
  };
  textSize: TextSizeMode;
}

export const TabsNavigation: React.FC<TabsNavigationProps> = ({
  activeTab,
  onChangeTab,
  counts,
  textSize,
}) => {
  const tabs = [
    {
      id: 'libros' as TabType,
      label: 'Libros',
      subtitle: '(Leídos)',
      count: counts.libros,
      badgeColor: 'bg-emerald-100 text-emerald-800 border border-emerald-300',
      activeColor: 'bg-[#2ECC71] text-white border-2 border-[#27AE60] shadow-md',
    },
    {
      id: 'no_leidos' as TabType,
      label: 'No Leídos',
      subtitle: '(Descargados pendientes)',
      count: counts.no_leidos,
      badgeColor: 'bg-amber-100 text-amber-900 border border-amber-300',
      activeColor: 'bg-[#E67E22] text-white border-2 border-[#D35400] shadow-md',
    },
  ];

  const labelSize =
    textSize === 'extra'
      ? 'text-lg sm:text-xl'
      : textSize === 'grande'
      ? 'text-base sm:text-lg'
      : 'text-sm sm:text-base';

  return (
    <nav className="w-full bg-[#F4F6F7] py-3 border-b-2 border-gray-200" aria-label="Secciones de la biblioteca">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-2 max-w-lg gap-3">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                id={`tab-${tab.id}`}
                onClick={() => onChangeTab(tab.id)}
                className={`flex items-center justify-between px-4 sm:px-5 py-3.5 rounded-2xl font-black transition-all cursor-pointer ${
                  isActive
                    ? `${tab.activeColor} scale-[1.02]`
                    : 'bg-white text-[#2C3E50] border-2 border-gray-300 hover:bg-[#F8F9FA] hover:border-gray-400 shadow-sm'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="text-left truncate">
                    <span className={`${labelSize} tracking-tight block`}>{tab.label}</span>
                  </div>
                </div>
                <span
                  className={`ml-2 px-3 py-0.5 rounded-full text-xs sm:text-sm font-black shrink-0 ${
                    isActive ? 'bg-black/20 text-white' : tab.badgeColor
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
};
