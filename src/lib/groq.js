// Groq integration (OpenAI-compatible). The teacher pastes the key in Settings;
// it lives in sessionStorage only — never an env var (§8, §15).
import { deriveScore, deriveStars } from './score.js'

const KEY_STORAGE = 'brainlit_groq_key'
const MODEL = 'llama-3.3-70b-versatile'

// Key resolution order: in-app override (sessionStorage) → env (VITE_GROQ_API_KEY).
const ENV_KEY = (import.meta.env.VITE_GROQ_API_KEY || '').trim()

export const getGroqKey = () => sessionStorage.getItem(KEY_STORAGE) || ENV_KEY || ''
export const setGroqKey = (k) => {
  if (k) sessionStorage.setItem(KEY_STORAGE, k.trim())
  else sessionStorage.removeItem(KEY_STORAGE)
}
export const hasGroqKey = () => !!getGroqKey()
// True only when the key comes from .env (so the UI can hide the manual prompt).
export const hasEnvKey = () => !!ENV_KEY

// Dev → Vite proxy (/groq). Prod → straight to api.groq.com.
const ENDPOINT = import.meta.env.DEV
  ? '/groq/openai/v1/chat/completions'
  : 'https://api.groq.com/openai/v1/chat/completions'

const SYSTEM_MESSAGE = `You are RACE Coach, a friendly assistant that helps children aged 9–12 improve the prompts
they write for AI. They are learning the RACE method: R=Role (tell the AI who to be),
A=Ask (tell the AI what to do), C=Context (tell the AI about your world and specifics),
E=Example (show the AI what great looks like). You will receive a prompt a child wrote,
optionally what they were trying to make, and the name and personality of their mascot buddy.
Judge the prompt gently and at a child's level — do not expect professional prompts. For each of
R, A, C, E decide if it is 'strong', 'okay', or 'missing'. Be specific and encouraging, celebrate
what they did well, and use simple words. Give the single most useful thing to add, and rewrite
their prompt into a stronger version that keeps the child's own voice and topic. Finally write
mascot_line: one short, encouraging sentence spoken in the voice of the child's mascot, matching
how well they did (more celebratory for higher scores, kindly motivating for lower scores).
Reply with ONLY valid JSON in exactly this shape:
{
  "overall_score": <integer 0-100, a holistic kid-friendly score of how good the prompt is>,
  "overall_stars": <integer 0-4 = number of RACE parts that are 'strong'>,
  "headline": "<short encouraging sentence>",
  "race": {
    "role":    {"status":"strong|okay|missing","found":"<what you noticed>","tip":"<how to improve>"},
    "ask":     {"status":"strong|okay|missing","found":"...","tip":"..."},
    "context": {"status":"strong|okay|missing","found":"...","tip":"..."},
    "example": {"status":"strong|okay|missing","found":"...","tip":"..."}
  },
  "level_up": "<the one most impactful thing to add>",
  "improved_prompt": "<a stronger rewrite in the child's voice>",
  "mascot_line": "<one short line in the mascot's voice, matching the score>"
}`

const stripFences = (text) =>
  text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim()

export class GroqError extends Error {
  constructor(message, { kind } = {}) {
    super(message)
    this.kind = kind // 'no-key' | 'rate-limit' | 'auth' | 'network' | 'parse' | 'server'
  }
}

export async function checkPrompt({ prompt, goal, mascot }) {
  const key = getGroqKey()
  if (!key) throw new GroqError('No Groq key set.', { kind: 'no-key' })

  const userMessage =
    `Prompt the child wrote: "${prompt}"\n` +
    `What they are trying to make: "${goal || 'not specified'}"\n` +
    `The child's buddy is ${mascot.name}, ${mascot.vibe}. Write mascot_line in that voice.`

  let res
  try {
    res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: MODEL,
        temperature: 0.5,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: SYSTEM_MESSAGE },
          { role: 'user', content: userMessage },
        ],
      }),
    })
  } catch (e) {
    throw new GroqError('Could not reach the coach. Check your connection.', { kind: 'network' })
  }

  if (res.status === 429) {
    throw new GroqError('The coach is taking a quick breather. Try again in a moment!', { kind: 'rate-limit' })
  }
  if (res.status === 401 || res.status === 403) {
    throw new GroqError('That Groq key did not work. Ask your teacher to check it.', { kind: 'auth' })
  }
  if (!res.ok) {
    throw new GroqError(`The coach had a hiccup (${res.status}). Try again.`, { kind: 'server' })
  }

  let data
  try {
    data = await res.json()
  } catch {
    throw new GroqError('The coach sent something we could not read.', { kind: 'parse' })
  }

  const content = data?.choices?.[0]?.message?.content
  if (!content) throw new GroqError('The coach gave an empty answer.', { kind: 'parse' })

  let parsed
  try {
    parsed = JSON.parse(stripFences(content))
  } catch {
    throw new GroqError('The coach answered in a funny way. Try again.', { kind: 'parse' })
  }

  return normalizeResult(parsed)
}

// Make the AI output safe to render regardless of small shape drifts.
function normalizeResult(raw) {
  const race = raw?.race || {}
  const part = (p) => {
    const x = race[p] || {}
    const status = ['strong', 'okay', 'missing'].includes(x.status) ? x.status : 'missing'
    return { status, found: String(x.found || ''), tip: String(x.tip || '') }
  }
  const raceObj = {
    role: part('role'),
    ask: part('ask'),
    context: part('context'),
    example: part('example'),
  }

  // Derive BOTH from the RACE statuses so scoring is deterministic and fair:
  // all four parts 'strong' → 100 / 4 stars. The AI's free-form numbers are ignored.
  const stars = deriveStars(raceObj)
  const score = deriveScore(raceObj)

  return {
    overallScore: score,
    overallStars: stars,
    headline: String(raw?.headline || 'Nice effort!'),
    race: raceObj,
    levelUp: String(raw?.level_up || ''),
    improvedPrompt: String(raw?.improved_prompt || ''),
    mascotLine: String(raw?.mascot_line || ''),
  }
}
