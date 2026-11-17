import type { FillProfile } from '../shared/types'
import { supabase } from './supabase'

// Doit correspondre à une entrée "host_permissions" de manifest.json
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// ---------- Types calqués sur les DTO du backend ----------

// ProfileResponse (seuls les champs utiles ici)
interface Profile {
  firstName: string | null
  lastName: string | null
  contactEmail: string | null
  phone: string | null
  city: string | null
  region: string | null
  country: string | null
  linkedinUrl: string | null
  githubUrl: string | null
  portfolioUrl: string | null
}

export type OfferStatus = 'nouvelle' | 'vue' | 'postulee' | 'masquee'
export type ExperienceFit = 'inconnu' | 'ok' | 'ecart' | 'trop'

// JobOfferResponse
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

// OfferPageResponse : ce que l'extension affiche pour la page ouverte
export interface OfferPage {
  offer: JobOffer
  possibleDuplicate: JobOffer | null
  created: boolean
  myExperienceYears: number
}

// ---------- Appels ----------

export class SessionExpiredError extends Error {}

export class ApiError extends Error {
  readonly status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

// Toutes les requêtes passent par ici : jeton Supabase, JSON, erreurs ProblemDetail
async function call<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new SessionExpiredError('Non connecté')

  const headers: Record<string, string> = { Authorization: `Bearer ${token}` }
  if (options.body !== undefined) headers['Content-Type'] = 'application/json'

  let response: Response
  try {
    response = await fetch(`${API_URL}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    })
  } catch {
    throw new Error('Impossible de joindre le serveur NextApply. Lance le backend, puis réessaie.')
  }
  if (response.status === 401) throw new SessionExpiredError('Session expirée')
  if (response.status === 204) return undefined as T
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new ApiError(response.status, problem?.detail ?? `Le serveur a répondu ${response.status}. Réessaie dans un moment.`)
  }
  return response.json() as Promise<T>
}

export const fetchProfile = () => call<Profile>('/api/profile')

// null si la page n'est pas encore une de mes offres (404)
export async function lookupOffer(url: string): Promise<OfferPage | null> {
  try {
    return await call<OfferPage>(`/api/offers/lookup?url=${encodeURIComponent(url)}`)
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return null
    throw e
  }
}

export const addOffer = (url: string, pageTitle: string, text: string) =>
  call<OfferPage>('/api/offers', { method: 'POST', body: { url, pageTitle, text } })

export const setOfferStatus = (id: string, status: OfferStatus) =>
  call<JobOffer>(`/api/offers/${id}/status`, { method: 'PUT', body: { status } })

export const deleteOffer = (id: string) => call<void>(`/api/offers/${id}`, { method: 'DELETE' })

// ---------- Profil → valeurs à écrire dans les formulaires ----------

const join = (parts: (string | null)[], separator: string) =>
  parts.filter((p): p is string => Boolean(p && p.trim())).join(separator) || null

// Prépare les valeurs à écrire, y compris celles que certains sites demandent
// d'un seul tenant (nom complet, « Ville, région »)
export function toFillProfile(p: Profile): FillProfile {
  return {
    firstName: p.firstName,
    lastName: p.lastName,
    fullName: join([p.firstName, p.lastName], ' '),
    email: p.contactEmail,
    phone: p.phone,
    city: p.city,
    region: p.region,
    country: p.country,
    location: join([p.city, p.region], ', '),
    linkedin: p.linkedinUrl,
    github: p.githubUrl,
    portfolio: p.portfolioUrl,
  }
}
