import { json, err, requireAuth } from "../../_lib.js";

// POST /api/admin/upload   (multipart/form-data，字段名 file)
// 把图片传到 R2，返回公开访问地址
export async function onRequestPost({ env, request }) {
  const denied = await requireAuth(request, env);
  if (denied) return denied;

  // 没绑定 R2 时给出明确提示，而不是抛 500
  if (!env.R2) {
    return err("还没启用 R2 存储，请改用「填图片外链」的方式添加照片", 503);
  }

  const form = await request.formData().catch(() => null);
  if (!form) return err("请用 multipart/form-data 上传");
  const file = form.get("file");
  if (!file || typeof file === "string") return err("没有收到文件，字段名必须是 file");

  const isImage = file.type && file.type.startsWith("image/");
  if (!isImage) return err("只能上传图片文件");
  if (file.size > 10 * 1024 * 1024) return err("图片不能超过 10MB");

  const buf = await file.arrayBuffer();
  const ext = (file.name.match(/\.([a-zA-Z0-9]+)$/) || [])[1] || "jpg";
  const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext.toLowerCase()}`;

  await env.R2.put(key, buf, {
    httpMetadata: { contentType: file.type || "application/octet-stream" },
  });

  const base = (env.R2_PUBLIC_BASE || "").replace(/\/+$/, "");
  const url = base ? `${base}/${key}` : key;
  return json({ url }, 201);
}
