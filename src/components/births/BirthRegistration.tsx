import React, { useState } from 'react';
import { Baby } from 'lucide-react';
import { useAnimals } from '../../hooks/useAnimals';
import { Species } from '../../types';
import { speciesList } from '../../utils/constants';

export const BirthRegistration: React.FC = () => {
  const { animals, addAnimal } = useAnimals();
  const [newBirth, setNewBirth] = useState({
    motherMicrochip: '',   // ← RINOMINATO (solo microchip)
    fatherMicrochip: '',   // ← NUOVO (solo microchip)
    species: 'Maiali' as Species,
    count: 1,
    birthDate: ''
  });

  const handleSaveBirth = async () => {
    if (!newBirth.motherMicrochip.trim()) return alert("Inserisci il microchip della madre.");
    if (newBirth.count <= 0 || newBirth.count > 20) return alert("Inserisci un numero valido di nati (1-20).");
    if (!newBirth.birthDate) return alert("Inserisci la data di nascita.");
    
    // Cerca la madre per microchip (SOLO microchip, niente id)
    const mother = animals.find(a => a.microchip === newBirth.motherMicrochip);
    if (!mother) return alert(`Madre con microchip "${newBirth.motherMicrochip}" non trovata.`);
    
    // Cerca il padre per microchip (se inserito)
    let father = null;
    if (newBirth.fatherMicrochip.trim()) {
      father = animals.find(a => a.microchip === newBirth.fatherMicrochip);
      if (!father) {
        if (!confirm(`Padre con microchip "${newBirth.fatherMicrochip}" non trovato. Continuare senza padre?`)) {
          return;
        }
      }
    }
    
    for (let i = 0; i < newBirth.count; i++) {
      const defaultMicrochip = `${newBirth.species.substring(0, 3)}-${new Date().getFullYear()}-${String(i + 1).padStart(2, '0')}`;
      await addAnimal({
        microchip: defaultMicrochip,
        nome: '',
        species: newBirth.species,
        birthDate: newBirth.birthDate,
        sire: father?.microchip || '',  // ← microchip del padre
        dam: mother.microchip,           // ← microchip della madre
        notes: 'Nato in azienda'
      });
    }
    
    setNewBirth({ 
      motherMicrochip: '', 
      fatherMicrochip: '',
      species: 'Maiali', 
      count: 1, 
      birthDate: '' 
    });
    alert(`${newBirth.count} nuovi capi registrati con successo!`);
  };

  return (
    <div className="bg-white p-8 rounded-3xl border shadow-xl max-w-lg mx-auto">
      <div className="bg-amber-50 p-6 rounded-2xl border border-amber-100 text-amber-700 mb-8 flex items-center gap-4 shadow-lg">
        <Baby size={48} strokeWidth={1.5} className="animate-pulse" />
        <p className="text-[10px] font-black italic uppercase text-amber-900">Registrazione Nascite</p>
      </div>
      
      <div className="space-y-4">
        {/* MADRE (obbligatoria) */}
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">
            👩 Microchip Madre <span className="text-red-500">*</span>
          </label>
          <input 
            className="w-full p-3 bg-stone-50 rounded-xl font-black text-sm shadow-inner border-none text-stone-800 uppercase" 
            placeholder="Es. MAIALE-001" 
            value={newBirth.motherMicrochip} 
            onChange={(e) => setNewBirth({...newBirth, motherMicrochip: e.target.value})} 
          />
        </div>
        
        {/* PADRE (opzionale) */}
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">
            👨 Microchip Padre <span className="text-stone-500 font-normal">(opzionale)</span>
          </label>
          <input 
            className="w-full p-3 bg-stone-50 rounded-xl font-black text-sm shadow-inner border-none text-stone-800 uppercase" 
            placeholder="Es. MAIALE-002" 
            value={newBirth.fatherMicrochip} 
            onChange={(e) => setNewBirth({...newBirth, fatherMicrochip: e.target.value})} 
          />
          <p className="text-[8px] text-stone-500 mt-1">
            Inserisci il microchip del padre per avere un albero genealogico completo
          </p>
        </div>
        
        {/* SPECIE E NUMERO NATI */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-stone-700 mb-1 block">Specie</label>
            <select 
              className="w-full p-3 bg-stone-50 rounded-xl font-bold text-[10px] border-none shadow-inner text-stone-800 uppercase" 
              value={newBirth.species} 
              onChange={(e) => setNewBirth({...newBirth, species: e.target.value as Species})}
            >
              {speciesList.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          
          <div>
            <label className="text-xs font-bold text-stone-700 mb-1 block">Numero nati</label>
            <input 
              type="number" 
              min="1" 
              max="20" 
              className="w-full p-3 bg-stone-50 rounded-xl font-black text-sm shadow-inner border-none text-stone-800" 
              value={newBirth.count} 
              onChange={(e) => setNewBirth({...newBirth, count: Number(e.target.value)})} 
            />
          </div>
        </div>
        
        {/* DATA NASCITA */}
        <div>
          <label className="text-xs font-bold text-stone-700 mb-1 block">Data nascita</label>
          <input 
            type="date" 
            className="w-full p-3 bg-stone-50 rounded-xl font-bold text-sm shadow-inner border-none text-emerald-700" 
            value={newBirth.birthDate} 
            onChange={(e) => setNewBirth({...newBirth, birthDate: e.target.value})} 
          />
        </div>
        
        {/* BOTTONE SALVA */}
        <button 
          onClick={handleSaveBirth} 
          className="w-full bg-emerald-950 text-white py-4 rounded-xl font-black uppercase text-xs shadow-lg active:scale-95 mt-4"
        >
          Registra Nascita
        </button>
      </div>
    </div>
  );
};
