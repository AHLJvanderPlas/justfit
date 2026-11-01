// Bottom navigation. Moved out of App.jsx (F4); a plain import — it is always on screen.
import { Icons } from "./icons.jsx";
import { t } from "./i18n.js";

const COACH_NAV_ITEM = {
  id: "coach",
  label: "Coach",
  icon: (a, dot) => (
    <div className="jf-nav__icon">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "var(--accent)" : "var(--muted)"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
      {dot && <span className="jf-nav__dot" />}
    </div>
  ),
};

const NAV_ITEMS = [
  {
    id: "today",
    label: "Today",
    icon: (a) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={a ? "var(--accent)" : "var(--muted)"}
        strokeWidth="2"
      >
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <path d="m9 16 2 2 4-4" />
      </svg>
    ),
  },
  {
    id: "history",
    label: "Progress",
    icon: (a) => <Icons.chart size={22} c={a ? "var(--accent)" : "var(--muted)"} />,
  },
  {
    id: "plan",
    label: "This Week",
    icon: (a) => (
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={a ? "var(--accent)" : "var(--muted)"} strokeWidth="2">
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
        <line x1="8" y1="15" x2="8" y2="15" strokeLinecap="round" strokeWidth="2.5" />
        <line x1="12" y1="15" x2="12" y2="15" strokeLinecap="round" strokeWidth="2.5" />
        <line x1="16" y1="15" x2="16" y2="15" strokeLinecap="round" strokeWidth="2.5" />
      </svg>
    ),
  },
  {
    id: "settings",
    label: "Settings",
    icon: (a) => (
      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        stroke={a ? "var(--accent)" : "var(--muted)"}
        strokeWidth="2"
      >
        <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
        <circle cx="12" cy="12" r="3" />
      </svg>
    ),
  },
];

export default function Nav({ view, setView, hasTrainer, coachDot }) {
  const items = hasTrainer
    ? [...NAV_ITEMS.slice(0, 3), COACH_NAV_ITEM, NAV_ITEMS[3]]
    : NAV_ITEMS;
  // UAT R6 — the nav is laid out from --nav-h (styles.css); .jf-page pads every view by the
  // same number, so the last row of any screen scrolls fully above it.
  return (
    <nav className="jf-nav">
      <div className={`jf-nav__row${items.length > 4 ? " jf-nav__row--5" : ""}`}>
        {items.map((item) => {
          const active = view === item.id;
          return (
            <button key={item.id} type="button" onClick={() => setView(item.id)} aria-current={active ? "page" : undefined}
              className={`jf-nav__item${active ? " jf-nav__item--on" : ""}`}>
              {item.id === "coach" ? item.icon(active, coachDot) : item.icon(active)}
              <span className="jf-nav__label">{t(item.label)}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
