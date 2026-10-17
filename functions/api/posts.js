import { json, err, toInt, attachTags } from "../_lib.js";

// GET /api/posts?q=&category=&tag=&page=&size=
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const category = url.searchParams.get("category") || "";
  const tag = url.searchParams.get("tag") || "";
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const size = Math.min(50, Math.max(1, toInt(url.searchParams.get("size"), 12)));

  const where = ["status = 'published'"];
  const params = [];
  if (q) {
    const like = `%${q}%`;
    where.push("(title LIKE ? OR description LIKE ? OR content LIKE ?)");
    params.push(like, like, like);
  }
  if (category) {
    where.push("category = ?");
    params.push(category);
  }
  if (tag) {
    where.push("id IN (SELECT pt.post_id FROM post_tags pt JOIN tags t ON pt.tag_id = t.id WHERE t.slug = ?)");
    params.push(tag);
  }
  const whereSql = where.join(" AND ");

  const total = await env.DB.prepare(
    `SELECT COUNT(*) AS c FROM posts WHERE ${whereSql}`
  ).bind(...params).first();

  const rows = await env.DB.prepare(
    `SELECT id, title, slug, description, cover, category, status, is_pinned,
            views, likes, word_count, reading_time, published_at, created_at, updated_at
     FROM posts WHERE ${whereSql}
     ORDER BY is_pinned DESC, COALESCE(published_at, created_at) DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, size, (page - 1) * size).all();

  const items = await attachTags(env, rows.results);
  return json({ items, total: total.c, page, size, hasMore: page * size < total.c });
}
