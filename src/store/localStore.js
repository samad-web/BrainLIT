// localStore — all data in localStorage. Zero setup, single device.
// The admin dashboard only sees students created on THIS device (see §14.3).
// Implements the store interface in ./index.js.

const K = {
  identity: 'brainlit_student',     // { classCode, studentId, firstName, mascotId }
  classes: 'brainlit_classes',      // [{ code, name, teacherPasscode, createdAt }]
  students: 'brainlit_students',    // [{ id, classCode, firstName, mascotId, createdAt }]
  attempts: 'brainlit_attempts',    // [Attempt]
}

const read = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : fallback
  } catch {
    return fallback
  }
}
const write = (key, val) => localStorage.setItem(key, JSON.stringify(val))

// Lightweight unique id (crypto.randomUUID where available).
const uid = () =>
  (globalThis.crypto?.randomUUID?.() ||
    `id-${Date.now().toString(36)}-${Math.floor(Math.random() * 1e9).toString(36)}`)

const norm = (code) => (code || '').trim().toUpperCase()

export const localStore = {
  async createClass(name, passcode) {
    const classes = read(K.classes, [])
    // Friendly short code, e.g. BRAINLIT-7G3
    let code
    do {
      const suffix = Math.random().toString(36).slice(2, 5).toUpperCase()
      code = `BRAINLIT-${suffix}`
    } while (classes.some((c) => c.code === code))
    classes.push({ code, name: name || 'My Class', teacherPasscode: String(passcode || ''), createdAt: new Date().toISOString() })
    write(K.classes, classes)
    return { code }
  },

  async classExists(code) {
    return read(K.classes, []).some((c) => c.code === norm(code))
  },

  async getClass(code) {
    return read(K.classes, []).find((c) => c.code === norm(code)) || null
  },

  async listClasses() {
    return read(K.classes, [])
      .map((c) => ({ id: c.code, code: c.code, name: c.name }))
      .sort((a, b) => (a.name || '').localeCompare(b.name || ''))
  },

  // Teacher creates a student with login credentials (new auth flow).
  async createStudent(classCode, { firstName, username, password, mascotId } = {}) {
    const cc = norm(classCode)
    const classes = read(K.classes, [])
    if (!classes.some((c) => c.code === cc)) {
      const err = new Error('That class code was not found.'); err.kind = 'no-class'; throw err
    }
    const uname = String(username || '').trim().toLowerCase()
    if (!uname) { const e = new Error('Username is required.'); e.kind = 'bad-input'; throw e }
    if (!password) { const e = new Error('Password is required.'); e.kind = 'bad-input'; throw e }
    const students = read(K.students, [])
    if (students.some((s) => (s.username || '').toLowerCase() === uname)) {
      const e = new Error('That username is already taken.'); e.kind = 'dup-username'; throw e
    }
    const student = {
      id: uid(),
      classCode: cc,
      firstName: String(firstName || '').trim() || 'Friend',
      username: uname,
      password: String(password),
      mascotId: mascotId || null,
      createdAt: new Date().toISOString(),
    }
    students.push(student)
    write(K.students, students)
    return student
  },

  // Student logs in with the credentials their teacher gave them.
  async loginStudent(username, password) {
    const uname = String(username || '').trim().toLowerCase()
    const students = read(K.students, [])
    const student = students.find(
      (s) => (s.username || '').toLowerCase() === uname && s.password === String(password)
    )
    if (!student) { const e = new Error('Wrong username or password.'); e.kind = 'bad-login'; throw e }
    return student
  },

  async getStudent() {
    const identity = read(K.identity, null)
    if (!identity?.studentId) return null
    const students = read(K.students, [])
    const found = students.find((s) => s.id === identity.studentId)
    // Fall back to identity if the student record was cleared but identity remains.
    return found || (identity.studentId
      ? { id: identity.studentId, classCode: identity.classCode, firstName: identity.firstName, mascotId: identity.mascotId }
      : null)
  },

  async updateStudent(patch) {
    const identity = read(K.identity, null)
    if (!identity?.studentId) throw new Error('No student to update.')
    const students = read(K.students, [])
    const idx = students.findIndex((s) => s.id === identity.studentId)
    if (idx >= 0) {
      students[idx] = { ...students[idx], ...patch }
      write(K.students, students)
    }
    const newIdentity = { ...identity, ...patch }
    write(K.identity, newIdentity)
    return students[idx] || newIdentity
  },

  async saveAttempt(attempt) {
    const attempts = read(K.attempts, [])
    attempts.push({ id: uid(), ...attempt })
    write(K.attempts, attempts)
  },

  async listAttempts(studentId) {
    return read(K.attempts, [])
      .filter((a) => a.studentId === studentId)
      .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
  },

  async verifyTeacher(code, passcode) {
    const cls = read(K.classes, []).find((c) => c.code === norm(code))
    return !!cls && cls.teacherPasscode === String(passcode || '')
  },

  async listStudents(classCode) {
    const cc = norm(classCode)
    const students = read(K.students, []).filter((s) => s.classCode === cc)
    return students
  },

  async removeStudent(studentId) {
    write(K.students, read(K.students, []).filter((s) => s.id !== studentId))
    write(K.attempts, read(K.attempts, []).filter((a) => a.studentId !== studentId))
  },

  // ── identity helpers (local convenience; not part of the abstract interface) ──
  saveIdentity(identity) {
    write(K.identity, identity)
  },
  getIdentity() {
    return read(K.identity, null)
  },
  clearIdentity() {
    localStorage.removeItem(K.identity)
  },
}
