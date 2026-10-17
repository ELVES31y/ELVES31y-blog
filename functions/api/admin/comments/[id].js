import { json, err, readJson, requireAuth } from "../../../_lib.js";

// PUT    /api/admin/comments/:id   审核评论（body: { status: approved|pending|hidden }）
// DELETE /api/admin/comments/:id   删除
export async function onRequestPut({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const body = await readJson(request);
  const status = body && ["approved", "pending", "hidden"].includes(body.status) ? body.status : null;
  if (!status) return err("status 必须是 approved / pending / hidden");

  const id = parseInt(params.id, 10);
  const c = await env.DB.prepare("SELECT id FROM comments WHERE id = ?").bind(id).first();
  if (!c) return err("评论不存在", 404);

  await env.DB.prepare("UPDATE comments SET status = ? WHERE id = ?").bind(status, id).run();
  return json({ id, status });
}

export async function onRequestDelete({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  await env.DB.prepare("DELETE FROM comments WHERE id = ?").bind(parseInt(params.id, 10)).run();
  return json({ ok: true });
}
