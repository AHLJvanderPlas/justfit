// ClientsView — Person Card grid for all gym clients (P1B)
import { useState, useEffect } from 'react';
import { useGymStore } from '../store/gymStore.ts';
import { api } from '../api/client.ts';
import PersonCard from '../components/PersonCard.tsx';

interface Client {
  user_id: string;
  display_name: string;
  level: string;
  verified: boolean;
  billable: boolean;
  photo_url: string | null;
  has_contraindications: boolean;
  last_session_date: string | null;
  intake_completed: boolean;
  shares: { checkins: boolean; pain_rpe: boolean };
}

export default function ClientsView() {
  const { token, activeGymId } = useGymStore();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<Client | null>(null);

  useEffect(() => {
    if (!token || !activeGymId) return;
    api.getClients(token, activeGymId)
      .then((data) => setClients(data as Client[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token, activeGymId]);

  const filtered = clients.filter(c =>
    !filter || c.display_name.toLowerCase().includes(filter.toLowerCase())
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (selected) return (
    <ClientDetail client={selected} onBack={() => setSelected(null)} />
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-text" style={{ fontFamily: 'var(--font-display)' }}>
          CLIENTS
        </h2>
        <span className="text-muted text-sm font-mono">{clients.length} connected</span>
      </div>

      <input value={filter} onChange={e => setFilter(e.target.value)}
        placeholder="Search clients..."
        className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-text mb-6 focus:outline-none focus:border-emerald" />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">👥</p>
          <p>{filter ? 'No clients match that search.' : 'No clients connected yet.'}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(c => (
            <PersonCard key={c.user_id} client={c} onClick={() => setSelected(c)} />
          ))}
        </div>
      )}
    </div>
  );
}

function ClientDetail({ client, onBack }: { client: Client; onBack: () => void }) {
  const { token, activeGymId } = useGymStore();
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [requesting, setRequesting] = useState(false);

  useEffect(() => {
    if (!token || !activeGymId) return;
    api.getClient(token, activeGymId, client.user_id)
      .then(d => setDetail(d as Record<string, unknown>))
      .catch(console.error);
  }, [token, activeGymId, client.user_id]);

  async function requestBilling() {
    if (!token || !activeGymId) return;
    setRequesting(true);
    try {
      await api.requestUpgrade(token, activeGymId, {
        user_id: client.user_id, target_level: 'L3', reason: 'Needed to send invoice',
      });
      alert('Upgrade request sent to client.');
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Failed');
    } finally { setRequesting(false); }
  }

  const intake = (detail?.intake ?? null) as Record<string, unknown> | null;

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <button onClick={onBack} className="text-muted hover:text-text text-sm mb-4 flex items-center gap-1">
        ← Back to clients
      </button>
      <PersonCard client={client} />

      {!client.billable && (
        <div className="mt-4 p-4 rounded-2xl bg-emerald-dim border border-emerald-border flex items-center justify-between">
          <div>
            <p className="text-text font-semibold text-sm">Billing details not shared</p>
            <p className="text-muted text-xs">Request Level 3 disclosure to send invoices.</p>
          </div>
          <button onClick={requestBilling} disabled={requesting}
            className="text-xs bg-emerald text-bg px-3 py-2 rounded-xl font-semibold disabled:opacity-50">
            {requesting ? '...' : 'Request'}
          </button>
        </div>
      )}

      {intake && (
        <div className="mt-6">
          <h3 className="text-xs text-muted uppercase tracking-wider mb-3">Intake</h3>
          <div className="space-y-3">
            {!!intake.experience_level && (
              <div className="p-3 rounded-2xl bg-bg-card border border-border">
                <p className="text-xs text-muted">Experience</p>
                <p className="text-text capitalize">{String(intake.experience_level)}</p>
              </div>
            )}
            {(intake.injuries as unknown[])?.length ? (
              <div className="p-3 rounded-2xl bg-red-950/20 border border-red-500/20">
                <p className="text-xs text-red-400 uppercase tracking-wider mb-1">Active injuries</p>
                {(intake.injuries as Array<{ area: string; active: boolean }>)
                  .filter(i => i.active)
                  .map((inj, i) => (
                    <p key={i} className="text-text text-sm">{inj.area}</p>
                  ))}
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}
