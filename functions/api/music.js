import { json } from "../_lib.js";

// GET /api/music  返回 APlayer 需要的歌单
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
  return json({ items });
}
