import React from 'react';

interface MobileNavProps {
  menuItems: Array<{ id: string; label: string; icon: React.FC<{ size?: number }> }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ menuItems, activeTab, onTabChange }) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t flex justify-around p-2 z-50 shadow-lg overflow-x-auto hide-scrollbar">
      {menuItems.map(item => (
        <button 
          key={item.id} 
          onClick={() => onTabChange(item.id)} 
          className={`flex flex-col items-center min-w-[65px] p-2 transition-colors relative ${
            activeTab === item.id ? 'text-emerald-600' : 'text-stone-500'
          }`}
        >
          <item.icon size={22} />
          <span className="text-[9px] font-bold uppercase mt-1">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};
