import { useState, useEffect, useCallback } from 'react';
import { Animal, ExpiringTreatment } from '../types';

declare global {
  interface Window {
    OneSignal?: any;
    _oneSignalInitialized?: boolean;
  }
}

export const useNotifications = (userId?: string) => {
  const [oneSignalInitialized, setOneSignalInitialized] = useState(false);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);
  const [notificationPermission, setNotificationPermission] = useState(false);

  // Inizializza OneSignal (una sola volta)
  useEffect(() => {
    // Evita inizializzazioni multiple
    if (typeof window === 'undefined' || window._oneSignalInitialized) return;

    const initOneSignal = () => {
      if (!window.OneSignal || window._oneSignalInitialized) return;

      window.OneSignal.push(() => {
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

        window._oneSignalInitialized = true;
        setOneSignalInitialized(true);
        
        // Verifica se le notifiche sono già permesse
        if (Notification.permission === 'granted') {
          setNotificationPermission(true);
          setShowNotificationPrompt(false);
        }

        // Collega l'utente se fornito
        if (userId) {
          window.OneSignal.setExternalUserId(userId);
        }
      });
    };

    // Carica lo script se non esiste
    if (!window.OneSignal) {
      const script = document.createElement('script');
      script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
      script.async = true;
      script.onload = initOneSignal;
      document.head.appendChild(script);
    } else {
      initOneSignal();
    }

    // Timeout di sicurezza
    const timer = setTimeout(() => {
      if (!window._oneSignalInitialized) {
        console.log('⚠️ OneSignal non caricato dopo timeout');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [userId]);

  // Richiedi permesso
  const requestPermission = useCallback(() => {
    if (!window.OneSignal) {
      alert("OneSignal non è ancora caricato. Riprova tra qualche secondo.");
      return;
    }

    window.OneSignal.push(() => {
      window.OneSignal.showSlidedownPrompt().then(() => {
        setNotificationPermission(true);
        setShowNotificationPrompt(false);
      });
    });
  }, []);

  // Invia notifica
  const sendNotification = useCallback((title: string, message: string, data?: any) => {
    if (!window.OneSignal) return;
    
    window.OneSignal.push(() => {
      window.OneSignal.sendTag("lastNotification", new Date().toDateString());
    });
    
    // Notifica nativa come fallback
    if (Notification.permission === 'granted') {
      new Notification(title, { 
        body: message,
        icon: '/icon-192.png'
      });
    }
  }, []);

  // Controlla trattamenti in scadenza
  const checkExpiringTreatments = useCallback((animals: Animal[]): ExpiringTreatment[] => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const expiring: ExpiringTreatment[] = [];
    
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
        }
      });
    });
    
    return expiring;
  }, []);

  return {
    oneSignalInitialized,
    notificationPermission,
    showNotificationPrompt,
    requestPermission,
    sendNotification,
    checkExpiringTreatments,
    setShowNotificationPrompt
  };
};
