/**
 * Wallet page — BrightPay M-Pesa deposit (STK push + status polling) and
 * server-signed withdrawals.
 *
 * DESIGN (freebuff, 2026-09-15):
 *  - Deposits POST /api/brightpay/pay then poll /api/brightpay/status every 3s
 *    (max 2 min). A `depositRef` is generated once per *intent* and reused
 *    across retries so a flaky retry can't double-fire an STK push; a
 *    `settledRef` guards against double-credit on a re-entered poll effect.
 *  - Withdrawals POST /api/brightpay/withdraw — the HMAC-signed SERVER proxy
 *    (opencode's route). The local balance is only touched via
 *    `onWithdrawConfirmed` after the server returns 200. Trust no local decrement.
 *    Same sticky-ref idempotency: retry of an identical intent reuses the ref;
 *    editing amount/phone mints a fresh one.
 */
import { useEffect, useRef, useState } from 'react';
import {
  ArrowDownLeft, ArrowUpRight, Check, History, Info, Landmark, ShieldCheck,
} from 'lucide-react';
import { PageTitle, money, secureInt, type Mode } from '@/components/shell';
import { normalizeKenyanPhone } from '@/components/game/mpesa-banner';
import { getPlayerId } from '@/lib/supabase';

type WalletPageProps = {
  mode: Mode;
  showToast: (message: string) => void;
  cashBalance: number;
  withdrawalsEnabled: boolean;
onDepositConfirmed: (amount: number, authoritativeKsh?: number) => void;
 onWithdrawConfirmed: (amount: number, phone: string, externalReference: string, authoritativeKsh?: number) => void;
};

export function WalletPage({
  showToast, cashBalance, withdrawalsEnabled, onDepositConfirmed, onWithdrawConfirmed,
}: WalletPageProps) {
  const [flow, setFlow] = useState<'deposit' | 'withdraw'>('deposit');
  const [phone, setPhone] = useState('');
  const [amount, setAmount] = useState('1000');
  const [status, setStatus] = useState<'idle' | 'initiating' | 'pending' | 'success' | 'failed' | 'error'>('idle');
  const [checkoutId, setCheckoutId] = useState('');
  const [transactionId, setTransactionId] = useState('');
  const [receipt, setReceipt] = useState('');
  const [pendingAmount, setPendingAmount] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [paymentError, setPaymentError] = useState('');
  const [withdrawMsg, setWithdrawMsg] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [depositRef, setDepositRef] = useState('');
  const [withdrawRef, setWithdrawRef] = useState('');
  const settledRef = useRef(false);

  // Mint fresh idempotency refs whenever the intent (phone/amount) changes.
  useEffect(() => {
    setDepositRef('');
    setWithdrawRef('');
  }, [amount, phone]);

  const pollStatus = async () => {
    const response = await fetch(`/api/brightpay/status?checkout_id=${encodeURIComponent(checkoutId)}`, {
      headers: { 'x-player-id': getPlayerId() },
    });
    const payload = await response.json().catch(() => ({})) as { status?: string; mpesa_receipt?: string; error?: string; message?: string; wallet?: { available_cents?: number } };
    return { response, payload };
  };

  useEffect(() => {
    if (status !== 'pending' || !checkoutId) return;
    let cancelled = false;
    let timer: number | undefined;
    let elapsedSeconds = 0;
    const poll = async () => {
      try {
        const { response, payload } = await pollStatus();
        if (cancelled) return;
        if (!response.ok) {
          setPaymentError(payload.error ?? payload.message ?? 'Unable to check BrightPay status.');
          setStatus('error');
          return;
        }
        const nextStatus = String(payload.status ?? '').toUpperCase();
        if (nextStatus === 'COMPLETED') {
          if (settledRef.current) return;
          settledRef.current = true;
          const authoritativeKsh =
            typeof payload.wallet?.available_cents === 'number'
              ? Math.round(payload.wallet.available_cents / 100)
              : undefined;
          setReceipt(payload.mpesa_receipt ?? '');
          setStatus('success');
          onDepositConfirmed(pendingAmount, authoritativeKsh);
          showToast(`Payment confirmed · ${money(pendingAmount)} added.`);
          return;
        }
        if (nextStatus === 'FAILED') {
          setPaymentError('BrightPay marked this payment as failed. No balance was added.');
          setStatus('failed');
          return;
        }
        if (elapsedSeconds >= 120) {
          setPaymentError('The payment timed out while waiting for confirmation.');
          setStatus('failed');
          return;
        }
        elapsedSeconds += 3;
        setElapsed(elapsedSeconds);
        timer = window.setTimeout(poll, 3000);
      } catch {
        if (!cancelled) {
          setPaymentError('Network error while checking payment status.');
          setStatus('error');
        }
      }
    };
    void poll();
    return () => {
      cancelled = true;
      if (timer) window.clearTimeout(timer);
    };
  }, [checkoutId, onDepositConfirmed, pendingAmount, showToast, status]);

  const reset = () => {
    setStatus('idle');
    setCheckoutId('');
    setTransactionId('');
    setReceipt('');
    setPaymentError('');
    setElapsed(0);
    setPhone('');
    setWithdrawMsg('');
    setWithdrawing(false);
    settledRef.current = false;
  };

  const submit = async () => {
    const parsed = Number(amount);
    const validPhone = normalizeKenyanPhone(phone) !== null;
    if (flow === 'withdraw') {
      if (!validPhone || !Number.isInteger(parsed) || parsed < 50 || parsed > cashBalance) {
        setWithdrawMsg('Enter a valid Kenyan number and an amount between KSh 50 and your balance.');
        return;
      }
      if (!withdrawalsEnabled) {
        setWithdrawMsg('Withdrawals are gated by the owner console for now. Your balance is safe.');
        return;
      }
      setWithdrawing(true);
      setWithdrawMsg('');
      const ref = withdrawRef || `NBO-WD${Date.now().toString(36).toUpperCase()}${String(secureInt(1_000_000)).padStart(6, '0')}`;
      setWithdrawRef(ref);
      try {
        const response = await fetch('/api/brightpay/withdraw', {
          method: 'POST',
          headers: { 'content-type': 'application/json', 'x-player-id': getPlayerId() },
          body: JSON.stringify({ amount: parsed, phone_number: phone, external_reference: ref }),
        });
        const payload = await response.json().catch(() => ({})) as { success?: boolean; error?: string; message?: string; wallet?: { owner_id?: string; available_cents?: number } };
        if (!response.ok || payload.success === false) {
          setWithdrawMsg(payload.error ?? payload.message ?? 'BrightPay could not start the withdrawal.');
          setStatus('error');
          return;
        }
        const withdrawAuthKsh =
          typeof payload.wallet?.available_cents === 'number'
            ? Math.round(payload.wallet.available_cents / 100)
            : undefined;
        onWithdrawConfirmed(parsed, phone, ref, withdrawAuthKsh);
        setWithdrawRef('');
        setWithdrawMsg('');
        showToast(`Withdrawal of ${money(parsed)} queued to ${phone}.`);
        reset();
      } catch {
        setWithdrawMsg('Could not reach the payment service. Check your connection and try again.');
        setStatus('error');
      } finally {
        setWithdrawing(false);
      }
      return;
    }
    if (!validPhone || !Number.isInteger(parsed) || parsed < 10 || parsed > 150000) {
      setPaymentError('Use a Kenyan number (07xx, 01xx, +254) and a whole KSh amount between 10 and 150,000.');
      setStatus('error');
      return;
    }
    setStatus('initiating');
    setPaymentError('');
    const ref = depositRef || `NBO${Date.now().toString(36).toUpperCase()}${String(secureInt(1_000_000)).padStart(6, '0')}`;
    setDepositRef(ref);
    try {
      const response = await fetch('/api/brightpay/pay', {
        method: 'POST',
        headers: { 'content-type': 'application/json', 'x-player-id': getPlayerId() },
        body: JSON.stringify({ amount: parsed, phone_number: phone, external_reference: ref }),
      });
      const payload = await response.json().catch(() => ({})) as { checkout_id?: string; transaction_id?: string; error?: string; message?: string };
      if (!response.ok || !payload.checkout_id) {
        setPaymentError(payload.error ?? payload.message ?? 'BrightPay could not start the payment.');
        setStatus('error');
        return;
      }
      setPendingAmount(parsed);
      setTransactionId(payload.transaction_id ?? '');
      setCheckoutId(payload.checkout_id);
      setElapsed(0);
      setStatus('pending');
      showToast('STK Push sent. Confirm it on your phone.');
    } catch {
      setPaymentError('Could not reach the payment service. Check your connection and try again.');
      setStatus('error');
    }
  };

  const active = status === 'initiating' || status === 'pending';

  return <div className="reveal"><PageTitle eyebrow="BrightPay M-Pesa" title="Top up your table." copy="Send a real STK Push to your Kenyan number, then we will verify the payment automatically. Withdrawals ride the signed server endpoint." action={<div className="flex items-center gap-2 rounded-full border border-[#27875b]/50 bg-[#153429] px-3 py-2 text-xs text-[#74dca0]"><ShieldCheck size={14} /> Secure payment proxy</div>} /><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><section className="space-y-4"><div className="glass-panel rounded-2xl p-6"><div className="mb-1 text-[10px] uppercase tracking-[.2em] text-[#819a8d]">Cash balance</div><div data-testid="text-wallet-balance" className="font-display text-4xl font-bold text-[#f0d37c]">{money(cashBalance)}</div><div className="mt-2 text-xs text-[#819a8d]">BrightPay confirmed deposits only</div><div className="mt-6 grid grid-cols-2 gap-2"><button onClick={() => { setFlow('deposit'); reset(); }} data-testid="button-wallet-deposit" className={`rounded-lg py-3 text-xs font-bold ${flow === 'deposit' ? 'bg-[#d6a944] text-[#173229]' : 'btn-quiet'}`}><ArrowDownLeft className="mr-1 inline" size={15} /> Deposit</button><button onClick={() => { setFlow('withdraw'); reset(); }} data-testid="button-wallet-withdraw" className={`rounded-lg py-3 text-xs font-bold ${flow === 'withdraw' ? 'bg-[#d6a944] text-[#173229]' : 'btn-quiet'}`}><ArrowUpRight className="mr-1 inline" size={15} /> Withdraw</button></div></div><div className="glass-panel-soft rounded-2xl p-5"><div className="mb-4 flex items-center gap-2 font-display font-bold"><History size={17} className="text-[#d6a944]" /> Recent wallet activity</div><WalletRow label="BrightPay deposit" date="Today · confirmed" amount="+ KSh 1,000" /><WalletRow label="Entry · Quick play" date="Yesterday · 22:10" amount="− KSh 100" /><WalletRow label="Prize · Kilimani" date="18 Jun · 20:31" amount="+ KSh 350" /></div></section><section className="glass-panel rounded-2xl p-6 sm:p-8"><div className="mb-7 flex items-start justify-between"><div><div className="mb-2 text-[10px] uppercase tracking-[.2em] text-[#d6a944]">{flow === 'deposit' ? 'Live payment' : 'Withdraw to M-Pesa'}</div><h2 className="font-display text-2xl font-bold">{flow === 'deposit' ? 'Pay with M-Pesa' : 'Cash out your winnings'}</h2><p className="mt-2 text-sm text-[#819a8d]">{flow === 'deposit' ? 'Works with 07xx, 01xx or +254 numbers.' : 'Signed HMAC-SHA256 request from our server to BrightPay. Keys never touch your browser. Minimum KSh 50.'}</p></div><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#1c5e42] font-display font-bold text-[#84dca5]">M</div></div>{flow === 'withdraw' ? <><div className="rounded-xl border border-[#d6a944]/30 bg-[#3b321e] p-4 text-xs leading-relaxed text-[#e5d5a3]"><div className="flex items-center gap-2 font-bold"><Landmark size={15} /> How it works</div><p className="mt-1.5">Requests hit our server, which signs the payload and forwards it to BrightPay. The owner console can gate withdrawals during maintenance.</p></div>{withdrawMsg && <div data-testid="status-wallet-withdraw-message" className="mt-4 rounded-lg border border-[#ad6155]/40 bg-[#4a2927] px-3 py-3 text-xs text-[#f0b1a5]">{withdrawMsg}</div>}<label className="mb-2 mt-4 block text-xs font-semibold text-[#c3d1c5]" htmlFor="withdraw-phone">M-Pesa number</label><input id="withdraw-phone" value={phone} onChange={(event) => { setPhone(event.target.value.replace(/[^\d+\s-]/g, '').slice(0, 15)); setWithdrawMsg(''); }} data-testid="input-withdraw-phone" placeholder="0712 345 678" className="w-full rounded-xl border border-[#3c5e4e] bg-[#0f281f] px-4 py-3 text-sm text-[#f0e7cf] placeholder:text-[#557164]" /><label className="mb-2 mt-4 block text-xs font-semibold text-[#c3d1c5]" htmlFor="withdraw-amount">Amount (KSh 50 – {Math.max(50, cashBalance).toLocaleString('en-KE')})</label><div className="relative"><span className="absolute left-4 top-3.5 font-mono-custom text-sm text-[#819a8d]">KSh</span><input id="withdraw-amount" value={amount} onChange={(event) => { setAmount(event.target.value.replace(/[^\d]/g, '')); setWithdrawMsg(''); }} data-testid="input-withdraw-amount" inputMode="numeric" className="w-full rounded-xl border border-[#3c5e4e] bg-[#0f281f] py-3 pl-14 pr-4 font-mono-custom text-sm text-[#f0e7cf]" /></div><button onClick={() => void submit()} disabled={withdrawing} data-testid="button-submit-withdraw" className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:opacity-60"><ArrowUpRight size={16} /> {withdrawing ? 'Submitting…' : 'Request withdrawal'}</button></> : status === 'success' ? <div data-testid="status-wallet-success" className="rounded-xl border border-[#4bbf7c]/40 bg-[#1a4a35] p-5"><div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#56c886] text-[#10291e]"><Check size={20} /></div><div><div className="font-bold">Payment confirmed</div><div className="text-xs text-[#9cd6ae]">Your cash balance has been updated.</div></div></div><div className="space-y-2 border-t border-[#4bbf7c]/25 pt-4 text-xs"><div className="flex justify-between"><span className="text-[#92bca0]">Amount</span><strong>{money(pendingAmount)}</strong></div><div className="flex justify-between"><span className="text-[#92bca0]">M-Pesa receipt</span><strong data-testid="text-transaction-code" className="font-mono-custom text-[#f0d37c]">{receipt || transactionId || 'Confirmed'}</strong></div></div><button onClick={reset} data-testid="button-new-wallet-transaction" className="btn-quiet mt-5 w-full rounded-lg py-2.5 text-xs font-bold">Start another deposit</button></div> : <>{active && <div data-testid="status-stk-countdown" className="mb-5 rounded-xl border border-[#d6a944]/40 bg-[#3b321e] p-4 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border-2 border-[#d6a944] font-display text-lg text-[#f0d37c]">{status === 'initiating' ? '…' : `${Math.max(0, 120 - elapsed)}s`}</div><div className="text-sm font-bold text-[#f0dfad]">{status === 'initiating' ? 'Sending STK Push…' : 'Confirm the STK Push on your phone'}</div><div className="mt-1 text-xs text-[#a9945b]">{status === 'initiating' ? 'Connecting to BrightPay securely.' : 'We check BrightPay every 3 seconds for up to 2 minutes.'}</div></div>}{(status === 'error' || status === 'failed') && <div data-testid="status-wallet-error" className="mb-4 rounded-lg border border-[#ad6155]/40 bg-[#4a2927] px-3 py-3 text-xs text-[#f0b1a5]"><div className="flex items-center gap-2 font-semibold"><Info size={14} /> {paymentError}</div><button onClick={() => setStatus('idle')} className="mt-3 font-bold text-[#f0d0c8] underline">Try again</button></div>}<label className="mb-2 block text-xs font-semibold text-[#c3d1c5]" htmlFor="wallet-phone">M-Pesa number</label><input id="wallet-phone" value={phone} disabled={active} onChange={(event) => { setPhone(event.target.value.replace(/[^\d+\s-]/g, '').slice(0, 15)); setStatus('idle'); }} data-testid="input-wallet-phone" placeholder="0712 345 678" className="mb-4 w-full rounded-xl border border-[#3c5e4e] bg-[#0f281f] px-4 py-3 text-sm text-[#f0e7cf] placeholder:text-[#557164] disabled:opacity-60" /><label className="mb-2 block text-xs font-semibold text-[#c3d1c5]" htmlFor="wallet-amount">Amount (KSh 10 – 150,000)</label><div className="relative"><span className="absolute left-4 top-3.5 font-mono-custom text-sm text-[#819a8d]">KSh</span><input id="wallet-amount" value={amount} disabled={active} onChange={(event) => { setAmount(event.target.value.replace(/[^\d]/g, '')); setStatus('idle'); }} data-testid="input-wallet-amount" inputMode="numeric" className="w-full rounded-xl border border-[#3c5e4e] bg-[#0f281f] py-3 pl-14 pr-4 font-mono-custom text-sm text-[#f0e7cf] disabled:opacity-60" /></div><button onClick={() => void submit()} data-testid="button-submit-wallet" className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:opacity-60" disabled={active}><ArrowDownLeft size={16} /> {status === 'initiating' ? 'Connecting to BrightPay…' : status === 'pending' ? 'Waiting for confirmation…' : 'Send STK Push'}</button><p className="mt-4 text-center text-[10px] leading-relaxed text-[#6f897c]">BrightPay handles the secure prompt. Never share your M-Pesa PIN with this app.</p></>}</section></div></div>;
}

function WalletRow({ label, date, amount }: { label: string; date: string; amount: string }) { return <div className="flex items-center gap-3 border-t border-[#345346] py-3 first:border-0"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#23483a] text-[#d6a944]"><Landmark size={14} /></div><div className="flex-1"><div className="text-xs font-semibold">{label}</div><div className="text-[10px] text-[#789385]">{date}</div></div><span className={`font-mono-custom text-xs ${amount.startsWith('+') ? 'text-[#62d694]' : 'text-[#c7aaa0]'}`}>{amount}</span></div>; }