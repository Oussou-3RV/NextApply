import type { EducationValues } from '../lib/profileForms'
import Field from './Field'

interface Props {
  values: EducationValues
  errors: Record<string, string>
  onChange: (name: string, value: string) => void
  idPrefix?: string // pour des id uniques quand plusieurs formulaires sont affichés
}

// Les champs d'une formation, sans le <form> ni les boutons autour
export default function EducationFields({ values, errors, onChange, idPrefix }: Props) {
  const id = (name: string) => (idPrefix ? `${idPrefix}-${name}` : undefined)
  return (
    <>
      <div className="grille-champs">
        <Field id={id('program')} name="program" label="Programme" value={values.program}
          onChange={onChange} error={errors.program} />
        <Field id={id('institution')} name="institution" label="Établissement" value={values.institution}
          onChange={onChange} error={errors.institution} />
        <Field id={id('level')} name="level" label="Niveau" value={values.level}
          hint="Par exemple : baccalauréat, DEC." onChange={onChange} error={errors.level} />
        <Field id={id('startDate')} name="startDate" label="Début" type="date" value={values.startDate}
          onChange={onChange} error={errors.startDate} />
        <Field id={id('endDate')} name="endDate" label="Fin" type="date" value={values.endDate}
          hint="Vide si en cours." onChange={onChange} error={errors.endDate ?? errors.dateRangeValid} />
      </div>
      <Field id={id('description')} name="description" label="Description" multiline value={values.description}
        onChange={onChange} error={errors.description} />
    </>
  )
}
