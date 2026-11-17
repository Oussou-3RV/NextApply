// Bloc « Cette offre » : la page ouverte est-elle déjà dans NextApply ?
// Sinon, « Ajouter à NextApply » envoie son texte au backend, qui l'analyse avec l'IA.
import { SessionExpiredError, addOffer, deleteOffer, lookupOffer, setOfferStatus } from './api'
import type { JobOffer, OfferPage } from './api'
import { experienceSentence, statusLabel } from './format'
import { $, hideMessage, showMessage } from './ui'

const section = $<HTMLElement>('vue-offre')
const loading = $<HTMLParagraphElement>('offre-chargement')
const unknownView = $<HTMLDivElement>('offre-inconnue')
const knownView = $<HTMLDivElement>('offre-connue')
const addButton = $<HTMLButtonElement>('bouton-ajouter')
const appliedButton = $<HTMLButtonElement>('bouton-postulee')
const marker = $<HTMLSpanElement>('offre-marque')
const statusText = $<HTMLSpanElement>('offre-statut')
const title = $<HTMLParagraphElement>('offre-titre')
const details = $<HTMLParagraphElement>('offre-details')
const experience = $<HTMLParagraphElement>('offre-experience')
const duplicateBox = $<HTMLDivElement>('offre-doublon')
const duplicateText = $<HTMLParagraphElement>('offre-doublon-texte')
const removeButton = $<HTMLButtonElement>('bouton-retirer')
const keepButton = $<HTMLButtonElement>('bouton-garder')
const message = $<HTMLParagraphElement>('offre-message')

const MARKERS: Record<JobOffer['status'], string> = {
  nouvelle: 'marque--nouvelle', vue: 'marque--vue', postulee: 'marque--postulee', masquee: 'marque--masquee',
}

let tabId = 0
let tabUrl = ''
let current: OfferPage | null = null
let onExpired: () => void = () => {}

export function hideOfferPanel() {
  section.hidden = true
}

// Appelée à l'ouverture de la fenêtre, une fois connecté
export async function showOfferPanel(tab: chrome.tabs.Tab, sessionExpired: () => void) {
  onExpired = sessionExpired
  section.hidden = false
  hideMessage(message)
  if (!tab.id || !tab.url || !/^https?:/.test(tab.url)) {
    loading.hidden = true
    showMessage(message, 'info', 'Ouvre la page d’une offre d’emploi pour l’ajouter à NextApply.')
    return
  }
  tabId = tab.id
  tabUrl = tab.url
  await run(async () => {
    const page = await lookupOffer(tabUrl)
    if (!page) {
      showUnknown()
      return
    }
    // Revenir sur une offre déjà ajoutée la fait passer de « Nouvelle » à « Vue »
    if (page.offer.status === 'nouvelle') {
      page.offer = await setOfferStatus(page.offer.id, 'vue')
    }
    render(page)
  })
}

function showUnknown() {
  current = null
  loading.hidden = true
  knownView.hidden = true
  unknownView.hidden = false
}

function render(page: OfferPage) {
  current = page
  const { offer } = page
  loading.hidden = true
  unknownView.hidden = true
  knownView.hidden = false
  marker.className = `marque ${MARKERS[offer.status]}`
  statusText.textContent = statusLabel(offer)
  title.textContent = offer.title
  details.textContent = [offer.company, offer.location].filter(Boolean).join(' · ')
  details.hidden = details.textContent === ''
  experience.textContent = experienceSentence(offer, page.myExperienceYears)
  appliedButton.hidden = offer.status === 'postulee'

  const duplicate = page.possibleDuplicate
  duplicateBox.hidden = duplicate === null
  if (duplicate) {
    duplicateText.textContent = `Peut-être la même offre que « ${duplicate.title} »`
      + `${duplicate.company ? ` chez ${duplicate.company}` : ''}, déjà dans NextApply `
      + `(${statusLabel(duplicate).toLowerCase()}), sans doute publiée sur un autre site.`
  }
}

// Exécute une action en affichant les erreurs dans le bloc ; session expirée → reconnexion
async function run(action: () => Promise<void>) {
  try {
    await action()
  } catch (e) {
    loading.hidden = true
    if (e instanceof SessionExpiredError) onExpired()
    else showMessage(message, 'erreur', e instanceof Error ? e.message : 'Erreur inattendue. Réessaie.')
  }
}

// Le texte visible de la page et de ses iframes (Greenhouse affiche parfois l'offre dans une iframe)
async function readPage(): Promise<{ title: string; text: string }> {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      func: () => ({ title: document.title, text: document.body?.innerText ?? '' }),
    })
    const main = results.find((r) => r.frameId === 0)?.result
    const text = results.map((r) => r.result?.text ?? '').join('\n\n').trim()
    return { title: main?.title ?? '', text: text.slice(0, 100_000) } // même limite que le backend
  } catch {
    throw new Error('Chrome ne permet pas à l’extension de lire cette page.')
  }
}

addButton.addEventListener('click', () => run(async () => {
  hideMessage(message)
  addButton.disabled = true
  addButton.textContent = 'Lecture de l’offre…'
  showMessage(message, 'info', 'L’IA lit l’offre. Cela prend environ 10 secondes.')
  try {
    const page = await readPage()
    if (page.text.length < 200) {
      throw new Error('Cette page contient trop peu de texte. Attends qu’elle soit chargée, ou ouvre l’offre elle-même.')
    }
    const result = await addOffer(tabUrl, page.title, page.text)
    render(result)
    showMessage(message, 'succes', result.created ? 'Offre ajoutée à NextApply.' : 'Cette offre était déjà dans NextApply.')
  } finally {
    addButton.disabled = false
    addButton.textContent = 'Ajouter à NextApply'
  }
}))

appliedButton.addEventListener('click', () => run(async () => {
  if (!current) return
  hideMessage(message)
  current.offer = await setOfferStatus(current.offer.id, 'postulee')
  render(current)
  showMessage(message, 'succes', 'Candidature notée. Tu la retrouves dans « Postulées ».')
}))

// Doublon : je retire l'offre que je viens d'ajouter, l'ancienne reste
removeButton.addEventListener('click', () => run(async () => {
  if (!current?.possibleDuplicate) return
  const kept = current.possibleDuplicate
  await deleteOffer(current.offer.id)
  showUnknown()
  showMessage(message, 'info', `Offre retirée. Tu gardes « ${kept.title} », déjà dans NextApply.`)
}))

keepButton.addEventListener('click', () => {
  if (!current) return
  current.possibleDuplicate = null
  duplicateBox.hidden = true
})
