-- A booking for an existing phone must not let a third party overwrite the
-- stored client name/car; only fill them in when they are empty.
create or replace function create_booking_tx(
  p_service_id uuid,
  p_start timestamptz,
  p_end timestamptz,
  p_post_no int,
  p_name text,
  p_phone text,
  p_car_make text,
  p_car_model text,
  p_comment text
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

  insert into bookings (service_id, client_id, start_at, end_at, post_no, status, car_make, car_model, comment)
  values (p_service_id, v_client, p_start, p_end, p_post_no, 'pending', p_car_make, p_car_model, p_comment)
  returning id into v_booking;

  return v_booking;
end;
$$;
