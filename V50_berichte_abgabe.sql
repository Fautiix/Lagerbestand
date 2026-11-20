-- V50: Berichte-Abgabe – REFERENZSTAND der Live-Datenbank (abgeglichen am 20.11.2026)
-- ACHTUNG: Diese Teile sind in Supabase bereits aktiv. NICHT erneut ausführen,
-- außer bei einer Neueinrichtung. Das Skript ist so geschrieben, dass ein erneutes
-- Ausführen nichts doppelt anlegt und keine bestehende Policy überschreibt.
--
-- Bereits vorhanden aus V30/V39/V49 (hier NICHT neu angelegt):
--   weekly_timesheets.submitted_at, Policies timesheets_own_*, v30_week_read
--   (E-Meister sieht nur abgegebene Zettel), v30_week_update,
--   Trigger app_v49_week_submit_guard (setzt submitted_at nur über app.week_submit='1'),
--   Funktion app_v49_week_submit(date).
-- Hinweis: Der frühere Entwurf mit Trigger v50_guard_week_submission und
-- Einstellung app.v50_week_submit wurde NICHT übernommen – er hätte die
-- V49-Abgabe blockiert. Diesen Trigger nicht anlegen.

-- 1) Stundenzettel abgeben: V50-Name delegiert an die geprüfte V49-Funktion.
create or replace function public.app_v50_submit_week(target_week date)
returns timestamptz language sql set search_path = '' as $$
  select public.app_v49_week_submit(target_week);
$$;
revoke all on function public.app_v50_submit_week(date) from public, anon;
grant execute on function public.app_v50_submit_week(date) to authenticated;

-- 2) Blaue Zettel: E-Meister sieht fremde Berichte erst nach Polier-Unterschrift
--    (bei zwei Blättern beide) oder wenn bereits geprüft.
do $$ begin
  if not exists (select 1 from pg_policies where schemaname='public'
                 and tablename='app_montage_reports' and policyname='v50_blue_signed_only') then
    create policy "v50_blue_signed_only" on public.app_montage_reports as restrictive
    for select to authenticated
    using (
      owner_user_id = auth.uid()
      or reviewed_at is not null
      or (polier_signed_at is not null
          and coalesce(document->'data'->>'sign_bauleitung','') <> ''
          and (jsonb_typeof(document->'extraData') is distinct from 'object'
               or coalesce(document->'extraData'->>'sign_bauleitung','') <> ''))
    );
  end if;
end $$;

-- 3) Eigene, noch nicht unterschriebene blaue Entwürfe löschen.
create or replace function public.app_v50_delete_blue_draft(target_report text)
returns boolean language plpgsql security definer set search_path = public, pg_temp as $$
declare deleted_count integer;
begin
 if auth.uid() is null or not public.app_has_access(auth.uid()) then
   raise exception 'Bitte anmelden';
 end if;
 delete from public.app_montage_reports
 where report_id=target_report and owner_user_id=auth.uid()
   and polier_signed_at is null and reviewed_at is null
   and coalesce(document->'data'->>'sign_bauleitung','')=''
   and coalesce(document->'extraData'->>'sign_bauleitung','')='';
 get diagnostics deleted_count = row_count;
 if deleted_count=0 and exists(select 1 from public.app_montage_reports where report_id=target_report)
 then raise exception 'Nur eigene, noch nicht abgegebene Berichte sind löschbar'; end if;
 return deleted_count>0;
end $$;
revoke all on function public.app_v50_delete_blue_draft(text) from public, anon;
grant execute on function public.app_v50_delete_blue_draft(text) to authenticated;
