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
    extrapolated), so the band is the range spanned by the studies. Floors: each measured curve keeps +-5 % of its
    own largest |value| around its points; the band half-width is at least ABS_FLOOR[unit], and 25 % of |centre| when
    no contributing value has a spread. Force-controlled points in a displacement-swept simulation (sim key
    "transpose") are read as (measured displacement, applied force). PASS if the answer is inside the band at
    >= 80 % of the band points.
    Reported per study: points inside the study's own spread (same floors) and NRMSE (RMS error / largest |mean|).
  MSK cards -> TASKS, unchanged: band of one reference = mean +- SD (else [min, max], else +-25 %), floored; a task
    passes inside the pooled band when it has one, else inside the bands of at least half of its studies.
    Per-subject answers ({study or patient: value}): at least half of the matching references must pass.
  card score = passed units / all units; overall = mean of the card scores (each card weighs the same) and the plain total.
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
SIM_PASS = 0.80               # fraction of band points that must pass
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


def ref_spread(r):
    """(centre, lo, hi, has_spread) of one reference value, or None."""
    c = next((num(r.get(k)) for k in ("mean", "median") if num(r.get(k)) is not None), None)
    mn, mx = num(r.get("min")), num(r.get("max"))
    if c is None:
        if mn is None or mx is None:
            return None
        c = (mn + mx) / 2
    sd = num(r.get("sd"))
    if r.get("stat") != "median" and sd is not None and sd > 0:
        return c, c - sd, c + sd, True
    if mn is not None and mx is not None and mx > mn:
        return c, min(mn, c), max(mx, c), True
    return c, c, c, False


def _tag(r):
    return str(r.get("note") or "").split(";")[0].strip().lower()


def transposed_y(sim, t):
    """Force-controlled task in a displacement-swept simulation (sim key "transpose"): the applied load, or None."""
    tr = sim.get("transpose") or {}
    if not tr or t.get("output") != tr.get("output"):
        return None
    v = (tr.get("y_values") or {}).get(t["id"])
    return num(v if v is not None else (t.get("inputs") or {}).get(tr.get("y_input")))


def slot_series(slot, sim):
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
            sp = ref_spread(r)
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


def _floored(vals, floor):
    lo, hi = min(v[1] for v in vals), max(v[2] for v in vals)
    mid = (lo + hi) / 2
    half = max(floor(mid), 0.0 if any(v[3] for v in vals) else REL_NO_SPREAD * abs(mid))
    return min(lo, mid - half), max(hi, mid + half), sum(v[0] for v in vals) / len(vals)


def slot_band(card_id, slot, sim):
    """{"band": [[x, lo, hi, centre], ...], "studies": {study: [[x, mean, lo, hi], ...]}} for one output of a
    simulation. x is null for an output without sweep; centre = mean of the study values that count at x.
    Floors: each measured curve (>= 2 points) keeps at least +-5 % of its own largest |value| around each point
    (digitising tolerance, as before); the band keeps at least the absolute floor of the unit, and +-25 % of its
    centre when no contributing value has a spread."""
    ser = slot_series(slot, sim)
    xs = sorted({x for pts in ser.values() for x, _ in pts}, key=_xkey)
    sfl = {k: CURVE_FLOOR * max(abs(v[0]) for _, v in pts) if len(pts) >= 2 else 0.0 for k, pts in ser.items()}

    def floor(mid):
        return max(ABS_FLOOR.get(slot["unit"], 0.0), REL_FLOOR.get(card_id, 0.0) * abs(mid))

    def at(keys, x):
        out = []
        for k in keys:
            v = series_at(ser[k], x)
            if v:
                out.append((v[0], min(v[1], v[0] - sfl[k]), max(v[2], v[0] + sfl[k]), v[3]))
        return out

    band = []
    for x in xs:
        lo, hi, c = _floored(at(ser, x), floor)
        band.append([x, r6(lo), r6(hi), r6(c)])
    studies = {}
    for st in sorted({k[0] for k in ser}, key=str):
        own = [k for k in ser if k[0] == st]
        for x in sorted({x for k in own for x, _ in ser[k]}, key=_xkey):
            lo, hi, c = _floored(at(own, x), floor)
            studies.setdefault(st, []).append([x, r6(c), r6(lo), r6(hi)])
    return {"band": band, "studies": studies}


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
    ok, errs, scale, studies, answered = [], [], 0.0, {}, 0
    for o in sd["outputs"]:
        raw = _lookup(ans, o["path"], nkey[o["key"]] == 1)
        nx = len(o["band"])

        def y(x, raw=raw, nx=nx):
            if isinstance(raw, list):
                return interp(raw, x) if x is not None else None
            v = num(raw)
            return v if (x is None or nx == 1) else None

        for x, lo, hi, _c in o["band"]:
            v = y(x)
            answered += v is not None
            ok.append(v is not None and lo <= v <= hi)
        for st, pts in o["studies"].items():
            s = studies.setdefault(st, {"hit": 0, "n": 0, "e": [], "cmax": 0.0})
            for x, c, lo, hi in pts:
                v = y(x)
                s["n"] += 1
                s["cmax"] = max(s["cmax"], abs(c))
                scale = max(scale, abs(c))
                if v is not None:
                    s["hit"] += lo <= v <= hi
                    s["e"].append(v - c)
                    errs.append(v - c)
    frac = sum(ok) / len(ok) if ok else 0.0
    rms = lambda e, m: round(math.sqrt(sum(x * x for x in e) / len(e)) / m, 3) if e and m else None
    return {"pass": bool(ok) and frac >= SIM_PASS, "sim": True, "points_passed": f"{sum(ok)}/{len(ok)}",
            "answered": answered > 0, "nrmse": rms(errs, scale),
            "studies": {st: {"in_own_spread": f"{s['hit']}/{s['n']}", "nrmse": rms(s["e"], s["cmax"])}
                        for st, s in studies.items()}}


# ---------------------------------------------------------------- tasks (MSK cards)

def ref_band(r, floor):
    c = next((num(r.get(k)) for k in ("mean", "median") if num(r.get(k)) is not None), None)
    lo, hi = num(r.get("min")), num(r.get("max"))
    if c is None:
        if lo is None or hi is None:
            return None
        c = (lo + hi) / 2
    sd = num(r.get("sd"))
    if sd is not None and sd > 0:
        lo, hi = c - sd, c + sd
    elif lo is not None and hi is not None and hi > lo:
        lo, hi = min(lo, c), max(hi, c)
    else:
        lo, hi = c - REL_NO_SPREAD * abs(c), c + REL_NO_SPREAD * abs(c)
    f = floor(c)
    return (min(lo, c - f), max(hi, c + f), c)


def subject_key(r):
    m = re.match(r"\s*(WP\d+)\b", str(r.get("note") or ""))
    return m.group(1) if m and r.get("n") in (None, 1) else None


def score_task(ans, val, floor):
    """ans: answers.json entry; val: number or {subject: number}. -> dict(pass, ...)."""
    refs = ans.get("refs") or []
    by = {}
    for r in refs:
        b = ref_band(r, floor)
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
        half = max(ps or 0.0, floor(pm))
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


def score_card(cid, card, answers):
    units_floor = lambda unit: (lambda c: max(ABS_FLOOR.get(unit, 0.0), REL_FLOOR.get(cid, 0.0) * abs(c)))
    res, units = {}, []
    if card["sims"]:
        for sid, sd in card["sims"].items():
            r = score_sim(sd, answers.get(sid))
            res[sid] = r
            units.append(r["pass"])
        answered = sum(1 for r in res.values() if r["answered"])
    else:
        for tid, a in card["tasks"].items():
            r = score_task(a, unwrap(answers.get(tid), a.get("output")), units_floor(a.get("unit", "")))
            res[tid] = r
            units.append(bool(r.get("pass")))
        answered = sum(1 for r in res.values() if r.get("value") is not None or r.get("hits", "").endswith("subjects"))
    return res, {"units": len(units), "kind": "simulations" if card["sims"] else "tasks", "answered": answered,
                 "passed": sum(units), "score": round(sum(units) / len(units), 3) if units else None}


def score(sub, cards, card_opt=None):
    per = normalise(sub, cards, card_opt)
    report, summary = {}, {}
    for cid in ([card_opt] if card_opt else sorted(cards)):
        if cid not in cards:
            raise SystemExit(f"unknown card {cid}")
        res, s = score_card(cid, cards[cid], per.get(cid, {}))
        report[cid], summary[cid] = res, s
    scored = [s["score"] for s in summary.values() if s["score"] is not None]
    tot_u = sum(s["units"] for s in summary.values()); tot_p = sum(s["passed"] for s in summary.values())
    return {"summary": summary, "overall": {"mean_card_score": round(sum(scored) / len(scored), 3) if scored else None,
                                            "passed": tot_p, "units": tot_u}, "results": report}


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
                  f"{r['overall']['passed']}/{r['overall']['units']} units")
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
        print(f"{cid:26s} passed {s['passed']:4d}/{s['units']:<4d} {s['kind']:11s} answered {s['answered']:4d}  score {s['score']}")
    o = r["overall"]
    print(f"overall: mean card score {o['mean_card_score']}  ({o['passed']}/{o['units']} units)")
    if a.out:
        Path(a.out).write_text(json.dumps(r, indent=1, ensure_ascii=False), encoding="utf-8")
        print(f"per-unit report -> {a.out}")
    else:
        for cid, res in r["results"].items():
            for uid, x in res.items():
                print(f"  {cid}/{uid}: {'PASS' if x.get('pass') else 'fail'}  "
                      + ", ".join(f"{k}={v}" for k, v in x.items() if k not in ("pass", "studies_hit", "studies", "sim")))


if __name__ == "__main__":
    main()
