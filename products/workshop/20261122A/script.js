(() => {
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

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
      { threshold: 0.4 }
    );
    observer.observe(heroVideo);
  }
})();
