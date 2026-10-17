import { json, err, readJson, requireAuth, attachTags, saveTags, slugify, toInt, now } from "../../_lib.js";

// GET  /api/admin/posts?q=&status=&page=&size=   全部文章（含草稿）
// POST /api/admin/posts   新建文章
export async function onRequestGet({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const url = new URL(request.url);
  const q = url.searchParams.get("q") || "";
  const status = url.searchParams.get("status") || "";
  const page = Math.max(1, toInt(url.searchParams.get("page"), 1));
  const size = Math.min(100, Math.max(1, toInt(url.searchParams.get("size"), 50)));

  const where = ["1 = 1"];
  const params = [];
  if (q) {
    const like = `%${q}%`;
    where.push("(title LIKE ? OR slug LIKE ?)");
    params.push(like, like);
  }
  if (status) {
    where.push("status = ?");
    params.push(status);
  }
  const whereSql = where.join(" AND ");

  const total = await env.DB.prepare(`SELECT COUNT(*) AS c FROM posts WHERE ${whereSql}`).bind(...params).first();
  const rows = await env.DB.prepare(
    `SELECT * FROM posts WHERE ${whereSql}
     ORDER BY is_pinned DESC, COALESCE(published_at, created_at) DESC
     LIMIT ? OFFSET ?`
  ).bind(...params, size, (page - 1) * size).all();

  const items = await attachTags(env, rows.results);
  return json({ items, total: total.c, page, size });
}

export async function onRequestPost({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return err("请求格式错误");
  const title = String(body.title || "").trim();
  const content = String(body.content || "");
  if (!title) return err("标题不能为空");
  if (!content) return err("正文不能为空");

  const slug = slugify(body.slug || title);
  const status = body.status === "draft" ? "draft" : "published";
  const isPinned = body.is_pinned ? 1 : 0;
  const publishedAt = status === "published" ? (body.published_at || now()) : null;
  const wordCount = content.length;
  const readingTime = Math.max(1, Math.round(wordCount / 400));

  // 保证 slug 唯一
  const exists = await env.DB.prepare("SELECT id FROM posts WHERE slug = ?").bind(slug).first();
  if (exists) return err(`这个网址别名已被占用：${slug}，请换一个`, 409);

  const info = await env.DB.prepare(
    `INSERT INTO posts (title, slug, description, cover, category, content, status, is_pinned, word_count, reading_time, published_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  ).bind(
    title, slug,
    String(body.description || "").trim(),
    String(body.cover || "").trim(),
    String(body.category || "未分类").trim(),
    content, status, isPinned, wordCount, readingTime, publishedAt
  ).run();

  const id = info.meta.last_row_id;
  await saveTags(env, id, body.tags);

  return json({ id, slug }, 201);
}
