/**
 * Games254 shell — the app chrome shared by every route: brand sidebar,
 * top rail, mobile menu, mode switch, toast plumbing and small display
 * helpers. Extracted from App.tsx so page components can live on their own.
 */
import { useEffect, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3, Bell, Check, Crown, Download, Flame, Home as HomeIcon, Info, Menu,
  MoreHorizontal, ShieldCheck, Swords, Trophy, UserRound, WalletCards, X,
} from 'lucide-react';

export type Mode = 'demo' | 'cash';

export const navItems: { href: string; label: string; icon: LucideIcon }[] = [
  { href: '/', label: 'Home', icon: HomeIcon },
  { href: '/play', label: 'Play', icon: Swords },
  { href: '/tournament', label: 'Tournaments', icon: Trophy },
  { href: '/duel', label: 'Duel Lab', icon: Flame },
  { href: '/wallet', label: 'Wallet', icon: WalletCards },
  { href: '/profile', label: 'Profile', icon: UserRound },
  { href: '/admin', label: 'Owner console', icon: BarChart3 },
];

export function secureInt(max: number) {
  if (globalThis.crypto?.getRandomValues) {
    const bytes = new Uint32Array(1);
    globalThis.crypto.getRandomValues(bytes);
    return bytes[0] % max;
  }
  return Math.floor(Math.random() * max);
}

export function money(value: number) {
  return `KSh ${value.toLocaleString('en-KE')}`;
}

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

export function InstallAppButton() {
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

export function useToastMessage() {
  const [toast, setToast] = useState('');
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 3300);
    return () => window.clearTimeout(timer);
  }, [toast]);
  return { toast, showToast: setToast };
}

export function Toast({ message }: { message: string }) {
  if (!message) return null;
  return <div data-testid="status-toast" className="fixed bottom-20 right-4 z-50 flex max-w-[calc(100vw-2rem)] items-center gap-2 rounded-xl border border-[#d6a944]/40 bg-[#18372f] px-4 py-3 text-sm text-[#f1e7cb] shadow-2xl md:bottom-6">
    <Check size={16} className="text-gold" /> {message}
  </div>;
}

export function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (next: Mode) => void }) {
  return <div className="flex items-center gap-2 rounded-full border border-[#456253] bg-[#102821] p-1" data-testid="control-mode-switch">
    <button data-testid="button-mode-demo" onClick={() => onChange('demo')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] transition ${mode === 'demo' ? 'bg-[#d6a944] text-[#132a22]' : 'text-[#8fa99b]'}`}>Demo Play</button>
    <button data-testid="button-mode-cash" onClick={() => onChange('cash')} className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-[.13em] transition ${mode === 'cash' ? 'bg-[#1f8d5b] text-[#e4f3e5]' : 'text-[#8fa99b]'}`}>Real Cash</button>
  </div>;
}

export function Shell({ children, mode, onModeChange, hasAccount, onRequestAccount }: { children: ReactNode; mode: Mode; onModeChange: (next: Mode) => void; hasAccount: boolean; onRequestAccount: () => void }) {
  const [location] = useLocation();
  const [modeAlert, setModeAlert] = useState(false);
  const [mobileMenu, setMobileMenu] = useState(false);
  const changeMode = (next: Mode) => {
    onModeChange(next);
    setModeAlert(true);
    window.setTimeout(() => setModeAlert(false), 3600);
  };
  return <div className="app-shell city min-h-[100dvh]">
    <div className="city-lights" aria-hidden />
    <aside className="glass-panel fixed inset-y-0 left-0 z-30 hidden w-[236px] flex-col border-r border-[#273f35] px-4 py-6 md:flex">
      <Link href="/" data-testid="link-brand" className="mb-10 flex items-center gap-3 px-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#d6a944] text-[#123027]"><Crown size={21} /></div>
        <div><div className="font-display text-lg font-bold tracking-tight">Games254</div><div className="font-mono-custom text-[9px] uppercase tracking-[.24em] text-[#d6a944]">Checkers</div></div>
      </Link>
      <div className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[.2em] text-[#607d6e]">Playground</div>
      <nav className="space-y-1">
        {navItems.map((item) => { const Icon = item.icon; const active = item.href === location; return <Link href={item.href} data-testid={`link-nav-${item.label.toLowerCase()}`} className={`flex items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold transition ${active ? 'bg-[#d6a944] text-[#132a22]' : 'text-[#96afa2] hover:bg-[#16352b] hover:text-[#f0e7cf]'}`} key={item.href}><Icon size={18} /><span>{item.label}</span>{item.label === 'Tournaments' && <span className="ml-auto rounded-full bg-[#d6a944]/20 px-1.5 py-0.5 text-[9px] text-[#e4c36e]">LIVE</span>}</Link>; })}
      </nav>
      <div className="mt-auto space-y-3">
         <div className="glass-panel-soft rounded-2xl p-4">
           <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-[#c9d8cd]"><ShieldCheck size={15} className="text-[#d6a944]" /> Free-first play</div>
           <p className="text-[11px] leading-relaxed text-[#769084]">{hasAccount ? 'Your account unlocks cash options with fees shown before entry.' : 'Free games need no account. Create one only when you choose cash play.'}</p>
           {!hasAccount && <button onClick={onRequestAccount} className="mt-3 w-full rounded-lg border border-[#d6a944]/40 px-3 py-2 text-[10px] font-bold text-[#e3c16a]">Create player account</button>}
         </div>
        <div className="flex items-center gap-3 border-t border-[#294237] pt-4"><div className="grid h-9 w-9 place-items-center rounded-full bg-[#d6a944] font-display font-bold text-[#153028]">G2</div><div className="min-w-0"><p className="truncate text-sm font-bold">Guest 254</p><p className="text-[10px] text-[#769084]">Free lounge · open source</p></div><MoreHorizontal size={17} className="ml-auto text-[#789385]" /></div>
      </div>
    </aside>
    <header className="glass-rail sticky top-0 z-20 border-b border-[#273f35] px-4 py-3 md:ml-[236px] md:px-8">
      <div className="mx-auto flex max-w-[1340px] items-center justify-between gap-3">
        <div className="flex items-center gap-3 md:hidden"><button aria-label="Open navigation" data-testid="button-open-menu" onClick={() => setMobileMenu(true)} className="btn-quiet rounded-lg p-2"><Menu size={18} /></button><Link href="/" data-testid="link-mobile-brand" className="font-display font-bold">Games <span className="text-gold">254</span></Link></div>
        <div className="hidden text-sm text-[#789385] md:block">{location === '/' ? 'Good evening, player' : navItems.find((item) => item.href === location)?.label ?? 'Game room'}</div>
         <div className="ml-auto flex items-center gap-2"><div className="hidden items-center gap-1.5 rounded-full bg-[#17352b] px-3 py-2 text-[11px] text-[#b9c9bd] sm:flex"><span className="pulse-dot h-1.5 w-1.5 rounded-full bg-[#4fd28a]" /> Lounge is humming</div><ModeSwitch mode={mode} onChange={changeMode} /><InstallAppButton /><button aria-label="Notifications" data-testid="button-notifications" onClick={() => window.alert('No new alerts. You are all caught up.')} className="btn-quiet rounded-full p-2"><Bell size={16} /></button></div>
      </div>
    </header>
     {mobileMenu && <div className="fixed inset-0 z-50 bg-[#07150f]/80 md:hidden" onClick={() => setMobileMenu(false)}><div className="glass-panel h-full w-[280px] p-5" onClick={(event) => event.stopPropagation()}><div className="mb-8 flex items-center justify-between"><span className="font-display font-bold">Menu</span><button data-testid="button-close-menu" onClick={() => setMobileMenu(false)} className="btn-quiet rounded-lg p-2"><X size={16} /></button></div><nav className="space-y-2">{navItems.map((item) => { const Icon = item.icon; return <Link onClick={() => setMobileMenu(false)} href={item.href} data-testid={`link-mobile-${item.label.toLowerCase()}`} className="flex items-center gap-3 rounded-xl px-3 py-3 text-[#c4d1c6] hover:bg-[#17382c]" key={item.href}><Icon size={18} /> {item.label}</Link>; })}</nav>{!hasAccount && <button onClick={() => { setMobileMenu(false); onRequestAccount(); }} className="mt-8 w-full rounded-xl border border-[#d6a944]/40 px-3 py-3 text-left text-xs font-bold text-[#e3c16a]">Create player account</button>}</div></div>}
     {modeAlert && <div role="alert" data-testid="alert-mode-change" className="fixed left-1/2 top-[72px] z-40 flex -translate-x-1/2 items-center gap-2 rounded-full border border-[#d6a944]/50 bg-[#18382e] px-4 py-2.5 text-xs font-semibold text-[#f4e6bd] shadow-2xl"><Info size={15} className="text-gold" /> {mode === 'cash' ? 'Cash room selected · fees shown before entry' : 'Free Play selected · no stakes'}</div>}
    <main className="relative z-10 pb-24 md:ml-[236px] md:pb-8"><div className="mx-auto max-w-[1340px] px-4 py-6 md:px-8 md:py-8">{children}</div></main>
    <nav className="glass-rail fixed bottom-0 left-0 right-0 z-30 flex border-t border-[#294237] px-2 py-2 md:hidden">{navItems.slice(0, 5).map((item) => { const Icon = item.icon; const active = item.href === location; return <Link href={item.href} data-testid={`link-bottom-${item.label.toLowerCase()}`} className={`flex flex-1 flex-col items-center gap-1 py-1 text-[9px] font-bold uppercase tracking-wider ${active ? 'text-[#d6a944]' : 'text-[#718c7e]'}`} key={item.href}><Icon size={18} />{item.label}</Link>; })}</nav>
  </div>;
}

export function PageTitle({ eyebrow, title, copy, action }: { eyebrow: string; title: string; copy?: string; action?: ReactNode }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 font-mono-custom text-[10px] font-medium uppercase tracking-[.22em] text-[#d6a944]">{eyebrow}</div><h1 className="font-display text-3xl font-bold tracking-tight text-[#f0e7cf] sm:text-4xl">{title}</h1>{copy && <p className="mt-2 max-w-xl text-sm text-[#819a8d]">{copy}</p>}</div>{action}</div>;
}