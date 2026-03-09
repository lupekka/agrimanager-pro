import { useState, useEffect, useCallback } from 'react';
import { Animal, ExpiringTreatment } from '../types';

declare global {
  interface Window {
    OneSignal?: any;
  }
}

export const useNotifications = (userId?: string) => {
  const [oneSignalInitialized, setOneSignalInitialized] = useState(false);
  const [oneSignalId, setOneSignalId] = useState<string | null>(null);
  const [notificationPermission, setNotificationPermission] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);

  // Inizializza OneSignal
  useEffect(() => {
    const initializeOneSignal = () => {
      if (window.OneSignal && !oneSignalInitialized) {
        window.OneSignal.init({
          appId: "feed9c1e-90cc-468f-a2b5-2dad2c0350ac",
          safari_web_id: "web.onesignal.auto.3cd6b41f-0715-4da8-9807-02ca4af2dc44",
          notifyButton: {
            enable: true,
            position: 'bottom-right',
            size: 'medium',
            theme: 'default',
            prenotify: true,
            showCredit: false,
          },
          welcomeNotification: {
            title: 'AgriManager Pro',
            message: 'Riceverai promemoria per le scadenze dei trattamenti!'
          },
          persistNotification: true,
          autoResubscribe: true,
          allowLocalhostAsSecureOrigin: true
        });
        
        window.OneSignal.getUserId().then((id: string) => {
          if (id) {
            setOneSignalId(id);
            setOneSignalInitialized(true);
            setNotificationPermission(true);
            setShowNotificationPrompt(false);
            
            if (userId) {
              window.OneSignal.setExternalUserId(userId);
            }
          }
        });
      }
    };

    initializeOneSignal();
    
    const timer = setTimeout(initializeOneSignal, 2000);
    return () => clearTimeout(timer);
  }, [oneSignalInitialized, userId]);

  // Richiedi permesso
  const requestPermission = useCallback(() => {
    if (!window.OneSignal) {
      alert("OneSignal non è ancora caricato. Riprova tra qualche secondo.");
      return;
    }
    window.OneSignal.showSlidedownPrompt();
    setShowNotificationPrompt(false);
  }, []);

  // Invia notifica
  const sendNotification = useCallback((title: string, message: string, data?: any) => {
    if (!window.OneSignal || !oneSignalId) return;
    
    window.OneSignal.sendTag("lastNotification", new Date().toDateString());
    
    if (Notification.permission === 'granted') {
      new Notification(title, { 
        body: message,
        icon: '/icon-192.png'
      });
    }
  }, [oneSignalId]);

  // Controlla trattamenti in scadenza
  const checkExpiringTreatments = useCallback((animals: Animal[]): ExpiringTreatment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiring: ExpiringTreatment[] = [];
    const notificationsToSend: { title: string; message: string; data: any }[] = [];
    
    animals.forEach(animal => {
      animal.treatments?.forEach(treatment => {
        if (treatment.dataScadenza && !treatment.completed) {
          const scadenza = new Date(treatment.dataScadenza);
          scadenza.setHours(0, 0, 0, 0);
          
          const diffTime = scadenza.getTime() - today.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          const isExpired = diffDays < 0;
          const isExpiring = !isExpired && diffDays <= 7;
          
          if (isExpiring || isExpired) {
            expiring.push({
              animalId: animal.id,
              animalName: animal.codice,
              species: animal.species,
              treatment,
              daysLeft: diffDays,
              isExpired
            });
          }
          
          // Invia notifiche se necessario
          if (oneSignalInitialized && treatment.dataScadenza && !treatment.completed && !isExpired && diffDays <= 7 && diffDays >= 0) {
            const notificationKey = `${animal.id}_${treatment.id}_${diffDays}`;
            const sentNotifications = JSON.parse(localStorage.getItem('sentNotifications') || '[]');
            
            if (!sentNotifications.includes(notificationKey)) {
              notificationsToSend.push({
                title: `📅 Promemoria: ${treatment.tipo} per ${animal.codice}`,
                message: `Scadenza tra ${diffDays} giorno${diffDays === 1 ? '' : 'i'}`,
                data: {
                  animalId: animal.id,
                  treatmentId: treatment.id,
                  daysLeft: diffDays
                }
              });
              
              sentNotifications.push(notificationKey);
              localStorage.setItem('sentNotifications', JSON.stringify(sentNotifications));
            }
          }
        }
      });
    });
    
    notificationsToSend.forEach(notif => {
      sendNotification(notif.title, notif.message, notif.data);
    });
    
    return expiring;
  }, [oneSignalInitialized, sendNotification]);

  return {
    oneSignalInitialized,
    oneSignalId,
    notificationPermission,
    showNotificationPrompt,
    requestPermission,
    sendNotification,
    checkExpiringTreatments,
    setShowNotificationPrompt
  };
};