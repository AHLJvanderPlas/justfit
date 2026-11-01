// DcpCard — C-F13. The DCP readiness card, shown in two places.
//
// Military tab:  the DCP as a *goal* — a sub-target alongside the keuring.
// Voortgang tab: the same card under WAAR STA IK, as a standing readiness read,
//                because this is a floor you hold for the whole of service.
//
// One component rather than two copies: the numbers on a published standard must
// never differ between two screens in the same app.
//
// coach-dcp R2 (fix 6): each row names both tiers, "0 / 16 (veilig 19)" — the
// planner's trace says 19 and the card used to say 16; and the header follows the
// shared date rule (dcpHeaderDate): with no DCP test date but a keuring date, it
// reads "DCP · doorlopende norm · keuring over 60 dagen", never "geen datum".
// Styling is .jf-norm-card* (no inline style; the bar is SVG with attributes).

import { t } from "./i18n.js";
import { Glass } from "./uiComponents.jsx";
import { dcpMeasureLabel, dcpMeasurePlanned, dcpRows, dcpHeaderDate } from "./dcpUi.js";
import { getDcpNorms, dcpProgress, dcpAgeFrom, dcpIsStale, dcpCardVisible, DCP_RETEST_DAYS }
  from "../../../functions/api/_shared/military.js";

/** One progress bar, 0–100, with optional tick marks (percent positions). */
export function NormBar({ pct, tone, ticks = [] }) {
  return (
    <svg className="jf-norm-card__bar" viewBox="0 0 100 8" preserveAspectRatio="none" aria-hidden="true">
      <rect className="jf-norm-card__track" x="0" y="0" width="100" height="8" rx="4" />
      {pct > 0 && <rect className={`jf-norm-card__fill jf-norm-card__fill--${tone}`} x="0" y="0" width={Math.min(100, pct)} height="8" rx="4" />}
      {ticks.map((x, i) => <rect key={i} className={`jf-norm-card__tick${i ? " jf-norm-card__tick--soft" : ""}`} x={Math.min(99, x)} y="-3" width="1" height="14" />)}
    </svg>
  );
}

/**
 * Visibility rule, in one place so both mounts agree: the card appears only when
 * the DCP is actually in play — the military coach running it as a sub-target, or
 * the standing bias switched on (dcpCardVisible).
 *
 * @param {object}  dcp            preferences.military_coach.dcp
 * @param {object}  mil            preferences.military_coach (for the shared keuring date)
 * @param {boolean} militaryActive preferences.military_coach.active
 * @param {string}  sex            from the body profile
 * @param {number}  nowMs          captured once by the caller — never read the clock in render
 * @param {func}    onMeasure      schedules the measurement into today's session (App's
 *                                 handleForceAssessment, R598) — the same action on both mounts
 * @param {boolean} measurePlanned today's plan carries assessment_planned
 */
export function DcpCard({ dcp, mil = null, militaryActive = false, sex, nowMs, onMeasure, measurePlanned = false }) {
  if (!dcpCardVisible(dcp, militaryActive)) return null;

  const age = dcpAgeFrom(dcp.birth_year, nowMs);
  const norms = getDcpNorms(sex, age);
  if (!norms) return null;

  const last = dcp.last ?? {};
  const rows = dcpRows(dcp, norms);
  const runTarget = dcpProgress(0, norms.run_m, true).capacity;
  const stale = dcpIsStale(last.at_ms, nowMs);
  const never = !last.at_ms;
  const planned = dcpMeasurePlanned({ assessmentPlanned: measurePlanned, lastAtMs: last.at_ms, nowMs });
  const when = dcpHeaderDate(dcp, mil, nowMs);
  const header = when.kind === "test"
    ? t("DCP · test on {date} · in {n} days", { date: new Date(when.date).toLocaleDateString("nl-NL", { day: "numeric", month: "long" }), n: when.days })
    : when.kind === "keuring"
      ? t("DCP · standing standard · keuring in {n} days", { n: when.days })
      : t("DCP · standing standard");

  return (
    <Glass className="jf-norm-card">
      <div className="jf-norm-card__head">
        <div className="jf-norm-card__title">{header}</div>
        <div className="jf-norm-card__meta">{age} {t("yr")} · {sex === "female" ? t("woman") : t("man")}</div>
      </div>

      {rows.map(({ key, label, score, p }) => (
        <div key={key} className="jf-norm-card__row">
          <div className="jf-norm-card__line">
            <span className="jf-norm-card__label">{t(label)}</span>
            <span className={`jf-norm-card__score jf-norm-card__score--${p.tier}`}>{t(score[0], score[1])}</span>
          </div>
          {/* One bar, two ticks: minimum and safe. The fill never resets when a
              tier is cleared — progress is continuous, which is the honest picture. */}
          <NormBar pct={p.pct} tone={p.tier} ticks={[(p.minimum / p.capacity) * 100, (p.safe / p.capacity) * 100]} />
          <div className="jf-norm-card__hint">
            {never
              ? t("Not measured yet.")
              : p.gap === 0
                ? t("Margin built — minimum is {min}.", { min: p.minimum })
                : p.tier === "below"
                  ? t("Still {gap} to the minimum of {min}. Next step: {next}.", { gap: p.gap, min: p.minimum, next: p.value + p.step })
                  : t("Minimum of {min} cleared. Working toward {target} — next step: {next}.", { min: p.minimum, target: p.next, next: p.value + p.step })}
          </div>
        </div>
      ))}

      <div className="jf-norm-card__row">
        <div className="jf-norm-card__line">
          <span className="jf-norm-card__label">{t("12 min run")}</span>
          <span className="jf-norm-card__score jf-norm-card__score--met">{runTarget.toLocaleString("nl-NL")} m</span>
        </div>
        <div className="jf-norm-card__hint">
          {t("Minimum {m} m — covered by your keuring target. Every cluster already asks for this.", { m: norms.run_m.toLocaleString("nl-NL") })}
        </div>
      </div>

      <div className="jf-norm-card__legend">
        <span><i className="is-below" />{t("below minimum")}</span>
        <span><i className="is-minimum" />{t("minimum cleared")}</span>
        <span><i className="is-safe" />{t("margin built")}</span>
      </div>

      {/* A stale measurement is worse than none: the training bias is driven by
          these numbers, so an old reading quietly aims at the wrong thing. */}
      {(never || stale) && (
        <div className="jf-norm-card__warn">
          {never ? t("Do the baseline so the planner knows where you stand.") : t("Last measured over {n} days ago — time to retest.", { n: DCP_RETEST_DAYS })}
        </div>
      )}

      {onMeasure && (
        <button className="jf-dcp-measure jf-dcp-measure--wide" onClick={planned ? undefined : onMeasure} disabled={planned}>
          {t(dcpMeasureLabel({ never, planned }))}
        </button>
      )}
      <div className="jf-norm-card__foot">
        {never
          ? t("Last measurement: — · retest every 6 weeks")
          : t("Last measurement: {date} · retest every 6 weeks", { date: new Date(last.at_ms).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) })}
      </div>
    </Glass>
  );
}

export default DcpCard;
