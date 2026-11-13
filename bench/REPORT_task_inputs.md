# Task inputs audit

Question: for every task, does the card give what a modeller needs to set up the simulation, and where must the modeller still assume something?
Run: `python3 tools/audit_task_inputs.py` (re-run after any card change). Input-side tests available in bench/tests: kinematics 112, anthropometry 31, muscle_geometry 1087, trunk_passive_invivo 24.
## Key findings (2026-11-12)

**Overall.** Every task names its specimen or subject, level, loading direction and load or posture. Pass/fail is not the issue. The gaps are the inputs a modeller still has to assume, listed below in order of impact.

1. **Lumbopelvic rhythm (biggest hidden input).**
   - Every MSK flexion task gives trunk flexion, not the lumbar angle. That covers in vivo IDP (lumbar and thoracic), flexion-relaxation and EMG.
   - The predicted load depends on how flexion is split between lumbar spine and pelvis.
   - SpineBench already has 50 lumbopelvic-rhythm tests (bench/tests/kinematics).
   - Next step: name the rhythm to use (or the study-specific one) in each MSK card's `simulate`.
2. **Postures given only in words (MSK, about 25% of MSK tasks).**
   - Lumbar IDP: Wilke's sitting postures and maximal extension.
   - Implant loads: sitting, all-fours.
   - Thoracic IDP: lateral bending to the maximum comfortable limit; Polga reports no angle.
   - EMG: the Ghezelbash 2020 reach postures, where the posture follows from the stated load position.
   - Sato's sitting and extended postures now carry the radiographic L4-L5 angles (7°, 9°, 13°, 18° vs 15° upright).
   - The flexion-relaxation "onset/cessation" tasks are flagged by the rule, but there the angle is the output, so they are not a gap.
3. **Dynamic peaks.** Wilke's lifts and the walking/implant tasks are dynamic peaks; a static model is an approximation, and these are marked.
4. **Subject data.** MSK subject tables are complete except:
   - maximal_exertions: Kumar 2001 and McGill 1991 lack age, height and weight; El Ouaaid 2013 lacks age.
   - Schultz 1982: L3-L4 disc area missing (secondary data, not pooled).
5. **Sample size.**
   - 157 refs that lacked n were filled from their test files today.
   - Still missing: 32 facet-force refs from 8 studies known only through the Ghezelbash 2020 review (Botolin, Farooq, Jaramillo, Lorenz, Pollintine, Rousseau, Wiseman, Yang & King). The primary papers are needed.
6. **FE load definitions.**
   - Fixed today:
     - Adams & Dolan combined flexion + compression: the compression is now stated.
     - Yamamoto shear low/high zones: the zone definitions are now in the inputs, so the tasks are no longer identical.
   - Still open:
     - Schendel facet "slope" tasks: output is per N·m, so no magnitude is needed.
     - Cannella de-nucleation axial tasks: the magnitudes are in the direction text (1000 N compression, 150 N tension), so the flag is a false positive.
7. **FE donor data.** Donor age and degeneration are in the test files but not in most cards' study `sample` text (about 50 FE studies). Adding them would let users match specimens.
8. **Tissue rate.** The ligament card is labelled quasi-static, but Pintar 1992 (from Myklebust 1988) pulled at about 1 cm/s. Owner decision: keep with the rate stated, or drop.


| Card | Domain | Tasks | Tasks flagged | Posture |
|---|---|---|---|---|
| annulus_tissue | tissue | 229 | 0 | - |
| emg_load_holding | msk | 112 | 36 | 28 posture described only, 84 neutral posture |
| facet_forces | fe | 65 | 6 | - |
| flexion_relaxation | msk | 88 | 18 | 70 posture quantified, 18 posture described only |
| idp_invitro | fe | 99 | 0 | - |
| implant_loads_invivo | msk | 30 | 17 | 8 neutral posture, 17 posture described only, 5 posture quantified |
| ligament_tissue | tissue | 227 | 0 | - |
| lumbar_idp_invivo | msk | 36 | 11 | 20 posture quantified, 10 posture described only, 6 neutral posture |
| lumbar_resection | fe | 66 | 2 | - |
| lumbar_rom | fe | 301 | 0 | - |
| maximal_exertions | msk | 137 | 0 | 127 neutral posture, 10 posture quantified |
| ribcage_tissue | tissue | 84 | 0 | - |
| segment_stiffness | fe | 203 | 57 | - |
| thoracic_idp_invivo | msk | 32 | 6 | 12 neutral posture, 14 posture quantified, 6 posture described only |
| thoracic_resection | fe | 161 | 0 | - |
| thoracic_rom | fe | 146 | 0 | - |


## annulus_tissue (tissue, 229 tasks)

- Still to assume: stress/strain definitions and rate are stated once at card level (simulate/notes); specimen dimensions come from the test JSON (protocol), not the task
- No gaps found.

## emg_load_holding (msk, 112 tasks)

- Posture: 28 posture described only (no numeric angle); 84 neutral posture (no angle needed)
- Still to assume: segment masses/COM and muscle geometry of the scaled model - covered by 31 anthropometry and 1087 muscle-geometry tests
- posture described only (28): g20_asym_lg_t11_l_0, g20_asym_lg_t11_l_30, g20_asym_lg_t11_l_60, g20_asym_lg_t11_l_90, g20_asym_lg_t11_r_0, g20_asym_lg_t11_r_30, g20_asym_lg_t11_r_60, g20_asym_lg_t11_r_90, g20_asym_mf_l4_l_0, g20_asym_mf_l4_l_30, g20_asym_mf_l4_l_60, g20_asym_mf_l4_l_90, g20_asym_mf_l4_r_0, g20_asym_mf_l4_r_30 ...
- hand load without position (8): gra_eo_0, gra_eo_180, gra_es_0, gra_es_180, gra_io_0, gra_io_180, gra_ra_0, gra_ra_180

## facet_forces (fe, 65 tasks)

- Still to assume: specimen geometry and material properties are the modeller's own (not given per specimen); loading rate assumed quasi-static unless the task says otherwise
- preload not stated (6): sch_peak_flexion, sch_slope_axial_rotation, sch_slope_extension, sch_slope_flexion, sch_slope_lateral_bending_left, sch_slope_lateral_bending_right
- no load/moment magnitude (5): sch_slope_axial_rotation, sch_slope_extension, sch_slope_flexion, sch_slope_lateral_bending_left, sch_slope_lateral_bending_right
- study sample without donor age in the card (see test) (14): botolin2011, farooq2005, ivicsics2014, jaramillo2016, lorenz1983, pollintine2004, popovich2013, rousseau2006, sawa2008, schendel1993, wiseman2005, yangking1984, zhu2008_eas, zhu2008_tekscan

## flexion_relaxation (msk, 88 tasks)

- Posture: 70 posture quantified (numeric angle); 18 posture described only (no numeric angle)
- Still to assume: split of trunk flexion between lumbar spine and pelvis (lumbopelvic rhythm) - covered by 112 kinematics tests (50 lumbopelvic rhythm); segment masses/COM and muscle geometry of the scaled model - covered by 31 anthropometry and 1087 muscle-geometry tests
- posture described only (18): desc_cessation_l2_0, desc_cessation_l2_12, desc_cessation_l5_0, desc_cessation_l5_12, desc_onset_l2_0, desc_onset_l2_12, desc_onset_l5_0, desc_onset_l5_12, gupta_cessation_trunk, gupta_cessation_vertebral, gupta_onset_trunk, gupta_onset_vertebral, sarti_cessation_0, sarti_cessation_10 ...

## idp_invitro (fe, 99 tasks)

- Still to assume: specimen geometry and material properties are the modeller's own (not given per specimen); loading rate assumed quasi-static unless the task says otherwise
- study sample without donor age in the card (see test) (10): brinckmann1991, cannella2008, dennison2008, frei2002, heuer2007b, popovich2013, rohlmann2001a, schultz1979, steffen1998, wilke2020b

## implant_loads_invivo (msk, 30 tasks)

- Posture: 8 neutral posture (no angle needed); 17 posture described only (no numeric angle); 5 posture quantified (numeric angle)
- Still to assume: segment masses/COM and muscle geometry of the scaled model - covered by 31 anthropometry and 1087 muscle-geometry tests
- posture described only (17): all_fours, allfours_armleg_inc, fix_ext, fix_flex, fix_sit_erect, fix_sit_relaxed, fix_walk, lift_max, sit_arms90, sit_backrest_pct, sit_flex, sit_hands, sit_office_pct, sit_unsupported ...
- dynamic / peak value (static model = approximation) (3): fix_walk, walk_pct, walking
- hand load without position (1): lift_max

## ligament_tissue (tissue, 227 tasks)

- Still to assume: stress/strain definitions and rate are stated once at card level (simulate/notes); specimen dimensions come from the test JSON (protocol), not the task
- No gaps found.

## lumbar_idp_invivo (msk, 36 tasks)

- Posture: 20 posture quantified (numeric angle); 10 posture described only (no numeric angle); 6 neutral posture (no angle needed)
- Still to assume: split of trunk flexion between lumbar spine and pelvis (lumbopelvic rhythm) - covered by 112 kinematics tests (50 lumbopelvic rhythm); IDP from compression (P = F/A or Ghezelbash 2016 Eq. 6) and the disc area - given per subject; segment masses/COM and muscle geometry of the scaled model - covered by 31 anthropometry and 1087 muscle-geometry tests
- subject entry incomplete (2): andersson1976 (disc_area_mm2), schultz1982 (disc_area_mm2)
- posture described only (10): extension, lift_squat, sit_backrest, sit_elbows_thighs, sit_erect, sit_extended_sato, sit_flex_max, sit_flexed_sato, sit_relaxed, sit_slouched
- dynamic / peak value (static model = approximation) (2): lift_squat, lift_stoop

## lumbar_resection (fe, 66 tasks)

- Still to assume: specimen geometry and material properties are the modeller's own (not given per specimen); loading rate assumed quasi-static unless the task says otherwise
- no load/moment magnitude (2): acu_denuc_axial_comp, acu_denuc_axial_tension
- preload not stated (2): acu_denuc_axial_comp, acu_denuc_axial_tension
- study sample without donor age in the card (see test) (4): cannella2008, heuer2007a, heuer2008, schultz1979

## lumbar_rom (fe, 301 tasks)

- Still to assume: specimen geometry and material properties are the modeller's own (not given per specimen); loading rate assumed quasi-static unless the task says otherwise
- study sample without donor age in the card (see test) (18): busscher2009, cook2015, gornet2011, guan2007, heuer2007a, heuer2008, kettler2011, oxland1992, panjabi1994, patwardhan2003, renner2007, rohlmann2001a, rohlmann2001s, sawa2008 ...

## maximal_exertions (msk, 137 tasks)

- Posture: 127 neutral posture (no angle needed); 10 posture quantified (numeric angle)
- Still to assume: split of trunk flexion between lumbar spine and pelvis (lumbopelvic rhythm) - covered by 112 kinematics tests (50 lumbopelvic rhythm); segment masses/COM and muscle geometry of the scaled model - covered by 31 anthropometry and 1087 muscle-geometry tests
- subject entry incomplete (3): elouaaid2013 (age), kumar2001 (age, height_cm, weight_kg), mcgill1991 (age, height_cm, weight_kg)

## ribcage_tissue (tissue, 84 tasks)

- Still to assume: stress/strain definitions and rate are stated once at card level (simulate/notes); specimen dimensions come from the test JSON (protocol), not the task
- No gaps found.

## segment_stiffness (fe, 203 tasks)

- Still to assume: specimen geometry and material properties are the modeller's own (not given per specimen); loading rate assumed quasi-static unless the task says otherwise
- ref without n (41): asn_050, asn_100, asn_150, asn_comp_000, brn_comp_000, brn_max_020, brn_max_040, brn_max_060, brn_max_080, brn_max_100, brn_max_110, brn_min_020, brn_min_040, brn_min_060 ...
- identical inputs on several tasks (check definitions) (13): brn_comp_000/mkm_comp_000, brn_max_040/mkm_max_040, brn_max_060/mkm_max_060, brn_max_080/mkm_max_080, brn_max_100/mkm_max_100, brn_min_040/mkm_min_040, brn_min_060/mkm_min_060, brn_min_080/mkm_min_080, brn_min_100/mkm_min_100, brn_min_120/mkm_min_120, brn_min_140/mkm_min_140, brn_min_160/mkm_min_160, brn_min_180/mkm_min_180
- no direction/DOF (3): disc_shear_k_ant, disc_shear_k_post, disc_shear_strength
- no load/moment magnitude (3): disc_shear_k_ant, disc_shear_k_post, disc_shear_strength
- preload not stated (3): disc_shear_k_ant, disc_shear_k_post, disc_shear_strength
- study sample without donor age in the card (see test) (18): adamsdolan1991, amin2016a, amin2016b, asano1992, berkson1979, brown1957, cannella2008, costi2008, edwards1987, frei2002, gardnermorse2004, janevic1991, panjabi1976, patwardhan2003 ...

## thoracic_idp_invivo (msk, 32 tasks)

- Posture: 12 neutral posture (no angle needed); 14 posture quantified (numeric angle); 6 posture described only (no numeric angle)
- Still to assume: split of trunk flexion between lumbar spine and pelvis (lumbopelvic rhythm) - covered by 112 kinematics tests (50 lumbopelvic rhythm); IDP from compression (P = F/A or Ghezelbash 2016 Eq. 6) and the disc area - given per subject; segment masses/COM and muscle geometry of the scaled model - covered by 31 anthropometry and 1087 muscle-geometry tests
- posture described only (6): elbows90_10kg_lower, elbows90_10kg_mid, latbend20_lower, latbend20_mid, latbend_left_lower, latbend_left_mid

## thoracic_resection (fe, 161 tasks)

- Still to assume: specimen geometry and material properties are the modeller's own (not given per specimen); loading rate assumed quasi-static unless the task says otherwise
- study sample without donor age in the card (see test) (1): wilke2020esj

## thoracic_rom (fe, 146 tasks)

- Still to assume: specimen geometry and material properties are the modeller's own (not given per specimen); loading rate assumed quasi-static unless the task says otherwise
- study sample without donor age in the card (see test) (5): busscher2009, liebsch2022, mannen2015, oxland1992, wilke2017

