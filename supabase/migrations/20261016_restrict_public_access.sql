-- Phase 1: close public order writes and staff-only updates while the
-- browser order/admin flows are being moved behind authenticated APIs.
-- Deploy the web maintenance routes before applying this migration.
begin;

-- Product browsing stays public. Menu writes must not be available to clients.
alter table public.menus enable row level security;
revoke all on table public.menus from public, anon, authenticated;
grant select on table public.menus to anon, authenticated;
create policy "Anyone can view menus"
  on public.menus for select to anon, authenticated using (true);

-- The existing unrestricted policies override the owner-only order policy.
drop policy if exists "Enable select for everyone" on public.orders;
drop policy if exists "Enable insert for everyone" on public.orders;
drop policy if exists "Enable update for everyone" on public.orders;
drop policy if exists "Users can insert own orders" on public.orders;
drop policy if exists "Users can view own orders" on public.orders;

revoke all on table public.orders from public, anon, authenticated;
grant select on table public.orders to authenticated;
create policy "Users can view own orders"
  on public.orders for select to authenticated
  using ((select auth.uid()) = user_id);

-- Cafe details remain visible; opening/closing a cafe is staff-only work.
drop policy if exists "Anyone can update cafes" on public.cafes;
revoke all on table public.cafes from public, anon, authenticated;
grant select on table public.cafes to anon, authenticated;

commit;
