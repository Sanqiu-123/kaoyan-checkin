create table if not exists public.study_snapshots (
  user_id uuid primary key references auth.users(id) on delete cascade,
  state jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.study_snapshots enable row level security;

drop policy if exists "Users can read own study snapshot" on public.study_snapshots;
create policy "Users can read own study snapshot"
on public.study_snapshots
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own study snapshot" on public.study_snapshots;
create policy "Users can insert own study snapshot"
on public.study_snapshots
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own study snapshot" on public.study_snapshots;
create policy "Users can update own study snapshot"
on public.study_snapshots
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);
