// Difusión de pistas ("ruteo" de circuito impreso): cuando el cursor se queda quieto sobre el fondo negro, desde ese punto
// brotan trazos que avanzan sobre una grilla en tramos rectos y giros de 45°, se bifurcan, no se cruzan entre sí, y cada
// uno termina en un pad (círculo). Cuanto más lejos del origen, más probable que una pista se detenga (difusión limitada).
// Al mover el cursor, las pistas se apagan y se vuelve a empezar cuando se detiene.

const CELL = 14;            // distancia entre nodos de la grilla (px de CSS)
const IDLE_MS = 450;        // quieto este tiempo → empieza
const WALKERS = 5;          // pistas iniciales
const MAX_WALKERS = 28;     // tope de pistas activas (por las bifurcaciones)
const RADIUS = 340;         // alcance máximo (px)
const STEP_MS = 24;         // cada pista avanza una celda cada tanto
const HOLD_MS = 5200;       // las pistas se mantienen así de tiempo antes de apagarse
const FADE_MS = 2600;       // y se apagan en este tiempo
const DISTURB_FADE_MS = 700;// al mover el cursor se apagan más rápido

const DIRS: [number, number][] = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

interface Walker { x: number; y: number; dir: number; run: number; depth: number }
interface Seg { x1: number; y1: number; x2: number; y2: number; t: number; depth: number }
interface Pad { x: number; y: number; t: number }

export function initTraceDiffusion(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let w = 0, h = 0, dpr = 1;
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
  };
  new ResizeObserver(resize).observe(canvas);
  resize();

  let segs: Seg[] = [], pads: Pad[] = [], walkers: Walker[] = [];
  let occupied = new Set<string>();
  let origin = { x: 0, y: 0 };                // en celdas
  let raf = 0, last = 0, acc = 0, startedAt = 0, disturbedAt = 0;
  let idleTimer = 0, inside = false, pointer = { x: 0, y: 0 };

  const key = (x: number, y: number) => `${x},${y}`;
  const px = (c: number) => c * CELL;
  const reset = () => { segs = []; pads = []; walkers = []; occupied = new Set(); disturbedAt = 0; };

  const start = () => {
    reset();
    origin = { x: Math.round(pointer.x / CELL), y: Math.round(pointer.y / CELL) };
    occupied.add(key(origin.x, origin.y));
    const first = Math.floor(rand(0, 8));
    for (let i = 0; i < WALKERS; i++) walkers.push({ x: origin.x, y: origin.y, dir: (first + i * Math.round(8 / WALKERS) + 8) % 8, run: Math.floor(rand(2, 7)), depth: 0 });
    pads.push({ x: origin.x, y: origin.y, t: performance.now() });
    startedAt = performance.now();
    loop(performance.now());
  };

  /** Avanza una celda cada pista viva. */
  const step = (now: number) => {
    const next: Walker[] = [];
    for (const wk of walkers) {
      if (wk.run <= 0) {
        // Giro de 45° (o sigue recto) y nuevo tramo; a veces se bifurca
        wk.dir = (wk.dir + (Math.random() < 0.18 ? 0 : pick([-1, 1])) + 8) % 8;
        wk.run = Math.floor(rand(3, 10));
        if (walkers.length + next.length < MAX_WALKERS && Math.random() < 0.16) {
          next.push({ x: wk.x, y: wk.y, dir: (wk.dir + pick([-2, 2, -1, 1]) + 8) % 8, run: Math.floor(rand(2, 7)), depth: wk.depth + 1 });
        }
      }
      const dist = Math.hypot(wk.x - origin.x, wk.y - origin.y) * CELL;
      // Difusión limitada: cuanto más lejos, más probable que se detenga
      if (dist > RADIUS || Math.random() < Math.pow(dist / RADIUS, 3) * 0.05) { pads.push({ x: wk.x, y: wk.y, t: now }); continue; }
      let [dx, dy] = DIRS[wk.dir];
      let nx = wk.x + dx, ny = wk.y + dy;
      // Las pistas no se cruzan: si la celda está ocupada, prueba girar; si no puede, termina en un pad
      if (occupied.has(key(nx, ny))) {
        const alt = pick([-1, 1]);
        [dx, dy] = DIRS[(wk.dir + alt + 8) % 8]; nx = wk.x + dx; ny = wk.y + dy;
        if (occupied.has(key(nx, ny))) { pads.push({ x: wk.x, y: wk.y, t: now }); continue; }
        wk.dir = (wk.dir + alt + 8) % 8; wk.run = Math.floor(rand(2, 6));
      }
      occupied.add(key(nx, ny));
      segs.push({ x1: px(wk.x), y1: px(wk.y), x2: px(nx), y2: px(ny), t: now, depth: wk.depth });
      wk.x = nx; wk.y = ny; wk.run--;
      next.push(wk);
    }
    walkers = next;
  };

  const alphaAt = (born: number, now: number) => {
    let a = 1;
    const age = now - startedAt;
    if (age > HOLD_MS) a = Math.max(0, 1 - (age - HOLD_MS) / FADE_MS);
    if (disturbedAt) a = Math.min(a, Math.max(0, 1 - (now - disturbedAt) / DISTURB_FADE_MS));
    return a * Math.min(1, (now - born) / 160 + 0.2); // aparición breve
  };

  const draw = (now: number) => {
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    // Pistas: blanco cálido; más tenues cuanto más profundas en las bifurcaciones
    for (const s of segs) {
      const a = alphaAt(s.t, now);
      if (a <= 0.01) continue;
      ctx.strokeStyle = `rgba(236, 232, 214, ${(0.62 - Math.min(0.3, s.depth * 0.06)) * a})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(s.x1, s.y1); ctx.lineTo(s.x2, s.y2); ctx.stroke();
    }
    // Pads: anillo dorado al final de cada pista
    for (const p of pads) {
      const a = alphaAt(p.t, now);
      if (a <= 0.01) continue;
      ctx.strokeStyle = `rgba(207, 198, 92, ${0.85 * a})`;
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.arc(px(p.x), px(p.y), 3.2, 0, Math.PI * 2); ctx.stroke();
    }
    // Cabezas: un punto brillante en cada pista que sigue avanzando
    for (const wk of walkers) {
      const g = ctx.createRadialGradient(px(wk.x), px(wk.y), 0, px(wk.x), px(wk.y), 9);
      g.addColorStop(0, 'rgba(255, 250, 220, .95)'); g.addColorStop(1, 'rgba(255, 250, 220, 0)');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(px(wk.x), px(wk.y), 9, 0, Math.PI * 2); ctx.fill();
    }
  };

  const loop = (now: number) => {
    acc += now - (last || now); last = now;
    while (acc >= STEP_MS) { if (walkers.length) step(now); acc -= STEP_MS; }
    draw(now);
    const gone = disturbedAt ? now - disturbedAt > DISTURB_FADE_MS : now - startedAt > HOLD_MS + FADE_MS;
    if (gone) { reset(); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, w, h); raf = 0; last = 0; if (inside) armIdle(); return; }
    raf = requestAnimationFrame(loop);
  };

  const armIdle = () => { clearTimeout(idleTimer); idleTimer = window.setTimeout(() => { if (inside && !raf) start(); }, IDLE_MS); };

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = e.clientX - r.left, ny = e.clientY - r.top;
    const moved = Math.hypot(nx - pointer.x, ny - pointer.y) > 6;
    pointer = { x: nx, y: ny }; inside = true;
    if (moved) {
      if (raf && !disturbedAt) disturbedAt = performance.now(); // las pistas en curso se apagan rápido
      armIdle();
    }
  });
  canvas.addEventListener('pointerleave', () => { inside = false; clearTimeout(idleTimer); if (raf && !disturbedAt) disturbedAt = performance.now(); });
  canvas.addEventListener('pointerdown', (e) => { const r = canvas.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; inside = true; if (raf && !disturbedAt) disturbedAt = performance.now(); armIdle(); });
}
