#!/usr/bin/env python3
"""Собирает словарь words.js из data/*.txt (строки «en|ru»).

Порядок слов = реальная частотность по двум современным источникам:
  • wordfreq (data/freq/wordfreq_en.tsv) — Википедия, субтитры, новости, книги, Reddit, Twitter; данные примерно до 2021 г.;
  • SUBTLEX-US (data/freq/subtlex_us_pos.tsv) — американские субтитры, 51 млн слов (Гентский университет).
Словоформы сведены к базовым словам (went → go), британское написание — к американскому (colour → color).
Место слова = среднее геометрическое мест в двух источниках (слово должно быть частым и в живой речи, и в текстах).
Транскрипции и примеры берутся из data/ipa.tsv и data/examples.tsv (их готовит enrich.py),
части речи и близкие слова — из data/pos.tsv и data/near.tsv (их готовит semantics.py).
Базовая бытовая лексика из data/freq/core.txt включается всегда и получает ранг ×0.5.
10 самых известных слов (SKIP) исключены.
Итог — 5000 слов: курс 1 — 3000 слов в зафиксированном порядке (data/freq/course1.txt),
курс 2 — следующие 2000 по частотности (открываются в лиге «Грандмастер»).
"""
import os, glob, json, math, re, sys

# британское написание → американское (частоты складываются)
US = {'colour': 'color', 'favour': 'favor', 'honour': 'honor', 'favourite': 'favorite', 'centre': 'center',
      'theatre': 'theater', 'defence': 'defense', 'offence': 'offense', 'programme': 'program', 'realise': 'realize',
      'recognise': 'recognize', 'organise': 'organize', 'apologise': 'apologize', 'criticise': 'criticize',
      'analyse': 'analyze', 'grey': 'gray', 'tyre': 'tire', 'labour': 'labor', 'neighbour': 'neighbor',
      'neighbourhood': 'neighborhood', 'behaviour': 'behavior', 'humour': 'humor', 'jewellery': 'jewelry',
      'travelling': 'traveling', 'mum': 'mom', 'harbour': 'harbor', 'flavour': 'flavor', 'rumour': 'rumor'}

def load_lemmas():
    form = {}
    for line in open('data/freq/lemma.txt', encoding='utf-8'):
        if line.startswith(';') or '->' not in line: continue
        head, forms = line.split('->')
        lemma = head.strip().split('/')[0]
        for f in forms.strip().split(','): form.setdefault(f.strip(), lemma)
    return form

def load_dictionary():
    words = {}
    for f in sorted(glob.glob('data/[0-9]*.txt')):
        for line in open(f, encoding='utf-8'):
            if '|' not in line or line.startswith('#'): continue
            en, ru = [s.strip() for s in line.split('|', 1)]
            if not re.fullmatch(r'[A-Za-z]+', en): continue
            key = US.get(en.lower(), en.lower())
            words.setdefault(key, (US.get(en, en), ru))
    return words

form = load_lemmas()
words = load_dictionary()
def lemma(w):
    w = US.get(w, w)
    return w if (w in words or w not in form) else US.get(form[w], form[w])

# доля частей речи слова в SUBTLEX-US: thought — на 89% глагол (прошедшее от think), а «мысль» — лишь 11%
TAG = {'Noun': 'n', 'Verb': 'v', 'Adjective': 'a', 'Adverb': 'r'}
pos_share = {}
for l in list(open('data/freq/subtlex_us_pos.tsv', encoding='utf-8'))[1:]:
    f = l.rstrip('\n').split('\t')
    if len(f) < 6 or not f[4]: continue
    tags, freqs = f[4].split('.'), f[5].split('.')
    tot = sum(float(x) for x in freqs if x.replace('.', '').isdigit()) or 1
    share = {}
    for t, c in zip(tags, freqs):
        if t in TAG and c.isdigit(): share[TAG[t]] = share.get(TAG[t], 0) + int(c) / tot
    pos_share[f[0].lower()] = share
primary_pos = {}
for line in open('data/primary.txt', encoding='utf-8'):
    ff = [x.strip() for x in line.rstrip('\n').split('|')]
    if not line.startswith('#') and len(ff) > 2: primary_pos[ff[0].lower()] = ff[2]
def ru_pos(w):
    if w in primary_pos: return primary_pos[w]
    first = re.sub(r'\(.*?\)', '', words[w][1]).split(',')[0].strip().lower().split()
    if not first: return 'n'
    if re.search(r'(ть|ться|чь|ти)$', first[0]) and len(first) <= 3: return 'v'
    if len(first) == 1 and re.search(r'(ый|ий|ой|ая|ое|ые)$', first[0]): return 'a'
    return 'n'
def own_share(w):
    """слово-форма другого слова (thought ← think, left ← leave): частота только в своём значении"""
    if w not in words or form.get(w, w) == w or w not in pos_share: return 1.0
    sh = pos_share[w]
    if sh.get('v', 0) < 0.5 or ru_pos(w) not in ('n', 'a'): return 1.0   # только формы глаголов (we/my — не трогаем)
    return max(0.05, sh.get(ru_pos(w), 0.0))

def ranks(pairs):
    total = {}
    for w, c in pairs:
        if re.fullmatch('[a-z]+', w): total[lemma(w)] = total.get(lemma(w), 0) + c
    for w in total: total[w] *= own_share(w)
    return {w: k + 1 for k, w in enumerate(sorted(total, key=lambda w: -total[w]))}

wf = ranks((l.split('\t')[0].strip(), float(l.split('\t')[1])) for l in open('data/freq/wordfreq_en.tsv', encoding='utf-8'))
sx = ranks((l.split('\t')[0].strip().lower(), int(l.split('\t')[1])) for l in list(open('data/freq/subtlex_us_pos.tsv', encoding='utf-8'))[1:])
core = {w.lower() for line in open('data/freq/core.txt', encoding='utf-8')
        if not line.startswith('#') for w in line.split()}
def rank(w):
    a, b = wf.get(w), sx.get(w)
    r = math.sqrt(a * b) if a and b else (a or b or 10**6) * 1.5
    return r * 0.5 if w in core else r

ordered = sorted(words, key=rank)
# 10 самых известных слов (уровень Elementary их знает) — не тратим на них урок
SKIP = {'you', 'be', 'i', 'have', 'it', 'he', 'to', 'they', 'not', 'and'}
ordered = [w for w in ordered if w not in SKIP]
# Курс 1 (уроки 1–300): первые 3000 слов в зафиксированном порядке — к нему привязан прогресс пользователей
course1 = [US.get(l.strip().lower(), l.strip().lower()) for l in open('data/freq/course1.txt', encoding='utf-8')
           if l.strip() and not l.startswith('#')]
missing = [w for w in course1 if w not in words]
assert not missing, f'слова курса 1 пропали из словаря: {missing}'
# Курс 2 (уроки 301–500, открываются в лиге «Грандмастер»): следующие 2000 слов по частотности
EXTRA = 2000
in1 = set(course1)
# порядок курса 2 тоже зафиксирован (data/freq/course2.txt): правка перевода меняет оценку словоформ (own_share),
# и без фиксации соседние слова менялись местами — прогресс в курсе 2 съезжал бы
c2_path = 'data/freq/course2.txt'
course2 = [l.strip().lower() for l in open(c2_path, encoding='utf-8') if l.strip() and not l.startswith('#')] if os.path.exists(c2_path) else []
course2 = [w for w in course2 if w in words and w not in in1]
rest2 = [w for w in ordered if w not in in1 and w not in set(course2)]
core2 = course2 + rest2[:max(0, EXTRA - len(course2))]
# Экзаменационная лексика TOEFL / IELTS: NGSL 1.2 + NAWL 1.2 (Browne, Culligan, Phillips; CC BY-SA 4.0).
# Каждое слово этих списков должно быть в словаре; недостающие встают в курс 2 по частотности —
# перед первым зафиксированным словом, которое встречается реже (порядок остальных слов не меняется)
EXAM_SKIP = {'pi', 'neo', 'pre', 'trans', 'multi', 'non', 'micro', 'founds', 'a', 'the',   # приставки, артикли
             # варианты слов, которые уже есть в словаре: adviser → advisor, afterward → afterwards, ethics → ethic…
             'adviser', 'criteria', 'afterward', 'backward', 'ethics', 'headquarter', 'sophisticate', 'amaze',
             'complicate', 'dialog', 'excite'}
exam = []
for path in sorted(glob.glob('data/exam/*_lemmatized_for_teaching.csv')):
    for line in open(path, encoding='latin-1'):
        h = line.split(',')[0].strip().lower()
        if h and not h.startswith('#') and h not in EXAM_SKIP and h not in SKIP and re.fullmatch('[a-z]+', h):
            exam.append(US.get(h, h))
in_core = set(course1) | set(core2)
absent = [w for w in exam if w not in words and w not in in_core]
assert not absent, f'нет перевода для экзаменационных слов (добавить в data/19.txt): {absent[:20]}'
new_exam = sorted({w for w in exam if w not in in_core}, key=rank)
fixed_ranks = [rank(w) for w in core2]
slot = {w: sum(r < rank(w) for r in fixed_ranks) for w in new_exam}
merged = []
for k, w in enumerate(core2 + [None]):
    merged += [n for n in new_exam if slot[n] == k]
    if w: merged.append(w)
exam_set = set(exam)
chosen = course1 + merged
# только полные уроки по 10 слов: хвост неполного урока (самые редкие слова) отбрасываем
chosen = chosen[:len(chosen) // 10 * 10]
ordered = chosen + [w for w in ordered if w not in set(chosen)]
# транскрипции и примеры (готовит enrich.py)
def tsv(path):
    try: return {l.split('\t', 1)[0]: l.rstrip('\n').split('\t')[1:] for l in open(path, encoding='utf-8')}
    except FileNotFoundError: return {}
ipa, ex = tsv('data/ipa.tsv'), tsv('data/examples.tsv')

# глагол — если первое значение русский инфинитив; в карточке показывается «to …», как в оригинале
VERB = re.compile(r'(ать|ять|еть|ить|оть|уть|ыть|ться|сти|зти|ти|чь|чься)$')
VERB_EXTRA = {'класть', 'есть', 'красть', 'сесть', 'упасть'}
NOT_VERB = {'кости', 'мать', 'кровать', 'печать', 'сеть', 'треть', 'путь', 'суть', 'ртуть', 'нить', 'пять', 'девять', 'десять',
            'память', 'опять', 'почти', 'ночь', 'дочь', 'речь', 'вещь', 'плоть', 'благодать', 'рать', 'зять',
            'власть', 'власти', 'смерть', 'прочь', 'эти', 'новости', 'локоть', 'полночь', 'поблизости'}
MODAL = {'can', 'could', 'may', 'might', 'must', 'shall', 'should', 'will', 'would', 'ought'}   # модальные — без «to»
def is_verb(ru, en=''):
    if en.lower() in MODAL: return 0
    first = re.sub(r'\(.*?\)', '', ru).split(',')[0].strip().lower().split()
    w = first[0] if first else ''
    if w in NOT_VERB or re.search(r'(дцать|надцать)$', w): return 0
    return 1 if VERB.search(w) or w in VERB_EXTRA else 0

# часть речи и близкие слова для вариантов ответа (готовит semantics.py)
pos = {k: v[0] for k, v in tsv('data/pos.tsv').items()}
near = {k: (v[0].split() if v else []) for k, v in tsv('data/near.tsv').items()}

# омографы: главное (самое употребительное) значение первым, часть речи и написание — из data/primary.txt
primary = {}
for line in open('data/primary.txt', encoding='utf-8'):
    if line.startswith('#') or '|' not in line: continue
    f = [x.strip() for x in line.rstrip('\n').split('|')]
    primary[f[0].lower()] = (f[1], f[2] if len(f) > 2 else '', f[3] if len(f) > 3 and f[3] else f[0])

# запись: [английское, перевод, транскрипция, пример, перевод примера, глагол, часть речи, [близкие слова — индексы]]
out = []
for w in chosen:
    en, ru = words[w]
    p = pos.get(en, '')
    if w in primary:
        ru, fix_pos, new_en = primary[w]
        p = fix_pos or p
        en_old, en = en, new_en
    e = ex.get(en) or ex.get(words[w][0]) or ['', '']
    out.append([en, ru, (ipa.get(en) or ipa.get(words[w][0]) or [''])[0], e[0], e[1], is_verb(ru, en), p])
index = {r[0]: k for k, r in enumerate(out)}
for r in out:
    r.append([index[x] for x in near.get(r[0], []) if x in index][:8])
print(f'в словаре {len(words)}, взято {len(out)}; ранг последнего слова: {rank(chosen[-1]):.0f}', file=sys.stderr)
if '--dropped' in sys.argv:
    print('не вошли:', ' '.join(ordered[len(chosen):]), file=sys.stderr)
with open('words.js', 'w', encoding='utf-8') as fh:
    fh.write('// Сгенерировано build_words.py — не редактировать вручную\n')
    fh.write('window.WORDS=' + json.dumps(out, ensure_ascii=False, separators=(',', ':')) + ';\n')
    # номера слов, добавленных в версии словаря 4 (TOEFL / IELTS) — по ним приложение переносит прогресс курса 2
    if os.path.exists('data/added_v4.json'):
        fh.write('window.WORDS_ADDED={4:' + open('data/added_v4.json').read().strip() + '};\n')
