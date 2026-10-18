/* ============================================================
   dock.js — 底部固定 dock 的交互（小而克制的液态效果）
   - 放大镜：指针附近图标轻微放大抬升（幅度限制在胶囊内）
   - 色散：强度随距离变化
   - 高光：跟随指针的光斑
   - 自动隐藏：向下滚动时缩到屏幕下方，向上滚动或指针移到底部时出现
   ============================================================ */
(function () {
  "use strict";
  var dock = document.querySelector(".dock");
  if (!dock) return;

  var items = Array.prototype.slice.call(dock.querySelectorAll(".dock-item"));
  if (!items.length) return;

  var REACH = 88;        // 放大影响半径
  var LIFT = 3;          // 最大上浮
  var SCALE = 0.16;      // 最大额外缩放
  var DISP = 0.9;        // 最大色散位移(px)

  function reset() {
    for (var i = 0; i < items.length; i++) {
      items[i].style.transform = "";
      items[i].style.zIndex = "";
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
      it.style.transform = "translateY(" + (-t * LIFT).toFixed(2) + "px) scale(" + (1 + t * SCALE).toFixed(3) + ")";
      it.style.zIndex = String(20 + Math.round(t * 10));
      it.style.setProperty("--disp", (t * DISP).toFixed(2));
    }
  }, { passive: true });

  dock.addEventListener("mouseleave", reset);

  // ---------- 自动隐藏 ----------
  var lastY = window.scrollY || 0;

  function hide() { dock.classList.add("is-hidden"); }
  function show() { dock.classList.remove("is-hidden"); }

  window.addEventListener("scroll", function () {
    var y = window.scrollY || 0;
    if (y > 200 && y > lastY + 2) hide();
    else if (y < lastY - 2 || y < 200) show();
    lastY = y;
  }, { passive: true });

  // 指针靠近屏幕底部时露出来
  window.addEventListener("mousemove", function (e) {
    if (e.clientY > window.innerHeight - 70) show();
  }, { passive: true });
})();
