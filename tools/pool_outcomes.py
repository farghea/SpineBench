"""Add n-weighted pooled values to each task (shared samples counted once; medians not pooled).
Usage: python3 tools/pool_outcomes.py   (rewrites bench/outcomes/*.json in place: task['pooled'])"""
import json, glob, os, math
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
for f in sorted(glob.glob(f'{ROOT}/bench/outcomes/*.json')):
    b = json.load(open(f))
    shared = [set(p) for p in b.get('shared', [])]
    for t in b['tasks']:
        nopool = {s['key'] for s in b['studies'] if s.get('pool') is False}
        refs = [r for r in t['refs'] if r.get('stat') in ('mean', 'value') and isinstance(r.get('mean'), (int, float))
                and r['study'] not in nopool and not r.get('exclude_from_pool')]
        # several individual values from one study (e.g. per-subject rows) -> one study-level ref
        by = {}
        for r in refs: by.setdefault(r['study'], []).append(r)
        refs = []
        for st, rs in by.items():
            if len(rs) == 1: refs.append(rs[0]); continue
            vals = [r['mean'] for r in rs]; mu = sum(vals) / len(vals)
            individuals = all((r.get('n') in (None, 1)) and not isinstance(r.get('sd'), (int, float)) for r in rs)
            if individuals:   # per-subject values -> study mean, SD across subjects
                sdv = (sum((v - mu) ** 2 for v in vals) / (len(vals) - 1)) ** 0.5
                refs.append({'study': st, 'mean': mu, 'sd': sdv, 'n': len(rs), 'stat': 'mean'})
            else:             # same subjects reported twice (e.g. left/right) -> average, n counted once
                sds = [r['sd'] for r in rs if isinstance(r.get('sd'), (int, float))]
                refs.append({'study': st, 'mean': mu, 'sd': sum(sds) / len(sds) if sds else None,
                             'n': max((r.get('n') or 1) for r in rs), 'stat': 'mean'})
        # one ref per study (first), drop a study whose sample overlaps one already counted
        seen, use = set(), []
        for r in refs:
            s = r['study']
            if s in seen or any(s in p and (p - {s}) & seen for p in shared): continue
            seen.add(s); use.append(r)
        if len(use) < 2: t.pop('pooled', None); continue
        ns = [r.get('n') or 1 for r in use]; N = sum(ns)
        m = sum(n * r['mean'] for n, r in zip(ns, use)) / N
        ss = sum((n - 1) * (r['sd'] ** 2) for n, r in zip(ns, use) if isinstance(r.get('sd'), (int, float)))
        ss += sum(n * (r['mean'] - m) ** 2 for n, r in zip(ns, use))
        sd = math.sqrt(ss / (N - 1)) if N > 1 else None
        t['pooled'] = {'mean': round(m, 4), 'sd': round(sd, 4) if sd is not None else None, 'N': N, 'k': len(use),
                       'studies': [r['study'] for r in use]}
    json.dump(b, open(f, 'w'), indent=2, ensure_ascii=False)
    print(os.path.basename(f), sum('pooled' in t for t in b['tasks']), 'pooled tasks')
