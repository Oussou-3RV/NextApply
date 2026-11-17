import type { FieldKey, FillProfile, FillResult } from '../shared/types'
import { matchField } from './match'

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

// Types de <input> qui peuvent recevoir du texte (pas les cases, fichiers, mots de passe…)
const TEXT_TYPES = new Set(['', 'text', 'email', 'tel', 'url', 'search'])

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase()

// Un champ visible à l'écran (les sites cachent souvent des champs techniques)
export function isVisible(el: Element): boolean {
  const style = el.ownerDocument.defaultView?.getComputedStyle(el)
  if (style && (style.display === 'none' || style.visibility === 'hidden')) return false
  return el.getClientRects().length > 0
}

// Les sites modernes (React, Angular…) gardent leur propre copie de la valeur.
// Écrire el.value ne suffit pas : on passe par le « setter » natif du navigateur,
// puis on envoie les événements qu'une vraie saisie déclencherait.
function writeValue(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set
  el.focus()
  if (setter) setter.call(el, value)
  else el.value = value
  el.dispatchEvent(new Event('input', { bubbles: true }))
  el.dispatchEvent(new Event('change', { bubbles: true }))
  el.blur()
}

// Liste déroulante : on choisit l'option dont le texte (ou la valeur) est le bon
function chooseOption(el: HTMLSelectElement, value: string): boolean {
  const option = Array.from(el.options).find((o) => sameText(o.text, value) || sameText(o.value, value))
  if (!option || option.selected) return false
  el.value = option.value
  el.dispatchEvent(new Event('change', { bubbles: true }))
  return true
}

// Surligne ce qui a été rempli, pour que je le relise avant d'envoyer
function highlight(el: Field) {
  el.style.outline = '2px solid #0F2A7A'
  el.style.outlineOffset = '2px'
  el.setAttribute('data-nextapply', 'rempli')
}

function isFillable(el: Field, visible: (el: Element) => boolean): boolean {
  if (el.disabled) return false
  if (el instanceof HTMLInputElement && (el.readOnly || !TEXT_TYPES.has(el.type))) return false
  if (el instanceof HTMLTextAreaElement && el.readOnly) return false
  return visible(el)
}

// Remplit les champs reconnus et VIDES de la page. Ce que j'ai déjà écrit, ou ce
// que le site a pré-rempli, n'est jamais remplacé. Chaque valeur n'est écrite
// qu'une fois (pas de courriel dans trois champs), sauf la confirmation du courriel.
export function fillForm(root: Document, profile: FillProfile, visible: (el: Element) => boolean = isVisible): FillResult {
  const filled: FieldKey[] = []
  const fields = root.querySelectorAll<Field>('input, select, textarea')

  for (const el of Array.from(fields)) {
    if (!isFillable(el, visible)) continue
    const key = matchField(el)
    if (!key) continue
    const value = profile[key]
    if (!value) continue

    // Les zones de texte longues (lettre, questions) ne sont pas pour la v0
    if (el instanceof HTMLTextAreaElement) continue

    if (filled.includes(key) && key !== 'email') continue

    if (el instanceof HTMLSelectElement) {
      if (chooseOption(el, value)) {
        highlight(el)
        filled.push(key)
      }
      continue
    }

    if (el.value.trim() !== '') continue
    writeValue(el, value)
    highlight(el)
    filled.push(key)
  }
  return { filled }
}
