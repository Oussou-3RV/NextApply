import { useState } from 'react'
import { errorMessage, fieldErrorsOf } from './api'

// null = formulaire fermé, 'new' = ajout, sinon l'id de l'élément modifié
export type Editing = null | 'new' | string

// État d'un formulaire d'ajout / modification, partagé par les listes du profil
export function useEditor<V extends object>(empty: V) {
  const [editing, setEditing] = useState<Editing>(null)
  const [values, setValues] = useState<V>(empty)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  function open(target: Exclude<Editing, null>, initial: V = empty) {
    setEditing(target)
    setValues(initial)
    setFieldErrors({})
    setError(null)
  }

  const close = () => setEditing(null)

  function set<K extends keyof V>(name: K, value: V[K]) {
    setValues((previous) => ({ ...previous, [name]: value }))
  }

  // Pour <Field>, qui renvoie toujours le nom du champ et une chaîne
  const change = (name: string, value: string) => set(name as keyof V, value as V[keyof V])

  // Envoie au backend ; en cas d'erreur, garde le formulaire ouvert avec les messages
  async function submit(save: () => Promise<unknown>): Promise<boolean> {
    setSaving(true)
    setFieldErrors({})
    setError(null)
    try {
      await save()
      setEditing(null)
      return true
    } catch (e) {
      setFieldErrors(fieldErrorsOf(e))
      setError(errorMessage(e))
      return false
    } finally {
      setSaving(false)
    }
  }

  return { editing, values, fieldErrors, error, saving, open, close, set, change, submit }
}
