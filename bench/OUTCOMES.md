# SpineBench outcome benchmarks (v1)

The benchmark is organised by **outcome**, not by study. One JSON file per benchmark in `bench/outcomes/<id>.json`.
A user (or an agent) reads one card, runs a few simulations, and compares with every study's value.
Inputs (kinematics, anthropometry) and muscle geometry are "coming next" and are NOT part of v1. Tissue tests ARE part of v1 (domain `tissue`): the task is the test mode a constitutive/FE model must reproduce.

Source of values: the extracted tests in `bench/tests/` (already checked against the PDFs). Do not re-extract; reorganise.
Every reference value keeps its `test_id`, so it stays traceable.

## The benchmarks (16 cards)

| id | Title | Domain | What is compared |
|---|---|---|---|
| `lumbar_idp_invivo` | Lumbar disc pressure in vivo (L4-L5) | MSK | IDP per task: standing, flexion, lifting, holding, sitting, lying, bending, twisting |
| `thoracic_idp_invivo` | Thoracic disc pressure in vivo | MSK | IDP per task at mid and lower thoracic discs (Polga 2004) |
| `implant_loads_invivo` | Spinal implant loads in vivo | MSK | Telemetered VBR / fixator force (or moment) per activity, absolute or relative to standing |
| `flexion_relaxation` | Flexion-relaxation | MSK | Back-muscle EMG (%MVC) vs trunk flexion angle; FR onset/cessation angles |
| `emg_load_holding` | Trunk EMG in static load holding | MSK | EMG (%MVC) per task: load mass, height, asymmetry, posture |
| `maximal_exertions` | Maximal trunk exertions | MSK | Input: direction of maximal effort (+ posture). Outputs side by side: primary moment, coupled moments, EMG at MVC |
| `lumbar_rom` | Lumbar range of motion | FE | Input: pure moment, direction, preload. Outputs: total (multi-level) ROM and segmental ROM per level |
| `thoracic_rom` | Thoracic range of motion | FE | Same, with/without rib cage: T1-T12 total and segmental ROM |
| `lumbar_resection` | Lumbar stepwise resection | FE | ROM after each removal step, absolute and % of intact |
| `thoracic_resection` | Thoracic stepwise resection | FE | ROM after each removal step incl. rib cage reduction and costovertebral joints |
| `idp_invitro` | Disc pressure in vitro | FE | IDP vs moment / compression / follower load |
| `facet_forces` | Facet joint forces | FE | Facet contact force (or load share) per direction and moment |
| `segment_stiffness` | Segment force-displacement | FE | Compression force-displacement curves and shear/compression stiffness of motion segments and whole discs (disc with vertebral bodies), whole-disc shear strength (human only) |
| `annulus_tissue` | Annulus fibrosus | tissue | Test mode = task: single lamella along fibre, uniaxial circumferential / axial / radial, biaxial, shear, confined compression, bone-AF-bone; by region (outer/inner, ant/post) and degeneration |
| `ligament_tissue` | Spinal ligaments | tissue | Per ligament (ALL, PLL, LF, ISL, SSL, capsule) and level: stiffness, failure force, failure elongation/strain, stress-strain |
| `ribcage_tissue` | Rib cage tissue and joints | tissue | Costal cartilage, ribs, costovertebral and costotransverse joints: stiffness / load-deflection / ROM |

Out of v1 (kept in `bench/tests`, not shown): inputs, properties, in vivo passive trunk, instrumented constructs, model-vs-model comparisons.

## Inclusion rules
1. Human data only (animal tests are excluded).
2. A study enters a benchmark only if it reports that benchmark's output. Example: flexion-relaxation needs EMG vs trunk flexion (or FR onset/cessation angles). Studies without it are left out.
3. One task = one condition that a model can simulate (posture/load or moment/direction/preload/level). Never put two different definitions in one task: one-direction ROM vs full range (flexion+extension), absolute vs relative IDP, mean vs median are different tasks or flagged by `stat`.
4. Per-subject rows are not refs; use the group value (keep individual subjects only if the study has n = 1 or reports only individuals, e.g. Wilke).
5. Review-compiled (`*_secondary`) values only if the primary study is not already in the benchmark; mark `"secondary": true`.
6. Shared samples: keep both studies but list the overlap in `shared` so pooling counts the subjects once.

## JSON format (`bench/outcomes/<id>.json`)
```json
{
  "id": "lumbar_idp_invivo",
  "title": "Lumbar disc pressure in vivo",
  "domain": "msk",                       // msk | fe | tissue
  "region": "lumbar",                    // lumbar | thoracic | lumbar+thoracic
  "levels": ["L4-L5"],
  "summary": "Simulate each task and report L4-L5 intradiscal pressure.",   // <= 25 words
  "simulate": ["Scale the model to the study subject (table below).", "..."],  // <= 5 short steps, common to all tasks
  "inputs":  [{"key": "posture", "label": "Posture"}, {"key": "hand_load_kg", "label": "Hand load", "unit": "kg"}],
  "outputs": [{"key": "idp", "label": "IDP", "unit": "MPa"}],
  "subjects": {"wilke2001": {"sex": "male", "age": 45, "height_cm": 174, "weight_kg": 70, "disc_area_mm2": 1800}},  // MSK only; one per study
  "studies": [{"key": "wilke2001", "short": "Wilke 2001", "year": 2001, "n": 1, "sample": "1 healthy male", "doi": "10.1016/...",
               "secondary": false, "pool": true}],   // pool:false = shown but not pooled (e.g. early-transducer data)
  "shared": [["sato1999", "x"]],          // pairs of study keys with overlapping subjects/specimens
  "views": [                              // how the site draws charts; each view = one chart
    {"id": "standing_flexion", "title": "Standing and flexion", "task_ids": ["standing", "flex10", "flex20"], "x": "task"},
    {"id": "fr_curve", "title": "Erector EMG vs flexion", "task_ids": ["..."], "x": "input:flexion_deg", "series": ["muscle", "load"]}
  ],
  "tasks": [
    {"id": "standing", "label": "Standing, relaxed", "view": "standing_flexion",
     "inputs": {"posture": "upright standing", "hand_load_kg": 0},
     "output": "idp", "level": "L4-L5",
     "refs": [{"study": "wilke2001", "mean": 0.50, "sd": null, "min": 0.43, "max": 0.50, "stat": "mean", "n": 1,
               "test_id": "msk_idp_lumbar.wilke2001.L4L5_standing", "note": ""}]}
  ],
  "notes": ["<= 3 short caveats a modeller must know"],
  "agent_prompt": "Plain text given to an agent: what model, subject, tasks, and what to return (short).",
  "answer_format": {"standing": {"idp": "MPa"}}   // one entry per task id
}
```
- `stat`: mean | median | value (single subject or no spread). `sd` only if SD (convert SE to SD only if n is known; say so in `note`).
- `series` (optional): which inputs name the curves in the legend (keeps legends short).
- `x: "input:<key>"` → numeric input on the x axis (curves: EMG vs flexion angle, ROM vs moment). Otherwise `"task"` (bars).
- Keep labels short (≤ 40 chars). No study names in task labels.

### Figures: small multiples (`"layout": "panels"`)
A curve view can be drawn like a paper figure: one small chart per panel, a shared legend on top (the study chips; click to hide a study in every panel), shared axes. Only the `views` entry changes; tasks and refs stay as they are.
```json
{"id": "rom_flex", "group": "ROM vs moment, one direction", "title": "Flexion ROM vs moment, per level",
 "layout": "panels", "panel_by": "level", "x": "input:moment_nm", "task_ids": ["..."],
 "legend_inputs": ["axial_n"], "panel_labels": {"L1-L2..L4-L5 pooled": "L1–L5, levels pooled"}}
```
- `panel_by`: input key (or `level`, read from the task) whose value gives the panel. Panel order: `panels` if given (list of values, or `{"value", "label"}`), else levels cranial→caudal (whole specimens first, "pooled" last), else numbers ascending, else first appearance.
- `panel_map` `{value: panel}` merges values into one panel (e.g. `"right lateral bending": "lateral bending"`); `panel_labels` `{value: label}` renames a panel.
- `series` (optional): inputs that split a study into several curves inside a panel (line style + marker, keyed per study). Several refs of one study in one task whose notes start with different words (e.g. `right;` / `left;`) become separate curves too.
- Unloaded points (panel value `none`/`neutral` at x = 0) start the curve in every panel.
- `legend_inputs`: inputs shown next to a study in the legend when all its tasks in the view share one non-zero value (e.g. "axial preload 100 N").
- Axes: x is shared by all panels (`"share_x": false` to free it), y is shared by panels with the same output (`"share_y": false` to free it); `x_min`, `x_max`, `x_title`, `y_title` override. `columns` caps the grid (default 3 on desktop, 2 on tablet/phone).
- Encoding (one line under each figure): mean ± SD → marker + line + error bars; mean with min/max and no SD over ≥ 2 x values → shaded min–max corridor; median → open marker + [min–max] bar; no spread → marker only.
- `models` (optional): `[{"test_id": "fe_model_comparison...", "x": "load", "where": {"x": "compression"}, "panel": "L4-L5", "label": "Published FE models (Dreischarf 2014)"}]` draws the min–max range across published models as a grey band under the data, labelled as models. It is read from `data/tests/<test_id>.json`, never pooled or scored. Use only when the test's condition matches the panel.
- `group`: views with the same group are listed together (tabs / menu). Titles read like short figure captions.
- The new keys are checked by `tools/check_outcomes.py`.
- Pooled values are computed by `tools/pool_outcomes.py` (n-weighted mean, shared samples counted once, medians not pooled). Do not hand-write them.

Check a file: `python3 tools/check_outcomes.py bench/outcomes/<id>.json`
