import React from 'react';
import { ShoppingBag } from 'lucide-react';
import { useMarketItems } from '../../hooks/useMarketItems';
import { MarketItem } from './MarketItem';
import { UserRole } from '../../types';

interface MarketPlaceProps {
  userRole: UserRole | null;
}

export const MarketPlace: React.FC<MarketPlaceProps> = ({ userRole }) => {
  const { marketItems, loading } = useMarketItems(); // AGGIUNGI loading

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-12 duration-1000">
      {/* Header */}
      <div className="bg-amber-500 p-8 rounded-[3rem] text-white shadow-xl relative overflow-hidden group">
        <ShoppingBag size={250} className="absolute -bottom-16 -right-16 opacity-10 rotate-12 group-hover:rotate-45 transition-transform duration-[10s]" />
        <div className="relative z-10 max-w-2xl text-center md:text-left">
          <h3 className="text-4xl font-black italic uppercase mb-2 leading-none tracking-tighter">
            Market Km 0
          </h3>
          <p className="text-amber-50 font-black text-xs italic tracking-[0.2em] uppercase leading-none opacity-90">
            Eccellenze locali
          </p>
        </div>
      </div>

      {/* Griglia prodotti */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-stone-500">Caricamento market...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {marketItems.map(item => (
            <MarketItem key={item.id} item={item} />
          ))}
        </div>
      )}

      {!loading && marketItems.length === 0 && (
        <div className="text-center py-12">
          <p className="text-stone-500 italic">Nessun prodotto in vendita al momento</p>
        </div>
      )}
    </div>
  );
};
