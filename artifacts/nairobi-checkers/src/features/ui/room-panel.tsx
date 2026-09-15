/**
 * esther · ROOM PANEL — create / join / share a duel session.
 */
import { useState } from 'react';
import { Check, Copy, KeyRound, Link2, Plus, UserPlus } from 'lucide-react';
import type { DuelSession } from '../code';

type Props = {
  session: DuelSession | null;
  onCreate: () => void;
  onJoin: (code: string) => void;
  onCopy: (text: string, label: string) => void;
};

export function RoomPanel({ session, onCreate, onJoin, onCopy }: Props) {
  const [codeInput, setCodeInput] = useState('');
  const joinTried = codeInput.trim().length > 0;
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <KeyRound size={17} className="text-[#d6a944]" />
        <h3 className="font-display font-bold">The Table</h3>
        {session && (
          <span className="ml-auto rounded-full bg-[#d6a944]/20 px-2 py-0.5 font-mono-custom text-[10px] tracking-[.2em] text-[#e4c36e]">{session.code}</span>
        )}
      </div>

      {session ? (
        <div className="space-y-3">
          <p className="text-xs text-[#819a8d]">
            Table <span className="font-mono-custom text-[#e6c673]">{session.code}</span> is live
            {session.joined ? ' (you joined)' : ' (you host)'}. Pass the code — it is the handshake.
          </p>
          <button onClick={() => onCopy(session.code, 'Room code copied')} className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold">
            <Copy size={14} /> Copy code
          </button>
          <button onClick={onCreate} className="btn-quiet flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold">
            <Plus size={14} /> Fresh table
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <button onClick={onCreate} data-testid="esther-button-create-room" className="btn-primary flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-bold">
            <Plus size={14} /> Host a table
          </button>
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Link2 size={13} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#789385]" />
              <input
                data-testid="esther-input-room-code"
                value={codeInput}
                onChange={(event) => setCodeInput(event.target.value.toUpperCase())}
                placeholder="Abcd12"
                maxLength={6}
                aria-label="Room code"
                className="w-full rounded-lg border border-[#456253] bg-[#0f2620] px-9 py-2.5 font-mono-custom text-sm tracking-[.25em] text-[#f0e2b8] placeholder:text-[#5c7567] focus:border-[#d6a944] focus:outline-none"
              />
            </div>
            <button
              data-testid="esther-button-join-room"
              onClick={() => joinTried && onJoin(codeInput)}
              disabled={!joinTried}
              className="btn-quiet rounded-lg px-4 py-2.5 text-xs font-bold disabled:opacity-50"
            >
              <UserPlus size={15} className="inline mr-1" /> Join
            </button>
          </div>
          <p className="text-[10px] text-[#5c7567]">6 characters · no I, O, 0 or 1 · case-insensitive</p>
        </div>
      )}

      {session && (
        <button
          data-testid="esther-button-copy-code"
          onClick={() => onCopy(session.code, 'Room code copied')}
          className="btn-quiet mt-3 flex w-full items-center justify-center gap-2 rounded-lg py-2 text-[11px] font-bold text-[#b9c9bd]"
        >
          <Check size={13} className="text-[#62d694]" /> Share again
        </button>
      )}
    </div>
  );
}