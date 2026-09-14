import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Link, Route, Switch, useLocation, Router as WouterRouter } from 'wouter';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowDownLeft, ArrowRight, ArrowUpRight, Award, Bell, Check, ChevronRight, CircleHelp,
  Coins, Copy, Crown, Dices, DoorOpen, Download, Flag, Gamepad2, Headphones,
  History, Home as HomeIcon, Info, Landmark, LockKeyhole, Menu, MoreHorizontal, Play, Plus, RefreshCw, ShieldCheck, Sparkles, Swords, Target,
  Trophy, UserRound, Users, WalletCards, X, Zap,
} from 'lucide-react';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();
type Mode = 'demo' | 'cash';
type PieceColor = 'gold' | 'forest';
type Piece = { color: PieceColor; king?: boolean };
type Move = { from: [number, number]; to: [number, number]; capture?: [number, number] };

const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/play', label: 'Play', icon: Swords },
  { href: '/tournament', label: 'Tournaments', icon: Trophy },
  { href: '/wallet', label: 'Wallet', icon: WalletCards },
  { href: '/profile', label: 'Profile', icon: UserRound },
];

function secureInt(max: number) {
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint32Array(1);
    globalThis.crypto.getRandomValues(bytes);
    return bytes[0] % max;
  }
  return Math.floor(Math.random() * max);
}

function money(value: number) {
  return `KSh ${value.toLocaleString('en-KE')}`;
}

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

function InstallAppButton() {
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);
  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
  }, []);
  if (!installPrompt) return null;
  return <button aria-label="Install Nairobi Checkers" onClick={async () => { await installPrompt.prompt(); setInstallPrompt(null); }} className="btn-quiet rounded-full p-2"><Download size={16} /></button>;
}

function useToastMessage() {
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3300);
    return () => window.clearTimeout(timer);
  }, [toast]);
  return { toast, showToast: setToast };
}

function Toast({ message }: { message: string }) {
  if (!message) return null;
  return <div data-testid="status-toast" className="fixed bottom-20 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl border border-[#d6a944]/40 bg-[#18372f] px-4 py-3 text-sm text-[#f1e7cb] shadow-2xl md:bottom-6">
    <Check size={16} className="text-gold" /> {message}
  </div>;
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (next: Mode) => void }) {
  return <div className="flex items-center gap-2 rounded-full border border-[#456253] bg-[#102821] p-1" data-testid="control-mode-switch">
    <button data-testid="button-mode-demo" onClick={() => onChange('demo')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] transition ${mode === 'demo' ? 'bg-[#d6a944] text-[#132a22]' : 'text-[#8fa99b]'}`}>Demo Play</button>
    <button data-testid="button-mode-cash" onClick={() => onChange('cash')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] transition ${mode === 'cash' ? 'bg-[#1f8d5b] text-[#e4f3e5]' : 'text-[#8fa99b]'}`}>Real Cash</button>
  </div>;
}

function Shell({ children, mode, onModeChange }: { children: ReactNode; mode: Mode; onModeChange: (next: Mode) => void }) {
  const [location] = useLocation();
  const [modeAlert, setModeAlert] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const changeMode = (next: Mode) => {
    onModeChange(next);
    setModeAlert(true);
    window.setTimeout(() => setModeAlert(false), 3600);
  };
  return <div className="app-shell app-noise min-h-[100dvh]">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-[#273f35] bg-[#0c211b]/95 px-4 py-6 md:flex">
      <Link href="/" data-testid="link-brand" className="mb-10 flex items-center gap-3 px-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6a944] text-[#123027]"><Crown size={21} /></div>
        <div><div className="font-display text-lg font-bold tracking-tight">Nairobi</div><div className="font-mono-custom text-[9px] uppercase tracking-[.24em] text-[#d6a944]">Checkers</div></div>
      </Link>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#607d6e]">Playground</div>
      <nav className="space-y-1">
        {navItems.map((item) => { const Icon = item.icon; const active = item.href === location; return <Link href={item.href} data-testid={`link-nav-${item.label.toLowerCase()}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-[#d6a944] text-[#132a22]' : 'text-[#96afa2] hover:bg-[#16352b] hover:text-[#f0e7cf]'}`} key={item.href}><Icon size={18} /><span>{item.label}</span>{item.label === 'Tournaments' && <span className="ml-auto rounded-full bg-[#d6a944]/20 px-1.5 py-0.5 text-[9px] text-[#e4c36e]">LIVE</span>}</Link>; })}
      </nav>
      <div className="mt-auto space-y-3">
        <div className="rounded-2xl border border-[#345246] bg-[#122d24] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#c9d8cd]"><ShieldCheck size={15} className="text-[#d6a944]" /> Safe play</div>
          <p className="text-[11px] leading-relaxed text-[#769084]">Cash mode is a simulated experience. No real money moves here.</p>
        </div>
        <div className="flex items-center gap-3 border-t border-[#294237] pt-4"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#d6a944] font-display font-bold text-[#153028]">AM</div><div className="min-w-0"><p className="truncate text-sm font-bold">Amani Mwangi</p><p className="text-[10px] text-[#769084]">Night Owl · 1,284 XP</p></div><MoreHorizontal size={17} className="ml-auto text-[#789385]" /></div>
      </div>
    </aside>
    <header className="sticky top-0 z-20 border-b border-[#273f35] bg-[#0c211b]/90 px-4 py-3 backdrop-blur-xl md:ml-[236px] md:px-8">
      <div className="mx-auto flex max-w-[1340px] items-center justify-between gap-3">
        <div className="flex items-center gap-3 md:hidden"><button aria-label="Open navigation" data-testid="button-open-menu" onClick={() => setMobileMenu(true)} className="btn-quiet rounded-lg p-2"><Menu size={18} /></button><Link href="/" data-testid="link-mobile-brand" className="font-display font-bold">Nairobi <span className="text-gold">Checkers</span></Link></div>
        <div className="hidden text-sm text-[#789385] md:block">{location === '/' ? 'Good evening, Amani' : navItems.find((item) => item.href === location)?.label ?? 'Game room'}</div>
         <div className="ml-auto flex items-center gap-2"><div className="hidden items-center gap-1.5 rounded-full bg-[#17352b] px-3 py-2 text-[11px] text-[#b9c9bd] sm:flex"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#4fd28a]" /> Lounge is humming</div><ModeSwitch mode={mode} onChange={changeMode} /><InstallAppButton /><button aria-label="Notifications" data-testid="button-notifications" onClick={() => window.alert('No new alerts. You are all caught up.')} className="btn-quiet rounded-full p-2"><Bell size={16} /></button></div>
      </div>
    </header>
    {mobileMenu && <div className="fixed inset-0 z-50 bg-[#07150f]/80 md:hidden" onClick={() => setMobileMenu(false)}><div className="h-full w-[280px] border-r border-[#315043] bg-[#0d241d] p-5" onClick={(event) => event.stopPropagation()}><div className="mb-8 flex items-center justify-between"><span className="font-display font-bold">Menu</span><button data-testid="button-close-menu" onClick={() => setMobileMenu(false)} className="btn-quiet rounded-lg p-2"><X size={16} /></button></div><nav className="space-y-2">{navItems.map((item) => { const Icon = item.icon; return <Link onClick={() => setMobileMenu(false)} href={item.href} data-testid={`link-mobile-${item.label.toLowerCase()}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#c4d1c6] hover:bg-[#17382c]" key={item.href}><Icon size={18} /> {item.label}</Link>; })}</nav></div></div>}
    {modeAlert && <div role="alert" data-testid="alert-mode-change" className="fixed left-1/2 top-[72px] z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#d6a944]/50 bg-[#18382e] px-4 py-2.5 text-xs font-semibold text-[#f4e6bd] shadow-2xl"><Info size={15} className="text-gold" /> {mode === 'cash' ? 'Real Cash mode selected · simulated only' : 'Demo Play mode selected · no stakes'}</div>}
    <main className="pb-24 md:ml-[236px] md:pb-8"><div className="mx-auto max-w-[1340px] px-4 py-6 md:px-8 md:py-8">{children}</div></main>
    <nav className="fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#294237] bg-[#0d241d]/95 px-2 py-2 backdrop-blur-xl md:hidden">{navItems.slice(0, 5).map((item) => { const Icon = item.icon; const active = item.href === location; return <Link href={item.href} data-testid={`link-bottom-${item.label.toLowerCase()}`} className={`flex flex-1 flex-col items-center gap-1 py-1 text-[9px] font-bold uppercase tracking-wider ${active ? 'text-[#d6a944]' : 'text-[#718c7e]'}`} key={item.href}><Icon size={18} />{item.label}</Link>; })}</nav>
  </div>;
}

function PageTitle({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 font-mono-custom text-[10px] font-medium uppercase tracking-[.22em] text-[#d6a944]">{eyebrow}</div><h1 className="font-display text-3xl font-bold tracking-tight text-[#f0e7cf] sm:text-4xl">{title}</h1>{copy && <p className="mt-2 max-w-xl text-sm text-[#819a8d]">{copy}</p>}</div>{action}</div>;
}

function WalletChip({ mode, cashBalance = 2450 }: { mode: Mode; cashBalance?: number }) {
  return <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-semibold ${mode === 'cash' ? 'border-[#27875b]/50 bg-[#1c5f43]/20 text-[#62d694]' : 'border-[#d6a944]/40 bg-[#8a6b25]/15 text-[#e6c673]'}`}><Coins size={14} /> {mode === 'cash' ? 'Cash wallet' : 'Demo wallet'} <span className="font-mono-custom">{mode === 'cash' ? money(cashBalance) : 'KSh 8,750'}</span></div>;
}

function Home({ mode, showToast, cashBalance }: { mode: Mode; showToast: (message: string) => void; cashBalance: number }) {
  const [spinning, setSpinning] = useState(false);
  const [fortune, setFortune] = useState('Spin for tonight’s signal');
  const outcomes = ['+120 XP', 'KSh 45 bonus', '2× entry shield', 'Good omen'];
  const spin = () => { if (spinning) return; setSpinning(true); setFortune('Reading the room…'); window.setTimeout(() => { setFortune(outcomes[secureInt(outcomes.length)]); setSpinning(false); showToast('Fortune locked in for tonight.'); }, 1800); };
  return <div className="reveal">
     <div className="mb-7 flex flex-col justify-between gap-5 lg:flex-row lg:items-end"><div><div className="mb-3 flex items-center gap-2 text-[10px] font-bold uppercase tracking-[.22em] text-[#d6a944]"><span className="h-1.5 w-1.5 rounded-full bg-[#4fd28a]" /> Thursday · 21:48 EAT</div><h1 className="font-display text-4xl font-bold leading-[.98] tracking-tight text-[#f2e9d1] sm:text-6xl">The board is<br /><span className="text-[#d6a944]">calling.</span></h1><p className="mt-4 max-w-md text-sm leading-relaxed text-[#829a8d]">Sharp moves, warm stakes. Your table is open in the Nairobi night.</p></div><div className="flex items-center gap-3"><WalletChip mode={mode} cashBalance={cashBalance} /><Link href="/play" data-testid="link-quick-play" className="btn-primary flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-bold"><Play size={16} fill="currentColor" /> Find a game</Link></div></div>
    <div className="grid gap-4 lg:grid-cols-[1.45fr_.8fr_.8fr]">
      <section className="panel relative min-h-[260px] overflow-hidden rounded-2xl p-6 sm:p-8"><div className="absolute -right-16 -top-20 h-64 w-64 rounded-full border border-[#d6a944]/15" /><div className="absolute -right-3 top-4 h-48 w-48 rounded-full border border-[#d6a944]/10" /><div className="relative z-10 flex h-full flex-col justify-between"><div><div className="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-[.22em] text-[#809a8c]"><Zap size={14} className="text-[#d6a944]" /> Match highlight</div><h2 className="max-w-sm font-display text-2xl font-bold leading-tight">Your last table was<br /><span className="text-[#e0b957]">one capture away.</span></h2><p className="mt-3 max-w-xs text-xs leading-relaxed text-[#809a8c]">Milly K. is back in the lounge. Settle the rematch?</p></div><Link href="/game" data-testid="link-rematch" className="mt-8 flex w-fit items-center gap-2 text-sm font-bold text-[#d6a944]">Rematch Milly <ArrowRight size={16} /></Link></div><div className="absolute bottom-7 right-8 hidden h-24 w-24 rotate-12 sm:block"><div className="grid h-full grid-cols-4 overflow-hidden rounded-lg border-2 border-[#d6a944]/40 bg-[#76522e] shadow-xl">{Array.from({ length: 16 }).map((_, index) => <div key={index} className={index % 2 === Math.floor(index / 4) % 2 ? 'bg-[#d6a944]/25' : 'bg-[#3b2921]/80'} />)}</div></div></section>
      <section className="panel rounded-2xl p-5"><div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.2em] text-[#829a8d]">Daily fortune</div><h2 className="mt-2 font-display text-xl font-bold">Tonight’s signal</h2></div><Sparkles size={17} className="text-[#d6a944]" /></div><div className={`mx-auto my-5 grid h-28 w-28 place-items-center rounded-full border-4 border-[#d6a944]/50 bg-[conic-gradient(#d6a944_0_20%,#254c3d_20%_40%,#d6a944_40%_60%,#254c3d_60%_80%,#d6a944_80%)] p-3 ${spinning ? 'wheel-spin' : ''}`}><div className="grid h-full w-full place-items-center rounded-full bg-[#18372e] text-center"><Dices size={19} className="text-[#d6a944]" /><span className="font-mono-custom text-[9px] text-[#cad8ca]">NBO / 24</span></div></div><p className="min-h-5 text-center text-xs text-[#d6a944]" data-testid="text-fortune-result">{fortune}</p><button onClick={spin} disabled={spinning} data-testid="button-spin-fortune" className="btn-quiet mt-4 w-full rounded-lg py-2.5 text-xs font-bold disabled:opacity-60">{spinning ? 'Spinning…' : 'Spin the wheel'}</button></section>
      <section className="panel rounded-2xl p-5"><div className="flex items-start justify-between"><div><div className="text-[10px] uppercase tracking-[.2em] text-[#829a8d]">Your run</div><h2 className="mt-2 font-display text-xl font-bold">Night Owl</h2></div><div className="grid h-9 w-9 place-items-center rounded-full bg-[#d6a944] font-display text-sm font-bold text-[#163229]">AM</div></div><div className="mt-6 flex items-end justify-between"><div><div className="font-display text-3xl font-bold">1,284</div><div className="text-[11px] text-[#829a8d]">XP to next title</div></div><div className="text-right"><div className="text-xl font-bold text-[#60d692]">68%</div><div className="text-[11px] text-[#829a8d]">win rate</div></div></div><div className="mt-4 h-1.5 overflow-hidden rounded-full bg-[#244438]"><div className="h-full w-[68%] rounded-full bg-[#d6a944]" /></div><Link href="/profile" data-testid="link-view-profile" className="mt-5 flex items-center justify-between text-xs font-bold text-[#d6a944]">View career <ChevronRight size={15} /></Link></section>
    </div>
    <div className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_.85fr]"><section><div className="mb-3 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Jump back in</h2><Link href="/play" data-testid="link-see-all-games" className="text-xs font-bold text-[#d6a944]">See all <ArrowRight className="ml-1 inline" size={13} /></Link></div><div className="space-y-2"><ActivityRow title="Rematch · Milly K." sub="Yesterday · 21:14" result="+ KSh 150" icon={<Swords size={16} />} positive /><ActivityRow title="Kilimani Knockout" sub="Tue · Round 2" result="Top 8 finish" icon={<Trophy size={16} />} /><ActivityRow title="Deposit simulation" sub="Mon · M-Pesa" result="+ KSh 1,000" icon={<ArrowDownLeft size={16} />} positive /></div></section><section className="panel-soft rounded-2xl p-5"><div className="mb-4 flex items-center gap-2"><Target size={17} className="text-[#d6a944]" /><h2 className="font-display text-lg font-bold">Tonight’s missions</h2></div><Mission title="Win with a king" progress="1 / 2" done={false} /><Mission title="Play a cash-mode game" progress="Complete" done /><Mission title="Make a capture chain" progress="0 / 1" done={false} /></section></div>
  </div>;
}

function ActivityRow({ title, sub, result, icon, positive }: { title: string; sub: string; result: string; icon: ReactNode; positive?: boolean }) {
  return <div className="panel-soft flex items-center gap-3 rounded-xl px-4 py-3"><div className="grid h-9 w-9 place-items-center rounded-lg bg-[#23483a] text-[#d6a944]">{icon}</div><div className="min-w-0 flex-1"><div className="truncate text-sm font-semibold">{title}</div><div className="text-[11px] text-[#789385]">{sub}</div></div><div className={`font-mono-custom text-xs ${positive ? 'text-[#63d492]' : 'text-[#b8c5b9]'}`}>{result}</div><ChevronRight size={15} className="text-[#607d6e]" /></div>;
}
function Mission({ title, progress, done }: { title: string; progress: string; done: boolean }) {
  return <div className="flex items-center gap-3 border-t border-[#345346] py-3 first:border-0 first:pt-0"><div className={`grid h-6 w-6 place-items-center rounded-full border ${done ? 'border-[#54c987] bg-[#23583f] text-[#69db9a]' : 'border-[#567568] text-transparent'}`}><Check size={13} /></div><div className="flex-1 text-xs font-semibold">{title}</div><span className={`font-mono-custom text-[10px] ${done ? 'text-[#69db9a]' : 'text-[#819a8d]'}`}>{progress}</span></div>;
}

function PlayPage({ mode, showToast, cashBalance }: { mode: Mode; showToast: (message: string) => void; cashBalance: number }) {
  const [tab, setTab] = useState<'quick' | 'rooms' | 'tournament'>('quick');
  const [difficulty, setDifficulty] = useState('Medium');
  const [roomCode, setRoomCode] = useState('');
  const [roomCreated, setRoomCreated] = useState('');
  const createRoom = () => { const code = Array.from({ length: 6 }, () => 'ABCDEFGHJKLMNPQRSTUVWXYZ'[secureInt(24)]).join(''); setRoomCreated(code); showToast(`Room ${code} is ready to share.`); };
  const joinRoom = () => roomCode.trim().length === 6 ? showToast(`Joined room ${roomCode.toUpperCase()}. Waiting on the table.`) : showToast('Enter the 6-character room code first.');
  return <div className="reveal"><PageTitle eyebrow="The playground" title="Choose your table." copy="Every mode is built for a clean match, whether you are learning the angles or chasing a payout." action={<WalletChip mode={mode} cashBalance={cashBalance} />} /><div className="mb-6 flex gap-1 overflow-x-auto rounded-xl border border-[#29483a] bg-[#102a21] p-1 mobile-scroll"><button data-testid="tab-quick-play" onClick={() => setTab('quick')} className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-bold ${tab === 'quick' ? 'bg-[#d6a944] text-[#173229]' : 'text-[#91aa9c]'}`}>Quick play</button><button data-testid="tab-private-rooms" onClick={() => setTab('rooms')} className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-bold ${tab === 'rooms' ? 'bg-[#d6a944] text-[#173229]' : 'text-[#91aa9c]'}`}>Private room</button><button data-testid="tab-tournaments" onClick={() => setTab('tournament')} className={`whitespace-nowrap rounded-lg px-4 py-2.5 text-xs font-bold ${tab === 'tournament' ? 'bg-[#d6a944] text-[#173229]' : 'text-[#91aa9c]'}`}>Async tournament</button></div>
    {tab === 'quick' && <div className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]"><section className="panel rounded-2xl p-6 sm:p-8"><div className="mb-7 flex items-start justify-between"><div><div className="mb-2 text-[10px] uppercase tracking-[.22em] text-[#829a8d]">Solo table</div><h2 className="font-display text-2xl font-bold">Play the house.</h2><p className="mt-2 max-w-sm text-sm text-[#819a8d]">A patient opponent that teaches you the Nairobi line without giving it away.</p></div><div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#234a3b] text-[#d6a944]"><Gamepad2 size={23} /></div></div><div className="mb-7"><div className="mb-3 text-xs font-bold text-[#b9c9bd]">Choose the pace</div><div className="grid grid-cols-3 gap-2">{['Easy', 'Medium', 'Hard'].map((item) => <button data-testid={`button-difficulty-${item.toLowerCase()}`} key={item} onClick={() => setDifficulty(item)} className={`rounded-xl border px-3 py-4 text-left ${difficulty === item ? 'border-[#d6a944] bg-[#3a321e]' : 'border-[#355447] bg-[#142e25]'}`}><div className="mb-2 text-sm font-bold">{item}</div><div className="text-[10px] text-[#819a8d]">{item === 'Easy' ? 'Learn the lines' : item === 'Medium' ? 'Read the room' : 'No mercy tonight'}</div></button>)}</div></div><Link href="/game" data-testid="link-start-ai-game" className="btn-primary flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold">Start {difficulty} game <ArrowRight size={17} /></Link></section><section className="panel-soft rounded-2xl p-6"><div className="mb-4 flex items-center gap-2"><Users size={18} className="text-[#d6a944]" /><h2 className="font-display text-xl font-bold">Live pulse</h2></div><div className="mb-6 font-display text-4xl font-bold">1,847 <span className="font-sans text-sm font-medium text-[#819a8d]">players online</span></div><div className="space-y-3"><LiveMatch name="Wanjiku vs Otieno" stake="KSh 200" /><LiveMatch name="Kiptoo vs Muthoni" stake="KSh 50" /><LiveMatch name="Achieng vs Barasa" stake="Demo" /></div><Link href="/tournament" data-testid="link-browse-tournaments" className="mt-6 flex items-center gap-1 text-xs font-bold text-[#d6a944]">Browse tournament rooms <ArrowRight size={14} /></Link></section></div>}
    {tab === 'rooms' && <div className="grid gap-4 md:grid-cols-2"><section className="panel rounded-2xl p-6"><div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-[#234a3b] text-[#d6a944]"><Plus size={21} /></div><h2 className="font-display text-2xl font-bold">Make a room</h2><p className="mt-2 max-w-sm text-sm text-[#819a8d]">Create a private table and invite your crew with one code.</p><button onClick={createRoom} data-testid="button-create-room" className="btn-primary mt-7 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold"><Plus size={16} /> Create room</button>{roomCreated && <div className="mt-4 flex items-center justify-between rounded-xl border border-[#d6a944]/40 bg-[#3b321e] p-3"><div><div className="text-[10px] uppercase tracking-wider text-[#bfa862]">Room code</div><div data-testid="text-room-code" className="font-mono-custom text-xl font-bold tracking-[.2em] text-[#f0d47b]">{roomCreated}</div></div><button data-testid="button-copy-room" onClick={() => { navigator.clipboard?.writeText(roomCreated); showToast('Room code copied.'); }} className="btn-quiet rounded-lg p-2"><Copy size={16} /></button></div>}</section><section className="panel-soft rounded-2xl p-6"><div className="mb-6 grid h-11 w-11 place-items-center rounded-xl bg-[#234a3b] text-[#d6a944]"><DoorOpen size={21} /></div><h2 className="font-display text-2xl font-bold">Join a room</h2><p className="mt-2 text-sm text-[#819a8d]">Got a code from a friend in the lounge?</p><input value={roomCode} onChange={(event) => setRoomCode(event.target.value.toUpperCase().replace(/[^A-Z]/g, '').slice(0, 6))} data-testid="input-room-code" placeholder="e.g. KIBERA" className="mt-7 w-full rounded-xl border border-[#3c5e4e] bg-[#0f281f] px-4 py-3 font-mono-custom text-sm tracking-[.18em] text-[#f0e7cf] placeholder:text-[#557164]" /><button onClick={joinRoom} data-testid="button-join-room" className="btn-quiet mt-3 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold">Join table <ArrowRight size={16} /></button></section></div>}
    {tab === 'tournament' && <div className="panel rounded-2xl p-7"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><div className="mb-2 flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-[#d6a944]"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#4fd28a]" /> Entries open</div><h2 className="font-display text-2xl font-bold">Async. Competitive. Your clock.</h2><p className="mt-2 text-sm text-[#819a8d]">Play your round when you can. The bracket keeps moving.</p></div><Link href="/tournament" data-testid="link-enter-tournament" className="btn-primary flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">View bracket <ArrowRight size={16} /></Link></div><div className="mt-8 grid gap-3 sm:grid-cols-3"><StatBlock label="Prize pool" value="KSh 12,500" /><StatBlock label="Players" value="8 / 8" /><StatBlock label="Next round" value="03:42:18" /></div></div>}
  </div>;
}
function LiveMatch({ name, stake }: { name: string; stake: string }) { return <div className="flex items-center gap-3 border-b border-[#2e4a3d] pb-3"><span className="h-2 w-2 rounded-full bg-[#4fd28a]" /><span className="flex-1 text-xs font-semibold">{name}</span><span className="font-mono-custom text-[10px] text-[#819a8d]">{stake}</span></div>; }
function StatBlock({ label, value }: { label: string; value: string }) { return <div className="rounded-xl border border-[#345346] bg-[#142e25] p-4"><div className="text-[10px] uppercase tracking-wider text-[#819a8d]">{label}</div><div className="mt-2 font-display text-xl font-bold text-[#e8d18a]">{value}</div></div>; }

function boardMoves(board: (Piece | null)[][], row: number, col: number, color: PieceColor): Move[] {
  const directions = color === 'gold' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
  const piece = board[row][col];
  const dirs = piece?.king ? [...directions, ...directions.map(([r, c]) => [-r, -c])] : directions;
  const result: Move[] = [];
  dirs.forEach(([dr, dc]) => { const r = row + dr, c = col + dc; if (r >= 0 && r < 8 && c >= 0 && c < 8 && !board[r][c]) result.push({ from: [row, col], to: [r, c] }); const jumpR = row + dr * 2, jumpC = col + dc * 2; if (jumpR >= 0 && jumpR < 8 && jumpC >= 0 && jumpC < 8 && board[r]?.[c]?.color && board[r][c]?.color !== color && !board[jumpR][jumpC]) result.push({ from: [row, col], to: [jumpR, jumpC], capture: [r, c] }); });
  return result;
}
function initialBoard() {
  const board: (Piece | null)[][] = Array.from({ length: 8 }, () => Array<Piece | null>(8).fill(null));
  for (let row = 0; row < 3; row++) for (let col = 0; col < 8; col++) if ((row + col) % 2 === 1) board[row][col] = { color: 'forest' };
  for (let row = 5; row < 8; row++) for (let col = 0; col < 8; col++) if ((row + col) % 2 === 1) board[row][col] = { color: 'gold' };
  return board;
}
function playTone(kind: 'move' | 'capture' | 'win') {
  const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return;
  const context = new AudioContextClass(); const oscillator = context.createOscillator(); const gain = context.createGain(); oscillator.connect(gain); gain.connect(context.destination);
  oscillator.frequency.value = kind === 'win' ? 660 : kind === 'capture' ? 280 : 420; oscillator.type = 'sine'; gain.gain.setValueAtTime(.0001, context.currentTime); gain.gain.exponentialRampToValueAtTime(.08, context.currentTime + .01); gain.gain.exponentialRampToValueAtTime(.0001, context.currentTime + .18); oscillator.start(); oscillator.stop(context.currentTime + .2);
}

function GamePage({ mode, showToast }: { mode: Mode; showToast: (message: string) => void }) {
  const [board, setBoard] = useState(initialBoard);
  const [selected, setSelected] = useState<[number, number] | null>(null);
  const [turn, setTurn] = useState<PieceColor>('gold');
  const [moves, setMoves] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(9 * 60 + 42);
  const [stake, setStake] = useState(mode === 'cash' ? 100 : 250);
  const [soundOpen, setSoundOpen] = useState(false);
  const [resigned, setResigned] = useState(false);
  const allMoves = useMemo(() => board.flatMap((row, r) => row.flatMap((piece, c) => piece?.color === turn ? boardMoves(board, r, c, turn) : [])), [board, turn]);
  const captures = allMoves.filter((move) => move.capture);
  const legal = captures.length ? captures : allMoves;
  useEffect(() => { if (resigned) return; const timer = window.setInterval(() => setSeconds((value) => value > 0 ? value - 1 : 0), 1000); return () => window.clearInterval(timer); }, [resigned]);
  const movePiece = (move: Move) => {
    const next = board.map((row) => row.slice()); const [fr, fc] = move.from; const [tr, tc] = move.to; const piece = next[fr][fc]; if (!piece) return; next[fr][fc] = null; next[tr][tc] = { ...piece, king: piece.king || (piece.color === 'gold' && tr === 0) || (piece.color === 'forest' && tr === 7) }; if (move.capture) { const [cr, cc] = move.capture; next[cr][cc] = null; } setBoard(next); setSelected(null); setMoves((items) => [...items, `${String.fromCharCode(65 + fc)}${8 - fr} → ${String.fromCharCode(65 + tc)}${8 - tr}${move.capture ? ' ×' : ''}`]); playTone(move.capture ? 'capture' : 'move'); setTurn('forest'); window.setTimeout(() => { const available = next.flatMap((row, r) => row.flatMap((other, c) => other?.color === 'forest' ? boardMoves(next, r, c, 'forest') : [])); const aiMoves = available.filter((item) => item.capture); const pool = aiMoves.length ? aiMoves : available; const choice = pool.length ? pool[secureInt(pool.length)] : undefined; if (choice) { const aiNext = next.map((row) => row.slice()); const [ar, ac] = choice.from, [br, bc] = choice.to; const aiPiece = aiNext[ar][ac]; aiNext[ar][ac] = null; if (aiPiece) aiNext[br][bc] = { ...aiPiece, color: 'forest', king: aiPiece.king || br === 7 }; if (choice.capture) { const [xr, xc] = choice.capture; aiNext[xr][xc] = null; } setBoard(aiNext); setMoves((items) => [...items, `AI ${String.fromCharCode(65 + ac)}${8 - ar} → ${String.fromCharCode(65 + bc)}${8 - br}`]); playTone(choice.capture ? 'capture' : 'move'); } setTurn('gold'); }, 650); };
  const selectSquare = (row: number, col: number) => { const piece = board[row][col]; if (selected) { const move = legal.find((item) => item.from[0] === selected[0] && item.from[1] === selected[1] && item.to[0] === row && item.to[1] === col); if (move) return movePiece(move); } if (piece?.color === turn && legal.some((item) => item.from[0] === row && item.from[1] === col)) setSelected([row, col]); };
  const time = `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  return <div className="reveal"><div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div><div className="mb-1 flex items-center gap-2 text-[10px] uppercase tracking-[.2em] text-[#d6a944]"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#4fd28a]" /> Live table · AI / {mode === 'cash' ? 'simulated cash' : 'demo'}</div><h1 className="font-display text-2xl font-bold">Midnight at the board</h1></div><div className="flex items-center gap-2"><button onClick={() => setSoundOpen(!soundOpen)} data-testid="button-soundboard" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"><Headphones size={15} /> Soundboard</button><button onClick={() => { setResigned(true); showToast('You left the table. No stake was moved.'); }} data-testid="button-resign" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold text-[#d99b8e]"><Flag size={14} /> Resign</button></div></div>{soundOpen && <div className="mb-4 flex flex-wrap gap-2 rounded-xl border border-[#d6a944]/30 bg-[#3b321e] p-3"><span className="mr-2 self-center text-[10px] uppercase tracking-wider text-[#d6c27e]">Table talk</span>{['Sasa hivi.', 'Uko sure?', 'Safisha board.'].map((line) => <button key={line} data-testid={`button-sound-${line}`} onClick={() => { playTone('move'); showToast(`Played: “${line}”`); }} className="rounded-lg border border-[#8a702c] px-3 py-2 text-xs font-semibold text-[#f0dd9d]">{line}</button>)}</div>}{resigned ? <div className="panel mx-auto max-w-lg rounded-2xl p-8 text-center"><div className="mx-auto mb-4 grid h-14 w-14 place-items-center rounded-full bg-[#49322d] text-[#e49a8b]"><Flag size={23} /></div><h2 className="font-display text-2xl font-bold">Table closed.</h2><p className="mt-2 text-sm text-[#819a8d]">Good game. Your simulated stake stays safe.</p><Link href="/play" data-testid="link-back-to-play" className="btn-primary mt-6 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-bold">Find another table <ArrowRight size={16} /></Link></div> : <div className="grid gap-5 xl:grid-cols-[minmax(400px,620px)_1fr]"><section><div className="mb-3 flex items-center justify-between rounded-xl border border-[#345346] bg-[#122c23] px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold"><div className="grid h-7 w-7 place-items-center rounded-full bg-[#d6a944] text-[10px] font-bold text-[#153028]">AM</div>Amani <span className="text-[#708a7c]">vs</span> House AI</div><div className="flex items-center gap-2 font-mono-custom text-sm text-[#d6a944]"><span className="h-1.5 w-1.5 rounded-full bg-[#4fd28a]" /> {time}</div></div><div className="rounded-2xl border-[8px] border-[#5a3827] bg-[#87603a] p-2 shadow-2xl shadow-black/30 sm:border-[12px] sm:p-3"><div className="grid aspect-square grid-cols-8 overflow-hidden rounded-sm">{board.map((row, r) => row.map((piece, c) => { const isDark = (r + c) % 2 === 1; const isSelected = selected?.[0] === r && selected?.[1] === c; const canMove = legal.some((item) => item.to[0] === r && item.to[1] === c); return <button key={`${r}-${c}`} onClick={() => selectSquare(r, c)} data-testid={`cell-${r}-${c}`} className={`relative grid place-items-center ${isDark ? 'bg-[#53392c]' : 'bg-[#c39560]'} ${isSelected ? 'ring-4 ring-inset ring-[#f4d678]' : ''}`}>{canMove && <span className="absolute h-3 w-3 rounded-full bg-[#d6a944] shadow-[0_0_0_4px_rgba(214,169,68,.2)] sm:h-4 sm:w-4" />}{piece && <span className={`relative z-10 grid h-[67%] w-[67%] place-items-center rounded-full border-2 shadow-[0_5px_0_rgba(0,0,0,.28)] transition-transform ${piece.color === 'gold' ? 'border-[#f4d678] bg-[#d6a944] text-[#62451b]' : 'border-[#5b9d75] bg-[#23613f] text-[#c3e0c5]'} ${isSelected ? '-translate-y-1 scale-110' : ''}`}>{piece.king && <Crown size={15} />}</span>}</button>; }))}</div></div><div className="mt-3 flex items-center justify-between text-[10px] uppercase tracking-[.14em] text-[#718d7e]"><span>Mandatory captures on</span><span className="text-[#d6a944]">{turn === 'gold' ? 'Your move' : 'AI is thinking'}</span></div></section><aside className="space-y-4"><section className="panel rounded-2xl p-5"><div className="mb-4 flex items-center justify-between"><h2 className="font-display font-bold">Stake the moment</h2><span className="rounded-full bg-[#d6a944]/15 px-2 py-1 text-[10px] text-[#e3c16a]">{mode === 'cash' ? 'SIMULATED' : 'DEMO'}</span></div><div className="grid grid-cols-3 gap-2">{[50, 100, 250].map((value) => <button key={value} data-testid={`button-stake-${value}`} onClick={() => setStake(value)} className={`rounded-lg border py-2.5 font-mono-custom text-xs ${stake === value ? 'border-[#d6a944] bg-[#3b321e] text-[#f0d480]' : 'border-[#345346] bg-[#142e25] text-[#9ab0a1]'}`}>{money(value).replace('KSh ', '')}</button>)}</div><button onClick={() => showToast(`Double or nothing queued at ${money(stake * 2)}.`)} data-testid="button-double-stake" className="btn-primary mt-4 flex w-full items-center justify-center gap-2 rounded-lg py-3 text-xs font-bold"><Zap size={15} /> Double or nothing · {money(stake * 2)}</button></section><section className="panel-soft rounded-2xl p-5"><div className="mb-3 flex items-center justify-between"><h2 className="font-display font-bold">Move log</h2><span className="font-mono-custom text-[10px] text-[#819a8d]">{moves.length} moves</span></div><div className="max-h-44 space-y-2 overflow-y-auto">{moves.length === 0 ? <div className="rounded-lg border border-dashed border-[#416254] p-4 text-center text-xs text-[#789385]">Make the first move. Captures are mandatory.</div> : moves.map((move, index) => <div key={`${move}-${index}`} className="flex items-center gap-3 text-xs"><span className="font-mono-custom text-[#d6a944]">{String(index + 1).padStart(2, '0')}</span><span className="text-[#c4d2c6]">{move}</span></div>)}</div></section><section className="rounded-xl border border-[#345346] bg-[#122c23] p-4 text-xs leading-relaxed text-[#819a8d]"><div className="mb-1 flex items-center gap-2 font-bold text-[#bdcdbf]"><CircleHelp size={14} className="text-[#d6a944]" /> New to checkers?</div>Move diagonally. Jump an opponent to capture. Reach the far edge to crown your piece.</section></aside></div>}</div>;
}

function WalletPage({ mode, showToast, cashBalance, onCashDeposit }: { mode: Mode; showToast: (message: string) => void; cashBalance: number; onCashDeposit: (amount: number) => void }) {
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

  useEffect(() => {
    if (status !== 'pending' || !checkoutId) return;
    let cancelled = false;
    let timer: number | undefined;
    let elapsedSeconds = 0;
    const poll = async () => {
      try {
        const response = await fetch(`/api/brightpay/status?checkout_id=${encodeURIComponent(checkoutId)}`);
        const payload = await response.json().catch(() => ({})) as { status?: string; mpesa_receipt?: string; error?: string; message?: string };
        if (cancelled) return;
        if (!response.ok) {
          setPaymentError(payload.error ?? payload.message ?? 'Unable to check BrightPay status.');
          setStatus('error');
          return;
        }
        const nextStatus = String(payload.status ?? '').toUpperCase();
        if (nextStatus === 'COMPLETED') {
          setReceipt(payload.mpesa_receipt ?? '');
          setStatus('success');
          onCashDeposit(pendingAmount);
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
  }, [checkoutId, onCashDeposit, pendingAmount, showToast, status]);

  const reset = () => {
    setStatus('idle');
    setCheckoutId('');
    setTransactionId('');
    setReceipt('');
    setPaymentError('');
    setElapsed(0);
    setPhone('');
  };

  const submit = async () => {
    const parsed = Number(amount);
    const validPhone = /^(07|01)\d{8}$|^\+?254[71]\d{8}$/.test(phone.replace(/[\s-]/g, ''));
    if (flow === 'withdraw') return;
    if (!validPhone || !Number.isInteger(parsed) || parsed < 10 || parsed > 150000) {
      setPaymentError('Use a Kenyan number and a whole KSh amount between 10 and 150,000.');
      setStatus('error');
      return;
    }
    setStatus('initiating');
    setPaymentError('');
    const externalReference = `NBO${Date.now().toString(36).toUpperCase()}${String(secureInt(1_000_000)).padStart(6, '0')}`;
    try {
      const response = await fetch('/api/brightpay/pay', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ amount: parsed, phone_number: phone, external_reference: externalReference }),
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
  return <div className="reveal"><PageTitle eyebrow="BrightPay M-Pesa" title="Top up your table." copy="Send a real STK Push to your Kenyan number, then we will verify the payment automatically." action={<div className="flex items-center gap-2 rounded-full border border-[#27875b]/50 bg-[#153429] px-3 py-2 text-xs text-[#74dca0]"><ShieldCheck size={14} /> Secure payment proxy</div>} /><div className="grid gap-5 lg:grid-cols-[.8fr_1.2fr]"><section className="space-y-4"><div className="panel rounded-2xl p-6"><div className="mb-1 text-[10px] uppercase tracking-[.2em] text-[#819a8d]">Cash balance</div><div data-testid="text-wallet-balance" className="font-display text-4xl font-bold text-[#f0d37c]">{money(cashBalance)}</div><div className="mt-2 text-xs text-[#819a8d]">BrightPay confirmed deposits only</div><div className="mt-6 grid grid-cols-2 gap-2"><button onClick={() => { setFlow('deposit'); reset(); }} data-testid="button-wallet-deposit" className={`rounded-lg py-3 text-xs font-bold ${flow === 'deposit' ? 'bg-[#d6a944] text-[#173229]' : 'btn-quiet'}`}><ArrowDownLeft className="mr-1 inline" size={15} /> Deposit</button><button onClick={() => { setFlow('withdraw'); reset(); }} data-testid="button-wallet-withdraw" className={`rounded-lg py-3 text-xs font-bold ${flow === 'withdraw' ? 'bg-[#d6a944] text-[#173229]' : 'btn-quiet'}`}><ArrowUpRight className="mr-1 inline" size={15} /> Withdraw</button></div></div><div className="panel-soft rounded-2xl p-5"><div className="mb-4 flex items-center gap-2 font-display font-bold"><History size={17} className="text-[#d6a944]" /> Recent wallet activity</div><WalletRow label="BrightPay deposit" date="Today · confirmed" amount="+ KSh 1,000" /><WalletRow label="Entry · Quick play" date="Yesterday · 22:10" amount="− KSh 100" /><WalletRow label="Prize · Kilimani" date="18 Jun · 20:31" amount="+ KSh 350" /></div></section><section className="panel rounded-2xl p-6 sm:p-8"><div className="mb-7 flex items-start justify-between"><div><div className="mb-2 text-[10px] uppercase tracking-[.2em] text-[#d6a944]">{flow === 'deposit' ? 'Live payment' : 'Withdrawals'}</div><h2 className="font-display text-2xl font-bold">{flow === 'deposit' ? 'Pay with M-Pesa' : 'Payouts need setup'}</h2><p className="mt-2 text-sm text-[#819a8d]">{flow === 'deposit' ? 'Works with 07xx, 01xx or +254 numbers.' : 'BrightPay’s payment endpoint supports deposits. A payout endpoint is needed before withdrawals can be enabled.'}</p></div><div className="grid h-11 w-11 place-items-center rounded-xl bg-[#1c5e42] font-display font-bold text-[#84dca5]">M</div></div>{flow === 'withdraw' ? <div className="rounded-xl border border-[#d6a944]/30 bg-[#3b321e] p-5 text-sm text-[#e5d5a3]"><div className="flex items-center gap-2 font-bold"><Info size={16} /> Withdrawal endpoint not configured</div><p className="mt-2 text-xs leading-relaxed text-[#bda969]">No withdrawal request will be sent. Deposits remain fully available through BrightPay.</p><button onClick={() => { setFlow('deposit'); reset(); }} className="btn-primary mt-5 rounded-lg px-4 py-2.5 text-xs font-bold">Make a deposit</button></div> : status === 'success' ? <div data-testid="status-wallet-success" className="rounded-xl border border-[#4bbf7c]/40 bg-[#1a4a35] p-5"><div className="mb-4 flex items-center gap-3"><div className="grid h-10 w-10 place-items-center rounded-full bg-[#56c886] text-[#10291e]"><Check size={20} /></div><div><div className="font-bold">Payment confirmed</div><div className="text-xs text-[#9cd6ae]">Your cash balance has been updated.</div></div></div><div className="space-y-2 border-t border-[#4bbf7c]/25 pt-4 text-xs"><div className="flex justify-between"><span className="text-[#92bca0]">Amount</span><strong>{money(pendingAmount)}</strong></div><div className="flex justify-between"><span className="text-[#92bca0]">M-Pesa receipt</span><strong data-testid="text-transaction-code" className="font-mono-custom text-[#f0d37c]">{receipt || transactionId || 'Confirmed'}</strong></div></div><button onClick={reset} data-testid="button-new-wallet-transaction" className="btn-quiet mt-5 w-full rounded-lg py-2.5 text-xs font-bold">Start another deposit</button></div> : <>{active && <div data-testid="status-stk-countdown" className="mb-5 rounded-xl border border-[#d6a944]/40 bg-[#3b321e] p-4 text-center"><div className="mx-auto mb-3 grid h-11 w-11 place-items-center rounded-full border-2 border-[#d6a944] font-display text-lg text-[#f0d37c]">{status === 'initiating' ? '…' : `${Math.max(0, 120 - elapsed)}s`}</div><div className="text-sm font-bold text-[#f0dfad]">{status === 'initiating' ? 'Sending STK Push…' : 'Confirm the STK Push on your phone'}</div><div className="mt-1 text-xs text-[#a9945b]">{status === 'initiating' ? 'Connecting to BrightPay securely.' : 'We check BrightPay every 3 seconds for up to 2 minutes.'}</div></div>}{(status === 'error' || status === 'failed') && <div data-testid="status-wallet-error" className="mb-4 rounded-lg border border-[#ad6155]/40 bg-[#4a2927] px-3 py-3 text-xs text-[#f0b1a5]"><div className="flex items-center gap-2 font-semibold"><Info size={14} /> {paymentError}</div><button onClick={() => setStatus('idle')} className="mt-3 font-bold text-[#f0d0c8] underline">Try again</button></div>}<label className="mb-2 block text-xs font-semibold text-[#c3d1c5]" htmlFor="wallet-phone">M-Pesa number</label><input id="wallet-phone" value={phone} disabled={active} onChange={(event) => { setPhone(event.target.value.replace(/[^\d+\s-]/g, '').slice(0, 15)); setStatus('idle'); }} data-testid="input-wallet-phone" placeholder="0712 345 678" className="mb-4 w-full rounded-xl border border-[#3c5e4e] bg-[#0f281f] px-4 py-3 text-sm text-[#f0e7cf] placeholder:text-[#557164] disabled:opacity-60" /><label className="mb-2 block text-xs font-semibold text-[#c3d1c5]" htmlFor="wallet-amount">Amount (KSh 10 – 150,000)</label><div className="relative"><span className="absolute left-4 top-3.5 font-mono-custom text-sm text-[#819a8d]">KSh</span><input id="wallet-amount" value={amount} disabled={active} onChange={(event) => { setAmount(event.target.value.replace(/[^\d]/g, '')); setStatus('idle'); }} data-testid="input-wallet-amount" inputMode="numeric" className="w-full rounded-xl border border-[#3c5e4e] bg-[#0f281f] py-3 pl-14 pr-4 font-mono-custom text-sm text-[#f0e7cf] disabled:opacity-60" /></div><button onClick={() => void submit()} data-testid="button-submit-wallet" className="btn-primary mt-6 flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-bold disabled:opacity-60" disabled={active}><ArrowDownLeft size={16} /> {status === 'initiating' ? 'Connecting to BrightPay…' : status === 'pending' ? 'Waiting for confirmation…' : 'Send STK Push'}</button><p className="mt-4 text-center text-[10px] leading-relaxed text-[#6f897c]">BrightPay handles the secure prompt. Never share your M-Pesa PIN with this app.</p></>}</section></div></div>;
}
function WalletRow({ label, date, amount }: { label: string; date: string; amount: string }) { return <div className="flex items-center gap-3 border-t border-[#345346] py-3 first:border-0"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#23483a] text-[#d6a944]"><Landmark size={14} /></div><div className="flex-1"><div className="text-xs font-semibold">{label}</div><div className="text-[10px] text-[#789385]">{date}</div></div><span className={`font-mono-custom text-xs ${amount.startsWith('+') ? 'text-[#62d694]' : 'text-[#c7aaa0]'}`}>{amount}</span></div>; }

function ProfilePage({ showToast }: { showToast: (message: string) => void }) {
  return <div className="reveal"><PageTitle eyebrow="The player behind the moves" title="Your career." copy="A record of good reads, brave captures and tables you did not walk away from." action={<button onClick={() => { navigator.clipboard?.writeText(window.location.href); showToast('Profile link copied to clipboard.'); }} data-testid="button-share-profile" className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"><ArrowUpRight size={15} /> Share profile</button>} /><div className="grid gap-5 lg:grid-cols-[.78fr_1.22fr]"><section className="panel rounded-2xl p-6"><div className="flex items-center gap-4"><div className="grid h-16 w-16 place-items-center rounded-2xl bg-[#d6a944] font-display text-xl font-bold text-[#153028]">AM</div><div><h2 className="font-display text-xl font-bold">Amani Mwangi</h2><p className="text-xs text-[#819a8d]">@amani.moves · Nairobi, KE</p></div></div><div className="mt-7 rounded-xl border border-[#d6a944]/30 bg-[#3b321e] p-4"><div className="flex items-center gap-2 text-[10px] uppercase tracking-[.18em] text-[#d2b75f]"><Award size={14} /> Current title</div><div className="mt-2 font-display text-2xl font-bold text-[#f0d37c]">Night Owl</div><div className="mt-1 text-xs text-[#a9945b]">1,284 / 1,500 XP to Board Boss</div><div className="mt-3 h-1.5 rounded-full bg-[#70582d]"><div className="h-full w-[86%] rounded-full bg-[#d6a944]" /></div></div><div className="mt-6 grid grid-cols-2 gap-3"><MiniStat value="68%" label="Win rate" /><MiniStat value="47" label="Games played" /><MiniStat value="12" label="Best streak" /><MiniStat value="KSh 8.4k" label="Payouts" /></div></section><section className="space-y-5"><div className="grid gap-3 sm:grid-cols-3"><StatBlock label="Wins" value="32" /><StatBlock label="Captures" value="186" /><StatBlock label="Kings crowned" value="74" /></div><div className="panel-soft rounded-2xl p-6"><div className="mb-5 flex items-center justify-between"><h2 className="font-display text-xl font-bold">Payout ledger</h2><span className="rounded-full bg-[#1c5e42] px-2 py-1 text-[10px] text-[#76daa0]">Simulated</span></div><div className="space-y-1"><PayoutRow title="Kilimani Knockout" date="18 Jun 2024" value="+ KSh 350" /><PayoutRow title="Sunday Sundowner" date="16 Jun 2024" value="+ KSh 1,200" /><PayoutRow title="Quick play streak" date="14 Jun 2024" value="+ KSh 150" /></div><button onClick={() => showToast('Ledger export is ready in this demo.')} data-testid="button-export-ledger" className="btn-quiet mt-5 flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"><Download size={14} /> Export ledger</button></div></section></div></div>;
}
function MiniStat({ value, label }: { value: string; label: string }) { return <div className="rounded-xl border border-[#345346] bg-[#142e25] p-3"><div className="font-display text-lg font-bold text-[#e8d18a]">{value}</div><div className="mt-1 text-[10px] text-[#819a8d]">{label}</div></div>; }
function PayoutRow({ title, date, value }: { title: string; date: string; value: string }) { return <div className="flex items-center gap-3 border-t border-[#345346] py-3 first:border-0"><div className="grid h-8 w-8 place-items-center rounded-lg bg-[#1e513a] text-[#6bd99a]"><ArrowDownLeft size={14} /></div><div className="flex-1"><div className="text-xs font-semibold">{title}</div><div className="text-[10px] text-[#789385]">{date}</div></div><span className="font-mono-custom text-xs text-[#62d694]">{value}</span></div>; }

function TournamentPage() {
  const rounds = [
    { label: 'Quarterfinals', players: [['Wanjiku', 'Otieno'], ['Amani', 'Kiptoo'], ['Milly', 'Barasa'], ['Muthoni', 'Achieng']] },
    { label: 'Semifinals', players: [['Wanjiku', 'Amani'], ['Milly', '—']] },
    { label: 'Final', players: [['TBD', 'TBD']] },
  ];
  return <div className="reveal">
    <PageTitle eyebrow="The night circuit" title="Kilimani Knockout." copy="Eight seats. One crown. Every round stays open until the last move is logged." action={<div className="flex items-center gap-2 rounded-full border border-[#4e6c5d] bg-[#153429] px-3 py-2 text-xs text-[#b5c9b9]"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#4fd28a]" /> Round 2 live</div>} />
    <div className="mb-5 grid gap-3 sm:grid-cols-3"><StatBlock label="Prize pool" value="KSh 12,500" /><StatBlock label="Current round" value="Semifinals" /><StatBlock label="Closes in" value="03:42:18" /></div>
    <section className="panel overflow-x-auto rounded-2xl p-5 sm:p-8">
      <div className="mb-8 flex min-w-[700px] items-center justify-between"><div><div className="text-[10px] uppercase tracking-[.2em] text-[#d6a944]">Live bracket</div><h2 className="mt-2 font-display text-xl font-bold">Road to the rooftop table</h2></div><button data-testid="button-refresh-bracket" onClick={() => window.location.reload()} className="btn-quiet flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-bold"><RefreshCw size={14} /> Refresh</button></div>
      <div className="flex min-w-[700px] gap-6">
        {rounds.map((round, roundIndex) => <div className="flex min-w-[190px] flex-1 flex-col" key={round.label}>
          <div className="mb-4 text-[10px] font-bold uppercase tracking-[.18em] text-[#819a8d]">{round.label}</div>
          <div className="flex flex-1 flex-col justify-around gap-4">
            {round.players.map((players, index) => <div key={index} className="relative rounded-xl border border-[#385a4a] bg-[#142e25] p-3">
              {players.map((player, pIndex) => <div key={player + pIndex} className={`flex items-center justify-between py-1.5 text-xs ${pIndex === 0 ? 'border-b border-[#315144]' : ''}`}><span className={player === 'Amani' || player === 'Wanjiku' ? 'font-bold text-[#f0d37c]' : 'text-[#c1d0c3]'}>{player}</span>{player !== 'TBD' && player !== '—' && <span className="font-mono-custom text-[10px] text-[#789385]">{secureInt(3) + 1}</span>}</div>)}
              {roundIndex < 2 && <span className="absolute -right-6 top-1/2 hidden h-px w-6 bg-[#496857] sm:block" />}
            </div>)}
          </div>
        </div>)}
      </div>
      <div className="mt-8 flex items-center gap-2 border-t border-[#345346] pt-5 text-xs text-[#819a8d]"><LockKeyhole size={14} className="text-[#d6a944]" /> Bracket updates when both players submit a result. Async play stays fair.</div>
    </section>
  </div>;
}

function AppRouter() {
  const [mode, setMode] = useState<Mode>('demo');
  const [cashBalance, setCashBalance] = useState(() => {
    const storedValue = window.localStorage.getItem('nairobi-cash-balance');
    const stored = storedValue === null ? Number.NaN : Number(storedValue);
    return Number.isFinite(stored) && stored >= 0 ? stored : 2450;
  });
  const { toast, showToast } = useToastMessage();
  const handleCashDeposit = (amount: number) => {
    setCashBalance((current) => {
      const next = current + amount;
      window.localStorage.setItem('nairobi-cash-balance', String(next));
      return next;
    });
  };
  return <Shell mode={mode} onModeChange={setMode}><Switch><Route path="/" component={() => <Home mode={mode} showToast={showToast} cashBalance={cashBalance} />} /><Route path="/dashboard" component={() => <Home mode={mode} showToast={showToast} cashBalance={cashBalance} />} /><Route path="/play" component={() => <PlayPage mode={mode} showToast={showToast} cashBalance={cashBalance} />} /><Route path="/game" component={() => <GamePage mode={mode} showToast={showToast} />} /><Route path="/wallet" component={() => <WalletPage mode={mode} showToast={showToast} cashBalance={cashBalance} onCashDeposit={handleCashDeposit} />} /><Route path="/profile" component={() => <ProfilePage showToast={showToast} />} /><Route path="/tournament" component={TournamentPage} /><Route component={NotFound} /></Switch><Toast message={toast} /></Shell>;
}

function Router() {
  return <ErrorBoundary><AppRouter /></ErrorBoundary>;
}

function App() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
    }
  }, []);
  return <QueryClientProvider client={queryClient}><TooltipProvider><WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}><Router /></WouterRouter><Toaster /></TooltipProvider></QueryClientProvider>;
}

export default App;