#!/usr/bin/env python3
"""Score an agent's answers against the SpineBench reference values.

Usage:
  python3 tools/score_agent.py answers_from_agent.json [--card lumbar_rom] [--out report.json]
  python3 tools/score_agent.py --selftest            # band midpoint, study means, all-null and shifted submissions

Input (default: site/data/answers.json, written by site/build_index.py).

Two kinds of scoring unit (rule also in bench/AGENTS.md):
  FE and tissue cards -> SIMULATIONS (card key `agent_sims`). One simulation = one test a modeller runs once
    (same specimen, boundary conditions, loading direction, preload, output definition); the sweep input (moment,
    strain, displacement, force, load) is the x of its curves. Answer per simulation:
      {"<card>": {"<sim id>": {"<output key>": [[x, y], ...]}}}            one output curve
      {"<card>": {"<sim id>": {"<output key>": {"L4-L5": [[x, y], ...]}}}}  one curve per level (or direction, ...)
    a number instead of a curve where the simulation (or that output) has no sweep; null = not simulated.
    The nesting follows the card's answer_format. A curve is read at every band x by linear interpolation;
    band x values outside the answered x range count as failed.
    Band at each x where data exist: lower = min over the studies of (mean - SD, else min, else mean), upper = max of
    (mean + SD, else max, else mean); medians use [min, max] if given, else the median. A study curve also counts at
    the x values of the other studies that fall inside its own measured range (linear interpolation, never
    extrapolated), so the band is the range spanned by the studies. A study with several curves in one output
    (layers, regions, specimens) counts as several curves, never as their average. Outputs that only rise (or only
    fall) with the sweep (sim key "monotone": true | "rising" | "falling" | {output: direction}) use the envelope of all
    curves: for a rising output upper = running max from the left, lower = running min from the right (mirrored for a
    falling one), inside the x range the studies cover. Outputs not marked rising/falling are widened to the convex
    hull of all measured points with their spread and floors (use_hull; sim key "hull" overrides). Floors: each measured curve keeps +-5 % of its
    own largest |value| around its points; the band half-width is at least ABS_FLOOR[unit], and 25 % of |centre| when
    no contributing value has a spread; the band always covers each study's own interval (a value without spread:
    +-25 % of itself, also when other studies at that x have a spread). Force-controlled points in a displacement-swept simulation (sim key
    "transpose") are read as (measured displacement, applied force). PASS if the answer is inside the band at
    >= 80 % of the band points.
    Reported per study: points inside the study's own spread (same floors) and NRMSE (RMS error / largest |mean|).
    Failed band points are listed per output ("failed_points": [[x, "no answer" | "below" | "above"], ...]).
  MSK cards -> TASKS, unchanged: band of one reference = mean +- SD (else [min, max], else +-25 %), floored; a task
    passes inside the pooled band when it has one, else inside the bands of at least half of its studies.
    Per-subject answers ({study or patient: value}): at least half of the matching references must pass.
  card score = passed units / all units; overall = mean of the card scores (each card weighs the same) and the plain total.
  Two extra results, reported next to the main pass/fail (which is unchanged):
  - 2 SD: the same rules with every band edge moved out by one more SD, so the 2 SD band is wider than the main
    band at every point: mean +- SD -> mean +- 2 SD; a min-max range -> [min - SD, max + SD], SD estimated from the
    range and n (Wan et al. 2014, BMC Med Res Methodol 14:135: SD = range / xi(n), xi(n) = 2 Phi^-1((n - 0.375) /
    (n + 0.25)); range / 4 when n is unknown); the +-25 % for values without spread -> +-50 %; the curve floor (+-5 %)
    and the unit floors -> doubled: "pass_2sd", "passed_2sd", "score_2sd", "mean_card_score_2sd". Simulations read
    the band "band_2sd" in answers.json (absent = same as "band").
  - EMG correlation (cards with a %MVC output, MSK tasks): Pearson r between the answered EMG and the measured mean,
    all muscles and conditions of one study together (one experiment, e.g. Lavender's pull directions or Elrich's
    load magnitudes), and all studies of the card together. Muscle activity has no single right value, so the
    pattern across muscles and tasks is reported next to the hits: summary key "emg_r" = {"all": {"r", "n"},
    "by_study": {study: {"r", "n"}}} (r needs >= 3 answered pairs).
  Results are reported BY STUDY as well as by card: summary key "by_study" = {study: {"points", "inside",
  "inside_2sd", "share", "share_2sd", "units", ["emg_r"]}}: how many of the study's own values (simulation points or
  task values) the answer hits inside that study's own spread (main rule and 2 SD), in how many scoring units the
  study appears, and its EMG r. CLI: --by-study prints the table.
"""
import argparse
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site" / "data"

REL_NO_SPREAD = 0.25          # half-width for a value with no SD or range
K_RELAXED = 2.0               # relaxed result: every half-width x K_RELAXED (mean +- 2 SD, see sd_from_range)
EMG_UNIT = "%MVC"             # MSK outputs in this unit also get the EMG correlation
SIM_PASS = 0.80               # fraction of band points that must pass
HULL = True                   # convex hull band for outputs not marked rising/falling (see use_hull)
CURVE_FLOOR = 0.05            # x largest |value| of one measured curve (>= 2 points)
ABS_FLOOR = {"deg": 0.5, "MPa": 0.02, "kPa": 1.0, "N": 5.0, "Nm": 1.0, "%MVC": 2.0, "%": 2.0,
             "% of standing": 5.0, "mm": 0.05}
REL_FLOOR = {"lumbar_idp_invivo": 0.26, "thoracic_idp_invivo": 0.26}  # Ghezelbash lab IDP tolerance (test pass_rule)
OUT_META = ("key", "scalar", "label")  # keys of an agent_sims output that are not "by" fields


def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else None


def r6(v):
    return None if v is None else float(f"{v:.6g}")


def _xkey(x):
    return -math.inf if x is None else x


# ---------------------------------------------------------------- simulations (agent_sims)
# Shared with site/build_index.py (export and answers.json) and tools/check_outcomes.py (validation).

def sim_fields(sim):
    """The fields that tell a simulation's outputs apart ("level" = the task's level, else an input key)."""
    outs = sim.get("outputs") or [{}]
    return [k for k in outs[0] if k not in OUT_META]


def task_field(t, f):
    return t.get("level") if f == "level" else (t.get("inputs") or {}).get(f)


def sim_slots(card, sim):
    """One slot per declared output: {id, key, by, path, unit, scalar, tasks}. Raises ValueError when a task maps to
    no output, or the outputs do not share one field set."""
    tasks = {t["id"]: t for t in card["tasks"]}
    units = {o.get("key"): o.get("unit", "") for o in card.get("outputs", []) if isinstance(o, dict)}
    fields = sim_fields(sim)
    slots, index = [], {}
    for o in sim.get("outputs") or []:
        if [k for k in o if k not in OUT_META] != fields:
            raise ValueError(f"sim {sim.get('id')}: outputs must all name the same fields {fields}")
        vals = tuple(o.get(f) for f in fields)
        s = {"id": "|".join([o["key"]] + [str(v) for v in vals]), "key": o["key"], "by": {f: o.get(f) for f in fields},
             "path": [o["key"]] + [str(v) for v in vals], "unit": units.get(o["key"], ""),
             "scalar": bool(o.get("scalar")) or not sim.get("sweep"), "tasks": []}
        if (o["key"], vals) in index:
            raise ValueError(f"sim {sim.get('id')}: output {s['id']} listed twice")
        index[(o["key"], vals)] = s
        slots.append(s)
    tr = sim.get("transpose") or {}
    for tid in sim.get("task_ids") or []:
        if tid not in tasks:
            raise ValueError(f"sim {sim.get('id')}: unknown task {tid}")
        t = tasks[tid]
        out = tr["as"] if tr and t.get("output") == tr.get("output") else t.get("output")
        k = (out, tuple(task_field(t, f) for f in fields))
        if k not in index:
            raise ValueError(f"sim {sim.get('id')}: task {tid} matches no output ({k[0]} {list(k[1])})")
        index[k]["tasks"].append(t)
    return slots


def ref_spread(r, k=1.0):
    """(centre, lo, hi, has_spread) of one reference value, or None. k = number of SDs (min-max is never widened)."""
    c = next((num(r.get(k)) for k in ("mean", "median") if num(r.get(k)) is not None), None)
    mn, mx = num(r.get("min")), num(r.get("max"))
    if c is None:
        if mn is None or mx is None:
            return None
        c = (mn + mx) / 2
    sd = num(r.get("sd"))
    if r.get("stat") != "median" and sd is not None and sd > 0:
        return c, c - k * sd, c + k * sd, True
    if mn is not None and mx is not None and mx > mn:
        s = (k - 1) * sd_from_range(mn, mx, r.get("n")) if k > 1 else 0.0
        return c, min(mn, c) - s, max(mx, c) + s, True
    return c, c, c, False


def sd_from_range(mn, mx, n=None):
    """SD estimated from a min-max range of n values (Wan et al. 2014): range / xi(n); range / 4 when n is unknown.
    Used only for the 2 SD result: [min - SD, max + SD] (the main band keeps the range itself)."""
    from statistics import NormalDist
    n = num(n)
    if n is None or n < 2:
        return (mx - mn) / 4.0
    return (mx - mn) / (2 * NormalDist().inv_cdf((n - 0.375) / (n + 0.25)))


def _tag(r):
    return str(r.get("note") or "").split(";")[0].strip().lower()


def transposed_y(sim, t):
    """Force-controlled task in a displacement-swept simulation (sim key "transpose"): the applied load, or None."""
    tr = sim.get("transpose") or {}
    if not tr or t.get("output") != tr.get("output"):
        return None
    v = (tr.get("y_values") or {}).get(t["id"])
    return num(v if v is not None else (t.get("inputs") or {}).get(tr.get("y_input")))


def slot_series(slot, sim, k=1.0):
    """{(study, curve, tag): [(x, (c, lo, hi, spread)), ...]} - one measured curve per study and condition.
    curve = the inputs named in the sim's "curve_by" (default: every input that is not fixed, swept or an output field).
    Transposed (force-controlled) tasks: x = the measured value (e.g. displacement), y = the applied load; their x
    spread becomes a y spread through the slope of the study's own curve (secant to the neighbouring points, else
    to the origin)."""
    sweep = sim.get("sweep")
    tr = sim.get("transpose") or {}
    skip = set(sim.get("fixed") or {}) | set(slot["by"]) | {sweep, tr.get("y_input")}
    keep = sim.get("curve_by")
    ser, flip = {}, set()
    for t in slot["tasks"]:
        ins = t.get("inputs") or {}
        ty = transposed_y(sim, t)
        is_tr = bool(tr) and t.get("output") == tr.get("output")
        x = None if slot["scalar"] else num(ins.get(sweep))
        var = json.dumps({k: v for k, v in sorted(ins.items()) if (k in keep if keep is not None else k not in skip)},
                         ensure_ascii=False)
        per = {}
        for r in t.get("refs") or []:
            per[r.get("study")] = per.get(r.get("study"), 0) + 1
        for r in t.get("refs") or []:
            sp = ref_spread(r, k)
            if not sp or (is_tr and ty is None):
                continue
            key = (r.get("study"), var + ("|transposed" if is_tr else ""), _tag(r) if per[r.get("study")] > 1 else "")
            if is_tr:
                flip.add(key)
                ser.setdefault(key, {}).setdefault(sp[0], []).append((ty, sp[1], sp[2], sp[3]))  # y, x lo, x hi
            else:
                ser.setdefault(key, {}).setdefault(x, []).append(sp)
    out = {}
    for k, pts in ser.items():
        if k in flip:
            raw = sorted((x, sum(a[0] for a in v) / len(v), min(a[1] for a in v), max(a[2] for a in v), any(a[3] for a in v))
                         for x, v in pts.items())
            rows = []
            for i, (x, yv, xlo, xhi, spd) in enumerate(raw):
                sec = [(raw[j][1] - yv) / (raw[j][0] - x) for j in (i - 1, i + 1)
                       if 0 <= j < len(raw) and raw[j][0] != x]
                k_ = sum(sec) / len(sec) if sec else (yv / x if x else 0.0)
                a, b = yv - k_ * (xhi - x), yv + k_ * (x - xlo)
                rows.append((x, (yv, min(a, b, yv), max(a, b, yv), spd)))
            out[k] = rows
            continue
        rows = [(x, (sum(a[0] for a in v) / len(v), min(a[1] for a in v), max(a[2] for a in v), any(a[3] for a in v)))
                for x, v in pts.items()]
        out[k] = sorted(rows, key=lambda p: _xkey(p[0]))
    return out


def series_at(pts, x):
    """Value of one study curve at x: exact, or linear between its neighbours inside its own range (never beyond)."""
    for xi, v in pts:
        if xi == x:
            return v
    if x is None:
        return None
    for (x0, v0), (x1, v1) in zip(pts, pts[1:]):
        if x0 is not None and x0 < x < x1:
            w = (x - x0) / (x1 - x0)
            return tuple(a + w * (b - a) for a, b in zip(v0[:3], v1[:3])) + (v0[3] or v1[3],)
    return None


def _floored(vals, floor, k=1.0):
    lo, hi = min(v[1] for v in vals), max(v[2] for v in vals)
    mid = (lo + hi) / 2
    half = k * max(floor(mid), 0.0 if any(v[3] for v in vals) else REL_NO_SPREAD * abs(mid))
    return min(lo, mid - half), max(hi, mid + half), sum(v[0] for v in vals) / len(vals)


def curve_names(ser):
    """{series key: name}: the study id when the study has one curve in the output, else "study | condition"
    (the inputs that tell its curves apart, e.g. "holzapfel2005 | VLe, ventro-lateral external")."""
    per = {}
    for k in ser:
        per.setdefault(k[0], []).append(k)
    names = {}
    for st, keys in per.items():
        for k in keys:
            if len(keys) == 1:
                names[k] = str(st)
                continue
            try:
                var = json.loads(k[1].split("|")[0])
            except ValueError:
                var = {}
            bits = [str(v) for v in var.values()] + (["force-controlled"] if k[1].endswith("|transposed") else []) \
                + ([k[2]] if k[2] else [])
            names[k] = f"{st} | {', '.join(bits) or '?'}"
    seen = {}
    for k, n in list(names.items()):  # unique names
        seen[n] = seen.get(n, 0) + 1
        if seen[n] > 1:
            names[k] = f"{n} #{seen[n]}"
    return names


def mono_dir(sim, slot):
    """"rising", "falling" or None for one output of a simulation. Sim key "monotone": true / "rising" / "falling"
    for every output, or {slot id or output key: "rising" | "falling"} per output."""
    m = sim.get("monotone")
    if isinstance(m, dict):
        m = m.get(slot["id"], m.get(slot["key"]))
    return "rising" if m is True or m == "rising" else "falling" if m == "falling" else None


def monotone_hull(band, direction="rising"):
    """Envelope for an output that only rises (or only falls) with the sweep: for "rising", upper = running max from
    the left and lower = running min from the right; mirrored for "falling". The band then never dips (or bumps)
    where one curve's measured range ends."""
    out = [list(b) for b in band]
    fwd, back = (out, out[::-1]) if direction == "rising" else (out[::-1], out)
    up = -math.inf
    for b in fwd:
        up = max(up, b[2])
        b[2] = up
    dn = math.inf
    for b in back:
        dn = min(dn, b[1])
        b[1] = dn
    return out


def use_hull(sim, slot):
    """Convex hull of all measured points for this output? Sim key "hull" (true/false) decides; by default only for
    outputs NOT marked rising/falling. For a rising or falling output the convex hull would cut across the shape of the
    data (the toe of a J-shaped stress-strain curve, the knee of ROM vs moment or vs follower load) and let a straight
    line pass; its rising/falling envelope already closes the gaps where curves end. Outputs that rise and fall get the
    hull, which closes the dips scattered studies leave in a per-x band."""
    h = sim.get("hull")
    return bool(h) if h is not None else HULL and not mono_dir(sim, slot)


def _hull_chains(pts):
    """Lower and upper chains of the convex hull of (x, y) points (Andrew's monotone chain), each sorted by x."""
    pts = sorted(set(pts))
    if len(pts) < 3:
        return pts, pts

    def cross(o, a, b):
        return (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0])

    lower, upper = [], []
    for p in pts:
        while len(lower) >= 2 and cross(lower[-2], lower[-1], p) <= 0:
            lower.pop()
        lower.append(p)
    for p in reversed(pts):
        while len(upper) >= 2 and cross(upper[-2], upper[-1], p) <= 0:
            upper.pop()
        upper.append(p)
    return lower, upper[::-1]


def _chain_at(chain, x, pick):
    """y of a hull chain at x (linear between its vertices); pick = min or max where vertices share x."""
    at = [y for cx, y in chain if cx == x]
    if at:
        return pick(at)
    for (x0, y0), (x1, y1) in zip(chain, chain[1:]):
        if x0 < x < x1:
            return y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return None


def slot_band(card_id, slot, sim, k=1.0):
    """{"band": [[x, lo, hi, centre], ...], "studies": {curve: [[x, mean, lo, hi], ...]}, "study_of": {curve: study}}
    for one output of a simulation. One entry per measured curve: a study with several curves in the output
    (layers, regions, specimens) gets one entry per curve, never an average across them; study_of maps those curve
    names back to the study. x is null for an output without sweep; centre = mean of the curve values that count at x.
    Floors: each measured curve (>= 2 points) keeps at least +-5 % of its own largest |value| around each point
    (digitising tolerance, as before); the band keeps at least the absolute floor of the unit, and +-25 % of its
    centre when no contributing value has a spread. The band always covers every curve's own interval (the one its
    per-study check uses), so a value without spread keeps its +-25 % even when other curves at that x have one. Outputs marked rising/falling (sim "monotone", see mono_dir) get
    the envelope of monotone_hull; the others the convex hull of all of these points, read at each band x (use_hull)."""
    ser = slot_series(slot, sim, k)
    xs = sorted({x for pts in ser.values() for x, _ in pts}, key=_xkey)
    sfl = {key: k * CURVE_FLOOR * max(abs(v[0]) for _, v in pts) if len(pts) >= 2 else 0.0
           for key, pts in ser.items()}

    def floor(mid):
        return max(ABS_FLOOR.get(slot["unit"], 0.0), REL_FLOOR.get(card_id, 0.0) * abs(mid))

    def at(keys, x):
        out = []
        for key in keys:
            v = series_at(ser[key], x)
            if v:
                out.append((v[0], min(v[1], v[0] - sfl[key]), max(v[2], v[0] + sfl[key]), v[3]))
        return out

    def own(key, x):
        """One curve's own interval at x (the per-study check): its spread, else +-25 %, with the floors."""
        v = at([key], x)
        return _floored(v, floor, k) if v else None

    band = []
    for x in xs:
        lo, hi, c = _floored(at(ser, x), floor, k)
        for key in ser:  # the band covers every curve's own interval (a value without spread keeps its +-25 %)
            o = own(key, x)
            if o:
                lo, hi = min(lo, o[0]), max(hi, o[1])
        band.append([x, lo, hi, c])
    if use_hull(sim, slot) and not slot["scalar"] and len(band) > 1:
        # convex hull of everything: every measured point with its own interval, and the band itself
        pts = [(x, y) for x, lo, hi, _ in band for y in (lo, hi)]
        for key, sp in ser.items():
            for x, v in sp:
                if x is not None:
                    o = own(key, x)
                    pts += [(x, o[0]), (x, o[1])]
        low, up = _hull_chains(pts)
        band = [[x, min(lo, _chain_at(low, x, min)), max(hi, _chain_at(up, x, max)), c] for x, lo, hi, c in band]
    if mono_dir(sim, slot) and not slot["scalar"]:
        band = monotone_hull(band, mono_dir(sim, slot))
    band = [[x, r6(lo), r6(hi), r6(c)] for x, lo, hi, c in band]
    names = curve_names(ser)
    studies, study_of = {}, {}
    for key in sorted(ser, key=lambda q: names[q]):
        if names[key] != str(key[0]):
            study_of[names[key]] = key[0]
        for x, _ in ser[key]:
            lo, hi, c = _floored(at([key], x), floor, k)
            studies.setdefault(names[key], []).append([x, r6(c), r6(lo), r6(hi)])
    return {"band": band, "studies": studies, **({"study_of": study_of} if study_of else {})}


def curve_problems(slot, sim, drop=0.40):
    """Defects of the measured curves of one output: [(curve name, message)]. Every swept output: repeated x within
    one curve (two values merged into one point). Outputs marked monotone (mono_dir): a step against the marked
    direction of more than `drop` x |y| between consecutive points (sorted by x, ignoring values within the unit's
    floor of zero; a rising curve that drops, as after failure, or a falling one that jumps up), and a curve that
    ends on the wrong side of where it starts. Curves are sorted by x when scored, so task order is not checked.
    Force-controlled (transposed) points are skipped."""
    if slot["scalar"] or not sim.get("sweep"):
        return []
    sweep, tr = sim.get("sweep"), sim.get("transpose") or {}
    skip = set(sim.get("fixed") or {}) | set(slot["by"]) | {sweep, tr.get("y_input")}
    keep = sim.get("curve_by")
    raw = {}
    for t in slot["tasks"]:
        if tr and t.get("output") == tr.get("output"):
            continue
        ins = t.get("inputs") or {}
        x = num(ins.get(sweep))
        var = json.dumps({k: v for k, v in sorted(ins.items()) if (k in keep if keep is not None else k not in skip)},
                         ensure_ascii=False)
        per = {}
        for r in t.get("refs") or []:
            per[r.get("study")] = per.get(r.get("study"), 0) + 1
        for r in t.get("refs") or []:
            sp = ref_spread(r)
            if sp and x is not None:
                raw.setdefault((r.get("study"), var, _tag(r) if per[r.get("study")] > 1 else ""), []).append((x, sp[0]))
    names = curve_names(raw)
    fl = ABS_FLOOR.get(slot["unit"], 0.0)
    out = []
    for k, pts in raw.items():
        n = names[k]
        xs = [p[0] for p in pts]
        if len(set(xs)) < len(xs):
            out.append((n, f"x repeats: {sorted({x for x in xs if xs.count(x) > 1})}"))
        d = mono_dir(sim, slot)
        if not d:
            continue
        sg = 1 if d == "rising" else -1
        s = sorted(pts)
        for (x0, y0), (x1, y1) in zip(s, s[1:]):
            if abs(y0) > fl and sg * (y0 - y1) > drop * abs(y0):
                out.append((n, f"{'drop' if sg > 0 else 'jump'} {y0:.4g} -> {y1:.4g} between x = {x0:g} and {x1:g}"))
        if len(s) >= 2 and sg * (s[0][1] - s[-1][1]) > fl:
            out.append((n, f"{d} output but the curve {'falls' if sg > 0 else 'rises'} ({s[0][1]:.4g} -> {s[-1][1]:.4g})"))
    return out


def interp(pts, x):
    pts = sorted((num(p[0]), num(p[1])) for p in pts if isinstance(p, (list, tuple)) and len(p) == 2
                 and num(p[0]) is not None and num(p[1]) is not None)
    if not pts or x < pts[0][0] or x > pts[-1][0]:
        return None
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= x <= x1:
            return y0 if x1 == x0 else y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return pts[-1][1] if x == pts[-1][0] else None


def _lookup(ans, path, single):
    """Walk {key: {level: curve}}; a curve or number given directly under the key is accepted when the key has one
    output in the simulation (single)."""
    v = ans
    for i, p in enumerate(path):
        if isinstance(v, dict) and p in v:
            v = v[p]
        elif i > 0 and single and not isinstance(v, dict):
            return v
        else:
            return None
    return v


def score_sim(sd, ans):
    """sd: answers.json simulation entry; ans: the agent's answer for it. -> dict(pass, points_passed, nrmse, studies)."""
    if not isinstance(ans, dict):  # a bare curve or number is accepted for a simulation with one output
        ans = {sd["outputs"][0]["key"]: ans} if len(sd["outputs"]) == 1 and ans is not None else {}
    nkey = {}
    for o in sd["outputs"]:
        nkey[o["key"]] = nkey.get(o["key"], 0) + 1
    ok, ok2, errs, scale, studies, answered, failed = [], [], [], 0.0, {}, 0, {}
    for o in sd["outputs"]:
        raw = _lookup(ans, o["path"], nkey[o["key"]] == 1)
        nx = len(o["band"])

        def y(x, raw=raw, nx=nx):
            if isinstance(raw, list):
                return interp(raw, x) if x is not None else None
            v = num(raw)
            return v if (x is None or nx == 1) else None

        for x, lo, hi, _c in o.get("band_2sd") or o["band"]:
            v = y(x)
            ok2.append(v is not None and lo <= v <= hi)
        for x, lo, hi, _c in o["band"]:
            v = y(x)
            answered += v is not None
            ok.append(v is not None and lo <= v <= hi)
            if not ok[-1]:  # traceable fails: x and why (no answer there, below or above the band)
                failed.setdefault(o["slot"], []).append(
                    [x, "no answer" if v is None else ("below" if v < lo else "above")])
        of = o.get("study_of") or {}
        wide = o.get("studies_2sd") or {}
        for curve, pts in o["studies"].items():
            st = of.get(curve, curve)
            s = studies.setdefault(st, {"hit": 0, "hit2": 0, "n": 0, "e": [], "cmax": 0.0})
            for i, (x, c, lo, hi) in enumerate(pts):
                v = y(x)
                lo2, hi2 = wide[curve][i][2:4] if curve in wide else (lo, hi)
                s["n"] += 1
                s["cmax"] = max(s["cmax"], abs(c))
                scale = max(scale, abs(c))
                if v is not None:
                    s["hit"] += lo <= v <= hi
                    s["hit2"] += lo2 <= v <= hi2
                    s["e"].append(v - c)
                    errs.append(v - c)
    frac = sum(ok) / len(ok) if ok else 0.0
    frac2 = sum(ok2) / len(ok2) if ok2 else 0.0
    rms = lambda e, m: round(math.sqrt(sum(x * x for x in e) / len(e)) / m, 3) if e and m else None
    return {"pass": bool(ok) and frac >= SIM_PASS, "sim": True, "points_passed": f"{sum(ok)}/{len(ok)}",
            "pass_2sd": bool(ok2) and frac2 >= SIM_PASS, "points_passed_2sd": f"{sum(ok2)}/{len(ok2)}",
            "answered": answered > 0, "nrmse": rms(errs, scale),
            "studies": {st: {"in_own_spread": f"{s['hit']}/{s['n']}", "in_own_spread_2sd": f"{s['hit2']}/{s['n']}",
                             "nrmse": rms(s["e"], s["cmax"])} for st, s in studies.items()},
            **({"failed_points": failed} if failed else {})}


# ---------------------------------------------------------------- tasks (MSK cards)

def ref_band(r, floor, k=1.0):
    c = next((num(r.get(k)) for k in ("mean", "median") if num(r.get(k)) is not None), None)
    lo, hi = num(r.get("min")), num(r.get("max"))
    if c is None:
        if lo is None or hi is None:
            return None
        c = (lo + hi) / 2
    sd = num(r.get("sd"))
    if sd is not None and sd > 0:
        lo, hi = c - k * sd, c + k * sd
    elif lo is not None and hi is not None and hi > lo:
        s = (k - 1) * sd_from_range(lo, hi, r.get("n")) if k > 1 else 0.0
        lo, hi = min(lo, c) - s, max(hi, c) + s
    else:
        lo, hi = c - k * REL_NO_SPREAD * abs(c), c + k * REL_NO_SPREAD * abs(c)
    f = k * floor(c)
    return (min(lo, c - f), max(hi, c + f), c)


def subject_key(r):
    m = re.match(r"\s*(WP\d+)\b", str(r.get("note") or ""))
    return m.group(1) if m and r.get("n") in (None, 1) else None


def score_task(ans, val, floor, k=1.0):
    """ans: answers.json entry; val: number or {subject: number}. -> dict(pass, ...). k = number of SDs."""
    refs = ans.get("refs") or []
    by = {}
    for r in refs:
        b = ref_band(r, floor, k)
        if b:
            by.setdefault(r.get("study"), []).append((r, b))
    if not by:
        return {"pass": None, "why": "no numeric reference"}
    if isinstance(val, dict):  # one value per study or patient
        checks = []
        for st, rb in by.items():
            for r, (lo, hi, c) in rb:
                v = num(val.get(subject_key(r) or "")) if subject_key(r) else None
                if v is None:
                    v = num(val.get(st))
                if v is not None:
                    checks.append(lo <= v <= hi)
        if not checks:
            return {"pass": False, "why": "no answered subject matches a reference"}
        return {"pass": sum(checks) * 2 >= len(checks), "hits": f"{sum(checks)}/{len(checks)} subjects"}
    v = num(val)
    if v is None:
        return {"pass": None, "why": "not answered"}
    hits = {st: any(lo <= v <= hi for _, (lo, hi, _) in rb) for st, rb in by.items()}
    out = {"value": v, "hits": f"{sum(hits.values())}/{len(hits)} studies",
           "studies_hit": sorted(k for k, h in hits.items() if h)}
    p = ans.get("pooled") or {}
    pm, ps = num(p.get("mean")), num(p.get("sd"))
    if pm is not None:
        half = k * max(ps or 0.0, floor(pm))
        out["pooled_band"] = [round(pm - half, 6), round(pm + half, 6)]
        out["z_pooled"] = round((v - pm) / ps, 3) if ps else None
        out["pass"] = pm - half <= v <= pm + half
        out["rule"] = "pooled"
    else:
        out["pass"] = sum(hits.values()) * 2 >= len(hits)
        out["rule"] = "studies"
    return out


def unwrap(v, output):
    """{output: x} -> x; leaves numbers and per-subject dicts alone."""
    return v[output] if isinstance(v, dict) and output in v else v


# ---------------------------------------------------------------- whole submission

def normalise(sub, cards, card_opt):
    """-> {card: {task or simulation id: raw value}}"""
    if card_opt:
        return {card_opt: sub.get(card_opt, sub) if isinstance(sub.get(card_opt), dict) else sub}
    out = {}
    for k, v in sub.items():
        if k in cards and isinstance(v, dict):
            out.setdefault(k, {}).update(v)
            continue
        m = re.match(r"^([A-Za-z0-9_]+)[./](.+)$", k)
        if m and m.group(1) in cards:
            out.setdefault(m.group(1), {})[m.group(2)] = v
            continue
        owners = [c for c in cards if k in (cards[c]["sims"] or cards[c]["tasks"])]
        if len(owners) == 1:
            out.setdefault(owners[0], {})[k] = v
        elif owners:
            print(f"warning: id '{k}' is in several cards {owners}; qualify it as card/id", file=sys.stderr)
    return out


def load(answers_path):
    """{card: {"tasks": {task id: answer}, "sims": {sim id: simulation entry} (empty for MSK cards)}}"""
    raw = json.loads(Path(answers_path).read_text(encoding="utf-8"))
    sims = raw.get("simulations") or {}
    return {cid: {"tasks": t, "sims": sims.get(cid) or {}} for cid, t in raw["answers"].items()}


def pearson(pairs):
    """{"r", "n"} for [(answer, measured), ...]; r is None below 3 pairs or without variance."""
    n = len(pairs)
    if n < 3:
        return {"r": None, "n": n}
    ma, mm = sum(a for a, _ in pairs) / n, sum(m for _, m in pairs) / n
    sab = sum((a - ma) * (m - mm) for a, m in pairs)
    saa, smm = sum((a - ma) ** 2 for a, _ in pairs), sum((m - mm) ** 2 for _, m in pairs)
    return {"r": round(sab / math.sqrt(saa * smm), 3) if saa > 0 and smm > 0 else None, "n": n}


def emg_correlation(card, answers):
    """EMG pattern: one pair per (task, study) = (answered value, mean of that study's centres for the task)."""
    by = {}
    for tid, a in card["tasks"].items():
        if a.get("unit") != EMG_UNIT:
            continue
        v = num(unwrap(answers.get(tid), a.get("output")))
        if v is None:
            continue
        cs = {}
        for r in a.get("refs") or []:
            b = ref_band(r, lambda c: 0.0)
            if b:
                cs.setdefault(r.get("study"), []).append(b[2])
        for st, c in cs.items():
            by.setdefault(st, []).append((v, sum(c) / len(c)))
    if not by:
        return None
    return {"all": pearson([p for ps in by.values() for p in ps]),
            "by_study": {st: pearson(ps) for st, ps in sorted(by.items())}}


def task_study_hits(a, val, floor, k=1.0):
    """{study: inside its own spread?} for one MSK task: any of the study's references holds the answer (per-subject
    answers: the value given for that subject or study). Unanswered -> False."""
    out = {}
    for r in a.get("refs") or []:
        b = ref_band(r, floor, k)
        if not b:
            continue
        st = r.get("study")
        if isinstance(val, dict):
            sk = subject_key(r)
            v = num(val.get(sk)) if sk and sk in val else num(val.get(st))
        else:
            v = num(val)
        out[st] = out.get(st, False) or (v is not None and b[0] <= v <= b[1])
    return out


def _frac(s):
    a, b = s.split("/")
    return int(a), int(b)


def by_study(card, res, answers, units_floor, emg):
    """{study: {"points", "inside", "inside_2sd", "share", "share_2sd", "units", "emg_r"?}} for one card."""
    acc = {}
    if card["sims"]:
        for r in res.values():
            for st, s in (r.get("studies") or {}).items():
                h, n = _frac(s["in_own_spread"]); h2, _ = _frac(s.get("in_own_spread_2sd", s["in_own_spread"]))
                a = acc.setdefault(st, {"points": 0, "inside": 0, "inside_2sd": 0, "units": 0})
                a["points"] += n; a["inside"] += h; a["inside_2sd"] += h2; a["units"] += 1
    else:
        for tid, t in card["tasks"].items():
            val, fl = unwrap(answers.get(tid), t.get("output")), units_floor(t.get("unit", ""))
            h1, h2 = task_study_hits(t, val, fl), task_study_hits(t, val, fl, K_RELAXED)
            for st in h1:
                a = acc.setdefault(st, {"points": 0, "inside": 0, "inside_2sd": 0, "units": 0})
                a["points"] += 1; a["inside"] += h1[st]; a["inside_2sd"] += h2.get(st, False); a["units"] += 1
    for st, a in acc.items():
        a["share"] = round(a["inside"] / a["points"], 3) if a["points"] else None
        a["share_2sd"] = round(a["inside_2sd"] / a["points"], 3) if a["points"] else None
        if emg and st in emg["by_study"]:
            a["emg_r"] = emg["by_study"][st]
    return dict(sorted(acc.items()))


def score_card(cid, card, answers):
    units_floor = lambda unit: (lambda c: max(ABS_FLOOR.get(unit, 0.0), REL_FLOOR.get(cid, 0.0) * abs(c)))
    res, units, units2, emg = {}, [], [], None
    if card["sims"]:
        for sid, sd in card["sims"].items():
            r = score_sim(sd, answers.get(sid))
            res[sid] = r
            units.append(r["pass"])
            units2.append(r["pass_2sd"])
        answered = sum(1 for r in res.values() if r["answered"])
    else:
        for tid, a in card["tasks"].items():
            val, fl = unwrap(answers.get(tid), a.get("output")), units_floor(a.get("unit", ""))
            r = score_task(a, val, fl)
            r["pass_2sd"] = bool(score_task(a, val, fl, K_RELAXED).get("pass"))
            res[tid] = r
            units.append(bool(r.get("pass")))
            units2.append(r["pass_2sd"])
        answered = sum(1 for r in res.values() if r.get("value") is not None or r.get("hits", "").endswith("subjects"))
        emg = emg_correlation(card, answers)
    n = len(units)
    studies = by_study(card, res, answers, units_floor, emg)
    return res, {"units": n, "kind": "simulations" if card["sims"] else "tasks", "answered": answered,
                 "passed": sum(units), "score": round(sum(units) / n, 3) if n else None,
                 "passed_2sd": sum(units2), "score_2sd": round(sum(units2) / n, 3) if n else None,
                 **({"emg_r": emg} if emg else {}), "by_study": studies}


def score(sub, cards, card_opt=None):
    per = normalise(sub, cards, card_opt)
    report, summary = {}, {}
    for cid in ([card_opt] if card_opt else sorted(cards)):
        if cid not in cards:
            raise SystemExit(f"unknown card {cid}")
        res, s = score_card(cid, cards[cid], per.get(cid, {}))
        report[cid], summary[cid] = res, s
    scored = [s["score"] for s in summary.values() if s["score"] is not None]
    scored2 = [s["score_2sd"] for s in summary.values() if s["score_2sd"] is not None]
    tot_u = sum(s["units"] for s in summary.values()); tot_p = sum(s["passed"] for s in summary.values())
    tot_p2 = sum(s["passed_2sd"] for s in summary.values())
    return {"summary": summary, "overall": {"mean_card_score": round(sum(scored) / len(scored), 3) if scored else None,
                                            "passed": tot_p, "units": tot_u,
                                            "mean_card_score_2sd": round(sum(scored2) / len(scored2), 3) if scored2 else None,
                                            "passed_2sd": tot_p2}, "results": report}


# ---------------------------------------------------------------- self-test submissions

def sim_answer(sd, value):
    """A submission for one simulation: value(lo, hi, centre) at every band x, nested as in answer_format."""
    out = {}
    for o in sd["outputs"]:
        pts = [[x, value(lo, hi, c)] for x, lo, hi, c in o["band"]]
        leaf = pts[0][1] if o["band"] and o["band"][0][0] is None else pts
        d = out
        for p in o["path"][:-1]:
            d = d.setdefault(p, {})
        d[o["path"][-1]] = leaf
    return out


def msk_oracle(card):
    """MSK tasks: pooled mean, else the first study's mean (as before)."""
    sub = {}
    for tid, a in card["tasks"].items():
        p = (a.get("pooled") or {}).get("mean")
        if p is None:
            b = next((ref_band(r, lambda x: 0.0) for r in a["refs"] if ref_band(r, lambda x: 0.0)), None)
            p = b[2] if b else None
        sub[tid] = {a["output"]: p}
    return sub


def selftest_subs(cards):
    mid, means, shifted = {}, {}, {}
    for cid, c in cards.items():
        if c["sims"]:
            mid[cid] = {sid: sim_answer(sd, lambda lo, hi, cc: (lo + hi) / 2) for sid, sd in c["sims"].items()}
            means[cid] = {sid: sim_answer(sd, lambda lo, hi, cc: cc) for sid, sd in c["sims"].items()}
            shifted[cid] = {sid: sim_answer(sd, lambda lo, hi, cc: hi + 2 * (hi - lo)) for sid, sd in c["sims"].items()}
        else:
            mid[cid] = means[cid] = msk_oracle(c)
    return mid, means, shifted


def study_means_in_band(cards):
    """Every study mean at its own x must lie inside the simulation band at that x."""
    n = bad = 0
    for c in cards.values():
        for sd in c["sims"].values():
            for o in sd["outputs"]:
                band = {x: (lo, hi) for x, lo, hi, _ in o["band"]}
                for pts in o["studies"].values():
                    for x, m, _lo, _hi in pts:
                        lo, hi = band[x]
                        n += 1
                        bad += not (lo <= m <= hi)
    return n, bad


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("submission", nargs="?")
    ap.add_argument("--card")
    ap.add_argument("--answers", default=str(DATA / "answers.json"))
    ap.add_argument("--tasks", help="ignored (kept so old command lines still run)")
    ap.add_argument("--out")
    ap.add_argument("--selftest", action="store_true")
    ap.add_argument("--by-study", action="store_true", help="print the per-study table of every card")
    a = ap.parse_args()
    cards = load(a.answers)
    if a.selftest:
        mid, means, shifted = selftest_subs(cards)
        sims_only = {cid: c for cid, c in cards.items() if c["sims"]}
        runs = (("(a) band midpoint (MSK tasks: pooled or first study mean)", mid, cards),
                ("(b) mean of the study values at each band x (MSK: as in a)", means, cards),
                ("(c) all null", {}, cards),
                ("(d) curves shifted 2 band widths above the band (simulations only)", shifted, sims_only))
        for name, sub, cs in runs:
            r = score(sub, cs)
            print(f"{name}: mean card score {r['overall']['mean_card_score']}, "
                  f"{r['overall']['passed']}/{r['overall']['units']} units; 2 SD: {r['overall']['passed_2sd']}/{r['overall']['units']}")
            for cid, s in r["summary"].items():
                print(f"   {cid:26s} {s['passed']:4d}/{s['units']:<4d} {s['kind']:11s} {s['score']}")
        n, bad = study_means_in_band(cards)
        print(f"(b') every study mean at its own x inside the simulation band: {n - bad}/{n} points")
        return
    if not a.submission:
        ap.error("give a submission JSON or --selftest")
    sub = json.loads(Path(a.submission).read_text(encoding="utf-8"))
    r = score(sub, cards, a.card)
    for cid, s in r["summary"].items():
        print(f"{cid:26s} passed {s['passed']:4d}/{s['units']:<4d} {s['kind']:11s} answered {s['answered']:4d}  "
              f"score {s['score']}  | 2 SD: {s['passed_2sd']}/{s['units']} score {s['score_2sd']}")
        if s.get("emg_r"):
            e = s["emg_r"]
            print(f"{'':26s} EMG r = {e['all']['r']} (n {e['all']['n']}); per study: "
                  + ", ".join(f"{st} {v['r']} (n {v['n']})" for st, v in e["by_study"].items()))
        if a.by_study:
            for st, b in s["by_study"].items():
                e = b.get("emg_r")
                print(f"{'':6s}{st:24s} inside own spread {b['inside']:4d}/{b['points']:<4d} ({b['share']})  "
                      f"2 SD {b['inside_2sd']:4d}/{b['points']:<4d} ({b['share_2sd']})  units {b['units']}"
                      + (f"  EMG r {e['r']} (n {e['n']})" if e else ""))
    o = r["overall"]
    print(f"overall: mean card score {o['mean_card_score']}  ({o['passed']}/{o['units']} units)")
    print(f"overall within 2 SD: mean card score {o['mean_card_score_2sd']}  ({o['passed_2sd']}/{o['units']} units)")
    if a.out:
        Path(a.out).write_text(json.dumps(r, indent=1, ensure_ascii=False), encoding="utf-8")
        print(f"per-unit report -> {a.out}")
    else:
        for cid, res in r["results"].items():
            for uid, x in res.items():
                print(f"  {cid}/{uid}: {'PASS' if x.get('pass') else 'fail'}  "
                      + ", ".join(f"{k}={v}" for k, v in x.items() if k not in ("pass", "studies_hit", "studies", "sim", "failed_points")))


if __name__ == "__main__":
    main()
