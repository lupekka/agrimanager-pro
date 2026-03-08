import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css';

// Versione 10/10 - Robusta e professionale
const renderApp = () => {
  const rootElement = document.getElementById('root');
  
  if (!rootElement) {
    console.error('❌ Elemento root non trovato! Verifica public/index.html');
    // Mostra un messaggio di errore visibile all'utente
    document.body.innerHTML = `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100vh;
        font-family: system-ui;
        background: #F8F9FA;
        color: #059669;
        text-align: center;
        padding: 20px;
      ">
        <h1 style="font-size: 2rem; margin-bottom: 1rem;">🌾 AgriManager Pro</h1>
        <p style="color: #4b5563; max-width: 400px;">
          Errore di caricamento. Ricarica la pagina o contatta il supporto.
        </p>
      </div>
    `;
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  
  // Disabilita StrictMode per evitare doppi rendering in produzione
  root.render(<App />);
  
  // Log di avvio (utile per debug)
  console.log('🚀 AgriManager Pro avviato', new Date().toLocaleString());
};

// Avvia l'app
renderApp();

// Gestione errori globali (opzionale, ma professionale)
window.addEventListener('error', (event) => {
  console.error('❌ Errore globale:', event.error);
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('❌ Promise non gestita:', event.reason);
});
