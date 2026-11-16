import { hrefOf } from '../lib/router'

interface ComingSoonPageProps {
  title: string
  children: string
}

// Écrans prévus par la feuille de route mais pas encore construits :
// on dit honnêtement ce qui arrive, plutôt que d'afficher de fausses données
export default function ComingSoonPage({ title, children }: ComingSoonPageProps) {
  return (
    <>
      <h1 className="titre-page">{title}</h1>
      <p className="chapeau">{children}</p>
      <p className="chapeau">
        En attendant, complète ton <a href={hrefOf('profil')}>profil</a> : il servira à remplir
        les formulaires et à calculer les scores.
      </p>
    </>
  )
}
