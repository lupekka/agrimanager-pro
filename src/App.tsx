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

export default function App() {
  console.log("🚀 App montata");
  
  // AUTH (sempre sicuro)
  const { user, userRole, userName, loading } = useAuth();
  console.log("Auth state:", { user, userRole, userName, loading });
  
  // WEATHER (sicuro)
  const { weather, refreshWeather } = useWeather();
  
  // NOTIFICHE (sicuro)
  const { 
    oneSignalInitialized, 
    showNotificationPrompt, 
    requestPermission,
    setShowNotificationPrompt 
  } = useNotifications(user?.uid);

  // ⚠️ PARTE CRITICA: GESTIONE ANIMALS CON TRY/CATCH
  const [animals, setAnimals] = useState([]);
  const [animalsError, setAnimalsError] = useState(null);
  const [animalsLoading, setAnimalsLoading] = useState(true);

  useEffect(() => {
    async function loadAnimals() {
      try {
        console.log("🦊 Provo a caricare useAnimals...");
        const result = useAnimals();
        console.log("🦊 useAnimals eseguito:", result);
        
        setAnimals(result.animals || []);
        setAnimalsLoading(result.loading);
        setAnimalsError(null);
      } catch (error) {
        console.error("🔥 ERRORE GRAVE in useAnimals:", error);
        setAnimalsError(error.message || "Errore sconosciuto");
        setAnimalsLoading(false);
      }
    }
    
    if (user) {
      loadAnimals();
    }
  }, [user]);

  // Calcola trattamenti in scadenza per il badge (usando animals)
  const expiringCount = (animals || []).reduce((count, animal) => {
    const expiring = animal.treatments?.filter(t => 
      t.dataScadenza && !t.completed && 
      new Date(t.dataScadenza).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000
    ).length || 0;
    return count + expiring;
  }, 0);

  // MOSTRA ERRORI SE PRESENTI
  if (animalsError) {
    return (
      <div style={{
        minHeight: '100vh',
        background: '#fee',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: 'system-ui'
      }}>
        <div style={{
          background: 'white',
          padding: '30px',
          borderRadius: '20px',
          maxWidth: '500px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ color: '#dc2626', marginBottom: '20px' }}>
            ❌ Errore nel caricamento
          </h1>
          <p style={{ marginBottom: '15px', color: '#333' }}>
            Si è verificato un errore durante il caricamento dei dati:
          </p>
          <pre style={{
            background: '#f3f4f6',
            padding: '15px',
            borderRadius: '10px',
            overflow: 'auto',
            fontSize: '12px',
            color: '#dc2626'
          }}>
            {animalsError}
          </pre>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: '#059669',
              color: 'white',
              border: 'none',
              padding: '12px 24px',
              borderRadius: '10px',
              fontSize: '16px',
              fontWeight: 'bold',
              marginTop: '20px',
              cursor: 'pointer'
            }}
          >
            Ricarica pagina
          </button>
        </div>
      </div>
    );
  }

  if (loading || animalsLoading) return <LoadingSpinner />;

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

      <main className="flex-1 md:ml-64 p-4 md:p-8 pb-24">
        
        <div className="mb-6 flex justify-between items-center">
          <h2 className="text-xl font-black text-emerald-900 uppercase italic tracking-tight">
            {menuItems.find(i => i.id === activeTab)?.label}
          </h2>
          
          <div className="flex items-center gap-2">
            {!oneSignalInitialized && showNotificationPrompt && (
              <NotificationBell onRequestPermission={requestPermission} />
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

        {showAssistant && (
          <div className="animate-slide-down">
            <AIAssistant onClose={() => setShowAssistant(false)} />
          </div>
        )}

        <div className="animate-fade-in">
          <WeatherWidget 
            weather={weather} 
            onRefresh={refreshWeather} 
            showPrompt={showNotificationPrompt && weather.error ? true : false}
            onDismissPrompt={() => setShowNotificationPrompt(false)}
          />
        </div>

        {activeTab === 'dashboard' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <Dashboard onTabChange={setActiveTab} />
          </div>
        )}

        {activeTab === 'inventory' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <AnimalList />
          </div>
        )}

        {activeTab === 'health' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <HealthBook />
          </div>
        )}

        {activeTab === 'births' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <BirthRegistration />
          </div>
        )}

        {activeTab === 'finance' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <Finance />
          </div>
        )}

        {activeTab === 'products' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <ProductList />
          </div>
        )}

        {activeTab === 'tasks' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <TaskList />
          </div>
        )}

        {activeTab === 'dinastia' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <DynastyTree />
          </div>
        )}

        {activeTab === 'vet' && userRole === 'farmer' && (
          <div className="animate-fade-in">
            <VetAIAnalysis />
          </div>
        )}

        {activeTab === 'market' && (
          <div className="animate-fade-in">
            <MarketPlace userRole={userRole} />
          </div>
        )}
      </main>
    </div>
  );
}
