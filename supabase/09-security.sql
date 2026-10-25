-- 华邻网: security hardening (from the QA review). Paste into Supabase → SQL Editor → Run. Safe to run more than once.

-- 1) Identify a visitor's network by the address Cloudflare records, which visitors cannot fake.
--    (The first x-forwarded-for entry can be typed in by anyone.)
create or replace function public.client_tag() returns text
language sql stable set search_path = public as $$
  select md5(coalesce(
    nullif(current_setting('request.headers', true)::json ->> 'cf-connecting-ip', ''),
    nullif(current_setting('request.headers', true)::json ->> 'x-real-ip', ''),
    nullif(trim(split_part(current_setting('request.headers', true)::json ->> 'x-forwarded-for', ',', 1)), ''),
    'unknown'));
$$;

-- 2) Reports: only signed-in people can report, each account counts once,
--    and a listing is hidden after 3 different accounts report it.
create or replace function public.report_post(p_id bigint, p_reason text)
returns integer language plpgsql security definer set search_path = public as $$
declare n integer;
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  insert into reports (post_id, reason, reporter) values (p_id, p_reason, auth.uid()::text)
    on conflict (post_id, reporter) do nothing;
  select count(*) into n from reports r where r.post_id = p_id and r.reporter ~ '^[0-9a-f-]{36}$';
  if n >= 3 then update posts set hidden = true where id = p_id; end if;
  return n;
end $$;
revoke all on function public.report_post(bigint, text) from public;
grant execute on function public.report_post(bigint, text) to authenticated;

-- 3) Posting limits: guests 1 a day (by network and phone/WeChat); accounts 5 per 10 minutes and 20 a day;
--    the site-wide brake only counts guest posts, so throwaway accounts can't block everyone else.
create or replace function public.create_post(
  p_board text, p_title text, p_body text, p_area text, p_contact text, p_phone text, p_wechat text
) returns table (id bigint, delete_key uuid)
language plpgsql security definer set search_path = public as $$
declare v_guest text := null;
begin
  if auth.uid() is null then
    v_guest := client_tag();
    if exists (select 1 from posts p where p.user_id is null and p.created_at > now() - interval '24 hours'
               and (p.guest_tag = v_guest
                    or (nullif(trim(p_phone), '') is not null and p.phone = trim(p_phone))
                    or (nullif(trim(p_wechat), '') is not null and p.wechat = trim(p_wechat)))) then
      raise exception 'guest_limit';
    end if;
    if (select count(*) from posts p where p.user_id is null and p.created_at > now() - interval '10 minutes') >= 30 then
      raise exception 'site_busy';
    end if;
  else
    if (select count(*) from posts p where p.user_id = auth.uid() and p.created_at > now() - interval '10 minutes') >= 5 then
      raise exception 'too_many_posts';
    end if;
    if (select count(*) from posts p where p.user_id = auth.uid() and p.created_at > now() - interval '24 hours') >= 20 then
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

-- 4) Business listings: same unfakeable network tag, 3 a day.
create or replace function public.create_business(
  p_name text, p_cat text, p_area text, p_address text, p_phone text, p_wechat text, p_hours text, p_website text, p_descr text
) returns table (id bigint, delete_key uuid)
language plpgsql security definer set search_path = public as $$
declare v_tag text := client_tag();
begin
  if nullif(trim(p_phone), '') is null and nullif(trim(p_wechat), '') is null then raise exception 'need_contact'; end if;
  if (select count(*) from businesses b where b.guest_tag = v_tag and b.created_at > now() - interval '24 hours') >= 3 then raise exception 'too_many'; end if;
  return query insert into businesses (name, cat, area, address, phone, wechat, hours, website, descr, guest_tag)
    values (trim(p_name), trim(p_cat), nullif(trim(p_area), ''), nullif(trim(p_address), ''), nullif(trim(p_phone), ''), nullif(trim(p_wechat), ''),
            nullif(trim(p_hours), ''), nullif(trim(p_website), ''), nullif(trim(p_descr), ''), v_tag)
    returning businesses.id, businesses.delete_key;
end $$;
grant execute on function public.create_business(text, text, text, text, text, text, text, text, text) to anon, authenticated;

-- 5) Block sexual-service wording in business listings too (posts already have this).
create or replace function public.businesses_block_banned() returns trigger
language plpgsql as $$
begin
  if (coalesce(new.name, '') || ' ' || coalesce(new.descr, '')) ~* '上门服务|按摩上门|包夜|援交|约炮|一夜情|性服务|全套服务|特殊服务|小姐上门|伴游|陪睡|包养|sugar ?(daddy|baby)|escort|hookup' then
    raise exception 'banned_content';
  end if;
  return new;
end $$;
drop trigger if exists businesses_block_banned on public.businesses;
create trigger businesses_block_banned before insert or update on public.businesses
  for each row execute function public.businesses_block_banned();

-- 6) Replies: nicknames can't pretend to be the site or use banned wording.
create or replace function public.add_reply(p_post bigint, p_body text)
returns bigint language plpgsql security definer set search_path = public as $$
declare v_id bigint; v_name text;
begin
  if auth.uid() is null then raise exception 'login_required'; end if;
  if char_length(trim(coalesce(p_body, ''))) < 1 then raise exception 'empty'; end if;
  if p_body ~* '上门服务|按摩上门|包夜|援交|约炮|一夜情|性服务|全套服务|特殊服务|小姐上门|伴游|陪睡|包养|sugar ?(daddy|baby)|escort|hookup' then raise exception 'banned_content'; end if;
  if (select count(*) from post_replies r where r.user_id = auth.uid() and r.created_at > now() - interval '10 minutes') >= 10 then raise exception 'too_many'; end if;
  select coalesce(nullif(trim(u.raw_user_meta_data ->> 'full_name'), ''), split_part(u.email, '@', 1)) into v_name from auth.users u where u.id = auth.uid();
  v_name := left(coalesce(v_name, '邻居'), 20);
  if v_name ~* '华邻|管理|官方|客服|admin|hualin|版主|站长'
     or v_name ~* '上门服务|按摩|包夜|援交|约炮|一夜情|性服务|伴游|陪睡|包养|escort|hookup' then
    v_name := '邻居';
  end if;
  insert into post_replies (post_id, user_id, author, body) values (p_post, auth.uid(), v_name, trim(p_body)) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.add_reply(bigint, text) to authenticated;

-- 7) Photo uploads: signed-in people only (stops anonymous scripts from filling the free storage).
drop policy if exists "post images upload" on storage.objects;
create policy "post images upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = 'p');
