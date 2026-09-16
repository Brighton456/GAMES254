-- Games254 wallet ledger — status mapping + withdrawal flow v2.
-- Adds checkout_id (BrightPay's id returned by /pay) so the /status poller can
-- resolve the external_reference and credit exactly once.

alter table public.brightpay_requests
  add column checkout_id text;

create unique index brightpay_requests_checkout_key
  on public.brightpay_requests (checkout_id)
  where checkout_id is not null;

create or replace function public.record_pending(
  p_ref text,
  p_owner uuid,
  p_kind text,
  p_amount_cents bigint,
  p_checkout_id text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_ref !~ '^[A-Za-z0-9_-]{8,64}$' then
    raise exception 'invalid external_reference';
  end if;
  if p_kind not in ('deposit', 'withdraw') then
    raise exception 'invalid kind';
  end if;
  if p_amount_cents <= 0 or p_amount_cents > 15000000 then
    raise exception 'invalid amount';
  end if;
  perform public.ensure_profile(p_owner);
  insert into public.brightpay_requests
    (external_reference, owner_id, kind, status, amount_cents, checkout_id)
  values
    (p_ref, p_owner, p_kind,
     case when p_kind = 'deposit' then 'PENDING' else 'QUEUED' end,
     p_amount_cents, nullif(p_checkout_id, ''))
  on conflict (external_reference) do update
    set updated_at = now(),
        checkout_id = coalesce(excluded.checkout_id, brightpay_requests.checkout_id);
end;
$$;

-- Resolve a completed deposit by BrightPay checkout_id (idempotent).
create or replace function public.record_completed_by_checkout(
  p_checkout text,
  p_receipt text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ref text;
begin
  select external_reference into v_ref
    from public.brightpay_requests
    where checkout_id = p_checkout;
  if not found then
    return null;
  end if;
  return public.record_completed_deposit(v_ref, p_receipt);
end;
$$;

grant execute on function public.record_pending(text, uuid, text, bigint, text) to anon;
grant execute on function public.record_completed_by_checkout(text, text) to anon;
grant execute on function public.record_completed_deposit(text, text) to anon;
grant execute on function public.record_withdraw(text, uuid, bigint) to anon;
grant execute on function public.balance_for(uuid) to anon;
grant execute on function public.ledger_for(uuid) to anon;
grant execute on function public.ensure_profile(uuid, text) to anon;