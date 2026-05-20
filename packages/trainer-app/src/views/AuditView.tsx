// AuditView — audit log viewer for gym owners (P1I)
import { useState, useEffect } from 'react';
import { useGymStore } from '../store/gymStore.ts';
import { api } from '../api/client.ts';

interface AuditEntry {
  id: string;
  actor_user_id: string;
  actor_display?: string;
  action: string;
  target_type?: string;
  target_id?: string;
  payload_json?: string;
  ip_address?: string;
  created_at_ms: number;
}

const ACTION_LABELS: Record<string, string> = {
  LOGIN: 'Login',
  GYM_CREATED: 'Gym created',
  GYM_UPDATED: 'Gym updated',
  MEMBER_INVITED: 'Member invited',
  DISCLOSURE_CREATED: 'Disclosure created',
  DISCLOSURE_UPDATED: 'Disclosure updated',
  DISCLOSURE_UPGRADE_REQUESTED: 'Upgrade requested',
  DISCLOSURE_UPGRADE_ACCEPTED: 'Upgrade accepted',
  DISCLOSURE_UPGRADE_DECLINED: 'Upgrade declined',
  INTAKE_SUBMITTED: 'Intake submitted',
  INTAKE_UPDATED: 'Intake updated',
  EXERCISE_CREATED: 'Exercise created',
  EXERCISE_UPDATED: 'Exercise updated',
  EXERCISE_DELETED: 'Exercise deleted',
  PROGRAM_CREATED: 'Program created',
  PROGRAM_UPDATED: 'Program updated',
  PROGRAM_DELETED: 'Program deleted',
  PROGRAM_ASSIGNED: 'Program assigned',
  PROGRAM_ASSIGNMENT_CANCELLED: 'Assignment cancelled',
  SESSION_COMPLETED: 'Session completed',
  WARNING_OVERRIDDEN: 'Warning overridden',
  INVOICE_CREATED: 'Invoice created',
  INVOICE_SENT: 'Invoice sent',
  INVOICE_PAID: 'Invoice paid',
  INVOICE_VOIDED: 'Invoice voided',
  SUPPLIER_INVOICE_CREATED: 'Supplier invoice added',
  SUPPLIER_INVOICE_DELETED: 'Supplier invoice deleted',
  GDPR_EXPORT_REQUESTED: 'GDPR export requested',
  GDPR_DELETE_REQUESTED: 'Delete account requested',
  GDPR_DELETE_CANCELLED: 'Delete account cancelled',
  GDPR_DELETE_EXECUTED: 'Account deleted',
  DPA_ACKNOWLEDGED: 'DPA acknowledged',
};

const ACTION_COLORS: Record<string, string> = {
  LOGIN: 'text-muted',
  GYM_CREATED: 'text-emerald',
  GYM_UPDATED: 'text-sky-400',
  INVOICE_SENT: 'text-emerald',
  INVOICE_PAID: 'text-emerald',
  INVOICE_VOIDED: 'text-red-400',
  GDPR_DELETE_REQUESTED: 'text-amber-400',
  GDPR_DELETE_EXECUTED: 'text-red-400',
  WARNING_OVERRIDDEN: 'text-amber-400',
};

export default function AuditView() {
  const { token, activeGymId, activeRole } = useGymStore();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [cursor, setCursor] = useState<number | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !activeGymId) return;
    setLoading(true);
    api.getAuditLog(token, activeGymId)
      .then((data: any) => {
        setEntries(data.entries ?? []);
        setHasMore(!!data.next_cursor);
        setCursor(data.next_cursor ?? null);
      })
      .finally(() => setLoading(false));
  }, [token, activeGymId]);

  async function loadMore() {
    if (!token || !activeGymId || !cursor) return;
    const data = await api.getAuditLog(token, activeGymId, cursor) as any;
    setEntries(prev => [...prev, ...(data.entries ?? [])]);
    setHasMore(!!data.next_cursor);
    setCursor(data.next_cursor ?? null);
  }

  const filtered = entries.filter(e =>
    !filter ||
    (ACTION_LABELS[e.action] ?? e.action).toLowerCase().includes(filter.toLowerCase()) ||
    (e.actor_display ?? '').toLowerCase().includes(filter.toLowerCase()) ||
    e.action.toLowerCase().includes(filter.toLowerCase())
  );

  if (activeRole !== 'owner' && activeRole !== 'admin') {
    return (
      <div className="p-6 text-center text-muted py-16">
        <p className="text-4xl mb-3">🔒</p>
        <p>Audit log is only available to gym owners.</p>
      </div>
    );
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-text" style={{ fontFamily: 'var(--font-display)' }}>AUDIT LOG</h2>
        <span className="text-muted text-xs font-mono">{entries.length} entries</span>
      </div>

      <input value={filter} onChange={e => setFilter(e.target.value)}
        placeholder="Filter by action or user…"
        className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-text mb-6 focus:outline-none focus:border-emerald" />

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p>{filter ? 'No matching entries.' : 'No audit entries yet.'}</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map(entry => {
            const label = ACTION_LABELS[entry.action] ?? entry.action;
            const color = ACTION_COLORS[entry.action] ?? 'text-text';
            const date = new Date(entry.created_at_ms);
            const isExpanded = expanded === entry.id;
            const payload = entry.payload_json ? (() => {
              try { return JSON.parse(entry.payload_json); } catch { return null; }
            })() : null;

            return (
              <div key={entry.id}
                className="p-3 rounded-2xl bg-bg-card border border-border cursor-pointer hover:border-emerald/20 transition-colors"
                onClick={() => setExpanded(isExpanded ? null : entry.id)}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`text-sm font-semibold flex-shrink-0 ${color}`}>{label}</span>
                    {entry.target_type && (
                      <span className="text-xs text-muted truncate">
                        {entry.target_type}{entry.target_id ? ` · ${entry.target_id.slice(0, 8)}` : ''}
                      </span>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs text-muted font-mono">
                      {date.toLocaleString('nl-NL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </p>
                    {entry.actor_display && <p className="text-xs text-muted">{entry.actor_display}</p>}
                  </div>
                </div>

                {isExpanded && payload && (
                  <div className="mt-2 pt-2 border-t border-border">
                    <pre className="text-xs text-muted font-mono whitespace-pre-wrap break-all">
                      {JSON.stringify(payload, null, 2)}
                    </pre>
                    {entry.ip_address && (
                      <p className="text-xs text-muted mt-1">IP: {entry.ip_address}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {hasMore && (
        <div className="mt-4 text-center">
          <button onClick={loadMore}
            className="text-sm text-muted hover:text-text px-4 py-2 rounded-xl border border-border">
            Load more
          </button>
        </div>
      )}
    </div>
  );
}
