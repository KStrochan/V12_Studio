-- Car year of manufacture. Nullable: bookings created before this migration have none.
alter table bookings add column car_year smallint check (car_year between 1950 and 2100);

-- Signatures change (new p_car_year), so drop the old ones first.
drop function create_booking_tx(uuid, timestamptz, timestamptz, int, text, text, text, text, text);
drop function admin_create_booking_tx(uuid, timestamptz, timestamptz, int, text, text, text, text, text);

-- Public booking (service_role only). Keeps existing client name/car (0004 behaviour).
create function create_booking_tx(
  p_service_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_post_no int,
  p_name text,
  p_phone text,
  p_car_make text,
  p_car_model text,
  p_comment text,
  p_car_year int default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_client uuid;
  v_booking uuid;
begin
  insert into clients as c (name, phone, car)
  values (p_name, p_phone, trim(coalesce(p_car_make, '') || ' ' || coalesce(p_car_model, '')))
  on conflict (phone) do update set
    name = coalesce(nullif(c.name, ''), excluded.name),
    car = coalesce(nullif(c.car, ''), nullif(excluded.car, ''))
  returning c.id into v_client;

  insert into bookings (service_id, client_id, start_at, end_at, post_no, status, car_make, car_model, car_year, comment)
  values (p_service_id, v_client, p_start, p_end, p_post_no, 'pending', p_car_make, p_car_model, p_car_year, p_comment)
  returning id into v_booking;

  return v_booking;
end;
$$;

revoke execute on function create_booking_tx(uuid, timestamptz, timestamptz, int, text, text, text, text, text, int)
  from public, anon, authenticated;
grant execute on function create_booking_tx(uuid, timestamptz, timestamptz, int, text, text, text, text, text, int)
  to service_role;

-- Manual booking by the owner. SECURITY INVOKER, owner-only via is_owner().
create function admin_create_booking_tx(
  p_service_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_post_no int,
  p_name text,
  p_phone text,
  p_car_make text,
  p_car_model text,
  p_comment text,
  p_car_year int default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_client uuid;
  v_booking uuid;
begin
  if not is_owner() then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  insert into clients as c (name, phone, car)
  values (p_name, p_phone, trim(coalesce(p_car_make, '') || ' ' || coalesce(p_car_model, '')))
  on conflict (phone) do update set
    name = coalesce(nullif(c.name, ''), excluded.name),
    car = coalesce(nullif(c.car, ''), nullif(excluded.car, ''))
  returning c.id into v_client;

  insert into bookings (service_id, client_id, start_at, end_at, post_no, status, car_make, car_model, car_year, comment, source)
  values (p_service_id, v_client, p_start, p_end, p_post_no, 'confirmed', p_car_make, p_car_model, p_car_year, p_comment, 'manual')
  returning id into v_booking;

  return v_booking;
end;
$$;

revoke execute on function admin_create_booking_tx(uuid, timestamptz, timestamptz, int, text, text, text, text, text, int)
  from public, anon;
grant execute on function admin_create_booking_tx(uuid, timestamptz, timestamptz, int, text, text, text, text, text, int)
  to authenticated;
