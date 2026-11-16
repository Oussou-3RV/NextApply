import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import EducationFields from '../../components/EducationFields'
import Message from '../../components/Message'
import { api, errorMessage } from '../../lib/api'
import { formatPeriod } from '../../lib/format'
import { EMPTY_EDUCATION, educationToPayload, educationToValues } from '../../lib/profileForms'
import type { Education } from '../../lib/types'
import { useEditor } from '../../lib/useEditor'

interface Props {
  items: Education[]
  onChanged: () => Promise<unknown>
}

export default function EducationsPanel({ items, onChanged }: Props) {
  const editor = useEditor(EMPTY_EDUCATION)
  const { editing, values, fieldErrors } = editor

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await editor.submit(() =>
      editing === 'new'
        ? api.createEducation(educationToPayload(values))
        : api.updateEducation(editing as string, educationToPayload(values)))
    if (ok) await onChanged()
  }

  async function handleDelete(item: Education) {
    if (!window.confirm(`Supprimer « ${item.program} » ? C'est définitif.`)) return
    try {
      await api.deleteEducation(item.id)
      await onChanged()
    } catch (e) {
      window.alert(errorMessage(e))
    }
  }

  return (
    <>
      <div className="entete-panneau">
        <h2 className="titre-section">Scolarité</h2>
        {editing === null && (
          <button type="button" className="bouton bouton--contour" onClick={() => editor.open('new')}>
            <Plus size={20} aria-hidden="true" />
            Ajouter une formation
          </button>
        )}
      </div>

      {editing !== null && (
        <form className="bloc-edition formulaire" onSubmit={handleSubmit} noValidate>
          <h3 className="titre-liste">{editing === 'new' ? 'Nouvelle formation' : 'Modifier la formation'}</h3>
          <EducationFields values={values} errors={fieldErrors} onChange={editor.change} />
          <div className="boutons">
            <button type="submit" className="bouton" disabled={editor.saving}>
              {editor.saving ? 'Enregistrement…' : 'Enregistrer la formation'}
            </button>
            <button type="button" className="bouton bouton--contour" onClick={editor.close}>Annuler</button>
            {editor.error && <Message kind="erreur">{editor.error}</Message>}
          </div>
        </form>
      )}

      {items.length === 0 && editing === null && (
        <p className="vide">Aucune formation pour l'instant.</p>
      )}

      <ul className="liste">
        {items.map((item) => (
          <li key={item.id} className="ligne">
            <div className="secondaire">{item.level ?? 'Formation'}</div>
            <div>
              <div className="ligne-titre">{item.program}</div>
              <div className="secondaire">{item.institution}</div>
            </div>
            <div>{formatPeriod(item.startDate, item.endDate)}</div>
            <div className="ligne-actions">
              <button type="button" className="bouton-icone" onClick={() => editor.open(item.id, educationToValues(item))}
                aria-label={`Modifier « ${item.program} »`} title="Modifier">
                <Pencil size={20} aria-hidden="true" />
              </button>
              <button type="button" className="bouton-icone" onClick={() => handleDelete(item)}
                aria-label={`Supprimer « ${item.program} »`} title="Supprimer">
                <Trash2 size={20} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
