// Petites aides d'affichage partagées par popup.ts et offer.ts

// Récupère un élément de popup.html par son id
export const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

// Icônes Lucide (licence ISC) : le message ne se repère pas qu'à sa couleur
const ICONS = {
  erreur: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  succes: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
}

export type MessageKind = keyof typeof ICONS

export function showMessage(element: HTMLElement, kind: MessageKind, text: string) {
  element.className = `message message--${kind}`
  element.setAttribute('role', kind === 'erreur' ? 'alert' : 'status')
  element.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[kind]}</svg>`
  const span = document.createElement('span')
  span.textContent = text // textContent : jamais de HTML venu d'ailleurs
  element.append(span)
  element.hidden = false
}

export function hideMessage(element: HTMLElement) {
  element.hidden = true
}
