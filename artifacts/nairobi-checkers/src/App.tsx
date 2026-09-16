import { lazy, Suspense, useEffect, useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ErrorBoundary } from '@/components/error-boundary';
import { Toaster } from '@/components/ui/toaster';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import NotFound from '@/pages/not-found';
import { TermsGate } from '@/components/terms-gate';
import { AccountGate, type PlayerAccount } from '@/components/account-gate';

import { Shell, Toast, useToastMessage, money, secureInt, type Mode } from '@/components/shell';
import { HomePage } from '@/pages/home-page';
import { GameBoard, type GameResult } from '@/components/game/game-board';
import { PlayEnhanced, type GameLaunch } from '@/components/game/play-enhanced';
import { ConfettiCanvas } from '@/components/game/canvas-fx';
import { FortuneWheel } from '@/components/game/fortune-wheel';
import { MpesaSmsBanner, makeMpesaCode, normalizeKenyanPhone, type MpesaAlert } from '@/components/game/mpesa-banner';
import {
  loadCareer, saveCareer, titleFor, lossXp, type Career, type MatchRecord,
} from '@/components/game/player-store';
import { loadSettings, saveSettings, type Settings } from '@/components/game/settings-store';
import { startAmbient, stopAmbient, playStreak, setAudioEnabled } from '@/components/game/audio-engine';
import { ensureDbProfile, fetchDbBalanceKsh, isDbConfigured } from '@/lib/supabase';

// Route-level code splitting: heavy pages load only when visited.
const WalletPage = lazy(async () => ({ default: (await import('@/pages/wallet-page')).WalletPage }));
const TournamentPage = lazy(async () => ({ default: (await import('@/pages/tournament-page')).TournamentPage }));
const ProfileAnalytics = lazy(async () => ({ default: (await import('@/components/game/profile-analytics')).ProfileAnalytics }));
const AdminDashboard = lazy(async () => ({ default: (await import('@/components/game/admin-dashboard')).AdminDashboard }));
const DuelPage = lazy(async () => ({ default: (await import('@/features/ui/duel-page')).DuelPage }));

const queryClient = new QueryClient();

function PageFallback() {
  return <div className="grid min-h-[40vh] place-items-center"><div className="glass-panel-soft rounded-2xl px-6 py-8 text-center"><div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-[#d6a944] border-t-transparent" /><div className="font-mono-custom text-[10px] uppercase tracking-[.22em] text-[#819a8d]">Loading table…</div></div></div>;
}

function PlayPageBridge(props: {
  mode: Mode;
  cashBalance: number;
  hasAccount: boolean;
  onRequestAccount: () => void;
  settings: Settings;
  onSettingsChange: (next: Settings) => void;
  onLaunch: (launch: GameLaunch) => void;
  doubleOffer: { stake: number; secondsLeft: number } | null;
  onAcceptDouble: () => void;
  onDismissDouble: () => void;
}) {
  return <PlayEnhanced {...props} />;
}

function AppRouter() {
  const [termsAccepted, setTermsAccepted] = useState(() => window.localStorage.getItem('nairobi-terms-v1') === 'accepted');
  const [account, setAccount] = useState<PlayerAccount | null>(() => {
    const stored = window.localStorage.getItem('nairobi-player-account');
    if (!stored) return null;
    try { return JSON.parse(stored) as PlayerAccount; } catch { return null; }
  });
  const [accountGateOpen, setAccountGateOpen] = useState(false);
  const [mode, setMode] = useState<Mode>('demo');
  const [cashBalance, setCashBalance] = useState(() => {
    const storedValue = window.localStorage.getItem('nairobi-cash-balance');
    const stored = storedValue === null ? Number.NaN : Number(storedValue);
    return Number.isFinite(stored) && stored >= 0 ? stored : 2450;
  });
  // Hydrate the authoritative wallet balance from the server ledger on boot;
  // without Supabase configured this is a silent no-op (localStorage seed wins).
  useEffect(() => {
    if (!isDbConfigured()) return;
    let cancelled = false;
    void ensureDbProfile().then(() => fetchDbBalanceKsh()).then((ksh) => {
      if (cancelled || ksh === null) return;
      setCashBalance(ksh);
      window.localStorage.setItem('nairobi-cash-balance', String(ksh));
    });
    return () => {
      cancelled = true;
    };
  }, []);
  const [settings, setSettings] = useState<Settings>(() => loadSettings());
  const [career, setCareer] = useState<Career>(() => loadCareer());
  const [activeGame, setActiveGame] = useState<GameLaunch | null>(null);
  const [fortuneOpen, setFortuneOpen] = useState(false);
  const [fortuneFired, setFortuneFired] = useState(false);
  const [confettiKey, setConfettiKey] = useState(0);
  const [mpesaAlert, setMpesaAlert] = useState<MpesaAlert | null>(null);
  const [doubleOffer, setDoubleOffer] = useState<{ stake: number; secondsLeft: number } | null>(null);
  const [lastStake, setLastStake] = useState(100);
  const { toast, showToast } = useToastMessage();

  // Ambient sound follows the settings toggle.
  useEffect(() => {
    setAudioEnabled(settings.ambientSound);
    if (settings.ambientSound) startAmbient();
    return () => stopAmbient();
  }, [settings.ambientSound]);

  // Auto-open the Daily Fortune Wheel once per session, shortly after load.
  useEffect(() => {
    if (!termsAccepted || fortuneFired) return;
    const timer = window.setTimeout(() => {
      setFortuneOpen(true);
      setFortuneFired(true);
      try { window.sessionStorage.setItem('games254-fortune-session', 'shown'); } catch { /* ignore */ }
    }, 1400);
    return () => window.clearTimeout(timer);
  }, [termsAccepted, fortuneFired]);

  const updateSettings = (next: Settings) => {
    setSettings(next);
    saveSettings(next);
  };

  const updateCareer = (next: Career) => {
    setCareer(next);
    saveCareer(next);
  };

  if (!termsAccepted) {
    return <TermsGate onAccept={() => { window.localStorage.setItem('nairobi-terms-v1', 'accepted'); setTermsAccepted(true); }} />;
  }
  const requestAccount = () => setAccountGateOpen(true);
  const handleModeChange = (next: Mode) => {
    if (next === 'cash' && !account) {
      requestAccount();
      return;
    }
    setMode(next);
  };
  const handleAccountComplete = (nextAccount: PlayerAccount) => {
    window.localStorage.setItem('nairobi-player-account', JSON.stringify(nextAccount));
    setAccount(nextAccount);
    setAccountGateOpen(false);
    setMode('cash');
    showToast(`Welcome, ${nextAccount.displayName}. Cash tables are ready for review.`);
  };
  // Called by WalletPage only after BrightPay confirms the STK deposit (server-verified).
  const handleDepositConfirmed = (amount: number, authoritativeKsh?: number) => {
    setCashBalance((current) => {
      const next = typeof authoritativeKsh === 'number' ? Math.max(0, authoritativeKsh) : current + amount;
      window.localStorage.setItem('nairobi-cash-balance', String(next));
      return next;
    });
    updateCareer({ ...career, cashIns: career.cashIns + amount });
    setMpesaAlert({
      code: makeMpesaCode(), amount, direction: 'in', counterparty: 'GAMES254 DEPOSIT',
      newBalance: typeof authoritativeKsh === 'number' ? authoritativeKsh : cashBalance + amount, at: Date.now(),
    });
  };
  // Called by WalletPage only after /api/brightpay/withdraw returns 200
  // (HMAC-signed server-side). We still own the local mutation; the server owns the truth.
  const handleWithdrawConfirmed = (amount: number, phone: string, _externalReference: string, authoritativeKsh?: number) => {
    setCashBalance((current) => {
      const next = typeof authoritativeKsh === 'number' ? Math.max(0, authoritativeKsh) : Math.max(0, current - amount);
      window.localStorage.setItem('nairobi-cash-balance', String(next));
      return next;
    });
    updateCareer({ ...career, cashOuts: career.cashOuts + amount });
    setMpesaAlert({
      code: makeMpesaCode(), amount, direction: 'out',
      counterparty: normalizeKenyanPhone(phone) ?? phone,
      newBalance: typeof authoritativeKsh === 'number' ? authoritativeKsh : Math.max(0, cashBalance - amount), at: Date.now(),
    });
  };

  const handleLaunch = (launch: GameLaunch) => {
    if (launch.kind === 'cash' && mode === 'cash' && launch.stake > cashBalance) {
      showToast('Stake exceeds your cash balance. Lower the stake or deposit.');
      return;
    }
    if (launch.stake > 0) setLastStake(launch.stake);
    if (launch.kind === 'cash' && launch.stake > 0) {
      // Escrow the stake at launch so all three finishes are consistent:
      // win = +prize (pool-fee), loss = stake stays locked, draw = refund.
      setCashBalance((current) => {
        const next = current - launch.stake;
        window.localStorage.setItem('nairobi-cash-balance', String(next));
        return next;
      });
    }
    setActiveGame(launch);
  };

  const handleFinish = (result: GameResult) => {
    const kind = activeGame?.kind ?? 'bot';
    const stake = activeGame?.stake ?? 0;
    const effective = result.winner === null ? { ...result, xpDelta: lossXp(titleFor(career.xp).level) } : result;
    const cashDelta = kind === 'cash' && stake > 0 ? (result.winner === 'gold' ? effective.prize : result.winner === null ? 0 : -stake) : 0;
    const record: MatchRecord = {
      id: `m-${Date.now()}-${secureInt(9999)}`,
      at: Date.now(),
      kind,
      outcome: result.winner === 'gold' ? 'win' : 'loss',
      opponent: kind === 'bot' ? 'House AI' : kind === 'partner' ? 'Partner' : 'Cash rival',
      captureCount: result.captures,
      kingCount: result.kings,
      moves: result.moves,
      xpDelta: effective.xpDelta,
      stake,
      cashDelta,
      rules: { size: settings.rules.size, kingMode: settings.rules.kingMode, forcedCapture: settings.rules.forcedCapture },
    };
    const nextStreak = result.winner === 'gold' ? career.currentStreak + 1 : 0;
    const nextCareer: Career = {
      ...career,
      xp: career.xp + effective.xpDelta,
      wins: career.wins + (result.winner === 'gold' ? 1 : 0),
      losses: career.losses + (result.winner === 'gold' ? 0 : 1),
      currentStreak: nextStreak,
      bestStreak: Math.max(career.bestStreak, nextStreak),
      totalCaptures: career.totalCaptures + result.captures,
      totalKings: career.totalKings + result.kings,
      lifetimeStake: career.lifetimeStake + (kind === 'cash' ? stake : 0),
      lifetimePrize: career.lifetimePrize + (cashDelta > 0 ? cashDelta : 0),
      cashIns: career.cashIns + (cashDelta > 0 ? cashDelta : 0),
      matches: [record, ...career.matches],
    };
    updateCareer(nextCareer);
    if (result.winner === 'gold') {
      setConfettiKey((value) => value + 1);
      if (kind === 'cash' && stake > 0) {
        setCashBalance((current) => {
          const next = current + effective.prize;
          window.localStorage.setItem('nairobi-cash-balance', String(next));
          return next;
        });
        setMpesaAlert({
          code: makeMpesaCode(), amount: effective.prize, direction: 'in',
          counterparty: 'GAMES254 PRIZE', newBalance: cashBalance + effective.prize, at: Date.now(),
        });
      }
      if (nextStreak >= 2) playStreak(nextStreak);
      if (kind === 'cash' && stake > 0) {
        setLastStake(stake);
        setDoubleOffer({ stake, secondsLeft: 5 });
      }
    } else if (result.winner === null && kind === 'cash' && stake > 0) {
      // Draw: refund the escrowed stake in full.
      setCashBalance((current) => {
        const next = current + stake;
        window.localStorage.setItem('nairobi-cash-balance', String(next));
        return next;
      });
    }
  };

  // Double-or-nothing 5-second countdown.
  useEffect(() => {
    if (!doubleOffer) return;
    if (doubleOffer.secondsLeft <= 0) {
      setDoubleOffer(null);
      return;
    }
    const timer = window.setTimeout(() => setDoubleOffer((offer) => (offer ? { ...offer, secondsLeft: offer.secondsLeft - 1 } : null)), 1000);
    return () => window.clearTimeout(timer);
  }, [doubleOffer]);

  const handleAcceptDouble = () => {
    const doubled = lastStake * 2;
    setDoubleOffer(null);
    if (mode === 'cash' && doubled > cashBalance) {
      showToast('Not enough balance to double. Banking the win instead.');
      return;
    }
    if (mode === 'cash' && doubled > 0) {
      // Fresh stake lock for the doubled leg.
      setCashBalance((current) => {
        const next = current - doubled;
        window.localStorage.setItem('nairobi-cash-balance', String(next));
        return next;
      });
    }
    setActiveGame({ kind: 'cash', stake: doubled });
    showToast(`Doubled down at ${money(doubled)}. Good luck.`);
  };

  const handleFortunePrize = (prize: { label: string; kind: string; value: number }) => {
    if (prize.kind === 'xp') {
      updateCareer({ ...career, xp: career.xp + prize.value });
    } else if (prize.kind === 'bonus') {
      setCashBalance((current) => {
        const next = current + prize.value;
        window.localStorage.setItem('nairobi-cash-balance', String(next));
        return next;
      });
    }
  };

  if (activeGame) {
    return <Shell mode={mode} onModeChange={handleModeChange} hasAccount={Boolean(account)} onRequestAccount={requestAccount}>
      <div className="mx-auto max-w-[1340px]">
        <GameBoard
          key={`${activeGame.kind}-${activeGame.stake}-${settings.rules.size}-${settings.rules.kingMode}`}
          kind={activeGame.kind}
          stake={activeGame.stake}
          mode={mode}
          settings={settings}
          feePercent={settings.houseFeePercent}
          onExit={() => setActiveGame(null)}
          onFinish={handleFinish}
          showToast={showToast}
        />
      </div>
      <Toast message={toast} />
      <ConfettiCanvas fireKey={confettiKey} />
    </Shell>;
  }

  return <><Shell mode={mode} onModeChange={handleModeChange} hasAccount={Boolean(account)} onRequestAccount={requestAccount}><Suspense fallback={<PageFallback />}><Switch><Route path="/" component={() => <HomePage mode={mode} showToast={showToast} cashBalance={cashBalance} career={career} />} /><Route path="/dashboard" component={() => <HomePage mode={mode} showToast={showToast} cashBalance={cashBalance} career={career} />} /><Route path="/play" component={() => <PlayPageBridge mode={mode} cashBalance={cashBalance} hasAccount={Boolean(account)} onRequestAccount={requestAccount} settings={settings} onSettingsChange={updateSettings} onLaunch={handleLaunch} doubleOffer={doubleOffer} onAcceptDouble={handleAcceptDouble} onDismissDouble={() => setDoubleOffer(null)} />} /><Route path="/game" component={() => <PlayPageBridge mode={mode} cashBalance={cashBalance} hasAccount={Boolean(account)} onRequestAccount={requestAccount} settings={settings} onSettingsChange={updateSettings} onLaunch={handleLaunch} doubleOffer={doubleOffer} onAcceptDouble={handleAcceptDouble} onDismissDouble={() => setDoubleOffer(null)} />} /><Route path="/wallet" component={() => <WalletPage mode={mode} showToast={showToast} cashBalance={cashBalance} withdrawalsEnabled={settings.withdrawalsEnabled} onDepositConfirmed={handleDepositConfirmed} onWithdrawConfirmed={handleWithdrawConfirmed} />} /><Route path="/profile" component={() => <ProfileAnalytics career={career} displayName={account?.displayName ?? 'Guest 254'} onExport={() => showToast('Ledger export is ready in this demo.')} showToast={showToast} />} /><Route path="/tournament" component={() => <TournamentPage showToast={showToast} settings={settings} />} /><Route path="/duel" component={() => <DuelPage />} /><Route path="/admin" component={() => <AdminDashboard settings={settings} onSettingsChange={updateSettings} career={career} showToast={showToast} />} /><Route component={NotFound} /></Switch></Suspense><Toast message={toast} /></Shell>
    {accountGateOpen && <AccountGate onComplete={handleAccountComplete} onClose={() => setAccountGateOpen(false)} />}
    {fortuneOpen && <FortuneWheel onClose={() => setFortuneOpen(false)} onPrize={handleFortunePrize} />}
    <ConfettiCanvas fireKey={confettiKey} />
    {mpesaAlert && <MpesaSmsBanner alert={mpesaAlert} onDismiss={() => setMpesaAlert(null)} />}
  </>;
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