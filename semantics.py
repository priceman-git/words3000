#!/usr/bin/env python3
"""Части речи и «близкие» слова для вариантов ответа.

Запуск (нужен nltk с корпусом wordnet):
    python semantics.py <папка с исходниками>
В папке: eng_sentences.tsv (Tatoeba) и nltk_data/ с корпусом wordnet.

Результат:
  data/pos.tsv   слово \\t часть речи (n, v, a, r, pron, prep, conj, det, num, int, modal)
  data/near.tsv  слово \\t близкие слова той же части речи через пробел (лучшие первыми)

Близость = WordNet (общий «родитель» по Wu–Palmer: собака ~ кошка; антонимы и смысловые группы прилагательных)
+ ассоциации из корпуса Tatoeba (слова, которые часто встречаются в одном предложении: врач ~ больница).
Синонимы (общий синсет) и слова с совпадающим русским переводом исключаются — иначе правильных ответов будет два.
"""
import json, math, re, sys
from collections import Counter, defaultdict

SRC = sys.argv[1] if len(sys.argv) > 1 else '.'
import nltk
nltk.data.path.insert(0, f'{SRC}/nltk_data')
from nltk.corpus import wordnet as wn

src = open('words.js', encoding='utf-8').read()
W = json.loads(src[src.index('['):src.rindex(']') + 1])
EN = [w[0] for w in W]
IDX = {w.lower(): k for k, w in enumerate(EN)}

# ---------------- части речи ----------------

FUNC = {
    'modal': 'can could may might must shall should will would ought',
    'pron': 'i you he she it we they me him her us them my your his its our their mine yours hers ours theirs myself yourself '
            'himself herself itself ourselves themselves this that these those who whom whose what which someone anyone everyone '
            'nobody somebody anybody everybody something anything nothing everything whoever whatever another other',
    'prep': 'of to in on at by for with about into from over under after before between through during without within against '
            'among around behind below above across along toward towards near beside besides upon onto off via despite except '
            'per beneath underneath throughout beyond alongside unlike up down out',
    'conj': 'and but or nor if because although though while whether unless than since until till whenever wherever as',
    'det': 'all some any many much more most each every both few several no either neither enough less least such',
    'num': 'one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen '
           'eighteen nineteen twenty thirty forty fifty sixty seventy eighty ninety hundred thousand million billion '
           'first second third fourth fifth sixth tenth half',
    'int': 'oh yeah hey hi wow bye hello goodbye okay yes please thanks sorry alright',
}
FUNC_OF = {}
for cat, words in FUNC.items():
    for w in words.split():
        FUNC_OF.setdefault(w, cat)

def first_ru(ru):
    m = re.sub(r'\(.*?\)', '', ru).split(',')[0].strip().lower().split()
    return m[0] if len(m) == 1 else ''   # «реактивный самолёт» — не прилагательное

ADJ_RU = re.compile(r'(ый|ий|ой|ая|яя|ое|ее|ые|ие)$')
def wn_counts(w):
    c = Counter()
    for s in wn.synsets(w):
        p = {'s': 'a'}.get(s.pos(), s.pos())
        c[p] += sum(l.count() for l in s.lemmas() if l.name().lower() == w) + 0.5
    return c

# самая частая часть речи в живой речи (SUBTLEX-US)
SX_TAG = {'Noun': 'n', 'Verb': 'v', 'Adjective': 'a', 'Adverb': 'r'}
SX = {}
for l in list(open('data/freq/subtlex_us_pos.tsv', encoding='utf-8'))[1:]:
    f = l.rstrip('\n').split('\t')
    try: SX[f[0].lower()] = (SX_TAG.get(f[2]), float(f[3]))
    except (IndexError, ValueError): pass

def pos_of(k):
    en, ru, verb = EN[k].lower(), W[k][1], W[k][5]
    if en in FUNC_OF: return FUNC_OF[en]
    if verb: return 'v'
    fr = first_ru(ru)
    c = wn_counts(en)
    if ADJ_RU.search(fr) and (c['a'] or not c): return 'a'
    sx, share = SX.get(en, (None, 0))
    if sx in ('n', 'r') and share >= 0.5: return sx   # перевод не глагол и не прилагательное — берём SUBTLEX (how, why, today → наречие)
    if c['r'] and (en.endswith('ly') or c['r'] >= max(c['n'], c['a'], c['v'])) and not ADJ_RU.search(fr): return 'r'
    if c['n']: return 'n'
    if c['a']: return 'a'
    if c['r']: return 'r'
    if c['v']: return 'v'
    return 'n'

# ручные исправления, где автоматика ошибается (перевод-фраза или редкое значение в WordNet)
POS_FIX = {'back': 'n', 'none': 'det', 'overall': 'r', 'anytime': 'r', 'according': 'r', 'nearby': 'r', 'folk': 'a'}
for line in open('data/primary.txt', encoding='utf-8'):   # части речи омографов по главному значению
    f = [x.strip() for x in line.rstrip('\n').split('|')]
    if not line.startswith('#') and len(f) > 2 and f[2]: POS_FIX[(f[3] if len(f) > 3 and f[3] else f[0]).lower()] = f[2]
POS = [POS_FIX.get(EN[k].lower()) or pos_of(k) for k in range(len(W))]
WNPOS = {'n': wn.NOUN, 'v': wn.VERB, 'a': wn.ADJ, 'r': wn.ADV}

# ---------------- смысловая близость по WordNet ----------------

def top_synsets(k, n=3):
    p = POS[k]
    if p not in WNPOS: return []
    ss = wn.synsets(EN[k].lower(), pos=WNPOS[p])
    if p == 'a': ss = ss or wn.synsets(EN[k].lower(), pos='s')
    return ss[:n]

SYN = [top_synsets(k) for k in range(len(W))]

def ancestors(s):
    d = {}
    for path in s.hypernym_paths():
        for depth, a in enumerate(path, 1):
            d[a] = max(d.get(a, 0), depth)
    return d, max(len(p) for p in s.hypernym_paths())

ANC = [[ancestors(s) for s in SYN[k]] if POS[k] in ('n', 'v') else [] for k in range(len(W))]

def wup(a, b):
    best = 0.0
    for da, la in ANC[a]:
        for db, lb in ANC[b]:
            common = da.keys() & db.keys()
            if not common: continue
            d = max(min(da[c], db[c]) for c in common)
            best = max(best, 2 * d / (la + lb))
    return best

def adj_group(k):
    """смысловая группа прилагательного/наречия: сам синсет, похожие, антонимы"""
    g, ant = set(), set()
    for s in SYN[k]:
        base = [s] + s.similar_tos()
        for b in base:
            g.add(b); g.update(b.similar_tos())
            for l in b.lemmas():
                for an in l.antonyms():
                    ant.add(an.synset()); ant.update(an.synset().similar_tos())
                for pt in l.pertainyms():   # наречие → прилагательное
                    g.add(pt.synset())
    return g, ant

GROUP = [adj_group(k) if POS[k] in ('a', 'r') else (set(), set()) for k in range(len(W))]

def synonyms(a, b):
    sa, sb = set(SYN[a]), set(SYN[b])
    return bool(sa & sb)

def ru_stems(k):
    out = set()
    for m in re.split(r'[,;]', re.sub(r'\(.*?\)', '', W[k][1])):
        for w in m.strip().lower().split():
            if len(w) >= 3: out.add(w[:max(3, len(w) - 2)])
    return out
STEMS = [ru_stems(k) for k in range(len(W))]
def ru_overlap(a, b):
    return any(x.startswith(y) or y.startswith(x) for x in STEMS[a] for y in STEMS[b])

# ---------------- ассоциации из корпуса ----------------

form = {}
for line in open('data/freq/lemma.txt', encoding='utf-8'):
    if line.startswith(';') or '->' not in line: continue
    h, f = line.split('->'); lemma = h.strip().split('/')[0]
    for x in f.strip().split(','):
        form.setdefault(x.strip(), lemma)

TOK = re.compile(r"[a-z]+")
cnt, pair, N = Counter(), Counter(), 0
for line in open(f'{SRC}/eng_sentences.tsv', encoding='utf-8'):
    p = line.rstrip('\n').split('\t')
    if len(p) != 3: continue
    toks = TOK.findall(p[2].lower())
    if not 3 <= len(toks) <= 20: continue
    ids = set()
    for t in toks:
        k = IDX.get(t)
        if k is None: k = IDX.get(form.get(t, ''))
        if k is not None and POS[k] in ('n', 'v', 'a', 'r'): ids.add(k)
    if not ids: continue
    N += 1
    ids = sorted(ids)
    for k in ids: cnt[k] += 1
    for x in range(len(ids)):
        for y in range(x + 1, len(ids)):
            pair[(ids[x], ids[y])] += 1

def npmi(a, b):
    c = pair.get((a, b) if a < b else (b, a), 0)
    if c < 3: return 0.0
    pmi = math.log(c * N / (cnt[a] * cnt[b]))
    return max(0.0, pmi / -math.log(c / N))

# ---------------- подбор близких слов ----------------

by_pos = defaultdict(list)
for k, p in enumerate(POS): by_pos[p].append(k)

near = {}
for k in range(len(W)):
    p = POS[k]
    scored = []
    for j in by_pos[p]:
        if j == k or synonyms(k, j) or ru_overlap(k, j): continue
        if EN[j].lower().startswith(EN[k].lower()[:4]) and len(EN[k]) > 4: continue   # однокоренные: act/action
        if p in ('n', 'v'):
            w = wup(k, j)
            if p == 'v' and w >= 0.8: continue   # слишком близкие глаголы — почти синонимы (think / regard)
            s = w + 0.5 * npmi(k, j)
        elif p in ('a', 'r'):
            g, ant = GROUP[k]
            sj = set(SYN[j])
            if sj & g and not sj & ant: continue   # «похожие» прилагательные — почти синонимы (angry / mad)
            s = (0.9 if sj & ant else 0.0) + 0.8 * npmi(k, j)
        else:   # служебные слова: вся категория уже «близкая», ассоциации — по частоте рядом
            s = 0.5 + 0.5 / (1 + abs(k - j) / 300)
        if s > 0: scored.append((s, j))
    scored.sort(reverse=True)
    near[k] = [j for s, j in scored[:12]]

with open('data/pos.tsv', 'w', encoding='utf-8') as f:
    for k in range(len(W)): f.write(f'{EN[k]}\t{POS[k]}\n')
with open('data/near.tsv', 'w', encoding='utf-8') as f:
    for k in range(len(W)): f.write(EN[k] + '\t' + ' '.join(EN[j] for j in near[k]) + '\n')

print('части речи:', Counter(POS).most_common(), file=sys.stderr)
print('слов, у кого меньше 3 близких:', sum(len(v) < 3 for v in near.values()), file=sys.stderr)
