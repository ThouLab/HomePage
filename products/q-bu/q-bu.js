(() => {
  function setupLightbox() {
    const gallery = document.querySelector('[data-qbu-gallery]');
    if (!gallery) return;

    const dialog = document.getElementById('qbu-lightbox');
    const img = document.getElementById('qbu-lightbox-img');
    const cap = document.getElementById('qbu-lightbox-caption');

    // dialog 非対応ブラウザ向けフォールバック
    const canDialog = !!(dialog && typeof dialog.showModal === 'function');

    gallery.addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-full]');
      if (!btn) return;

      const full = btn.getAttribute('data-full');
      const caption = (btn.querySelector('.qbu-cap')?.textContent || '').trim();
      const alt = btn.querySelector('img')?.getAttribute('alt') || '拡大画像';

      if (!full) return;

      if (!canDialog) {
        window.open(full, '_blank', 'noopener');
        return;
      }

      img.src = full;
      img.alt = alt;
      cap.textContent = caption;
      dialog.showModal();
    });

    // ESCで閉じるのはdialog標準。画像クリックでも閉じたい場合はここで
    dialog?.addEventListener('click', (e) => {
      // 背景クリックで閉じる
      if (e.target === dialog) dialog.close();
    });
  }

  window.addEventListener('DOMContentLoaded', () => {
    setupLightbox();
  });
})();
