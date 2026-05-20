// InvoicesView — full invoice lifecycle: list, create, send, void (P1G)
import { useState, useEffect } from 'react';
import { useGymStore } from '../store/gymStore.ts';
import { api } from '../api/client.ts';

interface InvoiceLine {
  description: string;
  quantity: number;
  unit_price: number;
  btw_rate: number;
}

interface Invoice {
  id: string;
  invoice_number?: string;
  status: 'draft' | 'sent' | 'paid' | 'void';
  client_user_id: string;
  client_name?: string;
  issue_date: string;
  due_date: string;
  lines_json: string;
  notes?: string;
  mollie_payment_url?: string;
  created_at_ms: number;
}

const BLANK_FORM = {
  client_user_id: '',
  issue_date: new Date().toISOString().slice(0, 10),
  due_date: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10),
  lines: [{ description: '', quantity: 1, unit_price: 0, btw_rate: 21 }] as InvoiceLine[],
  notes: '',
  payment_terms_days: 30,
};

const STATUS_COLORS: Record<string, string> = {
  draft: 'text-muted border-border',
  sent: 'text-sky-400 border-sky-500/30',
  paid: 'text-emerald border-emerald/30',
  void: 'text-red-400 border-red-500/20',
};

function calcTotals(lines: InvoiceLine[]) {
  let excl = 0, btw = 0;
  for (const l of lines) {
    const sub = l.quantity * l.unit_price;
    excl += sub;
    btw += sub * (l.btw_rate / 100);
  }
  return { excl, btw, incl: excl + btw };
}

export default function InvoicesView() {
  const { token, activeGymId } = useGymStore();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<{ user_id: string; display_name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState({ ...BLANK_FORM, lines: [{ ...BLANK_FORM.lines[0] }] });
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token || !activeGymId) return;
    Promise.all([
      api.getInvoices(token, activeGymId),
      api.getClients(token, activeGymId),
    ]).then(([inv, cl]) => {
      setInvoices(inv as Invoice[]);
      setClients((cl as { user_id: string; display_name: string }[]).filter(c => (c as any).billable));
    }).finally(() => setLoading(false));
  }, [token, activeGymId]);

  function openNew() {
    setForm({ ...BLANK_FORM, lines: [{ ...BLANK_FORM.lines[0] }] });
    setEditing(null);
    setShowForm(true);
    setError('');
  }

  function openEdit(inv: Invoice) {
    const lines: InvoiceLine[] = inv.lines_json ? JSON.parse(inv.lines_json) : [{ description: '', quantity: 1, unit_price: 0, btw_rate: 21 }];
    setForm({
      client_user_id: inv.client_user_id,
      issue_date: inv.issue_date,
      due_date: inv.due_date,
      lines,
      notes: inv.notes ?? '',
      payment_terms_days: 30,
    });
    setEditing(inv.id);
    setShowForm(true);
    setError('');
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !activeGymId) return;
    setSaving(true); setError('');
    try {
      const payload = { ...form, lines_json: JSON.stringify(form.lines) };
      if (editing) {
        await api.updateInvoice(token, activeGymId, editing, payload);
      } else {
        await api.createInvoice(token, activeGymId, payload);
      }
      const data = await api.getInvoices(token, activeGymId);
      setInvoices(data as Invoice[]);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleSend(id: string) {
    if (!token || !activeGymId) return;
    setSending(id); setError('');
    try {
      const result = await api.sendInvoice(token, activeGymId, id) as any;
      if (result?.payment_url) {
        window.open(result.payment_url, '_blank');
      }
      const data = await api.getInvoices(token, activeGymId);
      setInvoices(data as Invoice[]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Send failed');
    } finally { setSending(null); }
  }

  async function handleVoid(id: string) {
    if (!token || !activeGymId || !confirm('Void this invoice? This cannot be undone.')) return;
    try {
      await api.voidInvoice(token, activeGymId, id);
      setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: 'void' } : i));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to void');
    }
  }

  function setLine(idx: number, key: keyof InvoiceLine, value: string | number) {
    setForm(f => {
      const lines = f.lines.map((l, i) => i === idx ? { ...l, [key]: value } : l);
      return { ...f, lines };
    });
  }

  function addLine() {
    setForm(f => ({ ...f, lines: [...f.lines, { description: '', quantity: 1, unit_price: 0, btw_rate: 21 }] }));
  }

  function removeLine(idx: number) {
    setForm(f => ({ ...f, lines: f.lines.filter((_, i) => i !== idx) }));
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const totals = calcTotals(form.lines);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-text" style={{ fontFamily: 'var(--font-display)' }}>INVOICES</h2>
        <button onClick={openNew} className="bg-emerald text-bg px-4 py-2 rounded-xl font-semibold text-sm">+ New</button>
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}

      {showForm && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-dvh flex items-start justify-center p-4 pt-10">
            <form onSubmit={handleSave} className="w-full max-w-2xl bg-bg-card border border-border rounded-3xl p-6 space-y-5">
              <h3 className="font-black text-text text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                {editing ? 'EDIT INVOICE' : 'NEW INVOICE'}
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Client *</label>
                  <select value={form.client_user_id} onChange={e => setForm(f => ({ ...f, client_user_id: e.target.value }))}
                    required className="input">
                    <option value="">Select client…</option>
                    {clients.map(c => <option key={c.user_id} value={c.user_id}>{c.display_name}</option>)}
                  </select>
                  {clients.length === 0 && (
                    <p className="text-xs text-amber-400 mt-1">No billable clients. Client must share Level 3 data.</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Issue date *</label>
                  <input type="date" value={form.issue_date} onChange={e => setForm(f => ({ ...f, issue_date: e.target.value }))}
                    required className="input" />
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Due date *</label>
                  <input type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                    required className="input" />
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Payment terms (days)</label>
                  <input type="number" min={1} max={90} value={form.payment_terms_days}
                    onChange={e => setForm(f => ({ ...f, payment_terms_days: parseInt(e.target.value) }))}
                    className="input" />
                </div>
              </div>

              {/* Line items */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs text-muted uppercase tracking-wider">Line items</label>
                  <button type="button" onClick={addLine} className="text-xs text-emerald hover:text-emerald/80">+ Add line</button>
                </div>
                <div className="space-y-2">
                  {form.lines.map((line, idx) => (
                    <div key={idx} className="grid grid-cols-12 gap-2 items-center">
                      <input value={line.description} onChange={e => setLine(idx, 'description', e.target.value)}
                        placeholder="Description" required className="input col-span-5 text-sm" />
                      <input type="number" min={1} value={line.quantity} onChange={e => setLine(idx, 'quantity', parseFloat(e.target.value))}
                        className="input col-span-2 text-sm text-right" />
                      <input type="number" min={0} step={0.01} value={line.unit_price}
                        onChange={e => setLine(idx, 'unit_price', parseFloat(e.target.value))}
                        className="input col-span-2 text-sm text-right" placeholder="€" />
                      <select value={line.btw_rate} onChange={e => setLine(idx, 'btw_rate', parseFloat(e.target.value))}
                        className="input col-span-2 text-sm">
                        {[0, 9, 21].map(r => <option key={r} value={r}>{r}%</option>)}
                      </select>
                      <button type="button" onClick={() => removeLine(idx)}
                        className="col-span-1 text-red-400 hover:text-red-300 text-center">×</button>
                    </div>
                  ))}
                </div>
                <div className="mt-3 text-right space-y-1 text-sm">
                  <p className="text-muted">Excl. BTW: <span className="text-text font-mono">€{totals.excl.toFixed(2)}</span></p>
                  <p className="text-muted">BTW: <span className="text-text font-mono">€{totals.btw.toFixed(2)}</span></p>
                  <p className="text-text font-semibold">Total: <span className="font-mono">€{totals.incl.toFixed(2)}</span></p>
                </div>
              </div>

              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Notes</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={2} className="input text-sm" />
              </div>

              {error && <p className="text-red-400 text-sm">{error}</p>}

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)}
                  className="flex-1 py-3 rounded-2xl border border-border text-muted hover:text-text text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={saving}
                  className="flex-1 py-3 rounded-2xl bg-emerald text-bg font-black text-sm disabled:opacity-50"
                  style={{ fontFamily: 'var(--font-display)' }}>
                  {saving ? '...' : 'SAVE'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {invoices.length === 0 ? (
        <div className="text-center py-16 text-muted">
          <p className="text-4xl mb-3">🧾</p>
          <p>No invoices yet. Create your first one.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => {
            const lines: InvoiceLine[] = inv.lines_json ? JSON.parse(inv.lines_json) : [];
            const { incl } = calcTotals(lines);
            return (
              <div key={inv.id} className="p-4 rounded-2xl bg-bg-card border border-border">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-text font-semibold text-sm">
                        {inv.invoice_number ?? 'DRAFT'}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-lg border ${STATUS_COLORS[inv.status] ?? 'text-muted border-border'}`}>
                        {inv.status}
                      </span>
                      <span className="text-xs text-muted">{inv.client_name ?? inv.client_user_id.slice(0, 8)}</span>
                    </div>
                    <p className="text-xs text-muted mt-0.5">
                      {inv.issue_date} · <span className="font-mono text-text">€{incl.toFixed(2)}</span>
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {inv.status === 'draft' && (
                      <>
                        <button onClick={() => openEdit(inv)}
                          className="text-xs text-muted hover:text-text px-3 py-1 rounded-lg border border-border">
                          Edit
                        </button>
                        <button onClick={() => handleSend(inv.id)} disabled={sending === inv.id}
                          className="text-xs bg-emerald text-bg px-3 py-1 rounded-lg font-semibold disabled:opacity-50">
                          {sending === inv.id ? '...' : 'Send'}
                        </button>
                      </>
                    )}
                    {inv.status === 'sent' && (
                      <>
                        {inv.mollie_payment_url && (
                          <a href={inv.mollie_payment_url} target="_blank" rel="noreferrer"
                            className="text-xs text-sky-400 hover:text-sky-300 px-3 py-1 rounded-lg border border-sky-500/20">
                            Pay link
                          </a>
                        )}
                        <button onClick={() => handleVoid(inv.id)}
                          className="text-xs text-red-400 hover:text-red-300 px-3 py-1 rounded-lg border border-red-500/20">
                          Void
                        </button>
                      </>
                    )}
                    {inv.status === 'paid' && (
                      <span className="text-xs text-emerald px-3 py-1">✓ Paid</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
