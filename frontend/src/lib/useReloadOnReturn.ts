import { useEffect } from 'react'

// Appelle load() tout de suite, puis chaque fois que je reviens sur l'onglet de l'app.
// Les offres s'ajoutent depuis l'extension, dans un autre onglet : sans ça, il
// faudrait actualiser la page pour les voir apparaître.
// load doit être stable (useCallback, ou fonction définie hors du composant).
export function useReloadOnReturn(load: () => void) {
  useEffect(() => {
    load()
    const onReturn = () => {
      if (document.visibilityState === 'visible') load()
    }
    document.addEventListener('visibilitychange', onReturn)
    window.addEventListener('focus', onReturn)
    return () => {
      document.removeEventListener('visibilitychange', onReturn)
      window.removeEventListener('focus', onReturn)
    }
  }, [load])
}
