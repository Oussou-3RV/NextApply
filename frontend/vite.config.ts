import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    // Le backend n'autorise (CORS) que http://localhost:5173. Si le port est déjà pris,
    // Vite s'arrête avec une erreur au lieu de passer en silence sur 5174.
    port: 5173,
    strictPort: true,
  },
})
