# RACE Coach — Build Specification (v2)

A web app that helps kids (ages 9–12) check whether their AI prompts are good, using the **RACE** method, scored by the **Groq free API**. Each child picks a **mascot buddy** who reacts to their score, has a **profile** and a **progress** view, and a teacher **admin dashboard** shows every student's progress.

> **v2 adds:** identity/onboarding with a class code, profile, progress tracking, admin dashboard, and a data layer (local **or** Supabase). Supersedes v1. The full Brainlit design system is embedded in §3 — single source of truth.

---

## 1. Tech stack

- **Vite + React** + **React Router** (routes in §4).
- **Tailwind CSS** (config in §3.7; only Tailwind directives in `index.css`).
- **Data layer (§14):** an abstracted `store` with two implementations —
  - `localStore` (localStorage, single device, zero setup), and
  - `supabaseStore` (free Supabase project, cross-device — **required for the admin dashboard to see remote students**).
- Charts: a small SVG sparkline, or `recharts` if you want richer graphs.
- Persisted: mascot + student identity (localStorage); Groq key (sessionStorage only); attempts (via the store).

---

## 2. Audience & voice

Children aged 9–12. Warm, playful, encouraging — **never harsh**. Even a weak prompt gets a positive headline plus one clear next step. Simple words, active voice. The teacher-facing admin dashboard is plain, dense, and informational — a different register from the kid screens.

---

## 3. Design system (Brainlit)

From the brand mark: a brain-lightbulb split into a **blue** left hemisphere and **purple** right hemisphere, joined by a warm **yellow spark**, with **cyan/pink** circuit traces and a **deep-indigo** base, on warm off-white.

### 3.1 Color

**Brain Blue** — primary, left hemisphere

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `#EEF5FD` | `#D9E9FB` | `#B6D3F6` | `#8FBCF0` | `#6BA7E8` | **`#4A90E2`** | `#3B7AD0` | `#3063AE` | `#2A5390` | `#244673` |

**Brain Purple** — primary, right hemisphere

| 50 | 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900 |
|---|---|---|---|---|---|---|---|---|---|
| `#F4EFFB` | `#E7DCF7` | `#D0BCEF` | `#B89AE6` | `#A37EDD` | **`#9061D9`** | `#7C4FC4` | `#6740A6` | `#543588` | `#432B6B` |

**Accents:** `spark.light #FCD34D` · `spark #FBBF24` · `spark.deep #F59E0B` · `circuit.cyan #22D3EE` · `circuit.pink #EC4899` · `indigo #2E3A8C` · `indigo.deep #283593` · `indigo.ink #1E2A6B` · `cream #F5F4F2`.

### 3.2 Gradients

- **brand** `linear-gradient(135deg,#4A90E2,#9061D9)` — primary buttons, hero, logo (the signature; on every screen).
- **base** `linear-gradient(180deg,#2E3A8C,#1E2A6B)` — footers, deep panels, **admin top bar**.
- **spark** `radial-gradient(circle,#FCD34D,#FBBF24,transparent)` — reward halos, badges, focus glow.

### 3.3 Typography

- **Display:** `Baloo 2` (700–800). **Body:** `Nunito` (400–800).

```html
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+2:wght@400;500;600;700;800&family=Nunito:wght@400;600;700;800&display=swap" rel="stylesheet">
```

Scale: display 48/32/21px (800/700/700), body 20/16/13px (700/400/600), −0.02em on the largest display only.

### 3.4 Shape, shadow, motion

Radius: cards `22px` (`rounded-card`), buttons/pills `999px` (`rounded-pill`), inputs `14px`. Shadow: `soft 0 10px 26px rgba(46,58,140,.10)`, `glow 0 8px 30px rgba(74,144,226,.28),0 8px 30px rgba(144,97,217,.22)`. Gentle motion; honor `prefers-reduced-motion`; visible keyboard focus (3px blue-300, offset 3px).

### 3.5 Component styles

- **Primary:** `bg-brand text-white rounded-pill shadow-glow font-display` (lifts 2px on hover).
- **Spark:** `bg-spark text-indigo-ink rounded-pill font-display`. **Ghost:** `bg-white text-purple-700 border-2 border-purple-200 rounded-pill font-display`.
- **Status pills:** Got it! green `#E7F6EC`/`#16794A`; Almost `spark.light`/`#7A5300`; Missing `#EFEEEA`/`#5E5A52`.
- **Input:** `bg-cream border-2 border-neutral-200 rounded-[14px]`; focus → `border-blue-400` + 4px `blue-100` ring.
- **Card:** `bg-white border border-neutral-200 rounded-card shadow-soft`.

### 3.6 RACE → color mapping

| Part | Meaning | Color | Token |
|---|---|---|---|
| **R** — Role | Tell the AI who to be | Blue | `blue.500` |
| **A** — Ask | Tell the AI what to do | Purple | `purple.500` |
| **C** — Context | Tell the AI about your world | Cyan | `circuit.cyan` |
| **E** — Example | Show the AI what great looks like | Spark | `spark.deep` |

These same four colors are reused in the progress charts and admin dashboard so a RACE part is always recognizable by color.

### 3.7 `tailwind.config.js`

```js
export default {
  content: ['./index.html', './src/**/*.{js,jsx,ts,tsx}'],
  theme: { extend: {
    colors: {
      blue:   { 50:'#EEF5FD',100:'#D9E9FB',200:'#B6D3F6',300:'#8FBCF0',400:'#6BA7E8',
                500:'#4A90E2',600:'#3B7AD0',700:'#3063AE',800:'#2A5390',900:'#244673' },
      purple: { 50:'#F4EFFB',100:'#E7DCF7',200:'#D0BCEF',300:'#B89AE6',400:'#A37EDD',
                500:'#9061D9',600:'#7C4FC4',700:'#6740A6',800:'#543588',900:'#432B6B' },
      spark:  { light:'#FCD34D', DEFAULT:'#FBBF24', deep:'#F59E0B' },
      circuit:{ cyan:'#22D3EE', pink:'#EC4899' },
      indigo: { DEFAULT:'#2E3A8C', deep:'#283593', ink:'#1E2A6B' },
      cream:  '#F5F4F2',
    },
    fontFamily: { display:['"Baloo 2"','sans-serif'], body:['Nunito','sans-serif'] },
    backgroundImage: {
      brand:'linear-gradient(135deg,#4A90E2,#9061D9)',
      base:'linear-gradient(180deg,#2E3A8C,#1E2A6B)',
      spark:'radial-gradient(circle,#FCD34D,#FBBF24,transparent)',
    },
    borderRadius: { card:'22px', pill:'999px' },
    boxShadow: {
      soft:'0 10px 26px rgba(46,58,140,.10)',
      glow:'0 8px 30px rgba(74,144,226,.28),0 8px 30px rgba(144,97,217,.22)',
    },
  }},
}
```

---

## 4. App structure & routing

| Route | Screen | Audience |
|---|---|---|
| `/` | Home / Check (assess a prompt) | child |
| `/progress` | Progress (the child's journey) | child |
| `/profile` | Profile (name, buddy, badges) | child |
| `/onboarding` | First-run setup | child |
| `/admin` | Admin dashboard (passcode-gated) | teacher |

Kid screens share a **bottom nav** (mobile-first) or header nav with three friendly tabs: **Home · Progress · Me**, each with its RACE-colored icon. The buddy idles in a corner across all kid screens. `/admin` is a separate, plain layout with no kid nav.

Guard: if no student identity in localStorage → redirect to `/onboarding` (except `/admin`).

---

## 5. Identity & onboarding

Lightweight identity — **no emails, no passwords for kids** (privacy + simplicity).

1. **Class code** — the teacher creates a class and shares a short code (e.g. `BRAINLIT-7G`). Child enters it to join.
2. **First name (or nickname)** — picks an existing student in that class or creates a new one. First name only.
3. **Choose your buddy** — the four mascots (§6).
4. Save `{ classCode, studentId, firstName, mascotId }` to `localStorage.brainlit_student`; create/load the student record via the store (§14).

Returning child skips straight to Home. A "Change buddy" / "Edit name" control lives in Profile.

---

## 6. Mascot system

Four buddies chosen at onboarding; each has a color and a personality **vibe** passed to the AI so it speaks in character. **Rename to match your Google Flow characters; keep the `id`s** (asset folders use them).

```js
// src/mascots.js
export const MASCOTS = [
  { id:'bolt',  name:'Bolt',  color:'#FBBF24', vibe:'a high-energy spark, a hype cheerleader using short exciting sentences' },
  { id:'nova',  name:'Nova',  color:'#9061D9', vibe:'a calm, wise star, a gentle reassuring mentor' },
  { id:'pixel', name:'Pixel', color:'#4A90E2', vibe:'a curious little robot, playful and full of fun tech facts' },
  { id:'hoot',  name:'Hoot',  color:'#22D3EE', vibe:'a clever owl, thoughtful, who asks one good question' },
];
```

**Google Flow assets** → `public/mascots/<id>/{idle.png, try-harder.mp4, good.mp4, excellent.mp4}` (short 2–4s clips, transparent or cream background). Code resolves `mascots/${id}/${tier}.mp4`. Show a colored placeholder (name + ⭐/💪/🎉) until real files exist.

**Score → animation tier:**

```js
const tierFromStars = s => s <= 1 ? 'try-harder' : s <= 3 ? 'good' : 'excellent';
// 0–1⭐ try-harder · 2–3⭐ good · 4⭐ excellent
```

Mascot renders `<video autoPlay muted playsInline onEnded={holdLastFrame}>` for the tier, with a speech bubble showing `mascot_line` from the AI (fallback to a tier-default). Idle still only under reduced-motion.

---

## 7. Home / Check screen

1. Greeting with the child's name + idling buddy.
2. Textarea: **"Type the prompt you want to give the AI."**
3. Optional: **"What are you trying to make?"**
4. **"Check my prompt!"** → loading ("Checking your prompt…") → result (§10). Every check writes an **attempt** to the store (§14).

---

## 8. Groq integration

- OpenAI-compatible. `https://api.groq.com/openai/v1/chat/completions`, model `llama-3.3-70b-versatile` (free; key from `console.groq.com`, no card).
- Header `Authorization: Bearer <key>`; body includes `response_format:{ "type":"json_object" }`.
- **Key:** teacher pastes in Settings → **sessionStorage** (`brainlit_groq_key`). Never a `VITE_` env var (those get inlined into the public bundle).
- **CORS:** dev → Vite proxy `/groq` → `https://api.groq.com`; use `import.meta.env.DEV ? '/groq/...' : 'https://api.groq.com/...'`. If the deployed build is CORS-blocked, add a tiny serverless proxy (Cloudflare Worker / Vercel function) holding the key.
- **Parse defensively:** `choices[0].message.content` → strip fences → `JSON.parse`. Handle errors and **429** kindly.

---

## 9. System message to Groq

**User message:**
```
Prompt the child wrote: "<prompt>"
What they are trying to make: "<goal or 'not specified'>"
The child's buddy is <MascotName>, <mascot.vibe>. Write mascot_line in that voice.
```

**System message:**
```
You are RACE Coach, a friendly assistant that helps children aged 9–12 improve the prompts
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
}
```

---

## 10. Result rendering

Stars (0–4, spark color) · big `font-display` headline · **mascot reaction** (tier animation + `mascot_line`) · four **RACE cards** in mapped colors (status pill + `found` + `tip`) · **Level up** box (spark-tinted) · **Try this stronger version** (`improved_prompt` + "Use this" copy) · actions: "Try again" / "New prompt".

---

## 11. Profile section (`/profile`)

The child's home base. Friendly, celebratory, editable.

- **Header:** buddy idle animation + first name, in the buddy's color.
- **Stats row (chips):** total prompts checked · total stars earned · best score · current streak (consecutive days practiced).
- **Badges:** earned milestones shown bright; unearned shown faded with their goal.
- **My buddy:** current mascot + **"Change buddy"** (re-opens the picker, updates store).
- **My name:** edit first name / nickname.
- **Class:** shows class code (read-only) and a **"Leave class"** that clears local identity.

**Badge set (derived from attempts):**

| Badge | Earned when |
|---|---|
| 🌱 First Try | first prompt checked |
| 🔥 On a Roll | 3-day streak |
| ⭐ Star Prompt | first 4-star result |
| 🧠 RACE Master | all four parts "strong" in one prompt |
| 📈 Level Up | a score higher than the child's previous best |
| 🏅 Practice Pro | 10 prompts checked |

---

## 12. Progress section (`/progress`)

The child sees their growth — framed as a journey, never a report card.

- **Score over time:** a sparkline/bar of the last ~10 `overall_stars`, in spark color, with a friendly caption ("Your scores are climbing!" / "Keep practicing — you've got this!"). Never show a falling trend negatively; frame as "your next climb."
- **RACE strengths:** four mini-bars (Role/Ask/Context/Example) showing how often each was "strong," each in its RACE color. Headline the strongest ("You're a Context star!") and gently name the growth area ("Let's grow your Examples next").
- **Recent prompts:** last few attempts as cards — the prompt (truncated), its stars, and a "see again" that reopens the full result.
- **Next goal:** one concrete suggestion derived from the weakest RACE part ("Try adding an example to your next prompt").

All values come from the store's attempts for this student.

---

## 13. Admin dashboard (`/admin`)

Teacher-facing. Plain, dense, informational — uses the `base` gradient top bar, `font-body`, RACE colors for data. **Requires `supabaseStore`** to see students across devices (with `localStore` it only shows this device).

**Access:** gate `/admin` with a teacher passcode. Minimal version compares against the class's stored `teacher_passcode`; for real protection use Supabase Auth (see §14). Be honest in the UI that this is a light gate.

**13.1 Class overview**
- Header: class name + code, student count, total prompts this week.
- **Students table:** name · buddy · prompts checked · average stars · last active · 7-day trend sparkline. Sortable; click a row → drill-down.
- **Class insights cards:**
  - *Weakest RACE part across the class* → "Teach next: Context" (directly feeds session planning).
  - *Most improved student this week.*
  - *Who hasn't practiced* (engagement nudge).

**13.2 Student drill-down**
- Attempts timeline (date, stars, prompt preview).
- **RACE breakdown:** % strong per part (four colored bars) → spot patterns ("Pranavi's Context is consistently missing").
- Recent prompts with full scores + the AI's `improved_prompt` (so the teacher sees exactly what to coach).
- **Export CSV** of this student's attempts.

**13.3 Class management**
- Create class (generates code + sets teacher passcode).
- Add/rename/remove students; delete a student's data (privacy, §15).

> The dashboard is the teacher's evidence base for "don't repeat, don't skip, bridge" — it turns each child's scores into the next session's focus.

---

## 14. Data model & store

### 14.1 Store interface (code against this; swap implementations)

```js
// src/store/index.js  — choose one implementation
export const store = {
  // identity
  joinClass(code, firstName, mascotId): Promise<Student>,
  getStudent(): Promise<Student | null>,
  updateStudent(patch): Promise<Student>,
  // attempts
  saveAttempt(attempt): Promise<void>,
  listAttempts(studentId): Promise<Attempt[]>,
  // admin
  verifyTeacher(code, passcode): Promise<boolean>,
  listStudents(classCode): Promise<Student[]>,
  createClass(name, passcode): Promise<{ code }>,
  removeStudent(studentId): Promise<void>,
};
```

**`Attempt` shape** (written on every check):
```js
{
  id, studentId, createdAt,            // ISO timestamp
  prompt, goal,
  overallStars,                        // 0–4
  role, ask, context, example,         // 'strong' | 'okay' | 'missing'
  levelUp, improvedPrompt
}
```

### 14.2 Option A — `supabaseStore` (recommended; cross-device, free)

Create a free project at `supabase.com`. The **anon/public key is safe to ship** (unlike the Groq key). Tables:

```sql
create table classes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  teacher_passcode text not null,        -- light gate; prefer Supabase Auth for real security
  created_at timestamptz default now()
);
create table students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  first_name text not null,              -- first name / nickname ONLY
  mascot_id text,
  created_at timestamptz default now()
);
create table attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  created_at timestamptz default now(),
  prompt text, goal text,
  overall_stars int,
  role text, ask text, context text, example text,
  level_up text, improved_prompt text
);
```

Enable **Row Level Security** and add policies so a student can only insert/read their own attempts, and only the `/admin` role (or service via a serverless function) can list a whole class. For this scale a documented light setup is fine, but note RLS in the build so it isn't wide open.

### 14.3 Option B — `localStore` (no backend; single device)

All data in localStorage keyed by student. The admin dashboard then only shows students on the device it's opened on. To still aggregate remote kids: add **Export progress** (download a JSON / short code) on the child's Profile, and **Import** on the admin dashboard. Free and fully private, but manual.

> Build against the `store` interface and pick the implementation with one import swap. Start on `localStore` to develop offline, move to `supabaseStore` for the real classroom.

---

## 15. Privacy & safety

This version stores children's data, so keep it tight:

- **First name or nickname only.** No emails, passwords, birthdates, photos, or addresses. The name field stays optional where possible.
- Prompts are sent to Groq and (in Option A) stored in Supabase. Add a short, plain note kids and parents can read.
- **Deletion:** the teacher can delete any student's data from the admin dashboard; "Leave class" clears local identity.
- No third-party analytics or tracking. Don't log prompts anywhere else.
- Keep all copy and mascot lines age-appropriate and kind. Nudge kids not to type real personal details into prompts (their avatar prompts can include them).

---

## 16. Setup checklist

- [ ] `npm create vite@latest` → React; install Tailwind + React Router; paste `tailwind.config.js` (§3.7); add font links (§3.3).
- [ ] Vite dev proxy `/groq` → `https://api.groq.com` (§8).
- [ ] `src/mascots.js` (§6) — rename to your Google Flow characters, keep `id`s.
- [ ] 4 mascots × {idle.png, try-harder, good, excellent} → `public/mascots/<id>/` (§6). Ship the placeholder fallback first.
- [ ] Build the `store` interface (§14); start with `localStore`.
- [ ] Implement routes + bottom nav (§4): Home, Progress, Profile, Onboarding, Admin.
- [ ] Profile (§11), Progress (§12), Admin (§13).
- [ ] When ready for cross-device: create Supabase project, run the schema (§14.2), enable RLS, swap to `supabaseStore`.
- [ ] Free Groq key at `console.groq.com`; teacher pastes it in Settings each session.
```
