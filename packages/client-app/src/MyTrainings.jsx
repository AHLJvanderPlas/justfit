// ─── W4.3 — "Mijn trainingen": saved sessions, reused with one tap ─────────────
//
// A session the user built once becomes a habit here. Two surfaces:
//   MyTrainingsCard   — Coach tab: list, use today, edit (opens the builder
//                        preloaded), delete with an inline confirm.
//   UseMyTraining     — Today card: one tap with exactly one template, a picker
//                        sheet with more.
//
// Neither installs anything itself: both call `onUse(template)`, which goes
// through POST /api/plan custom_steps (apiClient.useMySession), so safety notes,
// the blocking acknowledgement and clamping behave exactly as in the builder.
import { useState } from "react";
import { C, display, eyebrow, mono } from "./tokens.js";
import { t, useLang } from "./i18n.js";

const errorText = (code) => (code === "unknown_exercise"
  ? t("One of these exercises is no longer in the library — edit the training and try again.")
  : t("Could not start this training — check your connection and try again."));

function meta(tpl) {
  const n = tpl.steps?.length ?? 0;
  const parts = [];
  if (tpl.est_minutes != null) parts.push(`≈ ${tpl.est_minutes} min`);
  parts.push(n === 1 ? t("1 exercise") : t("{n} exercises", { n }));
  return parts.join(" · ");
}

const smallBtn = (accent) => ({
  padding: "8px 12px", minHeight: 40, borderRadius: 12, fontSize: 12, fontWeight: 800, cursor: "pointer", fontFamily: "inherit",
  border: `1px solid ${accent ? "var(--accent-border)" : C.border}`,
  background: accent ? "var(--accent-dim)" : "transparent",
  color: accent ? "var(--accent)" : C.muted,
});

// ── Coach tab card ────────────────────────────────────────────────────────────
export function MyTrainingsCard({ templates, onUse, onEdit, onCreate, onDelete, todayUserAuthored }) {
  useLang();
  const [confirmDelete, setConfirmDelete] = useState(null);   // template id
  const [confirmReplace, setConfirmReplace] = useState(null); // template id
  const [busy, setBusy] = useState(null);                     // template id
  const [error, setError] = useState(null);                   // { id, text }

  const use = async (tpl) => {
    // Replacing a session the user wrote today is an explicit, confirmed action.
    if (todayUserAuthored && confirmReplace !== tpl.id) { setConfirmReplace(tpl.id); setConfirmDelete(null); return; }
    setBusy(tpl.id); setError(null);
    const r = await onUse(tpl);
    setBusy(null); setConfirmReplace(null);
    if (r?.error) setError({ id: tpl.id, text: errorText(r.error) });
  };
  const del = async (tpl) => {
    setBusy(tpl.id); setError(null);
    const ok = await onDelete(tpl);
    setBusy(null); setConfirmDelete(null);
    if (!ok) setError({ id: tpl.id, text: t("Could not delete this training — check your connection and try again.") });
  };

  const list = templates ?? [];
  return (
    <div style={{ marginBottom: 28 }}>
      <div style={{ ...eyebrow, color: C.muted, marginBottom: 12 }}>{t("MY TRAININGS")}</div>
      <div style={{ background: C.bgCard, border: `1px solid ${C.border}`, borderRadius: 28, padding: "16px 18px" }}>
        {list.length === 0 ? (
          <>
            <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>
              {t("Save a session you built and reuse it with one tap.")}
            </div>
            <button type="button" onClick={onCreate} style={{ ...smallBtn(true), width: "100%" }}>{t("Build a training")} →</button>
          </>
        ) : (
          <>
            {list.map((tpl, i) => (
              <div key={tpl.id} style={{ padding: "12px 0", borderTop: i ? `1px solid ${C.border}` : "none" }}>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.name}</div>
                <div style={{ ...mono(11), color: C.muted, margin: "2px 0 10px" }}>{meta(tpl)}</div>
                {confirmDelete === tpl.id ? (
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    <span style={{ fontSize: 12, color: C.text, fontWeight: 600, flex: "1 1 100%" }}>{t("Delete this training?")}</span>
                    <button type="button" disabled={busy === tpl.id} onClick={() => del(tpl)} style={{ ...smallBtn(false), color: C.danger, borderColor: C.danger }}>
                      {t("Yes, delete")}
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(null)} style={smallBtn(false)}>{t("Cancel")}</button>
                  </div>
                ) : confirmReplace === tpl.id ? (
                  <div style={{ padding: 12, borderRadius: 14, background: C.amberDim, border: `1px solid ${C.amberBorder}` }}>
                    <div style={{ fontSize: 12, color: C.warningSoft, fontWeight: 600, lineHeight: 1.5, marginBottom: 10 }}>
                      {t("This replaces the session you built yourself today.")}
                    </div>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button type="button" disabled={busy === tpl.id} onClick={() => use(tpl)} style={{ ...smallBtn(true), flex: 1 }}>
                        {busy === tpl.id ? t("Saving…") : t("Replace today's session")}
                      </button>
                      <button type="button" onClick={() => setConfirmReplace(null)} style={smallBtn(false)}>{t("Cancel")}</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button type="button" disabled={busy === tpl.id} onClick={() => use(tpl)} style={{ ...smallBtn(true), flex: 1 }}>
                      {busy === tpl.id ? t("Saving…") : t("Use today")}
                    </button>
                    <button type="button" onClick={() => onEdit(tpl)} style={smallBtn(false)}>{t("Edit")}</button>
                    <button type="button" aria-label={`${t("Delete")} ${tpl.name}`} onClick={() => { setConfirmDelete(tpl.id); setConfirmReplace(null); }} style={smallBtn(false)}>
                      {t("Delete")}
                    </button>
                  </div>
                )}
                {error?.id === tpl.id && <div style={{ fontSize: 12, color: C.danger, marginTop: 8 }}>{error.text}</div>}
              </div>
            ))}
            <button type="button" onClick={onCreate} style={{ marginTop: 6, background: "none", border: "none", padding: "8px 0", ...mono(11), color: "var(--accent)", cursor: "pointer" }}>
              + {t("Build a training")}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ── Today card control ────────────────────────────────────────────────────────
// Rendered only when today's plan is NOT user-authored, so it never replaces a
// session the user wrote (the override is already in place when it is).
export function UseMyTraining({ templates, onUse }) {
  useLang();
  const [picking, setPicking] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const list = templates ?? [];
  if (list.length === 0) return null;

  const use = async (tpl) => {
    setBusy(true); setError(null);
    const r = await onUse(tpl);
    setBusy(false);
    if (r?.error) setError(errorText(r.error));
    else setPicking(false);
  };
  const single = list.length === 1 ? list[0] : null;

  return (
    <>
      <button
        type="button"
        disabled={busy}
        onClick={() => (single ? use(single) : setPicking(true))}
        style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, color: "var(--accent)", marginTop: 2, textAlign: "center", width: "100%", minHeight: 40, fontFamily: "inherit" }}
      >
        {busy && !picking ? t("Saving…") : single ? `${t("Use my training")} · ${single.name}` : `${t("Use my training")} →`}
      </button>
      {error && !picking && <div style={{ fontSize: 12, color: C.danger, textAlign: "center" }}>{error}</div>}
      {picking && (
        <div
          style={{ position: "fixed", inset: 0, zIndex: 105, display: "flex", alignItems: "flex-end", justifyContent: "center", background: "rgba(0,0,0,0.6)" }}
          onClick={() => !busy && setPicking(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={t("Choose a training")}
            onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", maxWidth: 520, maxHeight: "80dvh", overflowY: "auto", background: C.sheet, border: `1px solid ${C.border}`, borderRadius: "24px 24px 0 0", padding: "16px 16px calc(16px + env(safe-area-inset-bottom))", boxSizing: "border-box" }}
          >
            <div style={{ width: 40, height: 4, borderRadius: 2, background: C.border, margin: "0 auto 12px" }} />
            <div style={{ ...display(24, 900), color: C.text, textTransform: "uppercase", marginBottom: 12 }}>{t("Choose a training")}</div>
            {list.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                disabled={busy}
                onClick={() => use(tpl)}
                style={{ width: "100%", display: "block", textAlign: "left", padding: "12px 14px", marginBottom: 8, borderRadius: 14, border: `1px solid ${C.border}`, background: C.bgCard, color: C.text, cursor: busy ? "wait" : "pointer", fontFamily: "inherit", minHeight: 52 }}
              >
                <span style={{ display: "block", fontSize: 14, fontWeight: 700, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{tpl.name}</span>
                <span style={{ display: "block", ...mono(11), color: C.muted, marginTop: 2 }}>{meta(tpl)}</span>
              </button>
            ))}
            {error && <div style={{ fontSize: 12, color: C.danger, margin: "4px 0 10px" }}>{error}</div>}
            <button type="button" disabled={busy} onClick={() => setPicking(false)} style={{ width: "100%", padding: 13, borderRadius: 14, fontSize: 13, fontWeight: 700, background: "transparent", border: `1px solid ${C.border}`, color: C.muted, cursor: "pointer", fontFamily: "inherit" }}>
              {busy ? t("Saving…") : t("Cancel")}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
