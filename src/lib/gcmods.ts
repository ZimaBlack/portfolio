// Módulos geométricos de Global Citizen: medios anillos concéntricos con las proporciones del isotipo.
// Todos los trazos se calculan (nada es una imagen) y están centrados en (0, 0) para poder rotarlos y reflejarlos sobre su eje.
const O1 = 177.7, O0 = 128.85, M1 = 106.2, M0 = 57.4; // radios del isotipo (caja de 356)

const band = (r1: number, r0: number, side: 'l' | 'r') => {
  const a = side === 'r' ? 1 : 0;
  return `M0 ${-r1}A${r1} ${r1} 0 0 ${a} 0 ${r1}L0 ${r0}A${r0} ${r0} 0 0 ${1 - a} 0 ${-r0}Z`;
};

/** Medio anillo doble (exterior + medio) de radio R: lado izquierdo ("C") o derecho ("D"). */
export const halfDouble = (R: number, side: 'l' | 'r') => {
  const k = R / O1;
  return band(O1 * k, O0 * k, side) + band(M1 * k, M0 * k, side);
};
/** Solo el anillo medio (el módulo pequeño). */
export const halfMid = (R: number, side: 'l' | 'r') => { const k = R / O1; return band(M1 * k, M0 * k, side); };
/** Solo el anillo exterior. */
export const halfOut = (R: number, side: 'l' | 'r') => { const k = R / O1; return band(O1 * k, O0 * k, side); };
/** Anillo doble completo (dos mitades enfrentadas). */
export const fullDouble = (R: number) => halfDouble(R, 'l') + halfDouble(R, 'r');
/** Anillo medio completo. */
export const fullMid = (R: number) => halfMid(R, 'l') + halfMid(R, 'r');
