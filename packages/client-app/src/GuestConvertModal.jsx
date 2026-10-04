// Guest → account conversion. Moved out of App.jsx (F4); lazy.
import { useState } from "react";
import { C } from "./tokens.js";
import api from "./apiClient.js";

// ─── GUEST CONVERT MODAL ──────────────────────────────────────────────────────
export default function GuestConvertModal({ onClose, onConverted }) {
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
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(0,0,0,0.65)" }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{ width: "100%", maxWidth: 420, background: C.sheet, border: `1px solid ${C.border}`, borderRadius: 24, padding: 32 }}>
        <div style={{ fontSize: 20, fontWeight: 900, letterSpacing: "-0.02em", color: C.text, marginBottom: 6 }}>Keep your data</div>
        <p style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.5 }}>Add an email and password so you can log back in from any device.</p>

        <input
          type="email"
          placeholder="Email address"
          value={email}
          onChange={e => setEmail(e.target.value)}
          autoComplete="email"
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(var(--overlay-rgb),0.04)", color: C.text, fontSize: 14, fontFamily: "inherit", marginBottom: 10, outline: "none" }}
        />
        <input
          type="password"
          placeholder="Password (min. 8 characters)"
          value={password}
          onChange={e => setPassword(e.target.value)}
          autoComplete="new-password"
          style={{ width: "100%", boxSizing: "border-box", padding: "12px 14px", borderRadius: 14, border: `1px solid ${C.border}`, background: "rgba(var(--overlay-rgb),0.04)", color: C.text, fontSize: 14, fontFamily: "inherit", marginBottom: error ? 10 : 20, outline: "none" }}
        />
        {error && <div style={{ fontSize: 12, color: C.danger, marginBottom: 16 }}>{error}</div>}

        <button
          onClick={handle}
          disabled={saving}
          style={{ width: "100%", padding: "14px 0", borderRadius: 16, fontSize: 15, fontWeight: 900, background: C.emerald, border: "none", color: C.onAccent, cursor: saving ? "not-allowed" : "pointer", marginBottom: 10, opacity: saving ? 0.7 : 1 }}
        >
          {saving ? "Saving…" : "Save my account →"}
        </button>
        <button onClick={onClose} style={{ width: "100%", padding: "12px 0", borderRadius: 14, fontSize: 13, fontWeight: 700, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer" }}>Cancel</button>
      </div>
    </div>
  );
}
