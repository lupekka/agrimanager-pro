import React, { useState } from 'react';
import { Package } from 'lucide-react';
import { Product } from '../../types';

interface ProductFormProps {
  onSave: (product: any) => void;
  existingProducts?: Product[]; // ← AGGIUNTO
}

export const ProductForm: React.FC<ProductFormProps> = ({ onSave, existingProducts = [] }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 0,
    unit: 'kg'
  });
  const [error, setError] = useState(''); // ← AGGIUNTO

  const handleSubmit = () => {
    if (!newProduct.name || newProduct.quantity <= 0) {
      setError('Inserisci nome e quantità valida');
      return;
    }

    // Controlla duplicati
    const existing = existingProducts.find(p => 
      p.name.toLowerCase() === newProduct.name.toLowerCase()
    );

    if (existing) {
      if (window.confirm(
        `Il prodotto "${newProduct.name}" esiste già con quantità ${existing.quantity} ${existing.unit}.\n` +
        `Vuoi AGGIUNGERE ${newProduct.quantity} ${newProduct.unit} al totale?`
      )) {
        onSave({
          ...newProduct,
          existingId: existing.id,
          existingQuantity: existing.quantity
        });
      } else {
        return;
      }
    } else {
      onSave(newProduct);
    }

    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
    setError('');
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm border-t-4 border-emerald-600">
      <h3 className="text-[10px] font-black uppercase text-stone-700 mb-4 tracking-widest italic flex items-center gap-2">
        <Package size={14} className="text-emerald-600" /> Aggiornamento Magazzino
      </h3>
      
      {error && (
        <p className="text-red-500 text-xs mb-2">{error}</p>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input 
          placeholder="Articolo" 
          className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 uppercase" 
          value={newProduct.name} 
          onChange={(e) => {
            setNewProduct({...newProduct, name: e.target.value});
            setError('');
          }} 
        />
        <div className="flex gap-2">
          <input 
            type="number" 
            placeholder="QTY" 
            className="flex-1 p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800" 
            value={newProduct.quantity || ''} 
            onChange={(e) => {
              setNewProduct({...newProduct, quantity: Number(e.target.value)});
              setError('');
            }} 
          />
          <select 
            className="p-2 bg-stone-50 rounded-lg text-[10px] uppercase font-bold border-none shadow-inner text-stone-800" 
            value={newProduct.unit} 
            onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
          >
            <option>kg</option>
            <option>balle</option>
            <option>unità</option>
          </select>
        </div>
        <button 
          onClick={handleSubmit} 
          className="bg-emerald-600 text-white rounded-lg font-black uppercase text-[10px] py-2 shadow-md hover:bg-emerald-700 transition-colors"
        >
          Carica
        </button>
      </div>
    </div>
  );
};
