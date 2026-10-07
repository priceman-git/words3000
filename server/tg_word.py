#!/usr/bin/env python3
"""«Слово дня» для Telegram-канала @eng_words555: одно слово из 3000 самых употребительных в день.

Берёт словарь сайта (/var/www/5555words/words.js), публикует следующее слово через бота.
Порядок — существительные, глаголы, прилагательные и наречия курса 1, перемешанные один раз (зерно 5555):
служебные слова (of, the, and…) для «слова дня» неинтересны. Хватает больше чем на 7 лет.

Запуск: systemd-таймер 5555words-tg.timer, каждый день в 09:00 по Астане.
  python3 tg_word.py            — опубликовать следующее слово
  python3 tg_word.py --preview  — картинку в /tmp/tg_preview.png и подпись на экран, ничего не отправляя
  python3 tg_word.py --preview --word travel — то же для конкретного слова
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

# ---------------- картинка-карточка в стиле экрана «Изучение» ----------------
FONTS = '/usr/share/fonts/truetype/roboto/unhinted/'
BG, CARD, TEXT, GRAY, RU, HL, TEAL, LIME, LINE, TITLE = '#ececec', '#ffffff', '#111111', '#8a8a8a', '#3a8f98', '#f0592b', '#4fc6b3', '#a3d04a', '#d6d6d6', '#2c6a8c'

def card(i):
    from PIL import Image, ImageDraw, ImageFont
    font = lambda name, size: ImageFont.truetype(FONTS + f'RobotoCondensed-{name}.ttf', size)
    en, ru, ipa, ex, exru, verb = W[i][:6]
    S = 1080
    img = Image.new('RGB', (S, S), BG); d = ImageDraw.Draw(img)

    def fit(text, name, size, maxw, minsize=40):   # уменьшаем шрифт, пока строка не поместится
        while size > minsize and d.textlength(text, font=font(name, size)) > maxw: size -= 4
        return font(name, size)

    def speaker(cx, cy, r=46):   # белый кружок со значком громкоговорителя, как в приложении
        d.ellipse((cx - r, cy - r, cx + r, cy + r), fill=CARD)
        k = r / 46
        d.polygon([(cx - 20*k, cy - 9*k), (cx - 9*k, cy - 9*k), (cx + 4*k, cy - 21*k), (cx + 4*k, cy + 21*k), (cx - 9*k, cy + 9*k), (cx - 20*k, cy + 9*k)], fill=TEAL)
        for rr in (13, 24):
            d.arc((cx - rr*k + 6*k, cy - rr*k, cx + rr*k + 6*k, cy + rr*k), -50, 50, fill=TEAL, width=max(3, int(5*k)))

    def rich(text, y, name, size, base, maxw, x0=110):   # текст с [выделенным] словом, перенос по словам
        f = font(name, size)
        parts = []
        for seg in re.split(r'(\[[^\]]+\])', text):
            if not seg: continue
            hl = seg.startswith('[')
            for w in re.findall(r'\S+\s*', seg.strip('[]') if hl else seg):
                parts.append((w, HL if hl else base))
        line, lines = [], []
        for w, c in parts:
            if line and d.textlength(''.join(x for x, _ in line) + w.rstrip(), font=f) > maxw: lines.append(line); line = []
            line.append((w, c))
        if line: lines.append(line)
        for ln in lines:
            x = x0
            for w, c in ln: d.text((x, y), w, font=f, fill=c); x += d.textlength(w, font=f)
            y += int(size * 1.3)
        return y

    # шапка: как экран урока
    d.rectangle((0, 0, S, 130), fill=CARD)
    d.text((S / 2, 65), 'Слово дня', font=font('Bold', 50), fill=TITLE, anchor='mm')
    d.text((S - 50, 65), f'№ {i + 1}', font=font('Medium', 36), fill=GRAY, anchor='rm')
    d.text((50, 65), '5555 слов', font=font('Bold', 36), fill=TEAL, anchor='lm')
    word = ('to ' if verb else '') + en
    y = 250
    d.text((S / 2, y), word, font=fit(word, 'Bold', 150, 900), fill=TEXT, anchor='mm')
    y += 115
    if ipa: d.text((S / 2, y), f'[{ipa}]', font=font('Regular', 54), fill=GRAY, anchor='mm')
    y += 60
    d.line((110, y, 890, y), fill=LINE, width=3); speaker(960, y)
    y += 85
    d.text((S / 2, y), ru, font=fit(ru, 'Regular', 84, 900, 46), fill=RU, anchor='mm')
    y += 95
    if ex:
        y = rich(ex, y, 'Italic', 48, TEXT, 760)
        y += 6
        d.line((110, y, 890, y), fill=LINE, width=3); speaker(960, y)
        y += 30
        rich(exru, y, 'Italic', 48, GRAY, 760)
    # кнопка внизу — как «Выучить слово»
    d.rounded_rectangle((110, 920, 970, 1030), radius=26, fill=LIME)
    d.text((S / 2, 975), 'Учить бесплатно — 5555words.com', font=font('Medium', 50), fill='#ffffff', anchor='mm')
    import io
    b = io.BytesIO(); img.save(b, 'PNG', optimize=True); return b.getvalue()

def caption(i):
    en, ru, ipa, ex, exru, verb = W[i][:6]
    e = lambda s: html.escape(s or '', quote=False)
    a = i // 100 * 100
    page = f'{SITE}/slova/{a + 1}-{min(a + 100, len(W))}.html'
    return '\n'.join([f'🇬🇧 <b>{e(("to " if verb else "") + en)}</b> — {e(ru)}', '',
                      f'№ {i + 1} из 3000 самых употребительных английских слов',
                      f'📖 <a href="{page}">Слова {a + 1}–{min(a + 100, len(W))} с переводом</a>',
                      f'📱 <a href="{SITE}/">Учить бесплатно — 5555 слов</a>', '', '#словодня #английский'])

def send_photo(token, png, cap):
    boundary = '----5555words' + os.urandom(8).hex()
    fields = {'chat_id': CHANNEL, 'caption': cap, 'parse_mode': 'HTML'}
    body = b''.join(f'--{boundary}\r\nContent-Disposition: form-data; name="{k}"\r\n\r\n{v}\r\n'.encode() for k, v in fields.items())
    body += f'--{boundary}\r\nContent-Disposition: form-data; name="photo"; filename="word.png"\r\nContent-Type: image/png\r\n\r\n'.encode() + png + f'\r\n--{boundary}--\r\n'.encode()
    req = urllib.request.Request(f'https://api.telegram.org/bot{token}/sendPhoto', body, {'Content-Type': f'multipart/form-data; boundary={boundary}'})
    return json.load(urllib.request.urlopen(req, timeout=60))

def main():
    st = json.load(open(STATE)) if os.path.exists(STATE) else {'next': 0}
    i = order[st['next'] % len(order)]
    if '--word' in sys.argv: i = next(k for k, w in enumerate(W) if w[0] == sys.argv[sys.argv.index('--word') + 1])
    if '--preview' in sys.argv:   # картинка — в /tmp/tg_preview.png, подпись — на экран
        open('/tmp/tg_preview.png', 'wb').write(card(i)); print(caption(i)); return
    token = os.environ['TG_TOKEN']
    r = send_photo(token, card(i), caption(i))
    if not r.get('ok'): sys.exit(f'Telegram: {r}')
    st['next'] += 1
    st.setdefault('log', []).append({'i': i, 'word': W[i][0], 'msg': r['result']['message_id']})
    st['log'] = st['log'][-60:]
    tmp = STATE + '.tmp'
    json.dump(st, open(tmp, 'w'), ensure_ascii=False); os.replace(tmp, STATE)
    print(f'опубликовано: {W[i][0]} (№ {i + 1}), сообщение {r["result"]["message_id"]}')

if __name__ == '__main__':
    main()
