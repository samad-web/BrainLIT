import { useState } from 'react'
import { useStudent } from '../context/StudentContext.jsx'
import { checkPrompt, hasGroqKey } from '../lib/groq.js'
import { store } from '../store/index.js'
import ResultView from '../components/ResultView.jsx'

const PHASE = { INPUT: 'input', LOADING: 'loading', RESULT: 'result' }

export default function Home() {
  const { student, mascot } = useStudent()
  const [prompt, setPrompt] = useState('')
  const [goal, setGoal] = useState('')
  const [phase, setPhase] = useState(PHASE.INPUT)
  const [result, setResult] = useState(null)
  const [error, setError] = useState('')

  const run = async () => {
    setError('')
    if (!prompt.trim()) {
      setError('Type a prompt first, then I can check it!')
      return
    }
    if (!hasGroqKey()) {
      setError('The coach is not set up yet. Please ask your teacher.')
      return
    }
    setPhase(PHASE.LOADING)
    try {
      const res = await checkPrompt({ prompt: prompt.trim(), goal: goal.trim(), mascot })
      setResult(res)
      setPhase(PHASE.RESULT)
      // Write the attempt to the store (§14).
      await store.saveAttempt({
        studentId: student.id,
        createdAt: new Date().toISOString(),
        prompt: prompt.trim(),
        goal: goal.trim(),
        overallScore: res.overallScore,
        overallStars: res.overallStars,
        role: res.race.role.status,
        ask: res.race.ask.status,
        context: res.race.context.status,
        example: res.race.example.status,
        levelUp: res.levelUp,
        improvedPrompt: res.improvedPrompt,
      })
    } catch (e) {
      setPhase(PHASE.INPUT)
      if (e?.kind === 'no-key') {
        setError('The coach is not set up yet. Please ask your teacher.')
      } else {
        setError(e?.message || 'Something went wrong. Try again.')
      }
    }
  }

  const tryAgain = () => {
    setResult(null)
    setPhase(PHASE.INPUT)
  }
  const newPrompt = () => {
    setResult(null)
    setPrompt('')
    setGoal('')
    setPhase(PHASE.INPUT)
  }
  const useImproved = (improved) => {
    setPrompt(improved)
  }

  return (
    <div>
      {phase === PHASE.RESULT && result ? (
        <ResultView
          result={result}
          mascot={mascot}
          onTryAgain={tryAgain}
          onNewPrompt={newPrompt}
          onUseImproved={useImproved}
        />
      ) : (
        <div className="flex flex-col gap-4 mx-auto max-w-2xl">
          {/* Greeting */}
          <div>
            <h1 className="font-display font-extrabold text-2xl text-indigo-ink">
              Hi {student?.firstName || 'friend'}! 👋
            </h1>
            <p className="font-body text-neutral-600">
              Let's check a prompt with <span className="font-bold" style={{ color: mascot?.color }}>{mascot?.name}</span>.
            </p>
          </div>

          {/* Prompt input */}
          <div className="bg-white border border-neutral-200 rounded-card shadow-soft p-4">
            <label className="font-display font-bold text-indigo-ink">Type the prompt you want to give the AI.</label>
            <textarea
              className="mt-2 w-full min-h-[120px] bg-cream border-2 border-neutral-200 rounded-[14px] px-4 py-3 font-body focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none resize-y"
              placeholder="Type your prompt here…"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              maxLength={1000}
            />

            <label className="mt-4 block font-display font-bold text-indigo-ink">
              What are you trying to make? <span className="font-body font-normal text-neutral-400">(optional)</span>
            </label>
            <input
              className="mt-2 w-full bg-cream border-2 border-neutral-200 rounded-[14px] px-4 py-3 font-body focus:border-blue-400 focus:ring-4 focus:ring-blue-100 outline-none"
              placeholder="What you want to make…"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              maxLength={200}
            />

            {error && <p className="mt-3 font-body text-circuit-pink font-bold">{error}</p>}

            <button
              onClick={run}
              disabled={phase === PHASE.LOADING}
              className="mt-4 w-full bg-brand text-white rounded-pill shadow-glow font-display font-bold py-3.5 text-lg hover:-translate-y-0.5 transition disabled:opacity-60"
            >
              {phase === PHASE.LOADING ? 'Checking your prompt…' : 'Check my prompt! 🚀'}
            </button>
          </div>

          {phase === PHASE.LOADING && (
            <div className="text-center font-display text-purple-500 animate-pulse">
              {mascot?.name} is reading your prompt…
            </div>
          )}

          {/* Mini RACE reminder */}
          <RaceReminder />
        </div>
      )}
    </div>
  )
}

function RaceReminder() {
  const items = [
    { l: 'R', t: 'Role', d: 'who the AI should be', c: '#4A90E2' },
    { l: 'A', t: 'Ask', d: 'what to do', c: '#9061D9' },
    { l: 'C', t: 'Context', d: 'about your world', c: '#22D3EE' },
    { l: 'E', t: 'Example', d: 'show what great looks like', c: '#F59E0B' },
  ]
  return (
    <div className="bg-white border border-neutral-200 rounded-card shadow-soft p-4">
      <div className="font-display font-bold text-indigo-ink mb-2">Remember RACE:</div>
      <div className="grid grid-cols-2 gap-2">
        {items.map((i) => (
          <div key={i.l} className="flex items-center gap-2">
            <span className="h-7 w-7 rounded-pill flex items-center justify-center font-display font-bold text-white text-sm" style={{ background: i.c }}>
              {i.l}
            </span>
            <span className="font-body text-sm">
              <span className="font-bold text-indigo-ink">{i.t}</span>{' '}
              <span className="text-neutral-500">— {i.d}</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
