import React from 'react';
import { LogOut } from 'lucide-react';

interface SidebarProps {
  menuItems: Array<{ 
    id: string; 
    label: string; 
    icon: React.FC<{ size?: number }> 
  }>;
  activeTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  userName: string;
  expiringCount?: number; // opzionale per il badge delle notifiche
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  menuItems, 
  activeTab, 
  onTabChange, 
  onLogout,
  userName,
  expiringCount = 0
}) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white border-r p-6 fixed h-full shadow-sm z-40">
      <h1 className="text-xl font-black mb-8 text-emerald-900 italic uppercase">
        AgriManager Pro
      </h1>
      
      <nav className="space-y-1 flex-1 overflow-y-auto custom-scrollbar">
        {menuItems.map(item => (
          <button 
            key={item.id} 
            onClick={() => onTabChange(item.id)} 
            className={`flex items-center gap-3 w-full p-3 rounded-xl font-bold text-sm transition-all ${
              activeTab === item.id 
                ? 'bg-emerald-600 text-white shadow-md' 
                : 'text-stone-800 hover:bg-stone-50'
            }`}
          >
            <item.icon size={18} /> 
            <span className="flex-1 text-left">{item.label}</span>
            
            {/* Badge per il libretto sanitario se ci sono scadenze */}
            {item.id === 'health' && expiringCount > 0 && (
              <span className="bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center">
                {expiringCount}
              </span>
            )}
          </button>
        ))}
      </nav>
      
      <div className="border-t pt-4 mt-4">
        <p className="text-xs font-bold text-stone-600 mb-2 truncate">
          👤 {userName}
        </p>
        <button 
          onClick={onLogout} 
          className="flex items-center gap-2 text-red-600 font-bold p-2 text-xs uppercase w-full hover:bg-red-50 rounded-lg transition-colors"
        >
          <LogOut size={18} /> 
          <span>Esci</span>
        </button>
      </div>
    </aside>
  );
};