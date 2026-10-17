import { json, err, readJson, requireAuth } from "../../../_lib.js";

// PUT    /api/admin/music/:id   更新
// DELETE /api/admin/music/:id   删除
export async function onRequestPut({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const id = parseInt(params.id, 10);
  const t = await env.DB.prepare("SELECT * FROM music_tracks WHERE id = ?").bind(id).first();
  if (!t) return err("歌曲不存在", 404);

  const body = await readJson(request);
  if (!body) return err("请求格式错误");

  await env.DB.prepare(
    `UPDATE music_tracks SET title = ?, artist = ?, url = ?, cover = ?, lrc = ?, sort = ? WHERE id = ?`
  ).bind(
    String(body.title ?? t.title).trim(),
    String(body.artist ?? t.artist).trim(),
    String(body.url ?? t.url).trim(),
    String(body.cover ?? t.cover).trim(),
    String(body.lrc ?? t.lrc),
    body.sort === undefined ? t.sort : (parseInt(body.sort, 10) || 0),
    id
  ).run();

  return json({ id });
}

export async function onRequestDelete({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  await env.DB.prepare("DELETE FROM music_tracks WHERE id = ?").bind(parseInt(params.id, 10)).run();
  return json({ ok: true });
}
