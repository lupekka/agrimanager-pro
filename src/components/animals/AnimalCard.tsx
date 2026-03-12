import React, { useState } from 'react';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { Animal } from '../../types';

interface AnimalCardProps {
  animal: Animal;
  onDelete: (id: string) => void;
  onUpdate: (id: string, updates: Partial<Animal>) => void;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({ animal, onDelete, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    microchip: animal.microchip,  // ← CAMBIATO
    nome: animal.nome || '',
    birthDate: animal.birthDate || '',
    notes: animal.notes || ''
  });

  const handleSave = () => {
    onUpdate(animal.id, {
      microchip: editForm.microchip,  // ← CAMBIATO
      nome: editForm.nome,
      birthDate: editForm.birthDate,
      notes: editForm.notes
    });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-4 rounded-xl border-2 border-emerald-500 shadow-lg">
        <h4 className="font-black text-emerald-800 mb-3">Modifica {animal.microchip}</h4>
        
        <div className="space-y-3">
          {/* Microchip (NON MODIFICABILE? O MODIFICABILE?) */}
          <div>
            <label className="text-xs font-bold text-stone-600">Microchip</label>
            <input
              type="text"
              value={editForm.microchip}
              onChange={(e) => setEditForm({...editForm, microchip: e.target.value})}
              className="w-full p-2 bg-stone-50 rounded-lg text-sm"
              placeholder="Microchip"
            />
            <p className="text-[8px] text-stone-500 mt-1">Il microchip identifica l'animale. Modifica solo se sicuro.</p>
          </div>

          {/* Nome */}
          <div>
            <label className="text-xs font-bold text-stone-600">Nome</label>
            <input
              type="text"
              value={editForm.nome}
              onChange={(e) => setEditForm({...editForm, nome: e.target.value})}
              className="w-full p-2 bg-stone-50 rounded-lg text-sm"
              placeholder="Nome (opzionale)"
            />
          </div>

          {/* Data di nascita */}
          <div>
            <label className="text-xs font-bold text-stone-600">Data di nascita</label>
            <input
              type="date"
              value={editForm.birthDate}
              onChange={(e) => setEditForm({...editForm, birthDate: e.target.value})}
              className="w-full p-2 bg-stone-50 rounded-lg text-sm"
            />
          </div>

          {/* Note */}
          <div>
            <label className="text-xs font-bold text-stone-600">Note</label>
            <textarea
              value={editForm.notes}
              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
              className="w-full p-2 bg-stone-50 rounded-lg text-sm h-20"
              placeholder="Note sull'animale"
            />
          </div>

          {/* Bottoni */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1"
            >
              <Save size={14} /> Salva
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-stone-200 text-stone-700 py-2 rounded-lg text-xs font-black flex items-center justify-center gap-1"
            >
              <X size={14} /> Annulla
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative group hover:border-emerald-500 transition-all">
      <div className="flex justify-between items-start mb-1">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-stone-800 uppercase text-xs">{animal.microchip}</h4>
            {animal.nome && (
              <p className="text-[10px] text-emerald-600 font-bold italic">"{animal.nome}"</p>
            )}
          </div>
        </div>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={() => setIsEditing(true)} 
            className="text-stone-600 hover:text-emerald-500 p-1.5 hover:bg-emerald-50 rounded-lg"
            title="Modifica"
          >
            <Edit2 size={14}/>
          </button>
          <button 
            onClick={() => {
              if (window.confirm(`❌ Eliminare l'animale "${animal.microchip}"?`)) {
                onDelete(animal.id);
              }
            }} 
            className="text-stone-600 hover:text-red-500 p-1.5 hover:bg-red-50 rounded-lg"
            title="Elimina animale"
          >
            <Trash2 size={14}/>
          </button>
        </div>
      </div>
      
      <div className="mb-2 text-[8px] font-bold text-stone-600 uppercase">
        {animal.sire && <div>Padre: {animal.sire}</div>}
        {animal.dam && <div>Madre: {animal.dam}</div>}
      </div>
      
      {animal.birthDate && (
        <p className="text-[9px] text-stone-600 font-bold mb-2 italic">
          Nato: {new Date(animal.birthDate).toLocaleDateString('it-IT')}
        </p>
      )}
      
      <p className="text-[10px] text-stone-700 bg-stone-50 p-2 rounded-lg italic leading-relaxed font-medium">
        "{animal.notes || 'Nessuna nota presente.'}"
      </p>
      
      {animal.treatments && animal.treatments.length > 0 && (
        <div className="mt-2 pt-2 border-t border-stone-100">
          <p className="text-[8px] font-bold text-stone-500 uppercase mb-1">
            Trattamenti: {animal.treatments.length}
          </p>
          <div className="flex flex-wrap gap-1">
            {animal.treatments.slice(0, 2).map(t => (
              <span key={t.id} className="text-[7px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-full">
                {t.tipo}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
