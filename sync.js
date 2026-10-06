/* Синхронизация прогресса между устройствами (5555words.com) — необязательный вход по e-mail и коду.
   Подключается после app.js и пользуется его глобальными S, save, render, sheet, toast…
   Как устроено:
     * без входа всё работает как раньше — прогресс только на этом устройстве;
     * вход: e-mail → код из 6 цифр (один раз на устройство) → устройство получает долгосрочный ключ;
     * синхронизация в фоне: после изменений (через 5 с), при открытии и возвращении в приложение, при появлении сети;
       не во время урока или теста. Прогресс объединяется: выученное слово остаётся выученным, у тестов — лучший
       результат, у уроков — более продвинутое состояние, «Мои слова» — объединение;
     * настройки (звук, вибрация, диктор) — свои на каждом устройстве, не синхронизируются. */

const ACC_KEY = 'w3000.acc';
// вход доступен только на своём сервере (на GitHub Pages нет API); пока нет почты для кодов — включается флагом для тестов
const SYNC_HOST = /(^|\.)5555words\.com$|^localhost$|^127\.0\.0\.1$/.test(location.hostname);
const SYNC_ON = () => SYNC_HOST && (window.SYNC_PUBLIC || (() => { try { return localStorage.getItem('w3000.sync') === '1'; } catch (e) { return false; } })());
const LOCAL_ONLY = ['set', 'page', 'league', 'dictReset', 'dictNote'];   // не синхронизируются

let acc = (() => { try { return JSON.parse(localStorage.getItem(ACC_KEY)) || {}; } catch (e) { return {}; } })();
const saveAcc = () => { try { localStorage.setItem(ACC_KEY, JSON.stringify(acc)); } catch (e) {} };

async function api(method, path, body) {
  const r = await fetch('/api' + path, {
    method, headers: { 'Content-Type': 'application/json', ...(acc.token ? { Authorization: 'Bearer ' + acc.token } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = {}; try { j = await r.json(); } catch (e) {}
  if (!r.ok) throw Object.assign(new Error(j.error || 'Нет связи с сервером'), { status: r.status });
  return j;
}

/* ---------------- объединение прогресса ---------------- */

const syncData = st => { const o = JSON.parse(JSON.stringify(st)); LOCAL_ONLY.forEach(k => delete o[k]); return o; };
function lessonScore(l) {
  if (!l) return -1;
  let s = (l.complete ? 1e6 : 0) + (l.rep && l.rep.done ? 5e5 : 0) + Object.keys(l.dec || {}).length;
  (l.st || []).forEach(st => { s += (st.done ? 1e4 : 0) + Object.keys(st.ok || {}).length * 10; });
  return s;
}
const progressOf = x => (x.start - 1) * PER_LESSON + Object.keys(x.w || {}).filter(i => x.w[i].learned && +i >= (x.start - 1) * PER_LESSON).length;
function mergeStates(a, b) {   // a — это устройство, b — сервер
  if (!b) return a;
  if (b.dictVer !== a.dictVer) {
    if (b.dictVer === 3 && DICT_VER === 4) b = migrateV4({ L: {}, T: {}, w: {}, fav: {}, ...JSON.parse(JSON.stringify(b)) });
    else if ((b.dictVer || 0) < a.dictVer) return a;   // слишком старый формат — оставляем своё
  }
  const o = { ...a };
  const keys = (x, y) => [...new Set([...Object.keys(x || {}), ...Object.keys(y || {})])];
  o.w = {};
  for (const i of keys(a.w, b.w)) {
    const p = a.w[i] || {}, q = (b.w || {})[i] || {};
    o.w[i] = { learned: p.learned || q.learned ? 1 : 0, err: Math.max(p.err || 0, q.err || 0) };
  }
  // «Мои слова»: у добавления и удаления есть время — побеждает последнее действие (удалённое слово не «воскресает»)
  o.fav = {}; o.favDel = {};
  const t = (x, k, i) => +((x[k] || {})[i] || 0);
  for (const i of keys({ ...a.fav, ...a.favDel }, { ...(b.fav || {}), ...(b.favDel || {}) })) {
    const add = Math.max(t(a, 'fav', i), t(b, 'fav', i)), del = Math.max(t(a, 'favDel', i), t(b, 'favDel', i));
    if (add > del) o.fav[i] = add; else if (del) o.favDel[i] = del;
  }
  o.favStat = { ...(b.favStat || {}) };
  for (const i in a.favStat || {}) if (!o.favStat[i] || a.favStat[i].last > o.favStat[i].last) o.favStat[i] = a.favStat[i];
  o.L = {};
  for (const n of keys(a.L, b.L)) o.L[n] = lessonScore((b.L || {})[n]) > lessonScore((a.L || {})[n]) ? b.L[n] : a.L[n];
  o.T = {};
  for (const id of keys(a.T, b.T)) {
    const p = (a.T || {})[id] || {}, q = (b.T || {})[id] || {}, best = { ...(q.best || {}) };
    for (const lv in p.best || {}) best[lv] = Math.max(best[lv] || 0, p.best[lv]);
    o.T[id] = { stars: Math.max(p.stars || 0, q.stars || 0), best, d: (p.d || '') > (q.d || '') ? p.d : q.d };
  }
  o.days = { ...(b.days || {}) };
  for (const d in a.days || {}) o.days[d] = Math.max(o.days[d] || 0, a.days[d]);
  o.lastStart = (a.lastStart || '') > (b.lastStart || '') ? a.lastStart : b.lastStart || null;
  o.onboarded = Math.max(a.onboarded || 0, b.onboarded || 0);
  if (b.onboarded && (!a.onboarded || progressOf(b) > progressOf(a))) { o.start = b.start; o.placement = b.placement; }
  const pa = a.profile || {}, pb = b.profile || {};
  o.profile = (pb.ts || 0) > (pa.ts || 0) || (!pa.ts && pa.name === 'Профиль' && pb.name) ? pb : pa;
  o.dictVer = DICT_VER;
  return o;
}

/* ---------------- синхронизация ---------------- */

const origSave = save;
save = function () { origSave(); if (acc.token) syncSoon(); };   // каждое сохранение — синхронизация через 5 с
let syncTimer = null, syncing = false;
function syncSoon(ms = 5000) { clearTimeout(syncTimer); syncTimer = setTimeout(syncNow, ms); }
async function syncNow() {
  if (!acc.token || !SYNC_ON() || syncing) return;
  if (!navigator.onLine) return;
  if (run) return syncSoon(15000);   // во время урока не трогаем прогресс — после урока
  syncing = true;
  try {
    for (let k = 0; k < 3; k++) {
      const remote = await api('GET', '/sync');
      if (run) return syncSoon(15000);
      const before = JSON.stringify(syncData(S));
      const merged = mergeStates(syncData(S), remote.data);
      const changedHere = JSON.stringify(merged) !== before;
      if (changedHere) {   // с сервера пришло новое — применяем, настройки устройства не трогаем
        const keep = {}; LOCAL_ONLY.forEach(f => { if (f in S) keep[f] = S[f]; });
        S = { ...merged, ...keep };
        origSave();
      }
      if (JSON.stringify(merged) !== JSON.stringify(remote.data)) {
        try { acc.rev = (await api('PUT', '/sync', { data: merged, baseRev: remote.rev })).rev; }
        catch (e) { if (e.status === 409) continue; throw e; }   // за это время сохранило другое устройство — ещё раз
      }
      acc.synced = Date.now(); saveAcc();
      if (changedHere && !run && !$('.sheet-bg')) {
        if (view.name === 'onb' && S.onboarded) go({ name: 'main' }); else render();
      }
      $$('[data-sync-status]').forEach(el => { el.textContent = syncStatus(); });
      return;
    }
  } catch (e) {
    if (e.status === 401) { acc = {}; saveAcc(); toast('Вход на этом устройстве устарел — войдите заново в профиле'); }
  } finally { syncing = false; }
}
const ago = t => { const m = Math.round((Date.now() - t) / 60000); return m < 1 ? 'только что' : m < 60 ? `${m} мин назад` : m < 1440 ? `${Math.round(m / 60)} ч назад` : `${Math.round(m / 1440)} дн назад`; };
const syncStatus = () => acc.synced ? `Синхронизировано ${ago(acc.synced)}` : 'Ещё не синхронизировано';
function deviceName() {
  const u = navigator.userAgent;
  const dev = /iPhone/.test(u) ? 'iPhone' : /iPad/.test(u) || (/Macintosh/.test(u) && navigator.maxTouchPoints > 1) ? 'iPad' : /Android/.test(u) ? 'Android' : /Macintosh/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : 'Устройство';
  const br = /YaBrowser/.test(u) ? 'Яндекс Браузер' : /Edg\//.test(u) ? 'Edge' : /Chrome|CriOS/.test(u) ? 'Chrome' : /Firefox|FxiOS/.test(u) ? 'Firefox' : /Safari/.test(u) ? 'Safari' : '';
  return br ? `${dev} · ${br}` : dev;
}

/* ---------------- экраны ---------------- */

const SYNC_EXPLAIN = `<ul class="sync-how">
  <li>Занимайтесь на телефоне и компьютере — прогресс везде одинаковый и не потеряется.</li>
  <li><b>Пароль не нужен:</b> введите e-mail — пришлём код из 6 цифр.</li>
  <li>На новом устройстве — тот же e-mail и новый код. Дальше вход запоминается.</li>
  <li>Без интернета всё работает как обычно — прогресс сохранится, когда появится связь.</li></ul>`;

// раздел «Синхронизация» в профиле
function syncSection() {
  if (!SYNC_ON()) return '';
  return acc.token
    ? `<h3>Синхронизация</h3><div class="prow"><div class="l">${esc(acc.email)}<div data-sync-status>${syncStatus()}</div></div>
        <button class="btn gray small" style="width:auto;margin:0;padding:0 14px" data-act="sync-now">Обновить</button></div>
        <button class="btn gray small" data-act="sync-devices">Мои устройства</button>
        <button class="btn gray small" data-act="sync-logout">Выйти на этом устройстве</button>`
    : `<h3>Синхронизация</h3><p class="sub" style="text-align:left">Сейчас прогресс хранится только на этом устройстве.</p>
        <button class="btn teal small" data-act="sync-login">Сохранить прогресс и войти</button>`;
}
// плашка на главном экране — после 3 пройденных уроков, пока не вошли; «×» прячет её на 10 уроков
function syncBanner() {
  if (!SYNC_ON() || acc.token) return '';
  const done = Object.values(S.L).filter(l => l.complete).length;
  if (done < 3 || done < (S.syncNudge || 0) + 10 && S.syncNudge != null) return '';
  return `<div class="sync-banner"><div><b>Сохраните прогресс</b> — чтобы заниматься на телефоне и компьютере и ничего не потерять. Пароль не нужен.</div>
    <button class="btn teal small" data-act="sync-login">Сохранить</button><button class="sync-x" data-act="sync-dismiss" aria-label="Скрыть">×</button></div>`;
}

function openLogin(email = acc.lastEmail || '') {
  const s = sheet(`<button class="sheet-close" data-close aria-label="Закрыть">${I.close}</button><div class="prof sync-login">
    <h2>Прогресс на всех устройствах</h2>${SYNC_EXPLAIN}
    <input class="name-input" id="semail" type="email" inputmode="email" autocomplete="email" placeholder="ваш e-mail" value="${esc(email)}">
    <label class="sync-consent"><input type="checkbox" id="sconsent"> <span>Согласен с <a href="privacy.html" target="_blank">политикой конфиденциальности</a></span></label>
    <button class="btn" id="ssend">Получить код</button>
    <p class="sub" id="serr"></p></div>`);
  const err = m => { $('#serr').textContent = m || ''; };
  $('#ssend').onclick = async () => {
    const em = $('#semail').value.trim();
    if (!/^\S+@\S+\.\S+$/.test(em)) return err('Проверьте адрес почты');
    if (!$('#sconsent').checked) return err('Отметьте согласие с политикой конфиденциальности');
    $('#ssend').disabled = true; err('');
    try { await api('POST', '/auth/start', { email: em, consent: true }); acc.lastEmail = em; saveAcc(); openCode(em); }
    catch (e) { err(e.message); $('#ssend').disabled = false; }
  };
  return s;
}

function openCode(email) {
  sheet(`<button class="sheet-close" data-close aria-label="Закрыть">${I.close}</button><div class="prof sync-login">
    <h2>Введите код</h2>
    <p class="sub">Отправили код из 6 цифр на <b>${esc(email)}</b>. Если письма нет — проверьте папку «Спам».</p>
    <input class="name-input sync-code" id="scode" inputmode="numeric" autocomplete="one-time-code" maxlength="6" placeholder="••••••">
    <button class="btn" id="sverify">Войти</button>
    <p class="sub" id="serr"></p>
    <button class="btn ghost-link" id="sresend" disabled>Отправить код ещё раз</button>
    <button class="btn ghost-link" id="sback">Изменить e-mail</button></div>`);
  const err = m => { $('#serr').textContent = m || ''; };
  let left = 60; const rs = $('#sresend');
  const tick = setInterval(() => { if (!document.body.contains(rs)) return clearInterval(tick); left--; rs.textContent = left > 0 ? `Отправить код ещё раз (${left})` : 'Отправить код ещё раз'; rs.disabled = left > 0; }, 1000);
  $('#scode').focus();
  const verify = async () => {
    const code = $('#scode').value.replace(/\D/g, '');
    if (code.length !== 6) return err('Код — 6 цифр');
    $('#sverify').disabled = true; err('');
    try {
      const r = await api('POST', '/auth/verify', { email, code, device: deviceName() });
      acc = { token: r.token, email: r.email, lastEmail: r.email }; saveAcc();
      clearInterval(tick); closeSheet();
      toast(r.new ? 'Готово! Прогресс сохранён — теперь можно войти на другом устройстве' : 'Вы вошли — прогресс объединён с этим устройством');
      await syncNow(); if (!run) render();
    } catch (e) { err(e.message); $('#sverify').disabled = false; }
  };
  $('#sverify').onclick = verify;
  $('#scode').oninput = e => { if (e.target.value.replace(/\D/g, '').length === 6) verify(); };
  rs.onclick = async () => { try { await api('POST', '/auth/start', { email, consent: true }); left = 60; rs.disabled = true; err('Отправили новый код'); } catch (e) { err(e.message); } };
  $('#sback').onclick = () => { clearInterval(tick); openLogin(email); };
}

async function openDevices() {
  let d; try { d = await api('GET', '/devices'); } catch (e) { return toast(e.message); }
  const s = sheet(`<button class="sheet-close" data-close aria-label="Закрыть">${I.close}</button><div class="prof">
    <h2>Мои устройства</h2><p class="sub">${esc(d.email)}</p>
    ${d.devices.map(x => `<div class="prow"><div class="l">${esc(x.name)}${x.current ? ' · <b>это устройство</b>' : ''}<div>вход ${new Date(x.created * 1000).toLocaleDateString('ru')}, был в сети ${ago(x.seen * 1000)}</div></div>
      ${x.current ? '' : `<button class="btn gray small" style="width:auto;margin:0;padding:0 14px" data-dev="${x.id}">Отключить</button>`}</div>`).join('')}
    <p class="sub" style="text-align:left;margin-top:14px">Отключите устройство, если потеряли его: войти с него снова можно будет только по новому коду из письма.</p>
    <button class="btn red small" data-act="sync-delete">Удалить аккаунт</button></div>`, {
    onClick: async (e, close) => {
      const b = e.target.closest('[data-dev]');
      if (b && confirm('Отключить это устройство?')) { try { await api('DELETE', '/devices/' + b.dataset.dev); b.closest('.prow').remove(); } catch (er) { toast(er.message); } }
      if (e.target.closest('[data-act="sync-delete"]')) syncAction('sync-delete', close);
    },
  });
  return s;
}

async function syncAction(act, close) {
  if (act === 'sync-login') { close && close(); return openLogin(); }
  if (act === 'sync-dismiss') { S.syncNudge = Object.values(S.L).filter(l => l.complete).length; save(); return render(); }
  if (act === 'sync-now') { await syncNow(); return toast(acc.synced && Date.now() - acc.synced < 5000 ? 'Прогресс синхронизирован' : 'Не удалось — нет связи с сервером'); }
  if (act === 'sync-devices') { close && close(); return openDevices(); }
  if (act === 'sync-logout') {
    if (!confirm('Выйти на этом устройстве? Прогресс здесь останется, но перестанет синхронизироваться.')) return;
    try { await api('POST', '/logout'); } catch (e) {}
    acc = { lastEmail: acc.email }; saveAcc(); close && close(); toast('Вы вышли на этом устройстве'); return render();
  }
  if (act === 'sync-delete') {
    if (!confirm('Удалить аккаунт и сохранённый на сервере прогресс? На этом устройстве прогресс останется.') || !confirm('Точно удалить? Это нельзя отменить.')) return;
    try { await api('DELETE', '/account'); } catch (e) { return toast(e.message); }
    acc = {}; saveAcc(); close && close(); toast('Аккаунт удалён'); return render();
  }
}

/* ---------------- запуск ---------------- */
if (SYNC_HOST) {
  document.addEventListener('visibilitychange', () => { if (!document.hidden) syncSoon(500); });
  addEventListener('online', () => syncSoon(500));
  setInterval(() => { if (!document.hidden) syncNow(); }, 5 * 60000);
  if (acc.token) syncSoon(1500);
  if (!run && view.name === 'main' && SYNC_ON()) render();   // главный экран уже отрисован app.js — добавить плашку
}
