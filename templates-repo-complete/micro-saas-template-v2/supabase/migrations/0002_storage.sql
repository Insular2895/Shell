-- ============================================================================
-- 0002_storage.sql
--
-- Buckets Storage + RLS sur storage.objects.
-- À exécuter APRÈS 0001_initial.sql.
-- ============================================================================

-- ----- Bucket : job-uploads (privé, fichiers que l'user envoie) -----
insert into storage.buckets (id, name, public)
values ('job-uploads', 'job-uploads', false)
on conflict (id) do nothing;

-- L'user peut uploader dans son propre dossier (path commence par son user_id)
drop policy if exists "users insert own uploads" on storage.objects;
create policy "users insert own uploads"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'job-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "users select own uploads" on storage.objects;
create policy "users select own uploads"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'job-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

drop policy if exists "users delete own uploads" on storage.objects;
create policy "users delete own uploads"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'job-uploads'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- ----- Bucket : job-outputs (privé, fichiers générés par l'engine) -----
insert into storage.buckets (id, name, public)
values ('job-outputs', 'job-outputs', false)
on conflict (id) do nothing;

-- Les users peuvent lire les outputs de leurs propres jobs.
-- Note : on joint via la table jobs pour vérifier que le job appartient bien à l'user.
drop policy if exists "users select own outputs" on storage.objects;
create policy "users select own outputs"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'job-outputs'
    and exists (
      select 1 from public.jobs
      where jobs.id::text = (storage.foldername(name))[1]
        and jobs.user_id = (select auth.uid())
    )
  );

-- Les écritures sont faites uniquement par le service-role (engine via /api/upload)
-- → pas de policy d'insert pour `authenticated`.
