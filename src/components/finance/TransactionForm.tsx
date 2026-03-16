import React, { useState } from 'react';
import { Species, TransactionType } from '../../types';
import { speciesList } from '../../utils/constants';

interface TransactionFormProps {
  onSave: (transaction: any) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSave }) => {
  const [newTrans, setNewTrans] = useState({
    desc: '',
    amount: 0,
    type: 'Entrata' as TransactionType,
    species: 'Maiali' as Species
  });

  const handleSubmit = () => {
    if (newTrans.amount <= 0 || !newTrans.desc) {
      alert("Inserisci dati validi.");
      return;
    }
    
    // AGGIUNGIAMO LA DATA AUTOMATICAMENTE
    const transactionWithDate = {
      ...newTrans,
      date: new Date().toLocaleDateString('it-IT')  // Formato "16/03/2026"
    };
    
    console.log("💰 TransactionForm - dati inviati:", transactionWithDate);
    
    onSave(transactionWithDate);
    
    setNewTrans({
      desc: '',
      amount: 0,
      type: 'Entrata',
      species: 'Maiali'
    });
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm grid grid-cols-1 md:grid-cols-5 gap-2">
      <input 
        placeholder="Causale" 
        className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 col-span-1 md:col-span-2 uppercase" 
        value={newTrans.desc} 
        onChange={(e) => setNewTrans({...newTrans, desc: e.target.value})} 
      />
      
      <div className="flex items-center bg-stone-50 rounded-xl px-4 shadow-inner">
        <span className="text-emerald-600 font-black text-xs mr-1 italic">€</span>
        <input 
          type="number" 
          placeholder="0" 
          className="w-full bg-transparent border-none font-black text-sm text-stone-800" 
          value={newTrans.amount || ''} 
          onChange={(e) => setNewTrans({...newTrans, amount: Number(e.target.value)})} 
        />
      </div>
      
      <select 
        className={`p-2 rounded-lg font-black text-[10px] border-none shadow-sm uppercase ${
          newTrans.type === 'Entrata' ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
        }`} 
        value={newTrans.type} 
        onChange={(e) => setNewTrans({...newTrans, type: e.target.value as TransactionType})}
      >
        <option value="Entrata">ENTRATA</option>
        <option value="Uscita">USCITA</option>
      </select>
      
      <select 
        className="p-2 bg-stone-50 rounded-lg text-[10px] font-black border-none uppercase shadow-inner text-stone-800" 
        value={newTrans.species} 
        onChange={(e) => setNewTrans({...newTrans, species: e.target.value as Species})}
      >
        {speciesList.map(s => <option key={s}>{s}</option>)}
      </select>
      
      <button 
        onClick={handleSubmit} 
        className="bg-emerald-950 text-white rounded-lg py-3 text-[10px] font-black uppercase col-span-full shadow-lg mt-1 active:scale-95 transition-all"
      >
        Registra Movimento
      </button>
    </div>
  );
};
