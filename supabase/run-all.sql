-- 华邻网: all database updates in one go (02 to 07). Safe to run more than once.
-- Supabase → SQL Editor → New query → paste everything → Run.

-- ===== 02-reports =====
-- 华邻网: reports. Paste into Supabase → SQL Editor → Run (after schema.sql).
-- Anyone can report a listing; reports are counted per visitor network address, and a listing
-- reported by 3 different visitors is hidden automatically. Review in Table Editor → reports;
-- to restore a listing, set posts.hidden back to false.

create table if not exists public.reports (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  post_id     bigint not null references public.posts(id) on delete cascade,
  reason      text not null check (reason in ('scam', 'illegal', 'spam', 'expired', 'other')),
  reporter    text not null,
  unique (post_id, reporter)
);

alter table public.reports enable row level security;
revoke all on public.reports from anon, authenticated;

create or replace function public.report_post(p_id bigint, p_reason text)
returns integer language plpgsql security definer set search_path = public as $$
declare
  who text;
  n integer;
begin
  who := md5(coalesce(nullif(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), ''), 'unknown'));
  insert into reports (post_id, reason, reporter) values (p_id, p_reason, who)
    on conflict (post_id, reporter) do nothing;
  select count(*) into n from reports where post_id = p_id;
  if n >= 3 then
    update posts set hidden = true where id = p_id;
  end if;
  return n;
end $$;

revoke all on function public.report_post(bigint, text) from public;
grant execute on function public.report_post(bigint, text) to anon, authenticated;

-- ===== 03-login =====
-- 华邻网: accounts and guest posting. Paste into Supabase → SQL Editor → Run (after schema.sql).
-- Signed-in people: up to 5 posts per 10 minutes, and they can delete their posts from any device.
-- Guests (not signed in): one post per day, counted by network address and by phone/WeChat.

alter table public.posts add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.posts add column if not exists guest_tag text;
create index if not exists posts_user_idx on public.posts (user_id);

create or replace function public.create_post(
  p_board text, p_title text, p_body text, p_area text, p_contact text, p_phone text, p_wechat text
) returns table (id bigint, delete_key uuid)
language plpgsql security definer set search_path = public as $$
declare
  v_guest text := null;
begin
  if auth.uid() is null then
    -- Guest: one post per 24 hours per network address, and per phone / WeChat.
    v_guest := md5(coalesce(nullif(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1), ''), 'unknown'));
    if exists (select 1 from posts p where p.user_id is null and p.created_at > now() - interval '24 hours'
               and (p.guest_tag = v_guest
                    or (nullif(trim(p_phone), '') is not null and p.phone = trim(p_phone))
                    or (nullif(trim(p_wechat), '') is not null and p.wechat = trim(p_wechat)))) then
      raise exception 'guest_limit';
    end if;
  else
    -- Signed in: at most 5 posts per 10 minutes.
    if (select count(*) from posts p where p.user_id = auth.uid() and p.created_at > now() - interval '10 minutes') >= 5 then
      raise exception 'too_many_posts';
    end if;
  end if;
  if (select count(*) from posts p where p.created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'site_busy';
  end if;
  return query
    insert into posts (board, title, body, area, contact, phone, wechat, user_id, guest_tag)
    values (trim(p_board), trim(p_title), trim(p_body), nullif(trim(p_area), ''),
            nullif(trim(p_contact), ''), nullif(trim(p_phone), ''), nullif(trim(p_wechat), ''), auth.uid(), v_guest)
    returning posts.id, posts.delete_key;
end $$;

grant execute on function public.create_post(text, text, text, text, text, text, text) to anon, authenticated;

-- Delete your own post (signed in).
create or replace function public.delete_my_post(p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from posts where posts.id = p_id and posts.user_id = auth.uid() and auth.uid() is not null;
  return found;
end $$;
revoke all on function public.delete_my_post(bigint) from public;
grant execute on function public.delete_my_post(bigint) to authenticated;

-- Which posts belong to me (so the page can show a delete button).
create or replace function public.my_post_ids()
returns setof bigint language sql security definer set search_path = public stable as $$
  select id from posts where user_id = auth.uid() and auth.uid() is not null;
$$;
revoke all on function public.my_post_ids() from public;
grant execute on function public.my_post_ids() to authenticated;

-- ===== 04-pin =====
-- 华邻网: paid pinning. Paste into Supabase → SQL Editor → Run.
-- To pin a listing: Table Editor → posts → find the row → set pinned_until to the last day, e.g. 2026-11-30.
-- Pinned listings show first in their board with a red "置顶" tag, until that date. Clear the cell to unpin.
alter table public.posts add column if not exists pinned_until timestamptz;
grant select (pinned_until) on public.posts to anon, authenticated;

-- ===== 05-safety =====
-- 华邻网: refuse sexual-service / paid-companionship posts on the server too (the page already blocks them).
-- Paste into Supabase → SQL Editor → Run.
create or replace function public.posts_block_banned() returns trigger
language plpgsql as $$
begin
  if (coalesce(new.title, '') || ' ' || coalesce(new.body, '')) ~* '上门服务|按摩上门|包夜|援交|约炮|一夜情|性服务|全套服务|特殊服务|小姐上门|伴游|陪睡|包养|sugar ?(daddy|baby)|escort|hookup' then
    raise exception 'banned_content';
  end if;
  return new;
end $$;
drop trigger if exists posts_block_banned on public.posts;
create trigger posts_block_banned before insert or update on public.posts
  for each row execute function public.posts_block_banned();

-- ===== 06-images =====
-- 华邻网: photos on listings. Paste into Supabase → SQL Editor → Run.
-- 1) A public storage folder for listing photos (max 2 MB each, JPG/PNG/WebP).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "post images upload" on storage.objects;
create policy "post images upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = 'p');

-- 2) Up to 4 photo links per listing.
alter table public.posts add column if not exists images text[];
grant select (images) on public.posts to anon, authenticated;

-- 3) Attach photos to a listing you just posted (needs the listing's private key).
create or replace function public.set_post_images(p_id bigint, p_key uuid, p_images text[])
returns boolean language plpgsql security definer set search_path = public as $$
declare v_prefix text := 'https://wkiviznpdcjubyqfovfx.supabase.co/storage/v1/object/public/post-images/p/';
begin
  if p_images is null or coalesce(array_length(p_images, 1), 0) = 0 or array_length(p_images, 1) > 4 then raise exception 'bad_images'; end if;
  if exists (select 1 from unnest(p_images) u where left(u, length(v_prefix)) <> v_prefix) then raise exception 'bad_images'; end if;
  update posts set images = p_images where id = p_id and delete_key = p_key;
  return found;
end $$;
grant execute on function public.set_post_images(bigint, uuid, text[]) to anon, authenticated;

-- ===== 07-directory =====
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

-- ===== 08-replies =====
-- 华邻网: replies on listings + "my replies". Paste into Supabase → SQL Editor → Run.
create table if not exists public.post_replies (
  id         bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  post_id    bigint not null references public.posts(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  author     text not null,
  body       text not null check (char_length(body) between 1 and 1000),
  hidden     boolean not null default false
);
create index if not exists post_replies_post_idx on public.post_replies (post_id, created_at);
create index if not exists post_replies_user_idx on public.post_replies (user_id, created_at desc);
alter table public.post_replies enable row level security;
drop policy if exists "read visible replies" on public.post_replies;
create policy "read visible replies" on public.post_replies for select to anon, authenticated using (not hidden);
revoke all on public.post_replies from anon, authenticated;
grant select (id, created_at, post_id, author, body) on public.post_replies to anon, authenticated;

-- Reply (signed-in users only): 10 replies per 10 minutes, no sexual-service wording.
create or replace function public.add_reply(p_post bigint, p_body text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_name text;
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  if char_length(trim(coalesce(p_body, ''))) < 1 then raise exception 'empty'; end if;
  if p_body ~* '上门服务|按摩上门|包夜|援交|约炮|一夜情|性服务|全套服务|特殊服务|小姐上门|伴游|陪睡|包养|sugar ?(daddy|baby)|escort|hookup' then raise exception 'banned_content'; end if;
  if (select count(*) from post_replies r where r.user_id = auth.uid() and r.created_at > now() - interval '10 minutes') >= 10 then raise exception 'too_many'; end if;
  select coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)) into v_name from auth.users u where u.id = auth.uid();
  insert into post_replies (post_id, user_id, author, body) values (p_post, auth.uid(), left(coalesce(v_name, '邻居'), 20), trim(p_body)) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.add_reply(bigint, text) to authenticated;

-- My replies (for the profile page)
create or replace function public.my_replies()
returns table (id bigint, created_at timestamptz, post_id bigint, body text)
language sql security definer set search_path = public stable as $$
  select r.id, r.created_at, r.post_id, r.body from post_replies r where r.user_id = auth.uid() and auth.uid() is not null order by r.created_at desc limit 200;
$$;
grant execute on function public.my_replies() to authenticated;

-- Which replies are mine (to show a delete button), and delete my reply
create or replace function public.my_reply_ids(p_post bigint)
returns setof bigint language sql security definer set search_path = public stable as $$
  select id from post_replies where post_id = p_post and user_id = auth.uid() and auth.uid() is not null;
$$;
grant execute on function public.my_reply_ids(bigint) to authenticated;
create or replace function public.delete_my_reply(p_id bigint)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from post_replies where id = p_id and user_id = auth.uid() and auth.uid() is not null;
  return found;
end $$;
grant execute on function public.delete_my_reply(bigint) to authenticated;
