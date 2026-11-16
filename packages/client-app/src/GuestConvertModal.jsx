// Guest → account conversion. Moved out of App.jsx (F4); lazy.
import { useState, useRef } from "react";
import api from "./apiClient.js";
import { t } from "./i18n.js";
import { useDialog, dialogAttrs } from "./useDialog.js";

// ─── GUEST CONVERT MODAL ──────────────────────────────────────────────────────
export default function GuestConvertModal({ onClose, onConverted }) {
  const dlgRef = useRef(null);
  useDialog(dlgRef, { onClose });
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handle = async () => {
    if (!email || !password) return setError("Email and password required.");
    if (password.length < 8) return setError("Password must be at least 8 characters.");
    setSaving(true);
    setError("");
    try {
      const res = await api.convertGuest(email.trim(), password);
      if (res.ok) {
        onConverted();
      } else {
        setError(res.error ?? "Something went wrong — try again.");
      }
    } catch {
      setError("Network error — check your connection.");
    }
    setSaving(false);
  };

  return (
    <div ref={dlgRef} {...dialogAttrs(t("Keep your data"))} className="jf-gc" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="jf-gc__card">
        <div className="jf-gc__title">Keep your data</div>
        <p className="jf-gc__lead">Add an email and password so you can log back in from any device.</p>

        <input aria-label={t("Email address")}
          type="email"
          inputMode="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          className="jf-gc__input"
        />
        <input aria-label={t("Password")}
          type="password"
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          className={`jf-gc__input${error ? "" : " jf-gc__input--last"}`}
        />
        {error && <div className="jf-gc__error" role="alert">{error}</div>}

        <button onClick={handle} disabled={saving} className="jf-gc__save">
          {saving ? "Saving…" : "Save my account →"}
        </button>
        <button onClick={onClose} className="jf-gc__cancel">Cancel</button>
      </div>
    </div>
  );
}
