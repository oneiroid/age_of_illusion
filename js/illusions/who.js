'use strict';

ILLUSIONS.push({
  id: 'who-started',
  section: 'mind',
  lang: 'ru',
  gated: true,
  title: 'Кто начал?',
  credit: 'Новая демонстрация. Шум в повторяющейся дилемме заключённого: Molander, 1985; Wu & Axelrod, 1995; слепое пятно к своим искажениям: Pronin, Lin & Ross, 2002',
  howto: 'Дилемма заключённого, много раундов подряд, против программы. В каждом раунде оба одновременно выбирают: сотрудничать или предать. Связь ненадёжна: изредка ход доходит до другой стороны противоположным — это касается обоих. Цель — набрать как можно больше очков. Клавиши 1 и 2 или кнопки на экране.',
  expect: 'Соперник играл «око за око»: начинал с сотрудничества и повторял ваш предыдущий ход — тот, который до него дошёл. Сбои связи были подстроены, и оба превращали сотрудничество в предательство: первый — ход соперника на пути к вам в одном из первых раундов, второй — ваш ход на пути к нему во второй половине игры. Если вы ответили на первый сбой, то для соперника это было нападение без причины, и с этого момента каждый честно отвечал на предательство другого. Одна из трёх партий, которые вы оценивали со стороны, была отрывком вашей. В ней видны только сделанные ходы, без искажений связи.',
  why: [
    'В повторяющейся дилемме «око за око» — одна из самых успешных стратегий: она начинает с сотрудничества, наказывает за предательство и сразу прощает (Axelrod, 1984). Но при малейшем шуме она проваливается: одно искажённое сообщение запускает эхо — каждый наказывает другого за предыдущий удар, и вражда тянется, пока новый сбой случайно её не прервёт (Molander, 1985; Bendor, Kramer & Stout, 1991). Устойчивее те, кто иногда прощает предательство без ответа (Wu & Axelrod, 1995; Nowak & Sigmund, 1992).',
    'Изнутри конфликта видна только одна сторона. Своё предательство вы помните как ответ — у вас была причина, вы её видели. Предательство соперника выглядит как нападение: его причину, ход, искажённый по дороге, вы не видели. Соперник видит то же самое зеркально. Оба правы в том, что видели, и оба ошибаются в том, кто начал.',
    'Со стороны видны сделанные ходы, но не то, что каждый увидел. Поэтому ваш ответ на несуществующее предательство в записи выглядит как удар без повода. Людям свойственно считать свои суждения объективными, а суждения других — искажёнными (наивный реализм; Pronin, Lin & Ross, 2002), и собственную вину оценивать мягче, чем такую же чужую. Здесь можно сравнить, как вы оценили свои ходы изнутри и те же ходы, не зная, что они ваши.',
    'Это новая демонстрация, а не воспроизведение конкретного эксперимента: результат показан для вас одного, и оценки со стороны могут совпасть с оценками изнутри.',
  ],

  mount(stage, controls, { reveal }) {
    const LABEL = { C: 'Сотрудничать', D: 'Предать' };
    const SAW = { C: 'сотрудничал', D: 'предал' };
    const DID = { C: 'сотрудничали', D: 'предали' };

    const root = document.createElement('div');
    root.className = 'mind';
    stage.appendChild(root);

    let phase, game, inside, recs, rk, ratings, recog, busy;

    function start() {
      game = makeGame();
      inside = {};
      ratings = [];
      recs = null; rk = 0; recog = null;
      phase = 'intro';
      render();
    }

    const cell = (m, extra = '') => `<i class="who-mv ${m === 'C' ? 'c' : 'd'}${extra}" title="${LABEL[m]}"></i>`;

    const payTable = () =>
      `<table class="mind-table who-pay">
         <tr><th></th><th>Соперник сотрудничает</th><th>Соперник предаёт</th></tr>
         <tr><td>Вы сотрудничаете</td><td>3 / 3</td><td>0 / 5</td></tr>
         <tr><td>Вы предаёте</td><td>5 / 0</td><td>1 / 1</td></tr>
       </table>
       <p class="mind-note">Очки: ваши / соперника.</p>`;

    /* 0–10 scale of buttons; nothing is pre-selected. */
    function scale(name) {
      let b = '';
      for (let v = 0; v <= 10; v++) b += `<button type="button" class="btn" data-v="${v}">${v}</button>`;
      return `<div class="who-scale" data-name="${name}">${b}</div>
              <div class="who-scale-ends"><span>не виноват</span><span>полностью виноват</span></div>`;
    }

    function choice(name, options) {
      return `<div class="who-choice" data-name="${name}">` +
        options.map(([v, t]) => `<button type="button" class="btn" data-v="${v}">${t}</button>`).join('') + '</div>';
    }

    /* Wires .who-scale / .who-choice groups; `go` is enabled once every group has a pick. */
    function wireForm(go, onDone) {
      const vals = {};
      const groups = [...root.querySelectorAll('.who-scale, .who-choice')];
      groups.forEach(g => g.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
        g.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === b));
        vals[g.dataset.name] = g.classList.contains('who-scale') ? Number(b.dataset.v) : b.dataset.v;
        go.disabled = groups.some(x => !(x.dataset.name in vals));
      })));
      go.disabled = true;
      go.addEventListener('click', () => onDone(vals));
    }

    function renderIntro() {
      root.innerHTML =
        `<div class="mind-col">
           <p class="mind-big">Дилемма заключённого</p>
           <p class="mind-sub">В каждом раунде вы и соперник одновременно выбираете: сотрудничать или предать.</p>
           ${payTable()}
           <h4>Правила</h4>
           <p class="who-line">Соперник — программа. Число раундов заранее не объявляется.</p>
           <p class="who-line">Связь ненадёжна: изредка, примерно в одном ходе из тридцати, ход доходит до другой стороны противоположным. Это касается обеих сторон.</p>
           <p class="who-line">Цель — набрать как можно больше очков. Счёт — в конце игры.</p>
           <button type="button" class="btn btn-primary mind-go">Начать</button>
         </div>`;
      root.querySelector('.mind-go').addEventListener('click', () => { phase = 'play'; render(); });
    }

    function renderPlay() {
      const { u, us } = game.log;
      const r = u.length;
      const last = r ? `Раунд ${r}: вы ${DID[u[r - 1]]}, соперник ${SAW[us[r - 1]]}.` : '&nbsp;';
      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-step">Раунд ${r + 1}</p>
           ${payTable()}
           <div class="who-moves">
             <button type="button" class="who-btn c" data-m="C">${LABEL.C}<small>1</small></button>
             <button type="button" class="who-btn d" data-m="D">${LABEL.D}<small>2</small></button>
           </div>
           <p class="who-last">${last}</p>
           <div class="who-hist">
             <span>Вы</span><div>${u.map(m => cell(m)).join('')}</div>
             <span>Соперник</span><div>${us.map(m => cell(m)).join('')}</div>
           </div>
           <p class="mind-note">Ходы соперника — такими, какими они дошли до вас.</p>
         </div>`;
      root.querySelectorAll('.who-btn').forEach(b => b.addEventListener('click', () => move(b.dataset.m)));
    }

    function move(m) {
      if (phase !== 'play' || busy) return;
      game.play(m);
      if (game.done) { phase = 'inside'; render(); return; }
      busy = true;                                            // swallow double clicks
      setTimeout(() => { busy = false; }, 250);
      renderPlay();
      const b = root.querySelector(`.who-btn[data-m="${m}"]`);
      if (b) b.classList.add('down');
    }

    function renderInside() {
      root.innerHTML =
        `<div class="mind-col">
           <p class="mind-step">Игра окончена</p>
           <p class="mind-big">Кто начал конфликт?</p>
           ${choice('who', [['bot', 'Соперник'], ['user', 'Я'], ['none', 'Никто'], ['nothing', 'Конфликта не было']])}
           <h4>Насколько в том, как прошла игра, виноваты вы?</h4>
           ${scale('self')}
           <h4>А соперник?</h4>
           ${scale('bot')}
           <button type="button" class="btn btn-primary mind-go">Дальше</button>
         </div>`;
      wireForm(root.querySelector('.mind-go'), v => {
        inside = v;
        recs = makeRecords(game.log);
        phase = 'record'; rk = 0;
        render();
      });
    }

    function recordGrid(rec, marks) {
      const n = rec.a.length;
      let nums = '';
      for (let r = 1; r <= n; r++) nums += `<b>${r % 5 === 0 || r === 1 ? r : ''}</b>`;
      return `<div class="who-hist rec" style="--n:${n}">
          <span></span><div class="who-nums">${nums}</div>
          <span>${marks ? marks.a : 'А'}</span><div>${rec.a.map(m => cell(m)).join('')}</div>
          <span>${marks ? marks.b : 'Б'}</span><div>${rec.b.map(m => cell(m)).join('')}</div>
        </div>`;
    }

    function renderRecord() {
      const rec = recs[rk];
      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-step">Партия ${rk + 1} из 3</p>
           <p class="mind-sub">Три партии этой игры, по ${rec.a.length} раундов, игроки А и Б. Ходы показаны такими, какими их сделали.</p>
           ${recordGrid(rec)}
           <div class="who-legend">${cell('C')} сотрудничать ${cell('D')} предать</div>
           <h4>Кто начал конфликт?</h4>
           ${choice('who', [['a', 'А'], ['b', 'Б'], ['none', 'Никто']])}
           <h4>Насколько виноват игрок А?</h4>
           ${scale('a')}
           <h4>Игрок Б?</h4>
           ${scale('b')}
           <button type="button" class="btn btn-primary mind-go">Дальше</button>
         </div>`;
      wireForm(root.querySelector('.mind-go'), v => {
        ratings[rk] = v;
        if (++rk === 3) phase = 'recog';
        render();
      });
    }

    function renderRecog() {
      root.innerHTML =
        `<div class="mind-col">
           <p class="mind-big">Была ли среди этих трёх партий ваша?</p>
           ${choice('k', [['no', 'Нет'], ['0', '№ 1'], ['1', '№ 2'], ['2', '№ 3'], ['?', 'Не знаю']])}
           <button type="button" class="btn btn-primary mind-go">Показать, что было</button>
         </div>`;
      wireForm(root.querySelector('.mind-go'), v => {
        recog = v.k;
        phase = 'result';
        reveal();
        render();
      });
    }

    function renderResult() {
      const log = game.log;
      const st = starter(log);
      const fs = feuds(log);
      const [su, sb] = scores(log.u, log.b);
      const ds = defections(log);
      const phantomAnswers = ds.filter(d => d.who === 'user' && d.kind === 'phantom').length;
      const R = r => r + 1;                                    // rounds shown 1-based

      const ANS = { bot: 'соперник', user: 'вы', none: 'никто', nothing: 'конфликта не было' };
      let head, story;
      if (st.who === 'channel' && st.dir === 'toUser') {
        head = 'Кто начал: никто';
        story = `В раунде ${R(st.glitch)} соперник сотрудничал, но до вас дошло «предал». В раунде ${R(st.r)} вы ответили предательством — а соперник, который ничего не делал, увидел нападение без причины и ответил.`;
      } else if (st.who === 'channel') {
        head = 'Кто начал: никто';
        story = `В раунде ${R(st.glitch)} вы сотрудничали, но до соперника дошло «предал». В раунде ${R(st.r)} он ответил — и для вас это выглядело как нападение без причины.`;
      } else if (st.who === 'user') {
        head = 'Кто начал: вы';
        story = `Первое предательство в игре — ваше, в раунде ${R(st.r)}: до этого все ходы соперника, дошедшие до вас, были сотрудничеством. Соперник никогда не предаёт первым.`;
      } else {
        head = 'Конфликта не было';
        story = 'Ни один из вас ни разу не предал.';
      }

      // Four-row log with distorted moves outlined.
      const gl = (r, dir) => log.glitches.some(g => g.r === r && g.dir === dir) ? ' glitch' : '';
      let nums = '';
      for (let r = 1; r <= log.u.length; r++) nums += `<b>${r % 5 === 0 || r === 1 ? r : ''}</b>`;
      const grid =
        `<div class="who-hist log" style="--n:${log.u.length}">
           <span></span><div class="who-nums">${nums}</div>
           <span>Вы сделали</span><div>${log.u.map(m => cell(m)).join('')}</div>
           <span>Соперник увидел</span><div>${log.bs.map((m, r) => cell(m, gl(r, 'toBot'))).join('')}</div>
           <span>Соперник сделал</span><div>${log.b.map(m => cell(m)).join('')}</div>
           <span>Вы увидели</span><div>${log.us.map((m, r) => cell(m, gl(r, 'toUser'))).join('')}</div>
         </div>`;

      const feudLines = fs.map(f => {
        const what = f.dir === 'toUser' ? 'ход соперника дошёл до вас как «предал»' : 'ваш ход дошёл до соперника как «предал»';
        const len = `${f.rounds} ${plural(f.rounds, 'раунд', 'раунда', 'раундов')}`;
        const span = { heal: `вражда длилась ${len}`, next: `вражда длилась ${len}, до следующего сбоя`, end: `вражда длилась ${len}, до конца игры` }[f.until];
        const tail = !f.rounds ? 'вражды не последовало.'
          : `${span}; вы потеряли ${f.lost} ${plural(f.lost, 'очко', 'очка', 'очков')}.`;
        return `<p class="who-line">Раунд ${R(f.r)}: ${what} — ${tail}</p>`;
      }).join('');

      // The player's own record, rated from outside.
      const ok = recs.findIndex(r => r.own);
      const own = recs[ok], out = ratings[ok];
      const me = own.userIs, them = me === 'a' ? 'b' : 'a';
      const meL = me === 'a' ? 'А' : 'Б', themL = me === 'a' ? 'Б' : 'А';
      const recogText = recog === String(ok) ? 'Вы её узнали.'
        : recog === 'no' || recog === '?' ? 'Вы её не узнали.' : `Вы указали на партию № ${Number(recog) + 1}.`;
      const outWho = { [me]: 'вы', [them]: 'соперник', none: 'никто' }[out.who];
      const dSelf = out[me] - inside.self, dBot = out[them] - inside.bot;
      const cmp = d => (d === 0 ? 'так же' : d > 0 ? `на ${d} строже` : `на ${-d} мягче`);
      const marks = { [me]: `${meL} — вы`, [them]: `${themL} — соперник` };

      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-big">${head}</p>
           <p class="mind-sub">Вы ответили: ${ANS[inside.who]}.</p>
           <p class="who-story">${story}</p>
           <h4>Что сделал и что увидел каждый</h4>
           ${grid}
           <div class="who-legend">${cell('C')} сотрудничать ${cell('D')} предать ${cell('D', ' glitch')} искажено связью</div>
           ${feudLines}
           ${phantomAnswers ? `<p class="who-line">Вы ответили предательством на несуществующее предательство ${phantomAnswers} ${plural(phantomAnswers, 'раз', 'раза', 'раз')}.</p>` : ''}
           <p class="who-line">Очки: вы — ${su}, соперник — ${sb}. При сотрудничестве во всех раундах было бы по ${3 * log.u.length}.</p>

           <h4>Ваша партия со стороны</h4>
           <p class="who-line">Партия № ${ok + 1} — отрывок вашей игры, раунды ${R(own.from)}–${R(own.from + own.a.length - 1)}. Вы — игрок ${meL}. ${recogText}</p>
           ${recordGrid(own, marks)}
           <table class="mind-table who-cmp">
             <tr><th></th><th>Изнутри</th><th>Со стороны</th></tr>
             <tr><td>Кто начал</td><td>${ANS[inside.who]}</td><td>${outWho}</td></tr>
             <tr><td>Ваша вина</td><td>${inside.self}</td><td>${out[me]}</td></tr>
             <tr><td>Вина соперника</td><td>${inside.bot}</td><td>${out[them]}</td></tr>
           </table>
           <p class="who-line">Не зная, что это вы, вы оценили свои ходы ${cmp(dSelf)}, а ходы соперника — ${cmp(dBot)}.</p>
           <p class="mind-note">В записи видны только сделанные ходы. Ответ на искажённый ход выглядит в ней как предательство без повода.</p>
           <button type="button" class="btn mind-go">Сыграть ещё раз</button>
         </div>`;
      root.querySelector('.mind-go').addEventListener('click', start);
    }

    function plural(n, one, few, many) {
      const m10 = n % 10, m100 = n % 100;
      if (m10 === 1 && m100 !== 11) return one;
      if (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14)) return few;
      return many;
    }

    function render() {
      root.scrollTop = 0;
      ({ intro: renderIntro, play: renderPlay, inside: renderInside, record: renderRecord,
         recog: renderRecog, result: renderResult })[phase]();
    }

    function onKey(e) {
      if (phase !== 'play' || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const m = { Digit1: 'C', Numpad1: 'C', Digit2: 'D', Numpad2: 'D' }[e.code];
      if (!m) return;
      e.preventDefault();
      move(m);
    }
    window.addEventListener('keydown', onKey, true);

    addButton(controls, { label: 'Начать заново', onClick: start });
    start();

    return () => {
      window.removeEventListener('keydown', onKey, true);
      root.remove();
    };
  },
});
