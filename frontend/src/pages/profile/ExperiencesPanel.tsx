import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import ExperienceFields from '../../components/ExperienceFields'
import Message from '../../components/Message'
import { api, errorMessage } from '../../lib/api'
import { formatPeriod } from '../../lib/format'
import {
  EMPTY_EXPERIENCE,
  KIND_LABELS,
  experienceToPayload,
  experienceToValues,
} from '../../lib/profileForms'
import type { Experience } from '../../lib/types'
import { useEditor } from '../../lib/useEditor'

interface Props {
  items: Experience[]
  onChanged: () => Promise<unknown>
}

export default function ExperiencesPanel({ items, onChanged }: Props) {
  const editor = useEditor(EMPTY_EXPERIENCE)
  const { editing, values, fieldErrors } = editor

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await editor.submit(() =>
      editing === 'new'
        ? api.createExperience(experienceToPayload(values))
        : api.updateExperience(editing as string, experienceToPayload(values)))
    if (ok) await onChanged()
  }

  async function handleDelete(item: Experience) {
    if (!window.confirm(`Supprimer « ${item.title} » chez ${item.company} ? C'est définitif.`)) return
    try {
      await api.deleteExperience(item.id)
      await onChanged()
    } catch (e) {
      window.alert(errorMessage(e))
    }
  }

  return (
    <>
      <div className="entete-panneau">
        <h2 className="titre-section">Expériences</h2>
        {editing === null && (
          <button type="button" className="bouton bouton--contour" onClick={() => editor.open('new')}>
            <Plus size={20} aria-hidden="true" />
            Ajouter une expérience
          </button>
        )}
      </div>
      <p className="chapeau">
        Emplois, stages, projets et bénévolat. Décoche « pertinente » pour ce qui ne compte pas
        dans les années d'expérience en informatique.
      </p>

      {editing !== null && (
        <form className="bloc-edition formulaire" onSubmit={handleSubmit} noValidate>
          <h3 className="titre-liste">{editing === 'new' ? 'Nouvelle expérience' : "Modifier l'expérience"}</h3>
          <ExperienceFields values={values} errors={fieldErrors} onChange={editor.change}
            onRelevantChange={(relevant) => editor.set('relevant', relevant)} />
          <div className="boutons">
            <button type="submit" className="bouton" disabled={editor.saving}>
              {editor.saving ? 'Enregistrement…' : "Enregistrer l'expérience"}
            </button>
            <button type="button" className="bouton bouton--contour" onClick={editor.close}>Annuler</button>
            {editor.error && <Message kind="erreur">{editor.error}</Message>}
          </div>
        </form>
      )}

      {items.length === 0 && editing === null && (
        <p className="vide">Aucune expérience pour l'instant. Commence par ta plus récente.</p>
      )}

      <ul className="liste">
        {items.map((item) => (
          <li key={item.id} className="ligne">
            <div className="secondaire">
              {KIND_LABELS[item.kind]}
              {!item.relevant && <div>Non pertinente</div>}
            </div>
            <div>
              <div className="ligne-titre">{item.title}</div>
              <div className="secondaire">{item.company}</div>
            </div>
            <div>
              <div>{formatPeriod(item.startDate, item.endDate)}</div>
              {item.location && <div className="secondaire">{item.location}</div>}
            </div>
            <div className="ligne-actions">
              <button type="button" className="bouton-icone" onClick={() => editor.open(item.id, experienceToValues(item))}
                aria-label={`Modifier « ${item.title} »`} title="Modifier">
                <Pencil size={20} aria-hidden="true" />
              </button>
              <button type="button" className="bouton-icone" onClick={() => handleDelete(item)}
                aria-label={`Supprimer « ${item.title} »`} title="Supprimer">
                <Trash2 size={20} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
