import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
// Fonts are bundled with the site (no request to Google, which would see every visitor).
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/poppins/500.css'
import '@fontsource/poppins/600.css'
import '@fontsource/poppins/700.css'
import '@fontsource/poppins/800.css'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)
