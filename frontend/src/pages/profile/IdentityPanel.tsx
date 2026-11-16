import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import Field from '../../components/Field'
import Message from '../../components/Message'
import { api, errorMessage, fieldErrorsOf } from '../../lib/api'
import { toInput, toNullable } from '../../lib/format'
import type { Profile, ProfileInput } from '../../lib/types'

type Values = Record<keyof ProfileInput, string>

const EMPTY: Values = {
  firstName: '', lastName: '', contactEmail: '', phone: '', city: '', region: '',
  country: '', linkedinUrl: '', githubUrl: '', portfolioUrl: '', summary: '',
}
const KEYS = Object.keys(EMPTY) as (keyof Values)[]

const toValues = (p: Profile): Values =>
  Object.fromEntries(KEYS.map((k) => [k, toInput(p[k])])) as Values
const toPayload = (v: Values): ProfileInput =>
  Object.fromEntries(KEYS.map((k) => [k, toNullable(v[k])])) as ProfileInput

export default function IdentityPanel() {
  const [values, setValues] = useState<Values>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    api.getProfile()
      .then((profile) => setValues(toValues(profile)))
      .catch((e: unknown) => setError(errorMessage(e)))
      .finally(() => setLoading(false))
  }, [])

  const handleChange = (name: string, value: string) => {
    setSaved(false)
    setValues((previous) => ({ ...previous, [name]: value }))
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSaving(true)
    setSaved(false)
    setError(null)
    setFieldErrors({})
    try {
      setValues(toValues(await api.updateProfile(toPayload(values))))
      setSaved(true)
    } catch (e) {
      setFieldErrors(fieldErrorsOf(e))
      setError(errorMessage(e))
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <p className="secondaire">Chargement du profil…</p>

  const field = (name: keyof Values, label: string, type?: 'email' | 'tel' | 'url', autoComplete?: string) => (
    <Field name={name} label={label} type={type} autoComplete={autoComplete}
      value={values[name]} onChange={handleChange} error={fieldErrors[name]} />
  )

  return (
    <form className="formulaire" onSubmit={handleSubmit} noValidate>
      <h2 className="titre-section">Coordonnées</h2>
      <div className="grille-champs">
        {field('firstName', 'Prénom', undefined, 'given-name')}
        {field('lastName', 'Nom', undefined, 'family-name')}
        {field('contactEmail', 'Courriel de contact', 'email', 'email')}
        {field('phone', 'Téléphone', 'tel', 'tel')}
        {field('city', 'Ville', undefined, 'address-level2')}
        {field('region', 'Province ou région', undefined, 'address-level1')}
        {field('country', 'Pays', undefined, 'country-name')}
      </div>

      <h2 className="titre-section">Liens</h2>
      <div className="grille-champs">
        {field('linkedinUrl', 'LinkedIn', 'url')}
        {field('githubUrl', 'GitHub', 'url')}
        {field('portfolioUrl', 'Portfolio', 'url')}
      </div>

      <h2 className="titre-section">Résumé</h2>
      <Field name="summary" label="Quelques phrases sur toi et le poste que tu cherches" multiline
        value={values.summary} onChange={handleChange} error={fieldErrors.summary} />

      <div className="boutons">
        <button type="submit" className="bouton" disabled={saving}>
          {saving ? 'Enregistrement…' : 'Enregistrer le profil'}
        </button>
        {saved && <Message kind="succes">Profil enregistré.</Message>}
        {error && <Message kind="erreur">{error}</Message>}
      </div>
    </form>
  )
}
