"""Normalise combine_group ids and rebuild bench/groups/ from the tests.
Run: python3 tools/normalize.py [--apply]"""
import json, glob, re, sys, os, collections
APPLY = '--apply' in sys.argv
B = os.path.join(os.path.dirname(__file__), '..', 'bench')

def norm(g):
    if not g: return g
    g = g.strip().lower()
    g = re.sub(r'(\d)p(\d)', r'\1_\2', g)          # 7p5nm -> 7_5nm
    parts = g.split('__')
    parts = [re.sub(r'[^a-z0-9_]+', '_', p).strip('_') for p in parts]
    parts = [re.sub(r'_+', '_', p) or 'none' for p in parts]
    return '__'.join(parts)


ABBR = {'idp_abs': 'Absolute IDP', 'idp_rel': 'Relative IDP', 'idp': 'IDP', 'rom': 'ROM', 'nz': 'Neutral zone', 'ez': 'Elastic zone',
        'lp_ratio': 'Lumbar/pelvis ratio', 'mvc': 'MVC', 'emg': 'EMG', 'csa': 'CSA', 'pcsa': 'PCSA', 'fsu': 'FSU', 'ct': 'CT', 'mri': 'MRI',
        'ribcage': 'rib cage', 'lbp': 'LBP', 'ap': 'AP', 'ml': 'ML', 'fe': 'FE', 'lb': 'LB', 'ar': 'AR'}
def nice_tok(tok):
    if tok in ('none', 'no_load', ''): return ''
    if tok in ABBR: return ABBR[tok]
    tok = re.sub(r'\b([tlcs])(\d+)_([tlcs])(\d+)\b', lambda m: f"{m[1].upper()}{m[2]}-{m[3].upper()}{m[4]}", tok)
    tok = re.sub(r'\b(\d+)_(\d+)nm\b', r'\1.\2 Nm', tok); tok = re.sub(r'\b(\d+)nm\b', r'\1 Nm', tok)
    tok = re.sub(r'\b(\d+)_(\d+)kg\b', r'\1.\2 kg', tok); tok = re.sub(r'\b(\d+)n\b', r'\1 N', tok)
    words = [ABBR.get(w, w) for w in tok.split('_')]
    out = ' '.join(words)
    return out[:1].upper() + out[1:]
def nice_title(gid):
    parts = gid.split('__')[1:]
    return ' · '.join(p for p in (nice_tok(t) for t in parts) if p)

tests = {}
for f in glob.glob(f'{B}/tests/*/*.json'):
    tests[f] = json.load(open(f))
old_groups = {}
for f in glob.glob(f'{B}/groups/*.json'):
    try: old_groups[os.path.basename(f)[:-5]] = json.load(open(f))
    except Exception: pass

changed = 0
members = collections.defaultdict(list)
for f, t in tests.items():
    cg = t.get('combine_group'); n = norm(cg)
    also = [norm(x) for x in (t.get('also_in_groups') or [])]
    if n != cg or also != (t.get('also_in_groups') or []):
        changed += 1
        t['combine_group'] = n
        if also: t['also_in_groups'] = also
        if APPLY: json.dump(t, open(f, 'w'), indent=2, ensure_ascii=False)
    for g in [n] + also:
        if g: members[g].append(t)

# carry over titles/notes from old group files (by normalised id)
meta = {}
for gid, g in old_groups.items():
    meta.setdefault(norm(gid), g)

mixed = []
out = {}
for gid, ts in members.items():
    units = sorted({(t.get('quantity') or {}).get('unit') or '' for t in ts})
    studies = sorted({t['source'].get('short') for t in ts})
    m = meta.get(gid, {})
    g = {'id': gid,
         'title': (m.get('title') if m.get('title') and '__' not in m.get('title') and not re.search(r'\w_\w', m.get('title')) and ' / ' not in m.get('title') else nice_title(gid)),
         'description': m.get('description', ''),
         'notes': m.get('notes', ''),
         'tests': sorted(t['id'] for t in ts),
         'studies': studies, 'units': units}
    if len(units) > 1: mixed.append((gid, units)); g['warning'] = 'mixed units: ' + ', '.join(units)
    out[gid] = g

print('tests', len(tests), 'group ids changed in', changed, 'tests')
print('groups', len(out), 'multi-study', sum(len(g['studies']) > 1 for g in out.values()))
print('mixed-unit groups', len(mixed)); [print('  ', m) for m in mixed[:40]]
if APPLY:
    for f in glob.glob(f'{B}/groups/*.json'): os.remove(f)
    for gid, g in out.items():
        json.dump(g, open(f'{B}/groups/{gid}.json', 'w'), indent=2, ensure_ascii=False)
    print('written')
