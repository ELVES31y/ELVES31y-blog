import { json } from "../_lib.js";

// GET /api/categories  分类列表（从文章里统计，带文章数）
export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(
    `SELECT category, COUNT(*) AS count FROM posts
     WHERE status = 'published'
     GROUP BY category
     ORDER BY count DESC, category ASC`
  ).all();

  return json({ items: rows.results.map((r) => ({ name: r.category, count: r.count })) });
}
