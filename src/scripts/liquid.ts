// Fondo de líquido de diseño plano para la portada de un proyecto: dos fluidos (los colores --ga y --gb de la portada), cada uno de un solo
// tono sólido, que se enroscan y se deslizan despacio sobre el negro, como tinta o pintura líquida pero sin luz ni degradados.
// Se dibuja en WebGL2 con ruido fractal deformado (domain warping), a media resolución. Si WebGL2 no está disponible, no hace nada
// (la portada conserva su fondo de luces suaves). Los colores y las posiciones se leen de las variables CSS de la portada, así que el
// widget de color de Colorada los cambia en vivo, con transición.

type Rgb = [number, number, number];
type State = { ga: Rgb; gb: Rgb; ax: number; ay: number; bx: number; by: number; gi: number };

const TWEEN_MS = 1400;
const SCALE = 0.8;          // resolución del dibujo respecto de la pantalla (los bordes nítidos piden más que un fondo difuso)
const SPEED = 0.045;        // velocidad del flujo

const FRAG = `#version 300 es
precision highp float;
out vec4 o;
uniform vec2 uRes; uniform float uT; uniform vec3 uC1; uniform vec3 uC2; uniform vec2 uP1; uniform vec2 uP2; uniform float uI;

float hash(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3. - 2. * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), f.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float v = 0., a = .5; mat2 m = mat2(1.6, 1.2, -1.2, 1.6); for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = m * p; a *= .46; } return v; }
// Altura del líquido: el ruido se deforma a sí mismo dos veces, así los bordes se enroscan y fluyen como un fluido
float field(vec2 p, float t){
  vec2 q = vec2(fbm(p + vec2(0., t)), fbm(p + vec2(5.2, 1.3) - t));
  vec2 r = vec2(fbm(p + 2.2 * q + vec2(1.7, 9.2) + t * 1.2), fbm(p + 2.2 * q + vec2(8.3, 2.8) - t));
  return fbm(p + 2.2 * r);
}

void main(){
  vec2 uv = gl_FragCoord.xy / uRes;
  vec2 p = (uv - .5) * vec2(uRes.x / uRes.y, 1.) * 1.35;
  float t = uT * ${SPEED.toFixed(3)};
  float h = field(p, t);

  // Dos tonos: cada uno domina cerca de su luz; entre medio se reparten según el flujo
  float w1 = exp(-pow(distance(uv, uP1) * 1.6, 2.)), w2 = exp(-pow(distance(uv, uP2) * 1.6, 2.));
  float k = clamp(w2 / (w1 + w2 + 1e-4) + (h - .5) * .9, 0., 1.);

  // Diseño plano: colores sólidos, sin luz ni degradados; los bordes son nítidos (se suavizan sólo un píxel para que no se escalonen)
  float aaH = fwidth(h) * 1.3 + 1e-4, aaK = fwidth(k) * 1.3 + 1e-4;
  float cov = smoothstep(-aaH, aaH, h + (w1 + w2) * .15 - .46);   // cuánto líquido hay: el resto es el negro del fondo
  vec3 col = mix(uC1, uC2, smoothstep(-aaK, aaK, k - .5));        // cuál de los dos tonos
  // Viñeta: una sombra suave que oscurece los bordes de la portada (el color se apaga hacia el negro)
  float vig = smoothstep(.3, 1.0, length((uv - .5) * vec2(1.05, 1.2) * 1.5));
  col *= 1. - .72 * vig;
  o = vec4(col * cov * uI, cov * uI);
}`;
const VERT = `#version 300 es
in vec2 a; void main(){ gl_Position = vec4(a, 0., 1.); }`;

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => 1 - Math.pow(1 - t, 3);
const parseColor = (v: string, fb: Rgb): Rgb => {
  v = v.trim();
  let m = v.match(/^#([0-9a-f]{6})$/i);
  if (m) { const n = parseInt(m[1], 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  m = v.match(/rgba?\(\s*([\d.]+)[ ,]+([\d.]+)[ ,]+([\d.]+)/i);
  return m ? [parseFloat(m[1]), parseFloat(m[2]), parseFloat(m[3])] : fb;
};
const pct = (v: string, fb: number) => { const n = parseFloat(v); return Number.isFinite(n) ? n : fb; };

export function initLiquid(hero: HTMLElement) {
  const canvas = hero.querySelector<HTMLCanvasElement>('[data-pj-liquid]');
  const gl = canvas?.getContext('webgl2', { premultipliedAlpha: true, antialias: false });
  if (!canvas || !gl) return;
  hero.dataset.liquid = '1';

  const compile = (type: number, src: string) => { const s = gl.createShader(type)!; gl.shaderSource(s, src); gl.compileShader(s); return s; };
  const prog = gl.createProgram()!;
  gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
  gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) { hero.dataset.liquid = ''; return; } // sin shader: se queda el fondo de luces suaves
  gl.useProgram(prog);
  const buf = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const loc = gl.getAttribLocation(prog, 'a'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = { res: u('uRes'), t: u('uT'), c1: u('uC1'), c2: u('uC2'), p1: u('uP1'), p2: u('uP2'), i: u('uI') };

  const read = (): State => {
    const cs = getComputedStyle(hero);
    return {
      ga: parseColor(cs.getPropertyValue('--ga'), [224, 43, 51]), gb: parseColor(cs.getPropertyValue('--gb'), [122, 15, 22]),
      ax: pct(cs.getPropertyValue('--ax'), 24), ay: pct(cs.getPropertyValue('--ay'), 34),
      bx: pct(cs.getPropertyValue('--bx'), 76), by: pct(cs.getPropertyValue('--by'), 72),
      gi: pct(cs.getPropertyValue('--gi'), 1),
    };
  };
  let cur = read(), from = cur, to = cur, t0 = 0, tweenStart = -1;
  const mix = (a: State, b: State, k: number): State => ({
    ga: a.ga.map((v, i) => lerp(v, b.ga[i], k)) as Rgb, gb: a.gb.map((v, i) => lerp(v, b.gb[i], k)) as Rgb,
    ax: lerp(a.ax, b.ax, k), ay: lerp(a.ay, b.ay, k), bx: lerp(a.bx, b.bx, k), by: lerp(a.by, b.by, k), gi: lerp(a.gi, b.gi, k),
  });
  new MutationObserver(() => { from = cur; to = read(); tweenStart = performance.now(); }).observe(hero, { attributes: true, attributeFilter: ['style'] }); // el widget escribe las variables en el style

  const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const resize = () => {
    const r = hero.getBoundingClientRect();
    canvas.width = Math.max(2, Math.round(r.width * SCALE)); canvas.height = Math.max(2, Math.round(r.height * SCALE));
    gl.viewport(0, 0, canvas.width, canvas.height);
    draw(performance.now());
  };
  const draw = (now: number) => {
    if (tweenStart >= 0) { const k = Math.min(1, (now - tweenStart) / TWEEN_MS); cur = mix(from, to, ease(k)); if (k >= 1) tweenStart = -1; }
    gl.clearColor(0, 0, 0, 0); gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.res, canvas.width, canvas.height); gl.uniform1f(U.t, calm ? 40 : (now - t0) / 1000 + 40);
    gl.uniform3f(U.c1, cur.ga[0] / 255, cur.ga[1] / 255, cur.ga[2] / 255); gl.uniform3f(U.c2, cur.gb[0] / 255, cur.gb[1] / 255, cur.gb[2] / 255);
    gl.uniform2f(U.p1, cur.ax / 100, 1 - cur.ay / 100); gl.uniform2f(U.p2, cur.bx / 100, 1 - cur.by / 100);
    gl.uniform1f(U.i, cur.gi);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  };

  let raf = 0, visible = true;
  const loop = (now: number) => {
    raf = 0;
    if (!visible || document.hidden || hero.classList.contains('is-leaving')) return; // sin gastar cuando no se ve
    draw(now);
    if (!calm) raf = requestAnimationFrame(loop);
  };
  const kick = () => { if (!raf) raf = requestAnimationFrame(loop); };
  new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) kick(); }).observe(hero);
  new MutationObserver(kick).observe(hero, { attributes: true, attributeFilter: ['class'] });
  document.addEventListener('visibilitychange', kick);
  new ResizeObserver(resize).observe(hero);
  t0 = performance.now();
  resize(); kick();
}
