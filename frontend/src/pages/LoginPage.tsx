import { useState } from 'react'
import type { FormEvent } from 'react'
import Field from '../components/Field'
import Logo from '../components/Logo'
import Message from '../components/Message'
import StatusLegend from '../components/StatusLegend'
import { supabase } from '../lib/supabase'

export default function LoginPage() {
  const [values, setValues] = useState({ email: '', password: '' })
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const handleChange = (name: string, value: string) =>
    setValues((previous) => ({ ...previous, [name]: value }))

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    const { error } = await supabase.auth.signInWithPassword(values)
    // Une erreur explique quoi faire, au lieu du message technique de Supabase
    if (error) setError('Courriel ou mot de passe incorrect. Vérifie-les, ou réinitialise ton mot de passe.')
    setBusy(false)
  }

  async function handleForgotPassword() {
    setError(null)
    setInfo(null)
    if (values.email.trim() === '') {
      setError('Écris ton courriel ci-dessus, puis clique de nouveau sur « Mot de passe oublié ».')
      return
    }
    // Supabase envoie un lien ; en revenant sur l'app, App affiche le formulaire du nouveau mot de passe
    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: window.location.origin,
    })
    if (error) setError("Le lien n'a pas pu être envoyé. Réessaie dans une minute.")
    else setInfo('Si ce courriel a un compte, un lien pour changer le mot de passe vient d’y être envoyé.')
  }

  return (
    <div className="connexion">
      <main className="connexion-gauche">
        <Logo />
        <form className="connexion-formulaire" onSubmit={handleSubmit}>
          <h1 className="titre-page">Se connecter</h1>
          <Field name="email" label="Courriel" type="email" autoComplete="email"
            value={values.email} onChange={handleChange} />
          <Field name="password" label="Mot de passe" type="password" autoComplete="current-password"
            value={values.password} onChange={handleChange} />
          {error && <Message kind="erreur">{error}</Message>}
          {info && <Message kind="info">{info}</Message>}
          <div>
            <button type="submit" className="bouton" disabled={busy}>
              {busy ? 'Connexion…' : 'Se connecter'}
            </button>
          </div>
          <div>
            <button type="button" className="lien" onClick={handleForgotPassword}>Mot de passe oublié</button>
          </div>
        </form>
      </main>

      <aside className="connexion-droite" aria-label="Les statuts des offres">
        <p className="intro">Chaque offre porte un statut. Tu le lis avant même de lire le titre.</p>
        <StatusLegend />
      </aside>
    </div>
  )
}
