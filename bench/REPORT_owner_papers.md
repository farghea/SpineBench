# Owner papers: model-validation comparisons booked against SpineBench

Catalogue of every comparison of a model output with data in the papers of Farshid Ghezelbash (author or co-author), mapped onto the 17 SpineBench outcome cards. Machine-readable twin: `bench/owner_papers_map.json`. Card snapshot read on 2026-11-12 (cards were being edited in parallel; task ids may have moved since).

Status: **covered** = all data of the comparison are booked as tasks; **partly** = some are; **missing** = not in SpineBench. Study keys in lower case (e.g. `wilke2001`) are SpineBench study keys; "Author Year" means not in any card.

**Totals:** 9 papers, 45 comparisons with data (10 covered, 21 partly, 14 missing), plus 16 model-vs-model comparisons.

## Papers found

| Key | Year | Journal | File |
|---|---|---|---|
| Ghezelbash2016 | 2016 | Biomech Model Mechanobiol 15(6):1699-1712 | donwload/U01_Ghezelbash2016_BMMB.pdf (also plan_agent/validation papers/BMMB-Subj Specific-2016.pdf) |
| Ghezelbash2018 | 2018 | J Biomech 70:124-133 | donwload/U03_Ghezelbash2018.pdf |
| Ghezelbash2020a | 2020 | J Biomech 102:109463 | donwload/Ghezelbash2020AF.pdf |
| Ghezelbash2020rev | 2020 | J Biomech 102:109441 | donwload/Ghezelbash2020rev.pdf |
| Ghezelbash2020b | 2020 | J Biomech 102:109550 | donwload/Mitutoyo Digital Caliper - Certificate of Calibration Control # DDE14R52L.PDF (mis-named IRSST accepted manuscript); also plan_agent/validation papers/1-s2.0-S0021929019308073-main.pdf |
| Ghezelbash2021 | 2021 | Acta Biomater 123:208-221 (SSRN preprint 3677348 in SpineBench) | donwload/Ghezelbash2021_SSRN.pdf |
| Ghezelbash2022 | 2022 | J Electromyogr Kinesiol 65:102664 | donwload/U06_Ghezelbash2022_JEK.pdf |
| Lariviere2024 | 2024 | J Biomech 162:111867 (co-author) | donwload/U08_Lariviere2023.pdf |
| Ghezelbash2024 | 2024 | bioRxiv 2024.01.06.574467; published Biomech Model Mechanobiol 24(5):1591-1603 (2025) | donwload/U11_Ghezelbash2025_bioRxiv.pdf (identical text: plan_agent/validation papers/2024.01.06.574467.full.pdf) |

Not found locally (would need downloading): Ghezelbash, Arjmand, Shirazi-Adl 2015, Comput Methods Biomech Biomed Engin 18:1760 (intervertebral translational flexibilities); Ghezelbash et al. 2016a, J Biomech 49:3492 (sex/age/BH/BW sensitivity); Ghezelbash et al. 2017, Ann Biomed Eng 45:2373 (obesity and obesity shape); Ghezelbash et al. 2018b, J Biomech 70:149 (motion-segment simulation and joint positioning); Ghezelbash, Shahvarpour, Lariviere, Shirazi-Adl 2022a, Comput Methods Biomech Biomed Engin 25:1156 (stability in static tasks; in vivo-computational); Ghezelbash et al. 2024, J Biomech 166:111967 (machine learning in spine biomechanics, review).

Excluded: Bidhendi, Braun, Bouchard-Roy, Ghezelbash: Evaluating mechanical comfort of ear tips (donwload/1082-2132-1-SP (1).pdf) - not spine. Fasser 2021 (donwload/Fasser2021.pdf) - Ghezelbash is not an author. Arjmand 2009 Clin Biomech, El Ouaaid 2013 - Ghezelbash is not an author (used as data sources).

## Ghezelbash2016 (2016): Subject-specific biomechanics of trunk: musculoskeletal scaling, internal loads and intradiscal pressure estimation

*Biomech Model Mechanobiol 15(6):1699-1712*, doi `10.1007/s10237-016-0792-3`  
**Model:** Sagittally symmetric kinematics-driven nonlinear FE musculoskeletal trunk model (T1-S1, Abaqus), 126 muscles with wrapping, T11-S1 nonlinear beam motion segments; personalised by sex/age/BH/BW (Anderson 2012, Shi 2014); L4-L5 IDP from a new compression-rotation regression (Eq. 6).

| Output | Experimental data | Conditions | Fig/Table | Metric / outcome | SpineBench card / tasks | Status |
|---|---|---|---|---|---|---|
| L4-L5 IDP in vivo | wilke2001 | 11 tasks: upright relaxed; 19.8 kg close / away; flexion 10, 30, 50 deg; full flexion 107 deg; flexion 70 deg + 19.8 kg; one-handed asymmetric lift 19.8 kg; lateral bending 10 and 20 deg (model scaled to Wilke subject) | Fig 5 | r = 0.984, RMSE = 0.14 MPa; matched (largest misses: upright 0.33 vs 0.47 MPa; flex 70 deg + 19.8 kg 2.65 vs 2.3 MPa) | **lumbar_idp_invivo**: `standing`, `hold_{close,away}`, `flex10`, `flex30`, `flex50`, `flex_full`, `lift_stoop`, `latbend20` | partly. Not booked: one-handed asymmetric lift (~1.0 MPa) and lateral bending 10 deg (~0.48 MPa). Both in Wilke 2001 (P02_Wilke2001.pdf, catalogued) and readable from Fig 5. |
| Back muscle activity vs trunk flexion angle (LGPT, ICPT, L/R), flexion-relaxation | Arjmand 2010 | Unloaded forward flexion 0-107 deg, single male subject (52 y, 68.4 kg, 174.5 cm) | Fig 6a | visual (trend); matched (pattern and FR onset ~60-80 deg; model LGPT peak 22% vs EMG ~20%) | **flexion_relaxation**: none | missing. Arjmand 2010 J Biomech 43:485 (not in donwload); same subject/protocol in Arjmand 2009 Clin Biomech (donwload/Arjmand2009CB.pdf, catalogued as msk_idp_lumbar). Curve digitisable from Fig 6a. |
| Muscle activity in MVE extension (242 Nm) and flexion (151 Nm): LGPT, ICPT, MF, RA, EO, IO | elouaaid2013 | Semi-seated MVE, mean of 12 males; IAP 0/10/25 kPa and antagonist moment variants I-V | Fig 7, Table 3 | Pearson r 0.96-0.99 (extension), 0.79-0.87 (flexion); matched (extension); moderate in flexion (RA/EO under-predicted without IAP) | **maximal_exertions**: `emg_ss_ext_{lg,ic,mf,ra,eo,io}`, `emg_ss_flex_{lg,ic,mf,ra,eo,io}`, `ss_ext_m_primary`, `ss_flex_m_primary` | covered |
| Muscle activity in axial-torque MVE (78.3 Nm + coupled lateral/flexion), ICPT, MF, RA, EO, IO, both sides | ng2001 | Upright standing, right axial torque; model scaled to 30 y, 73 kg, 179.9 cm | Fig 8 | visual; mostly matched (left EO/IO, right IO); right RA/EO and right ICPT under-predicted | **maximal_exertions**: `emg_st_axr_ng_{ra,eo,io,ic,mf}`, `emg_st_axl_ng_{ra,eo,io,ic,mf}` | covered. Left-side muscles under right torque = mirror of the right-side tasks under left torque (emg_st_axl_ng_*). |

Model-vs-model:

- L4-L5 IDP vs compression and flexion rotation: vs Detailed lumbar FE model (Shirazi-Adl 2006), Dreischarf 2013 relation (IDP = P/0.77), Shirazi-Adl & Drouin 1988 (L2-L3) (Fig 4, Eq. 6; regression fit R2 = 0.999, RMSE = 0.025 MPa): differences grow with compression and rotation; earlier relations ignore rotation.
- L4-L5 compression and shear in forward flexion: vs 4 personal-parameter sets (subjects of Wilke, Arjmand, El Ouaaid, Ng) (Fig 9; relative difference): up to 21% compression, 30% shear.

## Ghezelbash2018 (2018): Trunk musculoskeletal response in maximum voluntary exertions: a combined measurement-modeling investigation

*J Biomech 70:124-133*, doi `10.1016/j.jbiomech.2017.11.007`  
**Model:** Same subject-specific KD nonlinear FE musculoskeletal trunk model (126 muscles), semi-seated posture with reduced lordosis, driven by each subject's measured MVE moments; 19 subjects (9 F, 10 M).

| Output | Experimental data | Conditions | Fig/Table | Metric / outcome | SpineBench card / tasks | Status |
|---|---|---|---|---|---|---|
| Muscle activity in flexion and extension MVE (LGPT, ICPT T-level and L3, MF, RA, EO, IO; both sides) | ghezelbash2018 | Own data: 19 subjects, semi-seated dynamometer | Fig 4 | Pearson r = 0.72 (flexion), 0.69 (extension); matched (qualitatively good; MF over-predicted in extension) | **maximal_exertions**: `emg_ss_flex_{lg,ic,mf,ra,eo,io}`, `emg_ss_ext_{lg,ic,mf,ra,eo,io}` | covered. Card books L/R mean and IC at L3; the thoracic-level ICPT electrode is not booked. |
| Muscle activity in right/left lateral MVE | ghezelbash2018 | Own data, 4 subjects with least coupled moments simulated | Fig 5 | Pearson r = 0.44; not matched (weak; ipsilateral EO/IO and MF under-predicted) | **maximal_exertions**: `emg_ss_latr_{lg,ic,mf,ra,eo,io}`, `emg_ss_latl_{lg,ic,mf,ra,eo,io}` | partly. Only right-side electrodes booked; left-side bars of Fig 5 not booked (owner data). |
| Muscle activity in right/left axial MVE | ghezelbash2018 | Own data, 4 subjects simulated | Fig 6 | Pearson r = 0.34; not matched (weak) | **maximal_exertions**: `emg_ss_axr_{lg,ic,mf,ra,eo,io}`, `emg_ss_axl_{lg,ic,mf,ra,eo,io}` | partly. Only right-side electrodes booked; left-side bars of Fig 6 not booked (owner data). |
| Measured MVE primary and coupled moments (F, M) vs literature *(own data vs literature)* | ghezelbash2018, elouaaid2013, ng2001, ng2002, lariviere2009, gravel1997, kumar2001, Azghani 2009, Cholewicki 1995, Kumar 1996, Lee & Kuo 2000, Malchaire & Masset 1995, McNeill 1980, Parnianpour 1988a/b, Plamondon 2014, Keller 2002 | 6 directions, semi-seated (own) vs standing/seated literature | Fig 3, Table 2 | within range (descriptive); own moments in range; women exerted more than other female cohorts | **maximal_exertions**: `ss_flex_f_primary`, `ss_flex_m_primary`, `ss_ext_f_primary`, `ss_ext_m_primary`, `ss_latr_f_primary`, `ss_latr_m_primary`, `ss_latl_f_primary`, `ss_latl_m_primary`, `ss_axr_f_primary`, `ss_axr_m_primary`, `ss_axl_f_primary`, `ss_axl_m_primary`, `ss_flex_f_coupled_{lat,axial}`, `ss_flex_m_coupled_{lat,axial}`, `ss_ext_f_coupled_{lat,axial}`, `ss_ext_m_coupled_{lat,axial}`, `ss_latr_f_coupled_{sag,axial}`, `ss_latr_m_coupled_{sag,axial}`, `ss_latl_f_coupled_{sag,axial}`, `ss_latl_m_coupled_{sag,axial}`, `ss_axr_f_coupled_{sag,lat}`, `ss_axr_m_coupled_{sag,lat}`, `ss_axl_f_coupled_{sag,lat}`, `ss_axl_m_coupled_{sag,lat}`, `st_flex_m_primary`, `st_ext_m_primary`, `st_latr_m_primary`, `st_latl_m_primary`, `st_axr_m_primary`, `st_axl_m_primary`, `st_flex_m_abscoupled_{lat,axial}`, `st_ext_m_abscoupled_{lat,axial}`, `st_latr_m_abscoupled_{sag,axial}`, `st_latl_m_abscoupled_{sag,axial}`, `st_axr_m_abscoupled_{sag,lat}`, `st_axr_m_pctcoupled_{sag,lat}`, `st_axl_m_abscoupled_{sag,lat}`, `st_axl_m_pctcoupled_{sag,lat}` | partly. Experiment-vs-literature (no model). Not booked: Azghani 2009, Cholewicki 1995, Kumar 1996, Lee & Kuo 2000, Malchaire 1995, McNeill 1980, Parnianpour 1988a/b, Plamondon 2014, Keller 2002. |
| Estimated peak muscle stress needed to reach MVE (sigma_max) | Buchanan 1995, Burkhart 2017, Pruim 1980 | All MVE directions, 19 subjects | Fig 8, Discussion | within range (0.80 +/- 0.42 MPa; <1.5 MPa in 95% of muscles); matched | no card | missing. No SpineBench card for muscle stress. Burkhart (J Biomech 2018) is catalogued (msk_mvc_coupled); Buchanan 1995 (elbow) and Pruim 1980 (jaw) are not spine data. |

## Ghezelbash2020a (2020): On the modeling of human intervertebral disc annulus fibrosus: elastic, permanent deformation and failure responses

*J Biomech 102:109463*, doi `10.1016/j.jbiomech.2019.109463`  
**Model:** Non-homogeneous fibre-reinforced AF model: Mooney-Rivlin-type matrix plus collagen fibres (types I/II) with elastic, plastic (permanent deformation) and damage/failure laws (Abaqus); applied to tissue specimens and an L2-L3 disc-body-unit model.

| Output | Experimental data | Conditions | Fig/Table | Metric / outcome | SpineBench card / tasks | Status |
|---|---|---|---|---|---|---|
| AF stress-strain, uniaxial along fibres (single lamella) | holzapfel2005, Skaggs 1994 | Single-layer specimens | Fig 2a | visual; matched | **annulus_tissue**: `lam_VLe_{00..14}`, `lam_VLi_{00..14}`, `lam_De_{00..13}`, `lam_Di_{00..13}` | partly. Skaggs 1994 (fibre-direction curves) not in SpineBench; not downloaded. |
| AF stress-strain, uniaxial circumferential (multilayer) | ebara1996, elliottsetton2001, Acaroglu 1995, Skrzypiec 2007 | Multilayer circumferential specimens | Fig 2b | visual / within range; matched | **annulus_tissue**: `circ_ebAO_{00..17}`, `circ_ebAI_{00..06}`, `circ_ebPO_{00..16}`, `circ_ebPI_{00..10}`, `circ_es12_{00..04}`, `circ_es13_{00..03}` | partly. Acaroglu 1995 and Skrzypiec 2007 curves not booked (not downloaded). |
| AF axial (toe-region) modulus, uniaxial axial | elliottsetton2001, oconnell2009 | Axial specimens | Fig 2c | within range; matched | **annulus_tissue**: `ax_es21_{00..07}`, `ax_oc_{00..14}` | covered. Card books the curves; modulus is derivable. |
| AF equi-biaxial circumferential stress-strain | oconnell2012 | Equi-biaxial tension | Fig 2d | visual; matched | **annulus_tissue**: `bx_oc12_{00..13}` | partly. Card books the circ-fixed O'Connell 2012 curve (via Ghezelbash 2021), not the equi-biaxial curve used here. |
| AF failure stress and failure strain, circumferential | Acaroglu 1995, Skrzypiec 2007 | Uniaxial circumferential to failure | Fig 3a,b | within range; matched | **annulus_tissue**: none | missing. Card notes exclude failure data. Not downloaded. |
| AF failure stress vs modulus, fibre direction | Skaggs 1994 | Collagen type I/II, content 5-25% | Fig 3c | within range; matched | **annulus_tissue**: none | missing. Not downloaded. |
| AF axial failure stress (bone-AF-bone) | Green 1993 | Uniaxial axial tension | Fig 3d | within range; matched | **annulus_tissue**: none | missing. Green1993.pdf is in donwload/ and catalogued (passive_tissue, usable=yes) but excluded by the card. |
| Disc-body-unit axial compression force-displacement (L2-L3) | Asano 1992, Brown 1957, Jamison 2013, Marini 2016, Markolf & Morris 1974, Tencer 1982 | Compression to 4500 N, with/without 350 N preconditioning, Poisson ratio variants | Fig 4a | within range (visual); matched with preconditioning | **segment_stiffness**: `ten_axial_compression` | partly. Card books only linear axial stiffness values (Tencer 1982, Costi 2008, Amin 2016, Berkson 1979, Frei 2002), not the force-displacement curves. Jamison2013.pdf, Marini2016.pdf, Tencer1982 are in donwload/ (catalogued); Asano 1992, Brown 1957, Markolf & Morris 1974 not downloaded. Curves also digitisable from Ghezelbash 2020a Fig 4a. |
| Cyclic compression-tension of an intact motion segment | Asano 1992 | Loading-unloading cycles | Fig 4b | visual; matched | **segment_stiffness**: none | missing. Asano 1992 not downloaded. |
| Cyclic compression-tension of a disc-body unit | Marini 2016 | Sample #6 of Marini 2016 | Fig 4c | visual; matched | **segment_stiffness**: none | missing. Marini2016.pdf catalogued (fe_model_comparison, usable=no) but not booked. |
| AF residual-stress opening angle after radial transection | Michalek 2012, Mengoni 2017 | Bovine discs | Discussion (text) | value; not matched (11 deg vs 28 and 53 deg); attributed to swelling not modelled | no card | missing. Bovine data; probably out of scope for SpineBench. |

Model-vs-model:

- AF uniaxial/biaxial stress-strain: vs Schmidt 2007 hyperelastic AF model (and Peng 2006, Shahraki 2015 cited) (Fig 2; visual): proposed model closer to tissue tests.
- Disc compression response: vs Own model with Poisson ratio 0.499 vs 0.49999 and plasticity parameter variants (Figs 6-7; relative change): compression +173% at 1.49 mm.

## Ghezelbash2020rev (2020): Internal load-sharing in the human passive lumbar spine: review of in vitro and finite element model studies

*J Biomech 102:109441*, doi `10.1016/j.jbiomech.2019.109441`  
**Model:** Review (no own model); compiles in vitro measurements and FE predictions of load-sharing among disc, ligaments and facets.

| Output | Experimental data | Conditions | Fig/Table | Metric / outcome | SpineBench card / tasks | Status |
|---|---|---|---|---|---|---|
| Facet joint forces in vitro (compiled table) *(review compilation)* | jaramillo2016, ivicsics2014, popovich2013, botolin2011, sawa2008, zhu2008_eas, zhu2008_tekscan, rousseau2006, Wilson 2006, farooq2005, wiseman2005, pollintine2004, schendel1993, yangking1984 | Moments 7.5-15 Nm, compression/shear preloads, L1-S1 levels | Table 2 | compilation (no model); n/a | **facet_forces**: `jar_l4l5_{ext,lb,ar}`, `jar_l5s1_{ext,lb,ar}`, `ivi_intact_{extension,flexion,entire}`, `ivi_nucleo_{extension,flexion,entire}`, `pop_l45_{flex,ext,lb,ar,po5,po10}`, `bot_l2l3_{flexion,extension}`, `bot_l2l3_lateral_bending`, `bot_l2l3_axial_rotation`, `bot_l3l4_{flexion,extension}`, `bot_l3l4_lateral_bending`, `bot_l3l4_axial_rotation`, `sawa_l12_{flex,ext,lb,ar}`, `sawa_fl_{neutral,flexion,extension}`, `zhu_l34_{flex,ext,lb,ar}`, `rou_l5s1_{neutral,flexion,extension}`, `rou_l5s1_lateral_bending`, `rou_l5s1_lateral_bending_neg`, `far_comp`, `wis_{l2l3,l3l4,l4l5}`, `pol_{extension,flexion}`, `sch_peak_{extension,flexion}`, `sch_peak_axial_rotation`, `sch_peak_lateral_bending`, `sch_slope_{extension,flexion}`, `sch_slope_lateral_bending_{right,left}`, `sch_slope_axial_rotation`, `yk_{c,ant,post}` | partly. Wilson 2006 (L3-L4, 7.5 Nm extension/axial, min/max) not booked; catalogued. |
| Load-sharing fractions disc/ligaments/facets *(review compilation)* | Adams 1980, Adams 1987, Lu 2005 | Flexion (fresh and after creep), anterior/posterior shear up to 250 N; resection-based | Table 1 | compilation; n/a | no card | missing. No load-sharing card. In vitro rows (Adams 1980/1987, Lu 2005) not downloaded; FE rows are model-vs-model (below). |
| Stepwise resection effects on ROM / IDP *(review compilation)* | heuer2007a, heuer2007b, heuer2008 | Force-controlled pure moments with sequential resection | Sec 3.6 (text) | compilation; n/a | **lumbar_resection**: `l45_intact_{flex,ext,lb,ar}`, `l45_ssl_{flex,ext,lb,ar}`, `l45_isl_{flex,ext,lb,ar}`, `l45_lf_{flex,ext,lb,ar}`, `l45_fc_{flex,ext,lb,ar}`, `l45_va_{flex,ext,lb,ar}`, `l45_pll_{flex,ext,lb,ar}`, `l45_all_{flex,ext,lb,ar}`, `l45_nuc_{flex,ext,lb,ar}`, `l23_intact_{flex,ext,lb,ar}`, `l23_va_{flex,ext,lb,ar}`, `l23_all_{flex,ext,lb,ar}`, `l23_nuc_{flex,ext,lb,ar}` | covered. Heuer 2007b IDP-with-resection rows are in idp_invitro (l45s_*). |

Model-vs-model:

- Load-sharing fractions (disc/ligaments/facets): vs FE studies: Naserkhaki 2016, Schmidt 2013a, Sharma 1995, Shirazi-Adl & Drouin 1987 vs in vitro Adams 1980/1987, Lu 2005 (Table 1, text; narrative): FE and in vitro broadly consistent; protocol (resection order, BCs, preload) drives differences.

## Ghezelbash2020b (2020): Subject-specific regression equations to estimate lower spinal loads during symmetric and asymmetric static lifting

*J Biomech 102:109550*, doi `10.1016/j.jbiomech.2019.109550`  
**Model:** Subject-specific KD nonlinear FE musculoskeletal trunk model driven by measured T11/S1 rotations of 19 subjects (64 lifting tasks, 3840 simulations) -> regression equations for L4-L5/L5-S1 compression and shear; IDP via 2016 Eq. 6.

| Output | Experimental data | Conditions | Fig/Table | Metric / outcome | SpineBench card / tasks | Status |
|---|---|---|---|---|---|---|
| L4-L5 IDP in vivo (regression equations) | takahashi2006, wilke2001, sato1999 | Takahashi: upright, +10 kg, flexion 10/20/30 deg with/without 10 kg; Wilke: stand, 20 kg close/away, flexion 10/30/50, full, 70 deg + 19.8 kg; Sato: 8 subjects individually, upright and flexed | Fig 4a | R2 = 0.85; matched | **lumbar_idp_invivo**: `standing`, `stand_10kg`, `flex10`, `flex10_10kg`, `flex20`, `flex20_10kg`, `flex30`, `flex30_10kg`, `flex50`, `flex_full`, `lift_stoop`, `hold_{close,away}`, `flex_l4l5_5` | partly. Sato 1999 compared per subject (16 values); card books the cohort mean only. Individual values in Sato 1999 Table 2. |
| L4-L5 IDP vs axial rotation angle (-17 to +25 deg) | wilke2001 | Continuous axial twist, standing | Fig 4b | visual; partly matched (under-predicted near neutral, ~0.27 vs ~0.45 MPa; matched at large angles) | **lumbar_idp_invivo**: `axial_rot` | partly. Card books only the maximal-twist point (24 deg). Wilke 2001 IDP-vs-angle curve (P02_Wilke2001.pdf) could be added as several angle tasks. |
| L4-L5 IDP vs lateral bending angle (-30 to +30 deg), FE-MS model driven by Narimani & Arjmand 2018 kinematics | wilke2001 | Continuous lateral bending, standing | Fig 4c | visual; partly matched (within band at small/moderate angles; over-predicted at 30 deg) | **lumbar_idp_invivo**: `latbend20` | partly. Card books only 20 deg. Wilke 2001 curve could be added. |
| Back muscle EMG (LGPT T11, ICPT T11 and L3, MF L4; L/R) in static holds | ghezelbash2020 | Own data: 19 subjects, 14 kg at 4 heights (mid-tibia, knee, mid-femur, upright) x 4 asymmetry angles (0-90 deg) | Fig 5 | R2 = 0.46 (extensors); moderate (good in symmetric tasks, weak in asymmetric) | **emg_load_holding**: `g20_lg_t11_{umbilicus,midfemur,knee,midtibia}`, `g20_ic_l3_{umbilicus,midfemur,knee,midtibia}`, `g20_mf_l4_{umbilicus,midfemur,knee,midtibia}`, `g20_asym_lg_t11_l_{0..90}`, `g20_asym_lg_t11_r_{0..90}`, `g20_asym_mf_l4_l_{0..90}`, `g20_asym_mf_l4_r_{0..90}`, `flexion_relaxation:g20_lg_t11_{18..92}`, `flexion_relaxation:g20_ic_t11_{18..92}`, `flexion_relaxation:g20_ic_l3_{18..92}`, `flexion_relaxation:g20_mf_l4_{18..92}` | partly. Booked: symmetric 4 heights (L/R mean) and asymmetry 0-90 deg at mid-femur for LG(T11)/MF(L4). Not booked: other height x asymmetry cells, IC asymmetric tasks. |
| Abdominal EMG (RA, EO, IO; L/R) in static holds | ghezelbash2020 | Same 16 tasks, 14 kg | Fig 6 | R2 = 0.02; not matched (model abdominals ~0 vs 3-20% EMG) | **emg_load_holding**: none | missing. Owner data; readable from Fig 6. |

Model-vs-model:

- L4-L5 / L5-S1 compression and shear: vs Regression equations vs the FE-MS model they were fitted to (Tables 3-4; R2 0.93-0.98; RMSE 32-274 N): good fit.
- Spinal loads: vs Other lifting tools (Arjmand 2011/2012 regressions, AnyBody; via Rajaee 2015) (Discussion; narrative): n/a.

## Ghezelbash2021 (2021): Modeling of human intervertebral disc annulus fibrosus with complex multi-fiber networks

*Acta Biomater 123:208-221 (SSRN preprint 3677348 in SpineBench)*, doi `10.1016/j.actbio.2020.12.062`  
**Model:** Micromechanical layerwise AF model (lamellae, inter-lamellar matrix, elastic fibres, cross-links) and microplane / hyperelastic AF models; single-equivalent-layer vs layerwise approaches; L2-L3 whole-disc model.

| Output | Experimental data | Conditions | Fig/Table | Metric / outcome | SpineBench card / tasks | Status |
|---|---|---|---|---|---|---|
| AF stress-strain along fibres | holzapfel2005, Skaggs 1994 | Single lamella | Fig 4a | visual; matched | **annulus_tissue**: `lam_VLe_{00..14}`, `lam_VLi_{00..14}`, `lam_De_{00..13}`, `lam_Di_{00..13}` | partly. Skaggs 1994 not booked. |
| AF circumferential uniaxial, geometry-matched specimens | elliottsetton2001, Skrzypiec 2007 | Rectangular (7.73 x 2.87 x 1.35 mm) and necked (Skrzypiec) specimens | Fig 4b,c | visual; matched | **annulus_tissue**: `circ_es12_{00..04}`, `circ_es13_{00..03}` | partly. Skrzypiec 2007 not booked. |
| AF circumferential uniaxial, cross specimen | bass2004 | Cruciform specimen | Fig 5a | visual; matched | **annulus_tissue**: `circ_bass_{00..08}` | covered |
| AF biaxial (circ-fixed) circumferential and axial stress | bass2004, bass2004_g21, wagnerlotz2004 | Axial stretch with circumferential strain held at 0; 0.5 N preload; sample-geometry variants | Fig 5b,c; Fig 7c | visual; matched | **annulus_tissue**: `bx_bass_ax_{00..08}`, `bx_bass_ci_{00..09}`, `ax_bass_{00..06}`, `circ_wl_{00..07}` | covered. Wagner & Lotz is booked as the mean-coefficient fit, not their biaxial run. |
| AF biaxial (circ-fixed) axial stress, square specimen | oconnell2012 | Partial-surface vs through-depth grips | Fig 7a | visual; matched with through-depth grips | **annulus_tissue**: `bx_oc12_{00..13}` | covered |
| Effect of specimen geometry on circumferential response | compiled measured variations (Fig 6 right) | Cross, rectangle, dumbbell, hourglass | Fig 6 | qualitative; matched (up to 16x variation reproduced) | **annulus_tissue**: none | missing. Compiled scatter; low priority. |
| Whole-disc axial compression force-displacement (L2-L3) | Asano 1992, Brown 1957, Jamison 2013, Marini 2016, Markolf & Morris 1974, Tencer 1982, costi2008 | Disc height 11 mm, area 1695 mm2; several AF laws | Fig 9 | within range; matched (all AF laws inside the band) | **segment_stiffness**: `ten_axial_compression`, `costi_axial_compression` | partly. Card books only linear axial stiffness values (Tencer 1982, Costi 2008, Amin 2016, Berkson 1979, Frei 2002), not the force-displacement curves. Jamison2013.pdf, Marini2016.pdf, Tencer1982 are in donwload/ (catalogued); Asano 1992, Brown 1957, Markolf & Morris 1974 not downloaded. Curves also digitisable from Ghezelbash 2020a Fig 4a. |

Model-vs-model:

- AF tissue and whole-disc responses: vs Published hyperelastic SEFs: Peng 2006, Ayturk 2012, Marini 2016, Stadelmann 2018, Momeni-Shahraki 2015, Yang & O'Connell, Jacobs 2013 (Table 1) (Figs 4-5, 9; Table 1; visual): all match whole-disc compression; some too stiff/compliant in uniaxial/biaxial tissue tests.
- Stress/strain fields: vs Layerwise vs single-equivalent-layer AF representation (Figs 2-3, 8, 10; visual): different local fields, similar gross response.

## Ghezelbash2022 (2022): Submaximal electromyography-driven musculoskeletal modeling of the human trunk during static tasks: equilibrium and stability analyses

*J Electromyogr Kinesiol 65:102664*, doi `10.1016/j.jelekin.2022.102664`  
**Model:** Subject-specific EMG-assisted-optimisation multi-joint trunk model (KD-FE based) with stability analysis; gains calibrated from maximal or submaximal ramp MVC data; 30 subjects (15 F, 15 M; Lariviere 2019 cohort).

| Output | Experimental data | Conditions | Fig/Table | Metric / outcome | SpineBench card / tasks | Status |
|---|---|---|---|---|---|---|
| Muscle moments from calibrated EMG-driven model vs measured (required) moments, T11-T12 to L5-S1 | Lariviere 2019 cohort (own dynamometer data) | Ramp MVCs in 6 directions, semi-seated; maximal vs submaximal calibration, with/without axial tasks | Fig 3, Table 2 | Pearson r 0.75-0.77 (relative error 41-44%); 0.91-0.92 (28%) without axial torque; moderate; good when axial tasks excluded | **maximal_exertions**: none | missing. This cohort's MVC moments are not in maximal_exertions (Lariviere 2019 is booked only in emg_load_holding, lar19_*). Per-subject moments are not tabulated in the paper; would need the IRSST dataset. |

Model-vs-model:

- Gain ratios, individual muscle forces: vs Maximal vs submaximal calibration (Fig 4; Pearson r): weak (r = 0.34 +/- 0.28).
- L5-S1 compression, stability index, sum of abdominal / long back muscle forces: vs Maximal vs submaximal calibration (9 standing hold tasks) (Figs 5-6, Tables 3-4; Pearson r, Bland-Altman, ANOVA): r > 0.78; submaximal +6% compression, +11% abdominals.
- Model outputs: vs Calibration with 1 vs 10 vs 15 points (Table 4; ANOVA): significant but small differences.

## Lariviere2024 (2024): Effect of personalized spinal profile on its biomechanical response in an EMG-assisted optimization musculoskeletal model of the trunk

*J Biomech 162:111867 (co-author)*, doi `10.1016/j.jbiomech.2023.111867`  
**Model:** Subject-specific multi-joint EMG-kinematics-assisted optimisation trunk model (Eskandari 2023) with generic vs personalised (skin-profile) spine curvature; 31 participants (healthy and chronic LBP).

| Output | Experimental data | Conditions | Fig/Table | Metric / outcome | SpineBench card / tasks | Status |
|---|---|---|---|---|---|---|
| Pattern of predicted muscle forces (IC, LG, MF, RA, EO, IO) vs surface EMG across conditions | Lariviere 2024 cohort (own data) | Upright static holds: load height P1-P3 and distance P2 vs P4, 0 vs 6-7 kg | Figs 4-5, S3-S4 | qualitative pattern + ANOVA; Distance study: back muscles and IO matched, RA/EO diverged; Height study: generally not matched | **emg_load_holding**: `lar19_lg_t10_{p1,p2}`, `lar19_lg_l1_{p1,p2}`, `lar19_mf_l5_{p1,p2}`, `lar19_ra_{p2,p3}`, `lar19_eo_{p2,p3}`, `lar19_io_{p2,p3}` | partly. Analogous healthy-cohort protocol booked from Lariviere 2019 (lar19_*); the 2024 cohort EMG is non-normalised and not booked (catalogued, usable=partly). |

Model-vs-model:

- 17 outcomes (muscle forces, ratios, spinal loads, stability): vs Generic vs personalised spine profile (Tables 3-4, Fig 6; ANOVA effect sizes): medium/large effects on muscle forces; negligible/small on loads and stability.
- Generic-vs-personalised load differences: vs Bruno 2017, Caprara 2020, Schmid 2022 (Discussion; narrative): 19% vs 7% (Bruno); 102/116 N vs ~300/152 N (Caprara).

## Ghezelbash2024 (2024): Development and validation of a subject-specific integrated finite element musculoskeletal model of human trunk with ergonomic and clinical applications

*bioRxiv 2024.01.06.574467; published Biomech Model Mechanobiol 24(5):1591-1603 (2025)*, doi `10.1101/2024.01.06.574467`  
**Model:** Subject-specific coupled FE-MS trunk model: detailed T12-S1 FE ligamentous spine (AF model of 2021, facets, ligaments) integrated with the musculature; parametric scaling (Tang 2019/2022 SSM, Anderson 2012); kinematics-driven; applications to exoskeleton, nucleotomy and fusion.

| Output | Experimental data | Conditions | Fig/Table | Metric / outcome | SpineBench card / tasks | Status |
|---|---|---|---|---|---|---|
| AF biaxial (circ-fixed) circumferential and axial stress | bass2004, bass2004_g21, Hollingsworth & Wagner 2011 | Outer AF, circumferential strain held at 0 | Fig 2a | visual; matched (model at upper edge of the +/-SD band) | **annulus_tissue**: `bx_bass_ax_{00..08}`, `bx_bass_ci_{00..09}` | partly. Bass 2004 +/-SD band and Hollingsworth & Wagner 2011 not booked. |
| Flexion moment-rotation (ROM) curves, L1-L5 and L1-L2 ... L5-S1 | rohlmann2001a, panjabi1994, guan2007 | 0-5 Nm (segments) and 0-10 Nm (L1-L5); model BH 160-190 cm, BMI 19-30, both sexes | Fig 2b | within range (visual); matched | **lumbar_rom**: `4seg_flex_3p75`, `L1L2_flex_7p5_ax100`, `L2L3_flex_7p5_ax100`, `L3L4_flex_7p5_ax100`, `L4L5_flex_7p5_ax100`, `L5S1_flex_7p5_ax100`, `L4L5_flex_2p5_ax100`, `L4L5_flex_5_ax100`, `L4L5_flex_10_ax100`, `L4L5_flex_{1,2p5,4}` | partly. Card books single moment levels; Guan 2007 only at L4-L5. Guan 2007 other levels and low-moment Panjabi points could be added (Guan 2007 catalogued). |
| Disc-body-unit compression force-displacement (L2-L3) | Asano 1992, Brown 1957, Jamison 2013, Marini 2016, Markolf & Morris 1974, Tencer 1982 | Same band as Ghezelbash 2020a | Fig 2c | within range; matched | **segment_stiffness**: `ten_axial_compression` | partly. Card books only linear axial stiffness values (Tencer 1982, Costi 2008, Amin 2016, Berkson 1979, Frei 2002), not the force-displacement curves. Jamison2013.pdf, Marini2016.pdf, Tencer1982 are in donwload/ (catalogued); Asano 1992, Brown 1957, Markolf & Morris 1974 not downloaded. Curves also digitisable from Ghezelbash 2020a Fig 4a. |
| L2-L3 IDP vs axial compression in vitro | Brinckmann & Grootenboer 1991 | Single-level compression to ~1000 N | Fig 2d | within range; matched | **idp_invitro**: none | missing. Brinckmann & Grootenboer 1991 (Spine 16:641) not catalogued; 3 points with SD readable from Fig 2d. |
| L4-L5 IDP in vivo | sato1999, wilke2001, takahashi2006 | Sagittally symmetric tasks (as Ghezelbash 2020b) | Fig 3a | R2 = 0.78, slope 0.95; matched | **lumbar_idp_invivo**: `standing`, `stand_10kg`, `flex10`, `flex10_10kg`, `flex20`, `flex20_10kg`, `flex30`, `flex30_10kg`, `flex50`, `flex_full`, `lift_stoop`, `hold_{close,away}`, `flex_l4l5_5` | partly. Sato 1999 per-subject values not booked. |
| LGPT/ICPT activity (L/R) vs flexion angle, no load, single subject | ghezelbash2024s | Forward flexion 0-100 deg; 169 cm, 67 kg, 27 y | Fig 3b | visual; matched (rise to ~35-45 deg then flexion-relaxation) | **flexion_relaxation**: `g24s_lg_t11_{25..95}`, `g24s_ic_t11_{25..95}` | covered. Booked at 25/50/95 deg only. |
| LG/IC activity vs flexion angle (4 load heights), 10 kg | ghezelbash2024 | Own data, 19 subjects (average-subject model) | Fig 3c | visual; matched trend (IC over-predicted at 30-40 deg) | **flexion_relaxation**: `g24_lg_t11_{18..92}`, `g24_ic_t11_{18..92}` | covered |
| Abdominal activity (RA, EO, IO) vs flexion angle, 10 kg | ghezelbash2024 | Same tasks | Fig 3d | visual; not matched (model ~0 vs 3-9% EMG) | **flexion_relaxation**: none | missing. Owner data; readable from Fig 3d. |

Model-vs-model:

- Lumbar flexion ROM: vs Published FE models (Dreischarf 2014, 8-model comparison) (Fig 2b; visual): within model band.
- IDP, AF stress, facet contact, muscle forces: vs With vs without exoskeleton (Koopman 2020 / Naf 2018 kinematics); intact vs L5-S1 nucleotomy vs L4-L5 fusion (Nie 2019 kinematics) (Figs 4-5; differences): exo: IDP 2.2 -> 1.9 MPa; fusion: adjacent IDP 1.58 -> 1.72 MPa.

## Cross-paper summary

### Comparisons by category

| Category | Comparisons | Papers | Which papers | Covered | Partly | Missing |
|---|---|---|---|---|---|---|
| annulus_tissue | 14 | 3 | Ghezelbash2020a, Ghezelbash2021, Ghezelbash2024 | 4 | 6 | 4 |
| emg_load_holding | 3 | 2 | Ghezelbash2020b, Lariviere2024 | 0 | 2 | 1 |
| facet_forces | 1 | 1 | Ghezelbash2020rev | 0 | 1 | 0 |
| flexion_relaxation | 4 | 2 | Ghezelbash2016, Ghezelbash2024 | 2 | 0 | 2 |
| idp_invitro | 1 | 1 | Ghezelbash2024 | 0 | 0 | 1 |
| implant_loads_invivo | 0 | 0 | - | 0 | 0 | 0 |
| ligament_tissue | 0 | 0 | - | 0 | 0 | 0 |
| lumbar_idp_invivo | 5 | 3 | Ghezelbash2016, Ghezelbash2020b, Ghezelbash2024 | 0 | 5 | 0 |
| lumbar_resection | 1 | 1 | Ghezelbash2020rev | 1 | 0 | 0 |
| lumbar_rom | 1 | 1 | Ghezelbash2024 | 0 | 1 | 0 |
| maximal_exertions | 7 | 3 | Ghezelbash2016, Ghezelbash2018, Ghezelbash2022 | 3 | 3 | 1 |
| nucleus_endplate_tissue | 0 | 0 | - | 0 | 0 | 0 |
| ribcage_tissue | 0 | 0 | - | 0 | 0 | 0 |
| segment_stiffness | 5 | 3 | Ghezelbash2020a, Ghezelbash2021, Ghezelbash2024 | 0 | 3 | 2 |
| thoracic_idp_invivo | 0 | 0 | - | 0 | 0 | 0 |
| thoracic_resection | 0 | 0 | - | 0 | 0 | 0 |
| thoracic_rom | 0 | 0 | - | 0 | 0 | 0 |
| other: muscle specific tension | 1 | 1 | Ghezelbash2018 | 0 | 0 | 1 |
| other: disc residual stress | 1 | 1 | Ghezelbash2020a | 0 | 0 | 1 |
| other: load-sharing | 1 | 1 | Ghezelbash2020rev | 0 | 0 | 1 |
| **total** | **45** | | | **10** | **21** | **14** |

By type: model_vs_experiment 41, experiment_vs_literature 1, literature_compilation 3, model_vs_model 16.

### What the owner has validated against, in short

- **In vivo L4-L5 IDP** (Wilke 2001, Sato 1999, Takahashi 2006) is the backbone of every musculoskeletal paper (2016, 2020b, 2024). Most of the tasks are booked; what is missing is Sato's per-subject values, Wilke's continuous IDP-vs-angle curves (lateral bending, axial rotation), lateral bending at 10 deg and the one-handed asymmetric lift.
- **Trunk EMG**: maximal exertions (own 2018 cohort, El Ouaaid 2013, Ng 2001), static holds (own 2020 cohort, Lariviere cohorts) and flexion (own 2024 data, Arjmand 2010). Back-muscle data are mostly booked. **Abdominal EMG in submaximal tasks is the recurring gap**: it is where the models fail (R2 = 0.02 in 2020b, model ~0 in 2024 Fig 3d), and none of it is booked.
- **Annulus tissue**: 14 comparisons across 2020a, 2021 and 2024. Elastic curves are well covered. Failure data (Acaroglu, Skrzypiec, Skaggs, Green) and a few extra curves are not.
- **Disc and motion-segment axial compression curves**: used in 3 papers (2020a, 2021, 2024), but SpineBench only books linear stiffness values.
- **Passive FE kinematics** (lumbar ROM, in vitro IDP-compression) appear only in the 2024 integrated model.
- **Never used by the owner**: implant loads, thoracic cards (ROM, resection, IDP), ligament, nucleus/endplate and rib-cage tissue cards. These are SpineBench additions beyond his own validation practice.

### Missing data worth adding (ranked)

Ranked by how many papers used the data, then by how easily it can be added.

1. **Disc/motion-segment axial compression force-displacement curves** (Asano 1992, Brown 1957, Markolf & Morris 1974, Jamison 2013, Marini 2016, Tencer 1982, Costi 2008). Used in 2020a, 2021 and 2024 (5 comparisons). Add as curve tasks in `segment_stiffness`. Jamison2013.pdf, Marini2016.pdf and Tencer 1982 are already in donwload/. The band is also digitisable from Ghezelbash 2020a Fig 4a. Asano 1992 also gives the cyclic loading-unloading curve (2020a Fig 4b).
2. **Abdominal EMG (RA, EO, IO, L/R) in static holds and flexion** from the owner's 19-subject cohort: 14 kg grid (2020b Fig 6) and 10 kg flexion (2024 Fig 3d). Used in 2 papers. This is owner data and can go into `emg_load_holding` / `flexion_relaxation` next to the booked back-muscle tasks.
3. **Wilke 2001 extras for `lumbar_idp_invivo`**: the IDP-vs-angle curves for lateral bending (-30 to 30 deg) and axial rotation (-17 to 25 deg), plus lateral bending at 10 deg and the one-handed asymmetric 19.8 kg lift. Used in 2016 and 2020b. Source: P02_Wilke2001.pdf (catalogued).
4. **Sato 1999 per-subject IDP** (8 subjects, standing and flexed). Used in 2020b and 2024. Source: Sato 1999 Table 2. Could be added as individual refs (like the Nachemson per-subject refs).
5. **Annulus failure and extra AF curves**: failure stress/strain (Acaroglu 1995, Skrzypiec 2007, Skaggs 1994, Green 1993); fibre-direction curves (Skaggs 1994); circumferential curves (Acaroglu 1995, Skrzypiec 2007); O'Connell 2012 equi-biaxial; Bass 2004 +/-SD band; Hollingsworth & Wagner 2011. Used in 2020a, 2021 and 2024. The `annulus_tissue` notes currently exclude failure. Green1993.pdf is catalogued (usable=yes); the others need downloading.
6. **Single-subject forward-flexion EMG of LGPT/ICPT vs angle** (Arjmand 2009/2010). Used in 2016 Fig 6a. Arjmand2009CB.pdf is in donwload/; the curve is also digitisable from Fig 6a. Would extend `flexion_relaxation`.
7. **Lumbar flexion moment-rotation at low moments, all levels** (Panjabi 1994 at 1-5 Nm; Guan 2007 at L1-L2 to L5-S1; Rohlmann 2001 L1-L5 curve). Used in 2024 Fig 2b. Guan 2007 is catalogued.
8. **IDP vs compression, single level** (Brinckmann & Grootenboer 1991, L2-L3). Used in 2024 Fig 2d. Three points; not catalogued; would go in `idp_invitro`.
9. **Owner EMG not yet booked**: left-side electrodes for lateral and axial MVEs (2018 Figs 5-6), and the full 4-height x 4-asymmetry grid of the 2020 cohort (2020b Fig 5). Owner data.
10. **MVC moments of the Lariviere 2019 cohort** (30 subjects), used for the EMG-driven calibration check in 2022 (r = 0.75-0.92). Needs the IRSST dataset, because per-subject moments are not tabulated in the paper.
11. Lower priority / outside the cards:
    - MVE moment literature not booked (Plamondon 2014, Azghani 2009, Kumar 1996, Lee & Kuo 2000, McNeill 1980, Parnianpour 1988, Cholewicki 1995, Keller 2002, Malchaire 1995).
    - Facet forces of Wilson 2006 (catalogued).
    - Load-sharing fractions (Adams 1980/1987, Lu 2005); there is no card for these.
    - Muscle-stress literature (Burkhart 2018 catalogued).
    - Non-normalised EMG of the Lariviere 2024 cohort.
    - Bovine residual-stress opening angle (Michalek 2012, Mengoni 2017).

### Notes

- The user-mentioned "Ghezelbash 2020 J Biomech flexion-relaxation" paper was not found. In SpineBench, the `ghezelbash2020` study key in `flexion_relaxation` and `emg_load_holding` points to the 2020 regression paper (doi 10.1016/j.jbiomech.2019.109550), whose 14 kg hold EMG is reused as flexion-angle data.
- The 2020 regression paper sits in donwload/ under the wrong file name `Mitutoyo Digital Caliper - Certificate of Calibration Control # DDE14R52L.PDF`. It is the IRSST accepted manuscript.
- Several SpineBench tasks are themselves sourced from the owner's papers: `maximal_exertions` (ghezelbash2018), `emg_load_holding`/`flexion_relaxation` (ghezelbash2020, ghezelbash2024, ghezelbash2024s), and `annulus_tissue` (bass2004_g21 and oconnell2012 digitised from Ghezelbash 2021). For those rows, "covered" means the owner's own data are booked, so they are not an independent check.

