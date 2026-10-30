// Fondo de la Home: un patrón de Turing (ver turing-core.ts) en un canvas fijo a pantalla completa que replica la animación del laboratorio.
// Cuando el cursor se queda quieto, desde ese punto crece el patrón; al moverlo se disuelve y deja rastros; un clic siembra otro foco; con el
// cursor muy quieto en el hero, el patrón brilla un instante y se apaga. No actúa sobre el footer ni sobre enlaces y botones al hacer clic.
// Sólo existe en la Home: en el resto de las páginas está apagado. El preset sale de src/data/background.json (se guarda desde /lab/).
import { type TuringParams } from './turing-core';
import { initTuringDiffusion, type TuringControls } from './turing-diffusion';

export interface TuringBackground {
  setActive: (on: boolean) => void;     // encendido sólo en la Home
  setStillFade: (on: boolean) => void;  // brillo + apagado por cursor quieto: sólo con el hero principal a la vista
  setAuto: (on: boolean) => void;       // celular: sin cursor, la difusión se siembra sola en lugares al azar
}

const INTERACTIVE = 'a, button, input, textarea, select, [data-no-seed]';

export function initTuringBackground(canvas: HTMLCanvasElement, preset: Partial<TuringParams>): TuringBackground {
  const cursor: TuringControls | null = initTuringDiffusion(canvas, null, {
    target: window,
    params: preset,
    stillFade: false, // se activa con setStillFade
    ignore: (e) => {
      const t = e.target as Element | null;
      return !!t?.closest?.('footer') || (e.type === 'pointerdown' && !!t?.closest?.(INTERACTIVE));
    },
  });
  cursor?.enable(false);
  // Difusión automática (celular, sin cursor): cada 3,5–6 s cae un foco en un punto al azar de la parte visible del hero
  let autoTimer = 0;
  const drop = () => {
    const hero = document.querySelector<HTMLElement>('.hero');
    const r = hero?.getBoundingClientRect();
    const top = Math.max(0, r?.top ?? 0), bottom = Math.min(innerHeight, r?.bottom ?? innerHeight);
    if (bottom - top > 80) cursor?.scatter(innerWidth * (0.08 + Math.random() * 0.84), top + (bottom - top) * (0.1 + Math.random() * 0.8));
    autoTimer = window.setTimeout(drop, 3500 + Math.random() * 2500);
  };
  return {
    setAuto: (on) => { clearTimeout(autoTimer); autoTimer = 0; if (on && cursor) autoTimer = window.setTimeout(drop, 500); },
    setActive: (on) => cursor?.enable(on),
    setStillFade: (on) => cursor?.stillFade(on),
  };
}
