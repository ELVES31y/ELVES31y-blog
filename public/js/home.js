/* home.js — 首页：统计、最新文章、最新说说 */

function postCover(post, extra = "") {
  if (post.cover) return `<img src="${esc(post.cover)}" alt="${esc(post.title)}" ${extra}>`;
  return `<div class="fallback">${esc(post.title)}</div>`;
}

async function load() {
  const [posts, moments, photos] = await Promise.all([
    api("/posts?size=4"),
    api("/moments?size=3"),
    api("/photos?size=6"),
  ]);

  document.getElementById("stat-posts").textContent = posts.total;
  document.getElementById("stat-moments").textContent = moments.total;
  document.getElementById("stat-photos").textContent = photos.total;

  renderLatestPosts(posts.items);
  renderMoments(moments.items);
  renderPhotoPreview(photos.items);
}

function renderPhotoPreview(items) {
  const wrap = document.getElementById("photo-preview");
  if (!items.length) {
    wrap.innerHTML = `<div class="empty" style="padding:20px 0">${ICONS.photos}<span>暂无照片</span></div>`;
    return;
  }
  wrap.innerHTML = items.slice(0, 6).map((p) => `
    <div class="photo-card ${p.orientation === "portrait" ? "portrait" : "landscape"}">
      <img src="${esc(p.url)}" loading="lazy" alt="${esc(p.caption || "")}">
    </div>`).join("");
}

function renderLatestPosts(items) {
  const wrap = document.getElementById("latest-posts");
  if (!items.length) {
    wrap.innerHTML = `<div class="empty">${ICONS.empty}<span>暂无文章</span></div>`;
    return;
  }
  const hero = items[0];
  const rest = items.slice(1, 4);
  const heroMeta = `${relTime(hero.published_at)} · ${ICONS.eye} ${hero.views} · ${ICONS.heart} ${hero.likes}`;

  wrap.innerHTML = `
    <a class="hero-post" href="post.html?slug=${encodeURIComponent(hero.slug)}">
      ${postCover(hero)}
      <div class="mask"></div>
      <div class="info">
        <h3 class="line-clamp-1">${esc(hero.title)}</h3>
        <p class="line-clamp-1">${esc(hero.description)}</p>
        <div class="meta"><span>${heroMeta}</span></div>
      </div>
    </a>
    ${rest.length ? `<div class="mini-posts mt-16">` + rest.map((p) => `
      <a class="mini-post" href="post.html?slug=${encodeURIComponent(p.slug)}">
        ${postCover(p)}
        <div class="t"><h4 class="line-clamp-1">${esc(p.title)}</h4><span>${relTime(p.published_at)}</span></div>
      </a>`).join("") + `</div>` : ""}`;
}

function renderMoments(items) {
  const wrap = document.getElementById("latest-moments");
  if (!items.length) {
    wrap.innerHTML = `<div class="empty">${ICONS.empty}<span>暂无说说</span></div>`;
    return;
  }
  wrap.innerHTML = items.map((m) => `
    <div class="moment-preview glass-card">
      <div class="time">${relTime(m.created_at)}${m.mood ? " · " + esc(m.mood) : ""}</div>
      <p class="line-clamp-2">${esc(m.content)}</p>
    </div>`).join("");
}

document.addEventListener("DOMContentLoaded", load);
