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
