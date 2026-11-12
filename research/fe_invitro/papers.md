# SpineBench - in vitro / FE literature (papers.md)

50 papers, grouped by primary suite. The `feeds` field lists every suite a paper supplies. Machine-readable version: `papers.csv`.

Verification level: **A** = fields checked against the PubMed abstract; **FT** = checked against the open-access full text; **K** = taken from prior knowledge and not yet checked. Any field marked `[verify]` has not been confirmed and must be checked in the full text before it is used. All numbers quoted here come from the abstract or full text that was read; none are estimated.

Tier: 1 = must-have, 2 = nice to have, 3 = optional.

| Suite | Description | Papers (primary) |
|---|---|---|
| S0 | Tissue calibration (ligament, annulus, fibre angle) - pre-benchmark | 6 |
| S1 | Lumbar FSU ROM / moment-rotation | 2 |
| S2 | Lumbar multi-segment ROM (L1-L5 / L1-S1), with and without follower load | 6 |
| S3 | Thoracic FSU and multi-segment ROM, with and without rib cage | 6 |
| S4 | Intradiscal pressure (IDP) in vitro | 2 |
| S5 | Compression stiffness (disc / FSU / whole lumbar under follower load) | 6 |
| S6a | Sequential resection - lumbar | 2 |
| S6b | Sequential resection - thoracic and rib cage | 6 |
| S7 | Facet joint forces and contact | 3 |
| S8 | Instrumented spine (rods, cages, TDR, adjacent segments) | 6 |
| S9 | FE model inter-comparison, calibration and V&V methodology | 5 |

## S0 - Tissue calibration (ligament, annulus, fibre angle) - pre-benchmark

### Ghezelbash2021 (tier 1, verification A)
- **Citation:** Ghezelbash F, Eskandari AH, Shirazi-Adl A, Kazempour M, Tavakoli J, Baghani M, et al. Modeling of human intervertebral disc annulus fibrosus with complex multi-fiber networks. Acta Biomaterialia 2021;123:208-221. https://doi.org/10.1016/j.actbio.2020.12.062
- **Region / levels:** Lumbar disc; Tissue + whole disc
- **Specimens:** n = n/a (FE study against published data); age n/a
- **Loading:** Micromechanical (layerwise, ILM with elastic fibres), homogeneous hyperelastic and microplane AF models vs uniaxial, biaxial and whole-disc compression data; comparison with 7 published hyperelastic AF models
- **Measured (units):** Stress-strain (uniaxial/biaxial), whole-disc compression-displacement; sensitivity to specimen geometry/BCs (up to 16x)
- **Where the data sit:** Figures
- **FE reproducible:** yes: the user's own AF calibration workflow; defines a tissue-level sub-suite for SpineBench
- **Open access:** yes (preprint) - https://doi.org/10.2139/ssrn.3677348
- **Feeds suites:** S0;S5;S9
- **Notes:** USER'S OWN WORK. Shows tissue tests must replicate specimen geometry/BCs; supports a tissue-level gate before segment tests.

### Holzapfel2005 (tier 1, verification A)
- **Citation:** Holzapfel GA, Schulze-Bauer CAJ, Feigl G, Regitnig P. Single lamellar mechanics of the human lumbar anulus fibrosus. Biomechanics and Modeling in Mechanobiology 2005;3(3):125-140. https://doi.org/10.1007/s10237-004-0053-8
- **Region / levels:** Lumbar; L1-L2
- **Specimens:** n = 11 body-disc-body units; age [verify]; no significant age correlation reported
- **Loading:** Cyclic uniaxial tension of single lamellae (along and transverse to fibres), 3 strain rates, 0.15 M NaCl, 37 C; photogrammetric fibre angles at 6 circumferential x 3 depth positions
- **Measured (units):** Tensile moduli along fibres 28-78 MPa (regional means); transverse 0.22 +/- 0.2 MPa; fibre angle regression |phi| = 23.2 + 0.130*alpha (deg)
- **Where the data sit:** Abstract (values above) + tables/figures for regional moduli [verify]
- **FE reproducible:** yes (input calibration): single-lamella uniaxial simulation in FEBio
- **Open access:** no - https://doi.org/10.1007/s10237-004-0053-8 - **needs GT library access**
- **Feeds suites:** S0
- **Notes:** Crossref issue year 2004 (online), volume year 2005. Use for fibre constitutive parameters and fibre-angle field.

### Pintar1992 (tier 1, verification A)
- **Citation:** Pintar FA, Yoganandan N, Myers T, Elhagediab A, Sances A. Biomechanical properties of human lumbar spine ligaments. Journal of Biomechanics 1992;25(11):1351-1356. https://doi.org/10.1016/0021-9290(92)90290-H
- **Region / levels:** Lumbar; T12-L2, L2-L4, L4-S1 (grouped)
- **Specimens:** n = 38 cadavers; 132 ligament samples; age [verify]
- **Loading:** In situ isolation tensile tests of ALL, PLL, capsular ligament, ligamentum flavum, interspinous, supraspinous; normalised force-deflection
- **Measured (units):** Force-deflection curves (N vs mm), stiffness (N/mm), failure force/deflection, failure stress/strain, length and cross-sectional area (mm, mm^2)
- **Where the data sit:** 18 mean force-deflection curves (figures) + tables of stiffness/failure/geometry [verify table numbers]
- **FE reproducible:** yes (input calibration): ligament spring/tension-only element curves can be fitted directly
- **Open access:** no - https://doi.org/10.1016/0021-9290(92)90290-H - **needs GT library access**
- **Feeds suites:** S0;S6a
- **Notes:** Most widely used lumbar ligament dataset in FE models; use as input, not as a validation target.

### Cassidy1989 (tier 2, verification A)
- **Citation:** Cassidy JJ, Hiltner A, Baer E. Hierarchical Structure of the Intervertebral Disc. Connective Tissue Research 1989;23(1):75-88. https://doi.org/10.3109/03008208909103905
- **Region / levels:** Lumbar [verify]; [verify]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Optical microscopy of AF collagen structure (no mechanical loading)
- **Measured (units):** Fibre angle vs vertical axis decreasing from +62 deg (outer) to +45 deg (inner); crimp angle 20-45 deg; crimp period 26-20 um; lamella thickness
- **Where the data sit:** Abstract (values above) + figures
- **FE reproducible:** yes (geometry input): sets radial fibre-angle gradient
- **Open access:** no - https://doi.org/10.3109/03008208909103905 - **needs GT library access**
- **Feeds suites:** S0
- **Notes:** Note angle convention: measured from the VERTICAL axis (62->45 deg) = 28->45 deg from horizontal.

### Chazal1985 (tier 2, verification A)
- **Citation:** Chazal J, Tanguy A, Bourges M, Gaurel G, Escande G, Guillot M, et al. Biomechanical properties of spinal ligaments and a histological study of the supraspinal ligament in traction. Journal of Biomechanics 1985;18(3):167-176. https://doi.org/10.1016/0021-9290(85)90202-7
- **Region / levels:** Thoracic + lumbar; Multiple [verify]
- **Specimens:** n = 43 ligaments (fresh cadavers and living subjects); age [verify]
- **Loading:** Tensile tests on whole ligaments with bony clamps, 1 mm/min load and relaxation
- **Measured (units):** Sigmoid load-deformation curves (N vs mm), failure loads; histology of supraspinous ligament
- **Where the data sit:** Figures + tables [verify]
- **FE reproducible:** yes (input calibration): provides thoracic ligament curves that Pintar lacks
- **Open access:** no - https://doi.org/10.1016/0021-9290(85)90202-7 - **needs GT library access**
- **Feeds suites:** S0
- **Notes:** Often the only source for thoracic ligament curves.

### Ebara1996 (tier 2, verification A)
- **Citation:** Ebara S, Iatridis JC, Setton LA, Foster RJ, Mow VC, Weidenbaum M. Tensile Properties of Nondegenerate Human Lumbar Anulus Fibrosus. Spine 1996;21(4):452-461. https://doi.org/10.1097/00007632-199602150-00009
- **Region / levels:** Lumbar; [verify]
- **Specimens:** n = [verify]; age Range [verify]; weak age correlation
- **Loading:** Constant slow strain-rate uniaxial tension of multi-layer circumferential AF samples in 0.15 M NaCl
- **Measured (units):** Tensile modulus (MPa), failure stress (MPa), failure strain, strain energy density; anterior vs posterolateral, inner vs outer
- **Where the data sit:** Tables [verify]
- **FE reproducible:** yes (input calibration): multi-layer circumferential specimen; checks radial/circumferential gradients
- **Open access:** no - https://doi.org/10.1097/00007632-199602150-00009 - **needs GT library access**
- **Feeds suites:** S0

## S1 - Lumbar FSU ROM / moment-rotation

### Wilke1998 (tier 1, verification A)
- **Citation:** Wilke HJ, Wenger K, Claes L. Testing criteria for spinal implants: recommendations for the standardization of in vitro stability testing of spinal implants. European Spine Journal 1998;7(2):148-154. https://doi.org/10.1007/s005860050045
- **Region / levels:** All; n/a
- **Specimens:** n = n/a (protocol); age n/a
- **Loading:** Consensus recommendations: pure moments, magnitudes by region, rates, cycles, preconditioning, specimen handling [verify exact values in FT]
- **Measured (units):** Protocol definitions (ROM, NZ, EZ)
- **Where the data sit:** Text
- **FE reproducible:** yes: defines SpineBench default load protocol (moment magnitude, 3.5 cycles, evaluate 3rd cycle)
- **Open access:** yes - https://pmc.ncbi.nlm.nih.gov/articles/PMC3611233/
- **Feeds suites:** S1;S2;S3;S8
- **Notes:** Dreischarf 2014 used its 7.5 Nm lumbar recommendation (confirmed in Dreischarf FT).

### Schultz1979 (tier 2, verification K)
- **Citation:** Schultz AB, Warwick DN, Berkson MH, Nachemson AL. Mechanical Properties of Human Lumbar Spine Motion Segments—Part I: Responses in Flexion, Extension, Lateral Bending, and Torsion. Journal of Biomechanical Engineering 1979;101(1):46-52. https://doi.org/10.1115/1.3426223
- **Region / levels:** Lumbar; FSUs [verify levels]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Force-controlled loads (forces/moments) on FSUs with ~400 N preload [verify]
- **Measured (units):** Load-displacement (rotation in deg, translation in mm) per load mode
- **Where the data sit:** Tables [verify]
- **FE reproducible:** yes: FSU with applied loads; classic validation set used by Shirazi-Adl models
- **Open access:** no - https://doi.org/10.1115/1.3426223 - **needs GT library access**
- **Feeds suites:** S1;S5
- **Notes:** No PubMed abstract; details unverified. Companion of Berkson 1979 (Part II).

## S2 - Lumbar multi-segment ROM (L1-L5 / L1-S1), with and without follower load

### Busscher2009 (tier 1, verification A)
- **Citation:** Busscher I, van Dieën JH, Kingma I, van der Veen AJ, Verkerke GJ, Veldhuizen AG. Biomechanical Characteristics of Different Regions of the Human Spine. Spine 2009;34(26):2858-2864. https://doi.org/10.1097/BRS.0b013e3181b4c75d
- **Region / levels:** Thoracic + lumbar; T1-T4, T5-T8, T9-T12, L1-L4 (4-vertebra segments)
- **Specimens:** n = 24 segments from 6 spines; age [verify]
- **Loading:** Pure moments to 4 Nm, F/E, LB, AR; per-motion-segment 3D tracking
- **Measured (units):** ROM (deg), NZ (deg), NZ stiffness (Nm/deg), flexibility
- **Where the data sit:** Tables [verify]
- **FE reproducible:** yes: same protocol in thoracic and lumbar regions - ideal cross-region check without rib cage
- **Open access:** no - https://doi.org/10.1097/BRS.0b013e3181b4c75d - **needs GT library access**
- **Feeds suites:** S2;S3
- **Notes:** Same lab, same protocol across regions: removes inter-lab bias.

### Panjabi1994 (tier 1, verification A)
- **Citation:** Panjabi MM, Oxland TR, Yamamoto I, Crisco JJ. Mechanical behavior of the human lumbar and lumbosacral spine as shown by three-dimensional load-displacement curves. The Journal of Bone & Joint Surgery 1994;76(3):413-424. https://doi.org/10.2106/00004623-199403000-00012
- **Region / levels:** Lumbar + lumbosacral; L1-S1 (each level)
- **Specimens:** n = 9; age [verify]
- **Loading:** Pure moments F/E, bilateral AR, bilateral LB, stepwise [max moment: verify, likely 10 Nm]; stereophotogrammetry
- **Measured (units):** Six load-displacement curves per level (3 rotations deg, 3 translations mm) incl. coupled motions
- **Where the data sit:** Figures (curves) + tables [verify]
- **FE reproducible:** yes: per-level nonlinear moment-rotation and coupling
- **Open access:** no - https://doi.org/10.2106/00004623-199403000-00012 - **needs GT library access**
- **Feeds suites:** S1;S2
- **Notes:** Best source of COUPLED motion curves for lumbar.

### Patwardhan2003 (tier 1, verification A)
- **Citation:** Patwardhan AG, Havey RM, Carandang G, Simonds J, Voronov LI, Ghanayem AJ, et al. Effect of compressive follower preload on the flexion–extension response of the human lumbar spine. Journal of Orthopaedic Research 2003;21(3):540-546. https://doi.org/10.1016/S0736-0266(02)00202-4
- **Region / levels:** Lumbar; L1-S1 [verify]
- **Specimens:** n = 21; age [verify]
- **Loading:** F/E moments [magnitude: verify] under follower preload 0-1200 N along two optimised paths (neutral, flexed)
- **Measured (units):** ROM (deg), flexion stiffness (Nm/deg) vs preload
- **Where the data sit:** Text reports ~2x flexion stiffness at 0->1200 N and 25% ROM decrease (neutral path), 15% (flexed path); figures/tables for values
- **FE reproducible:** partly: follower-load path definition (per-level path through centres of rotation) must be replicated; sensitive to path
- **Open access:** no - https://doi.org/10.1016/S0736-0266(02)00202-4 - **needs GT library access**
- **Feeds suites:** S2;S5

### Rohlmann2001Spine (tier 1, verification A)
- **Citation:** Rohlmann A, Neller S, Claes L, Bergmann G, Wilke HJ. Influence of a Follower Load on Intradiscal Pressure and Intersegmental Rotation of the Lumbar Spine. Spine 2001;26(24):E557-E561. https://doi.org/10.1097/00007632-200112150-00014
- **Region / levels:** Lumbar; L1-L5 (all levels)
- **Specimens:** n = 10; age [verify]
- **Loading:** Pure moments 3.75 and 7.5 Nm, and 7.5 Nm + 280 N follower load, in F/E, LB, AR
- **Measured (units):** Intersegmental rotation (deg) and IDP (MPa) at all levels
- **Where the data sit:** Figures (median + range); Dreischarf 2014 Fig. 2a/b re-plots L1-5 median/range at 7.5 Nm
- **FE reproducible:** yes: exactly the Dreischarf 2014 in vitro reference; follower load path must be modelled
- **Open access:** no - https://doi.org/10.1097/00007632-200112150-00014 - **needs GT library access**
- **Feeds suites:** S2;S4;S9
- **Notes:** Core reference for S2 and S9. Dreischarf cites it as 'Rohlmann et al., 2001b'.

### Yamamoto1989 (tier 1, verification A)
- **Citation:** Yamamoto I, Panjabi MM, Crisco T, Oxland T. Three-Dimensional Movements of the Whole Lumbar Spine and Lumbosacral Joint. Spine 1989;14(11):1256-1260. https://doi.org/10.1097/00007632-198911000-00020
- **Region / levels:** Lumbar + lumbosacral; L1-S1 (6 specimens to sacrum, 4 with ilium)
- **Specimens:** n = 10; age [verify]
- **Loading:** Pure moments, incremental, max 10 Nm; F/E, bilateral AR, bilateral LB; no preload [verify]
- **Measured (units):** Per-level NZ, EZ, ROM (deg) for rotations and translations
- **Where the data sit:** Abstract gives per-level mean NZ and ROM (e.g. L4-5 ROM F 8.9, E 5.8, AR 2.2, LB 5.7 deg); tables with SD in paper
- **FE reproducible:** yes: L1-S1 model, fix sacrum, pure moments to 10 Nm, read per-level rotations
- **Open access:** no - https://doi.org/10.1097/00007632-198911000-00020 - **needs GT library access**
- **Feeds suites:** S1;S2
- **Notes:** Only classic source with L5-S1 per-level ROM under pure moments.

### Renner2007 (tier 2, verification A)
- **Citation:** Renner SM, Natarajan RN, Patwardhan AG, Havey RM, Voronov LI, Guo BY, et al. Novel model to analyze the effect of a large compressive follower pre-load on range of motions in a lumbar spine. Journal of Biomechanics 2007;40(6):1326-1332. https://doi.org/10.1016/j.jbiomech.2006.05.019
- **Region / levels:** Lumbar; L1-S1
- **Specimens:** n = 10 cadaveric L1-S1 (compression) + FE; age [verify]
- **Loading:** Follower compression; bending without preload and F/E with 800 N follower; FE up to 1200 N
- **Measured (units):** Disc compression per level (mm); ROM (deg)
- **Where the data sit:** Figures/tables [verify]
- **FE reproducible:** yes: provides both in vitro per-level disc compression under follower load and an FE comparator
- **Open access:** no - https://doi.org/10.1016/j.jbiomech.2006.05.019 - **needs GT library access**
- **Feeds suites:** S2;S5;S9
- **Notes:** Reports FE ROM reductions with preload: F/E up to 18%, LB up to 42%, AR up to 26%.

## S3 - Thoracic FSU and multi-segment ROM, with and without rib cage

### Liebsch2019 (tier 1, verification A)
- **Citation:** Liebsch C, Graf N, Wilke HJ. In vitro analysis of kinematics and elastostatics of the human rib cage during thoracic spinal movement for the validation of numerical models. Journal of Biomechanics 2019;94:147-157. https://doi.org/10.1016/j.jbiomech.2019.07.041
- **Region / levels:** Thoracic + rib cage; C7-L1 with entire rib cage
- **Specimens:** n = 8; age Median 55 y (40-60)
- **Loading:** Pure moments 5 Nm F/E, LB, AR; displacement-controlled 1 deg/s, 3.5 cycles, 3rd cycle evaluated; 150 markers per specimen
- **Measured (units):** Relative angles of ribs, vertebrae, sternum (deg); rib and intercostal strains (%)
- **Where the data sit:** Figures/tables [verify]
- **FE reproducible:** partly: requires full rib cage + sternum + costal cartilage model; rib kinematics outputs are unusual but highly diagnostic
- **Open access:** no - https://doi.org/10.1016/j.jbiomech.2019.07.041 - **needs GT library access**
- **Feeds suites:** S3;S6b
- **Notes:** Intercostal strains >10% anterior lower rib cage; rib deformation <1%; rib-sternum angles <2 deg (abstract).

### Oxland1992 (tier 1, verification A)
- **Citation:** Oxland TR, Lin R, Panjabi MM. Three‐Dimensional mechanical properties of the thoracolumbar junction. Journal of Orthopaedic Research 1992;10(4):573-580. https://doi.org/10.1002/jor.1100100412
- **Region / levels:** Thoracolumbar; T11-T12, T12-L1 (T11-L1 specimens)
- **Specimens:** n = 11; age [verify]
- **Loading:** Pure moments F/E, bilateral AR, bilateral LB to max 7.5 Nm; stereophotogrammetry
- **Measured (units):** ROM mean +/- SD (deg) per level; load-displacement curves (3 rotations + 3 translations)
- **Where the data sit:** Abstract gives mean +/- SD ROM (e.g. T11-T12: F 2.7+/-1.3, E 2.4+/-1.3, AR 1.8+/-0.7, LB 3.5+/-1.1 deg); curves in figures
- **FE reproducible:** yes: T11-L1 sub-model, pure moment 7.5 Nm; mean +/- SD ideal for z-score pass rule
- **Open access:** no - https://doi.org/10.1002/jor.1100100412 - **needs GT library access**
- **Feeds suites:** S3;S1

### Sis2016 (tier 1, verification A)
- **Citation:** Sis HL, Mannen EM, Wong BM, Cadel ES, Bouxsein ML, Anderson DE, et al. Effect of follower load on motion and stiffness of the human thoracic spine with intact rib cage. Journal of Biomechanics 2016;49(14):3252-3259. https://doi.org/10.1016/j.jbiomech.2016.08.003
- **Region / levels:** Thoracic + rib cage; T1-T12 with intact rib cage
- **Specimens:** n = 8; age [verify]
- **Loading:** Pure moments 5 Nm in LB, F/E, AR under follower loads 0-400 N
- **Measured (units):** ROM, EZ, NZ (deg), EZ and NZ stiffness (Nm/deg) per FSU and segment
- **Where the data sit:** Tables/figures [verify]; abstract: combined segmental ROM decreased by average 34% with follower load
- **FE reproducible:** yes (with rib cage model): only thoracic dataset combining rib cage AND follower load
- **Open access:** yes (PMC author manuscript) - https://pmc.ncbi.nlm.nih.gov/articles/PMC5702885/
- **Feeds suites:** S3;S5

### Wilke2017 (tier 1, verification FT)
- **Citation:** Wilke HJ, Herkommer A, Werner K, Liebsch C. In vitro analysis of the segmental flexibility of the thoracic spine. PLOS ONE 2017;12(5):e0177823. https://doi.org/10.1371/journal.pone.0177823
- **Region / levels:** Thoracic; Every FSU T1-T2 to T11-T12 (with costovertebral joints, no rib cage)
- **Specimens:** n = 68 FSUs (n=6 per level; n=7 at T4-T5, T7-T8); age Mean 57 y (40-80); 13 M, 16 F
- **Loading:** Pure moments +/-7.5 Nm F/E, LB, AR; 3.5 cycles, 1 deg/s (F/E, LB), 0.5 deg/s (AR); no axial preload; 3rd cycle evaluated
- **Measured (units):** ROM and NZ (deg) per level and direction; NZ and EZ stiffness; full load-displacement curves
- **Where the data sit:** Figures; S1 Dataset (all ROM/NZ/stiffness raw), S2-S4 (raw load-displacement, all cycles), S5-S7 (hysteresis curves) - XLSX
- **FE reproducible:** yes: FSU models of each thoracic level; raw curves allow full moment-rotation comparison
- **Open access:** yes - https://doi.org/10.1371/journal.pone.0177823
- **Feeds suites:** S3
- **Notes:** Best thoracic FSU dataset: raw curves published. Stated purpose: validation of numerical models.

### Panjabi1976 (tier 2, verification A)
- **Citation:** Panjabi M, Brand R, White A. Mechanical properties of the human thoracic spine as shown by three-dimensional load-displacement curves. The Journal of Bone & Joint Surgery 1976;58(5):642-652. https://doi.org/10.2106/00004623-197658050-00011
- **Region / levels:** Thoracic; All 11 thoracic FSUs (T1-T2 ... T11-T12)
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Six forces and six moments applied one at a time at the upper vertebra centre; lower vertebra fixed; 100% humidity, 22 C [magnitudes: verify]
- **Measured (units):** 36 load-displacement curves per segment (main + coupled; deg, mm)
- **Where the data sit:** Figures + tables [verify]
- **FE reproducible:** partly: rib cage absent; loads applied at vertebral centre (not pure moment) - BCs must be copied
- **Open access:** no - https://doi.org/10.2106/00004623-197658050-00011 - **needs GT library access**
- **Feeds suites:** S3
- **Notes:** Includes force (shear/compression) flexibilities, which pure-moment studies lack.

### Watkins2005 (tier 2, verification A)
- **Citation:** Watkins R, Watkins R, Williams L, Ahlbrand S, Garcia R, Karamanian A, et al. Stability Provided by the Sternum and Rib Cage In the Thoracic Spine. Spine 2005;30(11):1283-1286. https://doi.org/10.1097/01.brs.0000164257.69354.bb
- **Region / levels:** Thoracic + rib cage; Whole thoracic [verify]
- **Specimens:** n = 10; age [verify]
- **Loading:** Axial compression, AR, LB, F/E (materials testing machine) - intact, sternal fracture, rib cage removed [loads: verify]
- **Measured (units):** Stiffness/stability (% change); rib cage +40% F/E, +35% LB, +31% AR stability
- **Where the data sit:** Abstract (percent changes); figures/tables [verify]
- **FE reproducible:** partly: load protocol not pure moment [verify]; useful as % change targets
- **Open access:** no - https://doi.org/10.1097/01.brs.0000164257.69354.bb - **needs GT library access**
- **Feeds suites:** S3;S6b

## S4 - Intradiscal pressure (IDP) in vitro

### Anderson2018 (tier 1, verification A)
- **Citation:** Anderson DE, Mannen EM, Tromp R, Wong BM, Sis HL, Cadel ES, et al. The rib cage reduces intervertebral disc pressures in cadaveric thoracic spines by sharing loading under applied dynamic moments. Journal of Biomechanics 2018;70:262-266. https://doi.org/10.1016/j.jbiomech.2017.10.005
- **Region / levels:** Thoracic + rib cage; IDP at T4-T5 and T8-T9 (T1-T12 specimens [verify])
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Dynamic pure moments 0 to +/-5 Nm + 400 N follower load; AR, F/E, LB; rib cage intact then removed
- **Measured (units):** IDP (MPa) vs moment; pressure-moment slope (MPa/Nm); rib cage share of moment (%)
- **Where the data sit:** Figures/tables [verify]; abstract: rib cage carried ~62% (T4-5) and 56% (T8-9) of AR moment
- **FE reproducible:** yes (with rib cage model): only thoracic IDP-under-moment dataset
- **Open access:** yes (PMC) - https://pmc.ncbi.nlm.nih.gov/articles/PMC6193557/
- **Feeds suites:** S4;S3
- **Notes:** Authors list from memory [verify]. Companion: Anderson et al. 2016 J Biomech (IDP vs follower load, rib cage), DOI 10.1016/j.jbiomech.2016.02.038 - not counted in the 50.

### Brinckmann1991 (tier 1, verification A)
- **Citation:** Brinckmann P, Grootenboer H. Change of Disc Height, Radial Disc Bulge, and Intradiscal Pressure From Discectomy An in Vitro Investigation on Human Lumbar Discs. Spine 1991;16(6):641-646. https://doi.org/10.1097/00007632-199106000-00008
- **Region / levels:** Lumbar; Lumbar discs (L4-5 subset used by Dreischarf)
- **Specimens:** n = 15 discs; age 20-40 y
- **Loading:** Axial compression with stepwise central disc tissue removal (partial discectomy)
- **Measured (units):** IDP (MPa) vs compression force; disc height (mm); radial bulge (mm) vs mass removed (g)
- **Where the data sit:** Figures; Dreischarf 2014 Fig. 2d re-plots median/range at 0, 300, 1000 N for five L4-5 segments
- **FE reproducible:** yes: L4-5 FSU under axial compression; also nucleotomy (mass removal) sub-test
- **Open access:** no - https://doi.org/10.1097/00007632-199106000-00008 - **needs GT library access**
- **Feeds suites:** S4;S5;S9
- **Notes:** Abstract: 1 g removed -> -0.8 mm height, +0.2 mm bulge; 3 g removed -> IDP ~40% of initial.

## S5 - Compression stiffness (disc / FSU / whole lumbar under follower load)

### Berkson1979 (tier 1, verification K)
- **Citation:** Berkson MH, Nachemson A, Schultz AB. Mechanical Properties of Human Lumbar Spine Motion Segments—Part II: Responses in Compression and Shear; Influence of Gross Morphology. Journal of Biomechanical Engineering 1979;101(1):53-57. https://doi.org/10.1115/1.3426225
- **Region / levels:** Lumbar; FSUs [verify]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Axial compression and A/P, lateral shear on FSUs [verify]
- **Measured (units):** Compression and shear stiffness (N/mm); morphology correlations
- **Where the data sit:** Tables [verify]
- **FE reproducible:** yes: FSU compression/shear stiffness
- **Open access:** no - https://doi.org/10.1115/1.3426225 - **needs GT library access**
- **Feeds suites:** S5;S1
- **Notes:** No PubMed abstract. Companion of Schultz 1979 (Part I).

### Patwardhan1999 (tier 1, verification A)
- **Citation:** Patwardhan AG, Havey RM, Meade KP, Lee B, Dunlap B. A Follower Load Increases the Load-Carrying Capacity of the Lumbar Spine in Compression. Spine 1999;24(10):1003-1009. https://doi.org/10.1097/00007632-199905150-00014
- **Region / levels:** Lumbar; L1-sacrum [verify]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Vertical vs follower compressive load up to 1200 N in neutral and flexed postures
- **Measured (units):** Lordosis change (deg) vs load; stability (vertical load: near flexion/extension limit at ~100 N; follower: 1200 N without damage)
- **Where the data sit:** Figures [verify]
- **FE reproducible:** yes: buckling vs follower load - key stability check for any whole-lumbar model
- **Open access:** no - https://doi.org/10.1097/00007632-199905150-00014 - **needs GT library access**
- **Feeds suites:** S5;S2
- **Notes:** Defines the follower-load technique used by Dreischarf, Rohlmann, Sis, Niosi.

### Markolf1972 (tier 2, verification K)
- **Citation:** Markolf KL. Deformation of the Thoracolumbar Intervertebral Joints in Response to External Loads. The Journal of Bone & Joint Surgery 1972;54(3):511-533. https://doi.org/10.2106/00004623-197254030-00005
- **Region / levels:** Thoracic + lumbar; Thoracolumbar FSUs [verify]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Axial compression, tension, shear, bending, torsion on FSUs [verify]
- **Measured (units):** Stiffness (N/mm, Nm/deg) per load mode
- **Where the data sit:** Tables [verify]
- **FE reproducible:** yes: FSU stiffness tests; one of few sources covering thoracic FSU compression
- **Open access:** no - https://doi.org/10.2106/00004623-197254030-00005 - **needs GT library access**
- **Feeds suites:** S5;S1;S3
- **Notes:** No PubMed abstract.

### MarkolfMorris1974 (tier 2, verification K)
- **Citation:** Markolf KL, Morris JM. The Structural Components of the Intervertebral Disc. The Journal of Bone & Joint Surgery 1974;56(4):675-687. https://doi.org/10.2106/00004623-197456040-00003
- **Region / levels:** Thoracolumbar [verify]; [verify]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Axial compression of discs before/after nucleus removal and annulus modifications [verify]
- **Measured (units):** Compression stiffness (N/mm), creep, failure
- **Where the data sit:** Tables/figures [verify]
- **FE reproducible:** yes: disc compression with/without nucleus - tests nucleus/annulus load sharing
- **Open access:** no - https://doi.org/10.2106/00004623-197456040-00003 - **needs GT library access**
- **Feeds suites:** S5;S6a
- **Notes:** No PubMed abstract.

### Brown1957 (tier 3, verification K)
- **Citation:** Brown T, Hansen RJ, Yorra AJ. Some Mechanical Tests on the Lumbosacral Spine with Particular Reference to the Intervertebral Discs. The Journal of Bone & Joint Surgery 1957;39(5):1135-1164. https://doi.org/10.2106/00004623-195739050-00014
- **Region / levels:** Lumbosacral; [verify]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Compression (and other) tests on lumbosacral FSUs/discs [verify]
- **Measured (units):** Load-deflection, disc bulge (mm) [verify]
- **Where the data sit:** Figures [verify]
- **FE reproducible:** partly: old, specimen details sparse
- **Open access:** no - https://doi.org/10.2106/00004623-195739050-00014 - **needs GT library access**
- **Feeds suites:** S5
- **Notes:** No PubMed abstract. Source for disc bulge under compression, used in early FE validations (incl. Shirazi-Adl).

### Virgin1951 (tier 3, verification K)
- **Citation:** Virgin WJ. EXPERIMENTAL INVESTIGATIONS INTO THE PHYSICAL PROPERTIES OF THE INTERVERTEBRAL DISC. The Journal of Bone and Joint Surgery. British volume 1951;33-B(4):607-611. https://doi.org/10.1302/0301-620X.33B4.607
- **Region / levels:** Lumbar [verify]; Discs [verify]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Axial compression load-deformation, hysteresis and recovery of discs [verify]
- **Measured (units):** Load-deformation (kg/N vs mm)
- **Where the data sit:** Figures [verify]
- **FE reproducible:** partly: old, poorly specified BCs and specimen geometry
- **Open access:** no - https://doi.org/10.1302/0301-620X.33B4.607 - **needs GT library access**
- **Feeds suites:** S5
- **Notes:** No PubMed abstract. Historical; use only as a sanity bound. JBJS Br archive may be free on boneandjoint.org.uk.

## S6a - Sequential resection - lumbar

### Heuer2007a (tier 1, verification A)
- **Citation:** Heuer F, Schmidt H, Klezl Z, Claes L, Wilke HJ. Stepwise reduction of functional spinal structures increase range of motion and change lordosis angle. Journal of Biomechanics 2007;40(2):271-280. https://doi.org/10.1016/j.jbiomech.2006.01.007
- **Region / levels:** Lumbar; L4-L5 FSU
- **Specimens:** n = 8; age Median 52 y (38-59); low degeneration
- **Loading:** Pure moments 1-10 Nm (stepwise) in F/E, LB, AR at 1.0 deg/s; successive removal: ligaments, facet capsules, facet joints, nucleus
- **Measured (units):** ROM and NZ (deg) per moment level and resection step; lordosis angle change
- **Where the data sit:** Figures (ROM vs moment per step) [verify whether tables exist]
- **FE reproducible:** yes: designed for FE calibration (annulus first, then add structures) - each step is a model variant
- **Open access:** no - https://doi.org/10.1016/j.jbiomech.2006.01.007 - **needs GT library access**
- **Feeds suites:** S6a;S1;S9
- **Notes:** Dreischarf FT labels this 'Heuer 2007b'; Heuer 2007b below is 'Heuer 2007a' there. Keep DOI as the key.

### Heuer2007b (tier 1, verification A)
- **Citation:** Heuer F, Schmidt H, Claes L, Wilke HJ. Stepwise reduction of functional spinal structures increase vertebral translation and intradiscal pressure. Journal of Biomechanics 2007;40(4):795-803. https://doi.org/10.1016/j.jbiomech.2006.03.016
- **Region / levels:** Lumbar; L4-L5 FSU (same specimens as Heuer 2007a)
- **Specimens:** n = 8; age Median 52 y (38-59)
- **Loading:** As Heuer 2007a (1-10 Nm, 1 deg/s); nucleus pressure probe; ultrasound motion tracking
- **Measured (units):** IDP (MPa) vs moment per step; translations (mm) of L4 centre and endplate landmarks
- **Where the data sit:** Figures [verify]
- **FE reproducible:** yes: IDP and translation per resection step; IDP rises sharply after facet removal
- **Open access:** no - https://doi.org/10.1016/j.jbiomech.2006.03.016 - **needs GT library access**
- **Feeds suites:** S6a;S4

## S6b - Sequential resection - thoracic and rib cage

### Liebsch2017 (tier 1, verification FT)
- **Citation:** Liebsch C, Graf N, Appelt K, Wilke HJ. The rib cage stabilizes the human thoracic spine: An in vitro study using stepwise reduction of rib cage structures. PLOS ONE 2017;12(6):e0178733. https://doi.org/10.1371/journal.pone.0178733
- **Region / levels:** Thoracic + rib cage; C7-L1 with entire rib cage; T1-T12 ROM and each FSU
- **Specimens:** n = 6; age Mean 56 y (50-65); 1 M, 5 F
- **Loading:** Pure moments +/-2 Nm F/E, LB, AR; 1.0 deg/s (F/E, LB), 0.5 deg/s (AR); 3.5 cycles, last evaluated; steps: intact, -intercostal muscles, median sternotomy, -anterior rib cage, -right 6-8th rib heads, -all rib heads
- **Measured (units):** T1-T12 ROM and NZ (deg) per step; monosegmental ROM intact vs no rib cage; coupled motion ROM
- **Where the data sit:** Tables 1-5 + S1 Dataset (raw ROM/NZ, monosegmental, coupled motions)
- **FE reproducible:** yes (needs rib cage model): each step is a model variant; low moment (2 Nm) tests toe region
- **Open access:** yes - https://doi.org/10.1371/journal.pone.0178733
- **Feeds suites:** S6b;S3
- **Notes:** Abstract: removing anterior rib cage vs intact -> ROM +52.2% F/E, +42.0% LB, +94.4% AR.

### Liebsch2020 (tier 1, verification FT)
- **Citation:** Liebsch C, Wilke HJ. Rib Presence, Anterior Rib Cage Integrity, and Segmental Length Affect the Stability of the Human Thoracic Spine: An in vitro Study. Frontiers in Bioengineering and Biotechnology 2020;8:46. https://doi.org/10.3389/fbioe.2020.00046
- **Region / levels:** Thoracic + rib cage; C7-L1; segments T1-T2, T3-T4, ..., T11-T12
- **Specimens:** n = 8; age 40-68 y (Table 1)
- **Loading:** Pure moments +/-5 Nm F/E, LB, AR; displacement-controlled 1 deg/s, 3.5 cycles, 3rd evaluated; steps: intact, anterior rib-to-rib connections cut, partitioned into monosegments, ribs removed
- **Measured (units):** ROM and NZ (deg), median + range, total T1-T12 and six segmental levels per step
- **Where the data sit:** Tables 2-9 (median and range) + Figure 3
- **FE reproducible:** yes (needs rib cage model): tests polysegmental vs monosegmental BCs - directly checks the FSU-vs-long-segment issue
- **Open access:** yes - https://doi.org/10.3389/fbioe.2020.00046
- **Feeds suites:** S6b;S3
- **Notes:** Tabulated median + range -> use range rule, not SD rule.

### Anderson2009 (tier 2, verification A)
- **Citation:** Anderson AL, McIff TE, Asher MA, Burton DC, Glattes RC. The Effect of Posterior Thoracic Spine Anatomical Structures on Motion Segment Flexion Stiffness. Spine 2009;34(5):441-446. https://doi.org/10.1097/BRS.0b013e318198c62d
- **Region / levels:** Thoracic; Thoracic motion segments [verify levels]
- **Specimens:** n = 23 motion segments from 6 cadavers; age [verify]
- **Loading:** Displacement-controlled flexion to ~3.2 deg at 0.1 Hz; 6 sequential posterior procedures (hook/screw site prep, SSL/ISL transection, facets + remaining posterior structures)
- **Measured (units):** Flexion stiffness (Nm/deg) and % loss per step
- **Where the data sit:** Abstract: SSL/ISL -6.59%; remaining posterior structures -44.72%; anterior column alone 32.39% of stiffness; tables
- **FE reproducible:** yes: displacement-controlled FSU flexion; stiffness loss per step
- **Open access:** no - https://doi.org/10.1097/brs.0b013e318198c62d - **needs GT library access**
- **Feeds suites:** S6b;S8
- **Notes:** Only displacement-controlled resection set; complements moment-controlled studies (see Ghezelbash 2020 review on control mode).

### Brasiliense2011 (tier 2, verification A)
- **Citation:** Brasiliense LBC, Lazaro BCR, Reyes PM, Dogan S, Theodore N, Crawford NR. Biomechanical Contribution of the Rib Cage to Thoracic Stability. Spine 2011;36(26):E1686-E1693. https://doi.org/10.1097/BRS.0b013e318219ce84
- **Region / levels:** Upper thoracic + 4 ribs + sternum; 3-level upper thoracic specimens; middle FSU measured [verify levels]
- **Specimens:** n = 8; age [verify]
- **Loading:** Pure moments 7.5 Nm, 3 planes; distal ribs fixed to their vertebrae; steps: sternum split, sternum removed, 50% ribs removed, 75% ribs removed, ribs fully removed
- **Measured (units):** ROM/NZ (deg) of middle segment per step; axis of rotation; coupling
- **Where the data sit:** Figures/tables [verify]; abstract: intact ribs accounted for 78% of thoracic stability
- **FE reproducible:** partly: rib-end fixation BC unusual but replicable
- **Open access:** no - https://doi.org/10.1097/BRS.0b013e318219ce84 - **needs GT library access**
- **Feeds suites:** S6b;S3

### Healy2014 (tier 2, verification A)
- **Citation:** Healy AT, Lubelski D, Mageswaran P, Bhowmick DA, Bartsch AJ, Benzel EC, et al. Biomechanical analysis of the upper thoracic spine after decompressive procedures. The Spine Journal 2014;14(6):1010-1016. https://doi.org/10.1016/j.spinee.2013.11.035
- **Region / levels:** Thoracic + rib cage; C7-L1; resections at T4-T5; T3-T7 fusion
- **Specimens:** n = 9; age [verify]; age negatively correlated with F/E and AR ROM
- **Loading:** Robot, pure moments +/-5 Nm AR, LB, F/E; steps at T4-T5: laminectomy, unilateral facetectomy, unilateral costotransversectomy, then T3-T7 instrumented fusion
- **Measured (units):** ROM (deg) T3-T7 and T1-T12
- **Where the data sit:** Abstract: no significant change with decompression; instrumentation reduced T1-T12 ROM by 16.3% AR, 12% FE, 18.4% LB; figures/tables
- **FE reproducible:** yes (rib cage model + pedicle screw construct)
- **Open access:** no - https://doi.org/10.1016/j.spinee.2013.11.035 - **needs GT library access**
- **Feeds suites:** S6b;S8;S3
- **Notes:** Companion: Lubelski 2014 Spine J lower thoracic (10.1016/j.spinee.2014.03.026) - not counted.

### Oda2002 (tier 2, verification A)
- **Citation:** Oda I, Abumi K, Cunningham BW, Kaneda K, McAfee PC. An In Vitro Human Cadaveric Study Investigating the Biomechanical Properties of the Thoracic Spine. Spine 2002;27(3):E64-E70. https://doi.org/10.1097/00007632-200202010-00007
- **Region / levels:** Thoracic; FSUs with intact costovertebral joints [verify levels]
- **Specimens:** n = 16 FSUs from 6 cadavers; age [verify]
- **Loading:** Sequential destabilisation: Group 1 anterior->posterior (discectomy, rib head resection, ...), Group 2 posterior->anterior (laminectomy + medial facetectomy, total facetectomy, ...); F/E, LB, AR [load magnitude: verify]
- **Measured (units):** ROM (deg) at max load per step
- **Where the data sit:** Abstract: discectomy +193% F/E, +74% LB, +111% AR; then rib head resection +81/+84/+72%; figures/tables
- **FE reproducible:** yes: thoracic FSU with costovertebral joints
- **Open access:** no - https://doi.org/10.1097/00007632-200202010-00007 - **needs GT library access**
- **Feeds suites:** S6b;S3
- **Notes:** Oda 1996 (Spine 21:1423) is the earlier canine-model study - excluded (animal).

## S7 - Facet joint forces and contact

### Niosi2008 (tier 1, verification A)
- **Citation:** Niosi CA, Wilson DC, Zhu Q, Keynan O, Wilson DR, Oxland TR. The Effect of Dynamic Posterior Stabilization on Facet Joint Contact Forces. Spine 2008;33(1):19-26. https://doi.org/10.1097/BRS.0b013e31815e7f76
- **Region / levels:** Lumbar; L2-L5
- **Specimens:** n = 10; age [verify]
- **Loading:** Pure moment +/-7.5 Nm in 3 directions, with and without 600 N follower preload; intact and injured + Dynesys (3 spacer lengths)
- **Measured (units):** Peak bilateral facet contact force (N)
- **Where the data sit:** Abstract: intact vs Dynesys flexion 3 -> 22 N/side, LB 14 -> 24 N/side; tables/figures
- **FE reproducible:** yes: intact FJF with/without follower load; dynamic-device arm optional
- **Open access:** no - https://doi.org/10.1097/BRS.0b013e31815e7f76 - **needs GT library access**
- **Feeds suites:** S7;S8

### Wilson2006 (tier 1, verification A)
- **Citation:** Wilson DC, Niosi CA, Zhu QA, Oxland TR, Wilson DR. Accuracy and repeatability of a new method for measuring facet loads in the lumbar spine. Journal of Biomechanics 2006;39(2):348-353. https://doi.org/10.1016/j.jbiomech.2004.12.011
- **Region / levels:** Lumbar; Lumbar facets [verify levels]
- **Specimens:** n = 4 specimens (repeatability); 4 joints (accuracy); age [verify]
- **Loading:** Pure moments +/-7.5 Nm AR and F/E; Tekscan 6900; known 25/50/100 N for accuracy
- **Measured (units):** Facet force (N), contact pressure (MPa), contact area (mm^2); sensor error (overestimates 18 +/- 9% at 100 N)
- **Where the data sit:** Figures/tables; Dreischarf 2014 Fig. 2c uses its ranges (in vitro median 30 N extension, 83 N axial rotation, per Dreischarf text)
- **FE reproducible:** yes: facet contact force at 7.5 Nm; must consider sensor overestimation when setting tolerance
- **Open access:** no - https://doi.org/10.1016/j.jbiomech.2004.12.011 - **needs GT library access**
- **Feeds suites:** S7;S9

### Schendel1993 (tier 2, verification A)
- **Citation:** Schendel MJ, Wood KB, Buttermann GR, Lewis JJ, Ogilvie JW. Experimental measurement of ligament force, facet force, and segment motion in the human lumbar spine. Journal of Biomechanics 1993;26(4-5):427-438. https://doi.org/10.1016/0021-9290(93)90006-Z
- **Region / levels:** Lumbar; L1-L2
- **Specimens:** n = 5; age [verify]
- **Loading:** Combined moment + axial load (e.g. 10 Nm extension + 190 N; 10 Nm torsion + 150 N; 3 Nm LB + 160 N); strain-gauge facet loads; buckle transducers on ALL/PLL
- **Measured (units):** Facet force (N), ALL/PLL force (N), 3D segment motion
- **Where the data sit:** Abstract: facet 205 N in extension, 65 N torsion, 78 N LB, none in flexion; ALL strip up to 130 N; PLL 60 N
- **FE reproducible:** yes: simultaneous facet AND ligament forces - rare dataset
- **Open access:** no - https://doi.org/10.1016/0021-9290(93)90006-Z - **needs GT library access**
- **Feeds suites:** S7;S1

## S8 - Instrumented spine (rods, cages, TDR, adjacent segments)

### Panjabi2007 (tier 1, verification A)
- **Citation:** Panjabi MM. Hybrid multidirectional test method to evaluate spinal adjacent-level effects. Clinical Biomechanics 2007;22(3):257-265. https://doi.org/10.1016/j.clinbiomech.2006.08.006
- **Region / levels:** Lumbar (method); Whole mobile region
- **Specimens:** n = n/a (method); age n/a
- **Loading:** Hybrid: apply pure moment to intact, record total ROM; then load the instrumented construct until total ROM equals intact; compare adjacent-level parameters
- **Measured (units):** Protocol (adjacent-level ROM, IDP, facet loads)
- **Where the data sit:** Text
- **FE reproducible:** yes: defines the SpineBench adjacent-segment load rule (displacement-matched hybrid)
- **Open access:** no - https://doi.org/10.1016/j.clinbiomech.2006.08.006 - **needs GT library access**
- **Feeds suites:** S8

### Rohlmann2001ESJ (tier 1, verification A)
- **Citation:** Rohlmann A, Neller S, Bergmann G, Graichen F, Claes L, Wilke HJ. Effect of an internal fixator and a bone graft on intersegmental spinal motion and intradiscal pressure in the adjacent regions. European Spine Journal 2001;10(4):301-308. https://doi.org/10.1007/s005860100295
- **Region / levels:** Lumbar; Lumbar spines, bisegmental fixator [verify levels]
- **Specimens:** n = 7; age [verify]
- **Loading:** Pure moments F/E, LB, AR [magnitude: verify]; intact, bisegmental fixator, corpectomy + graft + fixator, fixator alone
- **Measured (units):** IDP (MPa) and intersegmental rotation (deg) at all levels
- **Where the data sit:** Figures/tables [verify]
- **FE reproducible:** yes: adjacent-level IDP and ROM with internal fixator
- **Open access:** yes - https://pmc.ncbi.nlm.nih.gov/articles/PMC3611510/
- **Feeds suites:** S8;S4
- **Notes:** Same lab/protocol as Rohlmann 2001 Spine.

### Cripton2000 (tier 2, verification A)
- **Citation:** Cripton PA, Jain GM, Wittenberg RH, Nolte LP. Load-Sharing Characteristics of Stabilized Lumbar Spine Segments. Spine 2000;25(2):170. https://doi.org/10.1097/00007632-200001150-00006
- **Region / levels:** Lumbar; Lumbar FSUs [verify]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Flexibility protocol (pure moments [verify magnitude]); sequential injury + posterior fixator
- **Measured (units):** IDP (MPa); fixator forces/moments (N, Nm) from strain gauges; kinematics
- **Where the data sit:** Figures/tables [verify]
- **FE reproducible:** yes: load sharing disc vs rods - direct check of implant forces
- **Open access:** no - https://doi.org/10.1097/00007632-200001150-00006 - **needs GT library access**
- **Feeds suites:** S8;S4;S7

### Cunningham2003 (tier 2, verification A)
- **Citation:** Cunningham BW, Gordon JD, Dmitriev AE, Hu N, McAfee PC. Biomechanical Evaluation of Total Disc Replacement Arthroplasty: An In Vitro Human Cadaveric Model. Spine 2003;28(Supplement):S110-S117. https://doi.org/10.1097/01.BRS.0000092209.27573.90
- **Region / levels:** Lumbar; L2-sacrum; implant at L4-L5
- **Specimens:** n = 8; age [verify]
- **Loading:** Pure unconstrained moments +/-8 Nm AR, F/E, LB; intact, SB Charite, BAK cages, BAK + pedicle screw/rod
- **Measured (units):** Operative and adjacent ROM and NZ (normalised to intact, %); centre of rotation
- **Where the data sit:** Abstract: AR ROM +44% Charite, -29% BAK, -80% BAK+PS; F/E +3%, -57%, -93%; figures/tables
- **FE reproducible:** yes: TDR, stand-alone cage, cage + rods
- **Open access:** no - https://doi.org/10.1097/01.BRS.0000092209.27573.90 - **needs GT library access**
- **Feeds suites:** S8

### Gornet2011 (tier 2, verification A)
- **Citation:** Gornet MF, Chan FW, Coleman JC, Murrell B, Nockels RP, Taylor BA, et al. Biomechanical Assessment of a PEEK Rod System for Semi-Rigid Fixation of Lumbar Fusion Constructs. Journal of Biomechanical Engineering 2011;133(8):081009. https://doi.org/10.1115/1.4004862
- **Region / levels:** Lumbar; [verify]
- **Specimens:** n = [verify]; age [verify]
- **Loading:** Benchtop rod tests, FE, cadaveric spine-simulator flexibility (F/E, AR, LB) with PEEK vs Ti rods
- **Measured (units):** ROM reduction vs intact (%); construct stiffness; anterior/posterior load share (~75/25% with PEEK)
- **Where the data sit:** Abstract: PEEK >80% F/E, >70% LB, >54% AR ROM reduction; no significant difference vs Ti
- **FE reproducible:** yes: rod material swap (PEEK vs Ti) on the same construct
- **Open access:** no - https://doi.org/10.1115/1.4004862 - **needs GT library access**
- **Feeds suites:** S8
- **Notes:** Industry-authored; use as secondary.

### Lund1998 (tier 2, verification A)
- **Citation:** Lund T, Oxland TR, Jost B, Cripton P, Grassmann S, Etter C, et al. Interbody cage stabilisation in the lumbar spine. The Journal of Bone and Joint Surgery. British volume 1998;80-B(2):351-359. https://doi.org/10.1302/0301-620X.80B2.7693
- **Region / levels:** Lumbar; FSUs [verify levels]
- **Specimens:** n = 6 FSUs per cage type (3 cage designs); age [verify]
- **Loading:** Pure moments F/E, AR, LB [verify magnitude]; intact, posterior cages, + transpedicular instrumentation, + cross-bracing
- **Measured (units):** ROM/NZ (deg) per configuration; bone density effect
- **Where the data sit:** Figures/tables [verify]
- **FE reproducible:** yes: cage +/- rods on an FSU
- **Open access:** unknown - https://doi.org/10.1302/0301-620X.80B2.7693 - **needs GT library access**
- **Feeds suites:** S8;S1
- **Notes:** No OpenAlex OA record; Bone & Joint archive may be free to read.

## S9 - FE model inter-comparison, calibration and V&V methodology

### Dreischarf2014 (tier 1, verification FT)
- **Citation:** Dreischarf M, Zander T, Shirazi-Adl A, Puttlitz CM, Adam CJ, Chen CS, et al. Comparison of eight published static finite element models of the intact lumbar spine: Predictive power of models improves when combined together. Journal of Biomechanics 2014;47(8):1757-1766. https://doi.org/10.1016/j.jbiomech.2014.04.002
- **Region / levels:** Lumbar; L1-L5 (2 models incl. L5-S1)
- **Specimens:** n = 8 FE models vs in vitro (Rohlmann 2001b n=10; Wilson 2006; Brinckmann 1991 five L4-5) and in vivo (Pearcy; Wilke 2001); age n/a
- **Loading:** Part 1: pure moments 7.5 Nm (F/E, LB, AR), L5 fixed; follower compression up to 1000 N. Part 2: combined follower + moment (flexion 1175 N + 7.5 Nm; other cases in Table 3 [verify])
- **Measured (units):** L1-5 ROM (deg), moment-rotation curves, FJF (N) all levels, L4-5 IDP (MPa) vs compression; segmental IVR and IDP under combined loads
- **Where the data sit:** Figures 2-4 (bar charts with median + range); model properties in Tables 1-2; combined loads in Table 3
- **FE reproducible:** yes: THE template benchmark; SpineBench should reproduce its load cases exactly and report against both in vitro range and 8-model range
- **Open access:** yes (accepted manuscript) - https://eprints.qut.edu.au/75896/
- **Feeds suites:** S9;S2;S4;S7
- **Notes:** FE median L1-5 ROM: F/E 34 deg (24-41), LB 35 (25-41), AR 17 (11-22) (from FT). Includes Shirazi-Adl model (co-author).

### Ghezelbash2020rev (tier 1, verification A)
- **Citation:** Ghezelbash F, Schmidt H, Shirazi-Adl A, El-Rich M. Internal load-sharing in the human passive lumbar spine: Review of in vitro and finite element model studies. Journal of Biomechanics 2020;102:109441. https://doi.org/10.1016/j.jbiomech.2019.109441
- **Region / levels:** Lumbar; FSU / motion segment
- **Specimens:** n = n/a (systematic review); age n/a
- **Loading:** Systematic review of in vitro and FE load-sharing studies (resection order, BCs, preload, rate, degeneration, surgery)
- **Measured (units):** Tabulated literature on component contributions
- **Where the data sit:** Tables (study lists) + text
- **FE reproducible:** yes (methodology): shows resection order and force vs displacement control change conclusions -> SpineBench must fix both
- **Open access:** yes (green) - https://pharesst.irsst.qc.ca/revues-litterature/56
- **Feeds suites:** S9;S6a;S1
- **Notes:** USER'S OWN WORK. Use its tables to expand S6a beyond the 50-paper cap.

### Schmidt2007 (tier 1, verification A)
- **Citation:** Schmidt H, Heuer F, Drumm J, Klezl Z, Claes L, Wilke HJ. Application of a calibration method provides more realistic results for a finite element model of a lumbar spinal segment. Clinical Biomechanics 2007;22(4):377-384. https://doi.org/10.1016/j.clinbiomech.2006.11.008
- **Region / levels:** Lumbar; L4-L5
- **Specimens:** n = FE + in vitro calibration set (Heuer 2007); age n/a
- **Loading:** Stepwise calibration on Heuer resection data; validation on bilateral hemifacetectomy, nucleotomy, interspinous defect
- **Measured (units):** ROM (deg) calibrated vs non-calibrated vs in vitro
- **Where the data sit:** Figures
- **FE reproducible:** yes: defines calibrate-on-resection / validate-on-defect split used in SpineBench S6
- **Open access:** no - https://doi.org/10.1016/j.clinbiomech.2006.11.008 - **needs GT library access**
- **Feeds suites:** S9;S6a
- **Notes:** Companion annulus calibration: Schmidt et al. 2006 Clin Biomech 21:337 (not counted).

### Ghezelbash2025 (tier 2, verification A)
- **Citation:** Ghezelbash F, Eskandari AH, Bidhendi AJ, Shirazi-Adl A, Larivière C. Development and validation of a subject-specific integrated finite element musculoskeletal model of human trunk with ergonomic and clinical applications. Biomechanics and Modeling in Mechanobiology 2025;24(5):1591-1603. https://doi.org/10.1007/s10237-025-01983-2
- **Region / levels:** Lumbar / trunk; Whole lumbar + trunk muscles
- **Specimens:** n = Model; EMG comparison over 19 subjects; age n/a
- **Loading:** Coupled FE-MS model; validation at tissue (uni/biaxial), segment and whole-spine levels; nucleotomy and L4-L5 fusion
- **Measured (units):** Moment-rotation vs in vitro; IDP (RMSE 0.12 MPa, R2 0.72); muscle activity vs EMG
- **Where the data sit:** Figures/tables
- **FE reproducible:** yes: the user's own multi-level validation hierarchy - template for SpineBench reporting
- **Open access:** yes (preprint) - https://www.biorxiv.org/content/10.1101/2024.01.06.574467v1
- **Feeds suites:** S9;S2;S4;S8
- **Notes:** USER'S OWN WORK. Title in Crossref is truncated in our check; verify full title.

### JonesWilcox2008 (tier 2, verification A)
- **Citation:** Jones AC, Wilcox RK. Finite element analysis of the spine: Towards a framework of verification, validation and sensitivity analysis. Medical Engineering & Physics 2008;30(10):1287-1304. https://doi.org/10.1016/j.medengphy.2008.09.006
- **Region / levels:** All; Vertebra, disc, short segments
- **Specimens:** n = n/a (review); age n/a
- **Loading:** Review of V&V and sensitivity practice
- **Measured (units):** Recommendations
- **Where the data sit:** Text
- **FE reproducible:** yes (methodology): mesh convergence, sensitivity, validation reporting
- **Open access:** no - https://doi.org/10.1016/j.medengphy.2008.09.006 - **needs GT library access**
- **Feeds suites:** S9
