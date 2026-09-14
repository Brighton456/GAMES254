import { useState } from 'react';
import { Check, LockKeyhole, UserRound } from 'lucide-react';

export type PlayerAccount = { displayName: string; email: string; createdAt: string };

export function AccountGate({ onComplete, onClose }: { onComplete: (account: PlayerAccount) => void; onClose: () => void }) {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [accepted, setAccepted] = useState(false);
  const valid = displayName.trim().length >= 2 && /^\S+@\S+\.\S+$/.test(email.trim()) && accepted;

  return (
    <div className="fixed inset-0 z-[65] grid place-items-center bg-[#06110c]/85 p-4 backdrop-blur-xl">
      <div className="w-full max-w-md rounded-[1.7rem] border border-[#d6a944]/35 bg-[#102a20] p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div><div className="mb-2 flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.2em] text-[#d6a944]"><LockKeyhole size={13} /> Account required</div><h2 className="font-display text-2xl font-bold">Unlock cash tables.</h2><p className="mt-2 text-sm leading-relaxed text-[#91aa9b]">Your free games remain open. An account is only needed for cash play, deposits, withdrawals, and saved history.</p></div>
          <button onClick={onClose} aria-label="Close account setup" className="btn-quiet rounded-lg p-2 text-[#9bb1a2]">×</button>
        </div>
        <label className="mb-2 block text-xs font-semibold text-[#c7d5c8]" htmlFor="account-name">Player name</label>
        <div className="relative"><UserRound size={16} className="absolute left-4 top-3.5 text-[#789385]" /><input id="account-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="e.g. Amani Mwangi" className="w-full rounded-xl border border-[#3c5e4e] bg-[#0b2119] py-3 pl-11 pr-4 text-sm text-[#f0e7cf] placeholder:text-[#557164]" /></div>
        <label className="mb-2 mt-4 block text-xs font-semibold text-[#c7d5c8]" htmlFor="account-email">Email for account history</label>
        <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" className="w-full rounded-xl border border-[#3c5e4e] bg-[#0b2119] px-4 py-3 text-sm text-[#f0e7cf] placeholder:text-[#557164]" />
        <label className="mt-5 flex cursor-pointer items-start gap-3 text-xs leading-relaxed text-[#a7bbac]"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#d6a944]" />I accept the cash-play terms, transparent platform fee, and responsible play rules.</label>
        <button disabled={!valid} onClick={() => onComplete({ displayName: displayName.trim(), email: email.trim(), createdAt: new Date().toISOString() })} className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"><Check size={17} /> Create player account</button>
        <p className="mt-4 text-center text-[10px] leading-relaxed text-[#6f897c]">This local preview stores only the details above. Connect server authentication before enabling production cash balances.</p>
      </div>
    </div>
  );
}