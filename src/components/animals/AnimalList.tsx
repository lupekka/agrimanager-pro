import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Edit2, Trash2 } from 'lucide-react';
import { useAnimals } from '../../hooks/useAnimals';
import { useAnimalGroups } from '../../hooks/useAnimalGroups';
import { AnimalCard } from './AnimalCard';
import { AnimalForm } from './AnimalForm';
import { AnimalSearch } from './AnimalSearch';
import { Animal, Species } from '../../types';
import { speciesList } from '../../utils/constants';

export const AnimalList: React.FC = () => {
  console.log("🐶 1. AnimalList montato");
  
  const { animals, loading, error, addAnimal, updateAnimal, deleteAnimal } = useAnimals();
  const { groups, deleteGroup, updateGroupNotes } = useAnimalGroups();
  
  const [expandedSpecies, setExpandedSpecies] = useState<Species[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [editingType, setEditingType] = useState<'animal' | 'group'>('animal');

  // Filtra animali per ricerca
  const filteredAnimals = animals.filter(animal => 
    animal.microchip.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (animal.nome && animal.nome.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  // Filtra gruppi per ricerca
  const filteredGroups = groups.filter(group => 
    group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    group.motherMicrochip.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const toggleSpecies = (species: Species) => {
    setExpandedSpecies(prev => 
      prev.includes(species) ? prev.filter(s => s !== species) : [...prev, species]
    );
  };

 const handleUpdateAnimal = (id: string, updates: Partial<Animal>) => {
  updateAnimal(id, updates);
};

  const handleUpdateGroupNotes = async (id: string, notes: string) => {
    await updateGroupNotes(id, notes);
  };

  const handleDeleteGroup = async (id: string, name: string) => {
    if (window.confirm(`❌ Eliminare il gruppo "${name}"?`)) {
      await deleteGroup(id);
    }
  };

  if (error) {
    console.error("🐶 ERRORE:", error);
    return (
      <div className="bg-red-50 p-6 rounded-2xl border border-red-200">
        <h3 className="text-red-600 font-black text-lg">❌ Errore</h3>
        <p className="text-sm text-stone-700 mt-2">{error}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-8 text-center text-stone-500">
        <p className="text-lg">⏳ Caricamento animali...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <AnimalForm onSave={addAnimal} existingMicrochip={animals.map(a => a.microchip)} />
      <AnimalSearch 
        value={searchTerm} 
        onChange={setSearchTerm}
        resultsCount={searchTerm ? filteredAnimals.length + filteredGroups.length : undefined}
      />
      
      <div className="space-y-3">
        {speciesList.map(specie => {
          const animaliDellaSpecie = filteredAnimals.filter(a => a.species === specie);
          const gruppiDellaSpecie = filteredGroups.filter(g => g.species === specie);
          
          if (animaliDellaSpecie.length === 0 && gruppiDellaSpecie.length === 0) return null;
          
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
                  {animaliDellaSpecie.length + gruppiDellaSpecie.length} capi
                </span>
              </div>
              
              {isExpanded && (
                <div className="p-4 border-t border-stone-100 bg-stone-50/50">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    
                    {/* Animali singoli */}
                    {animaliDellaSpecie.map(animal => (
                      <AnimalCard 
                        key={animal.id} 
                        animal={animal}
                        onDelete={deleteAnimal}
                        onUpdate={handleUpdateAnimal}
                      />
                    ))}
                    
                    {/* Gruppi */}
                    {gruppiDellaSpecie.map(group => (
                      <div key={group.id} className="bg-gradient-to-br from-amber-50 to-white p-4 rounded-xl border-2 border-amber-200 shadow-sm relative group hover:border-amber-400 transition-all">
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">📦</span>
                            <h4 className="font-black text-amber-800 text-sm">{group.name}</h4>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => {
                                setEditingItemId(group.id);
                                setEditNote(group.notes);
                                setEditingType('group');
                              }} 
                              className="text-stone-500 hover:text-emerald-500"
                            >
                              <Edit2 size={14}/>
                            </button>
                            <button 
                              onClick={() => handleDeleteGroup(group.id, group.name)} 
                              className="text-stone-500 hover:text-red-500"
                            >
                              <Trash2 size={14}/>
                            </button>
                          </div>
                        </div>
                        
                        <div className="mb-2 text-[10px] text-stone-600">
                          <div>👩 Madre: {group.motherMicrochip}</div>
                          {group.fatherMicrochip && <div>👨 Padre: {group.fatherMicrochip}</div>}
                          <div>🎂 Nato: {new Date(group.birthDate).toLocaleDateString('it-IT')}</div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-amber-100">
                          <div className="text-center">
                            <p className="text-xl font-black text-emerald-700">{group.currentQuantity}</p>
                            <p className="text-[8px] text-stone-500">attuali</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-black text-stone-500">{group.quantity}</p>
                            <p className="text-[8px] text-stone-500">nati</p>
                          </div>
                          <div className="text-center">
                            <p className="text-xl font-black text-amber-600">{group.quantity - group.currentQuantity}</p>
                            <p className="text-[8px] text-stone-500">venduti</p>
                          </div>
                        </div>
                        
                        {editingItemId === group.id && editingType === 'group' ? (
                          <div className="mt-3 space-y-2">
                            <textarea 
                              className="w-full p-2 bg-white rounded-lg text-[10px] border border-stone-200" 
                              value={editNote} 
                              onChange={(e) => setEditNote(e.target.value)} 
                              placeholder="Note sul gruppo..."
                              rows={3}
                            />
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  handleUpdateGroupNotes(group.id, editNote);
                                  setEditingItemId(null);
                                }} 
                                className="flex-1 bg-emerald-600 text-white py-1.5 rounded-lg text-[9px] font-black uppercase"
                              >
                                Salva
                              </button>
                              <button 
                                onClick={() => setEditingItemId(null)} 
                                className="flex-1 bg-stone-300 text-stone-700 py-1.5 rounded-lg text-[9px] font-black uppercase"
                              >
                                Annulla
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="mt-2 text-[10px] text-stone-600 italic bg-stone-50 p-2 rounded-lg">
                            "{group.notes || 'Nessuna nota'}"
                          </p>
                        )}
                      </div>
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
