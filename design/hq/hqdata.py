#!/usr/bin/env python3
"""HC2 HQ data builder (card q-hq-sections): turns the repo into the documents HQ's Versions and Loose Ends read.

HQ (Luca's claude.ai page) can't read the repo: it's private. So the taskmaster / the 2-hourly check runs this and
writes the output into HQ's database with ArtifactData (design/hq/README.md says when and how).

  python3 design/hq/hqdata.py gifs                          the preview GIFs Versions shows (upload these to HQ's assets)
  python3 design/hq/hqdata.py versions OUT [--gifs MAP]     docs/CHANGELOG.txt -> OUT/versions/<id>.json, one per version
  python3 design/hq/hqdata.py loose OUT REPORT.md...        "Loose ends from the co-designer" notes -> OUT/loose/<id>.json

MAP is a JSON file {"docs/previews/pr36-save-clash.gif": "<the url the asset upload returned>", ...}; a GIF missing
from it is left out (HQ never links the private repo). Each run also writes OUT/<kind>-writes.json: the `writes` list
for one ArtifactData batch (set for versions; loose ends are new ones only, see README). Plain Python 3, no packages.
"""
import json, os, re, sys, time

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
HEAD = re.compile(r'^(?:HC2 WEB GAME - )?(v\d+\.\d+(?:\.\d+)?)\b(.*)$')
WHATS_NEW = re.compile(r"^WHAT'S NEW IN (v\d+\.\d+(?:\.\d+)?)\s*$")
# a line that isn't a version but starts another changelog block (e.g. "TEST LAB + TOOLS (24 Oct, game still v0.9.7)")
OTHER = re.compile(r'^[A-Z][A-Z0-9 +&/\'-]{5,}(\(|$)')


def prs_in(text):
    out = []
    for a, b in re.findall(r'#(\d+)(?:\s*-\s*#(\d+))?', text):
        a = int(a); out += list(range(a, int(b) + 1)) if b and int(b) > a and int(b) - a < 20 else [a]
    return sorted(set(out), key=out.index)


def tasks_in(text):
    seen = []
    for t in re.findall(r'\bt-\d{3}\b', text):
        if t not in seen: seen.append(t)
    return seen


def split_head(rest):
    """' (25 Oct) - HEADLINE (PRs #36, #37, Luca's OK)' -> date, headline, note, ok."""
    rest = rest.strip()
    name = ''
    m = re.match(r'^"([^"]+)"\s*', rest)
    if m: name, rest = m.group(1), rest[m.end():]
    date = ''
    m = re.match(r'^\(([^)]*)\)\s*', rest)
    if m: date, rest = m.group(1), rest[m.end():]
    rest = re.sub(r'^[-:]\s*', '', rest).strip()
    headline, note = rest, ''
    i = rest.find(' (')
    if i > 0: headline, note = rest[:i], rest[i + 2:].rstrip(')').strip()
    if name: headline = name + (' · ' + headline if headline else '')
    if not re.sub(r"PRs?|#\d+|(?:Luca's|the co-designer's|Friend's) OK(?: \d\d:\d\d)?|[\s,+&-]|and", '', note): note = ''   # only repeats the chips
    ok = ''
    m = re.search(r"((?:Luca's|the co-designer's|Friend's) OK(?: \d\d:\d\d)?)", rest)
    if m: ok = m.group(1)
    return date, headline.strip(), note, ok


def parse_changelog(path):
    lines = open(path, encoding='utf-8').read().splitlines()
    entries, cur = [], None
    for ln in lines:
        m, w = HEAD.match(ln), WHATS_NEW.match(ln)
        if m or w:
            cur = {'ver': (m or w).group(1), 'head': m.group(2) if m else '', 'body': [], 'inhead': bool(m)}
            entries.append(cur); continue
        if cur is None: continue
        if not ln.strip():
            cur['inhead'] = False; continue
        if OTHER.match(ln) and not ln.startswith('-') and not ln.isupper():
            cur = None; continue            # a non-version block (Test Lab + tools, the old README parts)
        # the headline runs on when a bracket is still open ("(Luca 02:50: "add the sliders from") or the line is indented
        if cur['inhead'] and not ln.startswith('- ') and (cur['head'].count('(') > cur['head'].count(')') or ln.startswith('  ')):
            cur['head'] += ' ' + ln.strip(); continue
        cur['inhead'] = False
        cur['body'].append(ln)
    out = []
    for e in entries:
        bullets, group = [], ''
        for ln in e['body']:
            s = ln.rstrip()
            if s.startswith('- '): bullets.append((group + ': ' if group else '') + s[2:].strip())
            elif s.startswith('  ') and bullets: bullets[-1] += ' ' + s.strip()
            elif s.isupper() or re.match(r'^[A-Z][A-Z /&+()\'-]+$', s): group = s.strip().title()   # WHAT CHANGED, KNOWN / TO TUNE
            else: bullets.append(s.strip())
        date, headline, note, ok = split_head(e['head'])
        if not bullets and len(headline + note) > 70:   # the old one-paragraph entries: the paragraph is the change
            full = headline + (' (' + note + ')' if note else '')
            bullets, note = [full], ''
            cut = re.split(r':|\s-\s|\(', full)[0].strip()
            headline = cut if 3 <= len(cut) <= 60 else full[:57].rstrip() + '…'
        out.append({'ver': e['ver'], 'date': date, 'headline': headline, 'note': note, 'ok': ok,
                    'prs': prs_in(e['head']), 'tasks': tasks_in(e['head']), 'bullets': bullets})
    return out   # newest first, as in the file


def preview_gifs():
    d = os.path.join(ROOT, 'docs', 'previews'); by = {}
    for f in sorted(os.listdir(d)):
        m = re.match(r'^pr(\d+)-.*\.gif$', f)
        if m: by.setdefault(int(m.group(1)), []).append('docs/previews/' + f)
    return by


def ver_id(v): return v.replace('.', '-')


def build_versions(out, gifmap):
    vs, gifs = parse_changelog(os.path.join(ROOT, 'docs', 'CHANGELOG.txt')), preview_gifs()
    g = lambda p: {'path': p, 'url': gifmap[p]} if p in gifmap else None
    seen_ids, docs = set(), []
    for i, v in enumerate(vs):
        vid = ver_id(v['ver'])
        while vid in seen_ids: vid += '-b'   # two old entries share v0.6.2: keep both
        seen_ids.add(vid)
        used, bl = set(), []
        for b in v['bullets']:
            bp = prs_in(b); used.update(bp)
            bl.append({'text': b, 'prs': bp, 'tasks': tasks_in(b), 'gifs': [x for p in bp for x in map(g, gifs.get(p, [])) if x]})
        rest = [x for p in v['prs'] if p not in used for x in map(g, gifs.get(p, [])) if x]
        tasks = v['tasks'] + [t for b in bl for t in b['tasks'] if t not in v['tasks']]
        docs.append((vid, {'ver': v['ver'], 'n': len(vs) - i, 'date': v['date'], 'headline': v['headline'], 'note': v['note'],
                           'prs': v['prs'] or sorted({p for b in bl for p in b['prs']}), 'tasks': tasks, 'ok': v['ok'],
                           'bullets': bl, 'gifs': rest, 'play': None}))
    return write(out, 'versions', docs, 'set')


WHO = {'luca': 'luca', 'you': 'co-designer', 'co-designer': 'co-designer', 'the co-designer': 'co-designer',
       'taskmaster': 'taskmaster', 'the taskmaster': 'taskmaster', 'worker-l': 'worker-l', 'worker-f': 'worker-f'}


def slug(s): return re.sub(r'-+', '-', re.sub(r'[^a-z0-9]+', '-', s.lower())).strip('-')[:60].rstrip('-') or 'loose'


def build_loose(out, reports):
    docs, seen = [], set()
    for rp in reports:
        txt = open(rp, encoding='utf-8').read()
        if 'Loose ends from the co-designer' not in txt: continue
        m = re.search(r'^sent: (\d{4})-(\d\d)-(\d\d) (\d\d):(\d\d)', txt, re.M)
        found = int(time.mktime(time.strptime(' '.join(m.groups()), '%Y %m %d %H %M')) * 1000) if m else int(time.time() * 1000)
        for blk in re.split(r'^### \d+\.\s*', txt, flags=re.M)[1:]:
            title = blk.splitlines()[0].strip()
            why = re.search(r'^- Why it matters:\s*(.*)$', blk, re.M)
            cl = re.search(r'^- What closes it:\s*(.*?)\s*(?:\(who:\s*([^)]*)\))?\s*$', blk, re.M)
            did = slug(title)
            if did in seen: continue     # the same loose end sent twice
            seen.add(did)
            docs.append((did, {'title': title, 'why': why.group(1).strip() if why else '', 'closes': cl.group(1).strip() if cl else '',
                               'who': WHO.get((cl.group(2) or '').strip().lower(), '') if cl else '', 'status': 'open', 'source': 'co-designer',
                               'check': 0, 'from': 'agents/reports/' + os.path.basename(rp), 'foundAt': found, 'card': '',
                               'closedBy': None, 'closedAt': 0, 'closeNote': '', 'log': []}))
    return write(out, 'loose', docs, 'set')


def write(out, coll, docs, op):
    os.makedirs(os.path.join(out, coll), exist_ok=True); writes = []
    for did, d in docs:
        p = os.path.join(out, coll, did + '.json'); json.dump(d, open(p, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
        writes.append({'op': op, 'collection': coll, 'doc_id': did, 'file_path': os.path.abspath(p)})
    json.dump(writes, open(os.path.join(out, coll + '-writes.json'), 'w'), indent=1)
    print(f'{coll}: {len(docs)} docs in {out}/{coll}/ (batch: {out}/{coll}-writes.json)')


if __name__ == '__main__':
    a = sys.argv[1:]
    if a[:1] == ['gifs']:
        for ps in preview_gifs().values(): print('\n'.join(ps))
    elif a[:1] == ['versions'] and len(a) >= 2:
        gm = json.load(open(a[a.index('--gifs') + 1])) if '--gifs' in a else {}
        build_versions(a[1], gm)
    elif a[:1] == ['loose'] and len(a) >= 3:
        build_loose(a[1], a[2:])
    else:
        print(__doc__); sys.exit(1)
