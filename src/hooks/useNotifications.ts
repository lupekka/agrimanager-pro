import { useState, useEffect, useCallback } from 'react';
import { Animal, ExpiringTreatment } from '../types';

// Chiave VAPID pubblica da Firebase Console
const VAPID_PUBLIC_KEY = 'BB_A4oE_cFxpLF5uoLDfmvbO0cgHq03ccgO7u5mQEI7RjGtl307NSI-pR6aPgR5YrD7I5JNcO_tUGhEZII-THIWI';

// Funzione helper per convertire base64 in Uint8Array (necessaria per la chiave VAPID)
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const useNotifications = (userId?: string) => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(true);

  // Verifica supporto browser
  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      // Recupera sottoscrizione esistente
      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setSubscription(sub);
        });
      });
    }

    // Se già permesso, nascondi prompt
    if (Notification.permission === 'granted') {
      setShowNotificationPrompt(false);
    }
    if (Notification.permission === 'denied') {
      setShowNotificationPrompt(false);
    }
  }, []);

  // Richiedi permesso e sottoscrivi
  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      alert('Il tuo browser non supporta le notifiche push.');
      return false;
    }

    try {
      // Richiedi permesso
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') {
        setShowNotificationPrompt(false);
        return false;
      }

      // Ottieni il service worker
      const registration = await navigator.serviceWorker.ready;

      // Verifica se già sottoscritto
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        setShowNotificationPrompt(false);
        
        // Qui potresti inviare la sottoscrizione al tuo server
        // await saveSubscriptionToServer(existingSubscription, userId);
        
        alert('✅ Notifiche già attive!');
        return true;
      }

      // Nuova sottoscrizione
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setSubscription(newSubscription);
      setShowNotificationPrompt(false);
      
      // Qui potresti inviare la nuova sottoscrizione al server
      // await saveSubscriptionToServer(newSubscription, userId);
      
      alert('✅ Notifiche attivate!');
      return true;

    } catch (error) {
      console.error('Errore attivazione notifiche:', error);
      alert('❌ Errore durante attivazione. Riprova.');
      return false;
    }
  }, [isSupported, userId]);

  // Invia notifica locale (solo per test)
  const sendNotification = useCallback((title: string, body: string) => {
    if (permission === 'granted') {
      new Notification(title, { 
        body,
        icon: '/icon-192.png'
      });
    }
  }, [permission]);

  // Controlla trattamenti in scadenza (uguale a prima)
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
    oneSignalInitialized: false, // Non usiamo più OneSignal
    notificationPermission: permission === 'granted',
    showNotificationPrompt,
    requestPermission,
    sendNotification,
    checkExpiringTreatments,
    setShowNotificationPrompt
  };
};
