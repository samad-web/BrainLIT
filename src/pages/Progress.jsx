import { useEffect, useState } from 'react'
import { useStudent } from '../context/StudentContext.jsx'
import { store } from '../store/index.js'
import { summarize, raceExtremes, PART_LABEL, PART_COLOR } from '../lib/stats.js'
import Sparkline from '../components/Sparkline.jsx'
import Stars from '../components/Stars.jsx'

export default function Progress() {
  const { student } = useStudent()
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let on = true
    if (student?.id) {
      store.listAttempts(student.id).then((a) => { if (on) { setAttempts(a); setLoading(false) } })
    } else setLoading(false)
    return () => { on = false }
  }, [student?.id])

  if (loading) return <Loading />
  if (!attempts.length) return <Empty />

  const stats = summarize(attempts)
  const last10 = attempts.slice(-10)
  const scores = last10.map((a) => a.overallScore || 0)
  const { strongest, weakest } = raceExtremes(stats.racePctStrong)

  // Friendly trend caption — never negative.
  const climbing = scores.length >= 2 && scores[scores.length - 1] >= scores[0]
  const trendCaption = climbing ? 'Your scores are climbing! 📈' : "Keep practicing — your next climb is coming! 💪"

  return (
    <div className="flex flex-col gap-5 mx-auto max-w-2xl">
      <h1 className="font-display font-extrabold text-2xl text-indigo-ink">Your journey 🚀</h1>

      {/* Score over time */}
      <Card>
        <div className="flex items-center justify-between">
          <h2 className="font-display font-bold text-indigo-ink">Score over time</h2>
          <span className="font-body text-sm text-neutral-500">last {scores.length}</span>
        </div>
        <div className="mt-3">
          <Sparkline values={scores} max={100} width={300} height={70} color="#FBBF24" mode="bar" />
        </div>
        <p className="mt-2 font-body text-neutral-600">{trendCaption}</p>
      </Card>

      {/* RACE strengths */}
      <Card>
        <h2 className="font-display font-bold text-indigo-ink">Your RACE strengths</h2>
        <p className="font-body text-sm text-purple-600 font-bold mt-1">
          You're a {PART_LABEL[strongest]} star! Let's grow your {PART_LABEL[weakest]} next.
        </p>
        <div className="mt-4 flex flex-col gap-3">
          {['role', 'ask', 'context', 'example'].map((p) => (
            <div key={p}>
              <div className="flex justify-between text-sm font-body mb-1">
                <span className="font-bold text-indigo-ink">{PART_LABEL[p]}</span>
                <span className="text-neutral-500">{stats.racePctStrong[p]}% strong</span>
              </div>
              <div className="h-3 rounded-pill bg-neutral-100 overflow-hidden">
                <div className="h-full rounded-pill transition-all" style={{ width: `${stats.racePctStrong[p]}%`, background: PART_COLOR[p] }} />
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Next goal */}
      <div className="rounded-card p-4 border-2" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
        <div className="font-display font-bold text-[#7A5300] flex items-center gap-2"><span>🎯</span> Next goal</div>
        <p className="mt-1 font-body text-[#7A5300]">
          Try adding a stronger <span className="font-bold">{PART_LABEL[weakest]}</span> to your next prompt!
        </p>
      </div>

      {/* Recent prompts */}
      <Card>
        <h2 className="font-display font-bold text-indigo-ink mb-3">Recent prompts</h2>
        <div className="flex flex-col gap-3">
          {[...attempts].reverse().slice(0, 6).map((a) => (
            <div key={a.id} className="rounded-[14px] border border-neutral-200 bg-cream p-3">
              <div className="flex items-center justify-between gap-3">
                <Stars count={a.overallStars || 0} size={18} />
                <span className="font-display font-bold text-sm" style={{ color: '#9061D9' }}>{a.overallScore ?? 0}/100</span>
              </div>
              <p className="mt-1 font-body text-sm text-indigo-ink line-clamp-2">{truncate(a.prompt, 120)}</p>
              <div className="mt-1 font-body text-xs text-neutral-400">{formatDate(a.createdAt)}</div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  )
}

const truncate = (s, n) => (s && s.length > n ? s.slice(0, n) + '…' : s || '')
const formatDate = (iso) => {
  try { return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) } catch { return '' }
}

const Card = ({ children }) => (
  <div className="bg-white border border-neutral-200 rounded-card shadow-soft p-5">{children}</div>
)

const Loading = () => (
  <div className="text-center font-display text-purple-500 animate-pulse mt-10">Loading your journey…</div>
)

const Empty = () => (
  <div className="text-center mt-10 px-6">
    <div className="text-5xl">🌱</div>
    <h1 className="mt-3 font-display font-extrabold text-2xl text-indigo-ink">Your journey starts here!</h1>
    <p className="mt-2 font-body text-neutral-600">Check your first prompt on the Home tab to see your progress grow.</p>
  </div>
)
