import React from 'react';
import { Activity } from 'lucide-react';

export const LoadingSpinner: React.FC<{ message?: string }> = ({ 
  message = "Caricamento in corso..." 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center font-bold text-emerald-800 bg-stone-50">
      <div className="flex items-center gap-3">
        <Activity className="animate-spin" size={24} />
        <span>{message}</span>
      </div>
    </div>
  );
};
