import { C } from "./tokens.js";

// ─── ADAPTATION CHIP ─────────────────────────────────────────────────────────
export const AdaptationChip = ({ label }) => (
  <span
    role="status"
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 5,
      fontSize: 10,
      fontWeight: 800,
      letterSpacing: "0.06em",
      textTransform: "uppercase",
      background: "rgba(var(--accent-rgb),0.1)",
      color: "var(--accent)",
      border: "1px solid rgba(var(--accent-rgb),0.25)",
      borderRadius: 999,
      padding: "3px 10px",
    }}
  >
    ◆ {label}
  </span>
);

// ─── GLASS CARD ───────────────────────────────────────────────────────────────
export const Glass = ({ children, style = {}, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: C.bgCard,
      border: `1px solid ${C.border}`,
      borderRadius: 28,
      ...style,
    }}
  >
    {children}
  </div>
);

// ─── PILL BUTTON ─────────────────────────────────────────────────────────────
export const Pill = ({ children, active, onClick }) => (
  <button
    onClick={onClick}
    style={{
      padding: "8px 0",
      borderRadius: 12,
      fontSize: 13,
      fontWeight: 700,
      border: active ? `1px solid ${C.emeraldBorder}` : `1px solid ${C.border}`,
      background: active ? C.emeraldDim : "rgba(255,255,255,0.03)",
      color: active ? C.emerald : C.muted,
      cursor: "pointer",
      transition: "all 0.15s",
    }}
  >
    {children}
  </button>
);

// ─── TOGGLE ROW ──────────────────────────────────────────────────────────────
export const Toggle = ({ label, sub, active, onToggle }) => (
  <button
    onClick={onToggle}
    style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "14px 16px",
      borderRadius: 16,
      width: "100%",
      textAlign: "left",
      background: active ? "rgba(var(--accent-rgb),0.08)" : "rgba(255,255,255,0.03)",
      border: `1px solid ${active ? C.emeraldBorder : C.border}`,
      cursor: "pointer",
      transition: "all 0.15s",
      marginBottom: 8,
    }}
  >
    <div>
      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{sub}</div>}
    </div>
    <div
      style={{
        width: 40,
        height: 22,
        borderRadius: 999,
        background: active ? C.emerald : C.subtle,
        position: "relative",
        flexShrink: 0,
        transition: "background 0.2s",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 3,
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "#fff",
          left: active ? 21 : 3,
          transition: "left 0.2s",
        }}
      />
    </div>
  </button>
);

// ─── SCALE INPUT ─────────────────────────────────────────────────────────────
export const ScaleInput = ({ label, value, onChange }) => (
  <div style={{ marginBottom: 20 }}>
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 600,
          color: C.muted,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 800, color: C.emerald }}>{value}</span>
    </div>
    <div style={{ display: "flex", gap: 6 }}>
      {[1, 2, 3, 4, 5].map((v) => (
        <button
          key={v}
          onClick={() => onChange(v)}
          style={{
            flex: 1,
            padding: "10px 0",
            minHeight: 44,
            borderRadius: 10,
            fontSize: 14,
            fontWeight: 800,
            background: value === v ? C.emeraldDim : "rgba(255,255,255,0.04)",
            border: `1px solid ${value === v ? C.emeraldBorder : C.border}`,
            color: value === v ? C.emerald : C.muted,
            cursor: "pointer",
            transition: "all 0.15s",
            boxShadow: value === v ? "0 4px 20px rgba(var(--accent-rgb),0.25)" : "none",
          }}
        >
          {v}
        </button>
      ))}
    </div>
  </div>
);
