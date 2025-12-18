/* Subtle motion background (DeepMind-ish, but calm)
   - Canvas particle network in the hero only
   - Respects prefers-reduced-motion
*/
(function(){
  const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce) return;

  const canvas = document.getElementById('hero-canvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  let w = 0, h = 0, dpr = 1;
  let points = [];
  let raf = null;
  const mouse = { x: null, y: null, active: false };

  function resize(){
    dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = canvas.getBoundingClientRect();
    w = Math.floor(rect.width);
    h = Math.floor(rect.height);

    canvas.width = Math.floor(w * dpr);
    canvas.height = Math.floor(h * dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);

    // Re-seed points on large layout changes (keeps density stable)
    const count = Math.max(24, Math.min(56, Math.floor((w * h) / 24000)));
    points = Array.from({length: count}, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - .5) * 0.45,
      vy: (Math.random() - .5) * 0.45,
      r: 1.2 + Math.random() * 1.4
    }));
  }

  function step(){
    raf = requestAnimationFrame(step);
    if (document.hidden) return;

    ctx.clearRect(0,0,w,h);

    // Soft vignette (helps contrast without being heavy)
    const grad = ctx.createRadialGradient(w*0.5, h*0.25, 80, w*0.5, h*0.25, Math.max(w,h));
    grad.addColorStop(0, 'rgba(124,92,255,0.12)');
    grad.addColorStop(0.45, 'rgba(0,211,167,0.05)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0,0,w,h);

    // Update and draw points
    for (const p of points){
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < -20) p.x = w + 20;
      if (p.x > w + 20) p.x = -20;
      if (p.y < -20) p.y = h + 20;
      if (p.y > h + 20) p.y = -20;

      // Gentle mouse gravity
      if (mouse.active){
        const dx = mouse.x - p.x;
        const dy = mouse.y - p.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 180){
          const f = (1 - dist / 180) * 0.015;
          p.vx += dx * f * 0.002;
          p.vy += dy * f * 0.002;
        }
      }

      // Damp velocities to keep it calm
      p.vx *= 0.995;
      p.vy *= 0.995;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = 'rgba(255,255,255,0.55)';
      ctx.fill();
    }

    // Links
    const maxDist = Math.min(180, 120 + (w / 12));
    for (let i=0; i<points.length; i++){
      for (let j=i+1; j<points.length; j++){
        const a = points[i], b = points[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < maxDist){
          const alpha = (1 - dist / maxDist) * 0.22;
          ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }
  }

  function onMove(e){
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    mouse.active = true;
  }
  function onLeave(){
    mouse.active = false;
  }

  // Init
  resize();
  step();

  window.addEventListener('resize', () => {
    resize();
  }, {passive:true});

  canvas.addEventListener('mousemove', onMove, {passive:true});
  canvas.addEventListener('mouseleave', onLeave, {passive:true});
})();
