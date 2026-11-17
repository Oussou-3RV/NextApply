// Offres d'emploi : types calqués sur les DTO du backend (JobOfferResponse…),
// appels à /api/offers et petites règles d'affichage de la page Offres.
import { request } from './api'

export type OfferStatus = 'nouvelle' | 'vue' | 'postulee' | 'masquee'
// Mes années d'expérience comparées à celles exigées (calculé par le backend)
export type ExperienceFit = 'inconnu' | 'ok' | 'ecart' | 'trop'

export interface JobOffer {
  id: string
  url: string
  title: string
  company: string | null
  location: string | null
  experienceMin: number | null
  experienceMax: number | null
  experienceFit: ExperienceFit
  status: OfferStatus
  appliedAt: string | null
  createdAt: string
}

export interface OfferList {
  myExperienceYears: number
  offers: JobOffer[]
}

export const offersApi = {
  list: () => request<OfferList>('/api/offers'),
  setStatus: (id: string, status: OfferStatus) =>
    request<JobOffer>(`/api/offers/${id}/status`, { method: 'PUT', body: { status } }),
  remove: (id: string) => request<void>(`/api/offers/${id}`, { method: 'DELETE' }),
}

// Masquée : par moi, ou parce qu'elle exige au moins 2 ans de plus que mon expérience.
// Une offre où j'ai déjà postulé reste toujours visible.
export const isHidden = (o: JobOffer) =>
  o.status === 'masquee' || (o.experienceFit === 'trop' && o.status !== 'postulee')

const years = (n: number) => `${n} an${n > 1 ? 's' : ''}`

// 0 et 1 → « 0 à 1 an » ; 2 et null → « Au moins 2 ans » ; rien → « Non précisé »
export function formatExperience(min: number | null, max: number | null): string {
  if (min === null && max === null) return 'Non précisé'
  if (min !== null && max !== null) return min === max ? years(min) : `${min} à ${years(max)}`
  if (min !== null) return min === 0 ? 'Aucune exigée' : `Au moins ${years(min)}`
  return `Jusqu’à ${years(max!)}`
}

const dayMonth = new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short' })

// « Postulée le 12 nov. »
export const formatAppliedDate = (iso: string) => dayMonth.format(new Date(iso))
