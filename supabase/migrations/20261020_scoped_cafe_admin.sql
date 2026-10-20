-- Cafe managers are assigned by a trusted operator in the Supabase dashboard.
-- No public signup field or browser state can create an assignment.
begin;

create table public.admin_cafe_access (
  user_id uuid not null references auth.users(id) on delete cascade,
  cafe_id text not null references public.cafes(id) on delete cascade,
  granted_at timestamptz not null default now(),
  primary key (user_id, cafe_id)
);

alter table public.admin_cafe_access enable row level security;
revoke all on table public.admin_cafe_access from public, anon, authenticated;
grant select on table public.admin_cafe_access to authenticated;

create policy "Managers can read their cafe assignments"
  on public.admin_cafe_access for select to authenticated
  using ((select auth.uid()) = user_id);

-- Browsing cafes stays public. Assigned managers may only change is_open;
-- they cannot edit cafe identity, prices, or their own assignments.
do $$
begin
  if exists (
    select 1 from pg_policies
    where schemaname = 'public' and tablename = 'cafes'
      and cmd in ('UPDATE', 'ALL')
  ) then
    raise exception 'Review existing cafe update policies before enabling manager access';
  end if;
end
$$;

revoke update on table public.cafes from public, anon, authenticated;
grant update (is_open) on table public.cafes to authenticated;
create policy "Assigned managers can change cafe open status"
  on public.cafes for update to authenticated
  using (
    exists (
      select 1 from public.admin_cafe_access access
      where access.user_id = (select auth.uid())
        and access.cafe_id = cafes.id
    )
  )
  with check (
    exists (
      select 1 from public.admin_cafe_access access
      where access.user_id = (select auth.uid())
        and access.cafe_id = cafes.id
    )
  );

commit;
