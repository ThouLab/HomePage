/* ThouLab site scripts (no build step)
   - Header/Footer injection
   - Theme toggle (dark/light)
   - Mobile navigation
   - Scroll reveal
*/

(function(){
  const $ = (sel, root=document) => root.querySelector(sel);
  const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));

  function getThemePreference(){
    const saved = localStorage.getItem('theme');
    if (saved === 'dark' || saved === 'light') return saved;
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  function applyTheme(theme){
    const root = document.documentElement;
    root.dataset.theme = theme;
    localStorage.setItem('theme', theme);
    const btn = $('#theme-toggle');
    if (btn){
      btn.setAttribute('aria-label', theme === 'dark' ? 'ライトテーマに切り替え' : 'ダークテーマに切り替え');
      btn.setAttribute('title', theme === 'dark' ? 'ライトテーマ' : 'ダークテーマ');
      btn.dataset.state = theme;
    }
  }

  async function injectPartials(){
    const headerHost = $('#site-header');
    const footerHost = $('#site-footer');

    // If placeholders are missing, do nothing.
    if (!headerHost && !footerHost) return;

    const tasks = [];

    if (headerHost){
      tasks.push(fetch('partials/header.html', {cache:'no-cache'})
        .then(r => r.ok ? r.text() : '')
        .then(html => { headerHost.innerHTML = html; })
        .catch(() => {}));
    }
    if (footerHost){
      tasks.push(fetch('partials/footer.html', {cache:'no-cache'})
        .then(r => r.ok ? r.text() : '')
        .then(html => { footerHost.innerHTML = html; })
        .catch(() => {}));
    }

    await Promise.all(tasks);

    initHeader();
    initActiveNav();
  }

  function initHeader(){
    const themeBtn = $('#theme-toggle');
    if (themeBtn){
      themeBtn.addEventListener('click', () => {
        const cur = document.documentElement.dataset.theme || 'dark';
        applyTheme(cur === 'dark' ? 'light' : 'dark');
      });
    }

    const openBtn = $('#nav-open');
    const panel = $('#mobile-panel');
    const closeBtn = $('#nav-close');

    function open(){
      if (!panel) return;
      panel.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      closeBtn && closeBtn.focus();
    }
    function close(){
      if (!panel) return;
      panel.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
      openBtn && openBtn.focus();
    }

    if (openBtn) openBtn.addEventListener('click', open);
    if (closeBtn) closeBtn.addEventListener('click', close);

    if (panel){
      panel.addEventListener('click', (e) => {
        // click outside drawer closes
        if (e.target === panel) close();
      });
      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && panel.getAttribute('aria-hidden') === 'false') close();
      });
    }
  }

  function initActiveNav(){
    const path = location.pathname.replace(/\/+$/, '/') || '/';
    const anchors = $$('.nav a');
    if (!anchors.length) return;

    // Normalize to base-aware path by stripping any repo prefix from path if base tag exists.
    const baseEl = document.querySelector('base');
    let baseHref = baseEl ? baseEl.getAttribute('href') : '/';
    if (!baseHref.endsWith('/')) baseHref += '/';

    const normalizedPath = path.startsWith(baseHref) ? path.slice(baseHref.length - 1) : path;

    anchors.forEach(a => {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('http') || href.startsWith('mailto:')) return;

      // Compare directory-style paths.
      const link = href.replace(/^\.\//,'').replace(/\/?$/, '/');
      const here = normalizedPath.replace(/\/?$/, '/');

      if (link === './') {
        if (here === '/' || here === '/index.html') a.setAttribute('aria-current','page');
        return;
      }
      if (here.startsWith('/' + link) || here === '/' + link) {
        a.setAttribute('aria-current','page');
      }
    });
  }

  function initReveal(){
    const items = $$('.reveal');
    if (!items.length) return;

    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches){
      items.forEach(el => el.classList.add('in'));
      return;
    }

    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting){
          en.target.classList.add('in');
          io.unobserve(en.target);
        }
      });
    }, {rootMargin: '0px 0px -10% 0px', threshold: 0.08});

    items.forEach(el => io.observe(el));
  }

  // Boot
  document.addEventListener('DOMContentLoaded', () => {
    applyTheme(getThemePreference());
    injectPartials().finally(() => {
      initReveal();
    });
  });
})();
