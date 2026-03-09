import React, { useState } from 'react';
import { Search } from 'lucide-react';
import { useTasks } from '../../hooks/useTasks';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';

export const TaskList: React.FC = () => {
  const { tasks, addTask, toggleTask, deleteTask } = useTasks();
  const [taskSearch, setTaskSearch] = useState('');

  return (
    <div className="space-y-6 max-w-lg mx-auto">
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