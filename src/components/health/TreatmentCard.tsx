import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Treatment } from '../../types';

interface TreatmentCardProps {
  treatment: Treatment;
  animalId: string;
  onComplete: (animalId: string, treatmentId: string) => void;
  onDelete: (animalId: string, treatmentId: string) => void;
}

export const TreatmentCard: React.FC<TreatmentCardProps> = ({ 
  treatment, animalId, onComplete, onDelete 
}) => {
  const isExpired = treatment.dataScadenza && 
    new Date(treatment.dataScadenza) < new Date() && 
    !treatment.completed;
    
  const isExpiring = treatment.dataScadenza && 
    !isExpired && 
    !treatment.completed && 
    new Date(treatment.dataScadenza).getTime() - new Date().getTime() <= 7 * 24 * 60 * 60 * 1000;

  return (
    <div className={`p-4 rounded-xl border-2 ${
      isExpired ? 'border-red-300 bg-red-50' :
      isExpiring ? 'border-amber-300 bg-amber-50' :
      treatment.completed ? 'border-emerald-300 bg-emerald-50' :
      'border-stone-200 bg-white'
    }`}>
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center gap-2">
          <span className="font-black text-emerald-900">{treatment.tipo}</span>
          {treatment.completed && (
            <span className="text-emerald-700 text-[8px] bg-emerald-100 px-2 py-0.5 rounded-full">
              COMPLETATO
            </span>
          )}
          {isExpired && (
            <span className="text-red-600 text-[8px] bg-red-100 px-2 py-0.5 rounded-full font-black">
              SCADUTO
            </span>
          )}
          {isExpiring && (
            <span className="text-amber-600 text-[8px] bg-amber-100 px-2 py-0.5 rounded-full font-black">
              IN SCADENZA
            </span>
          )}
        </div>
        <div className="flex gap-1">
          {!treatment.completed && (
            <button
              onClick={() => onComplete(animalId, treatment.id)}
              className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
              title="Completa"
            >
              <CheckCircle2 size={16} />
            </button>
          )}
          <button
            onClick={() => {
              if (window.confirm(`❌ Eliminare il trattamento?`)) {
                onDelete(animalId, treatment.id);
              }
            }}
            className="p-1 text-red-500 hover:bg-red-50 rounded"
            title="Elimina trattamento"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <span className="text-stone-600">Data:</span>
          <span className="ml-1 font-bold text-stone-800">
            {new Date(treatment.dataSomministrazione).toLocaleDateString('it-IT')}
          </span>
        </div>
        {treatment.dataScadenza && (
          <div>
            <span className="text-stone-600">Richiamo:</span>
            <span className={`ml-1 font-bold ${
              isExpired ? 'text-red-600' : 'text-stone-800'
            }`}>
              {new Date(treatment.dataScadenza).toLocaleDateString('it-IT')}
            </span>
          </div>
        )}
      </div>
      
      {treatment.note && (
        <p className="mt-2 text-xs text-stone-700 italic bg-white p-2 rounded-lg">
          📝 {treatment.note}
        </p>
      )}
    </div>
  );
};