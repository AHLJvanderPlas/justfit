// ─── Admin: Enrich exercises from ExerciseDB ──────────────────────────────────
// POST /api/enrich-exercises
// Headers: X-Admin-Key: <env.ADMIN_KEY>
//
// Fetches exercises from ExerciseDB (free tier: up to 10), matches against our
// D1 exercises by normalised name, updates primary/secondary muscles on matched
// rows, and inserts unmatched ones (no GIF — free tier has no gifUrl field).
// Returns: { ok, matched, inserted, skipped }

function normalize(name) {
  return name
    .toLowerCase()
    .replace(/[-_]/g, ' ')
    .replace(/[^a-z0-9 ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function mapCategory(bodyPart) {
  if (bodyPart === 'cardio') return 'cardio';
  if (['yoga', 'stretching'].includes(bodyPart)) return 'mobility';
  return 'strength';
}

function mapEquipment(equipment) {
  const map = {
    'body weight': 'none',
    'dumbbell':    'dumbbell',
    'barbell':     'barbell',
    'ez barbell':  'barbell',
    'trap bar':    'barbell',
    'kettlebell':  'kettlebell',
    'cable':       'cable',
    'band':        'band',
  };
  return [map[equipment] ?? 'gym'];
}

function mapTags(edb) {
  const tags = [mapCategory(edb.bodyPart)];
  if (edb.equipment === 'body weight') {
    tags.push('bodyweight', 'no_gear');
  }
  if (['chest', 'upper arms', 'shoulders'].includes(edb.bodyPart)) tags.push('upper_body');
  if (['upper legs', 'lower legs'].includes(edb.bodyPart)) tags.push('lower_body');
  if (edb.bodyPart === 'waist') tags.push('core');
  if (edb.bodyPart === 'cardio') tags.push('high_impact');
  return tags;
}

export async function onRequestPost({ request, env }) {
  // ── Auth ──────────────────────────────────────────────────────────────────
  const adminKey = request.headers.get('X-Admin-Key');
  if (!env.ADMIN_KEY || adminKey !== env.ADMIN_KEY) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!env.EXERCISEDB_API_KEY) {
    return Response.json({ error: 'EXERCISEDB_API_KEY not configured' }, { status: 500 });
  }

  // ── Fetch from ExerciseDB ─────────────────────────────────────────────────
  const edbRes = await fetch(
    'https://exercisedb.p.rapidapi.com/exercises?limit=150&offset=0',
    {
      headers: {
        'X-RapidAPI-Key':  env.EXERCISEDB_API_KEY,
        'X-RapidAPI-Host': 'exercisedb.p.rapidapi.com',
      },
    }
  );

  if (!edbRes.ok) {
    const body = await edbRes.text().catch(() => '');
    return Response.json({ error: `ExerciseDB error ${edbRes.status}: ${body}` }, { status: 502 });
  }

  const edbExercises = await edbRes.json();
  if (!Array.isArray(edbExercises)) {
    return Response.json({ error: 'Unexpected ExerciseDB response shape' }, { status: 502 });
  }

  // ── Fetch our exercises ───────────────────────────────────────────────────
  const ourResult = await env.DB.prepare(
    'SELECT id, slug, name FROM exercises WHERE is_active = 1'
  ).all();

  // Build lookup: normalised name → our exercise row
  const ourByNorm = new Map();
  for (const ex of ourResult.results) {
    ourByNorm.set(normalize(ex.name), ex);
  }

  // ── Build batch statements ────────────────────────────────────────────────
  let matched = 0, inserted = 0, skipped = 0;
  const now = Date.now();
  const stmts = [];

  for (const edb of edbExercises) {
    if (!edb.name) { skipped++; continue; }

    const norm  = normalize(edb.name);
    const our   = ourByNorm.get(norm);
    const primaryMuscles   = JSON.stringify([edb.target].filter(Boolean));
    const secondaryMuscles = JSON.stringify(Array.isArray(edb.secondaryMuscles) ? edb.secondaryMuscles : []);

    if (our) {
      // Update muscles only — don't overwrite hand-tuned fields or media
      stmts.push(
        env.DB.prepare(
          `UPDATE exercises
           SET primary_muscles_json = ?, secondary_muscles_json = ?, updated_at_ms = ?
           WHERE id = ?`
        ).bind(primaryMuscles, secondaryMuscles, now, our.id)
      );
      matched++;
    } else {
      // Insert new exercise from ExerciseDB (no GIF on free tier)
      const slug     = slugify(edb.name);
      const name     = edb.name.charAt(0).toUpperCase() + edb.name.slice(1);
      const category = mapCategory(edb.bodyPart);
      const equipment  = JSON.stringify(mapEquipment(edb.equipment));
      const tags       = JSON.stringify(mapTags(edb));
      const metrics    = JSON.stringify({
        supports: category === 'cardio' ? ['time', 'sets'] : ['reps', 'sets'],
      });
      const instructions = JSON.stringify({
        steps: Array.isArray(edb.instructions) ? edb.instructions : [],
        cues:  [],
      });

      stmts.push(
        env.DB.prepare(
          `INSERT INTO exercises
             (id, slug, name, category,
              primary_muscles_json, secondary_muscles_json, tags_json,
              equipment_required_json, instructions_json, metrics_json,
              is_active, created_at_ms, updated_at_ms)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`
        ).bind(
          crypto.randomUUID(), slug, name, category,
          primaryMuscles, secondaryMuscles, tags,
          equipment, instructions, metrics,
          now, now
        )
      );
      inserted++;
    }
  }

  // D1 batch limit is 100 statements — chunk if needed
  for (let i = 0; i < stmts.length; i += 100) {
    await env.DB.batch(stmts.slice(i, i + 100));
  }

  return Response.json({
    ok: true,
    total_from_edb: edbExercises.length,
    matched,
    inserted,
    skipped,
  });
}
