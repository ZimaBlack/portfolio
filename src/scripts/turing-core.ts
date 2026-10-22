// Núcleo de la morfogénesis (patrones de Turing): simulación de reacción-difusión de Gray-Scott sobre una grilla y su dibujo en un canvas.
// Lo usan el laboratorio (/lab/, con controles) y el fondo del sitio (src/scripts/turing-background.ts).
//
// Dos sustancias, U y V: U alimenta a V, V se reproduce a costa de U y desaparece de a poco. Según F (alimentación) y k (eliminación),
// de una semilla crecen manchas, líneas, corales o laberintos.

export interface TuringParams {
  feed: number;       // alimentación F
  kill: number;       // eliminación k
  dv: number;         // difusión de V (la de U es 1): más bajo = trazos más finos
  cell: number;       // px de pantalla por celda (más chico = más detalle y más costo)
  steps: number;      // pasos de simulación por cuadro (velocidad de crecimiento)
  radius: number;     // alcance de cada semilla (px)
  grow: number;       // ms: tiempo característico de expansión del alcance
  idle: number;       // ms quieto antes de empezar (laboratorio)
  hold: number;       // ms que se mantiene antes de disolverse (laboratorio)
  fade: number;       // ms que tarda en disolverse (laboratorio)
  nuclei: number;     // núcleos al azar al comienzo (rompen la simetría): 0 = sólo la semilla
  jitter: number;     // ruido en la reacción (ramificaciones irregulares)
  threshold: number;  // desde qué cantidad de sustancia se ve algo
  gain: number;       // nitidez del borde (más alto = más contraste)
  pixelNoise: number; // ruido por celda en el gris (0–100)
  peak: number;       // gris máximo (0–255): más bajo = patrón más oscuro, menos brillante detrás del texto
  blur: number;       // desenfoque del patrón (px de CSS)
  grain: number;      // intensidad del grano de película por encima (0–1)
  trails: boolean;    // dejar rastros mientras el cursor se mueve (apagado: sólo crece cuando el cursor queda quieto)
  trailEvery: number; // px de cursor entre un rastro y el siguiente
  trailLife: number;  // ms que dura un rastro (se ve completo el 20 % y se apaga en el resto)
  glitchIdle: number; // ms con el cursor quieto antes de un glitch (distorsión de canales alfa); 0 = sin glitch
  pinned: boolean;    // mantener el patrón (no se disuelve)
}

export const DEFAULTS: TuringParams = {
  feed: 0.029, kill: 0.057, dv: 0.5, cell: 4, steps: 20, radius: 340, grow: 2400, idle: 450, hold: 13000, fade: 3200,
  nuclei: 0.0009, jitter: 0.012, threshold: 0.05, gain: 3.6, pixelNoise: 46, peak: 235, blur: 1.2, grain: 0.16, trails: true, trailEvery: 34, trailLife: 2150, glitchIdle: 8000, pinned: false,
};

/** Combinaciones de F y k que dan distintos "caracteres" (todas con Dv = 0,5). */
export const PRESETS: Record<string, Partial<TuringParams>> = {
  'Líneas': { feed: 0.029, kill: 0.057 },
  'Líneas finas': { feed: 0.0345, kill: 0.0618 },
  'Gusanos': { feed: 0.078, kill: 0.061 },
  'Coral': { feed: 0.0545, kill: 0.062 },
  'Manchas': { feed: 0.0367, kill: 0.0649 },
};

export const smooth = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

export class TuringSim {
  w = 0; h = 0; gw = 0; gh = 0; dpr = 1;
  private ctx: CanvasRenderingContext2D;
  private U = new Float32Array(0); private V = new Float32Array(0); private U2 = new Float32Array(0); private V2 = new Float32Array(0);
  private img!: ImageData; private buf!: HTMLCanvasElement; private bctx!: CanvasRenderingContext2D;

  constructor(readonly canvas: HTMLCanvasElement, readonly P: TuringParams) {
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  /** Ajusta canvas y grilla a su tamaño actual (la simulación se reinicia). */
  resize() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(2, devicePixelRatio || 1);
    this.w = r.width; this.h = r.height;
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr);
    this.gw = Math.ceil(this.w / this.P.cell); this.gh = Math.ceil(this.h / this.P.cell);
    const n = this.gw * this.gh;
    this.U = new Float32Array(n).fill(1); this.V = new Float32Array(n); this.U2 = new Float32Array(n); this.V2 = new Float32Array(n);
    this.buf = document.createElement('canvas'); this.buf.width = this.gw; this.buf.height = this.gh;
    this.bctx = this.buf.getContext('2d')!; this.img = this.bctx.createImageData(this.gw, this.gh);
  }

  reset() { this.U.fill(1); this.V.fill(0); }
  clear() { this.ctx.setTransform(1, 0, 0, 1, 0, 0); this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height); }

  /** Semilla: un pequeño disco irregular de V en el punto (px de pantalla). */
  seed(px: number, py: number, size = 5) {
    const cx = px / this.P.cell, cy = py / this.P.cell;
    for (let y = -size; y <= size; y++) for (let x = -size; x <= size; x++) {
      if (x * x + y * y > size * size * 0.72 + Math.random() * size * 1.6) continue;
      const gx = Math.round(cx + x), gy = Math.round(cy + y);
      if (gx < 1 || gy < 1 || gx >= this.gw - 1 || gy >= this.gh - 1) continue;
      const i = gy * this.gw + gx;
      this.U[i] = 0.5; this.V[i] = 0.25 + Math.random() * 0.1;
    }
  }

  /** Deja en blanco un disco (px de pantalla): ahí no queda nada de patrones anteriores. */
  clearDisc(px: number, py: number, radius: number) {
    const cx = px / this.P.cell, cy = py / this.P.cell, r = radius / this.P.cell;
    for (let y = Math.max(1, Math.floor(cy - r)); y <= Math.min(this.gh - 2, Math.ceil(cy + r)); y++) {
      for (let x = Math.max(1, Math.floor(cx - r)); x <= Math.min(this.gw - 2, Math.ceil(cx + r)); x++) {
        if (Math.hypot(x - cx, y - cy) > r) continue;
        const i = y * this.gw + x; this.U[i] = 1; this.V[i] = 0;
      }
    }
  }

  /** Un paso de Gray-Scott (laplaciano de 3×3 ponderado). `nucleate` = probabilidad de núcleo por celda; `allow(x, y)` limita dónde. */
  step(nucleate = 0, allow?: (x: number, y: number) => boolean) {
    const { feed, kill, dv, jitter } = this.P;
    const { gw, gh } = this;
    let { U, V, U2, V2 } = this;
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
        if (v > 0.002) nv += (Math.random() - 0.5) * jitter * v * 6;                           // ruido: ramificaciones irregulares
        if (nucleate && Math.random() < nucleate && (!allow || allow(x, y))) nv += 0.22;        // núcleos al azar: rompen la simetría
        V2[i] = nv;
      }
    }
    [U, U2] = [U2, U]; [V, V2] = [V2, V];
    this.U = U; this.V = V; this.U2 = U2; this.V2 = V2;
  }

  /** Dibuja en grises. `mask(x, y)` (0–1, en celdas) deja ver sólo una parte; `alpha` es la opacidad general del dibujo. */
  render(alpha = 1, mask?: (x: number, y: number) => number) {
    const d = this.img.data, { gw, V } = this;
    const { threshold, gain, pixelNoise, peak } = this.P;
    for (let i = 0, p = 0; i < V.length; i++, p += 4) {
      const v = V[i];
      const m = mask ? mask(i % gw, (i / gw) | 0) : 1;
      // Gris: más claro donde hay más sustancia; ruido por celda; transparente donde casi no hay nada (se ve el fondo)
      const a = smooth((v - threshold) * gain) * alpha * m;
      const g = 70 * (peak / 235) + v * 520 * (peak / 235) + (Math.random() - 0.5) * pixelNoise;
      d[p] = d[p + 1] = d[p + 2] = g > peak ? peak : g < 0 ? 0 : g;
      d[p + 3] = a * 255;
    }
    this.bctx.putImageData(this.img, 0, 0);
    const c = this.ctx;
    c.setTransform(1, 0, 0, 1, 0, 0); c.clearRect(0, 0, this.canvas.width, this.canvas.height);
    c.imageSmoothingEnabled = true; c.imageSmoothingQuality = 'high';
    c.drawImage(this.buf, 0, 0, this.canvas.width, this.canvas.height);
  }
}
