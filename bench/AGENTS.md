# SpineBench for agents

## What the agent is asked to do

SpineBench tests whether an AI agent can **set up, run and report a spine simulation the way a careful modeller would**,
and whether the model it uses agrees with human experiments. The agent is not asked to fit anything. For each task it gets
a description of one experiment (who or what was tested, posture or load, level, output and unit). It builds that condition
in its own model, runs it, and returns one number (or one curve). We compare that number with the measured values, which
the agent never sees.

What the agent has to **develop**: a working simulation pipeline for one model family:

| Domain | Cards | The agent's model must... |
|---|---|---|
| MSK (in vivo) | `lumbar_idp_invivo`, `thoracic_idp_invivo`, `implant_loads_invivo`, `emg_load_holding`, `flexion_relaxation`, `maximal_exertions` | scale a trunk musculoskeletal model to a subject (sex, age, height, mass), set a posture and hand load, solve muscle forces, and report disc pressure (from compression with Ghezelbash 2016 Eq. 6), implant force, muscle activation (%MVC, normalised as the study did) or maximal moments |
| FE (in vitro) | `lumbar_rom`, `thoracic_rom`, `lumbar_resection`, `thoracic_resection`, `idp_invitro`, `facet_forces`, `segment_stiffness` | build the cadaveric specimen (FSU, multi-level spine, with/without rib cage), fix the caudal end, apply the pure moment / preload / displacement, remove structures step by step, and report rotation, nucleus pressure, facet force or stiffness |
| Tissue | `annulus_tissue`, `nucleus_endplate_tissue`, `ligament_tissue`, `ribcage_tissue` | reproduce a material test (uniaxial / biaxial tension, confined compression, swelling, bone-ligament-bone pull, rib bending, joint moment) with one parameter set per tissue, and report stress at strain, moduli, failure values |

What is **validated**: the model's predictions against 135 studies (1790 tasks; 1296 scoring units once tissue curves are
grouped). An agent that runs every task and stays within the experimental scatter has a validated model for that card.
An agent may answer only the cards its model covers; unanswered tasks count as not passed.

## What the agent receives

`site/data/agent_tasks.jsonl`, one line per card (no reference values in it):

- `agent_prompt`: plain-text instructions: model, subjects, conventions, how to compute the output, what to return.
- `simulate`: <= 5 steps common to all tasks; `inputs` / `outputs`: the meaning and unit of every input and output key.
- `subjects` (MSK cards): anthropometry per study key (and disc areas for IDP).
- `studies`: key, year, n and sample of every study (no values).
- `tasks`: `{id, label, inputs, output, unit, level, studies, [patients], [curve]}`.
  `studies` says whose subject or specimen the task is (MSK: scale to that subject). `patients` (implant loads) lists the
  patients with their own reference value. `curve` links a point to a curve.
- `curves` (tissue cards): `{id, label, output, unit, x, x_unit, points: [{task, x}]}` - one measured curve.
- `answer_format`: `{task id: {output key: unit}}` for every task; `scoring`: one line on how it is scored.

Card `notes` are not exported (some quote reference magnitudes). Neither are ref notes or test ids.

## What the agent returns

One JSON object, values in the units of `answer_format`, `null` where the model cannot simulate the task:

```json
{"lumbar_idp_invivo": {"standing": {"idp": 0.55}, "flex20": {"idp": 0.70}},
 "implant_loads_invivo": {"standing": {"vbr_force": {"WP1": 420, "WP2": 350, "WP3": 160}}},
 "lumbar_rom": {"L4L5_fe_7p5": {"rom_segmental": 11.8}},
 "annulus_tissue": {"lam_VLe": {"stress": [[0, 0], [0.5, 0.03], [1.0, 0.10], [1.5, 0.30], [2.0, 0.85], [2.6, 1.6]]}}}
```

Accepted shapes: nested by card (above), flat `"card/task": value`, or flat `{task: value}` with `--card`. A value may be a
number, `{output: number}`, or `{study key | patient id: number}` when the agent simulated each subject. A curve may be
given whole as `[[x, y], ...]`; it is read at each reference x by linear interpolation (no extrapolation).

## How it is scored (`tools/score_agent.py`)

```
python3 tools/score_agent.py agent_answers.json --out report.json
python3 tools/score_agent.py --selftest      # study means score 1293/1296, all-null scores 0
```

1. **Band of one reference value.** Centre = mean (else median). Half-width = its SD; if no SD, its [min, max]; if
   neither, 25 % of the value. The band is never narrower than a floor: 0.5 deg, 0.02 MPa, 2 %MVC, 2 % points,
   5 N, 1 Nm, 1 kPa, 0.05 mm; for the two in vivo IDP cards also 26 % of the value (the Ghezelbash lab IDP tolerance
   stored in those tests' `pass_rule`); for curve points also 5 % of the curve's largest value.
2. **Band of one study** in a task: the envelope of its values (individual subjects, left/right, men/women).
3. **Task.** If the task has a pooled value (>= 2 independent studies, means only; `tools/pool_outcomes.py`), it passes
   when the answer lies within pooled mean +- pooled SD (the pooled SD includes the between-study spread). Otherwise it
   passes when the answer lies within the bands of at least half of the task's studies. Per-subject answers: every
   matching reference is checked against its own value; at least half must pass. The report also gives the studies hit
   and the z-score against the pooled value.
4. **Curve.** Passes when >= 80 % of its points pass (missing points fail). The NRMSE (RMS error / largest value) is
   reported. This turns 577 tissue curve points into 83 curves, so one long curve cannot outweigh a card.
5. **Card score** = passed units / all units (a unit = a task outside curves, or a curve). **Overall** = mean of the
   card scores (each card weighs the same); the plain total is reported too.

The per-test `pass_rule` strings in `bench/tests` are richer (trend checks, sign of change after resection) and stay the
reference for a human review; the scorer applies the uniform rule above so that all 17 cards are scored the same way.

## Three worked examples

**1. MSK - `lumbar_idp_invivo / standing`.** Task: upright standing, arms hanging, no hand load, L4-L5; studies Wilke 2001,
Sato 1999, Takahashi 2006, Nachemson 1964. The agent scales its model to e.g. the Sato cohort (male, 24.5 y, 173.4 cm,
72.6 kg, disc 1585 mm2), gets L4-L5 compression F = 700 N and theta = 0, so P = 700/1585 = 0.442 MPa and Eq. 6 gives
IDP = -0.0156 + 1.255(0.442) + 0.0399(0.442)^2 = 0.55 MPa; it answers `{"idp": 0.55}`.
Score: pooled 0.487 +- 0.167 MPa (Wilke, Sato, Takahashi; Nachemson not pooled), band [0.32, 0.65] -> **PASS**
(z = 0.38; inside 3 of 4 study bands). For `flex20` (trunk 20 deg; only Takahashi 1.013 MPa, no SD) the band is
1.013 +- 26 % = [0.75, 1.28]; an answer of 0.70 MPa **fails**.

**2. FE - `lumbar_rom / L4L5_fe_7p5`.** Task: intact L4-L5 FSU, 7.5 Nm pure moment, flexion + extension summed (full range),
no preload. The agent fixes L5, applies +7.5 and -7.5 Nm to L4, and adds the two rotations: 11.8 deg. Score: pooled
10.39 +- 2.67 deg (Cook 2015 women and men, Wilke 2025), band [7.7, 13.1] -> **PASS**. Returning only flexion
(one direction) here would be a definition error: one-direction tasks have their own ids (`L4L5_flex_7p5`).

**3. Tissue - curve `annulus_tissue / lam_VLe`.** Fifteen tasks `lam_VLe_00..14` are the points of one measured curve:
single ventro-lateral external lamella pulled along its fibres, nominal stress vs nominal strain 0-2.7 %. The agent runs one
quasi-static simulation and returns `[[0,0],[0.5,0.03],[1.0,0.10],[1.5,0.30],[2.0,0.85],[2.6,1.6]]`. The scorer interpolates
at the 15 reference strains; these are single-specimen values (+-25 %, floor 5 % of 1.99 MPa = 0.10 MPa). 13 of 15 points
pass (87 % >= 80 %) -> **curve PASS**, NRMSE 0.02.

## Known limits (read before publishing results)

- The "hidden" answers are public: `answers.json`, `benchmark.json` and every test file are on the website. A fair run must
  give the agent `agent_tasks.jsonl` only and no web or repository access.
- The site's "Copy agent prompt" button copies `agent_prompt` + `answer_format` only. The prompts refer to `tasks`,
  `subjects`, `studies` and `curves`, so the agent also needs that card's line of `agent_tasks.jsonl`.
- Some tasks cannot be pinned down from the data (see "Remaining ambiguities" below); they are scored but should be read
  with care. Neutral-zone tasks need a model with hysteresis, and the three T1-T12 NZ tasks disagree 3-4x between labs.

### Remaining ambiguities (information not in the card or its tests)

- `lumbar_idp_invivo`: `sit_flex_max`, `sit_relaxed`, `sit_erect`, `sit_backrest`, `sit_slouched`, `extension`,
  `lift_squat` give the posture in words only (no trunk or lumbar angle); Wilke lifts are dynamic peaks.
- `implant_loads_invivo`: `lift_max` (crate 4-10.8 kg, stoop or squat, highest force over all sessions); `fix_flex`,
  `fix_ext`, `stand_latbend`, `sit_flex` have no angle.
- `flexion_relaxation`: Ghezelbash 2024 load (10 kg in the caption, 6 kg in Methods); the `load` input of the g20 tasks
  says "arms hanging" while the test protocol says the load is held 0.2 x body height ahead (the prompt now says the latter).
- `emg_load_holding` / `flexion_relaxation`: the same Ghezelbash 2020 values appear in both cards (counted twice overall).
- `facet_forces`: review-compiled specimens (Jaramillo, Wiseman, Lorenz, Yang & King, Pollintine, Farooq) have no specimen
  extent or level beyond "lumbar"; Lorenz and Pollintine rotations are ranges (6-8 deg, 6-12 deg).
- `ribcage_tissue`: `cvj_rom_EZ_torsion` moment is per body mass (+-0.002 Nm/kg) and the donors' mass is not given.
- `ligament_tissue`: force-elongation depends on the agent's ligament length and area, which the tasks do not give.
- `thoracic_rom`: T1-T12 NZ at 5 Nm, Mannen 2015 (2.3 / 4.5 / 3.0 deg) vs Liebsch (8.3-16 deg): no answer can pass both.

## Proposed text for the website's #agents page

> **For agents**
>
> SpineBench asks an AI agent to do what a spine modeller does: read an experiment, build it in a model, run it and report
> one number. Each task names the subject or specimen, the posture or load, the spinal level, the output and its unit. The
> agent never sees the measured values.
>
> - **Give the agent** one line of `agent_tasks.jsonl` per benchmark: prompt, simulation steps, subjects, tasks (with the
>   studies they come from) and the answer format. Nothing else - no website, no `answers.json`.
> - **The agent returns** `{task id: {output: value}}` in the units of `answer_format`; `null` where its model cannot
>   simulate the task; a whole curve as `[[x, y], ...]` for tissue curves.
> - **Score it** with `tools/score_agent.py`: a task passes inside the pooled mean +- SD of the studies, or inside the
>   range of at least half of them; a curve passes when 80 % of its points do. The card score is the share of tasks and
>   curves passed.
> - Every reference keeps its `test_id`, so each pass or fail can be traced to a table or figure in the source paper.
