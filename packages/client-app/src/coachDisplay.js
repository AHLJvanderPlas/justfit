// UAT release 3 — what the Coach view prints about a programme, only when it is true.

export const FTP_DEFAULT_W = 200;

/**
 * Was an FTP actually entered? The Settings field starts at 200 and the planner
 * falls back to 200, so a stored 200 with no test on record is the default, not a
 * measurement. Anything else (another number, a test date, a test history) is real.
 */
export function ftpEntered(cc) {
  const w = Number(cc?.ftp_watts);
  if (!(w > 0)) return false;
  return w !== FTP_DEFAULT_W || cc?.ftp_tested_at_ms != null || (cc?.ftp_history?.length ?? 0) > 0;
}

/** True when the programme's session counter has nothing to show yet ("Sessie 0 van 3"). */
export function noSessionYet(sessionInWeek) {
  return !(Number(sessionInWeek) > 0);
}
