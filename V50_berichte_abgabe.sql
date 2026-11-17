-- V50: Entwürfe erst nach Abgabe im Prüfplatz sichtbar.
-- Einmalig nach Prüfung der bestehenden RLS-Regeln im Supabase SQL Editor ausführen.
-- Bereits bestehende ungeprüfte Stundenzettel gelten zunächst als Entwurf;
-- der Mitarbeiter kann sie durch den neuen Abgabe-Knopf einreichen.

alter table public.weekly_timesheets add column if not exists submitted_at timestamptz;
create index if not exists weekly_timesheets_submitted_idx on public.weekly_timesheets (submitted_at) where submitted_at is not null;
create index if not exists montage_reports_polier_signed_idx on public.app_montage_reports (polier_signed_at) where polier_signed_at is not null;

-- Auch bei bereits vorhandenen erlaubenden SELECT-Policies bleiben fremde Entwürfe unsichtbar.
drop policy if exists "v50_week_submitted_only" on public.weekly_timesheets;
create policy "v50_week_submitted_only" on public.weekly_timesheets as restrictive
for select to authenticated
using (user_id = auth.uid() or submitted_at is not null);

drop policy if exists "v50_blue_signed_only" on public.app_montage_reports;
create policy "v50_blue_signed_only" on public.app_montage_reports as restrictive
for select to authenticated
using (owner_user_id = auth.uid() or (
  nullif(document->'data'->>'sign_bauleitung','') is not null
  and (document->'extraData' is null or document->'extraData' = 'null'::jsonb
       or nullif(document->'extraData'->>'sign_bauleitung','') is not null)
));

-- Direkte Manipulation des Abgabe-Zeitstempels verhindern.
create or replace function public.v50_guard_week_submission() returns trigger
language plpgsql security definer set search_path=public as $$
begin
 if tg_op='INSERT' then
   new.submitted_at=null;
 elsif new.submitted_at is distinct from old.submitted_at then
   if coalesce(current_setting('app.v50_week_submit',true),'') <> 'yes' then
      raise exception 'Abgabe nur über Stundenzettel abgeben möglich';
   end if;
 end if;
 return new;
end $$;
drop trigger if exists v50_guard_week_submission on public.weekly_timesheets;
create trigger v50_guard_week_submission
before insert or update on public.weekly_timesheets
for each row execute function public.v50_guard_week_submission();

create or replace function public.app_v50_submit_week(target_week date)
returns timestamptz language plpgsql security definer set search_path=public as $$
declare stamp timestamptz;
begin
 if auth.uid() is null then raise exception 'Bitte anmelden'; end if;
 perform set_config('app.v50_week_submit','yes',true);
 update public.weekly_timesheets
 set submitted_at=coalesce(submitted_at,now())
 where user_id=auth.uid() and week_start=target_week
 returning submitted_at into stamp;
 if stamp is null then raise exception 'Stundenzettel nicht gefunden. Bitte zuerst speichern.'; end if;
 return stamp;
end $$;
revoke all on function public.app_v50_submit_week(date) from public;
grant execute on function public.app_v50_submit_week(date) to authenticated;

-- Der Monteur darf nur eigene, noch nicht vom Polier signierte Entwürfe löschen.
create or replace function public.app_v50_delete_blue_draft(target_report text)
returns boolean language plpgsql security definer set search_path=public as $$
declare deleted_count integer;
begin
 if auth.uid() is null then raise exception 'Bitte anmelden'; end if;
 delete from public.app_montage_reports
 where report_id=target_report and owner_user_id=auth.uid()
   and polier_signed_at is null and reviewed_at is null
   and nullif(document->'data'->>'sign_bauleitung','') is null
   and nullif(document->'extraData'->>'sign_bauleitung','') is null;
 get diagnostics deleted_count = row_count;
 if deleted_count=0 then
   if exists(select 1 from public.app_montage_reports where report_id=target_report) then
     raise exception 'Nur eigene, noch nicht abgegebene Berichte sind löschbar';
   end if;
 end if;
 return deleted_count>0;
end $$;
revoke all on function public.app_v50_delete_blue_draft(text) from public;
grant execute on function public.app_v50_delete_blue_draft(text) to authenticated;
