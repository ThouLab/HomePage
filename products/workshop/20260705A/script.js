(() => {
  const body = document.body;
  const formUrl = body.dataset.formUrl || "https://forms.gle/XXXXXXXXXXXX";

  document.querySelectorAll("[data-apply-link]").forEach((link) => {
    link.href = formUrl;
    link.rel = "noopener";
  });

  const year = document.getElementById("year");
  if (year) {
    year.textContent = String(new Date().getFullYear());
  }

  document.querySelectorAll("a[href^='#']").forEach((anchor) => {
    anchor.addEventListener("click", (event) => {
      const targetId = anchor.getAttribute("href");
      if (!targetId || targetId === "#") return;

      const target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    });
  });

  // 動画制御
  const heroVideo = document.querySelector(".hero-video");

  if (heroVideo) {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          heroVideo.play().catch(() => {});
        } else {
          heroVideo.pause();
        }
      },
      {
        threshold: 0.4
      }
    );

    observer.observe(heroVideo);
  }
})();