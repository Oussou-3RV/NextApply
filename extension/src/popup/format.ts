// Phrases affichées dans la fenêtre de l'extension pour une offre.
// Mêmes règles que la page Offres du frontend (lib/offers.ts).
import type { JobOffer } from './api'

const years = (n: number) => `${n} an${n > 1 ? 's' : ''}`

// 0 et 1 → « 0 à 1 an » ; 2 et null → « au moins 2 ans »
export function formatExperience(min: number | null, max: number | null): string | null {
  if (min === null && max === null) return null
  if (min !== null && max !== null) return min === max ? years(min) : `${min} à ${years(max)}`
  if (min !== null) return min === 0 ? 'aucune année' : `au moins ${years(min)}`
  return `jusqu’à ${years(max!)}`
}

// Comme sur la fiche de la maquette : « L'offre demande 0 à 1 an d'expérience. Tu en as 1 : tu peux postuler. »
export function experienceSentence(offer: JobOffer, myYears: number): string {
  const required = formatExperience(offer.experienceMin, offer.experienceMax)
  if (required === null) return 'L’offre ne précise pas l’expérience demandée.'
  const start = `L’offre demande ${required} d’expérience. Tu en as ${myYears}`
  switch (offer.experienceFit) {
    case 'ecart':
      return `${start} : il te manque un an, tu peux quand même tenter ta chance.`
    case 'trop':
      return `${start} : c’est trop loin, elle sera masquée dans tes offres.`
    default:
      return `${start} : tu peux postuler.`
  }
}

const dayMonth = new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short' })

export function statusLabel(offer: JobOffer): string {
  switch (offer.status) {
    case 'postulee':
      return offer.appliedAt ? `Postulée le ${dayMonth.format(new Date(offer.appliedAt))}` : 'Postulée'
    case 'masquee':
      return 'Masquée'
    case 'vue':
      return 'Vue'
    default:
      return 'Nouvelle'
  }
}
