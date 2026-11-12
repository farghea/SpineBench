# SpineBench: proposed in vivo / MSK suites

Target model: a static-optimisation (or EMG-assisted) trunk MSK model, with a thoracolumbar spine T1-S1 and a rib cage (OpenSim-type).
Paper IDs refer to `papers.csv`.

All pass thresholds below are **proposed templates, not values from the literature**. Tune them once the tables are extracted. Every case reports three things: the raw prediction, the error against the measured mean, and the error in units of measured SD (z = (pred − mean)/SD) where an SD exists.

## Common conventions (apply to every suite)
- **Case file** (`case.yaml`) holds:
  - subject anthropometry (sex, age, BH, BW, and segment masses if given);
  - posture: either segmental angles, or T1/T12/S1 angles plus a rhythm rule taken from KIN;
  - external loads: hand load, position, moment arm, harness forces;
  - what is measured, with mean, SD, n and source (table/figure).
- **Posture rule when only the trunk angle is reported:** split it using KIN-01 (thoracic/lumbar/pelvis shares, G07) and KIN-02 (lumbopelvic ratio by bin, G06). Record which rule was used.
- **Scaling:** scale to the reported subject (P01/P02 give one full set of anthropometry). When the cohort mean is the only option, also run ±1 SD of BW, because load is dominated by body weight (U02).
- **Normalisation of muscle output:** activation = F / (PCSA·σmax). Compare activation with EMG %MVC only within the same muscle site. Report the σmax used.
- **Three result levels:** PASS / WARN / FAIL per case, then an aggregate per suite. Aggregate metrics are R², slope and intercept of a Deming regression, RMSE, and the share of cases with |z| ≤ 2.

---

## S1. IDP-L: lumbar intradiscal pressure
- **Inputs:** anthropometry and posture of each IDP subject; hand loads. Wilke has full anthropometry; for Sato, Takahashi and Schultz use the reported mean subject.
- **Tasks (core set, ~20 cases):**
  - from Wilke 2001 (P02) and Wilke 1999 (P01): relaxed standing, standing flexed, standing extended, lateral bending, axial rotation, lifting 20 kg with a round back vs bent knees, holding 20 kg close vs far;
  - from Sato 1999 (P03): standing, flexion, extension;
  - from Takahashi 2006 (P04): standing and 10/20/30 deg flexion, each ±10 kg;
  - from Schultz 1982 (P07): standing with arms in/out ±8 kg, and 30 deg flexion with arms out ±8 kg;
  - from Andersson 1977 (P06): flexion angles with 200 N.
  - Exclude sitting and lying unless the model has a seat or support.
- **Outputs:**
  - L4-L5 IDP (L3-L4 for P06/P07), converted from compression using U01's IDP = f(Fc, θflex) regression. Report the simple IDP = Fc / (0.66·A) as a second line, as in Bruno (M01).
  - Raw compression at L4-L5 and L5-S1.
- **Pass rule (template):**
  - per case, |pred − meas| ≤ max(0.15 MPa, 25%);
  - suite R² ≥ 0.80, slope 0.8-1.25, RMSE ≤ 0.25 MPa;
  - the ordering must be monotonic: standing < flexed < flexed + load; round-back lift > bent-knee lift.
- **Baselines to report against:** U12 (OpenSim, AnyBody, 3DSSPP, regression); U11 Fig 3a; M01 Fig 4a.
- **Sources:** P01, P02, P03, P04, P07, P06, (P05 ratios), U01, U11, U12, V05, M01.

## S2. IDP-T: thoracic intradiscal pressure
- **Inputs:** mean anthropometry of the Polga cohort; 10 kg in each hand where stated.
- **Tasks:** standing; standing with 10 kg in each hand; same with elbows at 90 deg; 30 deg flexion ±10 kg; 15 deg extension; 30 deg axial rotation; 20 deg lateral bend (task list as used by Bruno 2015, Table 3).
- **Outputs:** IDP at T6-T7, T7-T8, T9-T10 and T10-T11 (MPa). Report which compression-to-IDP factor was used. There is no thoracic-specific factor (M01 reused 0.66), so the suite reports the result under factors of 0.6, 0.66 and 0.75.
- **Pass rule (template):**
  - prediction within the reported range per task;
  - task ranking agrees with Polga (Spearman ρ ≥ 0.7);
  - the load effect is correct: IDP(10 kg) > IDP(standing) at every level.
- **Sources:** P08, M01.

## S3. VBR: in vivo implant loads (telemeterised vertebral body replacement)
- **Inputs:** patient anthropometry from V02 Table 1 (62-71 yr, 168-180 cm, 60-74 kg); implant at L1 (or L3 for one patient).
- **Tasks:**
  - standing (reference);
  - upper-body flexion, extension, lateral bending and rotation (V01);
  - forward arm elevation with and without weight (V01, V02);
  - lifting from the ground, stoop vs squat, and a lateral one-hand lift (V02, V03);
  - carrying in front vs laterally vs in a backpack (V04).
- **Outputs:** L1 (or L3) axial compression. Compare it as **task/standing ratios**, because the fixator and implant take an unknown share of load; check the absolute resultant force only as an upper bound.
- **Pass rule (template):**
  - the predicted ratio falls inside the patient range for ≥ 70% of tasks;
  - orderings hold: front carry > lateral carry; stoop ≈ squat (within 10%, as V03 found a 4% difference);
  - absolute standing force within the 150-450 N range (V01 abstract), as a WARN only.
- **Sources:** V01, V02, V03, V04, V05, M01 (Fig 5).

## S4. EMG-PL: muscle activity in postures and lifting
- **Inputs:** the measured segmental kinematics (T11 and S1 rotations, or 17-segment IMU data), hand load and position, and anthropometry.
- **Tasks:**
  - **IRSST cohort (U04):** 10 kg at 4 heights (upright, mid-femur, knee, mid-tibia), plus asymmetric subsets;
  - **G02:** flexion at 40 and 65 deg ± load;
  - **G01:** upright ± hand loads;
  - **E05:** cable at T10 of 100/135/170 N, flexion vs extension;
  - **E04:** harness moments of 10-50 Nm by direction;
  - **P04/P07/P06:** EMG recorded together with IDP.
- **Outputs:** activation per muscle group (RA, EO, IO, multifidus, iliocostalis lumborum/thoracis, longissimus lumborum/thoracis, LD), compared with EMG %MVC.
- **Pass rule (template):**
  - per muscle group across tasks: Pearson r ≥ 0.7 for the extensors and ≥ 0.5 for the abdominals;
  - the change from one task to the next has the right sign in ≥ 80% of task pairs;
  - with mean ± SD data (U04), ≥ 70% of points have |z| ≤ 2;
  - **antagonist rule:** abdominal activation stays below 10% MVC in flexion with a load, where EMG shows no abdominal response (P04).
- **Sources:** U04, U11 (Fig 3c-d), G02, G01, G05, U05, U08, E04, E05, P04, P06, P07, U07, U10.

## S5. FRR: flexion-relaxation and the passive tissue role
- **Inputs:** flexion from upright to full flexion with no load (and with 8 kg as an option), following the rhythm in G06 and G07; passive properties of muscle, disc and ligaments.
- **Tasks:**
  - quasi-static flexion sweep, 0 deg to the flexion-relaxation angle;
  - full flexion hold;
  - holds at 30/40/60/80/100% of the flexion-relaxation angle (C07).
- **Outputs:**
  - lumbar ES activation versus lumbar flexion;
  - the angle at which lumbar ES activation first drops below 5% MVC;
  - passive moment shares at L4-L5 (passive muscle, disc, ligaments) at full flexion;
  - thoracic ES activation at full flexion.
- **Pass rule (template):**
  - lumbar ES are silent (< 5% MVC) at full flexion **and** thoracic ES are still active (> 5%), as in C04;
  - the silence angle, as a share of maximum lumbar flexion, lies within Sarti's mean ± 2 SD (C06; numbers to extract);
  - passive tissue moment ≥ 90% of the L4-L5 demand at full flexion, with passive muscle at 30-60% (C05 reports about 47%);
  - the passive moment-angle curve stays within C07 Fig 4a.
- **Sources:** C04, C05, C06, C07, G02, G05, C03.

## S6. MVC: maximal exertions with coupled moments and EMG
- **Inputs:** upright posture; measured primary **and coupled** moments at L5-S1 (U03), or harness forces (G04); body weight.
- **Tasks:** MVE in flexion, extension, left/right lateral bending and left/right axial rotation (U03); flexion/extension MVE (G04); graded extension at 20-80% MVC with coupled moments (G08); graded axial rotation at 30-100% (E03).
- **Outputs:**
  - whether a solution exists under the model's σmax;
  - the σmax needed to reach the measured moment;
  - muscle activations vs EMG;
  - L5-S1 compression and shear;
  - the change in outputs when coupled moments are dropped.
- **Pass rule (template):**
  - the model reaches the measured MVE in all 6 directions with σmax ≤ 1.0 MPa. U03 reports a mean of 0.80 ± 0.42 MPa, ranging from 0.40 (RA) to 0.99 (EO) by muscle; the required σmax must fall within that range;
  - activation-EMG Pearson r ≥ 0.6 in flexion/extension. Lateral and axial are reported only: U03 itself found r of 0.27 and 0.13, so they serve as a target to beat, not a gate;
  - **coupled-moment test:** with coupled moments removed, the change in L5-S1 compression is reported. A model passes only if it is evaluated **with** the measured coupled moments;
  - as a check, the axial-MVE EMG pattern ranks LD/EO/IO above RA, matching McGill 1991 (E01).
- **Sources:** U03, G04, G08, G03, U06, E01, E02, E03, C01 (graded 20-60%).

## S7. SRC: successive reduction / contribution analysis
- **Inputs:** a solved baseline case from S4 or S6 (e.g. U04 10 kg mid-femur; C01's isometric 40% exertions; S5 full flexion).
- **Procedure:**
  1. Remove one group at a time (or zero its activation): RA, EO, IO, multifidus, longissimus, iliocostalis, quadratus lumborum, psoas, LD; then the passive structures (disc, ligaments, facets, passive muscle).
  2. Re-solve, keeping the external moments fixed.
  3. Record the change in stability index (e.g. minimum Hessian eigenvalue or critical stiffness coefficient), L5-S1 compression and shear, whether a solution still exists, and the redistribution to other muscles.
  4. Optional: remove muscles cumulatively, from smallest to largest contributor.
- **Pass rule (template):**
  - no single muscle removal lowers stability by more than about 30% in C01's tasks (C01 finding);
  - the ranking of contributions agrees with C01 (Spearman ρ ≥ 0.6);
  - at full flexion, removing the passive structures leaves the model unsolvable or forces lumbar ES activation above 20% MVC (consistent with C04 and C05);
  - for the co-contraction share (EMG-assisted minus optimisation-only forces), flexion > extension, as in E05.
- **Sources:** C01, C02, C03, C04, C05, E05, G02, U05, U09.

## S8. KIN: kinematic inputs (shared by every suite)
- **What it provides:**
  - full-flexion shares (G07): T1 118.4 ± 13.9, T1-T12 20.5 ± 6.5, T12-S1 50.2 ± 7.0, pelvis 47.8 ± 6.9 deg (abstract);
  - lumbopelvic ratio in 30-deg bins for flexion and for return (G06);
  - how load and velocity shift the rhythm (K01);
  - population distributions of lordosis, sacral orientation, lumbar ROM and L/P ratio by age and sex (K02);
  - segmental thoracic ROM, T1/2 to T12/L1 (K03 Table 1);
  - the measured subject profile (U08);
  - T11/S1 regression from trunk flexion and asymmetry (U04);
  - stoop and squat postures (V03).
- **Pass rule:** none. This is an input library, but it carries **a robustness test**: rerun S1 and S4 under (a) the G06 rhythm, (b) the K01 rhythm, and (c) ±1 SD of the shares. Flag any case whose PASS/FAIL changes.
- **Sources:** G06, G07, K01, K02, K03, U04, U08, V03.

## S9. SENS: sensitivity and robustness (optional)
- **Tests:**
  - anthropometric factorial (U02): BW 50-120 kg, BH 150-190 cm, sex, age 35-60 yr;
  - kinematic noise (G09 levels: 0.1/0.2/0.3 mm and 0.2/0.4/0.6 deg);
  - T1 flexion error (G07);
  - σmax and cost-function choice;
  - with vs without coupled moments (S6).
- **Pass rule (template):**
  - outputs change monotonically with BW;
  - Monte Carlo coefficient of variation of L5-S1 compression ≤ 10% at the G09 low-noise level;
  - report the share of variance from each factor and compare it with U02.
- **Sources:** U02, G09, G07, U09.

---

### Build order
1. **S8 KIN** (inputs).
2. **S1 IDP-L**, using P02 + P03 + P04 + U01 conversion (≈20 cases).
3. **S4 EMG-PL**, using the U04 cohort. This needs the tabulated means ± SD from your own data or thesis.
4. **S6 MVC**, using U03 + G08.
5. **S5 FRR** and **S7 SRC**, which reuse the S4 and S6 solutions.
6. **S3 VBR** and **S2 IDP-T**: few data and indirect comparisons, so lower weight in the overall score.
