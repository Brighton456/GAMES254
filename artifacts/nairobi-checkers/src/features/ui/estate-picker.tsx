/**
 * esther · ESTATE PICKER — pick your neighbourhood; it sets the venue, the
 * handshake, and the board tint for the session.
 */
import { MapPin } from 'lucide-react';
import { ESTATES, estateById, handshake, venueOfDay } from '../estates';

type Props = {
  estateId: string;
  onChange: (id: string) => void;
};

export function EstatePicker({ estateId, onChange }: Props) {
  const current = estateById(estateId);
  return (
    <div className="glass-panel rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2">
        <MapPin size={17} className="text-[#d6a944]" />
        <h3 className="font-display font-bold">Home turf</h3>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {ESTATES.map((estate) => (
          <button
            key={estate.id}
            data-testid={`esther-estate-${estate.id}`}
            onClick={() => onChange(estate.id)}
            title={estate.vibe}
            className={`rounded-full border px-3 py-1.5 text-[11px] font-semibold transition ${estate.id === estateId ? 'border-[#d6a944] bg-[#d6a944]/20 text-[#f0d37c]' : 'border-[#345346] text-[#96afa2] hover:border-[#5b7a69]'}`}
          >
            <span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ background: estate.tint.dark }} />
            {estate.name}
          </button>
        ))}
      </div>

      {current && (
        <div className="mt-4 rounded-xl border border-[#345346] bg-[#102821] px-4 py-3">
          <div className="text-xs font-bold text-[#f0e2b8]">{current.nickname}</div>
          <div className="mt-1 text-xs text-[#819a8d]">{current.vibe}</div>
          <div className="mt-2 flex items-center justify-between text-[11px]">
            <span className="text-[#789385]">Venue: <span className="font-mono-custom text-[#e6c673]">{venueOfDay(current.id) ?? current.venues[0]}</span></span>
            <span className="italic text-[#62d694]">"{handshake(current.id)}"</span>
          </div>
        </div>
      )}
    </div>
  );
}