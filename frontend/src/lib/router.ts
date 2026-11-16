import { useEffect, useState } from 'react'

// Navigation minimale par l'ancre de l'URL (#/profil) : de vrais liens <a>,
// le bouton Précédent fonctionne, et aucune bibliothèque pour trois pages.
export const ROUTES = ['apercu', 'offres', 'profil'] as const
export type Route = (typeof ROUTES)[number]

const DEFAULT_ROUTE: Route = 'profil'

function readRoute(): Route {
  const value = window.location.hash.replace(/^#\/?/, '')
  return (ROUTES as readonly string[]).includes(value) ? (value as Route) : DEFAULT_ROUTE
}

export const hrefOf = (route: Route) => `#/${route}`

export function useRoute(): Route {
  const [route, setRoute] = useState<Route>(readRoute)

  useEffect(() => {
    const onChange = () => {
      setRoute(readRoute())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return route
}
