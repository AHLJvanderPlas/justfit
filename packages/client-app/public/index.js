// Ghost counter — same formula as app
function updateGhost() {
  const now = new Date();
  const T = now.getHours() + now.getMinutes() / 60;
  const morning = 40 * Math.sin((Math.PI * (T - 2)) / 12);
  const evening = 35 * Math.sin((Math.PI * (T - 14)) / 12);
  const isWE = [0, 6].includes(now.getDay());
  let raw = morning + evening + 25;
  if (isWE) raw *= 0.8;
  const count = Math.max(8, Math.min(92, Math.floor(raw + Math.random() * 6 - 3)));
  const el = document.getElementById('ghost-count');
  if (el) el.textContent = count;
}
updateGhost();
setInterval(updateGhost, 60000);
