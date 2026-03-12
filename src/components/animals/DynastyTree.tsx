import React, { useState } from 'react';
import { Network, ChevronDown, ChevronRight, Search, Users } from 'lucide-react';
import { useAnimals } from '../../hooks/useAnimals';
import { Animal } from '../../types';
import { speciesList } from '../../utils/constants';

// Componente per un singolo nodo dell'albero (ricorsivo)
const FamilyNode: React.FC<{
  animal: Animal;
  allAnimals: Animal[];
  level: number;
  direction: 'ascendants' | 'descendants';
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
}> = ({ animal, allAnimals, level, direction, expandedNodes, onToggle }) => {
  
  const isExpanded = expandedNodes.has(animal.id);
  
  // Trova i genitori (ascendenti)
  const father = allAnimals.find(a => a.microchip === animal.sire);
  const mother = allAnimals.find(a => a.microchip === animal.dam);
  
  // Trova i figli (discendenti)
  const children = allAnimals.filter(a => 
    a.sire === animal.microchip || a.dam === animal.microchip
  );
  
  const hasAscendants = (father || mother) && direction !== 'descendants';
  const hasDescendants = children.length > 0 && direction !== 'ascendants';
  const hasContent = hasAscendants || hasDescendants;
  
  // Determina il margine sinistro in base al livello
  const marginLeft = level * 40;
  
  return (
    <div className="relative">
      {/* Nodo principale */}
      <div 
        className={`relative p-3 rounded-xl border ${
          level === 0 
            ? 'bg-emerald-50 border-emerald-400 shadow-md' 
            : 'bg-white border-stone-200 hover:border-emerald-300'
        } mb-2 transition-all`}
        style={{ marginLeft: `${marginLeft}px` }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Icona specie */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              animal.species === 'Maiali' ? 'bg-pink-100 text-pink-700' :
              animal.species === 'Mucche' ? 'bg-amber-100 text-amber-700' :
              animal.species === 'Cavalli' ? 'bg-purple-100 text-purple-700' :
              'bg-emerald-100 text-emerald-700'
            }`}>
              {animal.species === 'Maiali' ? '🐷' :
               animal.species === 'Mucche' ? '🐮' :
               animal.species === 'Cavalli' ? '🐴' : '🐔'}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-black text-stone-800 text-sm">
                  {animal.microchip}
                </span>
                {animal.nome && (
                  <span className="text-xs text-emerald-600 italic">
                    "{animal.nome}"
                  </span>
                )}
              </div>
              {animal.birthDate && (
                <p className="text-[10px] text-stone-500">
                  🎂 {new Date(animal.birthDate).toLocaleDateString('it-IT')}
                </p>
              )}
            </div>
            
            {/* Pulsanti espansione */}
            {hasContent && (
              <button
                onClick={() => onToggle(animal.id)}
                className="p-1.5 hover:bg-stone-100 rounded-lg transition-colors"
              >
                {isExpanded ? (
                  <ChevronDown size={18} className="text-emerald-600" />
                ) : (
                  <ChevronRight size={18} className="text-stone-400" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Riga con genitori/figli (sintesi) */}
        {(father || mother || children.length > 0) && (
          <div className="mt-2 pt-2 border-t border-stone-100 text-[10px] text-stone-500 flex flex-wrap gap-3">
            {father && <span>👨 Padre: {father.microchip}</span>}
            {mother && <span>👩 Madre: {mother.microchip}</span>}
            {children.length > 0 && (
              <span>👶 {children.length} figli</span>
            )}
          </div>
        )}
      </div>
      
      {/* Sottoalbero espanso (ricorsione) */}
      {isExpanded && (
        <div className="relative">
          {/* Linea verticale di connessione */}
          <div className="absolute left-[20px] top-0 bottom-0 w-0.5 bg-emerald-200"></div>
          
          {/* Ascendenti (sopra) */}
          {hasAscendants && direction !== 'descendants' && (
            <div className="relative">
              {father && (
                <FamilyNode
                  animal={father}
                  allAnimals={allAnimals}
                  level={level + 1}
                  direction="ascendants"
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                />
              )}
              {mother && (
                <FamilyNode
                  animal={mother}
                  allAnimals={allAnimals}
                  level={level + 1}
                  direction="ascendants"
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                />
              )}
            </div>
          )}
          
          {/* Discendenti (sotto) */}
          {hasDescendants && direction !== 'ascendants' && (
            <div className="relative mt-2">
              {children.map(child => (
                <FamilyNode
                  key={child.id}
                  animal={child}
                  allAnimals={allAnimals}
                  level={level + 1}
                  direction="descendants"
                  expandedNodes={expandedNodes}
                  onToggle={onToggle}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const DynastyTree: React.FC = () => {
  const { animals } = useAnimals();
  const [selectedAnimal, setSelectedAnimal] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());
  const [selectedSpecies, setSelectedSpecies] = useState<string>('');
  
  const toggleNode = (animalId: string) => {
    const newSet = new Set(expandedNodes);
    if (newSet.has(animalId)) {
      newSet.delete(animalId);
    } else {
      newSet.add(animalId);
    }
    setExpandedNodes(newSet);
  };
  
  // Filtra animali per specie e ricerca
  const filteredAnimals = animals
    .filter(a => !selectedSpecies || a.species === selectedSpecies)
    .filter(a => 
      a.microchip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.nome && a.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.microchip.localeCompare(b.microchip));
  
  // Animale selezionato
  const rootAnimal = animals.find(a => a.id === selectedAnimal);
  
  // Se non ci sono animali
  if (animals.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border shadow-sm text-center">
        <Users size={48} className="text-stone-300 mx-auto mb-4" />
        <p className="text-stone-500 italic">
          Nessun animale presente. Aggiungi animali per vedere l'albero genealogico.
        </p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-3xl border shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6 border-b pb-4">
        <Network className="text-emerald-600" size={24} />
        <h3 className="text-xl font-black italic uppercase text-emerald-900">
          Albero Genealogico
        </h3>
      </div>
      
      {/* Filtri e ricerca */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Filtro per specie */}
          <select
            className="flex-1 p-2 bg-stone-50 rounded-lg text-sm font-bold border-none shadow-inner"
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
          >
            <option value="">Tutte le specie</option>
            {speciesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          
          {/* Cerca animale */}
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cerca per microchip o nome..."
              className="w-full p-2 pl-9 bg-stone-50 rounded-lg text-sm font-bold border-none shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* Selezione animale radice */}
        {filteredAnimals.length > 0 && (
          <select
            className="w-full p-3 bg-emerald-50 rounded-xl text-sm font-black border-2 border-emerald-200 shadow-inner"
            value={selectedAnimal}
            onChange={(e) => {
              setSelectedAnimal(e.target.value);
              setExpandedNodes(new Set()); // Resetta espansioni
            }}
          >
            <option value="">-- Seleziona un animale come radice --</option>
            {filteredAnimals.map(a => (
              <option key={a.id} value={a.id}>
                {a.microchip} {a.nome ? `(${a.nome})` : ''} - {a.species}
              </option>
            ))}
          </select>
        )}
      </div>
      
      {/* Albero genealogico */}
      {rootAnimal ? (
        <div className="overflow-x-auto py-4">
          <div className="min-w-[600px]">
            <FamilyNode
              animal={rootAnimal}
              allAnimals={animals}
              level={0}
              direction="both"
              expandedNodes={expandedNodes}
              onToggle={toggleNode}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed">
          <Users size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-bold">
            Seleziona un animale per visualizzare il suo albero genealogico
          </p>
          <p className="text-xs text-stone-400 mt-2">
            Potrai vedere tutti gli ascendenti (genitori, nonni) e discendenti (figli, nipoti)
          </p>
        </div>
      )}
    </div>
  );
};
