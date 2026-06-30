-- ─────────────────────────────────────────────────────────────────────────
-- RACE Coach — migration: teacher-created student logins
-- Run in: Supabase → SQL Editor → New query → Run
-- (Safe to run more than once.)
-- ─────────────────────────────────────────────────────────────────────────

alter table students add column if not exists username text;
alter table students add column if not exists password text;

-- Usernames are the login id, so they must be unique.
create unique index if not exists students_username_key on students (lower(username));

-- NOTE: passwords are stored in plain text here and are readable by anyone with
-- the anon key — this is the documented LIGHT gate for a single classroom. For
-- real security, do logins through a serverless function / Supabase Auth so the
-- anon client can never read the password column.
