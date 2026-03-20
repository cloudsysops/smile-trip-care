-- 0024_beta_feedback.sql
-- Private beta feedback capture

create table if not exists public.beta_feedback (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references public.profiles(id) on delete set null,
  email text,
  page text not null,
  category text,
  sentiment text,
  message text not null,
  screenshot_url text,
  created_at timestamptz not null default now()
);

alter table public.beta_feedback enable row level security;

-- Allow admin full access
create policy "beta_feedback_admin_all"
  on public.beta_feedback
  for all
  using (public.is_admin());

-- Allow public inserts for feedback capture (no updates/deletes)
create policy "beta_feedback_insert_public"
  on public.beta_feedback
  for insert
  with check (true);

