import { json, getSetting } from "../_lib.js";

// GET /api/music  返回 APlayer 需要的歌单 + 是否自动播放
export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(
    `SELECT id, title, artist, url, cover, lrc FROM music_tracks
     ORDER BY sort ASC, id ASC`
  ).all();

  const items = rows.results.map((t) => ({
    name: t.title,
    artist: t.artist || "未知",
    url: t.url,
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
