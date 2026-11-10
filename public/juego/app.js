import {
  DICE, SKILLS, PRIZES, MAX_DICE_PER_ROLL, MAX_ROLLS, ROUND_SIDES, SWAP_PRICE,
  createRun, rollRound, startRound, roll, stand, useSkill, next, choosePrize, pickSkill, rescues, lotSums,
  toShop, buyHeal, startSwap, swapFrom, swapTo, cancelSwap, leaveShop, healPrice, sum,
} from './game.js';

const app = document.getElementById('app');
const KEY_RUN = 'dados-run';
const KEY_BEST = 'dados-best';
const rng = (sides) => 1 + Math.floor(Math.random() * sides);
const fixed = (values) => { const q = values.slice(); return () => q.shift(); }; // los valores que salieron en la mesa

let rolling = false;
let spinning = null; // { values } mientras giran los rodillos: los números ya salieron, el giro es solo la animación
const SPIN_MS = (n) => 1900 + 90 * n;
let viewLot = null; // tirada que muestran los rodillos (null = la última)

const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* sin almacenamiento */ } };

let run = read(KEY_RUN); // la partida se guarda: si cierras la app, sigues donde estabas
if (run && run.round === undefined) run = null; // partida de una versión anterior (sin rondas): se descarta
let best = read(KEY_BEST) || 0;
let setup = { die: null }; // pantalla de inicio: dado elegido
let count = 3; // dados a tirar
let lastTotal = 0; // suma que mostró la barra en el render anterior (para animar el relleno)
let prevTotal = 0; // suma desde la que arranca la animación del relleno
let drained = null; // cofre perdido cuya barra ya se vació
let pending = null; // habilidad elegida, a la espera de tocar un dado
let tour = null; // tour guiado abierto desde el botón ?: { steps, i }
let autoNext = false; // pasando solo del cofre abierto a sus premios
let fxToken = null; // última animación del cofre ya reproducida

const save = () => { write(KEY_RUN, run); if (run && run.cleared > best) { best = run.cleared; write(KEY_BEST, best); } };
const btn = (label, act, o = {}) => `<button class="${o.cls || ''}" data-act="${act}" ${o.data || ''} ${o.disabled ? 'disabled' : ''}>${label}</button>`;
const hearts = (r) => Array.from({ length: Math.max(r.maxLives, r.lives) }, (_, i) => (i < r.lives ? '♥' : '<span class="off">♥</span>')).join('');
const pad2 = (n) => String(n).padStart(2, '0');

// ---- Cofre de píxeles (cerrado y abierto) y su animación ---------------------------------------
const CHEST_CLOSED = [
  '..oooooooooo..',
  '.oGWWWWWWWWGo.',
  '.oGDDDDDDDDGo.',
  '.oGWWWWWWWWGo.',
  '.oGDDDDDDDDGo.',
  'oggggggggggggo',
  'oGGGGgKKgGGGGo',
  '.oGWWgKKgWWGo.',
  '.oGDDDDDDDDGo.',
  '.oGWWWWWWWWGo.',
  '.oGDDDDDDDDGo.',
  '.oGGGGGGGGGGo.',
  '..oooooooooo..',
];
const CHEST_OPEN = [
  '..oooooooooo..',
  '.oGWWWWWWWWGo.',
  '.oGDDDDDDDDGo.',
  'oggggggggggggo',
  'ouuuuuuuuuuuuo',
  'ouuyyuuyyuuyuo',
  'oyyyyyyyyyyyyo',
  '.oGWWWWWWWWGo.',
  '.oGDDDDDDDDGo.',
  '.oGWWgKKgWWGo.',
  '.oGDDDDDDDDGo.',
  '.oGGGGGGGGGGo.',
  '..oooooooooo..',
];
const CHEST_MAW = [
  '..oooooooooo..',
  '.oGWWWWWWWWGo.',
  '.oGDuDDDDuDGo.',
  'oggggggggggggo',
  'oTRTRTRTRTRTRo',
  'oRrrrrrrrrrrRo',
  'oRrrRRRRRRrrRo',
  'orrRRRRRRRRrro',
  'oTrTrTrTrTrTro',
  '.oGWWgKKgWWGo.',
  '.oGDDDDDDDDGo.',
  '.oGGGGGGGGGGo.',
  '..oooooooooo..',
];
const GOLD_COLORS = { W: '#ffe066', D: '#e0a82e', K: '#8a5a12', G: '#c9811c', g: '#fffbe0' };
const COLORS = { T: '#f4f0e6', R: '#c63a44', r: '#6e1822', o: '#241a2e', G: '#d9a93a', g: '#f5e27e', W: '#a56a4d', D: '#6c3f2e', K: '#3b2218', u: '#fff2a8', y: '#f2b632' };
function spriteSvg(grid, gold) {
  const pal = gold ? { ...COLORS, ...GOLD_COLORS } : COLORS;
  const rects = grid.flatMap((row, y) => [...row].map((c, x) => (c === '.' ? '' : `<rect x="${x}" y="${y}" width="1" height="1" fill="${pal[c]}"/>`))).join('');
  return `<svg class="chest" viewBox="0 0 14 13" shape-rendering="crispEdges" aria-hidden="true">${rects}</svg>`;
}
/**
 * El cofre: cerrado mientras juegas, se abre con un destello si lo superas y se carboniza y desaparece si lo pierdes.
 * Cada animación suena una sola vez; si la pantalla se redibuja, el cofre se queda como quedó.
 */
function chestHtml(r) {
  const play = r.phase === 'play';
  const type = play ? (r.kinds && r.kinds[r.done]) || 'normal' : r.kind || 'normal'; // normal · gold · mimic
  // El mímico es un cofre normal hasta la primera tirada: ahí le salen dientes y abre la fauce.
  const maw = type === 'mimic' && ((play && r.rolls >= 1) || !play);
  const kind = r.phase === 'result' ? (r.result.ok ? 'open' : 'burn') : r.phase === 'prize' ? 'open' : 'closed';
  let token = kind === 'open' ? `${r.round}-open-${r.done + (r.phase === 'result' ? 1 : 0)}` : kind === 'burn' ? `${r.round}-burn-${r.done}` : `${r.round}-closed-${r.done}-${r.cleared}`;
  if (kind === 'closed' && maw) token = `${r.round}-maw-${r.done}`;
  const fresh = token !== fxToken;
  fxToken = token;
  const sparks = kind === 'open' ? '<i class="sp s1"></i><i class="sp s2"></i><i class="sp s3"></i><i class="sp s4"></i>' : kind === 'burn' ? '<i class="em e1"></i><i class="em e2"></i><i class="em e3"></i>' : '';
  const grid = kind === 'open' ? CHEST_OPEN : maw ? CHEST_MAW : CHEST_CLOSED;
  return `<div class="chestbox ${kind} ${type} ${maw && kind === 'closed' ? 'maw' : ''} ${fresh ? 'play' : 'still'}">${spriteSvg(grid, type === 'gold')}${sparks}</div>`;
}

// ---- Rodillos: como un candado de combinación, en píxeles. Solo giran los que están activos ------------
/** Un rodillo: ventana de 3 casillas (anterior, valor, siguiente). Con `spin` baja una tira de números al azar hasta el valor. */
function reelHtml(i, v, sides, cls, spin, idx = null, off = false) {
  const prev = v == null ? null : v === 1 ? sides : v - 1;
  const nextV = v == null ? null : v === sides ? 1 : v + 1;
  let cells = [prev, v, nextV];
  if (spin) cells = [...Array.from({ length: 14 }, () => rng(sides)), prev, v, nextV];
  const tag = idx == null ? 'div' : 'button';
  const attrs = idx == null ? '' : `data-act="pickdie" data-i="${idx}" ${off ? 'disabled' : ''}`;
  return `<${tag} class="reel ${cls} ${spin ? 'spin' : ''} ${sides > 9 ? 'wide' : ''}" style="--i:${i}" ${attrs}><div class="strip">${cells.map((x) => `<b>${x ?? '·'}</b>`).join('')}</div></${tag}>`;
}
/** Fila de rodillos: `vals` son los valores de los activos; el resto queda apagado (poca opacidad). `pick(i)` → {idx, ok}: dados que se pueden tocar. */
function reelsHtml(sides, slots, vals, active, spin, pick) {
  return `<div class="reels" aria-label="Dados">${Array.from({ length: slots }, (_, i) => {
    const on = i < active;
    const v = on ? vals[i] ?? null : null;
    const t = on && v != null && pick ? pick(i) : null;
    const cls = (on ? (v == null ? 'armed' : 'on') : 'off') + (t ? (t.target ? ' pick' : t.idle ? '' : ' nope') : '');
    return reelHtml(i, v, sides, cls, spin && on, t ? t.idx : null, t ? !t.target : false);
  }).join('')}</div>`;
}
/** Rango (desde, cantidad) de la tirada k dentro de `r.dice`. */
function lotRange(r, k) {
  const sizes = r.lots ?? (r.dice.length ? [r.dice.length] : []);
  let from = 0;
  for (let i = 0; i < k; i++) from += sizes[i];
  return [from, Math.max(0, Math.min(sizes[k] ?? 0, r.dice.length - from))];
}
function gameReels(r, pick) {
  if (spinning) return reelsHtml(r.sides, MAX_DICE_PER_ROLL, spinning.values, spinning.values.length, true);
  const sizes = r.lots ?? (r.dice.length ? [r.dice.length] : []);
  if (!sizes.length || !r.dice.length) return reelsHtml(r.sides, MAX_DICE_PER_ROLL, [], count, false);
  const k = viewLot != null && viewLot < sizes.length ? viewLot : sizes.length - 1;
  const [from, n] = lotRange(r, k);
  return reelsHtml(r.sides, MAX_DICE_PER_ROLL, r.dice.slice(from, from + n), n, false, pick && ((i) => pick(from + i)));
}

// ---- Cabecera: vidas y oro a la izquierda; cofres de la ronda a la derecha -----------------------
const COIN = '<svg class="coin" viewBox="0 0 7 7" shape-rendering="crispEdges" aria-hidden="true"><path fill="#241a2e" d="M2 0h3v1h1v1h1v3h-1v1h-1v1h-3v-1h-1v-1h-1v-3h1v-1h1z"/><path fill="#f2b632" d="M2 1h3v1h1v3h-1v1h-3v-1h-1v-3h1z"/><path fill="#fff2a8" d="M2 2h1v1h-1zM3 1h2v1h-2z"/></svg>';
function headerHtml(r, right) {
  const cost = r.round > 0 && r.cost ? `<span class="cost" title="Valor del contrato: lo que pagas al terminar la ronda">/ ${r.cost}</span>` : '';
  return `<header><span class="hud"><span class="lives">${hearts(r)}</span><span class="gold" title="Oro">${COIN}${r.gold}${cost}</span></span>${right ?? ''}</header>`;
}
function dotsHtml(r) {
  const here = r.phase === 'play' || r.phase === 'result';
  const dots = Array.from({ length: r.chests }, (_, i) => `<i class="${i < r.done ? 'on' : here && i === r.done ? 'now' : ''}"></i>`).join('');
  return `<span class="chests ${r.chests > 8 ? 'many' : ''}" aria-label="Cofres de la ronda: ${r.done} de ${r.chests}"><small>COFRES</small>${dots}</span>`;
}

/** Barra de la meta: zona buena en verde, el pasarse en rojo y la suma como relleno; triángulos marcan la zona y la meta. */
function barHtml(r) {
  const lo = r.target - r.tolerance;
  const max = r.target + 3;
  const total = sum(r.dice);
  const pct = (x) => `${(Math.min(x, max) / max * 100).toFixed(2)}%`;
  const state = total > r.target ? 'bust' : total >= lo ? 'in' : '';
  const grow = total !== lastTotal; // el relleno crece desde la suma anterior (empieza cuando los dados ya están quietos)
  // Cofre perdido por pasarte: el relleno sube, titila en rojo y se vacía. Solo se anima la primera vez que se dibuja;
  // si la pantalla se redibuja después (por ejemplo al abrir la ayuda), la barra se queda vacía.
  let drain = '';
  if (r.phase === 'result' && r.result && r.result.bust) {
    const token = `${r.cleared}-${r.lives}-${r.dice.join(',')}`;
    drain = token === drained ? 'empty' : 'lost';
    drained = token;
  }
  prevTotal = lastTotal;
  lastTotal = drain ? 0 : total; // tras vaciarse, el siguiente cofre empieza desde cero
  return `<div class="meter" aria-label="Zona buena entre ${lo} y ${r.target}">
      <div class="track">
        <i class="zone" style="left:${pct(lo)};width:${(r.tolerance / max * 100).toFixed(2)}%"></i>
        <i class="over" style="left:${pct(r.target)};right:0"></i>
        <i class="fill ${state} ${grow ? 'grow' : ''} ${drain}" style="width:${pct(total)};--from:${pct(prevTotal)}"></i>
        <i class="goalline" style="left:${pct(r.target)}"></i>
      </div>
      <div class="ticks"><span class="z" style="left:${pct(lo)}">▲</span><span class="g" style="left:${pct(r.target)}">▲</span></div>
    </div>`;
}

/** Una casilla de suma por cada tirada disponible del cofre: 00 mientras falta por hacer. */
function lotsHtml(r, changed, hasTarget) {
  const sums = lotSums(r);
  const shown = viewLot != null && viewLot < sums.length ? viewLot : sums.length - 1;
  const boxes = Array.from({ length: MAX_ROLLS }, (_, i) => {
    const done = i < sums.length;
    const cls = done ? `done ${i === sums.length - 1 ? 'last' : ''} ${i === sums.length - 1 && changed ? 'pop' : ''}` : 'todo';
    const view = done && i === shown && sums.length > 1 ? 'view' : '';
    const mark = done && hasTarget && hasTarget(i) ? 'has' : '';
    return `<div class="lot ${cls} ${view} ${mark}" ${done ? `data-act="viewlot" data-i="${i}"` : ''}><b>${done ? pad2(sums[i]) : '00'}</b></div>`;
  });
  return `<div class="lots" aria-label="Suma de cada tirada">${boxes.join('')}</div>`;
}

// ---- Pantallas ------------------------------------------------------------------------------------
function screenStart() {
  if (!setup.die) {
    return `<header><span>Dados</span><span class="dim">Mejor: ${best}</span></header>
      <main><h1>Elige un dado</h1><div class="opts">${Object.entries(DICE).map(([k, d]) => btn(`${k.toUpperCase()}<small>${d.lives} vidas</small>`, 'die', { data: `data-k="${k}"` })).join('')}</div></main><footer></footer>`;
  }
  return `<header><span>${setup.die.toUpperCase()}</span><span class="dim">Mejor: ${best}</span></header>
    <main><h1>Elige una habilidad</h1><div class="opts">${Object.entries(SKILLS).map(([k, s]) => btn(`${s.name}<small>${s.text}</small>`, 'skill0', { data: `data-k="${k}"` })).join('')}</div></main>
    <footer>${btn('Atrás', 'back')}</footer>`;
}

/** El d12 de la ronda: cuántos cofres tiene y cuánto cuesta. */
function screenRound() {
  const r = run;
  const ready = r.phase === 'roundready';
  const n = ready ? r.round : r.round + 1;
  const result = ready
    ? `<div class="roundinfo"><div><b>${r.chests}</b><small>cofres</small></div><div><b>${r.cost}</b><small>oro de costo</small></div></div>`
    : '';
  return `${headerHtml(r, `<span class="round">Ronda ${n}</span>`)}
    <main><h1>Ronda ${n}</h1>${result}<div class="slot" id="slot">${spinning ? reelsHtml(ROUND_SIDES, 1, spinning.values, 1, true) : reelsHtml(ROUND_SIDES, 1, ready ? [r.d12] : [], 1, false)}</div></main>
    <footer class="gamefoot">${ready ? btn('Empezar ronda', 'startround', { cls: 'primary' }) : btn('Tirar d12', 'rollround', { cls: 'primary' })}</footer>`;
}

function screenGame() {
  const r = run;
  const total = sum(r.dice);
  const play = r.phase === 'play';
  const res = r.result;
  const over = play && total > r.target;
  // El juego registra qué habilidades disponibles pueden salvar el cofre y sobre qué dados (si te has pasado).
  const fix = over ? rescues(r) : [];
  const saving = [...new Set(fix.map((f) => f.skill))];
  const msg = res
    ? res.ok ? '¡Bien!' : res.bust ? 'Te pasaste' : 'Quedaste corto'
    : pending && play ? 'Toca un dado'
    : over ? (saving.length ? `Te pasaste. Puede salvarte: ${saving.map((id) => SKILLS[id].name).join(', ')}` : 'Te pasaste') : '';
  const valid = (i) => !over || fix.some((f) => f.skill === pending && f.index === i);
  // Los rodillos son los dados: con una habilidad elegida, se tocan los que sirven. Las tiradas se cambian tocando su suma.
  const pick = (i) => ({ idx: i, target: !!(pending && play && valid(i)), idle: !pending });
  const hasTarget = (k) => { if (!pending || !play) return false; const [from, n] = lotRange(r, k); return Array.from({ length: n }, (_, j) => from + j).some(valid); };
  const canUse = (k) => play && !k.used && r.dice.length && (!over || saving.includes(k.id));
  const skills = r.skills.map((k) => `<button class="${pending === k.id ? 'sel' : ''} ${over && saving.includes(k.id) ? 'can' : ''}" data-act="useskill" data-k="${k.id}" ${canUse(k) ? '' : 'disabled'} title="${SKILLS[k.id].text}">${SKILLS[k.id].name}</button>`).join('');
  let foot;
  if (play) {
    foot = `<div class="skills">${skills}</div>
      <div class="row"><div class="stepper"><button data-act="dec" aria-label="Menos">−</button><b>${count}</b><button data-act="inc" aria-label="Más">+</button></div>
      ${btn(`Tirar ${count}`, 'roll', { cls: 'primary', disabled: r.rolls >= MAX_ROLLS || over })}</div>
      ${btn(over ? 'Rendirse' : 'Plantarse', 'stand', { disabled: !r.dice.length })}`;
  } else {
    foot = btn(r.lives <= 0 ? 'Terminar' : 'Siguiente', 'next', { cls: 'primary' });
  }
  return `${headerHtml(r, dotsHtml(r))}
    <main class="${res ? (res.ok ? 'ok' : 'bad') : ''}">
      <div class="goal"><div><small>Meta</small><b class="t">${r.target}</b></div></div>
      ${chestHtml(r)}
      ${lotsHtml(r, total !== lastTotal, hasTarget)}
      ${barHtml(r)}
      <div class="slot" id="slot">${gameReels(r, pick)}</div>
      <div class="msg ${res ? (res.ok ? 'good late' : 'bad late') : over ? 'bad' : 'dim'}">${msg}</div>
    </main><footer class="gamefoot">${foot}</footer>`;
}

/** El cofre se abre y ahí mismo eliges uno de los dos premios (según la ruta de dificultad). */
function screenPrize() {
  const r = run;
  const icon = { gold5: '●', gold10: '●●', gold20: '●●●', life: '♥', skill: '✦' };
  return `${headerHtml(r, dotsHtml(r))}
    <main><div class="goal"><div><small>Meta</small><b class="t">${r.target}</b></div></div>
      ${chestHtml(r)}
      ${r.both ? '<p class="good">¡Meta exacta! Te llevas los dos</p>' : ''}
      <div class="opts prizes">${r.prize.map((k, i) => btn(`<span class="pi ${k}">${icon[k]}</span><span class="pt"><b>${PRIZES[k].name}</b><small>${PRIZES[k].text}</small></span>`, r.both ? 'both' : 'prize', { cls: 'prizebtn' + (r.both ? ' got' : ''), data: `data-i="${i}"` })).join('')}</div>
    </main><footer></footer>`;
}

function screenPick() {
  return `${headerHtml(run, dotsHtml(run))}
    <main><h1>Habilidad nueva</h1><div class="opts">${run.offer.map((k) => btn(`${SKILLS[k].name}<small>${SKILLS[k].text}</small>`, 'pick', { data: `data-k="${k}"` })).join('')}</div></main><footer></footer>`;
}

function screenRoundEnd() {
  const r = run;
  const p = r.paid;
  return `${headerHtml(r, `<span class="round">Ronda ${r.round}</span>`)}
    <main><h1>Ronda ${r.round} terminada</h1>
      <div class="roundinfo"><div><b>${r.chests}</b><small>cofres</small></div><div><b>${p.cost}</b><small>oro de costo</small></div></div>
      <p class="${p.ok ? 'good' : 'bad'}">${p.ok ? `Pagaste ${p.cost} de oro.` : `No te alcanzó el oro (tenías ${p.had}): pierdes 1 vida.`}</p>
    </main><footer>${btn('Ir a la tienda', 'toshop', { cls: 'primary' })}</footer>`;
}

function screenShop() {
  const r = run;
  const have = new Set(r.skills.map((k) => k.id));
  const skillBtn = (id, act) => btn(`${SKILLS[id].name}<small>${SKILLS[id].text}</small>`, act, { data: `data-k="${id}"` });
  let body;
  if (r.shopStep === 'from') {
    body = `<h1>¿Qué habilidad entregas?</h1><div class="opts">${r.skills.map((k) => skillBtn(k.id, 'swapfrom')).join('')}</div>`;
  } else if (r.shopStep === 'to') {
    body = `<h1>¿Cuál quieres recibir?</h1><div class="opts">${Object.keys(SKILLS).filter((id) => !have.has(id)).map((id) => skillBtn(id, 'swapto')).join('')}</div>`;
  } else {
    const price = healPrice(r);
    body = `<h1>Tienda</h1><p class="dim">Tienes ${r.gold} de oro</p><div class="opts">
      ${btn(`<span class="pi life">♥</span><span class="pt"><b>Recuperar todas las vidas</b><small>${price ? `${price} de oro` : 'ya las tienes todas'}</small></span>`, 'heal', { cls: 'prizebtn', disabled: !price || r.gold < price })}
      ${btn(`<span class="pi skill">✦</span><span class="pt"><b>Cambiar una habilidad por otra</b><small>${SWAP_PRICE} de oro</small></span>`, 'swap', { cls: 'prizebtn', disabled: r.gold < SWAP_PRICE })}
    </div>`;
  }
  const foot = r.shopStep ? btn('Cancelar', 'swapcancel') : btn('Siguiente ronda', 'leaveshop', { cls: 'primary' });
  return `${headerHtml(r, `<span class="round">Ronda ${r.round}</span>`)}<main>${body}</main><footer>${foot}</footer>`;
}

function screenOver() {
  return `<header><span class="lives"></span><span class="dim">Mejor: ${best}</span></header>
    <main><h1>Fin</h1><div class="roundinfo"><div><b>${run.cleared}</b><small>cofres</small></div><div><b>${run.round}</b><small>rondas</small></div></div></main>
    <footer>${btn('Jugar otra vez', 'again', { cls: 'primary' })}</footer>`;
}

function render() {
  const ph = run && run.phase;
  const screen = !run ? screenStart()
    : ph === 'roundroll' || ph === 'roundready' ? screenRound()
    : ph === 'play' || ph === 'result' ? screenGame()
    : ph === 'prize' ? screenPrize()
    : ph === 'pick' ? screenPick()
    : ph === 'roundend' ? screenRoundEnd()
    : ph === 'shop' ? screenShop()
    : screenOver();
  app.innerHTML = screen;
  app.classList.toggle('busy', rolling);
  // Botón de ayuda siempre a mano: abre un tour por la pantalla actual.
  app.querySelector('header')?.insertAdjacentHTML('beforeend', '<button class="help-btn" data-act="help" aria-label="Ayuda">?</button>');
  // Cofre superado: se abre con su destello y ahí mismo salen los dos premios.
  if (run && run.phase === 'result' && run.result.ok && !autoNext) {
    autoNext = true;
    setTimeout(() => { if (run && run.phase === 'result' && run.result.ok) { run = next(run, rng); save(); render(); } autoNext = false; }, 1100);
  }
}

const act = {
  die: (el) => { setup.die = el.dataset.k; },
  back: () => { setup.die = null; },
  skill0: (el) => { run = createRun(setup.die, el.dataset.k); setup.die = null; pending = null; save(); },
  rollround: async () => {
    rolling = true;
    render();
    const values = [rng(ROUND_SIDES)];
    spinning = { values };
    render();
    await new Promise((res) => setTimeout(res, SPIN_MS(1)));
    spinning = null;
    rolling = false;
    run = rollRound(run, fixed(values));
    save();
  },
  startround: () => { viewLot = null; run = startRound(run); pending = null; count = 3; save(); },
  inc: () => { count = Math.min(MAX_DICE_PER_ROLL, count + 1); },
  dec: () => { count = Math.max(1, count - 1); },
  roll: async () => {
    rolling = true;
    render();
    viewLot = null;
    const values = Array.from({ length: count }, () => rng(run.sides));
    spinning = { values };
    render();
    await new Promise((res) => setTimeout(res, SPIN_MS(count)));
    spinning = null;
    rolling = false;
    run = roll(run, count, fixed(values));
    pending = null;
    save();
  },
  viewlot: (el) => { viewLot = Number(el.dataset.i); },
  stand: () => { run = stand(run); pending = null; save(); },
  useskill: (el) => { pending = pending === el.dataset.k ? null : el.dataset.k; },
  pickdie: (el) => {
    const id = pending;
    pending = null;
    run = useSkill(run, id, Number(el.dataset.i), rng);
    save();
  },
  next: () => { viewLot = null; run = next(run, rng); pending = null; save(); },
  both: () => { run = choosePrize(run, 'both'); save(); },
  prize: (el) => { run = choosePrize(run, Number(el.dataset.i)); save(); },
  pick: (el) => { run = pickSkill(run, el.dataset.k); save(); },
  toshop: () => { run = toShop(run); save(); },
  heal: () => { run = buyHeal(run); save(); },
  swap: () => { run = startSwap(run); save(); },
  swapfrom: (el) => { run = swapFrom(run, el.dataset.k); save(); },
  swapto: (el) => { run = swapTo(run, el.dataset.k); save(); },
  swapcancel: () => { run = cancelSwap(run); save(); },
  leaveshop: () => { run = leaveShop(run); save(); },
  again: () => { run = null; write(KEY_RUN, null); },
  help: () => startTour(),
};

app.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-act]');
  if (!el || el.disabled || rolling || tour) return;
  try { await act[el.dataset.act](el); } catch (err) { rolling = false; console.warn(err); }
  render();
});

// ---- Tour guiado: el botón ? resalta cada parte de la pantalla actual con una explicación corta ----
function tourSteps() {
  const ph = run && run.phase;
  const S = (sel, title, text) => ({ sel, title, text });
  if (!run) return setup.die
    ? [S('.opts', 'Habilidad', 'Elige tu primera habilidad. Se usa una vez por cofre.')]
    : [S('.opts', 'Dado', 'Cada dado tiene más o menos vidas. Los dados grandes suman más rápido.')];
  if (ph === 'roundroll' || ph === 'roundready') return [
    S('.hud', 'Vidas y oro', 'Tus vidas (♥) y tu oro. Sin vidas, se acaba la partida.'),
    S('#slot', 'El d12', 'Al empezar cada ronda tiras un d12: son los cofres de la ronda.'),
    S('.roundinfo', 'Cofres y costo', 'Cada ronda tiene un costo en oro que pagas al terminarla. Si no te alcanza, pierdes una vida.'),
    S('.gamefoot button', 'Seguir', 'Tira el d12 y luego empieza la ronda.'),
  ];
  if (ph === 'prize') return [
    S('.chestbox', 'Cofre abierto', '¡Lo superaste!'),
    S('.prizes', 'Premios', 'Elige uno de los dos: oro, una vida o una habilidad nueva. Con la meta exacta te llevas los dos.'),
  ];
  if (ph === 'pick') return [S('.opts', 'Habilidad nueva', 'Elige la habilidad que te quedas.')];
  if (ph === 'roundend') return [S('.roundinfo', 'Fin de ronda', 'Pagaste el costo de la ronda con tu oro.'), S('footer button', 'Tienda', 'Entre rondas puedes comprar.')];
  if (ph === 'shop') return [
    S('.opts', 'Tienda', 'Recupera todas tus vidas o cambia una habilidad por cualquier otra.'),
    S('.gold', 'Oro', 'Lo ganas con los premios. A su lado, lo que cuesta el contrato de la ronda.'),
    S('footer button', 'Siguiente ronda', 'Cuando termines, tira el d12 de la ronda siguiente.'),
  ];
  if (ph === 'over') return [S('footer button', 'Fin', 'Tu mejor marca se guarda. ¡Vuelve a intentarlo!')];
  return [
    S('.hud', 'Vidas y oro', 'Perder un cofre te quita una vida. El oro lo ganas con premios.'),
    S('.chests', 'Cofres', 'Los puntos son los cofres de esta ronda; los claros ya los abriste.'),
    S('.goal', 'Meta', 'Esta es la suma que debes alcanzar con los dados.'),
    S('.chestbox', 'El cofre', 'Si lo superas se abre con un destello; si lo pierdes, se carboniza.'),
    S('.lots', 'Tiradas', 'Cada casilla es la suma de una tirada. Tienes hasta 4.'),
    S('.meter', 'La barra', 'Verde: zona buena. Rojo: te pasaste. Tu suma la va llenando; plántate cuando esté en verde.'),
    S('#slot', 'Los rodillos', 'Son tus dados: giran los que tiras. Con una habilidad elegida, toca el dado que quieres cambiar. Toca la suma de una tirada para verla.'),
    S('.skills', 'Habilidades', 'Una por cofre. Si te pasas, la que pueda salvarte se marca en verde.'),
    S('.stepper', 'Cuántos dados', 'Elige entre 1 y 5 dados para tirar.'),
    S('[data-act=roll]', 'Tirar', 'Tira los dados que elegiste.'),
    S('[data-act=stand]', 'Plantarse', 'Cierra el cofre con la suma que llevas.'),
  ];
}

function startTour() {
  const steps = tourSteps().filter((st) => app.querySelector(st.sel));
  if (!steps.length) return;
  tour = { steps, i: 0 };
  showTour();
}

function showTour() {
  let box = document.getElementById('tour');
  if (!box) {
    box = document.createElement('div');
    box.id = 'tour';
    document.body.appendChild(box);
    box.addEventListener('click', (e) => {
      const a = e.target.closest('[data-tour]')?.dataset.tour;
      if (a === 'next') tour.i += 1;
      else if (a === 'prev') tour.i -= 1;
      else tour = null;
      if (tour && tour.i >= tour.steps.length) tour = null;
      showTour();
    });
  }
  if (!tour) { box.remove(); return; }
  const st = tour.steps[tour.i];
  const el = app.querySelector(st.sel);
  const r = el.getBoundingClientRect();
  const pad = 4;
  const below = r.bottom + 150 < innerHeight;
  const last = tour.i === tour.steps.length - 1;
  box.innerHTML = `<div class="spot" style="left:${r.left - pad}px;top:${r.top - pad}px;width:${r.width + pad * 2}px;height:${r.height + pad * 2}px"></div>
    <div class="tip" style="${below ? `top:${r.bottom + 14}px` : `bottom:${innerHeight - r.top + 14}px`}">
      <b>${st.title}</b><p>${st.text}</p>
      <div class="tipbtns"><span class="dim">${tour.i + 1}/${tour.steps.length}</span>
        <button data-tour="end" aria-label="Cerrar tour">✕</button>
        ${tour.i ? '<button data-tour="prev">Atrás</button>' : ''}
        <button class="primary" data-tour="${last ? 'end' : 'next'}">${last ? 'Listo' : 'Siguiente'}</button></div>
    </div>`;
}

render();

// Service worker: permite instalarla y jugar sin conexión.
if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});

// Instalar como app: /?instalar muestra un aviso con el botón de instalación (Android/Chrome) o la pista para iPhone.
let installEvent = null;
addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installEvent = e; showInstall(); });
function showInstall() {
  if (!new URLSearchParams(location.search).has('instalar')) return;
  const standalone = matchMedia('(display-mode: standalone)').matches || navigator.standalone;
  const ios = /iphone|ipad|ipod/i.test(navigator.userAgent);
  let box = document.getElementById('install');
  if (!box) { box = document.createElement('div'); box.id = 'install'; document.body.append(box); }
  box.innerHTML = standalone ? '<b>Ya está instalado</b><button data-x>OK</button>'
    : installEvent ? '<b>Instalar Dados</b><button data-i class="primary">Instalar</button><button data-x>✕</button>'
    : ios ? '<b>En iPhone:</b><span>toca Compartir y luego «Añadir a pantalla de inicio»</span><button data-x>✕</button>'
    : '<b>Para instalar:</b><span>abre el menú del navegador y elige «Instalar app» o «Añadir a pantalla de inicio»</span><button data-x>✕</button>';
  box.onclick = async (e) => {
    if (e.target.matches('[data-i]') && installEvent) { installEvent.prompt(); await installEvent.userChoice; installEvent = null; }
    box.remove();
  };
}
addEventListener('appinstalled', () => document.getElementById('install')?.remove());
setTimeout(showInstall, 1200);
