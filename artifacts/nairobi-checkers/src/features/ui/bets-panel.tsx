/**
 * esther · BETS PANEL — side wagers in the Duel Lab. Validation rides on the
 * pure `bets` module; settlement stays with the wallet seam (ledger = theirs).
 */
import { useState } from 'react';
import { Coins, Minus, Plus, Sparkles } from 'lucide-react';
import {
  BET_KINDS, maximumTarget, minimumTarget, oddsFor, placeBet, type BetKind, type SideBet,
} from '../bets';
import { fmtKsh } from '../../lib/money';

type Props = {
  bets: SideBet[];
  onAdd: (bet: SideBet) => void;
  onRemove: (id: string) => void;
};

export function BetsPanel({ bets, onAdd, onRemove }: Props) {
  const [kind, setKind] = useState<BetKind>('sweep');
  const [amount, setAmount] = useState('100');
  const [target, setTarget] = useState('8');
  const [error, setError] = useState('');

  const hasTarget = kind === 'exact-moves' || kind === 'big-chain';
  const targetNum = Number(target);
  const odds = oddsFor(kind, hasTarget && Number.isFinite(targetNum) ? targetNum : undefined);

  const add = () => {
    const res = placeBet({ kind, amount, target: hasTarget ? targetNum : undefined });
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setError('');
    onAdd(res.bet);
  };

  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <Coins size={17} className="text-[#d6a944]" />
        <h3 className="font-display font-bold">Side wagers</h3>
        <span className="ml-auto rounded-full bg-[#153429] px-2 py-0.5 text-[10px] text-[#62d694]">house-ledger</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {BET_KINDS.map((option) => (
          <button
            key={option.kind}
            data-testid={`esther-bet-${option.kind}`}
            onClick={() => setKind(option.kind)}
            className={`rounded-lg border px-3 py-2 text-left transition ${kind === option.kind ? 'border-[#d6a944] bg-[#d6a944]/15' : 'border-[#345346] bg-[#102821] opacity-80'}`}
          >
            <div className="text-xs font-bold">{option.label}</div>
            <div className="mt-0.5 text-[10px] leading-snug text-[#819a8d]">{option.hint}</div>
          </button>
        ))}
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <label className="block">
          <span className="mb-1 block text-[10px] uppercase tracking-[.16em] text-[#789385]">Amount (KSh)</span>
          <input
            data-testid="esther-input-bet-amount"
            value={amount}
            onChange={(event) => setAmount(event.target.value)}
            inputMode="numeric"
            className="w-full rounded-lg border border-[#456253] bg-[#0f2620] px-3 py-2 text-sm text-[#f0e2b8] focus:border-[#d6a944] focus:outline-none"
          />
        </label>
        {hasTarget && (
          <label className="block">
            <span className="mb-1 block text-[10px] uppercase tracking-[.16em] text-[#789385]">{kind === 'exact-moves' ? 'Move count' : 'Chain size'}</span>
            <input
              data-testid="esther-input-bet-target"
              value={target}
              onChange={(event) => setTarget(event.target.value.replace(/[^\d]/g, ''))}
              inputMode="numeric"
              min={minimumTarget(kind)}
              max={maximumTarget(kind)}
              className="w-full rounded-lg border border-[#456253] bg-[#0f2620] px-3 py-2 text-sm text-[#f0e2b8] focus:border-[#d6a944] focus:outline-none"
            />
          </label>
        )}
      </div>

      <div className="mt-3 flex items-center justify-between rounded-lg bg-[#15342a] px-3 py-2">
        <span className="text-[11px] text-[#819a8d]">Odds <span className="font-mono-custom text-[#e6c673]">{odds.toFixed(2)}×</span></span>
        {error ? <span className="text-[11px] text-[#c7aaa0]" role="alert">{error}</span> : <span className="text-[11px] text-[#62d694]">payout on win: {fmtKsh(Math.round((Number(amount) || 0) * 100 * odds))}</span>}
      </div>

      <button data-testid="esther-button-add-bet" onClick={add} className="btn-primary mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold">
        <Plus size={14} /> Lock the wager
      </button>

      {bets.length > 0 && (
        <ul className="mt-4 space-y-1.5">
          {bets.map((bet) => (
            <li key={bet.id} className="flex items-center gap-2 rounded-lg bg-[#102821] px-3 py-2 text-xs">
              <Sparkles size={13} className="text-[#d6a944]" />
              <span className="flex-1 font-semibold">{BET_KINDS.find((b) => b.kind === bet.kind)?.label ?? bet.kind}{bet.target ? ` · ${bet.target}` : ''}</span>
              <span className="font-mono-custom text-[#e6c673]">{fmtKsh(bet.amountCents)}</span>
              <button onClick={() => onRemove(bet.id)} aria-label={`Remove ${bet.kind}`} className="text-[#c7aaa0] hover:text-[#f0e2b8]">
                <Minus size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}