// BtwView — BTW (VAT) dashboard: quarterly summary, supplier invoices, export (P1H)
import { useState, useEffect } from 'react';
import { useGymStore } from '../store/gymStore.ts';
import { api } from '../api/client.ts';

interface QuarterSummary {
  quarter: number;
  year: number;
  revenue_excl_btw: number;
  output_btw_21: number;
  output_btw_9: number;
  output_btw_0: number;
  input_btw: number;
  net_btw_position: number;
}

interface SupplierInvoice {
  id: string;
  supplier_name: string;
  invoice_date: string;
  description: string;
  amount_excl_btw: number;
  btw_amount: number;
  btw_rate: number;
}

const BLANK_SUPPLIER = {
  supplier_name: '',
  invoice_date: new Date().toISOString().slice(0, 10),
  description: '',
  invoice_number_supplier: '',
  amount_excl_btw: 0,
  btw_amount: 0,
  btw_rate: 21,
};

function currentQuarter() {
  const m = new Date().getMonth();
  return Math.floor(m / 3) + 1;
}

export default function BtwView() {
  const { token, activeGymId, gym } = useGymStore();
  const year = new Date().getFullYear();
  const [quarter, setQuarter] = useState(currentQuarter());
  const [summary, setSummary] = useState<QuarterSummary | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierInvoice[]>([]);
  const [loadingSum, setLoadingSum] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [supplierForm, setSupplierForm] = useState({ ...BLANK_SUPPLIER });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (!token || !activeGymId) return;
    setLoadingSum(true);
    Promise.all([
      api.getBtwQuarter(token, activeGymId, year, quarter),
      api.getSupplierInvoices(token, activeGymId, year, quarter),
    ]).then(([s, si]) => {
      setSummary(s as QuarterSummary);
      setSuppliers(si as SupplierInvoice[]);
    }).finally(() => setLoadingSum(false));
  }, [token, activeGymId, year, quarter]);

  async function handleSaveSupplier(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !activeGymId) return;
    setSaving(true); setError('');
    try {
      await api.createSupplierInvoice(token, activeGymId, supplierForm);
      const si = await api.getSupplierInvoices(token, activeGymId, year, quarter);
      setSuppliers(si as SupplierInvoice[]);
      // refresh summary
      const s = await api.getBtwQuarter(token, activeGymId, year, quarter);
      setSummary(s as QuarterSummary);
      setShowForm(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setSaving(false); }
  }

  async function handleDeleteSupplier(id: string) {
    if (!token || !activeGymId || !confirm('Delete this supplier invoice?')) return;
    await api.deleteSupplierInvoice(token, activeGymId, id);
    setSuppliers(prev => prev.filter(s => s.id !== id));
    const s = await api.getBtwQuarter(token, activeGymId, year, quarter);
    setSummary(s as QuarterSummary);
  }

  async function handleExport(format: 'csv' | 'pdf') {
    if (!token || !activeGymId) return;
    setExporting(true);
    try {
      const blob = await api.exportBtw(token, activeGymId, year, quarter, format);
      const url = URL.createObjectURL(blob as Blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `btw-${year}-q${quarter}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Export failed');
    } finally { setExporting(false); }
  }

  const korActive = gym?.kor_active;

  return (
    <div className="p-6 max-w-3xl">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-black text-text" style={{ fontFamily: 'var(--font-display)' }}>BTW</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4].map(q => (
            <button key={q} onClick={() => setQuarter(q)}
              className={`w-10 h-10 rounded-xl text-sm font-semibold transition-colors ${quarter === q ? 'bg-emerald text-bg' : 'bg-bg-card text-muted border border-border hover:text-text'}`}>
              Q{q}
            </button>
          ))}
        </div>
      </div>

      {korActive && (
        <div className="mb-6 p-4 rounded-2xl bg-emerald-dim border border-emerald-border">
          <p className="text-emerald text-sm font-semibold">KOR active — no BTW on sales</p>
          <p className="text-muted text-xs mt-0.5">Kleineondernemersregeling. Input BTW tracked for deduction purposes.</p>
        </div>
      )}

      {/* Quarterly summary */}
      {loadingSum ? (
        <div className="flex items-center justify-center h-32">
          <div className="w-6 h-6 border-2 border-emerald border-t-transparent rounded-full animate-spin" />
        </div>
      ) : summary ? (
        <div className="mb-8">
          <p className="text-xs text-muted uppercase tracking-wider mb-3">
            {year} Q{quarter} — Belastingdienst Aangifte Omzetbelasting
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            <MetricCard label="Omzet excl. BTW" value={`€${summary.revenue_excl_btw.toFixed(2)}`} />
            <MetricCard label="Rubriek 1a (21%)" value={`€${summary.output_btw_21.toFixed(2)}`} />
            <MetricCard label="Rubriek 1b (9%)" value={`€${summary.output_btw_9.toFixed(2)}`} />
            <MetricCard label="Rubriek 1c (0%)" value={`€${summary.output_btw_0.toFixed(2)}`} dim />
            <MetricCard label="Rubriek 5b (input)" value={`€${summary.input_btw.toFixed(2)}`} />
            <MetricCard
              label="Te betalen / terug"
              value={`€${Math.abs(summary.net_btw_position).toFixed(2)}`}
              accent={summary.net_btw_position > 0 ? 'red' : 'emerald'}
              sub={summary.net_btw_position > 0 ? 'te betalen' : 'teruggaaf'}
            />
          </div>
          <p className="text-xs text-muted italic">
            Indicatief. Controleer altijd in Mijn Belastingdienst Zakelijk voor indiening.
          </p>

          <div className="flex gap-2 mt-4">
            <button onClick={() => handleExport('csv')} disabled={exporting}
              className="text-sm px-4 py-2 rounded-xl bg-bg-card border border-border text-text hover:border-emerald/40 disabled:opacity-50">
              {exporting ? '...' : '↓ CSV (Moneybird)'}
            </button>
            <button onClick={() => handleExport('pdf')} disabled={exporting}
              className="text-sm px-4 py-2 rounded-xl bg-bg-card border border-border text-text hover:border-emerald/40 disabled:opacity-50">
              {exporting ? '...' : '↓ PDF Aangifte'}
            </button>
          </div>
        </div>
      ) : null}

      {/* Supplier invoices */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm text-muted uppercase tracking-wider">Inkoopfacturen Q{quarter}</h3>
        <button onClick={() => { setSupplierForm({ ...BLANK_SUPPLIER }); setShowForm(true); setError(''); }}
          className="text-xs text-emerald hover:text-emerald/80">+ Add</button>
      </div>

      {error && <p className="text-red-400 text-sm mb-3">{error}</p>}

      {showForm && (
        <div className="fixed inset-0 bg-bg/80 backdrop-blur-sm z-50 overflow-y-auto">
          <div className="min-h-dvh flex items-start justify-center p-4 pt-10">
            <form onSubmit={handleSaveSupplier} className="w-full max-w-lg bg-bg-card border border-border rounded-3xl p-6 space-y-4">
              <h3 className="font-black text-text text-xl" style={{ fontFamily: 'var(--font-display)' }}>
                INKOOPFACTUUR
              </h3>
              {[
                { label: 'Leverancier *', key: 'supplier_name', type: 'text', required: true },
                { label: 'Datum *', key: 'invoice_date', type: 'date', required: true },
                { label: 'Omschrijving', key: 'description', type: 'text' },
                { label: 'Factuurnummer leverancier', key: 'invoice_number_supplier', type: 'text' },
              ].map(({ label, key, type, required }) => (
                <div key={key}>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1 block">{label}</label>
                  <input type={type} value={(supplierForm as any)[key]} required={required}
                    onChange={e => setSupplierForm(f => ({ ...f, [key]: e.target.value }))}
                    className="input" />
                </div>
              ))}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Bedrag excl. BTW *</label>
                  <input type="number" min={0} step={0.01} value={supplierForm.amount_excl_btw} required
                    onChange={e => setSupplierForm(f => ({ ...f, amount_excl_btw: parseFloat(e.target.value) }))}
                    className="input" />
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1 block">BTW bedrag *</label>
                  <input type="number" min={0} step={0.01} value={supplierForm.btw_amount} required
                    onChange={e => setSupplierForm(f => ({ ...f, btw_amount: parseFloat(e.target.value) }))}
                    className="input" />
                </div>
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1 block">BTW %</label>
                  <select value={supplierForm.btw_rate} onChange={e => setSupplierForm(f => ({ ...f, btw_rate: parseInt(e.target.value) }))}
                    className="input">
                    {[0, 9, 21].map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
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

      {suppliers.length === 0 ? (
        <p className="text-muted text-sm py-4 text-center">Geen inkoopfacturen dit kwartaal.</p>
      ) : (
        <div className="space-y-2">
          {suppliers.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-2xl bg-bg-card border border-border">
              <div>
                <p className="text-text text-sm font-semibold">{s.supplier_name}</p>
                <p className="text-xs text-muted">{s.invoice_date} · {s.description}</p>
              </div>
              <div className="text-right">
                <p className="text-text text-sm font-mono">€{(s.amount_excl_btw + s.btw_amount).toFixed(2)}</p>
                <p className="text-xs text-muted">BTW €{s.btw_amount.toFixed(2)} ({s.btw_rate}%)</p>
              </div>
              <button onClick={() => handleDeleteSupplier(s.id)}
                className="ml-3 text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded-lg border border-red-500/20">
                Del
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, sub, accent, dim }: {
  label: string; value: string; sub?: string;
  accent?: 'red' | 'emerald'; dim?: boolean;
}) {
  const valueClass = accent === 'red' ? 'text-red-400' : accent === 'emerald' ? 'text-emerald' : dim ? 'text-muted' : 'text-text';
  return (
    <div className="p-3 rounded-2xl bg-bg-card border border-border">
      <p className="text-xs text-muted mb-1">{label}</p>
      <p className={`text-lg font-mono font-semibold ${valueClass}`}>{value}</p>
      {sub && <p className="text-xs text-muted">{sub}</p>}
    </div>
  );
}
