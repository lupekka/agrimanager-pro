import React, { useState } from 'react';
import { Edit2, Trash2 } from 'lucide-react';
import { Animal } from '../../types';

interface AnimalCardProps {
  animal: Animal;
  onDelete: (id: string) => void;
  onUpdateNotes: (id: string, notes: string) => void;
}

export const AnimalCard: React.FC<AnimalCardProps> = ({ animal, onDelete, onUpdateNotes }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState(animal.notes || '');

  const handleSave = () => {
    onUpdateNotes(animal.id, editNote);
    setIsEditing(false);
  };

  return (
    <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-sm relative group hover:border-emerald-500 transition-all">
      <div className="flex justify-between items-start mb-1">
        <div>
          <div className="flex items-center gap-2">
            <h4 className="font-black text-stone-800 uppercase text-xs">{animal.codice}</h4>
            {animal.nome && (
              <p className="text-[10px] text-emerald-600 font-bold italic">"{animal.nome}"</p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setIsEditing(true)} 
            className="text-stone-600 hover:text-emerald-500"
          >
            <Edit2 size={14}/>
          </button>
          <button 
            onClick={() => {
              if (window.confirm(`❌ Eliminare l'animale "${animal.codice}"?`)) {
                onDelete(animal.id);
              }
            }} 
            className="text-stone-600 hover:text-red-500"
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
      
      {isEditing ? (
        <div className="mt-2 space-y-2">
          <textarea 
            className="w-full p-2 bg-stone-50 rounded-lg text-[10px] border-none font-bold italic shadow-inner text-stone-800" 
            value={editNote} 
            onChange={(e) => setEditNote(e.target.value)} 
            placeholder="Nuove note..."
            rows={3}
          />
          <div className="flex gap-2">
            <button 
              onClick={handleSave} 
              className="flex-1 bg-emerald-600 text-white py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-emerald-700"
            >
              Salva
            </button>
            <button 
              onClick={() => {
                setIsEditing(false);
                setEditNote(animal.notes || '');
              }} 
              className="flex-1 bg-stone-300 text-stone-700 py-1.5 rounded-lg text-[9px] font-black uppercase hover:bg-stone-400"
            >
              Annulla
            </button>
          </div>
        </div>
      ) : (
        <>
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
        </>
      )}
    </div>
  );
};