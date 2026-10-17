import { json, err, readJson, requireAuth } from "../../../_lib.js";

// PUT    /api/admin/photos/:id   更新（body: url/caption/orientation）
// DELETE /api/admin/photos/:id   删除
export async function onRequestPut({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const id = parseInt(params.id, 10);
  const p = await env.DB.prepare("SELECT * FROM photos WHERE id = ?").bind(id).first();
  if (!p) return err("照片不存在", 404);

  const body = await readJson(request);
  if (!body) return err("请求格式错误");

  const orientation = body.orientation === "portrait" ? "portrait" : body.orientation === "landscape" ? "landscape" : p.orientation;
  await env.DB.prepare(
    "UPDATE photos SET url = ?, caption = ?, orientation = ? WHERE id = ?"
  ).bind(
    String(body.url ?? p.url).trim(),
    String(body.caption ?? p.caption).trim(),
    orientation, id
  ).run();

  return json({ id });
}

export async function onRequestDelete({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  await env.DB.prepare("DELETE FROM photos WHERE id = ?").bind(parseInt(params.id, 10)).run();
  return json({ ok: true });
}
