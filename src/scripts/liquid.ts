// Fondo de "líquido realista" para la portada de un proyecto: dos fluidos (los colores --ga y --gb de la portada) que se mezclan y se
// deslizan despacio sobre el negro, con luz, brillo suave y borde apenas más claro, como tinta o pintura líquida.
// Se dibuja en WebGL2 con ruido fractal deformado (domain warping), a media resolución. Si WebGL2 no está disponible, no hace nada
// (la portada conserva su fondo de luces suaves). Los colores y las posiciones se leen de las variables CSS de la portada, así que el
// widget de color de Colorada los cambia en vivo, con transición.

type Rgb = [number, number, number];
type State = { ga: Rgb; gb: Rgb; ax: number; ay: number; bx: number; by: number; gi: number };

const TWEEN_MS = 1400;
const SCALE = 0.5;          // resolución del dibujo respecto de la pantalla
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

  // Superficie suave: la normal sale de cómo cambia la altura (diferencias finitas); da la luz y el brillo del líquido
  float e = .012;
  vec3 n = normalize(vec3((h - field(p + vec2(e, 0.), t)) / e * .11, (h - field(p + vec2(0., e), t)) / e * .11, 1.));
  vec3 L = normalize(vec3(-.45, .6, .7));
  float diff = clamp(dot(n, L), 0., 1.);
  float spec = pow(clamp(dot(reflect(-L, n), vec3(0., 0., 1.)), 0., 1.), 28.);

  // Dos tonos: cada uno domina cerca de su luz; entre medio se mezclan según el flujo
  float w1 = exp(-pow(distance(uv, uP1) * 1.6, 2.)), w2 = exp(-pow(distance(uv, uP2) * 1.6, 2.));
  float k = clamp(w2 / (w1 + w2 + 1e-4) + (h - .5) * .9, 0., 1.);
  vec3 base = mix(uC1, uC2, smoothstep(.15, .85, k));

  // Cuánto líquido hay: el resto es el negro del fondo (sobre la mitad de la pantalla queda negro)
  float cov = smoothstep(.40, .52, h + (w1 + w2) * .1);
  float rim = smoothstep(.40, .45, h) - smoothstep(.45, .54, h);  // borde apenas más claro, como la tensión de la superficie

  vec3 col = base * (.6 + .8 * diff) + vec3(1., .93, .9) * spec * .18 + base * rim * .4;
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
