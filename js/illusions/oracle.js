'use strict';

ILLUSIONS.push({
  id: 'oracle',
  section: 'mind',
  lang: 'ru',
  gated: true,
  title: 'Оракул',
  credit: 'Шеннон, 1953; Хагельбаргер, 1956; «оракул Ааронсона»; данные: Guseva и др., 2023',
  howto: 'Нажмите F или J (в русской раскладке — А и О) двести раз, или кнопки на экране. Цель — последовательность, которую невозможно предсказать, как броски монеты.',
  expect: 'Перед каждым нажатием программа делала ставку на ваш следующий выбор. Людей она обычно угадывает в 60–70% случаев. Монету — примерно в половине случаев, что видно по последовательности из генератора случайных чисел той же длины. Во втором раунде ставка показывается после каждого нажатия, а программа помнит первый раунд.',
  why: [
    'Программа начинает с модели того, как люди в целом изображают случайность: она обучена на 388 участниках эксперимента, сделавших по 1000 выборов (Guseva и др., 2023). Дальше она подстраивается под вас. Рядом с этой моделью работают несколько десятков счётчиков: что вы нажимали после такого же отрезка последних нажатий, после такого же рисунка повторов и смен, после перевеса одной клавиши, после того как ставка угадала. Каждая ошибка уменьшает вес того, кто ошибся, и решения переходят к тем, кто описывает именно вас.',
    'У монеты смена клавиши случается ровно в половине бросков, серии из 6–8 одинаковых на двести бросков обычны, а счёт F и J гуляет без всякой памяти. Человек так не может: одни меняют клавишу слишком часто, другие слишком редко, почти все избегают длинных серий и выравнивают счёт за последние полтора десятка нажатий. Каждый короткий отрезок должен «выглядеть случайным» — это и есть закономерность (Wagenaar, 1972; Nickerson, 2002).',
    'Чем дольше, тем предсказуемее: в тех же данных у новичков машина угадывала в среднем 61% первой сотни выборов и 68% второй. Внимание устаёт, и человек скатывается к привычным ходам. Поэтому в первом раунде двести нажатий.',
    'Знание о ловушке помогает мало. «Сейчас схитрю и повторю» — тоже правило, и счётчики находят его за несколько десятков нажатий. Когда ставки видны, люди начинают реагировать на них: «угадала — значит, сменю». Это тоже правило, и его программа ловит быстрее всего.',
  ],

  mount(stage, controls, { reveal }) {
    const N = 200;    // round 1, blind
    const N2 = 100;   // round 2, bets shown after each press
    const KEYS = ['F', 'J'];
    const RU = ['А', 'О'];     // same physical keys in the Russian layout
    const CODES = { KeyF: 0, KeyJ: 1 };

    const root = document.createElement('div');
    root.className = 'mind';
    stage.appendChild(root);

    // Ranges a fair coin produces over N presses (5th–95th percentile). Bets on a coin
    // hit exactly at chance whatever the model, so that range is binomial.
    const typical = (() => {
      const runs = [], sw = [], ones = [];
      for (let r = 0; r < 600; r++) {
        const st = seqStats(Array.from({ length: N }, () => (Math.random() < 0.5 ? 1 : 0)));
        runs.push(st.longest); sw.push(st.switchRate); ones.push(st.ones);
      }
      const q = a => { a.sort((x, y) => x - y); return [a[Math.floor(a.length * 0.05)], a[Math.floor(a.length * 0.95)]]; };
      let hi = Math.ceil(N / 2);
      while (binomTail(N, hi) > 0.05) hi++;
      return { runs: q(runs), sw: q(sw), ones: q(ones), hit: [N - hi, hi] };
    })();

    let phase, seq, hits, oracle, guess, lastBet, times, srcs;

    // Finished rounds are kept in localStorage (key 'oracle-log', last 40) for tuning the model.
    function logRound(from) {
      try {
        const log = JSON.parse(localStorage.getItem('oracle-log') || '[]');
        log.push({
          at: new Date().toISOString(), round: from ? 2 : 1,
          seq: seq.slice(from).join(''), hits: hits.slice(from).map(Number).join(''),
          src: srcs.slice(from).join(''), ms: times.slice(from).map((t, i) => Math.round(t - (times[from + i - 1] ?? t))),
        });
        localStorage.setItem('oracle-log', JSON.stringify(log.slice(-40)));
      } catch (e) { /* storage unavailable */ }
    }

    function start() {
      phase = 'blind';
      seq = []; hits = []; times = []; srcs = [];
      oracle = makeOracle();
      guess = oracle.predict();
      renderPlay();
    }

    function press(x, src) {
      if (phase !== 'blind' && phase !== 'live') return;
      times.push(performance.now());
      srcs.push(src);
      lastBet = guess;
      hits.push(guess === x);
      seq.push(x);
      oracle.update(x);
      guess = oracle.predict();
      if (phase === 'blind' && seq.length === N) { phase = 'result'; logRound(0); reveal(); renderResult(); return; }
      if (phase === 'live' && seq.length === N + N2) { phase = 'done'; logRound(N); renderFinal(); return; }
      renderPlay();
      flash(x);
    }

    const strip = (s, h) =>
      `<div class="oracle-strip">${s.map((x, i) =>
        `<i class="k${x}${h && h[i] ? ' hit' : ''}"></i>`).join('')}</div>`;

    const pad = () =>
      `<div class="oracle-keys">${KEYS.map((k, x) =>
        `<button type="button" class="k${x}" data-x="${x}">${k}<small>${RU[x]}</small></button>`).join('')}</div>`;

    function renderPlay() {
      if (phase === 'blind') {
        root.innerHTML =
          `<div class="mind-col">
             <p class="mind-step">Раунд 1 из 2</p>
             <p class="mind-big"><b>${seq.length}</b> / ${N}</p>
             ${pad()}
             ${strip(seq)}
           </div>`;
      } else {
        const n = hits.length - N, h = hits.slice(N).filter(Boolean).length;
        root.innerHTML =
          `<div class="mind-col">
             <p class="mind-step">Раунд 2 из 2 · ${n} / ${N2}</p>
             <p class="mind-big">Машина угадала <b>${h}</b> из ${n}</p>
             <p class="mind-sub">${n ? `Ставка была на ${KEYS[lastBet]}: ${hits[hits.length - 1] ? 'угадала' : 'не угадала'}` : 'Ставка показывается после нажатия'}</p>
             ${pad()}
             ${strip(seq.slice(N), hits.slice(N))}
             <p class="mind-note">Точка — машина угадала это нажатие.</p>
           </div>`;
      }
      root.querySelectorAll('.oracle-keys button').forEach(b =>
        b.addEventListener('click', e => press(Number(b.dataset.x), e.detail ? 'm' : 'k')));
    }

    function flash(x) {
      const b = root.querySelector(`.oracle-keys button[data-x="${x}"]`);
      if (b) { b.classList.add('down'); setTimeout(() => b.classList.remove('down'), 90); }
    }

    function renderResult() {
      const coin = Array.from(crypto.getRandomValues(new Uint8Array(N)), v => v & 1);
      const coinHits = oracleHits(coin);
      const h = hits.filter(Boolean).length;
      const ch = coinHits.filter(Boolean).length;
      const me = seqStats(seq), co = seqStats(coin);
      const p = binomTail(N, h);
      const odds = 1 / p;
      const oddsText = odds >= 100
        ? Number(odds.toPrecision(2)).toLocaleString('ru-RU')
        : String(Math.round(odds));
      const verdict = p < 0.05
        ? `Угадать монету ${h} раз из ${N} можно с вероятностью 1 из ${oddsText}.`
        : 'Это в пределах случайности: монету машина угадывает примерно так же.';
      const pct = v => `${Math.round(v * 100)}%`;
      const range = ([a, b], f = String) => `${f(a)}–${f(b)}`;

      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-big">Угадано <b>${h}</b> из ${N}</p>
           <p class="mind-sub">${verdict}</p>
           <table class="mind-table">
             <thead><tr><th></th><th>Вы</th><th>Монета</th><th>Обычно у монеты</th></tr></thead>
             <tbody>
               <tr><td>Машина угадала</td><td>${h}</td><td>${ch}</td><td>${range(typical.hit)}</td></tr>
               <tr><td>Смена клавиши</td><td>${pct(me.switchRate)}</td><td>${pct(co.switchRate)}</td><td>${range(typical.sw, pct)}</td></tr>
               <tr><td>Самая длинная серия</td><td>${me.longest}</td><td>${co.longest}</td><td>${range(typical.runs)}</td></tr>
               <tr><td>Нажатий F</td><td>${N - me.ones}</td><td>${N - co.ones}</td><td>${range([N - typical.ones[1], N - typical.ones[0]])}</td></tr>
             </tbody>
           </table>
           <h4>Ваши нажатия</h4>
           ${strip(seq, hits)}
           <h4>Монета: ${N} значений из генератора случайных чисел</h4>
           ${strip(coin, coinHits)}
           <p class="mind-note">Точка — машина угадала это нажатие.</p>
           <button type="button" class="btn btn-primary mind-go">Раунд 2: ставка видна после нажатия</button>
         </div>`;
      root.querySelector('.mind-go').addEventListener('click', () => { phase = 'live'; renderPlay(); });
    }

    function renderFinal() {
      const h1 = hits.slice(0, N).filter(Boolean).length;
      const h2 = hits.slice(N).filter(Boolean).length;
      const r1 = Math.round(100 * h1 / N);
      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-step">Раунд 2 — итог</p>
           <p class="mind-big">Угадано <b>${h2}</b> из ${N2}</p>
           <p class="mind-sub">В первом раунде — ${h1} из ${N} (${r1}%). Во втором вы знали о программе и видели каждую её ставку.</p>
           <h4>Раунд 2</h4>
           ${strip(seq.slice(N), hits.slice(N))}
           <h4>Раунд 1</h4>
           ${strip(seq.slice(0, N), hits.slice(0, N))}
           <p class="mind-note">Точка — машина угадала это нажатие.</p>
           <button type="button" class="btn mind-go">Начать заново</button>
         </div>`;
      root.querySelector('.mind-go').addEventListener('click', start);
    }

    function onKey(e) {
      if (e.altKey || e.ctrlKey || e.metaKey || !(e.code in CODES)) return;
      if (phase !== 'blind' && phase !== 'live') return;
      e.preventDefault();
      e.stopPropagation();
      if (!e.repeat) press(CODES[e.code], 'k');
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
