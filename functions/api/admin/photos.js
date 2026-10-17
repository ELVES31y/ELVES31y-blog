import { json, err, readJson, requireAuth, toInt } from "../../_lib.js";

// GET  /api/admin/photos?page=&size=
// POST /api/admin/photos   新增照片（body: url, caption, orientation）
export async function onRequestGet({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const size = Math.min(200, Math.max(1, toInt(url.searchParams.get("size"), 60)));

  const total = await env.DB.prepare("SELECT COUNT(*) AS c FROM photos").first();
  const rows = await env.DB.prepare(
    "SELECT * FROM photos ORDER BY created_at DESC LIMIT ? OFFSET ?"
  ).bind(size, (page - 1) * size).all();

  return json({ items: rows.results, total: total.c, page, size });
}

export async function onRequestPost({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return err("请求格式错误");
  const url = String(body.url || "").trim();
  if (!url) return err("照片地址不能为空（可先用上传功能拿到地址）");

  const orientation = body.orientation === "portrait" ? "portrait" : "landscape";
  const info = await env.DB.prepare(
    "INSERT INTO photos (url, caption, orientation) VALUES (?, ?, ?)"
  ).bind(url, String(body.caption || "").trim(), orientation).run();

  return json({ id: info.meta.last_row_id }, 201);
}
