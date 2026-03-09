import React from 'react';
import { Bell } from 'lucide-react';

interface NotificationBellProps {
  onRequestPermission: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onRequestPermission }) => {
  const handleClick = () => {
    if (window.confirm(
      "🔔 AgriManager Pro vuole inviarti notifiche per:\n\n" +
      "• Avvisarti quando un trattamento sta per scadere\n" +
      "• Ricordarti i richiami vaccinali\n" +
      "• Segnalarti scadenze importanti\n\n" +
      "Le notifiche arrivano anche quando l'app è chiusa.\n\n" +
      "Vuoi attivarle?"
    )) {
      onRequestPermission();
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={handleClick}
        className="bg-amber-500 text-white p-2 rounded-full shadow-md animate-pulse hover:bg-amber-600 transition-colors"
        title="Attiva notifiche per ricevere promemoria"
      >
        <Bell size={20} />
      </button>
      <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
    </div>
  );
};