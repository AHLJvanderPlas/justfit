import { useState, useEffect } from "react";
import api from "./apiClient.js";
import { useAppShell } from "./AppShellContext.js";
import { t, useLang } from "./i18n.js";

// The trainer-invite screen (/invite?t=). UAT R4: Dutch first, app fonts via the
// .jf-orphan classes in styles.css, and no "your trainer" stand-in in a name slot.
export default function TrainerInviteScreen({ inviteToken }) {
  useLang();
  const { token, userId } = useAppShell();
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
    if (!userId) { window.location.href = '/login.html'; return; }
    setActing(true); setErr('');
    try {
      const res = await api.acceptTrainerInvite(token, inviteToken, action);
      if (res.ok) setDone(action === 'accept' ? 'accepted' : 'declined');
      else if (res.error === 'gym_client_limit_reached') setErr('Deze trainer zit vol. Vraag de trainer om je toe te voegen via het portaal.');
      else setErr(res.error ?? 'Something went wrong');
    } catch { setErr('Request failed — try again'); }
    finally { setActing(false); }
  }

  const goHome = () => { window.history.replaceState({}, '', '/'); window.location.href = '/'; };
  const who = info?.gym_name || info?.trainer_name || '';

  if (loading) return (
    <div className="jf-orphan"><div className="jf-orphan__spin jf-spin" /></div>
  );

  if (done) return (
    <div className="jf-orphan">
      <div className="jf-orphan__card">
        <div className="jf-orphan__icon">{done === 'accepted' ? '✓' : '—'}</div>
        <div className="jf-orphan__title">{done === 'accepted' ? t('Connected!') : t('Declined')}</div>
        <div className="jf-orphan__text">
          {done === 'accepted'
            ? (who
              ? t("You're now connected to {name}. Go to Settings → Trainers to manage data sharing.", { name: who })
              : t("You're now connected. Go to Settings → Trainers to manage data sharing."))
            : t('Invite declined. You can connect at any time via Settings → Trainers.')}
        </div>
        <button className="jf-orphan__btn" onClick={goHome}>{t('Open JustFit →')}</button>
      </div>
    </div>
  );

  if (err && !info) return (
    <div className="jf-orphan">
      <div className="jf-orphan__card">
        <div className="jf-orphan__title">{t('Invite not found')}</div>
        <div className="jf-orphan__text">
          {err === 'Invite not found or expired' ? t('This invite link has expired or already been used.') : t(err)}
        </div>
        <button className="jf-orphan__btn jf-orphan__btn--ghost" onClick={goHome}>{t('Back to JustFit')}</button>
      </div>
    </div>
  );

  if (info?.already_connected) return (
    <div className="jf-orphan">
      <div className="jf-orphan__card">
        <div className="jf-orphan__title">{t('Already connected')}</div>
        <div className="jf-orphan__text">
          {who ? t("You're already connected to {name}.", { name: who }) : t("You're already connected.")}
        </div>
        <button className="jf-orphan__btn" onClick={goHome}>{t('Open JustFit')}</button>
      </div>
    </div>
  );

  return (
    <div className="jf-orphan">
      <div className="jf-orphan__card">
        {info?.trainer_photo_url
          ? <img className="jf-orphan__avatar" src={info.trainer_photo_url} alt="" />
          : <div className="jf-orphan__avatar">👤</div>
        }
        <div className="jf-orphan__eyebrow">{t('TRAINER INVITE')}</div>
        {info?.trainer_name && <div className="jf-orphan__title">{info.trainer_name}</div>}
        {info?.gym_name && <div className="jf-orphan__sub">{info.gym_name}</div>}
        <div className="jf-orphan__text">
          {t('Accepting lets your trainer view the training data you choose to share and send you personalised programming.')}
        </div>
        {err && <div className="jf-orphan__err" role="alert">{t(err)}</div>}
        <div className="jf-orphan__row">
          <button className="jf-orphan__btn" disabled={acting} onClick={() => handleAction('accept')}>
            {acting ? '…' : t('Accept')}
          </button>
          <button className="jf-orphan__btn jf-orphan__btn--ghost" disabled={acting} onClick={() => handleAction('decline')}>
            {t('Decline')}
          </button>
        </div>
      </div>
    </div>
  );
}
