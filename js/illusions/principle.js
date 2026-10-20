'use strict';

ILLUSIONS.push({
  id: 'principle',
  section: 'mind',
  lang: 'ru',
  gated: true,
  title: 'Твой принцип',
  credit: 'Новая демонстрация на случаях Фут (1967), Томсон (1985), Камм; данные: Cushman, Young & Hauser, 2006; Hauser и др., 2007; Greene и др., 2009',
  howto: 'Сначала выберите принцип, по которому, на ваш взгляд, можно или нельзя пожертвовать одним человеком ради спасения других. Затем — десять случаев: в каждом решите, допустимо ли действие. Отвечайте так, как думаете, а не так, как велит выбранный принцип.',
  expect: 'Программа проверила каждый ваш ответ по выбранному принципу и по нескольким другим и нашла тот, что описывает ваши ответы лучше всего. Случаи составлены парами: в каждой паре случаи отличаются одним признаком — касанием, собственным усилием, расстоянием, тем, нужна ли гибель человека для спасения. Уточнив принцип, вы получаете случай, на котором новый принцип, судя по вашим прежним ответам, разойдётся с вашим мнением.',
  why: [
    'Ответы людей в таких задачах устойчиво следуют различиям, которые сами люди не называют. Вред как средство осуждают сильнее, чем вред как побочный эффект; вред от прикосновения — сильнее, чем без него. Но обосновать различие «средство — побочный эффект» может лишь меньшинство участников (Cushman, Young & Hauser, 2006). Решение приходит раньше, чем причина, а причина подбирается после.',
    'В интернет-опросе тысяч человек стрелку перевести допустимым считали около 85%, столкнуть человека с моста — около 12%. Для петли, где тело человека останавливает вагонетку, — 56%, для петли с грузом, где его гибель не нужна, — 72% (Hauser и др., 2007). Толкнуть руками или шестом считали допустимым примерно треть участников, открыть люк кнопкой — около 60%. Расстояние до кнопки почти ничего не меняло. А толчок руками, если гибель человека — лишь побочный эффект (пробегая к стрелке), одобряло большинство (Greene и др., 2009). Значимым оказалось сочетание: собственная сила и гибель как средство — вместе.',
    'Такое правило почти никто не сформулирует заранее, хотя многие по нему отвечают. Если ваши ответы лучше всего описывает принцип «Не своими силами ради цели», это то самое сочетание.',
    'Пара «Мост — Хирург» не отличается ни одним из признаков, но хирурга почти все осуждают сильнее. Значит, у интуиции есть входы, которых нет ни в одном из принципов списка: доверие к врачам, больница как место, где не убивают, «никто не узнает».',
    'Это новая демонстрация, а не воспроизведение эксперимента. Вывод о вас сделан по десяти-тринадцати ответам и восьми заранее заданным принципам. Принцип вне списка может описать вас лучше.',
  ],

  mount(stage, controls, { reveal }) {
    const MAX_CHALLENGES = 3;
    const OK = { true: 'Допустимо', false: 'Недопустимо' };

    const root = document.createElement('div');
    root.className = 'mind';
    stage.appendChild(root);

    let phase, chosen, order, k, answers, t0, current, tried, last;

    const sec = ms => (ms / 1000).toFixed(1).replace('.', ',') + ' с';
    const q = s => `«${s}»`;

    function start() {
      chosen = null;
      order = coreOrder();
      k = 0;
      answers = [];
      tried = [];
      phase = 'intro';
      render();
    }

    function ruleList(rules, counts) {
      return `<div class="pr-rules">` + rules.map(r =>
        `<button type="button" class="pr-rule" data-id="${r.id}">
           <b>${r.name}</b><span>${r.text}</span>
           ${counts ? `<small>описывает ${counts[r.id]} из ${answers.length} ваших ответов</small>` : ''}
         </button>`).join('') + '</div>';
    }

    function wireRules(go, onPick) {
      let pick;
      const bs = [...root.querySelectorAll('.pr-rule')];
      bs.forEach(b => b.addEventListener('click', () => {
        bs.forEach(x => x.classList.toggle('on', x === b));
        pick = b.dataset.id;
        go.disabled = false;
      }));
      go.disabled = true;
      go.addEventListener('click', () => onPick(pick));
    }

    function renderIntro() {
      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-big">Когда можно пожертвовать одним, чтобы спасти других?</p>
           <p class="mind-sub">Выберите принцип, ближе всего к вашему мнению. Дальше будут десять случаев.</p>
           ${ruleList(P_RULES.filter(r => r.initial))}
           <button type="button" class="pr-rule pr-none" data-id="">
             <b>Ни один не подходит</b><span>Программа проверит только, какой принцип описывает ваши ответы.</span>
           </button>
           <button type="button" class="btn btn-primary mind-go">Дальше</button>
         </div>`;
      wireRules(root.querySelector('.mind-go'), id => {
        chosen = id || null;
        phase = 'case';
        render();
      });
    }

    function renderCase(c, step) {
      current = c;
      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-step">${step}</p>
           <p class="mind-big">${c.title}</p>
           <p class="pr-text">${c.text}</p>
           <p class="pr-q">${c.q}</p>
           <div class="pr-yn">
             <button type="button" class="btn" data-v="1">Допустимо<kbd>1</kbd></button>
             <button type="button" class="btn" data-v="0">Недопустимо<kbd>2</kbd></button>
           </div>
         </div>`;
      root.querySelectorAll('.pr-yn button').forEach(b => b.addEventListener('click', () => answer(b.dataset.v === '1')));
      t0 = performance.now();
    }

    function answer(ok) {
      if (phase !== 'case' && phase !== 'challenge') return;
      if (performance.now() - t0 < 300) return;               // a double press must not answer the next case
      answers.push({ id: current.id, ok, ms: performance.now() - t0 });
      if (phase === 'case') {
        if (++k === order.length) { phase = 'result'; reveal(); }
      } else {
        const rule = ruleById(tried[tried.length - 1].rule);
        last = { c: current, ok, says: rule.f(current), rule };
        tried[tried.length - 1].held = last.says === ok;
        phase = 'verdict';
      }
      render();
    }

    function fitTable(limit) {
      const fit = fitRules(answers);
      return fit.slice(0, limit).map(x =>
        `<p class="pr-fit${x.rule.id === chosen ? ' mine' : ''}"><b>${x.agree} из ${answers.length}</b> ${q(x.rule.name)}${x.rule.id === chosen ? ' — ваш выбор' : ''}<span>${x.rule.text}</span></p>`).join('');
    }

    function renderResult() {
      const rule = chosen && ruleById(chosen);
      const bad = rule ? violations(rule, answers) : [];
      const badIds = new Set(bad.map(a => a.id));
      const head = !rule ? 'Ваши десять ответов'
        : bad.length ? `Ваш принцип расходится с вашими ответами в <b>${bad.length}</b> из ${answers.length} случаев`
        : `Ваш принцип описал все ${answers.length} ответов`;

      const rows = answers.map(a => {
        const c = caseById(a.id);
        return `<tr class="${badIds.has(a.id) ? 'bad' : ''}"><td>${c.title}</td><td>${OK[a.ok]}</td>
                ${rule ? `<td>${OK[rule.f(c)]}</td>` : ''}<td>${sec(a.ms)}</td></tr>`;
      }).join('');

      const ps = pairs(answers).map(p =>
        `<p class="pr-pair ${p.same ? 'same' : 'diff'}">${q(p.x.title)} и ${q(p.y.title)} отличаются ${p.diff}.
           <b>${p.same ? `Вы ответили одинаково: ${OK[p.okX].toLowerCase()}.` : `Вы ответили по-разному: ${OK[p.okX].toLowerCase()} и ${OK[p.okY].toLowerCase()}.`}</b></p>`).join('');

      const byTime = answers.slice().sort((x, y) => y.ms - x.ms);
      const slow = caseById(byTime[0].id), fast = caseById(byTime[byTime.length - 1].id);

      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-big">${head}</p>
           ${rule ? `<p class="mind-sub">${q(rule.name)}: ${rule.text}</p>` : '<p class="mind-sub">&nbsp;</p>'}
           <table class="mind-table pr-table">
             <tr><th>Случай</th><th>Ваш ответ</th>${rule ? '<th>По принципу</th>' : ''}<th>Время</th></tr>
             ${rows}
           </table>
           <p class="mind-note">Дольше всего вы решали ${q(slow.title)} (${sec(byTime[0].ms)}), быстрее всего — ${q(fast.title)} (${sec(byTime[byTime.length - 1].ms)}).</p>
           <h4>Какие принципы описывают ваши ответы</h4>
           ${fitTable(3)}
           <h4>Пары случаев</h4>
           ${ps}
           <div class="pr-actions">
             <button type="button" class="btn btn-primary mind-go">Уточнить принцип</button>
             <button type="button" class="btn mind-go">Начать заново</button>
           </div>
         </div>`;
      const [revise, again] = root.querySelectorAll('.pr-actions button');
      revise.addEventListener('click', () => { phase = 'revise'; render(); });
      again.addEventListener('click', start);
    }

    function renderRevise() {
      const counts = Object.fromEntries(fitRules(answers).map(x => [x.rule.id, x.agree]));
      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-big">Какой принцип ближе к вашему мнению теперь?</p>
           <p class="mind-sub">Он будет проверен на новом случае.</p>
           ${ruleList(P_RULES, counts)}
           <button type="button" class="btn btn-primary mind-go">Проверить</button>
         </div>`;
      wireRules(root.querySelector('.mind-go'), id => {
        const rule = ruleById(id);
        const c = challenge(rule, answers);
        chosen = id;
        tried.push({ rule: id, case: c.id });
        phase = 'challenge';
        renderCase(c, `Проверка принципа ${q(rule.name)}`);
      });
    }

    function renderVerdict() {
      const { c, ok, says, rule } = last;
      const held = says === ok;
      const agree = answers.length - violations(rule, answers).length;
      const more = tried.length < MAX_CHALLENGES && challenge(rule, answers);
      root.innerHTML =
        `<div class="mind-col">
           <p class="mind-step">${c.title}</p>
           <p class="mind-big">${held ? 'Принцип выдержал этот случай' : 'Принцип не выдержал'}</p>
           <p class="mind-sub">${q(rule.name)} говорит: ${OK[says].toLowerCase()}. Вы ответили: ${OK[ok].toLowerCase()}.</p>
           <p class="who-line">Теперь он описывает ${agree} из ${answers.length} ваших ответов.</p>
           <div class="pr-actions">
             ${more ? '<button type="button" class="btn btn-primary mind-go" data-a="revise">Уточнить ещё раз</button>' : ''}
             <button type="button" class="btn mind-go" data-a="final">Итог</button>
           </div>
         </div>`;
      root.querySelectorAll('.pr-actions button').forEach(b =>
        b.addEventListener('click', () => { phase = b.dataset.a; render(); }));
    }

    function renderFinal() {
      const lines = tried.map(t => {
        const r = ruleById(t.rule);
        return `<tr class="${t.held ? '' : 'bad'}"><td>${r.name}</td><td>${caseById(t.case).title}</td><td>${t.held ? 'выдержал' : 'не выдержал'}</td></tr>`;
      }).join('');
      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-big">Проверено принципов: ${tried.length}, выдержали проверку: ${tried.filter(t => t.held).length}</p>
           <table class="mind-table pr-table">
             <tr><th>Принцип</th><th>Случай</th><th>Итог</th></tr>
             ${lines}
           </table>
           <h4>По всем ${answers.length} ответам</h4>
           ${fitTable(3)}
           <button type="button" class="btn mind-go">Начать заново</button>
         </div>`;
      root.querySelector('.mind-go').addEventListener('click', start);
    }

    function render() {
      root.scrollTop = 0;
      if (phase === 'case') return renderCase(caseById(order[k]), `Случай ${k + 1} из ${order.length}`);
      ({ intro: renderIntro, result: renderResult, revise: renderRevise, verdict: renderVerdict, final: renderFinal })[phase]();
    }

    function onKey(e) {
      if ((phase !== 'case' && phase !== 'challenge') || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
      const v = { Digit1: true, Numpad1: true, Digit2: false, Numpad2: false }[e.code];
      if (v === undefined) return;
      e.preventDefault();
      answer(v);
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
