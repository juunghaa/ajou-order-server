-- Apply after 20261017_order_intents.sql. Do not enable the API before both migrations exist.
begin;

alter table public.orders add column if not exists payment_intent_id uuid;
alter table public.orders add column if not exists payment_key text;
create unique index if not exists orders_payment_intent_uidx on public.orders (payment_intent_id);
create unique index if not exists orders_payment_key_uidx on public.orders (payment_key);

create sequence if not exists public.paid_order_number_seq as integer;
select setval('public.paid_order_number_seq',
  greatest(1, (select coalesce(max(order_number), 0) + 1 from public.orders)), false);
revoke all on sequence public.paid_order_number_seq from public, anon, authenticated;
grant usage on sequence public.paid_order_number_seq to service_role;

create or replace function public.claim_order_intent(
  p_intent_id uuid, p_user_id uuid, p_payment_key text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare v_intent public.order_intents%rowtype;
begin
  select * into v_intent from public.order_intents
    where id = p_intent_id and user_id = p_user_id for update;
  if not found or p_payment_key is null or length(p_payment_key) < 1 then
    raise exception 'invalid order intent';
  end if;
  if v_intent.payment_key is not null and v_intent.payment_key <> p_payment_key then
    raise exception 'payment key mismatch';
  end if;
  if v_intent.status = 'confirmed' then
    return jsonb_build_object('claimed', false, 'status', 'confirmed',
      'confirmed_order_id', v_intent.confirmed_order_id);
  end if;
  if v_intent.status = 'confirming' then
    return jsonb_build_object('claimed', false, 'status', 'confirming');
  end if;
  if v_intent.status <> 'created' or v_intent.expires_at <= now() then
    raise exception 'order intent expired or unavailable';
  end if;
  update public.order_intents set status = 'confirming', payment_key = p_payment_key
    where id = p_intent_id;
  return jsonb_build_object('claimed', true, 'status', 'confirming');
end;
$$;

create or replace function public.finalize_paid_order(
  p_intent_id uuid, p_user_id uuid, p_payment_key text
) returns jsonb language plpgsql security invoker set search_path = '' as $$
declare
  v_intent public.order_intents%rowtype;
  v_order_id uuid;
  v_number integer;
  v_items jsonb;
begin
  select * into v_intent from public.order_intents
    where id = p_intent_id and user_id = p_user_id for update;
  if not found or v_intent.payment_key is distinct from p_payment_key then
    raise exception 'invalid payment intent';
  end if;
  if v_intent.status = 'confirmed' then
    select order_number into v_number from public.orders where id = v_intent.confirmed_order_id;
    return jsonb_build_object('order_id', v_intent.confirmed_order_id,
      'order_number', v_number);
  end if;
  if v_intent.status <> 'confirming' then raise exception 'intent is not confirming'; end if;

  select jsonb_agg(item || jsonb_build_object('price', item->'unitPrice')) into v_items
    from jsonb_array_elements(v_intent.items) as x(item);
  v_order_id := gen_random_uuid();
  v_number := nextval('public.paid_order_number_seq');
  insert into public.orders
    (id, user_id, cafe_id, cafe_name, items, total_price, status, note,
      payment_method, order_number, payment_intent_id, payment_key)
  values
    (v_order_id, v_intent.user_id, v_intent.cafe_id, v_intent.cafe_name,
      v_items, v_intent.amount, 'pending', v_intent.note, 'toss', v_number,
      v_intent.id, p_payment_key);
  update public.order_intents set status = 'confirmed', confirmed_order_id = v_order_id
    where id = p_intent_id;
  return jsonb_build_object('order_id', v_order_id, 'order_number', v_number);
end;
$$;

revoke all on function public.claim_order_intent(uuid, uuid, text) from public, anon, authenticated;
revoke all on function public.finalize_paid_order(uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.claim_order_intent(uuid, uuid, text) to service_role;
grant execute on function public.finalize_paid_order(uuid, uuid, text) to service_role;

commit;
