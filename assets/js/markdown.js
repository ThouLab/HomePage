/* Minimal Markdown -> HTML converter (safe-ish for local content)
   Supports:
   - # / ## / ### headings
   - paragraphs
   - unordered/ordered lists
   - blockquotes
   - code fences ```
   - inline: **bold**, *italic*, `code`, [text](url)
*/

(function(global){
  function escapeHtml(s){
    return (s || '')
      .replace(/&/g,'&amp;')
      .replace(/</g,'&lt;')
      .replace(/>/g,'&gt;');
  }

  function inline(s){
    let text = escapeHtml(s);

    // code spans (protect from other formatting)
    const code = [];
    text = text.replace(/`([^`]+)`/g, (_, p1) => {
      code.push(p1);
      return `@@CODE${code.length-1}@@`;
    });

    // links
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_, t, u) => {
      const safeUrl = (u || '').replace(/"/g, '%22');
      return `<a href="${safeUrl}" target="_blank" rel="noopener noreferrer">${t}</a>`;
    });

    // bold and italic
    text = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    text = text.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // restore code spans
    text = text.replace(/@@CODE(\d+)@@/g, (_, idx) => `<code>${code[Number(idx)]}</code>`);

    return text;
  }

  function mdToHtml(md){
    const lines = (md || '').replace(/\r\n/g,'\n').split('\n');
    let out = [];
    let i = 0;

    function flushParagraph(buf){
      const text = buf.join(' ').trim();
      if (text) out.push(`<p>${inline(text)}</p>`);
      buf.length = 0;
    }

    while (i < lines.length){
      const line = lines[i];

      // Code fences
      const fence = line.match(/^```(\w+)?\s*$/);
      if (fence){
        const lang = fence[1] || '';
        i++;
        const codeLines = [];
        while (i < lines.length && !lines[i].match(/^```\s*$/)){
          codeLines.push(lines[i]);
          i++;
        }
        // skip closing fence
        if (i < lines.length) i++;
        out.push(`<pre><code class="lang-${escapeHtml(lang)}">${escapeHtml(codeLines.join('\n'))}</code></pre>`);
        continue;
      }

      // Headings
      const h = line.match(/^(#{1,3})\s+(.*)$/);
      if (h){
        const level = Math.min(3, h[1].length);
        out.push(`<h${level}>${inline(h[2].trim())}</h${level}>`);
        i++;
        continue;
      }

      // Blockquote (single or multi-line)
      if (line.match(/^\s*>\s?/)){
        const q = [];
        while (i < lines.length && lines[i].match(/^\s*>\s?/)){
          q.push(lines[i].replace(/^\s*>\s?/, ''));
          i++;
        }
        out.push(`<blockquote>${q.map(t => `<p>${inline(t.trim())}</p>`).join('')}</blockquote>`);
        continue;
      }

      // Lists
      const ul = line.match(/^\s*[-*]\s+(.*)$/);
      const ol = line.match(/^\s*\d+\.\s+(.*)$/);

      if (ul){
        const items = [];
        while (i < lines.length){
          const m = lines[i].match(/^\s*[-*]\s+(.*)$/);
          if (!m) break;
          items.push(`<li>${inline(m[1].trim())}</li>`);
          i++;
        }
        out.push(`<ul>${items.join('')}</ul>`);
        continue;
      }
      if (ol){
        const items = [];
        while (i < lines.length){
          const m = lines[i].match(/^\s*\d+\.\s+(.*)$/);
          if (!m) break;
          items.push(`<li>${inline(m[1].trim())}</li>`);
          i++;
        }
        out.push(`<ol>${items.join('')}</ol>`);
        continue;
      }

      // Blank line => paragraph break
      if (line.trim() === ''){
        i++;
        continue;
      }

      // Paragraph: gather until blank line or block element
      const buf = [];
      while (i < lines.length){
        const l = lines[i];
        if (l.trim() === '') break;
        if (l.match(/^```/)) break;
        if (l.match(/^(#{1,3})\s+/)) break;
        if (l.match(/^\s*>\s?/)) break;
        if (l.match(/^\s*[-*]\s+/)) break;
        if (l.match(/^\s*\d+\.\s+/)) break;
        buf.push(l.trim());
        i++;
      }
      flushParagraph(buf);
    }

    return out.join('\n');
  }

  global.ThouMarkdown = { mdToHtml };
})(window);
