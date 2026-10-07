#!/usr/bin/env python3
"""Сводка посещаемости 5555words.com по журналам nginx (по дням, время Астаны). Только итоговые числа — без IP.

Как считаем:
  * «новые» — первая загрузка приложения: скачан словарь words.js (сканеры и роботы его не качают);
  * «открытия» — у установленного приложения страница берётся из кэша, но при каждом открытии оно запрашивает
    /sw.js (проверка обновления) — по уникальным посетителям за день;
  * посетитель = IP + браузер; роботы, сканеры и заданные IP (владелец) исключаются.
Запуск на сервере: python3 stats.py [IP_исключить ...]
"""
import gzip, glob, json, os, re, sys, urllib.request
from collections import defaultdict, Counter
from datetime import datetime, timedelta, timezone

EXCLUDE = set(sys.argv[1:])
TZ = timezone(timedelta(hours=5))
LINE = re.compile(r'(\S+) \S+ \S+ \[([^\]]+)\] "(\S+) (\S+) [^"]*" (\d{3}) \S+ "([^"]*)" "([^"]*)"')
BOT = re.compile(r'bot|crawl|spider|slurp|curl|wget|python|go-http|scanner|zgrab|masscan|headless|httpclient|java/|okhttp|facebookexternalhit|preview|monitor|uptime|feed', re.I)
SEARCH_BOT = {'YandexBot': re.compile(r'Yandex', re.I), 'Googlebot': re.compile(r'Googlebot|Google-InspectionTool', re.I), 'Bingbot': re.compile(r'bingbot', re.I)}

new, opens, slova, landing = (defaultdict(set) for _ in range(4))
refs, bots = defaultdict(Counter), defaultdict(Counter)
files = sorted(glob.glob('/var/log/nginx/access.log*'), key=lambda p: -int(p.rsplit('.', 1)[-1]) if p[-1].isdigit() or p.endswith('.gz') and p.split('.')[-2].isdigit() else 0)
for path in glob.glob('/var/log/nginx/access.log*'):
    op = gzip.open if path.endswith('.gz') else open
    for line in op(path, 'rt', errors='replace'):
        m = LINE.match(line)
        if not m: continue
        ip, ts, method, url, status, ref, ua = m.groups()
        day = datetime.strptime(ts, '%d/%b/%Y:%H:%M:%S %z').astimezone(TZ).strftime('%Y-%m-%d')
        for name, rx in SEARCH_BOT.items():
            if rx.search(ua): bots[day][name] += 1
        if ip in EXCLUDE or BOT.search(ua) or 'Mozilla' not in ua or method != 'GET' or status not in ('200', '304'): continue
        who = (ip, ua)
        path_ = url.split('?')[0]
        if path_ == '/words.js': new[day].add(who)          # реально загрузил приложение (сканеры словарь не качают)
        if path_ == '/sw.js': opens[day].add(who)
        if path_.startswith('/slova/'): slova[day].add(who)
        if path_ == '/o-prilozhenii.html': landing[day].add(who)
        if ref and ref != '-' and '5555words.com' not in ref:
            host = re.sub(r'^https?://(www\.)?', '', ref).split('/')[0]
            refs[day][host] += 1

days = sorted(set(new) | set(opens) | set(slova) | set(bots))
print(f'{"день":<11}{"новые":>7}{"открытия":>10}{"списки слов":>13}{"о прилож.":>11}   роботы поиска')
for d in days:
    b = ', '.join(f'{k} {v}' for k, v in bots[d].items()) or '—'
    print(f'{d:<11}{len(new[d]):>7}{len(opens[d] | new[d]):>10}{len(slova[d]):>13}{len(landing[d]):>11}   {b}')
allref = Counter()
for c in refs.values(): allref.update(c)
print('\nОткуда приходят (переходы с других сайтов):', ', '.join(f'{h} {n}' for h, n in allref.most_common(10)) or 'пока нет')

tok = os.environ.get('TG_TOKEN')
if tok:
    try:
        r = json.load(urllib.request.urlopen(f'https://api.telegram.org/bot{tok}/getChatMemberCount?chat_id=@eng_words555', timeout=10))
        print('Подписчиков Telegram-канала:', r.get('result'))
    except Exception as e: print('Telegram: нет данных', e)

# ---------------- анонимная статистика приложения (таблица daily) ----------------
import sqlite3
from datetime import date
DB = os.environ.get('DB', '/var/lib/5555words/app.db')
if os.path.exists(DB):
    c = sqlite3.connect(DB)
    rows = c.execute('SELECT day, dev, first, plat, pwa, src, stages, lessons, learned FROM daily').fetchall()
    if rows:
        by_day = defaultdict(list); seen = defaultdict(set); first_of = {}
        for r in rows:
            by_day[r[0]].append(r); seen[r[1]].add(r[0])
            if r[2]: first_of[r[1]] = min(first_of.get(r[1], r[2]), r[2])
        print('\nПРИЛОЖЕНИЕ (анонимная статистика устройств)')
        print(f'{"день":<11}{"активные":>9}{"новые":>7}{"на экране «Домой»":>19}{"этапов":>8}{"уроков":>8}')
        for d in sorted(by_day):
            rs = by_day[d]
            print(f'{d:<11}{len(rs):>9}{sum(1 for r in rs if first_of.get(r[1]) == d):>7}{sum(r[4] for r in rs):>19}{sum(r[6] for r in rs):>8}{sum(r[7] for r in rs):>8}')
        def ret(n):   # доля устройств, вернувшихся через n дней после первого дня
            base = [dv for dv, f in first_of.items() if (date.fromisoformat(f) + timedelta(days=n)) <= date.today()]
            back = [dv for dv in base if (date.fromisoformat(first_of[dv]) + timedelta(days=n)).isoformat() in seen[dv]]
            return f'{len(back)} из {len(base)}' if base else 'пока нет данных'
        print('Возвращаются на следующий день:', ret(1), '· через неделю:', ret(7))
        print('Всего устройств:', len(seen), '· источники новых:', dict(Counter(r[5] or 'прямой заход' for r in rows if first_of.get(r[1]) == r[0]).most_common()),
              '· устройства:', dict(Counter(r[3] for r in {r[1]: r for r in rows}.values()).most_common()))
