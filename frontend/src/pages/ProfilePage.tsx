import { FileUp } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { ChangeEvent } from 'react'
import Message from '../components/Message'
import { api, errorMessage } from '../lib/api'
import type { CvProposal, Education, Experience, Skill } from '../lib/types'
import CvReview from './profile/CvReview'
import EducationsPanel from './profile/EducationsPanel'
import ExperiencesPanel from './profile/ExperiencesPanel'
import IdentityPanel from './profile/IdentityPanel'
import SkillsPanel from './profile/SkillsPanel'

type Tab = 'identite' | 'experiences' | 'scolarite' | 'competences'

const MAX_CV_SIZE = 5 * 1024 * 1024 // même limite que le backend

// Les listes sont chargées ici (et non dans chaque panneau) pour afficher
// leur nombre dans les onglets, comme sur la maquette des offres
export default function ProfilePage() {
  const [tab, setTab] = useState<Tab>('identite')
  const [experiences, setExperiences] = useState<Experience[]>([])
  const [educations, setEducations] = useState<Education[]>([])
  const [skills, setSkills] = useState<Skill[]>([])
  const [error, setError] = useState<string | null>(null)

  // Import du CV : analyse en cours, puis proposition à relire
  const fileInput = useRef<HTMLInputElement>(null)
  const [analyzing, setAnalyzing] = useState(false)
  const [proposal, setProposal] = useState<CvProposal | null>(null)
  const [importError, setImportError] = useState<string | null>(null)
  const [importDone, setImportDone] = useState<string | null>(null)

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

  async function handleFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = '' // pour pouvoir choisir de nouveau le même fichier
    if (!file) return
    setImportError(null)
    setImportDone(null)
    // Vérifications rapides avant l'envoi ; le backend refait les siennes
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setImportError('Choisis un fichier PDF. Exporte ton CV en PDF depuis Word ou Google Docs.')
      return
    }
    if (file.size > MAX_CV_SIZE) {
      setImportError('Le fichier dépasse 5 Mo. Enregistre une version plus légère de ton CV, puis réessaie.')
      return
    }
    setAnalyzing(true)
    try {
      setProposal(await api.analyzeCv(file))
    } catch (e) {
      setImportError(errorMessage(e))
    } finally {
      setAnalyzing(false)
    }
  }

  // Pendant la relecture, l'écran d'import remplace les onglets du profil
  if (proposal) {
    return (
      <CvReview proposal={proposal} educations={educations} experiences={experiences} skills={skills}
        onSaved={() => {
          loadExperiences()
          loadEducations()
          loadSkills()
        }}
        onClose={(message) => {
          setProposal(null)
          setImportDone(message ?? null)
        }} />
    )
  }

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

      <div className="boutons import-cv">
        <button type="button" className="bouton bouton--contour" disabled={analyzing}
          onClick={() => fileInput.current?.click()}>
          <FileUp size={20} aria-hidden="true" />
          {analyzing ? 'Analyse du CV…' : 'Importer mon CV'}
        </button>
        {/* Le vrai champ fichier est caché : le bouton ci-dessus l'ouvre */}
        <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={handleFile} />
        {analyzing && <Message kind="info">L’IA lit ton CV. Cela prend souvent 10 à 30 secondes.</Message>}
        {!analyzing && !importError && !importDone && (
          <span className="secondaire">PDF de 5 Mo au plus. Tu relis tout avant l’enregistrement.</span>
        )}
        {importError && <Message kind="erreur">{importError}</Message>}
        {importDone && <Message kind="succes">{importDone}</Message>}
      </div>

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
