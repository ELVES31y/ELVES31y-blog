import { json, getSetting } from "../_lib.js";

// 把历史遗留的各种写法统一转成当前实际存在的站内路径
function normalizeUrl(u) {
  if (!u) return u;
  const s = String(u).trim();

  // 必须放在最前面：这条要在 github 规则之前执行，否则会被提前 return 掉
  // 无论 D1 里存的是 blob 链接、旧 mp3、还是已删除的 flac，都指向现在这个文件
  if (/phonk/i.test(s)) return "/music/xz-phonk.mp3";

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
