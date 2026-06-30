import { createClient } from '@supabase/supabase-js'

// AUTH client for the admin (Supabase Auth — real email/password, no secret in
// the bundle). Kept separate from the data client so admin sign-in does not
// change the role used for data requests. Its own storageKey keeps the session
// isolated.
const url = import.meta.env.VITE_SUPABASE_URL
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY

export const adminConfigured = () => !!(url && anon)

let _auth = null
const authClient = () => {
  if (!_auth) {
    if (!adminConfigured()) throw new Error('Supabase is not configured for admin auth.')
    _auth = createClient(url, anon, {
      auth: { persistSession: true, autoRefreshToken: true, storageKey: 'brainlit-admin-auth' },
    })
  }
  return _auth
}

export async function signInAdmin(email, password) {
  const { data, error } = await authClient().auth.signInWithPassword({ email: (email || '').trim(), password })
  if (error) {
    const e = new Error(error.message)
    e.kind = 'bad-login'
    throw e
  }
  return data.session
}

export async function signOutAdmin() {
  try { await authClient().auth.signOut() } catch { /* ignore */ }
}

export async function getAdminSession() {
  if (!adminConfigured()) return null
  const { data } = await authClient().auth.getSession()
  return data?.session || null
}

export function onAdminAuthChange(cb) {
  if (!adminConfigured()) return () => {}
  const { data } = authClient().auth.onAuthStateChange((_event, session) => cb(session))
  return () => data?.subscription?.unsubscribe?.()
}
