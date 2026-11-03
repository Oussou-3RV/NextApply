import { useEffect, useState } from 'react'
import { fetchMe } from '../lib/api'
import type { Me } from '../lib/api'
import { supabase } from '../lib/supabase'

export default function Profile() {
    
  const [me, setMe] = useState<Me | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMe().then(setMe).catch((e: Error) => setError(e.message))
  }, [])

  return (
    <div>
      {error && <p>{error}</p>}
      {me && <p>Connecté : {me.email}</p>}
      <button onClick={() => supabase.auth.signOut()}>Se déconnecter</button>
    </div>
  )
}