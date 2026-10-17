import { json, err, readJson, requireAuth } from "../../_lib.js";

// GET  /api/admin/music   全部歌曲
// POST /api/admin/music   新增歌曲
export async function onRequestGet({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const rows = await env.DB.prepare("SELECT * FROM music_tracks ORDER BY sort ASC, id ASC").all();
  return json({ items: rows.results });
}

export async function onRequestPost({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return err("请求格式错误");
  const title = String(body.title || "").trim();
  const url = String(body.url || "").trim();
  if (!title) return err("歌曲名不能为空");
  if (!url) return err("歌曲地址不能为空");

  const info = await env.DB.prepare(
    "INSERT INTO music_tracks (title, artist, url, cover, lrc, sort) VALUES (?, ?, ?, ?, ?, ?)"
  ).bind(
    title,
    String(body.artist || "").trim(),
    url,
    String(body.cover || "").trim(),
    String(body.lrc || ""),
    parseInt(body.sort, 10) || 0
  ).run();

  return json({ id: info.meta.last_row_id }, 201);
}
