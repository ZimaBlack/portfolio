// Constructor de logotipos animados para la portada de un proyecto (modo "ensamblar").
// Toma un SVG de trazos sueltos y arma otro, listo para animar con CSS (src/components/ProjectHero.astro):
//  · cada trazo se define una sola vez (<path id>) en un SVG oculto y se reutiliza con <use>;
//  · cada pieza lleva su número (data-part) para animarla por separado, y las "tardías" llegan después de las demás;
//  · el color final es un tono, o un degradado vertical;
//  · un único brillo de barras planas puede cruzar cada SVG (recortado con su forma); el retraso de cada uno (--sd) lo hace parte de una sola ola.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Ritmo de la animación (segundos). Se publica como variables CSS (--t-*): el CSS y este módulo comparten una sola fuente. */
export const TIMING = {
  enter: 2.0,   // entran las alas: cuando los vectores están por ponerse dorados
  appear: 3.7,  // rombo y nombre llegan mientras las alas terminan de juntarse
  settle: 4.2,  // ya armado todo: los vectores bajan su opacidad
  shine: 5.2,   // un único brillo recorre toda la composición, de izquierda a derecha
};
export const timingVars = () => `--t-enter:${TIMING.enter}s;--t-appear:${TIMING.appear}s;--t-settle:${TIMING.settle}s;--t-shine:${TIMING.shine}s`;

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

/** Degradado lineal: paradas [posición 0–1, color] y dirección [x1, y1, x2, y2] como fracciones del ancho y el alto (por defecto, vertical). */
export interface Gradient { stops: [number, string][]; dir?: [number, number, number, number] }

export interface ForgeOpts {
  id: string;                      // único por SVG (prefijo de sus degradados y máscaras)
  cls: string;                     // clases del <svg>
  style?: string;                  // variables CSS del <svg> (--a = opacidad de las piezas)
  label?: string;                  // texto accesible; sin él, el SVG es decorativo
  color: string | Gradient;        // color de las piezas: un tono, o un degradado
  alpha?: number;                  // opacidad de las piezas
  flip?: boolean;                  // espejado horizontal
  fade?: boolean;                  // se desvanece hacia arriba y abajo
  screen?: boolean;                // se funde con el fondo (mezcla "pantalla")
  parts?: boolean;                 // numera los trazos (data-part) para animar las alas por separado
  late?: number[];                 // trazos que llegan después de los demás (rombo, nombre)
  shine?: number;                  // intensidad (0–1) del brillo de barras que lo cruza; sin él, no hay brillo
}

const SKEW = Math.tan((22 * Math.PI) / 180);
const BARS = [[0, 0.07], [0.12, 0.025], [0.19, 0.12]]; // posición y ancho de las barras (fracción del ancho)

export function forge(art: Art, o: ForgeOpts): string {
  const id = o.id;
  const [vx, vy, vw, vh] = art.vb;
  const T = o.flip ? ` transform="matrix(-1 0 0 1 ${vx * 2 + vw} 0)"` : '';
  const late = new Set(o.late ?? []);
  const area = `x="${vx}" y="${vy}" width="${vw}" height="${vh}"`;
  const grad = typeof o.color === 'string' ? null : o.color;
  const fill = grad ? `url(#${id}-g)` : (o.color as string);
  const defs = [
    grad ? (() => {
      const [x1, y1, x2, y2] = grad.dir ?? [0, 0, 0, 1];
      return `<linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="${vx + x1 * vw}" y1="${vy + y1 * vh}" x2="${vx + x2 * vw}" y2="${vy + y2 * vh}">${grad.stops.map(([t, c]) => `<stop offset="${t}" stop-color="${c}"/>`).join('')}</linearGradient>`;
    })() : '',
    o.fade ? `<linearGradient id="${id}-fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".12" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}-f" maskUnits="userSpaceOnUse" ${area}><rect ${area} fill="url(#${id}-fg)"/></mask>` : '',
  ].join('');
  const pieces = art.paths
    .map((_, i) => `<use href="#${art.id}-${i}" class="pj-piece${late.has(i) ? ' pj-late' : ''}" fill="${fill}"${o.alpha ? ` opacity="${o.alpha}"` : ''}${o.parts ? ` data-part="${i}"` : ''}/>`)
    .join('');
  const a11y = o.label ? `role="img" aria-label="${o.label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  // Brillo: barras planas en diagonal, recortadas con la forma de las piezas
  let shine = '';
  if (o.shine) {
    const span = 0.31 * vw, travel = vw + span + vh * SKEW * 2;
    const origin = `translate(${(vx - span - vh * SKEW * 1.1).toFixed(1)} ${vy}) skewX(-22)`;
    const bars = BARS.map(([x, w]) => `<rect x="${(x * vw).toFixed(1)}" y="${(-vh * 0.1).toFixed(1)}" width="${(w * vw).toFixed(1)}" height="${(vh * 1.2).toFixed(1)}" fill="#fff" fill-opacity=".88"/>`).join('');
    const uses = art.paths.map((_, i) => `<use href="#${art.id}-${i}" fill="#fff"/>`).join('');
    shine = `<mask id="${id}-m" maskUnits="userSpaceOnUse" ${area}><g${T}>${uses}</g></mask><g mask="url(#${id}-m)" opacity="${o.shine}"><g class="pj-shine" style="--gw:${travel.toFixed(1)}px"><g transform="${origin}">${bars}</g></g></g>`;
  }
  // Los vectores ("screen") llevan las piezas y el brillo dentro de un mismo grupo: el brillo hereda así su máscara, su desenfoque y su opacidad
  const inner = `<g${T}>${pieces}</g>${o.screen ? shine : ''}`;
  const group = o.screen || o.fade ? `<g${o.screen ? ' class="pj-screen"' : ''}${o.fade ? ` mask="url(#${id}-f)"` : ''}>${inner}</g>` : `<g class="pj-tone">${inner}</g>`; // el logotipo y el nombre llevan su propio grupo: ahí se aclara el tono durante el brillo
  return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" fill="none" xmlns="http://www.w3.org/2000/svg" class="${o.cls}" style="--a:${o.alpha ?? 1};${o.style ?? ''}" ${a11y}><defs>${defs}</defs>${group}${o.screen ? '' : shine}</svg>`;
}
