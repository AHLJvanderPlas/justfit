export async function onRequestGet({ request, env }) {
  try {
    const url = new URL(request.url);
    const tags = url.searchParams.get('tags'); // e.g. "no_floor,low_impact"
    const category = url.searchParams.get('category');

    let query = `SELECT id, slug, name, category, tags_json, equipment_required_json, 
                        instructions_json, metrics_json, alternatives_json
                 FROM exercises WHERE is_active = 1`;
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

    return Response.json({ exercises });
  } catch (e) {
    console.error(e); return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
