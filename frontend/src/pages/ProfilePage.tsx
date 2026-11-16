import { useCallback, useEffect, useState } from 'react'
import Message from '../components/Message'
import { api, errorMessage } from '../lib/api'
import type { Education, Experience, Skill } from '../lib/types'
import EducationsPanel from './profile/EducationsPanel'
import ExperiencesPanel from './profile/ExperiencesPanel'
import IdentityPanel from './profile/IdentityPanel'
import SkillsPanel from './profile/SkillsPanel'

type Tab = 'identite' | 'experiences' | 'scolarite' | 'competences'

// Les listes sont chargées ici (et non dans chaque panneau) pour afficher
// leur nombre dans les onglets, comme sur la maquette des offres
export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('identite')
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [educations, setEducations] = useState<Education[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [error, setError] = useState<string | null>(null)

  const loadExperiences = useCallback(
    () => api.listExperiences().then(setExperiences).catch((e: unknown) => setError(errorMessage(e))), [])
  const loadEducations = useCallback(
    () => api.listEducations().then(setEducations).catch((e: unknown) => setError(errorMessage(e))), [])
  const loadSkills = useCallback(
    () => api.listSkills().then(setSkills).catch((e: unknown) => setError(errorMessage(e))), [])

  useEffect(() => {
    loadExperiences()
    loadEducations()
    loadSkills()
  }, [loadExperiences, loadEducations, loadSkills])

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: 'identite', label: 'Identité' },
    { id: 'experiences', label: 'Expériences', count: experiences.length },
    { id: 'scolarite', label: 'Scolarité', count: educations.length },
    { id: 'competences', label: 'Compétences', count: skills.length },
  ]

  return (
    <>
      <h1 className="titre-page">Profil</h1>
      <p className="chapeau">
        Ces informations remplissent tes formulaires de candidature et servent à calculer
        le score de chaque offre.
      </p>
      {error && <div className="chapeau"><Message kind="erreur">{error}</Message></div>}

      <div className="onglets" role="tablist" aria-label="Parties du profil">
        {tabs.map((t) => (
          <button key={t.id} type="button" role="tab" className="onglet"
            id={`onglet-${t.id}`} aria-controls={`panneau-${t.id}`}
            aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
            {t.count !== undefined && <span className="nombre"> {t.count}</span>}
          </button>
        ))}
      </div>

      <section className="panneau" role="tabpanel" id={`panneau-${tab}`} aria-labelledby={`onglet-${tab}`}>
        {tab === 'identite' && <IdentityPanel />}
        {tab === 'experiences' && <ExperiencesPanel items={experiences} onChanged={loadExperiences} />}
        {tab === 'scolarite' && <EducationsPanel items={educations} onChanged={loadEducations} />}
        {tab === 'competences' && <SkillsPanel items={skills} onChanged={loadSkills} />}
      </section>
    </>
  )
}
