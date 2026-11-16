import { CircleAlert, CircleCheck, Info } from 'lucide-react'
import type { ReactNode } from 'react'

interface MessageProps {
  kind: 'erreur' | 'succes' | 'info'
  children: ReactNode
}

// Message court avec une icône : l'erreur ne se repère pas seulement à sa couleur
export default function Message({ kind, children }: MessageProps) {
  const Icon = kind === 'erreur' ? CircleAlert : kind === 'succes' ? CircleCheck : Info
  return (
    <p className={`message message--${kind}`} role={kind === 'erreur' ? 'alert' : 'status'}>
      <Icon size={18} aria-hidden="true" />
      <span>{children}</span>
    </p>
  )
}
