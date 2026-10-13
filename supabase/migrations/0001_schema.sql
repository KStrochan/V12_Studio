create extension if not exists btree_gist;

create table services (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null default '',
  price_from integer not null check (price_from >= 0),
  duration_min integer not null check (duration_min > 0),
  icon text not null default 'wrench',
  sort_order integer not null default 0,
  active boolean not null default true
);

create table clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique check (phone ~ '^\+380[0-9]{9}$'),
  car text,
  notes text not null default '',
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references services(id),
  client_id uuid references clients(id),
  start_at timestamptz not null,
  end_at timestamptz not null,
  post_no integer not null check (post_no >= 1),
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'rejected', 'done', 'cancelled')),
  car_make text,
  car_model text,
  comment text,
  source text not null default 'site',
  created_at timestamptz not null default now(),
  check (end_at > start_at),
  constraint bookings_no_overlap exclude using gist (
    post_no with =,
    tstzrange(start_at, end_at) with &&
  ) where (status in ('pending', 'confirmed'))
);
create index bookings_start_idx on bookings (start_at);
create index bookings_client_idx on bookings (client_id);

create table consultations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null check (phone ~ '^\+380[0-9]{9}$'),
  question text,
  status text not null default 'new' check (status in ('new', 'handled')),
  created_at timestamptz not null default now()
);

create table settings (
  id boolean primary key default true check (id),
  phone text not null default '',
  address text not null default '',
  socials jsonb not null default '{}'::jsonb,
  working_hours jsonb not null default '{}'::jsonb,
  posts integer not null default 2 check (posts >= 1),
  step_min integer not null default 30 check (step_min > 0),
  min_lead_min integer not null default 60 check (min_lead_min >= 0)
);

create table days_off (
  day date primary key,
  reason text
);

create table reviews (
  id uuid primary key default gen_random_uuid(),
  author text not null,
  body text not null,
  rating integer not null check (rating between 1 and 5),
  visible boolean not null default true,
  created_at timestamptz not null default now()
);

create table rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  hits integer not null default 0
);

-- true = allowed. Fixed window per key.
create function hit_rate_limit(p_key text, p_max int, p_window_sec int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_hits int;
begin
  insert into rate_limits as r (key, window_start, hits)
  values (p_key, now(), 1)
  on conflict (key) do update set
    window_start = case
      when r.window_start < now() - make_interval(secs => p_window_sec) then now()
      else r.window_start end,
    hits = case
      when r.window_start < now() - make_interval(secs => p_window_sec) then 1
      else r.hits + 1 end
  returning hits into v_hits;
  return v_hits <= p_max;
end;
$$;
