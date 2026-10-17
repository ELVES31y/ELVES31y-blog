import { json, toInt } from "../_lib.js";

// GET /api/moments?page=&size=
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const size = Math.min(100, Math.max(1, toInt(url.searchParams.get("size"), 50)));

  const total = await env.DB.prepare(
    "SELECT COUNT(*) AS c FROM moments WHERE status = 'published'"
  ).first();

  const rows = await env.DB.prepare(
    `SELECT id, content, images, mood, likes, created_at FROM moments
     WHERE status = 'published'
     ORDER BY created_at DESC
     LIMIT ? OFFSET ?`
  ).bind(size, (page - 1) * size).all();

  const items = rows.results.map((m) => {
    let images = [];
    try { images = JSON.parse(m.images || "[]"); } catch {}
    return { ...m, images: Array.isArray(images) ? images : [] };
  });

  return json({ items, total: total.c, page, size, hasMore: page * size < total.c });
}
