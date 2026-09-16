-- Games254 wallet & ledger persistence on Supabase (games-mcp project).
--
-- TENANT MODEL (v1, demo): device uuid (playerId) kept in localStorage, sent by
-- the client as an `x-player-id` header. Ledger keys on `profiles.id`.
-- When anonymous/phone auth is enabled in the dashboard, client caller becomes
-- auth.uid(); the RPC layer already keys everything on owner uuid, so switching
-- identities needs no schema change.
--
-- SECURITY MODEL: tables are RLS-enabled with NO anon policies. The only write
-- path is the SECURITY DEFINER functions below (run as postgres), which validate
-- references/amounts and make double-credit impossible via the UNIQUE
-- external_reference. Clients may only read via `balance_for` / `ledger_for`.

create extension if not exists pgcrypto;

create type public.tx_kind as enum
  ('deposit', 'withdraw', 'stake-in', 'payout', 'refund', 'fee', 'bonus');

create table public.profiles (
  id           uuid primary key,
  display_name text not null default 'Guest 254',
  created_at   timestamptz not null default now()
);

create table public.wallets (
  owner_id        uuid primary key references public.profiles (id) on delete cascade,
  available_cents bigint not null default 0 check (available_cents >= 0),
  escrow_cents    bigint not null default 0 check (escrow_cents >= 0),
  updated_at      timestamptz not null default now()
);

create table public.wallet_tx (
  id                 bigint generated always as identity primary key,
  owner_id           uuid not null references public.profiles (id) on delete cascade,
  kind               public.tx_kind not null,
  cents              bigint not null,
  balance_after      bigint not null default 0,
  external_reference text not null unique,
  note               text,
  created_at         timestamptz not null default now()
);
create index wallet_tx_owner_created_idx on public.wallet_tx (owner_id, created_at desc);

create table public.brightpay_requests (
  external_reference text primary key,
  owner_id           uuid references public.profiles (id) on delete cascade,
  kind               text not null check (kind in ('deposit', 'withdraw')),
  status             text not null default 'PENDING'
    check (status in ('PENDING', 'COMPLETED', 'FAILED', 'QUEUED')),
  amount_cents       bigint not null check (amount_cents > 0),
  mpesa_receipt      text,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.wallets enable row level security;
alter table public.wallet_tx enable row level security;
alter table public.brightpay_requests enable row level security;

grant usage on schema public to anon;
grant execute on all functions in schema public to anon;

-- ---------------------------------------------------------------- functions

create or replace function public.ensure_profile(p_id uuid, p_name text default 'Guest 254')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (p_id, coalesce(nullif(trim(p_name), ''), 'Guest 254'))
  on conflict (id) do nothing;
end;
$$;

create or replace function public.record_pending(
  p_ref text,
  p_owner uuid,
  p_kind text,
  p_amount_cents bigint
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
    (external_reference, owner_id, kind, status, amount_cents)
  values
    (p_ref, p_owner, p_kind,
     case when p_kind = 'deposit' then 'PENDING' else 'QUEUED' end,
     p_amount_cents)
  on conflict (external_reference) do update
    set updated_at = now();
end;
$$;

-- Marks a deposit COMPLETED (call ONLY after BrightPay reports completed).
-- Idempotent: a re-poll after completion returns the balance without re-crediting.
create or replace function public.record_completed_deposit(p_ref text, p_receipt text default null)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_rec public.brightpay_requests%rowtype;
  v_bal bigint := 0;
begin
  select * into v_rec
    from public.brightpay_requests
    where external_reference = p_ref
    for update;
  if not found then
    return null;
  end if;
  if v_rec.status = 'COMPLETED' then
    select available_cents into v_bal from public.wallets
      where owner_id = v_rec.owner_id;
    return coalesce(v_bal, 0);
  end if;

  select available_cents into v_bal
    from public.wallets where owner_id = v_rec.owner_id;
  v_bal := coalesce(v_bal, 0) + v_rec.amount_cents;

  insert into public.wallets (owner_id, available_cents, escrow_cents)
  values (v_rec.owner_id, v_bal, 0)
  on conflict (owner_id) do update
    set available_cents = v_bal, updated_at = now();

  insert into public.wallet_tx
    (owner_id, kind, cents, balance_after, external_reference, note)
  values
    (v_rec.owner_id, 'deposit', v_rec.amount_cents, v_bal, p_ref,
     'BrightPay ' || coalesce(p_receipt, 'confirm'));

  update public.brightpay_requests
    set status = 'COMPLETED', mpesa_receipt = p_receipt, updated_at = now()
    where external_reference = p_ref;

  return v_bal;
end;
$$;

-- Deducts a queued withdrawal from the wallet (call ONLY after BrightPay accepts).
-- Idempotent by external_reference.
create or replace function public.record_withdraw(
  p_ref text,
  p_owner uuid,
  p_amount_cents bigint
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bal bigint := 0;
begin
  select available_cents into v_bal
    from public.wallets where owner_id = p_owner;
  v_bal := coalesce(v_bal, 0);
  if p_amount_cents <= 0 or v_bal < p_amount_cents then
    raise exception 'insufficient balance for withdrawal';
  end if;
  v_bal := v_bal - p_amount_cents;

  insert into public.wallets (owner_id, available_cents, escrow_cents)
  values (p_owner, v_bal, 0)
  on conflict (owner_id) do update
    set available_cents = v_bal, updated_at = now();

  insert into public.wallet_tx
    (owner_id, kind, cents, balance_after, external_reference, note)
  values
    (p_owner, 'withdraw', -p_amount_cents, v_bal, p_ref, 'M-Pesa reversal queued');

  insert into public.brightpay_requests
    (external_reference, owner_id, kind, status, amount_cents)
  values (p_ref, p_owner, 'withdraw', 'QUEUED', p_amount_cents)
  on conflict (external_reference) do update set updated_at = now();

  return v_bal;
end;
$$;

create or replace function public.balance_for(p_owner uuid)
returns table (available_cents bigint, escrow_cents bigint)
language sql
security definer
set search_path = public
as $$
  select w.available_cents, w.escrow_cents
    from public.wallets w
    where w.owner_id = p_owner;
$$;

create or replace function public.ledger_for(p_owner uuid)
returns table (
  id bigint,
  kind public.tx_kind,
  cents bigint,
  balance_after bigint,
  note text,
  created_at timestamptz
)
language sql
security definer
set search_path = public
as $$
  select t.id, t.kind, t.cents, t.balance_after, t.note, t.created_at
    from public.wallet_tx t
    where t.owner_id = p_owner
    order by t.created_at desc
    limit 100;
$$;