import { json, err, readJson, now } from "../../../_lib.js";

// GET  /api/posts/:slug/comments   评论列表
// POST /api/posts/:slug/comments   发评论（昵称 + 内容，无需登录）
export async function onRequestGet({ env, params }) {
  const post = await env.DB.prepare("SELECT id FROM posts WHERE slug = ?").bind(params.slug).first();
  if (!post) return err("文章不存在", 404);

  const rows = await env.DB.prepare(
    `SELECT id, nickname, content, created_at FROM comments
     WHERE post_id = ? AND status = 'approved'
     ORDER BY created_at DESC`
  ).bind(post.id).all();
  return json({ items: rows.results });
}

export async function onRequestPost({ env, request, params }) {
  const post = await env.DB.prepare("SELECT id FROM posts WHERE slug = ?").bind(params.slug).first();
  if (!post) return err("文章不存在", 404);

  const body = await readJson(request);
  if (!body) return err("请求格式错误");
  const nickname = String(body.nickname || "").trim().slice(0, 30) || "匿名";
  const content = String(body.content || "").trim();
  if (!content) return err("评论内容不能为空");
  if (content.length > 2000) return err("评论太长了（最多 2000 字）");

  const info = await env.DB.prepare(
    "INSERT INTO comments (post_id, nickname, content, status) VALUES (?, ?, ?, 'approved')"
  ).bind(post.id, nickname, content).run();

  return json({ id: info.meta.last_row_id, nickname, content, created_at: now() }, 201);
}
