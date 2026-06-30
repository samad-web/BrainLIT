// A single shared buddy/character. One video set is used everywhere
// (public/mascots/shared/{try-harder,good,excellent}.mp4).
export const MASCOTS = [
  {
    id: 'buddy',
    name: 'Sparky',
    color: '#FBBF24',
    vibe: 'a warm, high-energy cheerleader who celebrates effort with short, encouraging sentences',
  },
]

export const BUDDY = MASCOTS[0]

// Any id (including legacy ids on old records) resolves to the single buddy.
export const getMascot = () => BUDDY

// All clips live in the shared folder.
export const videoBase = () => '/mascots/shared'

// Default mascot lines if the AI omits one.
export const TIER_FALLBACK_LINE = {
  'excellent': 'WOW! That prompt is a superstar! 🎉',
  'good': "Nice work — you're so close to perfect! 💪",
  'try-harder': "Great start! Let's make it even stronger. 🌱",
}
