import React, { useState } from 'react';
import { Package, MinusCircle, PlusCircle, Trash2, Edit2 } from 'lucide-react';
import { useAnimalGroups } from '../../hooks/useAnimalGroups';
import { useTransactions } from '../../hooks/useTransactions';

export const AnimalGroupList: React.FC = () => {
  const { groups, loading, reduceQuantity, deleteGroup, updateGroupNotes } = useAnimalGroups();
  const { addTransaction } = useTransactions();
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [editNote, setEditNote] = useState('');
  const [sellAmount, setSellAmount] = useState<{ id: string; amount: number; price: number } | null>(null);

  const handleSell = async (groupId: string, currentQuantity: number, groupName: string) => {
    if (!sellAmount) return;
    
    if (sellAmount.amount <= 0 || sellAmount.amount > currentQuantity) {
      alert(`Inserisci un numero valido (1-${currentQuantity})`);
      return;
    }
    
    if (sellAmount.price <= 0) {
      alert("Inserisci un prezzo valido");
      return;
    }
    
    await addTransaction({
      desc: `Vendita di ${sellAmount.amount} ${groupName}`,
      amount: sellAmount.price,
      type: 'Entrata',
      species: 'Maiali',
      date: new Date().toLocaleDateString('it-IT')
    });
    
    await reduceQuantity(groupId, sellAmount.amount);
    
    setSellAmount(null);
    alert(`${sellAmount.amount} capi venduti per €${sellAmount.price}!`);
  };

  if (loading) return <div className="p-8 text-center">Caricamento gruppi...</div>;

  if (groups.length === 0) {
    return (
      <div className="bg-white p-8 rounded-3xl border shadow-sm text-center">
        <Package size={48} className="text-stone-300 mx-auto mb-4" />
        <p className="text-stone-500 italic">
          Nessun gruppo registrato. Vai su "Parti" per registrare una nuova cucciolata.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-black text-emerald-900">📦 Gruppi di Animali</h3>
        <span className="text-xs text-stone-500">Totale gruppi: {groups.length}</span>
      </div>
      
      {groups.map(group => (
        <div key={group.id} className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-gradient-to-r from-emerald-50 to-white border-b border-stone-100">
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-black text-emerald-800 text-lg">{group.name}</h4>
                <p className="text-xs text-stone-500">
                  🎂 {new Date(group.birthDate).toLocaleDateString('it-IT')} • 
                  👩 Madre: {group.motherMicrochip}
                  {group.fatherMicrochip && ` • 👨 Padre: ${group.fatherMicrochip}`}
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingGroup(group.id);
                    setEditNote(group.notes);
                  }}
                  className="text-stone-500 hover:text-emerald-600"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Eliminare il gruppo "${group.name}"?`)) {
                      deleteGroup(group.id);
                    }
                  }}
                  className="text-stone-500 hover:text-red-600"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="text-center">
                <p className="text-2xl font-black text-emerald-700">{group.currentQuantity}</p>
                <p className="text-[10px] text-stone-500">Capi attuali</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-stone-500">{group.quantity}</p>
                <p className="text-[10px] text-stone-500">Nati totali</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-black text-amber-600">{group.quantity - group.currentQuantity}</p>
                <p className="text-[10px] text-stone-500">Venduti/Morti</p>
              </div>
            </div>
            
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setSellAmount({ id: group.id, amount: 1, price: 0 })}
                className="flex-1 bg-amber-500 text-white py-2 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-amber-600"
              >
                <MinusCircle size={16} /> Vendi/Muori
              </button>
              <button
                onClick={() => alert("Funzionalità in sviluppo: aggiungi nuovi nati al gruppo")}
                className="flex-1 bg-emerald-600 text-white py-2 rounded-xl text-sm font-black flex items-center justify-center gap-2 hover:bg-emerald-700"
              >
                <PlusCircle size={16} /> Aggiungi nati
              </button>
            </div>
            
            {sellAmount?.id === group.id && (
              <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200">
                <p className="text-xs font-bold text-amber-800 mb-2">Vendita/Morte</p>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Quantità"
                    min="1"
                    max={group.currentQuantity}
                    className="w-24 p-2 bg-white rounded-lg text-sm"
                    value={sellAmount.amount}
                    onChange={(e) => setSellAmount({ ...sellAmount, amount: Number(e.target.value) })}
                  />
                  <input
                    type="number"
                    placeholder="Prezzo €"
                    className="flex-1 p-2 bg-white rounded-lg text-sm"
                    value={sellAmount.price || ''}
                    onChange={(e) => setSellAmount({ ...sellAmount, price: Number(e.target.value) })}
                  />
                  <button
                    onClick={() => handleSell(group.id, group.currentQuantity, group.name)}
                    className="bg-amber-600 text-white px-4 py-2 rounded-lg text-sm font-black"
                  >
                    Conferma
                  </button>
                  <button
                    onClick={() => setSellAmount(null)}
                    className="bg-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-black"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
            
            {editingGroup === group.id && (
              <div className="mt-4 p-3 bg-stone-50 rounded-xl">
                <textarea
                  className="w-full p-2 bg-white rounded-lg text-sm"
                  rows={2}
                  value={editNote}
                  onChange={(e) => setEditNote(e.target.value)}
                  placeholder="Note sul gruppo..."
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={async () => {
                      await updateGroupNotes(group.id, editNote);
                      setEditingGroup(null);
                    }}
                    className="flex-1 bg-emerald-600 text-white py-1 rounded-lg text-sm font-black"
                  >
                    Salva
                  </button>
                  <button
                    onClick={() => setEditingGroup(null)}
                    className="flex-1 bg-stone-200 text-stone-700 py-1 rounded-lg text-sm font-black"
                  >
                    Annulla
                  </button>
                </div>
              </div>
            )}
            
            {group.notes && editingGroup !== group.id && (
              <p className="mt-3 text-xs text-stone-600 italic bg-stone-50 p-2 rounded-lg">
                📝 {group.notes}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
