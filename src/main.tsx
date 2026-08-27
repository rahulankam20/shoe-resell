import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { ErrorBoundary } from './components/ErrorBoundary';
import { handleGoogleRedirect } from './lib/googleAuth';

// Auto-recover if Vite encounters a stale bundle chunk after deployment
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Stale chunk detected after deployment, reloading...', event);
  const lastReload = Number(sessionStorage.getItem('sv_chunk_reload') || '0');
  if (Date.now() - lastReload > 8000) {
    sessionStorage.setItem('sv_chunk_reload', String(Date.now()));
    window.location.reload();
  }
});

handleGoogleRedirect();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
