/** Confettis canvas légers (sans dépendance). Client uniquement. */
export function fireConfetti() {
  if (typeof window === "undefined") return;
  const canvas = document.createElement("canvas");
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9999";
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext("2d");
  if (!ctx) { canvas.remove(); return; }

  const colors = ["#4C3AE3", "#0E9E82", "#E5484D", "#E8912D", "#8b7dff", "#f4b45f"];
  const N = 150;
  const parts = Array.from({ length: N }, () => ({
    x: window.innerWidth / 2 + (Math.random() - 0.5) * 120,
    y: window.innerHeight / 3,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -14 - 4,
    size: Math.random() * 8 + 4,
    color: colors[Math.floor(Math.random() * colors.length)],
    rot: Math.random() * 6,
    vr: (Math.random() - 0.5) * 0.4,
  }));

  const start = performance.now();
  let raf = 0;
  function frame(t: number) {
    const elapsed = t - start;
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vy += 0.32;
      p.vx *= 0.99;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.globalAlpha = Math.max(0, 1 - elapsed / 2600);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    }
    if (elapsed < 2700) {
      raf = requestAnimationFrame(frame);
    } else {
      cancelAnimationFrame(raf);
      canvas.remove();
    }
  }
  raf = requestAnimationFrame(frame);
}
