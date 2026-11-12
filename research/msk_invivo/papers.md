# SpineBench: in vivo / MSK literature (50 papers)

Each paper sits once, under its main suite. Secondary suites are in brackets. Full fields are in `papers.csv`.
T = priority tier (1 = must-have). OA = open access. GT = needs Georgia Tech library access.

How the facts were checked: metadata and DOIs come from PubMed, Crossref and Europe PMC. Numbers marked "(abstract)" are quoted from the abstract. Table and figure locations are given only where I read the full text (PMC/bioRxiv: U11, V02, E05, C07, K03, M01). Everything else says "full text not read". No numbers were invented.

---

## 0. The user's own papers: which in vivo data each one produced or used

| ID | Paper | In vivo data **produced** | In vivo data **used** |
|---|---|---|---|
| U01 | BMMB 2016, subject-specific scaling + IDP | single-subject no-load flexion EMG (169 cm, 67 kg, 27 yr) | IDP: Wilke 2001, Sato 1999, Takahashi 2006 |
| U02 | JB 2016, sex/age/BH/BW sensitivity | none (model only) | none |
| U03 | JB 2018, MVE | **19 subjects (10M/9F): MVE in 6 directions, primary + coupled moments, trunk EMG** | none |
| U04 | JB 2020, regression equations | **same 19 subjects: 64 static symmetric/asymmetric tasks, T11 and S1 3-D rotations, EMG** | IDP (in vivo, for the regression check) |
| U05 | CMBBE 2022, stability in static tasks | **40 subjects: quasi-static tasks with varied moment and load height, EMG + kinematics** (Larivière lab) | none |
| U06 | JEK 2022, submaximal EMG-driven | isometric maximal/submaximal calibration + independent static tasks (Larivière lab; n: see paper) | none |
| U07 | JEK 2023, Eskandari, SVC vs MVC | **19 subjects: dynamic lifting, 2 loads** | none |
| U08 | JB 2023, Larivière, spinal profile | **31 subjects (healthy + LBP): spine profile, 12 EMG, 17-segment kinematics, static lifts** | none |
| U09 | JB 2023, Eskandari, stability metrics | **32 subjects: 35 repetitive lift cycles, 12 EMG + 17 IMUs** | none |
| U10 | Appl Ergon 2025, Eskandari, exoskeleton | crate lift/lower with and without passive exoskeleton (n: see paper) | none |
| U11 | BMMB 2025, FE-MS trunk | none (new) | IDP: Sato, Takahashi, Wilke; EMG: U01 subject + U04 cohort (Fig 3); exoskeleton kinematics: Koopman 2020, Näf 2018 |
| U12 | JB 2020, NIOSH / tool comparison | none | in vivo IDP, compared with OpenSim, AnyBody, 3DSSPP and the regression equations |

Left out (no in vivo trunk data, or out of scope): CMBBE 2015 (translational flexibilities), ABME 2017 (obesity), JB 2018 (motion-segment simulation), CNM 2023 (Ramirez, heavy deadlift; 1 volunteer), JB 2019 load-sharing review, and the annulus/clot/knee papers.
Resource, not counted in the 50: your 2019 PhD thesis (Polytechnique, open access). It documents the protocol of the 19-subject cohort behind U03 and U04.

**Key point:** the IRSST cohort in U03, U04 and the thesis is the single most valuable in-house dataset. It covers MVE with coupled moments, 64 static tasks with kinematics and EMG, anthropometry, and the same subjects throughout. It should become the core of the EMG-PL and MVC suites, ideally released as raw means ± SD tables.

---

## IDP-L: lumbar intradiscal pressure (11)
- **P02** Wilke 2001 Clin Biomech (T1, GT). L4-L5 IDP **plus full anthropometry**, built for model validation. Abstract values: standing 0.5, flexed 1.1, extended 0.6, sitting 0.46, 20 kg round-back lift 2.3 MPa. This is the core case.
- **P01** Wilke 1999 Spine (T1, GT). Same subject, 24 h of daily-life activities, including lifting.
- **P03** Sato 1999 Spine (T1, GT). 8 healthy volunteers plus 28 patients, L4-L5. Standing, flexion and extension, with the segmental angle. It is the only multi-subject healthy IDP set.
- **P04** Takahashi 2006 Spine (T1, GT). 3 men. IDP, EMG and trunk tilt **recorded together** in forward bending with and without 10 kg [EMG-PL].
- **P07** Schultz 1982 JBJS (T1, GT). IDP and EMG recorded together, designed to validate a model [EMG-PL].
- **P06** Andersson 1977 CORR (T2, GT). 4 subjects. IDP, IAP and back EMG including the thoracic level, with asymmetric loads [EMG-PL].
- **P05** Nachemson 1981 Spine (T3, GT). Review of relative IDP versus standing, as a sanity ratio check.
- **V05** Dreischarf 2016 JB review (T1, GT). Pre-compiled in vivo vs model tables (IDP, VBR). Use it to cross-check the extracted numbers [VBR].
- **U01** Ghezelbash 2016 BMMB (T1, OA). The IDP = f(compression, L4-L5 flexion rotation) regression, the conversion rule the IDP suites should use.
- **U11** Ghezelbash 2025 BMMB (T1, OA). Validation template: Fig 3a (IDP vs in vivo), Fig 3b-d (EMG) [EMG-PL].
- **U12** Ghezelbash 2020 JB (T2). OpenSim, AnyBody and 3DSSPP compared with the same IDP data, giving ready-made baselines.
- **U04** Ghezelbash 2020 JB (T1, OA). Listed under EMG-PL; its IDP regression check reached R² = 0.85.

## IDP-T: thoracic intradiscal pressure (2)
- **P08** Polga 2004 Spine (T1, GT). 6 volunteers, T6-T7 to T10-T11. Standing, ±10 kg per hand, flexion, extension, rotation and lateral bending. It is the only thoracic IDP data.
- **M01** Bruno 2015 JBME (T1, OA). OpenSim thoracolumbar + rib-cage model. Table 3 lists every validation task; Fig 4b is the Polga comparison. Note that it applies the lumbar 0.66 IDP factor at thoracic levels, which is a known weakness [all suites].

## VBR: in vivo implant loads (4)
- **V01** Rohlmann 2008 Clin Biomech (T1, GT). 3 patients, L1, first month. Upper-body flexion, extension, rotation and lateral bending, plus arm elevation. Bruno 2015 Fig 5 uses it as % of standing.
- **V02** Rohlmann 2014 PLoS One (T1, OA). 5 patients. **Table 2 lists the 10 highest-load activities** (e.g. lifting from the ground, 1649 N peak); Table 1 gives anthropometry.
- **V03** Dreischarf 2016 JB (T1, GT). 4 patients. Stoop vs squat vs lateral lift, with trunk and knee angles; the stoop-squat difference is 4% [KIN].
- **V04** Rohlmann 2014 Ergonomics (T2, GT). Load carried laterally, in front, or in a backpack (10 kg backpack: +35 N).

## EMG-PL: EMG in postures and lifting (10)
- **U04** Ghezelbash 2020 JB (T1, OA). **19 subjects, 64 static tasks**, kinematics + EMG. The 10 kg load at 4 heights is replotted with SD in U11 Fig 3c-d [KIN, IDP-L].
- **G02** Arjmand & Shirazi-Adl 2006 JB (T1, OA via PHARESST). 15 men, flexion at about 40 and 65 deg ± load, kinematics + EMG, passive/active partition [FRR, KIN].
- **G01** El-Rich 2004 Spine (T2, GT). Upright standing ± hand loads, kinematics + EMG.
- **G05** Arjmand 2010 JB (T2, GT). Full flexion and one-hand asymmetric holds; EMG-assisted optimisation vs kinematics-driven model on the same trials [FRR].
- **U05** Ghezelbash 2022 CMBBE (T2, OA). 40 subjects, quasi-static tasks with varied moment and load height [SRC].
- **U08** Larivière 2023 JB (T2, OA). 31 subjects, measured spine profile, static lifts in upright stance [KIN].
- **U07** Eskandari 2023 JEK (T2, OA). 19 subjects, dynamic lifting, MVC vs SVC normalisation.
- **E04** Lavender 1992 JOR (T2, GT). Known harness moments of 10-50 Nm in 30-deg direction steps, 8 muscles [MVC submax].
- **E05** Granata 2005 Clin Biomech (T2, OA). 14 subjects, cable at T10 (100/135/170 N), flexion vs extension. Table 1 gives anthropometry, Table 2 the measured moments, and the text gives EMG [SRC].
- **U10** Eskandari 2025 Appl Ergon (T3, OA). Crate lifting with and without an exoskeleton; optional.

## FRR: flexion-relaxation and passive tissue role (4)
- **C04** McGill & Kippers 1994 Spine (T1, GT). 8 men. In full flexion the lumbar ES fall silent while the thoracic ES and abdominals stay active. This is the main qualitative pass rule [SRC].
- **C05** Zwambag & Brown 2020 JB (T1, GT). Passive muscle carries about 47% of the L4-L5 extensor demand near full flexion, and passive tissues together can carry all of it (abstract) [SRC].
- **C06** Sarti 2001 Spine (T2, GT). 22 subjects. Lumbar angle (and % of max) at ES silence onset and offset, by speed and load.
- **C07** Toosizadeh 2012 PLoS One (T2, OA). Passive trunk moment vs lumbar flexion (Fig 4a); flexion-relaxation angle 58.2 (12.0) deg.

## MVC: maximal exertions with coupled moments + EMG (8)
- **U03** Ghezelbash 2018 JB (T1, OA). **19 subjects, 6 directions, primary + coupled moments + EMG.** Coupled moments reach about 50% of primary in lateral and axial MVE, and σmax = 0.80 ± 0.42 MPa (abstract).
- **G04** El Ouaaid 2013 JB (T1, GT). 12 subjects, flexion/extension MVE with harness forces + EMG.
- **G08** Larivière 2001 Clin Biomech (T1, GT). 14 subjects. Coupled lateral and axial moments during graded extension (at 80% MVC: 6.2 ± 6.6 and 6.1 ± 4.5 Nm).
- **G03** Arjmand 2008 Clin Biomech (T2, GT). How to simulate maximal axial torque, including coupled moments, coactivity and σmax.
- **U06** Ghezelbash 2022 JEK (T2, OA). External-moment prediction metric (r, relative error) for EMG-driven calibration.
- **E01** McGill 1991 JOR (T2, GT). 25 subjects. EMG %max during maximal axial torque (abstract: EO 52%, IO 55%, LD 74%, and more).
- **E02** Kumar 2001 EJAP (T2, GT). 50 subjects, seated maximal axial rotation, 14 EMG channels; female torque is 65% of male.
- **E03** Ng 2003 Clin Neurophysiol (T2, GT). 10 subjects, axial rotation at 30-100% MVC, coupled sagittal and coronal torques measured.
- (C01 also has graded flexion, extension, lateral and axial exertions with 12 EMG channels; see SRC.)

## SRC: successive reduction / contribution (3, plus the cross-listed C04, C05, E05, U05)
- **C01** Cholewicki & VanVliet 2002 Clin Biomech (T1, GT). **Removes each of 10 muscle groups one at a time** in an EMG-driven model. No single muscle removal cut stability by more than 30%. This is the template for the suite.
- **C02** Kavcic 2004 Spine (T2, GT). Replaces each muscle's EMG with a sinusoid. Exercise postures, so only partly reproducible.
- **C03** McGill & Norman 1986 Spine (T2, GT). Splits the L4-L5 moment into disc, ligament and muscle shares during lifting [FRR].
- Note: the literature does not use the phrase "successive reduction". The closest methods are removal (C01), substitution (C02) and partitioning (C03, C04, C05, G02).

## KIN: kinematic inputs (5)
- **G06** Tafazzol 2014 Clin Biomech (T1, GT). 8 men. Thorax/pelvis/lumbar peaks of 121/53/60 deg and the lumbopelvic ratio in 30-deg bins (abstract).
- **G07** Hajibozorgi & Arjmand 2016 JB (T1, GT). Full-flexion shares: T1 118.4 ± 13.9, T1-T12 20.5 ± 6.5, lumbar 50.2 ± 7.0, pelvis 47.8 ± 6.9 deg (abstract) [SENS].
- **K02** Pries 2015 JB (T1, GT). 309 subjects. Lordosis, sacral orientation, lumbar ROM and L/P ratio by age and sex, giving population distributions.
- **K01** Granata & Sanford 2000 Spine (T2, GT). 18 subjects. How load and velocity change lumbopelvic rhythm.
- **K03** Morita 2014 Eur Spine J (T2, OA). Segmental thoracic ROM, T1/2 to T12/L1, in Table 1 (supine CT, patient cohort).

## SENS: sensitivity and robustness (3)
- **U02** Ghezelbash 2016 JB (T2, OA). Anthropometric factorial study; body weight explains about 97-99% of load variance.
- **U09** Eskandari 2023 JB (T3, OA). Stability metrics compared across 32 subjects.
- **G09** Eskandari 2019 JB (T3, GT). Input-noise levels of 0.1-0.3 mm and 0.2-0.6 deg, for a Monte Carlo robustness test.
