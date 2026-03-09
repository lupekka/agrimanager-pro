import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { LayoutDashboard } from 'lucide-react';

// Dashboard minimale scritta QUI DENTRO (così siamo sicuri)
const DashboardMinimal = ({ onTabChange }: { onTabChange: (tab: string) => void }) => {
  return (
    <div className="p-6 bg-white rounded-3xl shadow-sm">
      <h2 className="text-2xl font-black text-emerald-900">Dashboard TEST</h2>
      <p className="text-stone-600 mt-2">Se vedi questo, funziona!</p>
      <button 
        onClick={() => onTabChange('inventory')}
        className="mt-4 bg-emerald-600 text-white px-4 py-2 rounded-xl"
      >
        Vai a Inventory
      </button>
    </div>
  );
};

export default function App() {
  const { user, loading, userName } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginForm />;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard }
  ];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">
      <Sidebar 
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => signOut(auth)}
        userName={userName}
      />
      <MobileNav 
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="flex-1 md:ml-64 p-4">
        {activeTab === 'dashboard' && (
          <DashboardMinimal onTabChange={setActiveTab} />
        )}
      </main>
    </div>
  );
}
