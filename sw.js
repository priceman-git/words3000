// Офлайн-работа приложения.
// Стратегия «сначала кэш»: приложение открывается мгновенно из кэша даже без сети или при плохой связи.
// Обновление: браузер сам проверяет sw.js при каждом открытии; если VERSION изменился, новая версия целиком
// скачивается в фоне (все файлы из FILES) и включается при следующем открытии — старая и новая версии не смешиваются.
// При выпуске новой версии: увеличить V здесь и ?v= в index.html (у styles.css, fonts.css, words.js, app.js).
const V = 93;
const VERSION = 'w3000-v' + V;
const FILES = [
  './', 'index.html', `styles.css?v=${V}`, `words.js?v=${V}`, `app.js?v=${V}`, `sync.js?v=${V}`, 'privacy.html', `fonts/fonts.css?v=${V}`,
  'fonts/rc-latin-normal.woff2', 'fonts/rc-latin-italic.woff2', 'fonts/rc-latin-ext-normal.woff2',
  'fonts/rc-latin-ext-italic.woff2', 'fonts/rc-cyrillic-normal.woff2', 'fonts/rc-cyrillic-italic.woff2',
  'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png',
];

self.addEventListener('install', e => {
  // cache: 'reload' — берём свежие файлы с сервера, а не из HTTP-кэша браузера
  e.waitUntil(caches.open(VERSION)
    .then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' }))))
    .then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  const url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== location.origin || url.pathname.startsWith('/api/')) return;   // API синхронизации — всегда из сети, не кэшируем
  // открытие приложения (в том числе с параметрами в адресе) — всегда index.html из кэша;
  // отдельные страницы (о приложении, политика, списки слов) — из сети, без сети — из кэша
  if (req.mode === 'navigate') {
    if (/\/$|\/index\.html$/.test(url.pathname)) e.respondWith(caches.match('index.html').then(r => r || fetch(req)));
    else e.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  e.respondWith(caches.match(req).then(r => r || fetch(req).then(res => {
    if (res.ok) { const copy = res.clone(); caches.open(VERSION).then(c => c.put(req, copy)); }
    return res;
  })));
});
