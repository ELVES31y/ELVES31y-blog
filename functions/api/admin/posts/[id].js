import { json, err, readJson, requireAuth, attachTags, saveTags, slugify, now } from "../../../_lib.js";

// GET    /api/admin/posts/:id   单篇详情
// PUT    /api/admin/posts/:id   更新
// DELETE /api/admin/posts/:id   删除
export async function onRequestGet({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const post = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(params.id).first();
  if (!post) return err("文章不存在", 404);

  const [withTags] = await attachTags(env, [post]);
  return json(withTags);
}

export async function onRequestPut({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const id = parseInt(params.id, 10);
  const post = await env.DB.prepare("SELECT * FROM posts WHERE id = ?").bind(id).first();
  if (!post) return err("文章不存在", 404);

  const body = await readJson(request);
  if (!body) return err("请求格式错误");

  const title = String(body.title ?? post.title).trim();
  const content = String(body.content ?? post.content);
  const status = body.status === "draft" ? "draft" : body.status === "published" ? "published" : post.status;
  const isPinned = body.is_pinned === undefined ? post.is_pinned : (body.is_pinned ? 1 : 0);

  let slug = post.slug;
  if (body.slug && String(body.slug).trim() && String(body.slug).trim() !== post.slug) {
    slug = slugify(body.slug);
    const dup = await env.DB.prepare("SELECT id FROM posts WHERE slug = ? AND id != ?").bind(slug, id).first();
    if (dup) return err(`网址别名已被占用：${slug}`, 409);
  }

  const publishedAt = status === "published"
    ? (body.published_at || post.published_at || now())
    : null;

  const wordCount = content.length;
  const readingTime = Math.max(1, Math.round(wordCount / 400));

  await env.DB.prepare(
    `UPDATE posts SET title = ?, slug = ?, description = ?, cover = ?, category = ?, content = ?,
       status = ?, is_pinned = ?, word_count = ?, reading_time = ?, published_at = ?, updated_at = ?
     WHERE id = ?`
  ).bind(
    title, slug,
    String(body.description ?? post.description).trim(),
    String(body.cover ?? post.cover).trim(),
    String(body.category ?? post.category).trim(),
    content, status, isPinned, wordCount, readingTime, publishedAt, now(), id
  ).run();

  if (Array.isArray(body.tags)) await saveTags(env, id, body.tags);

  return json({ id, slug });
}

export async function onRequestDelete({ env, request, params }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const id = parseInt(params.id, 10);
  await env.DB.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM comments WHERE post_id = ?").bind(id).run();
  await env.DB.prepare("DELETE FROM posts WHERE id = ?").bind(id).run();
  return json({ ok: true });
}
