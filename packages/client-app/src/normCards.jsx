// coach-dcp R2 (fix 6) — WAAR STA IK: one card per norm, the same cards on
// Voortgang and the Coach view.
//
//   KEURING K3 · over 60 dagen
//   12 min loop   2.350 m / 2.200 m   ▮▮▮▮▮▮▮▮▮▮   Cooper 12 okt
//   Push-ups      — / 27              nog niet gemeten
//   Pull-ups      — / 5               nog niet gemeten
//   Mars 15 kg    — / 33:00           nog niet gemeten
//
// The rows come from keuringRows (keuringNorms.js, the ONE keuring table); the
// DCP card is DcpCard. Styling is .jf-norm-card* / .jf-wsi* (no inline style).

import { t } from "./i18n.js";
import { Glass } from "./uiComponents.jsx";
import { DcpCard, NormBar } from "./DcpCard.jsx";
import { milClL } from "./planUtils.js";
import { keuringRows, keuringDaysOut, keuringCardVisible, anyNormOn } from "./keuringNorms.js";

const fmtNum = (n) => Number(n).toLocaleString("nl-NL");

export function KeuringCard({ mil, nowMs, children }) {
  if (!keuringCardVisible(mil)) return null;
  const level = milClL("keuring", mil.cluster_target ?? 3);
  const days = keuringDaysOut(mil, nowMs);
  const rows = keuringRows(mil);
  const score = (r) => {
    const v = r.value == null ? "—" : r.unit === "m" ? `${fmtNum(r.value)} m` : String(r.value);
    const target = r.unit === "m" ? `${fmtNum(r.target)} m` : String(r.target);
    return `${v} / ${target}`;
  };
  return (
    <Glass className="jf-norm-card" data-testid="keuring-card">
      <div className="jf-norm-card__head">
        <div className="jf-norm-card__title">
          {days != null ? t("KEURING {level} · in {n} days", { level, n: days }) : t("KEURING {level}", { level })}
        </div>
      </div>
      {rows.map((r) => (
        <div key={r.key} className="jf-norm-card__row">
          <div className="jf-norm-card__line">
            <span className="jf-norm-card__label">{t(r.label[0], r.label[1])}</span>
            <span className={`jf-norm-card__score${r.met ? " jf-norm-card__score--met" : r.value != null ? " jf-norm-card__score--below" : ""}`}>{score(r)}</span>
          </div>
          {r.unit !== "time" && r.value != null && <NormBar pct={r.pct} tone={r.met ? "met" : "below"} />}
          <div className="jf-norm-card__hint">
            {r.value == null
              ? t("not measured yet")
              : r.at_ms
                ? t("Cooper {date}", { date: new Date(r.at_ms).toLocaleDateString("nl-NL", { day: "numeric", month: "short" }) })
                : null}
          </div>
        </div>
      ))}
      {children}
    </Glass>
  );
}

/**
 * The Voortgang section. Renders nothing when no norm is on — then the general
 * "Where you are" assessment card is the measurement entry instead.
 */
export function WaarStaIk({ prefs, nowMs, onMeasure, measurePlanned }) {
  const mil = prefs?.preferences?.military_coach ?? {};
  const dcp = mil.dcp;
  if (!anyNormOn(prefs)) return null;
  return (
    <div className="jf-wsi">
      <div className="jf-wsi__eyebrow">{t("WHERE DO I STAND")}</div>
      <KeuringCard mil={mil} nowMs={nowMs} />
      <DcpCard dcp={dcp} mil={mil} militaryActive={!!mil.active} sex={prefs?.sex ?? "male"} nowMs={nowMs} onMeasure={onMeasure} measurePlanned={measurePlanned} />
    </div>
  );
}
