-- M8: Single migration extending assets (replaces 0002_assets_metadata.sql and 0002_extend_assets.sql).
-- Run after 0001_init.sql. Ensures assets has storage_path, category, location, tags, alt_text, source_url, deleted_at.

alter table public.assets add column if not exists storage_path text;
alter table public.assets add column if not exists category text not null default 'other';
alter table public.assets add column if not exists location text not null default 'Other';
alter table public.assets add column if not exists tags text[] not null default '{}'::text[];
alter table public.assets add column if not exists alt_text text not null default '';
alter table public.assets add column if not exists source_url text;
alter table public.assets add column if not exists deleted_at timestamptz;

-- Constrain category and location to allowed values
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'assets_category_check'
  ) then
    alter table public.assets add constraint assets_category_check
      check (category in ('clinic', 'finca', 'lodging', 'tour', 'team', 'other'));
  end if;
  if not exists (
    select 1 from pg_constraint where conname = 'assets_location_check'
  ) then
    alter table public.assets add constraint assets_location_check
      check (location in ('Medellín', 'Manizales', 'Other'));
  end if;
end $$;

update public.assets set storage_path = coalesce(storage_path, slug) where storage_path is null;
alter table public.assets alter column storage_path set not null;

create index if not exists idx_assets_category on public.assets(category);
create index if not exists idx_assets_location on public.assets(location);
create index if not exists idx_assets_category_location on public.assets(category, location) where deleted_at is null;
create index if not exists idx_assets_created_at on public.assets(created_at desc) where deleted_at is null;

comment on column public.assets.storage_path is 'Path in Storage bucket assets';
comment on column public.assets.alt_text is 'Required for accessibility when rendering';
