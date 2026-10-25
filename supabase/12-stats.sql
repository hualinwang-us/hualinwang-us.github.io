-- 华脉: anonymous page-view counter + weekly report data.
-- Paste into Supabase → SQL Editor → Run. Safe to run more than once.
-- Stores only "which page, which day, app or web, how many times" — no IP, no device, no personal data.

create table if not exists public.page_hits (
  day   date    not null,
  path  text    not null,
  app   boolean not null default false,
  n     integer not null default 0,
  primary key (day, path, app)
);
alter table public.page_hits enable row level security;
revoke all on public.page_hits from anon, authenticated;

-- Called by the site on each page change.
create or replace function public.hit(p_path text, p_app boolean default false)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_path is null or p_path !~ '^[a-z0-9-]{0,40}$' then return; end if;
  insert into page_hits (day, path, app, n)
    values ((now() at time zone 'America/New_York')::date, coalesce(nullif(p_path, ''), 'home'), coalesce(p_app, false), 1)
    on conflict (day, path, app) do update set n = page_hits.n + 1;
end $$;
revoke all on function public.hit(text, boolean) from public;
grant execute on function public.hit(text, boolean) to anon, authenticated;

-- Count rows newer than a time in a table that may not exist yet (returns -1 if missing).
create or replace function public._cnt_since(t text, since timestamptz)
returns bigint language plpgsql security definer set search_path = public, auth as $$
declare n bigint;
begin
  if to_regclass(t) is null then return -1; end if;
  if since is null then execute format('select count(*) from %s', t) into n;
  else execute format('select count(*) from %s where created_at >= $1', t) into n using since; end if;
  return n;
exception when others then return -1;
end $$;
revoke all on function public._cnt_since(text, timestamptz) from public, anon, authenticated;

-- Everything the weekly email needs, in one call. Only the server key (GitHub secret) can run it.
create or replace function public.weekly_report(p_days integer default 7)
returns json language plpgsql security definer set search_path = public, auth as $$
declare
  since timestamptz := now() - make_interval(days => p_days);
  prev  timestamptz := now() - make_interval(days => p_days * 2);
  sday  date := (since at time zone 'America/New_York')::date;
  pday  date := (prev at time zone 'America/New_York')::date;
  r json;
begin
  select json_build_object(
    'views',      (select coalesce(sum(n), 0) from page_hits where day >= sday),
    'views_prev', (select coalesce(sum(n), 0) from page_hits where day >= pday and day < sday),
    'views_app',  (select coalesce(sum(n), 0) from page_hits where day >= sday and app),
    'views_daily',(select coalesce(json_agg(x order by x.day), '[]') from (select day, sum(n) as n from page_hits where day >= sday group by day) x),
    'top_pages',  (select coalesce(json_agg(x), '[]') from (select path, sum(n) as n from page_hits where day >= sday group by path order by 2 desc limit 15) x),
    'posts_new',  (select count(*) from posts where created_at >= since),
    'posts_prev', (select count(*) from posts where created_at >= prev and created_at < since),
    'posts_total',(select count(*) from posts where not hidden),
    'posts_by_board', (select coalesce(json_agg(x), '[]') from (select board, count(*) as n from posts where created_at >= since group by board order by 2 desc) x),
    'hidden_new', (select count(*) from posts where hidden and created_at >= prev),
    'reports_new',(select count(*) from reports where created_at >= since),
    'reported',   (select coalesce(json_agg(x), '[]') from (
                     select p.id, p.board, p.title, p.hidden, count(r.*) as n, string_agg(distinct r.reason, ',') as reasons, max(r.created_at) as last
                     from reports r join posts p on p.id = r.post_id
                     where r.created_at >= since group by p.id order by count(r.*) desc, max(r.created_at) desc limit 20) x),
    'replies_new',  _cnt_since('public.post_replies', since),
    'comments_new', _cnt_since('public.news_comments', since),
    'users_new',  _cnt_since('auth.users', since),
    'users_total',_cnt_since('auth.users', null),
    'biz_total',  _cnt_since('public.businesses', null)
  ) into r;
  return r;
end $$;
revoke all on function public.weekly_report(integer) from public, anon, authenticated;
grant execute on function public.weekly_report(integer) to service_role;
