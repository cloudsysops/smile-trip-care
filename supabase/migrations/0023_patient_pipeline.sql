-- 0022: Patient pipeline table
-- Add a simple patient journey pipeline table. This is foundational only and
-- is not yet wired into live flows.

create table if not exists public.patient_pipeline (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  assessment_id uuid references public.leads(id) on delete set null,
  stage text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_patient_pipeline_patient_stage
  on public.patient_pipeline(patient_id, stage);

