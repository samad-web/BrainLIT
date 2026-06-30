// Derive stats, streaks, and badges from a student's attempts.
const RACE_PARTS = ['role', 'ask', 'context', 'example']

const dayKey = (iso) => {
  const d = new Date(iso)
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`
}

// Count consecutive days (ending today or yesterday) the child practiced.
export function currentStreak(attempts) {
  if (!attempts.length) return 0
  const days = new Set(attempts.map((a) => dayKey(a.createdAt)))
  let streak = 0
  const cursor = new Date()
  // allow the streak to "still be alive" if they practiced today OR yesterday
  if (!days.has(dayKey(cursor.toISOString()))) {
    cursor.setDate(cursor.getDate() - 1)
    if (!days.has(dayKey(cursor.toISOString()))) return 0
  }
  while (days.has(dayKey(cursor.toISOString()))) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }
  return streak
}

export function summarize(attempts) {
  const total = attempts.length
  const totalStars = attempts.reduce((s, a) => s + (a.overallStars || 0), 0)
  const bestStars = attempts.reduce((m, a) => Math.max(m, a.overallStars || 0), 0)
  const bestScore = attempts.reduce((m, a) => Math.max(m, a.overallScore || 0), 0)
  const avgStars = total ? totalStars / total : 0
  const avgScore = total ? attempts.reduce((s, a) => s + (a.overallScore || 0), 0) / total : 0
  const streak = currentStreak(attempts)
  const lastActive = total ? attempts[attempts.length - 1].createdAt : null

  // % of attempts where each RACE part was "strong"
  const racePctStrong = {}
  for (const p of RACE_PARTS) {
    const strong = attempts.filter((a) => a[p] === 'strong').length
    racePctStrong[p] = total ? Math.round((strong / total) * 100) : 0
  }

  return { total, totalStars, bestStars, bestScore, avgStars, avgScore, streak, lastActive, racePctStrong }
}

// Strongest / weakest RACE part (for headlines + next goal).
export function raceExtremes(racePctStrong) {
  const entries = Object.entries(racePctStrong)
  const strongest = entries.reduce((a, b) => (b[1] > a[1] ? b : a))
  const weakest = entries.reduce((a, b) => (b[1] < a[1] ? b : a))
  return { strongest: strongest[0], weakest: weakest[0] }
}

export const PART_LABEL = { role: 'Role', ask: 'Ask', context: 'Context', example: 'Example' }
export const PART_COLOR = { role: '#4A90E2', ask: '#9061D9', context: '#22D3EE', example: '#F59E0B' }

// Badge set (§11). Each returns earned + a goal line.
export function computeBadges(attempts) {
  const s = summarize(attempts)
  const everFourStar = attempts.some((a) => (a.overallStars || 0) >= 4)
  const everAllStrong = attempts.some(
    (a) => a.role === 'strong' && a.ask === 'strong' && a.context === 'strong' && a.example === 'strong'
  )
  // "Level Up": any attempt scored higher than the best of all earlier attempts.
  let leveledUp = false
  let runningBest = -1
  for (const a of attempts) {
    if ((a.overallStars || 0) > runningBest && runningBest >= 0) leveledUp = true
    runningBest = Math.max(runningBest, a.overallStars || 0)
  }

  return [
    { id: 'first-try', emoji: '🌱', name: 'First Try', goal: 'Check your first prompt', earned: s.total >= 1 },
    { id: 'on-a-roll', emoji: '🔥', name: 'On a Roll', goal: 'Practice 3 days in a row', earned: s.streak >= 3 },
    { id: 'star-prompt', emoji: '⭐', name: 'Star Prompt', goal: 'Get a 4-star result', earned: everFourStar },
    { id: 'race-master', emoji: '🧠', name: 'RACE Master', goal: 'All four parts strong in one prompt', earned: everAllStrong },
    { id: 'level-up', emoji: '📈', name: 'Level Up', goal: 'Beat your previous best score', earned: leveledUp },
    { id: 'practice-pro', emoji: '🏅', name: 'Practice Pro', goal: 'Check 10 prompts', earned: s.total >= 10 },
  ]
}
