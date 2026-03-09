import React from 'react';
import { signOut } from 'firebase/auth';  // ← AGGIUNTO!
import { auth } from './services/firebase'; // ← AGGIUNTO!
import { useAuth } from './hooks/useAuth';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { LoginForm } from './components/auth/LoginForm';

export default function App() {
  console.log("🚀 App renderizzata");
  
  const { user, loading } = useAuth();
  console.log("Auth state:", { user, loading });

  if (loading) {
    console.log("⏳ Mostro loading spinner");
    return <LoadingSpinner />;
  }

  if (!user) {
    console.log("🔐 Mostro login form");
    return <LoginForm />;
  }

  console.log("✅ Utente loggato, mostro dashboard minimal");
  
  // Versione minimalissima per test
  return (
    <div style={{ padding: '20px' }}>
      <h1>AgriManager Pro - TEST</h1>
      <p>Utente: {user.email}</p>
      <p>Se vedi questo, React funziona!</p>
      <button onClick={() => signOut(auth)}>Logout</button>
    </div>
  );
}
