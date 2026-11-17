import { useState } from 'react'
import Message from '../../components/Message'
import { errorMessage } from '../../lib/api'
import { offersApi } from '../../lib/offers'
import type { OfferDetail } from '../../lib/offers'

interface Props {
  detail: OfferDetail
  onChange: (detail: OfferDetail) => void
}

// Onglet « Lettre de motivation » : l'IA rédige un premier jet, je le relis,
// le corrige, l'enregistre, puis le copie dans le formulaire de l'employeur.
export default function CoverLetterTab({ detail, onChange }: Props) {
  const [text, setText] = useState(detail.coverLetter ?? '')
  const [writing, setWriting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [info, setInfo] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const changed = text !== (detail.coverLetter ?? '')

  async function write() {
    if (detail.coverLetter && !window.confirm('Remplacer ta lettre actuelle par une nouvelle version ?')) return
    setWriting(true)
    setError(null)
    setInfo(null)
    try {
      const updated = await offersApi.writeLetter(detail.offer.id)
      onChange(updated)
      setText(updated.coverLetter ?? '')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setWriting(false)
    }
  }

  async function save() {
    setSaving(true)
    setError(null)
    setInfo(null)
    try {
      const updated = await offersApi.saveLetter(detail.offer.id, text)
      onChange(updated)
      setText(updated.coverLetter ?? '')
      setInfo('Lettre enregistrée.')
    } catch (e) {
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function copy() {
    setError(null)
    try {
      await navigator.clipboard.writeText(text)
      setInfo('Lettre copiée. Colle-la dans le formulaire de l’employeur.')
    } catch {
      setError('Le navigateur a refusé la copie. Sélectionne le texte et copie-le avec Ctrl+C (ou Cmd+C).')
    }
  }

  if (!detail.coverLetter && !writing) {
    return (
      <div className="formulaire">
        <p className="chapeau fiche-consigne">
          L’IA rédige un premier jet à partir de l’offre et de ton parcours, dans la langue de l’offre.
          Elle ne reçoit ni ton courriel, ni ton téléphone, ni ta ville. Tu relis tout avant de l’utiliser.
        </p>
        <div className="boutons">
          <button type="button" className="bouton" onClick={write}>Rédiger la lettre</button>
          {error && <Message kind="erreur">{error}</Message>}
        </div>
      </div>
    )
  }

  return (
    <div className="formulaire">
      <p className="chapeau fiche-consigne">
        Relis la lettre : l’IA peut se tromper ou rester trop générale. Corrige-la ici, puis enregistre.
      </p>
      <div className="champ">
        <label htmlFor="lettre">Lettre de motivation</label>
        <textarea id="lettre" className="lettre" value={text} rows={18} disabled={writing}
          onChange={(e) => {
            setText(e.target.value)
            setInfo(null)
          }} />
      </div>
      <div className="boutons">
        <button type="button" className="bouton" onClick={save} disabled={saving || writing || !changed}>
          {saving ? 'Enregistrement…' : 'Enregistrer la lettre'}
        </button>
        <button type="button" className="bouton bouton--contour" onClick={copy} disabled={writing || text.trim() === ''}>
          Copier la lettre
        </button>
        <button type="button" className="lien" onClick={write} disabled={writing}>
          {writing ? 'Rédaction… (environ 15 secondes)' : 'Rédiger une nouvelle version'}
        </button>
      </div>
      {info && <Message kind="succes">{info}</Message>}
      {error && <Message kind="erreur">{error}</Message>}
    </div>
  )
}
