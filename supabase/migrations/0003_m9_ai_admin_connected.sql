-- M9: AI agent persistence for admin-connected workflows.
-- Adds JSON columns for lead_ai outputs and lead-based itinerary storage.

alter table public.lead_ai
  add column if not exists triage_json jsonb,
  add column if not exists messages_json jsonb;

alter table public.itineraries
  add column if not exists lead_id uuid references public.leads(id) on delete cascade,
  add column if not exists city text,
  add column if not exists content_json jsonb;

alter table public.itineraries alter column package_id drop not null;
alter table public.itineraries alter column day_index drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'itineraries_city_check'
  ) then
    alter table public.itineraries
      add constraint itineraries_city_check
      check (city is null or city in ('Medellín', 'Manizales'));
  end if;
end $$;

create index if not exists idx_itineraries_lead_id on public.itineraries(lead_id);
