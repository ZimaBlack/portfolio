// Constructor de logotipos animados para la portada de un proyecto (modo "ensamblar").
// Toma un SVG de trazos sueltos y arma otro, listo para animar con CSS (src/components/ProjectHero.astro):
//  · cada trazo se define una sola vez (<path id>) en un SVG oculto y se reutiliza con <use>;
//  · cada pieza lleva su número (data-part) para animarla por separado, y las "tardías" llegan después de las demás;
//  · el color final es un tono, o un degradado vertical.
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/** Ritmo de la animación (segundos). Se publica como variables CSS (--t-*): el CSS y este módulo comparten una sola fuente. */
export const TIMING = {
  enter: 0.3,   // entran las alas
  appear: 2.2,  // rombo y nombre llegan, justo después de que las alas se juntan
};
export const timingVars = () => `--t-enter:${TIMING.enter}s;--t-appear:${TIMING.appear}s`;

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
  id: string;                      // único por SVG (prefijo de sus degradados y máscaras)
  cls: string;                     // clases del <svg>
  style?: string;                  // variables CSS del <svg> (--a = opacidad de las piezas)
  label?: string;                  // texto accesible; sin él, el SVG es decorativo
  color: string | [string, string]; // color de las piezas: un tono, o un degradado vertical [arriba, abajo]
  alpha?: number;                  // opacidad de las piezas
  flip?: boolean;                  // espejado horizontal
  fade?: boolean;                  // se desvanece hacia arriba y abajo
  screen?: boolean;                // se funde con el fondo (mezcla "pantalla")
  parts?: boolean;                 // numera los trazos (data-part) para animar las alas por separado
  late?: number[];                 // trazos que llegan después de los demás (rombo, nombre)
}

export function forge(art: Art, o: ForgeOpts): string {
  const id = o.id;
  const [vx, vy, vw, vh] = art.vb;
  const T = o.flip ? ` transform="matrix(-1 0 0 1 ${vx * 2 + vw} 0)"` : '';
  const late = new Set(o.late ?? []);
  const area = `x="${vx}" y="${vy}" width="${vw}" height="${vh}"`;
  const fill = Array.isArray(o.color) ? `url(#${id}-g)` : o.color;
  const defs = [
    Array.isArray(o.color) ? `<linearGradient id="${id}-g" gradientUnits="userSpaceOnUse" x1="0" y1="${vy}" x2="0" y2="${vy + vh}"><stop offset="0" stop-color="${o.color[0]}"/><stop offset="1" stop-color="${o.color[1]}"/></linearGradient>` : '',
    o.fade ? `<linearGradient id="${id}-fg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity="0"/><stop offset=".12" stop-color="#fff"/><stop offset=".88" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient><mask id="${id}-f" maskUnits="userSpaceOnUse" ${area}><rect ${area} fill="url(#${id}-fg)"/></mask>` : '',
  ].join('');
  const pieces = art.paths
    .map((_, i) => `<use href="#${art.id}-${i}" class="pj-piece${late.has(i) ? ' pj-late' : ''}" fill="${fill}"${o.alpha ? ` opacity="${o.alpha}"` : ''}${o.parts ? ` data-part="${i}"` : ''}/>`)
    .join('');
  const a11y = o.label ? `role="img" aria-label="${o.label.replace(/"/g, '&quot;')}"` : 'aria-hidden="true"';
  const group = `<g${T}${o.screen ? ' class="pj-screen"' : ''}${o.fade ? ` mask="url(#${id}-f)"` : ''}>${pieces}</g>`;
  return `<svg viewBox="${vx} ${vy} ${vw} ${vh}" fill="none" xmlns="http://www.w3.org/2000/svg" class="${o.cls}" style="--a:${o.alpha ?? 1};${o.style ?? ''}" ${a11y}><defs>${defs}</defs>${group}</svg>`;
}
