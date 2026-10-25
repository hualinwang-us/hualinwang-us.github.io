-- 华脉: reply nicknames also can't pretend to be the site under its new name. Paste into Supabase → SQL Editor → Run.

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
  if v_name ~* '华邻|华脉|管理|官方|客服|admin|hualin|huamai|版主|站长'
     or v_name ~* '上门服务|按摩|包夜|援交|约炮|一夜情|性服务|伴游|陪睡|包养|escort|hookup' then
    v_name := '邻居';
  end if;
  insert into post_replies (post_id, user_id, author, body) values (p_post, auth.uid(), v_name, trim(p_body)) returning id into v_id;
  return v_id;
end $$;
grant execute on function public.add_reply(bigint, text) to authenticated;

