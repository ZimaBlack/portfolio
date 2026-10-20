// Análisis de color de SVG (en tiempo de compilación) para generar el "ambiente" del carrusel.
// Se leen los rellenos de cada forma, ponderados por su tamaño aproximado, y se elige un tono
// principal y uno secundario (distinto en matiz). Los grises, blancos y negros no cuentan.

type RGB = [number, number, number];
export type Tone = { h: number; s: number; l: number };

function parseColor(raw: string): RGB | null {
  const v = raw.trim().toLowerCase();
  if (!v || v === 'none' || v === 'currentcolor' || v === 'transparent' || v.startsWith('url(')) return null;
  if (v === 'black') return [0, 0, 0];
  if (v === 'white') return [255, 255, 255];
  let m = v.match(/^#([0-9a-f]{3})$/);
  if (m) return [...m[1]].map((c) => parseInt(c + c, 16)) as RGB;
  m = v.match(/^#([0-9a-f]{6})(?:[0-9a-f]{2})?$/);
  if (m) return [parseInt(m[1].slice(0, 2), 16), parseInt(m[1].slice(2, 4), 16), parseInt(m[1].slice(4, 6), 16)];
  m = v.match(/^rgba?\(([^)]+)\)/);
  if (m) { const p = m[1].split(/[ ,/]+/).map(parseFloat); return [p[0], p[1], p[2]]; }
  return null;
}

function toHsl([r, g, b]: RGB): Tone {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), l = (max + min) / 2;
  const d = max - min;
  if (!d) return { h: 0, s: 0, l };
  const s = d / (1 - Math.abs(2 * l - 1));
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: (h * 60 + 360) % 360, s, l };
}

const attr = (src: string, name: string) => src.match(new RegExp(`(?:^|[\\s;"'])${name}\\s*[=:]\\s*"?([^";>]+)"?`, 'i'))?.[1];

/** Lista de (color, peso) de un SVG. */
function swatches(svg: string) {
  const out: { rgb: RGB; w: number }[] = [];
  for (const m of svg.matchAll(/<(path|rect|circle|ellipse|polygon|polyline)\b([^>]*)>/gi)) {
    const tag = m[1].toLowerCase(), a = m[2];
    const rgb = parseColor(attr(a, 'fill') ?? '');
    if (!rgb) continue;
    let w = 1;
    if (tag === 'path') w = (attr(a, 'd') ?? '').length;
    else if (tag === 'rect') w = (parseFloat(attr(a, 'width') ?? '0') * parseFloat(attr(a, 'height') ?? '0')) / 40;
    else if (tag === 'circle') w = (Math.PI * parseFloat(attr(a, 'r') ?? '0') ** 2) / 40;
    else if (tag === 'ellipse') w = (Math.PI * parseFloat(attr(a, 'rx') ?? '0') * parseFloat(attr(a, 'ry') ?? '0')) / 40;
    else w = (attr(a, 'points') ?? '').length * 2;
    out.push({ rgb, w: Math.max(w, 1) });
  }
  for (const m of svg.matchAll(/stop-color\s*[=:]\s*"?([^";>]+)"?/gi)) {
    const rgb = parseColor(m[1]);
    if (rgb) out.push({ rgb, w: 200 });
  }
  return out;
}

const clamp = (v: number, a: number, b: number) => Math.min(b, Math.max(a, v));
const hueDist = (a: number, b: number) => { const d = Math.abs(a - b) % 360; return d > 180 ? 360 - d : d; };

/**
 * Ambiente de una lámina a partir de sus SVG: dos tonos armónicos.
 * `fallback` se usa cuando los logos son neutros (blanco / gris / negro).
 */
export function ambientOf(svgs: string[], fallback: [Tone, Tone]): { c1: Tone; c2: Tone; source: 'logos' | 'neutral' } {
  const buckets = new Map<number, { w: number; r: number; g: number; b: number }>();
  for (const svg of svgs) {
    for (const { rgb, w } of swatches(svg)) {
      const t = toHsl(rgb);
      if (t.s < 0.22 || t.l < 0.16 || t.l > 0.9) continue; // neutros y extremos: no tiñen el ambiente
      const key = Math.round(t.h / 30) % 12;
      const weight = w * t.s; // los colores más vivos pesan más
      const bk = buckets.get(key) ?? { w: 0, r: 0, g: 0, b: 0 };
      bk.w += weight; bk.r += rgb[0] * weight; bk.g += rgb[1] * weight; bk.b += rgb[2] * weight;
      buckets.set(key, bk);
    }
  }
  const ranked = [...buckets.entries()].sort((a, b) => b[1].w - a[1].w);
  if (!ranked.length) return { c1: fallback[0], c2: fallback[1], source: 'neutral' };

  const tone = (bk: { w: number; r: number; g: number; b: number }) => toHsl([bk.r / bk.w, bk.g / bk.w, bk.b / bk.w]);
  const first = tone(ranked[0][1]);
  const second = ranked.slice(1).map(([, bk]) => ({ bk, t: tone(bk) }))
    .find(({ bk, t }) => bk.w >= ranked[0][1].w * 0.2 && hueDist(t.h, first.h) >= 45)?.t;

  // Armonización: saturación y luminosidad acotadas para que el brillo sea parejo entre láminas.
  const soft = (t: Tone): Tone => ({ h: t.h, s: clamp(t.s, 0.4, 0.78), l: clamp(t.l, 0.46, 0.6) });
  const c1 = soft(first);
  const c2 = soft(second ?? { h: (first.h + 32) % 360, s: first.s, l: first.l + 0.04 }); // sin 2.º color: análogo
  return { c1, c2, source: 'logos' };
}

export const hsl = (t: Tone, alpha?: number) =>
  `hsl(${Math.round(t.h)} ${Math.round(t.s * 100)}% ${Math.round(t.l * 100)}%${alpha !== undefined ? ` / ${alpha}` : ''})`;

/** Convierte un color hex (#rrggbb) en Tone, para los colores de respaldo del proyecto. */
export const toneOfHex = (hex: string): Tone => toHsl(parseColor(hex) ?? [60, 50, 40]);
