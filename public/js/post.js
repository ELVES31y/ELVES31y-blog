/* post.js — 文章详情：Markdown 渲染、点赞、评论 */

let post = null;
let liked = false;

function getSlug() {
  return new URLSearchParams(location.search).get("slug") || "";
}

async function load() {
  const slug = getSlug();
  if (!slug) return notFound();
  try {
    post = await api(`/posts/${encodeURIComponent(slug)}`);
  } catch {
    return notFound();
  }

  liked = (JSON.parse(localStorage.getItem("liked_posts") || "[]")).includes(post.id);

  document.title = `${post.title} - ${SITE.name}`;
  renderArticle();
  renderComments();
}

function notFound() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="container-narrow">
      <a class="back-link" href="posts.html">${ICONS.back} 返回文章列表</a>
      <div class="empty">${ICONS.empty}<span>文章不存在或已被删除</span></div>
    </div>`;
}

function renderArticle() {
  const app = document.getElementById("app");
  const content = window.marked ? window.marked.parse(post.content || "") : `<p>${esc(post.content)}</p>`;
  const tags = (post.tags || []).map((t) => `<a class="tag" href="posts.html?tag=${encodeURIComponent(t.slug)}">#${esc(t.name)}</a>`).join("");

  app.innerHTML = `
    <div class="container-narrow">
      <a class="back-link" href="posts.html">${ICONS.back} 返回文章列表</a>
      <article class="article fade-in">
        ${post.cover ? `<div class="article-cover"><img src="${esc(post.cover)}" alt=""><div class="mask"></div></div>` : ""}
        <div class="article-body">
          <h1 class="title">${esc(post.title)}</h1>
          ${post.description ? `<p class="desc">${esc(post.description)}</p>` : ""}
          <div class="article-meta">
            <span class="item">${ICONS.clock} ${fmtDate(post.published_at)}</span>
            <span class="item">${ICONS.clock} ${post.reading_time} 分钟阅读</span>
            <span class="item">${ICONS.eye} ${post.views} 次浏览</span>
            <button class="item like-btn ${liked ? "liked" : ""}" id="like-btn">${ICONS.heart} ${post.likes} 个赞</button>
          </div>
          ${tags ? `<div class="article-tags">${tags}</div>` : ""}
          <div class="post-content" id="post-content">${content}</div>
        </div>
      </article>
      <div class="comments glass-card" id="comments"></div>
    </div>`;

  document.getElementById("like-btn").addEventListener("click", toggleLike);
  document.getElementById("post-content").addEventListener("click", (e) => {
    if (e.target.tagName === "IMG") openLightbox(e.target.src);
  });

  // 代码高亮
  if (window.hljs) {
    document.querySelectorAll("#post-content pre code").forEach((el) => window.hljs.highlightElement(el));
  }
}

async function toggleLike() {
  const like = !liked;
  try {
    const r = await api(`/posts/${encodeURIComponent(post.slug)}`, { method: "POST", body: { like } });
    liked = like;
    post.likes = r.likes;
    const set = JSON.parse(localStorage.getItem("liked_posts") || "[]");
    const next = like ? [...new Set([...set, post.id])] : set.filter((id) => id !== post.id);
    localStorage.setItem("liked_posts", JSON.stringify(next));
    const btn = document.getElementById("like-btn");
    btn.classList.toggle("liked", liked);
    btn.innerHTML = `${ICONS.heart} ${r.likes} 个赞`;
  } catch (e) {
    toast(e.message, "error");
  }
}

// ---------- 评论 ----------
async function renderComments() {
  const box = document.getElementById("comments");
  let items = [];
  try {
    const r = await api(`/posts/${encodeURIComponent(post.slug)}/comments`);
    items = r.items;
  } catch {}

  box.innerHTML = `
    <h2>评论（${items.length}）</h2>
    <form class="comment-form" id="comment-form">
      <div class="row">
        <input class="glass-input" id="c-nick" placeholder="昵称（可不填，默认匿名）" maxlength="30">
        <input class="glass-input" id="c-content" placeholder="说点什么..." maxlength="2000">
      </div>
      <div style="display:flex;justify-content:flex-end">
        <button class="btn-primary" type="submit">发表评论</button>
      </div>
    </form>
    <div id="comment-list">
      ${items.length ? items.map((c) => `
        <div class="comment-item">
          <div class="head">
            <div class="avatar">${esc(c.nickname[0] || "匿")}</div>
            <span class="nick">${esc(c.nickname)}</span>
            <span class="time">${relTime(c.created_at)}</span>
          </div>
          <div class="content">${esc(c.content)}</div>
        </div>`).join("") : `<p class="text-center" style="color:var(--text-3);font-size:0.85rem">还没有评论，来抢沙发~</p>`}
    </div>`;

  document.getElementById("comment-form").addEventListener("submit", submitComment);
}

async function submitComment(e) {
  e.preventDefault();
  const nickname = document.getElementById("c-nick").value.trim() || "匿名";
  const content = document.getElementById("c-content").value.trim();
  if (!content) return toast("评论内容不能为空", "error");
  try {
    await api(`/posts/${encodeURIComponent(post.slug)}/comments`, {
      method: "POST", body: { nickname, content },
    });
    toast("评论发表成功", "success");
    renderComments();
  } catch (err) {
    toast(err.message, "error");
  }
}

// ---------- 灯箱 ----------
function openLightbox(src) {
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

document.addEventListener("DOMContentLoaded", load);
