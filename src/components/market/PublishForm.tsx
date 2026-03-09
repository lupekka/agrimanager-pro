import React, { useState } from 'react';
import { Store } from 'lucide-react';
import { Product } from '../../types';

interface PublishFormProps {
  product: Product;
  onPublish: (price: number, phone: string) => Promise<void>;
  onCancel: () => void;
}

export const PublishForm: React.FC<PublishFormProps> = ({ product, onPublish, onCancel }) => {
  const [sellPrice, setSellPrice] = useState(5);
  const [sellPhone, setSellPhone] = useState('');

  const handleSubmit = async () => {
    if (sellPrice <= 0) {
      alert("Inserisci un prezzo valido");
      return;
    }
    await onPublish(sellPrice, sellPhone);
  };

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 p-6 rounded-2xl border-2 border-amber-300 shadow-xl mb-6 animate-scale-in">
      <h3 className="text-sm font-black text-amber-900 uppercase mb-4 flex items-center gap-2">
        <Store size={18} />
        Pubblica nel Market: {product.name}
      </h3>
      
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[9px] font-bold text-stone-600 uppercase block mb-1">
              Prezzo (€ per {product.unit})
            </label>
            <input 
              type="number" 
              className="w-full p-3 rounded-xl text-sm font-bold border-2 border-amber-200 bg-white text-stone-800"
              placeholder="0.00"
              value={sellPrice || ''} 
              onChange={(e) => setSellPrice(Number(e.target.value))} 
            />
          </div>
          
          <div>
            <label className="text-[9px] font-bold text-stone-600 uppercase block mb-1">
              WhatsApp
            </label>
            <input 
              className="w-full p-3 rounded-xl text-sm font-bold border-2 border-amber-200 bg-white text-stone-800"
              placeholder="329 123 4567"
              value={sellPhone} 
              onChange={(e) => setSellPhone(e.target.value)} 
            />
          </div>
        </div>
        
        <p className="text-[8px] text-stone-500 italic">
          Quantità disponibile: {product.quantity} {product.unit}
        </p>
        
        <div className="flex gap-2 pt-2">
          <button 
            onClick={handleSubmit} 
            className="flex-1 bg-amber-500 text-white font-black py-3 rounded-xl text-xs uppercase hover:bg-amber-600 transition-all"
          >
            Pubblica Annuncio
          </button>
          <button 
            onClick={onCancel} 
            className="px-6 bg-white text-stone-700 border-2 border-amber-200 rounded-xl text-xs font-black uppercase hover:bg-stone-50"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};