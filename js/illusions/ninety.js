'use strict';

ILLUSIONS.push({
  id: 'ninety',
  section: 'mind',
  lang: 'ru',
  gated: true,
  title: 'Девяносто процентов',
  credit: 'Алперт и Райффа, 1969/1982; Фишхофф и Бейт, 1975; Хелл и др., 1988',
  howto: 'Пять вопросов с числовым ответом. На каждый дайте лучшую догадку и две границы, между которыми правильный ответ лежит с вероятностью 90%: так, чтобы в среднем ошибиться в одном вопросе из десяти. Ничего не ищите — задача в честной оценке собственного знания.',
  expect: 'Диапазоны «на 90%» обычно содержат ответ примерно в половине вопросов, а не в девяти из десяти — и у тех, кто знает об этом эффекте. Второй этап проверял память: узнав правильный ответ, люди часто вспоминают свою догадку ближе к нему, чем она была, и помнят себя попавшими в диапазон чаще, чем попали на самом деле. Под итогом — что было записано и что вы вспомнили, по каждому вопросу.',
  why: [
    'Избыточная точность (overprecision) — самое устойчивое из искажений уверенности. В десятках исследований на студентах, менеджерах и экспертах 90-процентные диапазоны содержат ответ примерно в половине случаев (Alpert & Raiffa, 1982; Soll & Klayman, 2004; Moore & Healy, 2008). Диапазон строится от первой пришедшей в голову догадки, и границы отодвигаются от неё недостаточно далеко. Неуверенность ощущается как «где-то около», а не как перечень всего, что могло бы быть правдой.',
    'Ошибка не в незнании: не знать год смерти Галилея нормально. Ошибка в том, что диапазон слишком узок для того, насколько мало вы знаете. Ширина, при которой девять из десяти попадают, ощущается как «я ничего не знаю» — и именно поэтому её не выбирают.',
    'Знание задним числом (hindsight bias). Догадка не хранится в памяти как запись. Когда её нужно вспомнить, она восстанавливается из того, что вы знаете сейчас, а сейчас вы знаете ответ — и восстановление тянется к нему (Fischhoff & Beyth, 1975; Hell и др., 1988; модель RAFT: Hoffrage, Hertwig & Gigerenzer, 2000). Если догадка запомнилась точно, сдвига нет, поэтому точные воспоминания посчитаны отдельно. Тот же механизм заставляет помнить себя попавшим: правильный ответ кажется теперь очевидным, а значит, он «наверняка» был внутри.',
    'Без записи ни одно из этих искажений нельзя заметить: вспоминая прошлые прогнозы, человек сверяется с памятью, которая уже исправлена.',
  ],

  mount(stage, controls, { reveal }) {
    const N = 5;
    const SEEN = 'ninety-seen';

    const root = document.createElement('div');
    root.className = 'mind';
    stage.appendChild(root);

    const fmt = v => v.toLocaleString('ru-RU', { maximumFractionDigits: 2 });
    const unit = it => (it.unit ? ' ' + it.unit : '');

    let phase, items, i, ans, predicted;

    function readSeen() {
      try { return JSON.parse(localStorage.getItem(SEEN) || '[]'); } catch (e) { return []; }
    }
    function markSeen() {
      try {
        const s = new Set(readSeen());
        items.forEach(it => s.add(it.id));
        localStorage.setItem(SEEN, JSON.stringify([...s]));
      } catch (e) { /* storage unavailable */ }
    }

    function start() {
      let seen = readSeen();
      if (seen.length > NINE_ITEMS.length - N) seen = [];     // pool exhausted: start over
      items = pickItems(N, seen);
      ans = items.map(() => ({}));
      phase = 'ask'; i = 0;
      render();
    }

    // Number fields: Enter moves to the next field, and on the last one presses `go`.
    function wireFields(fields, go, check) {
      const update = () => { go.disabled = !check(); };
      fields.forEach((f, k) => {
        f.addEventListener('input', update);
        f.addEventListener('keydown', e => {
          if (e.key !== 'Enter') return;
          e.preventDefault();
          if (k < fields.length - 1) fields[k + 1].focus();
          else if (!go.disabled) go.click();
        });
      });
      update();
      fields[0].focus();
    }

    const field = (cls, label) =>
      `<label class="ninety-field"><span>${label}</span>` +
      `<input class="${cls}" type="text" inputmode="decimal" autocomplete="off" spellcheck="false"></label>`;

    function renderAsk() {
      const it = items[i];
      root.innerHTML =
        `<div class="mind-col">
           <p class="mind-step">Вопрос ${i + 1} из ${N}</p>
           <p class="mind-big ninety-q">${it.q}</p>
           <p class="mind-sub">${it.unit || '&nbsp;'}</p>
           <div class="ninety-fields">
             ${field('lo', 'Нижняя граница')}
             ${field('mid', 'Лучшая догадка')}
             ${field('hi', 'Верхняя граница')}
           </div>
           <p class="mind-note ninety-msg">Ответ лежит между границами с вероятностью 90%.</p>
           <button type="button" class="btn btn-primary mind-go">Дальше</button>
         </div>`;
      const [lo, mid, hi] = ['lo', 'mid', 'hi'].map(c => root.querySelector('input.' + c));
      const go = root.querySelector('.mind-go');
      const msg = root.querySelector('.ninety-msg');
      const check = () => {
        const v = [lo, mid, hi].map(f => parseNum(f.value));
        [lo, mid, hi].forEach((f, k) => f.classList.toggle('bad', f.value.trim() !== '' && v[k] === null));
        if (v.includes(null)) return false;
        const order = v[0] <= v[1] && v[1] <= v[2];
        msg.textContent = order
          ? 'Ответ лежит между границами с вероятностью 90%.'
          : 'Нужно: нижняя граница ≤ догадка ≤ верхняя граница.';
        msg.classList.toggle('bad', !order);
        return order;
      };
      go.addEventListener('click', () => {
        Object.assign(ans[i], { lo: parseNum(lo.value), mid: parseNum(mid.value), hi: parseNum(hi.value) });
        if (++i === N) phase = 'predict';
        render();
      });
      wireFields([lo, mid, hi], go, check);
    }

    function renderPredict() {
      root.innerHTML =
        `<div class="mind-col">
           <p class="mind-big">Сколько из ${N} ваших диапазонов содержат правильный ответ?</p>
           <p class="mind-sub">Ваша оценка, от 0 до ${N}.</p>
           <div class="ninety-fields one">${field('n', 'Попаданий')}</div>
           <button type="button" class="btn btn-primary mind-go">Показать ответы</button>
         </div>`;
      const f = root.querySelector('input.n');
      const go = root.querySelector('.mind-go');
      const val = () => {
        const v = parseNum(f.value);
        return v !== null && Number.isInteger(v) && v >= 0 && v <= N ? v : null;
      };
      go.addEventListener('click', () => {
        predicted = val();
        phase = 'recall'; i = 0;
        markSeen();
        render();
      });
      wireFields([f], go, () => val() !== null);
    }

    function renderRecall() {
      const it = items[i];
      root.innerHTML =
        `<div class="mind-col">
           <p class="mind-step">Ответ ${i + 1} из ${N}</p>
           <p class="mind-sub ninety-recall-q">${it.q}</p>
           <p class="mind-big"><b>${fmt(it.a)}</b>${unit(it)}</p>
           <p class="mind-note">Вспомните без подсказок, что вы написали.</p>
           <div class="ninety-fields one">${field('r', 'Ваша лучшая догадка была')}</div>
           <p class="ninety-ask">Правильный ответ попал в ваш диапазон?</p>
           <div class="ninety-yn">
             <button type="button" class="btn" data-v="1">Попал</button>
             <button type="button" class="btn" data-v="0">Не попал</button>
           </div>
         </div>`;
      const f = root.querySelector('input.r');
      const yn = [...root.querySelectorAll('.ninety-yn button')];
      const update = () => {
        const ok = parseNum(f.value) !== null;
        f.classList.toggle('bad', f.value.trim() !== '' && !ok);
        yn.forEach(b => { b.disabled = !ok; });
      };
      f.addEventListener('input', update);
      f.addEventListener('keydown', e => { if (e.key === 'Enter' && !yn[0].disabled) yn[0].focus(); });
      yn.forEach(b => b.addEventListener('click', () => {
        Object.assign(ans[i], { recall: parseNum(f.value), saidHit: b.dataset.v === '1' });
        if (++i === N) { phase = 'result'; reveal(); }
        render();
      }));
      update();
      f.focus();
    }

    function row(it, a) {
      const hit = a.lo <= it.a && it.a <= a.hi;
      const d = drift(a.mid, a.recall, it.a);
      let lo = Math.min(a.lo, it.a, a.recall), hi = Math.max(a.hi, it.a, a.recall);
      const pad = Math.max((hi - lo) * 0.06, Math.abs(hi) * 0.01, 0.5);
      lo -= pad; hi += pad;
      const x = v => `${(100 * (v - lo) / (hi - lo)).toFixed(2)}%`;
      const memo = {
        exact: 'вспомнили точно',
        hit: `вспомнили ${fmt(a.recall)}`,
        toward: `вспомнили ${fmt(a.recall)} — на ${Math.round(100 * d.shift)}% ближе к ответу`,
        away: `вспомнили ${fmt(a.recall)} — дальше от ответа`,
      }[d.kind];
      const said = a.saidHit === hit ? '' : ` · считали, что ${a.saidHit ? 'попали' : 'не попали'}`;
      return `<div class="ninety-row ${hit ? 'hit' : 'miss'}">
          <p class="ninety-row-q">${it.q}</p>
          <div class="ninety-track">
            <span class="ninety-range" style="left:${x(a.lo)};width:calc(${x(a.hi)} - ${x(a.lo)})"></span>
            <span class="ninety-mark mid" style="left:${x(a.mid)}"></span>
            <span class="ninety-mark rec" style="left:${x(a.recall)}"></span>
            <span class="ninety-mark ans" style="left:${x(it.a)}"></span>
          </div>
          <p class="ninety-row-meta"><b>${hit ? 'Попал' : 'Мимо'}</b> · ответ ${fmt(it.a)}${unit(it)} · диапазон ${fmt(a.lo)}–${fmt(a.hi)} ·
            догадка ${fmt(a.mid)}, ${memo}${said}</p>
        </div>`;
    }

    function renderResult() {
      const hits = items.filter((it, k) => ans[k].lo <= it.a && it.a <= ans[k].hi).length;
      const said = ans.filter(a => a.saidHit).length;
      const ds = items.map((it, k) => drift(ans[k].mid, ans[k].recall, it.a));
      const count = kind => ds.filter(d => d.kind === kind).length;
      const moved = ds.filter(d => d.kind === 'toward' || d.kind === 'away');
      const med = median(moved.map(d => d.shift));

      const p = binomCdf(N, 0.9, hits);
      const calib = p >= 0.2
        ? 'Для 90-процентных диапазонов это ожидаемый результат.'
        : `Будь диапазоны действительно 90-процентными, ${hits} или меньше попаданий выпадало бы ${p < 0.001 ? 'реже чем в одном случае из тысячи' : `с вероятностью ${(100 * p).toFixed(p < 0.01 ? 2 : 1).replace('.', ',')}%`}.`;

      const memLines = [
        `Вы вспомнили, что попали в ${said} из ${N}; на деле — в ${hits}.`,
        `Точно вспомнили догадку: ${count('exact')} из ${N}.` +
          (moved.length ? ` Из вспомненных неточно ${count('toward')} сдвинулись к ответу, ${count('away')} — от ответа.` : ''),
        med !== null ? `Медианный сдвиг: ${Math.round(100 * med)}% пути от догадки к ответу.` : '',
      ].filter(Boolean);

      root.innerHTML =
        `<div class="mind-col wide">
           <p class="mind-big">В диапазон попало <b>${hits}</b> из ${N}</p>
           <p class="mind-sub">Вы ожидали ${predicted}. ${calib}</p>
           <h4>Память о собственных ответах</h4>
           ${memLines.map(t => `<p class="ninety-line">${t}</p>`).join('')}
           <h4>По вопросам</h4>
           <div class="ninety-legend">
             <span><i class="ninety-range"></i>ваш диапазон</span>
             <span><i class="ninety-mark mid"></i>догадка</span>
             <span><i class="ninety-mark rec"></i>вспомненная догадка</span>
             <span><i class="ninety-mark ans"></i>ответ</span>
           </div>
           ${items.map((it, k) => row(it, ans[k])).join('')}
           <button type="button" class="btn mind-go">Новые вопросы</button>
         </div>`;
      root.querySelector('.mind-go').addEventListener('click', start);
    }

    function render() {
      root.scrollTop = 0;
      ({ ask: renderAsk, predict: renderPredict, recall: renderRecall, result: renderResult })[phase]();
    }

    addButton(controls, { label: 'Новые вопросы', onClick: start });
    start();

    return () => root.remove();
  },
});
