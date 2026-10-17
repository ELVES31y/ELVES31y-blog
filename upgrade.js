/* Unified Liquid Glass interaction engine — navigation lens, chromatic edge, reveal and restrained pointer response */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const themeButton = $('#themeBtn');
  const themeMeta = $('#themeColorMeta');
  const syncTheme = () => {
    const dark = document.body.classList.contains('dark');
    if (themeButton) {
      themeButton.textContent = dark ? '☀' : '☾';
      themeButton.setAttribute('aria-label', dark ? '切换到浅色外观' : '切换到深色外观');
    }
    if (themeMeta) themeMeta.setAttribute('content', dark ? '#151516' : '#f5f5f7');
  };
  syncTheme();
  themeButton?.addEventListener('click', () => requestAnimationFrame(syncTheme));

  const dock = $('#bottomDock');
  if (dock) {
    const lens = $('.dock-liquid-indicator', dock);
    const controls = $$('a[data-dock-link],button[data-dock-action]', dock);
    let activeControl = controls.find(el => el.classList.contains('active')) || controls[0];
    let raf = 0;
    const moveLens = (control, animate = true) => {
      if (!control || !lens) return;
      activeControl = control;
      const parent = dock.getBoundingClientRect();
      const target = control.getBoundingClientRect();
      const x = target.left - parent.left;
      if (!animate || reducedMotion) {
        lens.style.transition = 'none';
        lens.style.transform = 'translate3d(' + x + 'px,0,0)';
        lens.style.width = target.width + 'px';
        requestAnimationFrame(() => { lens.style.transition = ''; });
      } else {
        lens.style.transform = 'translate3d(' + x + 'px,0,0)';
        lens.style.width = target.width + 'px';
      }
      lens.style.setProperty('--lens-x', Math.max(0, Math.min(100, target.width / 2)) + 'px');
      controls.forEach(item => {
        const active = item === control;
        item.classList.toggle('active', active);
        if (item.matches('a[data-dock-link]')) {
          if (active) item.setAttribute('aria-current', 'page');
          else item.removeAttribute('aria-current');
        }
      });
    };
    const selectSection = () => {
      const hash = location.hash || '#home';
      const link = controls.find(el => el.matches('a[data-dock-link]') && el.getAttribute('href') === hash);
      if (link) moveLens(link);
    };
    controls.forEach(control => {
      control.addEventListener('pointerenter', () => { if (finePointer) moveLens(control); });
      control.addEventListener('focus', () => moveLens(control));
      control.addEventListener('click', () => {
        moveLens(control);
        if (control.dataset.dockAction === 'search') $('#searchBtn')?.click();
        if (control.dataset.dockAction === 'categories') {
          $('#posts')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block: 'start' });
          const categoryRow = $('#categories');
          categoryRow?.classList.add('dock-highlight');
          window.setTimeout(() => categoryRow?.classList.remove('dock-highlight'), 1000);
        }
      });
    });
    dock.addEventListener('pointerleave', () => {
      const link = controls.find(el => el.matches('a[data-dock-link]') && el.getAttribute('href') === (location.hash || '#home'));
      moveLens(link || activeControl);
    });
    /* Direct manipulation: the lens follows the pointer and settles on the nearest
       destination. Pointer capture prevents losing the gesture at the dock edge. */
    let drag = null;
    let dragFrame = 0;
    let pendingX = 0;
    let suppressClickUntil = 0;
    const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
    const centerOf = element => {
      const r = element.getBoundingClientRect();
      return r.left + r.width / 2;
    };
    const nearestControl = viewportX => controls.reduce((best, item) =>
      Math.abs(centerOf(item) - viewportX) < Math.abs(centerOf(best) - viewportX) ? item : best
    , controls[0]);
    const renderDrag = () => {
      dragFrame = 0;
      if (!drag || !lens) return;
      const dockRect = dock.getBoundingClientRect();
      const lensWidth = drag.baseWidth;
      const x = clamp(pendingX - dockRect.left - lensWidth / 2, 4, dock.clientWidth - lensWidth - 4);
      const stretch = clamp(1 + Math.abs(drag.velocity) / 2600, 1, 1.075);
      lens.style.width = lensWidth + 'px';
      lens.style.transform = 'translate3d(' + x + 'px,0,0) scaleX(' + stretch.toFixed(3) + ')';
      lens.style.setProperty('--lens-x', clamp(pendingX - dockRect.left - x, 8, lensWidth - 8) + 'px');
    };
    dock.addEventListener('pointerdown', event => {
      if (event.button !== undefined && event.button !== 0) return;
      const control = event.target.closest('a[data-dock-link],button[data-dock-action]');
      if (!control && !event.target.closest('.dock-liquid-indicator')) return;
      const rect = lens.getBoundingClientRect();
      drag = { pointerId:event.pointerId, startX:event.clientX, lastX:event.clientX, startY:event.clientY,
        lastTime:performance.now(), velocity:0, moved:false,
        startControl:control || activeControl, baseWidth:rect.width || (control || activeControl).getBoundingClientRect().width };
      pendingX = event.clientX;
      try { (control || lens).setPointerCapture(event.pointerId); } catch (_) {}
    });
    dock.addEventListener('pointermove', event => {
      if (!drag || drag.pointerId !== event.pointerId) return;
      const now = performance.now();
      drag.velocity = (event.clientX - drag.lastX) / Math.max(1, now - drag.lastTime) * 1000;
      drag.lastX = event.clientX;
      drag.lastTime = now;
      if (!drag.moved && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 6) {
        drag.moved = true;
        dock.classList.add('is-dragging');
        controls.forEach(item => item.style.pointerEvents = 'none');
      }
      if (!drag.moved) return;
      pendingX = event.clientX;
      if (!dragFrame) dragFrame = requestAnimationFrame(renderDrag);
      if (event.cancelable) event.preventDefault();
    }, { passive:false });
    const finishDrag = (event, cancelled = false) => {
      if (!drag || (event && event.pointerId !== drag.pointerId)) return;
      const state = drag;
      drag = null;
      if (dragFrame) cancelAnimationFrame(dragFrame);
      dragFrame = 0;
      if (!state.moved || cancelled) {
        dock.classList.remove('is-dragging');
        controls.forEach(item => item.style.pointerEvents = '');
        moveLens(activeControl, false);
        return;
      }
      suppressClickUntil = performance.now() + 450;
      const destination = nearestControl(event && Number.isFinite(event.clientX) ? event.clientX : state.lastX);
      controls.forEach(item => item.style.pointerEvents = '');
      dock.classList.remove('is-dragging');
      if (destination.matches('a[data-dock-link]')) {
        activeControl = destination;
        moveLens(destination);
        const href = destination.getAttribute('href');
        if (href && href.startsWith('#')) {
          history.replaceState(null, '', href);
          document.querySelector(href)?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block:'start' });
        }
      } else {
        moveLens(destination);
        if (destination.dataset.dockAction === 'search') $('#searchBtn')?.click();
        if (destination.dataset.dockAction === 'categories') $('#posts')?.scrollIntoView({ behavior: reducedMotion ? 'auto' : 'smooth', block:'start' });
      }
    };
    dock.addEventListener('pointerup', event => finishDrag(event));
    dock.addEventListener('pointercancel', event => finishDrag(event, true));
    dock.addEventListener('lostpointercapture', event => {
      if (drag && drag.pointerId === event.pointerId) finishDrag(event, true);
    });
    dock.addEventListener('click', event => {
      if (performance.now() < suppressClickUntil) {
        event.preventDefault();
        event.stopImmediatePropagation();
      }
    }, true);

    window.addEventListener('hashchange', selectSection);
    if ('IntersectionObserver' in window) {
      const sectionLinks = [
        { selector: '.hero', href: '#home' },
        { selector: '#posts', href: '#posts' },
        { selector: '#about', href: '#about' }
      ];
      const sectionObserver = new IntersectionObserver(entries => {
        const visible = entries.filter(entry => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (!visible) return;
        const item = sectionLinks.find(entry => document.querySelector(entry.selector) === visible.target);
        const link = item && controls.find(control => control.matches('a[data-dock-link]') && control.getAttribute('href') === item.href);
        if (link && !dock.matches(':hover')) moveLens(link);
      }, { rootMargin: '-28% 0px -48% 0px', threshold: [0, .1, .25, .5] });
      sectionLinks.forEach(item => {
        const section = document.querySelector(item.selector);
        if (section) sectionObserver.observe(section);
      });
    }
    window.addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => moveLens(activeControl, false));
    }, { passive: true });
    window.addEventListener('load', () => moveLens(activeControl, false), { once: true });
    requestAnimationFrame(() => moveLens(activeControl, false));
  }

  /* No document-wide pointer repaint and no card tilt loop: keep the glass responsive
     by limiting continuous work to the actively dragged navigation lens. */

  if (!reducedMotion && 'IntersectionObserver' in window) {
    const targets = $$('.hero-text,.hero-art,.section-top,.post-controls,.post-card,.about,.site-details-inner');
    targets.forEach((node, i) => {
      node.classList.add('reveal');
      node.style.setProperty('--reveal-delay', (Math.min(i % 4, 3) * 65) + 'ms');
    });
    document.documentElement.classList.add('motion-ready');
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -35px 0px' });
    targets.forEach(node => observer.observe(node));
  }

  const start = new Date('2026-10-11T00:00:00+08:00');
  const days = Math.max(1, Math.floor((Date.now() - start.getTime()) / 86400000) + 1);
  const dayNode = $('#siteRecordDays');
  if (dayNode) dayNode.textContent = Number.isFinite(days) ? days.toLocaleString('zh-CN') : '—';
  const countNode = $('#sitePostCount');
  if (countNode) countNode.textContent = $$('.post-card').length.toString().padStart(2, '0');
  const categoryNode = $('#siteCategoryCount');
  if (categoryNode) categoryNode.textContent = new Set($$('.post-card').map(card => card.dataset.category).filter(Boolean)).size.toString().padStart(2, '0');
  const updateNode = $('#siteUpdatedAt');
  if (updateNode) {
    const dates = $$('article.post-card time').map(node => new Date(node.textContent.trim().replaceAll('.', '-') + 'T00:00:00'));
    const valid = dates.filter(date => !Number.isNaN(date.getTime())).sort((a, b) => b - a)[0];
    updateNode.textContent = valid ? valid.toLocaleDateString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit' }) : '暂无记录';
  }
  const yearNode = $('#year');
  if (yearNode) yearNode.textContent = new Date().getFullYear();
})();
