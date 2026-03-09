import React from 'react';
import { DiagnosisResult as DiagnosisResultType } from '../../types';

interface DiagnosisResultProps {
  result: DiagnosisResultType;
  onReset: () => void;
}

export const DiagnosisResult: React.FC<DiagnosisResultProps> = ({ result, onReset }) => {
  return (
    <div className="mt-8 space-y-4">
      <div className={`p-5 rounded-2xl border-l-8 ${
        result.severity === 'high' ? 'border-l-red-600 bg-red-50' :
        result.severity === 'medium' ? 'border-l-amber-500 bg-amber-50' :
        'border-l-emerald-600 bg-emerald-50'
      }`}>
        
        <div className="flex justify-between items-start mb-3">
          <h4 className="text-sm font-black text-stone-900 uppercase">{result.title}</h4>
        </div>

        {result.visualFindings && result.visualFindings.length > 0 && (
          <div className="mb-4 bg-blue-50 p-3 rounded-xl">
            <p className="text-[8px] font-black mb-2 text-stone-800">🔍 RILEVATO DALLA FOTO:</p>
            <div className="flex flex-wrap gap-1">
              {result.visualFindings.map((f, i) => (
                <span key={i} className="text-[8px] bg-white px-2 py-1 rounded-full border border-blue-200 text-stone-700">
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <p className="text-[8px] font-black mb-2 text-stone-700">POSSIBILI CAUSE:</p>
          <div className="flex flex-wrap gap-1">
            {result.possibleCauses.map((c, i) => (
              <span key={i} className="text-[8px] bg-white px-2 py-1 rounded-full border text-stone-700">
                {c}
              </span>
            ))}
          </div>
        </div>

        <div className={`p-3 rounded-xl text-center text-[9px] font-black uppercase ${
          result.severity === 'high' ? 'bg-red-600 text-white' :
          result.severity === 'medium' ? 'bg-amber-500 text-white' :
          'bg-emerald-600 text-white'
        }`}>
          {result.action}
        </div>
      </div>

      <p className="text-[6px] text-stone-400 text-center">
        🤖 AI basata su MobileNet - Consultare sempre un veterinario
      </p>

      <button
        onClick={onReset}
        className="w-full bg-stone-200 py-3 rounded-xl text-[9px] font-black uppercase hover:bg-stone-300 text-stone-800"
      >
        NUOVA ANALISI
      </button>
    </div>
  );
};