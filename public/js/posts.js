/* posts.js — 文章列表：搜索 + 分类 + 标签筛选 + 加载更多 */

const state = {
  q: new URLSearchParams(location.search).get("q") || "",
  category: new URLSearchParams(location.search).get("category") || "",
  tag: new URLSearchParams(location.search).get("tag") || "",
  page: 1,
  size: 12,
  hasMore: false,
  loading: false,
};

function postCard(post) {
  const date = fmtDate(post.published_at);
  return `
  <a class="post-card fade-in" href="post.html?slug=${encodeURIComponent(post.slug)}">
    ${post.cover ? `<img src="${esc(post.cover)}" alt="${esc(post.title)}" loading="lazy">` : `<div class="fallback">${esc(post.title)}</div>`}
    <div class="mask"></div>
    ${post.is_pinned ? `<div class="pin">${ICONS.pin} 置顶</div>` : ""}
    <div class="body">
      <h3 class="line-clamp-2">${esc(post.title)}</h3>
      <p class="line-clamp-1">${esc(post.description)}</p>
      <div class="meta">
        <span class="l"><span>${date}</span><span>${post.reading_time} 分钟</span></span>
        <span class="r"><span>${post.views} 阅读</span><span>${post.likes} 赞</span></span>
      </div>
    </div>
  </a>`;
}

async function fetchPosts(append) {
  if (state.loading) return;
  state.loading = true;
  const grid = document.getElementById("post-grid");
  if (!append) grid.innerHTML = `<div class="spinner"></div>`;

  const params = new URLSearchParams({ page: state.page, size: state.size });
  if (state.q) params.set("q", state.q);
  if (state.category) params.set("category", state.category);
  if (state.tag) params.set("tag", state.tag);

  try {
    const data = await api(`/posts?${params}`);
    const html = data.items.map(postCard).join("");
    if (append) grid.insertAdjacentHTML("beforeend", html);
    else grid.innerHTML = html || `<div class="empty">${ICONS.empty}<span>没有找到文章</span></div>`;
    state.hasMore = data.hasMore;
    document.getElementById("load-more").classList.toggle("hidden", !state.hasMore);
  } catch (e) {
    if (!append) grid.innerHTML = `<div class="empty"><span>${esc(e.message)}</span></div>`;
  } finally {
    state.loading = false;
  }
}

async function loadFilters() {
  try {
    const [cats, tags] = await Promise.all([api("/categories"), api("/tags")]);
    const tabs = document.getElementById("filter-tabs");

    let html = `<button class="filter-tab ${!state.category && !state.tag ? "active" : ""}" data-type="all">全部</button>`;
    cats.items.forEach((c) => {
      html += `<button class="filter-tab ${state.category === c.name ? "active" : ""}" data-type="category" data-value="${esc(c.name)}">${esc(c.name)}<span class="count">${c.count}</span></button>`;
    });
    html += `<span style="width:1px;align-self:stretch;background:var(--divider)"></span>`;
    tags.items.forEach((t) => {
      html += `<button class="filter-tab ${state.tag === t.slug ? "active" : ""}" data-type="tag" data-value="${esc(t.slug)}">#${esc(t.name)}<span class="count">${t.count}</span></button>`;
    });
    tabs.innerHTML = html;

    tabs.querySelectorAll(".filter-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const type = btn.dataset.type;
        state.category = type === "category" ? btn.dataset.value : "";
        state.tag = type === "tag" ? btn.dataset.value : "";
        state.page = 1;
        tabs.querySelectorAll(".filter-tab").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        fetchPosts(false);
      });
    });
  } catch {}
}

function bindSearch() {
  const input = document.getElementById("search-input");
  let timer;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      state.q = input.value.trim();
      state.page = 1;
      fetchPosts(false);
    }, 350);
  });
}

document.addEventListener("DOMContentLoaded", () => {
  bindSearch();
  loadFilters();
  fetchPosts(false);
  document.getElementById("load-more").addEventListener("click", () => {
    state.page += 1;
    fetchPosts(true);
  });
});
