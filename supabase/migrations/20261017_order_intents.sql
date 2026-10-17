-- Prepare authenticated checkout without changing existing orders or client grants.
-- Apply before setting ENABLE_ORDER_INTENTS=true on the server.
begin;

create table if not exists public.order_intents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  cafe_id text not null references public.cafes(id),
  cafe_name text not null,
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  amount integer not null check (amount > 0),
  note text not null default '' check (char_length(note) <= 100),
  status text not null default 'created'
    check (status in ('created', 'confirming', 'confirmed', 'failed', 'cancelled')),
  payment_key text unique,
  confirmed_order_id uuid unique references public.orders(id),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default (now() + interval '30 minutes')
);

create index if not exists order_intents_user_created_idx
  on public.order_intents (user_id, created_at desc);

alter table public.order_intents enable row level security;
revoke all on table public.order_intents from public, anon, authenticated;
grant all on table public.order_intents to service_role;

commit;
