import React from 'react';

interface KPICardsProps {
  totalAnimals: number;
  pendingTasks: number;
  totalIncome: number;
  totalExpense: number;
  onInventoryClick: () => void;
  onTasksClick: () => void;
}

export const KPICards: React.FC<KPICardsProps> = ({
  totalAnimals,
  pendingTasks,
  totalIncome,
  totalExpense,
  onInventoryClick,
  onTasksClick
}) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Bilancio */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-6 rounded-3xl text-white shadow-xl">
        <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Bilancio Netto</p>
        <h3 className="text-4xl font-black mb-2">€ {(totalIncome - totalExpense).toFixed(0)}</h3>
        <div className="flex gap-4 text-[9px] text-stone-400">
          <span>📈 Entrate: €{totalIncome}</span>
          <span>📉 Uscite: €{totalExpense}</span>
        </div>
      </div>

      {/* Capi e Task */}
      <div className="grid grid-cols-2 gap-4">
        <div 
          onClick={onInventoryClick} 
          className="bg-white p-4 rounded-2xl border shadow-sm cursor-pointer hover:border-emerald-300"
        >
          <p className="text-[9px] font-bold text-stone-600 uppercase mb-1">Capi Totali</p>
          <h4 className="text-3xl font-black text-stone-800">{totalAnimals}</h4>
        </div>
        <div 
          onClick={onTasksClick} 
          className="bg-white p-4 rounded-2xl border shadow-sm cursor-pointer hover:border-emerald-300"
        >
          <p className="text-[9px] font-bold text-stone-600 uppercase mb-1">Task</p>
          <h4 className="text-3xl font-black text-stone-800">{pendingTasks}</h4>
        </div>
      </div>
    </div>
  );
};