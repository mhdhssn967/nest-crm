import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>
)

// 👇 Add this part to enable PWA
import { registerSW } from 'virtual:pwa-register'

const updateSW = registerSW({
  onNeedRefresh() {
    console.log('🔄 New content available. Refresh to update.')
  },
  onOfflineReady() {
    console.log('✅ App ready to work offline.')
  }
})
