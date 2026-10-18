/* ============================================================
   dock.js — 底部 dock 交互（涟漪形变版）
   1) 玻璃滑块跟随当前页，切换页面时椭圆拉伸滑过去
   2) 悬浮/触摸：被指到的图标弹性放大上浮，左右相邻图标被挤开（涟漪）
   3) 弹簧过渡，可随时打断；离开后回弹
   4) 滚动时玻璃轻微变透明
   ============================================================ */
(function () {
  "use strict";
  var dock = document.querySelector(".dock");
  if (!dock) return;

  var items = Array.prototype.slice.call(dock.querySelectorAll(".dock-item"));
  if (!items.length) return;

  var REACH = 96;     // 涟漪影响半径
  var BOOST = 0.24;   // 最大放大
  var LIFT = 6;       // 最大上浮 px
  var PUSH = 4;       // 相邻图标被挤开的位移 px
  var DISP = 0.8;     // 色散 px

  // ---------- 记录原始位置（避免 transform 反馈导致抖动） ----------
  var base = [];

  function clearVisual() {
    for (var i = 0; i < items.length; i++) {
      items[i].style.transform = "";
      items[i].style.removeProperty("--disp");
    }
  }

  function measure() {
    clearVisual();
    base = items.map(function (it) {
      var b = it.getBoundingClientRect();
      return { cx: b.left + b.width / 2 };
    });
  }

  // ---------- 玻璃滑块 ----------
  var ind = dock.querySelector(".dock-indicator");
  var activeEl = dock.querySelector(".dock-item.active") || items[0];
  var indTimer = 0;
  var SIZE = 84;

  function restTransform() { return "translateY(-50%) scaleX(1) scaleY(1)"; }

  function placeInd(el, smooth) {
    if (!ind || !el) return;
    var dr = dock.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var newLeft = r.left - dr.left + r.width / 2 - SIZE / 2;
    var oldLeft = parseFloat(ind.style.left || "0") || 0;

    if (!smooth) {
      ind.style.transition = "none";
      ind.style.transformOrigin = "center center";
      ind.style.transform = restTransform();
      ind.style.left = newLeft + "px";
      void ind.offsetWidth;
      ind.style.transition = "";
      return;
    }

    var dx = newLeft - oldLeft;
    var dist = Math.abs(dx);
    var sx = 1 + Math.min(0.55, dist / 240);
    var sy = 1 - Math.min(0.18, dist / 800);

    ind.style.transformOrigin = dx >= 0 ? "left center" : "right center";
    ind.style.transform = "translateY(-50%) scaleX(" + sx.toFixed(3) + ") scaleY(" + sy.toFixed(3) + ")";
    ind.style.left = newLeft + "px";

    clearTimeout(indTimer);
    indTimer = setTimeout(function () {
      ind.style.transformOrigin = "center center";
      ind.style.transform = restTransform();
    }, 560);
  }

  var curIdx = items.indexOf(activeEl);
  var prevIdx = -1;
  try { prevIdx = parseInt(localStorage.getItem("dock_prev") || "-1", 10); } catch (e) { prevIdx = -1; }
  try { localStorage.setItem("dock_prev", String(curIdx)); } catch (e) {}

  measure();
  if (prevIdx >= 0 && prevIdx !== curIdx && items[prevIdx]) {
    placeInd(items[prevIdx], false);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { placeInd(activeEl, true); });
    });
  } else {
    placeInd(activeEl, false);
  }

  window.addEventListener("resize", function () {
    measure();
    placeInd(dock.querySelector(".dock-item.active") || items[0], false);
  });

  // ---------- 涟漪：放大 + 上浮 + 相邻挤开 ----------
  function applyRipple(clientX) {
    var r = dock.getBoundingClientRect();
    dock.style.setProperty("--gx", (clientX - r.left) + "px");
    dock.style.setProperty("--glow", "1");

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var cx = base[i] ? base[i].cx : 0;
      var dx = cx - clientX;
      var d = Math.abs(dx);
      var t = Math.max(0, 1 - d / REACH);
      t = t * t;
      var scale = 1 + t * BOOST;
      var lift = t * LIFT;
      var push = (dx === 0 ? 0 : (dx > 0 ? 1 : -1)) * t * PUSH;
      it.style.transform =
        "translate(" + push.toFixed(1) + "px," + (-lift).toFixed(1) + "px) scale(" + scale.toFixed(3) + ")";
      it.style.setProperty("--disp", (t * DISP).toFixed(2));
    }
  }

  function resetRipple() {
    for (var i = 0; i < items.length; i++) {
      items[i].style.transform = "";
      items[i].style.removeProperty("--disp");
    }
    dock.style.setProperty("--glow", "0");
  }

  dock.addEventListener("mousemove", function (e) { applyRipple(e.clientX); }, { passive: true });
  dock.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches[0]) applyRipple(e.touches[0].clientX);
  }, { passive: true });
  dock.addEventListener("mouseleave", resetRipple);
  dock.addEventListener("touchend", function () { setTimeout(resetRipple, 260); });

  // ---------- 滚动时玻璃透明度变化 ----------
  window.addEventListener("scroll", function () {
    var y = window.scrollY || 0;
    dock.style.setProperty("--fade", Math.min(1, y / 420).toFixed(2));
  }, { passive: true });

  // ---------- 自动隐藏 ----------
  var IDLE_MS = 3000;
  var lastY = window.scrollY || 0;
  var idleTimer = 0;
  var lastReset = 0;
  var overDock = false;

  function hide() { dock.classList.add("is-hidden"); }
  function show() { dock.classList.remove("is-hidden"); }

  function restartIdle() {
    var now = Date.now();
    if (now - lastReset < 250) return;
    lastReset = now;
    clearTimeout(idleTimer);
    if (overDock) return;
    idleTimer = setTimeout(hide, IDLE_MS);
  }

  function wake() { show(); restartIdle(); }

  window.addEventListener("scroll", function () {
    var y = window.scrollY || 0;
    if (y > 200 && y > lastY + 2) hide();
    else wake();
    lastY = y;
  }, { passive: true });

  window.addEventListener("mousemove", wake, { passive: true });
  window.addEventListener("touchstart", wake, { passive: true });
  window.addEventListener("keydown", wake);

  dock.addEventListener("mouseenter", function () {
    overDock = true;
    clearTimeout(idleTimer);
    show();
  });
  dock.addEventListener("mouseleave", function () {
    overDock = false;
    restartIdle();
  });

  restartIdle();
})();
