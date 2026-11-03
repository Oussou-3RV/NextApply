import { useState } from 'react'
import type { FormEvent } from 'react'
import { supabase } from '../lib/supabase'

export default function LoginForm() {

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)

    const { error } = await supabase.auth.signInWithPassword({ email, password })
    
    if (error) setMessage(error.message)
  }

  return (
    <form onSubmit={handleSubmit}>
      <h1>NextApply</h1>
      <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Courriel" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mot de passe" required />
      <button type="submit">Se connecter</button>
      {message && <p>{message}</p>}
    </form>
  )
}