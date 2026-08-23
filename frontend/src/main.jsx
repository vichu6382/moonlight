import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/dashboard.css'
import './styles/invoice.css'
import './styles/app.css'
import './styles/theme.css'
import './styles/create-bill-form.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
