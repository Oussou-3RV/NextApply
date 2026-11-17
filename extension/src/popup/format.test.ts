import { describe, expect, it } from 'vitest'
import type { JobOffer } from './api'
import { experienceSentence, formatExperience, statusLabel } from './format'

const offer = (patch: Partial<JobOffer>): JobOffer => ({
  id: '1', url: 'https://exemple.ca/1', title: 'Stage Java', company: 'Atelier Nord', location: null,
  experienceMin: 0, experienceMax: 1, experienceFit: 'ok', status: 'nouvelle', appliedAt: null,
  createdAt: '2026-11-10T10:00:00Z', ...patch,
})

describe('formatExperience', () => {
  it('écrit les fourchettes comme la maquette', () => {
    expect(formatExperience(0, 1)).toBe('0 à 1 an')
    expect(formatExperience(1, 2)).toBe('1 à 2 ans')
    expect(formatExperience(2, null)).toBe('au moins 2 ans')
    expect(formatExperience(null, null)).toBeNull()
  })
})

describe('experienceSentence', () => {
  it('reprend la phrase de la fiche quand j’ai l’expérience', () => {
    expect(experienceSentence(offer({}), 1))
      .toBe('L’offre demande 0 à 1 an d’expérience. Tu en as 1 : tu peux postuler.')
  })

  it('prévient quand il manque un an, ou plus', () => {
    expect(experienceSentence(offer({ experienceMin: 2, experienceMax: 3, experienceFit: 'ecart' }), 1))
      .toContain('il te manque un an')
    expect(experienceSentence(offer({ experienceMin: 5, experienceMax: null, experienceFit: 'trop' }), 1))
      .toContain('elle sera masquée')
  })

  it('le dit quand l’offre ne précise rien', () => {
    expect(experienceSentence(offer({ experienceMin: null, experienceMax: null, experienceFit: 'inconnu' }), 1))
      .toBe('L’offre ne précise pas l’expérience demandée.')
  })
})

describe('statusLabel', () => {
  it('donne la date de candidature', () => {
    expect(statusLabel(offer({ status: 'postulee', appliedAt: '2026-11-12T15:00:00Z' }))).toBe('Postulée le 12 nov.')
    expect(statusLabel(offer({ status: 'vue' }))).toBe('Vue')
  })
})
