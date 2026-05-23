import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/api.js' // Configure axios baseURL before any component mounts
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
