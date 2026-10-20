'use strict';

/* Question pool for «Девяносто процентов». Integer answers with settled values;
   facts most adults know to the unit (206 bones, 88 keys) are left out. */
const NINE_ITEMS = [
  { id: 'mozart',    q: 'В каком году родился Моцарт?', unit: 'год', a: 1756 },
  { id: 'shakesp',   q: 'В каком году умер Шекспир?', unit: 'год', a: 1616 },
  { id: 'leonardo',  q: 'В каком году родился Леонардо да Винчи?', unit: 'год', a: 1452 },
  { id: 'galileo',   q: 'В каком году умер Галилей?', unit: 'год', a: 1642 },
  { id: 'bell',      q: 'В каком году Белл получил патент на телефон?', unit: 'год', a: 1876 },
  { id: 'pluto',     q: 'В каком году открыли Плутон?', unit: 'год', a: 1930 },
  { id: 'penicil',   q: 'В каком году Флеминг открыл пенициллин?', unit: 'год', a: 1928 },
  { id: 'colosseum', q: 'В каком году достроили Колизей?', unit: 'год н. э.', a: 80 },
  { id: 'dynamite',  q: 'В каком году Нобель запатентовал динамит?', unit: 'год', a: 1867 },
  { id: 'msu',       q: 'В каком году основан Московский университет?', unit: 'год', a: 1755 },
  { id: 'lumiere',   q: 'В каком году братья Люмьер устроили первый платный киносеанс?', unit: 'год', a: 1895 },
  { id: 'drais',     q: 'В каком году Дрез построил «беговую машину» — предка велосипеда?', unit: 'год', a: 1817 },
  { id: 'tolstoy',   q: 'В каком году умер Лев Толстой?', unit: 'год', a: 1910 },
  { id: 'relativ',   q: 'В каком году Эйнштейн опубликовал общую теорию относительности?', unit: 'год', a: 1915 },
  { id: 'catherine', q: 'Сколько лет правила Екатерина II?', unit: 'лет', a: 34 },
  { id: 'volga',     q: 'Какова длина Волги?', unit: 'км', a: 3530 },
  { id: 'elbrus',    q: 'Какова высота Эльбруса?', unit: 'м', a: 5642 },
  { id: 'everest',   q: 'Какова высота Джомолунгмы (Эвереста)?', unit: 'м', a: 8849 },
  { id: 'baikal',    q: 'Какова наибольшая глубина Байкала?', unit: 'м', a: 1642 },
  { id: 'kola',      q: 'Какой глубины достигла Кольская сверхглубокая скважина?', unit: 'м', a: 12262 },
  { id: 'moon',      q: 'Каково среднее расстояние от Земли до Луны?', unit: 'тыс. км', a: 384 },
  { id: 'diameter',  q: 'Каков диаметр Земли по экватору?', unit: 'км', a: 12756 },
  { id: 'equator',   q: 'Какова длина экватора?', unit: 'км', a: 40075 },
  { id: 'australia', q: 'Какова площадь Австралии?', unit: 'тыс. км²', a: 7692 },
  { id: 'transsib',  q: 'Какова длина Транссибирской магистрали от Москвы до Владивостока?', unit: 'км', a: 9288 },
  { id: 'spb',       q: 'Сколько километров по железной дороге от Москвы до Санкт-Петербурга?', unit: 'км', a: 650 },
  { id: 'ostankino', q: 'Какова высота Останкинской башни?', unit: 'м', a: 540 },
  { id: 'sound',     q: 'Какова скорость звука в воздухе при 20 °C?', unit: 'м/с', a: 343 },
  { id: 'tungsten',  q: 'При какой температуре плавится вольфрам?', unit: '°C', a: 3422 },
  { id: 'iron',      q: 'При какой температуре плавится железо?', unit: '°C', a: 1538 },
  { id: 'mars',      q: 'Сколько земных суток длится год на Марсе?', unit: 'суток', a: 687 },
  { id: 'un',        q: 'Сколько государств входит в ООН?', unit: 'государств', a: 193 },
  { id: 'elements',  q: 'Сколько химических элементов в таблице Менделеева (открытых и получивших названия)?', unit: 'элементов', a: 118 },
  { id: 'mile',      q: 'Сколько метров в морской миле?', unit: 'м', a: 1852 },
  { id: 'gold',      q: 'Каков атомный номер золота?', unit: '', a: 79 },
  { id: 'harp',      q: 'Сколько струн у концертной арфы?', unit: 'струн', a: 47 },
];

/* "12 756", "12756", "7,5", "−3" → number; anything else → null. */
function parseNum(s) {
  const t = String(s).replace(/[\s  ]/g, '').replace(',', '.').replace(/[−–]/, '-');
  return /^-?\d+(\.\d+)?$/.test(t) ? Number(t) : null;
}

/* n distinct items, unseen ids first (in random order), then seen ones. */
function pickItems(n, seen = [], rand = Math.random) {
  const shuffle = a => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  const s = new Set(seen);
  const fresh = shuffle(NINE_ITEMS.filter(it => !s.has(it.id)));
  const old = shuffle(NINE_ITEMS.filter(it => s.has(it.id)));
  return fresh.concat(old).slice(0, n);
}

/* Where the recalled guess went relative to the original guess and the answer.
   'exact': recalled within 0.5% of the guess; 'toward' / 'away': moved toward
   or away from the answer; 'hit': the guess was the answer, so no direction.
   shift: (recall − guess) / (answer − guess); 1 = recalled the answer itself. */
function drift(guess, recall, answer) {
  if (Math.abs(recall - guess) <= Math.max(0.5, Math.abs(guess) * 0.005)) return { kind: 'exact', shift: 0 };
  if (answer === guess) return { kind: 'hit', shift: null };
  const shift = (recall - guess) / (answer - guess);
  return { kind: shift > 0 ? 'toward' : 'away', shift };
}

/* P(X <= k) for X ~ Binomial(n, p). */
function binomCdf(n, p, k) {
  let c = 1, sum = 0;                        // c = C(n, i)
  for (let i = 0; i <= Math.min(k, n); i++) {
    sum += c * Math.pow(p, i) * Math.pow(1 - p, n - i);
    c = c * (n - i) / (i + 1);
  }
  return sum;
}

const median = a => {
  if (!a.length) return null;
  const s = a.slice().sort((x, y) => x - y), m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

if (typeof module !== 'undefined') module.exports = { NINE_ITEMS, parseNum, pickItems, drift, binomCdf, median };
