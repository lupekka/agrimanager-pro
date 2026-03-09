import React from 'react';
import { commonSymptoms } from '../../utils/constants';

interface SymptomSelectorProps {
  onSelect: (symptom: string) => void;
}

export const SymptomSelector: React.FC<SymptomSelectorProps> = ({ onSelect }) => {
  return (
    <div className="flex flex-wrap gap-1 mb-3">
      {commonSymptoms.map(s => (
        <button
          key={s}
          type="button"
          onClick={() => onSelect(s.toLowerCase())}
          className="text-[8px] bg-stone-100 hover:bg-blue-100 px-2 py-1 rounded-full font-bold text-stone-700"
        >
          + {s}
        </button>
      ))}
    </div>
  );
};