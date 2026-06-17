import { useState, useEffect } from "react";
import { C, display, eyebrow } from "./tokens.js";
import api from "./apiClient.js";
import { useAppShell } from "./AppShellContext.js";

export default function ConnectScreen({ connectToken }) {
  const { token } = useAppShell();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.lookupConnect(connectToken)
      .then(d => { if (d.error) setErr('Code not found — ask your trainer for a new one.'); else setInfo(d); })
      .catch(() => setErr('Could not load trainer info'))
      .finally(() => setLoading(false));
  }, [connectToken]);

  async function handleConnect() {
    if (!token) { window.location.href = '/login.html'; return; }
    setActing(true); setErr('');
    try {
      const res = await api.connectToTrainer(token, connectToken);
      if (res.ok || res.error === 'already_connected') setDone(true);
      else if (res.error === 'gym_client_limit_reached') setErr('Deze trainer zit vol. Vraag de trainer om je toe te voegen via het portaal.');
      else setErr(res.error ?? 'Request failed');
    } catch { setErr('Request failed — try again'); }
    finally { setActing(false); }
  }

  const overlay = {
    position: 'fixed', inset: 0, background: C.bg, zIndex: 90,
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: 'max(40px, calc(env(safe-area-inset-top) + 20px)) 24px 48px',
  };
  const card = { width: '100%', maxWidth: 480, borderRadius: 28, background: 'rgba(255,255,255,0.04)', border: `1px solid ${C.border}`, padding: 32 };
  const goHome = () => { window.history.replaceState({}, '', '/'); window.location.href = '/'; };

  if (loading) return (
    <div style={{ ...overlay, gap: 16 }}>
      <div style={{ width: 36, height: 36, border: `3px solid ${C.emeraldBorder}`, borderTopColor: C.emerald, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
    </div>
  );

  if (done) return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ ...display(26, 900), color: C.text, marginBottom: 8 }}>Request sent!</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
          Your connection request to <strong style={{ color: C.text }}>{info?.gym_name ?? 'your trainer'}</strong> has been sent. Your trainer will approve it shortly.
        </div>
        <button onClick={goHome} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
          Go to JustFit →
        </button>
      </div>
    </div>
  );

  return (
    <div style={overlay}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <div style={card}>
        <div style={{ ...eyebrow, color: C.muted, fontSize: 9.5, marginBottom: 8 }}>CONNECT TO TRAINER</div>
        <div style={{ ...display(24, 900), color: C.text, marginBottom: 4, lineHeight: 1.1 }}>{info?.trainer_name ?? 'Trainer'}</div>
        <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700, marginBottom: 20 }}>{info?.gym_name}</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
          Send a connection request to this trainer. They'll approve it and can then view data you choose to share.
        </div>
        {err && <div style={{ fontSize: 13, color: '#f87171', marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button disabled={acting} onClick={handleConnect}
            style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 900, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1 }}>
            {acting ? '…' : 'Send request'}
          </button>
          <button onClick={goHome} style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
