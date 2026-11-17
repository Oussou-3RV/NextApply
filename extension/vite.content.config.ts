import { defineConfig } from 'vite'

// Script injecté dans la page du site d'emploi. Il doit tenir en un seul fichier
// classique (IIFE) : Chrome ne charge pas de modules ES dans une page de cette façon.
export default defineConfig({
  build: {
    outDir: 'dist',
    emptyOutDir: false, // garde la popup construite juste avant
    lib: {
      entry: 'src/content/main.ts',
      formats: ['iife'],
      name: 'NextApplyContent',
      fileName: () => 'content.js',
    },
  },
})
