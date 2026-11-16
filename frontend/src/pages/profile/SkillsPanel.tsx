import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from '../../components/Field'
import Message from '../../components/Message'
import { api, errorMessage, fieldErrorsOf } from '../../lib/api'
import { toNullable } from '../../lib/format'
import type { Skill } from '../../lib/types'

interface Props {
  items: Skill[]
  onChanged: () => Promise<unknown>
}

// Pas de modification : pour une compétence, supprimer puis rajouter suffit en V1
export default function SkillsPanel({ items, onChanged }: Props) {
  const [values, setValues] = useState({ name: '', category: '' })
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  const handleChange = (name: string, value: string) =>
    setValues((previous) => ({ ...previous, [name]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      await api.createSkill({ name: values.name, category: toNullable(values.category) })
      setValues((previous) => ({ ...previous, name: '' })) // garde la catégorie pour enchaîner
      await onChanged()
    } catch (e) {
      // 409 si elle existe déjà : le backend envoie le message à afficher
      setError(fieldErrorsOf(e).name ?? errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(skill: Skill) {
    try {
      await api.deleteSkill(skill.id)
      await onChanged()
    } catch (e) {
      setError(errorMessage(e))
    }
  }

  return (
    <>
      <h2 className="titre-section">Compétences</h2>
      <p className="chapeau">Elles servent à comparer ton profil aux technologies demandées par chaque offre.</p>

      <form className="bloc-edition formulaire" onSubmit={handleSubmit} noValidate>
        <div className="grille-champs">
          <Field name="name" label="Compétence" value={values.name} onChange={handleChange}
            hint="Par exemple : Java." />
          <Field name="category" label="Catégorie" value={values.category} onChange={handleChange}
            hint="Facultatif. Par exemple : langages." />
        </div>
        <div className="boutons">
          <button type="submit" className="bouton" disabled={saving || values.name.trim() === ''}>
            <Plus size={20} aria-hidden="true" />
            Ajouter la compétence
          </button>
          {error && <Message kind="erreur">{error}</Message>}
        </div>
      </form>

      {items.length === 0 && <p className="vide">Aucune compétence pour l'instant.</p>}

      <ul className="liste">
        {items.map((skill) => (
          <li key={skill.id} className="ligne ligne--simple">
            <div className="ligne-titre">{skill.name}</div>
            <div className="secondaire">{skill.category ?? 'Sans catégorie'}</div>
            <div className="ligne-actions">
              <button type="button" className="bouton-icone" onClick={() => handleDelete(skill)}
                aria-label={`Supprimer ${skill.name}`} title="Supprimer">
                <Trash2 size={20} aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </>
  )
}
