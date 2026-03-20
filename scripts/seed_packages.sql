-- Seed published packages: Medellín and Manizales
-- Run after 0001_init.sql (e.g. in Supabase SQL editor)

insert into public.packages (slug, name, location, description, duration_days, deposit_cents, included, itinerary_outline, published)
values
  (
    'smile-medellin',
    'Nebula Smile Medellín',
    'Medellín',
    'Premium dental transformation in Medellín with optional Guatapé tour. Coordinated with Clínica San Martín.',
    7,
    50000,
    array['Consultation', 'Accommodation coordination', 'Internal transport', 'Optional Guatapé excursion'],
    'Day 1: Arrival & orientation. Day 2-3: Consultations & planning. Day 4-6: Treatment days. Day 7: Follow-up & departure.',
    true
  ),
  (
    'smile-manizales',
    'Nebula Smile Manizales',
    'Manizales',
    'Recovery and experience in the coffee region. Finca foundation HQ with Clínica San Martín.',
    7,
    50000,
    array['Consultation', 'Finca accommodation', 'Coffee region experience', 'Internal transport'],
    'Day 1: Arrival. Day 2-3: Consultations. Day 4-6: Treatment & recovery. Day 7: Coffee tour & departure.',
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  location = excluded.location,
  description = excluded.description,
  duration_days = excluded.duration_days,
  deposit_cents = excluded.deposit_cents,
  included = excluded.included,
  itinerary_outline = excluded.itinerary_outline,
  published = excluded.published,
  updated_at = now();
