// LoginView — magic link + password login for trainer portal (P1A)
import { useState } from 'react';
import { useGymStore } from '../store/gymStore.ts';
import { api } from '../api/client.ts';

export default function LoginView() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState<'magic' | 'password'>('magic');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { setAuth } = useGymStore();

  async function handleMagic(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      await api.magicLink(email);
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send magic link');
    } finally { setLoading(false); }
  }

  async function handlePassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await api.login(email, password) as { token: string; userId: string; memberships?: [] };
      setAuth(res.token, res.userId, res.memberships ?? []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid email or password');
    } finally { setLoading(false); }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-black tracking-wide text-emerald"
              style={{ fontFamily: 'var(--font-display)' }}>JUSTFIT</h1>
          <p className="text-muted text-sm mt-1">Trainer Portal</p>
        </div>

        {sent ? (
          <div className="text-center p-8 rounded-3xl bg-bg-card border border-border">
            <div className="text-4xl mb-4">📬</div>
            <p className="text-text font-semibold">Check your inbox</p>
            <p className="text-muted text-sm mt-2">We sent a login link to <strong>{email}</strong></p>
            <button onClick={() => setSent(false)} className="mt-6 text-sm text-muted underline">
              Use a different email
            </button>
          </div>
        ) : (
          <div className="rounded-3xl bg-bg-card border border-border p-8">
            <div className="flex gap-2 mb-6">
              {(['magic', 'password'] as const).map(m => (
                <button key={m} onClick={() => setMode(m)}
                  className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${
                    mode === m ? 'bg-emerald text-bg' : 'text-muted hover:text-text'}`}>
                  {m === 'magic' ? 'Magic link' : 'Password'}
                </button>
              ))}
            </div>

            <form onSubmit={mode === 'magic' ? handleMagic : handlePassword} className="space-y-4">
              <div>
                <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-emerald transition-colors"
                  placeholder="trainer@example.com" />
              </div>
              {mode === 'password' && (
                <div>
                  <label className="text-xs text-muted uppercase tracking-wider mb-1 block">Password</label>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
                    className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-text focus:outline-none focus:border-emerald transition-colors"
                    placeholder="••••••••" />
                </div>
              )}
              {error && <p className="text-red-400 text-sm">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full bg-emerald text-bg font-black py-3 rounded-2xl disabled:opacity-50 transition-opacity"
                style={{ fontFamily: 'var(--font-display)', letterSpacing: '0.05em' }}>
                {loading ? '...' : mode === 'magic' ? 'SEND MAGIC LINK' : 'SIGN IN'}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
