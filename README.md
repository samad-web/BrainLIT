# RACE Coach (Brainlit)

A web app that helps kids (9–12) check their AI prompts using the **RACE** method,
scored by the free **Groq API**. Each child picks a **mascot buddy** who reacts on
video to their score, has a **profile** + **progress** view, and teachers get an
**admin dashboard**. Built per `RACE-Coach-Build-Spec-v2.md`.

## Quick start

```bash
npm install
npm run dev          # http://localhost:5173
```

Auth flow (teacher creates the account, student logs in):
1. Open `/admin` → **Create class** → set a teacher passcode → copy the class code.
2. Sign in to `/admin` with that code + passcode → **Add a student**
   (first name, username, password — there's a password generator). Hand the
   student their username + password.
3. Student opens `/login`, signs in, and picks a buddy on first login.
4. Set the Groq key in `.env` as `VITE_GROQ_API_KEY=…` (from
   https://console.groq.com — no card). An in-app **⚙︎ Coach key** dialog can
   override it at runtime.
5. Type a prompt → **Check my prompt!** → the buddy reacts on video; the result
   shows on the left and the video + score on the right.

## Scoring → mascot video

The AI returns a holistic **0–100 score**. The reaction clip is chosen by:

| Score | Tier | Clip (`public/mascots/shared/`) |
|------|------|------|
| **100** | excellent | `excellent.mp4` (celebrating) |
| **70–99** | good | `good.mp4` (encouraging) |
| **0–69** | try-harder | `try-harder.mp4` (cheer-up) |

The score is shown **directly below the video**. A single Google Flow character was
provided, so all four buddies currently share these clips. To give a buddy its own
clips, add files to `public/mascots/<id>/` and register the id in `videoBase()`
inside `src/mascots.js`.

## Logo

Drop your Brainlit logo PNG at **`public/logo.png`**. `src/components/Logo.jsx`
uses it everywhere and falls back to a built-in brand SVG if the file is missing.

## Data store

Set in `.env`:
- `VITE_STORE=local` (default) — localStorage, single device, zero setup.
- `VITE_STORE=supabase` — cross-device; **required for the admin dashboard to see
  students on other devices**. Create a free project at supabase.com, run the schema
  in §14.2 of the spec, enable RLS, then set `VITE_SUPABASE_URL` and
  `VITE_SUPABASE_ANON_KEY` (the anon key is safe to ship).

## Routes

| Route | Screen |
|------|--------|
| `/` | Home / Check |
| `/progress` | Progress |
| `/profile` | Profile (name, buddy, badges, log out) |
| `/login` | Student login |
| `/choose-buddy` | First-login buddy pick |
| `/admin` | Teacher dashboard (create class, add students, passcode-gated) |

## Build

```bash
npm run build && npm run preview
```

> Privacy: first name / nickname only — no emails, passwords, or photos. Prompts are
> sent to Groq (and, in Supabase mode, stored). Teachers can delete any student's data.
