import { Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import Message from '../components/Message'
import { errorMessage } from '../lib/api'
import { formatAppliedDate, formatExperience, isHidden, offersApi } from '../lib/offers'
import type { JobOffer, OfferList, OfferStatus } from '../lib/offers'
import '../styles/offres.css'

type Tab = 'toutes' | 'nouvelle' | 'vue' | 'postulee'

const TABS: { id: Tab; label: string }[] = [
  { id: 'toutes', label: 'Toutes' },
  { id: 'nouvelle', label: 'Nouvelles' },
  { id: 'vue', label: 'Vues' },
  { id: 'postulee', label: 'Postulées' },
]

export default function OffersPage() {
  const [data, setData] = useState<OfferList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [tab, setTab] = useState<Tab>('toutes')
  const [showHidden, setShowHidden] = useState(false)

  useEffect(() => {
    offersApi.list().then(setData).catch((e: unknown) => setError(errorMessage(e)))
  }, [])

  // Après une action, on remplace l'offre par la réponse du serveur
  function replace(updated: JobOffer) {
    setData((d) => d && { ...d, offers: d.offers.map((o) => (o.id === updated.id ? updated : o)) })
  }

  async function changeStatus(offer: JobOffer, status: OfferStatus) {
    setError(null)
    try {
      replace(await offersApi.setStatus(offer.id, status))
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  async function remove(offer: JobOffer) {
    if (!window.confirm(`Supprimer « ${offer.title} » ? C'est définitif.`)) return
    setError(null)
    try {
      await offersApi.remove(offer.id)
      setData((d) => d && { ...d, offers: d.offers.filter((o) => o.id !== offer.id) })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (!data) {
    return (
      <>
        <h1 className="titre-page">Offres</h1>
        {error ? <div className="chapeau"><Message kind="erreur">{error}</Message></div>
          : <p className="chapeau">Chargement des offres…</p>}
      </>
    )
  }

  const visible = data.offers.filter((o) => !isHidden(o))
  const hidden = data.offers.filter(isHidden)
  const count = (t: Tab) => (t === 'toutes' ? visible.length : visible.filter((o) => o.status === t).length)
  const shown = tab === 'toutes' ? visible : visible.filter((o) => o.status === tab)
  const toExamine = shown.filter((o) => o.status === 'nouvelle' || o.status === 'vue')
  const applied = shown.filter((o) => o.status === 'postulee')

  const rowProps = { myYears: data.myExperienceYears, onStatus: changeStatus, onRemove: remove }

  return (
    <>
      <h1 className="titre-page">Offres</h1>
      {data.offers.length === 0 ? (
        <p className="chapeau">
          Aucune offre pour l’instant. Sur la page d’une offre, clique sur l’extension NextApply,
          puis sur « Ajouter à NextApply ».
        </p>
      ) : (
        <p className="chapeau">
          {hiddenSentence(hidden)}
          {hidden.length > 0 && (
            <>
              {' '}
              <button type="button" className="lien" onClick={() => setShowHidden((s) => !s)}
                aria-expanded={showHidden} aria-controls="offres-masquees">
                {showHidden ? 'Cacher les masquées' : 'Voir les masquées'}
              </button>
            </>
          )}
        </p>
      )}
      {error && <div className="chapeau"><Message kind="erreur">{error}</Message></div>}

      {data.offers.length > 0 && (
        <div className="onglets" role="tablist" aria-label="Filtrer les offres par statut">
          {TABS.map((t) => (
            <button key={t.id} type="button" role="tab" className="onglet" id={`onglet-${t.id}`}
              aria-selected={tab === t.id} aria-controls="liste-offres" onClick={() => setTab(t.id)}>
              {t.label}<span className="nombre"> {count(t.id)}</span>
            </button>
          ))}
        </div>
      )}

      <div id="liste-offres" role="tabpanel" aria-labelledby={`onglet-${tab}`}>
        {data.offers.length > 0 && shown.length === 0 && (
          <p className="vide">Aucune offre dans cette catégorie.</p>
        )}
        {toExamine.length > 0 && (
          <OfferSection title="À examiner" offers={toExamine} {...rowProps} />
        )}
        {applied.length > 0 && (
          <OfferSection title="Postulées" offers={applied} {...rowProps} />
        )}
      </div>

      {showHidden && hidden.length > 0 && (
        <div id="offres-masquees">
          <OfferSection title="Masquées" offers={hidden} {...rowProps} />
        </div>
      )}
    </>
  )
}

// « 4 autres offres sont masquées parce qu'elles exigent plus d'expérience que toi. »
function hiddenSentence(hidden: JobOffer[]): string {
  if (hidden.length === 0) return 'Les offres qui exigent trop d’expérience pour toi seront masquées ici.'
  const byMe = hidden.filter((o) => o.status === 'masquee').length
  const byExperience = hidden.length - byMe
  const parts = []
  if (byExperience > 0) {
    parts.push(byExperience > 1
      ? `${byExperience} autres offres sont masquées parce qu’elles exigent plus d’expérience que toi.`
      : '1 autre offre est masquée parce qu’elle exige plus d’expérience que toi.')
  }
  if (byMe > 0) {
    parts.push(byMe > 1 ? `${byMe} offres ont été masquées par toi.` : '1 offre a été masquée par toi.')
  }
  return parts.join(' ')
}

interface RowProps {
  myYears: number
  onStatus: (offer: JobOffer, status: OfferStatus) => void
  onRemove: (offer: JobOffer) => void
}

function OfferSection({ title, offers, ...rowProps }: RowProps & { title: string; offers: JobOffer[] }) {
  return (
    <section className="offres-partie" aria-label={title}>
      <h2 className="titre-section">{title}</h2>
      <ul className="liste">
        {offers.map((o) => <OfferRow key={o.id} offer={o} {...rowProps} />)}
      </ul>
    </section>
  )
}

function OfferRow({ offer, myYears, onStatus, onRemove }: RowProps & { offer: JobOffer }) {
  const masked = isHidden(offer)
  // Ouvrir l'offre la fait passer de « Nouvelle » à « Vue »
  const handleOpen = () => {
    if (offer.status === 'nouvelle') onStatus(offer, 'vue')
  }

  return (
    <li className={`ligne ligne--offre${masked ? ' ligne--masquee' : ''}`}>
      <StatusLabel offer={offer} />
      <div>
        <a className="ligne-titre lien-offre" href={offer.url} target="_blank" rel="noreferrer" onClick={handleOpen}>
          {offer.title}
        </a>
        {offer.company && <div className="secondaire">{offer.company}</div>}
        <div className="offre-actions">
          {offer.status === 'postulee' ? (
            <button type="button" className="lien" onClick={() => onStatus(offer, 'vue')}>Remettre à examiner</button>
          ) : (
            <button type="button" className="lien" onClick={() => onStatus(offer, 'postulee')}>Marquer comme postulée</button>
          )}
          {offer.status === 'masquee' ? (
            <button type="button" className="lien" onClick={() => onStatus(offer, 'vue')}>Afficher</button>
          ) : offer.status !== 'postulee' && !masked && (
            <button type="button" className="lien" onClick={() => onStatus(offer, 'masquee')}>Masquer</button>
          )}
        </div>
      </div>
      <div>{offer.location ?? <span className="secondaire">Lieu non précisé</span>}</div>
      <div>
        <div className="offre-annees">{formatExperience(offer.experienceMin, offer.experienceMax)}</div>
        {offer.experienceFit === 'ecart' && <div className="secondaire">1 an de plus que toi</div>}
        {offer.experienceFit === 'trop' && <div className="secondaire">Tu en as {myYears}</div>}
      </div>
      <div className="ligne-actions">
        <button type="button" className="bouton-icone" onClick={() => onRemove(offer)}
          aria-label={`Supprimer « ${offer.title} »`} title="Supprimer">
          <Trash2 size={20} aria-hidden="true" />
        </button>
      </div>
    </li>
  )
}

// La forme dit le statut : point rouge plein, cercle vide, point bleu plein, trait
function StatusLabel({ offer }: { offer: JobOffer }) {
  if (isHidden(offer)) {
    return <span className="statut"><span className="marque marque--masquee" aria-hidden="true" />Masquée</span>
  }
  if (offer.status === 'postulee' && offer.appliedAt) {
    return (
      <span className="statut">
        <span className="marque marque--postulee" aria-hidden="true" />
        Postulée le {formatAppliedDate(offer.appliedAt)}
      </span>
    )
  }
  const isNew = offer.status === 'nouvelle'
  return (
    <span className="statut">
      <span className={`marque ${isNew ? 'marque--nouvelle' : 'marque--vue'}`} aria-hidden="true" />
      {isNew ? 'Nouvelle' : 'Vue'}
    </span>
  )
}
