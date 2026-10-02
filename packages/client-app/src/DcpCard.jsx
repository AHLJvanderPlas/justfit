// DcpCard — C-F13. The DCP readiness strip, shown in two places.
//
// Military tab:  the DCP as a *goal* — a sub-target alongside the keuring.
// Voortgang tab: the same card as a standing readiness read, because this is a
//                floor you hold for the whole of service and the progress screen
//                is where someone looks to ask "where am I actually".
//
// One component rather than two copies: the numbers on a published standard must
// never differ between two screens in the same app.

import { C } from "./tokens.js";
import { t } from "./i18n.js";
import { Glass } from "./uiComponents.jsx";
import { getDcpNorms, dcpProgress, dcpAgeFrom, dcpIsStale, dcpCardVisible, DCP_RETEST_DAYS }
  from "../../../functions/api/_shared/military.js";

/**
 * Visibility rule, in one place so both mounts agree: the card appears only when
 * the DCP is actually in play — either the military coach is running it as a
 * sub-target, or the standing bias is switched on. `dcp.enabled` alone is not
 * enough; it only records that a baseline exists, and showing readiness stats plus
 * a "go and measure yourself" prompt to someone who has turned both off is nagging
 * about a goal they do not have.
 *
 * @param {object}  dcp            preferences.military_coach.dcp
 * @param {boolean} militaryActive preferences.military_coach.active
 * @param {string}  sex            from the body profile
 * @param {number}  nowMs          captured once by the caller — never read the clock in render
 * @param {func}    onMeasure      opens the DCP baseline assessment
 * @param {boolean} compact        drops the header when the host screen already titles it
 */
export function DcpCard({ dcp, militaryActive = false, sex, nowMs, onMeasure, compact = false, measurePlanned = false }) {
  if (!dcpCardVisible(dcp, militaryActive)) return null;

  const age = dcpAgeFrom(dcp.birth_year, nowMs);
  const norms = getDcpNorms(sex, age);
  if (!norms) return null;

  const last = dcp.last ?? {};
  const push = dcpProgress(last.pushups ?? 0, norms.pushups);
  const situp = dcpProgress(last.situps ?? 0, norms.situps);
  const runTarget = dcpProgress(0, norms.run_m, true).capacity;
  const stale = dcpIsStale(last.at_ms, nowMs);
  const never = !last.at_ms;

  const rows = [
    { key: "pushups", label: t("Push-ups · 2 min"), p: push },
    { key: "situps", label: t("Sit-ups · 2 min"), p: situp },
  ];

  return (
    <Glass style={{ padding: 20, marginBottom: 12 }}>
      {!compact && (
        <>
          <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 2 }}>
            <div style={{ fontSize: 15, fontWeight: 900, color: C.text }}>DCP</div>
            <div style={{ fontSize: 11, color: C.muted, fontVariantNumeric: "tabular-nums" }}>
              {age} {t("yr")} · {sex === "female" ? t("woman") : t("man")}
            </div>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>
            {dcp.test_date
              ? `${t("Test on")} ${new Date(dcp.test_date).toLocaleDateString("nl-NL", { day: "numeric", month: "long" })} — ${t("in")} ${Math.max(0, Math.ceil((new Date(dcp.test_date).getTime() - nowMs) / 86400000))} ${t("days")}`
              : t("No date set — standing requirement")}
          </div>
        </>
      )}

      {rows.map(({ key, label, p }) => {
        const color = p.tier === "below" ? C.rose : p.tier === "minimum" ? C.amber : C.emerald;
        return (
          <div key={key} style={{ padding: "11px 0", borderTop: `1px solid ${C.border}` }}>
            <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 13, fontWeight: 650, color: C.text }}>{label}</span>
              <span style={{ fontFamily: C.font.mono, fontSize: 12, fontVariantNumeric: "tabular-nums", color }}>
                {p.value} / {p.next}
              </span>
            </div>
            {/* One bar, two ticks: minimum and safe. The fill never resets when a
                tier is cleared — progress is continuous, which is the honest picture. */}
            <div style={{ position: "relative", height: 8, borderRadius: 4, background: "rgba(var(--overlay-rgb),0.08)" }}>
              <div style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: `${p.pct}%`, borderRadius: 4, background: color }} />
              <div style={{ position: "absolute", top: -3, bottom: -3, left: `${Math.round((p.minimum / p.capacity) * 100)}%`, width: 2, borderRadius: 1, background: "rgba(var(--overlay-rgb),0.45)" }} />
              <div style={{ position: "absolute", top: -3, bottom: -3, left: `${Math.round((p.safe / p.capacity) * 100)}%`, width: 2, borderRadius: 1, background: "rgba(var(--overlay-rgb),0.25)" }} />
            </div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 5, lineHeight: 1.45 }}>
              {never
                ? t("Not measured yet.")
                : p.gap === 0
                  ? `${t("Margin built — minimum is")} ${p.minimum}.`
                  : p.tier === "below"
                    ? `${t("Still")} ${p.gap} ${t("to the minimum of")} ${p.minimum}. ${t("Next step")}: ${p.value + p.step}.`
                    : `${t("Minimum of")} ${p.minimum} ${t("cleared. Working toward")} ${p.next} — ${t("next step")}: ${p.value + p.step}.`}
            </div>
          </div>
        );
      })}

      <div style={{ padding: "11px 0 0", borderTop: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 10, marginBottom: 5 }}>
          <span style={{ fontSize: 13, fontWeight: 650, color: C.text }}>{t("12 min run")}</span>
          <span style={{ fontFamily: C.font.mono, fontSize: 12, fontVariantNumeric: "tabular-nums", color: C.emerald }}>
            {runTarget.toLocaleString("nl-NL")} m
          </span>
        </div>
        <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.45 }}>
          {t("Minimum")} {norms.run_m.toLocaleString("nl-NL")} m — {t("covered by your keuring target. Every cluster already asks for this.")}
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, fontSize: 10, color: C.muted, marginTop: 12 }}>
        {[[C.rose, t("below minimum")], [C.amber, t("minimum cleared")], [C.emerald, t("margin built")]].map(([c, l]) => (
          <span key={l} style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <i style={{ width: 10, height: 3, borderRadius: 2, background: c, display: "inline-block" }} />{l}
          </span>
        ))}
      </div>

      {/* A stale measurement is worse than none: the training bias is driven by
          these numbers, so an old reading quietly aims at the wrong thing. */}
      {(never || stale) && (
        <div style={{ marginTop: 12, padding: "10px 12px", borderRadius: 10,
          background: C.amberDim, border: `1px solid ${C.amberBorder}`, fontSize: 11.5, color: C.text, lineHeight: 1.45 }}>
          {never
            ? t("Do the baseline so the planner knows where you stand.")
            : `${t("Last measured over")} ${DCP_RETEST_DAYS} ${t("days ago — time to retest.")}`}
        </div>
      )}

      {onMeasure && (
        <button
          onClick={measurePlanned ? undefined : onMeasure}
          disabled={measurePlanned}
          style={{ marginTop: 12, width: "100%", minHeight: 44, borderRadius: 12,
            cursor: measurePlanned ? "default" : "pointer", opacity: measurePlanned ? 0.65 : 1,
            border: `1px solid ${C.emeraldBorder}`, background: C.emeraldDim, color: C.emerald,
            fontSize: 13, fontWeight: 800, touchAction: "manipulation" }}>
          {measurePlanned
            ? t("Self-assessment planned")
            : never ? t("Do baseline") : t("Measure again")}
        </button>
      )}
    </Glass>
  );
}

export default DcpCard;
