import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { usePushNotifications } from '../../hooks/usePushNotifications';

export const NotificationBell: React.FC = () => {
  const { isSupported, permission, requestPermission } = usePushNotifications();

  if (!isSupported) {
    return (
      <div className="relative group">
        <div className="bg-stone-300 text-white p-2 rounded-full shadow-md cursor-not-allowed opacity-50">
          <BellOff size={20} />
        </div>
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-stone-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Browser non supportato
        </div>
      </div>
    );
  }

  if (permission === 'denied') {
    return (
      <div className="relative group">
        <div className="bg-red-500 text-white p-2 rounded-full shadow-md opacity-50">
          <BellOff size={20} />
        </div>
        <div className="absolute bottom-full right-0 mb-2 w-48 bg-stone-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
          Notifiche bloccate
        </div>
      </div>
    );
  }

  if (permission === 'granted') {
    return (
      <div className="bg-emerald-500 text-white p-2 rounded-full shadow-md">
        <Bell size={20} />
      </div>
    );
  }

  // default - non richiesto ancora
  return (
    <div className="relative">
      <button
        onClick={requestPermission}
        className="bg-amber-500 text-white p-2 rounded-full shadow-md hover:bg-amber-600 transition-colors animate-pulse"
        title="Attiva notifiche per ricevere promemoria"
      >
        <Bell size={20} />
      </button>
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
    </div>
  );
};
