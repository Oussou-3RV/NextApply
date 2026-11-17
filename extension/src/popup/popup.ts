import '@fontsource-variable/public-sans'
import './popup.css'
import type { FieldKey, FillProfile, FillResult } from '../shared/types'
import { SessionExpiredError, fetchProfile, toFillProfile } from './api'
import { supabase } from './supabase'

// Raccourci : récupère un élément de popup.html par son id
const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const loading = $<HTMLParagraphElement>('chargement')
const loginView = $<HTMLElement>('vue-connexion')
const fillView = $<HTMLElement>('vue-remplir')
const loginForm = $<HTMLFormElement>('form-connexion')
const loginButton = $<HTMLButtonElement>('bouton-connexion')
const fillButton = $<HTMLButtonElement>('bouton-remplir')
const logoutButton = $<HTMLButtonElement>('bouton-deconnexion')
const footer = $<HTMLParagraphElement>('pied')
const connectedEmail = $<HTMLSpanElement>('email-connecte')
const message = $<HTMLParagraphElement>('message')

const LABELS: Record<FieldKey, string> = {
  firstName: 'prénom', lastName: 'nom', fullName: 'nom complet', email: 'courriel',
  phone: 'téléphone', city: 'ville', region: 'région', country: 'pays', location: 'lieu',
  linkedin: 'LinkedIn', github: 'GitHub', portfolio: 'portfolio',
}

// Icônes Lucide (licence ISC) : le message ne se repère pas qu'à sa couleur
const ICONS = {
  erreur: '<circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/>',
  succes: '<circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/>',
  info: '<circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>',
}

function showMessage(kind: keyof typeof ICONS, text: string) {
  message.className = `message message--${kind}`
  message.setAttribute('role', kind === 'erreur' ? 'alert' : 'status')
  message.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
    stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[kind]}</svg>`
  const span = document.createElement('span')
  span.textContent = text // textContent : jamais de HTML venu d'ailleurs
  message.append(span)
  message.hidden = false
}

function hideMessage() {
  message.hidden = true
}

function show(view: 'connexion' | 'remplir', email?: string) {
  loading.hidden = true
  loginView.hidden = view !== 'connexion'
  fillView.hidden = view !== 'remplir'
  footer.hidden = view !== 'remplir'
  if (email) connectedEmail.textContent = email
}

// ---------- Connexion ----------
loginForm.addEventListener('submit', async (event) => {
  event.preventDefault()
  hideMessage()
  const data = new FormData(loginForm)
  const email = String(data.get('email') ?? '').trim()
  const password = String(data.get('password') ?? '')
  if (!email || !password) {
    showMessage('erreur', 'Écris ton courriel et ton mot de passe.')
    return
  }
  loginButton.disabled = true
  loginButton.textContent = 'Connexion…'
  const { data: result, error } = await supabase.auth.signInWithPassword({ email, password })
  loginButton.disabled = false
  loginButton.textContent = 'Se connecter'
  if (error || !result.session) {
    showMessage('erreur', 'Courriel ou mot de passe incorrect. Vérifie-les, ou change ton mot de passe depuis l’app.')
    return
  }
  loginForm.reset()
  show('remplir', result.session.user.email)
})

logoutButton.addEventListener('click', async () => {
  await supabase.auth.signOut()
  hideMessage()
  show('connexion')
})

// ---------- Remplissage ----------
fillButton.addEventListener('click', async () => {
  hideMessage()
  fillButton.disabled = true
  fillButton.textContent = 'Remplissage…'
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) throw new Error('Aucun onglet actif. Ouvre le formulaire, puis réessaie.')

    const profile = toFillProfile(await fetchProfile())
    if (Object.values(profile).every((v) => !v)) {
      showMessage('info', 'Ton profil est vide. Remplis-le d’abord dans l’app NextApply.')
      return
    }

    const filled = await fillTab(tab.id, profile)
    if (filled.length === 0) {
      showMessage('info', 'Aucun champ vide reconnu sur cette page. Si le formulaire a plusieurs étapes, '
        + 'clique de nouveau quand la suivante s’affiche.')
    } else {
      const names = [...new Set(filled)].map((k) => LABELS[k]).join(', ')
      showMessage('succes', `${filled.length} champ${filled.length > 1 ? 's' : ''} rempli${filled.length > 1 ? 's' : ''} `
        + `(${names}). Ils sont encadrés en bleu : relis-les avant d’envoyer.`)
    }
  } catch (e) {
    if (e instanceof SessionExpiredError) {
      await supabase.auth.signOut()
      show('connexion')
      showMessage('erreur', 'Ta session a expiré. Reconnecte-toi.')
    } else {
      showMessage('erreur', e instanceof Error ? e.message : 'Erreur inattendue. Réessaie.')
    }
  } finally {
    fillButton.disabled = false
    fillButton.textContent = 'Remplir cette page'
  }
})

// Injecte content.js dans la page et ses iframes (les formulaires Greenhouse ou
// Workday sont parfois dans une iframe), puis lui passe les valeurs du profil
async function fillTab(tabId: number, profile: FillProfile): Promise<FieldKey[]> {
  try {
    await chrome.scripting.executeScript({ target: { tabId, allFrames: true }, files: ['content.js'] })
    const results = await chrome.scripting.executeScript({
      target: { tabId, allFrames: true },
      // Cette fonction est copiée dans la page : elle ne peut utiliser que ses arguments
      func: (values: FillProfile) => window.nextApplyFill?.(values) ?? { filled: [] },
      args: [profile],
    })
    return results.flatMap((r) => (r.result as FillResult | undefined)?.filled ?? [])
  } catch {
    // Pages internes de Chrome, Chrome Web Store, PDF…
    throw new Error('Chrome ne permet pas à l’extension de remplir cette page.')
  }
}

// ---------- Au démarrage ----------
const { data } = await supabase.auth.getSession()
if (data.session) show('remplir', data.session.user.email)
else show('connexion')
