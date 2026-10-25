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
