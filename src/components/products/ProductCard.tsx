import React from 'react';
import { MinusCircle, PlusCircle, Store, Trash2 } from 'lucide-react';
import { Product } from '../../types';

interface ProductCardProps {
  product: Product;
  onModify: (product: Product, amount: number, isAddition: boolean) => void;
  onPublish: (product: Product) => void;
  onDelete: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ 
  product, onModify, onPublish, onDelete 
}) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-md text-center group hover:border-emerald-500">
      <h4 className="font-black text-stone-800 uppercase text-[10px] mb-2">{product.name}</h4>
      <p className="text-3xl font-black text-emerald-600 mb-3 leading-none tracking-tighter italic">
        {product.quantity} <span className="text-[9px] uppercase opacity-50 italic font-bold text-stone-600">{product.unit}</span>
      </p>
      
      <div className="flex gap-1 mb-2">
        <button 
          onClick={() => onModify(product, 1, false)} 
          className="flex-1 bg-stone-100 p-2 rounded-lg text-stone-700 hover:bg-red-50 hover:text-red-600 border border-stone-100 shadow-sm"
        >
          <MinusCircle size={16} />
        </button>
        <button 
          onClick={() => onModify(product, 1, true)} 
          className="flex-1 bg-stone-100 p-2 rounded-lg text-stone-700 hover:bg-emerald-50 hover:text-emerald-600 border border-stone-100 shadow-sm"
        >
          <PlusCircle size={16} />
        </button>
      </div>
      
      <button 
        onClick={() => onPublish(product)} 
        className="w-full bg-amber-100 text-amber-900 font-black py-2 rounded-lg text-[8px] uppercase tracking-widest border border-amber-200 shadow-sm italic hover:bg-amber-200 flex items-center justify-center gap-1"
      >
        <Store size={12} />
        PUBBLICA
      </button>
      
      <button 
        onClick={() => {
          if (window.confirm(`❌ Eliminare il prodotto "${product.name}"?`)) {
            onDelete(product.id);
          }
        }} 
        className="text-stone-400 mt-2 hover:text-red-500 transition-colors"
        title="Elimina prodotto"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
};