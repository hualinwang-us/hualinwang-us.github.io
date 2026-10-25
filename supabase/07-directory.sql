-- 华邻网: business directory (商家黄页). Paste into Supabase → SQL Editor → Run.
create table if not exists public.businesses (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  name        text not null check (char_length(name) between 2 and 60),
  cat         text not null check (cat ~ '^[a-z]{2,12}$'),
  area        text check (char_length(area) <= 40),
  address     text check (char_length(address) <= 120),
  phone       text check (char_length(phone) <= 30),
  wechat      text check (char_length(wechat) <= 40),
  hours       text check (char_length(hours) <= 80),
  website     text check (char_length(website) <= 200),
  descr       text check (char_length(descr) <= 600),
  featured_until timestamptz,          -- set a date here when a business pays to be featured
  hidden      boolean not null default false,
  guest_tag   text,
  delete_key  uuid not null default gen_random_uuid()
);
alter table public.businesses enable row level security;
drop policy if exists "read visible businesses" on public.businesses;
create policy "read visible businesses" on public.businesses for select to anon, authenticated using (not hidden);
revoke all on public.businesses from anon, authenticated;
grant select (id, created_at, name, cat, area, address, phone, wechat, hours, website, descr, featured_until) on public.businesses to anon, authenticated;

create or replace function public.create_business(
  p_name text, p_cat text, p_area text, p_address text, p_phone text, p_wechat text, p_hours text, p_website text, p_descr text
) returns table (id bigint, delete_key uuid)
language plpgsql security definer set search_path = public as $$
declare v_tag text := md5(coalesce(nullif(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), ''), 'unknown'));
begin
  if nullif(trim(p_phone), '') is null and nullif(trim(p_wechat), '') is null then raise exception 'need_contact'; end if;
  if (select count(*) from businesses b where b.guest_tag = v_tag and b.created_at > now() - interval '24 hours') >= 3 then raise exception 'too_many'; end if;
  return query insert into businesses (name, cat, area, address, phone, wechat, hours, website, descr, guest_tag)
    values (trim(p_name), trim(p_cat), nullif(trim(p_area), ''), nullif(trim(p_address), ''), nullif(trim(p_phone), ''), nullif(trim(p_wechat), ''),
            nullif(trim(p_hours), ''), nullif(trim(p_website), ''), nullif(trim(p_descr), ''), v_tag)
    returning businesses.id, businesses.delete_key;
end $$;
grant execute on function public.create_business(text, text, text, text, text, text, text, text, text) to anon, authenticated;
