-- Specialist weekly availability (one row per weekday per specialist).
-- day_of_week: 0 = Sunday … 6 = Saturday (PostgreSQL extract(dow) convention).

create table if not exists public.specialist_availability (
  id uuid primary key default gen_random_uuid(),
  specialist_id uuid not null references public.specialists(id) on delete cascade,
  day_of_week smallint not null check (day_of_week >= 0 and day_of_week <= 6),
  start_time time not null,
  end_time time not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  constraint specialist_availability_end_after_start check (end_time > start_time),
  constraint specialist_availability_one_slot_per_day unique (specialist_id, day_of_week)
);

create index if not exists idx_specialist_availability_specialist_id
  on public.specialist_availability(specialist_id);

comment on table public.specialist_availability is 'Weekly recurring availability windows per specialist (self-service).';

alter table public.specialist_availability enable row level security;

drop policy if exists "specialist_availability_admin_all" on public.specialist_availability;
create policy "specialist_availability_admin_all"
  on public.specialist_availability for all
  using (public.is_admin());

drop policy if exists "specialist_availability_specialist_select" on public.specialist_availability;
create policy "specialist_availability_specialist_select"
  on public.specialist_availability for select
  using (
    specialist_id in (
      select p.specialist_id from public.profiles p
      where p.id = auth.uid() and p.specialist_id is not null and p.is_active = true
    )
  );

drop policy if exists "specialist_availability_specialist_insert" on public.specialist_availability;
create policy "specialist_availability_specialist_insert"
  on public.specialist_availability for insert
  with check (
    specialist_id in (
      select p.specialist_id from public.profiles p
      where p.id = auth.uid() and p.specialist_id is not null and p.is_active = true
    )
  );

drop policy if exists "specialist_availability_specialist_update" on public.specialist_availability;
create policy "specialist_availability_specialist_update"
  on public.specialist_availability for update
  using (
    specialist_id in (
      select p.specialist_id from public.profiles p
      where p.id = auth.uid() and p.specialist_id is not null and p.is_active = true
    )
  );

drop policy if exists "specialist_availability_specialist_delete" on public.specialist_availability;
create policy "specialist_availability_specialist_delete"
  on public.specialist_availability for delete
  using (
    specialist_id in (
      select p.specialist_id from public.profiles p
      where p.id = auth.uid() and p.specialist_id is not null and p.is_active = true
    )
  );
