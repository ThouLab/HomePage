// 過去の活動の様子：写真をクリックすると拡大表示する（右上の × / 背景クリック / Esc で閉じる）
(() => {
  const links = document.querySelectorAll(".photo-grid a");
  if (!links.length || typeof HTMLDialogElement === "undefined") return; // 非対応ブラウザは画像ファイルを直接開く

  const dialog = document.createElement("dialog");
  dialog.className = "lightbox";
  dialog.setAttribute("aria-label", "写真の拡大表示");
  dialog.innerHTML = '<button type="button" class="lightbox-close" aria-label="閉じる">×</button><img alt="" />';
  document.body.appendChild(dialog);
  const image = dialog.querySelector("img");
  const close = () => dialog.close();

  links.forEach(link => {
    link.addEventListener("click", event => {
      event.preventDefault();
      const thumb = link.querySelector("img");
      image.src = link.getAttribute("href");
      image.alt = thumb ? thumb.alt : "";
      dialog.showModal();
      document.documentElement.classList.add("lightbox-open");
    });
  });

  dialog.querySelector(".lightbox-close").addEventListener("click", close);
  dialog.addEventListener("click", event => { if (event.target === dialog) close(); });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("lightbox-open");
    image.removeAttribute("src");
  });
})();
