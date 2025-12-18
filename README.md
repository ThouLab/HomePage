# ThouLab Website (GitHub Pages)

落ち着きのあるモダンなデザイン（モバイル/PC対応）＋  
「DeepMindっぽい動き（控えめ）」を、**静的サイト**で実現するテンプレートです。

- ✅ GitHub Pages でそのまま公開可能（ビルド不要）
- ✅ コンテンツは `content/` に集約（拡張しやすい）
- ✅ `prefers-reduced-motion` 対応（動きを減らす設定に追従）
- ✅ ヘッダー/フッターは `partials/` で共通化（JSで挿入）

---

## ディレクトリ構造

```
/
├─ index.html
├─ philosophy/
│  └─ index.html
├─ columns/
│  ├─ index.html
│  └─ post.html              # ?slug=... で記事を表示
├─ members/
│  └─ index.html
├─ products/
│  └─ index.html
├─ contact/
│  └─ index.html
├─ partials/
│  ├─ header.html
│  └─ footer.html
├─ assets/
│  ├─ css/main.css
│  ├─ js/
│  │  ├─ main.js             # テーマ/ナビ/スクロール演出
│  │  ├─ motion.js           # Canvas背景（Heroのみ）
│  │  ├─ content.js          # JSON/Markdown の読み込み
│  │  └─ markdown.js         # 最小Markdownパーサ
│  └─ img/logo.svg
└─ content/
   ├─ members.json
   ├─ products.json
   └─ columns/
      ├─ index.json
      ├─ welcome.md
      ├─ workshop-notes-01.md
      └─ notes-about-motion.md
```

---

## GitHub Pages で公開する

1. このフォルダを GitHub リポジトリに push
2. GitHub の **Settings → Pages**
3. **Build and deployment**
   - Source: **Deploy from a branch**
   - Branch: `main` / `(root)` を選択
4. 数十秒後に URL が発行されます

---

## ローカルで確認する（重要）

`fetch()` を使って `content/*.json` を読み込むため、  
Finder などで `index.html` を **file:// で直接開くと** うまく表示されないことがあります。

以下で簡易サーバを立てて確認してください。

```bash
cd thoulab-site
python -m http.server 8000
# http://localhost:8000 を開く
```

---

## カスタマイズポイント（最初にやる）

### 1) お問い合わせメールアドレス
`contact/index.html` 内の `contact@thoulab.example` を実際のアドレスに置換してください。

### 2) SNSリンク
`partials/footer.html` のリンクを置換してください。

---

## コラムを追加する

1. `content/columns/<slug>.md` を追加
2. `content/columns/index.json` の `posts` に追加

例:

```json
{
  "slug": "my-new-post",
  "title": "新しい記事",
  "date": "2025-12-31",
  "summary": "短い要約",
  "tags": ["タグ1", "タグ2"]
}
```

---

## プロダクトを追加する

`content/products.json` の `products` に追加してください。  
`category` を増やすと自動でセクションも増えます。

---

## 「base」について（Project Pages 対応）

このテンプレートは `<base href="...">` を自動設定します。

- `username.github.io`（ユーザーサイト）→ `/`
- `username.github.io/repo/`（プロジェクトサイト）→ `/repo/` を自動推定

**もし custom domain でサブパス配下に置く場合**は、各ページ `<head>` の

```html
<meta name="site-base" content="">
```

に `/subpath/` を設定してください。

---

## ライセンス

自由に改変して使ってください（必要に応じて追記してください）。
