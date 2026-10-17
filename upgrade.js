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
    window.addEventListener('hashchange', selectSection);
    window.addEventListener('resize', () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => moveLens(activeControl, false));
    }, { passive: true });
    window.addEventListener('load', () => moveLens(activeControl, false), { once: true });
    requestAnimationFrame(() => moveLens(activeControl, false));
  }

  if (finePointer && !reducedMotion) {
    let pointerFrame = 0;
    document.addEventListener('pointermove', event => {
      if (pointerFrame) return;
      pointerFrame = requestAnimationFrame(() => {
        document.documentElement.style.setProperty('--pointer-x', (event.clientX / Math.max(1, innerWidth) * 100) + '%');
        document.documentElement.style.setProperty('--pointer-y', (event.clientY / Math.max(1, innerHeight) * 100) + '%');
        pointerFrame = 0;
      });
    }, { passive: true });

    $$('.post-card').forEach(card => {
      card.addEventListener('pointermove', event => {
        const r = card.getBoundingClientRect();
        const x = (event.clientX - r.left) / r.width;
        const y = (event.clientY - r.top) / r.height;
        card.style.setProperty('--shine-x', (x * 100) + '%');
        card.style.setProperty('--shine-y', (y * 100) + '%');
        card.style.setProperty('--tilt-x', ((0.5 - y) * 1.25) + 'deg');
        card.style.setProperty('--tilt-y', ((x - 0.5) * 1.5) + 'deg');
      }, { passive: true });
      card.addEventListener('pointerleave', () => {
        card.style.setProperty('--tilt-x', '0deg');
        card.style.setProperty('--tilt-y', '0deg');
      });
    });
  }

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
