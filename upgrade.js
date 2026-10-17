/* NIGHT liquid-glass upgrade: dock navigation + factual site information */
(() => {
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const dock = $('#bottomDock');
  if (dock) {
    dock.addEventListener('click', event => {
      const button = event.target.closest('[data-dock-action]');
      if (!button) return;
      const action = button.dataset.dockAction;
      if (action === 'search') $('#searchBtn')?.click();
      if (action === 'categories') {
        $('#posts')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
        $('#categories')?.classList.add('dock-highlight');
        setTimeout(() => $('#categories')?.classList.remove('dock-highlight'), 900);
      }
    });
    const links = $$('a[data-dock-link]', dock);
    const setActive = () => {
      const hash = location.hash || '#home';
      links.forEach(link => link.classList.toggle('active', link.getAttribute('href') === hash || (hash === '#posts' && link.getAttribute('href') === '#posts')));
    };
    links.forEach(link => link.addEventListener('click', () => {
      links.forEach(item => item.classList.toggle('active', item === link));
    }));
    window.addEventListener('hashchange', setActive);
    setActive();
  }

  // This is the site's declared record-start date, not a claim about hosting uptime.
  // Change this ISO date if you want the counter to start from another date.
  const SITE_RECORD_START = '2026-10-11';
  const start = new Date(SITE_RECORD_START + 'T00:00:00+08:00');
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
    updateNode.textContent = valid ? valid.toLocaleDateString('zh-CN', {year:'numeric', month:'2-digit', day:'2-digit'}) : '暂无记录';
  }
  const yearNode = $('#year');
  if (yearNode) yearNode.textContent = new Date().getFullYear();
})();
