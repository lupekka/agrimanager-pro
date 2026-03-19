import React, { useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';
import { weatherService } from '../../services/weatherService';

interface LocationSelectorProps {
  onLocationSelected: (lat: number, lon: number, city: string) => void;
  onClose: () => void;
}

export const LocationSelector: React.FC<LocationSelectorProps> = ({ onLocationSelected, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<Array<{ name: string; lat: number; lon: number; country: string; admin1?: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [useGPS, setUseGPS] = useState(true);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const locations = await weatherService.searchLocation(searchQuery);
      setResults(locations);
    } catch (error) {
      console.error('Errore ricerca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGPSRequest = async () => {
    setLoading(true);
    try {
      const location = await weatherService.getUserLocationByGPS();
      if (location) {
        onLocationSelected(location.lat, location.lon, location.city);
        weatherService.saveUserLocation(location.lat, location.lon, location.city);
      } else {
        alert('Impossibile ottenere la posizione GPS. Assicurati di aver dato i permessi.');
      }
    } catch (error) {
      console.error('Errore GPS:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
        
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-black text-emerald-900">Scegli località</h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X size={24} />
          </button>
        </div>

        {/* Opzione GPS */}
        <div className="mb-6">
          <button
            onClick={handleGPSRequest}
            disabled={loading}
            className="w-full bg-emerald-600 text-white py-4 rounded-xl font-black flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
          >
            <MapPin size={20} />
            Usa la mia posizione attuale
          </button>
          <p className="text-xs text-stone-500 text-center mt-2">
            Richiede il permesso di accesso alla posizione
          </p>
        </div>

        <div className="relative mb-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-stone-200"></div>
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-4 text-stone-500">oppure cerca</span>
          </div>
        </div>

        {/* Ricerca manuale */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Cerca città..."
              className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-sm border-none shadow-inner"
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="bg-stone-800 text-white px-4 py-3 rounded-xl"
            >
              <Search size={20} />
            </button>
          </div>

          {/* Risultati */}
          {results.length > 0 && (
            <div className="max-h-60 overflow-y-auto space-y-2">
              {results.map((loc, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    onLocationSelected(loc.lat, loc.lon, loc.name);
                    weatherService.saveUserLocation(loc.lat, loc.lon, loc.name);
                  }}
                  className="w-full text-left p-3 bg-stone-50 rounded-xl hover:bg-emerald-50 transition-colors"
                >
                  <p className="font-bold text-stone-800">{loc.name}</p>
                  <p className="text-xs text-stone-500">{loc.admin1 ? `${loc.admin1}, ` : ''}{loc.country}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
