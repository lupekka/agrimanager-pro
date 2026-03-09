import React from 'react';
import { ArrowUpRight, ArrowDownLeft, Trash2 } from 'lucide-react';
import { Transaction } from '../../types';

interface TransactionCardProps {
  transaction: Transaction;
  onDelete: (id: string) => void;
}

export const TransactionCard: React.FC<TransactionCardProps> = ({ transaction, onDelete }) => {
  return (
    <div className="bg-white p-3 rounded-xl border border-stone-200 flex justify-between items-center shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${transaction.type === 'Entrata' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
          {transaction.type === 'Entrata' ? <ArrowUpRight size={14} /> : <ArrowDownLeft size={14} />}
        </div>
        <div>
          <p className="font-bold text-xs text-stone-800 uppercase">{transaction.desc}</p>
          <p className="text-[8px] font-bold text-stone-600 uppercase">{transaction.date}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className={`font-black text-sm italic ${transaction.type === 'Entrata' ? 'text-emerald-600' : 'text-red-600'}`}>
          {transaction.type === 'Entrata' ? '+' : '-'}€{transaction.amount}
        </span>
        <button 
          onClick={() => {
            if (window.confirm(`❌ Eliminare la transazione?`)) {
              onDelete(transaction.id);
            }
          }} 
          className="text-stone-500 hover:text-red-500"
          title="Elimina transazione"
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  );
};