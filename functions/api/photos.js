import { json, toInt } from "../_lib.js";

// GET /api/photos?page=&size=
export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const size = Math.min(200, Math.max(1, toInt(url.searchParams.get("size"), 60)));

  const total = await env.DB.prepare("SELECT COUNT(*) AS c FROM photos").first();
  const rows = await env.DB.prepare(
    `SELECT id, url, caption, orientation, created_at FROM photos
     ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).bind(size, (page - 1) * size).all();

  return json({ items: rows.results, total: total.c, page, size, hasMore: page * size < total.c });
}
