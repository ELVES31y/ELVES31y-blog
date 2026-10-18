import { json, getSetting } from "../_lib.js";

// 有人会把 GitHub 网页链接（/blob/）当成音频地址填进来，
// 浏览器拿到的是 HTML 页面而不是音频。这里统一转成站内路径。
function normalizeUrl(u) {
  if (!u) return u;
  const s = String(u).trim();

  // 旧文件已替换成高质量 flac，D1 里仍是老名字时自动迁移
  if (/XZ[ %20-]*PHONK\.mp3$/i.test(s)) return "/music/noevo-xz-phonk.flac";

  let m = /^https?:\/\/github\.com\/[^/]+\/[^/]+\/(?:blob|raw)\/[^/]+\/(.+)$/i.exec(s);
  if (m) return "/" + m[1].replace(/^public\//i, "");

  m = /^https?:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[^/]+\/(.+)$/i.exec(s);
  if (m) return "/" + m[1].replace(/^public\//i, "");

  return s;
}

// GET /api/music  返回 APlayer 需要的歌单 + 是否自动播放
export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(
    `SELECT id, title, artist, url, cover, lrc FROM music_tracks
     ORDER BY sort ASC, id ASC`
  ).all();

  const items = rows.results.map((t) => ({
    name: t.title,
    artist: t.artist || "未知",
    url: normalizeUrl(t.url),
    cover: t.cover || "",
    lrc: t.lrc || "",
  }));

  // 自动播放开关存在 settings 表里：默认开，"0" 为关
  let autoplay = true;
  try {
    const v = await getSetting(env, "autoplay");
    if (v === "0") autoplay = false;
  } catch {
    // settings 表还不存在时不影响歌单
  }

  return json({ items, autoplay });
}
