-- M14: Durable AI automation queue and worker state.
-- Run after 0006_ai_automation_foundation.sql.

create table if not exists public.ai_automation_jobs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads(id) on delete cascade,
  trigger_type text not null,
  job_type text not null,
  status text not null default 'pending',
  attempts int not null default 0,
  max_attempts int not null default 3,
  run_after timestamptz not null default now(),
  locked_at timestamptz,
  locked_by text,
  payload_json jsonb not null default '{}'::jsonb,
  error_message text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_automation_jobs_status_check'
  ) then
    alter table public.ai_automation_jobs
      add constraint ai_automation_jobs_status_check
      check (status in ('pending', 'processing', 'completed', 'retry_scheduled', 'dead_letter'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_automation_jobs_trigger_type_check'
  ) then
    alter table public.ai_automation_jobs
      add constraint ai_automation_jobs_trigger_type_check
      check (trigger_type in ('lead_created', 'lead_deposit_paid', 'lead_inactive_24h', 'lead_inactive_48h'));
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'ai_automation_jobs_job_type_check'
  ) then
    alter table public.ai_automation_jobs
      add constraint ai_automation_jobs_job_type_check
      check (job_type in ('lead-triage', 'sales-responder', 'itinerary-generator', 'ops-coordinator'));
  end if;
end $$;

create index if not exists idx_ai_automation_jobs_status_run_after
  on public.ai_automation_jobs(status, run_after);
create index if not exists idx_ai_automation_jobs_lead_id
  on public.ai_automation_jobs(lead_id);
create index if not exists idx_ai_automation_jobs_locked_at
  on public.ai_automation_jobs(locked_at) where locked_at is not null;

create unique index if not exists uq_ai_automation_jobs_dedupe
  on public.ai_automation_jobs(lead_id, trigger_type, job_type);

alter table public.ai_automation_jobs enable row level security;

create policy "ai_automation_jobs_admin_all"
  on public.ai_automation_jobs
  for all
  using (public.is_admin());
