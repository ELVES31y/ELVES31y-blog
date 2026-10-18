/* ============================================================
   dock.js — 底部 dock 交互（克制版）
   放大只作用于图标本身（不改变按钮盒子），所以永远不会溢出胶囊；
   色散/高光跟随指针；向下滚动自动隐藏。
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

  window.addEventListener("mousemove", function (e) {
    if (e.clientY > window.innerHeight - 70) show();
  }, { passive: true });
})();
