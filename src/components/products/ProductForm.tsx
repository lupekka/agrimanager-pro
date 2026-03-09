import React, { useState } from 'react';
import { Package } from 'lucide-react';

interface ProductFormProps {
  onSave: (product: any) => void;
}

export const ProductForm: React.FC<ProductFormProps> = ({ onSave }) => {
  const [newProduct, setNewProduct] = useState({
    name: '',
    quantity: 0,
    unit: 'kg'
  });

  const handleSubmit = () => {
    if (!newProduct.name || newProduct.quantity <= 0) return;
    onSave(newProduct);
    setNewProduct({ name: '', quantity: 0, unit: 'kg' });
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm border-t-4 border-emerald-600">
      <h3 className="text-[10px] font-black uppercase text-stone-700 mb-4 tracking-widest italic flex items-center gap-2">
        <Package size={14} className="text-emerald-600" /> Aggiornamento Magazzino
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
        <input 
          placeholder="Articolo" 
          className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 uppercase" 
          value={newProduct.name} 
          onChange={(e) => setNewProduct({...newProduct, name: e.target.value})} 
        />
        <div className="flex gap-2">
          <input 
            type="number" 
            placeholder="QTY" 
            className="flex-1 p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800" 
            value={newProduct.quantity || ''} 
            onChange={(e) => setNewProduct({...newProduct, quantity: Number(e.target.value)})} 
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
          className="bg-emerald-600 text-white rounded-lg font-black uppercase text-[10px] py-2 shadow-md"
        >
          Carica
        </button>
      </div>
    </div>
  );
};