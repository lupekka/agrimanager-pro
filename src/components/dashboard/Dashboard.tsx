import React, { useState } from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { useTransactions } from '../../hooks/useTransactions';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../hooks/useNotifications';
import { KPICards } from './KPICards';
import { ExpiringTreatments } from './ExpiringTreatments';
import { Calendar } from 'lucide-react';

interface DashboardProps {
  onTabChange: (tab: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onTabChange }) => {
  const { animals } = useAnimals();
  const { transactions } = useTransactions();
  const { tasks } = useTasks();
  const { checkExpiringTreatments } = useNotifications();

  const totalIncome = transactions.filter(t => t.type === 'Entrata').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Uscita').reduce((acc, t) => acc + t.amount, 0);
  const pendingTasks = tasks.filter(t => !t.done).length;

  const expiringTreatments = checkExpiringTreatments(animals);
  const expiredTreatments = expiringTreatments.filter(t => t.isExpired);
  const upcomingTreatments = expiringTreatments.filter(t => !t.isExpired && t.daysLeft <= 7);

  // 📅 CALCOLO TRATTAMENTI IN ARRIVO
  const trattamentiOggi = expiringTreatments.filter(t => t.daysLeft === 0 && !t.isExpired);
  const trattamentiDomani = expiringTreatments.filter(t => t.daysLeft === 1);
  const trattamentiSettimana = expiringTreatments.filter(t => t.daysLeft > 0 && t.daysLeft <= 7 && !t.isExpired);
  
  const tuttiProssimi = [...expiringTreatments]
    .filter(t => !t.isExpired && t.daysLeft >= 0)
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 🔝 HEADER CON DATA E BENVENUTO */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-xs font-black text-stone-600 uppercase tracking-widest">
            {new Date().toLocaleDateString('it-IT', { 
              weekday: 'long', 
              day: 'numeric', 
              month: 'long',
              year: 'numeric' 
            }).toUpperCase()}
          </h3>
          <h2 className="text-2xl font-black text-emerald-900 mt-1">
            Bentornato, <span className="text-emerald-600">Marco</span> 👋
          </h2>
        </div>
      </div>

      {/* 📊 KPI IN ALTO (sempre visibili) */}
      <KPICards
        totalAnimals={animals.length}
        pendingTasks={pendingTasks}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        onInventoryClick={() => onTabChange('inventory')}
        onTasksClick={() => onTabChange('tasks')}
      />

      {/* 📅 RIEPILOGO RAPIDO SCADENZE */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 text-center">
          <p className="text-xs text-amber-600 font-black">OGGI</p>
          <p className="text-3xl font-black text-amber-700">{trattamentiOggi.length}</p>
        </div>
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 text-center">
          <p className="text-xs text-blue-600 font-black">DOMANI</p>
          <p className="text-3xl font-black text-blue-700">{trattamentiDomani.length}</p>
        </div>
        <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-200 text-center">
          <p className="text-xs text-emerald-600 font-black">SETTIMANA</p>
          <p className="text-3xl font-black text-emerald-700">{trattamentiSettimana.length}</p>
        </div>
      </div>

      {/* 📋 LISTA PROSSIMI TRATTAMENTI */}
      {tuttiProssimi.length > 0 && (
        <div className="bg-white p-5 rounded-3xl border-2 border-emerald-100 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-emerald-600" />
            <h3 className="text-sm font-black text-emerald-900 uppercase">Prossimi trattamenti</h3>
          </div>
          
          <div className="space-y-2">
            {tuttiProssimi.map(t => (
              <div 
                key={t.treatment.id} 
                className={`flex items-center justify-between p-3 rounded-xl ${
                  t.daysLeft === 0 
                    ? 'bg-amber-50 border-l-4 border-l-amber-500' 
                    : t.daysLeft === 1
                    ? 'bg-blue-50 border-l-4 border-l-blue-400'
                    : 'bg-stone-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black ${
                    t.species === 'Maiali' ? 'bg-pink-100 text-pink-600' :
                    t.species === 'Mucche' ? 'bg-amber-100 text-amber-600' :
                    t.species === 'Cavalli' ? 'bg-purple-100 text-purple-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {t.species === 'Maiali' ? '🐷' :
                     t.species === 'Mucche' ? '🐮' :
                     t.species === 'Cavalli' ? '🐴' : '🐔'}
                  </div>
                  <div>
                    <p className="font-black text-stone-800">{t.animalName}</p>
                    <p className="text-xs text-stone-600">
                      {t.treatment.tipo} • {t.treatment.note || 'Nessuna nota'}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-xs font-black px-2 py-1 rounded-full ${
                    t.daysLeft === 0 ? 'bg-amber-200 text-amber-800' :
                    t.daysLeft === 1 ? 'bg-blue-200 text-blue-800' :
                    'bg-stone-200 text-stone-800'
                  }`}>
                    {t.daysLeft === 0 ? 'OGGI' : `Tra ${t.daysLeft} giorni`}
                  </span>
                </div>
              </div>
            ))}
          </div>
          
          <button 
            onClick={() => onTabChange('health')}
            className="w-full mt-3 text-xs text-emerald-600 font-black uppercase hover:underline"
          >
            Vedi tutti i trattamenti →
          </button>
        </div>
      )}
    </div>
  );
};
