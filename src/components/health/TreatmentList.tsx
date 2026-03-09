import React from 'react';
import { TreatmentCard } from './TreatmentCard';
import { Animal, Treatment } from '../../types';

interface TreatmentListProps {
  animals: Animal[];
  selectedAnimal: Animal | null;
  onSelectAnimal: (animal: Animal | null) => void;
  onCompleteTreatment: (animalId: string, treatmentId: string) => void;
  onDeleteTreatment: (animalId: string, treatmentId: string) => void;
}

export const TreatmentList: React.FC<TreatmentListProps> = ({
  animals,
  selectedAnimal,
  onSelectAnimal,
  onCompleteTreatment,
  onDeleteTreatment
}) => {
  if (!selectedAnimal) {
    return (
      <div className="bg-white p-5 rounded-3xl border shadow-sm">
        <h4 className="text-sm font-black text-emerald-900 uppercase mb-4">
          Storico Trattamenti
        </h4>
        <p className="text-stone-500 text-center py-8 italic">
          Seleziona un animale per vedere i suoi trattamenti
        </p>
      </div>
    );
  }

  const treatments = selectedAnimal.treatments || [];

  return (
    <div className="bg-white p-5 rounded-3xl border shadow-sm">
      <h4 className="text-sm font-black text-emerald-900 uppercase mb-4 flex items-center gap-2">
        <span>Storico Trattamenti - {selectedAnimal.codice}</span>
        {selectedAnimal.nome && (
          <span className="text-xs font-normal text-stone-500">({selectedAnimal.nome})</span>
        )}
      </h4>
      
      {treatments.length === 0 ? (
        <p className="text-stone-500 text-center py-8 italic">
          Nessun trattamento registrato per questo animale
        </p>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {[...treatments]
            .sort((a, b) => new Date(b.dataSomministrazione).getTime() - new Date(a.dataSomministrazione).getTime())
            .map(treatment => (
              <TreatmentCard
                key={treatment.id}
                treatment={treatment}
                animalId={selectedAnimal.id}
                onComplete={onCompleteTreatment}
                onDelete={onDeleteTreatment}
              />
            ))}
        </div>
      )}
    </div>
  );
};