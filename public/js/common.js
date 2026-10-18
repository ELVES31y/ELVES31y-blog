/* ============================================================
   common.js — 全站共用：导航栏、页脚、主题切换、小工具
   每个页面在 <head> 里引入本文件，并在 body 放好
   <div id="navbar"></div> 和 <div id="site-footer"></div>
   ============================================================ */

// 站点信息（改这里即可全局生效）
const SITE = {
  name: "ELVES31y的小屋",
  subtitle: "A LITTLE SPACE OF MY OWN",
  author: "ELVES31y",
  // 头像：放一张图片 URL，留空则用首字母生成
  avatar: "",
};

// ---------- 图标（内联 SVG，避免依赖图标库） ----------
const ICONS = {
  home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
  posts: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>',
  moments: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
  photos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>',
  music: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>',
  about: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
  sun: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>',
  moon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>',
  menu: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
  close: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  heart: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>',
  eye: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
  clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>',
  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  empty: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
};

// ---------- 主题 ----------
function initTheme() {
  const saved = localStorage.getItem("theme");
  let theme = saved;
  if (!saved) theme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  document.documentElement.setAttribute("data-theme", theme);
}
function toggleTheme() {
  const cur = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const next = cur === "dark" ? "light" : "dark";
  document.documentElement.setAttribute("data-theme", next);
  localStorage.setItem("theme", next);
  const btn = document.getElementById("theme-toggle");
  if (btn) btn.innerHTML = next === "dark" ? ICONS.sun : ICONS.moon;
}

// ---------- 小工具 ----------
function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function fmtDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d)) return "";
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function relTime(iso) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "刚刚";
  if (m < 60) return `${m}分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}小时前`;
  const d = Math.floor(h / 24);
  if (d < 3) return `${d}天前`;
  return fmtDate(iso);
}

function toast(msg, type = "") {
  let wrap = document.querySelector(".toast-wrap");
  if (!wrap) {
    wrap = document.createElement("div");
    wrap.className = "toast-wrap";
    document.body.appendChild(wrap);
  }
  const el = document.createElement("div");
  el.className = `toast ${type}`;
  el.textContent = msg;
  wrap.appendChild(el);
  requestAnimationFrame(() => el.classList.add("show"));
  setTimeout(() => {
    el.classList.remove("show");
    setTimeout(() => el.remove(), 300);
  }, 2600);
}

// 请求封装：自动带上 token，出错抛异常
async function api(path, options = {}) {
  const headers = Object.assign({}, options.headers || {});
  if (options.body && !(options.body instanceof FormData) && typeof options.body !== "string") {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(options.body);
  }
  const token = localStorage.getItem("admin_token");
  if (token) headers["Authorization"] = "Bearer " + token;
  const res = await fetch("/api" + path, Object.assign({}, options, { headers }));
  let data = null;
  try { data = await res.json(); } catch {}
  if (!res.ok) {
    const msg = (data && data.error) || `请求失败（${res.status}）`;
    if (res.status === 401 && path.startsWith("/admin") && !path.startsWith("/admin/login")) {
      localStorage.removeItem("admin_token");
      if (!location.pathname.includes("admin")) location.href = "/admin.html";
    }
    throw new Error(msg);
  }
  return data;
}

// 头像：没有图片就用首字母
function avatarHtml() {
  if (SITE.avatar) return `<img src="${esc(SITE.avatar)}" alt="">`;
  return `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#fff;font-family:var(--font-serif);font-weight:700">${esc(SITE.author[0] || "E")}</div>`;
}

// ---------- 导航栏 ----------
const NAV = [
  { href: "index.html", label: "首页", icon: "home", match: ["index.html", ""] },
  { href: "posts.html", label: "文章", icon: "posts", match: ["posts.html", "post.html"] },
  { href: "moments.html", label: "说说", icon: "moments", match: ["moments.html"] },
  { href: "photos.html", label: "照片", icon: "photos", match: ["photos.html"] },
  { href: "music.html", label: "音乐", icon: "music", match: ["music.html"] },
  { href: "about.html", label: "关于", icon: "about", match: ["about.html"] },
];

function currentPage() {
  const seg = location.pathname.split("/").pop() || "";
  return seg.replace(/\.html$/, "") || "index";
}

function isActive(nav) {
  const page = currentPage();
  return nav.match.some((m) => {
    const key = m.replace(/\.html$/, "");
    if (!key) return page === "index";
    return page === key || page.startsWith(key);
  });
}

function syncThemeButtons() {
  const dark = document.documentElement.getAttribute("data-theme") === "dark";
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.innerHTML = ICONS[dark ? "sun" : "moon"];
  });
}

function renderNavbar() {
  const mount = document.getElementById("navbar");
  if (!mount) return;
  const links = NAV.slice(0, 5).map((n) =>
    `<a href="${n.href}" class="dock-item ${isActive(n) ? "active" : ""}" title="${n.label}">${ICONS[n.icon]}<span>${n.label}</span></a>`
  ).join("");

  mount.innerHTML = `
    <nav class="dock" aria-label="站点导航">
      <div class="dock-inner">
        <span class="dock-indicator" aria-hidden="true"></span>
        ${links}
      </div>
    </nav>`;
}

function renderFooter() {
  const mount = document.getElementById("site-footer");
  if (!mount) return;
  mount.innerHTML = `
    <footer class="site-footer">
      <div class="brand"><span>${esc(SITE.name)}</span></div>
      <p>${esc(SITE.subtitle)} · © ${new Date().getFullYear()} ${esc(SITE.author)}</p>
      <div class="links">
        <a href="index.html">首页</a>
        <a href="posts.html">文章</a>
        <a href="about.html">关于</a>
        <a href="admin.html">管理</a>
      </div>
    </footer>`;
}

// ---------- 初始化 ----------
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  renderNavbar();
  renderFooter();
  // 把 <span data-icon="posts"> 之类替换成对应 SVG 图标
  document.querySelectorAll("[data-icon]").forEach((el) => {
    el.innerHTML = ICONS[el.dataset.icon] || "";
  });
  // 右上角主题按钮
  // hide the top-right actions while scrolling so they never cover content
  const taWrap = document.querySelector(".top-actions");
  if (taWrap) {
    let taTimer = 0;
    window.addEventListener("scroll", () => {
      taWrap.classList.add("is-dim");
      clearTimeout(taTimer);
      taTimer = setTimeout(() => taWrap.classList.remove("is-dim"), 650);
    }, { passive: true });
  }
  syncThemeButtons();
  document.querySelectorAll("[data-theme-toggle]").forEach((btn) => {
    btn.addEventListener("click", () => { toggleTheme(); syncThemeButtons(); });
  });
  // 交互动画层（点击粒子 / 鼠标拖尾 / 光标环 / 页面切换 / 阅读进度）
  if (!document.getElementById("fx-canvas")) {
    const fx = document.createElement("script");
    fx.src = "/js/effects.js?v=8";
    fx.async = true;
    document.body.appendChild(fx);
  }
  // 底部 dock 交互（放大镜 / 色散 / 拖动）
  if (document.querySelector(".dock") && !window.__dockLoaded) {
    window.__dockLoaded = true;
    const dk = document.createElement("script");
    dk.src = "/js/dock.js?v=17";
    document.body.appendChild(dk);
  }
});
