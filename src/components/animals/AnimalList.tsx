import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { useAnimals } from '../../hooks/useAnimals';
import { AnimalCard } from './AnimalCard';
import { AnimalForm } from './AnimalForm';
import { AnimalSearch } from './AnimalSearch';
import { Species } from '../../types';
import { speciesList } from '../../utils/constants';

export const AnimalList: React.FC = () => {
  const { animals, addAnimal, deleteAnimal, updateAnimal } = useAnimals();
  const [expandedSpecies, setExpandedSpecies] = useState<Species[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAnimals = animals.filter(animal => 
    animal.codice.toLowerCase().includes(searchTerm.toLowerCase()) ||
    animal.nome?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSpecies = (species: Species) => {
    setExpandedSpecies(prev => 
      prev.includes(species) ? prev.filter(s => s !== species) : [...prev, species]
    );
  };

  const handleUpdateNotes = (id: string, notes: string) => {
    updateAnimal(id, { notes });
  };

  return (
    <div className="space-y-6">
      <AnimalForm onSave={addAnimal} />
      <AnimalSearch 
        value={searchTerm} 
        onChange={setSearchTerm}
        resultsCount={searchTerm ? filteredAnimals.length : undefined}
      />
      
      <div className="space-y-3">
        {speciesList.map(specie => {
          const capi = filteredAnimals.filter(a => a.species === specie);
          if (capi.length === 0) return null;
          const isExpanded = expandedSpecies.includes(specie);
          
          return (
            <div key={specie} className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm">
              <div 
                onClick={() => toggleSpecies(specie)} 
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-stone-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {isExpanded ? (
                    <ChevronDown size={20} className="text-emerald-600" />
                  ) : (
                    <ChevronRight size={20} className="text-stone-400" />
                  )}
                  <h4 className="text-sm font-black text-emerald-800 uppercase">{specie}</h4>
                </div>
                <span className="text-xs font-bold text-stone-700 bg-stone-100 px-3 py-1 rounded-full">
                  {capi.length} {capi.length === 1 ? 'capo' : 'capi'}
                </span>
              </div>
              
              {isExpanded && (
                <div className="p-4 border-t border-stone-100 bg-stone-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {capi.map(animal => (
                      <AnimalCard 
                        key={animal.id} 
                        animal={animal}
                        onDelete={deleteAnimal}
                        onUpdateNotes={handleUpdateNotes}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};