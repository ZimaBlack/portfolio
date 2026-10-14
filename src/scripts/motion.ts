import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const reduce = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
let ctx: gsap.Context | undefined;
let cursorCleanup: (() => void) | undefined;
let logoPlayed = false; // la intro sólo corre en la primera carga de la sesión de navegación

/** Aparición del logo: las letras suben en cascada y la barra se dibuja. */
function initLogo(still: boolean) {
  document.querySelectorAll<SVGSVGElement>('[data-logo]').forEach((svg) => {
    if (logoPlayed || still) return void svg.classList.add('is-ready');
    const letters = svg.querySelectorAll('.l');
    const bar = svg.querySelector('.bar');
    gsap.set([...letters, bar], { opacity: 0 });
    svg.classList.add('is-ready');
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.15,
      onComplete: () => { gsap.set([...letters, bar], { clearProps: 'all' }); } });
    tl.fromTo(letters, { opacity: 0, y: 28, scaleY: 1.25 },
      { opacity: 1, y: 0, scaleY: 1, duration: 1.1, stagger: 0.09 })
      .fromTo(bar, { opacity: 0, scaleX: 0 }, { opacity: 0.22, scaleX: 1, duration: 0.9, transformOrigin: '0% 50%' }, '-=0.5');
    logoPlayed = true;
  });
}

/** Divide un titular en palabras enmascaradas por línea, respetando <br>/<em>. */
function splitWords(el: HTMLElement) {
  if (el.dataset.split) return el.querySelectorAll<HTMLElement>('.split-word');
  el.dataset.split = '1';
  el.setAttribute('aria-label', el.textContent?.replace(/\s+/g, ' ').trim() ?? '');
  const walk = (node: Node): Node => {
    if (node.nodeType === Node.TEXT_NODE) {
      const frag = document.createDocumentFragment();
      (node.textContent ?? '').split(/(\s+)/).forEach((part) => {
        if (!part) return;
        if (/^\s+$/.test(part)) return void frag.append(' ');
        const mask = document.createElement('span');
        mask.className = 'split-line';
        mask.setAttribute('aria-hidden', 'true');
        mask.style.display = 'inline-block';
        const w = document.createElement('span');
        w.className = 'split-word';
        w.textContent = part;
        mask.append(w);
        frag.append(mask);
      });
      return frag;
    }
    const clone = node.cloneNode(false);
    node.childNodes.forEach((c) => clone.appendChild(walk(c)));
    return clone;
  };
  const out = document.createDocumentFragment();
  el.childNodes.forEach((c) => out.appendChild(walk(c)));
  el.replaceChildren(out);
  return el.querySelectorAll<HTMLElement>('.split-word');
}

function initCursor() {
  if (!matchMedia('(hover: hover) and (pointer: fine)').matches || reduce()) return;
  const cur = document.createElement('div');
  cur.className = 'cursor';
  cur.innerHTML = '<span>Ver</span>';
  document.body.append(cur);
  const x = gsap.quickTo(cur, 'x', { duration: 0.5, ease: 'power3' });
  const y = gsap.quickTo(cur, 'y', { duration: 0.5, ease: 'power3' });
  const move = (e: MouseEvent) => { x(e.clientX); y(e.clientY); };
  const over = (e: Event) => {
    const t = (e.target as HTMLElement).closest('[data-cursor]');
    cur.classList.toggle('is-on', !!t);
    if (t) cur.firstElementChild!.textContent = (t as HTMLElement).dataset.cursor!;
  };
  addEventListener('mousemove', move);
  document.addEventListener('mouseover', over);
  cursorCleanup = () => {
    removeEventListener('mousemove', move);
    document.removeEventListener('mouseover', over);
    cur.remove();
  };
}

function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: (s) => {
      const down = s.direction === 1 && s.scroll() > 140;
      header.classList.toggle('is-hidden', down);
      header.classList.toggle('is-solid', s.scroll() > 40);
    },
  });
}

export function initMotion() {
  teardown();
  document.documentElement.classList.add('js');
  const still = reduce();

  ctx = gsap.context(() => {
    // Entrada del hero
    const hero = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 });
    document.querySelectorAll<HTMLElement>('[data-hero-title]').forEach((t) => {
      const words = splitWords(t);
      gsap.set(t, { opacity: 1 });
      if (!still) hero.from(words, { yPercent: 115, rotate: 3, duration: 1.4, stagger: 0.07 }, 0);
    });
    const heroItems = gsap.utils.toArray<HTMLElement>('[data-hero]');
    if (!still) hero.fromTo(heroItems, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1.1, stagger: 0.12 }, 0.5);
    else gsap.set(heroItems, { opacity: 1 });

    initLogo(still);
    if (still) { initHeader(); return; }

    // Reveal al scroll
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 88%', once: true,
      onEnter: (els) => gsap.to(els, { opacity: 1, y: 0, duration: 1.2, ease: 'expo.out', stagger: 0.1 }),
    });

    // Titulares de sección
    gsap.utils.toArray<HTMLElement>('[data-split-scroll]').forEach((t) => {
      const words = splitWords(t);
      gsap.from(words, { yPercent: 115, duration: 1.2, ease: 'expo.out', stagger: 0.05,
        scrollTrigger: { trigger: t, start: 'top 85%', once: true } });
    });

    // Parallax suave en imágenes
    gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
      const amt = parseFloat(el.dataset.parallax || '8');
      gsap.fromTo(el, { yPercent: -amt }, { yPercent: amt, ease: 'none',
        scrollTrigger: { trigger: el.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } });
    });

    // Líneas que se dibujan
    gsap.utils.toArray<HTMLElement>('[data-line]').forEach((l) => {
      gsap.from(l, { scaleX: 0, transformOrigin: 'left', duration: 1.4, ease: 'expo.out',
        scrollTrigger: { trigger: l, start: 'top 92%', once: true } });
    });

    initHeader();
  });

  initCursor();
  requestAnimationFrame(() => ScrollTrigger.refresh());
}

export function teardown() {
  ctx?.revert();
  ctx = undefined;
  cursorCleanup?.();
  cursorCleanup = undefined;
  ScrollTrigger.getAll().forEach((s) => s.kill());
}
