import type { FillProfile } from '../shared/types'
import { supabase } from './supabase'

// Doit correspondre à une entrée "host_permissions" de manifest.json
const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// Même forme que ProfileResponse côté backend (seuls les champs utiles ici)
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

export class SessionExpiredError extends Error {}

export async function fetchProfile(): Promise<Profile> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new SessionExpiredError('Non connecté')

  let response: Response
  try {
    response = await fetch(`${API_URL}/api/profile`, { headers: { Authorization: `Bearer ${token}` } })
  } catch {
    throw new Error('Impossible de joindre le serveur NextApply. Lance le backend, puis réessaie.')
  }
  if (response.status === 401) throw new SessionExpiredError('Session expirée')
  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new Error(problem?.detail ?? `Le serveur a répondu ${response.status}. Réessaie dans un moment.`)
  }
  return response.json() as Promise<Profile>
}

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
