-- 华邻网 classifieds database. Paste this whole file into Supabase → SQL Editor → Run.
-- Visitors can read and post without an account. Each poster gets a private delete key
-- (kept in their browser) to remove their own post. The site owner moderates in Table Editor:
-- set "hidden" to true, or delete the row.

create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  created_at  timestamptz not null default now(),
  board       text not null check (board ~ '^[a-z]{2,12}$'),
  title       text not null check (char_length(title) between 2 and 60),
  body        text not null check (char_length(body) between 2 and 2000),
  area        text check (char_length(area) <= 30),
  contact     text check (char_length(contact) <= 20),
  phone       text check (char_length(phone) <= 20),
  wechat      text check (char_length(wechat) <= 30),
  delete_key  uuid not null default gen_random_uuid(),
  hidden      boolean not null default false,
  constraint has_contact check (coalesce(phone, '') <> '' or coalesce(wechat, '') <> '')
);

create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_board_idx on public.posts (board, created_at desc);

alter table public.posts enable row level security;

drop policy if exists "anyone reads visible posts" on public.posts;
create policy "anyone reads visible posts" on public.posts
  for select to anon, authenticated using (hidden = false);

-- Visitors can read every column except the delete key, and cannot write the table directly.
revoke all on public.posts from anon, authenticated;
grant select (id, created_at, board, title, body, area, contact, phone, wechat) on public.posts to anon, authenticated;

-- Create a post; returns its id and the poster's private delete key.
create or replace function public.create_post(
  p_board text, p_title text, p_body text, p_area text, p_contact text, p_phone text, p_wechat text
) returns table (id bigint, delete_key uuid)
language plpgsql security definer set search_path = public as $$
begin
  -- Simple flood control: at most 3 posts per phone/WeChat per 10 minutes, 60 site-wide per 10 minutes.
  if (select count(*) from posts p
        where p.created_at > now() - interval '10 minutes'
          and ((nullif(p_phone, '') is not null and p.phone = p_phone)
            or (nullif(p_wechat, '') is not null and p.wechat = p_wechat))) >= 3 then
    raise exception 'too_many_posts';
  end if;
  if (select count(*) from posts p where p.created_at > now() - interval '10 minutes') >= 60 then
    raise exception 'site_busy';
  end if;
  return query
    insert into posts (board, title, body, area, contact, phone, wechat)
    values (trim(p_board), trim(p_title), trim(p_body), nullif(trim(p_area), ''),
            nullif(trim(p_contact), ''), nullif(trim(p_phone), ''), nullif(trim(p_wechat), ''))
    returning posts.id, posts.delete_key;
end $$;

-- Delete a post with its delete key.
create or replace function public.delete_post(p_id bigint, p_key uuid)
returns boolean language plpgsql security definer set search_path = public as $$
begin
  delete from posts where posts.id = p_id and posts.delete_key = p_key;
  return found;
end $$;

revoke all on function public.create_post(text, text, text, text, text, text, text) from public;
revoke all on function public.delete_post(bigint, uuid) from public;
grant execute on function public.create_post(text, text, text, text, text, text, text) to anon, authenticated;
grant execute on function public.delete_post(bigint, uuid) to anon, authenticated;
