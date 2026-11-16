import { Pencil } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import EducationFields from '../../components/EducationFields'
import ExperienceFields from '../../components/ExperienceFields'
import Field from '../../components/Field'
import Message from '../../components/Message'
import { ApiError, api, errorMessage, fieldErrorsOf } from '../../lib/api'
import { formatPeriod, toInput, toNullable } from '../../lib/format'
import {
  KIND_LABELS,
  educationToPayload,
  educationToValues,
  experienceToPayload,
  experienceToValues,
} from '../../lib/profileForms'
import type { EducationValues, ExperienceValues } from '../../lib/profileForms'
import type { CvProposal, Education, Experience, ProfileInput, Skill, SkillInput } from '../../lib/types'

// ---------- Ce que l'écran manipule ----------

// Un élément proposé par l'IA : coché ou non, ouvert pour correction ou non,
// avec les erreurs du backend s'il a été refusé à l'enregistrement
interface Item<V> {
  key: string
  values: V
  selected: boolean
  duplicate: boolean
  open: boolean
  errors: Record<string, string>
}

interface IdentityRow {
  name: keyof ProfileInput
  value: string
  current: string
  selected: boolean
}

const IDENTITY_LABELS: Record<keyof ProfileInput, string> = {
  firstName: 'Prénom', lastName: 'Nom', contactEmail: 'Courriel de contact', phone: 'Téléphone',
  city: 'Ville', region: 'Province ou région', country: 'Pays', linkedinUrl: 'LinkedIn',
  githubUrl: 'GitHub', portfolioUrl: 'Portfolio', summary: 'Résumé',
}
const IDENTITY_KEYS = Object.keys(IDENTITY_LABELS) as (keyof ProfileInput)[]

const same = (a: string | null | undefined, b: string | null | undefined) =>
  (a ?? '').trim().toLowerCase() === (b ?? '').trim().toLowerCase()

// Ne montre que ce que le CV apporte de nouveau. Un champ vide du profil est
// coché d'office ; une valeur qui remplacerait la mienne reste décochée.
function identityRows(proposal: ProfileInput, current: ProfileInput): IdentityRow[] {
  return IDENTITY_KEYS
    .filter((k) => proposal[k] !== null && !same(proposal[k], current[k]))
    .map((k) => ({ name: k, value: toInput(proposal[k]), current: toInput(current[k]), selected: !current[k] }))
}

function item<V>(key: string, values: V, duplicate: boolean, incomplete: boolean): Item<V> {
  // Un doublon est décoché ; un élément incomplet est ouvert pour être corrigé
  return { key, values, selected: !duplicate, duplicate, open: incomplete && !duplicate, errors: {} }
}

const isIncompleteEducation = (v: EducationValues) => !v.program.trim() || !v.institution.trim()
const isIncompleteExperience = (v: ExperienceValues) => !v.title.trim() || !v.company.trim()

interface Props {
  proposal: CvProposal
  educations: Education[]
  experiences: Experience[]
  skills: Skill[]
  onSaved: () => void // recharger les listes du profil
  onClose: (message?: string) => void
}

export default function CvReview({ proposal, educations, experiences, skills, onSaved, onClose }: Props) {
  // Le profil actuel sert à comparer et à compléter le PUT (qui remplace tout le profil)
  const [current, setCurrent] = useState<ProfileInput | null>(null)
  const [identity, setIdentity] = useState<IdentityRow[]>([])
  const [identityErrors, setIdentityErrors] = useState<Record<string, string>>({})
  const [eduItems, setEduItems] = useState<Item<EducationValues>[]>(() =>
    proposal.educations.map((e, i) => {
      const values = educationToValues(e)
      const duplicate = educations.some((x) => same(x.program, e.program) && same(x.institution, e.institution))
      return item(`formation-${i}`, values, duplicate, isIncompleteEducation(values))
    }))
  const [expItems, setExpItems] = useState<Item<ExperienceValues>[]>(() =>
    proposal.experiences.map((e, i) => {
      const values = experienceToValues(e)
      const duplicate = experiences.some((x) => same(x.title, e.title) && same(x.company, e.company))
      return item(`experience-${i}`, values, duplicate, isIncompleteExperience(values))
    }))
  const [skillItems, setSkillItems] = useState<Item<SkillInput>[]>(() =>
    proposal.skills.map((s, i) => item(`competence-${i}`, s, skills.some((x) => same(x.name, s.name)), false)))
  const [loadError, setLoadError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  // Total sur tous les essais : après une correction, on réenregistre seulement le reste
  const savedTotal = useRef(0)

  useEffect(() => {
    api.getProfile()
      .then((profile) => {
        const input = Object.fromEntries(IDENTITY_KEYS.map((k) => [k, profile[k]])) as ProfileInput
        setCurrent(input)
        setIdentity(identityRows(proposal.profile, input))
      })
      .catch((e: unknown) => setLoadError(errorMessage(e)))
  }, [proposal])

  const selectedCount = identity.filter((r) => r.selected).length
    + [eduItems, expItems, skillItems].reduce((n, list) => n + list.filter((x) => x.selected).length, 0)

  // ---------- Enregistrement ----------
  // Chaque élément coché passe par l'API habituelle, qui le valide. Ce qui est
  // refusé reste affiché avec son erreur ; le reste disparaît de l'écran.
  async function handleSave() {
    if (!current) return
    setSaving(true)
    setError(null)
    let saved = 0
    let failed = 0

    const chosen = identity.filter((r) => r.selected)
    if (chosen.length > 0) {
      const payload: ProfileInput = { ...current }
      for (const row of chosen) payload[row.name] = toNullable(row.value)
      try {
        const updated = await api.updateProfile(payload)
        const input = Object.fromEntries(IDENTITY_KEYS.map((k) => [k, updated[k]])) as ProfileInput
        setCurrent(input)
        setIdentity((rows) => rows.filter((r) => !r.selected))
        setIdentityErrors({})
        saved += chosen.length
      } catch (e) {
        failed += 1
        setIdentityErrors(fieldErrorsOf(e))
      }
    }

    // Enregistre les éléments cochés d'une liste, un par un, et renvoie ce qui reste à afficher
    async function saveList<V>(list: Item<V>[], create: (values: V) => Promise<unknown>) {
      const remaining: Item<V>[] = []
      for (const it of list) {
        if (!it.selected) {
          remaining.push(it)
          continue
        }
        try {
          await create(it.values)
          saved += 1
        } catch (e) {
          // 409 : la compétence existe déjà (écrite autrement) ; rien à corriger
          if (e instanceof ApiError && e.status === 409) continue
          failed += 1
          const errors = fieldErrorsOf(e)
          remaining.push({ ...it, open: true, errors: Object.keys(errors).length ? errors : { form: errorMessage(e) } })
        }
      }
      return remaining
    }

    setEduItems(await saveList(eduItems, (v) => api.createEducation(educationToPayload(v))))
    setExpItems(await saveList(expItems, (v) => api.createExperience(experienceToPayload(v))))
    setSkillItems(await saveList(skillItems, (v) => api.createSkill({ name: v.name, category: v.category })))

    setSaving(false)
    savedTotal.current += saved
    if (saved > 0) onSaved()
    if (failed === 0) {
      const total = savedTotal.current
      onClose(`${total} élément${total > 1 ? 's' : ''} ajouté${total > 1 ? 's' : ''} à ton profil. Vérifie chaque partie.`)
    } else {
      setError(`${failed} élément${failed > 1 ? 's n’ont' : ' n’a'} pas pu être enregistré${failed > 1 ? 's' : ''}. `
        + 'Corrige ce qui est indiqué ci-dessous, puis enregistre de nouveau. Le reste est déjà dans ton profil.')
    }
  }

  // ---------- Petites aides pour modifier un élément d'une liste ----------
  function update<V>(setter: (fn: (list: Item<V>[]) => Item<V>[]) => void, key: string, patch: Partial<Item<V>>) {
    setter((list) => list.map((it) => (it.key === key ? { ...it, ...patch } : it)))
  }
  function changeValue<V>(setter: (fn: (list: Item<V>[]) => Item<V>[]) => void, key: string, name: string, value: unknown) {
    setter((list) => list.map((it) => (it.key === key ? { ...it, values: { ...it.values, [name]: value } } : it)))
  }

  if (loadError) return <Message kind="erreur">{loadError}</Message>
  if (!current) return <p className="secondaire">Chargement du profil…</p>

  const nothingLeft = identity.length + eduItems.length + expItems.length + skillItems.length === 0

  return (
    <>
      <h1 className="titre-page">Relire le CV importé</h1>
      <p className="chapeau">
        Coche ce qu’il faut ajouter à ton profil et corrige ce qui est faux. Rien n’est enregistré
        avant que tu cliques sur « Ajouter au profil ».
      </p>

      {nothingLeft && <p className="vide">Ton CV n’apporte rien de nouveau à ton profil.</p>}

      {identity.length > 0 && (
        <section className="import-partie" aria-labelledby="import-identite">
          <h2 className="titre-section" id="import-identite">Coordonnées</h2>
          <ul className="liste">
            {identity.map((row) => (
              <li key={row.name} className="ligne-import">
                <input type="checkbox" className="import-case" checked={row.selected}
                  aria-label={`Ajouter : ${IDENTITY_LABELS[row.name]}`}
                  onChange={(e) => setIdentity((rows) =>
                    rows.map((r) => (r.name === row.name ? { ...r, selected: e.target.checked } : r)))} />
                <Field id={`import-${row.name}`} name={row.name} label={IDENTITY_LABELS[row.name]}
                  value={row.value} multiline={row.name === 'summary'} error={identityErrors[row.name]}
                  hint={row.current ? `Remplace « ${row.current} »` : 'Vide dans ton profil.'}
                  onChange={(_name, value) => setIdentity((rows) =>
                    rows.map((r) => (r.name === row.name ? { ...r, value } : r)))} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {expItems.length > 0 && (
        <section className="import-partie" aria-labelledby="import-experiences">
          <h2 className="titre-section" id="import-experiences">Expériences</h2>
          <ul className="liste">
            {expItems.map((it) => (
              <ReviewLine key={it.key} item={it} label={it.values.title || 'Expérience sans titre'}
                details={[it.values.company, KIND_LABELS[it.values.kind],
                  formatPeriod(toNullable(it.values.startDate), toNullable(it.values.endDate))]}
                incomplete={isIncompleteExperience(it.values)}
                onSelect={(selected) => update(setExpItems, it.key, { selected })}
                onToggle={() => update(setExpItems, it.key, { open: !it.open })}>
                <ExperienceFields idPrefix={it.key} values={it.values} errors={it.errors}
                  onChange={(name, value) => changeValue(setExpItems, it.key, name, value)}
                  onRelevantChange={(relevant) => changeValue(setExpItems, it.key, 'relevant', relevant)} />
              </ReviewLine>
            ))}
          </ul>
        </section>
      )}

      {eduItems.length > 0 && (
        <section className="import-partie" aria-labelledby="import-scolarite">
          <h2 className="titre-section" id="import-scolarite">Scolarité</h2>
          <ul className="liste">
            {eduItems.map((it) => (
              <ReviewLine key={it.key} item={it} label={it.values.program || 'Formation sans programme'}
                details={[it.values.institution,
                  formatPeriod(toNullable(it.values.startDate), toNullable(it.values.endDate))]}
                incomplete={isIncompleteEducation(it.values)}
                onSelect={(selected) => update(setEduItems, it.key, { selected })}
                onToggle={() => update(setEduItems, it.key, { open: !it.open })}>
                <EducationFields idPrefix={it.key} values={it.values} errors={it.errors}
                  onChange={(name, value) => changeValue(setEduItems, it.key, name, value)} />
              </ReviewLine>
            ))}
          </ul>
        </section>
      )}

      {skillItems.length > 0 && (
        <section className="import-partie" aria-labelledby="import-competences">
          <h2 className="titre-section" id="import-competences">Compétences</h2>
          <ul className="import-competences">
            {skillItems.map((it) => (
              <li key={it.key}>
                <label className="case">
                  <input type="checkbox" checked={it.selected}
                    onChange={(e) => update(setSkillItems, it.key, { selected: e.target.checked })} />
                  <span>
                    {it.values.name}
                    {it.values.category && <span className="secondaire"> · {it.values.category}</span>}
                    {it.duplicate && <span className="secondaire"> · déjà dans ton profil</span>}
                  </span>
                </label>
                {it.errors.form && <Message kind="erreur">{it.errors.form}</Message>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="boutons import-actions">
        {!nothingLeft && (
          <button type="button" className="bouton" onClick={handleSave} disabled={saving || selectedCount === 0}>
            {saving ? 'Enregistrement…' : 'Ajouter au profil'}
          </button>
        )}
        <button type="button" className="bouton bouton--contour" onClick={() => onClose()} disabled={saving}>
          {nothingLeft ? 'Revenir au profil' : 'Annuler l’import'}
        </button>
        {!nothingLeft && !error && (
          <span className="secondaire">
            {selectedCount} élément{selectedCount > 1 ? 's' : ''} coché{selectedCount > 1 ? 's' : ''}
          </span>
        )}
        {error && <Message kind="erreur">{error}</Message>}
      </div>
    </>
  )
}

// Une formation ou une expérience proposée : résumé sur une ligne, champs
// complets sous la ligne quand on l'ouvre pour la corriger
interface ReviewLineProps<V> {
  item: Item<V>
  label: string
  details: string[]
  incomplete: boolean
  onSelect: (selected: boolean) => void
  onToggle: () => void
  children: ReactNode
}

function ReviewLine<V>({ item, label, details, incomplete, onSelect, onToggle, children }: ReviewLineProps<V>) {
  const notes = [
    item.duplicate && 'Déjà dans ton profil',
    incomplete && 'À compléter',
  ].filter(Boolean)
  return (
    <li className="ligne-import">
      <input type="checkbox" className="import-case" checked={item.selected}
        aria-label={`Ajouter : ${label}`} onChange={(e) => onSelect(e.target.checked)} />
      <div className="import-contenu">
        <div className="import-resume">
          <div>
            <div className="ligne-titre">{label}</div>
            <div className="secondaire">{details.filter(Boolean).join(' · ')}</div>
            {notes.length > 0 && <div className="import-note">{notes.join(' · ')}</div>}
          </div>
          <button type="button" className="bouton-icone" onClick={onToggle} aria-expanded={item.open}
            aria-label={item.open ? `Fermer la correction de « ${label} »` : `Corriger « ${label} »`}
            title={item.open ? 'Fermer' : 'Corriger'}>
            <Pencil size={20} aria-hidden="true" />
          </button>
        </div>
        {item.errors.form && <Message kind="erreur">{item.errors.form}</Message>}
        {item.open && <div className="bloc-edition formulaire">{children}</div>}
      </div>
    </li>
  )
}
