-- M10: Add ops_json to lead_ai for ops-coordinator agent output.
alter table public.lead_ai
  add column if not exists ops_json jsonb;

comment on column public.lead_ai.ops_json is 'Output from ops-coordinator agent (tasks list)';
