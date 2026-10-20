'use strict';

/* «Подпись»: choice blindness with swaps chosen by a model of the respondent and a
   sealed (hashed) bet on which swaps go unnoticed. Pure logic, no DOM: loaded by
   index.html and by test/signature.test.js under Node. Names carry a `sig` prefix
   because browser scripts share one global scope. */

/* Length. To make the demo twice as long: pairs1 8, swaps1 3, pairs2 4, maxK2 2.
   The pool holds enough pairs for that (checked by the test). */
const SIG = {
  pairs1: 4,      // round 1: pairs of statements (two statements each)
  swaps1: 2,      // round 1: answers reversed in the profile
  control: 1,     // genuine answers that also get a reason field and a recall question
  pairs2: 2,      // round 2, after the reveal
  maxK2: 1,       // round 2: swaps drawn uniformly from 0..maxK2 (0 is possible)
};

const SIG_SCALE = ['', 'совсем не согласен', 'не согласен', 'скорее не согласен', 'трудно сказать',
  'скорее согласен', 'согласен', 'полностью согласен'];

/* Each pair states one value from both ends: a consistent respondent rates the two
   statements about mirror-wise, r0 + r1 ≈ 8. Everyday values; no politics or religion. */
const SIG_PAIRS = [
  { id: 'lie', theme: 'Правда', s: [
    'Ложь во спасение допустима, если правда только ранит и ничего не меняет.',
    'Правду нужно говорить, даже когда она ранит.'] },
  { id: 'forgive', theme: 'Прощение', s: [
    'Того, кто серьёзно подвёл, лучше простить, чем отдалиться от него.',
    'Тому, кто однажды серьёзно подвёл, не стоит доверять снова.'] },
  { id: 'rules', theme: 'Правила', s: [
    'Правило, которое кажется бессмысленным, всё равно нужно соблюдать.',
    'Бессмысленное правило можно нарушать, если от этого никто не пострадает.'] },
  { id: 'work', theme: 'Работа', s: [
    'Интересная работа важнее хорошей зарплаты.',
    'Хорошая зарплата важнее интересной работы.'] },
  { id: 'friend', theme: 'Дружба', s: [
    'Друга нельзя выдавать, даже если он поступил плохо.',
    'Если друг поступил плохо, правильно рассказать об этом, даже ценой дружбы.'] },
  { id: 'success', theme: 'Успех', s: [
    'Успех в жизни зависит в основном от усилий самого человека.',
    'Успех в жизни зависит в основном от везения и обстоятельств.'] },
  { id: 'teen', theme: 'Родители', s: [
    'Родители вправе читать переписку подростка, если волнуются за его безопасность.',
    'Переписка подростка — его личное дело, даже если родители волнуются.'] },
  { id: 'punish', theme: 'Наказание', s: [
    'Строгое наказание лучше всего удерживает от повторения проступка.',
    'Наказание мало что исправляет: важнее понять, почему человек так поступил.'] },
  { id: 'old', theme: 'Перемены', s: [
    'Проверенные способы жить и работать обычно надёжнее новых.',
    'Новые способы почти всегда лучше старых, даже если к ним трудно привыкнуть.'] },
  { id: 'meat', theme: 'Животные', s: [
    'Есть мясо нормально, если животное не мучили.',
    'Убивать животных ради еды неправильно, если без этого можно обойтись.'] },
  { id: 'help', theme: 'Помощь', s: [
    'Помогать своим важнее, чем незнакомым, даже если незнакомым помощь нужнее.',
    'Помогать нужно тому, кому помощь нужнее, даже если это незнакомый человек.'] },
  { id: 'promise', theme: 'Обещания', s: [
    'Обещание нужно держать, даже если обстоятельства сильно изменились.',
    'Если обстоятельства сильно изменились, обещание можно не выполнять.'] },
  { id: 'feel', theme: 'Чувства', s: [
    'Свои чувства лучше держать при себе.',
    'Свои чувства лучше показывать открыто.'] },
  { id: 'risk', theme: 'Риск', s: [
    'Лучше рискнуть и пожалеть, чем пожалеть, что не попробовал.',
    'Надёжное лучше заманчивого, но рискованного.'] },
  { id: 'change', theme: 'Сдача', s: [
    'Лишнюю сдачу, которую кассир дал по ошибке, нужно вернуть.',
    'Лишнюю сдачу можно оставить себе: ошибся кассир, а не вы.'] },
  { id: 'compete', theme: 'Соревнование', s: [
    'Соревнование делает людей лучше.',
    'Соревнование чаще портит людей, чем делает их лучше.'] },
];

function sigShuffle(a, rand = Math.random) {
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* Statements for one or more rounds: `counts` pairs per round, unseen pairs first.
   Returns one array per round, both statements of each pair, in an order where the
   two halves of a pair are not next to each other. */
function sigPick(counts, seen = [], rand = Math.random) {
  const s = new Set(seen);
  const pool = sigShuffle(SIG_PAIRS.filter(p => !s.has(p.id)), rand)
    .concat(sigShuffle(SIG_PAIRS.filter(p => s.has(p.id)), rand));
  let at = 0;
  return counts.map(n => {
    const pairs = pool.slice(at, at += n);
    const items = pairs.flatMap(p => p.s.map((text, k) => ({ id: p.id + k, pair: p.id, theme: p.theme, text })));
    let best = items;
    for (let t = 0; t < 60; t++) {
      const o = sigShuffle(items.slice(), rand);
      if (o.every((it, i) => i === 0 || o[i - 1].pair !== it.pair)) { best = o; break; }
    }
    return best;
  });
}

/* Mirror around the midpoint; only 2, 3, 5, 6 are swapped (extremes are noticed,
   4 has no mirror), so a swap always turns agreement into disagreement or back. */
const sigMirror = r => 8 - r;
const sigSwappable = r => r === 2 || r === 3 || r === 5 || r === 6;

const sigMedian = a => {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/* Hand-set weights of "the swap goes unnoticed", by the direction of published effects:
   moderate, slow and revised answers carry less confidence, and undetected swaps
   have lower confidence (see `why`); a swap that makes the pair agree fits the
   respondent's picture of themself (our hypothesis); early answers are older in memory.
   Not fitted to data. */
const SIG_W = { base: -0.3, mid: 0.6, slow: 0.8, changes: 0.4, gain: 0.3, early: 0.5 };

/* answers[i] = { r, ms, changes } for items[i] (presentation order). Returns
   P(the swap of item i goes unnoticed) and its inputs. */
function sigScore(items, answers, i) {
  const a = answers[i];
  const j = items.findIndex((it, k) => k !== i && it.pair === items[i].pair);
  const rp = j < 0 ? 4 : answers[j].r;
  const before = Math.abs(a.r + rp - 8), after = Math.abs(sigMirror(a.r) + rp - 8);
  const med = sigMedian(answers.map(x => x.ms)) || a.ms || 1;
  const f = {
    mid: Math.abs(a.r - 4) === 1 ? 1 : -1,
    slow: Math.max(-1.5, Math.min(1.5, Math.log2(Math.max(1, a.ms) / Math.max(1, med)))),
    changes: Math.min(2, a.changes),
    gain: before - after,
    early: items.length > 1 ? 1 - i / (items.length - 1) : 0,
  };
  let z = SIG_W.base;
  for (const k in f) z += SIG_W[k] * f[k];
  return { p: 1 / (1 + Math.exp(-z)), f };
}

/* Up to n swaps, at most one per pair, the most likely to go unnoticed first.
   bet: 'accept' (will defend it as theirs) when p ≥ 0.5, else 'detect'. */
function sigChooseSwaps(items, answers, n) {
  const cand = items.map((it, i) => ({ i, ...sigScore(items, answers, i) }))
    .filter(c => sigSwappable(answers[c.i].r))
    .sort((x, y) => y.p - x.p);
  const used = new Set(), out = [];
  for (const c of cand) {
    if (out.length >= n) break;
    if (used.has(items[c.i].pair)) continue;
    used.add(items[c.i].pair);
    const from = answers[c.i].r;
    out.push({ i: c.i, from, to: sigMirror(from), p: c.p, bet: c.p >= 0.5 ? 'accept' : 'detect' });
  }
  return out;
}

/* Genuine answers that also get a reason field and a recall question. */
function sigControls(items, swaps, n, rand = Math.random) {
  const taken = new Set(swaps.map(s => s.i));
  return sigShuffle(items.map((_, i) => i).filter(i => !taken.has(i)), rand).slice(0, n);
}

const sigK = (maxK, rand = Math.random) => Math.floor(rand() * (maxK + 1));

/* How a recalled original answer relates to the original and the shown (swapped) one. */
function sigRecall(from, to, recalled) {
  if (recalled === from) return 'exact';
  if (recalled === to) return 'shown';
  return Math.abs(recalled - to) < Math.abs(recalled - from) ? 'toward' : 'other';
}

/* The sealed record: plain text anyone can hash with SHA-256 (UTF-8) to check. */
function sigSealText(round, items, swaps, salt) {
  const lines = [`«Подпись», раунд ${round}`];
  if (round === 2) lines.push(`Подмен: ${swaps.length}.`);
  if (!swaps.length && round === 1) lines.push('Подмен нет: все ответы крайние или посередине шкалы.');
  for (const s of swaps) {
    let t = `Подмена: «${items[s.i].text}» — ответ ${s.from} заменён на ${s.to}.`;
    if (s.bet) t += ` Ставка: ${s.bet === 'accept' ? 'не заметите' : 'заметите'}.`;
    lines.push(t);
  }
  lines.push(`Соль: ${salt}`);
  return lines.join('\n');
}

function sigSalt(rand = Math.random) {
  const b = new Uint8Array(16);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) crypto.getRandomValues(b);
  else for (let i = 0; i < b.length; i++) b[i] = Math.floor(rand() * 256);
  return [...b].map(x => x.toString(16).padStart(2, '0')).join('');
}

/* SHA-256 of a string's UTF-8 bytes, as hex. Plain JS rather than crypto.subtle,
   which is missing outside secure contexts and is async. */
const sha256 = (function () {
  const primes = [];
  for (let n = 2; primes.length < 64; n++) if (primes.every(p => n % p)) primes.push(n);
  const frac = x => ((x - Math.floor(x)) * 2 ** 32) >>> 0;
  const K = primes.map(p => frac(Math.cbrt(p)));
  const H0 = primes.slice(0, 8).map(p => frac(Math.sqrt(p)));
  const rotr = (x, n) => (x >>> n) | (x << (32 - n));

  return function (str) {
    const bytes = new TextEncoder().encode(str);
    const l = bytes.length, nb = ((l + 9 + 63) >> 6) << 6;
    const m = new Uint8Array(nb);
    m.set(bytes);
    m[l] = 0x80;
    const dv = new DataView(m.buffer);
    dv.setUint32(nb - 8, Math.floor(l / 2 ** 29));
    dv.setUint32(nb - 4, (l * 8) >>> 0);
    const H = H0.slice(), w = new Uint32Array(64);
    for (let o = 0; o < nb; o += 64) {
      for (let i = 0; i < 16; i++) w[i] = dv.getUint32(o + 4 * i);
      for (let i = 16; i < 64; i++) {
        const a = w[i - 15], b = w[i - 2];
        w[i] = w[i - 16] + (rotr(a, 7) ^ rotr(a, 18) ^ (a >>> 3)) + w[i - 7] + (rotr(b, 17) ^ rotr(b, 19) ^ (b >>> 10));
      }
      let [a, b, c, d, e, f, g, h] = H;
      for (let i = 0; i < 64; i++) {
        const t1 = (h + (rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25)) + ((e & f) ^ (~e & g)) + K[i] + w[i]) | 0;
        const t2 = ((rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22)) + ((a & b) ^ (a & c) ^ (b & c))) | 0;
        h = g; g = f; f = e; e = (d + t1) | 0; d = c; c = b; b = a; a = (t1 + t2) | 0;
      }
      [a, b, c, d, e, f, g, h].forEach((x, k) => { H[k] = (H[k] + x) | 0; });
    }
    return H.map(x => (x >>> 0).toString(16).padStart(8, '0')).join('');
  };
})();

if (typeof module !== 'undefined') {
  module.exports = { SIG, SIG_SCALE, SIG_PAIRS, SIG_W, sigPick, sigMirror, sigSwappable, sigScore, sigChooseSwaps,
    sigControls, sigK, sigRecall, sigSealText, sigSalt, sha256 };
}
