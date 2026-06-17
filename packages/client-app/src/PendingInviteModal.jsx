import { useState, useEffect } from "react";
import { C, display, eyebrow } from "./tokens.js";
import api from "./apiClient.js";
import { useAppShell } from "./AppShellContext.js";

export default function PendingInviteModal({ inviteToken, onDone }) {
  const { token } = useAppShell();
  const [info, setInfo] = useState(null);
  const [acting, setActing] = useState(false);

  useEffect(() => {
    api.lookupTrainerInvite(inviteToken)
      .then(d => { if (!d.error) setInfo(d); else onDone(); })
      .catch(onDone);
  // onDone is stable (defined inline by parent) — intentionally excluded from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inviteToken]);

  if (!info) return null;

  async function handleAction(action) {
    setActing(true);
    try { await api.acceptTrainerInvite(token, inviteToken, action); } catch (e) { console.error('invite action failed', e); }
    onDone();
  }

  const overlay = {
    position: 'fixed', inset: 0, background: 'rgba(2,6,23,0.85)', zIndex: 95, backdropFilter: 'blur(4px)',
    display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 env(safe-area-inset-bottom,0)',
  };
  const sheet = { width: '100%', maxWidth: 520, background: C.bg, borderRadius: '24px 24px 0 0', border: `1px solid ${C.border}`, borderBottom: 'none', padding: '28px 28px 40px' };

  return (
    <div style={overlay} onClick={e => e.target === e.currentTarget && onDone()}>
      <div style={sheet}>
        <div style={{ ...eyebrow, color: C.muted, fontSize: 9.5, marginBottom: 12 }}>TRAINER INVITE</div>
        <div style={{ ...display(22, 900), color: C.text, marginBottom: 4 }}>Connect to {info.trainer_name}?</div>
        <div style={{ fontSize: 14, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
          {info.trainer_name} at <strong style={{ color: C.text }}>{info.gym_name}</strong> invited you to JustFit. Accept to share your training data and receive personalised programming.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button disabled={acting} onClick={() => handleAction('accept')}
            style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: C.emeraldDim, border: `1px solid ${C.emeraldBorder}`, color: C.emerald, fontWeight: 900, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1 }}>
            {acting ? '…' : 'Accept'}
          </button>
          <button disabled={acting} onClick={() => handleAction('decline')}
            style={{ flex: 1, padding: '14px 0', borderRadius: 14, background: 'transparent', border: `1px solid ${C.border}`, color: C.muted, fontWeight: 700, fontSize: 14, cursor: acting ? 'not-allowed' : 'pointer', opacity: acting ? 0.6 : 1 }}>
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
