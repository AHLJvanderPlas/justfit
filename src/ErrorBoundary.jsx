import { Component } from "react";

// Catches unhandled render errors anywhere in the tree.
// Must be a class component — React requires it for error boundaries.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("[ErrorBoundary]", error, info?.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{
        minHeight: "100vh", background: "#020617", display: "flex",
        alignItems: "center", justifyContent: "center", padding: 24,
      }}>
        <div style={{
          width: "100%", maxWidth: 380, background: "rgba(255,255,255,0.04)",
          border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24,
          padding: 32, textAlign: "center",
        }}>
          <div style={{ fontSize: 36, marginBottom: 16 }}>⚠️</div>
          <div style={{ fontSize: 18, fontWeight: 900, color: "#f8fafc", marginBottom: 10 }}>
            Something went wrong
          </div>
          <div style={{ fontSize: 13, color: "#64748b", lineHeight: 1.6, marginBottom: 24 }}>
            An unexpected error occurred. Your data is safe — reload to continue.
          </div>
          <button
            onClick={() => window.location.reload()}
            style={{
              background: "#10b981", border: "none", borderRadius: 14,
              color: "#fff", fontWeight: 900, fontSize: 14, padding: "12px 28px",
              cursor: "pointer",
            }}
          >
            Reload app
          </button>
        </div>
      </div>
    );
  }
}
