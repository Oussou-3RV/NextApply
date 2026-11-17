// Types des réponses de l'API, calqués sur les DTO (records Java) du backend.
// Les dates arrivent en texte : "2025-09-01" (LocalDate) ou ISO complet (Instant).

export interface Profile {
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
  summary: string | null
  createdAt: string | null
  updatedAt: string | null
}

// Ce qu'on envoie : la même chose sans les dates gérées par le serveur
export type ProfileInput = Omit<Profile, 'createdAt' | 'updatedAt'>

export interface Education {
  id: string
  institution: string
  program: string
  level: string | null
  startDate: string | null
  endDate: string | null // null = en cours
  description: string | null
  createdAt: string
  updatedAt: string
}

export type EducationInput = Omit<Education, 'id' | 'createdAt' | 'updatedAt'>

// Mêmes valeurs que la contrainte chk_experiences_kind de la base
export const EXPERIENCE_KINDS = ['emploi', 'stage', 'projet', 'benevolat'] as const
export type ExperienceKind = (typeof EXPERIENCE_KINDS)[number]

export interface Experience {
  id: string
  company: string
  title: string
  kind: ExperienceKind
  location: string | null
  startDate: string | null
  endDate: string | null // null = en cours
  description: string | null
  relevant: boolean
  createdAt: string
  updatedAt: string
}

export type ExperienceInput = Omit<Experience, 'id' | 'createdAt' | 'updatedAt'>

export interface Skill {
  id: string
  name: string
  category: string | null
  createdAt: string
}

export type SkillInput = Pick<Skill, 'name' | 'category'>

// Proposition de l'IA (POST /api/cv/analyze). Mêmes champs que les saisies,
// mais tout peut manquer : l'IA n'a pas toujours trouvé l'information.
export type ProposedEducation = { [K in keyof EducationInput]: string | null }
export type ProposedExperience = {
  [K in keyof ExperienceInput]: K extends 'kind' ? ExperienceKind | null
    : K extends 'relevant' ? boolean | null
    : string | null
}

export interface CvProposal {
  profile: ProfileInput
  educations: ProposedEducation[]
  experiences: ProposedExperience[]
  skills: SkillInput[]
}
