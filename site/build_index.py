#!/usr/bin/env python3
"""Build the SpineBench site data.

Outcome benchmarks (what the site shows): reads bench/outcomes/*.json and writes, under site/data/:
  outcomes.json           index of benchmarks (+ counts, planned ones not written yet)
  outcomes/<id>.json/.csv one card with pooled values (same rule as tools/pool_outcomes.py) / tasks x refs
  benchmark.json          every card in one file
  agent_tasks.jsonl       one line per card WITHOUT reference values: simulations (FE/tissue) or tasks (MSK)
  agent/<id>.json         the same line per card (what the site's "Copy agent prompt" button copies)
  answers.json            the hidden answers: {"answers": {card: {task: {output, unit, refs, pooled}}},
                          "simulations": {card: {sim: {outputs: [{path, band, studies}]}}}}

Raw per-test data (footer "Raw data" link) collects bench/tests/**/*.json and writes:
  index.json            light index (one entry per test) + taxonomy, groups, counts
  tests/<id>.json/.csv  one file per test
  groups/<id>.json/.csv one file per combine_group (all member tests)
  categories/<c>.csv    all data points of one category
  all.json, all.csv     everything
  SCHEMA.md             copy of bench/SCHEMA.md

Usage:
  python3 site/build_index.py               # real tests only (what the Pages workflow runs)
  python3 site/build_index.py --examples    # also include site/dev/examples (placeholder data,
                                            # outcome cards in site/dev/examples/outcomes)
"""
import argparse
import csv
import datetime as dt
import json
import re
import shutil
import sys
from pathlib import Path

SITE = Path(__file__).resolve().parent
ROOT = SITE.parent

# layer -> ordered categories (id, label, blurb, family)
TAXONOMY = [
    ("input", "Input", "What a model must be fed. Never graded.", [
        ("kinematics", "Kinematics", "Lumbopelvic rhythm, regional shares, rib motion", ""),
        ("anthropometry", "Anthropometry", "Segment mass, centre of mass, body dimensions", ""),
    ]),
    ("property", "Property", "Model anatomy and tissue, checked before any task.", [
        ("muscle_geometry", "Muscle geometry", "Moment arm, centroid distance, CSA, PCSA, architecture", ""),
        ("passive_tissue", "Passive tissue", "Ligament, annulus, nucleus, endplate, disc, rib cage joints", ""),
        ("segment_stiffness", "Segment stiffness", "FSU 6-DOF stiffness, preload effect", ""),
        ("trunk_passive_invivo", "Passive trunk in vivo", "Passive trunk moment vs angle", ""),
    ]),
    ("outcome", "Outcome", "Model predictions graded against data.", [
        ("msk_idp_lumbar", "Lumbar IDP in vivo", "Intradiscal pressure by posture and load", "MSK"),
        ("msk_idp_thoracic", "Thoracic IDP in vivo", "Intradiscal pressure by posture and load", "MSK"),
        ("msk_implant_loads", "Implant loads in vivo", "Telemetered vertebral body replacement loads", "MSK"),
        ("msk_emg_posture", "EMG", "Muscle activity by posture and load", "MSK"),
        ("msk_flexion_relaxation", "Flexion-relaxation", "Onset and cessation of back-muscle silence", "MSK"),
        ("msk_mvc_coupled", "MVC and coupled moments", "Maximum voluntary and coupled trunk moments", "MSK"),
        ("msk_successive_reduction", "Successive reduction", "", "MSK"),
        ("fe_rom_lumbar_fsu", "Lumbar FSU ROM", "Single-segment range of motion", "FE"),
        ("fe_rom_lumbar_multi", "Lumbar multi-segment ROM", "Multi-level range of motion", "FE"),
        ("fe_rom_thoracic", "Thoracic ROM", "With and without rib cage", "FE"),
        ("fe_idp_invitro", "IDP in vitro", "Intradiscal pressure in specimens", "FE"),
        ("fe_compression_stiffness", "Compression stiffness", "Axial force vs displacement", "FE"),
        ("fe_resection_lumbar", "Lumbar resection", "Stepwise removal of structures", "FE"),
        ("fe_resection_thoracic", "Thoracic resection", "Stepwise removal of structures", "FE"),
        ("fe_facet", "Facet joint", "Facet forces and contact", "FE"),
        ("fe_instrumented", "Instrumented", "Fixation, fusion, disc replacement", "FE"),
        ("fe_model_comparison", "Data from model-comparison papers", "In vitro and in vivo measurements re-plotted in Dreischarf 2014; no model results", "FE"),
    ]),
]
LAYER_OF = {c[0]: layer for layer, _, _, cats in TAXONOMY for c in cats}

CSV_COLS = [
    "test_id", "example", "layer", "category", "subcategory", "region", "levels", "condition",
    "quantity", "definition", "unit", "x", "series", "load", "mean", "sd", "median", "min", "max",
    "n", "extra", "study", "year", "study_n", "authors", "journal", "doi", "location", "method",
    "uncertainty", "checked", "combine_group",
]
ROW_KEYS = {"x", "series", "load", "mean", "sd", "median", "min", "max", "n"}


def warn(msg):
    print("WARN  " + msg, file=sys.stderr)


def safe_name(s):
    return re.sub(r"[^A-Za-z0-9._-]+", "_", str(s)).strip("._") or "unnamed"


def as_list(v):
    if v is None or v == "":
        return []
    return list(v) if isinstance(v, (list, tuple)) else [v]


def num_or_none(v):
    if isinstance(v, bool):
        return None
    if isinstance(v, (int, float)):
        return v
    if isinstance(v, str):
        try:
            return float(v.strip())
        except ValueError:
            return None
    return None


def parse_n(v):
    """n as a number: 8 -> 8, "26 males" -> 26, "" -> None."""
    n = num_or_none(v)
    if n is not None:
        return int(n) if float(n).is_integer() else n
    m = re.match(r"\s*(\d+)", str(v)) if v is not None else None
    return int(m.group(1)) if m else None


def load_tests(dirs):
    tests, seen = [], {}
    for base, is_example in dirs:
        if not base.is_dir():
            continue
        for path in sorted(base.rglob("*.json")):
            if "outcomes" in path.relative_to(base).parts:
                continue
            try:
                t = json.loads(path.read_text(encoding="utf-8"))
            except Exception as e:  # noqa: BLE001
                warn(f"{path}: not valid JSON ({e}); skipped")
                continue
            if not isinstance(t, dict):
                warn(f"{path}: top level is not an object; skipped")
                continue
            t.setdefault("id", path.stem)
            if is_example:
                t["example"] = True
            if t["id"] in seen:
                warn(f"{path}: duplicate id {t['id']} (first in {seen[t['id']]}); skipped")
                continue
            seen[t["id"]] = path
            src = t.get("source") if isinstance(t.get("source"), dict) else {}
            t["source"] = src
            if not t.get("category"):
                t["category"] = path.parent.name
            if not t.get("layer"):
                t["layer"] = LAYER_OF.get(t["category"], "outcome")
            for k in ("short", "year", "n"):
                if src.get(k) in (None, ""):
                    warn(f"{path}: source.{k} missing")
            if src.get("n") not in (None, "") and num_or_none(src.get("n")) is None:
                t["_n_text"] = True
            if not isinstance(t.get("data"), list):
                warn(f"{path}: data is not a list")
                t["data"] = []
            t["data"] = [r for r in t["data"] if isinstance(r, dict)]
            t["levels"] = [str(x) for x in as_list(t.get("levels"))]
            t["combine_group"] = [str(x) for x in as_list(t.get("combine_group"))]
            t["_file"] = safe_name(t["id"])
            tests.append(t)
    return tests


def csv_rows(t):
    src, q, ex = t["source"], t.get("quantity") or {}, t.get("extraction") or {}
    for r in t["data"]:
        extra = {k: v for k, v in r.items() if k not in ROW_KEYS and v not in (None, "")}
        yield {
            "test_id": t["id"], "example": "yes" if t.get("example") else "",
            "layer": t.get("layer", ""), "category": t.get("category", ""),
            "subcategory": t.get("subcategory", ""), "region": t.get("region", ""),
            "levels": ";".join(t["levels"]), "condition": t.get("condition", ""),
            "quantity": q.get("name", ""), "definition": q.get("definition", ""), "unit": q.get("unit", ""),
            "x": r.get("x", ""), "series": r.get("series", ""), "load": r.get("load", ""),
            "mean": r.get("mean", ""), "sd": r.get("sd", ""), "median": r.get("median", ""),
            "min": r.get("min", ""), "max": r.get("max", ""),
            "n": r.get("n") if r.get("n") is not None else parse_n(src.get("n")),
            "extra": json.dumps(extra, ensure_ascii=False) if extra else "",
            "study": src.get("short", ""), "year": src.get("year", ""), "study_n": src.get("n", ""),
            "authors": src.get("authors", ""), "journal": src.get("journal", ""), "doi": src.get("doi", ""),
            "location": ex.get("from", ""), "method": ex.get("method", ""),
            "uncertainty": ex.get("uncertainty", ""), "checked": ex.get("checked", ""),
            "combine_group": ";".join(t["combine_group"]),
        }


def write_csv(path, tests):
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=CSV_COLS, extrasaction="ignore")
        w.writeheader()
        for t in tests:
            for row in csv_rows(t):
                w.writerow({k: ("" if v is None else v) for k, v in row.items()})


def public(t):
    return {k: v for k, v in t.items() if not k.startswith("_")}


def humanize(s):
    s = re.sub(r"(?<=\d)p(?=\d)", ".", str(s)).replace("_", " ")
    s = re.sub(r"\b([CTLS]\d{1,2})([CTLS]\d{1,2})\b", r"\1-\2", s)
    s = re.sub(r"(\d)(Nm|N|deg|MPa|kg)\b", r"\1 \2", s)
    s = re.sub(r"\bribcage\b", "rib cage", s)
    for a, b in (("fsu", "FSU"), ("rom", "ROM"), ("idp", "IDP"), ("emg", "EMG"), ("mvc", "MVC"),
                 ("msk", "MSK"), ("nz", "NZ"), ("com", "COM"), ("fe", "FE"), ("csa", "CSA"), ("pcsa", "PCSA")):
        s = re.sub(rf"\b{a}\b", b, s)
    return s[:1].upper() + s[1:]


def group_title(gid, category=""):
    """'fe_facet__facet_force__L3-L4__intact__7.5Nm' -> 'Facet force · L3-L4 · intact · 7.5 Nm'."""
    if "__" not in gid:
        return humanize(gid)
    parts = [x for x in gid.split("__") if x and x != "-"]
    if parts and category and parts[0] == category:
        parts = parts[1:]
    out = [humanize(x) if i == 0 else x[:1] + humanize(x)[1:] for i, x in enumerate(parts)]
    return " · ".join(out) or humanize(gid)



def group_n(members):
    """Total n of a group: each study counted once (its largest n); studies that share
    subjects with another member study (shared_sample_with) are counted only once."""
    per = {}
    for t in members:
        k = str(t["source"].get("short"))
        per[k] = max(per.get(k, 0), parse_n(t["source"].get("n")) or 0)
    ids = {t["id"]: str(t["source"].get("short")) for t in members}
    seen, total = set(), 0
    for t in members:
        k = str(t["source"].get("short"))
        if k in seen: continue
        linked = {ids[i] for i in (t.get("shared_sample_with") or []) if i in ids} - {k}
        if linked & seen:
            seen.add(k); continue
        seen.add(k); total += per[k]
    return total

def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tests", default=str(ROOT / "bench" / "tests"))
    ap.add_argument("--groups", default=str(ROOT / "bench" / "groups"))
    ap.add_argument("--outcomes", default=str(ROOT / "bench" / "outcomes"))
    ap.add_argument("--out", default=str(SITE / "data"))
    ap.add_argument("--examples", action="store_true", help="include placeholder tests from site/dev/examples")
    a = ap.parse_args()

    dirs = [(Path(a.tests), False)]
    if a.examples:
        dirs.append((SITE / "dev" / "examples", True))
    tests = load_tests(dirs)
    tests.sort(key=lambda t: (t.get("category", ""), str(t["source"].get("short", "")), t["id"]))

    out = Path(a.out)
    for sub in ("tests", "groups", "categories"):
        shutil.rmtree(out / sub, ignore_errors=True)
        (out / sub).mkdir(parents=True, exist_ok=True)

    # optional group metadata: bench/groups/*.json with {"id", "title", "description"}
    gmeta = {}
    gdir = Path(a.groups)
    if gdir.is_dir():
        for p in sorted(gdir.glob("*.json")):
            try:
                g = json.loads(p.read_text(encoding="utf-8"))
                items = g if isinstance(g, list) else [g]
                for gi in items:
                    if isinstance(gi, dict) and gi.get("id"):
                        gmeta[gi["id"]] = gi
            except Exception as e:  # noqa: BLE001
                warn(f"{p}: {e}")

    index_tests, groups, studies, points = [], {}, {}, 0
    for t in tests:
        src, q = t["source"], t.get("quantity") or {}
        (out / "tests" / f"{t['_file']}.json").write_text(
            json.dumps(public(t), ensure_ascii=False, indent=1), encoding="utf-8")
        write_csv(out / "tests" / f"{t['_file']}.csv", [t])
        points += len(t["data"])
        skey = (str(src.get("doi") or "").lower() or
                f"{str(src.get('short', '')).lower()}|{src.get('year', '')}") + ("|ex" if t.get("example") else "")
        n = parse_n(src.get("n"))
        studies[skey] = max(studies.get(skey) or 0, n or 0)
        index_tests.append({
            "id": t["id"], "file": t["_file"], "title": t.get("title", t["id"]),
            "layer": t.get("layer", ""), "category": t.get("category", ""),
            "subcategory": t.get("subcategory", ""), "region": t.get("region", ""),
            "levels": t["levels"], "condition": t.get("condition", ""),
            "quantity": q.get("name", ""), "unit": q.get("unit", ""),
            "n": parse_n(src.get("n")), "n_text": str(src.get("n")) if t.get("_n_text") else "",
            "year": src.get("year"), "short": src.get("short", ""),
            "method": (t.get("extraction") or {}).get("method", ""),
            "checked": bool((t.get("extraction") or {}).get("checked")),
            "groups": t["combine_group"], "points": len(t["data"]),
            "tags": [str(x) for x in as_list(t.get("tags"))],
            "example": bool(t.get("example")),
        })
        for g in t["combine_group"]:
            groups.setdefault(g, []).append(t)

    index_groups = []
    for gid, members in sorted(groups.items()):
        members.sort(key=lambda t: (num_or_none(t["source"].get("year")) or 0, str(t["source"].get("short"))))
        meta = gmeta.get(gid, {})
        cat0 = members[0].get("category", "")
        q = members[0].get("quantity") or {}
        levels = sorted({lv for t in members for lv in t["levels"]})
        years = [y for y in (num_or_none(t["source"].get("year")) for t in members) if y]
        fname = safe_name(gid)
        (out / "groups" / f"{fname}.json").write_text(json.dumps(
            {"id": gid, "meta": meta, "tests": [public(t) for t in members]}, ensure_ascii=False, indent=1),
            encoding="utf-8")
        write_csv(out / "groups" / f"{fname}.csv", members)
        index_groups.append({
            "id": gid, "file": fname, "title": meta.get("title") or group_title(gid, cat0),
            "description": meta.get("description", ""),
            "category": members[0].get("category", ""), "layer": members[0].get("layer", ""),
            "quantity": q.get("name", ""), "unit": q.get("unit", ""), "levels": levels,
            "tests": [t["id"] for t in members],
            "studies": len({str(t["source"].get("short")) for t in members}),
            "n_total": group_n(members),
            "years": [int(min(years)), int(max(years))] if years else [],
            "example": all(t.get("example") for t in members),
        })

    cats = {}
    for t in tests:
        cats.setdefault(t["category"], []).append(t)
    for c, members in cats.items():
        write_csv(out / "categories" / f"{safe_name(c)}.csv", members)

    taxonomy, known = [], set()
    for layer, label, blurb, clist in TAXONOMY:
        entry = {"id": layer, "label": label, "blurb": blurb, "categories": []}
        for cid, clabel, cblurb, fam in clist:
            known.add(cid)
            entry["categories"].append({"id": cid, "label": clabel, "blurb": cblurb, "family": fam})
        taxonomy.append(entry)
    for c in sorted(set(cats) - known):  # categories not in the taxonomy above
        layer = cats[c][0].get("layer", "outcome")
        tgt = next((e for e in taxonomy if e["id"] == layer), None)
        if tgt is None:
            tgt = {"id": layer, "label": layer.title(), "blurb": "", "categories": []}
            taxonomy.append(tgt)
        fam = "MSK" if c.startswith("msk_") else "FE" if c.startswith("fe_") else ""
        tgt["categories"].append({"id": c, "label": humanize(c), "blurb": "", "family": fam})
        warn(f"category '{c}' is not in the taxonomy; shown as '{humanize(c)}'")

    index = {
        "generated": dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC"),
        "counts": {"studies": len(studies), "tests": len(tests), "points": points,
                   "subjects": int(sum(studies.values())),
                   "groups": sum(1 for g in index_groups if len(g["tests"]) > 1),
                   "examples": sum(1 for t in tests if t.get("example"))},
        "taxonomy": taxonomy, "tests": index_tests, "groups": index_groups,
    }
    (out / "index.json").write_text(json.dumps(index, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (out / "all.json").write_text(json.dumps(
        {"generated": index["generated"], "tests": [public(t) for t in tests]}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    write_csv(out / "all.csv", tests)
    schema = ROOT / "bench" / "SCHEMA.md"
    if schema.is_file():
        shutil.copyfile(schema, out / "SCHEMA.md")
    n_text = sum(1 for t in tests if t.get("_n_text"))
    if n_text:
        warn(f"{n_text} tests give source.n as text (schema: a number); the site uses the leading integer")
    c = index["counts"]
    print(f"{c['tests']} tests ({c['examples']} examples), {c['studies']} studies, {c['points']} data points, "
          f"{c['subjects']} subjects/specimens, {c['groups']} pooled groups -> {out}")
    build_outcomes(Path(a.outcomes), SITE / "dev" / "examples" / "outcomes" if a.examples else None, out)


# ---------------------------------------------------------------- outcome benchmarks
# The v1 benchmarks in display order (bench/OUTCOMES.md). Cards not written yet show as "in preparation".
KNOWN_OUTCOMES = [
    ("lumbar_idp_invivo", "Lumbar disc pressure in vivo", "msk"),
    ("thoracic_idp_invivo", "Thoracic disc pressure in vivo", "msk"),
    ("implant_loads_invivo", "Spinal implant loads in vivo", "msk"),
    ("flexion_relaxation", "Flexion-relaxation", "msk"),
    ("emg_load_holding", "Trunk EMG in static load holding", "msk"),
    ("maximal_exertions", "Maximal trunk exertions", "msk"),
    ("lumbar_rom", "Lumbar range of motion", "fe"),
    ("thoracic_rom", "Thoracic range of motion", "fe"),
    ("lumbar_resection", "Lumbar stepwise resection", "fe"),
    ("thoracic_resection", "Thoracic stepwise resection", "fe"),
    ("idp_invitro", "Disc pressure in vitro", "fe"),
    ("facet_forces", "Facet joint forces", "fe"),
    ("segment_stiffness", "Segment force-displacement", "fe"),
    ("annulus_tissue", "Annulus fibrosus", "tissue"),
    ("ligament_tissue", "Spinal ligaments", "tissue"),
    ("ribcage_tissue", "Rib cage tissue and joints", "tissue"),
]
REF_KEYS = ("study", "stat", "mean", "sd", "median", "min", "max", "n", "test_id", "note", "exclude_from_pool")


def pool_task(t, shared, nopool=frozenset()):
    """Fallback only (used if tools/pool_outcomes.py cannot be run). Same rule as tools/pool_outcomes.py: n-weighted mean of mean/value refs; studies with "pool": false and
    refs with "exclude_from_pool" are left out; several refs of one study are first combined into one study-level
    mean/SD; a study overlapping one already counted (`shared` groups) is skipped; medians not pooled; >= 2 studies."""
    refs = [r for r in t.get("refs", []) if r.get("stat") in ("mean", "value") and isinstance(r.get("mean"), (int, float))
            and not isinstance(r.get("mean"), bool) and r.get("study") not in nopool and not r.get("exclude_from_pool")]
    by = {}
    for r in refs:
        by.setdefault(r["study"], []).append(r)
    refs = []
    for st, rs in by.items():
        if len(rs) == 1:
            refs.append(rs[0]); continue
        vals = [r["mean"] for r in rs]; mu = sum(vals) / len(vals)
        if all(r.get("n") in (None, 1) and not isinstance(r.get("sd"), (int, float)) for r in rs):
            # individuals -> study mean, SD across them, n = count
            sdv = (sum((v - mu) ** 2 for v in vals) / (len(vals) - 1)) ** 0.5
            refs.append({"study": st, "mean": mu, "sd": sdv, "n": len(rs), "stat": "mean"})
        else:  # same subjects reported twice (e.g. left/right) -> average, n counted once
            sds = [r["sd"] for r in rs if isinstance(r.get("sd"), (int, float))]
            refs.append({"study": st, "mean": mu, "sd": sum(sds) / len(sds) if sds else None,
                         "n": max((r.get("n") or 1) for r in rs), "stat": "mean"})
    seen, use = set(), []
    for r in refs:
        s = r["study"]
        if s in seen or any(s in p and (p - {s}) & seen for p in shared):
            continue
        seen.add(s); use.append(r)
    if len(use) < 2:
        return None
    ns = [r.get("n") or 1 for r in use]; N = sum(ns)
    m = sum(n * r["mean"] for n, r in zip(ns, use)) / N
    ss = sum((n - 1) * (r["sd"] ** 2) for n, r in zip(ns, use) if isinstance(r.get("sd"), (int, float)))
    ss += sum(n * (r["mean"] - m) ** 2 for n, r in zip(ns, use))
    sd = (ss / (N - 1)) ** 0.5 if N > 1 else None
    return {"mean": round(m, 4), "sd": round(sd, 4) if sd is not None else None, "N": N, "k": len(use),
            "studies": [r["study"] for r in use]}


def run_pool_tool(cards):
    """Pool with tools/pool_outcomes.py itself: it rewrites bench/outcomes in place, so run a copy of it on copies
    of the cards in a temp folder. Returns {card id: {task id: pooled}} or None (then pool_task's values stay)."""
    import subprocess, tempfile
    tool = ROOT / "tools" / "pool_outcomes.py"
    if not tool.is_file():
        return None
    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        (tmp / "tools").mkdir(); (tmp / "bench" / "outcomes").mkdir(parents=True)
        shutil.copyfile(tool, tmp / "tools" / "pool_outcomes.py")
        names = {}
        for i, c in enumerate(cards):
            name = f"{i:03d}.json"; names[name] = c["id"]
            (tmp / "bench" / "outcomes" / name).write_text(json.dumps(c, ensure_ascii=False), encoding="utf-8")
        try:
            subprocess.run([sys.executable, "-I", str(tmp / "tools" / "pool_outcomes.py")], check=True,
                           capture_output=True, text=True, timeout=120)
        except Exception as e:  # noqa: BLE001
            warn(f"tools/pool_outcomes.py failed ({getattr(e, 'stderr', '') or e}); using the built-in copy of its rule")
            return None
        out = {}
        for name, cid in names.items():
            c = json.loads((tmp / "bench" / "outcomes" / name).read_text(encoding="utf-8"))
            out[cid] = {t["id"]: t.get("pooled") for t in c.get("tasks", []) if isinstance(t, dict) and "id" in t}
        return out


def card_n(card):
    """Total subjects/specimens of a card; studies linked through `shared` count once (largest n)."""
    n = {s["key"]: (s.get("n") if isinstance(s.get("n"), int) else 0) for s in card["studies"]}
    parent = {k: k for k in n}
    def find(k):
        while parent[k] != k:
            k = parent[k]
        return k
    for pair in card.get("shared", []):
        ks = [k for k in pair if k in parent]
        for k in ks[1:]:
            parent[find(k)] = find(ks[0])
    comp = {}
    for k, v in n.items():
        comp[find(k)] = max(comp.get(find(k), 0), v)
    return sum(comp.values())


def distinct_totals(cards):
    """Papers and people counted once over all cards: study keys with the same DOI are one paper (e.g. two groups or two
    methods of one paper), and studies linked through a card's `shared` are one sample (largest n)."""
    n, paper = {}, {}
    for c in cards:
        if c.get("example"):
            continue
        for s in c["studies"]:
            v = s.get("n") if isinstance(s.get("n"), int) else 0
            n[s["key"]] = max(n.get(s["key"], 0), v)
            paper[s["key"]] = str(s.get("doi") or study_uid(s)).lower().strip()
    parent = {k: k for k in n}
    def find(k):
        while parent[k] != k:
            k = parent[k]
        return k
    first = {}
    for k, d in paper.items():
        if d in first:
            parent[find(k)] = find(first[d])
        else:
            first[d] = k
    for c in cards:
        for grp in c.get("shared", []):
            ks = [k for k in grp if k in parent]
            for k in ks[1:]:
                parent[find(k)] = find(ks[0])
    comp = {}
    for k, v in n.items():
        comp[find(k)] = max(comp.get(find(k), 0), v)
    return len(set(paper.values())), sum(comp.values())


def study_uid(s):
    return f"{str(s.get('short', s.get('key'))).lower()}|{s.get('year', '')}"


def load_cards(real_dir, ex_dir):
    cards, seen = [], {}
    for base, is_ex in ((real_dir, False), (ex_dir, True)):
        if not base or not base.is_dir():
            continue
        for p in sorted(base.glob("*.json")):
            try:
                c = json.loads(p.read_text(encoding="utf-8"))
            except Exception as e:  # noqa: BLE001  (a card may be half-written right now)
                warn(f"{p}: not valid JSON ({e}); skipped")
                continue
            if not isinstance(c, dict) or not isinstance(c.get("tasks"), list) or not isinstance(c.get("studies"), list):
                warn(f"{p}: not an outcome card (needs tasks and studies); skipped")
                continue
            c.setdefault("id", p.stem)
            if c["id"] in seen:
                warn(f"{p}: duplicate card id {c['id']} (first in {seen[c['id']]}); skipped")
                continue
            seen[c["id"]] = p
            if is_ex:
                c["example"] = True
            for k, d in (("levels", []), ("simulate", []), ("inputs", []), ("outputs", []), ("views", []),
                         ("notes", []), ("shared", []), ("subjects", {}), ("answer_format", {})):
                if not isinstance(c.get(k), type(d)):
                    c[k] = d
            c["studies"] = [s for s in c["studies"] if isinstance(s, dict) and s.get("key")]
            c["tasks"] = [t for t in c["tasks"] if isinstance(t, dict) and t.get("id")]
            shared = [set(x) for x in c["shared"] if isinstance(x, (list, tuple))]
            nopool = frozenset(st["key"] for st in c["studies"] if st.get("pool") is False)
            for t in c["tasks"]:
                t["refs"] = [r for r in t.get("refs") or [] if isinstance(r, dict)]
                if not isinstance(t.get("inputs"), dict):
                    t["inputs"] = {}
                pooled = pool_task(t, shared, nopool)
                if pooled:
                    t["pooled"] = pooled
                else:
                    t.pop("pooled", None)
            cards.append(c)
    pooled = run_pool_tool(cards)
    if pooled is not None:
        for c in cards:
            got = pooled.get(c["id"], {})
            for t in c["tasks"]:
                if got.get(t["id"]):
                    t["pooled"] = got[t["id"]]
                else:
                    t.pop("pooled", None)
    order = {k[0]: i for i, k in enumerate(KNOWN_OUTCOMES)}
    cards.sort(key=lambda c: (bool(c.get("example")), order.get(c["id"], 99), c["id"]))
    return cards


def card_csv(path, c):
    in_keys = [i["key"] for i in c["inputs"] if isinstance(i, dict) and i.get("key")]
    units = {o.get("key"): o.get("unit", "") for o in c["outputs"] if isinstance(o, dict)}
    studies = {s["key"]: s for s in c["studies"]}
    cols = (["benchmark", "task_id", "task", "view", "level", "output", "unit"] + [f"in_{k}" for k in in_keys] +
            ["study", "year", "study_n", "stat", "mean", "sd", "median", "min", "max", "n", "secondary", "pooled_in", "test_id", "note",
             "pooled_mean", "pooled_sd", "pooled_N", "pooled_k"])
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(cols)
        for t in c["tasks"]:
            p = t.get("pooled") or {}
            for r in t["refs"]:
                s = studies.get(r.get("study"), {})
                row = [c["id"], t["id"], t.get("label", ""), t.get("view", ""), t.get("level", ""), t.get("output", ""),
                       units.get(t.get("output"), "")] + [t["inputs"].get(k, "") for k in in_keys] + [
                       s.get("short", r.get("study")), s.get("year", ""), s.get("n", ""), r.get("stat", ""),
                       r.get("mean"), r.get("sd"), r.get("median"), r.get("min"), r.get("max"), r.get("n"),
                       "yes" if s.get("secondary") else "",
                       "yes" if r.get("study") in (p.get("studies") or []) else "", r.get("test_id", ""), r.get("note", ""),
                       p.get("mean"), p.get("sd"), p.get("N"), p.get("k")]
                w.writerow(["" if v is None else v for v in row])


def load_schematics(card_ids):
    """site/assets/schematics/index.json: {"<card_id>" or "<card_id>/<view_id>": "file.svg"} -> the entries whose
    file exists (the site serves site/assets directly, so nothing is copied)."""
    d = SITE / "assets" / "schematics"
    f = d / "index.json"
    if not f.is_file():
        return {}
    try:
        raw = json.loads(f.read_text(encoding="utf-8"))
    except (OSError, ValueError) as e:
        warn(f"schematics index unreadable: {e}")
        return {}
    keep = {}
    for k, v in (raw.items() if isinstance(raw, dict) else []):
        src = v.get("file") or v.get("svg") or v.get("src") if isinstance(v, dict) else v
        if not isinstance(src, str) or not src:
            continue
        if k.split("/")[0] not in card_ids:
            warn(f"schematic {k}: no such benchmark")
        if not (d / src).is_file():
            warn(f"schematic {k}: {src} missing")
            continue
        keep[k] = v
    return keep


N_COLORS = 12  # --s1 .. --s12 in site/assets/style.css


def study_colors(cards):
    """One colour slot (1..N_COLORS) per study key, the same on every card, so a study keeps its colour across
    benchmarks. Studies drawn in the same chart (one view) get different slots where possible: greedy colouring
    of the "shown together" graph (views weigh more than sharing a card), busiest studies first, lowest slot first."""
    nbr = {}

    def link(group, w):
        for a in group:
            nbr.setdefault(a, {})
            for b in group:
                if a != b:
                    nbr[a][b] = nbr[a].get(b, 0) + w

    for c in cards:
        tasks = {t["id"]: t for t in c["tasks"]}
        for v in c.get("views", []):
            if isinstance(v, dict):
                link({r.get("study") for tid in v.get("task_ids", []) for r in tasks.get(tid, {}).get("refs", [])} - {None}, 10)
        link({s["key"] for s in c["studies"]}, 1)  # chips and tables of the card
    order = sorted(nbr, key=lambda k: (-sum(nbr[k].values()), k))
    slot = {}
    for k in order:
        vclash, cclash = [0] * (N_COLORS + 1), [0] * (N_COLORS + 1)
        for b, w in nbr[k].items():
            if b in slot:
                vclash[slot[b]] += w // 10
                cclash[slot[b]] += w % 10
        # never share a colour inside one chart; prefer the 8 validated palette slots; then avoid card-mates
        slot[k] = min(range(1, N_COLORS + 1), key=lambda s: (vclash[s], s > 8, cclash[s], s))
    return dict(sorted(slot.items()))


# ---- agent export (agent_tasks.jsonl / answers.json) ----
# FE and tissue cards are answered per SIMULATION (card key `agent_sims`, bench/OUTCOMES.md): one test a modeller runs
# once, with its sweep input (moment, strain, displacement, force, load) as the x of the output curves. The bands
# written to answers.json come from tools/score_agent.py (one implementation of the rule, also used by the scorer).
# MSK cards stay task by task.
AGENT_SCORING = ("Scored by tools/score_agent.py (rule in bench/AGENTS.md). Simulations: at each x where studies have "
                 "data the band runs from the lowest (mean - SD, else min, else mean) to the highest (mean + SD, else "
                 "max, else mean) over the studies, never narrower than a small floor (+-25 % for a lone value without "
                 "spread); a simulation passes when its curves lie inside the band at >= 80 % of the band points (x "
                 "outside your curve fails). Tasks (MSK): inside the pooled mean +- SD, else inside the bands of at least "
                 "half of the studies. Card score = passed units / all units.")
_PATIENT = re.compile(r"^\s*(WP\d+)\b")


def _score_agent():
    """tools/score_agent.py as a module (its slot and band functions)."""
    import importlib.util
    spec = importlib.util.spec_from_file_location("spinebench_score_agent", ROOT / "tools" / "score_agent.py")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


SA = _score_agent()


def _distinct(vals):
    out = []
    for v in vals:
        if v is not None and v not in out:
            out.append(v)
    return out


def agent_sims(c):
    """(agent view [{id, title, note, fixed, variants, sweep, outputs, studies, answer}], answers {sim id: entry},
    {task id: sim id}) for a card with `agent_sims`; never reference values in the agent view."""
    sims = c.get("agent_sims")
    if not isinstance(sims, list) or not sims:
        return None, None, {}
    in_meta = {i.get("key"): i for i in c["inputs"] if isinstance(i, dict)}
    out_meta = {o.get("key"): o for o in c["outputs"] if isinstance(o, dict)}
    agent, answers, sim_of = [], {}, {}
    for s in sims:
        try:
            slots = SA.sim_slots(c, s)
        except (ValueError, KeyError) as e:
            warn(f"{c['id']}: {e}; simulation skipped")
            continue
        sweep, fixed, tr = s.get("sweep"), s.get("fixed") or {}, s.get("transpose") or {}
        tasks = [t for sl in slots for t in sl["tasks"]]
        for t in tasks:
            sim_of[t["id"]] = s["id"]
        fields = set(SA.sim_fields(s))
        hide = set(fixed) | {sweep} | fields | ({"level"} if "level" in fields else set())
        # sweep values: task inputs only (force-controlled tasks of a transposed simulation are read at their
        # measured value, which is a reference value: never exported)
        xs = sorted({t["inputs"].get(sweep) for sl in slots if not sl["scalar"] for t in sl["tasks"]
                     if SA.num(t["inputs"].get(sweep)) is not None and SA.transposed_y(s, t) is None}) if sweep else []
        variants = {}
        for k in in_meta:
            if k in hide or (tr and k == tr.get("y_input")):
                continue
            vals = _distinct(t["inputs"].get(k) for t in tasks)
            if vals:
                variants[k] = vals
        outs, template = [], {}
        for sl in slots:
            o = {"key": sl["key"], "label": out_meta.get(sl["key"], {}).get("label", sl["key"]), "unit": sl["unit"]}
            o.update({f: v for f, v in sl["by"].items()})
            if sl["scalar"] and sweep:
                o["scalar"] = True
            at = {}
            for k in in_meta:
                if k in hide or k in variants and len(variants[k]) == 1:
                    continue
                vals = _distinct(t["inputs"].get(k) for t in sl["tasks"])
                if len(vals) == 1 and k in variants:
                    at[k] = vals[0]
            if at:
                o["at"] = at
            outs.append(o)
            d = template
            for p in sl["path"][:-1]:
                d = d.setdefault(p, {})
            xu = in_meta.get(sweep, {}).get("unit", "") if sweep else ""
            d[sl["path"][-1]] = sl["unit"] if sl["scalar"] else f"[[{xu or sweep}, {sl['unit'] or sl['key']}], ...]"
        studies = _distinct(r.get("study") for t in tasks for r in t["refs"])
        e = {"id": s["id"], "title": s.get("title", s["id"])}
        if s.get("note"):
            e["note"] = s["note"]
        e["fixed"] = fixed
        if variants:
            e["variants"] = variants
        e["sweep"] = ({"key": sweep, "label": in_meta.get(sweep, {}).get("label", sweep),
                       "unit": in_meta.get(sweep, {}).get("unit", ""), "values": xs} if sweep else None)
        if tr:
            loads = sorted({y for t in tasks for y in [SA.transposed_y(s, t)] if y is not None})
            e["force_controlled"] = {"read_as": tr.get("as"), "loads": loads,
                                     "rule": "force-controlled studies are scored at their measured displacement: "
                                             "your curve must reach these loads"}
        e["outputs"] = outs
        e["studies"] = studies
        if s.get("study_notes"):
            e["study_notes"] = {k: v for k, v in s["study_notes"].items() if k in studies}
        e["answer"] = template
        agent.append(e)
        answers[s["id"]] = {
            "title": e["title"], "sweep": sweep, "sweep_unit": in_meta.get(sweep, {}).get("unit", "") if sweep else "",
            "task_ids": [t["id"] for t in tasks],
            "outputs": [{"slot": sl["id"], "key": sl["key"], "path": sl["path"], "unit": sl["unit"],
                         "scalar": sl["scalar"], "tasks": [t["id"] for t in sl["tasks"]], **SA.slot_band(c["id"], sl, s)}
                        for sl in slots]}
    return agent, answers, sim_of


def agent_task(t, units):
    """One task as the agent sees it: inputs, unit and the studies (keys only) whose subject or specimen it is.
    Never values: no refs, pooled, ref notes or test ids (ref notes can hold raw values)."""
    keep = {k: t[k] for k in ("id", "label", "inputs", "output", "level") if k in t}
    keep["unit"] = units.get(t.get("output"), "")
    st = []
    for r in t["refs"]:
        if r.get("study") and r["study"] not in st:
            st.append(r["study"])
    keep["studies"] = st
    pts = []
    for r in t["refs"]:
        m = _PATIENT.match(str(r.get("note") or ""))
        if m and r.get("n") in (None, 1) and m.group(1) not in pts:
            pts.append(m.group(1))
    if pts:
        keep["patients"] = pts  # per-patient refs (implant loads): answer {patient id: value}
    return keep


def build_outcomes(real_dir, ex_dir, out):
    cards = load_cards(real_dir, ex_dir)
    odir = out / "outcomes"
    shutil.rmtree(odir, ignore_errors=True)
    odir.mkdir(parents=True, exist_ok=True)
    generated = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    index, all_studies, lines, answers, sim_answers = [], {}, [], {}, {}
    for c in cards:
        fn = safe_name(c["id"])
        (odir / f"{fn}.json").write_text(json.dumps(c, ensure_ascii=False, indent=1), encoding="utf-8")
        card_csv(odir / f"{fn}.csv", c)
        years = [s["year"] for s in c["studies"] if isinstance(s.get("year"), int)]
        for s in c["studies"]:
            u = study_uid(s) + ("|ex" if c.get("example") else "")
            all_studies[u] = max(all_studies.get(u, 0), s.get("n") if isinstance(s.get("n"), int) else 0)
        index.append({
            "id": c["id"], "file": fn, "title": c.get("title", c["id"]), "domain": c.get("domain", ""),
            "region": c.get("region", ""), "levels": c["levels"], "summary": c.get("summary", ""), "views": [v.get("title", "") for v in c.get("views", [])],
            "tasks": len(c["tasks"]), "studies": len(c["studies"]), "N": card_n(c),
            "years": [min(years), max(years)] if years else [], "example": bool(c.get("example")),
        })
        units = {o.get("key"): o.get("unit", "") for o in c["outputs"] if isinstance(o, dict)}
        sim_view, sim_ans, sim_of = agent_sims(c)
        index[-1]["simulations"] = len(sim_view) if sim_view is not None else 0
        # card notes are NOT exported: some quote reference magnitudes (e.g. "~0.2-0.3 MPa even unloaded")
        lines.append({
            "id": c["id"], "title": c.get("title", ""), "domain": c.get("domain", ""), "levels": c["levels"],
            "summary": c.get("summary", ""), "agent_prompt": c.get("agent_prompt", ""),
            "answer_format": c["answer_format"],
            "simulate": c["simulate"], "inputs": c["inputs"], "outputs": c["outputs"], "subjects": c["subjects"],
            **({"patients": c["patients"]} if c.get("patients") else {}),  # demographics and surgery only, no values
            "studies": [{k: s.get(k) for k in ("key", "short", "year", "n", "sample")} for s in c["studies"]],
            **({"simulations": sim_view} if sim_view is not None else {"tasks": [agent_task(t, units) for t in c["tasks"]]}),
            "scoring": AGENT_SCORING,
            **({"example": True} if c.get("example") else {}),
        })
        answers[c["id"]] = {t["id"]: {"output": t.get("output", ""), "unit": units.get(t.get("output"), ""),
                                      "refs": [{k: r.get(k) for k in REF_KEYS if k in r} for r in t["refs"]],
                                      "pooled": t.get("pooled"),
                                      **({"simulation": sim_of[t["id"]]} if t["id"] in sim_of else {})}
                            for t in c["tasks"]}
        if sim_ans:
            sim_answers[c["id"]] = sim_ans
    have = {c["id"] for c in cards}
    planned = [{"id": i, "title": t, "domain": d} for i, t, d in KNOWN_OUTCOMES if i not in have]
    n_sims = sum(len(v) for v in sim_answers.values())
    n_sim_tasks = sum(len(sd["task_ids"]) for v in sim_answers.values() for sd in v.values())
    n_task_units = sum(len(c["tasks"]) for c in cards if c["id"] not in sim_answers)
    n_papers, n_people = distinct_totals(cards)
    counts = {"benchmarks": len(cards), "tasks": sum(len(c["tasks"]) for c in cards), "studies": n_papers,
              "N": n_people, "examples": sum(1 for c in cards if c.get("example")),
              "simulations": n_sims, "simulation_tasks": n_sim_tasks, "task_units": n_task_units,
              "units": n_sims + n_task_units}

    def shorten(line, n_units=1):
        l0 = dict(line)
        if "tasks" in l0:
            l0["tasks"] = l0["tasks"][:n_units]
        if "simulations" in l0:
            l0["simulations"] = l0["simulations"][:n_units]
        l0["answer_format"] = {k: v for k, v in list(l0["answer_format"].items())[:n_units]}
        l0["subjects"] = {k: v for k, v in list(l0["subjects"].items())[:1]}
        l0["studies"] = l0["studies"][:1]
        return l0
    ex_line = shorten(lines[0]) if lines else None
    ex_sim = next((shorten(l) for l in lines if l.get("simulations")), None)
    schem = load_schematics(have)
    for b in index:
        b["schematic"] = schem.get(b["id"])
    (out / "outcomes.json").write_text(json.dumps(
        {"generated": generated, "counts": counts, "benchmarks": index, "planned": planned, "agent_example": ex_line,
         "agent_example_sim": ex_sim,
         "study_colors": study_colors(cards), "schematics": schem, "schematics_index": (SITE / "assets" / "schematics" / "index.json").is_file()},
        ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    (out / "benchmark.json").write_text(json.dumps(
        {"name": "SpineBench", "version": "v1", "generated": generated, "benchmarks": cards}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    (out / "agent_tasks.jsonl").write_text("".join(json.dumps(l, ensure_ascii=False) + "\n" for l in lines), encoding="utf-8")
    # one agent file per card (what the site's "Copy agent prompt" button copies: prompt + tasks + subjects, no answers)
    (out / "agent").mkdir(exist_ok=True)
    for l in lines:
        (out / "agent" / f"{l['id']}.json").write_text(json.dumps(l, ensure_ascii=False, indent=1), encoding="utf-8")
    (out / "answers.json").write_text(json.dumps(
        {"generated": generated, "answers": answers, "simulations": sim_answers}, ensure_ascii=False, indent=1),
        encoding="utf-8")
    print(f"{counts['benchmarks']} outcome benchmarks ({counts['examples']} examples), {counts['tasks']} tasks, "
          f"{counts['studies']} studies, N = {counts['N']}; {len(planned)} not written yet")
    print(f"agent units: {n_sims} simulations ({n_sim_tasks} FE/tissue tasks) + {n_task_units} MSK tasks = "
          f"{counts['units']}")


if __name__ == "__main__":
    main()
