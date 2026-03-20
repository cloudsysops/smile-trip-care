-- Specialist workflow: consultation timestamps, status transitions, case priority, coordinator requests.

-- When the case was offered to the specialist (defaults for backfill + new rows).
alter table public.consultations add column if not exists requested_at timestamptz;
update public.consultations set requested_at = coalesce(requested_at, created_at) where requested_at is null;
alter table public.consultations alter column requested_at set default now();

-- Extend status: specialist accept/decline before scheduling.
alter table public.consultations drop constraint if exists consultations_status_check;
alter table public.consultations add constraint consultations_status_check
  check (status in ('requested', 'accepted', 'declined', 'scheduled', 'completed', 'cancelled'));

-- Triage / display priority for specialist and coordinator UIs.
alter table public.consultations add column if not exists case_priority text not null default 'normal';
alter table public.consultations drop constraint if exists consultations_case_priority_check;
alter table public.consultations add constraint consultations_case_priority_check
  check (case_priority in ('low', 'normal', 'high', 'urgent'));

-- Free-text ask from specialist to coordinator (email wiring later).
alter table public.consultations add column if not exists specialist_coordinator_request text;

comment on column public.consultations.requested_at is 'When the consultation was requested / assigned to the specialist.';
comment on column public.consultations.case_priority is 'Specialist/coordinator triage: low, normal, high, urgent.';
comment on column public.consultations.specialist_coordinator_request is 'Latest info request from specialist to coordinator.';
