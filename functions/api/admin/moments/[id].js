import { json, err, readJson, requireAuth } from "../../../_lib.js";

// PUT    /api/admin/moments/:id   更新
// DELETE /api/admin/moments/:id   删除
export async function onRequestPut({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const id = parseInt(params.id, 10);
  const m = await env.DB.prepare("SELECT * FROM moments WHERE id = ?").bind(id).first();
  if (!m) return err("说说不存在", 404);

  const body = await readJson(request);
  if (!body) return err("请求格式错误");

  const content = String(body.content ?? m.content).trim();
  const status = body.status === "draft" ? "draft" : body.status === "published" ? "published" : m.status;
  let images = m.images;
  if (Array.isArray(body.images)) images = JSON.stringify(body.images.filter(Boolean));

  await env.DB.prepare(
    "UPDATE moments SET content = ?, images = ?, mood = ?, status = ? WHERE id = ?"
  ).bind(content, images, String(body.mood ?? m.mood).trim(), status, id).run();

  return json({ id });
}

export async function onRequestDelete({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  await env.DB.prepare("DELETE FROM moments WHERE id = ?").bind(parseInt(params.id, 10)).run();
  return json({ ok: true });
}
