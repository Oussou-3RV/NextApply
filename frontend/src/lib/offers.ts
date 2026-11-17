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
  score: number | null // sur 100 ; null si compétences pas analysées ou aucune citée
  skillsAnalyzed: boolean // false : offre ajoutée avant le calcul du score
  status: OfferStatus
  appliedAt: string | null
  createdAt: string
}

export interface OfferList {
  myExperienceYears: number
  offers: JobOffer[]
}

// GET /api/offers/{id} (OfferDetailResponse) : la fiche d'une offre
export interface OfferDetail {
  offer: JobOffer
  myExperienceYears: number
  skillsAnalyzed: boolean // false : offre ajoutée avant le calcul du score
  matchedSkills: string[]
  missingSkills: string[]
  language: 'fr' | 'en' | null
  description: string
  coverLetter: string | null
  coverLetterUpdatedAt: string | null
}

export const offersApi = {
  list: () => request<OfferList>('/api/offers'),
  detail: (id: string) => request<OfferDetail>(`/api/offers/${id}`),
  analyzeSkills: (id: string) => request<OfferDetail>(`/api/offers/${id}/skills`, { method: 'POST' }),
  writeLetter: (id: string) => request<OfferDetail>(`/api/offers/${id}/letter`, { method: 'POST' }),
  saveLetter: (id: string, text: string) =>
    request<OfferDetail>(`/api/offers/${id}/letter`, { method: 'PUT', body: { text } }),
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

// « Java, Spring Boot et PostgreSQL »
export function joinWithAnd(items: string[]): string {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}

// Titre de l'encadré de la fiche, comme sur la maquette :
// « L'offre demande 0 à 1 an d'expérience. Tu en as 1 : tu peux postuler. »
export function experienceSentence(offer: JobOffer, myYears: number): string {
  if (offer.experienceMin === null && offer.experienceMax === null) {
    return `L’offre ne précise pas l’expérience demandée. Tu en as ${myYears}.`
  }
  if (offer.experienceMin === 0 && offer.experienceMax === null) {
    return `L’offre n’exige aucune expérience. Tu en as ${myYears} : tu peux postuler.`
  }
  const required = formatExperience(offer.experienceMin, offer.experienceMax).toLowerCase()
  const start = `L’offre demande ${required} d’expérience. Tu en as ${myYears}`
  if (offer.experienceFit === 'ecart') return `${start} : il te manque un an, tu peux tenter ta chance.`
  if (offer.experienceFit === 'trop') return `${start} : l’écart est grand.`
  return `${start} : tu peux postuler.`
}

// « Score de compatibilité : 78 sur 100. Java et SQL correspondent à ton profil.
//   Docker n'apparaît pas dans ton profil. »
export function scoreSentence(detail: OfferDetail): string {
  const { score } = detail.offer
  if (score === null) return 'L’offre ne cite aucune compétence précise : pas de score pour elle.'
  const parts = [`Score de compatibilité : ${score} sur 100.`]
  const { matchedSkills: matched, missingSkills: missing } = detail
  if (matched.length > 0) {
    parts.push(`${joinWithAnd(matched)} ${matched.length > 1 ? 'correspondent' : 'correspond'} à ton profil.`)
  }
  if (missing.length > 0) {
    parts.push(`${joinWithAnd(missing)} n’${missing.length > 1 ? 'apparaissent' : 'apparaît'} pas dans ton profil.`)
  }
  return parts.join(' ')
}
