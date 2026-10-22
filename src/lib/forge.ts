// Constructor de logotipos animados ("forja") para la portada de un proyecto.
// Toma un SVG de trazos sueltos y arma otro, listo para animar con CSS (src/components/ProjectHero.astro):
//  · cada trazo se define una sola vez (<path id>) y se reutiliza con <use> para la pieza oscura, la máscara y el oro;
//  · las piezas nacen oscuras (efecto multiplicar, ver el CSS) y el oro llega encima, por fundido o por un destello de barras;
//  · opcionalmente, un brillo sutil de barras planas recorre todo, atenuado por una viñeta.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Ritmo común de toda la animación (segundos). Se publica como variables CSS (--t-*): el CSS y este módulo comparten una sola fuente. */
export const TIMING = {
  enter: 0.3,                 // entran las alas
  flash: 2.3,                 // 1.ª pasada de barras (sobre piezas todavía oscuras)
  pass: 1,                    // separación entre pasadas
  get last() { return this.flash + this.pass; },   // 2.ª pasada: todo se vuelve dorado
  get appear() { return this.flash + 0.8; },       // rombo y nombre llegan, aún oscuros, tras la 1.ª pasada
  get shine() { return this.last + 2.6; },         // primer brillo sutil; luego se repite cada 11 s
};
export const timingVars = () =>
  `--t-enter:${TIMING.enter}s;--t-flash:${TIMING.flash}s;--t-last:${TIMING.last}s;--t-appear:${TIMING.appear}s;--t-shine:${TIMING.shine}s`;

export type ViewBox = [number, number, number, number];
export interface Art { id: string; vb: ViewBox; paths: string[]; color: string }

/** Lee un SVG de /public y extrae su viewBox, los trazos y el primer color de relleno. */
export function loadArt(file: string, id: string): Art {
  const svg = readFileSync(join(process.cwd(), 'public', file), 'utf8');
  const vb = (svg.match(/viewBox="([^"]+)"/)?.[1] ?? '0 0 100 100').split(/\s+/).map(Number) as ViewBox;
  const paths = [...svg.matchAll(/<path\b[^>]*?\sd="([^"]+)"/g)].map((m) => m[1]);
  return { id, vb, paths, color: svg.match(/fill="(#[0-9a-f]{3,8})"/i)?.[1] ?? '#CFC65C' };
}

/** Los trazos, definidos una sola vez para toda la página (un SVG oculto): el resto los referencia con <use>. */
export const shapeDefs = (art: Art) =>
  `<svg class="pjh__defs" width="0" height="0" aria-hidden="true" focusable="false"><defs>${art.paths.map((d, i) => `<path id="${art.id}-${i}" d="${d}"/>`).join('')}</defs></svg>`;

export interface ForgeOpts {
  id: string;                      // único por SVG (prefijo de sus máscaras y degradados)
  cls: string;                     // clases del <svg>
  style?: string;                  // variables CSS del <svg> (--a = opacidad oscura, --g = opacidad del oro)
  label?: string;                  // texto accesible; sin él, el SVG es decorativo
  base: string;                    // color inicial de las piezas
  alpha: number;                   // opacidad inicial de las piezas
  gold: string | [string, string]; // oro final: un tono, o un degradado vertical [arriba, abajo]
  goldAlpha?: number;
  reveal: 'fade' | 'bars';         // cómo llega el oro: fundido, o detrás de un destello de barras
  bars?: 'two' | 'last';           // con reveal 'bars': dos pasadas (1.ª y última) o sólo la última
  flip?: boolean;                  // espejado horizontal
  fade?: boolean;                  // el oro se desvanece hacia arriba y abajo
  screen?: boolean;                // el oro se funde con el fondo (mezcla "pantalla")
  parts?: boolean;                 // numera los trazos (data-part) para animar las alas por separado
  late?: number[];                 // trazos que llegan después de la 1.ª pasada
  vig?: { cx: number; cy: number; r: number }; // viñeta del brillo (en unidades del SVG)
  shine?: number;                  // intensidad del brillo sutil repetido (0 = sin brillo)
}

const SKEW = Math.tan((22 * Math.PI) / 180);
const BARS = [[0, 0.07], [0.12, 0.025], [0.19, 0.12]]; // posición y ancho de las barras (fracción del ancho)

export function forge(art: Art, o: ForgeOpts): string {
  const id = o.id;
  const [vx, vy, vw, vh] = art.vb;
  const T = o.flip ? ` transform="matrix(-1 0 0 1 ${vx * 2 + vw} 0)"` : '';
  const late = new Set(o.late ?? []);
  const uses = (attrs: (i: number) => string) => art.paths.map((_, i) => `<use href="#${art.id}-${i}" ${attrs(i)}/>`).join('');
  const area = `x="${vx}" y="${vy}" width="${vw}" height="${vh}"`;
  const gold = Array.isArray(o.gold) ? `url(#${id}-gg)` : o.gold;

  // Barras planas en diagonal, y la cortina que revela el oro detrás de la primera barra
  const span = 0.31 * vw, travel = vw + span + vh * SKEW * 2;
  const origin = `translate(${(vx - span - vh * SKEW * 1.1).toFixed(1)} ${vy}) skewX(-22)`;
  const bar = (x: number, w: number) => `<rect x="${(x * vw).toFixed(1)}" y="${(-vh * 0.1).toFixed(1)}" width="${(w * vw).toFixed(1)}" height="${(vh * 1.2).toFixed(1)}" fill="#fff" fill-opacity=".88"/>`;
  const bars = (cls: string, extra = '') => `<g class="${cls}" style="--gw:${travel.toFixed(1)}px${extra}"><g transform="${origin}">${BARS.map(([x, w]) => bar(x, w)).join('')}</g></g>`;
  const wipe = `<mask id="${id}-w" maskUnits="userSpaceOnUse" ${area}><g class="pj-wipe" style="--gw:${travel.toFixed(1)}px"><g transform="${origin}"><rect x="-4000" y="${(-vh * 0.1).toFixed(1)}" width="${(4000 + 0.14 * vw).toFixed(1)}" height="${(vh * 1.2).toFixed(1)}" fill="#fff"/></g></g></mask>`;
  const radial = (key: string, v: { cx: number; cy: number; r: number }) =>
    `<radialGradient id="${id}-${key}g" gradientUnits="userSpaceOnUse" cx="${v.cx.toFixed(1)}" cy="${v.cy.toFixed(1)}" r="${v.r.toFixed(1)}"><stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient><mask id="${id}-${key}" maskUnits="userSpaceOnUse" x="${vx - 2000}" y="${vy - 2000}" width="${vw + 4000}" height="${vh + 4000}"><rect x="${vx - 2000}" y="${vy - 2000}" width="${vw + 4000}" height="${vh + 4000}" fill="url(#${id}-${key}g)"/></mask>`;

  const defs = [
    `<mask id="${id}-m" maskUnits="userSpaceOnUse" ${area}><g${T}>${uses(() => 'fill="#fff"')}</g></mask>`, // la forma del logotipo, para recortar las barras
    o.reveal === 'bars' ? wipe : '',
    Array.isArray(o.gold) ? `<linearGradient id="${id}-gg" gradientUnits="userSpaceOnUse" x1="0" y1="${vy}" x2="0" y2="${vy + vh}"><stop offset="0" stop-color="${o.gold[0]}"/><stop offset="1" stop-color="${o.gold[1]}"/></linearGradient>` : '',
    o.vig ? radial('v', o.vig) : '',
    o.fade ? `<linearGradient id="${id}-fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".12" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}-f" maskUnits="userSpaceOnUse" ${area}><rect ${area} fill="url(#${id}-fg)"/></mask>` : '',
  ].join('');

  // Piezas oscuras (multiplicar). Las "tardías" (rombo, nombre) llegan después de la 1.ª pasada.
  const pieces = uses((i) => `class="pj-base${late.has(i) ? ' pj-late' : ''}" fill="${o.base}" opacity="${o.alpha}"${o.parts ? ` data-part="${i}"` : ''}`);
  // Oro encima: por fundido, o recortado por la cortina que acompaña al destello
  const goldPieces = `<g${T}>${uses(() => `fill="${gold}"`)}</g>`;
  const goldCls = `pj-gold${o.screen ? ' pj-screen' : ''}`;
  const goldLayer = o.reveal === 'fade'
    ? `<g class="${goldCls} pj-gold--fade"${o.fade ? ` mask="url(#${id}-f)"` : ''}>${goldPieces}</g>`
    : `<g class="${goldCls}"${o.fade ? ` mask="url(#${id}-f)"` : ''}><g mask="url(#${id}-w)">${goldPieces}</g></g>`;
  // Destellos: el de revelado (barras) y el sutil repetido (shine), recortados con la forma y atenuados por la viñeta
  const flash = o.reveal === 'bars' ? bars(o.bars === 'last' ? 'pj-flash pj-flash--last' : 'pj-flash') : '';
  const shine = o.shine ? `<g opacity="${o.shine}">${bars('pj-shine')}</g>` : '';
  const sparkle = flash || shine ? `<g mask="url(#${id}-m)"><g${o.vig ? ` mask="url(#${id}-v)"` : ''}>${shine}${flash}</g></g>` : '';

  const a11y = o.label ? `role="img" aria-label="${o.label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" fill="none" xmlns="http://www.w3.org/2000/svg" class="${o.cls}" style="--a:${o.alpha};--g:${o.goldAlpha ?? 1};${o.style ?? ''}" ${a11y}><defs>${defs}</defs><g${T}>${pieces}</g>${goldLayer}${sparkle}</svg>`;
}
