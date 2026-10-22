// Morfogénesis (patrones de Turing): cuando el cursor se queda quieto sobre el fondo negro, desde ese punto crece un patrón de
// reacción-difusión (Gray-Scott): dos sustancias que se alimentan y se inhiben producen manchas, líneas, corales y laberintos que
// se expanden como un tejido vivo. Se dibuja en grises, con ruido y desenfoque. Al mover el cursor, el patrón se disuelve.
// `initTuringDiffusion` devuelve un controlador: sus `params` se pueden cambiar en vivo (panel de la página /lab/).

export interface TuringParams {
  feed: number;       // alimentación F de Gray-Scott
  kill: number;       // eliminación k
  dv: number;         // difusión de la 2.ª sustancia (la 1.ª es 1): más bajo = trazos más finos
  cell: number;       // px de pantalla por celda de la simulación (más chico = más detalle y más costo)
  steps: number;      // pasos de simulación por cuadro (velocidad de crecimiento)
  radius: number;     // hasta dónde se ve el patrón (px)
  grow: number;       // ms: tiempo característico de expansión del radio
  idle: number;       // ms quieto antes de empezar
  hold: number;       // ms que se mantiene antes de disolverse
  fade: number;       // ms que tarda en disolverse
  nuclei: number;    // núcleos al azar al comienzo (rompen la simetría): 0 = sólo la semilla
  jitter: number;     // ruido en la reacción (ramificaciones irregulares)
  threshold: number;  // desde qué cantidad de sustancia se ve algo
  gain: number;       // nitidez del borde (más alto = más contraste)
  pixelNoise: number; // ruido por celda en el gris (0–100)
  blur: number;       // desenfoque del patrón (px de CSS)
  grain: number;      // intensidad del grano de película por encima (0–1)
  pinned: boolean;    // mantener el patrón (no se disuelve)
}

export const DEFAULTS: TuringParams = {
  feed: 0.029, kill: 0.057, dv: 0.5, cell: 4, steps: 20, radius: 340, grow: 2400, idle: 450, hold: 13000, fade: 3200,
  nuclei: 0.0009, jitter: 0.012, threshold: 0.05, gain: 3.6, pixelNoise: 46, blur: 1.2, grain: 0.16, pinned: false,
};

/** Combinaciones de F y k que dan distintos "caracteres" (todas con Dv = 0,5). */
export const PRESETS: Record<string, Partial<TuringParams>> = {
  'Líneas': { feed: 0.029, kill: 0.057 },
  'Líneas finas': { feed: 0.0345, kill: 0.0618 },
  'Gusanos': { feed: 0.078, kill: 0.061 },
  'Coral': { feed: 0.0545, kill: 0.062 },
  'Manchas': { feed: 0.0367, kill: 0.0649 },
};

export interface TuringControls { params: TuringParams; restart: (x?: number, y?: number) => void; clear: () => void; resize: () => void; apply: () => void }

const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

export function initTuringDiffusion(canvas: HTMLCanvasElement, panel?: HTMLElement | null): TuringControls | null {
  const ctx = canvas.getContext('2d');
  if (!ctx || matchMedia('(prefers-reduced-motion: reduce)').matches) return null;
  const P: TuringParams = { ...DEFAULTS };

  let w = 0, h = 0, gw = 0, gh = 0, dpr = 1;
  let U = new Float32Array(0), V = new Float32Array(0), U2 = new Float32Array(0), V2 = new Float32Array(0);
  let img: ImageData, buf: HTMLCanvasElement, bctx: CanvasRenderingContext2D;
  let origin = { x: 0, y: 0 };
  let rgNow = 9; // radio visible actual (en celdas)
  let raf = 0, startedAt = 0, disturbedAt = 0, idleTimer = 0, inside = false, pointer = { x: 0, y: 0 };

  const apply = () => { canvas.style.filter = `blur(${P.blur}px) contrast(1.1)`; canvas.parentElement?.style.setProperty('--grain', String(P.grain)); };
  const resize = () => {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(2, devicePixelRatio || 1);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    gw = Math.ceil(w / P.cell); gh = Math.ceil(h / P.cell);
    const n = gw * gh;
    U = new Float32Array(n); V = new Float32Array(n); U2 = new Float32Array(n); V2 = new Float32Array(n);
    buf = document.createElement('canvas'); buf.width = gw; buf.height = gh;
    bctx = buf.getContext('2d')!; img = bctx.createImageData(gw, gh);
    cancelAnimationFrame(raf); raf = 0;
  };
  new ResizeObserver(resize).observe(canvas);
  resize(); apply();

  const clear = () => { cancelAnimationFrame(raf); raf = 0; ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); };

  const start = (x = pointer.x, y = pointer.y) => {
    U.fill(1); V.fill(0);
    pointer = { x, y };
    origin = { x: x / P.cell, y: y / P.cell };
    // Semilla: un pequeño disco irregular de la sustancia V
    for (let yy = -5; yy <= 5; yy++) for (let xx = -5; xx <= 5; xx++) {
      if (xx * xx + yy * yy > 18 + Math.random() * 8) continue;
      const i = Math.round(origin.y + yy) * gw + Math.round(origin.x + xx);
      if (i >= 0 && i < U.length) { U[i] = 0.5; V[i] = 0.25 + Math.random() * 0.1; }
    }
    startedAt = performance.now(); disturbedAt = 0;
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(loop);
  };

  /** Un paso de Gray-Scott (laplaciano de 3×3 ponderado). El patrón crece libremente; el radio sólo decide qué parte se ve. */
  const step = (nucleate: number) => {
    const { feed, kill, dv, jitter } = P;
    for (let y = 1; y < gh - 1; y++) {
      const row = y * gw;
      for (let x = 1; x < gw - 1; x++) {
        const i = row + x;
        const u = U[i], v = V[i];
        const lu = 0.2 * (U[i - 1] + U[i + 1] + U[i - gw] + U[i + gw]) + 0.05 * (U[i - gw - 1] + U[i - gw + 1] + U[i + gw - 1] + U[i + gw + 1]) - u;
        const lv = 0.2 * (V[i - 1] + V[i + 1] + V[i - gw] + V[i + gw]) + 0.05 * (V[i - gw - 1] + V[i - gw + 1] + V[i + gw - 1] + V[i + gw + 1]) - v;
        const uvv = u * v * v;
        U2[i] = u + lu - uvv + feed * (1 - u);
        let nv = v + dv * lv + uvv - (feed + kill) * v;
        if (v > 0.002) nv += (Math.random() - 0.5) * jitter * v * 6;                                    // ruido: ramificaciones irregulares
        if (nucleate && Math.random() < nucleate && Math.hypot(x - origin.x, y - origin.y) < rgNow) nv += 0.22; // núcleos al azar: rompen la simetría
        V2[i] = nv;
      }
    }
    [U, U2] = [U2, U]; [V, V2] = [V2, V];
  };

  const render = (alpha: number, rg: number) => {
    const d = img.data;
    const { threshold, gain, pixelNoise } = P;
    for (let i = 0, p = 0; i < V.length; i++, p += 4) {
      const v = V[i];
      // El patrón se ve dentro de un radio que se expande, con un borde que se desvanece (sin anillo duro)
      const dist = Math.hypot((i % gw) - origin.x, Math.floor(i / gw) - origin.y);
      const edge = 1 - smooth((dist - rg * 0.62) / (rg * 0.38));
      // Gris: más claro donde hay más sustancia; ruido por celda; transparente donde casi no hay nada (se ve el fondo negro)
      const a = smooth((v - threshold) * gain) * alpha * edge;
      const g = 70 + v * 520 + (Math.random() - 0.5) * pixelNoise;
      d[p] = d[p + 1] = d[p + 2] = g > 235 ? 235 : g < 0 ? 0 : g;
      d[p + 3] = a * 255;
    }
    bctx.putImageData(img, 0, 0);
    ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(buf, 0, 0, canvas.width, canvas.height);
  };

  const loop = (now: number) => {
    const age = Math.max(0, now - startedAt);
    const rg = 9 + (P.radius / P.cell - 9) * (1 - Math.exp(-age / P.grow)); // arranca justo por fuera de la semilla y se expande
    rgNow = rg;
    const nucleate = age < 3200 ? P.nuclei : 0; // sólo durante los primeros segundos
    for (let s = 0; s < P.steps; s++) step(s === 0 ? nucleate : 0);
    let alpha = 1;
    if (!P.pinned) {
      alpha = age > P.hold ? Math.max(0, 1 - (age - P.hold) / P.fade) : 1;
      if (disturbedAt) alpha = Math.min(alpha, Math.max(0, 1 - (now - disturbedAt) / 900));
    }
    render(alpha, rg);
    if (alpha <= 0) { clear(); if (inside) armIdle(); return; }
    raf = requestAnimationFrame(loop);
  };

  const armIdle = () => { clearTimeout(idleTimer); idleTimer = window.setTimeout(() => { if (inside && !raf) start(); }, P.idle); };
  const disturb = () => { if (raf && !disturbedAt && !P.pinned) disturbedAt = performance.now(); };

  canvas.addEventListener('pointermove', (e) => {
    const r = canvas.getBoundingClientRect();
    const nx = e.clientX - r.left, ny = e.clientY - r.top;
    const moved = Math.hypot(nx - pointer.x, ny - pointer.y) > 6;
    pointer = { x: nx, y: ny }; inside = true;
    if (moved) { disturb(); armIdle(); }
  });
  canvas.addEventListener('pointerleave', (e) => {
    inside = false; clearTimeout(idleTimer);
    if ((e.relatedTarget as HTMLElement | null)?.closest?.('[data-lab-panel]')) return; // pasar al panel de controles no disuelve el patrón
    disturb();
  });
  canvas.addEventListener('pointerdown', (e) => { const r = canvas.getBoundingClientRect(); pointer = { x: e.clientX - r.left, y: e.clientY - r.top }; inside = true; disturb(); armIdle(); });
  panel?.addEventListener('pointerenter', () => { disturbedAt = 0; });

  return {
    params: P, apply, resize, clear,
    restart: (x = w / 2, y = h / 2) => start(x, y),
  };
}
