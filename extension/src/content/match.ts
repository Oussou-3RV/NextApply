import type { FieldKey } from '../shared/types'

// Reconnaît ce qu'un champ de formulaire attend (prénom, courriel…) à partir de
// ce que la page dit de lui : autocomplete, name, id, libellé, placeholder…
// Chaque site nomme ses champs à sa façon : on cherche des mots-clés en français
// et en anglais, et on préfère ne rien remplir plutôt que remplir faux.

type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement

// 1. L'attribut autocomplete est la source la plus fiable quand le site le donne
const AUTOCOMPLETE: Record<string, FieldKey> = {
  'given-name': 'firstName',
  'family-name': 'lastName',
  name: 'fullName',
  email: 'email',
  tel: 'phone',
  'tel-national': 'phone',
  'address-level2': 'city',
  'address-level1': 'region',
  'country-name': 'country',
  country: 'country',
}

// 2. Sinon, des mots-clés, testés dans cet ordre (le premier qui correspond gagne).
// "exclude" évite les faux amis : « Company name » n'est pas mon nom.
interface Rule {
  key: FieldKey
  match: RegExp
  exclude?: RegExp
}

const NOT_ME = /company|employer|entreprise|employeur|school|ecole|universit|reference|referr|manager|emergency|urgence|recruiter|contact person/

const RULES: Rule[] = [
  { key: 'linkedin', match: /linkedin/ },
  { key: 'github', match: /github/ },
  { key: 'portfolio', match: /portfolio|website|site web|site internet|personal site|site personnel|blog/ },
  { key: 'email', match: /e ?mail|courriel/ },
  { key: 'phone', match: /phone|telephone|mobile|cellulaire|\bcell\b|\btel\b/, exclude: /extension|\bext\b|type|code|device/ },
  { key: 'firstName', match: /first ?name|given ?name|prenom|forename|\bfname\b/, exclude: NOT_ME },
  // En français, « Nom » seul (à côté de « Prénom ») désigne le nom de famille
  { key: 'lastName', match: /last ?name|family ?name|surname|nom de famille|\blname\b|^nom$/, exclude: NOT_ME },
  { key: 'fullName', match: /full ?name|legal name|nom complet|your name|^name$/, exclude: NOT_ME },
  // « City, State » (Indeed) attend la ville et la région ensemble
  { key: 'location', match: /city .*(state|province|region)|ville .*(province|region)/ },
  { key: 'city', match: /\bcity\b|ville|\btown\b|municipalit/ },
  { key: 'region', match: /\bstate\b|province|\bregion\b/ },
  { key: 'country', match: /country|\bpays\b/, exclude: /code|phone|telephone/ },
  { key: 'location', match: /location|localisation|lieu de residence|where do you live|ou habitez/ },
]

// « Prénom_* » → « prenom » : minuscules, sans accents, séparateurs remplacés par des espaces
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[_\-.[\](),/:*]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

// firstName → first name (les noms techniques sont souvent en camelCase)
const splitCamel = (text: string) => text.replace(/([a-z])([A-Z])/g, '$1 $2')

// Le texte des éléments désignés par aria-labelledby="id1 id2"
function labelledBy(el: Field): string {
  const ids = el.getAttribute('aria-labelledby')
  if (!ids) return ''
  return ids.split(/\s+/)
    .map((id) => el.ownerDocument.getElementById(id)?.textContent ?? '')
    .join(' ')
}

// Le texte du <label> du champ : <label for="id"> ou <label> qui l'entoure
function labelText(el: Field): string {
  const labels = el.labels ? Array.from(el.labels) : []
  return labels.map((l) => l.textContent ?? '').join(' ')
}

// Toutes les descriptions du champ, chacune testée séparément : « ^name$ » doit
// viser un champ nommé exactement « name », pas tout texte contenant « name »
export function describe(el: Field): string[] {
  const sources = [
    el.getAttribute('name'),
    el.id,
    el.getAttribute('placeholder'),
    el.getAttribute('aria-label'),
    el.getAttribute('data-automation-id'), // Workday
    el.getAttribute('data-testid'),
    labelText(el),
    labelledBy(el),
  ]
  // Deux versions de chaque texte : « firstName » doit donner « first name », mais
  // « LinkedIn » ne doit pas devenir seulement « linked in »
  const texts = sources
    .filter((s): s is string => Boolean(s && s.trim()))
    .flatMap((s) => [normalize(s), normalize(splitCamel(s))])
    .filter(Boolean)
  return [...new Set(texts)]
}

export function matchField(el: Field): FieldKey | null {
  const autocomplete = el.getAttribute('autocomplete')?.trim().toLowerCase().split(/\s+/).pop()
  if (autocomplete && AUTOCOMPLETE[autocomplete]) return AUTOCOMPLETE[autocomplete]

  const texts = describe(el)
  for (const rule of RULES) {
    const matches = texts.some((t) => rule.match.test(t))
    const excluded = rule.exclude ? texts.some((t) => rule.exclude!.test(t)) : false
    if (matches && !excluded) return rule.key
  }
  return null
}
