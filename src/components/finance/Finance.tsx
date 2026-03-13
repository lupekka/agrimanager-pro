import React from 'react';
import { Download } from 'lucide-react'; // ← AGGIUNTO
import { useTransactions } from '../../hooks/useTransactions';
import { TransactionForm } from './TransactionForm';
import { TransactionCard } from './TransactionCard';
import { speciesList } from '../../utils/constants';
import { pdfService } from '../../services/pdfService'; // ← AGGIUNTO

export const Finance: React.FC = () => {
  const { transactions, addTransaction, deleteTransaction } = useTransactions();

  const totalIncome = transactions.filter(t => t.type === 'Entrata').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'Uscita').reduce((acc, t) => acc + t.amount, 0);

  const handleExportPDF = () => { // ← AGGIUNTO
    if (transactions.length === 0) {
      alert("Nessuna transazione da esportare");
      return;
    }
    pdfService.exportFinanceReport(transactions);
  };

  return (
    <div className="space-y-6">
      {/* Header con titolo e pulsante esporta */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-emerald-900">💰 Bilancio</h2>
        <button
          onClick={handleExportPDF}
          className="bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-stone-700 transition-colors"
        >
          <Download size={18} />
          Esporta PDF
        </button>
      </div>

      {/* Riepilogo */}
      <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-6 rounded-3xl text-white shadow-xl">
        <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Bilancio Netto</p>
        <h3 className="text-4xl font-black mb-2">€ {(totalIncome - totalExpense).toFixed(0)}</h3>
        <div className="flex gap-4 text-[9px] text-stone-400">
          <span>📈 Entrate: €{totalIncome}</span>
          <span>📉 Uscite: €{totalExpense}</span>
        </div>
      </div>

      {/* Form */}
      <TransactionForm onSave={addTransaction} />

      {/* Transazioni per specie */}
      {speciesList.map(specie => {
        const transSpecie = transactions.filter(t => t.species === specie);
        if (transSpecie.length === 0) return null;
        
        const subtotal = transSpecie.reduce((acc, t) => 
          acc + (t.type === 'Entrata' ? t.amount : -t.amount), 0
        );
        
        return (
          <div key={specie} className="space-y-1.5">
            <div className="flex justify-between items-center px-4 py-1.5 bg-stone-200 rounded-xl">
              <h4 className="text-[10px] font-black text-stone-700 uppercase">{specie}</h4>
              <span className={`text-[12px] font-black italic ${subtotal >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                Saldo: €{subtotal}
              </span>
            </div>
            <div className="space-y-1">
              {transSpecie.map(t => (
                <TransactionCard 
                  key={t.id} 
                  transaction={t} 
                  onDelete={deleteTransaction}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};
