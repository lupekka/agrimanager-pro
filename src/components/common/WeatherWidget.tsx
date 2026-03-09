import React from 'react';
import { Activity, MapPin, X } from 'lucide-react';
import { WeatherData } from '../../types';

interface WeatherWidgetProps {
  weather: WeatherData;
  onRefresh: () => void;
  showPrompt?: boolean;
  onDismissPrompt?: () => void;
}

export const WeatherWidget: React.FC<WeatherWidgetProps> = ({ 
  weather, 
  onRefresh,
  showPrompt = false,
  onDismissPrompt
}) => {
  // Se c'è un errore e mostriamo il prompt
  if (showPrompt && weather.error && !weather.loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 animate-fade-in">
        <div className="flex items-start gap-3">
          <div className="bg-blue-500 text-white p-2 rounded-full">
            <MapPin size={16} />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-black text-blue-900 mb-1">
              Meteo personalizzato per la tua azienda
            </h4>
            <p className="text-[10px] text-blue-800 mb-2">
              Per darti previsioni precise sulla tua posizione, 
              abbiamo bisogno di conoscere la tua zona.
            </p>
            <div className="flex gap-2">
              <button
                onClick={onRefresh}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-[9px] font-black uppercase hover:bg-blue-700"
              >
                Attiva meteo
              </button>
              {onDismissPrompt && (
                <button
                  onClick={onDismissPrompt}
                  className="bg-white text-blue-600 px-4 py-2 rounded-lg text-[9px] font-black uppercase border border-blue-200 hover:bg-blue-50"
                >
                  Non ora
                </button>
              )}
            </div>
          </div>
          {onDismissPrompt && (
            <button onClick={onDismissPrompt} className="text-blue-400 hover:text-blue-600">
              <X size={16} />
            </button>
          )}
        </div>
      </div>
    );
  }

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
    <div className="glass-effect px-5 py-3 rounded-2xl flex items-center gap-3 min-w-[200px] mb-4">
      <div className="text-3xl">{weather.icon}</div>
      <div>
        <p className="text-xs font-black text-stone-800">
          {weather.temp}°C • {weather.desc}
        </p>
        <p className="text-[8px] text-stone-600 uppercase tracking-widest">
          {weather.location}
        </p>
        <p className="text-[7px] text-emerald-700 font-bold uppercase mt-0.5">
          {weather.advice}
        </p>
      </div>
    </div>
  );
};