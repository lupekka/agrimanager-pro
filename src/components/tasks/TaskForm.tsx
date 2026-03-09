import React, { useState } from 'react';

interface TaskFormProps {
  onSave: (text: string, date: string) => void;
}

export const TaskForm: React.FC<TaskFormProps> = ({ onSave }) => {
  const [newTask, setNewTask] = useState('');
  const [newTaskDate, setNewTaskDate] = useState(new Date().toISOString().split('T')[0]);

  const handleSubmit = () => {
    if (!newTask.trim()) return;
    onSave(newTask, newTaskDate);
    setNewTask('');
  };

  return (
    <div className="flex flex-col gap-2">
      <input 
        className="p-2 bg-stone-50 rounded-lg font-bold text-xs border-none shadow-inner text-stone-800 uppercase" 
        placeholder="Nuovo task..." 
        value={newTask} 
        onChange={(e) => setNewTask(e.target.value)} 
        onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
      />
      <div className="flex gap-2">
        <input 
          type="date" 
          className="flex-1 p-2 bg-stone-50 rounded-lg font-bold text-[10px] text-emerald-700 border-none shadow-inner" 
          value={newTaskDate} 
          onChange={(e) => setNewTaskDate(e.target.value)} 
        />
        <button 
          onClick={handleSubmit} 
          className="bg-emerald-950 text-white px-6 rounded-lg font-black text-[10px] uppercase shadow-md active:scale-95"
        >
          Aggiungi
        </button>
      </div>
    </div>
  );
};