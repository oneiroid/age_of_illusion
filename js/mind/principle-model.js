'use strict';

/* «Твой принцип» — trolley cases, candidate principles, and the checks between them.
   Case features: saved / killed — lives; contact — the agent touches the victim
   (hand or scalpel); force — the agent's own muscles move the victim (hand, pole;
   Greene et al., 2009); means — the victim's death or body is what saves the others;
   redirect — an existing threat is turned toward the victim; far — the agent is
   100 m away. */

const P_CASES = [
  { id: 'switch', title: 'Стрелка', core: true, saved: 5, killed: 1, contact: 0, force: 0, means: 0, redirect: 1, far: 0,
    text: 'Вагонетка без тормозов несётся по путям к пятерым рабочим: они не успеют уйти и погибнут. Вы стоите у стрелки. Если перевести её, вагонетка уйдёт на боковой путь, где работает один человек, — погибнет он.',
    q: 'Допустимо ли перевести стрелку?' },
  { id: 'switch1', title: 'Стрелка: один и один', core: true, saved: 1, killed: 1, contact: 0, force: 0, means: 0, redirect: 1, far: 0,
    text: 'Вагонетка без тормозов несётся к рабочему на путях. Вы стоите у стрелки. Если перевести её, вагонетка уйдёт на боковой путь, где тоже работает один человек, — погибнет он, а не первый.',
    q: 'Допустимо ли перевести стрелку?' },
  { id: 'footbridge', title: 'Мост', core: true, saved: 5, killed: 1, contact: 1, force: 1, means: 1, redirect: 0, far: 0,
    text: 'Вагонетка несётся к пятерым рабочим. Вы стоите на мосту над путями, рядом с вами крупный человек. Если столкнуть его руками вниз, его тело остановит вагонетку: он погибнет, пятеро спасутся. Сами вы слишком лёгкий, чтобы её остановить.',
    q: 'Допустимо ли столкнуть его?' },
  { id: 'pole', title: 'Мост и шест', core: true, saved: 5, killed: 1, contact: 0, force: 1, means: 1, redirect: 0, far: 0,
    text: 'Вагонетка несётся к пятерым. На мосту над путями стоит крупный человек, в нескольких метрах от вас. В руках у вас длинный шест: им можно столкнуть человека вниз, не прикасаясь к нему. Его тело остановит вагонетку, он погибнет, пятеро спасутся.',
    q: 'Допустимо ли столкнуть его шестом?' },
  { id: 'trapdoor', title: 'Люк', core: true, saved: 5, killed: 1, contact: 0, force: 0, means: 1, redirect: 0, far: 0,
    text: 'Вагонетка несётся к пятерым. На мосту над путями стоит крупный человек — на люке. Вы стоите рядом с ним, у кнопки: она открывает люк. Человек упадёт на пути, его тело остановит вагонетку, он погибнет, пятеро спасутся.',
    q: 'Допустимо ли нажать кнопку?' },
  { id: 'trapdoorFar', title: 'Люк, кнопка далеко', core: true, saved: 5, killed: 1, contact: 0, force: 0, means: 1, redirect: 0, far: 1,
    text: 'Вагонетка несётся к пятерым. На мосту над путями стоит крупный человек — на люке. Вы в будке в ста метрах от моста, у пульта с кнопкой, которая открывает люк. Человек упадёт на пути, его тело остановит вагонетку, он погибнет, пятеро спасутся.',
    q: 'Допустимо ли нажать кнопку?' },
  { id: 'loop', title: 'Петля', core: true, saved: 5, killed: 1, contact: 0, force: 0, means: 1, redirect: 1, far: 0,
    text: 'Вагонетка несётся к пятерым. Можно перевести стрелку на боковой путь, но он петлёй возвращается к тем же пятерым. На петле стоит крупный человек: вагонетка собьёт его, и его тело её остановит. Не будь его, вагонетка обогнула бы петлю и убила пятерых.',
    q: 'Допустимо ли перевести стрелку?' },
  { id: 'loopWeight', title: 'Петля с грузом', core: true, saved: 5, killed: 1, contact: 0, force: 0, means: 0, redirect: 1, far: 0,
    text: 'Вагонетка несётся к пятерым. Можно перевести стрелку на боковой путь, но он петлёй возвращается к тем же пятерым. На петле лежит тяжёлый груз, который остановит вагонетку. Перед грузом стоит человек: вагонетка собьёт его прежде, чем упрётся в груз. Его гибель для спасения пятерых не нужна — груз остановил бы вагонетку и без него.',
    q: 'Допустимо ли перевести стрелку?' },
  { id: 'obstacle', title: 'Бег к стрелке', core: true, saved: 5, killed: 1, contact: 1, force: 1, means: 0, redirect: 0, far: 0,
    text: 'Вагонетка несётся к пятерым. Стрелка, которая уведёт её на пустой путь, — на другом конце узкого моста. Посреди моста стоит рабочий и загораживает проход. Успеть можно, только оттолкнув его руками с дороги: он упадёт с моста и разобьётся.',
    q: 'Допустимо ли оттолкнуть его?' },
  { id: 'surgeon', title: 'Хирург', core: true, saved: 5, killed: 1, contact: 1, force: 1, means: 1, redirect: 0, far: 0,
    text: 'Вы хирург. Пятеро ваших пациентов умрут сегодня без пересадки: каждому нужен свой орган. На осмотр пришёл здоровый человек, подходящий донором всем пятерым. Если усыпить его и взять органы, он умрёт, пятеро выживут. Никто никогда об этом не узнает.',
    q: 'Допустимо ли это сделать?' },

  // Reserve: used to test a revised principle.
  { id: 'gas', title: 'Газ', saved: 5, killed: 1, contact: 0, force: 0, means: 0, redirect: 1, far: 0,
    text: 'После аварии ядовитый газ идёт по вентиляции к комнате, где заперты пятеро. Вы у пульта: можно переключить заслонку, и газ уйдёт в другую ветку — в комнату, где один человек.',
    q: 'Допустимо ли переключить заслонку?' },
  { id: 'turntable', title: 'Поворотный круг', saved: 5, killed: 1, contact: 0, force: 0, means: 0, redirect: 0, far: 0,
    text: 'Вагонетка несётся к пятерым, которые стоят на поворотной платформе посреди путей. Кнопкой можно повернуть платформу — пятеро уедут с пути. Но, поворачиваясь, платформа прижмёт к стене человека, стоящего рядом, и он погибнет.',
    q: 'Допустимо ли повернуть платформу?' },
  { id: 'crane', title: 'Кран', saved: 5, killed: 1, contact: 0, force: 0, means: 1, redirect: 0, far: 0,
    text: 'Вагонетка несётся к пятерым. На краю моста над путями стоит крупный человек. Вы в кабине крана: если повернуть стрелу, она столкнёт его на пути, и его тело остановит вагонетку. Он погибнет, пятеро спасутся.',
    q: 'Допустимо ли повернуть стрелу?' },
  { id: 'footbridge100', title: 'Мост и сто человек', saved: 100, killed: 1, contact: 1, force: 1, means: 1, redirect: 0, far: 0,
    text: 'Вагонетка без тормозов несётся к переполненной платформе, где около ста человек. Вы стоите на мосту над путями рядом с крупным человеком. Если столкнуть его руками вниз, его тело остановит вагонетку: он погибнет, сто человек спасутся.',
    q: 'Допустимо ли столкнуть его?' },
  { id: 'switch2', title: 'Стрелка: двое', saved: 5, killed: 2, contact: 0, force: 0, means: 0, redirect: 1, far: 0,
    text: 'Вагонетка несётся к пятерым рабочим. Если перевести стрелку, она уйдёт на боковой путь, где работают двое, — погибнут они.',
    q: 'Допустимо ли перевести стрелку?' },
];

const more = c => c.saved > c.killed;

const P_RULES = [
  { id: 'count', name: 'Число жизней', initial: true,
    text: 'Решает число: если спасаешь больше людей, чем погибнет, — допустимо.',
    f: c => more(c) },
  { id: 'never', name: 'Не вмешиваться', initial: true,
    text: 'Активно вмешиваться нельзя: никто не вправе решать, кому умереть.',
    f: () => false },
  { id: 'redirect', name: 'Только отвести угрозу', initial: true,
    text: 'Можно отвести уже существующую угрозу на меньшее число людей, но нельзя направлять на человека новую.',
    f: c => more(c) && !!c.redirect },
  { id: 'means', name: 'Не использовать как средство', initial: true,
    text: 'Нельзя использовать человека как средство спасения других. Если его гибель — побочный эффект, допустимо, когда спасаешь больше.',
    f: c => more(c) && !c.means },
  { id: 'hands', name: 'Не своими руками', initial: true,
    text: 'Нельзя убивать своими силами — толчком, ударом, скальпелем. Через механизм допустимо, когда спасаешь больше.',
    f: c => more(c) && !c.force },
  { id: 'touch', name: 'Не прикасаться',
    text: 'Нельзя прикасаться к тому, кто погибнет. Без касания допустимо, когда спасаешь больше.',
    f: c => more(c) && !c.contact },
  { id: 'greene', name: 'Не своими силами ради цели',
    text: 'Нельзя своими силами убивать человека для того, чтобы его гибель спасла других. Остальное — по числу жизней.',
    f: c => more(c) && !(c.force && c.means) },
  { id: 'threshold', name: 'Порог',
    text: 'Как правило, нельзя губить человека своими силами или как средство. Но если так спасаешь в десятки раз больше людей — можно.',
    f: c => more(c) && (!(c.force || c.means) || c.saved >= 10 * c.killed) },
];

/* Core cases in random order, the two cases of a pair never next to each other. */
function coreOrder(rand = Math.random) {
  const ids = P_CASES.filter(c => c.core).map(c => c.id);
  const near = (a, b) => P_PAIRS.some(([x, y]) => (x === a && y === b) || (x === b && y === a));
  for (let t = 0; t < 500; t++) {
    for (let i = ids.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [ids[i], ids[j]] = [ids[j], ids[i]];
    }
    if (ids.every((id, i) => !i || !near(ids[i - 1], id))) break;
  }
  return ids;
}

const caseById = id => P_CASES.find(c => c.id === id);
const ruleById = id => P_RULES.find(r => r.id === id);

/* answers: [{ id, ok }]. Rules sorted by how many answers they reproduce (stable: list order). */
function fitRules(answers) {
  return P_RULES
    .map((r, k) => ({ rule: r, k, agree: answers.filter(a => r.f(caseById(a.id)) === a.ok).length }))
    .sort((x, y) => y.agree - x.agree || x.k - y.k);
}

/* Answers the rule gets wrong. */
function violations(rule, answers) {
  return answers.filter(a => rule.f(caseById(a.id)) !== a.ok);
}

/* Pairs of core cases that differ in one respect. */
const P_PAIRS = [
  ['switch', 'switch1', 'только числом спасённых'],
  ['footbridge', 'pole', 'только касанием: руками или шестом'],
  ['pole', 'trapdoor', 'только тем, чьей силой падает человек: вашей или механизма'],
  ['trapdoor', 'trapdoorFar', 'только расстоянием от вас до человека'],
  ['loop', 'loopWeight', 'только тем, нужна ли гибель человека для спасения пятерых'],
  ['obstacle', 'footbridge', 'только тем, нужна ли гибель человека для спасения (в обоих — толчок руками)'],
  ['footbridge', 'surgeon', 'обстановкой: в обоих вы своими руками убиваете человека, чтобы его тело спасло пятерых'],
];

function pairs(answers) {
  const ok = Object.fromEntries(answers.map(a => [a.id, a.ok]));
  return P_PAIRS.filter(([x, y]) => x in ok && y in ok)
    .map(([x, y, diff]) => ({ x: caseById(x), y: caseById(y), diff, same: ok[x] === ok[y], okX: ok[x], okY: ok[y] }));
}

/* Expected answer to a new case: the answer to the most similar answered case. */
const FEATS = [c => more(c), c => c.contact, c => c.force, c => c.means, c => c.redirect, c => c.saved >= 10 * c.killed];
function predict(c, answers) {
  let best = null, bd = Infinity;
  for (const a of answers) {
    const o = caseById(a.id);
    const d = FEATS.reduce((s, f) => s + (Boolean(f(c)) !== Boolean(f(o)) ? 1 : 0), 0);
    if (d < bd) { bd = d; best = a; }
  }
  return best ? best.ok : null;
}

/* Next case to test `rule`: an unanswered case where the rule disagrees with the
   predicted answer; otherwise any unanswered case. null when none are left. */
function challenge(rule, answers, rand = Math.random) {
  const done = new Set(answers.map(a => a.id));
  const left = P_CASES.filter(c => !done.has(c.id));
  if (!left.length) return null;
  const hard = left.filter(c => rule.f(c) !== predict(c, answers));
  const pool = hard.length ? hard : left;
  return pool[Math.floor(rand() * pool.length)];
}

if (typeof module !== 'undefined') {
  module.exports = { P_CASES, P_RULES, P_PAIRS, coreOrder, caseById, ruleById, fitRules, violations, pairs, predict, challenge };
}
