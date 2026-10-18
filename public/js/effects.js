/* ============================================================
   effects.js — 交互动画层（原生实现，参考 Kirameku 的交互设计）
   包含：点击粒子 / 鼠标拖尾 / 光标环 / 页面切换遮罩 / 阅读进度 / 卡片 3D 倾斜
   全部自动挂载，不依赖任何库；尊重系统「减少动态效果」设置。
   ============================================================ */
(function () {
  "use strict";

  // 系统要求减少动画 → 直接不启用
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (window.__fxLoaded) return;
  window.__fxLoaded = true;

  var fine = window.matchMedia("(pointer: fine)").matches;
  var COLORS = ["#38bdf8", "#818cf8", "#a78bfa", "#f472b6", "#34d399", "#fbbf24", "#fb923c"];

  // ---------------- 样式 ----------------
  var css = [
    "#fx-canvas{position:fixed;inset:0;pointer-events:none;z-index:9997}",
    "#fx-cursor-dot,#fx-cursor-ring{position:fixed;left:0;top:0;pointer-events:none;z-index:9999;border-radius:50%}",
    "#fx-cursor-dot{width:6px;height:6px;background:#38bdf8;box-shadow:0 0 8px #38bdf8}",
    "#fx-cursor-ring{width:28px;height:28px;border:2px solid rgba(56,189,248,.35);transition:width .18s,height .18s,border-color .18s,background .18s}",
    "#fx-cursor-ring.hot{width:46px;height:46px;border-color:rgba(129,140,248,.75);background:rgba(129,140,248,.1)}",
    "#fx-progress{position:fixed;left:0;top:0;height:3px;width:0;z-index:9999;background:linear-gradient(90deg,var(--primary,#0ea5e9),var(--indigo,#6366f1),var(--purple,#a855f7));box-shadow:0 0 10px rgba(99,102,241,.5);transition:width .12s linear}",
    "#fx-page{position:fixed;inset:0;z-index:9998;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px;background:rgba(2,6,23,.5);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);opacity:0;pointer-events:none;transition:opacity .2s}",
    "#fx-page.on{opacity:1;pointer-events:auto}",
    ".fx-portal{position:relative;width:80px;height:80px}",
    ".fx-portal i{position:absolute;border-radius:50%;border:4px solid transparent;border-top-color:currentColor;animation:fxspin 1s linear infinite}",
    ".fx-portal i:nth-child(1){inset:0;color:#38bdf8}",
    ".fx-portal i:nth-child(2){inset:9px;color:#818cf8;animation-duration:1.5s;animation-direction:reverse}",
    ".fx-portal i:nth-child(3){inset:18px;color:#a78bfa;animation-duration:.8s}",
    ".fx-portal b{position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#38bdf8;animation:fxpulse 1.2s ease-in-out infinite}",
    ".fx-tip{color:rgba(255,255,255,.75);font-size:.82rem;text-align:center;max-width:280px;padding:0 16px;line-height:1.6}",
    ".fx-player{position:fixed;right:14px;bottom:96px;z-index:9000;display:flex;align-items:center;gap:8px;padding:7px 12px 7px 8px;border-radius:999px;background:rgba(255,255,255,.55);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);border:1px solid rgba(255,255,255,.55);box-shadow:0 8px 24px rgba(0,0,0,.15);font-size:.78rem;color:#0f172a;transition:transform .25s,box-shadow .25s}",
    ".fx-player:hover{transform:translateY(-2px);box-shadow:0 12px 30px rgba(0,0,0,.2)}",
    "[data-theme='dark'] .fx-player{background:rgba(15,23,42,.62);border-color:rgba(255,255,255,.12);color:#e2e8f0}",
    ".fx-player-card{position:static;width:100%;box-sizing:border-box;flex-wrap:wrap;gap:10px;padding:12px;border-radius:14px;background:rgba(255,255,255,.35);box-shadow:none}",
    ".fx-player-card:hover{transform:none;box-shadow:none}",
    "[data-theme='dark'] .fx-player-card{background:rgba(15,23,42,.35)}",
    ".fx-p-cover{width:44px;height:44px;border-radius:10px;background:linear-gradient(135deg,#6366f1,#a855f7) center/cover no-repeat;flex-shrink:0}",
    ".fx-player:not(.fx-player-card) .fx-p-cover{display:none}",
    ".fx-p-btn{width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff;font-size:11px;line-height:1;background:linear-gradient(135deg,#6366f1,#a855f7);box-shadow:0 2px 8px rgba(99,102,241,.4);flex-shrink:0}",
    ".fx-p-meta{display:flex;flex-direction:column;line-height:1.25;min-width:0;flex:1;overflow:hidden}",
    ".fx-p-meta b{font-weight:600;font-size:.75rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".fx-p-meta span{opacity:.6;font-size:.65rem;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}",
    ".fx-p-bar{height:3px;border-radius:3px;background:rgba(148,163,184,.25);overflow:hidden;flex-basis:100%}",
    ".fx-player:not(.fx-player-card) .fx-p-bar{display:none}",
    ".fx-p-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#6366f1,#a855f7);transition:width .25s linear}",
    "@keyframes fxspin{to{transform:rotate(360deg)}}",
    "@keyframes fxpulse{0%,100%{transform:scale(1);opacity:1}50%{transform:scale(.6);opacity:.5}}",
    "@media (max-width:768px){#fx-cursor-dot,#fx-cursor-ring{display:none}}"
  ].join("");

  var style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  // ---------------- 粒子引擎（点击 + 拖尾共用） ----------------
  var canvas = document.createElement("canvas");
  canvas.id = "fx-canvas";
  document.body.appendChild(canvas);
  var ctx = canvas.getContext("2d");
  var parts = [];
  var raf = 0;
  var running = false;

  function resize() {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener("resize", resize);

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = parts.length - 1; i >= 0; i--) {
      var p = parts[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.g;
      p.vx *= p.drag;
      p.vy *= p.drag;
      p.life++;
      var t = p.life / p.max;
      if (t >= 1) { parts.splice(i, 1); continue; }
      var a = t < 0.25 ? t / 0.25 : 1 - (t - 0.25) / 0.75;
      ctx.globalAlpha = Math.max(0, a) * p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.glow ? p.color : "transparent";
      ctx.shadowBlur = p.glow ? 6 : 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    if (parts.length) {
      raf = requestAnimationFrame(loop);
    } else {
      running = false;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  function kick() {
    if (!running) { running = true; raf = requestAnimationFrame(loop); }
  }

  // 点击迸发
  document.addEventListener("click", function (e) {
    if (e.target.closest("input,textarea,select,.dock")) return;
    var n = 8 + Math.floor(Math.random() * 6);
    for (var i = 0; i < n; i++) {
      var ang = (Math.PI * 2 * i) / n + (Math.random() - 0.5) * 0.5;
      var sp = 2 + Math.random() * 4;
      parts.push({
        x: e.clientX, y: e.clientY,
        vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp,
        size: 2 + Math.random() * 3,
        color: COLORS[(Math.random() * COLORS.length) | 0],
        alpha: 1, life: 0, max: 38 + Math.random() * 22, g: 0.08, drag: 1
      });
    }
    kick();
  });

  // 鼠标拖尾
  if (fine) {
    var lastMove = 0;
    window.addEventListener("mousemove", function (e) {
      if (e.target.closest && e.target.closest(".dock")) return;
      var now = performance.now();
      if (now - lastMove < 16) return;
      lastMove = now;
      for (var i = 0; i < 2; i++) {
        var ang = Math.random() * Math.PI * 2;
        var sp = Math.random() * 1.5 + 0.5;
        parts.push({
          x: e.clientX + (Math.random() - 0.5) * 8,
          y: e.clientY + (Math.random() - 0.5) * 8,
          vx: Math.cos(ang) * sp, vy: Math.sin(ang) * sp - 1,
          size: Math.random() * 3 + 1.5,
          color: "hsl(" + (180 + Math.random() * 60) + ",80%,70%)",
          alpha: 0.8, life: 0, max: 30 + Math.random() * 20,
          g: 0.02, drag: 0.98, glow: true
        });
      }
      if (parts.length > 220) parts.splice(0, parts.length - 160);
      kick();
    }, { passive: true });
  }

  // ---------------- 光标环 ----------------
  if (fine) {
    var dot = document.createElement("div");
    dot.id = "fx-cursor-dot";
    var ring = document.createElement("div");
    ring.id = "fx-cursor-ring";
    document.body.appendChild(dot);
    document.body.appendChild(ring);
    var mx = -100, my = -100, rx = -100, ry = -100;
    var ringRunning = false;
    function ringLoop() {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = "translate(" + rx.toFixed(1) + "px," + ry.toFixed(1) + "px) translate(-50%,-50%)";
      if (Math.abs(mx - rx) > 0.4 || Math.abs(my - ry) > 0.4) {
        requestAnimationFrame(ringLoop);
      } else {
        ringRunning = false;
      }
    }
    window.addEventListener("mousemove", function (e) {
      mx = e.clientX;
      my = e.clientY;
      dot.style.transform = "translate(" + mx + "px," + my + "px) translate(-50%,-50%)";
      if (!ringRunning) {
        ringRunning = true;
        requestAnimationFrame(ringLoop);
      }
    }, { passive: true });
    var HOT = "a,button,input,textarea,select,[role='button'],.post-card,.photo-card,.moment-card,.hero-post";
    document.addEventListener("mouseover", function (e) {
      if (e.target.closest && e.target.closest(HOT)) ring.classList.add("hot");
    });
    document.addEventListener("mouseout", function (e) {
      if (e.target.closest && e.target.closest(HOT)) ring.classList.remove("hot");
    });
  }

  // ---------------- 卡片 3D 倾斜 ----------------
  if (fine) {
    var tiltSel = ".post-card,.hero-post,.mini-post";
    var cur = null, curRect = null, rafT = 0, pt = { x: 0, y: 0 };
    function applyTilt() {
      if (!cur || !curRect) return;
      var px = (pt.x - curRect.left) / curRect.width - 0.5;
      var py = (pt.y - curRect.top) / curRect.height - 0.5;
      cur.style.transform = "perspective(800px) rotateX(" + (-py * 6).toFixed(2) + "deg) rotateY(" + (px * 6).toFixed(2) + "deg)";
    }
    document.addEventListener("mousemove", function (e) {
      var card = e.target.closest && e.target.closest(tiltSel);
      if (!card) {
        if (cur) { cur.style.transform = ""; cur = null; curRect = null; }
        return;
      }
      if (card !== cur || !curRect) { cur = card; curRect = card.getBoundingClientRect(); }
      pt.x = e.clientX;
      pt.y = e.clientY;
      if (!rafT) rafT = requestAnimationFrame(function () { rafT = 0; applyTilt(); });
    }, { passive: true });
    window.addEventListener("scroll", function () { curRect = null; }, { passive: true });
    document.addEventListener("mouseout", function (e) {
      if (cur && (!e.relatedTarget || !cur.contains(e.relatedTarget))) {
        cur.style.transform = "";
        cur = null;
      }
    });
  }

  // ---------------- 页面切换遮罩 ----------------
  var pageEl = document.createElement("div");
  pageEl.id = "fx-page";
  pageEl.innerHTML = '<div class="fx-portal"><i></i><i></i><i></i><b></b></div><p class="fx-tip"></p>';
  document.body.appendChild(pageEl);
  var TIPS = [
    "本页卡片会跟着鼠标轻轻倾斜",
    "点一下空白处，会有小粒子散开",
    "电脑端鼠标后面跟着一条星尘尾巴",
    "文章页顶部有阅读进度条",
    "按 Ctrl+F5 可以强制刷新看最新效果"
  ];
  var navigating = false;
  document.addEventListener("click", function (e) {
    if (navigating) return;
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a) return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (a.target === "_blank" || a.hasAttribute("download")) return;
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) return;
    var tip = pageEl.querySelector(".fx-tip");
    if (tip) tip.textContent = TIPS[(Math.random() * TIPS.length) | 0];
    pageEl.classList.add("on");
    navigating = true;
    setTimeout(function () { window.location.href = href; }, 240);
  });
  window.addEventListener("pageshow", function () {
    navigating = false;
    pageEl.classList.remove("on");
  });

  // ---------------- 阅读进度条（文章详情页） ----------------
  if (document.querySelector(".article")) {
    var bar = document.createElement("div");
    bar.id = "fx-progress";
    document.body.appendChild(bar);
    var updateBar = function () {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      bar.style.width = (max > 0 ? (h.scrollTop / max) * 100 : 0) + "%";
    };
    window.addEventListener("scroll", updateBar, { passive: true });
    window.addEventListener("resize", updateBar);
    updateBar();
  }

  // ---------------- 音乐播放器（首页卡片 / 其他页面悬浮，进页面即播） ----------------
  (function initPlayer() {
    var audio = new Audio();
    audio.loop = true;
    audio.volume = 0;
    var TARGET_VOL = 0.1;
    audio.preload = "auto";

    var slot = document.getElementById("home-music-slot");
    var wrap = document.createElement("div");
    wrap.id = "fx-player";
    wrap.className = "fx-player" + (slot ? " fx-player-card" : "");
    wrap.innerHTML =
      '<div class="fx-p-cover"></div>' +
      '<button class="fx-p-btn" type="button" aria-label="播放/暂停">\u25B6</button>' +
      '<div class="fx-p-meta"><b>音乐</b><span>加载中…</span></div>' +
      '<div class="fx-p-bar"><i></i></div>';
    if (slot) { slot.appendChild(wrap); } else { document.body.appendChild(wrap); }

    var btn = wrap.querySelector(".fx-p-btn");
    var tEl = wrap.querySelector(".fx-p-meta b");
    var aEl = wrap.querySelector(".fx-p-meta span");
    var bar = wrap.querySelector(".fx-p-bar i");
    var cover = wrap.querySelector(".fx-p-cover");

    // fade in / fade out so playback never starts or stops abruptly
    function fadeTo(target, ms, done) {
      var from = audio.volume;
      var start = performance.now();
      function step(now) {
        var k = Math.min(1, (now - start) / ms);
        audio.volume = Math.max(0, Math.min(1, from + (target - from) * k));
        if (k < 1) requestAnimationFrame(step);
        else if (done) done();
      }
      requestAnimationFrame(step);
    }
    function startPlay() {
      if (!audio.paused) return;
      audio.volume = 0;
      var p = audio.play();
      if (p && p.then) p.then(function () { fadeTo(TARGET_VOL, 900); }).catch(function () {});
    }
    function stopPlay() {
      if (audio.paused) return;
      fadeTo(0, 320, function () { audio.pause(); });
    }

    // 切换到后台/其他 App 时立即暂停，不在后台继续播放
    document.addEventListener("visibilitychange", function () {
      if (document.hidden && !audio.paused) audio.pause();
    });

    function setPlaying(on) { btn.textContent = on ? "\u275A\u275A" : "\u25B6"; }

    btn.addEventListener("click", function (e) {
      e.stopPropagation();
      if (audio.muted) audio.muted = false;
      if (audio.paused) startPlay(); else stopPlay();
    });
    // 卡片模式下点整块也能恢复声音
    wrap.addEventListener("click", function () { if (audio.muted) audio.muted = false; });
    audio.addEventListener("play", function () { setPlaying(true); });
    audio.addEventListener("pause", function () { setPlaying(false); });
    audio.addEventListener("timeupdate", function () {
      if (audio.duration) bar.style.width = (audio.currentTime / audio.duration) * 100 + "%";
    });

    fetch("/api/music")
      .then(function (r) { return r.json(); })
      .then(function (d) {
        var items = (d && d.items) || [];
        if (!items.length) { wrap.style.display = "none"; return; }
        var t = items[0];
        audio.src = t.url;
        tEl.textContent = t.name || "音乐";
        aEl.textContent = t.artist || "";
        if (t.cover && cover) cover.style.backgroundImage = "url(" + t.cover + ")";

        // 后台关掉"自动播放"时，不主动出声
        if (d.autoplay === false) {
          aEl.textContent = (t.artist ? t.artist + " · " : "") + "点 ▶ 播放";
          return;
        }

        audio.volume = 0;
        var p = audio.play();
        if (p && p.then) p.then(function () { fadeTo(TARGET_VOL, 1100); });
        if (p && p.catch) {
          p.catch(function () {
            // 浏览器拦自动播放 → 先静音续播，保证"进页面就在放"，点一下就出声
            audio.muted = true;
            var mp = audio.play();
            if (mp && mp.then) {
              mp.then(function () {
                aEl.textContent = "已静音 · 点击播放器出声";
              }).catch(function () {
                aEl.textContent = (t.artist ? t.artist + " · " : "") + "点 ▶ 播放";
              });
            }
          });
        }
      })
      .catch(function () { wrap.style.display = "none"; });
  })();
})();
