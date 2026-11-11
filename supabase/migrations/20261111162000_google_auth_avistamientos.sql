begin;

alter table public.avistamientos
  add column if not exists entrenador_id uuid
  references auth.users (id) on delete set null;

create index if not exists avistamientos_entrenador_id_idx
  on public.avistamientos (entrenador_id);

alter table public.avistamientos enable row level security;

drop policy if exists avistamientos_insert_authenticated
  on public.avistamientos;
drop policy if exists avistamientos_insert_require_owner
  on public.avistamientos;

create policy avistamientos_insert_authenticated
  on public.avistamientos
  as permissive
  for insert
  to authenticated
  with check (auth.uid() is not null and entrenador_id = auth.uid());

create policy avistamientos_insert_require_owner
  on public.avistamientos
  as restrictive
  for insert
  to public
  with check (auth.uid() is not null and entrenador_id = auth.uid());

commit;
