// Pre-paint theme resolver. Loaded by a render-BLOCKING <script src> in index.html —
// deliberately not deferred, because its whole job is to run before first paint.
// It used to be inline, which was the only reason the CSP carried
// script-src 'unsafe-inline'. Mirrors THEMES/resolveTheme in src/tokens.js; smoke
// asserts the --bg values match.
// Resolve the theme before the bundle loads, or the page paints dark for a
// beat and then flips. Mirrors THEMES/resolveTheme in src/tokens.js — keep
// the two palettes in step (smoke asserts the --bg values match).
(function () {
  try {
    var m = localStorage.getItem("jf_theme") || "system";
    var light = m === "light" || (m === "system" &&
      window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches);
    var t = light
      ? { "--bg": "#f7f8fa", "--text": "#0f172a", "--muted": "#5b6675", "--subtle": "#94a3b8", "--overlay-rgb": "0,0,0" }
      : { "--bg": "#020617", "--text": "#f8fafc", "--muted": "#64748b", "--subtle": "#334155", "--overlay-rgb": "255,255,255" };
    for (var k in t) document.documentElement.style.setProperty(k, t[k]);
    document.documentElement.style.colorScheme = light ? "light" : "dark";
    document.documentElement.dataset.theme = light ? "light" : "dark";
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", t["--bg"]);
  } catch { /* storage blocked — dark stays */ }
})();

