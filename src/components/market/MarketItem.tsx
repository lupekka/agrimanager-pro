import React from 'react';
import { ShoppingBag, MessageCircle, Mail } from 'lucide-react';
import { MarketItem as MarketItemType } from '../../types';

interface MarketItemProps {
  item: MarketItemType;
}

export const MarketItem: React.FC<MarketItemProps> = ({ item }) => {
  return (
    <div className="bg-white rounded-[2.5rem] border-2 border-stone-100 shadow-md overflow-hidden flex flex-col group hover:shadow-2xl hover:translate-y-[-5px] transition-all duration-700">
      <div className="h-44 bg-stone-50 flex items-center justify-center relative overflow-hidden group-hover:bg-amber-50 transition-colors duration-1000">
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur px-4 py-2 rounded-2xl font-black text-xl text-emerald-600 shadow-lg border-2 border-emerald-50 italic leading-none">
          €{item.price.toFixed(2)}
        </div>
        <ShoppingBag size={56} className="text-stone-200 opacity-50 group-hover:scale-125 transition-all duration-1000" />
      </div>
      
      <div className="p-6 flex flex-col flex-1 border-t border-stone-50">
        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1 italic leading-none">
          {item.sellerName}
        </p>
        <h4 className="text-2xl font-black text-stone-800 tracking-tighter mb-6 uppercase group-hover:text-amber-600 transition-colors duration-500 leading-none">
          {item.name}
        </h4>
        
        <div className="flex justify-between items-center mb-6 bg-stone-50 p-4 rounded-2xl border-2 border-white shadow-inner">
          <span className="text-[10px] font-black text-stone-600 uppercase italic tracking-widest">DISPONIBILI</span>
          <span className="font-black text-stone-800 text-lg uppercase tracking-tight leading-none">
            {item.quantity} <span className="text-xs text-stone-500 font-bold uppercase">{item.unit}</span>
          </span>
        </div>
        
        {item.contactPhone ? (
          <a 
            href={`https://wa.me/39${item.contactPhone}?text=Salve ${item.sellerName}, vorrei acquistare ${item.name} via AgriManager.`} 
            target="_blank" 
            rel="noreferrer" 
            className="w-full bg-[#25D366] text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-[0_15px_40px_rgba(37,211,102,0.3)] flex items-center justify-center gap-4 hover:bg-[#1da851] hover:scale-105 transition-all active:scale-95 shadow-xl shadow-emerald-100 border-b-8 border-[#1DA851]"
          >
            <MessageCircle size={24} /> WhatsApp
          </a>
        ) : (
          <a 
            href={`mailto:${item.contactEmail}`} 
            className="w-full bg-blue-600 text-white py-6 rounded-3xl font-black text-sm uppercase tracking-[0.2em] shadow-2xl shadow-blue-200 flex items-center justify-center gap-4 hover:scale-105 transition-all active:scale-95 border-b-8 border-blue-800 shadow-xl"
          >
            <Mail size={24} /> Invia Email
          </a>
        )}
      </div>
    </div>
  );
};