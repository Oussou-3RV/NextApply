import { Pencil, Plus, Trash2 } from 'lucide-react'
import type { FormEvent } from 'react'
import Field from '../../components/Field'
import Message from '../../components/Message'
import { api, errorMessage } from '../../lib/api'
import { formatPeriod, toInput, toNullable } from '../../lib/format'
import { EXPERIENCE_KINDS } from '../../lib/types'
import type { Experience, ExperienceInput, ExperienceKind } from '../../lib/types'
import { useEditor } from '../../lib/useEditor'

const KIND_LABELS: Record<ExperienceKind, string> = {
  emploi: 'Emploi', stage: 'Stage', projet: 'Projet', benevolat: 'Bénévolat',
}
const KIND_OPTIONS = EXPERIENCE_KINDS.map((k) => ({ value: k, label: KIND_LABELS[k] }))

interface Values {
  company: string
  title: string
  kind: ExperienceKind
  location: string
  startDate: string
  endDate: string
  description: string
  relevant: boolean
}

const EMPTY: Values = {
  company: '', title: '', kind: 'emploi', location: '', startDate: '', endDate: '',
  description: '', relevant: true,
}

const toValues = (e: Experience): Values => ({
  company: e.company, title: e.title, kind: e.kind, location: toInput(e.location),
  startDate: toInput(e.startDate), endDate: toInput(e.endDate),
  description: toInput(e.description), relevant: e.relevant,
})

const toPayload = (v: Values): ExperienceInput => ({
  company: v.company, title: v.title, kind: v.kind, location: toNullable(v.location),
  startDate: toNullable(v.startDate), endDate: toNullable(v.endDate),
  description: toNullable(v.description), relevant: v.relevant,
})

interface Props {
  items: Experience[]
  onChanged: () => Promise<unknown>
}

export default function ExperiencesPanel({ items, onChanged }: Props) {
  const editor = useEditor(EMPTY)
  const { editing, values, fieldErrors } = editor

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const ok = await editor.submit(() =>
      editing === 'new'
        ? api.createExperience(toPayload(values))
        : api.updateExperience(editing as string, toPayload(values)))
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
          <div className="grille-champs">
            <Field name="title" label="Poste" value={values.title}
              onChange={editor.change} error={fieldErrors.title} />
            <Field name="company" label="Entreprise ou organisme" value={values.company}
              onChange={editor.change} error={fieldErrors.company} />
            <Field name="kind" label="Type" options={KIND_OPTIONS} value={values.kind}
              onChange={editor.change} error={fieldErrors.kind} />
            <Field name="location" label="Lieu" value={values.location}
              onChange={editor.change} error={fieldErrors.location} />
            <Field name="startDate" label="Début" type="date" value={values.startDate}
              onChange={editor.change} error={fieldErrors.startDate} />
            <Field name="endDate" label="Fin" type="date" value={values.endDate} hint="Vide si en cours."
              onChange={editor.change} error={fieldErrors.endDate ?? fieldErrors.dateRangeValid} />
          </div>
          <Field name="description" label="Description : tâches, technologies, résultats" multiline
            value={values.description} onChange={editor.change} error={fieldErrors.description} />
          <label className="case">
            <input type="checkbox" checked={values.relevant}
              onChange={(e) => editor.set('relevant', e.target.checked)} />
            Pertinente pour mes candidatures en informatique
          </label>
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
              <button type="button" className="bouton-icone" onClick={() => editor.open(item.id, toValues(item))}
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
