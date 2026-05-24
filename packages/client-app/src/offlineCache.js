/**
 * offlineCache.js — IndexedDB-backed offline cache for plans and mutation queue.
 *
 * Stores:
 *   plans      — read-through fallback for today's plan (plan.date as key)
 *   exercises  — fallback for workout alternative exercises (slug as key)
 *   mutations  — outbound write queue for check-ins and executions that failed
 *                to reach the server due to network issues (id as key)
 *
 * Mutation queue replay: on app load and on 'online' events, pending mutations
 * are replayed in order. Mutations older than 7 days are expired silently.
 */

const DB_NAME = 'jf-offline';
const DB_VERSION = 3;          // bumped: added mutations store
const PLAN_STORE      = 'plans';
const EXERCISE_STORE  = 'exercises';
const MUTATION_STORE  = 'mutations';
const MUTATION_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

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
      if (!db.objectStoreNames.contains(MUTATION_STORE)) {
        db.createObjectStore(MUTATION_STORE, { keyPath: 'id' });
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

// ── Mutation queue ────────────────────────────────────────────────────────────

/**
 * Queue a write mutation for later replay.
 * type: 'execution' | 'checkin'
 * payload: everything needed to call the API again
 */
export async function queueMutation(type, payload) {
  try {
    const db = await openDb();
    const tx = db.transaction(MUTATION_STORE, 'readwrite');
    tx.objectStore(MUTATION_STORE).put({ id: crypto.randomUUID(), type, payload, queuedAt: Date.now() });
    await new Promise((resolve) => { tx.oncomplete = resolve; tx.onerror = resolve; });
    db.close();
  } catch { /* ignore — best-effort queue */ }
}

/** Return all pending mutations, oldest first, excluding expired entries. */
export async function getPendingMutations() {
  try {
    const db = await openDb();
    const all = await new Promise((resolve) => {
      const tx = db.transaction(MUTATION_STORE, 'readonly');
      const req = tx.objectStore(MUTATION_STORE).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => resolve([]);
    });
    db.close();
    const cutoff = Date.now() - MUTATION_TTL_MS;
    return all.filter(m => m.queuedAt > cutoff).sort((a, b) => a.queuedAt - b.queuedAt);
  } catch {
    return [];
  }
}

/** Remove a successfully replayed mutation from the queue. */
export async function removeMutation(id) {
  try {
    const db = await openDb();
    const tx = db.transaction(MUTATION_STORE, 'readwrite');
    tx.objectStore(MUTATION_STORE).delete(id);
    await new Promise((resolve) => { tx.oncomplete = resolve; tx.onerror = resolve; });
    db.close();
  } catch { /* ignore */ }
}

/** Purge mutations older than TTL (call on app load to keep IDB clean). */
export async function purgeExpiredMutations() {
  try {
    const db = await openDb();
    const all = await new Promise((resolve) => {
      const tx = db.transaction(MUTATION_STORE, 'readonly');
      const req = tx.objectStore(MUTATION_STORE).getAll();
      req.onsuccess = () => resolve(req.result ?? []);
      req.onerror = () => resolve([]);
    });
    const cutoff = Date.now() - MUTATION_TTL_MS;
    const expired = all.filter(m => m.queuedAt <= cutoff);
    if (expired.length === 0) { db.close(); return; }
    const tx2 = db.transaction(MUTATION_STORE, 'readwrite');
    const store = tx2.objectStore(MUTATION_STORE);
    for (const m of expired) store.delete(m.id);
    await new Promise((resolve) => { tx2.oncomplete = resolve; tx2.onerror = resolve; });
    db.close();
  } catch { /* ignore */ }
}
