import { useState, useEffect, useCallback } from 'react';

// 🔑 LA TUA PUBLIC KEY (quella che hai generato)
const VAPID_PUBLIC_KEY = 'BB_A4oE_cFxpLF5uoLDfmvbO0cgHq03ccgO7u5mQEI7RjGtl307NSI-pR6aPgR5YrD7I5JNcO_tUGhEZII-THIWI';
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

export const usePushNotifications = () => {
  const [isSupported, setIsSupported] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);

  useEffect(() => {
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);

      navigator.serviceWorker.ready.then((reg) => {
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) setSubscription(sub);
        });
      });
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      alert('Il tuo browser non supporta le notifiche push.');
      return false;
    }

    try {
      const permissionResult = await Notification.requestPermission();
      setPermission(permissionResult);
      
      if (permissionResult !== 'granted') return false;

      const registration = await navigator.serviceWorker.ready;
      const existingSubscription = await registration.pushManager.getSubscription();
      
      if (existingSubscription) {
        setSubscription(existingSubscription);
        return true;
      }

      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      setSubscription(newSubscription);
      alert('✅ Notifiche attivate!');
      return true;

    } catch (error) {
      console.error('Errore attivazione notifiche:', error);
      alert('❌ Errore durante attivazione');
      return false;
    }
  }, [isSupported]);

  const sendLocalNotification = useCallback((title: string, body: string) => {
    if (permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  }, [permission]);

  return {
    isSupported,
    permission,
    subscription,
    requestPermission,
    sendLocalNotification,
  };
};
