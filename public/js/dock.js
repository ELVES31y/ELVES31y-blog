/* ============================================================
   dock.js — 底部 dock 交互（克制版）
   放大只作用于图标本身，永远不溢出胶囊；
   向下滚动或静止一段时间后自动隐藏，一有动作就出现。
   ============================================================ */
(function () {
  "use strict";
  var dock = document.querySelector(".dock");
  if (!dock) return;

  var items = Array.prototype.slice.call(dock.querySelectorAll(".dock-item"));
  if (!items.length) return;

  var REACH = 84;   // 影响半径
  var BOOST = 0.16; // 图标最大额外缩放
  var DISP = 0.8;   // 最大色散位移 px

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

  // ---------- 自动隐藏：向下滚动 / 静止 ----------
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

  function wake() {
    show();
    restartIdle();
  }

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
