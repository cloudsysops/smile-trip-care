-- 0025_package_builder_items.sql
-- Extend marketplace schema for package builder (experiences + package_experiences).

-- 1) experiences: category, base_price_cents, city
alter table public.experiences
  add column if not exists category text,
  add column if not exists base_price_cents bigint not null default 0,
  add column if not exists city text;

-- 2) package_experiences: included, price_override_cents, sort_order
alter table public.package_experiences
  add column if not exists included boolean not null default true,
  add column if not exists price_override_cents bigint,
  add column if not exists sort_order integer not null default 0;

-- 3) Seed curated experiences and attach to key packages (safe, idempotent where possible)
do $$
declare
  med_exp_id uuid;
  med_man_exp_id uuid;
  man_lux_id uuid;
  exp_airport_med uuid;
  exp_family_lodging_med uuid;
  exp_clinic_transport_med uuid;
  exp_med_man_transfer uuid;
  exp_guatape uuid;
  exp_ecopark uuid;
  exp_finca_manizales uuid;
  exp_coffee_tour uuid;
  exp_meals uuid;
begin
  select id into med_man_exp_id from public.packages where slug = 'medellin-manizales-premium' limit 1;
  select id into med_exp_id from public.packages where slug = 'medellin-experience' limit 1;
  select id into man_lux_id from public.packages where slug = 'manizales-luxury' limit 1;

  -- Only proceed if at least one of the target packages exists.
  if med_exp_id is null and med_man_exp_id is null and man_lux_id is null then
    return;
  end if;

  -- Create experiences if they don't exist yet (by name & city)
  insert into public.experiences (name, description, category, base_price_cents, city)
  values
    ('Airport pickup Medellín', 'Private airport pickup in Medellín with local coordinator.', 'transport', 8000, 'medellin'),
    ('Family-hosted lodging Medellín', 'Stay with a vetted local family in Medellín (private room).', 'lodging', 35000, 'medellin'),
    ('Clinic transport Medellín', 'Round-trip transport between lodging and dental clinic in Medellín.', 'transport', 6000, 'medellin'),
    ('Medellín → Manizales transfer', 'Ground transfer from Medellín to Manizales with scenic route.', 'transport', 12000, 'multi'),
    ('Guatapé tour', 'Day trip to Guatapé with local guide.', 'tour', 15000, 'medellin'),
    ('Eco-park overnight stay', 'Overnight eco-park stay with breakfast.', 'tour', 18000, 'multi'),
    ('Luxury finca Manizales', 'Luxury finca stay in Manizales (pool/jacuzzi).', 'lodging', 38000, 'manizales'),
    ('Coffee tour Manizales', 'Guided coffee farm tour in the coffee region.', 'tour', 10000, 'manizales'),
    ('Meals included', 'Daily breakfast and dinner included at host family or finca.', 'food', 12000, 'multi')
  on conflict do nothing;

  select id into exp_airport_med from public.experiences where name = 'Airport pickup Medellín' limit 1;
  select id into exp_family_lodging_med from public.experiences where name = 'Family-hosted lodging Medellín' limit 1;
  select id into exp_clinic_transport_med from public.experiences where name = 'Clinic transport Medellín' limit 1;
  select id into exp_med_man_transfer from public.experiences where name = 'Medellín → Manizales transfer' limit 1;
  select id into exp_guatape from public.experiences where name = 'Guatapé tour' limit 1;
  select id into exp_ecopark from public.experiences where name = 'Eco-park overnight stay' limit 1;
  select id into exp_finca_manizales from public.experiences where name = 'Luxury finca Manizales' limit 1;
  select id into exp_coffee_tour from public.experiences where name = 'Coffee tour Manizales' limit 1;
  select id into exp_meals from public.experiences where name = 'Meals included' limit 1;

  -- Helper to attach an experience to a package if both exist.
  if med_exp_id is not null then
    if exp_airport_med is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_exp_id, exp_airport_med, true, 10)
      on conflict do nothing;
    end if;
    if exp_family_lodging_med is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_exp_id, exp_family_lodging_med, true, 20)
      on conflict do nothing;
    end if;
    if exp_meals is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_exp_id, exp_meals, true, 30)
      on conflict do nothing;
    end if;
    if exp_clinic_transport_med is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_exp_id, exp_clinic_transport_med, true, 40)
      on conflict do nothing;
    end if;
    if exp_guatape is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_exp_id, exp_guatape, true, 50)
      on conflict do nothing;
    end if;
    if exp_ecopark is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_exp_id, exp_ecopark, true, 60)
      on conflict do nothing;
    end if;
  end if;

  if med_man_exp_id is not null then
    if exp_airport_med is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_man_exp_id, exp_airport_med, true, 10)
      on conflict do nothing;
    end if;
    if exp_family_lodging_med is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_man_exp_id, exp_family_lodging_med, true, 20)
      on conflict do nothing;
    end if;
    if exp_meals is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_man_exp_id, exp_meals, true, 30)
      on conflict do nothing;
    end if;
    if exp_clinic_transport_med is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_man_exp_id, exp_clinic_transport_med, true, 40)
      on conflict do nothing;
    end if;
    if exp_med_man_transfer is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_man_exp_id, exp_med_man_transfer, true, 50)
      on conflict do nothing;
    end if;
    if exp_guatape is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_man_exp_id, exp_guatape, true, 60)
      on conflict do nothing;
    end if;
    if exp_ecopark is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_man_exp_id, exp_ecopark, true, 70)
      on conflict do nothing;
    end if;
    if exp_finca_manizales is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_man_exp_id, exp_finca_manizales, true, 80)
      on conflict do nothing;
    end if;
    if exp_coffee_tour is not null then
      -- optional coffee tour
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (med_man_exp_id, exp_coffee_tour, false, 90)
      on conflict do nothing;
    end if;
  end if;

  if man_lux_id is not null then
    if exp_airport_med is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (man_lux_id, exp_airport_med, true, 10)
      on conflict do nothing;
    end if;
    if exp_med_man_transfer is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (man_lux_id, exp_med_man_transfer, true, 20)
      on conflict do nothing;
    end if;
    if exp_finca_manizales is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (man_lux_id, exp_finca_manizales, true, 30)
      on conflict do nothing;
    end if;
    if exp_meals is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (man_lux_id, exp_meals, true, 40)
      on conflict do nothing;
    end if;
    if exp_clinic_transport_med is not null then
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (man_lux_id, exp_clinic_transport_med, true, 50)
      on conflict do nothing;
    end if;
    if exp_coffee_tour is not null then
      -- optional coffee tour in Manizales Luxury
      insert into public.package_experiences (package_id, experience_id, included, sort_order)
      values (man_lux_id, exp_coffee_tour, false, 60)
      on conflict do nothing;
    end if;
  end if;
end $$;

