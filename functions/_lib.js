// ============================================================
//  functions/_lib.js — 所有接口共用的工具函数
//  文件名以 _ 开头，Pages 不会把它当成一个公开路由。
// ============================================================

const encoder = new TextEncoder();

/** 返回 JSON 响应 */
export function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

/** 返回错误响应 */
export function err(msg, status = 400) {
  return json({ error: msg }, status);
}

/** 生成文章 slug：中文保留，空格和符号换成短横线 */
export function slugify(s) {
  const base = String(s || "").trim().toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "post-" + Date.now().toString(36);
}

/** 当前时间 ISO 字符串 */
export function now() {
  return new Date().toISOString();
}

/** 安全读取 JSON body，读不到返回 null */
export async function readJson(request) {
  try {
    return await request.json();
  } catch {
    return null;
  }
}

/** 把数字字符串安全转成整数，失败给默认值 */
export function toInt(v, def = 0) {
  const n = parseInt(v, 10);
  return Number.isNaN(n) ? def : n;
}

// ---------------- 密码 / 令牌 ----------------

function b64url(bytes) {
  const arr = typeof bytes === "string" ? encoder.encode(bytes) : new Uint8Array(bytes);
  let bin = "";
  for (const b of arr) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 计算 sha256 十六进制摘要 */
export async function sha256Hex(text) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(String(text)));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

async function hmac(secret, text) {
  const key = await crypto.subtle.importKey(
    "raw", encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(text));
  return b64url(sig);
}

/** 用 ADMIN_SECRET 生成一个 7 天有效的登录令牌 */
export async function makeToken(secret) {
  const payload = { exp: Date.now() + 7 * 24 * 3600 * 1000 };
  const body = b64url(JSON.stringify(payload));
  const sig = await hmac(secret, body);
  return `${body}.${sig}`;
}

function b64decode(s) {
  let t = s.replace(/-/g, "+").replace(/_/g, "/");
  while (t.length % 4) t += "=";
  return atob(t);
}

/** 检查 ADMIN_SECRET 是否已经配置成一个像样的密钥（防止用占位符上线） */
export function hasSecret(secret) {
  return typeof secret === "string" && secret.length >= 16 && !secret.includes("<");
}

/** 校验请求头里的 Bearer 令牌是否有效 */
export async function verifyToken(request, secret) {
  if (!hasSecret(secret)) return false;
  const auth = request.headers.get("Authorization") || "";
  const token = auth.replace(/^Bearer\s+/i, "");
  const [body, sig] = token.split(".");
  if (!body || !sig) return false;
  const expect = await hmac(secret, body);
  if (expect !== sig) return false;
  try {
    const payload = JSON.parse(b64decode(body));
    return typeof payload.exp === "number" && payload.exp > Date.now();
  } catch {
    return false;
  }
}

/** 后台接口的身份校验：不通过时返回 401 响应，通过时返回 null */
export async function requireAuth(request, env) {
  if (!hasSecret(env.ADMIN_SECRET)) {
    return err("服务器还没配置 ADMIN_SECRET，请先在环境变量里填好", 500);
  }
  if (await verifyToken(request, env.ADMIN_SECRET)) return null;
  return err("未登录或登录已过期", 401);
}

/** 从 D1 读设置值 */
export async function getSetting(env, key) {
  const row = await env.DB.prepare("SELECT value FROM settings WHERE key = ?").bind(key).first();
  return row ? row.value : null;
}

/** 给一批文章挂上它们的标签数组（posts 需包含 id 字段） */
export async function attachTags(env, posts) {
  if (!posts || !posts.length) return posts || [];
  const ids = posts.map((p) => p.id);
  const placeholders = ids.map(() => "?").join(",");
  const rows = await env.DB.prepare(
    `SELECT pt.post_id, t.name, t.slug FROM post_tags pt
     JOIN tags t ON pt.tag_id = t.id
     WHERE pt.post_id IN (${placeholders})`
  ).bind(...ids).all();
  const map = {};
  for (const r of rows.results) {
    (map[r.post_id] = map[r.post_id] || []).push({ name: r.name, slug: r.slug });
  }
  return posts.map((p) => ({ ...p, is_pinned: !!p.is_pinned, tags: map[p.id] || [] }));
}

/** 给一篇文章保存标签：先把旧的清掉，再按名字查找/新建并关联 */
export async function saveTags(env, postId, tagNames) {
  await env.DB.prepare("DELETE FROM post_tags WHERE post_id = ?").bind(postId).run();
  const names = [...new Set((tagNames || []).map((t) => String(t).trim()).filter(Boolean))];
  for (const name of names) {
    const slug = slugify(name);
    let tag = await env.DB.prepare("SELECT id FROM tags WHERE slug = ?").bind(slug).first();
    if (!tag) {
      const info = await env.DB.prepare("INSERT INTO tags (name, slug) VALUES (?, ?)").bind(name, slug).run();
      tag = { id: info.meta.last_row_id };
    }
    await env.DB.prepare("INSERT OR IGNORE INTO post_tags (post_id, tag_id) VALUES (?, ?)").bind(postId, tag.id).run();
  }
}
