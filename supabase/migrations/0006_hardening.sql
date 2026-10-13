-- 1. days_off.reason is a private owner note: anon must not read the base table.
--    Public availability reads dates through days_off_public (day only).
drop policy days_off_public_read on days_off;
revoke select on days_off from anon;

create view days_off_public as select day from days_off;
revoke all on days_off_public from public, anon, authenticated;
grant select on days_off_public to anon, authenticated, service_role;

-- 2. hit_rate_limit: pinned search_path and opportunistic purge of stale rows.
create index if not exists rate_limits_window_start_idx on rate_limits (window_start);

create or replace function hit_rate_limit(p_key text, p_max int, p_window_sec int)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_hits int;
begin
  delete from rate_limits where window_start < now() - interval '1 day';

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

revoke execute on function hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function hit_rate_limit(text, int, int) to service_role;
