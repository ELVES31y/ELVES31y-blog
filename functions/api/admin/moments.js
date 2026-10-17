import { json, err, readJson, requireAuth, toInt, now } from "../../../_lib.js";

// GET  /api/admin/moments?page=&size=
// POST /api/admin/moments   新建说说
export async function onRequestGet({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const size = Math.min(100, Math.max(1, toInt(url.searchParams.get("size"), 50)));

  const total = await env.DB.prepare("SELECT COUNT(*) AS c FROM moments").first();
  const rows = await env.DB.prepare(
    "SELECT * FROM moments ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(size, (page - 1) * size).all();

  const items = rows.results.map((m) => {
    let images = [];
    try { images = JSON.parse(m.images || "[]"); } catch {}
    return { ...m, images: Array.isArray(images) ? images : [] };
  });

  return json({ items, total: total.c, page, size });
}

export async function onRequestPost({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return err("请求格式错误");
  const content = String(body.content || "").trim();
  if (!content) return err("内容不能为空");

  const status = body.status === "draft" ? "draft" : "published";
  const images = JSON.stringify(Array.isArray(body.images) ? body.images.filter(Boolean) : []);
  const info = await env.DB.prepare(
    "INSERT INTO moments (content, images, mood, status) VALUES (?, ?, ?, ?)"
  ).bind(content, images, String(body.mood || "").trim(), status).run();

  return json({ id: info.meta.last_row_id }, 201);
}
