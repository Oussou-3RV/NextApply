import { useEffect, useState } from 'react'

// Navigation minimale par l'ancre de l'URL (#/profil, #/offres/<id>) : de vrais
// liens <a>, le bouton Précédent fonctionne, et aucune bibliothèque pour quatre écrans.
export const ROUTES = ['apercu', 'offres', 'profil'] as const
export type Route = (typeof ROUTES)[number]

// param : la partie après la page, par exemple l'id de l'offre dans #/offres/<id>
export interface Location {
  route: Route
  param: string | null
}

// Page d'accueil : le tableau de bord (étape 6)
const DEFAULT_ROUTE: Route = 'apercu'

function readLocation(): Location {
  const [first, second] = window.location.hash.replace(/^#\/?/, '').split('/')
  const route = (ROUTES as readonly string[]).includes(first) ? (first as Route) : DEFAULT_ROUTE
  return { route, param: second ? decodeURIComponent(second) : null }
}

export const hrefOf = (route: Route) => `#/${route}`
export const hrefOfOffer = (id: string) => `#/offres/${encodeURIComponent(id)}`

export function useRoute(): Location {
  const [location, setLocation] = useState<Location>(readLocation)

  useEffect(() => {
    const onChange = () => {
      setLocation(readLocation())
      window.scrollTo(0, 0)
    }
    window.addEventListener('hashchange', onChange)
    return () => window.removeEventListener('hashchange', onChange)
  }, [])

  return location
}
