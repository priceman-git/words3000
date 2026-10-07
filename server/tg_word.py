#!/usr/bin/env python3
"""«Слово дня» для Telegram-канала @eng_words555: одно слово из 3000 самых употребительных в день.

Берёт словарь сайта (/var/www/5555words/words.js), публикует следующее слово через бота.
Порядок — существительные, глаголы, прилагательные и наречия курса 1, перемешанные один раз (зерно 5555):
служебные слова (of, the, and…) для «слова дня» неинтересны. Хватает больше чем на 7 лет.

Запуск: systemd-таймер 5555words-tg.timer, каждый день в 09:00 по Астане.
  python3 tg_word.py            — опубликовать следующее слово
  python3 tg_word.py --preview  — показать, что будет опубликовано, ничего не отправляя
Настройки: /etc/5555words/telegram.env (TG_TOKEN — токен бота; TG_CHANNEL — по умолчанию @eng_words555).
Состояние: /var/lib/5555words/tg_state.json (номер следующего слова).
"""
import html, json, os, random, re, sys, urllib.parse, urllib.request

WORDS = os.environ.get('WORDS_JS', '/var/www/5555words/words.js')
STATE = os.environ.get('TG_STATE', '/var/lib/5555words/tg_state.json')
CHANNEL = os.environ.get('TG_CHANNEL', '@eng_words555')
SITE = 'https://5555words.com'
CORE = 3000

src = open(WORDS, encoding='utf-8').read()
W = json.loads(src[src.index('['):src.index(';\n')])
order = [i for i in range(CORE) if W[i][6] in ('n', 'v', 'a', 'r')]
random.Random(5555).shuffle(order)

def message(i):
    en, ru, ipa, ex, exru, verb = W[i][:6]
    e = lambda s: html.escape(s or '', quote=False)
    mark = lambda s: re.sub(r'\[(.+?)\]', r'<b>\1</b>', e(s))   # [слово] в примере → жирным
    a = i // 100 * 100
    page = f'{SITE}/slova/{a + 1}-{min(a + 100, len(W))}.html'
    word = ('to ' if verb else '') + en
    lines = [f'🇬🇧 <b>{e(word)}</b>' + (f'  [{e(ipa)}]' if ipa else ''), f'🇷🇺 {e(ru)}']
    if ex:
        lines += ['', f'💬 <i>{mark(ex)}</i>', mark(exru)]
    lines += ['', f'№ {i + 1} из 3000 самых употребительных английских слов',
              f'📖 <a href="{page}">Слова {a + 1}–{min(a + 100, len(W))} с переводом</a>',
              f'📱 <a href="{SITE}/">Учить бесплатно — 5555 слов</a>', '', '#словодня #английский']
    return '\n'.join(lines)

def main():
    st = json.load(open(STATE)) if os.path.exists(STATE) else {'next': 0}
    i = order[st['next'] % len(order)]
    text = message(i)
    if '--preview' in sys.argv:
        print(text); return
    token = os.environ['TG_TOKEN']
    data = urllib.parse.urlencode({'chat_id': CHANNEL, 'text': text, 'parse_mode': 'HTML', 'disable_web_page_preview': 'true'}).encode()
    r = json.load(urllib.request.urlopen(f'https://api.telegram.org/bot{token}/sendMessage', data, timeout=30))
    if not r.get('ok'): sys.exit(f'Telegram: {r}')
    st['next'] += 1
    st.setdefault('log', []).append({'i': i, 'word': W[i][0], 'msg': r['result']['message_id']})
    st['log'] = st['log'][-60:]
    tmp = STATE + '.tmp'
    json.dump(st, open(tmp, 'w'), ensure_ascii=False); os.replace(tmp, STATE)
    print(f'опубликовано: {W[i][0]} (№ {i + 1}), сообщение {r["result"]["message_id"]}')

if __name__ == '__main__':
    main()
