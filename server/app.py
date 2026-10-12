#!/usr/bin/env python3
"""Сервер синхронизации «5555 слов» (5555words.com): вход по e-mail и коду, хранение прогресса.

Без внешних библиотек: http.server + sqlite3 + smtplib. Работает за nginx (location /api/ → 127.0.0.1:8081).

Как устроено:
  * вход без пароля: POST /api/auth/start {email, consent} — на почту уходит код из 6 цифр (живёт 10 минут,
    5 попыток); POST /api/auth/verify {email, code, device} — создаёт аккаунт при первом входе и выдаёт
    устройству долгосрочный ключ (хранится только его хэш). Ключ продлевается при каждом использовании, живёт год;
  * прогресс — один JSON на пользователя с номером версии (rev). Клиент сам объединяет свой прогресс с серверным
    и сохраняет PUT /api/sync {data, baseRev}; если rev на сервере успел измениться — 409, клиент повторяет;
  * устройства: GET /api/devices, DELETE /api/devices/<id>; выход: POST /api/logout; удаление: DELETE /api/account.

Настройки — переменные окружения (файл /etc/5555words/api.env, его читает systemd):
  DB=/var/lib/5555words/app.db, SECRET=<случайная строка>, PORT=8081,
  SMTP_HOST, SMTP_PORT=587, SMTP_USER, SMTP_PASS, MAIL_FROM — почта для кодов;
  TG_TOKEN, TG_OWNER_CHAT (из /etc/5555words/telegram.env) — отзывы пересылаются автору в Telegram;
  без SMTP_HOST коды пишутся в журнал (journalctl -u 5555words-api) — для тестов.
"""
import base64, hashlib, hmac, json, os, re, secrets, smtplib, sqlite3, sys, threading, time, urllib.request
from email.message import EmailMessage
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

DB = os.environ.get('DB', '/var/lib/5555words/app.db')
SECRET = os.environ.get('SECRET', '').encode() or sys.exit('нужна переменная SECRET')
PORT = int(os.environ.get('PORT', '8081'))
CODE_TTL, CODE_TRIES = 600, 5                 # код: 10 минут, 5 попыток
TOKEN_TTL = 365 * 86400                        # ключ устройства: год, продлевается при каждом использовании
MAX_BODY = 2_000_000                           # прогресс — до 2 МБ (обычно 20–200 КБ)
EMAIL_RE = re.compile(r'^[^@\s]{1,64}@[^@\s]{1,190}\.[a-z]{2,24}$', re.I)

def db():
    c = sqlite3.connect(DB, timeout=10)
    c.row_factory = sqlite3.Row
    c.execute('PRAGMA foreign_keys = ON')
    return c

def init_db():
    os.makedirs(os.path.dirname(DB), exist_ok=True)
    with db() as c:
        c.execute('PRAGMA journal_mode = WAL')
        c.executescript('''
        CREATE TABLE IF NOT EXISTS users   (id INTEGER PRIMARY KEY, email TEXT UNIQUE NOT NULL,
                                            created INTEGER NOT NULL, consent INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS codes   (email TEXT PRIMARY KEY, hash TEXT NOT NULL, expires INTEGER NOT NULL,
                                            tries INTEGER NOT NULL DEFAULT 0, sent INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS devices (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                                            token TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
                                            created INTEGER NOT NULL, seen INTEGER NOT NULL);
        CREATE TABLE IF NOT EXISTS daily   (day TEXT NOT NULL, dev TEXT NOT NULL, first TEXT, ver TEXT, plat TEXT, pwa INTEGER,
                                            src TEXT, stages INTEGER DEFAULT 0, lessons INTEGER DEFAULT 0, learned INTEGER DEFAULT 0,
                                            PRIMARY KEY (day, dev));   -- анонимная статистика: без IP, e-mail и связи с аккаунтом
        CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY, created INTEGER NOT NULL, stars INTEGER, text TEXT,
                                            contact TEXT, ver TEXT, plat TEXT, learned INTEGER, imgs INTEGER DEFAULT 0, sent INTEGER DEFAULT 0);
        CREATE TABLE IF NOT EXISTS states  (user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                                            rev INTEGER NOT NULL, data TEXT NOT NULL, updated INTEGER NOT NULL);
        ''')

def h(s): return hmac.new(SECRET, s.encode(), hashlib.sha256).hexdigest()

# ---------------- ограничение частоты (в памяти) ----------------
_hits, _lock = {}, threading.Lock()
def limited(key, n, per):
    """True, если за последние per секунд по ключу было уже n событий"""
    now = time.time()
    with _lock:
        q = [t for t in _hits.get(key, []) if now - t < per]
        if len(q) >= n: _hits[key] = q; return True
        q.append(now); _hits[key] = q
    return False

# ---------------- письмо с кодом ----------------
def send_code(email, code):
    host = os.environ.get('SMTP_HOST')
    if not host:
        print(f'[DEV] код для {email}: {code}', flush=True)
        return
    m = EmailMessage()
    m['From'] = os.environ.get('MAIL_FROM', '5555 слов <no-reply@5555words.com>')
    m['To'] = email
    m['Subject'] = f'{code} — код входа в «5555 слов»'
    m.set_content(f'Ваш код входа: {code}\n\nВведите его в приложении «5555 слов» (5555words.com). '
                  f'Код действует 10 минут.\n\nЕсли вы не запрашивали код, просто удалите это письмо.')
    with smtplib.SMTP(host, int(os.environ.get('SMTP_PORT', '587')), timeout=20) as s:
        s.starttls()
        if os.environ.get('SMTP_USER'): s.login(os.environ['SMTP_USER'], os.environ.get('SMTP_PASS', ''))
        s.send_message(m)

# ---------------- обработчики ----------------
class Err(Exception):
    def __init__(self, status, msg): self.status, self.msg = status, msg

def auth(c, headers):
    tok = (headers.get('Authorization') or '').removeprefix('Bearer ').strip()
    if not tok: raise Err(401, 'нужен вход')
    d = c.execute('SELECT * FROM devices WHERE token = ?', (h(tok),)).fetchone()
    now = int(time.time())
    if not d or now - d['seen'] > TOKEN_TTL: raise Err(401, 'вход устарел — войдите заново')
    if now - d['seen'] > 3600: c.execute('UPDATE devices SET seen = ? WHERE id = ?', (now, d['id']))
    return d

def auth_start(c, body, ip):
    email = str(body.get('email', '')).strip().lower()
    if not EMAIL_RE.match(email): raise Err(400, 'Проверьте адрес почты')
    if not body.get('consent'): raise Err(400, 'Нужно согласие с политикой конфиденциальности')
    if limited('ip:' + ip, 20, 3600) or limited('mail:' + email, 5, 3600): raise Err(429, 'Слишком много попыток. Попробуйте через час')
    if limited('mail1:' + email, 1, 50): raise Err(429, 'Код уже отправлен. Новый можно запросить через минуту')
    code = f'{secrets.randbelow(10**6):06d}'
    now = int(time.time())
    c.execute('INSERT OR REPLACE INTO codes (email, hash, expires, tries, sent) VALUES (?, ?, ?, 0, ?)',
              (email, h(email + ':' + code), now + CODE_TTL, now))
    c.commit()
    send_code(email, code)
    return {'ok': True}

def auth_verify(c, body, ip):
    email = str(body.get('email', '')).strip().lower()
    code = re.sub(r'\D', '', str(body.get('code', '')))
    if limited('vip:' + ip, 30, 3600): raise Err(429, 'Слишком много попыток. Попробуйте через час')
    row = c.execute('SELECT * FROM codes WHERE email = ?', (email,)).fetchone()
    now = int(time.time())
    if not row or row['expires'] < now: raise Err(400, 'Код устарел — запросите новый')
    if row['tries'] >= CODE_TRIES: raise Err(400, 'Слишком много неверных попыток — запросите новый код')
    if not hmac.compare_digest(row['hash'], h(email + ':' + code)):
        c.execute('UPDATE codes SET tries = tries + 1 WHERE email = ?', (email,)); c.commit()
        raise Err(400, 'Неверный код')
    c.execute('DELETE FROM codes WHERE email = ?', (email,))
    u = c.execute('SELECT id FROM users WHERE email = ?', (email,)).fetchone()
    uid = u['id'] if u else c.execute('INSERT INTO users (email, created, consent) VALUES (?, ?, ?)', (email, now, now)).lastrowid
    tok = secrets.token_urlsafe(32)
    name = str(body.get('device', 'Устройство'))[:60] or 'Устройство'
    c.execute('INSERT INTO devices (user_id, token, name, created, seen) VALUES (?, ?, ?, ?, ?)', (uid, h(tok), name, now, now))
    c.commit()
    return {'token': tok, 'email': email, 'new': not u}

# ---------------- анонимная статистика ----------------
# Раз в день и после уроков приложение присылает: случайный номер устройства, дату, версию, тип устройства,
# установлено ли на экран «Домой», метку источника и счётчики за день. IP не сохраняется.
DAY_RE, DEV_RE = re.compile(r'^\d{4}-\d{2}-\d{2}$'), re.compile(r'^[0-9a-f]{16,32}$')
def ping(c, body, ip):
    if limited('ping:' + ip, 120, 3600): return {'ok': True}   # молча — статистика не должна мешать
    day, dev = str(body.get('day', '')), str(body.get('dev', ''))
    if not DAY_RE.match(day) or not DEV_RE.match(dev): raise Err(400, 'неверные данные')
    clip = lambda k, n: re.sub(r'[^\w.+-]', '', str(body.get(k, '')))[:n] or None
    num = lambda k: max(0, min(int(body.get(k) or 0), 100000))
    first = str(body.get('first', ''))
    c.execute('''INSERT INTO daily (day, dev, first, ver, plat, pwa, src, stages, lessons, learned) VALUES (?,?,?,?,?,?,?,?,?,?)
                 ON CONFLICT(day, dev) DO UPDATE SET ver=excluded.ver, pwa=MAX(pwa, excluded.pwa),
                 stages=MAX(stages, excluded.stages), lessons=MAX(lessons, excluded.lessons), learned=MAX(learned, excluded.learned)''',
              (day, dev, first if DAY_RE.match(first) else None, clip('ver', 8), clip('plat', 16), 1 if body.get('pwa') else 0,
               clip('src', 24), num('stages'), num('lessons'), num('learned')))
    c.commit()
    return {'ok': True}

# ---------------- отзывы ----------------
# Звёзды 1–5, текст, необязательный контакт и до 3 картинок (JPEG, уменьшены в браузере). Хранятся в базе и в
# /var/lib/5555words/feedback/, копия уходит автору в Telegram. IP не сохраняется.
FB_DIR = os.path.join(os.path.dirname(DB), 'feedback')
TG_TOKEN, TG_OWNER = os.environ.get('TG_TOKEN'), os.environ.get('TG_OWNER_CHAT')
def tg(method, fields, file=None):
    """запрос к Telegram Bot API; file = (имя поля, имя файла, байты) — отправка multipart"""
    if not (TG_TOKEN and TG_OWNER): return
    url = f'https://api.telegram.org/bot{TG_TOKEN}/{method}'
    if file:
        b = '----5555' + secrets.token_hex(8)
        parts = [f'--{b}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in fields.items()]
        parts.append(f'--{b}\r\nContent-Disposition: form-data; name="{file[0]}"; filename="{file[1]}"\r\nContent-Type: image/jpeg\r\n\r\n'.encode() + file[2] + f'\r\n--{b}--\r\n'.encode())
        req = urllib.request.Request(url, b''.join(parts), {'Content-Type': f'multipart/form-data; boundary={b}'})
    else:
        req = urllib.request.Request(url, json.dumps(fields).encode(), {'Content-Type': 'application/json'})
    return json.load(urllib.request.urlopen(req, timeout=30)).get('ok')

def forward_feedback(fid, stars, text, contact, ver, plat, learned, images):
    try:
        msg = (f'📝 Отзыв №{fid}\n' + ('★' * stars + '☆' * (5 - stars) if stars else 'без оценки') + '\n\n' + (text or '(без текста)') +
               f'\n\n— версия {ver or "?"}, {plat or "?"}, выучено слов: {learned}' + (f'\nКонтакт: {contact}' if contact else ''))
        ok = tg('sendMessage', {'chat_id': TG_OWNER, 'text': msg[:4000]})
        for k, img in enumerate(images):
            tg('sendPhoto', {'chat_id': TG_OWNER, 'caption': f'Отзыв №{fid}, картинка {k + 1}'}, ('photo', f'{fid}-{k + 1}.jpg', img))
        if ok:
            with db() as c: c.execute('UPDATE feedback SET sent = 1 WHERE id = ?', (fid,))
    except Exception as e:
        print('отзыв в Telegram не ушёл:', repr(e), file=sys.stderr, flush=True)

def feedback(c, body, ip):
    if limited('fb:' + ip, 3, 3600): raise Err(429, 'слишком много отзывов подряд — попробуйте через час')
    stars = int(body.get('stars') or 0)
    if not 0 <= stars <= 5: raise Err(400, 'неверная оценка')
    text = str(body.get('text', '')).strip()[:3000]
    contact = str(body.get('contact', '')).strip()[:100]
    if not stars and not text: raise Err(400, 'пустой отзыв')
    images = []
    for s in (body.get('imgs') or [])[:3]:
        m = re.fullmatch(r'data:image/jpeg;base64,([A-Za-z0-9+/=]+)', str(s))
        if not m: raise Err(400, 'картинка должна быть JPEG')
        img = base64.b64decode(m[1])
        if len(img) > 600_000 or not img.startswith(b'\xff\xd8'): raise Err(400, 'картинка слишком большая')
        images.append(img)
    clip = lambda k, n: re.sub(r'[^\w.+ -]', '', str(body.get(k, '')))[:n]
    ver, plat, learned = clip('ver', 8), clip('plat', 16), max(0, min(int(body.get('learned') or 0), 100000))
    fid = c.execute('INSERT INTO feedback (created, stars, text, contact, ver, plat, learned, imgs) VALUES (?,?,?,?,?,?,?,?)',
                    (int(time.time()), stars, text, contact, ver, plat, learned, len(images))).lastrowid
    c.commit()
    os.makedirs(FB_DIR, exist_ok=True)
    for k, img in enumerate(images):
        with open(os.path.join(FB_DIR, f'{fid}-{k + 1}.jpg'), 'wb') as f: f.write(img)
    threading.Thread(target=forward_feedback, args=(fid, stars, text, contact, ver, plat, learned, images), daemon=True).start()
    return {'ok': True, 'id': fid}

def sync_get(c, d):
    s = c.execute('SELECT rev, data FROM states WHERE user_id = ?', (d['user_id'],)).fetchone()
    c.commit()
    return {'rev': s['rev'], 'data': json.loads(s['data'])} if s else {'rev': 0, 'data': None}

def sync_put(c, d, body):
    data, base = body.get('data'), int(body.get('baseRev', -1))
    if not isinstance(data, dict): raise Err(400, 'нет данных')
    s = c.execute('SELECT rev FROM states WHERE user_id = ?', (d['user_id'],)).fetchone()
    cur = s['rev'] if s else 0
    if base != cur: raise Err(409, 'прогресс изменился на другом устройстве')
    now = int(time.time())
    c.execute('INSERT OR REPLACE INTO states (user_id, rev, data, updated) VALUES (?, ?, ?, ?)',
              (d['user_id'], cur + 1, json.dumps(data, ensure_ascii=False, separators=(',', ':')), now))
    c.commit()
    return {'rev': cur + 1}

def devices(c, d):
    rows = c.execute('SELECT id, name, created, seen FROM devices WHERE user_id = ? ORDER BY seen DESC', (d['user_id'],)).fetchall()
    email = c.execute('SELECT email FROM users WHERE id = ?', (d['user_id'],)).fetchone()['email']
    c.commit()
    return {'email': email, 'devices': [{**dict(r), 'current': r['id'] == d['id']} for r in rows]}

class H(BaseHTTPRequestHandler):
    server_version = '5555words'
    def log_message(self, fmt, *a): pass   # без журнала запросов: в нём были бы адреса почты

    def send(self, status, obj):
        b = json.dumps(obj, ensure_ascii=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Cache-Control', 'no-store')
        if self.headers.get('Origin') == 'https://priceman-git.github.io' and self.path.startswith('/api/feedback'):
            self.send_header('Access-Control-Allow-Origin', 'https://priceman-git.github.io')   # отзыв из запасной копии на GitHub Pages
        self.send_header('Content-Length', str(len(b)))
        self.end_headers(); self.wfile.write(b)

    def handle_one(self, method):
        ip = self.headers.get('X-Real-IP') or self.client_address[0]
        n = int(self.headers.get('Content-Length') or 0)
        if n > MAX_BODY: raise Err(413, 'слишком большой запрос')
        body = json.loads(self.rfile.read(n) or b'{}') if n else {}
        path = self.path.split('?')[0].rstrip('/')
        c = db()
        try:
            if method == 'POST' and path == '/api/auth/start': return auth_start(c, body, ip)
            if method == 'POST' and path == '/api/auth/verify': return auth_verify(c, body, ip)
            if method == 'POST' and path == '/api/ping': return ping(c, body, ip)
            if method == 'POST' and path == '/api/feedback': return feedback(c, body, ip)
            d = auth(c, self.headers)
            if method == 'GET' and path == '/api/sync': return sync_get(c, d)
            if method == 'PUT' and path == '/api/sync': return sync_put(c, d, body)
            if method == 'GET' and path == '/api/devices': return devices(c, d)
            m = re.fullmatch(r'/api/devices/(\d+)', path)
            if method == 'DELETE' and m:
                c.execute('DELETE FROM devices WHERE id = ? AND user_id = ?', (int(m[1]), d['user_id'])); c.commit()
                return {'ok': True}
            if method == 'POST' and path == '/api/logout':
                c.execute('DELETE FROM devices WHERE id = ?', (d['id'],)); c.commit()
                return {'ok': True}
            if method == 'DELETE' and path == '/api/account':
                c.execute('DELETE FROM users WHERE id = ?', (d['user_id'],)); c.commit()   # устройства и прогресс — каскадом
                return {'ok': True}
            raise Err(404, 'нет такого адреса')
        finally:
            c.close()

    def route(self, method):
        try: self.send(200, self.handle_one(method))
        except Err as e: self.send(e.status, {'error': e.msg})
        except (ValueError, json.JSONDecodeError): self.send(400, {'error': 'неверный запрос'})
        except Exception as e:
            print('ошибка:', repr(e), file=sys.stderr, flush=True)
            self.send(500, {'error': 'ошибка сервера'})
    def do_GET(self): self.route('GET')
    def do_POST(self): self.route('POST')
    def do_PUT(self): self.route('PUT')
    def do_DELETE(self): self.route('DELETE')

if __name__ == '__main__':
    init_db()
    print(f'API на 127.0.0.1:{PORT}, база {DB}, почта: {"SMTP " + os.environ["SMTP_HOST"] if os.environ.get("SMTP_HOST") else "журнал (DEV)"}', flush=True)
    ThreadingHTTPServer(('127.0.0.1', PORT), H).serve_forever()
