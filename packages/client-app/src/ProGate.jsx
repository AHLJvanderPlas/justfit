// ProGate.jsx — full-screen Pro upgrade wall
import { useState, useEffect } from "react";
import { C, display } from "./tokens.js";
import api from "./apiClient.js";

const FEATURES = [
  "Hardloopcoach (5km → 50km programma's)",
  "Fietscoach (FTP, TSS, PMC, gestructureerde workouts)",
  "Strava synchronisatie + TSS import",
  "TCX / ZWO / ERG export",
  "PMC grafiek (vorm, vermoeidheid, conditie)",
  "Gepolariseerd trainingsschema",
];

function CheckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export default function ProGate({ onBack, earlyBirdRemaining: initialEb }) {
  const [selected, setSelected] = useState("pro_annual_eb");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [eb, setEb] = useState(initialEb ?? null);

  // Fetch early bird count if not passed in
  useEffect(() => {
    if (eb !== null) return;
    api.getSubscription().then(d => { if (d.early_bird_remaining != null) setEb(d.early_bird_remaining); }).catch(() => {});
  }, [eb]);

  const isEbAvailable = eb === null || eb > 0;

  // If early bird is gone, map eb plans to standard plans at submit time
  const effectivePlan = isEbAvailable ? selected : selected.replace("_eb", "");

  const CARDS = [
    {
      id: isEbAvailable ? "pro_monthly_eb" : "pro_monthly",
      label: "MAANDELIJKS",
      price: isEbAvailable ? "€4,99" : "€6,99",
      strike: isEbAvailable ? "€6,99" : null,
      sub: "/maand",
      badge: isEbAvailable ? "vroegboekkorting" : null,
    },
    {
      id: isEbAvailable ? "pro_annual_eb" : "pro_annual",
      label: "JAARLIJKS",
      price: isEbAvailable ? "€48" : "€59,99",
      strike: isEbAvailable ? "€59,99" : null,
      sub: "/jaar · beste deal",
      badge: "beste deal",
      featured: true,
    },
  ];

  async function handleStart() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.startSubscription(effectivePlan);
      if (res.error === "already_subscribed") { setError("Je hebt al een actief abonnement."); setLoading(false); return; }
      if (res.error === "early_bird_sold_out") { setError("Vroegboekkorting is helaas vol. Probeer het standaardtarief."); setEb(0); setLoading(false); return; }
      if (res.checkout_url) { window.location.href = res.checkout_url; return; }
      setError("Probeer het opnieuw.");
    } catch { setError("Netwerk fout — probeer het opnieuw."); }
    setLoading(false);
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 200, overflowY: "auto", display: "flex", flexDirection: "column" }}>
      <div style={{ maxWidth: 480, margin: "0 auto", width: "100%", padding: "max(40px, env(safe-area-inset-top)) 20px 60px" }}>

        {/* Back */}
        <button onClick={onBack} style={{ background: "none", border: "none", color: C.muted, cursor: "pointer", fontSize: 14, fontWeight: 700, padding: 0, marginBottom: 32 }}>
          ← Terug
        </button>

        {/* Header */}
        <div style={{ fontSize: 11, fontWeight: 900, letterSpacing: "0.15em", color: C.emerald, textTransform: "uppercase", marginBottom: 8 }}>
          Upgrade
        </div>
        <h1 style={{ ...display(44), color: C.text, margin: "0 0 8px", lineHeight: 1.05 }}>
          JUSTFIT<br />PRO
        </h1>
        <p style={{ fontSize: 15, color: C.muted, marginBottom: 28, lineHeight: 1.5 }}>
          Gestructureerde programma's, geavanceerde analyse en volledige coaching.
        </p>

        {/* Early bird banner */}
        {isEbAvailable && eb !== null && eb < 50 && (
          <div style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 20, fontSize: 13, fontWeight: 700, color: "#f59e0b" }}>
            Nog {eb} {eb === 1 ? "plek" : "plekken"} op dit vroegboekerstarief
          </div>
        )}

        {/* Pricing cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 24 }}>
          {CARDS.map(card => {
            const active = selected === card.id;
            return (
              <button key={card.id} onClick={() => setSelected(card.id)}
                style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", padding: "18px 16px", borderRadius: 20, cursor: "pointer", textAlign: "left", fontFamily: "inherit",
                  border: `1px solid ${active ? "var(--accent-border, rgba(16,185,129,0.3))" : C.border}`,
                  background: active ? "rgba(var(--accent-rgb),0.08)" : C.bgCard }}>
                <div style={{ fontSize: 10, fontWeight: 900, letterSpacing: "0.12em", color: active ? "var(--accent)" : C.muted, textTransform: "uppercase", marginBottom: 10 }}>
                  {card.label}
                </div>
                {card.strike && (
                  <div style={{ fontSize: 13, color: C.faint, textDecoration: "line-through", marginBottom: 2 }}>{card.strike}</div>
                )}
                <div style={{ ...display(28), color: active ? "var(--accent)" : C.text, lineHeight: 1 }}>
                  {card.price}
                </div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{card.sub}</div>
                {card.badge && card.badge !== "beste deal" && (
                  <div style={{ marginTop: 10, fontSize: 10, fontWeight: 900, color: "#f59e0b", background: "rgba(245,158,11,0.12)", padding: "3px 8px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                    {card.badge}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Feature list */}
        <div style={{ marginBottom: 28 }}>
          {FEATURES.map(f => (
            <div key={f} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: `1px solid ${C.border}` }}>
              <CheckIcon />
              <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{f}</span>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 12, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#f87171" }}>
            {error}
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleStart}
          disabled={loading}
          style={{ width: "100%", padding: "16px 0", borderRadius: 16, fontFamily: "inherit", fontWeight: 900, fontSize: 16, cursor: loading ? "not-allowed" : "pointer",
            background: loading ? "rgba(255,255,255,0.06)" : "var(--accent)", color: loading ? C.muted : "#fff", border: "none", marginBottom: 12 }}
        >
          {loading ? "Doorsturen naar betaling…" : "Start nu Pro →"}
        </button>

        <p style={{ fontSize: 12, color: C.muted, textAlign: "center", lineHeight: 1.6 }}>
          30 dagen geld terug · elk moment opzegbaar · geen verborgen kosten
        </p>
      </div>
    </div>
  );
}
