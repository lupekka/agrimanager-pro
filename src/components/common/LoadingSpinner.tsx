import React from 'react';
import { Activity } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  fullScreen?: boolean;
  message?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ 
  size = 'md',
  fullScreen = false,
  message = "Caricamento in corso..."
}) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center gap-3">
      <Activity className={`animate-spin text-emerald-600 ${sizes[size]}`} />
      {message && <p className="text-sm text-stone-600 font-medium animate-pulse">{message}</p>}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-stone-50">
        {spinner}
      </div>
    );
  }

  return spinner;
};
