import { useState } from 'react';
import { Check, Crown, ShieldCheck, Sparkles, X } from 'lucide-react';

export function TermsGate({ onAccept }: { onAccept: () => void }) {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="fixed inset-0 z-[70] grid min-h-[100dvh] place-items-center overflow-y-auto bg-[#06110c]/95 p-4 backdrop-blur-2xl">
      <div className="relative w-full max-w-lg overflow-hidden rounded-[2rem] border border-[#d6a944]/35 bg-[linear-gradient(145deg,#18392e,#0d211a)] p-6 shadow-2xl shadow-black/50 sm:p-8">
        <div className="absolute -right-20 -top-20 h-52 w-52 rounded-full border border-[#d6a944]/20" />
        <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full border border-[#d6a944]/15" />
        <div className="relative">
          <div className="mb-7 flex items-center gap-3">
            <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#d6a944] text-[#10291e]"><Crown size={23} /></div>
            <div>
              <div className="font-display text-xl font-bold">Nairobi <span className="text-[#d6a944]">Checkers</span></div>
              <div className="font-mono-custom text-[9px] uppercase tracking-[.22em] text-[#8ca99a]">Free play lounge</div>
            </div>
          </div>
          <div className="mb-2 flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.22em] text-[#d6a944]"><Sparkles size={13} /> One-time setup</div>
          <h1 className="font-display text-3xl font-bold leading-tight text-[#f2e9d1]">Your board is ready.</h1>
          <p className="mt-3 text-sm leading-relaxed text-[#9bb1a2]">Start with free, no-account games against the computer or friends. Cash play stays separate and always asks for an account and a clear fee breakdown.</p>
          <div className="mt-6 space-y-3">
            <div className="flex gap-3 rounded-xl border border-[#3d6251] bg-[#10291f]/80 p-3 text-xs text-[#c7d5c8]"><ShieldCheck size={16} className="mt-0.5 shrink-0 text-[#69d898]" /><span>Mandatory captures, visible rules, and disclosed platform fees.</span></div>
            <div className="flex gap-3 rounded-xl border border-[#3d6251] bg-[#10291f]/80 p-3 text-xs text-[#c7d5c8]"><Crown size={16} className="mt-0.5 shrink-0 text-[#d6a944]" /><span>Free play does not require identity, payment details, or an account.</span></div>
          </div>
          <label className="mt-6 flex cursor-pointer items-start gap-3 rounded-xl border border-[#496b59] bg-[#0d231b] p-4 text-xs text-[#c8d5c9]">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#d6a944]" />
            <span>I agree to the <button type="button" className="font-bold text-[#e3c16a] underline underline-offset-2">terms of play</button>, fair-play rules, and the separation between free play and cash features.</span>
          </label>
          <button disabled={!accepted} onClick={onAccept} className="btn-primary mt-5 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-40"><Check size={17} /> Enter the lounge</button>
          <div className="mt-4 flex items-center justify-center gap-2 text-[10px] text-[#6f897c]"><X size={11} /> No account required for free play</div>
        </div>
      </div>
    </div>
  );
}