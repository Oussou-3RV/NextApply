// Les formulaires manipulent du texte ; l'API attend null pour un champ vide.
export const toInput = (value: string | null | undefined): string => value ?? ''
export const toNullable = (value: string): string | null => (value.trim() === '' ? null : value)

const monthYear = new Intl.DateTimeFormat('fr-CA', { month: 'short', year: 'numeric' })

// "2025-09-01" → "sept. 2025". On découpe la chaîne au lieu de new Date("2025-09-01"),
// qui l'interpréterait en UTC et pourrait afficher le mois précédent.
function formatMonth(isoDate: string): string {
  const [year, month] = isoDate.split('-').map(Number)
  return monthYear.format(new Date(year, month - 1, 1))
}

export function formatPeriod(startDate: string | null, endDate: string | null): string {
  if (!startDate && !endDate) return ''
  const start = startDate ? formatMonth(startDate) : '?'
  const end = endDate ? formatMonth(endDate) : 'en cours'
  return `${start} – ${end}`
}
