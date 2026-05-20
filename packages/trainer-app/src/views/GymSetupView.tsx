// GymSetupView — first-time gym setup when no gym exists yet (P1A)
import { useState } from 'react';
import { useGymStore } from '../store/gymStore.ts';
import { api } from '../api/client.ts';

export default function GymSetupView() {
  const { token, activeGymId, gym, setGym } = useGymStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    name: gym?.name ?? '',
    kvk_number: gym?.kvk_number ?? '',
    vat_number: gym?.vat_number ?? '',
    iban: gym?.iban ?? '',
    street: '',
    city: '',
    postal: '',
    country: 'NL',
    kor_active: gym?.kor_active ?? false,
  });

  function set(field: string, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }));
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!token || !activeGymId) return;
    setLoading(true); setError('');
    try {
      await api.updateGym(token, activeGymId, {
        name: form.name,
        kvk_number: form.kvk_number || null,
        vat_number: form.vat_number || null,
        iban: form.iban || null,
        address: { street: form.street, city: form.city, postal: form.postal, country: form.country },
        kor_active: form.kor_active,
      });
      const updated = await api.getGym(token, activeGymId) as typeof gym;
      if (updated) setGym(updated);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh bg-bg px-4 py-10">
      <div className="max-w-lg mx-auto">
        <h1 className="text-4xl font-black text-text mb-2" style={{ fontFamily: 'var(--font-display)' }}>
          PRACTICE SETTINGS
        </h1>
        <p className="text-muted text-sm mb-8">Set up your practice details for invoicing and NL tax compliance.</p>

        <form onSubmit={handleSave} className="space-y-5">
          {[
            { label: 'Practice name', key: 'name', required: true },
            { label: 'KVK number', key: 'kvk_number' },
            { label: 'BTW number', key: 'vat_number', hint: 'Leave blank if KOR applies' },
            { label: 'IBAN', key: 'iban', hint: 'For payment details on invoices' },
          ].map(({ label, key, required, hint }) => (
            <div key={key}>
              <label className="text-xs text-muted uppercase tracking-wider mb-1 block">
                {label}{required && ' *'}
              </label>
              <input value={(form as Record<string, string | boolean>)[key] as string}
                onChange={e => set(key, e.target.value)}
                required={required}
                className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-emerald transition-colors" />
              {hint && <p className="text-xs text-muted mt-1">{hint}</p>}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Street</label>
              <input value={form.street} onChange={e => set('street', e.target.value)}
                className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-emerald" />
            </div>
            <div>
              <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Postal code</label>
              <input value={form.postal} onChange={e => set('postal', e.target.value)}
                className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-emerald" />
            </div>
          </div>
          <div>
            <label className="text-xs text-muted uppercase tracking-wider mb-1 block">City</label>
            <input value={form.city} onChange={e => set('city', e.target.value)}
              className="w-full bg-bg-card border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-emerald" />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl bg-bg-card border border-border">
            <input type="checkbox" checked={form.kor_active} onChange={e => set('kor_active', e.target.checked)}
              className="w-5 h-5 accent-emerald" />
            <div>
              <p className="text-text font-semibold text-sm">KOR active</p>
              <p className="text-muted text-xs">Kleineondernemersregeling — no BTW on sales</p>
            </div>
          </label>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" disabled={loading}
            className="w-full bg-emerald text-bg font-black py-3 rounded-2xl disabled:opacity-50"
            style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
            {loading ? 'SAVING...' : 'SAVE SETTINGS'}
          </button>
        </form>
      </div>
    </div>
  );
}
