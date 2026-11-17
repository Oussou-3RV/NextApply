import { ExternalLink } from 'lucide-react'
import { useEffect, useState } from 'react'
import Message from '../components/Message'
import { errorMessage } from '../lib/api'
import {
  experienceSentence,
  formatAppliedDate,
  offersApi,
  scoreSentence,
} from '../lib/offers'
import type { OfferDetail, OfferStatus } from '../lib/offers'
import { hrefOf } from '../lib/router'
import ApplicationSheet from './offer/ApplicationSheet'
import CoverLetterTab from './offer/CoverLetterTab'
import '../styles/fiche.css'

type Tab = 'fiche' | 'lettre' | 'texte'

const TABS: { id: Tab; label: string }[] = [
  { id: 'fiche', label: 'Fiche de candidature' },
  { id: 'lettre', label: 'Lettre de motivation' },
  { id: 'texte', label: 'Texte de l’offre' },
]

const addedOn = new Intl.DateTimeFormat('fr-CA', { day: 'numeric', month: 'short' })

// La fiche d'une offre (docs/design/Fiche d'une offre.png)
export default function OfferPage({ id }: { id: string }) {
  const [detail, setDetail] = useState<OfferDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('fiche')
  const [scoring, setScoring] = useState(false)

  useEffect(() => {
    offersApi.detail(id)
      .then(async (d) => {
        // Ouvrir la fiche fait passer l'offre de « Nouvelle » à « Vue »
        if (d.offer.status === 'nouvelle') {
          const offer = await offersApi.setStatus(id, 'vue')
          return { ...d, offer }
        }
        return d
      })
      .then(setDetail)
      .catch((e: unknown) => setError(errorMessage(e)))
  }, [id])

  async function changeStatus(status: OfferStatus) {
    if (!detail) return
    setError(null)
    try {
      const offer = await offersApi.setStatus(id, status)
      setDetail({ ...detail, offer })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function computeScore() {
    setScoring(true)
    setError(null)
    try {
      setDetail(await offersApi.analyzeSkills(id))
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setScoring(false)
    }
  }

  if (!detail) {
    return (
      <>
        <a className="lien" href={hrefOf('offres')}>Retour aux offres</a>
        {error ? <div className="chapeau"><Message kind="erreur">{error}</Message></div>
          : <p className="chapeau">Chargement de l’offre…</p>}
      </>
    )
  }

  const { offer } = detail
  const where = [offer.location, `Ajoutée le ${addedOn.format(new Date(offer.createdAt))}`].filter(Boolean).join('. ')

  return (
    <>
      <a className="lien" href={hrefOf('offres')}>Retour aux offres</a>
      {offer.company && <p className="fiche-entreprise">{offer.company}</p>}
      <h1 className="titre-offre">{offer.title}</h1>
      <p className="fiche-lieu">{where.endsWith('.') ? where : `${where}.`}</p>

      <section className="encadre" aria-label="Expérience et score">
        <h2 className="encadre-titre">{experienceSentence(offer, detail.myExperienceYears)}</h2>
        {detail.skillsAnalyzed ? (
          <p className="encadre-texte">{scoreSentence(detail)}</p>
        ) : (
          <div className="encadre-texte">
            <p>
              Le score n’est pas encore calculé pour cette offre : elle a été ajoutée avant cette fonction.
            </p>
            <button type="button" className="bouton bouton--contour encadre-bouton" onClick={computeScore}
              disabled={scoring}>
              {scoring ? 'Calcul du score…' : 'Calculer le score'}
            </button>
          </div>
        )}
      </section>

      <div className="boutons fiche-actions">
        {offer.status === 'postulee' ? (
          <>
            <p className="statut">
              <span className="marque marque--postulee" aria-hidden="true" />
              Postulée le {offer.appliedAt ? formatAppliedDate(offer.appliedAt) : ''}
            </p>
            <button type="button" className="lien" onClick={() => changeStatus('vue')}>Remettre à examiner</button>
          </>
        ) : (
          <button type="button" className="bouton" onClick={() => changeStatus('postulee')}>
            Marquer comme postulée
          </button>
        )}
        <a className="bouton bouton--contour" href={offer.url} target="_blank" rel="noreferrer">
          Ouvrir l’offre
          <ExternalLink size={18} aria-hidden="true" />
        </a>
      </div>
      {error && <div className="chapeau"><Message kind="erreur">{error}</Message></div>}

      <div className="onglets" role="tablist" aria-label="Parties de la fiche">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" className="onglet" id={`onglet-${t.id}`}
            aria-controls={`panneau-${t.id}`} aria-selected={tab === t.id} onClick={() => setTab(t.id)}>
            {t.label}
          </button>
        ))}
      </div>

      <section className="panneau" role="tabpanel" id={`panneau-${tab}`} aria-labelledby={`onglet-${tab}`}>
        {tab === 'fiche' && <ApplicationSheet myExperienceYears={detail.myExperienceYears} />}
        {tab === 'lettre' && <CoverLetterTab detail={detail} onChange={setDetail} />}
        {tab === 'texte' && <p className="texte-offre">{detail.description}</p>}
      </section>
    </>
  )
}
