import { useCallback, useState } from 'react'
import Message from '../components/Message'
import { api, errorMessage } from '../lib/api'
import { bestToExamine, daysSince, profileGaps, toFollowUp, weekStats } from '../lib/dashboard'
import type { ProfileGap } from '../lib/dashboard'
import { offersApi } from '../lib/offers'
import type { JobOffer } from '../lib/offers'
import { hrefOf, hrefOfOffer } from '../lib/router'
import type { Profile } from '../lib/types'
import { useReloadOnReturn } from '../lib/useReloadOnReturn'
import '../styles/apercu.css'

interface Data {
  offers: JobOffer[]
  profile: Profile
  gaps: ProfileGap[]
}

const days = (n: number) => (n === 0 ? 'aujourd’hui' : n === 1 ? 'hier' : `il y a ${n} jours`)

// Page Aperçu : où en est ma recherche, et quoi faire maintenant
export default function DashboardPage() {
  const [data, setData] = useState<Data | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(() => {
    Promise.all([offersApi.list(), api.getProfile(), api.listSkills(), api.listExperiences(), api.listEducations()])
      .then(([list, profile, skills, experiences, educations]) =>
        setData({ offers: list.offers, profile, gaps: profileGaps(profile, skills, experiences, educations) }))
      .catch((e: unknown) => setError(errorMessage(e)))
  }, [])
  useReloadOnReturn(load)

  async function markFollowedUp(offer: JobOffer) {
    setError(null)
    try {
      const updated = await offersApi.followUp(offer.id)
      setData((d) => d && { ...d, offers: d.offers.map((o) => (o.id === updated.id ? updated : o)) })
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  if (!data) {
    return (
      <>
        <h1 className="titre-page">Aperçu</h1>
        {error ? <div className="chapeau"><Message kind="erreur">{error}</Message></div>
          : <p className="chapeau">Chargement…</p>}
      </>
    )
  }

  const now = new Date()
  const stats = weekStats(data.offers, now)
  const followUps = toFollowUp(data.offers, now)
  const best = bestToExamine(data.offers)
  const plural = (n: number, one: string, many: string) => (n > 1 ? many : one)

  return (
    <>
      <h1 className="titre-page">Aperçu</h1>
      <p className="chapeau">
        {data.profile.firstName ? `Bonjour ${data.profile.firstName}. ` : ''}
        Voici où en est ta recherche cette semaine.
      </p>
      {error && <div className="chapeau"><Message kind="erreur">{error}</Message></div>}

      <ul className="chiffres" aria-label="Cette semaine">
        <li>
          <span className="chiffre">{stats.applied}</span>
          {plural(stats.applied, 'candidature envoyée', 'candidatures envoyées')} depuis lundi
        </li>
        <li>
          <span className="chiffre">{stats.added}</span>
          {plural(stats.added, 'offre ajoutée', 'offres ajoutées')} depuis lundi
        </li>
        <li>
          <span className="chiffre">{stats.toExamine}</span>
          {plural(stats.toExamine, 'offre à examiner', 'offres à examiner')}
        </li>
      </ul>

      <section className="apercu-partie" aria-labelledby="titre-relancer">
        <h2 className="titre-section" id="titre-relancer">À relancer</h2>
        {followUps.length === 0 ? (
          <p className="vide">Rien à relancer : tes candidatures ont moins d’une semaine, ou ont déjà été relancées.</p>
        ) : (
          <>
            <p className="chapeau">Sans nouvelles depuis une semaine : un court courriel de suivi montre ton intérêt.</p>
            <ul className="liste">
              {followUps.map((o) => (
                <li key={o.id} className="ligne ligne--apercu">
                  <span className="statut">
                    <span className="marque marque--postulee" aria-hidden="true" />
                    {o.followedUpAt
                      ? `Relancée ${days(daysSince(o.followedUpAt, now))}`
                      : `Postulée ${days(daysSince(o.appliedAt!, now))}`}
                  </span>
                  <OfferTitle offer={o} />
                  <div className="ligne-actions">
                    <button type="button" className="lien" onClick={() => markFollowedUp(o)}>Marquer comme relancée</button>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      <section className="apercu-partie" aria-labelledby="titre-commencer">
        <div className="entete-panneau">
          <h2 className="titre-section" id="titre-commencer">Par où commencer</h2>
          <a className="lien" href={hrefOf('offres')}>Voir toutes les offres</a>
        </div>
        {best.length === 0 ? (
          <p className="vide">
            Aucune offre à examiner. Sur la page d’une offre, clique sur l’extension NextApply,
            puis sur « Ajouter à NextApply ».
          </p>
        ) : (
          <ul className="liste">
            {best.map((o) => (
              <li key={o.id} className="ligne ligne--apercu">
                <span className="statut">
                  <span className={`marque ${o.status === 'nouvelle' ? 'marque--nouvelle' : 'marque--vue'}`} aria-hidden="true" />
                  {o.status === 'nouvelle' ? 'Nouvelle' : 'Vue'}
                </span>
                <OfferTitle offer={o} />
                <div className="apercu-score" title={o.score === null ? 'Score pas encore calculé' : 'Score de compatibilité sur 100'}>
                  {o.score ?? <span className="secondaire">–</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="apercu-partie" aria-labelledby="titre-profil">
        <h2 className="titre-section" id="titre-profil">Profil à compléter</h2>
        {data.gaps.length === 0 ? (
          <p className="vide">Ton profil est complet. Les scores et le remplissage en profitent.</p>
        ) : (
          <>
            <ul className="liste">
              {data.gaps.map((g) => (
                <li key={g.action} className="ligne ligne--manque">
                  <div className="ligne-titre">{g.action}</div>
                  <div className="secondaire">{g.why}</div>
                </li>
              ))}
            </ul>
            <p className="apercu-lien"><a className="lien" href={hrefOf('profil')}>Compléter mon profil</a></p>
          </>
        )}
      </section>
    </>
  )
}

function OfferTitle({ offer }: { offer: JobOffer }) {
  return (
    <div>
      <a className="ligne-titre lien-offre" href={hrefOfOffer(offer.id)}>{offer.title}</a>
      {offer.company && <div className="secondaire">{offer.company}</div>}
    </div>
  )
}
