(() => {
  const bookingOrigin = "https://atclerk-staging-booking.vercel.app";
  const bookingPath = "/w/w-229cc5f3a44d4f2aa077d2c0e682c137";
  const attributionKeys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"];

  // Forward marketing labels only. Do not carry arbitrary query data or click IDs.
  function campaignLabel(params, key, maximum) {
    const values = params.getAll(key);
    if (values.length !== 1) return null;
    const value = values[0];
    return value.length <= maximum && value.trim() === value && /^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(value) ? value : null;
  }

  function landingAttribution(search) {
    const values = new Map([["utm_source", "thoulab_lp"], ["utm_medium", "referral"]]);
    if (typeof search !== "string") return values;
    const cleared = new Map([["utm_source", ""], ["utm_medium", ""]]);
    if (search.length > 2048) return cleared;
    const params = new URLSearchParams(search);
    if (!params.has("utm_source") && !params.has("utm_medium")) return values;
    const source = campaignLabel(params, "utm_source", 64);
    const medium = campaignLabel(params, "utm_medium", 64);
    // Empty markers also clear stale attribution in a reused booking tab.
    if (!source || !medium) return cleared;
    values.set("utm_source", source.toLowerCase());
    values.set("utm_medium", medium.toLowerCase());
    for (const key of attributionKeys.slice(2)) {
      const value = campaignLabel(params, key, 100);
      if (value) values.set(key, value);
    }
    return values;
  }

  const attribution = landingAttribution(window.location.search);
  for (const link of document.querySelectorAll("a[data-apply-link]")) {
    try {
      const target = new URL(link.getAttribute("href"), "https://thoulab.jp/");
      if (target.origin !== bookingOrigin || target.pathname !== bookingPath) continue;
      for (const key of attributionKeys) target.searchParams.delete(key);
      for (const [key, value] of attribution) target.searchParams.set(key, value);
      link.setAttribute("href", target.href);
    } catch {
      // Keep the static, LP-tagged link if it cannot be parsed.
    }
  }

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
