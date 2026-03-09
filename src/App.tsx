import React, { useState } from 'react';  // ← AGGIUNGI useState
import { signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { LayoutDashboard } from 'lucide-react';

export default function App() {
  console.log("🚀 App renderizzata");
  
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
        <h1>Test Sidebar + MobileNav funziona!</h1>
      </main>
    </div>
  );
}
