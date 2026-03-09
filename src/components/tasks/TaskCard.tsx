import React from 'react';
import { CheckCircle2, Trash2 } from 'lucide-react';
import { Task } from '../../types';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({ task, onToggle, onDelete }) => {
  const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && !task.done;

  return (
    <div className={`bg-white p-3 rounded-xl border-2 flex justify-between items-center transition-all ${
      task.done ? 'opacity-30' :
      isOverdue ? 'border-red-300 border-l-8 border-l-red-500' :
      'shadow-md border-white border-l-8 border-l-emerald-600'
    }`}>
      <div>
        <p className={`text-[13px] font-black uppercase tracking-tight ${task.done ? 'line-through text-stone-500' : 'text-stone-800'}`}>
          {task.text}
        </p>
        <p className="text-[9px] font-bold text-stone-600 uppercase mt-1 italic">
          Scadenza: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('it-IT') : 'N/D'}
        </p>
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onToggle(task.id, !task.done)} 
          className={`p-2 rounded-lg transition-all ${task.done ? 'bg-stone-200 text-stone-600' : 'bg-emerald-50 text-emerald-700 shadow-sm border border-emerald-100'}`}
        >
          <CheckCircle2 size={18} />
        </button>
        <button 
          onClick={() => {
            if (window.confirm(`❌ Eliminare il task?`)) {
              onDelete(task.id);
            }
          }} 
          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
        >
          <Trash2 size={18} />
        </button>
      </div>
    </div>
  );
};