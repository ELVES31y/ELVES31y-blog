import { json, requireAuth, toInt } from "../../../_lib.js";

// GET /api/admin/comments?post_id=&status=&page=&size=
// 说明：评论列表接口（管理端），用于「评论管理」页。
export async function onRequestGet({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const postId = toInt(url.searchParams.get("post_id"), 0);
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const size = Math.min(200, Math.max(1, toInt(url.searchParams.get("size"), 100)));

  const where = ["1 = 1"];
  const params = [];
  if (postId) { where.push("c.post_id = ?"); params.push(postId); }
  if (status) { where.push("c.status = ?"); params.push(status); }
  const whereSql = where.join(" AND ");

  const total = await env.DB.prepare(
    `SELECT COUNT(*) AS c FROM comments c WHERE ${whereSql}`
  ).bind(...params).first();

  const rows = await env.DB.prepare(
    `SELECT c.*, p.title AS post_title, p.slug AS post_slug
     FROM comments c LEFT JOIN posts p ON p.id = c.post_id
     WHERE ${whereSql}
     ORDER BY c.created_at DESC LIMIT ? OFFSET ?`
  ).bind(...params, size, (page - 1) * size).all();

  return json({ items: rows.results, total: total.c, page, size });
}
