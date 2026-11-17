import { defineConfig } from 'vitest/config'

// Fenêtre de l'extension (popup.html et son script).
// envDir : on lit le même .env.local que le frontend (URL et clé publique de Supabase,
// URL de l'API) au lieu d'en créer un deuxième.
export default defineConfig({
  envDir: '../frontend',
  base: './', // chemins relatifs : l'extension est servie depuis chrome-extension://<id>/
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: { input: 'popup.html' },
  },
  test: {
    environment: 'jsdom',
  },
})
