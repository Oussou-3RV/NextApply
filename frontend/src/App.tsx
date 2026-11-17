import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import AppShell from './components/AppShell'
import { useRoute } from './lib/router'
import { supabase } from './lib/supabase'
import ComingSoonPage from './pages/ComingSoonPage'
import LoginPage from './pages/LoginPage'
import NewPasswordPage from './pages/NewPasswordPage'
import OffersPage from './pages/OffersPage'
import ProfilePage from './pages/ProfilePage'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  // true quand on arrive par le lien « Mot de passe oublié » reçu par courriel
  const [recovering, setRecovering] = useState(false)
  const route = useRoute()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession)
      if (event === 'PASSWORD_RECOVERY') setRecovering(true)
    })

    return () => data.subscription.unsubscribe()
  }, [])

  if (loading) return <p className="conteneur page secondaire">Chargement…</p>
  if (recovering) return <NewPasswordPage onDone={() => setRecovering(false)} />
  if (!session) return <LoginPage />

  return (
    <AppShell route={route}>
      {route === 'profil' && <ProfilePage />}
      {route === 'offres' && <OffersPage />}
      {route === 'apercu' && (
        <ComingSoonPage title="Aperçu">
          Le tableau de bord arrive à l'étape 6 : tes candidatures de la semaine et celles à relancer.
        </ComingSoonPage>
      )}
    </AppShell>
  )
}

export default App
