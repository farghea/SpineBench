# SpineBench for agents

## What the agent is asked to do

SpineBench tests whether an AI agent can **set up, run and report a spine simulation the way a careful modeller would**,
and whether the model it uses agrees with human experiments. The agent is not asked to fit anything and never sees the
measured values.

There are two kinds of question:

- **Simulations** (FE and tissue cards). A simulation is one physical test a modeller runs once: one specimen type and
  set of boundary conditions, one loading direction, one preload type, one output definition. The swept input (pure
  moment, strain, displacement, force, follower load or preload) is the x of its curves. Everything measured in that
  run belongs to it: the ROM of every level of a multi-level specimen, disc pressure and ROM under the same moment sweep,
  a stiffness or slope read from the same curve. **All studies of the same test are combined into one simulation**,
  whatever their age or source (primary or review-compiled), control mode (force- or displacement-controlled), level,
  region or specimen, as long as the output means the same thing. Their spread is the acceptance band. The agent runs
  the simulation once and returns one curve per output.
- **Tasks** (MSK cards). One posture, load and subject; one number. Unchanged.

Simulations stay separate only where the test or the output really differs: one-direction vs full-range ROM; no
preload vs axial vs follower preload (and different preload sizes, unless the preload is the swept input); lumbar vs
thoracic; different tissues or ligaments; and **different specimen types never share a band**: a disc unit without
posterior elements vs a motion segment, a single lamella vs a multi-lamella strip vs a cruciform vs a square annulus
specimen, a specimen with its facet capsules removed vs an intact one, with vs without rib cage. (A motion segment on
its own or inside a longer ligamentous spine under pure moment is one type: the segment carries the same moment.)
Failure values (stress or force at rupture) are their own outputs, never points of a loading curve; curves stop at
failure.

**Each physical test is scored once.** Intact ROM is scored in `lumbar_rom` / `thoracic_rom` only. A removal
(dissection) step is scored as **% of the model's own intact state** (`rom_pct`, `disp_pct`, `k_pct`): the agent runs
its intact specimen first as the baseline (not scored there), removes the structures in order, and reports
step / intact x 100. Reference values are the study's printed % where it gives one, else the study's step value /
its intact value of the same specimens x 100 (ratio of the group means or medians; no spread, so the +-25 % floor
applies). Each step (each cumulative state) is its own simulation, with every loading direction of that state as an
output. Single-condition values that share no sweep with anything stay single simulations.

What the agent has to **develop**: a working simulation pipeline for one model family:

| Domain | Cards | The agent's model must... |
|---|---|---|
| MSK (in vivo) | `lumbar_idp_invivo`, `thoracic_idp_invivo`, `implant_loads_invivo`, `emg_load_holding`, `flexion_relaxation`, `maximal_exertions` | scale a trunk musculoskeletal model to a subject (sex, age, height, mass), set a posture and hand load, solve muscle forces, and report disc pressure (from compression with Ghezelbash 2016 Eq. 6), implant force, muscle activation (%MVC, normalised as the study did) or maximal moments |
| FE (in vitro) | `lumbar_rom`, `thoracic_rom`, `lumbar_resection`, `thoracic_resection`, `idp_invitro`, `facet_forces`, `segment_stiffness` | build the cadaveric specimen (FSU, disc with vertebral bodies, multi-level spine, with/without rib cage), fix the caudal end, sweep the pure moment / preload / displacement, remove structures step by step, and report rotation, nucleus pressure, facet force, force-displacement or stiffness |
| Tissue | `annulus_tissue`, `ligament_tissue`, `ribcage_tissue` | reproduce a material test (uniaxial / biaxial tension, bone-ligament-bone pull, rib bending, joint moment, dead-weight pin loads) with one parameter set per tissue, and report the stress-strain or load-deflection curve, moduli and failure values |

What is **validated**: the model's predictions against 137 studies (140 study entries: Bass 2004, Zhu 2008 and Ghezelbash 2024 each appear twice, as two groups or two methods). The 1581 FE and tissue values form **199
simulations** (one per physical test: e.g. all six directions of one stiffness protocol are one simulation); the 435 MSK
tasks stay tasks: **634 scoring units** in all.
An agent may answer only the cards its model covers; unanswered units count as not passed.

## Simulations per card

| Card | Tasks (old units) | Simulations | Combined across studies | Kept as their own simulation, and why |
|---|---|---|---|---|
| `lumbar_rom` | 301 | 16 | 4 one-direction moment sweeps (no preload: Oxland, Sawa, Heuer 2007a/2008, Guan, Rohlmann, Yamamoto 1989; FSUs and segments of multi-level specimens, one curve per level); 3 full-range sweeps (Wilke 2025, Sawa, Cook, Kettler, Busscher, Renner; ROM and neutral zone of the same run); the L1-S1 8/6 Nm follower-load sweep (Patwardhan, Renner, Stanley, Gornet) | Panjabi 1994, 4 directions: 100 N axial preload. Schultz 1979, 4 directions: 400 N axial preload, one point each |
| `thoracic_rom` | 154 | 25 | with rib cage, no preload: 3 full-range sweeps (Mannen, Healy, Lubelski, Liebsch 2017/2020, Watkins, Rahm, Wilke 2025 segmental; total, regional, segmental ROM and nz of one run) and 4 one-direction sweeps (Mannen, Liebsch 2018, Orbach); without rib cage: 3 full-range (Wilke 2025 FSUs, Busscher 4-vertebra segments) and 4 one-direction (Wilke 2017, Liebsch 2022, Oxland) | Sis 2016 follower sweeps at 5 Nm (3); Liebsch 2018 at 400 N follower (4, preload); Watkins 50 N axial (1, preload); T2-S1 without ribs, 8/6 Nm follower sweep (1, specimen); intact Wilke 2020 T6-T7 FSU without ribs at 2.5 Nm and Brasiliense 2011 4-vertebra segments with ribs at 7.5 Nm (moved here from the resection card) |
| `lumbar_resection` | 54 | 10 | every step as % of the model's own intact ROM; Heuer 2007a (L4-L5) and Heuer 2008 (L2-L3) share 3 states (posterior structures removed, + PLL/ALL, + nucleus): one simulation per state, outputs per level and direction | every other Heuer 2007a step (L4-L5 only); Schultz 1979 posterior elements removed (400 N preload); Cannella 2008 nucleotomy (printed %). Intact states are scored in `lumbar_rom` |
| `thoracic_resection` | 130 | 33 | every step as % of the model's own intact ROM (printed % of Liebsch 2017 and Watkins 2005 where given) | each cumulative step of each protocol (Wilke 2020 T6-T7, Liebsch 2017, Watkins, Liebsch 2020 incl. the 6 monosegments cut out with rib stumps, each vs the same segment in situ, Healy at T4-T5, Lubelski at T8-T9, Mannen 2018 vs the same spines intact in Sis 2016, Brasiliense 4-vertebra segments): the steps differ between studies. Intact states are scored in `thoracic_rom` |
| `idp_invitro` | 99 | 30 | lumbar pure-moment sweeps per direction (Heuer 2007b FSU, Popovich L1-sacrum, Rohlmann change from unloaded); axial compression of motion segments, any lumbar level (Schultz, Frei, Brinckmann, slope of Dennison); unloaded lumbar IDP (Heuer, Rohlmann) | Cannella disc units in compression (specimen type); Heuer 2007b steps (7); Schultz 400 N preload sweeps (4); thoracic FSU sweeps (Wilke 2020b, 4 + unloaded); Anderson 2016 follower sweep and rib-cage-removed slope; Anderson 2018 moment slopes (one simulation with rib cage, one without; 3 directions each); Frei eccentric and shear loads (one simulation, 4 load cases); Steffen imposed postures (one simulation, 4 postures) |
| `facet_forces` | 65 | 22 | pure-moment sweeps per direction (Zhu, Sawa, Popovich, Schendel flexion; Jaramillo, capsules removed, in its own 3 simulations); centric compression (Lorenz, Yang & King, Farooq: force, facet share, neural-arch share) | single-study set-ups, one simulation per test with outputs per direction: Sawa 400 N follower, Schendel peaks, Schendel eccentric-compression slopes, Wiseman 15 Nm + 700 N, Lorenz extension, Rousseau shear (sagittal; lateral bending sweep), Botolin imposed rotations, Ivicsics cycles (intact / nucleotomy), Yang & King eccentric, Pollintine 2000 N, Farooq 1500 N, Popovich pelvic tilt |
| `segment_stiffness` | 203 | 26 | axial compression, force vs displacement: **motion segments** (Asano, Tencer, Berkson intact, Frei) and **disc units** (Marini, Brown, Markolf & Morris, Jamison, Cannella) as two simulations; Gardner-Morse stiffness and Janevic motion as outputs of the same preload sweep (4 DOF); axial stiffness at ~0.5 MPa preload (Amin FSUs; Costi disc units apart); thoracic A-P shear (Panjabi, Yamamoto); L1-S1 under 1200 N follower (Renner heights, Patwardhan angle) | one simulation per protocol, outputs per DOF: Amin (FSU) and Costi (disc unit) six-DOF stiffness; Panjabi thoracic six DOFs; Tencer flexibilities (pressurised nucleus); Berkson intact shear; removal steps as % of intact: Berkson posterior elements cut (shear and compression), Amin isolated disc; Frei shear; Edwards; Adams & Dolan; Skrzypiec; Cannella tension; Patwardhan flexed path |
| `annulus_tissue` | 229 (20 curves) | 7 | single lamella along fibres (Holzapfel, 4 regions; Skaggs 1994); uniaxial circumferential strips (Wagner-Lotz, Elliott & Setton, O'Connell 2009, Ebara 4 regions); uniaxial axial strips (Elliott & Setton, O'Connell 2009) | cruciform specimens (Bass 2004 circumferential, axial and biaxial) and square biaxial specimens (O'Connell 2012) each in their own simulation |
| `ligament_tissue` | 227 (38 curves) | 14 | one per ligament and region: lumbar (Chazal, Pintar 3 level groups) and thoracic (Wiczenbach averaged curve and Table 2 points with SD, Chazal) | ISL+SSL complex, ISL and SSL are different ligaments; the lumbar capsule equilibrium curve (Little & Khalsa, relaxed stress) is a different output; Nachemson & Evans LF stress at rupture (a failure value, not a curve point) |
| `ribcage_tissue` | 84 | 22 | costovertebral pure-moment ROM in torsion, cranial-caudal and ventral-dorsal flexion (Duprey, Lemosse ribs 2/6/10, Lebschy), moment sweep 0.1-0.6 Nm | single tests of one study each (Gradischar costal cartilage: one simulation, 7 modes; Lebschy costovertebral: one simulation, 4 modes; rib bending, rib-head and sternum pin loads per direction, Duprey moment-angle curves); Granik bending modulus is defined differently from Yoganandan's |
| MSK cards | 435 | 435 tasks | - | in vivo conditions are independent questions; unchanged |

## What the agent receives

`site/data/agent_tasks.jsonl`, one line per card (no reference values in it); `site/data/agent/<card>.json` holds the same line.

- `agent_prompt`: plain-text instructions; `simulate`: <= 5 steps common to the card; `inputs` / `outputs`: meaning
  and unit of every key; `studies`: key, year, n and sample of every study (no values).
- FE and tissue cards: `simulations`, one entry per simulation:
  `{id, title, note, fixed, variants, sweep: {key, label, unit, values}, outputs: [{key, label, unit, level | direction | ..., scalar, at}], studies, study_notes, answer}`.
  `fixed` = inputs equal in every study; `variants` = inputs that differ between the studies combined (specimen,
  region, level); `sweep.values` = the union of the studies' x values (the agent may return a denser curve);
  `outputs[].at` = inputs that apply to one output only; `force_controlled` lists the loads a force-controlled study
  applied (its x is its measured displacement, so it is not listed).
- MSK cards: `tasks`: `{id, label, inputs, output, unit, level, studies, [patients]}` and `subjects` (anthropometry).
- `answer_format`: per simulation (FE/tissue) or per task (MSK); `scoring`: one line on how it is scored.

Card `notes` are not exported (some quote reference magnitudes). Neither are ref notes or test ids.

## What the agent returns

One JSON object, nested as `answer_format`, values in its units, `null` where the model cannot run it:

```json
{"lumbar_rom": {"flex_none": {"rom_segmental": {"L4-L5": [[0, 0], [1, 1.2], [2.5, 3.0], [5, 5.0], [7.5, 6.4], [10, 7.5]],
                                                "L2-L3": [[0, 0], [1, 0.9], [2.5, 2.0], [4, 2.9], [7.5, 4.6]]},
                              "rom_total": {"L1-L5 / T12-L4": [[0, 0], [3.75, 12.0]]}},
                "flex_ax100": null},
 "lumbar_resection": {"fsu_nuc": {"rom_pct": {"L4-L5": {"flexion": 205, "extension": 180}}}},
 "annulus_tissue": {"circumferential": {"stress": [[0, 0], [2, 0.05], [4, 0.2], [8, 0.8], [17, 2.1]]}},
 "lumbar_idp_invivo": {"standing": {"idp": 0.55}}}
```

A curve is `[[x, y], ...]` in the sweep unit; it is read at every band x by linear interpolation, and band x values
outside the curve's x range count as failed (no extrapolation). Where a simulation has no sweep, or an output is marked
`scalar`, the value is one number. A curve or number given directly under the output key is accepted when that key has
one output in the simulation. Also accepted: flat `"card/sim": {...}`, or `--card` with the card's object alone.
MSK values as before: a number, `{output: number}`, or `{study key | patient id: number}` per subject.

## How it is scored (`tools/score_agent.py`)

```
python3 tools/score_agent.py agent_answers.json --out report.json
python3 tools/score_agent.py --selftest
```

**Simulations.**
1. **Band at each x where data exist** (per output, per level or direction where the simulation has several):
   lower = the lowest over the studies of (mean - SD, else min, else mean); upper = the highest of (mean + SD, else
   max, else mean); a median uses its [min, max], else the median. Several values of one study (left/right, women/men,
   individual specimens) all count. A study with several curves in one output (layers, regions, specimens) counts as
   several curves, each read on its own; never their average.
2. **The range spanned by the studies.** Studies rarely share x values (strains, displacements). A study curve also
   counts at the x of the other studies that fall inside its own measured range, read by linear interpolation (never
   extrapolated). So at 4 Nm the band holds Guan's measured point and Heuer's curve between 2.5 and 5 Nm.
3. **Hull of the data.** The band is the hull of all measured curves, so it never dips where one curve's measured
   range ends (before 2026-11-16 it did, e.g. the lamella band after Holzapfel's VLe curve stops at 3 %).
   **Rising / falling outputs** (simulation key `"monotone"`: `"rising"`, `"falling"`, or per output
   `{"k_rot": "rising", "rot": "falling"}`): for a rising output the upper edge is the running max from the left and
   the lower edge the running min from the right (mirrored for a falling one), so the band rises (falls) with the
   data. Marked: stress-strain, force-displacement, ROM-moment, IDP and facet force vs moment or load, stiffness vs
   preload (rising); ROM vs follower preload, displacement or rotation under a fixed load vs preload (falling).
   Outputs whose curves do both (IDP in extension, Stanley's T11-L1) are not marked; they get the **convex hull** of
   all measured points (with spread and floors), which closes the dips scattered studies leave. Rising/falling
   outputs do not: plotted over all 115 swept outputs, the convex hull cut across the shape of the data (the toe of
   J-shaped stress-strain curves, the knee of ROM vs moment and of ROM vs follower load) and let a straight line pass,
   while the rising/falling envelope already closes the gaps. Simulation key `"hull": true/false` overrides.
   **Picked by eye (2026-11-16).** Every output whose three candidate bands (lowest-to-highest at each x,
   rising/falling envelope, convex hull) differ was reviewed against its curves. Where the plain lowest-to-highest band
   fits the data better, the simulation has `"hull": false` and no `"monotone"` (annulus axial, biaxial and square
   biaxial; ligament ISL, ISL+SSL and capsule, lumbar; sternum deflection; segment flexion moment); where the convex
   hull fits better, `"hull": true` and no `"monotone"` (annulus circumferential; segment compression, FSU and disc
   unit). The others keep the rule above.
4. **Floors.** Each measured curve keeps at least +-5 % of its own largest value around its points (digitising
   tolerance). The band is never narrower than the unit's absolute floor (0.5 deg, 0.02 MPa, 5 N, 1 Nm, 1 kPa, 0.05 mm,
   2 %), and where no contributing value has a spread (a lone value, or values without SD or range) it is at least
   +-25 % of its centre.
5. **Force-controlled points** in a displacement-swept simulation (Tencer, Berkson, Frei, Cannella in the compression
   test) are read as (measured displacement, applied force); their displacement spread becomes a force spread through
   the slope of the study's own curve.
6. **Pass**: the agent's curves lie inside the band at **>= 80 % of all band points of the simulation** (all outputs
   together). Failed band points are listed per output (`failed_points`: x and no answer / below / above). The report
   also gives, per study, how many of its own points fall inside its own spread
   (`in_own_spread`) and the NRMSE (RMS error / largest |mean| of that study), and an NRMSE over all studies.

**Tasks (MSK, unchanged).** Band of one reference = mean +- SD (else [min, max], else +-25 %), floored (also 26 % of the
value for the in vivo IDP cards, the Ghezelbash lab tolerance). A task passes inside the pooled mean +- pooled SD when
it has a pooled value (>= 2 independent studies; `tools/pool_outcomes.py`), else inside the bands of at least half of
its studies; per-subject answers: at least half of the matching references must pass.

**Card score** = passed units / all units (simulations or tasks). **Overall** = mean of the card scores (each card
weighs the same); the plain total is reported too.

**Two extra results** (added 2026-11-18), reported next to the score above, which stays the main result:

- **Within 2 SD.** The same rules with every mean +- SD band widened to mean +- 2 SD. Ranges (min-max, used for
  medians), the +-25 % for values without spread, the curve floors and the unit floors are not widened, so only values
  that come with an SD gain (e.g. ROM, facet force, EMG, maximal moments, Polga's thoracic IDP). Simulations read
  `band_2sd` in `answers.json` (missing = same as `band`; 318 of 667 outputs differ). Keys: `pass_2sd`, `passed_2sd`,
  `score_2sd`, `mean_card_score_2sd`.
- **EMG correlation.** For the %MVC outputs of the MSK cards (EMG load holding, flexion-relaxation, maximal
  exertions): Pearson r between the answered EMG and the measured mean, all muscles and conditions of one study
  together (one experiment, e.g. Lavender's pull directions, Elrich's load magnitudes), and all studies of the card
  together. Nobody can measure a muscle's force, and EMG varies widely between people, so whether the model gets the
  pattern across muscles and tasks right says as much as the hits. Key `emg_r` = `{"all": {"r", "n"}, "by_study":
  {study: {"r", "n"}}}`; r needs at least 3 answered pairs (read r from a handful of pairs with care).

**Report results by study.** A card pools several experiments, and a card score can hide which experiment a model
gets right and which it misses (e.g. EMG load holding: 47/100 tasks within 2 SD, but Elrich's load magnitudes 35/50
and Ghezelbash 2020 2/16). So every published result gives, next to the card scores (main and 2 SD), one row per study
per card: the study's own values hit inside the study's own spread (main rule and 2 SD; simulation points or task
values), the number of scoring units it appears in, and for EMG its r. The scorer writes this table in the summary
(`by_study` per card) and prints it with `--by-study`:

```
python3 tools/score_agent.py answers_from_agent.json --by-study --out report.json
      lavender1992    inside own spread    2/14 (0.143)  2 SD    2/14 (0.143)  units 14  EMG r 0.719 (n 14)
```

Example (run_model_v2, 2026-11-18): main score 0.225 (159/628 units); within 2 SD 0.334 (281/628). EMG r: load holding
0.21 (n 88; Lavender 0.72, Lariviere 0.74, Elrich 0.50), flexion-relaxation 0.04 (n 70; Ghezelbash 2024 0.76,
Shin -0.48), maximal exertions 0.51 (n 38).

Self-test (`--selftest`, current data): (a) the band midpoint passes every simulation (205/205; MSK oracle 423/423);
(b) the mean of the study values at each x passes every simulation, and every study mean lies inside its simulation's
band (1808/1808 curve points); (c) an all-null answer scores 0; (d) curves shifted two band widths above the band fail
205/205. The 2 SD result gives the same: 628/628, 628/628, 0/628, 0/205.

The per-test `pass_rule` strings in `bench/tests` are richer (trend checks, sign of change after resection) and stay the
reference for a human review; the scorer applies the uniform rule above so that all 16 cards are scored the same way.

## Three worked examples

**1. Tissue - `annulus_tissue / circumferential`.** One test: a lumbar annulus strip pulled in the circumferential
direction, quasi-static, nominal stress vs nominal strain. Four studies: Wagner-Lotz 2004 (mean-coefficient fit),
Elliott & Setton 2001 (2 samples), O'Connell 2009, Ebara 1996 (outer/inner, anterior/posterolateral); Bass 2004's
cruciform specimens are their own simulation (`circumferential_cruciform`). The 88 values give 80 band points from 0 to
16.6 % strain; regions and specimens are one band (the model uses one parameter set). The agent runs it once and returns
`{"stress": [[0, 0], [2, 0.05], [4, 0.2], [6, 0.45], [8, 0.8], [10, 1.1], [12, 1.4], [14, 1.7], [17, 2.1]]}`.
This output uses the convex hull (picked by eye, rule 3): at 4 % the band runs from -0.04 to 1.10 MPa, at 8.25 % from
0.03 to 2.16 MPa (the stiff Ebara outer curves set the top). 75 of 80 points are inside -> **PASS**, NRMSE 0.288. The per-study report shows where it
sits: inside 16/53 Ebara points, 4/9 Elliott & Setton, 2/18 O'Connell and 1/8 Wagner-Lotz.

**2. FE - L4-L5 flexion moment sweep: Guan + Heuer, and Panjabi.** Simulation `lumbar_rom / flex_none`: flexion, one
direction, no preload, moment swept 1-10 Nm; outputs = segmental ROM at T12-L1, L2-L3, L3-L4, L4-L5, L5-S1 and the
total ROM of a 4-segment spine (18 band points). At L4-L5 Guan 2007 (segment of T12-S1, 1-4 Nm, mean +- SD) and Heuer
2007a (FSU, 1-10 Nm, median [min-max]) combine into the rising envelope: band 1 Nm [0.39, 3.23], 2.5 Nm [1.59, 5.21], 4 Nm [2.42, 6.44], 5 Nm [3.31, 6.82], 7.5 Nm [4.15, 8.14], 10 Nm [4.86, 11.11] deg. The curve `[[0, 0], [1, 1.2], [2.5, 3.0], [5, 5.0], [7.5, 6.4], [10, 7.5]]` is inside all 6;
with the other levels answered as well the simulation passes 18/18 (answering L4-L5 only: 6/18 -> fail).
Panjabi 1994 tested the same direction with **100 N axial preload** kept along the specimen axis, so it is its own
simulation `flex_ax100` (L1-L2 to L5-S1 of one L1-S1 specimen): its L4-L5 band is 2.5 Nm [4.52, 8.30], 5 Nm
[5.13, 10.45], 7.5 Nm [5.75, 11.28], 10 Nm [6.36, 11.88] deg; the same curve is inside only at 7.5 and 10 Nm. Putting
Panjabi into the no-preload band would have widened it at 2.5 Nm to [1.59, 8.30] deg and hidden the preload effect.

**3. FE - `segment_stiffness / compression` and `compression_disc_unit`.** Axial compression, force vs displacement,
is two tests, because a disc unit without posterior elements and a motion segment are different specimens.
Motion segments (`compression`, 0-1.64 mm, 14 band points): Asano 1992 (displacement-controlled), and, read at their
measured displacement, Tencer 1982 (275-825 N), Berkson 1979 intact (86-400 N) and Frei 2002 (500 N, 0.30 +- 0.14 mm).
Disc units (`compression_disc_unit`, 0-1.95 mm, 22 band points): Marini 2016 (6 disc units), Brown 1957 and Markolf &
Morris 1974 (stiffest/average/softest disc, via Ghezelbash 2020a), Jamison 2013 (fast 80-1000 ms impacts, flagged in
`study_notes`), Cannella 2008 (1500 N, 5th cycle). Berkson's posterior-elements-cut points are a removal step, scored
as % of intact in `berk_pe`. The curve
`{"force": [[0, 0], [0.2, 80], [0.4, 250], [0.6, 500], [0.8, 800], [1.0, 1150], [1.2, 1550], [1.5, 2200], [2.0, 3300]]}`
passes the disc-unit band (22/22, NRMSE 0.20) but fails the motion-segment band (9/14: above it from 1.0 mm on). When
both specimen types shared one band (before 2026-11-16) the same curve passed 31/32.

## Known limits (read before publishing results)

- The "hidden" answers are public: `answers.json`, `benchmark.json` and every test file are on the website. A fair run must
  give the agent `agent_tasks.jsonl` only and no web or repository access.
- Combined bands are as wide as the studies disagree. Where one study is much stiffer than another (Ebara vs Wagner-Lotz
  in the annulus, Brown's stiffest vs softest disc) the band is wide and a pass says little; read the per-study
  `in_own_spread` and NRMSE alongside it. Lower bounds can fall below zero at small strains because of the floors.
- A simulation counts once however many values it holds (the compression test holds 98), so a card score is a share
  of tests, not of data points.
- The site's "Copy agent prompt" button copies the card's line of `agent_tasks.jsonl` with the prompt; give the agent
  that line, not the prompt alone.
- Some values cannot be pinned down from the data (see below); they are scored but should be read with care.
  Neutral-zone outputs need a model with hysteresis, and the T1-T12 NZ values disagree 3-4x between labs.

### Remaining ambiguities (information not in the card or its tests)

- `lumbar_idp_invivo`: `sit_flex_max`, `sit_relaxed`, `sit_erect`, `sit_backrest`, `sit_slouched`, `extension`,
  `lift_squat` give the posture in words only (no trunk or lumbar angle); Wilke lifts are dynamic peaks.
- `implant_loads_invivo`: `lift_max` (crate 4-10.8 kg, stoop or squat, highest force over all sessions); `fix_flex`,
  `fix_ext`, `stand_latbend`, `sit_flex` have no angle.
- `flexion_relaxation`: Ghezelbash 2024 load (10 kg in the caption, 6 kg in Methods); the `load` input of the g20 tasks
  says "arms hanging" while the test protocol says the load is held 0.2 x body height ahead (the prompt says the latter).
- `emg_load_holding` / `flexion_relaxation`: the Ghezelbash 2020 load-height values were in both cards; since
  2026-11-16 they are scored once, in `flexion_relaxation` (the asymmetric-lift tasks stay in `emg_load_holding`).
- `facet_forces`: review-compiled specimens (Jaramillo, Wiseman, Lorenz, Yang & King, Pollintine, Farooq) have no specimen
  extent or level beyond "lumbar"; Lorenz and Pollintine rotations are ranges (6-8 deg, 6-12 deg).
- `ribcage_tissue`: `cvj_torsion_axis` moment is per body mass (+-0.002 Nm/kg) and the donors' mass is not given;
  Duprey's moment-angle curves (X, Y, Z) are not mapped to the torsion / flexion ROM axes, so they stay apart.
- `segment_stiffness`: the compression bands mix lumbar levels and rates; Jamison's fast impacts and Cannella's cyclic
  test are flagged but inside the disc-unit band.
- Removal steps derived from absolute values (step / intact x 100 of the group means or medians) carry no spread, so
  they get the +-25 % floor; a model that does not change at all passes a step that changes ROM by less than ~25 %.
- `thoracic_rom`: T1-T12 NZ at 5 Nm, Mannen 2015 (2.3 / 4.5 / 3.0 deg) vs Liebsch (8.3-16 deg): the band spans both.

## Proposed text for the website's #agents page

> **For agents**
>
> SpineBench asks an AI agent to do what a spine modeller does: read an experiment, build it in a model, run it and
> report the result. Finite element and tissue benchmarks are asked as **simulations**: one test run once (a moment
> sweep of one specimen in one direction, one stress-strain test of a tissue), combining every study of that test;
> the agent returns one curve per output. Musculoskeletal benchmarks stay **tasks**: one posture, load and subject, one
> number. The agent never sees the measured values.
>
> - **Give the agent** one line of `agent_tasks.jsonl` per benchmark: prompt, steps, simulations or tasks, subjects
>   and the answer format. Nothing else - no website, no `answers.json`.
> - **The agent returns** `{simulation: {output: [[x, y], ...]}}` or `{task: {output: value}}` in the units of
>   `answer_format`; `null` where its model cannot run it.
> - **Score it** with `tools/score_agent.py`: a simulation passes when its curves lie inside the range spanned by the
>   studies at >= 80 % of the points; a task passes inside the pooled mean +- SD, or the range of at least half of its
>   studies. The card score is the share of simulations and tasks passed. Also reported: the score with mean +- 2 SD,
>   and for EMG the correlation between the model and the measured means across all muscles and conditions.
>   Results are reported by study as well as by card (`--by-study`).
> - Every reference keeps its `test_id`, so each pass or fail can be traced to a table or figure in the source paper.
