(() => {
  /**
   * おまもりクオッカ — 特設ページ用JS
   *
   * - スタンプ(16枚)のギャラリー表示＋拡大表示（Lightbox）
   * - クオッカからの挑戦状：回答（式）を入力 → 判定 → 正解なら認定証PNG生成＆シェア
   *
   * 注意：
   * - baseタグを使うサイト構成のため、画像パスは `assets/...` を指定すればOK（ドキュメントベースに解決される）
   */

  // TODO: 実際のLINEスタンプURLに差し替えてください
  const LINE_STAMP_URL = "https://line.me/S/sticker/32551910?_from=lcm";

  const STAMP_COUNT = 16;
  const STAMP_DIR = "/assets/img/quokka/";
  const STAMP_PREFIX = "qs";
  const STAMP_EXT = ".png";

  const CERT_LOGO_SRC = "/assets/img/logo.png";

  const stampPath = (index) =>
    `${STAMP_DIR}${STAMP_PREFIX}${String(index).padStart(3, "0")}${STAMP_EXT}`;

  const STAMPS = Array.from({ length: STAMP_COUNT }, (_, i) => ({
    index: i,
    id: `${STAMP_PREFIX}${String(i).padStart(3, "0")}`,
    src: stampPath(i),
    alt: `おまもりクオッカ スタンプ ${STAMP_PREFIX}${String(i).padStart(3, "0")}`,
  }));

  // 将来的にこの配列へ追加するだけで、問題を増やせます
  const CHALLENGES = [
    {
      id: "samba-4738-10",
      number: "第1問　☆☆☆☆☆（超難問）",
      title: "夜な夜なサンバ",
      prompt: "4,7,3,8を使って答えが10になる計算式をつくれるかな？",
      giverStamp: 2, // ← 002 のキャラが出題
      target: 10,
      requiredDigits: ["4", "7", "3", "8"],
      rules: [
        "4, 7, 3, 8 をそれぞれ1回ずつ使って計算式を作ろう",
        "使えるのは + − × ÷ と ( )",
        "式を作ったら「判定」をしよう",
        "答えが 10になったら認定証GET！",
        "認定証に記載されるニックネームの入力もお忘れなく！",
      ],
      shareText:
        "クオッカからの挑戦状「夜な夜なサンバ」をクリアしたぞ！ #おまもりクオッカ",
      certificate: {
        headline: "おまもりクオッカ 認定証",
        lines: ["クオッカからの挑戦状", "「夜な夜なサンバ」クリア！"],
      },
    },
  ];

  const qs = (sel, root = document) => root.querySelector(sel);

  document.addEventListener("DOMContentLoaded", () => {
    initLineStampLink();
    renderStampThumbs();
    renderStampGrid();
    setupLightbox();
    renderChallenges();

    const countEl = qs("#challenge-count");
    if (countEl) countEl.textContent = String(CHALLENGES.length);
  });

  function initLineStampLink() {
    const link = qs("#line-stamp-link");
    if (!link) return;

    if (LINE_STAMP_URL && LINE_STAMP_URL.trim()) {
      link.href = LINE_STAMP_URL.trim();
      link.textContent = "購入";
      link.setAttribute("aria-disabled", "false");
      link.classList.remove("is-disabled");
    } else {
      link.href = "javascript:void(0)";
      link.textContent = "LINEリンク準備中";
      link.setAttribute("aria-disabled", "true");
      link.classList.add("is-disabled");
    }
  }

  function renderStampThumbs() {
    const wrap = qs("#stamp-thumbs");
    if (!wrap) return;

    const picks = [0, 1, 2, 3, 4, 5];
    wrap.innerHTML = "";
    picks.forEach((i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quokka-thumb";
      btn.dataset.stampIndex = String(i);
      btn.innerHTML = `<img loading="lazy" decoding="async" src="${STAMPS[i].src}" alt="${STAMPS[i].alt}">`;
      wrap.appendChild(btn);
    });
  }

  function renderStampGrid() {
    const grid = qs("#stamp-grid");
    if (!grid) return;
    grid.innerHTML = "";

    STAMPS.forEach((s) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "quokka-stamp";
      btn.dataset.stampIndex = String(s.index);
      btn.setAttribute("aria-label", `${s.id} を拡大表示`);
      btn.innerHTML = `<img loading="lazy" decoding="async" src="${s.src}" alt="${s.alt}">`;
      grid.appendChild(btn);
    });
  }

  function setupLightbox() {
    const lightbox = qs("#stamp-lightbox");
    if (!lightbox) return;

    const img = qs("#lightbox-img", lightbox);
    const cap = qs("#lightbox-caption", lightbox);

    // close
    lightbox.querySelectorAll("[data-close]").forEach((el) => {
      el.addEventListener("click", () => close());
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });

    // open (event delegation)
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      const btn = t.closest("[data-stamp-index]");
      if (!btn) return;

      const idx = Number(btn.getAttribute("data-stamp-index"));
      if (!Number.isFinite(idx)) return;
      open(idx);
    });

    function open(idx) {
      const s = STAMPS[idx];
      if (!s) return;
      img.src = s.src;
      img.alt = s.alt;
      cap.textContent = s.id;
      lightbox.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
    }

    function close() {
      if (lightbox.getAttribute("aria-hidden") === "true") return;
      lightbox.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
    }
  }

  function renderChallenges() {
    const list = qs("#challenge-list");
    if (!list) return;
    list.innerHTML = "";

    CHALLENGES.forEach((ch) => list.appendChild(buildChallengeCard(ch)));
  }

  function buildChallengeCard(ch) {
    const card = document.createElement("article");
    card.className = "card quokka-challenge-card";
    card.dataset.challengeId = ch.id;

    const rulesHtml = (ch.rules || [])
      .map((r) => `<li>${escapeHtml(r)}</li>`)
      .join("");

    const giverSrc = stampPath(ch.giverStamp ?? 2);
    const giverAlt = `出題者スタンプ ${STAMP_PREFIX}${String(ch.giverStamp ?? 2).padStart(
      3,
      "0"
    )}`;

    card.innerHTML = `
      <div class="quokka-challenge-head">
        <div class="quokka-avatar">
          <img loading="lazy" decoding="async" src="${giverSrc}" alt="${giverAlt}">
        </div>

        <div class="quokka-bubble">
          <div class="quokka-bubble__kicker">${escapeHtml(ch.number || "挑戦状")}</div>
          <h3 class="quokka-bubble__title">${escapeHtml(ch.title)}</h3>
          <p class="quokka-bubble__prompt">${escapeHtml(ch.prompt)}</p>
        </div>
      </div>

      <div class="quokka-challenge-body">
        <details class="quokka-rules" open>
          <summary>ルール</summary>
          <ul>${rulesHtml}</ul>
        </details>

        <form class="form quokka-answer" autocomplete="off">

          <div class="field">
            <label>ニックネーム（正解した時に貰える認定証に表示されます）</label>
            <input
              type="text"
              name="playerName"
              inputmode="text"
              autocomplete="name"
              placeholder="例：クオッカ太郎"
              maxlength="24"
              aria-label="お名前を入力"
            >
          </div>


          <div class="field">
            <label>回答（式）</label>
            <div class="quokka-answer-row">
              <input type="text" name="answer" inputmode="text" placeholder="例： 4+7×(3-8)" aria-label="回答を入力">
              <button type="submit" class="btn primary">判定する</button>
            </div>
          </div>

          <div class="quokka-feedback" role="status" aria-live="polite">
            数字 ${escapeHtml(ch.requiredDigits.join(", "))} を1回ずつ使って、${escapeHtml(
      String(ch.target)
    )} をつくって、「判定する」ボタンを押してみてね。
          </div>

          <div class="quokka-cert" hidden>

            <img alt="認定証のプレビュー">

            <div class="quokka-cert-actions">
              <button type="button" class="btn primary" data-action="share">認定証をシェア</button>
              <button type="button" class="btn" data-action="download">画像を保存</button>
              <a class="btn" data-action="tweet" target="_blank" rel="noopener">Xに投稿（画像は手動添付）</a>
            </div>

            <p class="quokka-small">
              ※ ブラウザ/端末によっては「シェア」が使えない場合があります。その場合は「画像を保存」→SNSに添付してください。
            </p>
          </div>
        </form>
      </div>
    `;

    const form = card.querySelector("form.quokka-answer");
    const input = card.querySelector('input[name="answer"]');
    const nameInput = card.querySelector('input[name="playerName"]');
    const PLAYER_NAME_KEY = "quokka_player_name";
    if (nameInput) {
      nameInput.value = localStorage.getItem(PLAYER_NAME_KEY) || "";
    }
    const feedback = card.querySelector(".quokka-feedback");
    const certWrap = card.querySelector(".quokka-cert");
    const certImg = card.querySelector(".quokka-cert img");

    const shareBtn = card.querySelector('button[data-action="share"]');
    const dlBtn = card.querySelector('button[data-action="download"]');
    const tweetLink = card.querySelector('a[data-action="tweet"]');

    let currentUrl = null;

    const storageKey = `quokka_clear__${ch.id}`;
    if (localStorage.getItem(storageKey) === "1") {
      feedback.classList.add("ok");
      feedback.textContent = "クリア済み！ もう一度別の式でも挑戦できるよ。";
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const raw = (input.value || "").trim();
      if (!raw) {
        setFeedback("式を入力してね", "ng");
        certWrap.hidden = true;
        return;
      }

      const nameRaw = (nameInput?.value || "").trim();
      if (nameInput) localStorage.setItem(PLAYER_NAME_KEY, nameRaw);


      const res = judgeExpression(raw, ch.requiredDigits, ch.target);
      if (!res.ok) {
        setFeedback(res.message, "ng");
        certWrap.hidden = true;
        return;
      }

      localStorage.setItem(storageKey, "1");
      setFeedback(
        `おめでとう、大正解！ 🎉（判定結果：${formatNumber(res.value)}） 認定証を発行したよ。友達に自慢しよう！`,
        "ok"
      );

      try {
        const { blob, url } = await createCertificate(ch, nameRaw);
        if (currentUrl) URL.revokeObjectURL(currentUrl);
        currentUrl = url;
        certImg.src = url;
        certWrap.hidden = false;

        dlBtn.onclick = () => downloadBlob(blob, `omamori-quokka_${ch.id}.png`);
        shareBtn.onclick = () =>
          shareCertificate(blob, ch.shareText || "クリアしたぞ！ #おまもりクオッカ");
        tweetLink.href = buildTweetIntentUrl(
          ch.shareText || "クリアしたぞ！ #おまもりクオッカ"
        );
      } catch (err) {
        console.error(err);
        certWrap.hidden = true;
        setFeedback(
          "正解！ ただ今、認定証の生成に失敗しちゃった…（画像の読み込みができない環境かも）",
          "ok"
        );
      }
    });

    function setFeedback(text, tone) {
      feedback.classList.remove("ok", "ng");
      if (tone) feedback.classList.add(tone);
      feedback.textContent = text;
    }

    return card;
  }

  // ===== Judge / Safe evaluation =====

  function normalizeInput(str) {
    return String(str)
      .replace(/[\u3000\s]+/g, "") // spaces (incl fullwidth)
      .replace(/[（）]/g, (m) => (m === "（" ? "(" : ")"))
      .replace(/[＋]/g, "+")
      .replace(/[－−ー]/g, "-")
      .replace(/[×✕＊xXｘX・]/g, "*")
      .replace(/[÷／]/g, "/")
      .replace(/[０-９]/g, (d) =>
        String.fromCharCode(d.charCodeAt(0) - 0xff10 + 0x30)
      );
  }

  function judgeExpression(input, requiredDigits, target) {
    const expr = normalizeInput(input);

    if (!expr) return { ok: false, message: "式を入力してね。" };

    if (!/^[0-9+\-*/().]+$/.test(expr)) {
      return { ok: false, message: "使えるのは数字と + − × ÷ ( ) だけだよ。" };
    }

    let tokens;
    try {
      tokens = tokenize(expr);
    } catch (err) {
      return {
        ok: false,
        message: err && err.message ? err.message : "式の読み取りに失敗しちゃった…",
      };
    }

    const digitCheck = checkDigits(tokens, requiredDigits);
    if (!digitCheck.ok) return { ok: false, message: digitCheck.message };

    let value;
    try {
      value = evaluate(tokens);
    } catch (err) {
      return {
        ok: false,
        message: err && err.message ? err.message : "計算できなかったよ…",
      };
    }

    if (!Number.isFinite(value)) {
      return {
        ok: false,
        message:
          "計算結果が不正になっちゃった…（割り算やカッコを見直してね）",
      };
    }

    const ok = Math.abs(value - target) < 1e-9;
    if (!ok) {
      return { ok: false, message: `残念！ 結果は ${formatNumber(value)} だったよ。` };
    }

    return { ok: true, value };
  }

  function tokenize(expr) {
    const tokens = [];
    let i = 0;

    while (i < expr.length) {
      const c = expr[i];

      if (isDigit(c)) {
        let j = i;
        while (j < expr.length && isDigit(expr[j])) j++;

        const numStr = expr.slice(i, j);
        if (numStr.length !== 1) {
          throw new Error("数字は1桁ずつ使ってね（例：47 のような連結は不可）");
        }

        tokens.push({ type: "num", value: Number(numStr), raw: numStr });
        i = j;
        continue;
      }

      if (c === "(" || c === ")") {
        tokens.push({ type: "paren", value: c });
        i++;
        continue;
      }

      if ("+-*/".includes(c)) {
        tokens.push({ type: "op", value: c });
        i++;
        continue;
      }

      throw new Error("式に使えない文字が含まれているよ。");
    }

    // unary minus → "neg"
    const out = [];
    for (let k = 0; k < tokens.length; k++) {
      const t = tokens[k];
      if (t.type === "op" && t.value === "-") {
        const prev = out[out.length - 1];
        if (!prev || prev.type === "op" || (prev.type === "paren" && prev.value === "(")) {
          out.push({ type: "op", value: "neg" });
          continue;
        }
      }
      out.push(t);
    }

    return out;
  }

  function checkDigits(tokens, requiredDigits) {
    const required = requiredDigits.map(String);
    const counts = new Map(required.map((d) => [d, 0]));

    for (const t of tokens) {
      if (t.type !== "num") continue;
      const d = String(t.value);

      if (!counts.has(d)) {
        return { ok: false, message: `使える数字は ${required.join(", ")} だけだよ。` };
      }
      counts.set(d, counts.get(d) + 1);
    }

    for (const d of required) {
      const c = counts.get(d);
      if (c !== 1) {
        if (c === 0)
          return {
            ok: false,
            message: `数字 ${d} を使ってないよ（${required.join(", ")} を1回ずつね）。`,
          };
        return { ok: false, message: `数字 ${d} を ${c} 回使ってるよ（1回だけね）。` };
      }
    }

    return { ok: true };
  }

  function evaluate(tokens) {
    // Shunting-yard → RPN
    const output = [];
    const ops = [];

    const prec = { neg: 3, "*": 2, "/": 2, "+": 1, "-": 1 };
    const rightAssoc = { neg: true };

    for (const t of tokens) {
      if (t.type === "num") {
        output.push(t);
        continue;
      }

      if (t.type === "op") {
        const o1 = t.value;
        while (ops.length) {
          const top = ops[ops.length - 1];
          if (top.type !== "op") break;

          const o2 = top.value;
          const p1 = prec[o1];
          const p2 = prec[o2];
          if (p2 === undefined) break;

          const cond = rightAssoc[o1] ? p1 < p2 : p1 <= p2;
          if (!cond) break;
          output.push(ops.pop());
        }
        ops.push(t);
        continue;
      }

      if (t.type === "paren") {
        if (t.value === "(") {
          ops.push(t);
          continue;
        }

        // ')'
        let found = false;
        while (ops.length) {
          const top = ops.pop();
          if (top.type === "paren" && top.value === "(") {
            found = true;
            break;
          }
          output.push(top);
        }
        if (!found) throw new Error("カッコの対応が合ってないよ。");
      }
    }

    while (ops.length) {
      const top = ops.pop();
      if (top.type === "paren") throw new Error("カッコの対応が合ってないよ。");
      output.push(top);
    }

    // Evaluate RPN
    const st = [];
    for (const t of output) {
      if (t.type === "num") {
        st.push(t.value);
        continue;
      }

      if (t.type === "op") {
        if (t.value === "neg") {
          if (st.length < 1) throw new Error("式がうまく読めないよ（マイナスの位置を見直してね）。");
          const a = st.pop();
          st.push(-a);
          continue;
        }

        if (st.length < 2) throw new Error("式がうまく読めないよ（演算子の位置を見直してね）。");
        const b = st.pop();
        const a = st.pop();

        let v;
        switch (t.value) {
          case "+":
            v = a + b;
            break;
          case "-":
            v = a - b;
            break;
          case "*":
            v = a * b;
            break;
          case "/":
            if (Math.abs(b) < 1e-12) throw new Error("0 で割れないよ。");
            v = a / b;
            break;
          default:
            throw new Error("未知の演算子があるよ。");
        }
        st.push(v);
      }
    }

    if (st.length !== 1) throw new Error("式がうまく読めないよ（カッコや演算子を見直してね）。");
    return st[0];
  }

  function isDigit(c) {
    return c >= "0" && c <= "9";
  }

  function formatNumber(n) {
    const rounded = Math.abs(n) < 1e-9 ? 0 : n;
    return String(Math.round(rounded * 1e6) / 1e6);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function normalizePlayerName(raw) {
    const cleaned = String(raw ?? "")
      .replace(/[\r\n\t]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!cleaned) return "ななしの挑戦者";
    return Array.from(cleaned).slice(0, 24).join("");
  }

  function ellipsizeToWidth(ctx, text, maxWidth) {
    if (ctx.measureText(text).width <= maxWidth) return text;
    const chars = Array.from(text);
    let out = "";
    for (const ch of chars) {
      const next = out + ch;
      if (ctx.measureText(next + "…").width > maxWidth) break;
      out = next;
    }
    return out ? out + "…" : "…";
  }


  // ===== Certificate =====

  async function createCertificate(ch, playerNameRaw) {
    // X等でも見やすい横長
    const w = 1200;
    const h = 630;

    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;

    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas not supported");

    // Pull theme accent colors from CSS variables
    const rs = getComputedStyle(document.documentElement);
    const accent = rs.getPropertyValue("--accent").trim() || "#515a9f";
    const accent2 = rs.getPropertyValue("--accent2").trim() || "#cc9b11";

    // Base gradient
    const g = ctx.createLinearGradient(0, 0, w, h);
    g.addColorStop(0, accent);
    g.addColorStop(1, accent2);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);

    // Dark overlay for readability
    ctx.fillStyle = "rgba(10,18,34,0.72)";
    ctx.fillRect(0, 0, w, h);

    // Optional bg image (if exists)
    try {
      const bg = await loadImage("/assets/img/quokka/hpbg.png");
      drawCover(ctx, bg, 0, 0, w, h, 0.18);
    } catch (e) {
      // ignore
    }

    // Panel
    const pad = 54;
    roundRect(ctx, pad, pad, w - pad * 2, h - pad * 2, 28);
    ctx.fillStyle = "rgba(255,255,255,0.10)";
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 2;
    ctx.stroke();


    // Header
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    ctx.font = "600 22px system-ui, -apple-system, 'Noto Sans JP', sans-serif";
    const headline = ch.certificate?.headline || "おまもりクオッカ 認定証";
    ctx.fillText(headline, pad + 36, pad + 66);

    // Big title
    ctx.fillStyle = "rgba(255,255,255,0.96)";
    ctx.font = "800 56px system-ui, -apple-system, 'Noto Sans JP', sans-serif";
    ctx.fillText("CLEAR!", pad + 36, pad + 140);

    // Lines
    const lines =
      ch.certificate?.lines || ["クオッカからの挑戦状", `「${ch.title}」クリア！`];

    ctx.fillStyle = "rgba(255,255,255,0.92)";
    ctx.font = "700 34px system-ui, -apple-system, 'Noto Sans JP', sans-serif";
    ctx.fillText(lines[0] || "", pad + 36, pad + 210);
    ctx.fillText(lines[1] || "", pad + 36, pad + 256);

    // No-answer note
    ctx.fillStyle = "rgba(255,255,255,0.74)";
    ctx.font = "500 22px system-ui, -apple-system, 'Noto Sans JP', sans-serif";
    ctx.fillText("テンパズル：4,7,3,8で10をつくれ！", pad + 36, pad + 318);

    const playerName = normalizePlayerName(playerNameRaw);

    ctx.fillStyle = "rgba(255,255,255,0.90)";
    ctx.font = "700 26px system-ui, -apple-system, 'Noto Sans JP', sans-serif";

    // 右下の #おまもりクオッカ と被らないように幅を制限
    const nameMaxWidth = w - (pad + 36) - (pad + 260);
    const nameLine = `${playerName}`;

    ctx.fillText(
      ellipsizeToWidth(ctx, nameLine, nameMaxWidth),
      pad + 36,
      h - pad - 92
    );

    // Date
    const dateStr = new Date().toLocaleDateString("ja-JP", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    ctx.fillStyle = "rgba(255,255,255,0.70)";
    ctx.font = "500 20px system-ui, -apple-system, 'Noto Sans JP', sans-serif";
    ctx.fillText(`${dateStr}`, pad + 36, h - pad - 54);


    // ===== Right area: logo at top-right / character+tag at bottom-right =====
    const rightPad = 36;                // パネル右端からの余白
    const topPad = 48;                  // パネル上端からの余白
    const bottomPad = 44;               // パネル下端からの余白

    const rightX = w - pad - rightPad;  // パネル内の「右端X」

    // 1) Logo (top-right)
    try {
      const logoSrc = new URL(CERT_LOGO_SRC, document.baseURI).toString();
      const logo = await loadImage(logoSrc);

      const logoH = 38; // 40でもOK
      const logoW = Math.round((logo.width / logo.height) * logoH);

      const x = rightX - logoW;
      const y = pad + topPad;

      ctx.save();
      ctx.globalAlpha = 0.92;
      drawContain(ctx, logo, x, y, logoW, logoH);
      ctx.restore();
    } catch (e) {
      console.warn("logo draw skipped:", e);
    }

    // 2) Character + Tag (bottom-right)
    const illustW = 300;
    const illustH = 300;

    const tagText = "#おまもりクオッカ";
    const tagFont =
      "600 22px ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

    ctx.save();
    ctx.font = tagFont;
    const tagW = ctx.measureText(tagText).width;
    ctx.restore();

    // 右下ブロックの配置（右寄せ）
    const tagY = h - pad - bottomPad;       // タグのベースライン
    const illustY = tagY - 12 - illustH;    // タグのちょい上にキャラ
    const illustX = rightX - illustW + 48;       // キャラは右寄せ
    const tagX = rightX;                    // タグも右寄せ

    try {
      const giver = await loadImage(stampPath(ch.giverStamp ?? 2));
      drawContain(ctx, giver, illustX, illustY, illustW, illustH);
    } catch (e) {
      console.warn("giver draw skipped:", e);
    }

    // Tag (bottom-right, right-aligned)
    ctx.save();
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    ctx.font = tagFont;
    ctx.textAlign = "right";
    ctx.textBaseline = "alphabetic";
    ctx.fillText(tagText, tagX, tagY);
    ctx.restore();



    const blob = await new Promise((resolve, reject) => {
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob failed"))), "image/png");
    });

    return { blob, url: URL.createObjectURL(blob) };
  }

  function roundRect(ctx, x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function drawCover(ctx, img, x, y, w, h, alpha = 1) {
    const iw = img.width;
    const ih = img.height;
    const scale = Math.max(w / iw, h / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const nx = x + (w - nw) / 2;
    const ny = y + (h - nh) / 2;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(img, nx, ny, nw, nh);
    ctx.restore();
  }

  function drawContain(ctx, img, x, y, w, h) {
    const iw = img.width;
    const ih = img.height;
    const scale = Math.min(w / iw, h / ih);
    const nw = iw * scale;
    const nh = ih * scale;
    const nx = x + (w - nw) / 2;
    const ny = y + (h - nh) / 2;
    ctx.drawImage(img, nx, ny, nw, nh);
  }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error(`Image load failed: ${src} (base: ${document.baseURI})`));
      img.src = src;
    });
  }


  // ===== Share / Download =====

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  async function shareCertificate(blob, text) {
    const file = new File([blob], "omamori-quokka.png", { type: "image/png" });

    if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          text,
          title: "おまもりクオッカ 認定証",
        });
        return;
      } catch (e) {
        // user cancel etc.
        return;
      }
    }

    // fallback: save + open tweet compose (image attach is manual)
    downloadBlob(blob, "omamori-quokka.png");
    window.open(buildTweetIntentUrl(text), "_blank", "noopener");
  }

  function buildTweetIntentUrl(text) {
    return "https://twitter.com/intent/tweet?text=" + encodeURIComponent(text);
  }
})();
