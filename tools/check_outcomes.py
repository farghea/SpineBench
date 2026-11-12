"""Validate outcome benchmark files. Usage: python3 tools/check_outcomes.py [files...] (default: all)"""
import json, sys, glob, os
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TESTS = {os.path.basename(f)[:-5] for f in glob.glob(f'{ROOT}/bench/tests/*/*.json')}
REQ = ['id', 'title', 'domain', 'region', 'levels', 'summary', 'simulate', 'inputs', 'outputs', 'studies', 'views', 'tasks', 'agent_prompt', 'answer_format']
def check(path):
    e = []; b = json.load(open(path))
    for k in REQ:
        if k not in b: e.append(f'missing {k}')
    if e: return e
    if b['domain'] not in ('msk', 'fe', 'tissue'): e.append('domain must be msk|fe|tissue')
    if len(b['summary'].split()) > 25: e.append('summary > 25 words')
    if len(b['simulate']) > 5: e.append('simulate > 5 steps')
    skeys = {s['key'] for s in b['studies']}
    for s in b['studies']:
        for k in ('key', 'short', 'year', 'n'):
            if k not in s: e.append(f'study {s.get("key")} missing {k}')
        if s.get('n') is not None and not isinstance(s['n'], int): e.append(f'study {s["key"]} n not int')
    used = set()
    outs = {o['key'] for o in b['outputs']}; ins = {i['key'] for i in b['inputs']}
    vids = {v['id'] for v in b['views']}
    tids = [t['id'] for t in b['tasks']]
    if len(tids) != len(set(tids)): e.append('duplicate task ids')
    for v in b['views']:
        for t in v['task_ids']:
            if t not in tids: e.append(f'view {v["id"]}: unknown task {t}')
        if v['x'] != 'task' and not (v['x'].startswith('input:') and v['x'][6:] in ins): e.append(f'view {v["id"]}: bad x {v["x"]}')
    for t in b['tasks']:
        if t.get('output') not in outs: e.append(f'task {t["id"]}: output not in outputs')
        if t.get('view') and t['view'] not in vids: e.append(f'task {t["id"]}: unknown view')
        if len(t.get('label', '')) > 40: e.append(f'task {t["id"]}: label > 40 chars')
        for k in t.get('inputs', {}):
            if k not in ins: e.append(f'task {t["id"]}: input {k} not declared')
        if not t.get('refs'): e.append(f'task {t["id"]}: no refs')
        for r in t.get('refs', []):
            used.add(r.get('study'))
            if r.get('study') not in skeys: e.append(f'task {t["id"]}: unknown study {r.get("study")}')
            if r.get('test_id') not in TESTS: e.append(f'task {t["id"]}: unknown test_id {r.get("test_id")}')
            if r.get('stat') not in ('mean', 'median', 'value'): e.append(f'task {t["id"]}: stat must be mean|median|value')
            if not any(isinstance(r.get(k), (int, float)) for k in ('mean', 'median')): e.append(f'task {t["id"]}: ref without mean/median')
        if t['id'] not in b['answer_format']: e.append(f'answer_format missing {t["id"]}')
    for s in skeys - used: e.append(f'study {s} has no refs')
    for pair in b.get('shared', []):
        for k in pair:
            if k not in skeys: e.append(f'shared: unknown study {k}')
    return e
files = sys.argv[1:] or sorted(glob.glob(f'{ROOT}/bench/outcomes/*.json'))
bad = 0
for f in files:
    errs = check(f)
    b = json.load(open(f))
    print(f'{"OK " if not errs else "ERR"} {os.path.basename(f)}: {len(b.get("tasks", []))} tasks, {len(b.get("studies", []))} studies')
    for x in errs[:30]: print('    -', x)
    bad += bool(errs)
sys.exit(1 if bad else 0)
