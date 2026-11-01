#!/usr/bin/env python3
"""Strike Barge HQ (the spaceship HQ, Luca 31 Oct): rebuild its data snapshot from HQ's database.
A separate artifact can't read HQ's database, so the page carries a snapshot.
  1. ArtifactData list HQ (https://claude.ai/artifact/PtvBPpqTta99vWSSfSBoX4) collections versions, tasks (limit 300)
     and hud, each with out_dir=$T
  2. python3 design/hq/ship.py $T > $T/strike-barge.html
  3. Artifact publish file_path=$T/strike-barge.html to https://claude.ai/artifact/2CLY3PHHuAGDiXAf3C1n4q
"""
import json, glob, os, sys, time
T = sys.argv[1]
def docs(c):
    for f in sorted(glob.glob(os.path.join(T, c, '*.json'))):
        d = json.load(open(f)); d.setdefault('id', os.path.basename(f)[:-5]); yield d
def short(t):
    return t.split(':')[0][:60] if ':' in t[:70] else t[:60]
V = sorted(({'v': d['ver'], 'n': d['n'], 'd': d.get('date', ''), 'h': d.get('headline', ''),
             'b': [short(b.get('text', '')) for b in d.get('bullets', [])][:8], 'p': d.get('prs', [])} for d in docs('versions')), key=lambda x: x['n'])
K = [{'id': d['id'], 't': d.get('title', '')[:90], 's': d.get('status', ''), 'o': d.get('owner') or '', 'u': d.get('updatedAt', 0)}
     for d in docs('tasks') if d.get('status') not in ('done', 'dropped')]
H = [{k: d.get(k) for k in ('id', 'who', 'doing', 'state', 'card', 'pr', 'at')} for d in docs('hud')]
snap = json.dumps({'at': int(time.time() * 1000), 'versions': V, 'tasks': K, 'hud': H}, separators=(',', ':')).replace('</', '<\\/')
page = open(os.path.join(os.path.dirname(__file__), 'strike-barge.html')).read()
sys.stdout.write(page.replace('/*SNAP*/null', snap))
