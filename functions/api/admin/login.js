import { json, err, readJson, sha256Hex, makeToken, getSetting, hasSecret } from "../../_lib.js";

// POST /api/admin/login  body: { password }
export async function onRequestPost({ env, request }) {
  const body = await readJson(request);
  const password = body && String(body.password || "");
  if (!password) return err("请输入密码");

  const salt = await getSetting(env, "admin_salt");
  const hash = await getSetting(env, "admin_hash");
  if (!salt || !hash) return err("站点还未初始化，请先执行 schema.sql", 500);

  const inputHash = await sha256Hex(salt + password);
  if (inputHash !== hash) return err("密码错误", 401);

  if (!hasSecret(env.ADMIN_SECRET)) {
    return err("服务器还没配置 ADMIN_SECRET，请先在环境变量里填好", 500);
  }
  const token = await makeToken(env.ADMIN_SECRET);
  return json({ token });
}
