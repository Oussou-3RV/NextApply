import type { FillProfile, FillResult } from '../shared/types'
import { fillForm } from './fill'

// Ce script est injecté dans la page (et ses iframes) seulement quand je clique
// sur « Remplir cette page ». Il ne fait rien seul : il expose une fonction que
// la fenêtre de l'extension appelle ensuite avec les valeurs de mon profil.
declare global {
  interface Window {
    nextApplyFill?: (profile: FillProfile) => FillResult
  }
}

window.nextApplyFill = (profile) => fillForm(document, profile)
