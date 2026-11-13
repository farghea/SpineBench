# SpineBench site

Static site (plain HTML/CSS/JS, Chart.js 4.4.1 from cdnjs, no build step for the front end), organised by
**outcome benchmark**. Cards come from `bench/outcomes/<id>.json` (format: `bench/OUTCOMES.md`).

## Preview locally

```bash
python3 site/build_index.py               # real cards only (what the deploy workflow runs)
python3 site/build_index.py --examples    # also the 2 EXAMPLE cards in site/dev/examples/outcomes
cd site && python3 -m http.server 8773    # open http://localhost:8773
```

## Pages (hash routes)

| Route | What |
|---|---|
| `#` | home: counts, one tile per benchmark in three sections (MSK, FE, tissue), "coming next" tiles |
| `#b/<id>[/<view>]` | one benchmark: how to simulate, subjects, a chart and task table per view, studies, notes, downloads |
| `#agents` | the three agent files |
| `#about` | what, how values were extracted and checked, pooling rule, cite, licence |

Old explorer links (`#test/...`, `#group/...`) show a "moved" page; the per-test files stay in `data/tests/`.

## Data written by build_index.py (site/data/)

| File | What |
|---|---|
| `outcomes.json` | index: id, title, domain, region, levels, tasks, studies, N, years; counts; an example agent line |
| `outcomes/<id>.json` | one card with `pooled` per task (computed by running `tools/pool_outcomes.py` on temp copies) |
| `outcomes/<id>.csv` | tasks x refs, one row per reference value, with the pooled value |
| `benchmark.json` | every card in one file |
| `agent_tasks.jsonl` | one line per card: prompt, answer format, subjects, studies, and simulations (FE/tissue) or tasks (MSK), **no reference values**; the same line per card in `agent/<id>.json` |
| `answers.json` | `{"answers": {card id: {task id: {output, unit, refs, pooled}}}, "simulations": {card id: {sim id: {outputs: [{path, band, studies}]}}}}` |
| `all.json`, `all.csv`, `tests/`, `groups/`, `categories/` | raw per-test data (footer "Raw data" link) |

## Files

| Path | What |
|---|---|
| `index.html` | page shell |
| `assets/app.js` | router, pages, charts (bars for small views, dot plot for big ones, lines for `x: "input:<key>"`) |
| `assets/style.css` | tokens (light/dark) and layout |
| `assets/logo.svg` | logo for header and favicon; replace this one file to change it |
| `build_index.py` | builds everything in `data/` |
| `dev/examples/outcomes/` | 2 EXAMPLE cards (`"example": true`), used only with `--examples` |

## Publish on GitHub Pages

The workflow `.github/workflows/pages.yml` runs `build_index.py` and deploys `site/`; every URL is relative,
so the site works from `https://<user>.github.io/<repo>/`.
