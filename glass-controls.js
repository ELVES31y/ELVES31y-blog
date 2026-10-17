/* Component-scoped Liquid Glass controls. Stage 1 only: static material and accessibility-safe settings. */
(() => {
  const root = document.documentElement;
  const body = document.body;
  const trigger = document.getElementById('glassSettingsBtn');
  const panel = document.getElementById('glassSettingsPanel');
  const range = document.getElementById('glassTransparencyRange');
  const output = document.getElementById('glassTransparencyValue');
  const close = document.getElementById('glassSettingsClose');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const isSafari = /Safari/i.test(navigator.userAgent) &&
    !/(Chrome|Chromium|CriOS|Edg|OPR|Android|FxiOS)/i.test(navigator.userAgent);
  root.classList.toggle('is-safari', isSafari);

  const syncTheme = () => {
    root.classList.toggle('dark', body.classList.contains('dark'));
  };
  syncTheme();
  document.getElementById('themeBtn')?.addEventListener('click', () => requestAnimationFrame(syncTheme));

  const applyTransparency = (raw, persist = false) => {
    const value = Math.max(20, Math.min(90, Number(raw) || 72));
    const t = (value - 20) / 70;
    const lightTint = .82 - t * .70;
    const darkTint = .68 - t * .58;
    const blur = 5 + (1 - t) * 19;
    const rim = .34 + t * .30;
    const chroma = .08 + t * .12;
    root.style.setProperty('--glass-transparency', t.toFixed(3));
    root.style.setProperty('--glass-tint-light', lightTint.toFixed(3));
    root.style.setProperty('--glass-tint-dark', darkTint.toFixed(3));
    root.style.setProperty('--glass-blur', blur.toFixed(1) + 'px');
    root.style.setProperty('--glass-rim-alpha', rim.toFixed(3));
    root.style.setProperty('--glass-chroma-alpha', chroma.toFixed(3));
    if (range && Number(range.value) !== value) range.value = String(value);
    if (output) output.value = value + '%';
    if (range) range.setAttribute('aria-valuetext', value + '% 通透度');
    if (persist) {
      try { localStorage.setItem('elves-glass-transparency', String(value)); } catch (_) {}
    }
  };

  let initial = 72;
  try {
    const saved = localStorage.getItem('elves-glass-transparency');
    if (saved !== null && Number.isFinite(Number(saved))) initial = Number(saved);
  } catch (_) {}
  applyTransparency(range ? range.value || initial : initial);
  if (range) range.addEventListener('input', event => applyTransparency(event.currentTarget.value, true));

  const closePanel = (restoreFocus = false) => {
    if (!trigger || !panel || panel.hidden) return;
    trigger.setAttribute('aria-expanded', 'false');
    panel.classList.remove('is-open');
    const delay = reducedMotion ? 0 : 190;
    window.setTimeout(() => { panel.hidden = true; }, delay);
    if (restoreFocus) trigger.focus();
  };
  const openPanel = () => {
    if (!trigger || !panel) return;
    panel.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    requestAnimationFrame(() => {
      panel.classList.add('is-open');
      range?.focus({ preventScroll: true });
    });
  };
  trigger?.addEventListener('click', () => {
    if (panel?.hidden) openPanel();
    else closePanel();
  });
  close?.addEventListener('click', () => closePanel(true));
  document.addEventListener('pointerdown', event => {
    if (!panel || panel.hidden || panel.contains(event.target) || trigger?.contains(event.target)) return;
    closePanel();
  }, { passive: true });
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && panel && !panel.hidden) closePanel(true);
  });
})();