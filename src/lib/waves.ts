// Trama fluida de diseño plano: capas de ondas apiladas (colores lisos, sin degradados ni contornos) que fluyen despacio.
// Cada capa es una curva ondulada cerrada hacia abajo, el doble de ancha que la pantalla; el CSS la desplaza exactamente un ancho
// de pantalla en bucle (la onda se repite dos veces por ancho, así el bucle no se nota). Se genera al compilar: no hay JavaScript en la página.

const W = 1440;   // ancho de la pantalla en unidades del SVG
const H = 900;
const STEP = 24;  // separación entre puntos de la curva

/** Una curva ondulada de 2 anchos de pantalla: y = base + amplitud·sen(frecuencia·x + fase) + una segunda onda más chica, cerrada hacia abajo. */
function layerPath(base: number, amp: number, periods: number, phase: number): string {
  const pts: string[] = [];
  for (let x = 0; x <= 2 * W; x += STEP) {
    const t = (x / W) * Math.PI * 2 * periods; // `periods` ondas por ancho de pantalla → el desplazamiento de un ancho cierra el bucle
    const y = base + amp * Math.sin(t + phase) + amp * 0.32 * Math.sin(t * 2 + phase * 1.7);
    pts.push(`${x} ${y.toFixed(1)}`);
  }
  return `M0 ${H + 40} L${pts.join(' L')} L${2 * W} ${H + 40} Z`;
}

/** Devuelve el SVG de la trama. `colors` se reparten entre las capas, de la más lejana (arriba) a la más cercana (abajo). */
export function wavesSvg(colors: string[], layers = 6): string {
  const paths = Array.from({ length: layers }, (_, i) => {
    const base = 330 + i * 92;                 // cada capa más abajo
    const amp = 34 + i * 7;                    // y más ancha
    const periods = i % 2 === 0 ? 2 : 1;       // onda corta y larga, alternadas
    const dir = i % 2 === 0 ? 1 : -1;          // sentidos opuestos
    const dur = 46 + i * 14;                   // las de adelante van más rápido en proporción: más lejos, más lento
    const color = colors[i % colors.length];
    return `<g class="pjh__wave" style="--dur:${dur}s;--dir:${dir}"><path d="${layerPath(base, amp, periods, i * 1.3)}" fill="${color}"/></g>`;
  });
  return `<svg class="pjh__waves" viewBox="0 0 ${W} ${H}" preserveAspectRatio="none" aria-hidden="true" focusable="false">${paths.join('')}</svg>`;
}
