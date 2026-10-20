'use strict';

{
  const plural = (n, forms) => {
    const a = n % 100, b = n % 10;
    return forms[a > 10 && a < 20 ? 2 : b === 1 ? 0 : b >= 2 && b <= 4 ? 1 : 2];
  };
  const N1 = 2 * SIG.pairs1;
  const STATEMENTS = n => `${n} ${plural(n, ['утверждение', 'утверждения', 'утверждений'])}`;

  ILLUSIONS.push({
    id: 'signature',
    section: 'mind',
    lang: 'ru',
    gated: true,
    title: 'Подпись',
    credit: 'Новая демонстрация. Слепота к выбору: Johansson & Hall, 2005; Hall, Johansson & Strandberg, 2012; Strandberg и др., 2018',
    howto: `${STATEMENTS(N1)} о ценностях: отметьте, насколько вы согласны с каждым, от 1 до 7. Затем программа покажет ваш профиль убеждений. Проверьте, что ответы записаны верно, к некоторым напишите одной фразой, почему вы так считаете, и подпишите профиль. Клавиши 1–7 и Enter.`,
    expect: `В профиле ${SIG.swaps1} из ${N1} ответов были заменены на противоположные: «скорее нет» на «скорее да» и наоборот. Программа выбрала их по тому, как вы отвечали, и до показа профиля записала, какие ответы подменит и какие из подмен вы примете как свои. Код сессии был хешем SHA-256 этой записи: её нельзя было изменить задним числом. Люди обычно пропускают большую часть таких подмен и объясняют ответы, которых не давали. Во втором раунде число подмен тоже было запечатано, и оно могло быть нулём: насторожённые люди начинают отрекаться от собственных ответов.`,
    why: [
      'Слепота к выбору (choice blindness). Участники выбирали из двух фотографий более привлекательное лицо, а экспериментатор незаметно подавал им другое. Большинство подмен не замечали и объясняли выбор, которого не делали, — ссылаясь на серьги, которых не было на выбранном фото (Johansson, Hall и др., 2005). То же происходит с моральными убеждениями. В анкете, которая незаметно переворачивала ответы, 69% участников пропустили хотя бы одну из двух подмен, и многие уверенно защищали позицию, противоположную своей (Hall, Johansson & Strandberg, 2012).',
      'Убеждение не лежит в памяти готовой записью, которую можно прочитать. Его восстанавливают по тому, что видно сейчас, в том числе по собственным поступкам (теория самовосприятия: Bem, 1972; Nisbett & Wilson, 1977). Если в профиле написано «согласен», причины согласиться находятся. Восстановление идёт и в памяти: принятая подмена тянет к себе воспоминание о собственном ответе и может сдвинуть мнение на неделю и дольше (Strandberg и др., 2018).',
      'Подмены выбраны не случайно. Программа брала умеренные ответы, а не крайние, и ответы, над которыми вы думали дольше обычного или которые меняли. Если ответ расходился с парным утверждением (каждая ценность задана дважды, с двух сторон), подмена делала вас последовательнее. В исследованиях время ответа предсказывает, заметят ли подмену, а уверенность в подменённых ответах ниже, даже когда подмену не заметили. Веса программы заданы вручную по направлениям этих эффектов и не подогнаны по данным.',
      'Знание о ловушке её не снимает. Предупреждённые участники замечают подмены быстрее, но не всегда. Настороженность работает и в обратную сторону: тот же механизм восстановления делает непривычным собственный ответ, и он начинает казаться подменённым.',
      'Это новая демонстрация, а не воспроизведение эксперимента. По нашим сведениям, выбор подмен по модели конкретного человека, запечатанный прогноз для него и проверку ложных отречений после разоблачения раньше не соединяли. Вывод сделан про вас одного, по нескольким ответам. Ваши настоящие ответы приведены в итоге.',
    ],

    mount(stage, controls, { reveal }) {
      const SEEN = 'signature-seen';
      const KEYS = { Digit1: 1, Digit2: 2, Digit3: 3, Digit4: 4, Digit5: 5, Digit6: 6, Digit7: 7,
        Numpad1: 1, Numpad2: 2, Numpad3: 3, Numpad4: 4, Numpad5: 5, Numpad6: 6, Numpad7: 7 };

      const root = document.createElement('div');
      root.className = 'mind';
      stage.appendChild(root);

      const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
      const say = r => `${r} — ${SIG_SCALE[r]}`;
      const group = hash => hash.match(/.{4}/g).join(' ');

      // R[1], R[2]: { items, ans, swaps, seal, flags, reasons }; round 1 also has controls, recall.
      let phase, round, R, k, pick, recallOrder;

      function readSeen() {
        try { return JSON.parse(localStorage.getItem(SEEN) || '[]'); } catch (e) { return []; }
      }
      function markSeen(items) {
        try {
          const s = new Set(readSeen());
          items.forEach(it => s.add(it.pair));
          localStorage.setItem(SEEN, JSON.stringify([...s]));
        } catch (e) { /* storage unavailable */ }
      }

      function start() {
        let seen = readSeen();
        if (seen.length > SIG_PAIRS.length - SIG.pairs1 - SIG.pairs2) seen = [];   // pool exhausted: start over
        const [a, b] = sigPick([SIG.pairs1, SIG.pairs2], seen);
        R = { 1: { items: a, ans: [] }, 2: { items: b, ans: [] } };
        round = 1;
        phase = 'intro';
        render();
      }

      const swapAt = (r, i) => R[r].swaps.find(s => s.i === i);
      const shown = (r, i) => (swapAt(r, i) ? swapAt(r, i).to : R[r].ans[i].r);

      function scale(value, live) {
        let b = '';
        for (let v = 1; v <= 7; v++) {
          b += `<button type="button" class="btn${v === value ? ' on' : ''}" data-v="${v}"${live ? '' : ' disabled tabindex="-1"'}>${v}</button>`;
        }
        return `<div class="sig-scale${live ? '' : ' still'}">${b}</div>`;
      }
      const ends = '<div class="sig-ends"><span>совсем не согласен</span><span>полностью согласен</span></div>';

      function renderIntro() {
        root.innerHTML =
          `<div class="mind-col">
             <p class="mind-big">Подпись</p>
             <p class="mind-sub">${STATEMENTS(R[1].items.length)} о том, что правильно и что важно. Правильных ответов нет.
               Отвечайте быстро, как думаете сейчас.</p>
             <button type="button" class="btn btn-primary mind-go">Начать</button>
           </div>`;
        root.querySelector('.mind-go').addEventListener('click', () => { phase = 'rate'; k = 0; render(); });
      }

      /* One statement on a live 1–7 scale; onDone(value, ms, changes). */
      function renderScale(step, text, sub, onDone) {
        root.innerHTML =
          `<div class="mind-col">
             <p class="mind-step">${step}</p>
             <p class="sig-text">${esc(text)}</p>
             ${sub ? `<p class="mind-sub">${sub}</p>` : ''}
             ${scale(null, true)}${ends}
             <p class="mind-note sig-label">&nbsp;</p>
             <button type="button" class="btn btn-primary mind-go" disabled>Дальше</button>
           </div>`;
        const t0 = performance.now();
        const go = root.querySelector('.mind-go');
        const label = root.querySelector('.sig-label');
        const btns = [...root.querySelectorAll('.sig-scale button')];
        let value = null, clicks = 0;
        pick = v => {
          value = v; clicks++;
          btns.forEach(b => b.classList.toggle('on', Number(b.dataset.v) === v));
          label.textContent = SIG_SCALE[v];
          go.disabled = false;
        };
        btns.forEach(b => b.addEventListener('click', () => pick(Number(b.dataset.v))));
        go.addEventListener('click', () => { pick = null; onDone(value, performance.now() - t0, clicks - 1); });
      }

      function renderRate() {
        const { items, ans } = R[round];
        const label = round === 2 ? 'Раунд 2 · ' : '';
        renderScale(`${label}Утверждение ${k + 1} из ${items.length}`, items[k].text, '', (r, ms, changes) => {
          ans[k] = { r, ms, changes };
          if (++k === items.length) seal();
          render();
        });
      }

      function seal() {
        const S = R[round];
        if (round === 1) {
          S.swaps = sigChooseSwaps(S.items, S.ans, SIG.swaps1);
          S.controls = sigControls(S.items, S.swaps, SIG.control);
        } else {
          S.swaps = sigChooseSwaps(S.items, S.ans, sigK(SIG.maxK2)).map(({ bet, ...s }) => s);
        }
        const text = sigSealText(round, S.items, S.swaps, sigSalt());
        S.seal = { text, hash: sha256(text) };
        S.flags = new Set();
        S.reasons = {};
        markSeen(S.items);
        phase = 'profile';
      }

      function renderProfile() {
        const S = R[round];
        const ask = new Set(round === 1 ? [...S.swaps.map(s => s.i), ...S.controls] : []);
        // Grouped by theme: the two statements of a pair side by side, pairs in random order.
        const pairs = sigShuffle([...new Set(S.items.map(it => it.pair))]);
        const order = pairs.flatMap(p => S.items.map((it, i) => i).filter(i => S.items[i].pair === p));
        const card = i => {
          const it = S.items[i], v = shown(round, i);
          return `<div class="sig-card" data-i="${i}">
              <p class="sig-theme">${it.theme}</p>
              <p class="sig-card-text">${esc(it.text)}</p>
              ${scale(v, false)}
              <p class="sig-shown">${say(v)}</p>
              ${ask.has(i) ? `<label class="sig-reason"><span>Почему вы так считаете? Одной фразой.</span>
                 <input type="text" maxlength="240" autocomplete="off" data-i="${i}"></label>` : ''}
              <button type="button" class="btn sig-flag" data-i="${i}">Это не мой ответ</button>
            </div>`;
        };
        root.innerHTML =
          `<div class="mind-col wide">
             <p class="mind-step">${round === 2 ? 'Раунд 2 · ' : ''}Профиль</p>
             <p class="mind-big">Ваш профиль убеждений</p>
             <p class="mind-sub">${round === 1
               ? 'Проверьте, что ответы записаны верно. Если какой-то ответ не ваш, отметьте его. Где есть поле, напишите одной фразой, почему вы так считаете.'
               : 'Найдите подмены и отметьте их. Подмен сколько-то — возможно, ни одной.'}</p>
             <p class="sig-code">Код сессии <code>${group(S.seal.hash)}</code></p>
             <div class="sig-cards">${order.map(card).join('')}</div>
             <button type="button" class="btn btn-primary mind-go">Подписать</button>
           </div>`;
        const go = root.querySelector('.mind-go');
        const inputs = [...root.querySelectorAll('.sig-reason input')];
        const update = () => {
          go.disabled = inputs.some(f => !S.flags.has(Number(f.dataset.i)) && f.value.trim().length < 5);
        };
        inputs.forEach(f => f.addEventListener('input', update));
        root.querySelectorAll('.sig-flag').forEach(b => b.addEventListener('click', () => {
          const i = Number(b.dataset.i);
          if (S.flags.has(i)) S.flags.delete(i); else S.flags.add(i);
          const on = S.flags.has(i);
          b.classList.toggle('on', on);
          b.closest('.sig-card').classList.toggle('flagged', on);
          const f = inputs.find(x => Number(x.dataset.i) === i);
          if (f) f.disabled = on;
          update();
        }));
        go.addEventListener('click', () => {
          inputs.forEach(f => { S.reasons[f.dataset.i] = f.value.trim(); });
          if (round === 1) {
            recallOrder = sigShuffle([...S.swaps.map(s => s.i), ...S.controls]);
            S.recall = {};
            phase = 'recall'; k = 0;
          } else {
            phase = 'final';
            reveal();
          }
          render();
        });
        update();
      }

      function renderRecall() {
        const S = R[1], i = recallOrder[k];
        renderScale(`Память · ${k + 1} из ${recallOrder.length}`, S.items[i].text,
          'Какой ответ вы поставили этому утверждению в самом начале, когда увидели его впервые? Вспомните без подсказок.',
          r => {
            S.recall[i] = r;
            if (++k === recallOrder.length) phase = 'reveal';
            render();
          });
      }

      const RECALL = {
        exact: (r) => `Вспомнили свой ответ: ${r}.`,
        shown: (r) => `Вспомнили ${r} — ответ из профиля, а не свой.`,
        toward: (r) => `Вспомнили ${r} — ближе к ответу из профиля, чем к своему.`,
        other: (r) => `Вспомнили ${r}.`,
      };

      function sealBlock(S) {
        return `<pre class="sig-seal">${esc(S.seal.text)}</pre>
          <p class="sig-code">SHA-256 <code>${group(S.seal.hash)}</code></p>
          <div class="pr-actions">
            <button type="button" class="btn sig-verify">Проверить печать</button>
            <button type="button" class="btn sig-copy">Скопировать текст</button>
          </div>
          <p class="mind-note sig-check">Хеш этого текста (UTF-8) можно посчитать в любой программе SHA-256 и сравнить с кодом сессии.</p>`;
      }
      function wireSeal(S, el) {
        const out = el.querySelector('.sig-check');
        el.querySelector('.sig-verify').addEventListener('click', () => {
          const h = sha256(S.seal.text);
          out.textContent = h === S.seal.hash
            ? `Пересчитано заново: ${group(h)} — совпадает с кодом сессии.`
            : `Пересчитано заново: ${group(h)} — не совпадает.`;
        });
        el.querySelector('.sig-copy').addEventListener('click', () => {
          try {
            navigator.clipboard.writeText(S.seal.text).then(
              () => { out.textContent = 'Текст скопирован.'; },
              () => { out.textContent = 'Не удалось скопировать: выделите текст вручную.'; });
          } catch (e) { out.textContent = 'Не удалось скопировать: выделите текст вручную.'; }
        });
      }

      function renderReveal() {
        const S = R[1];
        const flagged = i => S.flags.has(i);
        const n = S.swaps.length;
        const caught = S.swaps.filter(s => flagged(s.i)).length;
        const right = S.swaps.filter(s => (s.bet === 'detect') === flagged(s.i)).length;
        const extra = S.items.filter((_, i) => flagged(i) && !swapAt(1, i)).length;

        const swapCard = s => {
          const it = S.items[s.i], said = S.reasons[s.i];
          const rec = S.recall[s.i];
          const body = flagged(s.i)
            ? `<p class="sig-quote caught">Вы отметили: «Это не мой ответ».</p>
               <p class="sig-facts">В профиле стояло <b>${say(s.to)}</b>. Вы ответили <b>${say(s.from)}</b>.</p>`
            : `<blockquote class="sig-quote">«${esc(said)}»</blockquote>
               <p class="sig-facts">Так вы объяснили ответ <b>${say(s.to)}</b>. Вы его не давали: вы ответили <b>${say(s.from)}</b>.</p>`;
          const ok = (s.bet === 'detect') === flagged(s.i);
          return `<div class="sig-card swap">
              <p class="sig-theme">${it.theme}</p>
              <p class="sig-card-text">${esc(it.text)}</p>
              ${body}
              <p class="sig-facts">${RECALL[sigRecall(s.from, s.to, rec)](rec)}</p>
              <p class="sig-bet ${ok ? 'ok' : 'miss'}">Ставка: ${s.bet === 'accept' ? 'не заметите' : 'заметите'} — ${ok ? 'верно' : 'мимо'}
                <small>оценка программы: ${Math.round(100 * s.p)}% за то, что не заметите</small></p>
            </div>`;
        };
        const controlCard = i => {
          const it = S.items[i], r = S.ans[i].r, rec = S.recall[i];
          return `<div class="sig-card">
              <p class="sig-theme">${it.theme} · ответ не меняли</p>
              <p class="sig-card-text">${esc(it.text)}</p>
              ${flagged(i)
                ? `<p class="sig-quote caught">Вы отметили его как не свой. Это ваш ответ: <b>${say(r)}</b>.</p>`
                : `<blockquote class="sig-quote">«${esc(S.reasons[i])}»</blockquote>
                   <p class="sig-facts">Ваш настоящий ответ: <b>${say(r)}</b>.</p>`}
              <p class="sig-facts">${rec === r ? `Вспомнили верно: ${rec}.` : `Вспомнили ${rec}, а ответили ${r}.`}</p>
            </div>`;
        };

        const head = n
          ? `<p class="mind-big">Подменено <b>${n}</b> из ${S.items.length} ответов</p>
             <p class="mind-sub">Вы заметили ${caught} из ${n}. Программа выбрала эти ответы по тому, как вы отвечали,
               и записала ставку до того, как показала профиль. Код сессии был хешем этой записи.</p>`
          : `<p class="mind-big">Подменять было нечего</p>
             <p class="mind-sub">Все ваши ответы были крайними или посередине шкалы: такие подмены программа не делает,
               их замечают сразу. Профиль был настоящим.</p>`;

        root.innerHTML =
          `<div class="mind-col wide">
             <p class="mind-step">Вскрытие</p>
             ${head}
             <div class="sig-cards">${S.swaps.map(swapCard).join('')}${S.controls.map(controlCard).join('')}</div>
             ${n ? `<p class="sig-line">Ставки программы: верно ${right} из ${n}.</p>` : ''}
             ${extra ? `<p class="sig-line">Ещё вы отметили как не свои ${extra} ${plural(extra, ['настоящий ответ', 'настоящих ответа', 'настоящих ответов'])}.</p>` : ''}
             <h4>Печать</h4>
             <div class="sig-seal-wrap">${sealBlock(S)}</div>
             <h4>Второй раунд</h4>
             <p class="sig-line">Теперь вы знаете, как это устроено. Ещё ${STATEMENTS(R[2].items.length)}.
               Подмен будет сколько-то — возможно, ни одной. Найдёте?</p>
             <div class="pr-actions">
               <button type="button" class="btn btn-primary sig-next">Второй раунд</button>
               <button type="button" class="btn sig-end">Закончить</button>
             </div>
           </div>`;
        wireSeal(S, root.querySelector('.sig-seal-wrap'));
        root.querySelector('.sig-next').addEventListener('click', () => { round = 2; phase = 'rate'; k = 0; render(); });
        root.querySelector('.sig-end').addEventListener('click', () => { phase = 'final'; reveal(); render(); });
      }

      function renderFinal() {
        const A = R[1], B = R[2];
        const played2 = !!B.seal;
        let r2 = '';
        if (played2) {
          const kk = B.swaps.length;
          const found = B.swaps.filter(s => B.flags.has(s.i)).length;
          const disowned = B.items.filter((_, i) => B.flags.has(i) && !swapAt(2, i)).length;
          const verdict = i => {
            const sw = swapAt(2, i), f = B.flags.has(i);
            if (sw) return f ? ['ok', 'подмена — найдена'] : ['miss', 'подмена — пропущена'];
            return f ? ['miss', 'ваш ответ — отмечен как чужой'] : ['ok', 'ваш ответ — оставлен'];
          };
          const lead = disowned && !kk
            ? 'Подмен не было. Вы отреклись от собственного ответа.'
            : disowned
              ? `Вы отреклись от ${disowned} ${plural(disowned, ['собственного ответа', 'собственных ответов', 'собственных ответов'])}.`
              : found === kk ? (kk ? 'Вы нашли все подмены и не тронули своих ответов.' : 'Подмен не было, и вы ничего не отметили.')
                : 'Часть подмен прошла незамеченной, хотя вы о них знали.';
          r2 = `<p class="mind-step">Раунд 2</p>
            <p class="mind-big">Подмен было: <b>${kk}</b></p>
            <p class="mind-sub">${lead}</p>
            <table class="mind-table sig-table"><tbody>
              ${B.items.map((it, i) => {
                const [cls, t] = verdict(i);
                return `<tr class="${cls}"><td>${esc(it.text)}</td><td>${B.ans[i].r}${swapAt(2, i) ? ` → ${swapAt(2, i).to}` : ''}</td><td>${t}</td></tr>`;
              }).join('')}
            </tbody></table>
            <h4>Печать второго раунда</h4>
            <div class="sig-seal-wrap">${sealBlock(B)}</div>`;
        }

        const n = A.swaps.length;
        const accepted = A.swaps.filter(s => !A.flags.has(s.i)).length;
        const right = A.swaps.filter(s => (s.bet === 'detect') === A.flags.has(s.i)).length;
        const mem = A.swaps.filter(s => A.recall[s.i] !== s.from).length;
        const all = [1, 2].flatMap(r => (R[r].seal ? R[r].items.map((it, i) => [it, R[r].ans[i].r]) : []));

        root.innerHTML =
          `<div class="mind-col wide">
             ${r2}
             <h4>Итог</h4>
             <table class="mind-table"><tbody>
               <tr><td>Подмен в первом раунде</td><td>${n}</td></tr>
               <tr><td>Приняли как свои и объяснили</td><td>${accepted}</td></tr>
               <tr><td>Ставки программы верны</td><td>${right} из ${n}</td></tr>
               <tr><td>Не вспомнили свой ответ на подменённое</td><td>${mem} из ${n}</td></tr>
             </tbody></table>
             <h4>Ваши настоящие ответы</h4>
             <p class="mind-note">Принятая подмена может ненадолго сдвинуть мнение. Здесь записано то, что вы ответили сами.</p>
             <table class="mind-table sig-table"><tbody>
               ${all.map(([it, r]) => `<tr><td>${esc(it.text)}</td><td>${r}</td><td>${SIG_SCALE[r]}</td></tr>`).join('')}
             </tbody></table>
             <button type="button" class="btn mind-go">Начать заново</button>
           </div>`;
        root.querySelectorAll('.sig-seal-wrap').forEach(el => wireSeal(B, el));
        root.querySelector('.mind-go').addEventListener('click', start);
      }

      function render() {
        root.scrollTop = 0;
        ({ intro: renderIntro, rate: renderRate, profile: renderProfile, recall: renderRecall,
          reveal: renderReveal, final: renderFinal })[phase]();
      }

      function onKey(e) {
        if ((phase !== 'rate' && phase !== 'recall') || e.altKey || e.ctrlKey || e.metaKey || e.repeat) return;
        const v = KEYS[e.code];
        if (v && pick) { e.preventDefault(); pick(v); return; }
        if (e.key === 'Enter') {
          const go = root.querySelector('.mind-go');
          if (go && !go.disabled) { e.preventDefault(); go.click(); }
        }
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
}
