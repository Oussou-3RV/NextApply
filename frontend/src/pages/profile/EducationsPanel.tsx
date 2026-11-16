import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import Field from '../../components/Field'
import Message from '../../components/Message'
import { api, errorMessage } from '../../lib/api'
import { formatPeriod, toInput, toNullable } from '../../lib/format'
import type { Education, EducationInput } from '../../lib/types'
import { useEditor } from '../../lib/useEditor'

type Values = Record<keyof EducationInput, string>

const EMPTY: Values = { institution: '', program: '', level: '', startDate: '', endDate: '', description: '' }

const toValues = (e: Education): Values => ({
  institution: e.institution, program: e.program, level: toInput(e.level),
  startDate: toInput(e.startDate), endDate: toInput(e.endDate), description: toInput(e.description),
})

const toPayload = (v: Values): EducationInput => ({
  institution: v.institution, program: v.program, level: toNullable(v.level),
  startDate: toNullable(v.startDate), endDate: toNullable(v.endDate), description: toNullable(v.description),
})

interface Props {
  items: Education[]
  onChanged: () => Promise<unknown>
}

export default function EducationsPanel({ items, onChanged }: Props) {
  const editor = useEditor(EMPTY)
  const { editing, values, fieldErrors } = editor

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await editor.submit(() =>
      editing === 'new'
        ? api.createEducation(toPayload(values))
        : api.updateEducation(editing as string, toPayload(values)))
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
          <div className="grille-champs">
            <Field name="program" label="Programme" value={values.program}
              onChange={editor.change} error={fieldErrors.program} />
            <Field name="institution" label="Établissement" value={values.institution}
              onChange={editor.change} error={fieldErrors.institution} />
            <Field name="level" label="Niveau" value={values.level} hint="Par exemple : baccalauréat, DEC."
              onChange={editor.change} error={fieldErrors.level} />
            <Field name="startDate" label="Début" type="date" value={values.startDate}
              onChange={editor.change} error={fieldErrors.startDate} />
            <Field name="endDate" label="Fin" type="date" value={values.endDate} hint="Vide si en cours."
              onChange={editor.change} error={fieldErrors.endDate ?? fieldErrors.dateRangeValid} />
          </div>
          <Field name="description" label="Description" multiline value={values.description}
            onChange={editor.change} error={fieldErrors.description} />
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
              <button type="button" className="bouton-icone" onClick={() => editor.open(item.id, toValues(item))}
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
