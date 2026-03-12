import React, { useState } from 'react';
import { PlusCircle } from 'lucide-react';
import { Species } from '../../types';
import { speciesList } from '../../utils/constants';

interface AnimalFormProps {
  onSave: (animal: any) => void;
  existingMicrochip?: string[]; // ← RINOMINATO
}

export const AnimalForm: React.FC<AnimalFormProps> = ({ onSave, existingMicrochip = [] }) => {
  const [newAnimal, setNewAnimal] = useState({
    microchip: '',            // ← CAMBIATO da "codice"
    nome: '',
    species: 'Maiali' as Species,
    birthDate: '',
    sire: '',
    dam: '',
    notes: ''
  });

  const [microchipError, setMicrochipError] = useState(''); // ← RINOMINATO

  const handleMicrochipChange = (value: string) => { // ← RINOMINATO
    setNewAnimal({...newAnimal, microchip: value});
    
    if (existingMicrochip.includes(value)) {
      setMicrochipError(`Il microchip "${value}" esiste già`);
    } else {
      setMicrochipError('');
    }
  };

  const handleSubmit = () => {
    if (!newAnimal.microchip.trim()) { // ← CAMBIATO
      alert("Microchip richiesto.");
      return;
    }
    
    if (existingMicrochip.includes(newAnimal.microchip)) {
      if (!confirm(`Il microchip "${newAnimal.microchip}" esiste già. Continuare?`)) {
        return;
      }
    }
    
    onSave(newAnimal);
    
    setNewAnimal({
      microchip: '',           // ← CAMBIATO
      nome: '',
      species: 'Maiali',
      birthDate: '',
      sire: '',
      dam: '',
      notes: ''
    });
    setMicrochipError('');
  };

  return (
    <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3">
      <div className="flex justify-between items-center border-b pb-2">
        <h3 className="text-[10px] font-black text-stone-700 uppercase flex items-center gap-1">
          <PlusCircle size={14} /> Registrazione Capi
        </h3>
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        {/* MICROCHIP (obbligatorio) - RINOMINATO */}
        <div className="col-span-2 md:col-span-1">
          <input 
            placeholder="Microchip *" 
            className={`p-2 w-full bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 ${
              microchipError ? 'border-2 border-red-300' : ''
            }`} 
            value={newAnimal.microchip} 
            onChange={(e) => handleMicrochipChange(e.target.value)} 
          />
          {microchipError && (
            <p className="text-[8px] text-red-500 mt-1">{microchipError}</p>
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
        
        {/* PADRE (microchip) */}
        <input 
          placeholder="Padre (microchip)" 
          className="p-2 bg-stone-50 rounded-lg text-xs font-bold border-none shadow-inner text-stone-800 uppercase" 
          value={newAnimal.sire} 
          onChange={(e) => setNewAnimal({...newAnimal, sire: e.target.value})} 
        />
        
        {/* MADRE (microchip) */}
        <input 
          placeholder="Madre (microchip)" 
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
          disabled={!newAnimal.microchip.trim()}
        >
          Salva Capo
        </button>
      </div>
    </div>
  );
};
