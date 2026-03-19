import React, { useState } from 'react';
import { Activity, MapPin, X, Settings, Search } from 'lucide-react';
import { WeatherData } from '../../types';
import { useWeather } from '../../hooks/useWeather';

interface WeatherWidgetProps {
  weather: WeatherData;
  onRefresh: (useGPS?: boolean, customLocation?: any) => void;
}

// Componente per la ricerca manuale della località
const LocationSearchModal: React.FC<{
  onClose: () => void;
  onSelect: (lat: number, lon: number, city: string) => void;
  searchLocation: (query: string) => Promise<any[]>;
}> = ({ onClose, onSelect, searchLocation }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const locations = await searchLocation(query);
      setResults(locations);
    } catch (error) {
      console.error('Errore ricerca:', error);
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

        {/* Ricerca manuale */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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
                  onClick={() => onSelect(loc.lat, loc.lon, loc.name)}
                  className="w-full text-left p-3 bg-stone-50 rounded-xl hover:bg-emerald-50 transition-colors"
                >
                  <p className="font-bold text-stone-800">{loc.name}</p>
                  <p className="text-xs text-stone-500">{loc.country}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  weather, 
  onRefresh 
}) => {
  const [showLocationSelector, setShowLocationSelector] = useState(false);
  const [useGPS, setUseGPS] = useState(true);
  const { searchLocation, toggleGPS } = useWeather();

  const handleGPSRequest = async () => {
    setUseGPS(true);
    toggleGPS(true);
    await onRefresh(true);
  };

  const handleLocationSelected = async (lat: number, lon: number, city: string) => {
    setShowLocationSelector(false);
    setUseGPS(false);
    toggleGPS(false);
    await onRefresh(false, { lat, lon, city });
  };

  // Caricamento
  if (weather.loading) {
    return (
      <div className="glass-effect px-5 py-3 rounded-2xl flex items-center gap-3 min-w-[200px] mb-4">
        <Activity className="animate-spin text-stone-400" size={20} />
        <span className="text-xs text-stone-500">Caricamento meteo...</span>
      </div>
    );
  }

  // Widget normale
  return (
    <>
      <div className="glass-effect px-5 py-3 rounded-2xl flex items-center gap-3 min-w-[200px] mb-4 relative">
        <div className="text-3xl">{weather.icon}</div>
        <div className="flex-1">
          <p className="text-xs font-black text-stone-800">
            {weather.temp}°C • {weather.desc}
          </p>
          <div className="flex items-center gap-1">
            <MapPin size={10} className="text-stone-400" />
            <p className="text-[8px] text-stone-600 uppercase tracking-widest">
              {weather.location}
              {!useGPS && <span className="text-emerald-500 ml-1">(manuale)</span>}
            </p>
          </div>
          <p className="text-[7px] text-emerald-700 font-bold uppercase mt-0.5">
            {weather.advice}
          </p>
        </div>
        
        {/* Pulsanti di controllo */}
        <div className="flex gap-1">
          <button
            onClick={handleGPSRequest}
            className={`p-2 rounded-full transition-colors ${
              useGPS 
                ? 'bg-emerald-100 text-emerald-600' 
                : 'hover:bg-stone-100 text-stone-500'
            }`}
            title="Usa GPS"
          >
            <MapPin size={16} />
          </button>
          <button
            onClick={() => setShowLocationSelector(true)}
            className="p-2 hover:bg-stone-100 rounded-full text-stone-500"
            title="Cerca località"
          >
            <Settings size={16} />
          </button>
          <button
            onClick={() => onRefresh(useGPS)}
            className="p-2 hover:bg-stone-100 rounded-full text-stone-500"
            title="Aggiorna"
          >
            <Activity size={16} />
          </button>
        </div>
      </div>

      {/* Modal di ricerca */}
      {showLocationSelector && (
        <LocationSearchModal
          onClose={() => setShowLocationSelector(false)}
          onSelect={handleLocationSelected}
          searchLocation={searchLocation}
        />
      )}
    </>
  );
};
