-- Clinical Progress System: treatment progress timeline (specialist-updated, patient-visible).
-- Run after 0020. Minimal schema; patient_id = profiles.id, optional lead/booking/specialist link.

create table if not exists public.treatment_progress (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.profiles(id) on delete cascade,
  specialist_id uuid references public.specialists(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  stage_key text not null,
  stage_label text not null,
  status text not null default 'active' check (status in ('active', 'completed', 'cancelled')),
  notes text,
  attachments jsonb default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.treatment_progress is 'Specialist-updated treatment progress; patient sees timeline by patient_id (profiles.id).';
comment on column public.treatment_progress.patient_id is 'Canonical patient = profiles.id.';
comment on column public.treatment_progress.stage_key is 'Stable internal key, e.g. assessment_completed, procedure_scheduled.';
comment on column public.treatment_progress.stage_label is 'Patient-friendly label for UI.';

create index if not exists idx_treatment_progress_patient_id
  on public.treatment_progress(patient_id);
create index if not exists idx_treatment_progress_specialist_id
  on public.treatment_progress(specialist_id) where specialist_id is not null;
create index if not exists idx_treatment_progress_lead_id
  on public.treatment_progress(lead_id) where lead_id is not null;
create index if not exists idx_treatment_progress_patient_created
  on public.treatment_progress(patient_id, created_at desc);

alter table public.treatment_progress enable row level security;

-- Patient: read own rows only (patient_id = auth.uid())
create policy "treatment_progress_patient_select_own"
  on public.treatment_progress for select
  using (auth.uid() = patient_id);

-- Specialist: read and update rows where they are the assigned specialist
create policy "treatment_progress_specialist_select"
  on public.treatment_progress for select
  using (
    specialist_id is not null
    and specialist_id in (
      select specialist_id from public.profiles where id = auth.uid() and specialist_id is not null
    )
  );
create policy "treatment_progress_specialist_update"
  on public.treatment_progress for update
  using (
    specialist_id is not null
    and specialist_id in (
      select specialist_id from public.profiles where id = auth.uid() and specialist_id is not null
    )
  );
create policy "treatment_progress_specialist_insert"
  on public.treatment_progress for insert
  with check (
    specialist_id is not null
    and specialist_id in (
      select specialist_id from public.profiles where id = auth.uid() and specialist_id is not null
    )
  );

-- Admin: full access
create policy "treatment_progress_admin_all"
  on public.treatment_progress for all
  using (public.is_admin());
