import { json, err, attachTags } from "../../_lib.js";

// GET  /api/posts/:slug    查看文章（浏览量 +1）
// POST /api/posts/:slug    点赞（body: { like: true/false }）
export async function onRequestGet({ env, request, params }) {
  const slug = params.slug;
  const post = await env.DB.prepare(
    `SELECT * FROM posts WHERE slug = ? AND status = 'published'`
  ).bind(slug).first();

  if (!post) return err("文章不存在", 404);

  await env.DB.prepare("UPDATE posts SET views = views + 1 WHERE id = ?").bind(post.id).run();

  const [withTags] = await attachTags(env, [post]);
  return json({ ...withTags, views: post.views + 1 });
}

export async function onRequestPost({ env, request, params }) {
  const slug = params.slug;
  const body = await request.json().catch(() => null);
  const like = body && body.like;
  const delta = like ? 1 : -1;

  const post = await env.DB.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first();
  if (!post) return err("文章不存在", 404);

  const updated = await env.DB.prepare(
    "UPDATE posts SET likes = MAX(0, likes + ?) WHERE id = ?"
  ).bind(delta, post.id).run();
  const row = await env.DB.prepare("SELECT likes FROM posts WHERE id = ?").bind(post.id).first();

  return json({ likes: row.likes });
}
