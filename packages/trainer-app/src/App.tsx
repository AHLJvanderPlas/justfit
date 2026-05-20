// Trainer Portal — root shell with auth guard, DPA gate, gym context loader, nav (P1A+)
import { useEffect, useState } from 'react';
import { useGymStore, type GymContext } from './store/gymStore.ts';
import { api } from './api/client.ts';
import LoginView from './views/LoginView.tsx';
import GymSetupView from './views/GymSetupView.tsx';
import ClientsView from './views/ClientsView.tsx';
import ExercisesView from './views/ExercisesView.tsx';
import ProgramsView from './views/ProgramsView.tsx';
import InvoicesView from './views/InvoicesView.tsx';
import BtwView from './views/BtwView.tsx';
import AuditView from './views/AuditView.tsx';

type Tab = 'clients' | 'programs' | 'exercises' | 'invoices' | 'btw' | 'settings' | 'audit';

function DpaGate({ onAck }: { onAck: () => void }) {
  const { token, activeGymId } = useGymStore();
  const [loading, setLoading] = useState(false);

  async function acknowledge() {
    if (!token || !activeGymId) return;
    setLoading(true);
    try {
      await api.acknowledgeDpa(token, activeGymId);
      onAck();
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh bg-bg flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-bg-card border border-border rounded-3xl p-8 space-y-6">
        <h1 className="text-3xl font-black text-text" style={{ fontFamily: 'var(--font-display)' }}>
          VERWERKERSOVEREENKOMST
        </h1>
        <p className="text-muted text-sm leading-relaxed">
          Als trainer verwerk je persoonsgegevens van je cliënten via JustFit.
          Conform de AVG (GDPR) is een verwerkersovereenkomst verplicht.
        </p>
        <div className="p-4 rounded-2xl bg-bg border border-border text-xs text-muted space-y-2 leading-relaxed">
          <p><strong className="text-text">JustFit B.V.</strong> treedt op als verwerker van persoonsgegevens
          die jij als verwerkingsverantwoordelijke aan ons toevertrouwt.</p>
          <p>Gegevens worden uitsluitend verwerkt voor het leveren van de JustFit-dienst en worden
          niet voor andere doeleinden gebruikt.</p>
          <p>Je hebt het recht cliëntsgegevens te exporteren en te laten verwijderen. JustFit past
          passende technische en organisatorische maatregelen toe (encryptie, toegangscontrole, audit log).</p>
          <p>Versie 1.0 — geldig vanaf 1 januari 2025.</p>
        </div>
        <button onClick={acknowledge} disabled={loading}
          className="w-full py-4 rounded-2xl bg-emerald text-bg font-black disabled:opacity-50"
          style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
          {loading ? 'BEVESTIGEN...' : 'IK GA AKKOORD MET DE VOK'}
        </button>
        <p className="text-xs text-muted text-center">
          Door akkoord te gaan bevestig je dat je de VOK hebt gelezen en aanvaardt.
        </p>
      </div>
    </div>
  );
}

const NAV: { id: Tab; label: string }[] = [
  { id: 'clients', label: 'Clients' },
  { id: 'programs', label: 'Programs' },
  { id: 'exercises', label: 'Exercises' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'btw', label: 'BTW' },
  { id: 'settings', label: 'Settings' },
  { id: 'audit', label: 'Audit' },
];

export default function App() {
  const { token, gym, setGym, clearAuth, activeGymId, activeRole } = useGymStore();
  const [tab, setTab] = useState<Tab>('clients');
  const [dpaAcked, setDpaAcked] = useState(false);
  const [loadingGym, setLoadingGym] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    if (!token || !activeGymId) return;
    setLoadingGym(true);
    api.getGym(token, activeGymId)
      .then((data: unknown) => {
        const g = data as unknown as GymContext;
        setGym(g);
        setDpaAcked(!!(g as { dpa_acknowledged_at_ms?: number })?.dpa_acknowledged_at_ms);
      })
      .catch(() => clearAuth())
      .finally(() => setLoadingGym(false));
  }, [token, activeGymId]);

  if (!token) return <LoginView />;

  if (loadingGym) {
    return (
      <div className="min-h-dvh bg-bg flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!dpaAcked) {
    return <DpaGate onAck={() => setDpaAcked(true)} />;
  }

  function renderTab() {
    switch (tab) {
      case 'clients': return <ClientsView />;
      case 'programs': return <ProgramsView />;
      case 'exercises': return <ExercisesView />;
      case 'invoices': return <InvoicesView />;
      case 'btw': return <BtwView />;
      case 'settings': return <GymSetupView />;
      case 'audit': return <AuditView />;
      default: return <ClientsView />;
    }
  }

  const gymName = gym?.name ?? 'My Gym';

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      <header className="sticky top-0 z-40 border-b border-border bg-bg/90 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button className="lg:hidden text-muted hover:text-text" aria-label="Menu"
              onClick={() => setMobileNavOpen(o => !o)}>
              ☰
            </button>
            <span className="font-black text-text text-lg" style={{ fontFamily: 'var(--font-display)' }}>
              JUSTFIT
            </span>
            <span className="text-muted text-sm hidden sm:block">· {gymName}</span>
          </div>
          <div className="flex items-center gap-3">
            {activeRole && <span className="text-xs text-muted hidden sm:block">{activeRole}</span>}
            <button onClick={clearAuth}
              className="text-xs text-muted hover:text-text px-3 py-1 rounded-lg border border-border">
              Sign out
            </button>
          </div>
        </div>
        <nav className="hidden lg:flex px-4 gap-1 pb-1">
          {NAV.filter(n => n.id !== 'audit' || activeRole === 'owner' || activeRole === 'admin').map(n => (
            <button key={n.id} onClick={() => setTab(n.id)}
              className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-colors ${
                tab === n.id ? 'bg-emerald text-bg' : 'text-muted hover:text-text'
              }`}>
              {n.label}
            </button>
          ))}
        </nav>
      </header>

      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-bg/80 backdrop-blur-sm" onClick={() => setMobileNavOpen(false)} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-bg-card border-r border-border p-4 pt-6">
            <p className="text-xs text-muted uppercase tracking-wider mb-4">{gymName}</p>
            <nav className="flex flex-col gap-1">
              {NAV.filter(n => n.id !== 'audit' || activeRole === 'owner' || activeRole === 'admin').map(n => (
                <button key={n.id} onClick={() => { setTab(n.id); setMobileNavOpen(false); }}
                  className={`text-left px-4 py-3 rounded-2xl text-sm font-semibold transition-colors ${
                    tab === n.id ? 'bg-emerald text-bg' : 'text-muted hover:text-text hover:bg-bg'
                  }`}>
                  {n.label}
                </button>
              ))}
            </nav>
            <button onClick={clearAuth}
              className="mt-8 w-full text-left px-4 py-3 rounded-2xl text-sm text-red-400 hover:text-red-300">
              Sign out
            </button>
          </div>
        </div>
      )}

      <main className="flex-1 overflow-y-auto">{renderTab()}</main>
    </div>
  );
}
