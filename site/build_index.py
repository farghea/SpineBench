#!/usr/bin/env python3
"""Build the SpineBench site data.

Collects bench/tests/**/*.json and writes, under site/data/:
  index.json            light index (one entry per test) + taxonomy, groups, counts
  tests/<id>.json/.csv  one file per test
  groups/<id>.json/.csv one file per combine_group (all member tests)
  categories/<c>.csv    all data points of one category
  all.json, all.csv     everything
  SCHEMA.md             copy of bench/SCHEMA.md

Usage:
  python3 site/build_index.py               # real tests only (what the Pages workflow runs)
  python3 site/build_index.py --examples    # also include site/dev/examples (placeholder data)
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
        ("fe_model_comparison", "Model comparison", "Published model-vs-model results", "FE"),
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


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--tests", default=str(ROOT / "bench" / "tests"))
    ap.add_argument("--groups", default=str(ROOT / "bench" / "groups"))
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
            "n_total": sum(parse_n(t["source"].get("n")) or 0 for t in members),
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


if __name__ == "__main__":
    main()
