/* ============================================================
   dock.js — 底部 dock 交互
   - 玻璃滑块：静止是椭圆，滑动时按速度和方向拉伸（拖尾形变）
   - 放大只作用于图标本身，不溢出胶囊
   - 向下滚动或静止 3 秒自动隐藏
   ============================================================ */
(function () {
  "use strict";
  var dock = document.querySelector(".dock");
  if (!dock) return;

  var items = Array.prototype.slice.call(dock.querySelectorAll(".dock-item"));
  if (!items.length) return;

  var REACH = 84;
  var BOOST = 0.16;
  var DISP = 0.8;

  // ---------- 玻璃滑块：静止椭圆，滑动时按方向拉长 ----------
  var ind = dock.querySelector(".dock-indicator");
  var activeEl = dock.querySelector(".dock-item.active") || items[0];
  var indTimer = 0;
  var SIZE = 76; // 与 CSS 中 .dock-indicator 的宽度一致

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
    // 位移越大拉得越长；拉伸方向永远朝向运动方向（尾巴拖在后面）
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

  if (prevIdx >= 0 && prevIdx !== curIdx && items[prevIdx]) {
    placeInd(items[prevIdx], false);          // 先站到上一页位置
    requestAnimationFrame(function () {
      requestAnimationFrame(function () { placeInd(activeEl, true); }); // 拉长着滑过去
    });
  } else {
    placeInd(activeEl, false);
  }

  window.addEventListener("resize", function () {
    placeInd(dock.querySelector(".dock-item.active") || items[0], false);
  });

  // ---------- 放大 + 色散 ----------
  function reset() {
    for (var i = 0; i < items.length; i++) {
      items[i].style.removeProperty("--boost");
      items[i].style.removeProperty("--disp");
    }
    dock.style.setProperty("--glow", "0");
  }

  dock.addEventListener("mousemove", function (e) {
    var r = dock.getBoundingClientRect();
    dock.style.setProperty("--gx", (e.clientX - r.left) + "px");
    dock.style.setProperty("--glow", "1");

    for (var i = 0; i < items.length; i++) {
      var it = items[i];
      var b = it.getBoundingClientRect();
      var cx = b.left + b.width / 2;
      var d = Math.abs(e.clientX - cx);
      var t = Math.max(0, 1 - d / REACH);
      t = t * t;
      it.style.setProperty("--boost", (t * BOOST).toFixed(3));
      it.style.setProperty("--disp", (t * DISP).toFixed(2));
    }
  }, { passive: true });

  dock.addEventListener("mouseleave", reset);

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
