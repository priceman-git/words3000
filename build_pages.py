#!/usr/bin/env python3
"""Статические страницы со списками слов для поиска: /slova/ и /slova/1-100.html … (по 100 слов).

Источник — words.js (тот же словарь, что в приложении). Запуск после build_words.py:  python3 build_pages.py
Пишет папку slova/ и sitemap.xml. Страницы — обычный HTML без скриптов приложения (их видит и Яндекс).
"""
import html, json, os, re

SITE = 'https://5555words.com'
PER_PAGE, CORE = 100, 3000

src = open('words.js', encoding='utf-8').read()
W = json.loads(src[src.index('['):src.index(';\n')])
N = len(W)
pages = [(a, min(a + PER_PAGE, N)) for a in range(0, N, PER_PAGE)]
fname = lambda a, b: f'{a + 1}-{b}.html'
esc = lambda s: html.escape(s or '', quote=True)
mark = lambda s: re.sub(r'\[(.+?)\]', r'<b>\1</b>', esc(s))   # [слово] в примере → жирным
disp = lambda w: ('to ' if w[5] else '') + w[0]

CSS = """
  :root { --bg: #ececec; --card: #fff; --text: #111; --muted: #5a5a5a; --title: #2c6a8c; --ipa: #2c6a8c; --lime: #a3d04a; --lime-dark: #8dbb35; --line: #e6e6e6; }
  @media (prefers-color-scheme: dark) { :root { --bg: #151515; --card: #222; --text: #eee; --muted: #aaa; --title: #8ec5e8; --ipa: #8ec5e8; --line: #333; } }
  * { box-sizing: border-box; }
  body { margin: 0; background: var(--bg); color: var(--text); font: 17px/1.45 "Roboto Condensed", "Arial Narrow", -apple-system, sans-serif; }
  main { max-width: 860px; margin: 0 auto; padding: 16px 16px 48px; }
  nav.crumbs { font-size: 14px; color: var(--muted); } nav.crumbs a { color: var(--muted); }
  h1 { color: var(--title); font-size: clamp(26px, 6.5vw, 38px); line-height: 1.15; margin: 10px 0 8px; }
  .lead { color: var(--muted); margin: 0 0 14px; }
  .cta { display: inline-block; background: var(--lime); color: #fff; text-decoration: none; font-weight: 700; font-size: 19px; padding: 11px 22px; border-radius: 12px; }
  .cta:hover { background: var(--lime-dark); }
  .card { background: var(--card); border-radius: 14px; padding: 4px 14px; margin: 14px 0; }
  .w { display: grid; grid-template-columns: 44px 1fr; gap: 2px 10px; padding: 10px 0; border-top: 1px solid var(--line); }
  .w:first-child { border-top: 0; }
  .n { color: var(--muted); font-size: 14px; padding-top: 3px; }
  .en { font-size: 20px; font-weight: 700; }
  .en button { background: none; border: 0; font-size: 18px; cursor: pointer; padding: 0 4px; color: var(--title); }
  .ipa { color: var(--ipa); font-size: 15px; margin-left: 6px; font-weight: 400; }
  .ru { font-size: 17px; }
  .ex { grid-column: 2; font-size: 15px; color: var(--muted); }
  .ex b { color: var(--text); }
  .pager { display: flex; justify-content: space-between; gap: 10px; margin: 18px 0; }
  .pager a { background: var(--card); padding: 10px 14px; border-radius: 10px; text-decoration: none; color: var(--title); font-weight: 700; }
  .ranges { display: grid; grid-template-columns: repeat(auto-fill, minmax(150px, 1fr)); gap: 8px; }
  .ranges a { background: var(--card); border-radius: 10px; padding: 10px 12px; text-decoration: none; color: var(--title); font-weight: 700; }
  .ranges a small { display: block; color: var(--muted); font-weight: 400; font-size: 13px; }
  h2 { color: var(--title); font-size: 22px; margin: 22px 0 8px; }
  footer { color: var(--muted); font-size: 13px; margin-top: 26px; } footer a { color: var(--muted); }
  a { color: var(--title); }
"""
SPEAK = """<script>
// произношение по кнопке ▶ — голос браузера (как в приложении)
document.addEventListener('click', e => {
  const b = e.target.closest('[data-say]'); if (!b || !window.speechSynthesis) return;
  const u = new SpeechSynthesisUtterance(b.dataset.say); u.lang = 'en-GB'; u.rate = 0.85;
  const vs = speechSynthesis.getVoices().filter(v => /en[-_]GB/i.test(v.lang));   // британский, Daniel — первым
  u.voice = vs.find(v => /^(Daniel|Дэниэл)/.test(v.name)) || vs.find(v => v.localService) || vs[0] || null;
  speechSynthesis.cancel(); speechSynthesis.speak(u);
});
</script>"""
FOOT = """<footer>
  <p>Частотность — wordfreq (CC BY-SA 4.0) и SUBTLEX-US; лексика IELTS / TOEFL — NGSL и NAWL (Browne, Culligan, Phillips; CC BY-SA 4.0);
  примеры — <a href="https://tatoeba.org">Tatoeba</a> (CC BY 2.0 FR); транскрипции — CMUdict. Список слов распространяется по лицензии
  <a href="https://creativecommons.org/licenses/by-sa/4.0/deed.ru">CC BY-SA 4.0</a>.</p>
  <p><a href="../o-prilozhenii.html">О приложении</a> · <a href="../privacy.html">Политика конфиденциальности</a></p>
</footer>"""

def head(title, desc, path, crumbs):
    ld = {"@context": "https://schema.org", "@type": "BreadcrumbList",
          "itemListElement": [{"@type": "ListItem", "position": k + 1, "name": n, "item": SITE + u} for k, (n, u) in enumerate(crumbs)]}
    return f"""<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}">
<link rel="canonical" href="{SITE}{path}">
<meta property="og:type" content="article">
<meta property="og:site_name" content="5555 слов">
<meta property="og:locale" content="ru_RU">
<meta property="og:url" content="{SITE}{path}">
<meta property="og:title" content="{esc(title)}">
<meta property="og:description" content="{esc(desc)}">
<meta property="og:image" content="{SITE}/icons/og-image.png?v=2">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" href="/icons/favicon-120.png" type="image/png" sizes="120x120">
<link rel="icon" href="../icons/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="../fonts/fonts.css">
<script type="application/ld+json">{json.dumps(ld, ensure_ascii=False)}</script>
<style>{CSS}</style>
</head>
<body><main>"""

def range_title(a, b):
    return f'Английские слова {a + 1}–{b}' + (' — самые употребительные' if b <= CORE else ' — для продвинутых, IELTS и TOEFL')

def row(i, num):
    w = W[i]
    ex = f'<div class="ex">{mark(w[3])}<br>{mark(w[4])}</div>' if w[3] else ''
    return (f'<div class="w"><div class="n">{num}</div><div><span class="en">{esc(disp(w))}'
            f'<button data-say="{esc(w[0])}" aria-label="Произнести {esc(w[0])}">▶</button></span>'
            f'<span class="ipa">{"[" + esc(w[2]) + "]" if w[2] else ""}</span><div class="ru">{esc(w[1])}</div></div>{ex}</div>')

# тематические списки: части речи (по частоте) и академическая лексика IELTS / TOEFL (NAWL)
nawl = set()
for line in open('data/exam/NAWL_12_lemmatized_for_teaching.csv', encoding='latin-1'):
    h = line.split(',')[0].strip().lower()
    if h and not h.startswith('#'): nawl.add(h)
def plural(n, one, few, many):
    n = abs(n) % 100; n1 = n % 10
    return many if 10 < n < 20 else one if n1 == 1 else few if 2 <= n1 <= 4 else many
of_pos = lambda p, n: [i for i, w in enumerate(W) if w[6] == p][:n]
TOPICS = [
    ('glagoly', 'Самые употребительные английские глаголы', of_pos('v', 300),
     ('глагол', 'глагола', 'глаголов'), 'Глаголы be и have в список не входят — их знает каждый.'),
    ('sushchestvitelnye', 'Самые употребительные английские существительные', of_pos('n', 500), ('существительное', 'существительных', 'существительных'), ''),
    ('prilagatelnye', 'Самые употребительные английские прилагательные', of_pos('a', 300), ('прилагательное', 'прилагательных', 'прилагательных'), ''),
    ('narechiya', 'Самые употребительные английские наречия', of_pos('r', 150), ('наречие', 'наречия', 'наречий'), ''),
    ('predlogi', 'Английские предлоги', of_pos('prep', 60), ('предлог', 'предлога', 'предлогов'), 'Все предлоги словаря — от самых частых (of, in, for, on) к редким.'),
    ('ielts-toefl', 'Академические английские слова для IELTS и TOEFL', [i for i, w in enumerate(W) if w[0].lower() in nawl], ('академическое слово', 'академических слова', 'академических слов'),
     'Список NAWL (New Academic Word List, Browne, Culligan, Phillips) — лексика научных и учебных текстов, на которой строятся задания IELTS и TOEFL. Слова идут по частоте.'),
]
def more_lists(skip=''):
    return ('<h2>Ещё списки</h2><div class="ranges">'
            + ''.join(f'<a href="{slug}.html">{esc(t)}<small>{len(ids)} {plural(len(ids), *word)}</small></a>' for slug, t, ids, word, _ in TOPICS if slug != skip)
            + '<a href="./">Все слова по 100<small>' + str(N) + ' слов по частоте</small></a></div>')

os.makedirs('slova', exist_ok=True)
for slug, t, ids, word, note in TOPICS:
    path = f'/slova/{slug}.html'
    sample = ', '.join(W[i][0] for i in ids[:6])
    nw = f'{len(ids)} {plural(len(ids), *word)}'
    title = f'{t}: {len(ids)} {plural(len(ids), "слово", "слова", "слов")} с переводом и транскрипцией'
    desc = f'{t} ({sample}…) — {nw} по частоте употребления: перевод, транскрипция, произношение и примеры. Учите бесплатно в приложении «5555 слов».'
    body = f'''{head(title, desc, path, [('5555 слов', '/'), ('Списки слов', '/slova/'), (t, path)])}
<nav class="crumbs"><a href="../">5555 слов</a> › <a href="./">Списки слов</a> › {esc(t)}</nav>
<h1>{esc(t)}</h1>
<p class="lead">{nw} по частоте в современном английском: сначала самые нужные. С переводом, транскрипцией, произношением (кнопка ▶) и примерами. {esc(note)}</p>
<a class="cta" href="../">Учить эти слова в приложении</a>
<div class="card">{''.join(row(i, k + 1) for k, i in enumerate(ids))}</div>
<p><a class="cta" href="../">Учить бесплатно</a></p>
{more_lists(slug)}
{FOOT}
</main>{SPEAK}</body></html>
'''
    open(f'slova/{slug}.html', 'w', encoding='utf-8').write(body)

for k, (a, b) in enumerate(pages):
    path = f'/slova/{fname(a, b)}'
    course = 'курс 1 — самые употребительные слова' if b <= CORE else 'курс 2 — для продвинутых, включая лексику IELTS и TOEFL'
    sample = ', '.join(W[i][0] for i in range(a, min(a + 6, b)))
    title = f'{range_title(a, b)}: список с переводом и транскрипцией'
    desc = (f'Английские слова {a + 1}–{b} по частоте ({sample}…): перевод, транскрипция, произношение и примеры. '
            f'Учите их бесплатно в приложении «5555 слов».')
    rows = [row(i, i + 1) for i in range(a, b)]
    prev = f'<a href="{fname(*pages[k - 1])}">← Слова {pages[k - 1][0] + 1}–{pages[k - 1][1]}</a>' if k else '<span></span>'
    nxt = f'<a href="{fname(*pages[k + 1])}">Слова {pages[k + 1][0] + 1}–{pages[k + 1][1]} →</a>' if k + 1 < len(pages) else '<span></span>'
    lessons = f'уроки {a // 10 + 1}–{(b - 1) // 10 + 1}'
    body = f"""{head(title, desc, path, [('5555 слов', '/'), ('Списки слов', '/slova/'), (f'Слова {a + 1}–{b}', path)])}
<nav class="crumbs"><a href="../">5555 слов</a> › <a href="./">Списки слов</a> › Слова {a + 1}–{b}</nav>
<h1>{esc(range_title(a, b))}</h1>
<p class="lead">{b - a} английских слов по частоте употребления ({course}): перевод, транскрипция, произношение (кнопка ▶) и пример фразы. В приложении это {lessons}.{' Самые известные слова — I, you, he, it, they, be, have, to, and, not — в список не входят: их знает каждый.' if a == 0 else ''}</p>
<a class="cta" href="../">Учить эти слова в приложении</a>
<div class="pager">{prev}{nxt}</div>
<div class="card">{''.join(rows)}</div>
<div class="pager">{prev}{nxt}</div>
<p><a class="cta" href="../">Учить эти слова бесплатно</a></p>
{more_lists()}
{FOOT}
</main>{SPEAK}</body></html>
"""
    open(f'slova/{fname(a, b)}', 'w', encoding='utf-8').write(body)

# оглавление
def links(lo, hi):
    return ''.join(f'<a href="{fname(a, b)}">Слова {a + 1}–{b}<small>{", ".join(W[i][0] for i in range(a, min(a + 3, b)))}…</small></a>'
                   for a, b in pages if lo <= a < hi)
idx = f"""{head('Самые употребительные английские слова: списки по 100 слов с переводом и транскрипцией',
                f'{N} английских слов по частоте употребления: 3000 самых частотных и ещё 2555+ для продвинутых (IELTS, TOEFL). Перевод, транскрипция, произношение и примеры.',
                '/slova/', [('5555 слов', '/'), ('Списки слов', '/slova/')])}
<nav class="crumbs"><a href="../">5555 слов</a> › Списки слов</nav>
<h1>Самые употребительные английские слова</h1>
<p class="lead">{N} английских слов, упорядоченных по частоте в современном английском: сначала самые нужные. По 100 слов на странице — с переводом, транскрипцией, произношением и примерами.</p>
<a class="cta" href="../">Учить бесплатно в приложении</a>
<h2>По частям речи и для экзаменов</h2>
<div class="ranges">{''.join(f'<a href="{slug}.html">{esc(t)}<small>{len(ids)} {plural(len(ids), *word)}</small></a>' for slug, t, ids, word, _ in TOPICS)}</div>
<h2>3000 самых частотных слов</h2>
<div class="ranges">{links(0, CORE)}</div>
<h2>Ещё 2555+ слов для продвинутых, IELTS и TOEFL</h2>
<div class="ranges">{links(CORE, N)}</div>
{FOOT}
</main></body></html>
"""
open('slova/index.html', 'w', encoding='utf-8').write(idx)

# sitemap
urls = [('/', '1.0', 'weekly'), ('/o-prilozhenii.html', '0.9', 'monthly'), ('/slova/', '0.9', 'monthly')]
urls += [(f'/slova/{slug}.html', '0.8', 'monthly') for slug, *_ in TOPICS]
urls += [(f'/slova/{fname(a, b)}', '0.8' if b <= CORE else '0.6', 'monthly') for a, b in pages]
urls += [('/privacy.html', '0.2', 'yearly')]
open('sitemap.xml', 'w', encoding='utf-8').write('<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    + ''.join(f'  <url><loc>{SITE}{u}</loc><changefreq>{c}</changefreq><priority>{p}</priority></url>\n' for u, p, c in urls) + '</urlset>\n')
print(f'страниц: {len(pages)} по 100 + {len(TOPICS)} тематических + оглавление, sitemap: {len(urls)} адресов')
