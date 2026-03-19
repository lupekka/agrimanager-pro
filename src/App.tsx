import React, { useState, useEffect } from 'react';
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

// Importa il tutorial
import { SimpleTutorial } from './components/onboarding/SimpleTutorial';

export default function App() {
  const { user, userRole, userName, loading } = useAuth();
  const { weather, refreshWeather } = useWeather(); // ← Non serve più, ma lo lasciamo per compatibilità
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications();
  const { animals } = useAnimals();
  
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAssistant, setShowAssistant] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // 🔥 LOGICA TUTORIAL - MOSTRA SOLO AI NUOVI UTENTI
  useEffect(() => {
    const tutorialVisto = localStorage.getItem('tutorialCompletato');
    
    if (user && !tutorialVisto) {
      const timer = setTimeout(() => {
        setShowTutorial(true);
      }, 800);
      
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleTutorialComplete = () => {
    setShowTutorial(false);
    localStorage.setItem('tutorialCompletato', 'true');
  };

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
            <NotificationBell />
            
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

        {/* Assistente AI */}
        {showAssistant && (
          <div className="animate-slide-down mb-6">
            <AIAssistant onClose={() => setShowAssistant(false)} />
          </div>
        )}

        {/* Weather widget - MODIFICATO: non servono più props */}
        <div className="animate-fade-in mb-6">
          <WeatherWidget />
        </div>

        {/* Dashboard */}
        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <Dashboard onTabChange={setActiveTab} />
          </div>
        )}

        {/* Inventory */}
        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <AnimalList />
          </div>
        )}

        {/* Health */}
        {activeTab === 'health' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <HealthBook />
          </div>
        )}

        {/* Births */}
        {activeTab === 'births' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <BirthRegistration />
          </div>
        )}

        {/* Finance */}
        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <Finance />
          </div>
        )}

        {/* Products */}
        {activeTab === 'products' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <ProductList />
          </div>
        )}

        {/* Tasks */}
        {activeTab === 'tasks' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <TaskList />
          </div>
        )}

        {/* Dinastia */}
        {activeTab === 'dinastia' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <DynastyTree />
          </div>
        )}

        {/* Vet */}
        {activeTab === 'vet' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <VetAIAnalysis />
          </div>
        )}

        {/* Market */}
        {activeTab === 'market' && (
          <div className="animate-fade-in">
            <MarketPlace userRole={userRole} />
          </div>
        )}
        
      </main>

      {/* Tutorial */}
      {showTutorial && (
        <SimpleTutorial 
          onComplete={handleTutorialComplete} 
          userName={userName} 
        />
      )}
    </div>
  );
}
