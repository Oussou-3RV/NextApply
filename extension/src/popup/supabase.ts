import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL
const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !key) {
  throw new Error('Variables Supabase manquantes dans frontend/.env.local')
}

// La popup n'a pas de localStorage durable : la session (jetons Supabase) est
// gardée dans chrome.storage.local, réservé à l'extension. Les pages web ne
// peuvent pas le lire, et le script injecté dans la page ne reçoit jamais le jeton.
const chromeStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const stored = await chrome.storage.local.get(name)
    const value = stored[name]
    return typeof value === 'string' ? value : null
  },
  setItem: (name: string, value: string) => chrome.storage.local.set({ [name]: value }),
  removeItem: (name: string) => chrome.storage.local.remove(name),
}

export const supabase = createClient(url, key, {
  auth: {
    storage: chromeStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false, // pas de redirection par lien dans une extension
  },
})
