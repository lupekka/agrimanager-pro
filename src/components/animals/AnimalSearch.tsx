import React from 'react';
import { Search } from 'lucide-react';

interface AnimalSearchProps {
  value: string;
  onChange: (value: string) => void;
  resultsCount?: number;
  onResultClick?: () => void;
}

export const AnimalSearch: React.FC<AnimalSearchProps> = ({ 
  value, 
  onChange,
  resultsCount,
  onResultClick 
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm">
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
        <input
          type="text"
          placeholder="🔍 Cerca animale per codice o nome..."
          className="w-full p-3 pl-10 bg-stone-50 rounded-xl text-sm font-bold border-none shadow-inner text-stone-800"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      
      {value && resultsCount !== undefined && (
        <div className="mt-3 text-center">
          {resultsCount > 0 ? (
            <p className="text-xs text-emerald-600 font-bold">
              🔍 Trovati {resultsCount} animali
            </p>
          ) : (
            <p className="text-xs text-stone-500 italic">
              ❌ Nessun animale trovato
            </p>
          )}
        </div>
      )}
    </div>
  );
};