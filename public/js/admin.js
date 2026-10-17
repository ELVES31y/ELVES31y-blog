/* admin.js — 后台管理：登录、文章/说说/评论/照片/音乐 管理 */

const TABS = [
  { id: "posts", label: "文章管理" },
  { id: "moments", label: "说说管理" },
  { id: "comments", label: "评论管理" },
  { id: "photos", label: "照片管理" },
  { id: "music", label: "音乐管理" },
];

let currentTab = "posts";

// ---------- 入口 ----------
document.addEventListener("DOMContentLoaded", () => {
  if (localStorage.getItem("admin_token")) showMain();
  else showLogin();
});

// ---------- 登录 ----------
function showLogin() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="login-card glass-card fade-in">
      <h1>${esc(SITE.name)} · 后台</h1>
      <form id="login-form">
        <div class="form-group">
          <input class="glass-input" type="password" id="login-pw" placeholder="请输入管理员密码" autocomplete="current-password">
        </div>
        <button class="btn-primary" type="submit" style="width:100%;justify-content:center">登录</button>
      </form>
    </div>`;
  document.getElementById("login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const pw = document.getElementById("login-pw").value;
    if (!pw) return toast("请输入密码", "error");
    try {
      const r = await api("/admin/login", { method: "POST", body: { password: pw } });
      localStorage.setItem("admin_token", r.token);
      toast("登录成功", "success");
      showMain();
    } catch (err) {
      toast(err.message, "error");
    }
  });
}

// ---------- 主界面 ----------
function showMain() {
  const app = document.getElementById("app");
  app.innerHTML = `
    <div class="container-narrow">
      <div class="admin-grid">
        <aside class="admin-side glass-card">
          ${TABS.map((t) => `<button data-tab="${t.id}" class="${t.id === currentTab ? "active" : ""}">${t.label}</button>`).join("")}
          <button id="logout" style="margin-top:12px;color:#ef4444">退出登录</button>
        </aside>
        <section class="admin-panel glass-card" id="admin-panel"></section>
      </div>
    </div>`;

  document.querySelectorAll(".admin-side [data-tab]").forEach((b) =>
    b.addEventListener("click", () => {
      currentTab = b.dataset.tab;
      document.querySelectorAll(".admin-side [data-tab]").forEach((x) => x.classList.toggle("active", x === b));
      renderView(currentTab);
    })
  );
  document.getElementById("logout").addEventListener("click", () => {
    localStorage.removeItem("admin_token");
    showLogin();
  });
  renderView(currentTab);
}

function renderView(tab) {
  const panel = document.getElementById("admin-panel");
  if (tab === "posts") return renderPosts(panel);
  if (tab === "moments") return renderMoments(panel);
  if (tab === "comments") return renderComments(panel);
  if (tab === "photos") return renderPhotos(panel);
  if (tab === "music") return renderMusic(panel);
}

// ---------- 通用：图片上传 ----------
function makeUploader(onDone) {
  return (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    toast("上传中...");
    api("/admin/upload", { method: "POST", body: fd })
      .then((r) => { onDone(r.url); toast("上传成功", "success"); })
      .catch((e) => toast(e.message, "error"));
  };
}

function uploadInputHtml() {
  return `<input type="file" accept="image/*" style="margin-top:8px;font-size:0.85rem">`;
}

// ---------- 文章 ----------
async function renderPosts(panel) {
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="font-size:1.1rem">文章管理</h2>
      <button class="btn-primary" id="new-post">+ 新建文章</button>
    </div>
    <div id="post-list"><div class="spinner"></div></div>`;
  document.getElementById("new-post").addEventListener("click", () => renderPostForm(panel, null));
  loadPosts();
}

async function loadPosts() {
  const list = document.getElementById("post-list");
  try {
    const r = await api("/admin/posts?size=100");
    list.innerHTML = `
      <table class="admin-table">
        <thead><tr><th>标题</th><th>状态</th><th>时间</th><th></th></tr></thead>
        <tbody>
        ${r.items.map((p) => `
          <tr>
            <td>${p.is_pinned ? "📌 " : ""}${esc(p.title)}</td>
            <td><span class="status-pill ${p.status}">${p.status === "published" ? "已发布" : "草稿"}</span></td>
            <td>${fmtDate(p.published_at || p.created_at)}</td>
            <td class="actions">
              <button class="mini-btn" data-edit="${p.id}">编辑</button>
              <button class="mini-btn danger" data-del="${p.id}">删除</button>
            </td>
          </tr>`).join("")}
        </tbody>
      </table>`;
    list.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => renderPostForm(document.getElementById("admin-panel"), b.dataset.edit)));
    list.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("确定删除这篇文章？")) return;
        await api(`/admin/posts/${b.dataset.del}`, { method: "DELETE" });
        toast("已删除", "success"); loadPosts();
      }));
  } catch (e) {
    list.innerHTML = `<div class="empty"><span>${esc(e.message)}</span></div>`;
  }
}

async function renderPostForm(panel, id) {
  let p = { title: "", slug: "", description: "", cover: "", category: "", tags: [], status: "published", is_pinned: false, content: "" };
  if (id) {
    try { p = await api(`/admin/posts/${id}`); } catch (e) { return toast(e.message, "error"); }
  }
  panel.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
      <h2 style="font-size:1.1rem">${id ? "编辑文章" : "新建文章"}</h2>
      <button class="btn-ghost" id="back-posts">← 返回列表</button>
    </div>
    <div class="form-group"><label>标题 *</label><input class="glass-input" id="f-title" value="${esc(p.title)}"></div>
    <div class="form-row two">
      <div class="form-group"><label>网址别名 slug（留空自动生成）</label><input class="glass-input" id="f-slug" value="${esc(p.slug)}"></div>
      <div class="form-group"><label>分类</label><input class="glass-input" id="f-category" value="${esc(p.category)}"></div>
    </div>
    <div class="form-group"><label>简介 description</label><input class="glass-input" id="f-desc" value="${esc(p.description)}"></div>
    <div class="form-row two">
      <div class="form-group"><label>封面图 URL</label><input class="glass-input" id="f-cover" value="${esc(p.cover)}"></div>
      <div class="form-group"><label>标签（逗号分隔）</label><input class="glass-input" id="f-tags" value="${esc((p.tags || []).map((t) => t.name).join(","))}"></div>
    </div>
    <div class="form-group"><label>上传封面图（会自动填入上面的 URL）</label>${uploadInputHtml()}<div id="cover-preview"></div></div>
    <div class="form-row two">
      <div class="form-group"><label>状态</label>
        <select class="glass-input" id="f-status">
          <option value="published" ${p.status === "published" ? "selected" : ""}>发布</option>
          <option value="draft" ${p.status === "draft" ? "selected" : ""}>草稿</option>
        </select>
      </div>
      <div class="form-group" style="display:flex;align-items:flex-end;padding-bottom:12px">
        <label style="display:flex;gap:6px;align-items:center;margin:0"><input type="checkbox" id="f-pin" ${p.is_pinned ? "checked" : ""}> 置顶</label>
      </div>
    </div>
    <div class="form-group"><label>正文（Markdown）*</label><textarea class="glass-input" id="f-content" style="min-height:300px">${esc(p.content)}</textarea></div>
    <button class="btn-primary" id="save-post">保存</button>`;

  document.getElementById("back-posts").addEventListener("click", () => renderPosts(panel));
  const fileInput = panel.querySelector('input[type="file"]');
  fileInput.addEventListener("change", (e) => {
    const f = e.target.files[0];
    if (f) makeUploader((url) => {
      document.getElementById("f-cover").value = url;
      document.getElementById("cover-preview").innerHTML = `<img src="${esc(url)}" style="width:120px;height:80px;object-fit:cover;border-radius:10px;margin-top:8px">`;
    })(f);
  });

  document.getElementById("save-post").addEventListener("click", async () => {
    const body = {
      title: document.getElementById("f-title").value.trim(),
      slug: document.getElementById("f-slug").value.trim(),
      description: document.getElementById("f-desc").value.trim(),
      cover: document.getElementById("f-cover").value.trim(),
      category: document.getElementById("f-category").value.trim(),
      status: document.getElementById("f-status").value,
      is_pinned: document.getElementById("f-pin").checked,
      content: document.getElementById("f-content").value,
      tags: document.getElementById("f-tags").value.split(/[,，]/).map((s) => s.trim()).filter(Boolean),
    };
    if (!body.title) return toast("标题不能为空", "error");
    if (!body.content) return toast("正文不能为空", "error");
    try {
      if (id) await api(`/admin/posts/${id}`, { method: "PUT", body });
      else await api("/admin/posts", { method: "POST", body });
      toast("已保存", "success");
      renderPosts(panel);
    } catch (e) { toast(e.message, "error"); }
  });
}

// ---------- 说说 ----------
async function renderMoments(panel) {
  panel.innerHTML = `
    <h2 style="font-size:1.1rem;margin-bottom:16px">说说管理</h2>
    <div class="form-group"><label>内容 *</label><textarea class="glass-input" id="m-content" style="min-height:90px"></textarea></div>
    <div class="form-row two">
      <div class="form-group"><label>心情（可选）</label><input class="glass-input" id="m-mood" placeholder="例如：开心"></div>
      <div class="form-group"><label>图片 URL（逗号分隔，可选）</label><input class="glass-input" id="m-images" placeholder="https://...jpg"></div>
    </div>
    <button class="btn-primary" id="add-moment">发布说说</button>
    <div id="moment-list" class="mt-24"><div class="spinner"></div></div>`;
  document.getElementById("add-moment").addEventListener("click", async () => {
    const content = document.getElementById("m-content").value.trim();
    if (!content) return toast("内容不能为空", "error");
    const images = document.getElementById("m-images").value.split(/[,，]/).map((s) => s.trim()).filter(Boolean);
    try {
      await api("/admin/moments", { method: "POST", body: { content, mood: document.getElementById("m-mood").value.trim(), images } });
      toast("发布成功", "success");
      renderMoments(panel);
    } catch (e) { toast(e.message, "error"); }
  });
  loadMoments();
}

async function loadMoments() {
  const list = document.getElementById("moment-list");
  try {
    const r = await api("/admin/moments?size=100");
    list.innerHTML = `
      <table class="admin-table"><tbody>
      ${r.items.map((m) => `
        <tr>
          <td style="max-width:360px;word-break:break-word">${esc(m.content)}</td>
          <td><span class="status-pill ${m.status}">${m.status === "published" ? "已发布" : "草稿"}</span></td>
          <td>${fmtDate(m.created_at)}</td>
          <td class="actions"><button class="mini-btn danger" data-del="${m.id}">删除</button></td>
        </tr>`).join("")}
      </tbody></table>`;
    list.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("确定删除这条说说？")) return;
        await api(`/admin/moments/${b.dataset.del}`, { method: "DELETE" });
        toast("已删除", "success"); loadMoments();
      }));
  } catch (e) {
    list.innerHTML = `<div class="empty"><span>${esc(e.message)}</span></div>`;
  }
}

// ---------- 评论 ----------
async function renderComments(panel) {
  panel.innerHTML = `<h2 style="font-size:1.1rem;margin-bottom:16px">评论管理</h2><div id="comment-list"><div class="spinner"></div></div>`;
  loadComments();
}

async function loadComments() {
  const list = document.getElementById("comment-list");
  try {
    const r = await api("/admin/comments?size=200");
    if (!r.items.length) { list.innerHTML = `<div class="empty"><span>暂无评论</span></div>`; return; }
    list.innerHTML = `
      <table class="admin-table"><tbody>
      ${r.items.map((c) => `
        <tr>
          <td style="max-width:320px;word-break:break-word">
            <strong>${esc(c.nickname)}</strong> 评论于
            <span style="color:var(--primary)">${esc(c.post_title || "已删除文章")}</span><br>
            <span style="color:var(--text-2)">${esc(c.content)}</span>
          </td>
          <td><span class="status-pill ${c.status}">${{ approved: "已通过", pending: "待审", hidden: "已隐藏" }[c.status] || c.status}</span></td>
          <td>${fmtDate(c.created_at)}</td>
          <td class="actions">
            ${c.status !== "approved" ? `<button class="mini-btn ok" data-ok="${c.id}">通过</button>` : ""}
            ${c.status !== "hidden" ? `<button class="mini-btn" data-hide="${c.id}">隐藏</button>` : ""}
            <button class="mini-btn danger" data-del="${c.id}">删除</button>
          </td>
        </tr>`).join("")}
      </tbody></table>`;
    list.querySelectorAll("[data-ok]").forEach((b) => b.addEventListener("click", () => setComment(b.dataset.ok, "approved")));
    list.querySelectorAll("[data-hide]").forEach((b) => b.addEventListener("click", () => setComment(b.dataset.hide, "hidden")));
    list.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("确定删除这条评论？")) return;
        await api(`/admin/comments/${b.dataset.del}`, { method: "DELETE" });
        toast("已删除", "success"); loadComments();
      }));
  } catch (e) {
    list.innerHTML = `<div class="empty"><span>${esc(e.message)}</span></div>`;
  }
}

async function setComment(id, status) {
  try {
    await api(`/admin/comments/${id}`, { method: "PUT", body: { status } });
    toast("操作成功", "success");
    loadComments();
  } catch (e) { toast(e.message, "error"); }
}

// ---------- 照片 ----------
async function renderPhotos(panel) {
  panel.innerHTML = `
    <h2 style="font-size:1.1rem;margin-bottom:16px">照片管理</h2>

    <div class="form-group">
      <label>方式一：填图片外链（不需要 R2，推荐）</label>
      <div class="form-row two">
        <input class="glass-input" id="p-url" placeholder="图片地址，例如 https://...jpg">
        <input class="glass-input" id="p-caption" placeholder="照片说明（可选）">
      </div>
      <div style="display:flex;gap:10px;margin-top:10px;align-items:center;flex-wrap:wrap">
        <select class="glass-input" id="p-orient" style="max-width:140px">
          <option value="landscape">横图</option>
          <option value="portrait">竖图</option>
        </select>
        <button class="btn-primary" id="add-photo-url">添加照片</button>
      </div>
    </div>

    <div class="form-group">
      <label>方式二：上传到 R2（需要先启用 R2，没有就忽略）</label>
      <div class="drop-zone" id="photo-zone">点击或拖拽图片到这里上传（未启用 R2 会失败，不影响使用方式一）</div>
      <input type="file" accept="image/*" multiple id="photo-file" style="display:none">
      <div class="upload-preview" id="photo-preview"></div>
    </div>

    <div id="photo-list" class="mt-24"><div class="spinner"></div></div>`;

  document.getElementById("add-photo-url").addEventListener("click", async () => {
    const url = document.getElementById("p-url").value.trim();
    if (!url) return toast("请先填图片地址", "error");
    try {
      await api("/admin/photos", {
        method: "POST",
        body: {
          url,
          caption: document.getElementById("p-caption").value.trim(),
          orientation: document.getElementById("p-orient").value,
        },
      });
      toast("添加成功", "success");
      renderPhotos(panel);
    } catch (e) { toast(e.message, "error"); }
  });

  const zone = document.getElementById("photo-zone");
  const fileInput = document.getElementById("photo-file");
  zone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", (e) => handlePhotosUpload([...e.target.files]));

  document.getElementById("photo-list").addEventListener("click", async (e) => {
    const del = e.target.closest("[data-del]");
    if (del) {
      if (!confirm("确定删除这张照片？")) return;
      await api(`/admin/photos/${del.dataset.del}`, { method: "DELETE" });
      toast("已删除", "success");
      loadPhotos();
    }
  });

  loadPhotos();
}

async function handlePhotosUpload(files) {
  for (const f of files) {
    if (!f.type.startsWith("image/")) continue;
    const fd = new FormData();
    fd.append("file", f);
    try {
      const r = await api("/admin/upload", { method: "POST", body: fd });
      await api("/admin/photos", { method: "POST", body: { url: r.url, caption: "", orientation: "landscape" } });
    } catch (e) { toast(e.message, "error"); }
  }
  toast("上传完成", "success");
  loadPhotos();
}

async function loadPhotos() {
  const list = document.getElementById("photo-list");
  try {
    const r = await api("/admin/photos?size=200");
    if (!r.items.length) { list.innerHTML = `<div class="empty"><span>暂无照片</span></div>`; return; }
    list.innerHTML = `
      <div class="masonry">
      ${r.items.map((p) => `
        <div class="photo-card ${p.orientation === "portrait" ? "portrait" : "landscape"}">
          <img src="${esc(p.url)}" loading="lazy" alt="">
          <div class="actions" style="justify-content:center;padding:6px 0">
            <button class="mini-btn danger" data-del="${p.id}">删除</button>
          </div>
        </div>`).join("")}
      </div>`;
  } catch (e) {
    list.innerHTML = `<div class="empty"><span>${esc(e.message)}</span></div>`;
  }
}

// ---------- 音乐 ----------
async function renderMusic(panel) {
  panel.innerHTML = `
    <h2 style="font-size:1.1rem;margin-bottom:16px">音乐管理</h2>
    <div class="form-group"><label>歌曲名 *</label><input class="glass-input" id="mu-title"></div>
    <div class="form-row two">
      <div class="form-group"><label>歌手</label><input class="glass-input" id="mu-artist"></div>
      <div class="form-group"><label>排序（数字越小越靠前）</label><input class="glass-input" id="mu-sort" type="number" value="0"></div>
    </div>
    <div class="form-group"><label>歌曲直链 URL *（mp3/flac）</label><input class="glass-input" id="mu-url" placeholder="https://...mp3"></div>
    <div class="form-row two">
      <div class="form-group"><label>封面图 URL</label><input class="glass-input" id="mu-cover"></div>
      <div class="form-group"><label>歌词 LRC（可选）</label><input class="glass-input" id="mu-lrc"></div>
    </div>
    <button class="btn-primary" id="add-music">添加歌曲</button>
    <div id="music-list" class="mt-24"><div class="spinner"></div></div>`;

  document.getElementById("add-music").addEventListener("click", async () => {
    const body = {
      title: document.getElementById("mu-title").value.trim(),
      artist: document.getElementById("mu-artist").value.trim(),
      url: document.getElementById("mu-url").value.trim(),
      cover: document.getElementById("mu-cover").value.trim(),
      lrc: document.getElementById("mu-lrc").value.trim(),
      sort: parseInt(document.getElementById("mu-sort").value, 10) || 0,
    };
    if (!body.title || !body.url) return toast("歌曲名和地址必填", "error");
    try {
      await api("/admin/music", { method: "POST", body });
      toast("添加成功", "success");
      renderMusic(panel);
    } catch (e) { toast(e.message, "error"); }
  });
  loadMusic();
}

async function loadMusic() {
  const list = document.getElementById("music-list");
  try {
    const r = await api("/admin/music");
    if (!r.items.length) { list.innerHTML = `<div class="empty"><span>暂无歌曲</span></div>`; return; }
    list.innerHTML = `
      <table class="admin-table"><tbody>
      ${r.items.map((t) => `
        <tr>
          <td>${esc(t.title)} - ${esc(t.artist || "未知")}</td>
          <td>${fmtDate(t.created_at)}</td>
          <td class="actions"><button class="mini-btn danger" data-del="${t.id}">删除</button></td>
        </tr>`).join("")}
      </tbody></table>`;
    list.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("确定删除这首歌？")) return;
        await api(`/admin/music/${b.dataset.del}`, { method: "DELETE" });
        toast("已删除", "success");
        loadMusic();
      }));
  } catch (e) {
    list.innerHTML = `<div class="empty"><span>${esc(e.message)}</span></div>`;
  }
}
