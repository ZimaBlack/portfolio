// Morfogénesis (patrones de Turing): cuando el cursor se queda quieto sobre el fondo negro, desde ese punto crece un patrón de
// reacción-difusión (Gray-Scott): dos sustancias que se alimentan y se inhiben producen manchas, corales y laberintos que se
// expanden como un tejido vivo. Se dibuja en grises, con ruido y desenfoque. Al mover el cursor, el patrón se disuelve.

const CELL = 5;              // px de pantalla por celda de la simulación
const IDLE_MS = 450;         // quieto este tiempo → empieza
const STEPS_PER_FRAME = 20;  // pasos de simulación por cuadro
const RADIUS = 320;          // hasta dónde puede crecer (px)
const GROW_MS = 2400;        // tiempo característico de expansión
const HOLD_MS = 13000;       // el patrón se mantiene así de tiempo
const FADE_MS = 3200;        // y se disuelve en este tiempo
const DISTURB_FADE_MS = 900; // al mover el cursor se disuelve más rápido

// Parámetros de Gray-Scott: laberinto de franjas que se ramifican (patrón de Turing tipo piel de cebra / coral cerebro)
const DU = 1, DV = 0.5, FEED = 0.035, KILL = 0.063;

const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

export function initTuringDiffusion(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext('2d');
  if (!ctx || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  let w = 0, h = 0, gw = 0, gh = 0, dpr = 1;
  let U = new Float32Array(0), V = new Float32Array(0), U2 = new Float32Array(0), V2 = new Float32Array(0);
  let img: ImageData, buf: HTMLCanvasElement, bctx: CanvasRenderingContext2D;
  let origin = { x: 0, y: 0 };
  let rgNow = 9; // radio visible actual (en celdas)
  let raf = 0, startedAt = 0, disturbedAt = 0, idleTimer = 0, inside = false, pointer = { x: 0, y: 0 };

  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gw = Math.ceil(w / CELL); gh = Math.ceil(h / CELL);
    const n = gw * gh;
    U = new Float32Array(n); V = new Float32Array(n); U2 = new Float32Array(n); V2 = new Float32Array(n);
    buf = document.createElement('canvas'); buf.width = gw; buf.height = gh;
    bctx = buf.getContext('2d')!; img = bctx.createImageData(gw, gh);
  };
  new ResizeObserver(() => { cancelAnimationFrame(raf); raf = 0; resize(); }).observe(canvas);
  resize();

  const clear = () => { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); };

  const start = () => {
    U.fill(1); V.fill(0);
    origin = { x: pointer.x / CELL, y: pointer.y / CELL };
    // Semilla: un pequeño disco irregular de la sustancia V
    for (let y = -5; y <= 5; y++) for (let x = -5; x <= 5; x++) {
      if (x * x + y * y > 18 + Math.random() * 8) continue;
      const i = Math.round(origin.y + y) * gw + Math.round(origin.x + x);
      if (i >= 0 && i < U.length) { U[i] = 0.5; V[i] = 0.25 + Math.random() * 0.1; }
    }
    startedAt = performance.now(); disturbedAt = 0;
    raf = requestAnimationFrame(loop);
  };

  /** Un paso de Gray-Scott (laplaciano de 3×3 ponderado). El patrón crece libremente; el radio sólo decide qué parte se ve. */
  const step = (nucleate: number) => {
    for (let y = 1; y < gh - 1; y++) {
      const row = y * gw;
      for (let x = 1; x < gw - 1; x++) {
        const i = row + x;
        const u = U[i], v = V[i];
        const lu = 0.2 * (U[i - 1] + U[i + 1] + U[i - gw] + U[i + gw]) + 0.05 * (U[i - gw - 1] + U[i - gw + 1] + U[i + gw - 1] + U[i + gw + 1]) - u;
        const lv = 0.2 * (V[i - 1] + V[i + 1] + V[i - gw] + V[i + gw]) + 0.05 * (V[i - gw - 1] + V[i - gw + 1] + V[i + gw - 1] + V[i + gw + 1]) - v;
        const uvv = u * v * v;
        const jitter = (Math.random() - 0.5) * 0.012; // ruido: rompe la simetría circular y da ramificaciones irregulares
        U2[i] = u + DU * lu - uvv + FEED * (1 - u);
        V2[i] = v + DV * lv + uvv - (FEED + KILL) * v + (v > 0.002 ? jitter * v * 6 : 0) + (Math.random() < nucleate && Math.hypot(x - origin.x, y - origin.y) < rgNow ? 0.22 : 0); // núcleos al azar al principio: rompen la simetría
      }
    }
    [U, U2] = [U2, U]; [V, V2] = [V2, V];
  };

  const render = (alpha: number, rg: number) => {
    const d = img.data;
    for (let i = 0, p = 0; i < V.length; i++, p += 4) {
      const v = V[i];
      // El patrón se ve dentro de un radio que se expande, con un borde que se desvanece (sin anillo duro)
      const dist = Math.hypot((i % gw) - origin.x, Math.floor(i / gw) - origin.y);
      const edge = 1 - smooth((dist - rg * 0.62) / (rg * 0.38));
      // Gris: más claro donde hay más sustancia; ruido por celda; transparente donde casi no hay nada (se ve el fondo negro)
      const a = smooth((v - 0.05) * 3.6) * alpha * edge;
      const g = 70 + v * 520 + (Math.random() - 0.5) * 46;
      d[p] = d[p + 1] = d[p + 2] = g > 235 ? 235 : g < 0 ? 0 : g;
      d[p + 3] = a * 255;
    }
    bctx.putImageData(img, 0, 0);
    clear();
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
  };

  const loop = (now: number) => {
    const age = Math.max(0, now - startedAt);
    const rg = 9 + (RADIUS / CELL - 9) * (1 - Math.exp(-age / GROW_MS)); // arranca justo por fuera de la semilla y se expande
    const nucleate = age < 3200 ? 0.0009 : 0; // sólo durante los primeros segundos
    rgNow = rg;
    for (let s = 0; s < STEPS_PER_FRAME; s++) step(s === 0 ? nucleate : 0);
    let alpha = age > HOLD_MS ? Math.max(0, 1 - (age - HOLD_MS) / FADE_MS) : 1;
    if (disturbedAt) alpha = Math.min(alpha, Math.max(0, 1 - (now - disturbedAt) / DISTURB_FADE_MS));
    render(alpha, rg);
    if (alpha <= 0) { clear(); raf = 0; if (inside) armIdle(); return; }
    raf = requestAnimationFrame(loop);
  };

  const armIdle = () => { clearTimeout(idleTimer); idleTimer = window.setTimeout(() => { if (inside && !raf) start(); }, IDLE_MS); };
  const disturb = () => { if (raf && !disturbedAt) disturbedAt = performance.now(); };

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = e.clientX - r.left, ny = e.clientY - r.top;
    const moved = Math.hypot(nx - pointer.x, ny - pointer.y) > 6;
    pointer = { x: nx, y: ny }; inside = true;
    if (moved) { disturb(); armIdle(); }
  });
  canvas.addEventListener('pointerleave', () => { inside = false; clearTimeout(idleTimer); disturb(); });
  canvas.addEventListener('pointerdown', (e) => { const r = canvas.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; inside = true; disturb(); armIdle(); });
}
