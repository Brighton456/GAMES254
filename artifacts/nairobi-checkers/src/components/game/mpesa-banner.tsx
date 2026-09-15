/**
 * Simulated Safaricom M-Pesa SMS transaction alerts + phone sanitation.
 * The banner mimics a real Android heads-up notification.
 */
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';

export type MpesaAlert = {
  code: string; // e.g. QHA719XJ4K
  amount: number;
  direction: 'in' | 'out';
  counterparty: string;
  newBalance: number;
  at: number;
};

export function makeMpesaCode(): string {
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const digit = () => String(Math.floor(Math.random() * 10));
  const letter = () => letters[Math.floor(Math.random() * letters.length)];
  return `${letter()}${letter()}${letter()}${digit()}${letter()}${digit()}${letter()}${digit()}${letter()}${digit()}`;
}

export function formatPhone(value: string): string {
  const digits = value.replace(/[^\d+]/g, '');
  const compact = digits.replace(/^\+/, '');
  if (/^254[17]\d{8}$/.test(compact)) return `+254 ${compact.slice(3, 6)} ${compact.slice(6, 9)} ${compact.slice(9)}`;
  if (/^0[17]\d{8}$/.test(compact)) return `${compact.slice(0, 4)} ${compact.slice(4, 7)} ${compact.slice(7)}`;
  return value;
}

/** Accepts 07xx, 01xx, +2547/1xxx, 2547/1xxx and returns 2547XXXXXXXX or null. */
export function normalizeKenyanPhone(value: string): string | null {
  const compact = value.replace(/[\s-]/g, '');
  if (/^07\d{8}$/.test(compact) || /^01\d{8}$/.test(compact)) return `254${compact.slice(1)}`;
  if (/^\+254[17]\d{8}$/.test(compact)) return compact.slice(1);
  if (/^254[17]\d{8}$/.test(compact)) return compact;
  return null;
}

export function MpesaSmsBanner({ alert, onDismiss }: { alert: MpesaAlert; onDismiss: () => void }) {
  const [leaving, setLeaving] = useState(false);
  useEffect(() => {
    const hide = window.setTimeout(() => setLeaving(true), 7400);
    const gone = window.setTimeout(onDismiss, 7800);
    return () => { window.clearTimeout(hide); window.clearTimeout(gone); };
  }, [onDismiss]);

  const amount = `${alert.direction === 'in' ? '' : '-'}KSh ${alert.amount.toLocaleString('en-KE')}.00`;
  const verb = alert.direction === 'in' ? 'received' : 'sent to';
  const target = alert.direction === 'in' ? `from ${alert.counterparty}` : alert.counterparty;

  return (
    <div
      role="alert"
      className={`fixed left-1/2 top-3 z-[90] w-[min(94vw,400px)] -translate-x-1/2 transition-all duration-500 ${leaving ? '-translate-y-6 opacity-0' : 'translate-y-0 opacity-100'}`}
    >
      <div className="overflow-hidden rounded-2xl border border-[#3a3f3a] bg-[#1c1c1e]/97 shadow-[0_18px_50px_rgba(0,0,0,.55)] backdrop-blur-xl">
        <div className="flex items-center gap-2 bg-[#000000]/55 px-4 pb-1.5 pt-2 text-[10px] font-semibold text-[#9a9a9e]">
          <span className="inline-block h-2 w-2 rounded-full bg-[#4fd28a]" />
          M-Pesa
          <span className="ml-auto font-mono-custom">{new Date(alert.at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}</span>
          <button onClick={() => { setLeaving(true); window.setTimeout(onDismiss, 320); }} aria-label="Dismiss alert" className="rounded p-0.5 text-[#9a9a9e] hover:text-white"><X size={11} /></button>
        </div>
        <div className="flex gap-3 px-4 pb-4 pt-2">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[#3ddc84] font-black text-[#0b2b18]">M</div>
          <div className="min-w-0 text-[12.5px] leading-snug text-[#e8e8ea]">
            <p className="font-semibold text-[#d1d1d6]">MPESA</p>
            <p className="mt-0.5">
              {alert.code} Confirmed. KSh {alert.amount.toLocaleString('en-KE')}.00 {verb} <span className="font-semibold">{target}</span> on{' '}
              {new Date(alert.at).toLocaleDateString('en-KE', { day: '2-digit', month: '2-digit', year: 'numeric' })} at{' '}
              {new Date(alert.at).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}.
            </p>
            <p className="mt-1 text-[#c7c7cc]">
              New M-PESA balance is <span className="font-semibold">KSh {alert.newBalance.toLocaleString('en-KE')}.00</span>.
            </p>
            <p className="mt-1 text-[10.5px] text-[#8e8e93]">To reverse, dial *334# · Games254 simulation</p>
          </div>
        </div>
      </div>
      <span className="sr-only">{amount}</span>
    </div>
  );
}
