import { createClient } from '@supabase/supabase-js'

// DATA client. Always anonymous (persistSession:false) so every data request
// uses the `anon` role and the existing RLS policies apply — independent of
// whether an admin is logged in via Supabase Auth (that uses a separate client).
const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseConfigured = () => !!(url && anon)

let _client = null
export const supabase = () => {
  if (!_client) {
    if (!supabaseConfigured()) {
      throw new Error('Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    }
    _client = createClient(url, anon, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  }
  return _client
}
