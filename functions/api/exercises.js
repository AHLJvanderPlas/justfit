import { loadAreas } from './_shared/injuryLoad.js';
import { exerciseImages } from './_shared/exerciseMedia.js';

export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const tags = url.searchParams.get('tags'); // e.g. "no_floor,low_impact"
    const category = url.searchParams.get('category');

    let query = `SELECT id, slug, name, name_nl, category, tags_json, equipment_required_json, 
                        instructions_json, metrics_json, alternatives_json,
                        primary_muscles_json, secondary_muscles_json, media_json
                 FROM exercises WHERE is_active = 1
                   -- This endpoint is PUBLIC (no session), so it cannot scope by
                   -- membership: gym-private rows are never served here. Members
                   -- get theirs through the planner's scoped query.
                   AND gym_id IS NULL`;
    const binds = [];

    if (category) {
      query += ` AND category = ?`;
      binds.push(category);
    }

    const result = await env.DB.prepare(query).bind(...binds).all();
    let exercises = result.results;

    // Filter by tags client-side (SQLite JSON array filtering is verbose)
    if (tags) {
      const required = tags.split(',');
      exercises = exercises.filter(ex => {
        const exTags = JSON.parse(ex.tags_json || '[]');
        return required.every(t => exTags.includes(t));
      });
    }

    // Finding 0 — each row says which injury areas it loads (the planner's own model), so
    // the workout's alternatives sheet never offers a swap that loads a sore area.
    // Media 1 — the two photo paths (or null) instead of the raw media_json.
    exercises = exercises.map(({ primary_muscles_json: _p, secondary_muscles_json: _s, media_json: _m, ...ex }) =>
      ({ ...ex, images: exerciseImages(_m), load_areas: [...loadAreas({ ...ex, primary_muscles_json: _p, secondary_muscles_json: _s })] }));

    return Response.json({ exercises });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
