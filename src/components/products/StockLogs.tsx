import React from 'react';
import { History } from 'lucide-react';
import { StockLog } from '../../types';

interface StockLogsProps {
  logs: StockLog[];
}

export const StockLogs: React.FC<StockLogsProps> = ({ logs }) => {
  return (
    <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <h3 className="text-[10px] font-black uppercase text-stone-700 mb-4 flex items-center gap-2 italic">
        <History size={14} className="text-emerald-600" /> Cronologia Movimenti
      </h3>
      <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
       {(logs || []).map(log => (
          <div key={log.id} className="flex justify-between items-center text-[10px] p-2 bg-stone-50 rounded-xl border border-stone-100">
            <div className="flex-1">
              <span className="font-black text-stone-800 uppercase italic">{log.productName}</span>
              {log.reason && (
                <span className="text-[7px] text-stone-500 block italic">({log.reason})</span>
              )}
            </div>
            <span className={`font-black px-2 py-0.5 rounded-full ${log.change > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'}`}>
              {log.change > 0 ? '+' : ''}{log.change}
            </span>
            <span className="text-stone-600 font-bold uppercase text-[8px] italic ml-2">{log.date}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
