// Lógica pura del juego (sin DOM): dados, habilidades, vidas, oro y rondas. `rng(sides)` devuelve 1..sides y se puede inyectar para probar.
//
// Una partida son RONDAS. Cada ronda empieza tirando un d12: el resultado son los cofres de la ronda y su costo en oro.
// En cada cofre sumas con los dados; si lo superas eliges uno de dos premios (oro, vida o habilidad nueva).
// Al terminar los cofres pagas el costo; entre rondas hay una tienda. Sin vidas, fin de la partida.

export const DICE = {
  d6: { sides: 6, lives: 4 },
  d8: { sides: 8, lives: 4 },
  d10: { sides: 10, lives: 3 },
  d12: { sides: 12, lives: 3 },
};

/** Habilidades fijas: en cada cofre puedes usar UNA (la que elijas). Se aplican solas al dado al que más ayudan. */
export const SKILLS = {
  add: { name: '+2', text: 'Suma 2 a tu suma' },
  sub: { name: '−2', text: 'Resta 2 a tu suma' },
  reroll: { name: 'Repetir', text: 'Vuelve a tirar un dado' },
  remove: { name: 'Quitar', text: 'Quita un dado de la suma' },
  flip: { name: 'Invertir', text: 'Cambia un dado a su cara opuesta' },
};

export const MAX_DICE_PER_ROLL = 5;
export const MAX_ROLLS = 4;
export const MAX_SKILLS = 5;

/** El d12 de cada ronda decide cuántos cofres tiene. */
export const ROUND_SIDES = 12;
/** Costo en oro de una ronda: crece con los cofres que salgan y con el número de ronda. */
export const costFor = (chests, round) => chests * 3 + round * 5;
/** Tienda entre rondas. */
export const HEAL_PRICE = 8; // por cada vida que falte
export const SWAP_PRICE = 20;
/** Con premios puedes tener hasta esta cantidad de vidas por encima de las iniciales. */
export const MAX_EXTRA_LIVES = 2;

/** Cofres especiales de la ronda según el d12: menos de 3 trae un cofre de oro; más de 9 suma un mímico. */
export const GOLD_BELOW = 3;
export const MIMIC_ABOVE = 9;
/** Un mímico perdido cuesta 2 vidas. */
export const MIMIC_LIVES = 2;

export const PRIZES = {
  gold5: { name: '+5 Oro', text: 'Suma 5 de oro' },
  gold10: { name: '+10 Oro', text: 'Suma 10 de oro' },
  gold20: { name: '+20 Oro', text: 'Suma 20 de oro' },
  life: { name: '+1 Vida', text: 'Recuperas una vida' },
  skill: { name: 'Nueva habilidad', text: 'Eliges una habilidad nueva' },
};

/** Ruta de dificultad de los premios: cuantos más cofres llevas, mejores opciones salen. */
const ROUTE = [
  { upTo: 3, pool: ['gold5', 'gold5', 'gold10', 'life'] },
  { upTo: 7, pool: ['gold5', 'gold10', 'life', 'skill'] },
  { upTo: 11, pool: ['gold10', 'gold10', 'life', 'skill'] },
  { upTo: Infinity, pool: ['gold10', 'life', 'skill', 'skill'] },
];

/** Meta del cofre `n` (0 = el primero). */
export const targetFor = (n) => Math.min(60, 14 + 2 * n);
/** Margen por debajo de la meta que aún cuenta como éxito: baja con el avance y es mayor con dados grandes (más gruesos). */
export const toleranceFor = (n, sides = 6) => Math.max(0, 4 - Math.floor(n / 3)) + Math.floor(sides / 2) - 2;

export const sum = (dice) => dice.reduce((a, d) => a + d, 0);
const clone = (s) => JSON.parse(JSON.stringify(s));

function openChest(s) {
  s.kind = (s.kinds && s.kinds[s.done]) || 'normal'; // normal · gold · mimic
  s.target = targetFor(s.cleared);
  s.tolerance = toleranceFor(s.cleared, s.sides);
  s.dice = [];
  s.lots = []; // cuántos dados tiene cada tirada del cofre (en orden), para mostrar la suma de cada una
  s.rolls = 0;
  s.skills.forEach((k) => (k.used = false));
  s.phase = 'play';
  s.result = null;
}

/** Nueva partida con el dado elegido y su primera habilidad. Empieza esperando el d12 de la primera ronda. */
export function createRun(dieKey, skillId) {
  const d = DICE[dieKey];
  if (!d || !SKILLS[skillId]) throw new Error('dado o habilidad desconocidos');
  const s = {
    die: dieKey, sides: d.sides, lives: d.lives, maxLives: d.lives, cleared: 0, gold: 0,
    skills: [{ id: skillId, used: false }], offer: [], prize: [],
    round: 0, chests: 0, done: 0, cost: 0, d12: 0, kinds: [], kind: 'normal', both: false, paid: null, shopStep: null, swapOut: null,
  };
  openChest(s);
  s.phase = 'roundroll';
  return s;
}

function finish(s, ok) {
  const total = sum(s.dice);
  if (!ok) s.lives -= s.kind === 'mimic' ? MIMIC_LIVES : 1;
  s.result = { ok, sum: total, target: s.target, bust: total > s.target, exact: ok && total === s.target };
  s.phase = 'result';
}

/** Suma de cada tirada (lote) del cofre actual. Partidas guardadas sin lotes cuentan como una sola tirada. */
export function lotSums(state) {
  const sizes = state.lots ?? (state.dice.length ? [state.dice.length] : []);
  let from = 0;
  return sizes.map((n) => {
    const part = state.dice.slice(from, from + n);
    from += n;
    return sum(part);
  });
}

/** Sumas posibles al usar la habilidad `id` sobre el dado `index` (Repetir: una por cada cara). */
function outcomes(s, id, index) {
  const v = s.dice[index];
  const rest = sum(s.dice) - v;
  if (id === 'add') return [rest + v + 2];
  if (id === 'sub') return [rest + Math.max(1, v - 2)];
  if (id === 'remove') return [rest];
  if (id === 'flip') return [rest + s.sides + 1 - v];
  return Array.from({ length: s.sides }, (_, k) => rest + k + 1); // reroll
}

/**
 * ¿Qué habilidades disponibles pueden salvar el cofre? Una habilidad salva si deja la suma en la zona buena
 * [meta − margen, meta]. Devuelve { skill, index, sure }: `sure` es false si depende del azar (Repetir).
 */
export function rescues(state) {
  const out = [];
  if (state.phase !== 'play') return out;
  const lo = state.target - state.tolerance;
  for (const k of state.skills) {
    if (k.used) continue;
    for (let i = 0; i < state.dice.length; i++) {
      const res = outcomes(state, k.id, i);
      const good = res.filter((t) => t >= lo && t <= state.target).length;
      if (good > 0) out.push({ skill: k.id, index: i, sure: good === res.length });
    }
  }
  return out;
}

/** Pasarte de la meta no pierde el cofre al instante si alguna habilidad disponible puede salvarlo; si ninguna puede, se pierde. */
function settle(s) {
  if (sum(s.dice) > s.target && rescues(s).length === 0) finish(s, false);
}

/** Tira `count` dados. Si te pasas, solo puedes arreglarlo con una habilidad (o rendirte). */
export function roll(state, count, rng) {
  const s = clone(state);
  if (s.phase !== 'play') throw new Error('no se puede tirar ahora');
  if (sum(s.dice) > s.target) throw new Error('te pasaste: usa una habilidad');
  if (!Number.isInteger(count) || count < 1 || count > MAX_DICE_PER_ROLL) throw new Error('cantidad de dados no válida');
  if (s.rolls >= MAX_ROLLS) throw new Error('no quedan tiradas');
  for (let i = 0; i < count; i++) s.dice.push(rng(s.sides));
  s.lots = [...(s.lots ?? (s.dice.length > count ? [s.dice.length - count] : [])), count];
  s.rolls += 1;
  settle(s);
  return s;
}

/** Te plantas: éxito si la suma está en [meta − margen, meta]. Plantarse pasado de la meta es rendirse. */
export function stand(state) {
  const s = clone(state);
  if (s.phase !== 'play' || s.dice.length === 0) throw new Error('no te puedes plantar ahora');
  const total = sum(s.dice);
  finish(s, total <= s.target && total >= s.target - s.tolerance);
  return s;
}

/** Cuánto te falta para estar en la zona buena (0 = dentro; si te pasas, cuánto te sobra). */
const distance = (s, total) => (total > s.target ? total - s.target : Math.max(0, s.target - s.tolerance - total));

/** Qué dado cambiar con cada habilidad: el que deja la suma más cerca de la zona buena. */
export function autoIndex(state, skillId) {
  const { dice, sides } = state;
  const total = sum(dice);
  const result = (i) => {
    const v = dice[i];
    if (skillId === 'add') return total + 2;
    if (skillId === 'sub') return total - Math.min(2, v - 1);
    if (skillId === 'flip') return total - v + (sides + 1 - v);
    if (skillId === 'remove') return total - v;
    return total; // reroll: no se sabe qué saldrá
  };
  const order = dice.map((_, i) => i);
  if (skillId === 'reroll') {
    // Si te pasaste, repite el dado más alto; si te falta, el más bajo.
    const pick = total > state.target ? Math.max(...dice) : Math.min(...dice);
    return dice.indexOf(pick);
  }
  // Si varios dados dejan la suma igual de cerca, se elige el más alto (después, el primero).
  return order.sort((a, b) => distance(state, result(a)) - distance(state, result(b)) || dice[b] - dice[a] || a - b)[0];
}

/** Usa una habilidad sobre el dado `index` (si no se indica, el que más ayuda). */
export function useSkill(state, skillId, index, rng) {
  const s = clone(state);
  if (s.phase !== 'play') throw new Error('no se puede usar ahora');
  const k = s.skills.find((x) => x.id === skillId);
  if (!k) throw new Error('no tienes esa habilidad');
  if (k.used) throw new Error('ya usada en este cofre');
  if (s.dice.length === 0) throw new Error('aún no hay dados');
  if (index === undefined || index === null) index = autoIndex(s, skillId); // sin elegir dado: el que más ayuda
  if (!Number.isInteger(index) || index < 0 || index >= s.dice.length) throw new Error('dado no válido');
  const v = s.dice[index];
  if (skillId === 'add') s.dice[index] = v + 2;
  else if (skillId === 'sub') s.dice[index] = Math.max(1, v - 2);
  else if (skillId === 'reroll') s.dice[index] = rng(s.sides);
  else if (skillId === 'flip') s.dice[index] = s.sides + 1 - v;
  else if (skillId === 'remove') {
    // El dado quitado sale de su tirada (que puede quedarse en 0 dados, pero sigue contando como tirada hecha).
    const sizes = s.lots ?? [s.dice.length];
    let from = 0;
    s.lots = sizes.map((n) => {
      const mine = index >= from && index < from + n;
      from += n;
      return mine ? n - 1 : n;
    });
    s.dice.splice(index, 1);
  }
  s.skills.forEach((x) => (x.used = true)); // una sola habilidad por cofre: elegir cuál es la decisión
  settle(s);
  return s;
}

// ---- Rondas ---------------------------------------------------------------------------------

/** Tira el d12 de la ronda: son los cofres y fija el costo. */
export function rollRound(state, rng) {
  const s = clone(state);
  if (s.phase !== 'roundroll') throw new Error('no toca tirar el d12');
  const n = rng(ROUND_SIDES);
  s.round += 1;
  s.d12 = n;
  // d12 < 3: un cofre de oro entre los cofres; d12 > 9: se suma un cofre mímico (escondido entre los demás).
  const special = n < GOLD_BELOW ? 'gold' : n > MIMIC_ABOVE ? 'mimic' : null;
  s.chests = n + (special === 'mimic' ? 1 : 0);
  s.kinds = Array(s.chests).fill('normal');
  if (special) s.kinds[rng(s.chests) - 1] = special;
  s.cost = costFor(n, s.round); // el costo solo depende del d12, no del mímico extra
  s.done = 0;
  s.paid = null;
  s.phase = 'roundready';
  return s;
}

/** Empieza la ronda: abre el primer cofre. */
export function startRound(state) {
  const s = clone(state);
  if (s.phase !== 'roundready') throw new Error('aún no hay ronda que empezar');
  openChest(s);
  return s;
}

const hasRoom = (s) => s.skills.length < MAX_SKILLS && Object.keys(SKILLS).some((id) => !s.skills.some((k) => k.id === id));

/** Dos premios distintos según la ruta de dificultad. Si una opción no sirve (sin habilidades por ganar, vidas al tope), se cambia por oro. */
export function prizeOptions(state, rng) {
  if (state.kind === 'gold') return ['gold10', 'gold20']; // el cofre de oro solo da oro, y más
  const pool = ROUTE.find((r) => state.cleared <= r.upTo).pool;
  const usable = (k) => (k === 'skill' ? hasRoom(state) : k === 'life' ? state.lives < state.maxLives + MAX_EXTRA_LIVES : true);
  const a = pool[rng(pool.length) - 1];
  const rest = pool.filter((k) => k !== a);
  let b = rest.length ? rest[rng(rest.length) - 1] : 'gold5';
  let first = usable(a) ? a : 'gold10';
  let second = usable(b) ? b : first === 'gold10' ? 'gold5' : 'gold10';
  if (second === first) second = first === 'gold5' ? 'gold10' : 'gold5';
  return [first, second];
}

function endRound(s) {
  if (s.gold >= s.cost) {
    s.gold -= s.cost;
    s.paid = { cost: s.cost, ok: true };
  } else {
    // Sin oro para pagar el costo de la ronda: pierdes una vida y te quedas sin oro.
    s.paid = { cost: s.cost, ok: false, had: s.gold };
    s.gold = 0;
    s.lives -= 1;
  }
  s.phase = s.lives <= 0 ? 'over' : 'roundend';
}

function afterChest(s) {
  if (s.done >= s.chests) endRound(s);
  else openChest(s);
}

/** Tras ver el resultado de un cofre: premio (si lo superaste), siguiente cofre, fin de ronda o fin de partida. */
export function next(state, rng) {
  const s = clone(state);
  if (s.phase !== 'result') throw new Error('aún no hay resultado');
  s.done += 1;
  if (s.result.ok) {
    s.cleared += 1;
    s.prize = prizeOptions(s, rng);
    s.both = s.result.exact; // meta exacta: te llevas los dos premios
    s.phase = 'prize';
    return s;
  }
  if (s.lives <= 0) {
    s.phase = 'over';
    return s;
  }
  afterChest(s);
  return s;
}

/** Aplica un premio; devuelve true si hay que elegir una habilidad. */
function applyPrize(s, kind) {
  if (kind === 'gold5') s.gold += 5;
  else if (kind === 'gold10') s.gold += 10;
  else if (kind === 'gold20') s.gold += 20;
  else if (kind === 'life') s.lives = Math.min(s.maxLives + MAX_EXTRA_LIVES, s.lives + 1);
  else return true;
  return false;
}

/** Elige uno de los dos premios del cofre abierto (con la meta exacta no se elige: `choosePrize(s, 'both')` te da los dos). */
export function choosePrize(state, index) {
  const s = clone(state);
  if (s.phase !== 'prize') throw new Error('no hay premio que elegir');
  if (s.both && index !== 'both') throw new Error('con la meta exacta te llevas los dos');
  const kinds = index === 'both' ? (s.both ? s.prize : null) : [s.prize[index]];
  if (!kinds || kinds.some((k) => !k)) throw new Error('premio no válido');
  s.prize = [];
  s.both = false;
  let needsSkill = false;
  for (const k of kinds) needsSkill = applyPrize(s, k) || needsSkill;
  if (needsSkill) {
    s.offer = Object.keys(SKILLS).filter((id) => !s.skills.some((k) => k.id === id)).slice(0, 3);
    s.phase = 'pick';
    return s;
  }
  afterChest(s);
  return s;
}

/** Elige la habilidad nueva y sigue con la ronda. */
export function pickSkill(state, skillId) {
  const s = clone(state);
  if (s.phase !== 'pick' || !s.offer.includes(skillId)) throw new Error('habilidad no ofrecida');
  s.skills.push({ id: skillId, used: false });
  s.offer = [];
  afterChest(s);
  return s;
}

// ---- Tienda entre rondas -----------------------------------------------------------------

/** Del resumen de la ronda pasas a la tienda. */
export function toShop(state) {
  const s = clone(state);
  if (s.phase !== 'roundend') throw new Error('aún no hay tienda');
  s.phase = 'shop';
  s.shopStep = null;
  s.swapOut = null;
  return s;
}

export const healPrice = (state) => HEAL_PRICE * Math.max(0, state.maxLives - state.lives);

/** Recupera todas las vidas (hasta las iniciales). */
export function buyHeal(state) {
  const s = clone(state);
  if (s.phase !== 'shop') throw new Error('la tienda solo abre entre rondas');
  const price = healPrice(s);
  if (price === 0) throw new Error('ya tienes todas las vidas');
  if (s.gold < price) throw new Error('no te alcanza el oro');
  s.gold -= price;
  s.lives = s.maxLives;
  return s;
}

/** Cambiar una habilidad por cualquier otra: primero eliges cuál entregas y luego cuál recibes. */
export function startSwap(state) {
  const s = clone(state);
  if (s.phase !== 'shop') throw new Error('la tienda solo abre entre rondas');
  if (s.gold < SWAP_PRICE) throw new Error('no te alcanza el oro');
  s.shopStep = 'from';
  return s;
}
export function swapFrom(state, id) {
  const s = clone(state);
  if (s.shopStep !== 'from' || !s.skills.some((k) => k.id === id)) throw new Error('habilidad no válida');
  s.swapOut = id;
  s.shopStep = 'to';
  return s;
}
export function swapTo(state, id) {
  const s = clone(state);
  if (s.shopStep !== 'to' || !SKILLS[id] || s.skills.some((k) => k.id === id)) throw new Error('habilidad no válida');
  s.skills = s.skills.map((k) => (k.id === s.swapOut ? { id, used: false } : k));
  s.gold -= SWAP_PRICE;
  s.shopStep = null;
  s.swapOut = null;
  return s;
}
export function cancelSwap(state) {
  const s = clone(state);
  s.shopStep = null;
  s.swapOut = null;
  return s;
}

/** Sales de la tienda: toca tirar el d12 de la ronda siguiente. */
export function leaveShop(state) {
  const s = clone(state);
  if (s.phase !== 'shop') throw new Error('no estás en la tienda');
  openChest(s);
  s.phase = 'roundroll';
  return s;
}
