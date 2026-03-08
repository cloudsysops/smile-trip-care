-- Seed: Curated network — Clínica San Martín, specialists, experiences, packages, junction tables.
-- Run after migration 0010_curated_network_enterprise.sql.
-- Schema: providers (type required), packages (location, duration_days, deposit_cents, price_cents, included), specialists (slug unique), experiences (slug unique).

begin;

-- =========================================
-- 1) PROVIDER PRINCIPAL
-- =========================================
insert into public.providers (
  id,
  name,
  type,
  slug,
  provider_type,
  city,
  country,
  description,
  contact_email,
  contact_phone,
  website,
  verified,
  published,
  approval_status,
  is_family_network
)
values (
  gen_random_uuid(),
  'Clínica San Martín',
  'clinic',
  'clinica-san-martin',
  'clinic',
  'Medellín',
  'Colombia',
  'Trusted medical partner for Nebula Smile journeys in Colombia.',
  'info@clinicasanmartin.com',
  '+57 300 000 0000',
  'https://clinicasanmartin.com',
  true,
  true,
  'approved',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  type = excluded.type,
  provider_type = excluded.provider_type,
  city = excluded.city,
  description = excluded.description,
  verified = excluded.verified,
  published = excluded.published,
  approval_status = excluded.approval_status,
  is_family_network = excluded.is_family_network;

-- =========================================
-- 2) SPECIALISTS
-- =========================================
insert into public.specialists (
  id,
  provider_id,
  name,
  slug,
  specialty,
  city,
  clinic,
  clinic_name,
  description,
  bio,
  free_evaluation,
  approval_status,
  published,
  sort_order
)
select
  gen_random_uuid(),
  p.id,
  'Dr. María Sierra',
  'dra-maria-sierra',
  'Dental Aesthetics',
  'Medellín',
  'Clínica San Martín',
  'Clínica San Martín',
  'Specialist in smile design, cosmetic dentistry, and patient-centered treatment planning.',
  'Specialist in smile design, cosmetic dentistry, and patient-centered treatment planning.',
  true,
  'approved',
  true,
  1
from public.providers p
where p.slug = 'clinica-san-martin'
on conflict (slug) do update set
  provider_id = excluded.provider_id,
  specialty = excluded.specialty,
  city = excluded.city,
  clinic = excluded.clinic,
  clinic_name = excluded.clinic_name,
  description = excluded.description,
  bio = excluded.bio,
  free_evaluation = excluded.free_evaluation,
  approval_status = excluded.approval_status,
  published = excluded.published,
  sort_order = excluded.sort_order;

insert into public.specialists (
  id,
  provider_id,
  name,
  slug,
  specialty,
  city,
  clinic,
  clinic_name,
  description,
  bio,
  free_evaluation,
  approval_status,
  published,
  sort_order
)
select
  gen_random_uuid(),
  p.id,
  'Dr. Carlos Ramírez',
  'dr-carlos-ramirez',
  'Oral Rehabilitation',
  'Medellín',
  'Clínica San Martín',
  'Clínica San Martín',
  'Focused on oral rehabilitation, restorative planning, and long-term smile health.',
  'Focused on oral rehabilitation, restorative planning, and long-term smile health.',
  true,
  'approved',
  true,
  2
from public.providers p
where p.slug = 'clinica-san-martin'
on conflict (slug) do update set
  provider_id = excluded.provider_id,
  specialty = excluded.specialty,
  city = excluded.city,
  clinic = excluded.clinic,
  clinic_name = excluded.clinic_name,
  description = excluded.description,
  bio = excluded.bio,
  free_evaluation = excluded.free_evaluation,
  approval_status = excluded.approval_status,
  published = excluded.published,
  sort_order = excluded.sort_order;

-- =========================================
-- 3) EXPERIENCES
-- =========================================
insert into public.experiences (
  id,
  provider_id,
  name,
  slug,
  city,
  category,
  description,
  duration_hours,
  price_cents,
  price_usd,
  includes,
  published,
  sort_order
)
select
  gen_random_uuid(),
  p.id,
  'Coffee Farm Experience',
  'coffee-farm-experience',
  'Manizales',
  'culture',
  'Guided visit to a traditional coffee farm with tasting and nature views.',
  4,
  8000,
  80,
  '["transportation","guided visit","coffee tasting"]'::jsonb,
  true,
  1
from public.providers p
where p.slug = 'clinica-san-martin'
on conflict (slug) do update set
  provider_id = excluded.provider_id,
  city = excluded.city,
  category = excluded.category,
  description = excluded.description,
  duration_hours = excluded.duration_hours,
  price_cents = excluded.price_cents,
  price_usd = excluded.price_usd,
  includes = excluded.includes,
  published = excluded.published,
  sort_order = excluded.sort_order;

insert into public.experiences (
  id,
  provider_id,
  name,
  slug,
  city,
  category,
  description,
  duration_hours,
  price_cents,
  price_usd,
  includes,
  published,
  sort_order
)
select
  gen_random_uuid(),
  p.id,
  'Hot Springs Recovery',
  'hot-springs-recovery',
  'Manizales',
  'recovery',
  'Relaxing thermal springs experience designed for gentle recovery and wellness.',
  3,
  9500,
  95,
  '["entry","transportation","recovery support"]'::jsonb,
  true,
  2
from public.providers p
where p.slug = 'clinica-san-martin'
on conflict (slug) do update set
  provider_id = excluded.provider_id,
  city = excluded.city,
  category = excluded.category,
  description = excluded.description,
  duration_hours = excluded.duration_hours,
  price_cents = excluded.price_cents,
  price_usd = excluded.price_usd,
  includes = excluded.includes,
  published = excluded.published,
  sort_order = excluded.sort_order;

insert into public.experiences (
  id,
  provider_id,
  name,
  slug,
  city,
  category,
  description,
  duration_hours,
  price_cents,
  price_usd,
  includes,
  published,
  sort_order
)
select
  gen_random_uuid(),
  p.id,
  'Medellín City Discovery',
  'medellin-city-discovery',
  'Medellín',
  'culture',
  'Comfortable city orientation experience before treatment or recovery transfer.',
  4,
  7000,
  70,
  '["guided city visit","local orientation"]'::jsonb,
  true,
  3
from public.providers p
where p.slug = 'clinica-san-martin'
on conflict (slug) do update set
  provider_id = excluded.provider_id,
  city = excluded.city,
  category = excluded.category,
  description = excluded.description,
  duration_hours = excluded.duration_hours,
  price_cents = excluded.price_cents,
  price_usd = excluded.price_usd,
  includes = excluded.includes,
  published = excluded.published,
  sort_order = excluded.sort_order;

-- =========================================
-- 4) PACKAGES (schema: location, duration_days, deposit_cents, price_cents, included, type)
-- =========================================
insert into public.packages (
  id,
  provider_id,
  slug,
  name,
  location,
  recovery_city,
  description,
  duration_days,
  deposit_cents,
  price_cents,
  included,
  published,
  type,
  package_type,
  title,
  subtitle,
  origin_city,
  destination_city,
  price_from_usd,
  highlights,
  includes,
  excludes,
  badge
)
select
  gen_random_uuid(),
  p.id,
  'essential-care-journey',
  'Essential Care Journey',
  'Medellín',
  'Manizales',
  'Free evaluation, treatment coordination in Medellín, and recovery planning in Manizales.',
  8,
  50000,
  250000,
  array['medical coordination','airport pickup','transport Medellín to Manizales','recovery guidance'],
  true,
  'combo',
  'combo',
  'Essential Care Journey',
  'Treatment in Medellín and recovery support in Manizales',
  'Medellín',
  'Manizales',
  2500,
  '["Free medical evaluation","Treatment coordination","Recovery planning","Medellín to Manizales journey"]'::jsonb,
  '["medical coordination","airport pickup","transport Medellín to Manizales","recovery guidance"]'::jsonb,
  '["flights","personal shopping","additional specialist procedures"]'::jsonb,
  null
from public.providers p
where p.slug = 'clinica-san-martin'
on conflict (slug) do update set
  name = excluded.name,
  location = excluded.location,
  recovery_city = excluded.recovery_city,
  description = excluded.description,
  duration_days = excluded.duration_days,
  deposit_cents = excluded.deposit_cents,
  price_cents = excluded.price_cents,
  included = excluded.included,
  published = excluded.published,
  type = excluded.type,
  package_type = excluded.package_type,
  title = excluded.title,
  subtitle = excluded.subtitle,
  origin_city = excluded.origin_city,
  destination_city = excluded.destination_city,
  price_from_usd = excluded.price_from_usd,
  highlights = excluded.highlights,
  includes = excluded.includes,
  excludes = excluded.excludes,
  badge = excluded.badge,
  provider_id = excluded.provider_id;

insert into public.packages (
  id,
  provider_id,
  slug,
  name,
  location,
  recovery_city,
  description,
  duration_days,
  deposit_cents,
  price_cents,
  included,
  published,
  type,
  package_type,
  title,
  subtitle,
  origin_city,
  destination_city,
  price_from_usd,
  highlights,
  includes,
  excludes,
  badge
)
select
  gen_random_uuid(),
  p.id,
  'comfort-recovery-journey',
  'Comfort Recovery Journey',
  'Medellín',
  'Manizales',
  'Our most popular journey with accommodation, transport, and curated recovery support.',
  10,
  100000,
  380000,
  array['medical coordination','lodging','airport pickup','transport Medellín to Manizales','support during recovery'],
  true,
  'combo',
  'combo',
  'Comfort Recovery Journey',
  'Most popular Medellín to Manizales recovery package',
  'Medellín',
  'Manizales',
  3800,
  '["Free evaluation","Treatment in Medellín","Hotel coordination","Recovery stay in Manizales"]'::jsonb,
  '["medical coordination","lodging","airport pickup","transport Medellín to Manizales","support during recovery"]'::jsonb,
  '["flights","luxury upgrades","optional premium tours"]'::jsonb,
  'MOST POPULAR'
from public.providers p
where p.slug = 'clinica-san-martin'
on conflict (slug) do update set
  name = excluded.name,
  location = excluded.location,
  recovery_city = excluded.recovery_city,
  description = excluded.description,
  duration_days = excluded.duration_days,
  deposit_cents = excluded.deposit_cents,
  price_cents = excluded.price_cents,
  included = excluded.included,
  published = excluded.published,
  type = excluded.type,
  package_type = excluded.package_type,
  title = excluded.title,
  subtitle = excluded.subtitle,
  origin_city = excluded.origin_city,
  destination_city = excluded.destination_city,
  price_from_usd = excluded.price_from_usd,
  highlights = excluded.highlights,
  includes = excluded.includes,
  excludes = excluded.excludes,
  badge = excluded.badge,
  provider_id = excluded.provider_id;

insert into public.packages (
  id,
  provider_id,
  slug,
  name,
  location,
  recovery_city,
  description,
  duration_days,
  deposit_cents,
  price_cents,
  included,
  published,
  type,
  package_type,
  title,
  subtitle,
  origin_city,
  destination_city,
  price_from_usd,
  highlights,
  includes,
  excludes,
  badge
)
select
  gen_random_uuid(),
  p.id,
  'premium-transformation-experience',
  'Premium Transformation Experience',
  'Medellín',
  'Manizales',
  'All-inclusive transformation journey with premium accommodation, private transport, and curated recovery experiences.',
  12,
  150000,
  550000,
  array['medical coordination','premium lodging','private transport','recovery support','selected experiences'],
  true,
  'combo',
  'combo',
  'Premium Transformation Experience',
  'All-inclusive medical tourism journey in Colombia',
  'Medellín',
  'Manizales',
  5500,
  '["Free evaluation","Premium treatment coordination","Private transport","Recovery experiences included"]'::jsonb,
  '["medical coordination","premium lodging","private transport","recovery support","selected experiences"]'::jsonb,
  '["flights","major add-on procedures outside agreed plan"]'::jsonb,
  'ALL INCLUSIVE'
from public.providers p
where p.slug = 'clinica-san-martin'
on conflict (slug) do update set
  name = excluded.name,
  location = excluded.location,
  recovery_city = excluded.recovery_city,
  description = excluded.description,
  duration_days = excluded.duration_days,
  deposit_cents = excluded.deposit_cents,
  price_cents = excluded.price_cents,
  included = excluded.included,
  published = excluded.published,
  type = excluded.type,
  package_type = excluded.package_type,
  title = excluded.title,
  subtitle = excluded.subtitle,
  origin_city = excluded.origin_city,
  destination_city = excluded.destination_city,
  price_from_usd = excluded.price_from_usd,
  highlights = excluded.highlights,
  includes = excluded.includes,
  excludes = excluded.excludes,
  badge = excluded.badge,
  provider_id = excluded.provider_id;

-- =========================================
-- 5) PACKAGE_SPECIALISTS
-- =========================================
insert into public.package_specialists (package_id, specialist_id, is_primary)
select
  p.id,
  s.id,
  (s.slug = 'dra-maria-sierra')
from public.packages p
cross join public.specialists s
where p.slug in (
  'essential-care-journey',
  'comfort-recovery-journey',
  'premium-transformation-experience'
)
and s.slug in ('dra-maria-sierra', 'dr-carlos-ramirez')
on conflict (package_id, specialist_id) do update set
  is_primary = excluded.is_primary;

-- =========================================
-- 6) PACKAGE_EXPERIENCES
-- =========================================
insert into public.package_experiences (package_id, experience_id, is_included, sort_order)
select
  p.id,
  e.id,
  case
    when p.slug = 'premium-transformation-experience' then true
    else false
  end,
  case e.slug
    when 'medellin-city-discovery' then 1
    when 'coffee-farm-experience' then 2
    when 'hot-springs-recovery' then 3
    else 99
  end
from public.packages p
cross join public.experiences e
where p.slug in (
  'essential-care-journey',
  'comfort-recovery-journey',
  'premium-transformation-experience'
)
and e.slug in (
  'medellin-city-discovery',
  'coffee-farm-experience',
  'hot-springs-recovery'
)
on conflict (package_id, experience_id) do update set
  is_included = excluded.is_included,
  sort_order = excluded.sort_order;

commit;
