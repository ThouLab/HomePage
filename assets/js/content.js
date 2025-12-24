/* Data-driven sections (columns/products/members)
   Content lives in /content/* so you can extend without touching templates.

   Fixes:
   - Make all fetch / internal links robust across subdirectories (/news/, /products/, /members/)
     by resolving URLs against the site's <base> (if present) or the origin.
   - Avoid "sometimes not rendered" issues caused by:
       * relative path mismatches (most common)
       * occasional race where bindReveals is not yet defined at render time
   - Add small, non-intrusive retry for transient fetch failures (GitHub Pages/CDN hiccups)
*/
(function(){
  const $ = (sel, root=document) => root.querySelector(sel);

  // ---- URL resolution (critical) -------------------------------------------
  // Prefer <base href="..."> if you use it; otherwise fall back to origin-root.
  function getSiteBase(){
    const baseEl = document.querySelector('base[href]');
    if (baseEl){
      try{
        // Normalize to ensure trailing slash
        const u = new URL(baseEl.getAttribute('href'), location.href);
        return u.href.endsWith('/') ? u.href : (u.href + '/');
      }catch(e){}
    }
    return location.origin + '/';
  }
  const SITE_BASE = getSiteBase();

  function absUrl(path){
    // path is expected like "content/columns/index.json" (no leading slash)
    return new URL(path, SITE_BASE).toString();
  }

  // Also for internal navigation links
  function absPath(path){
    // returns absolute URL string
    return absUrl(path);
  }

  // ---- fetch helpers -------------------------------------------------------
  async function fetchWithRetry(url, opts={}, retries=1){
    let lastErr;
    for (let i=0; i<=retries; i++){
      try{
        // NOTE: no-cache is fine; but on GH Pages sometimes you want default cache.
        // We'll keep your intention.
        const res = await fetch(url, {cache:'no-cache', ...opts});
        if (!res.ok) throw new Error('HTTP ' + res.status + ' ' + res.statusText);
        return res;
      }catch(e){
        lastErr = e;
        if (i < retries){
          // short backoff
          await new Promise(r => setTimeout(r, 120 * (i+1)));
          continue;
        }
      }
    }
    throw lastErr;
  }

  async function fetchJSON(path){
    const url = absUrl(path);
    const res = await fetchWithRetry(url, {}, 1);
    return await res.json();
  }

  async function fetchText(path){
    const url = absUrl(path);
    const res = await fetchWithRetry(url, {}, 1);
    return await res.text();
  }

  // ---- utils ----------------------------------------------------------------
  function formatDate(dateStr){
    try{
      const d = new Date(dateStr);
      const y = d.getFullYear();
      const m = String(d.getMonth()+1).padStart(2,'0');
      const da = String(d.getDate()).padStart(2,'0');
      return `${y}.${m}.${da}`;
    }catch(e){
      return dateStr;
    }
  }

  function byDateDesc(a,b){
    return (new Date(b.date).getTime()) - (new Date(a.date).getTime());
  }

  function escapeHtml(s){
    return (s||'')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  // bindReveals might be loaded after this script in some pages.
  // We'll call it safely (and retry shortly if not available yet).
  function safeBindReveals(root){
    try{
      if (typeof window.bindReveals === 'function'){
        window.bindReveals(root);
        return;
      }
    }catch(e){}

    // Retry once a bit later (helps "sometimes" cases)
    setTimeout(() => {
      try{
        if (typeof window.bindReveals === 'function'){
          window.bindReveals(root);
        }
      }catch(e){}
    }, 50);
  }

  // ---- renderers ------------------------------------------------------------
  function renderPostCard(post){
    const tags = (post.tags || []).slice(0,3)
      .map(t => `<span class="pill"><span class="dot"></span>${escapeHtml(t)}</span>`)
      .join('');

    // IMPORTANT: make link absolute to site base
    const href = absPath(`news/post.html?slug=${encodeURIComponent(post.slug)}`);

    return `
      <a class="card reveal" href="${href}">
        <h3 class="title">${escapeHtml(post.title)}</h3>
        <p class="desc">${escapeHtml(post.summary || '')}</p>
        <div class="meta">
          <span class="badge">${formatDate(post.date)}</span>
          ${tags}
        </div>
      </a>
    `;
  }

  function renderMemberCard(m){
    const initials = (m.name || 'T').split(/\s+/).map(p => p[0]).slice(0,2).join('').toUpperCase();
    const socials = [];
    if (m.links){
      for (const [k,v] of Object.entries(m.links)){
        if (v) socials.push(`<a class="pill" href="${escapeHtml(v)}" target="_blank" rel="noopener noreferrer"><strong>${escapeHtml(k)}</strong></a>`);
      }
    }
    return `
      <div class="card reveal">
        <div style="display:flex; gap:12px; align-items:flex-start;">
          <div aria-hidden="true" style="width:44px;height:44px;border-radius:14px;display:grid;place-items:center;border:1px solid var(--border);background:var(--surface);font-weight:800;letter-spacing:.04em;">
            ${escapeHtml(initials)}
          </div>
          <div style="flex:1; min-width:0;">
            <h3 class="title" style="margin:0">${escapeHtml(m.name || '')}</h3>
            <div class="meta" style="margin-top:6px;">
              ${m.role ? `<span class="badge">${escapeHtml(m.role)}</span>` : ''}
              ${m.focus ? `<span class="pill"><span class="dot"></span>${escapeHtml(m.focus)}</span>` : ''}
            </div>
          </div>
        </div>
        ${m.bio ? `<p class="desc" style="margin-top:10px">${escapeHtml(m.bio)}</p>` : ''}
        ${socials.length ? `<div class="meta" style="margin-top:12px">${socials.join('')}</div>` : ''}
      </div>
    `;
  }

  function renderProductCard(p){
    const tags = (p.tags || []).slice(0,4)
      .map(t => `<span class="pill"><span class="dot"></span>${escapeHtml(t)}</span>`)
      .join('');
    const status = p.status ? `<span class="badge">${escapeHtml(p.status)}</span>` : '';

    let link = '';
    if (p.link){
      const url = new URL(p.link, document.baseURI);
      const href = url.href;

      const isExternal = url.origin !== location.origin;

      link = `
        <a class="btn"
          href="${escapeHtml(href)}"
          ${isExternal ? ' target="_blank" rel="noopener noreferrer"' : ''}>
          詳細を見る
        </a>
      `;
    }

    return `
      <div class="card reveal">
        <h3 class="title">${escapeHtml(p.name || '')}</h3>
        <p class="desc">${escapeHtml(p.summary || '')}</p>
        <div class="meta">
          ${status}
          ${tags}
        </div>
        ${p.detail ? `<p class="desc" style="margin-top:12px">${escapeHtml(p.detail)}</p>` : ''}
        ${link ? `<div style="margin-top:14px">${link}</div>` : ''}
      </div>
    `;
  }

  // ---- page render functions ------------------------------------------------
  async function renderHome(){
    // Latest news
    const colHost = $('#home-columns');
    if (colHost){
      try{
        const data = await fetchJSON('content/columns/index.json');
        const posts = (data.posts || []).filter(p => p.news === true).slice().sort(byDateDesc).slice(0,3);
        colHost.innerHTML = posts.map(renderPostCard).join('');
        safeBindReveals(colHost);
      }catch(e){
        colHost.innerHTML = `<div class="notice">新着情報の読み込みに失敗しました。</div>`;
      }
    }

    // Featured products
    const prodHost = $('#home-products');
    if (prodHost){
      try{
        const data = await fetchJSON('content/products.json');
        const list = (data.products || []).filter(p => p.featured).slice(0,3);
        prodHost.innerHTML = list.map(renderProductCard).join('');
        safeBindReveals(prodHost);
      }catch(e){
        prodHost.innerHTML = `<div class="notice">プロダクトの読み込みに失敗しました。</div>`;
      }
    }
  }

  async function renderNewsIndex(){
    const host = $('#news-list');
    if (!host) return;
    try{
      const data = await fetchJSON('content/columns/index.json');
      const posts = (data.posts || []).filter(p => p.news === true).slice().sort(byDateDesc);
      host.innerHTML = posts.map(renderPostCard).join('');
      safeBindReveals(host);
    }catch(e){
      host.innerHTML = `<div class="notice">新着情報の読み込みに失敗しました。</div>`;
    }
  }

  async function renderPost(){
    const host = $('#post');
    if (!host) return;

    const params = new URLSearchParams(location.search);
    const slug = params.get('slug') || '';
    if (!slug){
      host.innerHTML = `<div class="notice">記事が指定されていません。<a href="${escapeHtml(absPath('news/'))}">新着情報一覧</a>へ戻ってください。</div>`;
      return;
    }

    try{
      // NOTE: You were fetching content/news/index.json but elsewhere columns/index.json.
      // We'll be permissive: try news/index.json first, then fallback to columns/index.json.
      let index;
      try{
        index = await fetchJSON('content/news/index.json');
      }catch(e){
        index = await fetchJSON('content/columns/index.json');
      }

      const post = (index.posts || []).find(p => p.slug === slug);
      if (!post){
        host.innerHTML = `<div class="notice">記事が見つかりませんでした。<a href="${escapeHtml(absPath('news/'))}">新着情報一覧</a>へ戻ってください。</div>`;
        return;
      }

      document.title = `${post.title} | ThouLab`;

      const md = await fetchText(`content/columns/${encodeURIComponent(slug)}.md`);
      const html = window.ThouMarkdown ? window.ThouMarkdown.mdToHtml(md) : `<pre>${escapeHtml(md)}</pre>`;

      host.innerHTML = `
        <div class="page-head">
          <div class="breadcrumbs">
            / ${escapeHtml(post.title)}
          </div>
          <h1>${escapeHtml(post.title)}</h1>
          <div class="post-meta">
            <span class="badge">${formatDate(post.date)}</span>
            ${(post.tags||[]).map(t => `<span class="pill"><span class="dot"></span>${escapeHtml(t)}</span>`).join('')}
          </div>
          ${post.summary ? `<p style="margin-top:12px;color:var(--muted);line-height:1.8">${escapeHtml(post.summary)}</p>` : ''}
        </div>
        <div class="post">
          <div class="post-content">${html}</div>
        </div>
        <a class="btn" href="news/">◀ ニュースの一覧に戻る</a>
      `;
    }catch(e){
      host.innerHTML = `<div class="notice">記事の読み込みに失敗しました。</div>`;
    }
  }

  async function renderMembers(){
    const host = $('#members-grid');
    if (!host) return;
    try{
      const data = await fetchJSON('content/members.json');
      host.innerHTML = (data.members || []).map(renderMemberCard).join('');
      safeBindReveals(host);
    }catch(e){
      host.innerHTML = `<div class="notice">メンバーの読み込みに失敗しました。</div>`;
    }
  }

  async function renderProducts(){
    const host = $('#products-sections');
    if (!host) return;
    try{
      const data = await fetchJSON('content/products.json');
      const products = (data.products || []);
      const categories = [...new Set(products.map(p => p.category || 'その他'))];

      host.innerHTML = categories.map(cat => {
        const items = products.filter(p => (p.category || 'その他') === cat);
        return `
          <section class="section">
            <div class="section-head">
              <div>
                <h2>${escapeHtml(cat)}</h2>
                <p class="sub">${escapeHtml((data.category_notes && data.category_notes[cat]) || '')}</p>
              </div>
            </div>
            <div class="grid cols-3">
              ${items.map(renderProductCard).join('')}
            </div>
          </section>
        `;
      }).join('');

      safeBindReveals(host);
    }catch(e){
      host.innerHTML = `<div class="notice">プロダクトの読み込みに失敗しました。</div>`;
    }
  }

  function initContact(){
    const form = document.getElementById('mailto-form');
    if (!form) return;

    const to = form.getAttribute('data-to') || 'contact@thoulab.example';
    const status = document.getElementById('mailto-status');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const name = form.querySelector('[name="name"]').value.trim();
      const email = form.querySelector('[name="email"]').value.trim();
      const subject = form.querySelector('[name="subject"]').value.trim() || 'ThouLabへのお問い合わせ';
      const message = form.querySelector('[name="message"]').value.trim();

      const body = [
        `お名前: ${name}`,
        `メール: ${email}`,
        ``,
        message
      ].join('\n');

      const href = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;

      location.href = href;

      if (status){
        status.textContent = 'メール作成画面を開きました（開かない場合は下部のメールアドレスを直接ご利用ください）。';
      }
    });
  }

  // ---- Boot by page type ----------------------------------------------------
  document.addEventListener('DOMContentLoaded', () => {
    const page = document.body.getAttribute('data-page') || '';

    if (page === 'home') renderHome();
    if (page === 'news') renderNewsIndex();
    if (page === 'post') renderPost();
    if (page === 'members') renderMembers();
    if (page === 'products') renderProducts();
    if (page === 'contact') initContact();
  });
})();
