/* photos.js — 照片墙瀑布流 + 灯箱 */

async function load() {
  const wrap = document.getElementById("photo-wall");
  try {
    const data = await api("/photos?size=200");
    if (!data.items.length) {
      wrap.innerHTML = `<div class="empty">${ICONS.empty}<span>暂无照片</span></div>`;
      return;
    }
    wrap.innerHTML = data.items.map((p) => `
      <div class="photo-card ${p.orientation === "portrait" ? "portrait" : "landscape"}">
        <div class="tape"></div>
        <img src="${esc(p.url)}" loading="lazy" alt="${esc(p.caption || "照片")}">
        ${p.caption ? `<div class="caption">${esc(p.caption)}</div>` : ""}
      </div>`).join("");
  } catch (e) {
    wrap.innerHTML = `<div class="empty"><span>${esc(e.message)}</span></div>`;
  }
}

document.addEventListener("DOMContentLoaded", () => {
  load();
  document.addEventListener("click", (e) => {
    if (e.target.tagName === "IMG" && e.target.closest(".photo-card")) {
      let box = document.getElementById("lightbox");
      if (!box) {
        box = document.createElement("div");
        box.className = "lightbox";
        box.id = "lightbox";
        box.innerHTML = `<button class="close">${ICONS.close}</button><img src="" alt="">`;
        document.body.appendChild(box);
        box.addEventListener("click", () => box.classList.remove("open"));
      }
      box.querySelector("img").src = e.target.src;
      box.classList.add("open");
    }
  });
});
