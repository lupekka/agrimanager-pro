import React, { useState } from 'react';
import { Search, Download } from 'lucide-react'; // ← AGGIUNTO Download
import { useTasks } from '../../hooks/useTasks';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { pdfService } from '../../services/pdfService'; // ← AGGIUNTO

export const TaskList: React.FC = () => {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const [taskSearch, setTaskSearch] = useState('');

  const handleExportPDF = () => { // ← AGGIUNTO
    if (tasks.length === 0) {
      alert("Nessun task da esportare");
      return;
    }
    pdfService.exportTasksReport(tasks);
  };

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      {/* Header con titolo e pulsante esporta */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-black text-emerald-900">📋 Agenda</h2>
        <button
          onClick={handleExportPDF}
          className="bg-stone-800 text-white px-4 py-2 rounded-xl text-sm font-black flex items-center gap-2 hover:bg-stone-700 transition-colors"
        >
          <Download size={18} />
          Esporta PDF
        </button>
      </div>

      <div className="bg-white p-4 rounded-2xl border shadow-sm space-y-3 border-t-4 border-stone-900">
        <h3 className="text-[10px] font-black uppercase text-stone-700 italic">Programmazione</h3>
        
        <TaskForm onSave={addTask} />
        
        <div className="relative pt-2 border-t mt-2">
          <Search size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-stone-500" />
          <input 
            className="w-full p-2 pl-8 bg-stone-100 border-none rounded-lg text-[10px] font-black italic shadow-inner text-stone-700" 
            placeholder="Cerca..." 
            value={taskSearch} 
            onChange={(e) => setTaskSearch(e.target.value)} 
          />
        </div>
      </div>
      
      <div className="space-y-2">
        {tasks
          .filter(t => t.text.toLowerCase().includes(taskSearch.toLowerCase()))
          .sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''))
          .map(t => (
            <TaskCard
              key={t.id}
              task={t}
              onToggle={toggleTask}
              onDelete={deleteTask}
            />
          ))}
      </div>
    </div>
  );
};
