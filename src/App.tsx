import React, { useState } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuth } from './hooks/useAuth';
import { useWeather } from './hooks/useWeather';
import { useAnimals } from './hooks/useAnimals';        // ← NUOVO
import { useProducts } from './hooks/useProducts';      // ← NUOVO
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { LoginForm } from './components/auth/LoginForm';
import { Sidebar } from './components/common/Sidebar';
import { MobileNav } from './components/common/MobileNav';
import { WeatherWidget } from './components/common/WeatherWidget';
import { Dashboard } from './components/dashboard/Dashboard';              // ← NUOVO
import { AnimalList } from './components/animals/AnimalList';              // ← NUOVO
import { ProductList } from './components/products/ProductList';           // ← NUOVO
import { LayoutDashboard, PawPrint, Package } from 'lucide-react';

export default function App() {
  console.log("🚀 App renderizzata");
  
  const { user, loading, userName } = useAuth();
  const { weather, refreshWeather } = useWeather();
  const { animals } = useAnimals();                    // ← NUOVO
  const { products } = useProducts();                   // ← NUOVO
  const [activeTab, setActiveTab] = useState('dashboard');

  console.log("📊 animals:", animals?.length);
  console.log("📦 products:", products?.length);

  if (loading) return <LoadingSpinner />;
  if (!user) return <LoginForm />;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inventory', label: 'Capi', icon: PawPrint },      // ← NUOVO
    { id: 'products', label: 'Magazzino', icon: Package }    // ← NUOVO
  ];

  // Calcola expiringCount per il badge
  const expiringCount = (animals || []).reduce((count, animal) => {
    const expiring = animal.treatments?.filter(t => 
      t.dataScadenza && !t.completed && 
      new Date(t.dataScadenza).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000
    ).length || 0;
    return count + expiring;
  }, 0);

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row">
      <Sidebar 
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onLogout={() => signOut(auth)}
        userName={userName}
        expiringCount={expiringCount}
      />
      <MobileNav 
        menuItems={menuItems}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <main className="flex-1 md:ml-64 p-4">
        <WeatherWidget 
          weather={weather} 
          onRefresh={refreshWeather} 
        />

        {activeTab === 'dashboard' && (
          <Dashboard onTabChange={setActiveTab} />
        )}

        {activeTab === 'inventory' && (
          <AnimalList />
        )}

        {activeTab === 'products' && (
          <ProductList />
        )}
      </main>
    </div>
  );
}
