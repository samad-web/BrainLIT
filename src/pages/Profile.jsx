import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudent } from '../context/StudentContext.jsx'
import { store } from '../store/index.js'
import { summarize, computeBadges } from '../lib/stats.js'
import { videoBase } from '../mascots.js'

export default function Profile() {
  const { student, mascot, update, logout } = useStudent()
  const navigate = useNavigate()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [editingName, setEditingName] = useState(false)
  const [name, setName] = useState(student?.firstName || '')

  useEffect(() => {
    let on = true
    if (student?.id) {
      store.listAttempts(student.id).then((a) => { if (on) { setAttempts(a); setLoading(false) } })
    } else setLoading(false)
    return () => { on = false }
  }, [student?.id])

  const stats = summarize(attempts)
  const badges = computeBadges(attempts)

  const saveName = async () => {
    if (name.trim()) await update({ firstName: name.trim() })
    setEditingName(false)
  }
  const doLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col gap-5 mx-auto max-w-2xl">
      {/* Header with buddy */}
      <div className="rounded-card overflow-hidden shadow-soft" style={{ background: `${mascot?.color}22` }}>
        <div className="flex items-center gap-4 p-5">
          <BuddyBubble mascot={mascot} />
          <div>
            <div className="font-body text-sm text-neutral-500">Buddy: {mascot?.name}</div>
            <h1 className="font-display font-extrabold text-2xl" style={{ color: mascot?.color }}>
              {student?.firstName}
            </h1>
          </div>
        </div>
      </div>

      {/* Stats chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Chip label="Prompts" value={stats.total} color="#4A90E2" />
        <Chip label="Stars earned" value={stats.totalStars} color="#FBBF24" />
        <Chip label="Best score" value={loading ? '—' : stats.bestScore} color="#9061D9" />
        <Chip label="Day streak" value={stats.streak} color="#EC4899" />
      </div>

      {/* Badges */}
      <Section title="Badges 🏆">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map((b) => (
            <div
              key={b.id}
              className={`rounded-card border p-3 text-center ${b.earned ? 'bg-white border-neutral-200 shadow-soft' : 'bg-neutral-50 border-dashed border-neutral-300'}`}
              style={b.earned ? {} : { opacity: 0.6 }}
            >
              <div className="text-3xl">{b.emoji}</div>
              <div className="font-display font-bold text-sm text-indigo-ink mt-1">{b.name}</div>
              <div className="font-body text-xs text-neutral-500 mt-0.5">{b.earned ? 'Earned!' : b.goal}</div>
            </div>
          ))}
        </div>
      </Section>

      {/* My name */}
      <Section title="My name">
        {editingName ? (
          <div className="flex gap-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={20}
              className="flex-1 bg-cream border-2 border-neutral-200 rounded-[14px] px-4 py-2.5 font-body focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none"
              autoFocus
            />
            <button onClick={saveName} className="bg-brand text-white rounded-pill shadow-glow font-display font-bold px-5">Save</button>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <span className="font-display font-bold text-indigo-ink">{student?.firstName}</span>
            <button onClick={() => { setName(student?.firstName || ''); setEditingName(true) }} className="font-display font-bold text-purple-600 border-2 border-purple-200 rounded-pill px-4 py-2 hover:bg-purple-50">
              Edit name
            </button>
          </div>
        )}
      </Section>

      {/* Account */}
      <Section title="My account">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="font-body text-sm text-neutral-500">Class code</div>
            <div className="font-display font-bold text-indigo-ink tracking-wide">{student?.classCode || '—'}</div>
            {student?.username && (
              <>
                <div className="font-body text-sm text-neutral-500 mt-2">Username</div>
                <div className="font-display font-bold text-indigo-ink">{student.username}</div>
              </>
            )}
          </div>
          <button onClick={doLogout} className="font-display font-bold text-circuit-pink border-2 border-pink-200 rounded-pill px-4 py-2 hover:bg-pink-50">
            Log out
          </button>
        </div>
      </Section>
    </div>
  )
}

function BuddyBubble({ mascot }) {
  const [ok, setOk] = useState(true)
  const src = `${videoBase(mascot?.id)}/good.mp4`
  return (
    <div className="h-20 w-20 rounded-full overflow-hidden border-2 bg-white shrink-0" style={{ borderColor: mascot?.color }}>
      {ok ? (
        <video
          className="h-full w-full object-cover"
          autoPlay loop muted playsInline
          ref={(el) => { if (el) { el.muted = true; el.play?.().catch(() => {}) } }}
          onError={() => setOk(false)}
        >
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        <div className="h-full w-full flex items-center justify-center font-display text-white text-2xl" style={{ background: mascot?.color }}>
          {mascot?.name?.[0]}
        </div>
      )}
    </div>
  )
}

const Chip = ({ label, value, color }) => (
  <div className="bg-white border border-neutral-200 rounded-card shadow-soft p-3 text-center">
    <div className="font-display font-extrabold text-2xl" style={{ color }}>{value}</div>
    <div className="font-body text-xs text-neutral-500">{label}</div>
  </div>
)

const Section = ({ title, children }) => (
  <div className="bg-white border border-neutral-200 rounded-card shadow-soft p-5">
    <h2 className="font-display font-bold text-lg text-indigo-ink mb-3">{title}</h2>
    {children}
  </div>
)
