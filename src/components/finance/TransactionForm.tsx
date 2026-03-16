import React, { useState } from 'react';
import { Species, TransactionType } from '../../types';
import { speciesList } from '../../utils/constants';
import { Calendar } from 'lucide-react';

interface TransactionFormProps {
  onSave: (transaction: any) => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSave }) => {
  // Stato per i campi del form
  const [newTrans, setNewTrans] = useState({
    desc: '',
    amount: 0,
    type: 'Entrata' as TransactionType,
    species: 'Maiali' as Species
  });
  
  // Stato per la data personalizzata
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD per l'input date
  );
  
  // Stato per scegliere se usare data personalizzata o oggi
  const [useCustomDate, setUseCustomDate] = useState(false);

  const handleSubmit = () => {
    if (newTrans.amount <= 0 || !newTrans.desc) {
      alert("Inserisci dati validi.");
      return;
    }
    
    // Determina la data da usare
    let dateToUse: string;
    
    if (useCustomDate && selectedDate) {
      // Converti da YYYY-MM-DD a formato italiano DD/MM/YYYY
      const [year, month, day] = selectedDate.split('-');
      dateToUse = `${day}/${month}/${year}`;
    } else {
      // Usa la data di oggi
      dateToUse = new Date().toLocaleDateString('it-IT');
    }
    
    const transactionWithDate = {
      ...newTrans,
      date: dateToUse
    };
    
    console.log("💰 TransactionForm - dati inviati:", transactionWithDate);
    
    onSave(transactionWithDate);
    
    // Reset del form
    setNewTrans({
      desc: '',
      amount: 0,
      type: 'Entrata',
      species: 'Maiali'
    });
    setUseCustomDate(false);
    setSelectedDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
      {/* Campi esistenti */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
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
      </div>
      
      {/* NUOVA SEZIONE: Selezione data */}
      <div className="border-t border-stone-200 pt-3 mt-1">
        <div className="flex items-center gap-2 mb-2">
          <Calendar size={16} className="text-stone-500" />
          <span className="text-xs font-bold text-stone-700">Data operazione</span>
        </div>
        
        <div className="flex flex-col md:flex-row gap-3 items-start md:items-center">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={!useCustomDate}
              onChange={() => setUseCustomDate(false)}
              className="text-emerald-600"
            />
            <span className="text-stone-700">Oggi ({new Date().toLocaleDateString('it-IT')})</span>
          </label>
          
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              checked={useCustomDate}
              onChange={() => setUseCustomDate(true)}
              className="text-emerald-600"
            />
            <span className="text-stone-700">Data personalizzata:</span>
          </label>
          
          {useCustomDate && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="p-2 bg-stone-50 rounded-lg text-sm font-bold border-none shadow-inner text-stone-800"
              max={new Date().toISOString().split('T')[0]} // Non permettere date future
            />
          )}
        </div>
        <p className="text-[8px] text-stone-500 mt-1">
          Puoi inserire movimenti passati selezionando una data personalizzata
        </p>
      </div>
      
      {/* Bottone Registra (ora a tutta larghezza) */}
      <button 
        onClick={handleSubmit} 
        className="w-full bg-emerald-950 text-white rounded-lg py-3 text-[10px] font-black uppercase shadow-lg mt-2 active:scale-95 transition-all"
      >
        Registra Movimento
      </button>
    </div>
  );
};
