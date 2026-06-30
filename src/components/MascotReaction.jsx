import { useEffect, useRef, useState } from 'react'
import { videoBase } from '../mascots.js'
import { tierFromScore, tierMeta } from '../lib/score.js'

// Plays the reaction clip for the score, with the score shown below.
// Tier → clip:  100 → excellent.mp4 · ≥70 → good.mp4 · <70 → try-harder.mp4
//
// Robust playback: the <video> is keyed by src so it fully remounts per tier,
// muted is set on the DOM node (React doesn't reflect the property reliably),
// the clip loops so motion is always visible, and if the browser still blocks
// autoplay we show a tap-to-play overlay.
export default function MascotReaction({ mascot, score = 0, line, compact = false }) {
  const tier = tierFromScore(score)
  const src = `${videoBase()}/${tier}.mp4`
  const meta = tierMeta[tier]

  const reduceMotion =
    typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

  const ringColor = score >= 100 ? '#F59E0B' : score >= 70 ? '#9061D9' : '#4A90E2'
  const box = compact ? 'max-w-[220px]' : 'max-w-sm'

  return (
    <div className="flex flex-col items-center">
      <div className={`relative w-full ${box} aspect-square rounded-card overflow-hidden bg-cream border border-neutral-200 shadow-soft`}>
        {tier === 'excellent' && !reduceMotion && (
          <div className="absolute inset-0 bg-spark opacity-60 animate-pulse" aria-hidden="true" />
        )}
        {/* key={src} → fresh element per tier so the correct clip always loads */}
        <ClipPlayer key={src} src={src} mascot={mascot} meta={meta} />
      </div>

      {/* SCORE below the video */}
      <div className="mt-4 flex flex-col items-center">
        <div className="font-display font-extrabold leading-none" style={{ color: ringColor, fontSize: compact ? 40 : 64 }}>
          {score}
          <span className="text-neutral-400" style={{ fontSize: compact ? 18 : 26 }}>/100</span>
        </div>
        <div className="mt-1 font-display text-lg" style={{ color: ringColor }}>
          {meta.emoji} {meta.label}
        </div>
      </div>

      {line && (
        <div className="mt-3 relative max-w-xs">
          <div className="rounded-card bg-white border-2 px-4 py-3 text-center font-body font-bold text-indigo-ink shadow-soft" style={{ borderColor: mascot?.color || '#9061D9' }}>
            <span aria-hidden="true" className="mr-1">💬</span>
            {line}
          </div>
        </div>
      )}
    </div>
  )
}

function ClipPlayer({ src, mascot, meta }) {
  const ref = useRef(null)
  const [error, setError] = useState(false)
  const [needsTap, setNeedsTap] = useState(false)

  const tryPlay = () => {
    const v = ref.current
    if (!v) return
    v.muted = true
    const p = v.play?.()
    if (p && typeof p.then === 'function') {
      p.then(() => setNeedsTap(false)).catch(() => setNeedsTap(true))
    }
  }

  // Always attempt playback — the reaction clip is the content (and is muted),
  // so we don't gate it on prefers-reduced-motion.
  useEffect(() => {
    const v = ref.current
    if (!v) return
    v.muted = true
    if (v.readyState >= 2) tryPlay()
    const onCanPlay = () => tryPlay()
    v.addEventListener('canplay', onCanPlay)
    return () => v.removeEventListener('canplay', onCanPlay)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [src])

  if (error) return <Placeholder mascot={mascot} meta={meta} />

  return (
    <>
      <video
        ref={ref}
        className="relative h-full w-full object-cover"
        src={src}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        controls={false}
        onError={() => setError(true)}
        onClick={tryPlay}
      />
      {needsTap && (
        <button
          type="button"
          onClick={tryPlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20"
          aria-label="Play"
        >
          <span className="h-16 w-16 rounded-full bg-white/90 flex items-center justify-center text-3xl text-purple-600 shadow-glow">▶</span>
        </button>
      )}
    </>
  )
}

function Placeholder({ mascot, meta }) {
  return (
    <div className="relative h-full w-full flex flex-col items-center justify-center text-white" style={{ background: mascot?.color || '#9061D9' }}>
      <div className="text-6xl">{meta.emoji}</div>
      <div className="mt-2 font-display text-2xl">{mascot?.name || 'Buddy'}</div>
      <div className="mt-1 text-sm opacity-90 font-body">(reaction clip)</div>
    </div>
  )
}
