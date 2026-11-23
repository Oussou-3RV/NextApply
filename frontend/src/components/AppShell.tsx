import { LogOut } from 'lucide-react'
import type { ReactNode } from 'react'
import { hrefOf } from '../lib/router'
import type { Route } from '../lib/router'
import { supabase } from '../lib/supabase'
import Logo from './Logo'

const LINKS: { route: Route; label: string }[] = [
  { route: 'apercu', label: 'Aperçu' },
  { route: 'offres', label: 'Offres' },
  { route: 'profil', label: 'Profil' },
]

// En-tête commun : logo, navigation (trait sous la page active), déconnexion
export default function AppShell({ route, children }: { route: Route; children: ReactNode }) {
  return (
    <>
      <header className="entete">
        <div className="entete-interieur">
          <Logo href={hrefOf('apercu')} />
          <nav className="navigation" aria-label="Navigation principale">
            {LINKS.map((link) => (
              <a key={link.route} href={hrefOf(link.route)}
                aria-current={route === link.route ? 'page' : undefined}>
                {link.label}
              </a>
            ))}
          </nav>
          <button type="button" className="bouton-icone" onClick={() => supabase.auth.signOut()}
            aria-label="Se déconnecter" title="Se déconnecter">
            <LogOut size={22} aria-hidden="true" />
          </button>
        </div>
      </header>
      <main className="conteneur page">{children}</main>
    </>
  )
}
