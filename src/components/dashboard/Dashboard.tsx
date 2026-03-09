import React from 'react';

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  console.log("📊 Dashboard minimal renderizzata");
  
  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm">
      <h2 className="text-2xl font-black text-emerald-900">Dashboard TEST</h2>
      <p className="text-stone-600 mt-2">Se vedi questo, Dashboard funziona!</p>
      <button 
        onClick={() => onTabChange('inventory')}
        className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-xl"
      >
        Vai a Inventory
      </button>
    </div>
  );
};
