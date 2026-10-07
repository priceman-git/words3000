#!/usr/bin/env python3
"""Еженедельная сводка 5555words.com владельцу в Telegram (лично, от бота @Words5555_bot).

Запуск: systemd-таймер 5555words-report.timer — по понедельникам в 09:00 по Москве.
  python3 weekly_report.py           — отправить
  python3 weekly_report.py --preview — показать текст, ничего не отправляя
Настройки: /etc/5555words/telegram.env — TG_TOKEN (бот), TG_OWNER_CHAT (ваш чат с ботом), OWNER_IP (исключить свои заходы).
"""
import html, json, os, re, sqlite3, subprocess, sys, urllib.parse, urllib.request
from collections import Counter, defaultdict
from datetime import date, timedelta

DB = os.environ.get('DB', '/var/lib/5555words/app.db')
today = date.today()
week = [(today - timedelta(days=k)).isoformat() for k in range(7, 0, -1)]   # прошлые 7 дней
prev = [(today - timedelta(days=k)).isoformat() for k in range(14, 7, -1)]

lines = [f'<b>5555 слов — сводка за неделю</b>\n{week[0][8:]}.{week[0][5:7]} – {week[-1][8:]}.{week[-1][5:7]}', '']

# ---- приложение: анонимная статистика ----
c = sqlite3.connect(DB)
rows = c.execute('SELECT day, dev, first, plat, pwa, src, stages, lessons FROM daily').fetchall()
first_of, seen = {}, defaultdict(set)
for r in rows:
    seen[r[1]].add(r[0])
    if r[2]: first_of[r[1]] = min(first_of.get(r[1], r[2]), r[2])
def period(days):
    rs = [r for r in rows if r[0] in days]
    return {'active': len({r[1] for r in rs}), 'new': len({r[1] for r in rs if first_of.get(r[1]) in days}),
            'pwa': len({r[1] for r in rs if r[4]}), 'stages': sum(r[6] for r in rs), 'lessons': sum(r[7] for r in rs)}
cur, old = period(week), period(prev)
def delta(k):
    d = cur[k] - old[k]
    return f' ({"+" if d >= 0 else ""}{d})' if old['active'] or old[k] else ''
lines += ['<b>Приложение</b>',
          f'Активных устройств: {cur["active"]}{delta("active")}',
          f'Новых: {cur["new"]}{delta("new")}',
          f'Установили на экран «Домой»: {cur["pwa"]}',
          f'Пройдено уроков: {cur["lessons"]}{delta("lessons")}, этапов: {cur["stages"]}']
daily = Counter(r[0] for r in rows if r[0] in week)
lines.append('По дням: ' + ' · '.join(f'{d[8:]}.{d[5:7]} — {daily.get(d, 0)}' for d in week))
def ret(n):
    base = [dv for dv, f in first_of.items() if date.fromisoformat(f) + timedelta(days=n) < today]
    back = [dv for dv in base if (date.fromisoformat(first_of[dv]) + timedelta(days=n)).isoformat() in seen[dv]]
    return f'{round(100 * len(back) / len(base))}% ({len(back)} из {len(base)})' if base else 'пока нет данных'
lines += [f'Вернулись на следующий день: {ret(1)}', f'Вернулись через неделю: {ret(7)}']
src = Counter(r[5] or 'прямой заход' for r in rows if first_of.get(r[1]) == r[0] and r[0] in week)
if src: lines.append('Откуда новые: ' + ', '.join(f'{k} {v}' for k, v in src.most_common()))
plat = Counter(r[3] for r in {r[1]: r for r in rows if r[0] in week}.values())
if plat: lines.append('Устройства: ' + ', '.join(f'{k} {v}' for k, v in plat.most_common()))

# ---- сайт: журналы nginx (stats.py) ----
try:
    out = subprocess.run([sys.executable, '/opt/5555words/stats.py'] + ([os.environ['OWNER_IP']] if os.environ.get('OWNER_IP') else []),
                         capture_output=True, text=True, timeout=120).stdout
    slova = google = yandex = 0
    for l in out.splitlines():
        m = re.match(r'(\d{4}-\d{2}-\d{2})\s+\d+\s+\d+\s+(\d+)\s+\d+\s+(.*)', l)
        if m and m.group(1) in week:
            slova += int(m.group(2))
            g = re.search(r'Googlebot (\d+)', m.group(3)); y = re.search(r'YandexBot (\d+)', m.group(3))
            google += int(g.group(1)) if g else 0; yandex += int(y.group(1)) if y else 0
    refs = next((l.split(':', 1)[1].strip() for l in out.splitlines() if l.startswith('Откуда приходят')), '')
    refs = ', '.join(x for x in refs.split(', ') if not re.match(r'[\d.:]+ \d+$', x) and x != 'пока нет')   # заходы по IP сервера — не переходы
    lines += ['', '<b>Сайт и поиск</b>', f'Посетители страниц со списками слов: {slova}',
              f'Роботы поиска: Google {google}, Яндекс {yandex} запросов', f'Переходы с других сайтов: {html.escape(refs) or "нет"}']
except Exception as e:
    lines += ['', f'Журналы сайта: нет данных ({e})']

# ---- Telegram-канал ----
tok = os.environ.get('TG_TOKEN')
try:
    r = json.load(urllib.request.urlopen(f'https://api.telegram.org/bot{tok}/getChatMemberCount?chat_id=@eng_words555', timeout=10))
    lines += ['', f'<b>Telegram-канал</b>\nПодписчиков: {r.get("result")}']
except Exception:
    pass

text = '\n'.join(lines)
if '--preview' in sys.argv:
    print(re.sub(r'</?b>', '', text)); sys.exit()
data = urllib.parse.urlencode({'chat_id': os.environ['TG_OWNER_CHAT'], 'text': text, 'parse_mode': 'HTML', 'disable_web_page_preview': 'true'}).encode()
r = json.load(urllib.request.urlopen(f'https://api.telegram.org/bot{tok}/sendMessage', data, timeout=30))
print('отправлено' if r.get('ok') else f'ошибка: {r}')
