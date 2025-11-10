import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Service Worker Registrierung und Update-Handling
if ('serviceWorker' in navigator) {
  let refreshing = false;
  
  // Prüfe auf Updates beim Laden
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/vereinskasse/sw.js')
      .then(registration => {
        console.log('[SW] Service Worker registered:', registration);
        
        // Prüfe regelmäßig auf Updates (alle 60 Sekunden)
        setInterval(() => {
          registration.update();
        }, 60000);
        
        // Prüfe sofort auf Updates
        registration.update();
        
        // Handle Service Worker Updates
        registration.addEventListener('updatefound', () => {
          const newWorker = registration.installing;
          
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                // Neuer Service Worker ist installiert und wartet
                console.log('[SW] New Service Worker installed, reloading...');
                
                // Sofort neu laden, um den neuen Service Worker zu aktivieren
                // Der Service Worker verwendet skipWaiting(), also wird er sofort aktiv
                if (!refreshing) {
                  refreshing = true;
                  window.location.reload();
                }
              }
            });
          }
        });
      })
      .catch(registrationError => {
        console.error('[SW] Service Worker registration failed:', registrationError);
      });
    
    // Handle Controller Change (wenn ein neuer Service Worker übernimmt)
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!refreshing) {
        console.log('[SW] Controller changed, reloading...');
        refreshing = true;
        window.location.reload();
      }
    });
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
