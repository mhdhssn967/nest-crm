// All imports must come first
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

// 👇 Add PWA support here — at the top!
import { registerSW } from 'virtual:pwa-register';

// Then call registerSW
registerSW({
  onNeedRefresh() {
    console.log('🔄 New content available. Refresh to update.');
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline.');
  }
});

// Now render the app
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
);
