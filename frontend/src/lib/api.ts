import { supabase } from './supabase'
import type {
  Education,
  EducationInput,
  Experience,
  ExperienceInput,
  Profile,
  ProfileInput,
  Skill,
  SkillInput,
} from './types'

export interface Me {
  id: string
  email: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

// Erreur renvoyée par le backend au format ProblemDetail :
// { status, detail, errors: { champ: message } }
export class ApiError extends Error {
  readonly status: number
  readonly fieldErrors: Record<string, string>

  constructor(status: number, message: string, fieldErrors: Record<string, string> = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.fieldErrors = fieldErrors
  }
}

// Toutes les requêtes passent par ici : on ajoute le jeton Supabase et on
// transforme les réponses d'erreur en ApiError
async function request<T>(path: string, options: { method?: string; body?: unknown } = {}): Promise<T> {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new ApiError(401, 'Non connecté')

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
    // fetch échoue sans réponse : serveur arrêté, ou requête bloquée par le CORS
    throw new ApiError(0, 'Impossible de joindre le serveur. Le backend est-il démarré ?')
  }

  if (response.status === 204) return undefined as T

  if (!response.ok) {
    const problem = await response.json().catch(() => null)
    throw new ApiError(
      response.status,
      problem?.detail ?? `Erreur ${response.status}`,
      problem?.errors ?? {},
    )
  }

  return response.json() as Promise<T>
}

export const fetchMe = () => request<Me>('/api/me')

export const api = {
  getProfile: () => request<Profile>('/api/profile'),
  updateProfile: (input: ProfileInput) =>
    request<Profile>('/api/profile', { method: 'PUT', body: input }),

  listEducations: () => request<Education[]>('/api/educations'),
  createEducation: (input: EducationInput) =>
    request<Education>('/api/educations', { method: 'POST', body: input }),
  updateEducation: (id: string, input: EducationInput) =>
    request<Education>(`/api/educations/${id}`, { method: 'PUT', body: input }),
  deleteEducation: (id: string) =>
    request<void>(`/api/educations/${id}`, { method: 'DELETE' }),

  listExperiences: () => request<Experience[]>('/api/experiences'),
  createExperience: (input: ExperienceInput) =>
    request<Experience>('/api/experiences', { method: 'POST', body: input }),
  updateExperience: (id: string, input: ExperienceInput) =>
    request<Experience>(`/api/experiences/${id}`, { method: 'PUT', body: input }),
  deleteExperience: (id: string) =>
    request<void>(`/api/experiences/${id}`, { method: 'DELETE' }),

  listSkills: () => request<Skill[]>('/api/skills'),
  createSkill: (input: SkillInput) =>
    request<Skill>('/api/skills', { method: 'POST', body: input }),
  deleteSkill: (id: string) =>
    request<void>(`/api/skills/${id}`, { method: 'DELETE' }),
}

// Message à afficher pour n'importe quelle erreur attrapée
export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Erreur inattendue'
}

// Erreurs par champ, si le backend en a renvoyé (400 de validation)
export function fieldErrorsOf(error: unknown): Record<string, string> {
  return error instanceof ApiError ? error.fieldErrors : {}
}

// Utilisé par lib/offers.ts (les offres ont leur propre fichier)
export { request }
