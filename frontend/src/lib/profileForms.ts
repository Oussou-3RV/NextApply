// Valeurs des formulaires de formation et d'expérience, partagées par les
// panneaux du profil et par l'écran de relecture du CV importé.
import { toInput, toNullable } from './format'
import { EXPERIENCE_KINDS } from './types'
import type {
  EducationInput,
  ExperienceInput,
  ExperienceKind,
  ProposedEducation,
  ProposedExperience,
} from './types'

// ---------- Formation ----------
export type EducationValues = Record<keyof EducationInput, string>

export const EMPTY_EDUCATION: EducationValues = {
  institution: '', program: '', level: '', startDate: '', endDate: '', description: '',
}

// Accepte une formation enregistrée ou proposée par l'IA (champs parfois null)
export const educationToValues = (e: ProposedEducation): EducationValues => ({
  institution: toInput(e.institution), program: toInput(e.program), level: toInput(e.level),
  startDate: toInput(e.startDate), endDate: toInput(e.endDate), description: toInput(e.description),
})

export const educationToPayload = (v: EducationValues): EducationInput => ({
  institution: v.institution, program: v.program, level: toNullable(v.level),
  startDate: toNullable(v.startDate), endDate: toNullable(v.endDate), description: toNullable(v.description),
})

// ---------- Expérience ----------
export const KIND_LABELS: Record<ExperienceKind, string> = {
  emploi: 'Emploi', stage: 'Stage', projet: 'Projet', benevolat: 'Bénévolat',
}
export const KIND_OPTIONS = EXPERIENCE_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))

export interface ExperienceValues {
  company: string
  title: string
  kind: ExperienceKind
  location: string
  startDate: string
  endDate: string
  description: string
  relevant: boolean
}

export const EMPTY_EXPERIENCE: ExperienceValues = {
  company: '', title: '', kind: 'emploi', location: '', startDate: '', endDate: '',
  description: '', relevant: true,
}

export const experienceToValues = (e: ProposedExperience): ExperienceValues => ({
  company: toInput(e.company), title: toInput(e.title), kind: e.kind ?? 'emploi',
  location: toInput(e.location), startDate: toInput(e.startDate), endDate: toInput(e.endDate),
  description: toInput(e.description), relevant: e.relevant ?? true,
})

export const experienceToPayload = (v: ExperienceValues): ExperienceInput => ({
  company: v.company, title: v.title, kind: v.kind, location: toNullable(v.location),
  startDate: toNullable(v.startDate), endDate: toNullable(v.endDate),
  description: toNullable(v.description), relevant: v.relevant,
})
