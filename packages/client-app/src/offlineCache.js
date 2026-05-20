/**
 * offlineCache.js — IndexedDB-backed offline cache for today's plan.
 *
 * Used as a read-through fallback when the API is unreachable (gym wifi, etc.).
 * Write: after every successful plan load/generate.
 * Read: when getTodayPlan or generatePlan fails with a network error.
 */

const DB_NAME = 'jf-offline';
const DB_VERSION = 2;          // bumped: added exercises store
const PLAN_STORE      = 'plans';
const EXERCISE_STORE  = 'exercises';

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(PLAN_STORE)) {
        db.createObjectStore(PLAN_STORE, { keyPath: 'date' });
      }
      if (!db.objectStoreNames.contains(EXERCISE_STORE)) {
        db.createObjectStore(EXERCISE_STORE, { keyPath: 'slug' });
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

/** Persist an array of exercise objects by slug. Silently no-ops on failure. */
export async function cacheExercises(exercises) {
  if (!exercises?.length) return;
  try {
    const db = await openDb();
    const tx = db.transaction(EXERCISE_STORE, 'readwrite');
    const store = tx.objectStore(EXERCISE_STORE);
    for (const ex of exercises) {
      if (ex?.slug) store.put(ex);
    }
    await new Promise((resolve) => { tx.oncomplete = resolve; tx.onerror = resolve; });
    db.close();
  } catch { /* ignore */ }
}

/** Return cached exercises for the given slugs. Missing slugs are silently omitted. */
export async function getCachedExercises(slugs) {
  if (!slugs?.length) return [];
  try {
    const db = await openDb();
    const results = await new Promise((resolve) => {
      const tx = db.transaction(EXERCISE_STORE, 'readonly');
      const store = tx.objectStore(EXERCISE_STORE);
      const found = [];
      let pending = slugs.length;
      slugs.forEach(slug => {
        const req = store.get(slug);
        req.onsuccess = () => { if (req.result) found.push(req.result); if (--pending === 0) resolve(found); };
        req.onerror  = () => { if (--pending === 0) resolve(found); };
      });
    });
    db.close();
    return results;
  } catch {
    return [];
  }
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
