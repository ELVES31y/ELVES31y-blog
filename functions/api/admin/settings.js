import { json, err, readJson, requireAuth } from "../../_lib.js";

// 可以通过接口改的设置项白名单（admin_hash / admin_salt 永远不允许改，否则会把后台锁死）
const EDITABLE = new Set(["autoplay", "site_title", "avatar", "notice"]);

// GET  /api/admin/settings   读取全部设置（D1 settings 表）
export async function onRequestGet({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const rows = await env.DB.prepare("SELECT key, value FROM settings").all();
  const map = {};
  for (const r of rows.results) {
    // 密码哈希和盐不下发到前端
    if (r.key === "admin_hash" || r.key === "admin_salt") continue;
    map[r.key] = r.value;
  }
  return json(map);
}

// POST /api/admin/settings   { key, value } 写入或更新
export async function onRequestPost({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  const body = await readJson(request);
  if (!body) return err("请求格式错误");

  const key = String(body.key || "").trim();
  if (!key) return err("key 不能为空");
  if (!EDITABLE.has(key)) return err("这个设置项不允许通过接口修改", 403);

  const value = String(body.value ?? "");
  await env.DB.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
  ).bind(key, value).run();

  return json({ ok: true, key, value });
}
