import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'
import { DataProvider } from './data/DataContext.jsx'
import { ToastProvider } from './components/ui/Toast.jsx'
import './index.css'

// تسجيل الـService Worker — يتيح التثبيت كتطبيق والعمل بلا إنترنت.
// في التطوير لا يُسجَّل حتى لا تُخزَّن ملفات قديمة وتُربك التعديلات.
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {})
  })
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <DataProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </DataProvider>
    </BrowserRouter>
  </React.StrictMode>,
)
