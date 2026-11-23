import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import Message from '../components/Message'
import { api, errorMessage } from '../lib/api'
import { bestToExamine, daysSince, displayFirstName, profileGaps, toFollowUp, weekStats } from '../lib/dashboard'
import type { ProfileGap } from '../lib/dashboard'
import { offersApi } from '../lib/offers'
import type { JobOffer } from '../lib/offers'
import { hrefOf, hrefOfOffer } from '../lib/router'
import type { Profile } from '../lib/types'
import { useReloadOnReturn } from '../lib/useReloadOnReturn'
import '../styles/apercu.css'

interface ProfileData {
  profile: Profile
  gaps: ProfileGap[]
}

// Une erreur de chargement par source : si le profil ne répond pas, les offres s'affichent quand même
interface LoadErrors {
  offers?: string
  profile?: string
}

const days = (n: number) => (n === 0 ? 'aujourd’hui' : n === 1 ? 'hier' : `il y a ${n} jours`)
const plural = (n: number, one: string, many: string) => (n > 1 ? many : one)
const followUpButtonId = (offerId: string) => `relancer-${offerId}`

// Page Aperçu : quoi faire maintenant, puis où en est ma recherche
export default function DashboardPage() {
  const [offers, setOffers] = useState<JobOffer[] | null>(null)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [loadErrors, setLoadErrors] = useState<LoadErrors>({})
  // Relances en cours d'envoi : le bouton est désactivé, un double clic n'envoie qu'une requête
  const [pending, setPending] = useState<ReadonlySet<string>>(new Set())
  const [notice, setNotice] = useState<string | null>(null)
  const [actionError, setActionError] = useState<string | null>(null)

  // Le rechargement au retour sur l'onglet peut croiser un chargement plus ancien :
  // seule la réponse du dernier appel compte
  const lastLoad = useRef(0)
  const load = useCallback(() => {
    const id = ++lastLoad.current
    const profileParts = Promise.all([api.getProfile(), api.listSkills(), api.listExperiences(), api.listEducations()])
    Promise.allSettled([offersApi.list(), profileParts]).then(([offersResult, profileResult]) => {
      if (id !== lastLoad.current) return
      // En cas d'échec, on garde les données déjà affichées et on dit ce qui n'a pas pu être actualisé
      if (offersResult.status === 'fulfilled') setOffers(offersResult.value.offers)
      if (profileResult.status === 'fulfilled') {
        const [p, skills, experiences, educations] = profileResult.value
        setProfile({ profile: p, gaps: profileGaps(p, skills, experiences, educations) })
      }
      setLoadErrors({
        offers: offersResult.status === 'rejected' ? errorMessage(offersResult.reason) : undefined,
        profile: profileResult.status === 'rejected' ? errorMessage(profileResult.reason) : undefined,
      })
    })
  }, [])
  useReloadOnReturn(load)

  function retry() {
    setLoadErrors({})
    load()
  }

  // Après une relance, la ligne quitte la liste : le focus clavier passe à la relance
  // suivante (ou au titre de la section) au lieu de se perdre
  const focusAfterUpdate = useRef<string | null>(null)
  useEffect(() => {
    const target = focusAfterUpdate.current
    if (!target) return
    focusAfterUpdate.current = null
    document.getElementById(target)?.focus()
  }, [offers])

  async function markFollowedUp(offer: JobOffer, nextFocus: string) {
    if (pending.has(offer.id)) return
    setPending((p) => new Set(p).add(offer.id))
    setActionError(null)
    setNotice(null)
    try {
      const updated = await offersApi.followUp(offer.id)
      focusAfterUpdate.current = nextFocus
      setNotice(`Relance notée pour « ${offer.title} ».`)
      setOffers((list) => list && list.map((o) => (o.id === updated.id ? updated : o)))
    } catch (e) {
      setActionError(errorMessage(e))
    } finally {
      setPending((p) => {
        const next = new Set(p)
        next.delete(offer.id)
        return next
      })
    }
  }

  if (!offers) {
    return (
      <>
        <h1 className="titre-page">Aperçu</h1>
        {loadErrors.offers
          ? <LoadError onRetry={retry}>Tes offres n’ont pas pu être chargées. {loadErrors.offers}</LoadError>
          : <p className="chapeau">Chargement…</p>}
      </>
    )
  }

  const now = new Date()
  const stats = weekStats(offers, now)
  const followUps = toFollowUp(offers, now)
  const best = bestToExamine(offers)
  const firstName = profile && displayFirstName(profile.profile.firstName)
  // La section reste affichée après la dernière relance de la liste, pour confirmer l'action
  const showFollowUps = followUps.length > 0 || notice !== null || actionError !== null

  return (
    <>
      <h1 className="titre-page">Aperçu</h1>
      <p className="chapeau apercu-resume">
        {firstName && `Bonjour ${firstName}. `}
        Depuis lundi : <strong>{stats.applied}</strong> {plural(stats.applied, 'candidature envoyée', 'candidatures envoyées')}
        {' et '}<strong>{stats.added}</strong> {plural(stats.added, 'offre ajoutée', 'offres ajoutées')}.
        {!showFollowUps && ' Rien à relancer pour l’instant.'}
      </p>
      {loadErrors.offers && (
        <LoadError onRetry={retry}>Tes offres n’ont pas pu être actualisées. {loadErrors.offers}</LoadError>
      )}

      {showFollowUps && (
        <section className="apercu-partie" aria-labelledby="titre-relancer">
          <h2 className="titre-section" id="titre-relancer" tabIndex={-1}>À relancer</h2>
          <div aria-live="polite">
            {notice && <div className="apercu-message"><Message kind="succes">{notice}</Message></div>}
          </div>
          {actionError && (
            <div className="apercu-message">
              <Message kind="erreur">La relance n’a pas été enregistrée. {actionError}</Message>
            </div>
          )}
          {followUps.length === 0 ? (
            <p className="vide">Tout est relancé. Les prochaines relances apparaîtront ici après 7 jours sans nouvelles.</p>
          ) : (
            <>
              <p className="chapeau">Sans nouvelles depuis une semaine : un court courriel de suivi montre ton intérêt.</p>
              <ul className="liste">
                {followUps.map((o, i) => {
                  const neighbour = followUps[i + 1] ?? followUps[i - 1]
                  const busy = pending.has(o.id)
                  return (
                    <li key={o.id} className="ligne ligne--apercu">
                      <span className="statut">
                        <span className="marque marque--postulee" aria-hidden="true" />
                        {o.followedUpAt
                          ? `Relancée ${days(daysSince(o.followedUpAt, now))}`
                          : `Postulée ${days(daysSince(o.appliedAt!, now))}`}
                      </span>
                      <OfferTitle offer={o} />
                      <div className="ligne-actions">
                        <button
                          type="button"
                          className="lien"
                          id={followUpButtonId(o.id)}
                          disabled={busy}
                          onClick={() => markFollowedUp(o, neighbour ? followUpButtonId(neighbour.id) : 'titre-relancer')}
                        >
                          {busy ? 'Enregistrement…' : 'Marquer comme relancée'}
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            </>
          )}
        </section>
      )}

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
          <>
            {stats.toExamine > best.length && (
              <p className="chapeau">Les {best.length} offres les mieux notées, sur {stats.toExamine} à examiner.</p>
            )}
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
          </>
        )}
      </section>

      <section className="apercu-partie" aria-labelledby="titre-profil">
        <h2 className="titre-section" id="titre-profil">Profil à compléter</h2>
        {!profile ? (
          loadErrors.profile
            ? <LoadError onRetry={retry}>Ton profil n’a pas pu être chargé. {loadErrors.profile}</LoadError>
            : <p className="vide">Chargement…</p>
        ) : profile.gaps.length === 0 ? (
          <p className="vide">Ton profil est complet. Les scores et le remplissage en profitent.</p>
        ) : (
          <>
            {loadErrors.profile && (
              <LoadError onRetry={retry}>Ton profil n’a pas pu être actualisé. {loadErrors.profile}</LoadError>
            )}
            <ul className="liste">
              {profile.gaps.map((g) => (
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

// Erreur de chargement avec un moyen de réessayer sans recharger toute la page
function LoadError({ children, onRetry }: { children: ReactNode; onRetry: () => void }) {
  return (
    <div className="apercu-erreur">
      <Message kind="erreur">{children}</Message>
      <button type="button" className="lien" onClick={onRetry}>Réessayer</button>
    </div>
  )
}
