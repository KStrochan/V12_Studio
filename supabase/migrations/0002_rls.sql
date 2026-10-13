alter table services enable row level security;
alter table clients enable row level security;
alter table bookings enable row level security;
alter table consultations enable row level security;
alter table settings enable row level security;
alter table days_off enable row level security;
alter table reviews enable row level security;
alter table rate_limits enable row level security;

-- Owner = JWT with app_metadata.role = 'owner'. Anonymous writes go through the
-- server (service_role), never directly.
create function is_owner() returns boolean
language sql stable
as $$ select coalesce(auth.jwt() -> 'app_metadata' ->> 'role', '') = 'owner' $$;

-- Public read
create policy services_public_read on services for select using (active);
create policy reviews_public_read on reviews for select using (visible);
create policy settings_public_read on settings for select using (true);
create policy days_off_public_read on days_off for select using (true);

-- Owner: everything
create policy services_owner on services for all using (is_owner()) with check (is_owner());
create policy reviews_owner on reviews for all using (is_owner()) with check (is_owner());
create policy settings_owner on settings for all using (is_owner()) with check (is_owner());
create policy days_off_owner on days_off for all using (is_owner()) with check (is_owner());
create policy bookings_owner on bookings for all using (is_owner()) with check (is_owner());
create policy clients_owner on clients for all using (is_owner()) with check (is_owner());
create policy consultations_owner on consultations for all using (is_owner()) with check (is_owner());

-- rate_limits: no policies and no grants; only hit_rate_limit() (security definer) touches it.
revoke all on rate_limits from anon, authenticated;
