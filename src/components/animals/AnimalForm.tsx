import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Species } from '../../types';
import { speciesList } from '../../utils/constants';

interface AnimalFormProps {
  onSave: (animal: any) => void;
  existingCodici?: string[]; // per verificare duplicati
}

export const AnimalForm: React.FC<AnimalFormProps> = ({ onSave, existingCodici = [] }) => {
  const [newAnimal, setNewAnimal] = useState({
    codice: '',
    nome: '',
    species: 'Maiali' as Species,
    birthDate: '',
    sire: '',
    dam: '',
    notes: ''
  });

  const [codiceError, setCodiceError] = useState('');

  const handleCodiceChange = (value: string) => {
    setNewAnimal({...newAnimal, codice: value});
    
    if (existingCodici.includes(value)) {
      setCodiceError(`Il codice "${value}" esiste già`);
    } else {
      setCodiceError('');
    }
  };

  const handleSubmit = () => {
    if (!newAnimal.codice.trim()) {
      alert("Codice Capo richiesto.");
      return;
    }
    
    if (existingCodici.includes(newAnimal.codice)) {
      if (!confirm(`Il codice "${newAnimal.codice}" esiste già. Continuare?`)) {
        return;
      }
    }
    
    onSave(newAnimal);
    
    setNewAnimal({
      codice: '',
      nome: '',
      species: 'Maiali',
      birthDate: '',
      sire: '',
      dam: '',
      notes: ''
    });
    setCodiceError('');
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-[10px] font-black text-stone-700 uppercase flex items-center gap-1">
          <PlusCircle size={14} /> Registrazione Capi
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* CODICE (obbligatorio) */}
        <div className="col-span-2 md:col-span-1">
          <input 
            placeholder="Codice Capo *" 
            className={`p-2 w-full bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 ${
              codiceError ? 'border-2 border-red-300' : ''
            }`} 
            value={newAnimal.codice} 
            onChange={(e) => handleCodiceChange(e.target.value)} 
          />
          {codiceError && (
            <p className="text-[8px] text-red-500 mt-1">{codiceError}</p>
          )}
        </div>
        
        {/* NOME (opzionale) */}
        <input 
          placeholder="Nome (es. Gigio)" 
          className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 col-span-2 md:col-span-1" 
          value={newAnimal.nome} 
          onChange={(e) => setNewAnimal({...newAnimal, nome: e.target.value})} 
        />
        
        {/* SPECIE */}
        <select 
          className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 uppercase" 
          value={newAnimal.species} 
          onChange={(e) => setNewAnimal({...newAnimal, species: e.target.value as Species})}
        >
          {speciesList.map(s => <option key={s}>{s}</option>)}
        </select>
        
        {/* DATA NASCITA */}
        <input 
          type="date" 
          className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-emerald-700" 
          value={newAnimal.birthDate} 
          onChange={(e) => setNewAnimal({...newAnimal, birthDate: e.target.value})} 
        />
        
        {/* PADRE */}
        <input 
          placeholder="Padre (Codice)" 
          className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 uppercase" 
          value={newAnimal.sire} 
          onChange={(e) => setNewAnimal({...newAnimal, sire: e.target.value})} 
        />
        
        {/* MADRE */}
        <input 
          placeholder="Madre (Codice)" 
          className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 uppercase" 
          value={newAnimal.dam} 
          onChange={(e) => setNewAnimal({...newAnimal, dam: e.target.value})} 
        />
        
        {/* NOTE */}
        <input 
          placeholder="Note (Cure, Salute)" 
          className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner col-span-2 text-stone-800" 
          value={newAnimal.notes} 
          onChange={(e) => setNewAnimal({...newAnimal, notes: e.target.value})} 
        />
        
        {/* BOTTONE SALVA */}
        <button 
          onClick={handleSubmit} 
          className="bg-emerald-600 text-white font-bold rounded-lg py-2 text-[10px] uppercase col-span-full shadow-md active:scale-95"
          disabled={!newAnimal.codice.trim()}
        >
          Salva Capo
        </button>
      </div>
    </div>
  );
};