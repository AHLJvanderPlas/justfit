import { useState, useEffect } from "react";
import api from "./apiClient.js";
import { useAppShell } from "./AppShellContext.js";
import { t, useLang } from "./i18n.js";

// The FIT-code connect screen (/connect?t=). UAT R4: Dutch first, on the app's fonts
// (classes in styles.css), and honest when the trainer could not be loaded: it shows
// the error and "Probeer opnieuw" instead of a "Send request" button for nobody.
export default function ConnectScreen({ connectToken }) {
  useLang();
  const { token, userId } = useAppShell();
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);
  const [done, setDone] = useState(false);
  const [err, setErr] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let alive = true;
    setLoading(true); setErr(''); setInfo(null);
    api.lookupConnect(connectToken)
      .then(d => { if (!alive) return; if (!d || d.error) setErr(t('Code not found — ask your trainer for a new one.')); else setInfo(d); })
      .catch(() => { if (alive) setErr(t('Could not load trainer info')); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [connectToken, attempt]);

  async function handleConnect() {
    if (!userId) { window.location.href = '/login.html'; return; }
    setActing(true); setErr('');
    try {
      const res = await api.connectToTrainer(token, connectToken);
      if (res.ok || res.error === 'already_connected') setDone(true);
      else if (res.error === 'gym_client_limit_reached') setErr(t('Deze trainer zit vol. Vraag de trainer om je toe te voegen via het portaal.'));
      else setErr(res.error ? t(res.error) : t('Request failed'));
    } catch { setErr(t('Request failed — try again')); }
    finally { setActing(false); }
  }

  const goHome = () => { window.history.replaceState({}, '', '/'); window.location.href = '/'; };
  // Only names the server actually sent; never a stand-in like "your trainer" in a name slot.
  const who = info?.trainer_name || info?.gym_name || '';

  if (loading) return (
    <div className="jf-orphan"><div className="jf-orphan__spin jf-spin" /></div>
  );

  if (done) return (
    <div className="jf-orphan">
      <div className="jf-orphan__card">
        <div className="jf-orphan__title">{t('Request sent!')}</div>
        <div className="jf-orphan__text">
          {who
            ? t('Your connection request to {name} has been sent. Your trainer will approve it shortly.', { name: who })
            : t('Your connection request has been sent. Your trainer will approve it shortly.')}
        </div>
        <button className="jf-orphan__btn" onClick={goHome}>{t('Go to JustFit →')}</button>
      </div>
    </div>
  );

  // The lookup failed: say so, offer another try. No "Send request" for a trainer we could not load.
  if (!info) return (
    <div className="jf-orphan">
      <div className="jf-orphan__card">
        <div className="jf-orphan__eyebrow">{t('CONNECT TO TRAINER')}</div>
        <div className="jf-orphan__title">{t('Could not connect')}</div>
        <div className="jf-orphan__err" role="alert">{err || t('Could not load trainer info')}</div>
        <div className="jf-orphan__row">
          <button className="jf-orphan__btn" onClick={() => setAttempt(a => a + 1)}>{t('Try again')}</button>
          <button className="jf-orphan__btn jf-orphan__btn--ghost" onClick={goHome}>{t('Cancel')}</button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="jf-orphan">
      <div className="jf-orphan__card">
        <div className="jf-orphan__eyebrow">{t('CONNECT TO TRAINER')}</div>
        {info.trainer_name && <div className="jf-orphan__title">{info.trainer_name}</div>}
        {info.gym_name && <div className="jf-orphan__sub">{info.gym_name}</div>}
        <div className="jf-orphan__text">
          {t("Send a connection request to this trainer. They'll approve it and can then view data you choose to share.")}
        </div>
        {err && <div className="jf-orphan__err" role="alert">{err}</div>}
        <div className="jf-orphan__row">
          <button className="jf-orphan__btn" disabled={acting} onClick={handleConnect}>
            {acting ? '…' : t('Send request')}
          </button>
          <button className="jf-orphan__btn jf-orphan__btn--ghost" onClick={goHome}>{t('Cancel')}</button>
        </div>
      </div>
    </div>
  );
}
