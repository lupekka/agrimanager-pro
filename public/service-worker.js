// Ascolta l'evento 'push' (quando arriva una notifica dal server)
self.addEventListener('push', (event) => {
  // Dati di default se non arriva nulla
  let data = {
    title: 'AgriManager Pro',
    body: 'Hai un nuovo promemoria!',
    icon: '/icon-192.png'
  };

  // Se ci sono dati nella notifica, li uso
  if (event.data) {
    try {
      data = event.data.json();
    } catch (e) {
      data.body = event.data.text();
    }
  }

  // Opzioni della notifica
  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png', // Icona piccola per dispositivi mobili
    vibrate: [200, 100, 200], // Pattern di vibrazione
    data: data.url || '/', // URL da aprire quando si clicca
    actions: data.actions || [] // Azioni aggiuntive (es. "Apri", "Ignora")
  };

  // Mostra la notifica
  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

// Ascolta l'evento 'notificationclick' (quando l'utente clicca sulla notifica)
self.addEventListener('notificationclick', (event) => {
  // Chiudi la notifica
  event.notification.close();
  
  // URL da aprire (quello salvato in data)
  const urlToOpen = event.notification.data || '/';
  
  // Apri o focus sulla finestra
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Se c'è già una finestra aperta, la uso
      for (const client of clientList) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      // Altrimenti ne apro una nuova
      return clients.openWindow(urlToOpen);
    })
  );
});
