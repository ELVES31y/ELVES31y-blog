/* ============================================================
   dock.js — 底部 dock 交互
   - 悬停：滑块跟着指针滑到最近图标上，涟漪放大同事发生
   - 切页：滑块从上一页滑到当前页，之后让位给高光
   - 滑块与高光永不同时出现
   ============================================================ */
(function () {
  "use strict";
  var dock = document.querySelector(".dock");
  if (!dock) return;

  var items = Array.prototype.slice.call(dock.querySelectorAll(".dock-item"));
  if (!items.length) return;

  var REACH = 96, BOOST = 0.24, LIFT = 6, PUSH = 4, DISP = 0.8;

  // ---------- 原始位置 ----------
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

  // ---------- 滑块 ----------
  var ind = dock.querySelector(".dock-indicator");
  var dockInner = dock.querySelector(".dock-inner");
  var activeEl = dock.querySelector(".dock-item.active") || items[0];
  var indTimer = 0, indHideTimer = 0, hoverIdx = -1;

  function restTransform() { return "translateY(-50%) scaleX(1) scaleY(1)"; }

  function placeInd(el, smooth) {
    if (!ind || !el || !dockInner) return;
    var ir = dockInner.getBoundingClientRect();
    var r = el.getBoundingClientRect();
    var w = r.width + 6;
    var h = r.height + 4;
    var newLeft = r.left - ir.left - 3;
    var oldLeft = parseFloat(ind.style.left || "0") || 0;

    ind.style.width = w + "px";
    ind.style.height = h + "px";

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
    var sx = 1 + Math.min(0.45, dist / 320);
    var sy = 1 - Math.min(0.14, dist / 1100);

    ind.style.transformOrigin = dx >= 0 ? "left center" : "right center";
    ind.style.transform = "translateY(-50%) scaleX(" + sx.toFixed(3) + ") scaleY(" + sy.toFixed(3) + ")";
    ind.style.left = newLeft + "px";

    clearTimeout(indTimer);
    indTimer = setTimeout(function () {
      ind.style.transformOrigin = "center center";
      ind.style.transform = restTransform();
    }, 420);
  }

  function showSlider() {
    ind.classList.add("is-show");
    dock.classList.add("is-sliding");
    clearTimeout(indHideTimer);
  }

  function hideSliderSoon(ms) {
    clearTimeout(indHideTimer);
    indHideTimer = setTimeout(function () {
      ind.classList.remove("is-show");
      dock.classList.remove("is-sliding");
    }, ms);
  }

  // ---------- 切页入场 ----------
  var curIdx = items.indexOf(activeEl);
  var prevIdx = -1;
  try { prevIdx = parseInt(localStorage.getItem("dock_prev") || "-1", 10); } catch (e) { prevIdx = -1; }
  try { localStorage.setItem("dock_prev", String(curIdx)); } catch (e) {}

  measure();

  if (prevIdx >= 0 && prevIdx !== curIdx && items[prevIdx]) {
    placeInd(items[prevIdx], false);
    showSlider();
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        placeInd(activeEl, true);
        hideSliderSoon(950);
      });
    });
  } else {
    placeInd(activeEl, false);
  }

  window.addEventListener("resize", function () {
    measure();
    placeInd(dock.querySelector(".dock-item.active") || items[0], false);
  });

  // ---------- 涟漪 + 悬停跟随 ----------
  function nearestIdx(clientX) {
    var best = -1, bestD = 1e9;
    for (var i = 0; i < base.length; i++) {
      var d = Math.abs(base[i].cx - clientX);
      if (d < bestD) { bestD = d; best = i; }
    }
    return best;
  }

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

    var idx = nearestIdx(clientX);
    if (idx >= 0 && idx !== hoverIdx) {
      hoverIdx = idx;
      showSlider();
      placeInd(items[idx], true);
    }
  }

  function onMove(e) { applyRipple(e.clientX); }

  dock.addEventListener("mousemove", onMove, { passive: true });
  dock.addEventListener("touchmove", function (e) {
    if (e.touches && e.touches[0]) applyRipple(e.touches[0].clientX);
  }, { passive: true });

  function resetRipple() {
    for (var i = 0; i < items.length; i++) {
      items[i].style.transform = "";
      items[i].style.removeProperty("--disp");
    }
    dock.style.setProperty("--glow", "0");
  }

  function leaveDock() {
    resetRipple();
    if (hoverIdx >= 0) {
      hoverIdx = -1;
      placeInd(activeEl, true);
      hideSliderSoon(700);
    }
  }

  dock.addEventListener("mouseleave", leaveDock);
  dock.addEventListener("touchend", function () { setTimeout(leaveDock, 300); });

  // ---------- 滚动：玻璃透明度 ----------
  window.addEventListener("scroll", function () {
    var y = window.scrollY || 0;
    dock.style.setProperty("--fade", Math.min(1, y / 420).toFixed(2));
    resetRipple();
  }, { passive: true });

  // 指针离开窗口或页面时也复位，避免图标停在放大状态
  document.addEventListener("mouseleave", resetRipple);
  window.addEventListener("blur", resetRipple);

  // ---------- 自动隐藏 ----------
  var IDLE_MS = 3000;
  var lastY = window.scrollY || 0;
  var idleTimer = 0, lastReset = 0, overDock = false;

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
