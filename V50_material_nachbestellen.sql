-- V50: Gemeinsame Material-Nachbestellliste
-- Einmalig im Supabase SQL Editor ausführen.
create table if not exists public.material_reorders (
  id bigint generated always as identity primary key,
  material_id bigint not null references public.materials(id) on delete restrict,
  material_name text not null,
  material_number text,
  employee_user_id uuid not null default auth.uid() references auth.users(id),
  employee_name text not null,
  status text not null default 'offen' check (status in ('offen','bestellt')),
  created_at timestamptz not null default now(),
  ordered_at timestamptz,
  ordered_by uuid references auth.users(id)
);
create index if not exists material_reorders_open_idx on public.material_reorders (status, created_at desc);
alter table public.material_reorders enable row level security;
grant select, insert, update on public.material_reorders to authenticated;
grant usage, select on sequence public.material_reorders_id_seq to authenticated;
drop policy if exists "v50_reorders_select" on public.material_reorders;
create policy "v50_reorders_select" on public.material_reorders for select to authenticated using (public.app_has_access());
drop policy if exists "v50_reorders_insert" on public.material_reorders;
create policy "v50_reorders_insert" on public.material_reorders for insert to authenticated
with check (public.app_has_access() and employee_user_id=auth.uid() and status='offen' and ordered_at is null and ordered_by is null);
drop policy if exists "v50_reorders_update" on public.material_reorders;
create policy "v50_reorders_update" on public.material_reorders for update to authenticated
using (public.app_is_reviewer() or public.app_is_admin(auth.uid()))
with check (public.app_is_reviewer() or public.app_is_admin(auth.uid()));
-- Status- und Materialfelder werden zusätzlich serverseitig vor Manipulation geschützt.
create or replace function public.v50_reorder_guard() returns trigger language plpgsql security definer set search_path=public,pg_temp as $$
declare m record; p text;
begin
  if TG_OP='INSERT' then
    select name,material_number::text into m from public.materials where id=new.material_id;
    if not found then raise exception 'Material nicht gefunden'; end if;
    select name into p from public.app_user_profiles where user_id=auth.uid() and is_active=true;
    if p is null then raise exception 'Aktiver Mitarbeiter-Account erforderlich'; end if;
    new.employee_user_id=auth.uid();
    new.employee_name=p;
    new.material_name=m.name;
    new.material_number=m.material_number;
    new.status='offen';new.ordered_at=null;new.ordered_by=null;
  elsif TG_OP='UPDATE' then
    if not (public.app_is_reviewer() or public.app_is_admin(auth.uid())) then raise exception 'Nur E-Meister oder Admin darf abhaken'; end if;
    if (new.material_id,new.material_name,new.material_number,new.employee_user_id,new.employee_name,new.created_at)
      is distinct from (old.material_id,old.material_name,old.material_number,old.employee_user_id,old.employee_name,old.created_at)
    then raise exception 'Anforderungsdaten dürfen nicht verändert werden'; end if;
    if new.status not in ('offen','bestellt') then raise exception 'Ungültiger Status'; end if;
    if new.status='bestellt' and old.status='offen' then new.ordered_at=now();new.ordered_by=auth.uid();
    elsif new.status='offen' and old.status='bestellt' then new.ordered_at=null;new.ordered_by=null;
    else new.ordered_at=old.ordered_at;new.ordered_by=old.ordered_by;end if;
  end if;
  return new;
end $$;
revoke all on function public.v50_reorder_guard() from public, anon, authenticated;
drop trigger if exists v50_reorder_guard on public.material_reorders;
create trigger v50_reorder_guard before insert or update on public.material_reorders
for each row execute function public.v50_reorder_guard();
-- Hinweis: Tabellen, RLS und Trigger werden erst mit Ausführung dieser Datei aktiv.
