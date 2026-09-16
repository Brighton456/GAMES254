-- Games254: server-side stake/payout ledger for cash games (#60).
-- The client mints a short monotonic game id and fires two idempotent RPCs:
--   open_game(name, owner, stake)   -> escrows the stake, deduplicated by game_id
--   settle_game(name, result, credit) -> applies win/draw/loss credit once
-- Mirror of the client's local settlement rules: launch -S, win +prize,
-- draw +S, loss keeps the stake (server). All writes are SECURITY DEFINER,
-- anon never sees a table row directly.

create table public.game_ledger (
  game_id     text primary key check (game_id ~ '^[A-Za-z0-9_-]{8,40}$'),
  owner_id    uuid not null references public.profiles(id) on delete cascade,
  stake_cents bigint not null check (stake_cents between 1 and 15000000),
  status       text not null default 'staked'
               check (status in ('staked', 'won', 'lost', 'drawn')),
  prize_cents  bigint not null default 0 check (prize_cents between 0 and 150000000),
  created_at   timestamptz not null default now(),
  settled_at   timestamptz
);

create index game_ledger_owner_idx on public.game_ledger (owner_id, created_at desc);

-- Game ledger rows carry no BrightPay checkout reference; keep the historical
-- unique constraint for BrightPay rows but stop forcing a reference on these.
alter table public.wallet_tx alter column external_reference drop not null;

alter table public.game_ledger enable row level security;
-- No anon policies: game_ledger is only reachable through the RPCs below.

create or replace function public.open_game(
  p_game text,
  p_owner uuid,
  p_stake_cents bigint
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_bal bigint := 0;
begin
  if p_game !~ '^[A-Za-z0-9_-]{8,40}$' then
    raise exception 'invalid game_id';
  end if;
  if p_stake_cents <= 0 or p_stake_cents > 15000000 then
    raise exception 'invalid stake';
  end if;
  -- Idempotent: an already-open game never re-deducts the stake.
  if exists (select 1 from public.game_ledger where game_id = p_game) then
    perform public.ensure_profile(p_owner);
    select available_cents into v_bal from public.wallets where owner_id = p_owner;
    return coalesce(v_bal, 0);
  end if;

  perform public.ensure_profile(p_owner);
  select available_cents into v_bal from public.wallets where owner_id = p_owner;
  v_bal := coalesce(v_bal, 0);

  if v_bal < p_stake_cents then
    raise exception 'insufficient balance for stake';
  end if;

  insert into public.wallets (owner_id, available_cents, escrow_cents)
  values (p_owner, v_bal - p_stake_cents, p_stake_cents)
  on conflict (owner_id) do update
    set available_cents = public.wallets.available_cents - p_stake_cents,
        escrow_cents    = public.wallets.escrow_cents + p_stake_cents,
        updated_at      = now();

  insert into public.game_ledger (game_id, owner_id, stake_cents) values (p_game, p_owner, p_stake_cents);
  insert into public.wallet_tx (owner_id, kind, cents, balance_after, note)
  values (p_owner, 'stake-in', -p_stake_cents, v_bal - p_stake_cents, 'stake ' || p_game);

  return v_bal - p_stake_cents;
end;
$$;

create or replace function public.settle_game(
  p_game text,
  p_result text,
  p_credit_cents bigint default 0
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ball bigint := 0;
  v_owner uuid;
  v_stake bigint;
  v_status text;
  v_credit bigint := 0;
begin
  if p_result not in ('win', 'loss', 'draw') then
    raise exception 'invalid result';
  end if;
  -- Idempotent: an already-settled game never credits twice; re-polls return
  -- the true balance (never 0 just because the game no longer needs settling).
  select owner_id, stake_cents, status
    into v_owner, v_stake, v_status
    from public.game_ledger
   where game_id = p_game;
  if v_owner is null then
    return null; -- unknown game
  end if;
  if v_status <> 'staked' then
    select available_cents into v_ball from public.wallets where owner_id = v_owner;
    return coalesce(v_ball, 0);
  end if;
  -- Serialize settles for the same game, then re-read status under the lock.
  perform 1 from public.game_ledger where game_id = p_game for update;
  select status into v_status from public.game_ledger where game_id = p_game;
  if v_status <> 'staked' then
    select available_cents into v_ball from public.wallets where owner_id = v_owner;
    return coalesce(v_ball, 0);
  end if;

  v_credit := case p_result
    when 'win'  then greatest(v_stake, p_credit_cents)
    when 'draw' then v_stake
    else 0
  end;

  if v_credit > 0 then
    update public.wallets
       set escrow_cents    = escrow_cents - v_stake,
           available_cents = available_cents + v_credit,
           updated_at      = now()
     where owner_id = v_owner;
    insert into public.wallet_tx (owner_id, kind, cents, balance_after, note)
    values (
      v_owner,
      case p_result when 'win' then 'payout'::public.tx_kind else 'refund'::public.tx_kind end,
      v_credit,
      (select available_cents from public.wallets where owner_id = v_owner),
      p_result || ' ' || p_game
    );
  else
    update public.wallets
       set escrow_cents = escrow_cents - v_stake,
           updated_at   = now()
     where owner_id = v_owner;
  end if;

  update public.game_ledger
     set status = (case p_result when 'win' then 'won' when 'draw' then 'drawn' else 'lost' end),
         prize_cents = v_credit,
         settled_at = now()
   where game_id = p_game;

  select available_cents into v_ball from public.wallets where owner_id = v_owner;
  return coalesce(v_ball, 0);
end;
$$;

grant execute on function public.open_game(text, uuid, bigint) to anon;
grant execute on function public.settle_game(text, text, bigint) to anon;