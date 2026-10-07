'use strict';
/* 5555 слов (5555words.com) — веб-версия по ТЗ (TZ.md). Прогресс хранится в localStorage устройства. */

const W = window.WORDS;               // [en, ru, ipa, пример, перевод примера, глагол]
const PER_LESSON = 10;
const TOTAL = Math.ceil(W.length / PER_LESSON);   // 562 урока (5620 слов)
const CORE = 300;                      // курс 1 — уроки 1–300 (3000 слов); курс 2 (301–562) открывается в лиге «Грандмастер»
const PAGE = 50;                       // уроков на странице
const ROW = 4;                         // уроков в ряду, 5-я ячейка — тест
const PAGES = Math.ceil(TOTAL / PAGE);
// подсказок на одно прохождение этапа, как в оригинале: «Запоминание» — 1, буквенные этапы — 3; тест — 1
const HINTS = { memo: 1, audio: 3, write: 3, fix: 3, test: 3 };   // test — только на лёгком уровне мини-теста
const TEST_WORDS = 20, TEST_SEC_PER_LETTER = 1;                   // мини-тест: 20 слов; на 3 звезды — не дольше 1 с на букву
const TEST_LEVELS = [
  { stars: 1, name: 'Легкий', text: 'Можно использовать подсказки, но вы получите только одну звезду.' },
  { stars: 2, name: 'Средний', text: 'Подсказок нет, зато за завершение вы получите две звезды.' },
  { stars: 3, name: 'Сложный', text: 'Самый сложный, но и самый эффективный уровень. Учитывается время, затраченное на каждое слово. Дает 100% запоминание и три звезды.' },
];
const lessonOf = i => Math.floor(i / PER_LESSON) + 1;
const STAGE_PTS = 3;                   // баллов за этап; каждая ошибка и подсказка отнимают по 1 баллу
const REP_DELAY = 24 * 3600 * 1000;
const KEY = 'w3000.v2';
const APP_V = ((document.currentScript && /[?&]v=(\d+)/.exec(document.currentScript.src)) || [])[1] || '?';   // версия из ?v= в index.html
const DICT_VER = 4;   // версия словаря: 4 — добавлены слова TOEFL / IELTS (курс 2); с версии 3 прогресс переносится, со старших — сбрасывается

const STAGES = [
  { key: 'study', name: 'Изучение', g: 0 },
  { key: 'memo', name: 'Запоминание', g: 0 },
  { key: 'match', name: 'Повторение', g: 0 },
  { key: 'audio', name: 'Аудирование', g: 1 },
  { key: 'write', name: 'Написание', g: 1 },
  { key: 'fix', name: 'Закрепление', g: 2 },
];
const AVATARS = ['🙂', '😎', '🦊', '🐱', '🐼', '🦁', '🐸', '🐧', '🦉', '🚀', '📚', '🎧'];

/* ---------------- state ---------------- */

const defaults = () => ({
  v: 2,
  profile: { name: 'Профиль', avatar: '🙂' },
  set: { daily: true, auto: false, sfx: false, keySound: true, haptic: true, click: 'soft', rate: 0.85, voice: '' },   // озвучка выключена; звук нажатий и вибрация — включены, настраиваются отдельно
  L: {},        // урок -> {started, dec:{i:'k'|'l'}, learn:[], st:[6 этапов], errs:{}, hints, time, complete, rep:{due, done}}
  T: {},        // тест "страница.ряд" -> {best, n, stars}
  w: {},        // слово -> {learned, err}
  fav: {},
  days: {},
  lastStart: null,
  page: 0,
  onboarded: 0,   // пройдено ли определение уровня при первом запуске
  start: 1,       // стартовый урок: все уроки до него условно пройдены
  placement: null,   // {self: 'B1+', known, rec, start, d}
  dictVer: DICT_VER,
});
let S = load();
function load() {
  try {
    const s = JSON.parse(localStorage.getItem(KEY));
    if (s && s.v === 2) {
      const d = defaults(), r = { ...d, ...s, set: { ...d.set, ...s.set }, profile: { ...d.profile, ...s.profile } };
      if (!r.set.soundOff) { r.set.auto = false; r.set.sfx = false; r.set.soundOff = 1; }   // переход: звук выключен по умолчанию
      if ('keys' in r.set) { r.set.keySound = r.set.haptic = r.set.keys !== false; delete r.set.keys; }   // переход: звук и вибрация разделены
      if (s.onboarded === undefined) r.onboarded = Object.keys(r.L).length ? 1 : 0;       // у тех, кто уже занимался, опрос не показываем
      if (s.dictVer === 3 && DICT_VER === 4) return migrateV4(r);
      if (s.dictVer !== DICT_VER) {   // словарь пересобран — прогресс по номерам слов больше не верен; настройки и профиль сохраняем
        const fresh = { ...d, set: r.set, profile: r.profile, dictReset: Object.keys(r.L).length > 0 || Object.keys(r.w).length > 0 };
        return fresh;
      }
      return r;
    }
  } catch (e) { /* повреждённые данные — начинаем с чистого листа */ }
  return defaults();
}
// Словарь 3 → 4: в курс 2 по частотности вставлены слова TOEFL / IELTS — номера слов после 3000 сдвинулись.
// Выученные слова и «Мои слова» переносим по самому слову; уроки и мини-тесты курса 2, у которых поменялся
// состав, начинаются заново; курс 1 (слова 1–3000) не меняется.
function migrateV4(r) {
  const added = new Set((window.WORDS_ADDED && WORDS_ADDED[4]) || []);
  const map = {};   // старый номер -> новый
  for (let i = 0, o = 0; i < W.length; i++) if (!added.has(i)) map[o++] = i;
  const remapKeys = obj => { const out = {}; for (const k in obj) if (map[k] !== undefined) out[map[k]] = obj[k]; return out; };
  const touched = Object.keys(r.L).some(n => +n > CORE) || Object.keys(r.w).some(i => +i >= CORE * PER_LESSON);
  r.w = remapKeys(r.w); r.fav = remapKeys(r.fav);
  const L = {};
  for (const n in r.L) {
    if (+n <= CORE) { L[n] = r.L[n]; continue; }
    let same = true;   // (range ещё не объявлена — load() вызывается раньше helpers)
    for (let o = (n - 1) * PER_LESSON; o < n * PER_LESSON; o++) if (map[o] !== o) same = false;
    if (same) L[n] = r.L[n];   // состав урока не изменился
  }
  r.L = L;
  for (const id in r.T) if (+id.split('.')[0] * PAGE >= CORE) delete r.T[id];   // мини-тесты курса 2
  r.dictVer = 4;
  if (touched) r.dictNote = 1;
  return r;
}
function save() { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { toast('Не удалось сохранить прогресс'); } }
try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}

/* ---------------- helpers ---------------- */

const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const range = (a, b) => Array.from({ length: Math.max(0, b - a) }, (_, k) => a + k);
const shuffle = a => { a = a.slice(); for (let k = a.length - 1; k > 0; k--) { const j = Math.random() * (k + 1) | 0; [a[k], a[j]] = [a[j], a[k]]; } return a; };
const pick = a => a[Math.random() * a.length | 0];
const pad = n => String(n).padStart(2, '0');
const dkey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const today = () => dkey();
const hhmm = t => { const d = new Date(t); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const ddmm = d => `${pad(d.getDate())}.${pad(d.getMonth() + 1)}`;
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 10 || h >= 20) ? b : c; };

const en = i => W[i][0];
const ru = i => W[i][1];
const ipa = i => W[i][2] ? `[${W[i][2]}]` : '';
const disp = i => (W[i][5] ? 'to ' : '') + W[i][0];
const exEn = i => W[i][3] || '';
const exRu = i => W[i][4] || '';
const plain = s => s.replace(/[\[\]]/g, '');
const hl = s => esc(s).replace(/\[(.+?)\]/g, '<em>$1</em>');
const meanings = i => ru(i).split(/[,;]/).map(s => s.replace(/\(.*?\)/g, '').trim().toLowerCase()).filter(Boolean);
const overlaps = (i, j) => { const a = meanings(i); return meanings(j).some(m => a.includes(m)); };

const lessonIds = n => range((n - 1) * PER_LESSON, Math.min(n * PER_LESSON, W.length));
const L = n => S.L[n];
const learnIds = n => (L(n) && L(n).learn) || lessonIds(n);
const wmut = i => S.w[i] || (S.w[i] = { learned: 0, err: 0 });
const newLesson = () => ({ started: Date.now(), dec: {}, learn: null, st: STAGES.map(() => ({ done: 0, passes: 0, pts: {}, ok: {}, err: {}, rep: {} })), errs: {}, hints: 0, time: 0, complete: null, rep: null });

function stageInfo(n, k) {
  const l = L(n);
  if (!l) return { done: false, credited: 0, total: lessonIds(n).length, full: false, avail: k === 0 };   // последний урок может быть неполным
  const st = l.st[k];
  if (k === 0) return { done: !!st.done, credited: Object.keys(l.dec).length, total: lessonIds(n).length, full: !!st.done, avail: true };
  const ids = learnIds(n), onRep = st.rep || {};
  const credited = ids.filter(i => st.ok[i]).length;
  const repCount = ids.filter(i => !st.ok[i] && onRep[i]).length;
  return { done: !!st.done, credited, repCount, total: ids.length, full: !!st.done && credited + repCount === ids.length, avail: !!l.st[k - 1].done };
}
const isSkipped = n => n < S.start && !L(n);   // урок до стартового, который не открывали, — условно пройден
const lessonComplete = n => !!(L(n) && L(n).complete) || isSkipped(n);
const stagesFull = n => STAGES.every((_, k) => stageInfo(n, k).full);
const wordPts = (n, i) => { const l = L(n); if (!l) return 0; let s = 0; for (let k = 1; k < 6; k++) s += l.st[k].pts[i] || 0; return s; };
const lessonFrac = n => L(n) ? STAGES.filter((_, k) => stageInfo(n, k).full).length / STAGES.length : 0;

// выучено: все слова условно пройденных уроков + реально выученные слова дальше
function learnedCount() { const base = (S.start - 1) * PER_LESSON; let c = base; for (const i in S.w) if (+i >= base && S.w[i].learned) c++; return c; }
function pendingCount() {
  let c = 0;
  for (const n in S.L) { const l = S.L[n]; if (+n >= S.start && l.complete && !(l.rep && l.rep.done)) c += l.learn.filter(i => !(S.w[i] && S.w[i].learned)).length; }
  return c;
}
// уровень: сначала растёт быстро (10 слов), к концу нужно всё больше слов; пороги кратны 10,
// уровень 100 = 3000 слов, дальше уровни продолжаются в курсе 2 (все 5620 слов — 144)
const levelNeed = N => Math.round((10 * (N - 1) + 0.205 * (N - 1) ** 2) / 10) * 10;
function levelFor(c) { let N = 1; while (c >= levelNeed(N + 1)) N++; return N; }
const level = () => levelFor(learnedCount());
const MAX_LEVEL = levelFor(W.length);

/* ---------------- лиги ---------------- */
// лига объединяет уровни; границы — по числу выученных слов, шаг растёт от лиги к лиге
const LEAGUES = [
  { name: 'Медь',        from: 1,  shape: 'medal',   c: ['#ffb08a', '#d0603a', '#7a2410'] },   // красноватая медь
  { name: 'Бронза',      from: 10, shape: 'ribbon',  c: ['#f0d58c', '#a8843c', '#4f3c10'] },   // жёлто-оливковая бронза
  { name: 'Серебро',     from: 19, shape: 'shield',  c: ['#ffffff', '#b7c0ca', '#5f6b78'] },
  { name: 'Золото',      from: 32, shape: 'star',    c: ['#fff1a8', '#f0b90b', '#8a5a00'] },
  { name: 'Платина',     from: 48, shape: 'hex',     c: ['#f3f8fc', '#9fb6c9', '#40586e'] },
  { name: 'Бриллиант',   from: 63, shape: 'gem',     c: ['#dffbff', '#38c3e8', '#0b5f86'] },
  { name: 'Мастер',      from: 79, shape: 'laurel',  c: ['#e3c8ff', '#8b3fd9', '#3f1273'] },
  { name: 'Грандмастер', from: 92, shape: 'crown',   c: ['#ff9a9a', '#d42a36', '#6b0a12'] },
];
const GM_INDEX = LEAGUES.length - 1;   // «Грандмастер» — с него открывается курс 2
// после «Грандмастера» — ступени каждые 10 уровней: «Грандмастер 2» с уровня 100 (все 3000 слов курса 1), 3 — со 110…
// значок тот же (корона), с номером ступени и всё темнее
const GM_TIERS = [['#ffb3c7', '#c2185b', '#5a0828'], ['#ff8a65', '#b71c1c', '#3e0505'], ['#ffd27a', '#8d1d2c', '#2b0208'],
  ['#f0b8ff', '#7b1238', '#1e0010'], ['#fff1a8', '#4a0d1a', '#000000']];
for (let t = 2, from = 100; from <= MAX_LEVEL; t++, from += 10)
  LEAGUES.push({ name: `Грандмастер ${t}`, from, shape: 'crown', tier: t, c: GM_TIERS[Math.min(t - 2, GM_TIERS.length - 1)] });
const leagueOf = lv => { let k = 0; LEAGUES.forEach((l, i) => { if (lv >= l.from) k = i; }); return k; };
let badgeId = 0;
// значок лиги с цифрой уровня внутри (SVG)
function badgeSVG(li, num, size = 46) {
  const L = LEAGUES[li], id = 'lg' + (++badgeId), [c1, c2, c3] = L.c, fill = `url(#${id})`;
  const grad = `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0.4" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="0.55" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient></defs>`;
  const shield = 'M50 8 L88 20 V50 C88 73 71 87 50 95 C29 87 12 73 12 50 V20 Z';
  let body = '', ty = 52;
  switch (L.shape) {
    case 'medal': body = `<circle cx="50" cy="50" r="43" fill="${fill}" stroke="${c3}" stroke-width="5"/><circle cx="50" cy="50" r="33" fill="none" stroke="${c1}" stroke-opacity=".6" stroke-width="2.5"/>`; break;
    case 'ribbon': body = `<path d="M30 62 L20 97 L34 89 L42 99 L47 68Z M70 62 L80 97 L66 89 L58 99 L53 68Z" fill="#b23a2a"/><circle cx="50" cy="44" r="40" fill="${fill}" stroke="${c3}" stroke-width="5"/><circle cx="50" cy="44" r="30" fill="none" stroke="${c1}" stroke-opacity=".6" stroke-width="2.5"/>`; ty = 46; break;
    case 'shield': body = `<path d="${shield}" fill="${fill}" stroke="${c3}" stroke-width="5" stroke-linejoin="round"/><path d="M50 18 L79 27 V50 C79 68 66 79 50 86 C34 79 21 68 21 50 V27 Z" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/>`; break;
    case 'star': body = `<path d="${shield}" fill="${fill}" stroke="${c3}" stroke-width="5" stroke-linejoin="round"/><path d="M50 18 L79 27 V50 C79 68 66 79 50 86 C34 79 21 68 21 50 V27 Z" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="2"/><path d="M50 71 l3.5 7 7.7 1.1-5.6 5.4 1.3 7.6-6.9-3.6-6.9 3.6 1.3-7.6-5.6-5.4 7.7-1.1z" fill="#fff" fill-opacity=".9"/>`; ty = 49; break;
    case 'hex': body = `<polygon points="50,4 91,27 91,73 50,96 9,73 9,27" fill="${fill}" stroke="${c3}" stroke-width="5" stroke-linejoin="round"/><polygon points="50,15 81,33 81,67 50,85 19,67 19,33" fill="none" stroke="#fff" stroke-opacity=".75" stroke-width="2"/>`; break;
    case 'gem': body = `<polygon points="50,97 5,38 22,10 78,10 95,38" fill="${fill}" stroke="${c3}" stroke-width="4" stroke-linejoin="round"/><path d="M5 38 H95 M22 10 L36 38 L50 10 L64 38 L78 10 M36 38 L50 97 L64 38" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.6"/>`; ty = 54; break;
    case 'laurel': body = `<g fill="#6fbf45">${[0, 1, 2, 3, 4].map(k => `<ellipse cx="${13 - k * 0}" cy="${72 - k * 13}" rx="5" ry="10" transform="rotate(${-35 + k * 12} ${13} ${72 - k * 13})"/><ellipse cx="87" cy="${72 - k * 13}" rx="5" ry="10" transform="rotate(${35 - k * 12} 87 ${72 - k * 13})"/>`).join('')}</g>
      <path d="M50 10 L82 20 V48 C82 70 68 83 50 92 C32 83 18 70 18 48 V20 Z" fill="${fill}" stroke="${c3}" stroke-width="5" stroke-linejoin="round"/><path d="M50 3 l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z" fill="#ffd54a"/>`; ty = 51; break;
    case 'crown': body = `<path d="M50 24 L87 34 V58 C87 79 71 91 50 98 C29 91 13 79 13 58 V34 Z" fill="${fill}" stroke="${c3}" stroke-width="5" stroke-linejoin="round"/>
      <path d="M27 27 L31 6 L41 17 L50 2 L59 17 L69 6 L73 27 Z" fill="#ffd54a" stroke="#a36b00" stroke-width="3" stroke-linejoin="round"/><circle cx="50" cy="3" r="3" fill="#fff4b0"/>`; ty = 63; break;
  }
  if (L.tier) body += `<circle cx="84" cy="86" r="13" fill="#ffd54a" stroke="#a36b00" stroke-width="3"/><text x="84" y="87" text-anchor="middle" dominant-baseline="middle" font-family="Roboto Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="18" fill="#5a3a00">${L.tier}</text>`;
  const fs = String(num).length >= 3 ? 27 : 33;
  return `<svg class="badge-svg" viewBox="0 0 100 100" width="${size}" height="${size}" aria-label="${L.name}, уровень ${num}">${grad}${body}
    <text x="50" y="${ty}" text-anchor="middle" dominant-baseline="middle" font-family="Roboto Condensed, Arial Narrow, sans-serif" font-weight="700" font-size="${fs}" fill="#fff" stroke="${c3}" stroke-width="5" paint-order="stroke">${num}</text></svg>`;
}
// переход в новую лигу — отмечаем праздничным окном (только вверх; вниз — молча)
function checkLeague() {
  if (!S.onboarded || run || $('.sheet-bg')) return;
  const li = leagueOf(level());
  if (S.league == null || li < S.league) { S.league = li; save(); return; }
  if (li > S.league) { S.league = li; save(); leagueUp(li); }
}
function leagueUp(li) {
  const L = LEAGUES[li];
  const confetti = Array.from({ length: 28 }, (_, k) => `<i style="left:${Math.random() * 100}%;animation-delay:${(Math.random() * 0.8).toFixed(2)}s;background:${['#a3d04a', '#66ddcd', '#ea4661', '#f6b91c', '#8b3fd9'][k % 5]}"></i>`).join('');
  sheet(`<div class="confetti">${confetti}</div><div class="lg-up">НОВАЯ ЛИГА!</div>
    <div class="lg-big">${badgeSVG(li, level(), 150)}</div>
    <div class="lg-name">${L.name}</div>
    <p class="rep-text">Поздравляем! Вы перешли в лигу <span>${L.name}</span>. Выучено слов: <span>${learnedCount()}</span></p>
    ${li < LEAGUES.length - 1 ? `<p class="sub">Следующая — ${LEAGUES[li + 1].name}, с уровня ${LEAGUES[li + 1].from}</p>` : '<p class="sub">Это высшая лига!</p>'}
    <div class="sticky"><button class="btn teal" data-act="share">Поделиться успехом</button><button class="btn" data-close>Отлично!</button></div>`,
    { cls: 'lg-sheet', onClick: e => { if (e.target.closest('[data-act="share"]')) shareProgress(); } });
  prepareShare();
  sfx(true);
}
// окно «Лиги»: текущая лига, прогресс до следующей и вся лестница
function openLeagues() {
  const lv = level(), li = leagueOf(lv), words = learnedCount();
  const next = LEAGUES[li + 1];
  const fromW = levelNeed(LEAGUES[li].from), toW = next ? levelNeed(next.from) : W.length;
  const pct = Math.min(100, Math.round((words - fromW) / Math.max(1, toW - fromW) * 100));
  const rows = LEAGUES.map((L, k) => {
    const to = LEAGUES[k + 1] ? LEAGUES[k + 1].from - 1 : MAX_LEVEL;
    return `<div class="lg-row ${k === li ? 'cur' : k > li ? 'future' : ''}">${badgeSVG(k, k === li ? lv : L.from, 44)}
      <div class="lg-t"><b>${L.name}</b><div>уровни ${L.from}–${to} · от ${levelNeed(L.from)} слов</div></div>${k === li ? '<span class="lg-you">вы здесь</span>' : k < li ? `<span class="lg-ok">${I.check}</span>` : ''}</div>`;
  }).reverse().join('');
  sheet(`<button class="sheet-close" data-close aria-label="Закрыть">${I.close}</button><h2>Лиги</h2>
    <div class="lg-big">${badgeSVG(li, lv, 120)}</div>
    <div class="lg-name">${LEAGUES[li].name} · уровень ${lv}</div>
    ${next ? `<div class="lg-prog"><div class="progress"><i style="width:${pct}%"></i></div>
      <p class="sub">До лиги ${next.name}: ещё ${Math.max(0, toW - words)} ${plural(Math.max(0, toW - words), 'слово', 'слова', 'слов')}</p></div>` : '<p class="sub">Высшая лига — вы выучили почти весь словарь!</p>'}
    <button class="btn teal small" data-act="share">Поделиться успехом</button>
    <div class="lg-list">${rows}</div>`, { onClick: e => { if (e.target.closest('[data-act="share"]')) shareProgress(); } });
  prepareShare();
}
// «Поделиться успехом»: картинка-карточка (лига, уровень, выучено слов) + текст со ссылкой через системное меню.
// Картинку готовим заранее, при открытии окна: Safari открывает меню «Поделиться» только сразу после нажатия.
let shareFile = null;
const shareText = () => {
  const n = learnedCount(), lv = level();
  return `Уже ${n} ${plural(n, 'английское слово выучено', 'английских слова выучено', 'английских слов выучено')} в «5555 слов» — лига «${LEAGUES[leagueOf(lv)].name}», уровень ${lv}! Учи бесплатно:`;
};
function prepareShare() {
  shareFile = null;
  try {
    const lv = level(), li = leagueOf(lv), n = learnedCount();
    const c = document.createElement('canvas'); c.width = c.height = 1080;
    const g = c.getContext('2d'), font = (w, px) => `${w} ${px}px "Roboto Condensed", "Arial Narrow", sans-serif`;
    g.fillStyle = '#ececec'; g.fillRect(0, 0, 1080, 1080);
    g.fillStyle = '#fff'; g.beginPath(); g.roundRect ? g.roundRect(60, 60, 960, 960, 48) : g.rect(60, 60, 960, 960); g.fill();
    g.textAlign = 'center'; g.fillStyle = '#2c6a8c';
    g.font = font(700, 76); g.fillText('5555 слов', 540, 170);
    const svg = badgeSVG(li, lv, 360).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
    const img = new Image();
    img.onload = () => {
      g.drawImage(img, 360, 210, 360, 360);
      g.fillStyle = '#111'; g.font = font(700, 120); g.fillText(String(n), 540, 720);
      g.fillStyle = '#555'; g.font = font(400, 46); g.fillText(plural(n, 'английское слово выучено', 'английских слова выучено', 'английских слов выучено'), 540, 785);
      g.fillStyle = '#2c6a8c'; g.font = font(700, 50); g.fillText(`Лига «${LEAGUES[li].name}» · уровень ${lv}`, 540, 870);
      g.fillStyle = '#3fc9b6'; g.font = font(700, 44); g.fillText('5555words.com — учи бесплатно', 540, 965);
      c.toBlob(b => { if (b) shareFile = new File([b], '5555words.png', { type: 'image/png' }); }, 'image/png');
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  } catch (e) {}
}
async function shareProgress() {
  const text = shareText(), url = 'https://5555words.com/';
  try {
    if (shareFile && navigator.canShare && navigator.canShare({ files: [shareFile] })) return await navigator.share({ files: [shareFile], text: text + ' ' + url });
    if (navigator.share) return await navigator.share({ text, url });
  } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text + ' ' + url); toast('Текст скопирован — вставьте его в сообщение'); }
  catch (e) { toast(text + ' ' + url); }
}
function bumpDay() { const d = today(); S.days[d] = (S.days[d] || 0) + 1; }
function streak() { let s = 0; const d = new Date(); if (!S.days[dkey(d)]) d.setDate(d.getDate() - 1); while (S.days[dkey(d)]) { s++; d.setDate(d.getDate() - 1); } return s; }

// ряды: 4 урока + тест; страница — 50 уроков, последний ряд страницы из 2 уроков
function rowLessons(p, r) { const a = p * PAGE + r * ROW + 1; return range(a, Math.min(a + ROW, (p + 1) * PAGE + 1, TOTAL + 1)); }
const rowsOnPage = p => Math.ceil(Math.min(PAGE, TOTAL - p * PAGE) / ROW);
const testId = (p, r) => `${p}.${r}`;

const MAX_UNREPEATED = 2;              // больше 2 неповторённых уроков — новый урок не начать
const unrepeated = () => Object.keys(S.L).map(Number).filter(n => L(n).complete && repState(n) && repState(n) !== 'done').sort((a, b) => a - b);
const repBlocked = () => unrepeated().length > MAX_UNREPEATED;
const GRANDMASTER = () => LEAGUES[GM_INDEX].from;
const extraLocked = n => n > CORE && level() < GRANDMASTER();   // курс 2 — только в лиге «Грандмастер»
const canStartNew = () => (!S.set.daily || S.lastStart !== today()) && !repBlocked();
function nextToStart() {
  let max = S.start - 1;
  for (const n in S.L) if (+n >= S.start) max = Math.max(max, +n);
  return max < TOTAL ? max + 1 : null;
}
function repState(n) {
  const l = L(n);
  if (!l || !l.complete || !l.learn.length) return null;
  if (n < S.start) return 'done';   // уроки ниже стартового засчитаны по тесту уровня — повторение не требуется
  if (!l.rep) return 'inactive';
  if (l.rep.done) return 'done';
  return Date.now() >= l.rep.due ? 'ready' : 'waiting';
}

/* ---------------- sound ---------------- */

const TTS = 'speechSynthesis' in window;
let voices = [];
function refreshVoices() { if (TTS) voices = speechSynthesis.getVoices().filter(v => /^en([-_]|$)/i.test(v.lang)); }
if (TTS) { refreshVoices(); speechSynthesis.addEventListener && speechSynthesis.addEventListener('voiceschanged', refreshVoices); }
// в настройках — только 3 диктора: лучший доступный голос каждого типа (самые популярные голоса iOS, macOS, Chrome, Windows)
const VOICE_KINDS = [
  // на устройствах с русским интерфейсом Apple показывает имена по-русски — ищем в обоих написаниях
  // первый — диктор по умолчанию: британский (Daniel на iPhone, iPad и Mac; Google UK English на Android)
  { label: 'Британский', lang: /en[-_]GB/i, names: ['Daniel', 'Дэниэл', 'Google UK English Male', 'Arthur', 'Oliver', 'Оливер', 'Microsoft Ryan', 'Serena', 'Серена', 'Kate', 'Кейт', 'Martha', 'Google UK English Female', 'Microsoft Libby', 'Microsoft Hazel'] },
  { label: 'Американский, женский', lang: /en[-_]US/i, names: ['Samantha', 'Саманта', 'Ava', 'Ава', 'Allison', 'Эллисон', 'Susan', 'Zoe', 'Зои', 'Nicky', 'Никки', 'Google US English', 'Microsoft Aria', 'Microsoft Jenny', 'Microsoft Zira'] },
  { label: 'Американский, мужской', lang: /en[-_]US/i, names: ['Alex', 'Алекс', 'Evan', 'Эван', 'Tom', 'Том', 'Aaron', 'Nathan', 'Натан', 'Fred', 'Фред', 'Microsoft Guy', 'Microsoft Davis', 'Microsoft David'] },
];
// шуточные и «эффектные» голоса Apple (Bells, Zarvox, Whisper…) и упрощённые голоса Eloquence — не предлагаем
const NOVELTY = /^(Albert|Альберт|Bad News|Плохие новости|Bahh|Бах|Bells|Колокольчик|Boing|Прыг-скок|Bubbles|Пузырьки|Cellos|Виолончель|Good News|Хорошие новости|Jester|Шутник|Junior|Джуниор|Organ|Орган|Superstar|Суперзвезда|Trinoids|Триноид|Whisper|Шепот|Wobble|Воббл|Zarvox|Зарвокс|Ralph|Ральф|Eddy|Flo|Grandma|Grandpa|Reed|Rocko|Sandy|Shelley)\b/i;
const voiceName = v => v.name.split(' (')[0];
const voiceQuality = v => /premium/i.test(v.name) ? 2 : /enhanced|natural|online/i.test(v.name) ? 1 : 0;
function voiceChoices() {
  const out = [];
  for (const kind of VOICE_KINDS) {
    // сначала — встроенные голоса устройства (работают без интернета), сетевые — только если встроенных нет
    let best = null;
    for (const localOnly of [true, false]) {
      for (const nm of kind.names) {
        const cands = voices.filter(v => kind.lang.test(v.lang) && v.name.startsWith(nm) && (!localOnly || v.localService) && !out.some(o => o.voice === v));
        if (cands.length) { best = cands.sort((a, b) => voiceQuality(b) - voiceQuality(a))[0]; break; }
      }
      if (best) break;
    }
    if (best) out.push({ label: kind.label, voice: best });
  }
  // если каких-то типов нет на устройстве — добираем другими английскими голосами (до трёх), встроенные первыми
  const rest = voices.filter(v => /en[-_](US|GB)/i.test(v.lang) && !NOVELTY.test(v.name)).sort((a, b) => b.localService - a.localService || /GB/i.test(b.lang) - /GB/i.test(a.lang));
  for (const v of rest) {
    if (out.length >= 3) break;
    if (!out.some(o => o.voice === v)) out.push({ label: /GB/i.test(v.lang) ? 'Британский' : 'Американский', voice: v });
  }
  return out.slice(0, 3);
}
function bestVoice() {
  const ch = voiceChoices();
  return (ch.find(o => o.voice.voiceURI === S.set.voice) || ch.find(o => /GB/i.test(o.voice.lang)) || ch[0] || {}).voice || voices[0] || null;
}
function speak(text, rate) {
  if (!TTS || !text) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    let v = bestVoice();
    // сетевой голос без интернета молчит — подменяем встроенным английским
    if (v && !v.localService && !navigator.onLine) v = voices.find(x => x.localService && x.lang.replace('_', '-').startsWith(v.lang.slice(0, 5).replace('_', '-'))) || voices.find(x => x.localService) || v;
    if (v) { u.voice = v; u.lang = v.lang; } else u.lang = 'en-GB';
    u.rate = rate || S.set.rate;
    if (speechSynthesis.speaking || speechSynthesis.pending) { speechSynthesis.cancel(); setTimeout(() => speechSynthesis.speak(u), 60); }
    else speechSynthesis.speak(u);
  } catch (e) { /* озвучка недоступна */ }
}
const sayWord = i => speak(disp(i));
const sayEx = i => speak(plain(exEn(i)));
let actx = null;
function sfx(ok) {
  if (!S.set.sfx) return;
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === 'suspended') actx.resume();
    const t = actx.currentTime;
    for (const [f, dt] of ok ? [[660, 0], [990, .09]] : [[220, 0], [160, .11]]) {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = ok ? 'sine' : 'triangle'; o.frequency.value = f;
      g.gain.setValueAtTime(.0001, t + dt); g.gain.exponentialRampToValueAtTime(.16, t + dt + .015); g.gain.exponentialRampToValueAtTime(.0001, t + dt + .16);
      o.connect(g).connect(actx.destination); o.start(t + dt); o.stop(t + dt + .18);
    }
  } catch (e) {}
}
/* ---- щелчки и вибрация при нажатии клавиш (как клавиатура iPhone) ---- */
// стили щелчка; у букв, стирания и пробела/кнопок разный тон, как у клавиатуры Apple
const CLICKS = { soft: 'Мягкий', tock: 'Клавиатура iPhone', wood: 'Дерево', pop: 'Пузырёк' };
const TONE = { key: 1, del: 0.78, mod: 0.64 };
function keyClick(type = 'key', style = S.set.click) {
  if (!S.set.keySound) return;
  try {
    if (!actx || actx.state !== 'running') { unlockAudio(); return; }
    const t = actx.currentTime, k = TONE[type] || 1, out = actx.destination;
    const env = (g, peak, dur) => { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0001, t + dur); };
    const ping = (f, peak, dur) => { const o = actx.createOscillator(), g = actx.createGain(); o.type = 'sine'; o.frequency.value = f; env(g, peak, dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.01); };
    if (style === 'tock') {
      // «ток» клавиатуры iPhone: звонкий основной тон и короткий призвук сверху
      ping(1900 * k, 0.13, 0.022); ping(3900 * k, 0.04, 0.008);
    } else if (style === 'wood') {
      // деревянный брусок: ниже и дольше
      ping(880 * k, 0.17, 0.04); ping(2350 * k, 0.05, 0.012);
    } else if (style === 'pop') {
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(420 * k, t); o.frequency.exponentialRampToValueAtTime(950 * k, t + 0.035);
      env(g, 0.16, 0.045); o.connect(g).connect(out); o.start(t); o.stop(t + 0.05);
    } else {
      // мягкий: короткий синус с лёгким спадом высоты — «тап» без резкости
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = 'sine'; o.frequency.setValueAtTime(1150 * k, t); o.frequency.exponentialRampToValueAtTime(720 * k, t + 0.03);
      env(g, 0.14, 0.035); o.connect(g).connect(out); o.start(t); o.stop(t + 0.04);
    }
  } catch (e) {}
}
// Тактильный отклик. Android — Vibration API. iPhone (Safari iOS 18+) — внутри каждой кнопки лежит невидимый
// системный переключатель <input switch>: касание переключает его, и iOS отвечает родной вибрацией (как ios-haptics).
const IS_IOS = /[?&]ios=1/.test(location.search) || /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
function haptic() {
  if (!S.set.haptic || IS_IOS) return;
  if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return;   // до первого касания вибрация запрещена
  try { if (navigator.vibrate) navigator.vibrate(10); } catch (e) {}
}
function addHaptic(el) {
  if (el.querySelector(':scope > [data-haptic]')) return;
  const label = document.createElement('label');
  label.setAttribute('data-haptic', ''); label.setAttribute('aria-hidden', 'true');
  label.style.cssText = 'position:absolute;inset:0;touch-action:manipulation;-webkit-tap-highlight-color:transparent;z-index:1';
  const sw = document.createElement('input');
  sw.type = 'checkbox'; sw.setAttribute('switch', ''); sw.tabIndex = -1;
  sw.style.cssText = 'position:absolute;width:1px;height:1px;margin:0;visibility:hidden';
  sw.addEventListener('click', e => e.stopPropagation());   // второй (синтетический) клик по переключателю не пускаем дальше
  label.append(sw);
  if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
  el.append(label);
}
let hapticQueued = false;
function applyHaptics() {
  hapticQueued = false;
  if (!IS_IOS || !S.set.haptic) { $$('[data-haptic]').forEach(l => l.remove()); return; }
  $$(HAPTIC_TARGETS).forEach(el => { if (!el.disabled) addHaptic(el); });
}
new MutationObserver(() => { if (!hapticQueued) { hapticQueued = true; requestAnimationFrame(applyHaptics); } })
  .observe(document.body, { childList: true, subtree: true });

// iOS разблокирует Web Audio только в touchend/click — там же и «будим» контекст
function unlockAudio() {
  try {
    actx = actx || new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state !== 'running') {
      actx.resume();
      const b = actx.createBuffer(1, 1, 22050), src = actx.createBufferSource();
      src.buffer = b; src.connect(actx.destination); src.start(0);
    }
  } catch (e) {}
}
['touchend', 'click', 'keydown'].forEach(ev => document.addEventListener(ev, unlockAudio, true));
const CLICKABLE = '.key, .tile, .opt, .mb, .bbtn, .btn, .stage, .cell, .spk, .listen, .tool, .back, .heart, .arrow, .wchip, .rb';
const HAPTIC_TARGETS = '.linkbtn, .key, .tile, .opt, .mb, .bbtn, .btn, .stage, .cell:not(.empty), .spk, .listen, button.tool, .back, .heart, .arrow, .rb, .mute';
const clickType = el => { const k = el.dataset.k; return el.classList.contains('key') || el.classList.contains('tile') ? (k === 'del' ? 'del' : k === ' ' || k === '-' ? 'mod' : 'key') : 'mod'; };
// звук и вибрация — только на завершённое нажатие кнопки, буквы или клавиши (событие click):
// касание с прокруткой страницы нажатием не считается и не звучит
document.addEventListener('click', e => {
  const el = e.target.closest(CLICKABLE);
  if (!el || el.disabled || e.target.closest('[data-haptic] input')) return;
  if (el.matches('.key, .tile')) return;   // буквы уже отозвались при касании (bindTaps)
  keyClick(clickType(el)); haptic();
}, true);

// iOS разрешает звук только после первого касания
document.addEventListener('pointerdown', function unlock() {
  document.removeEventListener('pointerdown', unlock);
  try { if (TTS) { const u = new SpeechSynthesisUtterance(' '); u.volume = 0; speechSynthesis.speak(u); } } catch (e) {}
  try { actx = actx || new (window.AudioContext || window.webkitAudioContext)(); actx.resume(); } catch (e) {}
});

// Нажатие букв и клавиш — в момент касания (pointerdown), а не по click после отпускания пальца:
// при быстром наборе двумя пальцами касания перекрываются, и iOS такие click не присылает — буква терялась,
// следующее нажатие попадало не на ту позицию и считалось ошибкой. Касание в зазор между клавишами
// отдаём ближайшей клавише (до 14 px), как системная клавиатура iPhone. Звук, подсветка и вибрация — сразу.
function bindTaps(box, sel, onHit) {
  box.addEventListener('pointerdown', e => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    let best = null, bd = 14 * 14 + 1;
    for (const el of box.querySelectorAll(sel)) {
      const r = el.getBoundingClientRect(); if (!r.width) continue;
      const dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right), dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
      const d = dx * dx + dy * dy; if (d < bd) { bd = d; best = el; if (!d) break; }
    }
    if (!best || best.classList.contains('used')) return;   // по месту убранной плитки — не на соседнюю
    best.classList.add('press'); setTimeout(() => best.classList.remove('press'), 120);
    keyClick(clickType(best)); haptic();
    onHit(best);
  });
}

/* ---------------- icons ---------------- */

const svg = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const I = {
  back: svg('<path d="M15 5l-7 7 7 7"/>', 'stroke-width="2.8"'),
  next: svg('<path d="M9 5l7 7-7 7"/>', 'stroke-width="2.8"'),
  down: svg('<path d="M5 9l7 7 7-7"/>', 'stroke-width="2.8"'),
  close: svg('<path d="M6 6l12 12M18 6L6 18"/>', 'stroke-width="2.6"'),
  check: svg('<path d="M4.5 12.5l5 5L19.5 7"/>', 'stroke-width="3"'),
  heart: svg('<path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 3.7 4 7 4c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.3 0 5.4 3.3 4.2 6.7C19.5 15.4 12 20 12 20z"/>', 'stroke-width="1.6"'),
  heartOn: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 20s-7.5-4.6-9.2-9.3C1.6 7.3 3.7 4 7 4c2 0 3.3 1.1 5 3 1.7-1.9 3-3 5-3 3.3 0 5.4 3.3 4.2 6.7C19.5 15.4 12 20 12 20z"/></svg>',
  spk: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9.5 9.5 0 0 1 0 13" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  mute: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 9h4l5-4v14l-5-4H3z"/><path d="M16 9l5 6M21 9l-5 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  hint: '<svg viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="3" rx="1" fill="#6ad8c8"/><rect x="3" y="9" width="18" height="3" rx="1" fill="#b6ece4"/><rect x="3" y="14" width="18" height="3" rx="1" fill="#6ad8c8"/><rect x="3" y="19" width="18" height="2" rx="1" fill="#b6ece4"/></svg>',
  lock: svg('<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', 'stroke-width="2.2"'),
  box: svg('<path d="M3 8l9-5 9 5-9 5-9-5z"/><path d="M3 8v8l9 5 9-5V8"/><path d="M12 13v8"/>'),
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z"/></svg>',
  // иконки этапов
  study: svg('<path d="M2 6.5C4.5 5 8 5 12 7c4-2 7.5-2 10-.5V19c-2.5-1.5-6-1.5-10 .5-4-2-7.5-2-10-.5z"/><path d="M12 7v12.5"/>', 'stroke-width="1.7"'),
  memo: svg('<path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 1 5 3 3 0 0 0 4 3V3z"/><path d="M15 3a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-1 5 3 3 0 0 1-4 3V3z"/>', 'stroke-width="1.7"'),
  match: svg('<rect x="2" y="4" width="8" height="5" rx="2.5"/><rect x="14" y="15" width="8" height="5" rx="2.5"/><rect x="14" y="4" width="8" height="5" rx="2.5"/><rect x="2" y="15" width="8" height="5" rx="2.5"/><path d="M10 6.5l4 11M10 17.5l4-11"/>', 'stroke-width="1.6"'),
  audio: svg('<path d="M3 17v-4a9 9 0 0 1 18 0v4"/><rect x="2" y="15" width="5" height="6" rx="2"/><rect x="17" y="15" width="5" height="6" rx="2"/>', 'stroke-width="1.8"'),
  write: svg('<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/>', 'stroke-width="1.8"'),
  fix: svg('<rect x="2" y="6" width="20" height="13" rx="2"/><path d="M6 10h.01M10 10h.01M14 10h.01M18 10h.01M6 14h.01M18 14h.01M9 15h6"/>', 'stroke-width="2"'),
};

/* ---------------- UI utils ---------------- */

let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('show'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('show'), 2600); }
function sheet(html, { onClick, closable = true, onClose, cls = '' } = {}) {
  closeSheet();
  const bg = document.createElement('div');
  bg.className = 'sheet-bg';
  bg.innerHTML = `<div class="sheet ${cls}">${html}</div>`;
  document.body.appendChild(bg);
  let closed = false;
  const close = () => { if (closed) return; closed = true; bg.remove(); onClose && onClose(); };
  bg.addEventListener('click', e => {
    if (e.target === bg && closable) return close();
    if (e.target.closest('[data-close]')) return close();
    onClick && onClick(e, close);
  });
  return { el: bg.firstElementChild, close };
}
function closeSheet() { $$('.sheet-bg').forEach(b => b.remove()); }
const ring = (pts, max = 15) => {
  const c = 2 * Math.PI * 23, f = max ? Math.min(1, pts / max) : 0;
  return `<div class="ring" data-max="${max}"><svg viewBox="0 0 54 54"><circle cx="27" cy="27" r="23" fill="#fff" stroke="#e8e8e8" stroke-width="5"/><circle class="arc" cx="27" cy="27" r="23" fill="none" stroke="#2b6386" stroke-width="5" stroke-dasharray="${c * f} ${c}"/></svg><span>${pts}</span></div>`;
};
// кольцо «прогресс» обновляется сразу после ответа (как в оригинале): сумма баллов слова за упражнения урока, максимум 15
function refreshRing(i) {
  const r = $('.ring'); if (!r || !run || run.kind === 'test') return;
  const pts = run.kind === 'stage' ? wordPts(run.n, i) : run.okSet.size;
  const max = +r.dataset.max, c = 2 * Math.PI * 23, f = max ? Math.min(1, pts / max) : 0;
  const span = r.querySelector('span');
  if (span.textContent !== String(pts)) { span.textContent = pts; r.classList.remove('bump'); void r.offsetWidth; r.classList.add('bump'); }
  r.querySelector('.arc').setAttribute('stroke-dasharray', `${c * f} ${c}`);
}
function setFav(i, on) {
  if (on) { S.fav[i] = Date.now(); if (S.favDel) delete S.favDel[i]; }
  else { delete S.fav[i]; (S.favDel || (S.favDel = {}))[i] = Date.now(); }
  save();
}
const toggleFav = i => { const on = !S.fav[i]; setFav(i, on); toast(on ? 'Добавлено в «Мои слова»' : 'Убрано из «Моих слов»'); return on; };

/* ---------------- routing ---------------- */

let view = { name: 'main' };
let run = null;     // активное упражнение
let onKey = null;

function go(v) { view = v; run = null; onKey = null; closeSheet(); window.scrollTo(0, 0); render(); if (v.name === 'main') scrollToCurrent(); if (swReload) setTimeout(applyUpdate, 300); }
// урок, к которому прокручиваем главный экран: пора повторить → начатый, но не законченный → следующий по порядку
function currentLesson() {
  const ready = Object.keys(S.L).map(Number).filter(n => repState(n) === 'ready');
  if (ready.length) return Math.min(...ready);
  const open = Object.keys(S.L).map(Number).filter(n => n >= S.start && !S.L[n].complete);
  return open.length ? Math.min(...open) : nextToStart() || TOTAL;
}
// главный экран сразу показывает этот урок посередине — без прокрутки вручную
function scrollToCurrent() {
  if (view.name !== 'main' || run) return;
  const n = currentLesson();
  if (Math.floor((n - 1) / PAGE) !== S.page) return;   // пользователь сам листает другую страницу — не мешаем
  requestAnimationFrame(() => { const el = $(`.cell[data-n="${n}"]`); if (el) el.scrollIntoView({ block: 'center' }); });
}
function render() {
  const app = $('#app');
  app.onclick = app.ontouchstart = app.ontouchend = null;
  app.classList.remove('fit');
  if (run) return renderRun(app);
  onKey = null;
  if (!S.onboarded || view.name === 'onb') return renderOnb(app);
  if (view.name === 'lesson') return renderLesson(app, view.n);
  if (view.name === 'fav') return renderFavs(app);
  renderMain(app);
  setTimeout(checkLeague, 450);   // переход в новую лигу — праздничное окно
}

/* ================= «Мои слова»: избранное, поиск и тренировка ================= */

const FAV_STEPS = ['memo', 'match', 'audio', 'write', 'fix'];   // стандартные упражнения урока, без «Изучения»
const FAV_SESSION = 10;
let favQ = '', favLetter = '';
const favIds = () => Object.keys(S.fav).map(Number).filter(i => i < W.length);

function favBar() {
  const n = favIds().length;
  return `<button class="fav-bar" data-act="favs"><span class="fav-ic">${I.heartOn}</span><span><b>Мои слова${n ? ` · ${n}` : ''}</b>
    ${n ? 'тренировать и искать слова' : 'добавляйте слова сердечком ♡ в уроках или найдите по первым буквам'}</span><span class="fav-go">${I.next}</span></button>`;
}
// слова для тренировки: сначала ещё не тренированные, потом с большей долей ошибок, потом давно не тренированные
function pickFavs() {
  const st = S.favStat || {};
  const score = i => { const x = st[i]; return x ? [1, -(x.err / Math.max(1, x.n)), x.last] : [0, 0, 0]; };
  return shuffle(favIds().sort((a, b) => { const p = score(a), q = score(b); return p[0] - q[0] || p[1] - q[1] || p[2] - q[2]; }).slice(0, FAV_SESSION));
}
function startFav(words) {
  if (!words.length) return toast('Сначала добавьте слова в «Мои слова»');
  const steps = FAV_STEPS.filter(k => k !== 'match' || words.length >= 2);
  favStep({ words, steps, step: 0, werr: {}, t0: Date.now() });
}
function favStep(f) {
  const key = f.steps[f.step];
  run = { kind: 'fav', key, k: STAGES.findIndex(x => x.key === key), queue: shuffle(f.words), pos: 0, res: [], total: f.words.length,
    okSet: new Set(), hints: HINTS[key] || 0, hintsUsed: 0, t0: Date.now(), pass: 1, words: f.words, steps: f.steps, step: f.step, werr: f.werr, ft0: f.t0 };
  window.scrollTo(0, 0); render();
  if (f.step) toast(`Упражнение ${f.step + 1} из ${f.steps.length}: ${STAGES[run.k].name}`);
}
function favNextStep(r) {
  if (r.step + 1 < r.steps.length) return favStep({ words: r.words, steps: r.steps, step: r.step + 1, werr: r.werr, t0: r.ft0 });
  const st = S.favStat || (S.favStat = {}), now = Date.now();
  r.words.forEach(i => { const x = st[i] || (st[i] = { n: 0, err: 0, last: 0 }); x.n++; x.err += r.werr[i] || 0; x.last = now; });
  save();
  view = { name: 'fav' }; render();
  const wrong = r.words.filter(i => r.werr[i]).sort((a, b) => r.werr[b] - r.werr[a]);
  const errs = wrong.reduce((s, i) => s + r.werr[i], 0);
  sheet(`<h2>Тренировка завершена</h2>
    <p class="rep-text">Слов: <span>${r.words.length}</span> · упражнений: <span>${r.steps.length}</span> · ошибок: <span>${errs}</span></p>
    ${wrong.length ? `<p class="sub">Больше всего ошибок — эти слова попадут в следующую тренировку раньше других:</p>
      <div class="rating">${wrong.map(i => `<span class="wchip">${esc(disp(i))}<span class="badge">${r.werr[i]}</span></span>`).join('')}</div>` : '<p class="sub">Без единой ошибки!</p>'}
    <div class="sticky"><button class="btn teal" data-again>Ещё ${Math.min(FAV_SESSION, favIds().length)} слов</button><button class="btn" data-close>Готово</button></div>`,
    { onClick: (e, close) => { if (e.target.closest('[data-again]')) { close(); startFav(pickFavs()); } } });
}

function favRow(i, mode) {
  const btn = mode === 'search'
    ? `<button class="heart ${S.fav[i] ? 'on' : ''}" data-tfav="${i}" aria-label="${S.fav[i] ? 'Убрать' : 'Добавить'}">${S.fav[i] ? I.heartOn : I.heart}</button>`
    : `<button class="x" data-unfav="${i}" aria-label="Убрать">×</button>`;
  return `<div class="fav"><button class="spk dark" data-say="${i}" aria-label="Произнести">${I.spk}</button><div class="t"><b>${esc(disp(i))}</b> ${esc(ipa(i))}<div>${esc(ru(i))}</div></div>${btn}</div>`;
}
// поиск по словарю по первым буквам: английское слово или любое слово перевода начинается с введённого
function favSearch(q) {
  q = q.trim().toLowerCase().replace(/^to\s+/, '');
  if (!q) return [];
  const out = [];
  for (let i = 0; i < W.length && out.length < 40; i++) {
    if (en(i).toLowerCase().startsWith(q) || ru(i).toLowerCase().split(/[\s,;()«»—-]+/).some(w => w.startsWith(q))) out.push(i);
  }
  return out;
}
function renderFavs(app) {
  const all = favIds().sort((a, b) => en(a).localeCompare(en(b), 'en', { sensitivity: 'base' }));
  const letters = [...new Set(all.map(i => en(i)[0].toUpperCase()))];
  if (favLetter && !letters.includes(favLetter)) favLetter = '';
  const shown = favLetter ? all.filter(i => en(i)[0].toUpperCase() === favLetter) : all;
  const n = Math.min(FAV_SESSION, all.length);
  app.innerHTML = `<div class="xhead"><button class="back" id="xback" aria-label="Назад">${I.back}</button><h2>Мои слова</h2><span></span></div>
    <div class="favpage">
      <button class="btn" data-act="train" ${all.length ? '' : 'disabled'}>${all.length ? `Тренировать ${n} ${plural(n, 'слово', 'слова', 'слов')}` : 'Тренировать'}</button>
      <p class="sub">5 упражнений, как в уроке: запоминание, пары, аудирование, написание и закрепление.${all.length > FAV_SESSION ? ` За раз — ${FAV_SESSION} слов: сначала новые для тренировки и те, где чаще ошибаетесь.` : ''}</p>
      <h3>Найти и добавить слово</h3>
      <input class="name-input" id="fsearch" type="search" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="Первые буквы — по-английски или по-русски" value="${esc(favQ)}">
      <div class="favlist" id="fres"></div>
      <h3>В списке: ${all.length}</h3>
      ${all.length ? `<div class="letters"><button class="${favLetter ? '' : 'on'}" data-letter="">Все</button>${letters.map(ch => `<button class="${ch === favLetter ? 'on' : ''}" data-letter="${ch}">${ch}</button>`).join('')}</div>
        <div class="favlist">${shown.map(i => favRow(i, 'list')).join('')}</div>`
        : '<p class="sub">Пока пусто. Нажимайте сердечко ♡ в упражнениях и в окне ответа или найдите слова поиском выше.</p>'}
    </div>`;
  const res = $('#fres');
  const showRes = () => {
    const ids = favSearch(favQ);
    res.innerHTML = favQ.trim() ? (ids.length ? ids.map(i => favRow(i, 'search')).join('') : '<p class="sub">Ничего не найдено</p>') : '';
  };
  showRes();
  $('#fsearch').oninput = e => { favQ = e.target.value; showRes(); };
  $('#xback').onclick = () => go({ name: 'main' });
  app.onclick = e => {
    const say = e.target.closest('[data-say]'); if (say) return sayWord(+say.dataset.say);
    const tf = e.target.closest('[data-tfav]');
    if (tf) { setFav(+tf.dataset.tfav, !S.fav[+tf.dataset.tfav]); const y = scrollY; render(); window.scrollTo(0, y); return; }
    const uf = e.target.closest('[data-unfav]');
    if (uf) { setFav(+uf.dataset.unfav, false); const y = scrollY; render(); window.scrollTo(0, y); return; }
    const lt = e.target.closest('[data-letter]'); if (lt) { favLetter = lt.dataset.letter; return render(); }
    if (e.target.closest('[data-act="train"]')) return startFav(pickFavs());
  };
}

/* ================= главный экран ================= */

function renderMain(app) {
  const p = S.page;
  const lc = learnedCount(), pc = pendingCount();
  const nts = nextToStart();
  const a = p * PAGE + 1, b = Math.min((p + 1) * PAGE, TOTAL);
  let cells = '';
  for (let r = 0; r < rowsOnPage(p); r++) {
    const ls = rowLessons(p, r);
    for (const n of ls) cells += lessonCell(n, nts);
    for (let k = ls.length; k < ROW; k++) cells += '<div class="cell empty"></div>';
    cells += testCell(p, r, ls);
  }
  app.innerHTML = `
    <div class="status">
      <button class="st-item" data-act="profile"><span class="avatar">${esc(S.profile.avatar)}</span><small>${esc(S.profile.name)}</small></button>
      <button class="st-item" data-act="leagues">${badgeSVG(leagueOf(level()), level(), 48)}<small>${LEAGUES[leagueOf(level())].name}<span class="lv-txt"> · ур. ${level()}</span></small></button>
      <button class="st-item" data-act="favs" aria-label="Мои слова"><span class="fav-circle">${I.heartOn}${favIds().length ? `<span class="fav-n">${favIds().length}</span>` : ''}</span><small>Мои слова</small></button>
      <button class="st-item grow" data-act="profile"><span class="learned-pill">${lc}</span><small>Выучено слов: ${lc}<b>+${pc}</b></small></button>
    </div>
    <div class="brand"><h1>5555 слов</h1><div class="brand-sub">самых используемых в английском</div><p>95% любого текста можно понять, зная всего 3000 слов</p></div>
    <div class="pager">
      <button class="arrow" data-act="prev" ${p === 0 ? 'disabled' : ''} aria-label="Предыдущая страница">${I.back}</button>
      <h2>Уроки ${a}–${b}${a > CORE ? '<small>Курс 2 · продвинутый</small>' : ''}</h2>
      <button class="arrow" data-act="next" ${p >= PAGES - 1 ? 'disabled' : ''} aria-label="Следующая страница">${I.next}</button>
    </div>
    ${a > CORE && extraLocked(a) ? `<div class="gm-banner">${badgeSVG(GM_INDEX, GRANDMASTER(), 44)}<div><b>Курс 2 — ещё 2555+ слов для продвинутых</b>
      Откроется в лиге «Грандмастер» — с уровня ${GRANDMASTER()}. Сейчас: ${LEAGUES[leagueOf(level())].name}, уровень ${level()}.</div></div>` : ''}
    ${repBanner()}
    ${typeof syncBanner === 'function' ? syncBanner() : ''}
    <div class="grid">${cells}</div>`;
  const turn = np => { np = Math.min(PAGES - 1, Math.max(0, np)); if (np !== S.page) { S.page = np; save(); render(); window.scrollTo(0, 0); } };
  app.onclick = e => {
    const t = e.target.closest('[data-act],[data-n],[data-test]'); if (!t) return;
    if (t.dataset.act && t.dataset.act.startsWith('sync-') && window.syncAction) return syncAction(t.dataset.act);   // вход и синхронизация — sync.js
    if (t.dataset.act === 'favs') return go({ name: 'fav' });
    if (t.dataset.act === 'prev') return turn(p - 1);
    if (t.dataset.act === 'next') return turn(p + 1);
    if (t.dataset.act === 'profile') return openProfile();
    if (t.dataset.act === 'leagues') return openLeagues();
    if (t.dataset.test) return openTest(t.dataset.test);
    const n = +t.dataset.n;
    if (!L(n) && extraLocked(n)) return toast(`Курс 2 (уроки ${CORE + 1}–${TOTAL}) откроется в лиге «Грандмастер» — с уровня ${GRANDMASTER()}`);
    if (repState(n) === 'ready') return startRep(n);
    go({ name: 'lesson', n });
  };
  // свайп влево/вправо листает страницы
  let sx = null, sy = null;
  app.ontouchstart = e => { sx = e.touches[0].clientX; sy = e.touches[0].clientY; };
  app.ontouchend = e => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx, dy = e.changedTouches[0].clientY - sy; sx = null;
    if (Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) turn(p + (dx < 0 ? 1 : -1));
  };
}

// все пройденные, но ещё не повторённые уроки — списком над плиткой
function repBanner() {
  const due = Object.keys(S.L).map(Number).filter(n => ['inactive', 'waiting', 'ready'].includes(repState(n))).sort((a, b) => a - b);
  if (!due.length) return '';
  const ready = due.filter(n => repState(n) === 'ready');
  // «Ждут повторения: 1 урок — №166»: число уроков и их номера, чтобы номер не читался как количество
  const waiting = due.filter(n => repState(n) === 'waiting'), l0 = waiting.length ? L(waiting[0]) : null;
  return `<div class="rep-banner"><b>Ждут повторения: ${due.length} ${plural(due.length, 'урок', 'урока', 'уроков')}</b> ${due.map(n => `<button class="rb ${repState(n) === 'ready' ? 'ready' : ''}" data-n="${n}">№${n}</button>`).join('')}
    ${ready.length ? `<span class="rb-note">можно повторить сейчас: ${ready.length} — нажмите на номер</span>` : waiting.length ? `<span class="rb-note gray">повторение откроется ${fmtDue(l0.rep.due)}</span>` : ''}
    ${due.length > MAX_UNREPEATED ? `<span class="rb-note"><b>Новые уроки закрыты</b>, пока неповторённых уроков больше ${MAX_UNREPEATED}.</span>` : ''}</div>`;
}

function lessonCell(n, nts) {
  const l = L(n);
  if (!l && extraLocked(n)) return `<button class="cell gm-locked" data-n="${n}">${n % 5 === 0 ? `<span class="ms">${n * PER_LESSON}</span><span class="ms-sub">слов</span>` : `<span class="num">${n}</span>`}<span class="lock-ic">${I.lock}</span></button>`;
  if (isSkipped(n)) return `<button class="cell skipped" data-n="${n}"><span class="done-ic">${I.check}</span><span class="tag gray">условно</span><span class="bar"><i style="width:100%"></i></span></button>`;
  const label = n % 5 === 0 ? `<span class="ms">${n * PER_LESSON}</span><span class="ms-sub">слов</span>` : `<span class="num">${n}</span>`;
  if (l && l.complete) {
    const rs = repState(n);
    let under = '', badge = '';
    if (rs === 'waiting') under = `<span class="tag teal">${hhmm(l.rep.due)}</span>`;
    if (rs === 'ready') badge = `<span class="badge">${l.learn.length}</span>`;
    if (rs === 'inactive') under = '<span class="tag gray">повтор</span>';
    return `<button class="cell ${rs && rs !== 'done' ? 'need-rep' : ''} ${rs === 'ready' ? 'rep-ready' : ''}" data-n="${n}">${badge}<span class="done-ic">${I.check}</span>${under}<span class="bar"><i style="width:100%"></i></span></button>`;
  }
  if (l) return `<button class="cell" data-n="${n}"><span class="cur-ic">${n}</span><span class="bar"><i style="width:${lessonFrac(n) * 100}%"></i></span></button>`;
  // расписание: следующий урок — «сегодня»/«завтра», за ним — «завтра»/дата
  let tag = '';
  if (nts && repBlocked()) { if (n === nts) tag = '<span class="tag gray">повторите</span>'; }
  else if (nts) {
    const shift = canStartNew() ? 0 : 1;
    const d = new Date(); d.setDate(d.getDate() + shift + (n - nts));
    const txt = n - nts + shift === 0 ? 'сегодня' : n - nts + shift === 1 ? 'завтра' : ddmm(d);
    if (n === nts) tag = `<span class="tag lime">${txt}</span>`;
    if (n === nts + 1) tag = `<span class="tag gray">${txt}</span>`;
  }
  return `<button class="cell" data-n="${n}">${label}${tag}<span class="bar"></span></button>`;
}

function testCell(p, r, ls) {
  const id = testId(p, r), t = S.T[id];
  const avail = ls.every(lessonComplete);
  const stars = t ? t.stars : 0;
  return `<button class="cell test ${avail ? '' : 'locked'}" data-test="${id}" aria-label="Тест по урокам ${ls[0]}–${ls[ls.length - 1]}"><span class="box">${I.box}</span>
    <span class="stars">${[1, 2, 3].map(k => `<span class="${k <= stars ? 'on' : ''}">${I.star}</span>`).join('')}</span></button>`;
}

/* ================= экран урока ================= */

function renderLesson(app, n) {
  const l = L(n);
  const chips = lessonIds(n).map(i => {
    const known = l && l.dec[i] === 'k';
    const errs = l ? l.errs[i] || 0 : 0;
    const p = known ? 100 : l ? Math.round(wordPts(n, i) / 15 * 100) : 0;
    return `<button class="wchip ${known ? 'known' : ''}" style="--p:${p}%" data-say="${i}">${esc(disp(i))}${errs ? `<span class="badge">${errs}</span>` : ''}</button>`;
  }).join('');
  const rows = STAGES.map((s, k) => {
    const inf = stageInfo(n, k);
    let st;
    if (inf.full) st = `<span class="sst">${I.check}</span>`;
    else st = `<span class="sst ${k && inf.done ? 'bad' : ''}">${inf.credited}/${inf.total}</span>`;
    const locked = !inf.avail && !inf.done;
    const repNote = inf.repCount ? `<small>Слов на повторении: <b class="gc2">${inf.repCount}</b></small>` : '';
    return `<button class="stage ${locked ? 'locked' : ''}" data-k="${k}"><span class="sic g${s.g}">${I[s.key]}</span><span class="sname">${s.name}${repNote}</span>${st}</button>`;
  }).join('');
  let rep = '';
  const rs = repState(n);
  if (rs === 'inactive') rep = `<div class="rep-box"><p>Урок завершён. Активируйте повторение — оно откроется через 24 часа.</p><button class="btn teal small" data-act="rep-activate">Активировать повторение</button></div>`;
  if (rs === 'waiting') rep = `<div class="rep-box"><p>Повторение откроется ${fmtDue(l.rep.due)}.</p></div>`;
  if (rs === 'ready') rep = `<div class="rep-box"><p>Пора повторить слова урока!</p><button class="btn teal small" data-act="rep-start">Начать повторение</button></div>`;
  if (rs === 'done') rep = `<div class="rep-box"><p>Урок и повторение пройдены ✓</p></div>`;
  if (isSkipped(n)) rep = `<div class="rep-box"><p>Урок условно пройден по результатам тестового урока. Его можно пройти для закрепления.</p></div>`;

  app.classList.add('fit');
  app.innerHTML = `<div class="lscreen"><div class="lhead"><div class="top"><button class="back" data-act="back" aria-label="Назад">${I.back}</button><h1>УРОК ${n}</h1><span></span></div>
    <div class="chips">${chips}</div></div>
    <div class="plan"><div class="rail" id="rail"></div><div class="stages">${rows}</div></div>${rep}</div>`;
  drawRail();
  app.onclick = e => {
    const say = e.target.closest('[data-say]'); if (say) return sayWord(+say.dataset.say);
    const a = e.target.closest('[data-act]');
    if (a) {
      if (a.dataset.act === 'back') return go({ name: 'main' });
      if (a.dataset.act === 'rep-activate') return activateRep(n);
      if (a.dataset.act === 'rep-start') return startRep(n);
    }
    const s = e.target.closest('[data-k]'); if (s) openStage(n, +s.dataset.k);
  };
  onKey = e => { if (e.key === 'Escape') go({ name: 'main' }); };
}
function fmtDue(t) {
  const d = new Date(t), now = new Date(), tm = new Date(now); tm.setDate(now.getDate() + 1);
  const when = dkey(d) === dkey(now) ? 'сегодня' : dkey(d) === dkey(tm) ? 'завтра' : ddmm(d);
  return `${when} в ${hhmm(t)}`;
}
// пунктирные линии и номера групп слева от плана урока
function drawRail() {
  const rail = $('#rail'), st = $$('.stage');
  if (!rail || !st.length) return;
  const top = rail.getBoundingClientRect().top;
  const mid = k => { const r = st[k].getBoundingClientRect(); return r.top + r.height / 2 - top; };
  const col = ['#2b6386', '#a3d04a', '#ea5f78'];
  const groups = [0, 3, 5];
  let html = '';
  groups.forEach((a, g) => {
    const y1 = mid(a);
    if (g < 2) { const y2 = mid(groups[g + 1]); html += `<span class="dotline" style="top:${y1 + 20}px;height:${y2 - y1 - 40}px;border-color:${col[g]}"></span>`; }
    html += `<span class="gnum" style="top:${y1}px;background:${col[g]}">${g + 1}</span>`;
  });
  rail.innerHTML = html;
}
addEventListener('resize', () => { if (view.name === 'lesson' && !run) drawRail(); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (view.name === 'lesson' && !run) drawRail(); });

function openStage(n, k) {
  if (!L(n)) {
    if (k !== 0) return toast('Начните с этапа «Изучение»');
    if (n < S.start) { S.L[n] = newLesson(); save(); }   // условно пройденный урок можно повторить без ограничений
    else if (extraLocked(n)) return toast(`Уроки 301–${TOTAL} (слова 3001–${W.length}) откроются в лиге «Грандмастер» — с уровня ${GRANDMASTER()}. Сейчас: ${LEAGUES[leagueOf(level())].name}, уровень ${level()}.`);
    else {
      if (repBlocked()) return toast(`Сначала повторите пройденные уроки: ${unrepeated().join(', ')}. Новый урок откроется, когда неповторённых останется не больше ${MAX_UNREPEATED}.`);
      if (!canStartNew()) return toast('Новый урок будет доступен завтра. Режим «Один урок в день» можно отключить в профиле.');
      S.L[n] = newLesson(); S.lastStart = today(); save();
    }
  }
  const inf = stageInfo(n, k);
  if (inf.full) return toast('Этап пройден');
  if (!inf.avail) return toast(`Сначала пройдите этап «${STAGES[k - 1].name}»`);
  startStage(n, k);
}

/* ================= упражнения ================= */

function startStage(n, k) {
  const l = L(n);
  const queue = k === 0 ? lessonIds(n).filter(i => !l.dec[i])
    : shuffle(learnIds(n).filter(i => !l.st[k].done || (!l.st[k].ok[i] && !(l.st[k].rep || {})[i])));   // повтор — только незасчитанные слова
  if (!queue.length) return toast('В этом этапе нет слов');
  const st = l.st[k]; st.passes = (st.passes || 0) + 1; st.rep = st.rep || {};
  run = { kind: 'stage', n, k, key: STAGES[k].key, queue, pos: 0, res: [], hints: HINTS[STAGES[k].key] || 0, hintsUsed: 0, t0: Date.now(), pass: st.passes };
  window.scrollTo(0, 0); render();
}
function startRep(n) {
  const l = L(n);
  run = { kind: 'rep', n, key: 'fix', queue: shuffle(l.learn), pos: 0, res: [], hints: HINTS.fix, hintsUsed: 0, t0: Date.now(), total: l.learn.length, okSet: new Set() };
  window.scrollTo(0, 0); render();
}
function testWords(ls) {
  const all = ls.flatMap(n => L(n) && L(n).learn && L(n).learn.length ? L(n).learn : lessonIds(n));
  const errOf = i => ls.reduce((s, n) => s + ((L(n) && L(n).errs[i]) || 0), 0);
  const ids = all.filter(i => errOf(i)).sort((a, b) => errOf(b) - errOf(a)).slice(0, TEST_WORDS);   // сначала слова с ошибками
  for (const i of shuffle(all.filter(i => !ids.includes(i)))) { if (ids.length >= TEST_WORDS) break; ids.push(i); }
  return ids;
}
// окно «МИНИ-ТЕСТ»: выбор сложности
function openTest(id) {
  const [p, r] = id.split('.').map(Number);
  const ls = rowLessons(p, r);
  if (!ls.every(lessonComplete)) return toast(`Мини-тест откроется после уроков ${ls[0]}–${ls[ls.length - 1]}`);
  const t = S.T[id] || {}, best = t.best || {};
  const star = on => `<span class="${on ? 'on' : ''}">${I.star}</span>`;
  sheet(`<button class="sheet-close left" data-close aria-label="Назад">${I.back}</button>
    <div class="mt-title">МИНИ-ТЕСТ</div>
    <p class="mt-text">Мини-тест активируется каждые 4 урока. За 4 дня мозг успевает «стереть» из памяти новую информацию. Тест позволит закрепить слова в долговременной памяти.</p>
    <div class="mt-choose">Выберите сложность теста</div>
    ${TEST_LEVELS.map(lv => `<div class="mt-level"><div class="mt-name">${lv.name}</div><p class="mt-desc">${lv.text}</p>
      <button class="mt-pill" data-level="${lv.stars}"><span class="mt-score">${best[lv.stars] || 0}/${TEST_WORDS}</span>
      <span class="stars mt-stars">${Array.from({ length: lv.stars }, () => star((t.stars || 0) >= lv.stars && best[lv.stars] >= TEST_WORDS)).join('')}</span></button></div>`).join('')}`, {
    cls: 'mt',
    onClick: (e, close) => { const b = e.target.closest('[data-level]'); if (b) { close(); startTest(id, +b.dataset.level); } },
  });
}
function startTest(id, level) {
  const [p, r] = id.split('.').map(Number);
  const ids = shuffle(testWords(rowLessons(p, r)));
  run = { kind: 'test', id, level, key: 'fix', queue: ids, pos: 0, res: [], hints: level === 1 ? HINTS.test : 0, hintsUsed: 0,
    t0: Date.now(), total: ids.length, okSet: new Set(), errors: 0, speed: {}, failed: false };
  window.scrollTo(0, 0); render();
}
// результат слова в мини-тесте
function testWord(i, { wrong, hints, failed, ms, len }) {
  const r = run, ok = !failed && !wrong;
  if (!(i in r.speed)) r.speed[i] = { s: ms / 1000 / len, ok };   // скорость — по первой попытке
  wmut(i).err += wrong; bumpDay();
  if (r.level === 3) {
    const good = ok && r.speed[i].s <= TEST_SEC_PER_LETTER;
    r.res.push({ i, ok: good }); r.okSet.add(i);
    if (!good) r.failed = true;
  } else {
    r.res.push({ i, ok });
    if (ok) r.okSet.add(i);
    else { r.queue.push(i); r.errors++; }   // слово с ошибкой пересдаётся в конце теста
  }
  save();
  if (ok) { sfx(true); setTimeout(nextWord, 350); }
  else setTimeout(() => answerSheet(i, false), 350);
}

const curI = () => run.queue[run.pos];
const curKey = () => run.key;

function renderRun(app) {
  onKey = null;
  const key = curKey();
  if (key === 'place') renderPlace(app);
  else if (key === 'study') renderStudy(app);
  else if (key === 'match') renderMatch(app);
  else if (key === 'memo') renderMemo(app);
  else renderLetters(app, key);
  fitPrompts();
  fitHeight();
}

function header(title, i) {
  const heart = i === undefined ? '<span></span>' : `<button class="heart ${S.fav[i] ? 'on' : ''}" id="fav" aria-label="В избранное">${S.fav[i] ? I.heartOn : I.heart}</button>`;
  return `<div class="xhead"><button class="back" id="xback" aria-label="Назад">${I.back}</button><h2>${title}</h2>${heart}</div>`;
}
function pbar() {
  const total = run.total || run.queue.length;
  const res = run.kind === 'test' ? run.res : run.okSet ? [...run.okSet].map(() => ({ ok: true })) : run.res;
  const cnt = run.kind === 'test' ? run.okSet.size : Math.min(res.length, total);
  const w = 100 / total;
  const segs = res.slice(0, total).map((r, k) => `<span class="seg ${r.skip ? 'skip' : r.ok ? 'ok' : 'bad'}" style="left:${k * w}%;width:${w + .3}%"></span>`).join('');
  return `<div class="pbar">${segs}<span class="cnt">${cnt}</span><span class="tot">${total}</span></div>`;
}
function tools(i, soundToggle) {
  // кольцо: в уроке — баллы слова из 15, в тесте и повторении — общий счёт
  // в мини-тесте — баллы слова, набранные в его уроке
  const inLesson = run.kind === 'stage' || run.kind === 'test';
  const pts = run.kind === 'stage' ? wordPts(run.n, i) : run.kind === 'test' ? wordPts(lessonOf(i), i) : run.okSet.size;
  const max = inLesson ? 15 : (run.total || run.queue.length);
  const snd = soundToggle
    ? `<button class="tool snd ${S.set.auto ? '' : 'off'}" id="snd"><span class="tb">${S.set.auto ? I.spk : I.mute}</span>Звук</button>`
    : `<button class="tool snd" id="snd"><span class="tb">${I.spk}</span>Звук</button>`;
  if (run.kind === 'test' && run.level > 1) return `<div class="tools">${snd}<div class="tool">${ring(pts, max)}прогресс</div><span class="tool" style="width:54px"></span></div>`;   // на 2 и 3 звезды подсказок нет
  const hint = `<button class="tool ${run.hints ? '' : 'nohint'}" id="hint"><span class="tb">${I.hint}<span class="hbadge">${run.hints}</span></span>Подсказка</button>`;
  return `<div class="tools">${snd}<div class="tool">${ring(pts, max)}прогресс</div>${hint}</div>`;
}
function bindCommon(i) {
  $('#xback').onclick = exitRun;
  const f = $('#fav');
  if (f) f.onclick = () => { const on = toggleFav(i); f.classList.toggle('on', on); f.innerHTML = on ? I.heartOn : I.heart; };
}
function useHint(btn) {
  run.hints--; run.hintsUsed++;
  btn.querySelector('.hbadge').textContent = run.hints;
  if (!run.hints) btn.classList.add('nohint');
}
function exitRun() {
  if (run.kind === 'place') { run = null; onb.step = 'intro'; return render(); }
  if (run.kind === 'test' && run.pos > 0 && !confirm('Прервать мини-тест? Результат не сохранится — тест нужно пройти целиком.')) return;
  if (run.kind === 'stage') { L(run.n).time += Date.now() - run.t0; L(run.n).hints += run.hintsUsed; save(); }
  go(run.kind === 'stage' ? { name: 'lesson', n: run.n } : run.kind === 'fav' ? { name: 'fav' } : { name: 'main' });
}

/* ----- запись результата по слову ----- */

function commit(i, pts, ok, errs, hinted = false) {
  run.res.push({ i, ok });
  if (run.kind === 'fav') run.werr[i] = (run.werr[i] || 0) + errs;
  else wmut(i).err += errs;
  if (run.kind === 'stage') {
    const l = L(run.n), st = l.st[run.k];
    // любая ошибка или подсказка — слово не станет выученным сразу, а уйдёт на повторение (даже если этап потом пересдан)
    if (errs || hinted) (l.flawed || (l.flawed = {}))[i] = 1;
    st.pts[i] = pts; st.ok[i] = ok; st.err[i] = (st.err[i] || 0) + errs;
    l.errs[i] = (l.errs[i] || 0) + errs;
    // этап пройден повторно, а слово снова с ошибкой — переводим его в статус «на повторении»
    if (!ok && run.pass >= 2 && run.k > 0) st.rep[i] = 1;
  }
  if (run.kind === 'rep' || run.kind === 'test' || (run.kind === 'fav' && run.key !== 'match')) {   // ошибка — слово повторяется в конце, пока все не будут верны
    if (ok) run.okSet.add(i);
    else { run.queue.push(i); if (run.tasks) run.tasks.push(run.tasks[run.pos]); run.errors = (run.errors || 0) + 1; }
  }
  refreshRing(i);
  bumpDay(); save();
}

function answerSheet(i, ok) {
  sfx(ok);
  if (S.set.auto) sayWord(i);
  const ex = exEn(i) ? `<div class="ans-row"><div class="grow ans-ex">${hl(exEn(i))}</div><button class="spk dark" data-sayex aria-label="Произнести пример">${I.spk}</button></div>
    <div class="ans-exru">${hl(exRu(i))}</div>` : '';
  const s = sheet(`<div class="verdict ${ok ? 'ok' : 'bad'}">${ok ? 'ПРАВИЛЬНО!' : 'НЕВЕРНО'}</div>
    <div class="ans-row"><div class="grow"><div class="ans-word">${esc(disp(i))}</div><div class="ans-ipa">${esc(ipa(i))}</div></div><button class="heart ${S.fav[i] ? 'on' : ''}" data-afav aria-label="В «Мои слова»">${S.fav[i] ? I.heartOn : I.heart}</button><button class="spk dark" data-say aria-label="Произнести">${I.spk}</button></div>
    <div class="ans-ru">${esc(ru(i))}</div>${ex}
    <div class="sticky"><button class="btn" data-ok>ОК</button></div>`, {
    // длинный пример — мельче шрифт, чтобы окно не росло и не закрывало кольцо прогресса
    cls: 'ans' + (Math.max(plain(exEn(i)).length, plain(exRu(i)).length * 0.85, ru(i).length * 1.6) > 44 ? ' long' : ''),
    closable: false,
    onClick: (e, close) => {
      if (e.target.closest('[data-say]')) return sayWord(i);
      if (e.target.closest('[data-sayex]')) return sayEx(i);
      const hf = e.target.closest('[data-afav]');
      if (hf) { const on = toggleFav(i); hf.classList.toggle('on', on); hf.innerHTML = on ? I.heartOn : I.heart; const top = $('#fav'); if (top) { top.classList.toggle('on', on); top.innerHTML = hf.innerHTML; } return; }
      if (e.target.closest('[data-ok]')) { close(); nextWord(); }
    },
  });
  onKey = e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); s.close(); nextWord(); } };
}

function nextWord() {
  run.pos++;
  if (run.pos >= run.queue.length) return finishRun();
  window.scrollTo(0, 0);
  render();
}

function finishRun() {
  const r = run;
  run = null; onKey = null;
  if (r.kind === 'stage') {
    const l = L(r.n);
    l.time += Date.now() - r.t0;
    l.hints += r.hintsUsed;
    l.st[r.k].done = 1;
    statBump('stages');
    if (r.k === 0) {
      l.learn = lessonIds(r.n).filter(i => l.dec[i] === 'l');
      if (!l.learn.length) l.st.forEach(s => { s.done = 1; });   // все слова известны — урок завершён
    }
    save();
    view = { name: 'lesson', n: r.n }; render();
    const completeNow = stagesFull(r.n) && !l.complete;
    if (r.k === 0) { if (completeNow) completeLesson(r.n); return; }
    stageResults(r, () => { if (completeNow) completeLesson(r.n); });
  } else if (r.kind === 'fav') {
    favNextStep(r);
  } else if (r.kind === 'rep') {
    const l = L(r.n);
    l.rep.done = Date.now();
    l.learn.forEach(i => { wmut(i).learned = 1; });
    save(); view = { name: 'main' }; render();
    sheet(`<button class="sheet-close" data-close aria-label="Закрыть">${I.close}</button><h2>Повторение пройдено</h2>
      <p class="rep-text">Слова урока ${r.n} закреплены. Выучено слов: <span>+${l.learn.length}</span></p>
      <button class="btn" data-close>ОК</button>`);
  } else {
    const prev = S.T[r.id] || {}, best = { ...(prev.best || {}) };
    const passed = r.level < 3 || !r.failed;   // уровни 1–2 проходятся до 100%; уровень 3 — без ошибок и быстрее 1 с/букву
    const correct = r.level === 3 ? r.res.filter(x => x.ok).length : r.total;
    best[r.level] = Math.max(best[r.level] || 0, correct);
    const stars = Math.max(prev.stars || 0, passed ? r.level : 0);
    S.T[r.id] = { stars, best, d: today() };
    save(); view = { name: 'main' }; render();
    const big = on => `<span class="${on ? 'on' : ''}">${I.star.replace('<svg', '<svg style="width:52px;height:52px"')}</span>`;
    const got = passed ? r.level : 0;
    let body = '';
    if (r.level === 3) {
      const rows = Object.entries(r.speed).map(([i, v]) => ({ i: +i, ...v })).sort((a, b) => (a.ok === b.ok ? 0 : a.ok ? -1 : 1) || a.s - b.s);
      body = `<div class="mt-rt">Рейтинг слов по скорости набора</div><p class="mt-sub">На одну букву дается ${TEST_SEC_PER_LETTER} сек</p>
        <div class="speed">${rows.map(x => { const good = x.ok && x.s <= TEST_SEC_PER_LETTER;
          return `<div class="sp-row"><span class="sp-bar ${good ? 'ok' : 'bad'}" style="width:${Math.min(100, Math.max(22, x.s / 2 * 100))}%">${esc(disp(x.i))}</span>
            <span class="sp-val">${x.ok ? x.s.toFixed(2).replace('.', ',') + ' с/буква' : 'ошибка'}</span></div>`; }).join('')}</div>`;
    } else {
      const wrong = [...new Set(r.res.filter(x => !x.ok).map(x => x.i))];
      body = `<p class="rep-text">Ошибок: <span>${r.errors}</span>${r.level === 1 ? `, подсказок: <span>${r.hintsUsed}</span>` : ''}</p>
        ${wrong.length ? `<p class="sub">Слова с ошибками были пересданы:</p><div class="rating">${wrong.map(i => `<span class="wchip">${esc(disp(i))}</span>`).join('')}</div>` : ''}`;
    }
    sheet(`<div class="mt-result">${passed ? 'Тест пройден!' : 'Тест не пройден'}</div>
      ${passed ? '' : '<p class="mt-sub">В этот раз вам не удалось пройти тест. Некоторые слова вы набрали с ошибкой или медленнее, чем необходимо. Попробуйте еще раз.</p>'}
      <div class="mt-rt">Получено звезд</div>
      <div class="stars big-stars">${[1, 2, 3].map(k => big(k <= got)).join('')}</div>
      ${body}
      <div class="sticky"><button class="btn teal" data-close>ОК</button></div>`, { cls: 'mt' });
  }
}

function stageResults(r, then) {
  const l = L(r.n), st = l.st[r.k];
  const cells = learnIds(r.n).map(i => `<div class="res ${st.ok[i] ? 'ok' : ''}">${esc(disp(i))}<span class="pts">${st.pts[i] ?? 0}</span>${st.err[i] ? `<span class="badge">${st.err[i]}</span>` : ''}</div>`).join('');
  const s = sheet(`<button class="sheet-close" data-close aria-label="Закрыть">${I.close}</button>
    <h2>Упражнение выполнено</h2>
    <p class="note">Для того, чтобы слово считалось изученным, вам нужно набрать по 3 балла в каждом упражнении. Использование подсказки отнимает 1 балл.</p>
    <div class="legend"><span class="dot">1</span> — количество ошибок, допущенных в слове.</div>
    <div class="res-grid">${cells}</div>`, { onClose: () => { onKey = null; render(); then && then(); } });
  onKey = e => { if (e.key === 'Enter' || e.key === 'Escape') { e.preventDefault(); s.close(); } };
}

const statBump = k => { if (window.statsBump) statsBump(k); };   // анонимная статистика — sync.js
function completeLesson(n) {
  statBump('lessons');
  const l = L(n);
  l.complete = Date.now();
  if (n < S.start) l.rep = { due: 0, done: Date.now() };   // условно пройденный урок: повторение не требуется
  lessonIds(n).forEach(i => { if (l.dec[i] === 'k' || (wordPts(n, i) >= 5 * STAGE_PTS && !(l.flawed || {})[i])) wmut(i).learned = 1; });
  save(); render();
  const ids = l.learn;
  const errs = ids.map(i => l.errs[i] || 0);
  const maxE = Math.max(3, ...errs);
  const avg = errs.length ? errs.reduce((a, b) => a + b, 0) / errs.length : 0;
  const cols = ids.map((i, k) => `<span class="col" title="${esc(disp(i))}: ${errs[k]}"><i style="height:${errs[k] / maxE * 100}%"></i></span>`).join('');
  const rating = ids.slice().sort((a, b) => (l.errs[b] || 0) - (l.errs[a] || 0))
    .map(i => `<button class="wchip ${S.fav[i] ? 'fav' : ''}" data-fav="${i}">${esc(disp(i))}${l.errs[i] ? `<span class="badge">${l.errs[i]}</span>` : ''}</button>`).join('');
  const mins = Math.max(1, Math.round(l.time / 60000));
  sheet(`<div class="done-title">УРОК ЗАВЕРШЁН!</div>
    <div class="kpis"><div class="kpi">Время<div class="circle">${mins}<small>${plural(mins, 'Минута', 'Минуты', 'Минут')}</small></div></div>
      <div class="kpi">Подсказки<div class="circle">${l.hints}</div></div></div>
    ${ids.length ? `<div class="chart-title">Ошибки в словах</div>
    <div class="chart">${cols}<span class="avg" style="bottom:${avg / maxE * 100}%"></span></div>
    <div class="chart-title">Рейтинг слов по сложности</div><p class="sub">Нажмите на слово, чтобы добавить его в «Мои слова»</p>
    <div class="rating">${rating}</div>` : '<p class="rep-text">Все слова урока вы уже знали!</p>'}
    <div class="sticky"><button class="btn teal" data-ok>ОК</button></div>`, {
    closable: false,
    onClick: (e, close) => {
      const f = e.target.closest('[data-fav]');
      if (f) return f.classList.toggle('fav', toggleFav(+f.dataset.fav));
      if (e.target.closest('[data-ok]')) { close(); if (ids.length && n >= S.start) repOffer(n); else go({ name: 'main' }); }
    },
  });
}

function repOffer(n) {
  const due = Date.now() + REP_DELAY;
  sheet(`<button class="sheet-close" data-close aria-label="Закрыть">${I.close}</button><h2 class="teal">ПОВТОРЕНИЕ</h2>
    <p class="rep-text">Активировано <span>повторение</span> только что выученных слов. Повторение очень важно для закрепления в памяти. Оно активируется <span>${fmtDue(due)}</span>. Не забудьте его пройти!</p>
    <button class="btn teal" data-act>Активировать</button>`, {
    onClick: (e, close) => { if (e.target.closest('[data-act]')) { close(); activateRep(n); } },
    onClose: () => { if (!run) render(); },
  });
}
function activateRep(n) { const l = L(n); l.rep = { due: Date.now() + REP_DELAY, done: 0 }; save(); toast(`Повторение откроется ${fmtDue(l.rep.due)}`); go({ name: 'main' }); }

/* ----- этап 1: изучение ----- */

function renderStudy(app) {
  const i = curI(), all = lessonIds(run.n), k = all.indexOf(i) + 1;
  const ex = exEn(i) ? `<div class="ex"><div class="en">${hl(exEn(i))}</div>
      <div class="sline"><button class="spk" id="sayex" aria-label="Произнести пример">${I.spk}</button></div><div class="ruex">${hl(exRu(i))}</div></div>` : '';
  // все блоки фиксированной высоты: слово, перевод и кнопки стоят на одном месте для любого слова
  const width = Math.min(innerWidth, 560) - 40;
  const wordPx = Math.min(60, Math.floor(width / (disp(i).length * 0.5)));
  const ruLen = ru(i).length, ruPx = ruLen <= 18 ? 36 : ruLen <= 28 ? 30 : 25;
  const exLen = Math.max(plain(exEn(i)).length, plain(exRu(i)).length * 0.8), exPx = exLen <= 40 ? 23 : exLen <= 55 ? 21 : 19;
  app.classList.add('fit');
  app.innerHTML = `<div class="xfit"><div class="xhead"><button class="back" id="xback" aria-label="Назад">${I.back}</button><span></span>
      <button class="mute ${S.set.auto ? 'on' : ''}" id="auto" aria-label="Автоозвучка">${S.set.auto ? I.spk : I.mute}</button></div>
    <div class="pbar"><span class="seg ok" style="left:0;width:${k / all.length * 100}%"></span><span class="cnt">${k}</span><span class="tot">${all.length}</span></div>
    <div class="xbody study"><div class="st-top"><div class="bigword" style="font-size:${wordPx}px">${esc(disp(i))}</div><div class="ipa gray">${esc(ipa(i))}</div></div>
      <div class="sline"><button class="spk" id="say" aria-label="Произнести">${I.spk}</button></div>
      <div class="ru" style="font-size:${ruPx}px">${esc(ru(i))}</div>
      <div class="ex-box" style="font-size:${exPx}px">${ex}</div>
      <div class="big-btns"><button class="bbtn teal" id="know">Знаю слово</button><button class="bbtn lime" id="learn">Выучить слово</button></div></div></div>`;
  $('#xback').onclick = exitRun;
  $('#say').onclick = () => sayWord(i);
  const se = $('#sayex'); if (se) se.onclick = () => sayEx(i);
  $('#auto').onclick = () => { S.set.auto = !S.set.auto; save(); const b = $('#auto'); b.classList.toggle('on', S.set.auto); b.innerHTML = S.set.auto ? I.spk : I.mute; };
  const decide = d => {
    L(run.n).dec[i] = d;
    if (d === 'k') wmut(i).learned = 1;   // «Знаю слово» — исключается из урока и считается выученным
    bumpDay(); save(); nextWord();
  };
  $('#know').onclick = () => decide('k');
  $('#learn').onclick = () => decide('l');
  onKey = e => { if (e.key === 'ArrowLeft') decide('k'); else if (e.key === 'ArrowRight' || e.key === 'Enter') decide('l'); };
  if (S.set.auto) sayWord(i);
}

/* ----- этап 2: запоминание (выбор перевода) ----- */

// неверные варианты: та же часть речи; минимум 2 из 3 — близкие по смыслу или ассоциациям (dog → cat, wolf);
// слова с совпадающим переводом исключены, чтобы правильный ответ был один
const posOf = i => W[i][6];
// взаимозаменяемые по смыслу модальные глаголы — не варианты друг для друга (иначе два правильных ответа)
const CONFUSABLE = [['may', 'might', 'can', 'could'], ['must', 'should', 'ought'], ['will', 'would', 'shall']];
const confusable = (i, j) => CONFUSABLE.some(g => g.includes(en(i).toLowerCase()) && g.includes(en(j).toLowerCase()));
const nearOf = i => W[i][7] || [];
function distractors(i) {
  const out = [], seen = new Set([ru(i).toLowerCase()]), p = posOf(i);
  const add = j => {
    if (out.length >= 3 || j === i || j < 0 || j >= W.length || posOf(j) !== p) return false;
    const v = ru(j).toLowerCase(); if (seen.has(v) || overlaps(i, j) || confusable(i, j)) return false;
    seen.add(v); out.push(j); return true;
  };
  // 2 близких из лучших (случайно из первых 6), третий — тоже близкий с вероятностью 1/2
  const near = shuffle(nearOf(i).slice(0, 6)).concat(nearOf(i).slice(6));
  for (const j of near) { if (out.length >= 2) break; add(j); }
  if (Math.random() < 0.5) for (const j of near) { if (out.length >= 3) break; add(j); }
  // остальное — та же часть речи, похожей частотности
  for (let t = 0; out.length < 3 && t < 400; t++) add(i + ((Math.random() * (t < 200 ? 300 : 3000) | 0) - (t < 200 ? 150 : 1500)));
  for (let j = 0; out.length < 3 && j < W.length; j++) add(j);
  return shuffle(out);
}
function renderMemo(app) {
  const i = curI();
  const opts = shuffle([i, ...distractors(i)]);
  let hinted = false, answered = false;
  const title = run.kind === 'test' ? 'Тест' : 'Запоминание';
  app.innerHTML = header(title, run.kind === 'test' ? undefined : i) + pbar() + `<div class="xbody">
    <div class="bigword">${esc(disp(i))}</div><div class="ipa">${esc(ipa(i))}</div>
    ${tools(i, false)}
    <div class="opts" id="opts">${opts.map(j => `<button class="opt" data-j="${j}">${esc(ru(j))}</button>`).join('')}</div></div>`;
  bindCommon(i);
  $('#snd').onclick = () => sayWord(i);
  const h = $('#hint');
  if (h) h.onclick = () => {
    if (hinted || !run.hints || answered) return;
    hinted = true; useHint(h);
    opts.filter(j => j !== i).slice(0, 2).forEach(j => $(`.opt[data-j="${j}"]`).classList.add('gone'));   // оставляем 2 варианта из 4
  };
  const choose = b => {
    if (!b || answered || b.classList.contains('gone')) return;
    answered = true; $('#opts').classList.add('lock');
    const ok = +b.dataset.j === i;
    b.classList.add(ok ? 'ok' : 'bad');
    if (!ok) $(`.opt[data-j="${i}"]`).classList.add('ok');
    commit(i, ok ? STAGE_PTS - (hinted ? 1 : 0) : 0, ok, ok ? 0 : 1, hinted);
    setTimeout(() => answerSheet(i, ok), 350);
  };
  $('#opts').onclick = e => choose(e.target.closest('.opt'));
  onKey = e => { const k = +e.key; if (k >= 1 && k <= 4) choose($$('.opt')[k - 1]); };
  if (S.set.auto) sayWord(i);
}

/* ----- этап 3: повторение (пары) ----- */

function renderMatch(app) {
  const ids = run.queue;
  if (!run.m) run.m = { L: shuffle(ids), R: shuffle(ids), done: [], errs: {} };
  const m = run.m;
  const lRest = m.L.filter(i => !m.done.includes(i)), rRest = m.R.filter(i => !m.done.includes(i));
  let cells = '';
  // сопоставленные пары — зелёные, наверху, слово напротив перевода
  m.done.forEach(i => { cells += `<button class="mb done">${esc(disp(i))}</button><button class="mb done">${esc(ru(i))}</button>`; });
  lRest.forEach((i, k) => {
    cells += `<button class="mb" data-side="L" data-i="${i}">${esc(disp(i))}</button><button class="mb" data-side="R" data-i="${rRest[k]}">${esc(ru(rRest[k]))}</button>`;
  });
  const total = ids.length, w = 100 / total;
  app.classList.add('fit');
  app.innerHTML = `<div class="xfit">` + header('Повторение') + `<div class="pbar">${m.done.map((_, k) => `<span class="seg ok" style="left:${k * w}%;width:${w + .3}%"></span>`).join('')}<span class="cnt">${m.done.length}</span><span class="tot">${total}</span></div>
    <div class="xbody"><div class="match-cap">Соедините слово с переводом</div><div class="match" id="match" style="grid-template-rows:repeat(${total}, minmax(0, 58px))">${cells}</div></div></div>`;
  $('#xback').onclick = exitRun;
  let sel = null;
  $('#match').onclick = e => {
    const b = e.target.closest('.mb[data-i]'); if (!b) return;
    if (b.dataset.side === 'L' && S.set.auto) sayWord(+b.dataset.i);
    if (!sel || sel.dataset.side === b.dataset.side) { if (sel) sel.classList.remove('sel'); sel = b; b.classList.add('sel'); return; }
    const a = sel; sel = null; a.classList.remove('sel');
    const li = +(a.dataset.side === 'L' ? a : b).dataset.i, ri = +(a.dataset.side === 'R' ? a : b).dataset.i;
    if (li === ri || overlaps(li, ri)) {
      sfx(true); m.done.push(li);
      if (m.done.length === total) {
        // каждая ошибка в паре отнимает 1 балл; при 0 баллов слово не засчитано
        ids.forEach(i => { const e = m.errs[i] || 0, pts = Math.max(0, STAGE_PTS - e); commit(i, pts, pts > 0, e); });
        run.pos = run.queue.length - 1;
        setTimeout(nextWord, 450);
      }
      render();
    } else {
      sfx(false); m.errs[li] = (m.errs[li] || 0) + 1;
      [a, b].forEach(x => { x.classList.add('bad', 'shake'); setTimeout(() => x.classList.remove('bad', 'shake'), 450); });
    }
  };
}

/* ----- этапы 4–6: буквы (аудирование, написание) и клавиатура (закрепление) ----- */

function renderLetters(app, key) {
  const i = curI(), tStart = performance.now();
  const word = en(i), target = word.toLowerCase();
  const kb = key === 'fix';
  const title = run.kind === 'test' ? 'Мини-тест' : run.kind === 'rep' ? 'Повторение' : STAGES[run.k].name;
  let pos = 0, wrong = 0, hintsHere = 0, done = false;
  const letters = shuffle([...word].map(ch => ch.toUpperCase()));
  const prompt = key === 'audio'
    ? `<div class="listen-cap">Коснитесь, чтобы прослушать</div><button class="listen" id="listen" aria-label="Прослушать">${I.spk}</button>`
    : `<div class="bigword ru">${esc(ru(i))}</div>`;
  const cells = `<div class="cells" id="cells">${[...word].map((_, k) => `<span class="c ${k === 0 ? 'cur' : ''}"></span>`).join('')}</div>`;
  const pad = kb ? keyboardHTML() : `<div class="tiles" id="tiles">${letters.map((ch, k) => `<button class="tile" data-t="${k}">${esc(ch)}</button>`).join('')}</div>`;
  const tl = tools(i, true);
  // в «Аудировании» кнопки под динамиком, в «Написании» и «Закреплении» — под ячейками
  const body = key === 'audio' ? prompt + tl + cells + pad : prompt + cells + tl + pad;
  app.innerHTML = header(title, run.kind === 'test' ? undefined : i) + pbar() + `<div class="xbody">${body}</div>${kb ? '<div class="kbd-space"></div>' : ''}`;
  bindCommon(i);
  fitLetters(word.length);
  const cellEls = $$('#cells .c');
  const listen = $('#listen'); if (listen) listen.onclick = () => sayWord(i);
  $('#snd').onclick = () => {
    S.set.auto = !S.set.auto; save();
    const s = $('#snd'); s.classList.toggle('off', !S.set.auto); s.querySelector('.tb').innerHTML = S.set.auto ? I.spk : I.mute;
  };
  const place = (cls, tile) => {
    cellEls[pos].textContent = word[pos]; cellEls[pos].classList.remove('cur'); if (cls) cellEls[pos].classList.add(cls);
    if (!kb) {
      // убираем именно нажатую плитку; для подсказки — первую подходящую (при двух одинаковых буквах раньше
      // пряталась другая плитка, а нажатая оставалась зелёной)
      const t = tile && !tile.classList.contains('used') ? tile
        : $$('#tiles .tile').find(t => !t.classList.contains('used') && letters[+t.dataset.t].toLowerCase() === target[pos]);
      if (t) t.classList.add('used');
    }
    pos++;
    if (pos < word.length) cellEls[pos].classList.add('cur');
  };
  const finish = failed => {
    done = true;
    if (failed) while (pos < word.length) { cellEls[pos].textContent = word[pos]; cellEls[pos].classList.add('fail'); cellEls[pos].classList.remove('cur'); pos++; }
    if (run.kind === 'test') return testWord(i, { wrong, hints: hintsHere, failed, ms: performance.now() - tStart, len: word.length });
    const pts = failed ? 0 : Math.max(0, STAGE_PTS - wrong - hintsHere);
    const ok = pts > 0;
    commit(i, pts, ok, wrong, hintsHere > 0);
    setTimeout(() => answerSheet(i, ok), 350);
  };
  const press = (ch, el) => {
    if (done) return;
    if (ch === target[pos]) {
      place(null, kb ? null : el); sfx(true);
      if (pos === word.length) finish(false);
    } else {
      wrong++; sfx(false);
      if (el) { el.classList.add('bad', 'shake'); setTimeout(() => el.classList.remove('bad', 'shake'), 400); }
      const c = cellEls[pos]; if (c) { c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 300); }
      if (wrong + hintsHere >= STAGE_PTS) finish(true);   // баллы кончились — слово не засчитано
    }
  };
  const h = $('#hint');
  if (h) h.onclick = () => {
    if (done || !run.hints) return;
    useHint(h); hintsHere++;
    place('hint');   // подсказка вписывает следующую верную букву
    if (wrong + hintsHere >= STAGE_PTS) finish(true);   // подсказка забрала последний балл
    else if (pos === word.length) finish(false);
  };
  if (kb) {
    bindTaps($('#kbd'), '.key', k => {
      if (k.dataset.k === 'del') return;   // принятые буквы всегда верные — стирать нечего
      press(k.dataset.k, k);
    });
  } else {
    bindTaps($('#tiles'), '.tile', t => press(letters[+t.dataset.t].toLowerCase(), t));
  }
  onKey = e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    const ch = e.key.toLowerCase();
    if (!/[a-z' -]/.test(ch)) return;
    e.preventDefault();
    keyClick(ch === ' ' || ch === '-' ? 'mod' : 'key');
    const el = kb ? $(`.key[data-k="${ch}"]`)
      : $$('#tiles .tile').find(t => !t.classList.contains('used') && letters[+t.dataset.t].toLowerCase() === ch) || null;
    press(ch, el);
  };
  if (key === 'audio' && S.set.auto) sayWord(i);   // иначе — только по кнопке «Коснитесь, чтобы прослушать»
}
// крупное слово задания: уменьшаем шрифт, пока самое длинное слово не поместится целиком (без разрыва посередине)
function fitPrompts() {
  $$('.bigword').forEach(el => {
    let fs = parseFloat(getComputedStyle(el).fontSize);
    for (let k = 0; k < 40 && el.scrollWidth > el.clientWidth + 1 && fs > 16; k++) { fs -= 2; el.style.fontSize = fs + 'px'; }
  });
}
// По высоте: длинное слово (2 строки ячеек и плиток) + длинный перевод не должны выходить за экран
// и уводить кнопки под клавиатуру. Сжимаем по шагам: отступы сверху → шрифт задания (не мельче 24 px)
// и кнопка прослушивания (не меньше 72 px) → высота ячеек и плиток (не ниже 34 px).
function fitHeight() {
  const tools = $('.tools'), kbd = $('#kbd');
  const over = () => Math.max(document.scrollingElement.scrollHeight - innerHeight,
    tools && kbd ? tools.getBoundingClientRect().bottom - kbd.getBoundingClientRect().top : 0);
  if (over() <= 0) return;
  const px = (el, p) => parseFloat(getComputedStyle(el)[p]);
  for (const el of $$('.bigword, .listen-cap, .listen')) {
    const o = over(); if (o <= 0) return;
    el.style.marginTop = Math.max(8, px(el, 'marginTop') - o) + 'px';
  }
  const bw = $('.bigword'), ls = $('.listen');
  for (let k = 0; k < 20 && over() > 0; k++) {
    let done = true;
    if (bw && px(bw, 'fontSize') > 24) { bw.style.fontSize = px(bw, 'fontSize') - 2 + 'px'; done = false; }
    if (ls && px(ls, 'height') > 72) { const h = px(ls, 'height') - 6 + 'px'; ls.style.width = ls.style.height = h; done = false; }
    if (done) break;
  }
  for (const el of $$('#cells, #tiles')) {
    for (let k = 0; k < 20 && over() > 0; k++) {
      const h = parseFloat(el.style.getPropertyValue('--h')); if (!(h > 34)) break;
      el.style.setProperty('--h', h - 2 + 'px');
    }
  }
}
// Размер ячеек и плиток под длину слова и ширину экрана.
// Буква не уже MIN_LETTER (как клавиша клавиатуры iPhone — 10 клавиш в ряду): пока слово так помещается — одна строка
// (до 10 букв на обычных iPhone, до 8 на iPhone SE, больше на iPad); длиннее — две ровные строки
// (communication: 7 + 6). Средняя длина слова — 6 букв, самое длинное — 14.
const MIN_LETTER = 32;
function fitLetters(n) {
  const body = $('.xbody'); if (!body) return;
  const bs = getComputedStyle(body);   // ширина содержимого — без внутренних отступов экрана
  const avail = body.clientWidth - parseFloat(bs.paddingLeft) - parseFloat(bs.paddingRight) - 2, gap = 4;
  const perRowMax = Math.max(1, Math.floor((avail + gap) / (MIN_LETTER + gap)));
  const rows = Math.min(2, Math.ceil(n / perRowMax)), perRow = Math.ceil(n / rows);   // максимум 2 строки
  const size = (el, base, kh, kf, minH) => {
    if (!el) return;
    // если и в две строки буква не влезает шириной 32 px (очень узкое окно) — буквы уже, но третьей строки нет
    const w = Math.max(16, Math.min(base, Math.floor((avail - gap * (perRow - 1)) / perRow)));
    const k = rows > 1 ? 0.8 : 1;   // в две строки — чуть ниже, чтобы влезало над клавиатурой
    el.style.setProperty('--w', w + 'px');
    el.style.setProperty('--h', Math.round(Math.max(minH * k, Math.min(base, w) * kh * k)) + 'px');
    el.style.setProperty('--fs', Math.round(Math.min(base, w) * kf) + 'px');
    el.style.gap = gap + 'px';
    el.style.flexWrap = rows > 1 ? 'wrap' : 'nowrap';
    el.style.maxWidth = rows > 1 ? (perRow * w + (perRow - 1) * gap) + 'px' : '';   // ровно perRow букв в строке
    el.style.marginLeft = el.style.marginRight = rows > 1 ? 'auto' : '';
  };
  size($('#cells'), 38, 1.5, 0.74, 40);
  size($('#tiles'), 46, 1.45, 0.66, 48);
}
function keyboardHTML() {
  const rows = ['qwertyuiop', 'asdfghjkl', 'zxcvbnm'];
  return `<div class="kbd" id="kbd"><div class="kbd-in">${rows.map(r => `<div class="krow">${[...r].map(c => `<button class="key" data-k="${c}">${c.toUpperCase()}</button>`).join('')}</div>`).join('')}
    <div class="krow"><button class="key mid" data-k="-">-</button><button class="key wide" data-k=" " aria-label="Пробел"></button><button class="key mid" data-k="del" aria-label="Стереть">&lt;</button></div></div></div>`;
}

/* ================= определение уровня при первом запуске ================= */

const CEFR = [
  ['A1', 'Начальный', 'Знаю алфавит, отдельные слова и простые фразы'],
  ['A2', 'Элементарный', 'Понимаю простые фразы о себе, семье, покупках'],
  ['B1', 'Средний', 'Понимаю основное в простых текстах, объяснюсь в поездке'],
  ['B2', 'Уверенный средний', 'Смотрю сериалы с субтитрами, свободно переписываюсь'],
  ['C1', 'Продвинутый', 'Понимаю сложные тексты и фильмы без субтитров'],
  ['C2', 'В совершенстве', 'Уровень носителя языка или близкий к нему'],
];
// диапазон уровня в частотном списке 3000 слов (сколько слов обычно знает человек этого уровня)
// C1 и C2 на деле знают почти все 3000 базовых слов — их граница в курсе 2 (слова 3001–5620): C1 ≈ 3250, C2 ≈ 3750
const CEFR_RANGE = { A1: [0, 250], A2: [250, 650], B1: [650, 1200], B2: [1350, 1950], C1: [3000, 3500], C2: [3500, 4000] };
// ожидаемая граница знания по самооценке: «−» — первая четверть диапазона, без знака — середина, «+» — три четверти
const SELF_POS = {};
for (const [c, [a, b]] of Object.entries(CEFR_RANGE)) {
  SELF_POS[c + '-'] = Math.round(a + (b - a) / 4);
  SELF_POS[c] = Math.round((a + b) / 2);
  SELF_POS[c + '+'] = Math.round(a + (b - a) * 3 / 4);
}
SELF_POS['A1-'] = 0;   // A1− — почти с нуля: без теста старт с урока 1 (раньше было с 7-го)
const PLACE_BANDS = 5, PLACE_BAND_W = 200, PLACE_PER_BAND = 4;   // тестовый урок: 5 диапазонов по 200 слов, по 4 слова = 20 слов
const selfLabel = code => code.replace('-', '−');
const SELF_ORDER = Object.keys(CEFR_RANGE).flatMap(c => [c + '-', c, c + '+']);
const nextSelf = code => SELF_ORDER[Math.min(SELF_ORDER.length - 1, SELF_ORDER.indexOf(code) + 1)];
let onb = { step: 'self' };

function renderOnb(app) {
  const brand = `<div class="brand"><h1>5555 слов</h1><div class="brand-sub">самых используемых в английском</div><p>95% любого текста можно понять, зная всего 3000 слов</p></div>`;
  const back = onb.again ? `<button class="btn ghost-link" data-act="cancel">Отмена</button>` : '';
  if (onb.step === 'self') {
    app.innerHTML = `<div class="onb">${brand}
      <h2 class="onb-h">Какой у вас уровень английского?</h2>
      ${typeof SYNC_ON === 'function' && SYNC_ON() ? '<button class="btn ghost-link" data-act="sync-login" style="margin-top:0">Уже занимались на другом устройстве? Войти</button>' : ''}
      <button class="btn zero-btn" data-act="zero">Я только начинаю учить английский<small>Начать с первого урока, без теста</small></button>
      <p class="onb-sub onb-or">Уже знаете английский? Выберите уровень и где вы в нём: <b>−</b> ниже среднего, без знака — средний, <b>+</b> выше среднего. Затем короткий тестовый урок уточнит, с какого урока начать.</p>
      <div class="lvls">${CEFR.map(([c, name, text]) => `<div class="lvl"><div class="lvl-info"><b>${c}</b> <span>${name}</span><div>${text}</div></div>
        <div class="lvl-btns"><button class="lvl-b" data-self="${c}-">${c}−<small>ниже среднего</small></button><button class="lvl-b mid" data-self="${c}">${c}<small>средний</small></button><button class="lvl-b" data-self="${c}+">${c}+<small>выше среднего</small></button></div></div>`).join('')}</div>
      ${back}<p class="sub" style="margin:18px 0 6px"><a href="o-prilozhenii.html">Что это за приложение и как оно работает</a></p></div>`;
  } else if (onb.step === 'intro') {
    const lo = placeLo(onb.self);
    app.innerHTML = `<div class="onb">${brand}
      <h2 class="onb-h">Тестовый урок · ${selfLabel(onb.self)}</h2>
      <ul class="onb-list"><li>20 слов из частотного списка — примерно с ${lo + 1}-го по ${lo + PLACE_SPAN}-е. Если слова окажутся трудными, добавим ещё 20 слов попроще</li>
        ${placeTyping(onb.self) ? `<li>Уровень C — тест сложнее: по русскому переводу <b>напишите слово по-английски</b> на клавиатуре, без подсказки из набора букв</li>
        <li>Одна подсказка на слово — откроет следующую букву. Допускается 2 опечатки, на третьей слово не засчитывается</li>
        <li>Не знаете слово — нажмите <b>«Не знаю»</b></li>
        <li>Займёт 4–6 минут</li>` : `<li>Выберите перевод из 4 вариантов — они похожи по смыслу, будьте внимательны</li>
        <li>Не знаете слово — нажмите <b>«Не знаю»</b>, не угадывайте: так результат будет точнее</li>
        <li>Займёт 2–3 минуты</li>`}</ul>
      <button class="btn" data-act="go">Начать тестовый урок</button>
      <button class="btn gray" data-act="skip">Пропустить тест: начать с урока ${Math.floor(SELF_POS[onb.self] / PER_LESSON) + 1}</button>
      <button class="btn ghost-link" data-act="back">Изменить самооценку</button></div>`;
  } else {
    const r = onb.res, N = onb.start;
    const skipped = (N - 1) * PER_LESSON;
    app.innerHTML = `<div class="onb">${brand}
      <h2 class="onb-h">Результат тестового урока</h2>
      <p class="onb-sub">Самооценка ${selfLabel(onb.self)} · ${r.capped ? `тест пройден отлично — рекомендуем уровень <b>${selfLabel(r.capCode)}</b> — ${knownText(r.known)}${nextSelf(onb.self) !== onb.self ? '. Если знаете больше, выберите при самооценке уровень выше' : ''}` : `вы знаете ${knownText(r.known)}`}</p>
      <div class="bands">${r.bands.map(b => `<div class="band"><span class="band-l">Слова ${b.from + 1}–${b.to}</span>
        <span class="band-bar"><i style="width:${b.score * 100}%" class="${b.score >= 0.75 ? 'ok' : b.score >= 0.4 ? 'mid' : 'bad'}"></i></span>
        <span class="band-r">${b.c} из ${PLACE_PER_BAND}</span></div>`).join('')}</div>
      <div class="onb-start"><div>Стартовый урок${N === r.rec ? ' (рекомендуем)' : ''}</div>
        <div class="stepper"><button data-d="-10">−10</button><button data-d="-1">−1</button><b>${N}</b><button data-d="1">+1</button><button data-d="10">+10</button></div></div>
      <p class="onb-sub">${N > 1 ? `Уроки 1–${N - 1} будут условно пройдены: ${skipped} слов засчитаются выученными: уровень ${levelFor(skipped)}, лига «${LEAGUES[leagueOf(levelFor(skipped))].name}». Их можно открыть и пройти в любой момент.` : 'Начнёте с самого первого урока.'}</p>
      <button class="btn" data-act="apply">Начать с урока ${N}</button>
      <button class="btn gray" data-act="retest">Пройти тестовый урок ещё раз</button></div>`;
  }
  app.onclick = e => {
    const sb = e.target.closest('[data-self]');
    if (sb) { onb = { ...onb, step: 'intro', self: sb.dataset.self }; window.scrollTo(0, 0); return render(); }
    const d = e.target.closest('[data-d]');
    if (d) { onb.start = Math.min(TOTAL, Math.max(1, onb.start + +d.dataset.d)); return render(); }
    const a = e.target.closest('[data-act]'); if (!a) return;
    const act = a.dataset.act;
    if (act === 'sync-login' && window.syncAction) return syncAction(act);   // вход на новом устройстве — до определения уровня
    if (act === 'zero') applyStart(1, { self: 'A1-', known: 0, rec: 1 });
    if (act === 'cancel') { onb = { step: 'self' }; go({ name: 'main' }); }
    if (act === 'back') { onb.step = 'self'; render(); }
    if (act === 'go' || act === 'retest') startPlacement(onb.self);
    if (act === 'skip') { const n = Math.floor(SELF_POS[onb.self] / PER_LESSON) + 1; applyStart(n, { self: onb.self, known: null, rec: n }); }
    if (act === 'apply') applyStart(onb.start, { self: onb.self, known: onb.res.known, rec: onb.res.rec });
  };
}
// тестовый урок охватывает 1000 слов вокруг ожидаемой границы знания
const PLACE_SPAN = PLACE_BANDS * PLACE_BAND_W;
// C1 и C2 — тест по словам курса 2: C1 — с 3101-го по 4100-е, C2 — сложнее, с 4101-го по 5100-е (больше академической лексики)
const PLACE_C_LO = { C1: 3100, C2: 4100 };
// B2 — тест сложнее: окно сдвинуто на 200 слов к менее частотным (B2: слова 1351–2350 вместо 1151–2150)
const PLACE_UP = { B2: 200 };
const placeLo = code => /^C/.test(code) ? PLACE_C_LO[code.slice(0, 2)]
  : Math.max(0, Math.min(W.length - PLACE_SPAN, SELF_POS[code] - PLACE_SPAN / 2 + (PLACE_UP[code.slice(0, 2)] || 0)));
// C1–C2: тест сложнее — не выбор из 4, а «Закрепление»: написать слово по-английски по переводу на полной клавиатуре
const placeTyping = code => /^C/.test(code);
const PLACE_MAX_WRONG = 2;   // как в «Закреплении»: третье неверное нажатие — слово не засчитано
function startPlacement(code) {
  run = { kind: 'place', key: 'place', code, mode: placeTyping(code) ? 'type' : 'choice', lo: placeLo(code), round: 1, bandsDef: [], band: {}, ans: {}, queue: [], pos: 0, res: [], total: 0 };
  addPlaceRound(run.lo);
  window.scrollTo(0, 0); render();
}
// раунд: 5 диапазонов по 200 слов начиная с lo, по 4 случайных слова из каждого
function addPlaceRound(lo) {
  const ids = [];
  for (let k = 0; k < PLACE_BANDS; k++) {
    const from = lo + k * PLACE_BAND_W, idx = run.bandsDef.length;
    run.bandsDef.push({ from, to: from + PLACE_BAND_W });
    shuffle(range(from, from + PLACE_BAND_W)).slice(0, PLACE_PER_BAND).forEach(i => { run.band[i] = idx; ids.push(i); });
  }
  run.queue.push(...shuffle(ids)); run.total = run.queue.length;
}
function renderPlace(app) {
  if (run.mode === 'type') return renderPlaceType(app);
  const i = curI();
  const opts = shuffle([i, ...distractors(i)]);
  let done = false;
  app.innerHTML = `<div class="xhead"><button class="back" id="xback" aria-label="Назад">${I.back}</button><h2>Тестовый урок</h2><span></span></div>` + pbar() +
    `<div class="xbody"><div class="bigword">${esc(disp(i))}</div><div class="ipa">${esc(ipa(i))}</div>
    <button class="spk" id="say" style="margin-top:12px" aria-label="Произнести">${I.spk}</button>
    <div class="opts" id="opts">${opts.map(j => `<button class="opt" data-j="${j}">${esc(ru(j))}</button>`).join('')}</div>
    <button class="btn gray idk" id="idk">Не знаю</button></div>`;
  $('#xback').onclick = exitRun;
  $('#say').onclick = () => sayWord(i);
  const answer = (b, a) => {
    if (done) return; done = true;
    $('#opts').classList.add('lock');
    $(`.opt[data-j="${i}"]`).classList.add('ok');
    if (b && a === 'bad') b.classList.add('bad');
    run.ans[i] = a; run.res.push({ i, ok: a === 'ok', skip: a === 'skip' });
    setTimeout(() => { run.pos++; if (run.pos >= run.queue.length) finishPlacement(); else render(); }, a === 'ok' ? 350 : 800);
  };
  $('#opts').onclick = e => { const b = e.target.closest('.opt'); if (b) answer(b, +b.dataset.j === i ? 'ok' : 'bad'); };
  $('#idk').onclick = () => answer(null, 'skip');
  onKey = e => { const k = +e.key; if (k >= 1 && k <= 4) { const b = $$('.opt')[k - 1]; answer(b, +b.dataset.j === i ? 'ok' : 'bad'); } if (e.key === '0' || e.key === ' ') { e.preventDefault(); answer(null, 'skip'); } };
  if (S.set.auto) sayWord(i);
}
// тестовый урок C1–C2: по переводу набрать слово на клавиатуре; 1 подсказка на слово, до 2 неверных нажатий
function renderPlaceType(app) {
  const i = curI(), word = en(i), target = word.toLowerCase();
  let pos = 0, wrong = 0, hinted = false, done = false;
  app.innerHTML = `<div class="xhead"><button class="back" id="xback" aria-label="Назад">${I.back}</button><h2>Тестовый урок</h2><span></span></div>` + pbar() +
    `<div class="xbody"><div class="bigword ru">${esc(ru(i))}</div>
    <div class="cells" id="cells">${[...word].map((_, k) => `<span class="c ${k === 0 ? 'cur' : ''}"></span>`).join('')}</div>
    <div class="place-tools"><button class="btn gray small" id="phint">Подсказка (1)</button><button class="btn gray small" id="idk">Не знаю</button></div>
    ${keyboardHTML()}</div><div class="kbd-space"></div>`;
  fitLetters(word.length);
  const cells = $$('#cells .c');
  $('#xback').onclick = exitRun;
  const put = cls => { cells[pos].textContent = word[pos]; cells[pos].classList.remove('cur'); if (cls) cells[pos].classList.add(cls); pos++; if (pos < word.length) cells[pos].classList.add('cur'); };
  const finish = a => {
    if (done) return; done = true;
    if (a !== 'ok') while (pos < word.length) { cells[pos].textContent = word[pos]; cells[pos].classList.add('fail'); cells[pos].classList.remove('cur'); pos++; }
    run.ans[i] = a; run.res.push({ i, ok: a === 'ok', skip: a === 'skip' });
    if (a === 'ok') sfx(true); else if (a === 'bad') sfx(false);
    setTimeout(() => { run.pos++; if (run.pos >= run.queue.length) finishPlacement(); else render(); }, a === 'ok' ? 450 : 1300);
  };
  const press = (ch, el) => {
    if (done) return;
    if (ch === target[pos]) { put(); if (pos === word.length) finish('ok'); return; }
    wrong++;
    if (el) { el.classList.add('bad', 'shake'); setTimeout(() => el.classList.remove('bad', 'shake'), 400); }
    const c = cells[pos]; if (c) { c.classList.add('flash'); setTimeout(() => c.classList.remove('flash'), 300); }
    if (wrong > PLACE_MAX_WRONG) finish('bad');
  };
  bindTaps($('#kbd'), '.key', k => { if (k.dataset.k !== 'del') press(k.dataset.k, k); });
  $('#phint').onclick = () => {
    if (done || hinted) return;
    hinted = true; put('hint'); $('#phint').disabled = true; $('#phint').textContent = 'Подсказка использована';
    if (pos === word.length) finish('ok');
  };
  $('#idk').onclick = () => finish('skip');
  onKey = e => {
    if (e.metaKey || e.ctrlKey || e.altKey || e.key.length !== 1) return;
    const ch = e.key.toLowerCase(); if (!/[a-z' -]/.test(ch)) return;
    e.preventDefault(); keyClick(ch === ' ' ? 'mod' : 'key'); press(ch, $(`.key[data-k="${ch}"]`));
  };
}
// оценка словарного запаса: доля знания по диапазонам с поправкой на угадывание (−1/3 за неверный ответ, «Не знаю» — 0)
function placeBands(r) {
  return r.bandsDef.map((d, k) => {
    const ids = Object.keys(r.band).filter(i => r.band[i] === k);
    const c = ids.filter(i => r.ans[i] === 'ok').length, w = ids.filter(i => r.ans[i] === 'bad').length;
    const guessPenalty = r.mode === 'type' ? 0 : w / 3;   // при наборе слова угадать нельзя — штрафа нет
    return { ...d, c, w, score: Math.max(0, Math.min(1, (c - guessPenalty) / PLACE_PER_BAND)) };
  }).sort((a, b) => a.from - b.from);
}
// «примерно 1500 слов из 3000» или, для уровня C, «все 3000 базовых слов и ещё примерно 250 из следующих 2000»
function knownText(k) {
  const base = CORE * PER_LESSON;
  return k <= base ? `примерно <b>${k}</b> слов из ${base}` : `все ${base} базовых слов и ещё примерно <b>${k - base}</b> из следующих 2555+`;
}
function estimateKnown(bands) {
  // слова до первого проверенного диапазона считаем известными, если он уверенно знаком; промежутки — по среднему соседей
  let known = bands[0].from * Math.min(1, bands[0].score / 0.8);
  bands.forEach((b, k) => {
    known += b.score * (b.to - b.from);
    const next = bands[k + 1];
    if (next && next.from > b.to) known += (next.from - b.to) * (b.score + next.score) / 2;
  });
  return Math.round(known);
}
function finishPlacement() {
  const r = run;
  const bands = placeBands(r);
  if (r.round === 1) {
    // самооценка завышена (первый диапазон знаком меньше чем наполовину) — ещё 20 слов попроще
    const first = bands[0];
    if (first.score < 0.5 && r.lo > 0) {
      r.round = 2; addPlaceRound(Math.max(0, r.lo - (first.score < 0.25 ? 1500 : 1000)));
      toast('Ещё 20 слов попроще — чтобы точнее определить уровень');
      return render();
    }
  }
  run = null;
  // даже при безошибочном тесте рекомендуем не выше самооценки + 1 шаг (B2 → B2+)
  const cap = SELF_POS[nextSelf(r.code)];
  const measured = estimateKnown(bands), known = Math.min(measured, cap);
  const rec = Math.min(TOTAL, Math.max(1, Math.floor(known / PER_LESSON) + 1));
  onb = { ...onb, step: 'result', res: { bands, known, rec, capped: measured > cap, capCode: nextSelf(r.code) }, start: rec };
  window.scrollTo(0, 0); render();
}
function applyStart(n, info) {
  S.start = n; S.onboarded = 1;
  S.league = leagueOf(levelFor((n - 1) * PER_LESSON));   // стартовая лига — без праздничного окна
  S.placement = { ...info, start: n, d: today() };
  S.page = Math.floor((n - 1) / PAGE);
  save(); onb = { step: 'self' };
  go({ name: 'main' });
  toast(n > 1 ? `Стартовый урок — ${n}. Уроки 1–${n - 1} условно пройдены` : 'Начинаем с первого урока');
}

/* ================= профиль ================= */

// Диагностика: откуда открыто приложение, работает ли офлайн-кэш и сколько заняла загрузка
function appDiag() {
  const nav = performance.getEntriesByType && performance.getEntriesByType('navigation')[0];
  const ms = nav ? Math.round(nav.domContentLoadedEventEnd) : 0;
  const sw = 'serviceWorker' in navigator && navigator.serviceWorker.controller;
  const parts = [esc(location.host || 'файл'), sw ? 'офлайн-кэш включён' : 'офлайн-кэш не включён'];
  if (ms) parts.push(`загрузка ${ms < 1000 ? ms + " мс" : (ms / 1000).toFixed(1) + " с"}`);
  if (!isSecureContext) parts.push('адрес без HTTPS — офлайн-режим невозможен; установите иконку заново с https://priceman-git.github.io/words3000/');
  else if (!sw) parts.push('кэш включится со следующего открытия');
  return parts.join(' · ');
}
function openProfile() {
  const lessonsDone = Object.values(S.L).filter(l => l.complete).length;
  const favs = Object.keys(S.fav).map(Number);
  const vs = voiceChoices();
  const cur = bestVoice();
  const sk = streak();
  sheet(`<button class="sheet-close" data-close aria-label="Закрыть">${I.close}</button><div class="prof">
    <h2>Профиль</h2>
    <h3>Имя и аватар</h3>
    <input class="name-input" id="pname" value="${esc(S.profile.name)}" maxlength="24" autocomplete="off">
    <div class="avatars" style="margin-top:10px">${AVATARS.map(a => `<button class="${a === S.profile.avatar ? 'on' : ''}" data-av="${a}">${a}</button>`).join('')}</div>
    <h3>Статистика</h3>
    <div class="stat3"><div><b>${learnedCount()}</b><span>выучено слов</span></div><div><b>${lessonsDone}</b><span>уроков из ${TOTAL}</span></div><div><b>${sk}</b><span>${plural(sk, 'день', 'дня', 'дней')} подряд</span></div></div>
    ${typeof syncSection === 'function' ? syncSection() : ''}
    <h3>Уровень английского</h3>
    <div class="prow"><div class="l">${S.placement ? `${esc(selfLabel(S.placement.self))} · старт с урока ${S.start}` : `Старт с урока ${S.start}`}<div>${S.placement && S.placement.known != null ? `По тестовому уроку: ${knownText(S.placement.known).replace(/<\/?b>/g, '')}` : 'Определение уровня не проходили'}</div></div>
      <button class="btn gray small" style="width:auto;margin:0;padding:0 14px" data-act="replace">Определить заново</button></div>
    <h3>Мои слова (${favs.length})</h3>
    <button class="btn teal small" data-act="favs">Открыть «Мои слова»: поиск и тренировка</button>
    <div class="favlist">${favs.length ? favs.map(i => `<div class="fav"><button class="spk dark" data-say="${i}" aria-label="Произнести">${I.spk}</button><div class="t"><b>${esc(disp(i))}</b> ${esc(ipa(i))}<div>${esc(ru(i))}</div></div><button class="x" data-unfav="${i}" aria-label="Убрать">×</button></div>`).join('') : '<p class="sub">Нажмите ♡ в упражнении, чтобы добавить слово.</p>'}</div>
    <h3>Настройки</h3>
    <div class="prow"><div class="l">Telegram-канал «Слово дня»<div>Два новых слова каждый день — в 6:00 и 18:00 по Москве</div></div><a class="btn teal small tg-btn" href="https://t.me/eng_words555" target="_blank" rel="noopener">Подписаться</a></div>
    <div class="prow"><div class="l">Один урок в день<div>Новый урок можно начать раз в сутки</div></div><label class="switch"><input type="checkbox" data-set="daily" ${S.set.daily ? 'checked' : ''}><span></span></label></div>
    <div class="prow"><div class="l">Автоматически произносить слова</div><label class="switch"><input type="checkbox" data-set="auto" ${S.set.auto ? 'checked' : ''}><span></span></label></div>
    <div class="prow"><div class="l">Звук нажатий<div>Щелчок при нажатии на кнопки, буквы и клавиши. <button class="linkbtn" data-act="testkeys">Проверить</button></div></div><label class="switch"><input type="checkbox" data-set="keySound" ${S.set.keySound ? 'checked' : ''}><span></span></label></div>
    <div class="prow"><div class="l">Вибрация<div>Тактильный отклик при нажатии (iPhone с iOS 18 и новее, Android)</div></div><label class="switch"><input type="checkbox" data-set="haptic" ${S.set.haptic ? 'checked' : ''}><span></span></label></div>
    <div class="prow"><div class="l">Звук щелчка<div>Нажмите, чтобы прослушать</div></div><select class="select" id="clickstyle">${Object.entries(CLICKS).map(([k, v]) => `<option value="${k}" ${S.set.click === k ? 'selected' : ''}>${v}</option>`).join('')}</select></div>
    <div class="prow"><div class="l">Звуки ответов<div>Сигнал верного и неверного ответа</div></div><label class="switch"><input type="checkbox" data-set="sfx" ${S.set.sfx ? 'checked' : ''}><span></span></label></div>
    <div class="prow"><div class="l">Диктор</div>${TTS && vs.length ? `<select class="select" id="voice">${vs.map(o => `<option value="${esc(o.voice.voiceURI)}" ${cur === o.voice ? 'selected' : ''}>${esc(o.label)} — ${esc(voiceName(o.voice))}</option>`).join('')}</select>` : '<span class="sub">недоступно</span>'}</div>
    <div class="prow"><div class="l">Скорость речи<div id="ratev">${S.set.rate.toFixed(2)}×</div></div><input type="range" min="0.5" max="1.2" step="0.05" value="${S.set.rate}" id="rate"></div>
    <h3>О приложении</h3>
    <div class="prow"><div class="l">Версия ${APP_V}<div>${appDiag()}</div></div></div>
    <p class="sub" style="text-align:left"><a href="o-prilozhenii.html">Подробнее о приложении</a> · <a href="slova/">Все слова списком</a> · <a href="privacy.html">Политика конфиденциальности</a></p>
    <p class="sub" style="text-align:left">Словарь: частотность — wordfreq (CC BY-SA 4.0) и SUBTLEX-US; лексика TOEFL / IELTS — NGSL и NAWL (Browne, Culligan, Phillips; CC BY-SA 4.0); примеры фраз — Tatoeba (CC BY 2.0 FR); транскрипции — CMUdict.</p>
    <h3>Данные</h3>
    <p class="sub" style="text-align:left">Прогресс хранится на этом устройстве. Чтобы перенести его на другой iPhone, iPad или Mac, сохраните файл и загрузите его там.</p>
    <button class="btn gray small" data-act="export">Сохранить прогресс в файл</button>
    <button class="btn gray small" data-act="import">Загрузить прогресс из файла</button>
    <input type="file" id="importfile" accept="application/json,.json" class="hidden">
    <button class="btn red small" data-act="reset">Сбросить весь прогресс</button>
  </div>`, {
    onClose: render,
    onClick: (e, close) => {
      const av = e.target.closest('[data-av]');
      if (av) { S.profile.avatar = av.dataset.av; S.profile.ts = Date.now(); save(); $$('[data-av]').forEach(b => b.classList.toggle('on', b === av)); return; }
      const say = e.target.closest('[data-say]'); if (say) return sayWord(+say.dataset.say);
      const uf = e.target.closest('[data-unfav]'); if (uf) { setFav(+uf.dataset.unfav, false); uf.closest('.fav').remove(); return; }
      const a = e.target.closest('[data-act]'); if (!a) return;
      if (a.dataset.act.startsWith('sync-') && window.syncAction) return syncAction(a.dataset.act, close);
      if (a.dataset.act === 'testkeys') {
        unlockAudio(); haptic();   // на iPhone вибрация уже сработала от касания этой кнопки
        setTimeout(() => keyClick('key'), 60); setTimeout(() => keyClick('key'), 220); setTimeout(() => keyClick('del'), 380);
        const st = actx ? actx.state : 'нет';
        toast(!S.set.keySound ? 'Звук нажатий выключен' : st === 'running' ? 'Щелчки воспроизводятся. Не слышно — проверьте беззвучный режим и громкость' : 'Звук ещё не разрешён — нажмите «Проверить» ещё раз');
        return;
      }
      if (a.dataset.act === 'favs') { close(); return go({ name: 'fav' }); }
      if (a.dataset.act === 'replace') { close(); onb = { step: 'self', again: true }; return go({ name: 'onb' }); }
      if (a.dataset.act === 'export') exportData();
      if (a.dataset.act === 'import') $('#importfile').click();
      if (a.dataset.act === 'reset' && confirm('Удалить весь прогресс? Это нельзя отменить.') && confirm('Точно удалить?')) {
        const set = S.set; S = defaults(); S.set = set; save(); close(); toast('Прогресс сброшен');
      }
    },
  });
  const m = $('.prof');
  $('#pname').oninput = e => { S.profile.name = e.target.value.trim() || 'Профиль'; S.profile.ts = Date.now(); save(); };
  m.onchange = e => {
    const t = e.target;
    if (t.dataset.set) { S.set[t.dataset.set] = t.checked; save(); if (t.dataset.set === 'haptic') applyHaptics(); }
    if (t.id === 'voice') { S.set.voice = t.value; save(); speak('Hello! How are you today?'); }
    if (t.id === 'clickstyle') { S.set.click = t.value; save(); unlockAudio(); [0, 160, 320].forEach((d, n) => setTimeout(() => keyClick(['key', 'key', 'del'][n]), d)); }
    if (t.id === 'rate') { S.set.rate = +t.value; save(); speak('Good morning'); }
    if (t.id === 'importfile' && t.files[0]) importData(t.files[0]);
  };
  m.oninput = e => { if (e.target.id === 'rate') $('#ratev').textContent = (+e.target.value).toFixed(2) + '×'; };
}
function exportData() {
  const blob = new Blob([JSON.stringify(S)], { type: 'application/json' });
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `5555-words-progress-${today()}.json`;
  document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
}
function importData(file) {
  const r = new FileReader();
  r.onload = () => {
    try {
      const s = JSON.parse(r.result);
      if (!s || s.v !== 2 || typeof s.L !== 'object') throw new Error('bad');
      if (!confirm('Загрузить прогресс из файла? Текущий прогресс на этом устройстве будет заменён.')) return;
      const d = defaults(); S = { ...d, ...s, set: { ...d.set, ...s.set }, profile: { ...d.profile, ...s.profile } };
      if (s.onboarded === undefined) S.onboarded = 1;
      save(); go({ name: 'main' }); toast('Прогресс загружен');
    } catch (e) { toast('Файл не похож на сохранённый прогресс'); }
  };
  r.readAsText(file);
}

/* ================= запуск ================= */

document.addEventListener('keydown', e => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') return;
  if (onKey) onKey(e);
});
document.addEventListener('visibilitychange', () => { if (!document.hidden && !run && !$('.sheet-bg')) render(); });
setInterval(() => { if (!run && !$('.sheet-bg') && view.name === 'main') render(); }, 60000);   // обновить время повторений
// Обновление: новая версия скачивается в фоне (sw.js); как только она включилась — перезагружаем страницу,
// чтобы пользователь не сидел на старой версии до следующего открытия. Во время урока, теста, открытого окна
// или определения уровня не перезагружаем — ждём возврата на главный экран.
let swReload = false;
function applyUpdate() {
  if (!swReload || run || $('.sheet-bg') || (view.name === 'onb' && onb.step !== 'self')) return;
  swReload = false; location.reload();
}
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  const hadController = !!navigator.serviceWorker.controller;   // первая установка — не перезагружаем
  navigator.serviceWorker.addEventListener('controllerchange', () => { if (hadController && !swReload) { swReload = true; applyUpdate(); setInterval(applyUpdate, 2000); } });
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').then(reg => {
    // приложение с экрана «Домой» может неделями не перезапускаться — проверяем обновление при каждом возвращении
    document.addEventListener('visibilitychange', () => { if (!document.hidden) reg.update().catch(() => {}); });
  }).catch(() => {}));
}

// открыть страницу с текущим уроком
if (S.dictNote) { delete S.dictNote; save(); setTimeout(() => toast('Курс 2 пополнен словами TOEFL и IELTS. Выученные слова сохранены, уроки курса 2 начнутся заново'), 600); }
if (S.dictReset) { delete S.dictReset; save(); setTimeout(() => toast('Словарь обновлён: слова упорядочены по современной частотности. Прогресс начат заново'), 600); }
(function initPage() {
  const cur = currentLesson();
  if (cur) S.page = Math.floor((cur - 1) / PAGE);
})();
render();
scrollToCurrent();
