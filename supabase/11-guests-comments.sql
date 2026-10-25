-- 华脉: (1) guests can post more than one listing a day, with anti-flood limits;
--       (2) comments on news stories, open to guests. Paste into Supabase → SQL Editor → Run. Safe to run more than once.

-- 1) Posting limits. Guests: up to 5 per 10 minutes and 20 a day from the same network (stops scripts, not people).
--    Accounts: 5 per 10 minutes, 20 a day. Site-wide brake on guest posts stays.
create or replace function public.create_post(
  p_board text, p_title text, p_body text, p_area text, p_contact text, p_phone text, p_wechat text
) returns table (id bigint, delete_key uuid)
language plpgsql security definer set search_path = public as $$
declare v_guest text := null;
begin
  if auth.uid() is null then
    v_guest := client_tag();
    if (select count(*) from posts p where p.user_id is null and p.guest_tag = v_guest and p.created_at > now() - interval '10 minutes') >= 5
       or (select count(*) from posts p where p.user_id is null and p.guest_tag = v_guest and p.created_at > now() - interval '24 hours') >= 20 then
      raise exception 'too_many_posts';
    end if;
    if (select count(*) from posts p where p.user_id is null and p.created_at > now() - interval '10 minutes') >= 60 then
      raise exception 'site_busy';
    end if;
  else
    if (select count(*) from posts p where p.user_id = auth.uid() and p.created_at > now() - interval '10 minutes') >= 5
       or (select count(*) from posts p where p.user_id = auth.uid() and p.created_at > now() - interval '24 hours') >= 20 then
      raise exception 'too_many_posts';
    end if;
  end if;
  return query
    insert into posts (board, title, body, area, contact, phone, wechat, user_id, guest_tag)
    values (trim(p_board), trim(p_title), trim(p_body), nullif(trim(p_area), ''),
            nullif(trim(p_contact), ''), nullif(trim(p_phone), ''), nullif(trim(p_wechat), ''), auth.uid(), v_guest)
    returning posts.id, posts.delete_key;
end $$;
grant execute on function public.create_post(text, text, text, text, text, text, text) to anon, authenticated;

-- 2) News comments.
create table if not exists public.news_comments (
  id          bigint generated always as identity primary key,
  news_id     text not null check (news_id ~ '^[A-Za-z0-9_-]{1,40}$'),
  author      text not null default '邻居',
  body        text not null check (char_length(body) between 1 and 500),
  created_at  timestamptz not null default now(),
  hidden      boolean not null default false,
  user_id     uuid,
  guest_tag   text
);
create index if not exists news_comments_news_idx on public.news_comments (news_id, created_at desc);
alter table public.news_comments enable row level security;
drop policy if exists "news comments readable" on public.news_comments;
create policy "news comments readable" on public.news_comments for select to anon, authenticated using (not hidden);
revoke all on public.news_comments from anon, authenticated;
grant select (id, news_id, author, body, created_at) on public.news_comments to anon, authenticated;

create or replace function public.add_news_comment(p_news text, p_body text, p_name text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_name text; v_tag text := client_tag(); v_body text := trim(coalesce(p_body, ''));
begin
  if char_length(v_body) < 1 or char_length(v_body) > 500 then raise exception 'bad_length'; end if;
  if v_body ~* '上门服务|按摩上门|包夜|援交|约炮|一夜情|性服务|全套服务|特殊服务|小姐上门|伴游|陪睡|包养|sugar ?(daddy|baby)|escort|hookup' then raise exception 'banned_content'; end if;
  if (select count(*) from news_comments c where c.guest_tag = v_tag and c.created_at > now() - interval '10 minutes') >= 5
     or (select count(*) from news_comments c where c.guest_tag = v_tag and c.created_at > now() - interval '24 hours') >= 40 then
    raise exception 'too_many';
  end if;
  if auth.uid() is not null then
    select coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)) into v_name from auth.users u where u.id = auth.uid();
  else
    v_name := nullif(trim(coalesce(p_name, '')), '');
  end if;
  v_name := left(coalesce(v_name, '邻居'), 20);
  if v_name ~* '华邻|华脉|管理|官方|客服|admin|hualin|huamai|版主|站长|上门服务|按摩|包夜|援交|约炮|一夜情|性服务|伴游|陪睡|包养|escort|hookup' then v_name := '邻居'; end if;
  insert into news_comments (news_id, author, body, user_id, guest_tag) values (p_news, v_name, v_body, auth.uid(), v_tag) returning id into v_id;
  return v_id;
end $$;
revoke all on function public.add_news_comment(text, text, text) from public;
grant execute on function public.add_news_comment(text, text, text) to anon, authenticated;
