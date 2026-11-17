import { useEffect, useRef, useState } from 'react'
import Message from '../../components/Message'
import { api, errorMessage } from '../../lib/api'
import { hrefOf } from '../../lib/router'

interface Row {
  label: string
  value: string
}

// Durée de l'inversion de la ligne copiée (docs/design.md : environ 1,4 seconde)
const COPIED_DURATION = 1400

const years = (n: number) => `${n} an${n > 1 ? 's' : ''}`

// Onglet « Fiche de candidature » : mes informations, prêtes à coller dans le
// formulaire de l'employeur. Cliquer une ligne copie sa valeur.
export default function ApplicationSheet({ myExperienceYears }: { myExperienceYears: number }) {
  const [rows, setRows] = useState<Row[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState<string | null>(null)
  const timer = useRef<number | undefined>(undefined)

  useEffect(() => {
    Promise.all([api.getProfile(), api.listEducations()])
      .then(([profile, educations]) => {
        const latest = educations[0] // la plus récente d'abord
        const all: Row[] = [
          { label: 'Prénom', value: profile.firstName ?? '' },
          { label: 'Nom', value: profile.lastName ?? '' },
          { label: 'Courriel', value: profile.contactEmail ?? '' },
          { label: 'Téléphone', value: profile.phone ?? '' },
          { label: 'Ville', value: profile.city ?? '' },
          { label: 'Province ou région', value: profile.region ?? '' },
          { label: 'Pays', value: profile.country ?? '' },
          { label: 'LinkedIn', value: profile.linkedinUrl ?? '' },
          { label: 'GitHub', value: profile.githubUrl ?? '' },
          { label: 'Portfolio', value: profile.portfolioUrl ?? '' },
          { label: 'Scolarité', value: latest ? `${latest.program}, ${latest.institution}` : '' },
          { label: 'Expérience pertinente', value: years(myExperienceYears) },
        ]
        setRows(all.filter((r) => r.value.trim() !== ''))
      })
      .catch((e: unknown) => setError(errorMessage(e)))
    return () => window.clearTimeout(timer.current)
  }, [myExperienceYears])

  async function copy(row: Row) {
    setError(null)
    try {
      await navigator.clipboard.writeText(row.value)
      // Le seul effet de l'app : la ligne s'inverse, sans transition, puis revient
      setCopied(row.label)
      window.clearTimeout(timer.current)
      timer.current = window.setTimeout(() => setCopied(null), COPIED_DURATION)
    } catch {
      setError('Le navigateur a refusé la copie. Sélectionne la valeur et copie-la avec Ctrl+C (ou Cmd+C).')
    }
  }

  if (error && !rows) return <Message kind="erreur">{error}</Message>
  if (!rows) return <p className="secondaire">Chargement de ton profil…</p>

  return (
    <>
      <p className="chapeau fiche-consigne">
        Clique sur une ligne pour copier sa valeur, puis colle-la dans le formulaire de l’employeur.
      </p>
      {rows.length === 0 && (
        <p className="vide">
          Ton profil est vide. Remplis-le dans <a className="lien" href={hrefOf('profil')}>Profil</a>.
        </p>
      )}
      <ul className="lignes-copie">
        {rows.map((row) => {
          const isCopied = copied === row.label
          return (
            <li key={row.label}>
              <button type="button" className={`ligne-copie${isCopied ? ' ligne-copie--copiee' : ''}`}
                onClick={() => copy(row)} aria-label={`Copier ${row.label} : ${row.value}`}>
                <span className="ligne-copie-libelle">{row.label}</span>
                <span className="ligne-copie-valeur">{row.value}</span>
                <span className="ligne-copie-action" aria-hidden="true">{isCopied ? 'Copié' : 'Copier'}</span>
              </button>
            </li>
          )
        })}
      </ul>
      {/* Annonce « Copié » aux lecteurs d'écran */}
      <p className="visuellement-cache" role="status">{copied ? `${copied} copié` : ''}</p>
      {error && <Message kind="erreur">{error}</Message>}
    </>
  )
}
