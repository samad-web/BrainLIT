// Scoring + tier logic.
//
// The AI returns BOTH:
//   - overall_score (0–100): a holistic, kid-friendly score (drives the video tier)
//   - overall_stars (0–4):  number of RACE parts that are 'strong' (drives stars/badges)
//
// Video tiers requested by the product:
//   score === 100        → 'excellent'   (celebrating clip)
//   score  >= 70         → 'good'        (encouraging clip)
//   score  <  70         → 'try-harder'  (cheer-up clip)
export const tierFromScore = (score) => {
  const s = clampScore(score)
  if (s >= 100) return 'excellent'
  if (s >= 70) return 'good'
  return 'try-harder'
}

// Kept for the star display + badges (spec §6/§11).
export const tierFromStars = (s) => (s <= 1 ? 'try-harder' : s <= 3 ? 'good' : 'excellent')

export const clampScore = (n) => {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(100, v))
}

export const clampStars = (n) => {
  const v = Math.round(Number(n))
  if (!Number.isFinite(v)) return 0
  return Math.max(0, Math.min(4, v))
}

// Score is derived deterministically from the four RACE parts so it is fair and
// predictable: all four 'strong' → exactly 100.
//   strong = 25 · okay = 15 · missing = 0   (4 × 25 = 100)
export const deriveScore = (raceObj) => {
  const vals = ['role', 'ask', 'context', 'example'].map((k) => raceObj?.[k]?.status)
  const pts = vals.reduce((acc, v) => acc + (v === 'strong' ? 25 : v === 'okay' ? 15 : 0), 0)
  return clampScore(pts)
}

export const deriveStars = (raceObj) => {
  const vals = ['role', 'ask', 'context', 'example'].map((k) => raceObj?.[k]?.status)
  return clampStars(vals.filter((v) => v === 'strong').length)
}

export const tierMeta = {
  'excellent': { emoji: '🎉', label: 'Amazing!' },
  'good': { emoji: '💪', label: 'So close!' },
  'try-harder': { emoji: '🌱', label: 'Good start!' },
}
