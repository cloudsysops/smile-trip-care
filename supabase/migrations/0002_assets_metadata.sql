-- M8: extend assets for manager (category, location, tags, alt_text, storage_path, source_url)
alter table public.assets
  add column if not exists storage_path text,
  add column if not exists category text check (category in ('clinic', 'finca', 'lodging', 'tour', 'team', 'other')),
  add column if not exists location text check (location in ('Medellín', 'Manizales', 'Other')),
  add column if not exists tags text[] default '{}',
  add column if not exists alt_text text,
  add column if not exists source_url text;

create index if not exists idx_assets_category on public.assets(category);
create index if not exists idx_assets_location on public.assets(location);

comment on column public.assets.storage_path is 'Path in Storage bucket assets';
comment on column public.assets.alt_text is 'Required for accessibility when rendering';
