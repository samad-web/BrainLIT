// supabaseStore — cross-device (required for the admin dashboard to see remote
// students). The anon/public key is safe to ship in the browser bundle.
//
// Setup: create a free project at supabase.com, run the schema in §14.2 of the
// spec, enable Row Level Security, then set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY
// and VITE_STORE=supabase in your .env.
//
// Identity (which student "I" am) still lives in localStorage; only the shared
// records (classes, students, attempts) live in Supabase.
// Shared anonymous data client (admin auth uses a separate client in supabaseAuth.js).
import { supabase as client } from '../lib/supabaseClient.js'

const IDENTITY_KEY = 'brainlit_student'
const readIdentity = () => {
  try { return JSON.parse(localStorage.getItem(IDENTITY_KEY) || 'null') } catch { return null }
}
const writeIdentity = (v) => localStorage.setItem(IDENTITY_KEY, JSON.stringify(v))

const norm = (code) => (code || '').trim().toUpperCase()

// Map DB rows (snake_case) → app shapes (camelCase) for attempts.
const rowToAttempt = (r) => ({
  id: r.id,
  studentId: r.student_id,
  createdAt: r.created_at,
  prompt: r.prompt,
  goal: r.goal,
  overallScore: r.overall_score,
  overallStars: r.overall_stars,
  role: r.role,
  ask: r.ask,
  context: r.context,
  example: r.example,
  levelUp: r.level_up,
  improvedPrompt: r.improved_prompt,
})

const rowToStudent = (r) => ({
  id: r.id,
  classCode: r.class_code, // resolved via join/view below, see listStudents
  firstName: r.first_name,
  username: r.username,
  password: r.password,
  mascotId: r.mascot_id,
  createdAt: r.created_at,
})

export const supabaseStore = {
  async createClass(name, passcode) {
    const code = `BRAINLIT-${Math.random().toString(36).slice(2, 5).toUpperCase()}`
    const { error } = await client()
      .from('classes')
      .insert({ code, name: name || 'My Class', teacher_passcode: String(passcode || '') })
    if (error) throw error
    return { code }
  },

  async classExists(code) {
    const { data, error } = await client().from('classes').select('id').eq('code', norm(code)).maybeSingle()
    if (error) throw error
    return !!data
  },

  async getClass(code) {
    const { data, error } = await client().from('classes').select('*').eq('code', norm(code)).maybeSingle()
    if (error) throw error
    return data
  },

  async listClasses() {
    const { data, error } = await client().from('classes').select('id, code, name').order('name', { ascending: true })
    if (error) throw error
    return data || []
  },

  // Teacher creates a student with login credentials (new auth flow).
  async createStudent(classCode, { firstName, username, password, mascotId } = {}) {
    const cc = norm(classCode)
    const uname = String(username || '').trim().toLowerCase()
    if (!uname) { const e = new Error('Username is required.'); e.kind = 'bad-input'; throw e }
    if (!password) { const e = new Error('Password is required.'); e.kind = 'bad-input'; throw e }
    const { data: cls, error: ce } = await client().from('classes').select('id').eq('code', cc).maybeSingle()
    if (ce) throw ce
    if (!cls) { const e = new Error('That class code was not found.'); e.kind = 'no-class'; throw e }

    // Pre-check username uniqueness for a friendly error (unique index also enforces it).
    const { data: existing } = await client().from('students').select('id').ilike('username', uname).maybeSingle()
    if (existing) { const e = new Error('That username is already taken.'); e.kind = 'dup-username'; throw e }

    const { data, error } = await client()
      .from('students')
      .insert({ class_id: cls.id, first_name: String(firstName || '').trim() || 'Friend', username: uname, password: String(password), mascot_id: mascotId || null })
      .select()
      .single()
    if (error) {
      if (error.code === '23505') { const e = new Error('That username is already taken.'); e.kind = 'dup-username'; throw e }
      throw error
    }
    return { id: data.id, classCode: cc, firstName: data.first_name, username: data.username, mascotId: data.mascot_id, createdAt: data.created_at }
  },

  // Student logs in with teacher-issued credentials.
  async loginStudent(username, password) {
    const uname = String(username || '').trim().toLowerCase()
    const { data, error } = await client()
      .from('students')
      .select('*, classes(code)')
      .ilike('username', uname)
      .eq('password', String(password))
      .maybeSingle()
    if (error) throw error
    if (!data) { const e = new Error('Wrong username or password.'); e.kind = 'bad-login'; throw e }
    return {
      id: data.id,
      classCode: data.classes?.code || '',
      firstName: data.first_name,
      username: data.username,
      mascotId: data.mascot_id,
      createdAt: data.created_at,
    }
  },

  async getStudent() {
    const identity = readIdentity()
    if (!identity?.studentId) return null
    const { data, error } = await client().from('students').select('*').eq('id', identity.studentId).maybeSingle()
    if (error) throw error
    if (!data) return { id: identity.studentId, classCode: identity.classCode, firstName: identity.firstName, username: identity.username, mascotId: identity.mascotId }
    return { id: data.id, classCode: identity.classCode, firstName: data.first_name, username: data.username, mascotId: data.mascot_id, createdAt: data.created_at }
  },

  async updateStudent(patch) {
    const identity = readIdentity()
    if (!identity?.studentId) throw new Error('No student to update.')
    const dbPatch = {}
    if (patch.firstName !== undefined) dbPatch.first_name = patch.firstName
    if (patch.mascotId !== undefined) dbPatch.mascot_id = patch.mascotId
    if (Object.keys(dbPatch).length) {
      const { error } = await client().from('students').update(dbPatch).eq('id', identity.studentId)
      if (error) throw error
    }
    writeIdentity({ ...identity, ...patch })
    return { ...identity, ...patch }
  },

  async saveAttempt(attempt) {
    const { error } = await client().from('attempts').insert({
      student_id: attempt.studentId,
      prompt: attempt.prompt,
      goal: attempt.goal,
      overall_score: attempt.overallScore,
      overall_stars: attempt.overallStars,
      role: attempt.role,
      ask: attempt.ask,
      context: attempt.context,
      example: attempt.example,
      level_up: attempt.levelUp,
      improved_prompt: attempt.improvedPrompt,
    })
    if (error) throw error
  },

  async listAttempts(studentId) {
    const { data, error } = await client()
      .from('attempts')
      .select('*')
      .eq('student_id', studentId)
      .order('created_at', { ascending: true })
    if (error) throw error
    return (data || []).map(rowToAttempt)
  },

  async verifyTeacher(code, passcode) {
    const { data, error } = await client().from('classes').select('teacher_passcode').eq('code', norm(code)).maybeSingle()
    if (error) throw error
    return !!data && data.teacher_passcode === String(passcode || '')
  },

  async listStudents(classCode) {
    const { data: cls, error: ce } = await client().from('classes').select('id').eq('code', norm(classCode)).maybeSingle()
    if (ce) throw ce
    if (!cls) return []
    const { data, error } = await client().from('students').select('*').eq('class_id', cls.id)
    if (error) throw error
    return (data || []).map((r) => ({ ...rowToStudent(r), classCode: norm(classCode) }))
  },

  async removeStudent(studentId) {
    // attempts cascade via FK on delete cascade
    const { error } = await client().from('students').delete().eq('id', studentId)
    if (error) throw error
  },

  // identity helpers (mirror localStore)
  saveIdentity: writeIdentity,
  getIdentity: readIdentity,
  clearIdentity: () => localStorage.removeItem(IDENTITY_KEY),
}
