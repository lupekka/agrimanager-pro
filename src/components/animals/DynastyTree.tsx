import React, { useState } from 'react';
import { Network, ChevronDown, ChevronRight, Search, Users, GitBranch, ChevronsDown, ChevronsRight } from 'lucide-react';
import { useAnimals } from '../../hooks/useAnimals';
import { Animal } from '../../types';
import { speciesList } from '../../utils/constants';

// Componente per un nodo dell'albero (ricorsivo) - VERSIONE MOBILE
const FamilyNode: React.FC<{
  animal: Animal;
  allAnimals: Animal[];
  level: number;
  expandedNodes: Set<string>;
  onToggle: (id: string) => void;
  visited?: Set<string>;
}> = ({ animal, allAnimals, level, expandedNodes, onToggle, visited = new Set() }) => {
  
  const isExpanded = expandedNodes.has(animal.id);
  
  if (visited.has(animal.id)) return null;
  const newVisited = new Set(visited);
  newVisited.add(animal.id);
  
  // Trova genitori
  const father = allAnimals.find(a => a.microchip === animal.sire);
  const mother = allAnimals.find(a => a.microchip === animal.dam);
  
  // Trova fratelli
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
  
  const hasFamily = father || mother || siblings.length > 0 || children.length > 0;
  
  // Calcola il colore in base al livello
  const getLevelColor = () => {
    if (level === 0) return 'bg-emerald-100 border-emerald-500 border-l-8';
    if (level % 2 === 0) return 'bg-amber-50 border-amber-200 border-l-4';
    return 'bg-blue-50 border-blue-200 border-l-4';
  };
  
  const getLevelBg = getLevelColor();
  
  return (
    <div className="relative mb-3">
      {/* Nodo principale - senza marginLeft, usa bordi colorati per indentazione visiva */}
      <div className={`relative p-4 rounded-xl border-2 shadow-sm transition-all ${getLevelBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {/* Icona specie grande */}
            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg flex-shrink-0 ${
              animal.species === 'Maiali' ? 'bg-pink-200 text-pink-800' :
              animal.species === 'Mucche' ? 'bg-amber-200 text-amber-800' :
              animal.species === 'Cavalli' ? 'bg-purple-200 text-purple-800' :
              'bg-emerald-200 text-emerald-800'
            }`}>
              {animal.species === 'Maiali' ? '🐷' :
               animal.species === 'Mucche' ? '🐮' :
               animal.species === 'Cavalli' ? '🐴' : '🐔'}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-black text-stone-800 text-base">
                  {animal.microchip}
                </span>
                {animal.nome && (
                  <span className="text-sm text-emerald-600 italic truncate">
                    "{animal.nome}"
                  </span>
                )}
                {level === 0 && (
                  <span className="text-[10px] bg-emerald-600 text-white px-2 py-1 rounded-full font-black">
                    RADICE
                  </span>
                )}
              </div>
              {animal.birthDate && (
                <p className="text-xs text-stone-500 mt-1">
                  🎂 {new Date(animal.birthDate).toLocaleDateString('it-IT')}
                </p>
              )}
            </div>
            
            {/* FRECCIA GRANDE per mobile */}
            {hasFamily && (
              <button
                onClick={() => onToggle(animal.id)}
                className="p-3 hover:bg-white/50 rounded-xl transition-colors ml-2 flex-shrink-0"
                style={{ minWidth: '48px', minHeight: '48px' }}
                title={isExpanded ? "Nascondi famiglia" : "Mostra famiglia"}
              >
                {isExpanded ? (
                  <ChevronsDown size={28} className="text-emerald-600" />
                ) : (
                  <ChevronsRight size={28} className="text-stone-600" />
                )}
              </button>
            )}
          </div>
        </div>
        
        {/* Riepilogo famiglia - più leggibile */}
        {(father || mother || siblings.length > 0 || children.length > 0) && (
          <div className="mt-3 pt-3 border-t-2 border-stone-200 text-xs text-stone-600 flex flex-wrap gap-2">
            {father && <span className="bg-blue-100 px-3 py-1.5 rounded-full">👨 Padre</span>}
            {mother && <span className="bg-pink-100 px-3 py-1.5 rounded-full">👩 Madre</span>}
            {siblings.length > 0 && (
              <span className="bg-amber-100 px-3 py-1.5 rounded-full">👥 {siblings.length} fratelli</span>
            )}
            {children.length > 0 && (
              <span className="bg-emerald-100 px-3 py-1.5 rounded-full">👶 {children.length} figli</span>
            )}
          </div>
        )}
      </div>
      
      {/* Espansione famiglia - VERTICALE, senza scroll */}
      {isExpanded && (
        <div className="relative mt-3 ml-6 pl-4 border-l-4 border-emerald-300">
          
          {/* Genitori */}
          {(father || mother) && (
            <div className="mb-4">
              <p className="text-xs font-black text-stone-600 mb-2 uppercase tracking-wider flex items-center gap-1 bg-stone-100 p-2 rounded-lg">
                <span>⬆️ GENITORI</span>
              </p>
              <div className="space-y-3">
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
            <div className="mb-4">
              <p className="text-xs font-black text-stone-600 mb-2 uppercase tracking-wider flex items-center gap-1 bg-stone-100 p-2 rounded-lg">
                <span>👥 FRATELLI</span>
              </p>
              <div className="space-y-3">
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
                  <div className="text-sm text-stone-500 italic p-3 bg-stone-50 rounded-lg border border-dashed">
                    ... e altri {siblings.length - 3} fratelli
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Figli */}
          {children.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-black text-stone-600 mb-2 uppercase tracking-wider flex items-center gap-1 bg-stone-100 p-2 rounded-lg">
                <span>⬇️ FIGLI</span>
              </p>
              <div className="space-y-3">
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
                  <div className="text-sm text-stone-500 italic p-3 bg-stone-50 rounded-lg border border-dashed">
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
    <div className="bg-white p-4 md:p-6 rounded-3xl border shadow-sm">
      {/* Header mobile-friendly */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6 border-b pb-4">
        <div className="flex items-center gap-2">
          <GitBranch className="text-emerald-600" size={28} />
          <h3 className="text-2xl font-black italic uppercase text-emerald-900">
            Albero Genealogico
          </h3>
        </div>
        
        {/* Controlli espansione - mobile friendly */}
        {rootAnimal && (
          <div className="flex gap-3 self-end md:self-auto">
            <button
              onClick={expandAll}
              className="text-sm bg-stone-100 px-4 py-3 rounded-full hover:bg-stone-200 transition-colors font-bold"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              🌳 Espandi
            </button>
            <button
              onClick={collapseAll}
              className="text-sm bg-stone-100 px-4 py-3 rounded-full hover:bg-stone-200 transition-colors font-bold"
              style={{ minHeight: '48px', minWidth: '48px' }}
            >
              📦 Comprimi
            </button>
          </div>
        )}
      </div>
      
      {/* Filtri e ricerca - mobile ottimizzati */}
      <div className="mb-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <select
            className="flex-1 p-4 bg-stone-50 rounded-xl text-base font-bold border-none shadow-inner"
            value={selectedSpecies}
            onChange={(e) => setSelectedSpecies(e.target.value)}
            style={{ minHeight: '52px' }}
          >
            <option value="">Tutte le specie</option>
            {speciesList.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          
          <div className="flex-1 relative">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Cerca per microchip o nome..."
              className="w-full p-4 pl-12 bg-stone-50 rounded-xl text-base font-bold border-none shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ minHeight: '52px' }}
            />
          </div>
        </div>
        
        {filteredAnimals.length > 0 && (
          <select
            className="w-full p-4 bg-emerald-50 rounded-xl text-base font-black border-2 border-emerald-200"
            value={selectedAnimal}
            onChange={(e) => {
              setSelectedAnimal(e.target.value);
              setExpandedNodes(new Set());
            }}
            style={{ minHeight: '56px' }}
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
      
      {/* Albero genealogico - MOBILE FIRST, senza scroll */}
      {rootAnimal ? (
        <div className="py-2">
          <FamilyNode
            animal={rootAnimal}
            allAnimals={animals}
            level={0}
            expandedNodes={expandedNodes}
            onToggle={toggleNode}
          />
        </div>
      ) : (
        <div className="text-center py-12 bg-stone-50 rounded-2xl border-2 border-dashed">
          <GitBranch size={48} className="text-stone-300 mx-auto mb-3" />
          <p className="text-stone-500 font-bold text-lg">
            Seleziona un animale
          </p>
          <p className="text-sm text-stone-400 mt-2">
            per vedere il suo albero genealogico completo
          </p>
        </div>
      )}
    </div>
  );
};
