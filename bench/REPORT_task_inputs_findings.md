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

