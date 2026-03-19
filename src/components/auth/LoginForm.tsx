import React, { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const LoginForm: React.FC = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  // NUOVI CAMPI
  const [username, setUsername] = useState('');
  const [farmName, setFarmName] = useState('');
  const [location, setLocation] = useState('');
  const [regRole, setRegRole] = useState<'farmer' | 'consumer'>('farmer');
  
  const { login, register } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isRegistering) {
        await register(email, password, regRole, username, farmName, location);
        alert("Registrazione completata! Ora puoi accedere.");
      } else {
        await login(email, password);
      }
    } catch (error: any) {
      alert(error.message || "Credenziali errate.");
    }
  };

  return (
    <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
      <div className="bg-white p-6 rounded-3xl shadow-xl w-full max-w-md border">
        <h1 className="text-2xl font-black text-center mb-6 text-emerald-900 italic uppercase">
          AgriManager Pro
        </h1>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {isRegistering && (
            <div className="space-y-4 bg-stone-50 p-4 rounded-2xl border">
              {/* Username (obbligatorio) */}
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">
                  Username *
                </label>
                <input 
                  placeholder="es. Marco123" 
                  className="w-full p-3 rounded-xl border text-sm text-stone-800" 
                  value={username} 
                  onChange={e => setUsername(e.target.value)} 
                  required 
                />
              </div>
              
              {/* Nome Azienda (obbligatorio) */}
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">
                  Nome Azienda *
                </label>
                <input 
                  placeholder="es. Fattoria Rossi" 
                  className="w-full p-3 rounded-xl border text-sm text-stone-800" 
                  value={farmName} 
                  onChange={e => setFarmName(e.target.value)} 
                  required 
                />
              </div>
              
              {/* Località (obbligatoria) */}
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">
                  Località (per il meteo) *
                </label>
                <input 
                  placeholder="es. Milano" 
                  className="w-full p-3 rounded-xl border text-sm text-stone-800" 
                  value={location} 
                  onChange={e => setLocation(e.target.value)} 
                  required 
                />
              </div>
              
              {/* Ruolo */}
              <div>
                <label className="text-xs font-bold text-stone-600 mb-1 block">
                  Tipo account *
                </label>
                <div className="flex gap-2">
                  <button 
                    type="button" 
                    onClick={() => setRegRole('farmer')} 
                    className={`flex-1 p-3 rounded-xl text-xs font-bold border transition-all ${
                      regRole === 'farmer' 
                        ? 'bg-emerald-600 text-white shadow-md' 
                        : 'bg-white text-stone-800'
                    }`}
                  >
                    AZIENDA
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setRegRole('consumer')} 
                    className={`flex-1 p-3 rounded-xl text-xs font-bold border transition-all ${
                      regRole === 'consumer' 
                        ? 'bg-amber-500 text-white shadow-md' 
                        : 'bg-white text-stone-800'
                    }`}
                  >
                    CLIENTE
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <input 
            type="email" 
            placeholder="Email" 
            className="w-full p-3 rounded-xl border text-sm text-stone-800" 
            value={email} 
            onChange={e => setEmail(e.target.value)} 
            required 
          />
          
          <input 
            type="password" 
            placeholder="Password" 
            className="w-full p-3 rounded-xl border text-sm text-stone-800" 
            value={password} 
            onChange={e => setPassword(e.target.value)} 
            required 
          />
          
          <button 
            type="submit" 
            className="w-full bg-emerald-700 text-white py-3 rounded-xl font-bold uppercase shadow-lg active:scale-95"
          >
            {isRegistering ? "Crea Account" : "Entra"}
          </button>
          
          <button 
            type="button" 
            onClick={() => setIsRegistering(!isRegistering)} 
            className="w-full text-xs font-bold text-stone-800 uppercase mt-4 text-center underline"
          >
            {isRegistering 
              ? "Hai già un account? Accedi" 
              : "Non hai un account? Registrati"}
          </button>
        </form>
      </div>
    </div>
  );
};
