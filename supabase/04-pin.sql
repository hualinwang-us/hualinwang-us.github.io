-- 华邻网: paid pinning. Paste into Supabase → SQL Editor → Run.
-- To pin a listing: Table Editor → posts → find the row → set pinned_until to the last day, e.g. 2026-11-30.
-- Pinned listings show first in their board with a red "置顶" tag, until that date. Clear the cell to unpin.
alter table public.posts add column if not exists pinned_until timestamptz;
grant select (pinned_until) on public.posts to anon, authenticated;
