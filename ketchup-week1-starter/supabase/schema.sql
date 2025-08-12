
-- Supabase Week 1 schema for Ketchup

create table if not exists public.profiles (
  id uuid primary key,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists public.contacts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  frequency text default 'monthly',
  last_contacted timestamptz,
  affinity int,
  included boolean default true,
  created_at timestamptz default now()
);

create table if not exists public.touches (
  id uuid default gen_random_uuid() primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  contact_id uuid,
  action text check (action in ('call','text')) not null,
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.contacts enable row level security;
alter table public.touches enable row level security;

create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_insert_self" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "contacts_select_own" on public.contacts
  for select using (auth.uid() = user_id);
create policy "contacts_insert_own" on public.contacts
  for insert with check (auth.uid() = user_id);
create policy "contacts_update_own" on public.contacts
  for update using (auth.uid() = user_id);
create policy "contacts_delete_own" on public.contacts
  for delete using (auth.uid() = user_id);

create policy "touches_select_own" on public.touches
  for select using (auth.uid() = user_id);
create policy "touches_insert_own" on public.touches
  for insert with check (auth.uid() = user_id);

create index if not exists idx_touches_user_created on public.touches(user_id, created_at desc);
