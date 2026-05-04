/**
 * offlineCache.js — IndexedDB-backed offline cache for today's plan.
 *
 * Used as a read-through fallback when the API is unreachable (gym wifi, etc.).
 * Write: after every successful plan load/generate.
 * Read: when getTodayPlan or generatePlan fails with a network error.
 */

const DB_NAME = 'jf-offline';
const DB_VERSION = 1;
const PLAN_STORE = 'plans';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PLAN_STORE)) {
        db.createObjectStore(PLAN_STORE, { keyPath: 'date' });
      }
    };
    req.onsuccess = (e) => resolve(e.target.result);
    req.onerror = () => reject(req.error);
  });
}

/** Persist a plan object keyed by plan.date. Silently no-ops on failure. */
export async function cachePlan(plan) {
  if (!plan?.date) return;
  try {
    const db = await openDb();
    const tx = db.transaction(PLAN_STORE, 'readwrite');
    tx.objectStore(PLAN_STORE).put(plan);
    await new Promise((resolve) => {
      tx.oncomplete = resolve;
      tx.onerror = resolve;
    });
    db.close();
  } catch { /* ignore */ }
}

/** Return the cached plan for the given date, or null if none. */
export async function getCachedPlan(date) {
  try {
    const db = await openDb();
    const result = await new Promise((resolve) => {
      const tx = db.transaction(PLAN_STORE, 'readonly');
      const req = tx.objectStore(PLAN_STORE).get(date);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
    db.close();
    return result;
  } catch {
    return null;
  }
}
