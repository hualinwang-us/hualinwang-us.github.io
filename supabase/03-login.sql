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
