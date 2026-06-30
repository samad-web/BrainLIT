-- ─────────────────────────────────────────────────────────────────────────
-- RACE Coach — Supabase schema (run in: Supabase → SQL Editor → New query → Run)
-- Spec §14.2. Tables + Row Level Security.
-- ─────────────────────────────────────────────────────────────────────────

create table if not exists classes (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text,
  teacher_passcode text not null,        -- light gate; prefer Supabase Auth for real security
  created_at timestamptz default now()
);

create table if not exists students (
  id uuid primary key default gen_random_uuid(),
  class_id uuid references classes(id) on delete cascade,
  first_name text not null,              -- first name / nickname ONLY
  mascot_id text,
  created_at timestamptz default now()
);

create table if not exists attempts (
  id uuid primary key default gen_random_uuid(),
  student_id uuid references students(id) on delete cascade,
  created_at timestamptz default now(),
  prompt text, goal text,
  overall_score int,
  overall_stars int,
  role text, ask text, context text, example text,
  level_up text, improved_prompt text
);

-- ── Row Level Security ─────────────────────────────────────────────────────
-- NOTE: This app has no per-kid login, so the anon (public) key must be able to
-- read/write these tables. The policies below are intentionally permissive for
-- the `anon` role — this is a documented LIGHT setup suitable for a classroom of
-- this scale. For real protection, move to Supabase Auth and tighten these so a
-- student can only touch their own rows and only /admin can list a whole class.

alter table classes  enable row level security;
alter table students enable row level security;
alter table attempts enable row level security;

drop policy if exists "anon classes"  on classes;
drop policy if exists "anon students" on students;
drop policy if exists "anon attempts" on attempts;

create policy "anon classes"  on classes  for all to anon using (true) with check (true);
create policy "anon students" on students for all to anon using (true) with check (true);
create policy "anon attempts" on attempts for all to anon using (true) with check (true);
