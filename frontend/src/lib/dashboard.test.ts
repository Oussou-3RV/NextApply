import { describe, expect, it } from 'vitest'
import { bestToExamine, profileGaps, startOfWeek, toFollowUp, weekStats } from './dashboard'
import type { JobOffer } from './offers'
import type { Profile } from './types'

// Lundi 16 novembre 2026, 15 h (heure locale)
const NOW = new Date(2026, 10, 16, 15, 0)
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000).toISOString()

let id = 0
const offer = (patch: Partial<JobOffer>): JobOffer => ({
  id: String(++id), url: 'https://exemple.ca', title: 'Offre', company: 'Acme', location: null,
  experienceMin: null, experienceMax: null, experienceFit: 'inconnu', score: null, skillsAnalyzed: true,
  status: 'nouvelle', appliedAt: null, followedUpAt: null, createdAt: daysAgo(20), ...patch,
})

describe('startOfWeek', () => {
  it('revient au lundi 0 h, même un dimanche', () => {
    expect(startOfWeek(NOW)).toEqual(new Date(2026, 10, 16))
    expect(startOfWeek(new Date(2026, 10, 22, 23, 0))).toEqual(new Date(2026, 10, 16)) // dimanche 22
  })
})

describe('weekStats', () => {
  it('compte depuis lundi, et ignore les offres masquées dans « à examiner »', () => {
    const stats = weekStats([
      offer({ status: 'postulee', appliedAt: daysAgo(0), createdAt: daysAgo(0) }),
      offer({ status: 'postulee', appliedAt: daysAgo(3) }), // jeudi dernier : semaine précédente
      offer({ status: 'vue' }),
      offer({ status: 'nouvelle', experienceFit: 'trop' }), // masquée
    ], NOW)
    expect(stats).toEqual({ applied: 1, added: 1, toExamine: 1 })
  })
})

describe('toFollowUp', () => {
  it('propose après 7 jours, la plus ancienne d’abord, et plus après 30 jours', () => {
    const recent = offer({ title: 'Il y a 3 jours', status: 'postulee', appliedAt: daysAgo(3) })
    const old = offer({ title: 'Il y a 20 jours', status: 'postulee', appliedAt: daysAgo(20) })
    const week = offer({ title: 'Il y a 8 jours', status: 'postulee', appliedAt: daysAgo(8) })
    const relaunched = offer({ title: 'Relancée hier', status: 'postulee', appliedAt: daysAgo(15), followedUpAt: daysAgo(1) })
    const tooOld = offer({ title: 'Il y a 40 jours', status: 'postulee', appliedAt: daysAgo(40) })
    expect(toFollowUp([recent, week, old, relaunched, tooOld], NOW).map((o) => o.title))
      .toEqual(['Il y a 20 jours', 'Il y a 8 jours'])
  })
})

describe('bestToExamine', () => {
  it('trie par score, les offres sans score à la fin', () => {
    const list = bestToExamine([
      offer({ title: 'Sans score' }), offer({ title: '64', score: 64 }), offer({ title: '78', score: 78, status: 'vue' }),
      offer({ title: 'Postulée', score: 99, status: 'postulee', appliedAt: daysAgo(1) }),
    ])
    expect(list.map((o) => o.title)).toEqual(['78', '64', 'Sans score'])
  })
})

describe('profileGaps', () => {
  const profile: Profile = {
    firstName: 'Camille', lastName: 'Tremblay', contactEmail: 'camille@example.com', phone: null, city: null,
    region: null, country: null, linkedinUrl: null, githubUrl: null, portfolioUrl: null, summary: null,
    createdAt: null, updatedAt: null,
  }

  it('liste ce qui manque, avec la raison', () => {
    const gaps = profileGaps(profile, [], [], [])
    expect(gaps.map((g) => g.action)).toEqual([
      'Ajoute tes compétences.',
      'Ajoute tes expériences : emplois, stages, projets.',
      'Ajoute ta scolarité.',
      'Complète tes coordonnées : téléphone, ville.',
      'Ajoute ton profil LinkedIn.',
      'Écris quelques phrases de résumé.',
    ])
  })
})
