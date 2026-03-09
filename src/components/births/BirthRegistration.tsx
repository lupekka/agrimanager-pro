import React, { useState } from 'react';
import { Baby } from 'lucide-react';
import { useAnimals } from '../../hooks/useAnimals';
import { Species } from '../../types';
import { speciesList } from '../../utils/constants';

export const BirthRegistration: React.FC = () => {
  const { animals, addAnimal } = useAnimals();
  const [newBirth, setNewBirth] = useState({
    idCode: '',
    species: 'Maiali' as Species,
    count: 1,
    birthDate: ''
  });

  const handleSaveBirth = async () => {
    if (!newBirth.idCode.trim()) return alert("Inserisci il codice della madre.");
    if (newBirth.count <= 0 || newBirth.count > 20) return alert("Inserisci un numero valido di nati (1-20).");
    if (!newBirth.birthDate) return alert("Inserisci la data di nascita.");
    
    const mother = animals.find(a => a.codice === newBirth.idCode || a.id === newBirth.idCode);
    if (!mother) return alert("Madre non trovata.");
    
    for (let i = 0; i < newBirth.count; i++) {
      const defaultName = `${newBirth.species.substring(0, 3)}-${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
      await addAnimal({
        codice: defaultName,
        nome: '',
        species: newBirth.species,
        birthDate: newBirth.birthDate,
        sire: '',
        dam: mother.codice,
        notes: 'Nato in azienda'
      });
    }
    
    setNewBirth({ idCode: '', species: 'Maiali', count: 1, birthDate: '' });
    alert(`${newBirth.count} nuovi capi registrati con successo!`);
  };

  return (
    <div className="bg-white p-8 rounded-3xl border shadow-xl max-w-lg mx-auto">
      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-700 mb-8 flex items-center gap-4 shadow-lg">
        <Baby size={48} strokeWidth={1.5} className="animate-pulse" />
        <p className="text-[10px] font-black italic uppercase text-amber-900">Registrazione Nascite</p>
      </div>
      
      <div className="space-y-6">
        <input 
          className="w-full p-3 bg-stone-50 rounded-xl font-black text-sm shadow-inner border-none text-stone-800 uppercase" 
          placeholder="Codice Madre" 
          value={newBirth.idCode} 
          onChange={(e) => setNewBirth({...newBirth, idCode: e.target.value})} 
        />
        
        <div className="flex gap-2">
          <input 
            type="number" 
            min="1" 
            max="20" 
            className="flex-1 p-3 bg-stone-50 rounded-xl font-black text-sm shadow-inner border-none text-stone-800" 
            placeholder="N. Nati" 
            value={newBirth.count} 
            onChange={(e) => setNewBirth({...newBirth, count: Number(e.target.value)})} 
          />
          
          <select 
            className="flex-1 p-3 bg-stone-50 rounded-xl font-bold text-[10px] border-none shadow-inner text-stone-800 uppercase" 
            value={newBirth.species} 
            onChange={(e) => setNewBirth({...newBirth, species: e.target.value as Species})}
          >
            {speciesList.map(s => <option key={s}>{s}</option>)}
          </select>
        </div>
        
        <input 
          type="date" 
          className="w-full p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner border-none text-emerald-700" 
          value={newBirth.birthDate} 
          onChange={(e) => setNewBirth({...newBirth, birthDate: e.target.value})} 
        />
        
        <button 
          onClick={handleSaveBirth} 
          className="w-full bg-emerald-950 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95"
        >
          Registra Ora
        </button>
      </div>
    </div>
  );
};