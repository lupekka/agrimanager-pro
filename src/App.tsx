import React, { useState } from 'react';
import { 
  LayoutDashboard, PawPrint, Syringe, Baby, Wallet, Package,
  ListChecks, Network, Stethoscope, Store, ShoppingBag, Bot 
} from 'lucide-react';
import { signOut } from 'firebase/auth';
import { auth } from './services/firebase';
import { useAuth } from './hooks/useAuth';
import { useWeather } from './hooks/useWeather';
import { useNotifications } from './hooks/useNotifications';
import { useAnimals } from './hooks/useAnimals';

// Importa TUTTI i componenti
import { 
  Sidebar, 
  MobileNav, 
  WeatherWidget,
  NotificationBell,
  LoadingSpinner,
  LoginForm,
  Dashboard,
  AnimalList,
  HealthBook,
  BirthRegistration,
  Finance,
  ProductList,
  TaskList,
  DynastyTree,
  VetAIAnalysis,
  MarketPlace,
  AIAssistant
} from './components';

export default function App() {
  const { user, userRole, userName, loading, logout } = useAuth();
  const { weather, refreshWeather } = useWeather();
  const { 
    oneSignalInitialized, 
    showNotificationPrompt, 
    requestPermission,
    setShowNotificationPrompt 
  } = useNotifications(user?.uid);
  const { animals } = useAnimals();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAssistant, setShowAssistant] = useState(false);

  // Calcola trattamenti in scadenza per il badge
  const expiringCount = animals.reduce((count, animal) => {
    const expiring = animal.treatments?.filter(t => 
      t.dataScadenza && !t.completed && 
      new Date(t.dataScadenza).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000
    ).length || 0;
    return count + expiring;
  }, 0);

  if (loading) return <LoadingSpinner />;

  if (!user) return <LoginForm />;

  const menuItems = userRole === 'farmer' 
    ? [
        { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { id: 'inventory', label: 'Capi', icon: PawPrint },
        { id: 'health', label: 'Libretto Sanitario', icon: Syringe },
        { id: 'births', label: 'Parti', icon: Baby },
        { id: 'finance', label: 'Bilancio', icon: Wallet },
        { id: 'products', label: 'Magazzino', icon: Package },
        { id: 'tasks', label: 'Agenda', icon: ListChecks },
        { id: 'dinastia', label: 'Albero Genealogico', icon: Network },
        { id: 'vet', label: 'Vet IA', icon: Stethoscope },
        { id: 'market', label: 'Market', icon: Store }
      ]
    : [{ id: 'market', label: 'Market', icon: ShoppingBag }];

  return (
    <div className="min-h-screen bg-[#F8F9FA] flex flex-col md:flex-row relative text-stone-800 font-sans overflow-x-hidden">
      
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
<main className="flex-1 md:ml-64 p-4 md:p-8 pb-24 pt-safe pb-safe">
        
        {/* Header */}
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-black text-emerald-900 uppercase italic tracking-tight">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          
          <div className="flex items-center gap-2">
           {!oneSignalInitialized && showNotificationPrompt && (
  <NotificationBell />
)}
            
            {userRole === 'farmer' && (
              <button 
                onClick={() => setShowAssistant(!showAssistant)} 
                className="bg-blue-600 text-white p-2 rounded-full shadow-md animate-bounce"
              >
                <Bot size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Assistente AI con animazione */}
        {showAssistant && (
          <div className="animate-slide-down">
            <AIAssistant onClose={() => setShowAssistant(false)} />
          </div>
        )}

        {/* Weather widget con animazione */}
        <div className="animate-fade-in">
          <WeatherWidget 
            weather={weather} 
            onRefresh={refreshWeather} 
            showPrompt={showNotificationPrompt && weather.error ? true : false}
            onDismissPrompt={() => setShowNotificationPrompt(false)}
          />
        </div>

        {/* Dashboard con animazione */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <Dashboard onTabChange={setActiveTab} />
          </div>
        )}

        {/* Inventory con animazione */}
        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <AnimalList />
          </div>
        )}

        {/* Health con animazione */}
        {activeTab === 'health' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <HealthBook />
          </div>
        )}

        {/* Births con animazione */}
        {activeTab === 'births' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <BirthRegistration />
          </div>
        )}

        {/* Finance con animazione */}
        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <Finance />
          </div>
        )}

        {/* Products con animazione */}
        {activeTab === 'products' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <ProductList />
          </div>
        )}

        {/* Tasks con animazione */}
        {activeTab === 'tasks' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <TaskList />
          </div>
        )}

        {/* Dinastia con animazione */}
        {activeTab === 'dinastia' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <DynastyTree />
          </div>
        )}

        {/* Vet con animazione */}
        {activeTab === 'vet' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <VetAIAnalysis />
          </div>
        )}

        {/* Market con animazione - ECCO IL TUO PEZZO FINALE */}
        {activeTab === 'market' && (
          <div className="animate-fade-in">
            <MarketPlace userRole={userRole} />
          </div>
        )}
        
      </main>
    </div>
  );
}
