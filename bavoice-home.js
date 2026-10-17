/* BAVoice-inspired home interactions. Existing article search/theme logic remains in script.js. */
(() => {
  const $ = (s, root=document) => root.querySelector(s);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const scrollTo = selector => {
    const target = $(selector);
    if (!target) return;
    target.scrollIntoView({behavior: reducedMotion ? 'auto' : 'smooth', block:'start'});
  };

  $('#qrBtn')?.addEventListener('click', () => scrollTo('#qr-contact'));
  $('#menuBtn')?.addEventListener('click', () => scrollTo('#qr-contact'));

  document.querySelectorAll('[data-feature-category]').forEach(button => {
    button.addEventListener('click', () => {
      const category = button.dataset.featureCategory;
      const target = [...document.querySelectorAll('#categories .category')]
        .find(item => item.dataset.category === category);
      if (target) target.click();
      scrollTo('#posts');
    });
  });

  document.querySelectorAll('.app-launch[href^="#"]').forEach(link => {
    link.addEventListener('click', () => {
      const target = link.getAttribute('href');
      if (target === '#posts') {
        const all = $('#categories .category[data-category="全部"]');
        all?.click();
      }
    });
  });

  const dock = $('#bottomDock');
  if (dock) {
    const syncDock = () => {
      const hash = location.hash || '#home';
      const links = [...dock.querySelectorAll('[data-dock-link]')];
      const active = links.find(link => link.getAttribute('href') === hash) ||
        links.find(link => link.getAttribute('href') === '#home');
      links.forEach(link => {
        const selected = link === active;
        link.classList.toggle('active', selected);
        if (selected) link.setAttribute('aria-current','page');
        else link.removeAttribute('aria-current');
      });
    };
    window.addEventListener('hashchange', syncDock);
    window.addEventListener('resize', () => requestAnimationFrame(() => {
      const selected = dock.querySelector('[data-dock-link].active');
      if (selected) selected.dispatchEvent(new Event('focus'));
    }));
    syncDock();
  }
})();