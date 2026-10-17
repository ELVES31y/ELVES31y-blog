import { json } from "../_lib.js";

// GET /api/tags  标签列表（带文章数）
export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(
    `SELECT t.name, t.slug, COUNT(pt.post_id) AS count
     FROM tags t
     LEFT JOIN post_tags pt ON pt.tag_id = t.id
     LEFT JOIN posts p ON p.id = pt.post_id AND p.status = 'published'
     GROUP BY t.id
     ORDER BY count DESC, t.name ASC`
  ).all();

  return json({ items: rows.results.map((r) => ({ name: r.name, slug: r.slug, count: r.count })) });
}
