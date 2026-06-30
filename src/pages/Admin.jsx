import { useEffect, useMemo, useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { store, STORE_KIND } from '../store/index.js'
import { summarize, PART_LABEL, PART_COLOR } from '../lib/stats.js'
import { getMascot } from '../mascots.js'
import { getAdminSession, signOutAdmin, onAdminAuthChange } from '../lib/supabaseAuth.js'
import Sparkline from '../components/Sparkline.jsx'
import Logo from '../components/Logo.jsx'
import ConfirmDialog from '../components/ConfirmDialog.jsx'

// Classes are managed entirely by the admin, so the per-class teacher passcode is
// no longer used for login; we store a fixed placeholder to satisfy the column.
const CLASS_PASSCODE = 'admin-managed'

// Shared style tokens so the whole dashboard is visually uniform with the
// Brainlit design system (rounded-card, shadow-soft, rounded-pill, cream inputs).
const CARD = 'bg-white border border-neutral-200 rounded-card shadow-soft'
const INPUT =
  'w-full bg-cream border-2 border-neutral-200 rounded-[14px] px-3.5 py-2.5 font-body outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100'
const BTN_PRIMARY =
  'bg-base text-white rounded-pill font-display font-bold px-5 py-2.5 hover:-translate-y-0.5 transition disabled:opacity-60 disabled:translate-y-0'
const BTN_GHOST =
  'border-2 border-neutral-200 text-neutral-700 rounded-pill font-display font-bold px-4 py-2.5 hover:bg-neutral-50 transition'
const BTN_DANGER =
  'border-2 border-pink-200 text-pink-600 rounded-pill font-display font-bold px-4 py-2.5 hover:bg-pink-50 transition'
const H2 = 'font-display font-bold text-lg text-indigo-ink'

// Tracks the admin's Supabase Auth session.
function useAdminSession() {
  const [state, setState] = useState({ loading: true, session: null })
  useEffect(() => {
    let on = true
    getAdminSession().then((s) => { if (on) setState({ loading: false, session: s }) })
    const unsub = onAdminAuthChange((s) => setState({ loading: false, session: s }))
    return () => { on = false; unsub() }
  }, [])
  return state
}

// Admin dashboard (§13). Gated by the admin's Supabase Auth session.
export default function Admin() {
  const navigate = useNavigate()
  const { loading, session } = useAdminSession()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <div className="font-display text-purple-500 text-lg animate-pulse">Loading…</div>
      </div>
    )
  }
  // Not signed in as the admin → redirect (no flash of protected content).
  if (!session) return <Navigate to="/login" replace />

  const logout = async () => { await signOutAdmin(); navigate('/login', { replace: true }) }

  return (
    <div className="min-h-screen bg-cream font-body">
      <header className="bg-base text-white">
        <div className="mx-auto max-w-5xl px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Logo size={34} />
            <div>
              <div className="font-display font-bold text-lg leading-tight">RACE Coach · Admin</div>
              <div className="text-xs text-white/70">Class dashboard</div>
            </div>
          </div>
          <button onClick={logout} className="text-sm text-white/80 hover:text-white underline">Log out</button>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-5 py-6">
        {STORE_KIND === 'local' && (
          <div className="mb-5 rounded-card border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            <b>Local mode:</b> this dashboard only shows data created on <i>this device</i>. Switch to Supabase
            (VITE_STORE=supabase) to see everything across devices.
          </div>
        )}

        <AdminBody />
      </main>
    </div>
  )
}

// Loads the admin's classes, lets them create/select one, and shows that class.
function AdminBody() {
  const [classes, setClasses] = useState(null)
  const [selected, setSelected] = useState('')
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState('overview') // 'overview' | 'student'
  const [activeStudent, setActiveStudent] = useState(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let on = true
    store.listClasses().then((cs) => {
      if (!on) return
      setClasses(cs)
      setSelected((prev) => prev || cs[0]?.code || '')
    })
    return () => { on = false }
  }, [reloadKey])

  const onCreated = (code) => { setSelected(code); setCreating(false); setView('overview'); setActiveStudent(null); setReloadKey((k) => k + 1) }

  if (!classes) return <div className="text-neutral-500 mt-2">Loading…</div>

  // No classes yet → first-run create.
  if (classes.length === 0) {
    return <CreateClass firstTime onCreated={onCreated} />
  }

  return (
    <div className="flex flex-col gap-5">
      <ClassBar
        classes={classes}
        selected={selected}
        onSelect={(c) => { setSelected(c); setView('overview'); setActiveStudent(null) }}
        onCreate={() => setCreating(true)}
      />

      {creating && <CreateClass onCreated={onCreated} onCancel={() => setCreating(false)} />}

      {view === 'student' && activeStudent ? (
        <StudentDrilldown student={activeStudent} onBack={() => { setView('overview'); setActiveStudent(null) }} />
      ) : (
        <Overview key={selected} classCode={selected} onOpenStudent={(s) => { setActiveStudent(s); setView('student') }} />
      )}
    </div>
  )
}

// Class selector + "new class" button.
function ClassBar({ classes, selected, onSelect, onCreate }) {
  return (
    <div className={`${CARD} p-4 flex flex-wrap items-center justify-between gap-3`}>
      <label className="flex items-center gap-3">
        <span className="text-sm font-display font-bold text-neutral-500">Class</span>
        <select
          value={selected}
          onChange={(e) => onSelect(e.target.value)}
          className="bg-cream border-2 border-neutral-200 rounded-pill px-4 py-2 font-display font-bold text-indigo-ink outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
        >
          {classes.map((c) => (
            <option key={c.code} value={c.code}>{c.name || 'Class'} ({c.code})</option>
          ))}
        </select>
      </label>
      <button onClick={onCreate} className={BTN_PRIMARY}>+ New class</button>
    </div>
  )
}

// Admin-only: create a class (generates a code students will be added under).
function CreateClass({ onCreated, onCancel, firstTime }) {
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  const create = async () => {
    setError('')
    setBusy(true)
    try {
      const { code } = await store.createClass(name.trim() || 'My Class', CLASS_PASSCODE)
      onCreated(code)
    } catch {
      setError('Could not create the class. Try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${CARD} p-5 ${firstTime ? 'max-w-md mx-auto mt-2' : ''}`}>
      <h2 className={H2}>{firstTime ? 'Create your first class' : 'Create a class'}</h2>
      <p className="text-sm text-neutral-500 mt-1">Give it a name; we'll generate a class code.</p>
      <div className="mt-4 flex flex-col gap-3">
        <Field label="Class name">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Class name" className={INPUT}
            onKeyDown={(e) => e.key === 'Enter' && create()} autoFocus />
        </Field>
        {error && <p className="text-pink-600 font-bold text-sm">{error}</p>}
        <div className="flex gap-2">
          <button onClick={create} disabled={busy} className={BTN_PRIMARY}>
            {busy ? 'Creating…' : 'Create class'}
          </button>
          {!firstTime && onCancel && (
            <button onClick={onCancel} className={BTN_GHOST}>Cancel</button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Class overview ───────────────────────────────────────────────────────────
function Overview({ classCode, onOpenStudent }) {
  const [rows, setRows] = useState(null)
  const [sortKey, setSortKey] = useState('name')
  const [sortDir, setSortDir] = useState(1)
  const [reloadKey, setReloadKey] = useState(0)
  const reload = () => setReloadKey((k) => k + 1)

  useEffect(() => {
    let on = true
    ;(async () => {
      const students = await store.listStudents(classCode)
      const enriched = await Promise.all(
        students.map(async (s) => {
          const attempts = await store.listAttempts(s.id)
          return { student: s, attempts, stats: summarize(attempts) }
        })
      )
      if (on) setRows(enriched)
    })()
    return () => { on = false }
  }, [classCode, reloadKey])

  const insights = useMemo(() => (rows ? classInsights(rows) : null), [rows])

  if (!rows) return <div className="text-neutral-500 mt-6">Loading class…</div>

  const sorted = [...rows].sort((a, b) => {
    const get = (r) => {
      switch (sortKey) {
        case 'prompts': return r.stats.total
        case 'avg': return r.stats.avgStars
        case 'last': return r.stats.lastActive ? new Date(r.stats.lastActive).getTime() : 0
        default: return r.student.firstName.toLowerCase()
      }
    }
    const va = get(a), vb = get(b)
    if (va < vb) return -1 * sortDir
    if (va > vb) return 1 * sortDir
    return 0
  })

  const toggleSort = (k) => {
    if (sortKey === k) setSortDir((d) => -d)
    else { setSortKey(k); setSortDir(1) }
  }

  const weekTotal = rows.reduce((s, r) => s + r.attempts.filter((a) => withinDays(a.createdAt, 7)).length, 0)

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div>
        <h1 className="font-display font-extrabold text-2xl text-indigo-ink">Class {classCode}</h1>
        <div className="text-sm text-neutral-500">{rows.length} students · {weekTotal} prompts this week</div>
      </div>

      {/* Add student */}
      <AddStudent classCode={classCode} onAdded={reload} />

      {/* Insights */}
      {insights && rows.length > 0 && (
        <div className="grid sm:grid-cols-3 gap-4">
          <InsightCard title="Teach next" value={PART_LABEL[insights.weakestPart]} sub="Weakest RACE part across the class" color={PART_COLOR[insights.weakestPart]} />
          <InsightCard title="Most improved" value={insights.mostImproved || '—'} sub="this week" color="#16794A" />
          <InsightCard title="Hasn't practiced" value={insights.idle.length ? insights.idle.join(', ') : "Everyone's active! 🎉"} sub="nudge these students" color="#EC4899" />
        </div>
      )}

      {/* Students table */}
      {rows.length === 0 ? (
        <div className={`${CARD} p-6 text-center text-neutral-600`}>
          No students yet. Add your first student above and hand them the username + password.
        </div>
      ) : (
        <div className={`${CARD} overflow-hidden`}>
          <div className="px-5 pt-4 pb-2">
            <h2 className={H2}>Students</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 text-neutral-500 border-y border-neutral-200">
                <tr>
                  <Th onClick={() => toggleSort('name')} active={sortKey === 'name'}>Name</Th>
                  <th className="text-left px-4 py-2.5 font-semibold">Username</th>
                  <Th onClick={() => toggleSort('prompts')} active={sortKey === 'prompts'}>Prompts</Th>
                  <Th onClick={() => toggleSort('avg')} active={sortKey === 'avg'}>Avg ⭐</Th>
                  <Th onClick={() => toggleSort('last')} active={sortKey === 'last'}>Last active</Th>
                  <th className="text-left px-4 py-2.5 font-semibold">7-day</th>
                  <th className="px-4 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => {
                  const last7 = r.attempts.filter((a) => withinDays(a.createdAt, 7)).map((a) => a.overallStars || 0)
                  const m = getMascot(r.student.mascotId)
                  return (
                    <tr key={r.student.id} className="border-t border-neutral-100 hover:bg-neutral-50 cursor-pointer" onClick={() => onOpenStudent(r.student)}>
                      <td className="px-4 py-2.5 font-bold text-indigo-ink">{r.student.firstName}</td>
                      <td className="px-4 py-2.5 text-neutral-500 font-mono text-xs">{r.student.username || '—'}</td>
                      <td className="px-4 py-2.5">{r.stats.total}</td>
                      <td className="px-4 py-2.5">{r.stats.avgStars.toFixed(1)}</td>
                      <td className="px-4 py-2.5 text-neutral-500">{r.stats.lastActive ? formatDate(r.stats.lastActive) : '—'}</td>
                      <td className="px-4 py-2.5"><Sparkline values={last7.length ? last7 : [0]} max={4} width={90} height={28} color={m.color} mode="line" /></td>
                      <td className="px-4 py-2.5 text-right text-purple-600 font-display font-bold whitespace-nowrap">View →</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Add student (teacher creates the login) ───────────────────────────────────
function AddStudent({ classCode, onAdded }) {
  const [open, setOpen] = useState(false)
  const [firstName, setFirstName] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const [created, setCreated] = useState(null)

  const genPassword = () => {
    const words = ['star', 'moon', 'lion', 'bolt', 'nova', 'kite', 'wave', 'pixel', 'owl', 'spark']
    const w = words[Math.floor(Math.random() * words.length)]
    const n = 10 + Math.floor(Math.random() * 89)
    setPassword(`${w}${n}`)
  }
  const suggestUsername = (name) => {
    const base = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')
    if (base) setUsername(`${base}${Math.floor(Math.random() * 90) + 10}`)
  }

  const submit = async (e) => {
    e?.preventDefault()
    setError('')
    if (!firstName.trim()) return setError("Enter the student's first name.")
    if (!username.trim()) return setError('Enter a username.')
    if (!password) return setError('Set a password (or use Generate).')
    setBusy(true)
    try {
      await store.createStudent(classCode, { firstName, username, password, mascotId: 'buddy' })
      setCreated({ firstName: firstName.trim(), username: username.trim().toLowerCase(), password })
      setFirstName(''); setUsername(''); setPassword('')
      onAdded?.()
    } catch (err) {
      setError(err?.kind === 'dup-username' ? 'That username is taken — pick another.' : (err?.message || 'Could not add student.'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className={`${CARD} p-5`}>
      <div className="flex items-center justify-between">
        <h2 className={H2}>Add a student</h2>
        <button onClick={() => { setOpen((v) => !v); setCreated(null) }} className="text-sm font-display font-bold text-purple-600 hover:text-purple-700">
          {open ? 'Close' : '+ New student'}
        </button>
      </div>

      {created && (
        <div className="mt-4 rounded-card border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          <b>{created.firstName}</b> is ready! Give them these credentials:
          <div className="mt-2 font-mono text-emerald-900">
            username: <b>{created.username}</b><br />password: <b>{created.password}</b>
          </div>
        </div>
      )}

      {open && (
        <form onSubmit={submit} className="mt-4 grid sm:grid-cols-2 gap-4">
          <Field label="First name">
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} onBlur={() => !username && suggestUsername(firstName)} className={INPUT} placeholder="First name" />
          </Field>
          <Field label="Username">
            <input value={username} onChange={(e) => setUsername(e.target.value)} autoCapitalize="none" className={`${INPUT} lowercase`} placeholder="Username" />
          </Field>
          <Field label="Password">
            <div className="flex gap-2">
              <input value={password} onChange={(e) => setPassword(e.target.value)} className={INPUT} placeholder="Password" />
              <button type="button" onClick={genPassword} className={`${BTN_GHOST} whitespace-nowrap`}>Generate</button>
            </div>
          </Field>
          {error && <p className="sm:col-span-2 text-pink-600 font-bold text-sm">{error}</p>}
          <div className="sm:col-span-2">
            <button type="submit" disabled={busy} className={BTN_PRIMARY}>
              {busy ? 'Adding…' : 'Create student'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

// ── Student drill-down ────────────────────────────────────────────────────────
function StudentDrilldown({ student, onBack }) {
  const [attempts, setAttempts] = useState(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const m = getMascot(student.mascotId)

  const reload = () => store.listAttempts(student.id).then(setAttempts)
  useEffect(() => { reload() /* eslint-disable-next-line */ }, [student.id])

  if (!attempts) return <div className="text-neutral-500 mt-6">Loading {student.firstName}…</div>
  const stats = summarize(attempts)

  const exportCsv = () => {
    const header = ['createdAt', 'overallScore', 'overallStars', 'role', 'ask', 'context', 'example', 'prompt', 'goal', 'levelUp', 'improvedPrompt']
    const esc = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`
    const lines = [header.join(',')].concat(attempts.map((a) => header.map((h) => esc(a[h])).join(',')))
    const blob = new Blob([lines.join('\n')], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${student.firstName}-attempts.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  const removeData = async () => {
    setConfirmDelete(false)
    await store.removeStudent(student.id)
    onBack()
  }

  return (
    <div className="flex flex-col gap-5">
      <ConfirmDialog
        open={confirmDelete}
        title={`Delete ${student.firstName}'s data?`}
        message="This permanently removes their account and all their prompts. This cannot be undone."
        confirmLabel="Delete"
        danger
        onConfirm={removeData}
        onCancel={() => setConfirmDelete(false)}
      />
      <button onClick={onBack} className="text-purple-600 font-display font-bold text-sm self-start hover:text-purple-700">← Back to class</button>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="h-11 w-11 rounded-full flex items-center justify-center text-white font-display font-bold text-lg" style={{ background: m.color }}>{student.firstName[0]}</span>
          <div>
            <h1 className="font-display font-extrabold text-2xl text-indigo-ink">{student.firstName}</h1>
            <div className="text-sm text-neutral-500">{stats.total} prompts · avg {stats.avgStars.toFixed(1)}⭐</div>
            {student.username && (
              <div className="text-xs text-neutral-400 font-mono mt-0.5">
                login: {student.username}{student.password ? ` / ${student.password}` : ''}
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCsv} className={BTN_GHOST}>Export CSV</button>
          <button onClick={() => setConfirmDelete(true)} className={BTN_DANGER}>Delete data</button>
        </div>
      </div>

      {/* RACE breakdown */}
      <div className={`${CARD} p-5`}>
        <h2 className={`${H2} mb-3`}>RACE breakdown <span className="text-neutral-400 font-body text-sm">(% strong)</span></h2>
        <div className="flex flex-col gap-3">
          {['role', 'ask', 'context', 'example'].map((p) => (
            <div key={p}>
              <div className="flex justify-between text-sm mb-1">
                <span className="font-display font-bold text-indigo-ink">{PART_LABEL[p]}</span>
                <span className="text-neutral-500">{stats.racePctStrong[p]}%</span>
              </div>
              <div className="h-3 rounded-pill bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-pill transition-all" style={{ width: `${stats.racePctStrong[p]}%`, background: PART_COLOR[p] }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Attempts timeline */}
      <div className={`${CARD} p-5`}>
        <h2 className={`${H2} mb-3`}>Attempts</h2>
        {!attempts.length ? (
          <div className="text-neutral-500 text-sm">No attempts yet.</div>
        ) : (
          <div className="flex flex-col gap-3">
            {[...attempts].reverse().map((a) => (
              <div key={a.id} className="border border-neutral-200 rounded-[14px] p-3.5">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-neutral-500">{formatDateTime(a.createdAt)}</span>
                  <span className="font-display font-bold text-purple-600">{a.overallScore ?? 0}/100 · {a.overallStars ?? 0}⭐</span>
                </div>
                <div className="mt-1.5 text-sm text-indigo-ink"><b>Prompt:</b> {a.prompt}</div>
                {a.improvedPrompt && <div className="mt-1 text-sm text-neutral-600"><b>AI rewrite:</b> {a.improvedPrompt}</div>}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {['role', 'ask', 'context', 'example'].map((p) => (
                    <span key={p} className="text-xs font-display font-bold rounded-pill px-2.5 py-0.5 text-white" style={{ background: PART_COLOR[p], opacity: a[p] === 'strong' ? 1 : a[p] === 'okay' ? 0.6 : 0.3 }}>
                      {PART_LABEL[p]}: {a[p]}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ── helpers ───────────────────────────────────────────────────────────────────
function classInsights(rows) {
  const parts = ['role', 'ask', 'context', 'example']
  const partAvg = {}
  for (const p of parts) {
    const active = rows.filter((r) => r.stats.total > 0)
    partAvg[p] = active.length ? active.reduce((s, r) => s + r.stats.racePctStrong[p], 0) / active.length : 0
  }
  const weakestPart = parts.reduce((a, b) => (partAvg[b] < partAvg[a] ? b : a))

  let mostImproved = null
  let bestDelta = 0
  for (const r of rows) {
    const wk = r.attempts.filter((a) => withinDays(a.createdAt, 7)).map((a) => a.overallStars || 0)
    if (wk.length < 4) continue
    const mid = Math.floor(wk.length / 2)
    const first = avg(wk.slice(0, mid)), second = avg(wk.slice(mid))
    const delta = second - first
    if (delta > bestDelta) { bestDelta = delta; mostImproved = r.student.firstName }
  }

  const idle = rows.filter((r) => !r.stats.lastActive || !withinDays(r.stats.lastActive, 7)).map((r) => r.student.firstName)

  return { weakestPart, mostImproved, idle }
}

const avg = (arr) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0)
const withinDays = (iso, days) => {
  if (!iso) return false
  return Date.now() - new Date(iso).getTime() <= days * 86400000
}
const formatDate = (iso) => { try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) } catch { return '' } }
const formatDateTime = (iso) => { try { return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) } catch { return '' } }

const Field = ({ label, children }) => (
  <label className="block">
    <span className="text-xs font-display font-bold text-neutral-500 uppercase tracking-wide">{label}</span>
    <div className="mt-1.5">{children}</div>
  </label>
)
const Th = ({ children, onClick, active }) => (
  <th onClick={onClick} className={`text-left px-4 py-2.5 font-semibold cursor-pointer select-none whitespace-nowrap ${active ? 'text-indigo-ink' : ''}`}>{children}{active ? ' ↕' : ''}</th>
)
const InsightCard = ({ title, value, sub, color }) => (
  <div className={`${CARD} p-4`}>
    <div className="text-xs font-display font-bold uppercase tracking-wide text-neutral-400">{title}</div>
    <div className="font-display font-extrabold text-lg mt-1" style={{ color }}>{value}</div>
    <div className="text-xs text-neutral-500 mt-0.5">{sub}</div>
  </div>
)
