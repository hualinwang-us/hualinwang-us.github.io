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
