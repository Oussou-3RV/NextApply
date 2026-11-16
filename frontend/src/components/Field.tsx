import { CircleAlert } from 'lucide-react'
import type { ChangeEvent } from 'react'

interface FieldProps {
  label: string
  name: string
  id?: string // à donner quand le même formulaire apparaît plusieurs fois sur la page
  value: string
  onChange: (name: string, value: string) => void
  error?: string
  type?: 'text' | 'email' | 'tel' | 'url' | 'date' | 'password'
  multiline?: boolean
  options?: { value: string; label: string }[] // présent = liste déroulante
  autoComplete?: string
  hint?: string
}

// Un champ : libellé au-dessus, un trait dessous, et le message d'erreur du backend
export default function Field({
  label, name, id: givenId, value, onChange, error, type = 'text', multiline = false, options, autoComplete, hint,
}: FieldProps) {
  const id = givenId ?? `champ-${name}`
  const errorId = `${id}-erreur`
  const handle = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    onChange(name, e.target.value)
  const common = {
    id,
    name,
    value,
    onChange: handle,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? errorId : undefined,
  }

  return (
    <div className="champ">
      <label htmlFor={id}>{label}</label>
      {options ? (
        <select {...common}>
          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      ) : multiline ? (
        <textarea {...common} rows={5} />
      ) : (
        <input {...common} type={type} autoComplete={autoComplete} />
      )}
      {hint && !error && <span className="secondaire message">{hint}</span>}
      {error && (
        <span id={errorId} className="champ-erreur">
          <CircleAlert size={16} aria-hidden="true" />
          {error}
        </span>
      )}
    </div>
  )
}
