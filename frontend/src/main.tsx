import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Police servie par l'application elle-même (npm), sans appel à Google Fonts
import '@fontsource-variable/public-sans'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
