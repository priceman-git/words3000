#!/usr/bin/env python3
"""Транскрипции и примеры фраз для словаря.

Запуск:  python3 enrich.py <папка с исходниками>
В папке должны лежать:
  cmudict.dict              — https://github.com/cmusphinx/cmudict (американское произношение)
  eng_sentences.tsv, rus_sentences.tsv, eng-rus_links.tsv — https://downloads.tatoeba.org/exports/per_language/ (CC BY 2.0 FR)
Результат:
  data/ipa.tsv       слово \t транскрипция
  data/examples.tsv  слово \t пример \t перевод   (искомое слово выделено [квадратными скобками])
"""
import json, re, sys
from collections import defaultdict

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'

src = open('words.js', encoding='utf-8').read()
WORDS = json.loads(src[src.index('['):src.rindex(']') + 1])
words = [w[0] for w in WORDS]
ru_of = {w[0]: w[1] for w in WORDS}
top = {w.lower() for w in words}

# ---------------- транскрипция (ARPAbet -> IPA) ----------------

V = {'AA': 'ɑː', 'AE': 'æ', 'AH': 'ʌ', 'AO': 'ɔː', 'AW': 'aʊ', 'AY': 'aɪ', 'EH': 'e', 'ER': 'ɜːr', 'EY': 'eɪ',
     'IH': 'ɪ', 'IY': 'iː', 'OW': 'oʊ', 'OY': 'ɔɪ', 'UH': 'ʊ', 'UW': 'uː'}
C = {'B': 'b', 'CH': 'tʃ', 'D': 'd', 'DH': 'ð', 'F': 'f', 'G': 'g', 'HH': 'h', 'JH': 'dʒ', 'K': 'k', 'L': 'l', 'M': 'm',
     'N': 'n', 'NG': 'ŋ', 'P': 'p', 'R': 'r', 'S': 's', 'SH': 'ʃ', 'T': 't', 'TH': 'θ', 'V': 'v', 'W': 'w', 'Y': 'j',
     'Z': 'z', 'ZH': 'ʒ'}
ONSETS = {tuple(o.split()) for o in [
    'P R', 'P L', 'B R', 'B L', 'T R', 'D R', 'K R', 'K L', 'G R', 'G L', 'F R', 'F L', 'TH R', 'SH R', 'S P', 'S T',
    'S K', 'S M', 'S N', 'S L', 'S W', 'T W', 'K W', 'D W', 'S P R', 'S T R', 'S K R', 'S P L', 'S K W', 'P Y', 'B Y',
    'K Y', 'F Y', 'M Y', 'HH Y', 'V Y', 'G Y']}

def to_ipa(phones):
    out, syl_starts = [], []
    ph = phones.split()
    vowels = [k for k, p in enumerate(ph) if p[:2] in V]
    stressed = [k for k in vowels if ph[k].endswith('1')]
    mark_at = None
    if len(vowels) > 1 and stressed:
        v = stressed[0]
        # начало ударного слога: максимально допустимая группа согласных перед гласной
        s = v
        while s > 0 and ph[s - 1][:2] not in V and (len(ph[s - 1:v]) == 1 or tuple(ph[s - 1:v]) in ONSETS):
            s -= 1
        mark_at = s
    for k, p in enumerate(ph):
        if k == mark_at: out.append('ˈ')
        base, st = p.rstrip('012'), p[len(p.rstrip('012')):]
        if base in V:
            if st == '0':
                out.append({'AH': 'ə', 'ER': 'ər', 'IH': 'ɪ', 'IY': 'i', 'UW': 'u', 'AA': 'ɑ', 'AO': 'ɔ'}.get(base, V[base]))
            else:
                out.append(V[base])
        else:
            out.append(C.get(base, ''))
    return ''.join(out)

cmu = defaultdict(list)
for line in open(f'{SRC}/cmudict.dict', encoding='utf-8'):
    line = line.split('#')[0].strip()
    if not line: continue
    head, phones = line.split(' ', 1)
    cmu[re.sub(r'\(\d+\)$', '', head)].append(phones)

ipa = {}
for w in words:
    variants = cmu.get(w.lower())
    if not variants: continue
    full = [p for p in variants if '1' in p]           # полная (ударная) форма, а не редуцированная
    ipa[w] = to_ipa((full or variants)[0])

# ---------------- примеры из Tatoeba ----------------

def read(path):
    d = {}
    for line in open(path, encoding='utf-8'):
        p = line.rstrip('\n').split('\t')
        if len(p) == 3: d[p[0]] = p[2]
    return d

eng = read(f'{SRC}/eng_sentences.tsv')
rus = read(f'{SRC}/rus_sentences.tsv')
pairs = defaultdict(list)
for line in open(f'{SRC}/eng-rus_links.tsv', encoding='utf-8'):
    a, b = line.split()
    if a in eng and b in rus: pairs[a].append(b)

# словоформы: goes/went/going -> go
forms = defaultdict(set)
for line in open('data/freq/lemma.txt', encoding='utf-8'):
    if line.startswith(';') or '->' not in line: continue
    h, f = line.split('->'); lemma = h.strip().split('/')[0]
    for x in f.strip().split(','):
        x = x.strip()
        if re.fullmatch('[a-z]+', x): forms[lemma].add(x)

TOK = re.compile(r"[A-Za-z']+")
rank = {w.lower(): i for i, w in enumerate(words)}
index = defaultdict(list)       # словоформа -> [(eng_id, tokens)]
good = []
for eid, text in eng.items():
    if eid not in pairs: continue
    if not (12 <= len(text) <= 55) or re.search(r'[0-9"«»:;()\[\]/]', text) or text[-1] not in '.!?': continue
    toks = [t.lower() for t in TOK.findall(text)]
    if not (3 <= len(toks) <= 9): continue
    # имена собственные в середине фразы — пропускаем
    if any(t[0].isupper() and t not in ('I', "I'm", "I'll", "I've", "I'd") for t in TOK.findall(text)[1:]): continue
    good.append(eid)
    for t in set(toks): index[t].append(eid)

def meanings(ru):
    """слова перевода с номером значения: 0 — главное (первое) значение"""
    ms = []
    for g, m in enumerate(re.split(r'[,;]', re.sub(r'\(.*?\)', '', ru))):
        ms += [(g, x) for x in m.strip().lower().split() if len(x) >= 1]
    return ms

RTOK = re.compile(r'[А-Яа-яЁё-]+')
def highlight_ru(ru_text, ms):
    toks = list(RTOK.finditer(ru_text))
    best = None
    for g, m in ms:
        stem = m if len(m) <= 3 else m[:max(3, len(m) - 2)]
        for t in toks:
            tl = t.group().lower()
            ok = tl == m if len(m) <= 2 else tl.startswith(stem)
            # главное значение важнее более длинного совпадения
            if ok and (best is None or (-g, len(stem)) > (-best[3], best[0])):
                best = (len(stem), t.start(), t.end(), g)
    if not best: return None
    _, a, b, g = best
    return ru_text[:a] + '[' + ru_text[a:b] + ']' + ru_text[b:], g

def highlight_en(text, cands):
    for m in TOK.finditer(text):
        if m.group().lower() in cands:
            return text[:m.start()] + '[' + text[m.start():m.end()] + ']' + text[m.end():]
    return None

# пары Tatoeba с неточным переводом — не брать в примеры
BAD_EN = {'They acted immediately by agreement.'}
used = defaultdict(int)
examples = {}
for w in words:
    lw = w.lower()
    cands = {lw} | forms.get(lw, set())
    ms = meanings(ru_of[w])
    best = None
    seen = set()
    for form in [lw] + sorted(cands - {lw}):
        for eid in index.get(form, [])[:4000]:
            if eid in seen: continue
            seen.add(eid)
            text = eng[eid]
            if text in BAD_EN: continue
            toks = [t.lower() for t in TOK.findall(text)]
            rare = sum(1 for t in toks if rank.get(t.split("'")[0], 99999) > 2000 and t not in cands)
            for rid in pairs[eid]:
                rt = rus[rid]
                if len(rt) > 70 or re.search(r'[0-9A-Za-z«»"]', rt): continue
                hg = highlight_ru(rt, ms)
                hr, g = hg if hg else (None, 9)
                # пример должен показывать главное значение слова (омографы: back — «назад», а не «спина»)
                score = abs(len(toks) - 5) + rare * 3 + used[eid] * 4 + (0 if hr else 6) + (0 if form == lw else 1) + (5 if g else 0)
                if best is None or score < best[0]:
                    best = (score, eid, highlight_en(text, cands), hr or rt)
    if best and best[2]:
        used[best[1]] += 1
        examples[w] = (best[2], best[3])

# слов нет в CMUdict — транскрипция вручную
ipa.setdefault('postgraduate', 'ˌpoʊstˈɡrædʒuət'); ipa.setdefault('factorial', 'fækˈtɔːriəl')
with open('data/ipa.tsv', 'w', encoding='utf-8') as f:
    for w in words:
        if w in ipa: f.write(f'{w}\t{ipa[w]}\n')
with open('data/examples.tsv', 'w', encoding='utf-8') as f:
    for w in words:
        if w in examples: f.write(f'{w}\t{examples[w][0]}\t{examples[w][1]}\n')
print(f'транскрипций: {len(ipa)}/{len(words)}, примеров: {len(examples)}/{len(words)}, '
      f'с выделением в переводе: {sum("[" in e[1] for e in examples.values())}', file=sys.stderr)
