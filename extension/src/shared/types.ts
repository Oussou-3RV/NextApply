// Ce que la fenêtre de l'extension envoie au script de la page. Seulement les
// valeurs à écrire dans le formulaire : jamais le jeton de connexion.
export interface FillProfile {
  firstName: string | null
  lastName: string | null
  fullName: string | null
  email: string | null
  phone: string | null
  city: string | null
  region: string | null
  country: string | null
  location: string | null // « Ville, région » pour les champs « Lieu » ou « Location »
  linkedin: string | null
  github: string | null
  portfolio: string | null
}

export type FieldKey = keyof FillProfile

// Ce que le script de la page renvoie, pour chaque cadre (iframe) de la page
export interface FillResult {
  filled: FieldKey[]
}
