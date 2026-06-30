import { useState } from 'react'
import MascotReaction from './MascotReaction.jsx'
import RaceCard from './RaceCard.jsx'
import Stars from './Stars.jsx'

// Result screen (§10) with a two-column layout:
//   • desktop: results on the LEFT, mascot video + score on the RIGHT (sticky)
//   • mobile:  video + score on top (the reward), results below
export default function ResultView({ result, mascot, onTryAgain, onNewPrompt, onUseImproved }) {
  const [copied, setCopied] = useState(false)

  const copyImproved = async () => {
    try {
      await navigator.clipboard.writeText(result.improvedPrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      /* clipboard may be blocked; ignore */
    }
    onUseImproved?.(result.improvedPrompt)
  }

  return (
    <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-7 lg:items-start">
      {/* VIDEO + SCORE — DOM-first (mobile top), ordered RIGHT on desktop */}
      <aside className="lg:order-2 lg:sticky lg:top-20">
        <div className="bg-white border border-neutral-200 rounded-card shadow-soft p-5">
          <MascotReaction mascot={mascot} score={result.overallScore} line={result.mascotLine} />
        </div>
      </aside>

      {/* RESULTS — ordered LEFT on desktop */}
      <div className="lg:order-1 mt-6 lg:mt-0 flex flex-col gap-5">
        {/* Headline + stars */}
        <div className="bg-white border border-neutral-200 rounded-card shadow-soft p-5">
          <Stars count={result.overallStars} size={26} />
          <h2 className="mt-2 font-display font-extrabold text-2xl text-indigo-ink leading-tight">
            {result.headline}
          </h2>
        </div>

        {/* RACE cards */}
        <div>
          <h3 className="font-display font-bold text-sm uppercase tracking-wide text-neutral-400 mb-2 px-1">
            Your RACE breakdown
          </h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <RaceCard part="role" data={result.race.role} />
            <RaceCard part="ask" data={result.race.ask} />
            <RaceCard part="context" data={result.race.context} />
            <RaceCard part="example" data={result.race.example} />
          </div>
        </div>

        {/* Level up */}
        {result.levelUp && (
          <div className="rounded-card p-4 border-2" style={{ background: '#FFFBEB', borderColor: '#FCD34D' }}>
            <div className="font-display font-bold text-[#7A5300] flex items-center gap-2">
              <span>⚡</span> Level up
            </div>
            <p className="mt-1 font-body text-[#7A5300]">{result.levelUp}</p>
          </div>
        )}

        {/* Stronger rewrite */}
        {result.improvedPrompt && (
          <div className="rounded-card bg-white border border-neutral-200 shadow-soft p-4">
            <div className="font-display font-bold text-indigo-ink flex items-center gap-2">
              <span>✨</span> Try this stronger version
            </div>
            <p className="mt-2 font-body text-indigo-ink bg-cream rounded-[14px] p-3 border border-neutral-200 whitespace-pre-wrap">
              {result.improvedPrompt}
            </p>
            <button
              onClick={copyImproved}
              className="mt-3 bg-spark text-indigo-ink rounded-pill font-display font-bold px-5 py-2.5 hover:-translate-y-0.5 transition"
            >
              {copied ? 'Copied! ✓' : 'Use this'}
            </button>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onTryAgain}
            className="flex-1 bg-white text-purple-700 border-2 border-purple-200 rounded-pill font-display font-bold py-3 hover:bg-purple-50 transition"
          >
            Try again
          </button>
          <button
            onClick={onNewPrompt}
            className="flex-1 bg-brand text-white rounded-pill shadow-glow font-display font-bold py-3 hover:-translate-y-0.5 transition"
          >
            New prompt
          </button>
        </div>
      </div>
    </div>
  )
}
