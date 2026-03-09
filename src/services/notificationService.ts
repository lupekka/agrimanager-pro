declare global {
  interface Window {
    OneSignal?: any;
    OneSignalDeferred?: any[];
  }
}

export const notificationService = {
  initialized: false,
  oneSignalId: null as string | null,

  init(appId: string, userId?: string) {
    if (typeof window === 'undefined' || !window.OneSignal || this.initialized) return;

    window.OneSignal.init({
      appId: appId,
      safari_web_id: "web.onesignal.auto.3cd6b41f-0715-4da8-9807-02ca4af2dc44",
      notifyButton: {
        enable: true,
        position: 'bottom-right',
        size: 'medium',
        theme: 'default',
        prenotify: true,
        showCredit: false,
        text: {
          'tip.state.unsubscribed': 'Attiva notifiche scadenze',
          'tip.state.subscribed': 'Notifiche attive',
          'tip.state.blocked': 'Notifiche bloccate'
        }
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
      this.oneSignalId = id;
      this.initialized = true;
      
      if (userId) {
        window.OneSignal.setExternalUserId(userId);
      }
    });
  },

  requestPermission() {
    if (!window.OneSignal) {
      alert("OneSignal non è ancora caricato. Riprova tra qualche secondo.");
      return;
    }
    window.OneSignal.showSlidedownPrompt();
  },

  sendNotification(title: string, message: string, data?: any) {
    if (!window.OneSignal || !this.oneSignalId) return;
    
    window.OneSignal.sendTag("lastNotification", new Date().toDateString());
    
    if (Notification.permission === 'granted') {
      new Notification(title, { 
        body: message,
        icon: '/icon-192.png'
      });
    }
  }
};