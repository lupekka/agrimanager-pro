import React from 'react';
import { Network } from 'lucide-react';
import { Animal } from '../../types';
import { useAnimals } from '../../hooks/useAnimals';

const DynastyBranch: React.FC<{ animal: Animal; allAnimals: Animal[]; level?: number }> = ({ 
  animal, allAnimals, level = 0 
}) => {
  // Usa sia codice che nome per i filtri
  const animalDisplayName = animal.nome || animal.name || animal.codice;
  
  const children = allAnimals.filter(a => 
    a.dam === animalDisplayName || a.sire === animalDisplayName || 
    a.dam === animal.codice || a.sire === animal.codice ||
    a.dam === animal.id || a.sire === animal.id
  );
  
  return (
    <div className={level > 0 ? "ml-4 border-l-2 border-stone-300 pl-4 mt-2" : ""}>
      <div className={`p-3 rounded-xl border bg-white mb-2 shadow-sm ${level === 0 ? 'border-l-4 border-l-emerald-600' : ''}`}>
        <div className="flex items-center gap-2">
          <p className="font-bold text-stone-900 text-xs uppercase">{animal.codice}</p>
          {animal.nome && (
            <p className="text-[10px] text-emerald-600 font-bold italic">"{animal.nome}"</p>
          )}
        </div>
        <p className="text-[10px] text-stone-600 font-bold uppercase">{animal.species} • GEN {level}</p>
        {animal.sire && <p className="text-[8px] text-stone-500 mt-1">Padre: {animal.sire}</p>}
        {animal.dam && <p className="text-[8px] text-stone-500">Madre: {animal.dam}</p>}
      </div>
      {children.map(child => (
        <DynastyBranch key={child.id} animal={child} allAnimals={allAnimals} level={level + 1} />
      ))}
    </div>
  );
};

export const DynastyTree: React.FC = () => {
  const { animals } = useAnimals();
  
  // Trova gli animali senza genitori (radici dell'albero)
  const rootAnimals = animals.filter(a => !a.dam && !a.sire);
  
  if (rootAnimals.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border shadow-sm text-center">
        <Network size={48} className="text-stone-300 mx-auto mb-4" />
        <p className="text-stone-500 italic">
          Nessun animale con genealogia. Aggiungi genitori per creare l'albero.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-8 rounded-3xl border shadow-sm overflow-x-auto">
      <h3 className="text-xl font-black italic uppercase mb-8 flex items-center gap-2 text-emerald-900">
        <Network className="text-emerald-500"/> Albero Genealogico
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {rootAnimals.map(root => (
          <div key={root.id} className="bg-stone-50 p-4 rounded-3xl border-2 border-white shadow-inner min-w-[280px]">
            <DynastyBranch animal={root} allAnimals={animals} />
          </div>
        ))}
      </div>
    </div>
  );
};