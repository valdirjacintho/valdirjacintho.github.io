/* SEEAI EXPLORE — Hero animado do login (candidata MLW-20261112)
   Logo em movimento 3D: o olho/alvo central com pupila vermelha, os 8 nós do logo
   orbitando em anel inclinado e uma esfera de rede girando ao fundo.
   Canvas 2D puro (sem three.js), sem rede, sem dados. Pausa quando a aba fica oculta
   Anima sempre (logo da marca), mesmo com "reduzir movimento" ligado no SO. */
(() => {
  const host = document.querySelector('[data-auth-hero]');
  if (!host) return;
  const canvas = host.querySelector('canvas');
  // Logo da marca: anima sempre (não é suprimido pelo "reduzir movimento" do SO).
  if (!canvas || !canvas.getContext) return;
  const ctx = canvas.getContext('2d');
  const BLUE = [47, 155, 255], BLUE2 = [88, 180, 255], RED = [255, 48, 71];
  const rgba = (c, a) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

  // Esfera de rede (Fibonacci) — determinística, sem aleatoriedade entre recargas.
  const N = 150, sphere = [];
  for (let i = 0; i < N; i++) {
    const y = 1 - (i / (N - 1)) * 2, r = Math.sqrt(1 - y * y), t = i * 2.399963;
    sphere.push({ x: Math.cos(t) * r, y, z: Math.sin(t) * r, red: i % 23 === 7 });
  }
  const edges = [];
  for (let i = 0; i < N; i++) for (let j = i + 1; j < N; j++) {
    const a = sphere[i], b = sphere[j];
    const d = (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;
    if (d < 0.075) edges.push([i, j]);
  }
  // 8 nós do logo: 6 azuis e 2 vermelhos (como no símbolo), em anel.
  const sats = [0, 1, 2, 3, 4, 5, 6, 7].map((k) => ({ a: (k / 8) * Math.PI * 2 - Math.PI / 2, red: k === 4 || k === 5 }));

  let w = 0, h = 0, dpr = 1, running = true, t0 = performance.now();
  const resize = () => {
    const box = canvas.getBoundingClientRect(); // tamanho vem do CSS (inset -14%)
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = box.width; h = box.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };
  const rot = (p, ay, ax) => {
    const cy = Math.cos(ay), sy = Math.sin(ay), cx = Math.cos(ax), sx = Math.sin(ax);
    const x = p.x * cy + p.z * sy, z = -p.x * sy + p.z * cy;
    const y = p.y * cx - z * sx, z2 = p.y * sx + z * cx;
    return { x, y, z: z2 };
  };
  const proj = (p, R, cx, cy) => { const s = 2.6 / (2.6 - p.z); return { x: cx + p.x * R * s, y: cy + p.y * R * s, s, z: p.z }; };

  function frame(now) {
    if (!running) return;
    const t = (now - t0) / 1000;
    ctx.clearRect(0, 0, w, h);
    const cx = w / 2, cy = h / 2, R = Math.min(w, h) * 0.42;

    // 1) esfera de rede girando ao fundo
    const ay = t * 0.12, ax = 0.42 + Math.sin(t * 0.07) * 0.08;
    const P = sphere.map((p) => proj(rot(p, ay, ax), R, cx, cy));
    ctx.lineWidth = 0.7;
    for (const [i, j] of edges) {
      const a = P[i], b = P[j], depth = (a.z + b.z) / 2;
      ctx.strokeStyle = rgba(BLUE, 0.05 + (depth + 1) * 0.07);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }
    P.forEach((p, i) => {
      const al = 0.18 + (p.z + 1) * 0.3, red = sphere[i].red;
      ctx.fillStyle = rgba(red ? RED : BLUE2, red ? al + 0.2 : al);
      ctx.beginPath(); ctx.arc(p.x, p.y, (red ? 2.1 : 1.4) * p.s, 0, Math.PI * 2); ctx.fill();
    });

    // 2) anel do logo em 3D: 8 nós orbitando o olho, com profundidade
    // Anel de frente, como no logo: gira no próprio plano, com leve balanço 3D.
    const ringR = R * 0.58, spin = t * 0.32;
    const wobY = Math.sin(t * 0.5) * 0.22, wobX = Math.cos(t * 0.37) * 0.14;
    const S = sats.map((s) => {
      const a = s.a + spin;
      const q = rot({ x: Math.cos(a), y: Math.sin(a), z: 0 }, wobY, wobX);
      return { ...proj(q, ringR, cx, cy), red: s.red };
    });
    const drawSat = (s) => {
      const r = ringR * 0.2 * s.s, c = s.red ? RED : BLUE, al = 0.78 + s.z * 0.2;
      ctx.strokeStyle = rgba(c, 0.22 + (s.z + 1) * 0.15); ctx.lineWidth = 2 * s.s;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(s.x, s.y); ctx.stroke();
      const g = ctx.createRadialGradient(s.x, s.y, 0, s.x, s.y, r * 2.2);
      g.addColorStop(0, rgba(c, 0.35 * al)); g.addColorStop(1, rgba(c, 0));
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(s.x, s.y, r * 2.2, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba(c, al); ctx.beginPath(); ctx.arc(s.x, s.y, r, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba([255, 255, 255], 0.10 * al); ctx.beginPath(); ctx.arc(s.x, s.y, r * 0.55, 0, Math.PI * 2); ctx.fill();
    };
    S.filter((s) => s.z < 0).forEach(drawSat);           // atrás do olho

    // 3) olho / alvo central com pupila vermelha pulsando
    const eyeR = ringR * 0.5, pulse = 1 + Math.sin(t * 2.2) * 0.05;
    ctx.fillStyle = '#0a1426'; ctx.beginPath(); ctx.arc(cx, cy, eyeR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = rgba(BLUE, 0.95); ctx.lineWidth = Math.max(2, eyeR * 0.09);
    ctx.beginPath(); ctx.arc(cx, cy, eyeR, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = rgba(BLUE, 0.45); ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(cx, cy, eyeR * 0.72, 0, Math.PI * 2); ctx.stroke();
    // retícula de mira girando em sentido contrário
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(-t * 0.3);
    ctx.strokeStyle = rgba(RED, 0.55); ctx.lineWidth = 1.2;
    for (let k = 0; k < 4; k++) { ctx.rotate(Math.PI / 2); ctx.beginPath(); ctx.moveTo(eyeR * 1.12, 0); ctx.lineTo(eyeR * 1.32, 0); ctx.stroke(); }
    ctx.restore();
    const pr = eyeR * 0.36 * pulse;
    const pg = ctx.createRadialGradient(cx, cy, 0, cx, cy, pr * 3);
    pg.addColorStop(0, rgba(RED, 0.45)); pg.addColorStop(1, rgba(RED, 0));
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(cx, cy, pr * 3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = rgba(RED, 1); ctx.beginPath(); ctx.arc(cx, cy, pr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.beginPath(); ctx.arc(cx + pr * 0.38, cy - pr * 0.38, pr * 0.24, 0, Math.PI * 2); ctx.fill();

    S.filter((s) => s.z >= 0).forEach(drawSat);          // à frente do olho
    requestAnimationFrame(frame);
  }

  host.classList.add('is-animated');
  resize();
  window.addEventListener('resize', resize, { passive: true });
  document.addEventListener('visibilitychange', () => {
    const hidden = document.hidden;
    if (hidden) running = false;
    else if (!running) { running = true; requestAnimationFrame(frame); }
  });
  requestAnimationFrame(frame);
})();
