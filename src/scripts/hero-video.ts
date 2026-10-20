// Reproductor del video de fondo del hero.
//
// Ciclo: aparece apenas termina de desplegarse el hero → se reproduce una vez → se desvanece → pausa → vuelve a aparecer.
// En cada aparición el video cambia de lugar, de escala, de giro y de velocidad (todo sutil), y mientras dura:
//   · su opacidad y su luminosidad suben a 100 % / brillo normal, se sostienen en el centro del clip y vuelven a bajar;
//   · deriva y gira lentamente con un movimiento irregular, y la viñeta lo acompaña y "respira".
//
// Marcado y estilos: src/components/HeroVideo.astro. Variables CSS que este módulo escribe en `.hero`:
//   --vx / --vy    centro de la ventana del video (%)        --vs / --vr   escala y giro iniciales
//   --vdx / --vdy  desplazamiento orgánico de la viñeta (px)  --vb          "respiración" de la viñeta
//   --fade         duración del fundido de entrada y de salida

/** Todo lo ajustable, en un solo lugar. */
const TUNING = {
  fadeMaxSeconds: 2.6,   // fundido de entrada y de salida (se acorta si el clip es muy breve)
  fadeShareOfClip: 0.35, // ...pero nunca más de esta fracción de lo que dura el clip
  heroReadyFallbackMs: 6000, // si el hero no avisa que terminó de desplegarse, arranca igual pasado este tiempo
  position: { xMin: 26, xRange: 48, yMin: 28, yRange: 38, minDistance: 24 }, // dónde puede aparecer (% del hero)
  scale: { min: 0.72, range: 0.28 },    // sólo reduce: nunca se amplía por encima de su resolución
  tiltDegrees: 9,                       // inclinación inicial: ± la mitad de este valor
  level: { dim: 0.3, dark: 'brightness(.28)', full: 1, normal: 'brightness(1)', peakFrom: 0.38, peakTo: 0.62 },
  drift: { min: 0.13, range: 0.14 },    // recorrido, como fracción de la dimensión menor de la pantalla
  turn: { min: 1.5, range: 2 },         // giro durante la reproducción (grados)
  wobble: { video: 0.018, vignette: 0.014, tilt: 0.45, breathing: 0.06 },
} as const;

type Config = { after: number; gap: number; baseRate: number; rateVariation: number };

let timers: number[] = [];
let raf = 0;

const readConfig = (video: HTMLVideoElement): Config => ({
  after: Number(video.dataset.after) || 0,        // ms entre que el hero termina de desplegarse y el arranque
  gap: Number(video.dataset.gap) || 10000,        // ms de negro entre reproducciones
  baseRate: Number(video.dataset.rate) || 1,      // velocidad base (1 = normal)
  rateVariation: Number(video.dataset.rateVar) || 0, // variación entre reapariciones (± sobre la base)
});

const rand = (min: number, range: number) => min + Math.random() * range;
const easeInOut = (p: number) => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
/** Oscilación irregular: tres senos de frecuencias relacionadas, para un flotar que no se repite de forma evidente. */
const wobble = (t: number, phases: number[], i: number, freq: number) =>
  Math.sin(t * freq + phases[i]) + 0.6 * Math.sin(t * freq * 1.67 + phases[i + 1]) + 0.35 * Math.sin(t * freq * 2.53 + phases[i + 2]);

const later = (fn: () => void, ms: number) => void timers.push(window.setTimeout(fn, ms));
const visible = () =>
  new Promise<void>((resolve) => {
    if (!document.hidden) return resolve();
    const check = () => { if (!document.hidden) { document.removeEventListener('visibilitychange', check); resolve(); } };
    document.addEventListener('visibilitychange', check);
  });

export function stopHeroVideo() {
  timers.forEach(clearTimeout);
  timers = [];
  cancelAnimationFrame(raf);
}

export function initHeroVideo() {
  const media = document.querySelector<HTMLElement>('.hero__media:not([data-ready])');
  const video = media?.querySelector<HTMLVideoElement>('video');
  const frame = media?.querySelector<HTMLElement>('.hero__frame');
  if (!media || !video || !frame) return;
  media.dataset.ready = '1';
  stopHeroVideo();

  // Sin movimiento reducido ni ahorro de datos
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || (navigator as any).connection?.saveData) return;

  const hero = media.closest<HTMLElement>('.hero') ?? media;
  const cfg = readConfig(video);
  let rate = cfg.baseRate;
  let fade = TUNING.fadeMaxSeconds;
  let last = { x: 50, y: 44 };
  let level: Animation | undefined;

  /** Velocidad de esta reproducción: levemente distinta de la anterior. */
  const pickRate = () => {
    let r = cfg.baseRate;
    for (let k = 0; k < 8; k++) {
      r = cfg.baseRate + (Math.random() * 2 - 1) * cfg.rateVariation;
      if (Math.abs(r - rate) > cfg.rateVariation * 0.5) break;
    }
    return Number(r.toFixed(3));
  };

  /** Elige dónde aparece (lejos de la vez anterior) y deja todo en reposo. Se hace mientras el video es invisible. */
  const place = () => {
    const p = TUNING.position;
    let x = 50, y = 44;
    for (let k = 0; k < 10; k++) {
      x = rand(p.xMin, p.xRange);
      y = rand(p.yMin, p.yRange);
      if (Math.hypot(x - last.x, (y - last.y) * 1.4) > p.minDistance) break;
    }
    last = { x, y };
    const set = (name: string, value: string) => hero.style.setProperty(name, value);
    set('--vx', `${x.toFixed(1)}%`);
    set('--vy', `${y.toFixed(1)}%`);
    set('--vs', rand(TUNING.scale.min, TUNING.scale.range).toFixed(2));
    set('--vr', `${((Math.random() - 0.5) * TUNING.tiltDegrees).toFixed(1)}deg`);
    set('--vdx', '0px'); set('--vdy', '0px'); set('--vb', '1');
    frame.style.translate = '0 0';
    frame.style.rotate = '0deg';
  };

  /** Opacidad y luminosidad: entra tenue y oscuro, llega al 100 % y al brillo normal en el centro, y vuelve a hundirse. */
  const animateLevel = (ms: number) => {
    const L = TUNING.level;
    level?.cancel();
    level = frame.animate(
      [
        { opacity: L.dim, filter: L.dark },
        { opacity: L.full, filter: L.normal, offset: L.peakFrom },
        { opacity: L.full, filter: L.normal, offset: L.peakTo },
        { opacity: L.dim, filter: L.dark },
      ],
      { duration: ms, easing: 'ease-in-out', fill: 'forwards' },
    );
  };

  /** Deriva y giro orgánicos de la ventana; la viñeta la sigue con retraso propio y respira. */
  const animateFloat = (ms: number) => {
    const m = Math.min(innerWidth, innerHeight);
    const W = TUNING.wobble;
    const angle = Math.random() * Math.PI * 2;
    const distance = m * rand(TUNING.drift.min, TUNING.drift.range);
    const turn = rand(TUNING.turn.min, TUNING.turn.range) * (Math.random() < 0.5 ? -1 : 1);
    const phases = Array.from({ length: 9 }, () => Math.random() * Math.PI * 2);
    const start = performance.now();

    cancelAnimationFrame(raf);
    const tick = (now: number) => {
      const t = (now - start) / 1000;
      const e = easeInOut(Math.min(1, (now - start) / ms));
      const dx = Math.cos(angle) * distance * e + m * W.video * wobble(t, phases, 0, 0.62);
      const dy = Math.sin(angle) * distance * e + m * W.video * wobble(t, phases, 3, 0.55);
      frame.style.translate = `${dx.toFixed(1)}px ${dy.toFixed(1)}px`;
      frame.style.rotate = `${(turn * e + W.tilt * Math.sin(t * 0.5 + phases[6])).toFixed(2)}deg`;

      const set = (name: string, value: string) => hero.style.setProperty(name, value);
      set('--vdx', `${(dx * 0.88 + m * W.vignette * Math.sin(t * 0.8 + phases[7])).toFixed(1)}px`);
      set('--vdy', `${(dy * 0.88 + m * W.vignette * Math.sin(t * 0.67 + phases[8])).toFixed(1)}px`);
      set('--vb', (1 + W.breathing * Math.sin(t * 0.9 + phases[0])).toFixed(3));

      if (now - start < ms + 3000) raf = requestAnimationFrame(tick); // sigue durante el fundido de salida
    };
    raf = requestAnimationFrame(tick);
  };

  const show = () => { media.classList.add('is-on'); hero.classList.add('has-video'); };
  const hide = () => { media.classList.remove('is-on'); hero.classList.remove('has-video'); };

  const load = () => {
    if (!video.src) { video.src = video.dataset.src!; video.load(); }
  };

  const play = async () => {
    load();
    await visible();
    if (video.readyState < 3) await new Promise<void>((res) => video.addEventListener('canplay', () => res(), { once: true }));

    video.currentTime = 0;
    rate = pickRate();
    video.playbackRate = rate;
    const clipMs = (video.duration / rate) * 1000;
    fade = Math.min(TUNING.fadeMaxSeconds, (clipMs / 1000) * TUNING.fadeShareOfClip);
    media.style.setProperty('--fade', `${fade}s`);
    hero.style.setProperty('--fade', `${fade}s`);
    place();

    try { await video.play(); } catch { return later(play, cfg.gap); } // si el navegador no lo permite, reintenta más tarde
    animateLevel(clipMs);
    animateFloat(clipMs);
    show();
  };

  // Empieza el fundido de salida un poco antes del final, y vuelve a empezar tras la pausa
  video.addEventListener('timeupdate', () => {
    if (video.duration && (video.duration - video.currentTime) / rate < fade) hide();
  });
  video.addEventListener('ended', () => { hide(); later(play, cfg.gap); });

  // Arranque: descarga enseguida y reproduce `after` ms después de que el hero termina de desplegarse
  load();
  let started = false;
  const go = () => { if (!started) { started = true; later(play, cfg.after); } };
  document.addEventListener('hero:ready', go, { once: true });
  later(go, TUNING.heroReadyFallbackMs);
}
