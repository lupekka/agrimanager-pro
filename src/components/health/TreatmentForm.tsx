import React from 'react';
import { TreatmentType } from '../../types';
import { treatmentTypes } from '../../utils/constants';

interface TreatmentFormProps {
  animalName: string;
  newTreatment: {
    tipo: TreatmentType;
    dataSomministrazione: string;
    dataScadenza: string;
    note: string;
  };
  onChange: (treatment: any) => void;
  onSave: () => void;
  onCancel: () => void;
}

export const TreatmentForm: React.FC<TreatmentFormProps> = ({
  animalName,
  newTreatment,
  onChange,
  onSave,
  onCancel
}) => {
  return (
    <div className="bg-white p-5 rounded-3xl border-2 border-emerald-200 shadow-sm">
      <h4 className="text-sm font-black text-emerald-900 uppercase mb-4">
        Nuovo Trattamento per {animalName}
      </h4>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">Tipo</label>
            <select
              className="w-full p-3 bg-stone-50 rounded-xl font-bold text-stone-800 text-sm border-none shadow-inner"
              value={newTreatment.tipo}
              onChange={(e) => onChange({...newTreatment, tipo: e.target.value as TreatmentType})}
            >
              {treatmentTypes.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs font-bold text-stone-700 block mb-1">Data</label>
            <input
              type="date"
              className="w-full p-3 bg-stone-50 rounded-xl font-bold text-stone-800 text-sm border-none shadow-inner"
              value={newTreatment.dataSomministrazione}
              onChange={(e) => onChange({...newTreatment, dataSomministrazione: e.target.value})}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-stone-700 block mb-1">
            Scadenza <span className="text-stone-500 font-normal">(opzionale)</span>
          </label>
          <input
            type="date"
            className="w-full p-3 bg-stone-50 rounded-xl font-bold text-stone-800 text-sm border-none shadow-inner"
            value={newTreatment.dataScadenza}
            onChange={(e) => onChange({...newTreatment, dataScadenza: e.target.value})}
          />
        </div>

        <div>
          <label className="text-xs font-bold text-stone-700 block mb-1">Note</label>
          <textarea
            className="w-full p-3 bg-stone-50 rounded-xl font-bold text-stone-800 text-sm border-none shadow-inner h-20"
            placeholder="Dettagli del trattamento..."
            value={newTreatment.note}
            onChange={(e) => onChange({...newTreatment, note: e.target.value})}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={onSave}
            className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-bold uppercase text-sm hover:bg-emerald-700"
          >
            Registra
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-stone-200 text-stone-700 py-3 rounded-xl font-bold uppercase text-sm hover:bg-stone-300"
          >
            Annulla
          </button>
        </div>
      </div>
    </div>
  );
};