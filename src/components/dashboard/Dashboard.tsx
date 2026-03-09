import React from 'react';
import { useAnimals } from '../../hooks/useAnimals';
import { useTransactions } from '../../hooks/useTransactions';
import { useTasks } from '../../hooks/useTasks';
import { useNotifications } from '../../hooks/useNotifications';
import { KPICards } from './KPICards';
import { ExpiringTreatments } from './ExpiringTreatments';

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

  return (
    <div className="space-y-6">
      {/* Header con benvenuto */}
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
            Bentornato 👋
          </h2>
        </div>
      </div>

      {/* Scadenziario */}
      <ExpiringTreatments
        expired={expiredTreatments}
        upcoming={upcomingTreatments}
        onViewAll={() => onTabChange('health')}
      />

      {/* KPI */}
      <KPICards
        totalAnimals={animals.length}
        pendingTasks={pendingTasks}
        totalIncome={totalIncome}
        totalExpense={totalExpense}
        onInventoryClick={() => onTabChange('inventory')}
        onTasksClick={() => onTabChange('tasks')}
      />
    </div>
  );
};