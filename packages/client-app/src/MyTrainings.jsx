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
import { t, useLang } from "./i18n.js";
import { templateMeta as meta, templateNames as namesLine } from "./templateMeta.js";
import { ownSessionAssessmentOffer, ownSessionAsTemplate } from "./planUtils.js";

const errorText = (code) => (code === "unknown_exercise"
  ? t("One of these exercises is no longer in the library — edit the training and try again.")
  : t("Could not start this training — check your connection and try again."));

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
    <div className="jf-mt">
      <div className="jf-mt__eyebrow">{t("MY TRAININGS")}</div>
      <div className="jf-mt__panel">
        {list.length === 0 ? (
          <>
            <div className="jf-mt__empty">
              {t("Save a session you built and reuse it with one tap.")}
            </div>
            <button type="button" onClick={onCreate} className="jf-mt-btn jf-mt-btn--accent jf-mt-btn--wide">{t("Build a training")} →</button>
          </>
        ) : (
          <>
            {list.map((tpl) => (
              <div key={tpl.id} className="jf-mt__item">
                <div className="jf-mt__name">{tpl.name}</div>
                {namesLine(tpl) && <div className="jf-mt__names">{namesLine(tpl)}</div>}
                <div className="jf-mt__meta">{meta(tpl)}</div>
                {confirmDelete === tpl.id ? (
                  <div className="jf-mt__confirm">
                    <span className="jf-mt__ask">{t("Delete this training?")}</span>
                    <button type="button" disabled={busy === tpl.id} onClick={() => del(tpl)} className="jf-mt-btn jf-mt-btn--danger">
                      {t("Yes, delete")}
                    </button>
                    <button type="button" onClick={() => setConfirmDelete(null)} className="jf-mt-btn">{t("Cancel")}</button>
                  </div>
                ) : confirmReplace === tpl.id ? (
                  <div className="jf-own-confirm">
                    <div className="jf-own-confirm__text">
                      {t("This replaces the session you built yourself today.")}
                    </div>
                    <div className="jf-mt__btns">
                      <button type="button" disabled={busy === tpl.id} onClick={() => use(tpl)} className="jf-mt-btn jf-mt-btn--accent jf-mt-btn--grow">
                        {busy === tpl.id ? t("Saving…") : t("Replace today's session")}
                      </button>
                      <button type="button" onClick={() => setConfirmReplace(null)} className="jf-mt-btn">{t("Cancel")}</button>
                    </div>
                  </div>
                ) : (
                  <div className="jf-mt__btns">
                    <button type="button" disabled={busy === tpl.id} onClick={() => use(tpl)} className="jf-mt-btn jf-mt-btn--accent jf-mt-btn--grow">
                      {busy === tpl.id ? t("Saving…") : t("Use today")}
                    </button>
                    <button type="button" onClick={() => onEdit(tpl)} className="jf-mt-btn">{t("Edit")}</button>
                    <button type="button" aria-label={`${t("Delete")} ${tpl.name}`} onClick={() => { setConfirmDelete(tpl.id); setConfirmReplace(null); }} className="jf-mt-btn">
                      {t("Delete")}
                    </button>
                  </div>
                )}
                {error?.id === tpl.id && <div className="jf-mt__error">{error.text}</div>}
              </div>
            ))}
            <button type="button" onClick={onCreate} className="jf-mt__add">
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
export function TemplatePickList({ templates, busy = false, onPick, onEdit, onDelete }) {
  useLang();
  const [openId, setOpenId] = useState(null);         // template whose ⋯ row is open
  const [confirmId, setConfirmId] = useState(null);   // template awaiting delete confirmation
  const [working, setWorking] = useState(null);
  const [error, setError] = useState(null);           // template id
  const list = [...(templates ?? [])].sort((a, b) => (b.updated_at_ms ?? b.created_at_ms ?? 0) - (a.updated_at_ms ?? a.created_at_ms ?? 0));
  const del = async (tpl) => {
    setWorking(tpl.id); setError(null);
    const ok = await onDelete(tpl);
    setWorking(null); setConfirmId(null);
    if (!ok) setError(tpl.id);
  };
  return list.map((tpl) => (
    <div key={tpl.id} className="jf-tpl-item">
      <div className="jf-tpl-item__top">
        <button type="button" disabled={busy} onClick={() => onPick(tpl)} className="jf-tpl-pick">
          <span className="jf-tpl-pick__name">{tpl.name}</span>
          {namesLine(tpl) && <span className="jf-tpl-pick__names">{namesLine(tpl)}</span>}
          <span className="jf-tpl-pick__meta">{meta(tpl)}</span>
        </button>
        {(onEdit || onDelete) && (
          <button type="button" className="jf-icon-btn jf-tpl-item__more" aria-label={`${t("More")} ${tpl.name}`} aria-expanded={openId === tpl.id}
            onClick={() => { setOpenId(openId === tpl.id ? null : tpl.id); setConfirmId(null); setError(null); }}>⋯</button>
        )}
      </div>
      {openId === tpl.id && (confirmId === tpl.id ? (
        <div className="jf-tpl-item__actions jf-tpl-item__actions--confirm">
          <span className="jf-mt__ask">{t("Delete this training?")}</span>
          <button type="button" disabled={working === tpl.id} onClick={() => del(tpl)} className="jf-mt-btn jf-mt-btn--danger">{t("Yes, delete")}</button>
          <button type="button" onClick={() => setConfirmId(null)} className="jf-mt-btn">{t("Cancel")}</button>
        </div>
      ) : (
        <div className="jf-tpl-item__actions">
          <button type="button" onClick={() => onEdit?.(tpl)} className="jf-mt-btn">{t("Edit")}</button>
          <button type="button" onClick={() => setConfirmId(tpl.id)} className="jf-mt-btn">{t("Delete")}</button>
        </div>
      ))}
      {error === tpl.id && <div className="jf-mt__error">{t("Could not delete this training — check your connection and try again.")}</div>}
    </div>
  ));
}
