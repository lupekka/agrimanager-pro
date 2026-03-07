import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles.css'; // Carichiamo lo stile grafico migliorato

const rootElement = document.getElementById('root')!;
const root = ReactDOM.createRoot(rootElement);

// Abbiamo rimosso StrictMode per evitare doppi caricamenti e bug dei contatori
root.render(
    <App />
);
