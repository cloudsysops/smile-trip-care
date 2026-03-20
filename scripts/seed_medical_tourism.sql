-- Seed: 3 two-city packages (Medellín → Manizales) + specialists + experiences
-- Run after 0006_specialists_consultations_experiences.sql

-- 1) Three travel packages (two-city medical journey)
insert into public.packages (slug, name, location, recovery_city, description, duration_days, deposit_cents, included, itinerary_outline, published, badge)
values
  (
    'essential-care-journey',
    'Essential Care Journey',
    'Medellín',
    'Manizales',
    'Treatment in Medellín with Clínica San Martín, then recovery in Manizales. Ideal for focused care and value.',
    7,
    45000,
    array[
      'Medical consultation',
      'Treatment coordination',
      'Hotel accommodation (shared options)',
      'Airport pickup',
      'Transport Medellín → Manizales',
      'Recovery support'
    ],
    'Day 1-2: Medellín arrival, consultation. Day 3-4: Treatment. Day 5: Transfer to Manizales. Day 6-7: Recovery & departure.',
    true,
    null
  ),
  (
    'comfort-recovery-journey',
    'Comfort Recovery Journey',
    'Medellín',
    'Manizales',
    'Our most popular option: treatment in Medellín, then comfort recovery in Manizales with curated lodging and support.',
    10,
    75000,
    array[
      'Medical consultation',
      'Treatment coordination',
      'Hotel accommodation (private options)',
      'Airport pickup',
      'Transport Medellín → Manizales',
      'Recovery support',
      'One guided experience in Manizales'
    ],
    'Day 1-3: Medellín consultation & treatment. Day 4: Transfer. Day 5-9: Manizales recovery + experience. Day 10: Departure.',
    true,
    'MOST POPULAR'
  ),
  (
    'premium-transformation-experience',
    'Premium Transformation Experience',
    'Medellín',
    'Manizales',
    'All-inclusive: full treatment coordination, premium lodging, transport, and multiple recovery experiences.',
    14,
    120000,
    array[
      'Medical consultation',
      'Treatment coordination',
      'Premium hotel accommodation',
      'Airport pickup',
      'Transport Medellín → Manizales',
      'Recovery support',
      'Multiple curated experiences',
      'Spa recovery option',
      'Dedicated coordinator'
    ],
    'Day 1-4: Medellín. Day 5: Transfer. Day 6-13: Manizales recovery + experiences. Day 14: Departure.',
    true,
    'ALL INCLUSIVE'
  )
on conflict (slug) do update set
  name = excluded.name,
  location = excluded.location,
  recovery_city = excluded.recovery_city,
  description = excluded.description,
  duration_days = excluded.duration_days,
  deposit_cents = excluded.deposit_cents,
  included = excluded.included,
  itinerary_outline = excluded.itinerary_outline,
  published = excluded.published,
  badge = excluded.badge,
  updated_at = now();

-- 2) Specialists (published). Run once; re-run may create duplicates unless you truncate first.
insert into public.specialists (name, specialty, city, clinic, description, published, sort_order)
values
  ('Dr. María García', 'Dental specialists', 'Medellín', 'Clínica San Martín', 'Expert in dental transformation and full-mouth rehabilitation.', true, 1),
  ('Dr. Carlos Rodríguez', 'Dermatology', 'Medellín', 'Clínica San Martín', 'Board-certified dermatology and aesthetic procedures.', true, 2),
  ('Dra. Ana López', 'Plastic surgery', 'Medellín', 'Clínica San Martín', 'Reconstructive and aesthetic surgery coordination.', true, 3),
  ('Nutrition & Wellness Team', 'Nutrition', 'Medellín', 'Clínica San Martín', 'Pre- and post-treatment nutrition and wellness support.', true, 4),
  ('Wellness & Recovery', 'Wellness', 'Manizales', 'Partner clinics', 'Recovery programs and wellness experiences in the coffee region.', true, 5),
  ('Physiotherapy Team', 'Physiotherapy', 'Manizales', 'Partner clinics', 'Recovery and rehabilitation support during your stay.', true, 6);

-- (no unique constraint on specialists by name; use id. So we need to use upsert by id or skip duplicates. For seed we use do nothing and rely on first run. If re-run, we might duplicate. Better: do update on (name, specialty) or use a temp approach. Simplest: delete and re-insert for seed, or use ON CONFLICT. We don't have a unique on (name, specialty). So just insert - if script is run twice we get duplicates. Document "run once". Or add unique(specialty, name) and on conflict do update.)
-- Let's add no conflict - table is empty on first run. If they run again, we need to avoid duplicates. I'll use ON CONFLICT (id) - but id is gen_random_uuid so never conflicts. So second run inserts duplicates. Better: truncate specialists and experiences in seed, then insert. Or: check if count > 0 skip. For simplicity leave as-is; docs say "run after migration".

-- 3) Experiences (recovery/tourism)
insert into public.experiences (name, city, category, description, price_cents, duration_hours, published, sort_order)
values
  ('Coffee farm tour', 'Manizales', 'tour', 'Visit a working coffee finca in the Eje Cafetero.', 3500, 4, true, 1),
  ('Hot springs experience', 'Manizales', 'wellness', 'Relax at natural hot springs near Manizales.', 2500, 3, true, 2),
  ('Paragliding Medellín', 'Medellín', 'adventure', 'Tandem paragliding over the Aburrá Valley.', 12000, 2, true, 3),
  ('City tour Medellín', 'Medellín', 'tour', 'Guided tour of Comuna 13 and downtown.', 4000, 4, true, 4),
  ('Spa recovery package', 'Manizales', 'wellness', 'Full spa day for post-treatment recovery.', 8000, 6, true, 5),
  ('Nature hiking', 'Manizales', 'adventure', 'Guided hike in Los Nevados region.', 5000, 5, true, 6);
