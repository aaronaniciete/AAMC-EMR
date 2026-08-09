-- Run this once in Supabase: Dashboard -> SQL Editor -> New query -> paste all -> Run

-- Stores the clinic's data as JSON, keyed by a fixed string.
-- (Same shape as the old browser-storage version, just backed by a real database now.)
create table if not exists app_state (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

-- One row per staff member, linked to their real login (Supabase Auth user).
create table if not exists staff_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  role text not null,
  created_at timestamptz not null default now()
);

alter table app_state enable row level security;
alter table staff_profiles enable row level security;

-- Any signed-in staff member can read/write the shared clinic data.
-- (Everyone in a small clinic typically needs to see all patients; if you
-- later want per-role restrictions, these policies are the place to add them.)
create policy "signed-in staff can read app_state"
  on app_state for select
  to authenticated
  using (true);

create policy "signed-in staff can write app_state"
  on app_state for insert
  to authenticated
  with check (true);

create policy "signed-in staff can update app_state"
  on app_state for update
  to authenticated
  using (true);

-- Staff can read everyone's profile (so names show up in the app),
-- but can only create/edit their own.
create policy "signed-in staff can read all profiles"
  on staff_profiles for select
  to authenticated
  using (true);

create policy "staff can insert their own profile"
  on staff_profiles for insert
  to authenticated
  with check (auth.uid() = id);

create policy "staff can update their own profile"
  on staff_profiles for update
  to authenticated
  using (auth.uid() = id);
