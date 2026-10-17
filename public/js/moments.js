/* moments.js — 说说时间线，按日期分组 */

function dayLabel(iso) {
  const d = new Date(iso);
  return `${d.getMonth() + 1}月${d.getDate()}日`;
}

async function load() {
  const wrap = document.getElementById("moment-list");
  try {
    const data = await api("/moments?size=100");
    if (!data.items.length) {
      wrap.innerHTML = `<div class="empty">${ICONS.empty}<span>暂无说说</span></div>`;
      return;
    }
    wrap.innerHTML = groupMoments(data.items);
  } catch (e) {
    wrap.innerHTML = `<div class="empty"><span>${esc(e.message)}</span></div>`;
  }
}

function groupMoments(items) {
  const groups = new Map();
  for (const m of items) {
    const key = (m.created_at || "").slice(0, 10);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(m);
  }
  return [...groups.entries()].map(([key, list]) => `
    <div class="moment-group">
      <div class="g-head">
        <span class="date">${dayLabel(list[0].created_at)}</span>
        <span class="cnt">${list.length} 条</span>
        <span class="line"></span>
      </div>
      ${list.map((m, i) => momentCard(m, i)).join("")}
    </div>`).join("");
}

function momentCard(m, i) {
  const rot = [-1.5, 1, -0.8, 1.2][i % 4];
  const imgs = (m.images || []).slice(0, 9);
  const grid = imgs.length ? (imgs.length <= 2 ? "" : "cols-3") : "";
  return `
  <div class="moment-card glass-card fade-in" style="transform:rotate(${rot}deg)" data-i="${i}">
    <div class="m-head">
      <div class="avatar" style="background:linear-gradient(135deg,var(--indigo),var(--purple))">${avatarHtml()}</div>
      <span class="who">${esc(SITE.author)}</span>
      ${m.mood ? `<span class="mood">${esc(m.mood)}</span>` : ""}
      <span class="time">${relTime(m.created_at)}</span>
    </div>
    <div class="m-content">${esc(m.content)}</div>
    ${imgs.length ? `<div class="m-images ${grid}">${imgs.map((src) => `<img src="${esc(src)}" loading="lazy" data-lb="${esc(src)}" alt="">`).join("")}</div>` : ""}
  </div>`;
}

// 图片点击 → 灯箱
document.addEventListener("DOMContentLoaded", () => {
  load();
  document.addEventListener("click", (e) => {
    const src = e.target.dataset && e.target.dataset.lb;
    if (src) {
      let box = document.getElementById("lightbox");
      if (!box) {
        box = document.createElement("div");
        box.className = "lightbox";
        box.id = "lightbox";
        box.innerHTML = `<button class="close">${ICONS.close}</button><img src="" alt="">`;
        document.body.appendChild(box);
        box.addEventListener("click", () => box.classList.remove("open"));
      }
      box.querySelector("img").src = src;
      box.classList.add("open");
    }
  });
});
