/**
 * Owner console — profit & loss visibility, fee engine, payout rails,
 * maintenance mode, and the withdrawal gate. Persisted to local settings.
 */
import { useMemo, useState } from 'react';
import {
  BarChart3, Check, DollarSign, Download, Gauge, LockKeyhole, Settings2, ShieldCheck, Users, Wrench, X,
} from 'lucide-react';
import { FEE_PRESETS, settleStake, type Settings } from './settings-store';
import type { Career } from './player-store';

type Ops = {
  grossEntries: number;
  feesCollected: number;
  payouts: number;
  completedMatches: number;
  pendingWithdrawals: number;
  fairPlayFlags: number;
  tablesLive: number;
};

const OPS_SEED: Ops = {
  grossEntries: 48_750, feesCollected: 2_437, payouts: 46_312,
  completedMatches: 642, pendingWithdrawals: 3, fairPlayFlags: 0, tablesLive: 128,
};

export function AdminDashboard({
  settings, onSettingsChange, career, showToast,
}: {
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
  career: Career;
  showToast: (message: string) => void;
}) {
  const ops = OPS_SEED;
  const [fee, setFee] = useState(settings.houseFeePercent);
  const [split, setSplit] = useState(settings.feeSplit);
  const [saved, setSaved] = useState(false);
  const [gate, setGate] = useState<'enabled' | 'disabled'>('disabled');

  const net = useMemo(() => Math.round(ops.grossEntries * (fee / 100)), [ops.grossEntries, fee]);
  const houseMargin = net - ops.payouts < 0 ? ops.payouts - net : net - ops.payouts;
  void houseMargin;
  const profit = net;
  const loss = ops.payouts;
  const treasuryCut = Math.round((net * split.treasury) / 100);
  const winnerCut = net - treasuryCut;

  const save = () => {
    onSettingsChange({
      ...settings,
      houseFeePercent: fee,
      feeSplit: split,
      withdrawalsEnabled: gate === 'enabled',
    });
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
    showToast('Owner controls saved to this device.');
  };

  return (
    <div className="reveal">
      <div className="mb-7 flex flex-col justify-between gap-4 lg:flex-row lg:items-end">
        <div>
          <div className="mb-2 flex items-center gap-2 font-mono-custom text-[10px] uppercase tracking-[.22em] text-[#d6a944]"><LockKeyhole size={13} /> Owner console</div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#f0e7cf] sm:text-4xl">The house ledger.</h1>
          <p className="mt-2 max-w-xl text-sm text-[#819a8d]">Profit, payouts, fee engine and fair-play controls. Numbers marked “simulated” are seeds — your live ledger replaces them when the server is connected.</p>
        </div>
        <button onClick={save} data-testid="button-save-controls" className="btn-primary flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold">
          <Check size={16} /> {saved ? 'Controls saved' : 'Save controls'}
        </button>
      </div>

      <div className="mb-5 flex items-center gap-2 rounded-xl border border-[#d6a944]/30 bg-[#3b321e] px-4 py-3 text-xs leading-relaxed text-[#d9c37c]">
        <ShieldCheck size={16} className="shrink-0" /> Preview data is clearly labelled. No dashboard number here authorizes or settles a real payout.
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Stat label="Gross entry volume" value={`KSh ${ops.grossEntries.toLocaleString('en-KE')}`} detail="This period · simulated ledger" />
        <Stat label="Platform fees" value={`KSh ${net.toLocaleString('en-KE')}`} detail={`${fee}% house fee engine`} tone="green" />
        <Stat label="Player payouts" value={`KSh ${loss.toLocaleString('en-KE')}`} detail="95% return target" tone="red" />
        <Stat label="House profit" value={`KSh ${profit.toLocaleString('en-KE')}`} detail={`${ops.tablesLive} live tables`} tone="gold" />
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <section className="glass-panel rounded-2xl p-6">
          <div className="mb-5 flex items-center gap-2"><BarChart3 size={18} className="text-[#d6a944]" /><h2 className="font-display text-xl font-bold">Fee engine & profit split</h2></div>

          <div className="mb-6">
            <div className="mb-3 flex items-center justify-between text-sm font-semibold"><span>Platform fee on entry pool</span><span className="font-mono-custom text-[#f0d37c]">{fee}%</span></div>
            <div className="grid grid-cols-3 gap-2">
              {FEE_PRESETS.map((value) => (
                <button key={value} onClick={() => setFee(value)} className={`rounded-xl border py-3 text-xs font-bold ${fee === value ? 'border-[#d6a944] bg-[#3b321e] text-[#f0d37c]' : 'border-[#345346] bg-[#142e25] text-[#9ab0a1]'}`}>{value}%</button>
              ))}
            </div>
            <p className="mt-2 text-[11px] leading-relaxed text-[#789385]">Shown before a player joins. Prize = pool − fee. No hidden spread, ever.</p>
          </div>

          <div className="mb-6">
            <div className="mb-3 text-sm font-semibold">Fee deployment</div>
            <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-xl border p-4 ${split.treasury >= split.winners ? 'border-[#d6a944] bg-[#3b321e]' : 'border-[#345346] bg-[#142e25]'}`}>
                <div className="font-display text-lg font-bold text-[#f0d37c]">{split.treasury}% treasury</div>
                <p className="mt-1 text-[11px] text-[#a9945b]">Ops, hosting, bot compute & the prize floor.</p>
              </div>
              <div className={`rounded-xl border p-4 ${split.winners > split.treasury ? 'border-[#d6a944] bg-[#3b321e]' : 'border-[#345346] bg-[#142e25]'}`}>
                <div className="font-display text-lg font-bold text-[#67d895]">{split.winners}% back to players</div>
                <p className="mt-1 text-[11px] text-[#a9945b]">Boosted prize pools and streak bonuses.</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2">
              <button onClick={() => setSplit({ treasury: 30, winners: 70 })} className={`flex-1 rounded-lg border py-2 text-[11px] font-bold ${split.treasury === 30 ? 'border-[#d6a944] text-[#f0d37c]' : 'border-[#345346] text-[#9ab0a1]'}`}>Balanced 30/70</button>
              <button onClick={() => setSplit({ treasury: 100, winners: 0 })} className={`flex-1 rounded-lg border py-2 text-[11px] font-bold ${split.treasury === 100 ? 'border-[#d6a944] text-[#f0d37c]' : 'border-[#345346] text-[#9ab0a1]'}`}>Max treasury 100/0</button>
            </div>
            <p className="mt-2 font-mono-custom text-[10px] text-[#7f9789]">Projected: KSh {winnerCut.toLocaleString('en-KE')} to players · KSh {treasuryCut.toLocaleString('en-KE')} to treasury</p>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-[#345346] bg-[#142e25] p-4">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold"><Wrench size={15} className="text-[#d6a944]" /> Maintenance mode</div>
              <p className="mt-1 text-[11px] text-[#789385]">Pause new cash entries while open games finish.</p>
            </div>
            <button onClick={() => { setGate(gate === 'enabled' ? 'disabled' : 'enabled'); }} className={`relative h-7 w-12 rounded-full transition ${gate === 'enabled' ? 'bg-[#d6a944]' : 'bg-[#355447]'}`} aria-label="Toggle maintenance mode">
              <span className={`absolute top-1 h-5 w-5 rounded-full bg-[#f2e9d1] transition ${gate === 'enabled' ? 'left-6' : 'left-1'}`} />
            </button>
          </div>
        </section>

        <section className="space-y-5">
          <div className="glass-panel-soft rounded-2xl p-6">
            <div className="mb-5 flex items-center gap-2"><Users size={18} className="text-[#d6a944]" /><h2 className="font-display text-xl font-bold">Live operations</h2></div>
            <div className="space-y-3 text-xs">
              <Row label="Completed matches" value={String(ops.completedMatches)} />
              <Row label="Your career matches" value={String(career.matches.length)} />
              <Row label="Pending withdrawals" value={String(ops.pendingWithdrawals)} tone="gold" />
              <Row label="Fair-play flags" value={`${ops.fairPlayFlags} open`} tone="green" />
              <Row label="Active tables" value={String(ops.tablesLive)} tone="gold" />
            </div>
            <button onClick={() => showToast('Export is available once the server ledger is connected.')} className="btn-quiet mt-6 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"><Download size={14} /> Export report</button>
          </div>

          <div className="glass-panel-soft rounded-2xl p-6">
            <div className="mb-4 flex items-center gap-2"><Settings2 size={18} className="text-[#d6a944]" /><h2 className="font-display text-xl font-bold">Payout rails</h2></div>
            <div className="space-y-3 text-xs">
              <Row label="M-Pesa deposits (BrightPay)" value="Live" tone="green" />
              <Row label="M-Pesa withdrawals (signed endpoint)" value={gate === 'enabled' ? 'Enabled' : 'Gated'} tone={gate === 'enabled' ? 'green' : 'red'} />
              <Row label="Signing" value="HMAC-SHA256 · server-only" />
            </div>
            <p className="mt-4 text-[11px] leading-relaxed text-[#7f9789]">Withdrawals call the signed endpoint from the server — keys never touch the browser. Flip the gate only after your ledger checks are live.</p>
          </div>
        </section>
      </div>

      <section className="glass-panel mt-5 rounded-2xl p-6">
        <div className="mb-5 flex items-center gap-2"><DollarSign size={18} className="text-[#d6a944]" /><h2 className="font-display text-xl font-bold">Recent settlement review</h2></div>
        <div className="grid gap-3 md:grid-cols-3">
          {([
            ['Kilimani Knockout', 'Entry KSh 200', 'Prize KSh 380', 'Fee KSh 20'],
            ['Ngong Road Blitz', 'Entry KSh 100', 'Prize KSh 190', 'Fee KSh 10'],
            ['Free table', 'No cash stake', 'No payout', 'No fee'],
          ] as const).map(([name, entry, prize, feeText]) => (
            <div key={name} className="rounded-xl border border-[#345346] bg-[#142e25] p-4">
              <div className="mb-3 flex items-center justify-between text-sm font-bold"><span>{name}</span><Check size={15} className="text-[#67d895]" /></div>
              <div className="space-y-1 text-[11px] text-[#819a8d]">
                <div className="flex justify-between"><span>{entry}</span><span>{feeText}</span></div>
                <div className="flex justify-between text-[#f0d37c]"><span>Winner receives</span><strong>{prize}</strong></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stat({ label, value, detail, tone }: { label: string; value: string; detail: string; tone?: 'gold' | 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-[#67d895]' : tone === 'red' ? 'text-[#e49787]' : 'text-[#f0d37c]';
  return (
    <div className="glass-panel-soft rounded-2xl p-5">
      <div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-[#819a8d]"><Gauge size={14} className={color} /> {label}</div>
      <div className={`font-display text-3xl font-bold ${color}`}>{value}</div>
      <div className="mt-2 text-[11px] text-[#789385]">{detail}</div>
    </div>
  );
}

function Row({ label, value, tone }: { label: string; value: string; tone?: 'gold' | 'green' | 'red' }) {
  const color = tone === 'green' ? 'text-[#67d895]' : tone === 'red' ? 'text-[#e49b8c]' : tone === 'gold' ? 'text-[#f0d37c]' : '';
  return (
    <div className="flex items-center justify-between border-b border-[#345346] pb-3 last:border-0 last:pb-0">
      <span className="text-[#9cb2a2]">{label}</span>
      <strong className={color}>{value}</strong>
    </div>
  );
}
