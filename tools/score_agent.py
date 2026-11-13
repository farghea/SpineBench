#!/usr/bin/env python3
"""Score an agent's answers against the SpineBench reference values.

Usage:
  python3 tools/score_agent.py answers_from_agent.json [--card lumbar_idp_invivo] [--out report.json]
  python3 tools/score_agent.py --selftest            # oracle (study means) and null submissions

Inputs (defaults: site/data/answers.json and site/data/agent_tasks.jsonl, written by site/build_index.py):
  the agent's JSON, in any of these shapes
    {"<card>": {"<task>": {"<output>": 1.2}}}         nested by card (what answer_format asks for)
    {"<card>/<task>": 1.2}  or  {"<card>.<task>": 1.2}  flat, card-qualified
    {"<task>": 1.2}  with --card <card>                flat, one card (the shape given in the brief)
  a task value may be a number, {output: number}, or {study key | patient id: number} (one value per subject),
  null = not simulated. A curve (see "curves" in agent_tasks.jsonl) may be answered at once:
    {"<card>": {"<curve id>": [[x, y], ...]}}   or  {"<curve id>": {"<output>": [[x, y], ...]}}
  and is then read at every reference x by linear interpolation (no extrapolation).

Rule (also in bench/AGENTS.md):
  band of one reference value: centre = mean (else median, else the value);
    half-width = SD if given; else [min, max] if given; else 25 % of |centre| (single value, no spread);
    never narrower than the floor: max(ABS_FLOOR[unit], REL_FLOOR[card] x |centre|); for curve points the floor is
    at least 5 % of the curve's largest |centre|.
  band of one study in a task: the envelope of its references (individuals, left/right, men/women).
  task: PASS if the answer is inside the pooled band (pooled mean +- pooled SD, floored) when the task has a pooled
    value; otherwise PASS if it is inside the bands of at least half of the task's studies. With per-subject answers
    ({study or patient: value}) each matching reference is checked against its own value and at least half must pass.
  curve: PASS if >= 80 % of its reference points pass (points not answered count as failed); NRMSE reported.
  card score = passed units / all units, a unit being a task outside any curve, or a curve.
  overall = mean of the card scores (each card weighs the same) and the plain total.
"""
import argparse
import json
import math
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "site" / "data"

REL_NO_SPREAD = 0.25          # half-width for a single value with no SD or range
CURVE_PASS = 0.80             # fraction of points that must pass
CURVE_FLOOR = 0.05            # x max |value| of the curve
ABS_FLOOR = {"deg": 0.5, "MPa": 0.02, "kPa": 1.0, "N": 5.0, "Nm": 1.0, "%MVC": 2.0, "%": 2.0,
             "% of standing": 5.0, "mm": 0.05}
REL_FLOOR = {"lumbar_idp_invivo": 0.26, "thoracic_idp_invivo": 0.26}  # Ghezelbash lab IDP tolerance (test pass_rule)


def num(v):
    return v if isinstance(v, (int, float)) and not isinstance(v, bool) and math.isfinite(v) else None


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


def interp(pts, x):
    pts = sorted((num(a), num(b)) for a, b in pts if num(a) is not None and num(b) is not None)
    if not pts or x < pts[0][0] or x > pts[-1][0]:
        return None
    for (x0, y0), (x1, y1) in zip(pts, pts[1:]):
        if x0 <= x <= x1:
            return y0 if x1 == x0 else y0 + (y1 - y0) * (x - x0) / (x1 - x0)
    return pts[-1][1] if x == pts[-1][0] else None


def unwrap(v, output):
    """{output: x} -> x; leaves numbers, per-subject dicts and point lists alone."""
    if isinstance(v, dict) and output in v:
        return v[output]
    if isinstance(v, dict) and len(v) == 1 and isinstance(next(iter(v.values())), list):
        return next(iter(v.values()))
    return v


def normalise(sub, cards, card_opt):
    """-> {card: {task or curve id: raw value}}"""
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
        owners = [c for c in cards if k in cards[c]["tasks"]]
        if len(owners) == 1:
            out.setdefault(owners[0], {})[k] = v
        elif owners:
            print(f"warning: task id '{k}' is in several cards {owners}; qualify it as card/task", file=sys.stderr)
    return out


def load(answers_path, tasks_path):
    ans = json.loads(Path(answers_path).read_text(encoding="utf-8"))["answers"]
    cards = {cid: {"tasks": t, "curves": {}} for cid, t in ans.items()}
    if Path(tasks_path).is_file():
        for line in Path(tasks_path).read_text(encoding="utf-8").splitlines():
            if line.strip():
                c = json.loads(line)
                if c["id"] in cards:
                    cards[c["id"]]["curves"] = {cv["id"]: cv for cv in c.get("curves", [])}
    return cards


def score_card(cid, card, answers):
    units_floor = lambda unit, extra=0.0: (lambda c: max(ABS_FLOOR.get(unit, 0.0), REL_FLOOR.get(cid, 0.0) * abs(c), extra))
    tasks, curves = card["tasks"], card["curves"]
    in_curve = {p["task"]: cv_id for cv_id, cv in curves.items() for p in cv["points"]}
    res, units = {}, []
    for tid, a in tasks.items():
        if tid in in_curve:
            continue
        raw = unwrap(answers.get(tid), a.get("output"))
        r = score_task(a, raw, units_floor(a.get("unit", "")))
        res[tid] = r
        units.append(bool(r.get("pass")))
    for cv_id, cv in curves.items():
        whole = unwrap(answers.get(cv_id), cv.get("output"))
        centres = [ref_band(r, lambda c: 0.0) for p in cv["points"] for r in tasks[p["task"]]["refs"]]
        cmax = max((abs(b[2]) for b in centres if b), default=0.0)
        fl = units_floor(cv.get("unit", ""), 0.0)
        floor = lambda c, fl=fl, e=CURVE_FLOOR * cmax: max(fl(c), e)
        pts, errs = [], []
        for p in cv["points"]:
            v = interp(whole, p["x"]) if isinstance(whole, list) else unwrap(answers.get(p["task"]), cv.get("output"))
            r = score_task(tasks[p["task"]], v, floor)
            pts.append(bool(r.get("pass")))
            if num(r.get("value")) is not None:
                c = next((b[2] for b in (ref_band(x, lambda c: 0.0) for x in tasks[p["task"]]["refs"]) if b), None)
                if c is not None:
                    errs.append(r["value"] - c)
        frac = sum(pts) / len(pts) if pts else 0.0
        nrmse = (math.sqrt(sum(e * e for e in errs) / len(errs)) / cmax) if errs and cmax else None
        res[cv_id] = {"pass": frac >= CURVE_PASS, "curve": True, "points_passed": f"{sum(pts)}/{len(pts)}",
                      "nrmse": round(nrmse, 3) if nrmse is not None else None}
        units.append(frac >= CURVE_PASS)
    answered = sum(1 for k, r in res.items() if r.get("value") is not None or r.get("hits", "").endswith("subjects")
                   or (r.get("curve") and r.get("nrmse") is not None))
    return res, {"units": len(units), "answered": answered, "passed": sum(units),
                 "score": round(sum(units) / len(units), 3) if units else None}


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
                                            "passed": tot_p, "units": tot_u}, "tasks": report}


def oracle(cards):
    """Every study's mean (or median) as the answer -> what a perfect replica of the data would score."""
    sub = {}
    for cid, c in cards.items():
        for tid, a in c["tasks"].items():
            p = (a.get("pooled") or {}).get("mean")
            if p is None:
                b = next((ref_band(r, lambda x: 0.0) for r in a["refs"] if ref_band(r, lambda x: 0.0)), None)
                p = b[2] if b else None
            sub.setdefault(cid, {})[tid] = {a["output"]: p}
    return sub


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("submission", nargs="?")
    ap.add_argument("--card")
    ap.add_argument("--answers", default=str(DATA / "answers.json"))
    ap.add_argument("--tasks", default=str(DATA / "agent_tasks.jsonl"))
    ap.add_argument("--out")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    cards = load(a.answers, a.tasks)
    if a.selftest:
        for name, sub in (("oracle (pooled or first study mean)", oracle(cards)), ("all null", {})):
            r = score(sub, cards)
            print(f"{name}: mean card score {r['overall']['mean_card_score']}, "
                  f"{r['overall']['passed']}/{r['overall']['units']} units")
            for cid, s in r["summary"].items():
                print(f"   {cid:26s} {s['passed']:4d}/{s['units']:<4d} {s['score']}")
        return
    if not a.submission:
        ap.error("give a submission JSON or --selftest")
    sub = json.loads(Path(a.submission).read_text(encoding="utf-8"))
    r = score(sub, cards, a.card)
    for cid, s in r["summary"].items():
        print(f"{cid:26s} passed {s['passed']:4d}/{s['units']:<4d} answered {s['answered']:4d}  score {s['score']}")
    o = r["overall"]
    print(f"overall: mean card score {o['mean_card_score']}  ({o['passed']}/{o['units']} units)")
    if a.out:
        Path(a.out).write_text(json.dumps(r, indent=1, ensure_ascii=False), encoding="utf-8")
        print(f"per-task report -> {a.out}")
    else:
        for cid, res in r["tasks"].items():
            for tid, x in res.items():
                print(f"  {cid}/{tid}: {'PASS' if x.get('pass') else 'fail'}  "
                      + ", ".join(f"{k}={v}" for k, v in x.items() if k not in ("pass", "studies_hit")))


if __name__ == "__main__":
    main()
