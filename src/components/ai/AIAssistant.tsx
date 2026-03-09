import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { useTransactions } from '../../hooks/useTransactions';

interface AIAssistantProps {
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ onClose }) => {
  const [aiInput, setAiInput] = useState('');
  const [aiLogs, setAiLogs] = useState<string[]>([]);
  const { addTransaction } = useTransactions();

  const handleAICommand = async () => {
    const frasi = aiInput.toLowerCase().split(/ e |,|\./).filter(s => s.trim());
    const logs: string[] = [];
    
    for (const f of frasi) {
      const num = f.match(/(\d+)/)?.[1];
      if (f.includes('venduto') && num) {
        await addTransaction({
          desc: `IA: ${f}`,
          amount: Number(num),
          type: 'Entrata',
          species: 'Maiali',
          date: new Date().toLocaleDateString('it-IT')
        });
        logs.push(`✅ Registrata Entrata: ${num}€`);
      } else if (f.includes('speso') && num) {
        await addTransaction({
          desc: `IA: ${f}`,
          amount: Number(num),
          type: 'Uscita',
          species: 'Maiali',
          date: new Date().toLocaleDateString('it-IT')
        });
        logs.push(`✅ Registrata Uscita: ${num}€`);
      }
    }
    
    setAiLogs(logs);
    setAiInput('');
  };

  return (
    <div className="mb-6 bg-white p-4 rounded-2xl border-2 border-blue-100 shadow-xl animate-in slide-in-from-top-4 relative">
      <button 
        onClick={onClose}
        className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"
      >
        <X size={18} />
      </button>

      <h3 className="text-blue-900 font-bold text-xs uppercase mb-3 flex items-center gap-2 italic">
        <Bot size={16} /> Comandi Rapidi
      </h3>
      
      <div className="flex gap-2">
        <input 
          className="flex-1 p-2 bg-stone-50 border-none rounded-xl text-sm font-bold text-stone-800" 
          placeholder="Es: Venduto maiale a 100€" 
          value={aiInput} 
          onChange={e => setAiInput(e.target.value)} 
          onKeyDown={(e) => e.key === 'Enter' && handleAICommand()} 
        />
        <button 
          onClick={handleAICommand} 
          className="bg-blue-600 text-white px-5 rounded-xl font-bold text-xs shadow-md"
        >
          OK
        </button>
      </div>
      
      {aiLogs.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {aiLogs.map((l, i) => (
            <span key={i} className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-lg text-[10px] font-bold animate-in zoom-in">
              {l}
            </span>
          ))}
        </div>
      )}
    </div>
  );
};