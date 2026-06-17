import { useState, useEffect } from "react";
import { C, display, eyebrow } from "./tokens.js";
import api from "./apiClient.js";
import { useAppShell } from "./AppShellContext.js";

export default function TrainerInviteScreen({ inviteToken }) {
  const { token } = useAppShell();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [done, setDone] = useState(null); // 'accepted' | 'declined'
  const [err, setErr] = useState('');

  useEffect(() => {
    api.lookupTrainerInvite(inviteToken)
      .then(d => { if (d.error) setErr(d.error); else setInfo(d); })
      .catch(() => setErr('Could not load invite'))
      .finally(() => setLoading(false));
  }, [inviteToken]);

  async function handleAction(action) {
    if (!token) { window.location.href = '/login.html'; return; }
    setActing(true); setErr('');
    try {
      const res = await api.acceptTrainerInvite(token, inviteToken, action);
      if (res.ok) setDone(action === 'accept' ? 'accepted' : 'declined');
      else if (res.error === 'gym_client_limit_reached') setErr('Deze trainer zit vol. Vraag de trainer om je toe te voegen via het portaal.');
      else setErr(res.error ?? 'Something went wrong');
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
        <div style={{ fontSize: 36, marginBottom: 12 }}>{done === 'accepted' ? '✓' : '—'}</div>
        <div style={{ ...display(26, 900), color: C.text, marginBottom: 8 }}>
          {done === 'accepted' ? 'Connected!' : 'Declined'}
        </div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
          {done === 'accepted'
            ? `You're now connected to ${info?.gym_name ?? 'your trainer'}. Go to Settings → Trainers to manage data sharing.`
            : 'Invite declined. You can connect at any time via Settings → Trainers.'}
        </div>
        <button onClick={goHome} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 900, fontSize: 14, cursor: 'pointer' }}>
          Open JustFit →
        </button>
      </div>
    </div>
  );

  if (err && !info) return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ ...display(22, 900), color: C.text, marginBottom: 8 }}>Invite not found</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
          {err === 'Invite not found or expired' ? 'This invite link has expired or already been used.' : err}
        </div>
        <button onClick={goHome} style={{ padding: '12px 24px', borderRadius: 14, background: 'rgba(255,255,255,0.06)', border: `1px solid ${C.border}`, color: C.text, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Back to JustFit
        </button>
      </div>
    </div>
  );

  if (info?.already_connected) return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ ...display(22, 900), color: C.text, marginBottom: 8 }}>Already connected</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24 }}>You're already connected to {info.gym_name}.</div>
        <button onClick={goHome} style={{ padding: '12px 24px', borderRadius: 14, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}>
          Open JustFit
        </button>
      </div>
    </div>
  );

  return (
    <div style={overlay}>
      <style>{'@keyframes spin { to { transform: rotate(360deg); } }'}</style>
      <div style={card}>
        {info?.trainer_photo_url
          ? <img src={info.trainer_photo_url} alt="" style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', marginBottom: 16, border: `2px solid ${C.emeraldBorder}` }} />
          : <div style={{ width: 56, height: 56, borderRadius: '50%', background: C.emeraldDim, border: `2px solid ${C.emeraldBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, fontSize: 22 }}>👤</div>
        }
        <div style={{ ...eyebrow, color: C.muted, fontSize: 9.5, marginBottom: 8 }}>TRAINER INVITE</div>
        <div style={{ ...display(28, 900), color: C.text, marginBottom: 4, lineHeight: 1.1 }}>{info?.trainer_name ?? 'Your trainer'}</div>
        <div style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 700, marginBottom: 20 }}>{info?.gym_name}</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 28, lineHeight: 1.6 }}>
          Accepting lets your trainer view the training data you choose to share and send you personalised programming.
        </div>
        {err && <div style={{ fontSize: 13, color: '#f87171', marginBottom: 14 }}>{err}</div>}
        <div style={{ display: 'flex', gap: 10 }}>
          <button disabled={acting} onClick={() => handleAction('accept')}
            style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 900, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1 }}>
            {acting ? '…' : 'Accept'}
          </button>
          <button disabled={acting} onClick={() => handleAction('decline')}
            style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1 }}>
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}
