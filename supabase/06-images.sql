-- 华邻网: photos on listings. Paste into Supabase → SQL Editor → Run.
-- 1) A public storage folder for listing photos (max 2 MB each, JPG/PNG/WebP).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('post-images', 'post-images', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 2097152, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "post images upload" on storage.objects;
create policy "post images upload" on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'post-images' and (storage.foldername(name))[1] = 'p');

-- 2) Up to 4 photo links per listing.
alter table public.posts add column if not exists images text[];
grant select (images) on public.posts to anon, authenticated;

-- 3) Attach photos to a listing you just posted (needs the listing's private key).
create or replace function public.set_post_images(p_id bigint, p_key uuid, p_images text[])
returns boolean language plpgsql security definer set search_path = public as $$
declare v_prefix text := 'https://wkiviznpdcjubyqfovfx.supabase.co/storage/v1/object/public/post-images/p/';
begin
  if p_images is null or coalesce(array_length(p_images, 1), 0) = 0 or array_length(p_images, 1) > 4 then raise exception 'bad_images'; end if;
  if exists (select 1 from unnest(p_images) u where left(u, length(v_prefix)) <> v_prefix) then raise exception 'bad_images'; end if;
  update posts set images = p_images where id = p_id and delete_key = p_key;
  return found;
end $$;
grant execute on function public.set_post_images(bigint, uuid, text[]) to anon, authenticated;
