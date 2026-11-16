import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from '../components/Field'
import Logo from '../components/Logo'
import Message from '../components/Message'
import { supabase } from '../lib/supabase'

// Affichée quand on revient du lien « Mot de passe oublié » reçu par courriel
export default function NewPasswordPage({ onDone }: { onDone: () => void }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (password.length < 8) {
      setError('Choisis un mot de passe d’au moins 8 caractères.')
      return
    }
    setBusy(true)
    setError(null)
    const { error } = await supabase.auth.updateUser({ password })
    setBusy(false)
    if (error) setError('Le mot de passe n’a pas pu être changé. Recommence avec un nouveau lien.')
    else onDone()
  }

  return (
    <div className="connexion">
      <main className="connexion-gauche">
        <Logo />
        <form className="connexion-formulaire" onSubmit={handleSubmit}>
          <h1 className="titre-page">Nouveau mot de passe</h1>
          <Field name="password" label="Nouveau mot de passe" type="password" autoComplete="new-password"
            value={password} onChange={(_name, value) => setPassword(value)}
            hint="Au moins 8 caractères." />
          {error && <Message kind="erreur">{error}</Message>}
          <div>
            <button type="submit" className="bouton" disabled={busy}>
              {busy ? 'Enregistrement…' : 'Changer le mot de passe'}
            </button>
          </div>
        </form>
      </main>
      <aside className="connexion-droite" aria-hidden="true" />
    </div>
  )
}
