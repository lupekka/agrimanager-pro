import React, { useState } from 'react';
import { Network, ChevronDown, ChevronRight, Search, Users, GitBranch } from 'lucide-react';
import { useAnimals } from '../../hooks/useAnimals';
import { Animal } from '../../types';
import { speciesList } from '../../utils/constants';

// Componente per un nodo dell'albero (ricorsivo)
const FamilyNode: React.FC<{
  animal: Animal;
  allAnimals: Animal[];
  level: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  visited?: Set<string>; // Per evitare loop
}> = ({ animal, allAnimals, level, expandedNodes, onToggle, visited = new Set() }) => {
  
  const isExpanded = expandedNodes.has(animal.id);
  
  // Evita loop infiniti
  if (visited.has(animal.id)) return null;
  const newVisited = new Set(visited);
  newVisited.add(animal.id);
  
  // Trova genitori
  const father = allAnimals.find(a => a.microchip === animal.sire);
  const mother = allAnimals.find(a => a.microchip === animal.dam);
  
  // Trova fratelli (stessi genitori)
  const siblings = allAnimals.filter(a => 
    a.id !== animal.id && (
      (a.sire && a.sire === animal.sire) || 
      (a.dam && a.dam === animal.dam)
    )
  );
  
  // Trova figli
  const children = allAnimals.filter(a => 
    a.sire === animal.microchip || a.dam === animal.microchip
  );
  
  // Trova nipoti (figli dei figli)
  const grandchildren = children.flatMap(child => 
    allAnimals.filter(a => 
      a.sire === child.microchip || a.dam === child.microchip
    )
  );
  
  const hasFamily = father || mother || siblings.length > 0 || children.length > 0 || grandchildren.length > 0;
  
  // Calcola il colore in base al livello
  const getLevelColor = () => {
    if (level === 0) return 'bg-emerald-500 text-white border-emerald-600';
    if (level % 2 === 0) return 'bg-amber-50 border-amber-200';
    return 'bg-blue-50 border-blue-200';
  };
  
  const getLevelBg = getLevelColor();
  
  // Margine sinistro in base al livello
  const marginLeft = level * 30;
  
  return (
    <div className="relative" style={{ marginLeft: `${marginLeft}px` }}>
      {/* Linea di connessione verticale per livelli > 0 */}
      {level > 0 && (
        <div className="absolute -left-[15px] top-6 w-[15px] h-0.5 bg-stone-300"></div>
      )}
      
      {/* Nodo principale */}
      <div className={`relative p-3 rounded-xl border-2 shadow-sm mb-2 transition-all ${getLevelBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1">
            {/* Icona specie */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ${
              animal.species === 'Maiali' ? 'bg-pink-200 text-pink-800' :
              animal.species === 'Mucche' ? 'bg-amber-200 text-amber-800' :
              animal.species === 'Cavalli' ? 'bg-purple-200 text-purple-800' :
              'bg-emerald-200 text-emerald-800'
            }`}>
              {animal.species === 'Maiali' ? '🐷' :
               animal.species === 'Mucche' ? '🐮' :
               animal.species === 'Cavalli' ? '🐴' : '🐔'}
            </div>
            
            <div className="flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-stone-800 text-sm">
                  {animal.microchip}
                </span>
                {animal.nome && (
                  <span className="text-xs text-emerald-600 italic">
                    "{animal.nome}"
                  </span>
                )}
                {level === 0 && (
                  <span className="text-[8px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full font-black">
                    SELEZIONATO
                  </span>
                )}
              </div>
              {animal.birthDate && (
                <p className="text-[9px] text-stone-500">
                  🎂 {new Date(animal.birthDate).toLocaleDateString('it-IT')}
                </p>
              )}
            </div>
            
            {/* Pulsante espansione */}
            {hasFamily && (
              <button
                onClick={() => onToggle(animal.id)}
                className="p-1.5 hover:bg-white/50 rounded-lg transition-colors"
                title={isExpanded ? "Nascondi famiglia" : "Mostra tutta la famiglia"}
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
        
        {/* Riepilogo famiglia (sempre visibile) */}
        <div className="mt-2 pt-2 border-t border-stone-200 text-[8px] text-stone-500 flex flex-wrap gap-2">
          {father && <span className="bg-blue-50 px-2 py-0.5 rounded">👨 Padre: {father.microchip}</span>}
          {mother && <span className="bg-pink-50 px-2 py-0.5 rounded">👩 Madre: {mother.microchip}</span>}
          {siblings.length > 0 && (
            <span className="bg-amber-50 px-2 py-0.5 rounded">👥 {siblings.length} fratelli</span>
          )}
          {children.length > 0 && (
            <span className="bg-emerald-50 px-2 py-0.5 rounded">👶 {children.length} figli</span>
          )}
          {grandchildren.length > 0 && (
            <span className="bg-purple-50 px-2 py-0.5 rounded">👶👶 {grandchildren.length} nipoti</span>
          )}
        </div>
      </div>
      
      {/* Espansione famiglia */}
      {isExpanded && (
        <div className="relative mt-2 ml-4 pl-4 border-l-2 border-emerald-200">
          
          {/* Genitori */}
          {(father || mother) && (
            <div className="mb-3">
              <p className="text-[9px] font-black text-stone-500 mb-1 uppercase tracking-wider">
                ⬆️ GENITORI
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {father && (
                  <FamilyNode
                    animal={father}
                    allAnimals={allAnimals}
                    level={level + 1}
                    expandedNodes={expandedNodes}
                    onToggle={onToggle}
                    visited={newVisited}
                  />
                )}
                {mother && (
                  <FamilyNode
                    animal={mother}
                    allAnimals={allAnimals}
                    level={level + 1}
                    expandedNodes={expandedNodes}
                    onToggle={onToggle}
                    visited={newVisited}
                  />
                )}
              </div>
            </div>
          )}
          
          {/* Fratelli */}
          {siblings.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] font-black text-stone-500 mb-1 uppercase tracking-wider">
                👥 FRATELLI
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {siblings.slice(0, 3).map(sibling => (
                  <FamilyNode
                    key={sibling.id}
                    animal={sibling}
                    allAnimals={allAnimals}
                    level={level + 1}
                    expandedNodes={expandedNodes}
                    onToggle={onToggle}
                    visited={newVisited}
                  />
                ))}
                {siblings.length > 3 && (
                  <div className="text-xs text-stone-400 italic p-2">
                    ... e altri {siblings.length - 3} fratelli
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Figli */}
          {children.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] font-black text-stone-500 mb-1 uppercase tracking-wider">
                ⬇️ FIGLI
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {children.slice(0, 4).map(child => (
                  <FamilyNode
                    key={child.id}
                    animal={child}
                    allAnimals={allAnimals}
                    level={level + 1}
                    expandedNodes={expandedNodes}
                    onToggle={onToggle}
                    visited={newVisited}
                  />
                ))}
                {children.length > 4 && (
                  <div className="text-xs text-stone-400 italic p-2">
                    ... e altri {children.length - 4} figli
                  </div>
                )}
              </div>
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
  
  const expandAll = () => {
    const allIds = new Set(animals.map(a => a.id));
    setExpandedNodes(allIds);
  };
  
  const collapseAll = () => {
    setExpandedNodes(new Set());
  };
  
  const filteredAnimals = animals
    .filter(a => !selectedSpecies || a.species === selectedSpecies)
    .filter(a => 
      a.microchip.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.nome && a.nome.toLowerCase().includes(searchTerm.toLowerCase()))
    )
    .sort((a, b) => a.microchip.localeCompare(b.microchip));
  
  const rootAnimal = animals.find(a => a.id === selectedAnimal);
  
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
      <div className="flex items-center justify-between mb-6 border-b pb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="text-emerald-600" size={24} />
          <h3 className="text-xl font-black italic uppercase text-emerald-900">
            Albero Genealogico Completo
          </h3>
        </div>
        
        {/* Controlli espansione */}
        {rootAnimal && (
          <div className="flex gap-2">
            <button
              onClick={expandAll}
              className="text-xs bg-stone-100 px-3 py-1 rounded-full hover:bg-stone-200"
              title="Espandi tutto"
            >
              🌳 Espandi tutto
            </button>
            <button
              onClick={collapseAll}
              className="text-xs bg-stone-100 px-3 py-1 rounded-full hover:bg-stone-200"
              title="Comprimi tutto"
            >
              📦 Comprimi
            </button>
          </div>
        )}
      </div>
      
      {/* Filtri e ricerca */}
      <div className="mb-6 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
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
        
        {filteredAnimals.length > 0 && (
          <select
            className="w-full p-3 bg-emerald-50 rounded-xl text-sm font-black border-2 border-emerald-200"
            value={selectedAnimal}
            onChange={(e) => {
              setSelectedAnimal(e.target.value);
              setExpandedNodes(new Set());
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
          <div className="min-w-[800px]">
            <FamilyNode
              animal={rootAnimal}
              allAnimals={animals}
              level={0}
              expandedNodes={expandedNodes}
              onToggle={toggleNode}
            />
          </div>
        </div>
      ) : (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed">
          <GitBranch size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-bold">
            Seleziona un animale per vedere il suo albero genealogico completo
          </p>
          <p className="text-xs text-stone-400 mt-2">
            Vedrai: genitori, nonni, fratelli, figli, nipoti e tutte le relazioni di sangue
          </p>
        </div>
      )}
    </div>
  );
};
