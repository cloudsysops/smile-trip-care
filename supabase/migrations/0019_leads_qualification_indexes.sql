-- Lead qualification: indexes for admin filtering by budget and travel intent
-- Run after 0018. Supports assessment intent module (travel_companions, budget_range).

-- Partial indexes for non-null values so admin can filter "has budget" / "has travel info"
create index if not exists idx_leads_budget_range
  on public.leads(budget_range)
  where budget_range is not null and budget_range != '';

create index if not exists idx_leads_travel_companions
  on public.leads(travel_companions)
  where travel_companions is not null and travel_companions != '';

comment on index public.idx_leads_budget_range is 'Admin filter: leads with budget range set';
comment on index public.idx_leads_travel_companions is 'Admin filter: leads with travel companions set';
