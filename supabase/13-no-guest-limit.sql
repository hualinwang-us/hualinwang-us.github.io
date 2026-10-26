-- 华脉: temporarily remove the per-visitor posting limit for guests (no account).
-- Paste into Supabase → SQL Editor → Run. To restore the limit later, run 11-guests-comments.sql again.
-- Kept: a site-wide safety brake (300 guest posts in 10 minutes) so a spam robot can't flood the site,
-- plus all the existing content checks (banned words, length, contact required).

alter table public.posts add column if not exists guest_tag text;

create or replace function public.create_post(
  p_board text, p_title text, p_body text, p_area text, p_contact text, p_phone text, p_wechat text
) returns table (id bigint, delete_key uuid)
language plpgsql security definer set search_path = public as $$
declare v_guest text := null;
begin
  if auth.uid() is null then
    v_guest := client_tag();
    -- no per-guest limit for now; only stop a robot flood
    if (select count(*) from posts p where p.user_id is null and p.created_at > now() - interval '10 minutes') >= 300 then
      raise exception 'site_busy';
    end if;
  else
    if (select count(*) from posts p where p.user_id = auth.uid() and p.created_at > now() - interval '10 minutes') >= 20
       or (select count(*) from posts p where p.user_id = auth.uid() and p.created_at > now() - interval '24 hours') >= 100 then
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
