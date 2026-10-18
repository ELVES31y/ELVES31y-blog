/* ============================================================
   dock.js — 底部悬浮胶囊的交互引擎（类 Apple Dock / Liquid Glass）
   - 放大镜：指针附近的图标按距离放大、抬升、色散
   - 字体与图标色散强度随距离变化（--disp）
   - 高光光斑跟随指针（--gx / --glow）
   - 整条 dock 可拖动，位置记在 localStorage
   ============================================================ */
(function () {
  "use strict";
  var dock = document.querySelector(".dock");
  if (!dock) return;

  var items = Array.prototype.slice.call(dock.querySelectorAll(".dock-item"));
  if (!items.length) return;

  var REACH = 130; // 放大影响半径（px）

  // ---------- 放大镜 + 色散 ----------
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
      t = t * t; // 更聚焦的放大曲线

      it.style.transform = "translateY(" + (-t * 10).toFixed(1) + "px) scale(" + (1 + t * 0.45).toFixed(3) + ")";
      it.style.zIndex = String(20 + Math.round(t * 10));
      it.style.setProperty("--disp", (t * 1.9).toFixed(2));
    }
  }, { passive: true });

  dock.addEventListener("mouseleave", reset);

  // ---------- 整条 dock 可拖动 ----------
  var saved = null;
  try { saved = JSON.parse(localStorage.getItem("dock_pos") || "null"); } catch (e) { saved = null; }

  function applyPos(left, bottom) {
    dock.style.left = Math.round(left) + "px";
    dock.style.bottom = Math.round(bottom) + "px";
    dock.style.transform = "none";
  }

  if (saved && typeof saved.left === "number" && typeof saved.bottom === "number") {
    // 窗口变小时把 dock 拉回可见区域
    var maxL = Math.max(0, window.innerWidth - dock.offsetWidth);
    var maxB = Math.max(0, window.innerHeight - dock.offsetHeight);
    applyPos(Math.min(Math.max(0, saved.left), maxL), Math.min(Math.max(0, saved.bottom), maxB));
  }

  var down = false, moved = false, sx = 0, sy = 0, dl = 0, db = 0;

  dock.addEventListener("pointerdown", function (e) {
    if (e.button !== 0) return;
    down = true;
    moved = false;
    sx = e.clientX;
    sy = e.clientY;
    var r = dock.getBoundingClientRect();
    dl = r.left;
    db = window.innerHeight - r.bottom;
  });

  window.addEventListener("pointermove", function (e) {
    if (!down) return;
    var dx = e.clientX - sx, dy = e.clientY - sy;
    if (!moved) {
      if (Math.sqrt(dx * dx + dy * dy) < 8) return; // 小位移当成点击
      moved = true;
      dock.style.transition = "none";
      dock.style.cursor = "grabbing";
    }
    var maxL = Math.max(0, window.innerWidth - dock.offsetWidth);
    var maxB = Math.max(0, window.innerHeight - dock.offsetHeight);
    applyPos(Math.min(Math.max(0, dl + dx), maxL), Math.min(Math.max(0, db - dy), maxB));
  });

  window.addEventListener("pointerup", function () {
    if (!down) return;
    down = false;
    dock.style.cursor = "";
    dock.style.transition = "";
    if (moved) {
      var r = dock.getBoundingClientRect();
      try {
        localStorage.setItem("dock_pos", JSON.stringify({
          left: Math.round(r.left),
          bottom: Math.round(window.innerHeight - r.bottom)
        }));
      } catch (e) {}
    }
  });

  // 拖动结束后不要顺带触发链接跳转
  dock.addEventListener("click", function (e) {
    if (moved) {
      e.preventDefault();
      e.stopPropagation();
      moved = false;
    }
  }, true);

  // 双击 dock 空白处恢复默认居中位置
  dock.addEventListener("dblclick", function (e) {
    if (e.target.closest(".dock-item")) return;
    try { localStorage.removeItem("dock_pos"); } catch (err) {}
    dock.style.left = "50%";
    dock.style.bottom = "18px";
    dock.style.transform = "translateX(-50%)";
  });
})();
