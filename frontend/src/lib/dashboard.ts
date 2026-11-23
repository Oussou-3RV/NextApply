// Calculs de la page Aperçu (tableau de bord), à partir des données déjà
// fournies par l'API : aucune route dédiée côté backend.
import { isHidden } from './offers'
import type { JobOffer } from './offers'
import type { Education, Experience, Profile, Skill } from './types'

const DAY = 86_400_000

// Une candidature est à relancer après 7 jours sans nouvelles (depuis l'envoi ou la
// dernière relance). Au-delà de 30 jours après l'envoi, on arrête de la proposer.
export const FOLLOW_UP_AFTER_DAYS = 7
export const FOLLOW_UP_UNTIL_DAYS = 30

export const daysSince = (iso: string, now: Date) => Math.floor((now.getTime() - Date.parse(iso)) / DAY)

// Lundi 0 h de la semaine en cours, à l'heure locale
export function startOfWeek(now: Date): Date {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const sinceMonday = (day.getDay() + 6) % 7 // getDay() : 0 = dimanche
  day.setDate(day.getDate() - sinceMonday)
  return day
}

export interface WeekStats {
  applied: number // candidatures envoyées cette semaine
  added: number // offres ajoutées cette semaine
  toExamine: number // offres nouvelles ou vues, non masquées
}

export function weekStats(offers: JobOffer[], now: Date): WeekStats {
  const start = startOfWeek(now).getTime()
  return {
    applied: offers.filter((o) => o.appliedAt !== null && Date.parse(o.appliedAt) >= start).length,
    added: offers.filter((o) => Date.parse(o.createdAt) >= start).length,
    toExamine: offers.filter((o) => (o.status === 'nouvelle' || o.status === 'vue') && !isHidden(o)).length,
  }
}

// La plus ancienne d'abord : c'est celle qui attend depuis le plus longtemps
export function toFollowUp(offers: JobOffer[], now: Date): JobOffer[] {
  const lastContact = (o: JobOffer) => o.followedUpAt ?? o.appliedAt!
  return offers
    .filter((o) => o.status === 'postulee' && o.appliedAt !== null)
    .filter((o) => daysSince(lastContact(o), now) >= FOLLOW_UP_AFTER_DAYS)
    .filter((o) => daysSince(o.appliedAt!, now) <= FOLLOW_UP_UNTIL_DAYS)
    .sort((a, b) => Date.parse(lastContact(a)) - Date.parse(lastContact(b)))
}

// Les offres à examiner avec le meilleur score (sans score : à la fin, les plus récentes d'abord)
export function bestToExamine(offers: JobOffer[], limit = 5): JobOffer[] {
  return offers
    .filter((o) => (o.status === 'nouvelle' || o.status === 'vue') && !isHidden(o))
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1) || Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit)
}

// Prénom tel qu'on l'écrit dans une phrase : « OUSMANE » devient « Ousmane ».
// Un prénom déjà en casse mixte (« Marie-Ève », « DeShawn ») reste tel quel.
export function displayFirstName(name: string | null): string | null {
  const trimmed = name?.trim()
  if (!trimmed) return null
  if (trimmed !== trimmed.toUpperCase()) return trimmed
  return trimmed.toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (_, sep: string, letter: string) => sep + letter.toUpperCase())
}

export interface ProfileGap {
  action: string // ce qu'il faut faire
  why: string // à quoi ça sert
}

// Ce qui manque au profil et baisse les scores, le remplissage ou la lettre
export function profileGaps(profile: Profile, skills: Skill[], experiences: Experience[],
  educations: Education[]): ProfileGap[] {
  const gaps: ProfileGap[] = []
  if (skills.length === 0) {
    gaps.push({ action: 'Ajoute tes compétences.', why: 'Le score de chaque offre compare ses exigences à tes compétences.' })
  } else if (skills.length < 5) {
    gaps.push({ action: `Ajoute d’autres compétences (tu en as ${skills.length}).`,
      why: 'Plus la liste est complète, plus le score est juste.' })
  }
  if (experiences.length === 0) {
    gaps.push({ action: 'Ajoute tes expériences : emplois, stages, projets.',
      why: 'Elles comptent pour tes années d’expérience et nourrissent la lettre.' })
  } else if (experiences.some((e) => e.relevant && !e.startDate)) {
    gaps.push({ action: 'Date tes expériences pertinentes.', why: 'Sans date de début, une expérience ne compte pas dans tes années.' })
  }
  if (educations.length === 0) {
    gaps.push({ action: 'Ajoute ta scolarité.', why: 'Les formulaires la demandent presque toujours.' })
  }
  const contact: [keyof Profile, string][] = [
    ['firstName', 'prénom'], ['lastName', 'nom'], ['contactEmail', 'courriel'], ['phone', 'téléphone'], ['city', 'ville'],
  ]
  const missing = contact.filter(([key]) => !profile[key]).map(([, label]) => label)
  if (missing.length > 0) {
    gaps.push({ action: `Complète tes coordonnées : ${missing.join(', ')}.`,
      why: 'L’extension s’en sert pour remplir les formulaires.' })
  }
  if (!profile.linkedinUrl) {
    gaps.push({ action: 'Ajoute ton profil LinkedIn.', why: 'Beaucoup de formulaires le demandent.' })
  }
  if (!profile.summary) {
    gaps.push({ action: 'Écris quelques phrases de résumé.', why: 'La lettre de motivation s’appuie dessus.' })
  }
  return gaps
}
