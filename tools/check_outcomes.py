"""Validate outcome benchmark files. Usage: python3 tools/check_outcomes.py [files...] (default: all)"""
import json, sys, glob, os, re
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from score_agent import sim_slots, sim_fields, num, transposed_y, curve_problems  # one implementation of the simulation slots
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
TESTS = {os.path.basename(f)[:-5] for f in glob.glob(f'{ROOT}/bench/tests/*/*.json')}
def check_view_layout(v, ins, b=None):
    """Optional figure keys of a view (bench/OUTCOMES.md, "Figures")."""
    e, vid = [], v.get('id')
    b = b or {}
    unit_in = {i['key']: i.get('unit') for i in b.get('inputs', [])}
    unit_out = {o['key']: o.get('unit') for o in b.get('outputs', [])}
    if 'transpose' in v:  # force-controlled tasks drawn at (measured output, applied input)
        tr = v['transpose']
        if not isinstance(tr, dict): e.append(f'view {vid}: transpose must be an object')
        else:
            tin = tr.get('y_input', tr.get('input', [])); tin = tin if isinstance(tin, list) else [tin]
            for k in tin:
                if k not in ins: e.append(f'view {vid}: transpose y_input {k} not an input')
            if not tin and not tr.get('y_values'): e.append(f'view {vid}: transpose needs y_input or y_values')
            if not isinstance(tr.get('y_values', {}), dict): e.append(f'view {vid}: transpose y_values must be an object')
            if tr.get('output') not in unit_out: e.append(f'view {vid}: transpose output {tr.get("output")} not an output')
            yo_given = tr.get('as', tr.get('y_output'))
            if yo_given is not None and yo_given not in unit_out: e.append(f'view {vid}: transpose "as" {yo_given} not an output')
            if not str(v.get('x', '')).startswith('input:'): e.append(f'view {vid}: transpose needs x "input:<key>"')
            xk = str(v.get('x', ''))[6:]
            ux, uo = unit_in.get(xk), unit_out.get(tr.get('output'))
            if ux and uo and ux != uo: e.append(f'view {vid}: transpose output unit {uo} differs from x unit {ux}')
            others = {t.get('output') for t in b.get('tasks', []) if t['id'] in set(v.get('task_ids', [])) and t.get('output') != tr.get('output')}
            yo = yo_given or (sorted(others)[0] if len(others) == 1 else None)
            for k in tin:
                ui, uy = unit_in.get(k), unit_out.get(yo)
                if ui and uy and ui != uy: e.append(f'view {vid}: transpose input {k} unit {ui} differs from y unit {uy}')
    if 'legend_notes' in v:
        skeys = {s['key'] for s in b.get('studies', [])}
        if not isinstance(v['legend_notes'], dict): e.append(f'view {vid}: legend_notes must be an object')
        else:
            for k, x in v['legend_notes'].items():
                if k not in skeys: e.append(f'view {vid}: legend_notes study {k} unknown')
                if not isinstance(x, str) or len(x) > 60: e.append(f'view {vid}: legend_notes text must be <= 60 chars')
    for k in ('note', 'x_title', 'y_title', 'title'):
        if k in v and not isinstance(v[k], str): e.append(f'view {vid}: {k} must be text')
    for k in ('series', 'legend_inputs'):
        for x in v.get(k) or []:
            if x not in ins and x != 'level': e.append(f'view {vid}: {k} key {x} not an input')
    if 'layout' in v and v['layout'] not in ('panels',): e.append(f'view {vid}: layout must be "panels"')
    if v.get('layout') == 'panels':
        if not str(v.get('x', '')).startswith('input:'): e.append(f'view {vid}: panels need x "input:<key>"')
        pb = v.get('panel_by', 'level')
        if pb != 'level' and pb not in ins: e.append(f'view {vid}: panel_by {pb} not an input')
    for k in ('panel_labels', 'panel_map'):
        if k in v and not isinstance(v[k], dict): e.append(f'view {vid}: {k} must be an object')
    if 'panels' in v and not isinstance(v['panels'], list): e.append(f'view {vid}: panels must be a list')
    for k in ('share_y', 'share_x'):
        if k in v and not isinstance(v[k], bool): e.append(f'view {vid}: {k} must be true/false')
    if 'columns' in v and v['columns'] not in (1, 2, 3, 4): e.append(f'view {vid}: columns must be 1-4')
    for k in ('x_min', 'x_max'):
        if k in v and not isinstance(v[k], (int, float)): e.append(f'view {vid}: {k} must be a number')
    if 'group' in v and (not isinstance(v['group'], str) or len(v['group']) > 40): e.append(f'view {vid}: group must be text <= 40 chars')
    for m in v.get('models') or []:
        if not isinstance(m, dict) or m.get('test_id') not in TESTS: e.append(f'view {vid}: models entry needs a known test_id')
    return e
SIM_KEYS = {'id', 'title', 'note', 'sweep', 'fixed', 'outputs', 'task_ids', 'transpose', 'curve_by', 'study_notes',
            'monotone', 'curve_ok', 'hull'}
def check_sims(b, ins, outs):
    """agent_sims (bench/OUTCOMES.md, "Simulations"): every task in exactly one simulation, consistent fixed inputs,
    outputs and sweep; answer_format has one entry per simulation."""
    e, sims = [], b.get('agent_sims')
    if b['domain'] == 'msk':
        return ['agent_sims: MSK cards stay task by task'] if sims else []
    if not isinstance(sims, list) or not sims:
        return ['agent_sims missing (FE and tissue cards are answered per simulation)']
    tids = {t['id'] for t in b['tasks']}
    tasks = {t['id']: t for t in b['tasks']}
    seen, ids = {}, set()
    for s in sims:
        sid = s.get('id') if isinstance(s, dict) else None
        if not sid or not re.fullmatch(r'[a-z0-9_]+', str(sid)): e.append(f'sim {sid}: id must be [a-z0-9_]+'); continue
        if sid in ids: e.append(f'sim {sid}: duplicate id')
        ids.add(sid)
        for k in s:
            if k not in SIM_KEYS: e.append(f'sim {sid}: unknown key {k}')
        if not s.get('title') or len(s['title']) > 100: e.append(f'sim {sid}: title missing or > 100 chars')
        sw = s.get('sweep')
        if sw is not None and sw not in ins: e.append(f'sim {sid}: sweep {sw} not an input')
        fx = s.get('fixed')
        if not isinstance(fx, dict): e.append(f'sim {sid}: fixed must be an object'); fx = {}
        for k in fx:
            if k not in ins: e.append(f'sim {sid}: fixed key {k} not an input')
        if not s.get('task_ids'): e.append(f'sim {sid}: no task_ids')
        for f in sim_fields(s):
            if f != 'level' and f not in ins: e.append(f'sim {sid}: output field {f} not an input')
        for o in s.get('outputs') or []:
            if o.get('key') not in outs: e.append(f'sim {sid}: output {o.get("key")} not in outputs')
        tr = s.get('transpose')
        if tr is not None and (not isinstance(tr, dict) or tr.get('as') not in outs or tr.get('output') not in outs):
            e.append(f'sim {sid}: transpose needs {{output, as, y_input}} with known outputs')
        for k in s.get('curve_by') or []:
            if k not in ins: e.append(f'sim {sid}: curve_by key {k} not an input')
        for tid in s.get('task_ids') or []:
            if tid not in tids: continue
            if tid in seen: e.append(f'task {tid} in sims {seen[tid]} and {sid}')
            seen[tid] = sid
            t = tasks[tid]
            for k, v in fx.items():
                if t['inputs'].get(k) != v: e.append(f'sim {sid}: task {tid} {k}={t["inputs"].get(k)!r} differs from fixed')
        try:
            slots = sim_slots(b, s)
        except (ValueError, KeyError) as x:
            e.append(str(x)); continue
        mo = s.get('monotone')
        dirs = list(mo.values()) if isinstance(mo, dict) else [mo]
        if mo is not None and not all(d is True or d in ('rising', 'falling') for d in dirs):
            e.append(f'sim {sid}: monotone must be true, "rising", "falling" or {{output: direction}}')
        if isinstance(mo, dict):
            known = {sl['id'] for sl in slots} | {sl['key'] for sl in slots}
            for k in mo:
                if k not in known: e.append(f'sim {sid}: monotone names unknown output {k}')
        if s.get('hull') is not None and not isinstance(s['hull'], bool): e.append(f'sim {sid}: hull must be true/false')
        ok = s.get('curve_ok') or {}
        if not isinstance(ok, dict) or not all(isinstance(v, str) and v.strip() for v in ok.values()):
            e.append(f'sim {sid}: curve_ok must be {{curve or study: reason}}'); ok = {}
        # curve check (score_agent.curve_problems): repeated x inside one curve; for rising / falling outputs a > 40 %
        # step against the direction (e.g. a point after failure) or a curve ending on the wrong side of its start.
        # Fix the data, or whitelist the curve (its name as reported, or the study id) in curve_ok with a reason.
        for sl in slots:
            for name, msg in curve_problems(sl, s):
                if name not in ok and name.split(' | ')[0] not in ok:
                    e.append(f'sim {sid}: curve {name} ({sl["id"]}): {msg}')
        for sl in slots:
            if not sl['tasks']: e.append(f'sim {sid}: output {sl["id"]} has no task')
            if sw and not sl['scalar']:
                for t in sl['tasks']:
                    if transposed_y(s, t) is None and (tr is None or t['output'] != tr.get('output')) \
                            and num(t['inputs'].get(sw)) is None:
                        e.append(f'sim {sid}: task {t["id"]} has no numeric {sw} (mark its output scalar?)')
                    if tr and t['output'] == tr.get('output') and transposed_y(s, t) is None:
                        e.append(f'sim {sid}: transposed task {t["id"]} has no load value')
    for tid in sorted(tids - set(seen)): e.append(f'task {tid} in no simulation')
    af = b.get('answer_format') or {}
    if set(af) != ids: e.append(f'answer_format must have one entry per simulation ({len(af)} keys, {len(ids)} sims)')
    return e
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
        e += check_view_layout(v, ins, b)
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
        if 'agent_sims' not in b and t['id'] not in b['answer_format']: e.append(f'answer_format missing {t["id"]}')
    for s in skeys - used: e.append(f'study {s} has no refs')
    listed = {t for v in b['views'] for t in v['task_ids']}
    for t in tids:
        if t not in listed: e.append(f'task {t}: not in any view')
    e += check_sims(b, ins, outs)
    for pair in b.get('shared', []):
        for k in pair:
            if k not in skeys: e.append(f'shared: unknown study {k}')
    return e
files = sys.argv[1:] or sorted(glob.glob(f'{ROOT}/bench/outcomes/*.json'))
bad = 0
for f in files:
    errs = check(f)
    b = json.load(open(f))
    ns = len(b.get('agent_sims') or [])
    print(f'{"OK " if not errs else "ERR"} {os.path.basename(f)}: {len(b.get("tasks", []))} tasks'
          + (f' in {ns} simulations' if ns else '') + f', {len(b.get("studies", []))} studies')
    for x in errs[:30]: print('    -', x)
    bad += bool(errs)
sys.exit(1 if bad else 0)
