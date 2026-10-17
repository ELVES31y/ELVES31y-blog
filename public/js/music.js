/* music.js — 音乐播放器（APlayer CDN） */

let player = null;

async function load() {
  const wrap = document.getElementById("player");
  try {
    const data = await api("/music");
    if (!data.items.length) {
      wrap.innerHTML = `<div class="empty">${ICONS.music}<span>歌单还是空的，去后台添加歌曲吧</span></div>`;
      return;
    }
    if (window.APlayer) {
      player = new APlayer({
        container: wrap,
        autoplay: false,
        fixed: false,
        listFolded: false,
        order: "list",
        audio: data.items,
      });
    } else {
      wrap.innerHTML = `<div class="empty"><span>播放器加载失败，请检查网络</span></div>`;
    }
  } catch (e) {
    wrap.innerHTML = `<div class="empty"><span>${esc(e.message)}</span></div>`;
  }
}

document.addEventListener("DOMContentLoaded", load);
