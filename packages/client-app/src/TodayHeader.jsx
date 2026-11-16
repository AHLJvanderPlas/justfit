import { C } from "./tokens.js";
import { t } from "./i18n.js";

// UX review D (finding 11) — the logo row and the CHECK-IN button belong to Today only.
// Every other view's h1 is its header, so the content starts at the safe-area top.
export default function TodayHeader({ onCheckIn }) {
  return (
    <header className="jf-today-head" data-testid="today-header">
      <div className="jf-today-head__brand">
        <svg className="jf-today-head__logo" aria-hidden="true" width="38" height="38" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg">
          <rect className="jf-logo__bg" x="28" y="28" width="968" height="968" rx="180" />
          {/* Outer hexagon */}
          <path className="jf-logo__ring jf-logo__ring--outer" d="M 512 132 L 841 322 L 841 702 L 512 892 L 183 702 L 183 322 Z" fill="none" strokeWidth="28" strokeLinejoin="round"/>
          {/* Inner web rings — solid */}
          <path className="jf-logo__ring jf-logo__ring--mid" d="M 512 277 L 716 395 L 716 630 L 512 747 L 308 630 L 308 395 Z" fill="none" strokeWidth="14" strokeLinejoin="round"/>
          <path className="jf-logo__ring jf-logo__ring--inner" d="M 512 387 L 620 450 L 620 575 L 512 637 L 404 575 L 404 450 Z" fill="none" strokeWidth="12" strokeLinejoin="round"/>
          {/* S-curve route */}
          <path d="M 308 630 C 580 590, 620 470, 480 420 C 360 380, 460 315, 512 294" fill="none" stroke={C.logoMark} strokeWidth="44" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="512" cy="294" r="32" fill={C.logoMark}/>
          {/* Pole + filled flag */}
          <path d="M 512 294 L 512 172" stroke={C.logoMark} strokeWidth="30" strokeLinecap="round"/>
          <path d="M 512 176 L 626 176 C 608 200, 608 226, 626 250 L 512 250 Z" fill={C.logoMark} stroke={C.logoMark} strokeWidth="8" strokeLinejoin="round"/>
        </svg>
        <span className="jf-today-head__name">JustFit<span className="jf-today-head__cc">.cc</span></span>
      </div>
      <button type="button" className="jf-checkin-btn" onClick={onCheckIn}>
        <svg aria-hidden="true" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.emerald} strokeWidth="2.5">
          <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
          <path d="M19 3v4" />
          <path d="M21 5h-4" />
        </svg>
        {t("Check-in")}
      </button>
    </header>
  );
}
