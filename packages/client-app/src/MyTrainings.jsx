// ─── W4.3 — "Mijn trainingen": saved sessions, reused with one tap ─────────────
//
// A session the user built once becomes a habit here. Two surfaces:
//   MyTrainingsCard   — Coach tab: list, use today, edit (opens the builder
//                        preloaded), delete with an inline confirm.
//   TemplatePickList  — the list in "Eigen training → Hergebruiken".
//
// Neither installs anything itself: "Use today" calls `onUse(template)`, which
// goes through POST /api/plan custom_steps (apiClient.useMySession), so safety
// notes, the blocking acknowledgement and clamping behave as in the builder.
import { useState } from "react";
import { C, eyebrow, mono } from "./tokens.js";
import { t, useLang } from "./i18n.js";
import { ownSessionAssessmentOffer, ownSessionAsTemplate } from "./planUtils.js";

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

// ── Today card: the self-measurement under a session the user wrote (F8) ─────
// The builder offers it after "Use today"; a one-tap install never did. Adding it
// re-installs today's own session with include_assessment — the W4.1 contract,
// so safety and clamping are re-checked; an earlier acknowledgement still stands.
export function OwnSessionAssessmentOffer({ plan, onUse }) {
  useLang();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  if (!ownSessionAssessmentOffer(plan)) return null;
  const add = async () => {
    setBusy(true); setError(null);
    const r = await onUse(ownSessionAsTemplate(plan), { includeAssessment: true, safetyAck: plan.safety_ack_ms != null });
    setBusy(false);
    if (r?.error) setError(errorText(r.error));
  };
  return (
    <div className="jf-own-offer">
      <div className="jf-own-offer__title">{t("Your self-measurement is due")}</div>
      <div className="jf-own-offer__text">{t("Add two max-effort sets (push-ups and sit-ups, 2 minutes each) to the end of this session?")}</div>
      <button type="button" className="jf-own-offer__btn" disabled={busy} onClick={add}>
        {busy ? t("Adding…") : t("Add self-measurement")}
      </button>
      {error && <div className="jf-own-offer__error">{error}</div>}
    </div>
  );
}

// ── The pick list of saved trainings ──────────────────────────────────────────
// "Eigen training → Hergebruiken → Mijn trainingen" (MANUAL_TRAINING_DESIGN §3).
// It replaced the one-tap "Gebruik mijn training" on the Today card, which
// installed a template IN PLACE of today's plan without asking; picking here
// leads to the run-mode choice, where "als extra" is the default. Newest first.
export function TemplatePickList({ templates, busy = false, onPick }) {
  useLang();
  const list = [...(templates ?? [])].sort((a, b) => (b.updated_at_ms ?? b.created_at_ms ?? 0) - (a.updated_at_ms ?? a.created_at_ms ?? 0));
  return list.map((tpl) => (
    <button key={tpl.id} type="button" disabled={busy} onClick={() => onPick(tpl)} className="jf-tpl-pick">
      <span className="jf-tpl-pick__name">{tpl.name}</span>
      <span className="jf-tpl-pick__meta">{meta(tpl)}</span>
    </button>
  ));
}
