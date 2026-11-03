import { supabase } from './supabase'

export interface Me {
  id: string
  email: string
}

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8080'

export async function fetchMe(): Promise<Me> {

  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) throw new Error('Non connecté')

  const response = await fetch(`${API_URL}/api/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!response.ok) throw new Error(`Erreur API : ${response.status}`)
    
  return response.json()
}