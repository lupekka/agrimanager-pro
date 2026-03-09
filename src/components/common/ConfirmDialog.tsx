import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Conferma",
  cancelText = "Annulla",
  type = 'danger'
}) => {
  if (!isOpen) return null;

  const colors = {
    danger: 'bg-red-600 hover:bg-red-700',
    warning: 'bg-amber-600 hover:bg-amber-700',
    info: 'bg-blue-600 hover:bg-blue-700'
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 animate-in zoom-in">
        <div className="flex justify-between items-start mb-4">
          <div className="flex items-center gap-2 text-amber-600">
            <AlertTriangle size={24} />
            <h3 className="text-lg font-black uppercase">{title}</h3>
          </div>
          <button onClick={onCancel} className="text-stone-400 hover:text-stone-600">
            <X size={20} />
          </button>
        </div>
        
        <p className="text-sm text-stone-600 mb-6">{message}</p>
        
        <div className="flex gap-3">
          <button
            onClick={onConfirm}
            className={`flex-1 ${colors[type]} text-white py-3 rounded-xl font-bold uppercase text-sm`}
          >
            {confirmText}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 bg-stone-200 text-stone-700 py-3 rounded-xl font-bold uppercase text-sm hover:bg-stone-300"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
};