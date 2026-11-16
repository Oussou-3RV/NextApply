import { KIND_OPTIONS } from '../lib/profileForms'
import type { ExperienceValues } from '../lib/profileForms'
import Field from './Field'

interface Props {
  values: ExperienceValues
  errors: Record<string, string>
  onChange: (name: string, value: string) => void
  onRelevantChange: (relevant: boolean) => void
  idPrefix?: string // pour des id uniques quand plusieurs formulaires sont affichés
}

// Les champs d'une expérience, sans le <form> ni les boutons autour
export default function ExperienceFields({ values, errors, onChange, onRelevantChange, idPrefix }: Props) {
  const id = (name: string) => (idPrefix ? `${idPrefix}-${name}` : undefined)
  return (
    <>
      <div className="grille-champs">
        <Field id={id('title')} name="title" label="Poste" value={values.title}
          onChange={onChange} error={errors.title} />
        <Field id={id('company')} name="company" label="Entreprise ou organisme" value={values.company}
          onChange={onChange} error={errors.company} />
        <Field id={id('kind')} name="kind" label="Type" options={KIND_OPTIONS} value={values.kind}
          onChange={onChange} error={errors.kind} />
        <Field id={id('location')} name="location" label="Lieu" value={values.location}
          onChange={onChange} error={errors.location} />
        <Field id={id('startDate')} name="startDate" label="Début" type="date" value={values.startDate}
          onChange={onChange} error={errors.startDate} />
        <Field id={id('endDate')} name="endDate" label="Fin" type="date" value={values.endDate}
          hint="Vide si en cours." onChange={onChange} error={errors.endDate ?? errors.dateRangeValid} />
      </div>
      <Field id={id('description')} name="description" label="Description : tâches, technologies, résultats"
        multiline value={values.description} onChange={onChange} error={errors.description} />
      <label className="case">
        <input type="checkbox" checked={values.relevant} onChange={(e) => onRelevantChange(e.target.checked)} />
        Pertinente pour mes candidatures en informatique
      </label>
    </>
  )
}
