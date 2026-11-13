"""Audit: can every task be simulated from what the card gives? Writes bench/REPORT_task_inputs.md.
For each card and task it checks
  - consistency: input keys used but not declared, declared but never used, refs without n
  - MSK: subject table complete (sex, age, height, weight; disc area for IDP); posture quantified (numeric angle) or only described;
         hand load with a position; dynamic peaks; which assumptions a modeller must still make (lumbopelvic rhythm, arm posture,
         IDP conversion) and whether SpineBench input tests cover them
  - FE: specimen/level, direction, moment or load magnitude, preload type and size present
  - tissue: test mode, region and the x-quantity (strain/deformation) present; definitions/rate stated at card level
Usage: python3 tools/audit_task_inputs.py"""
import json, glob, os, re, collections
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
cards = [json.load(open(f, encoding='utf-8')) for f in sorted(glob.glob(f'{ROOT}/bench/outcomes/*.json'))]
NEUTRAL = re.compile(r'(?i)\b(upright|relaxed standing|standing, relaxed|lying|prone|supine|side|neutral|semi-seated|seated|side-lying|standing)\b(?!.*\b(bent|bend|flex|extend|extension|twist|slouch|lean)\w*)')
DYNAMIC = re.compile(r'(?i)\b(peak|dynamic|walking|jogging|stairs|lift(ing)? .*peak|turning)\b')
ANGLE_KEYS = ('trunk_flexion_deg', 'flexion_deg', 'lateral_bend_deg', 'axial_rotation_deg', 'trunk_inclination_deg')
def has_num(v): return isinstance(v, (int, float))
def input_tests():
    out = collections.Counter()
    for d in ('kinematics', 'anthropometry', 'muscle_geometry', 'trunk_passive_invivo'):
        out[d] = len(glob.glob(f'{ROOT}/bench/tests/{d}/*.json'))
    return out
IT = input_tests()
lines = ['# Task inputs audit', '',
         'Question: for every task, does the card give what a modeller needs to set up the simulation, and where must the modeller still assume something?',
         f'Run: `python3 tools/audit_task_inputs.py` (re-run after any card change). Input-side tests available in bench/tests: '
         + ', '.join(f'{k} {v}' for k, v in IT.items()) + '.', '']
summary = []
for c in cards:
    T = c['tasks']; dom = c['domain']; declared = [i['key'] for i in c['inputs']]
    used = collections.Counter(k for t in T for k in t['inputs'])
    issues = collections.defaultdict(list)
    for k in used:
        if k not in declared: issues['input key used but not declared'].append(k)
    for k in declared:
        if k not in used: issues['input declared but never used'].append(k)
    for t in T:
        for r in t['refs']:
            if r.get('n') in (None, 0): issues['ref without n'].append(t['id'])
    # sanity: same inputs + level for two tasks
    sig = collections.defaultdict(list)
    for t in T: sig[(json.dumps(t['inputs'], sort_keys=True), t.get('level'), t.get('output'))].append(t['id'])
    for s, ids in sig.items():
        if len(ids) > 1: issues['identical inputs on several tasks (check definitions)'].append('/'.join(ids))
    detail = collections.Counter()
    if dom == 'msk':
        subj = c.get('subjects') or {}
        studies = {s['key'] for s in c['studies']}
        for s in sorted(studies):
            sj = subj.get(s)
            if not sj: issues['study without a subject entry'].append(s); continue
            miss = [k for k in ('sex', 'age', 'height_cm', 'weight_kg') if sj.get(k) in (None, '')]
            if 'idp' in c['id'] and sj.get('disc_area_mm2') in (None, ''): miss.append('disc_area_mm2')
            if miss: issues['subject entry incomplete'].append(f"{s} ({', '.join(miss)})")
        for t in T:
            inp = t['inputs']; text = str(inp.get('posture') or inp.get('activity') or t['label'])
            angles = [k for k in ANGLE_KEYS if has_num(inp.get(k))]
            if angles: detail['posture quantified (numeric angle)'] += 1
            elif NEUTRAL.search(text): detail['neutral posture (no angle needed)'] += 1
            else:
                detail['posture described only (no numeric angle)'] += 1
                issues['posture described only'].append(t['id'])
            load = inp.get('hand_load_kg', inp.get('load'))
            loaded = (has_num(load) and load > 0) or (isinstance(load, str) and re.search(r'\d', load) and not re.search(r'(?i)^(none|0)', load))
            if loaded and not (inp.get('load_position') or inp.get('load_pos') or inp.get('arm_position') or (isinstance(load, str) and re.search(r'(?i)hand|arms|chest|ahead|height|elbow', load))):
                issues['hand load without position'].append(t['id'])
            if DYNAMIC.search(text) or any('dynamic' in r.get('note', '').lower() for r in t['refs']): issues['dynamic / peak value (static model = approximation)'].append(t['id'])
        need = []
        if any(has_num(t['inputs'].get(k)) for t in T for k in ('trunk_flexion_deg', 'flexion_deg')):
            need.append(f"split of trunk flexion between lumbar spine and pelvis (lumbopelvic rhythm) - covered by {IT['kinematics']} kinematics tests (50 lumbopelvic rhythm)")
        if 'idp' in c['id']:
            need.append('IDP from compression (P = F/A or Ghezelbash 2016 Eq. 6) and the disc area - given per subject')
        need.append(f"segment masses/COM and muscle geometry of the scaled model - covered by {IT['anthropometry']} anthropometry and {IT['muscle_geometry']} muscle-geometry tests")
        detail_txt = need
    elif dom == 'fe':
        for t in T:
            inp = t['inputs']
            if not (inp.get('specimen') or inp.get('level') or t.get('level')): issues['no specimen/level'].append(t['id'])
            if not inp.get('direction') and not inp.get('dof'): issues['no direction/DOF'].append(t['id'])
            mag = [k for k in ('moment_nm', 'load_n', 'axial_n', 'rotation_deg', 'load') if inp.get(k) not in (None, '')]
            if not mag: issues['no load/moment magnitude'].append(t['id'])
            pre = [k for k in ('preload_n', 'follower_n', 'axial_n', 'load_type') if k in inp]
            if not pre: issues['preload not stated'].append(t['id'])
        nodemo = [s['key'] for s in c['studies'] if not re.search(r'\d+\s*(y|yr|years)|age', s.get('sample', ''), re.I)]
        if nodemo: issues['study sample without donor age in the card (see test)'].extend(nodemo)
        detail_txt = ['specimen geometry and material properties are the modeller\'s own (not given per specimen)',
                      'loading rate assumed quasi-static unless the task says otherwise']
    else:
        for t in T:
            inp = t['inputs']
            if not inp.get('mode') and not inp.get('ligament') and not inp.get('structure') and not inp.get('tissue'): issues['no test mode'].append(t['id'])
        detail_txt = ['stress/strain definitions and rate are stated once at card level (simulate/notes)',
                      'specimen dimensions come from the test JSON (protocol), not the task']
    n_issue_tasks = len({x for k, v in issues.items() for x in v if k not in ('input declared but never used', 'input key used but not declared', 'subject entry incomplete', 'study without a subject entry', 'study sample without donor age in the card (see test)')})
    summary.append((c['id'], dom, len(T), n_issue_tasks, dict(detail)))
    lines += [f"## {c['id']} ({dom}, {len(T)} tasks)", '']
    if detail: lines += ['- Posture: ' + '; '.join(f'{v} {k}' for k, v in detail.items())]
    lines += ['- Still to assume: ' + '; '.join(detail_txt)]
    if issues:
        for k, v in issues.items():
            vv = sorted(set(v)); lines.append(f"- {k} ({len(vv)}): " + ', '.join(vv[:14]) + (' ...' if len(vv) > 14 else ''))
    else:
        lines.append('- No gaps found.')
    lines.append('')
lines[4:4] = ['| Card | Domain | Tasks | Tasks flagged | Posture |', '|---|---|---|---|---|'] + \
             [f"| {a} | {b} | {n} | {m} | {', '.join(f'{v} {k.split(' (')[0]}' for k, v in d.items()) if d else '-'} |" for a, b, n, m, d in summary] + ['']
fx = f'{ROOT}/bench/REPORT_task_inputs_findings.md'
if os.path.exists(fx): lines[4:4] = open(fx, encoding='utf-8').read().split('\n')
open(f'{ROOT}/bench/REPORT_task_inputs.md', 'w', encoding='utf-8').write('\n'.join(lines) + '\n')
print('\n'.join(lines[:30]))
