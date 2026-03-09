import React from 'react';
import { CalendarClock, AlertCircle } from 'lucide-react';
import { ExpiringTreatment } from '../../types';

interface ExpiringTreatmentsProps {
  expired: ExpiringTreatment[];
  upcoming: ExpiringTreatment[];
  onViewAll: () => void;
}

export const ExpiringTreatments: React.FC<ExpiringTreatmentsProps> = ({ 
  expired, upcoming, onViewAll 
}) => {
  if (expired.length === 0 && upcoming.length === 0) return null;

  return (
    <div className="bg-white p-5 rounded-3xl border-2 border-amber-200 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <CalendarClock size={20} className="text-amber-600" />
        <h3 className="text-sm font-black text-emerald-900 uppercase">Scadenziario Sanitario</h3>
      </div>
      
      {/* Trattamenti Scaduti */}
      {expired.length > 0 && (
        <div className="mb-4">
          <p className="text-xs font-bold text-red-600 mb-2 flex items-center gap-1">
            <AlertCircle size={14} /> SCADUTI
          </p>
          <div className="space-y-2">
            {expired.slice(0, 3).map(t => (
              <div key={t.treatment.id} className="bg-red-50 p-3 rounded-xl border-l-4 border-l-red-500">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-stone-800">{t.animalName} • {t.species}</p>
                    <p className="text-xs text-stone-600">{t.treatment.tipo}</p>
                    <p className="text-[8px] text-stone-500 mt-1">
                      Scadenza: {new Date(t.treatment.dataScadenza!).toLocaleDateString('it-IT')}
                    </p>
                  </div>
                  <span className="text-red-600 font-black text-xs bg-red-100 px-2 py-1 rounded-full">
                    SCADUTO
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Trattamenti in Scadenza */}
      {upcoming.length > 0 && (
        <div>
          <p className="text-xs font-bold text-amber-600 mb-2">IN SCADENZA (prossimi 7 giorni)</p>
          <div className="space-y-2">
            {upcoming.slice(0, 3).map(t => (
              <div key={t.treatment.id} className="bg-amber-50 p-3 rounded-xl border-l-4 border-l-amber-400">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-bold text-stone-800">{t.animalName} • {t.species}</p>
                    <p className="text-xs text-stone-600">{t.treatment.tipo}</p>
                  </div>
                  <span className="text-amber-600 font-black text-xs bg-amber-100 px-2 py-1 rounded-full">
                    Tra {t.daysLeft} giorni
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <button 
        onClick={onViewAll}
        className="w-full mt-3 text-xs text-emerald-600 font-black uppercase hover:underline"
      >
        Vedi tutti i trattamenti →
      </button>
    </div>
  );
};