import React from 'react';
import { Bell, BellOff } from 'lucide-react';
import { useNotifications } from '../../hooks/useNotifications'; // ← CAMBIATO

export const NotificationBell: React.FC = () => {
  const { notificationsEnabled, setNotificationsEnabled } = useNotifications(); // ← CAMBIATO

  const toggleNotifications = () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    localStorage.setItem('emailNotifications', String(newValue));
    
    if (newValue) {
      alert('✅ Riceverai le notifiche via email alle scadenze');
    } else {
      alert('❌ Notifiche email disattivate');
    }
  };

  // Non c'è più bisogno di tutti quei controlli (isSupported, permission, ecc.)
  return (
    <div className="relative group">
      <button
        onClick={toggleNotifications}
        className={`p-2 rounded-full shadow-md transition-colors ${
          notificationsEnabled 
            ? 'bg-emerald-500 text-white hover:bg-emerald-600' 
            : 'bg-stone-300 text-stone-600 hover:bg-stone-400'
        }`}
        title={notificationsEnabled ? 'Notifiche email attive' : 'Notifiche email disattive'}
      >
        {notificationsEnabled ? <Bell size={20} /> : <BellOff size={20} />}
      </button>
      
      {/* Tooltip informativo */}
      <div className="absolute bottom-full right-0 mb-2 w-48 bg-stone-800 text-white text-[10px] p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
        {notificationsEnabled 
          ? '✅ Riceverai email per le scadenze' 
          : '❌ Notifiche email disattive'}
      </div>
    </div>
  );
};
