# REPORT: inputs (kinematics, anthropometry) — not graded, used to drive models

139 tests (108 kinematics, 31 anthropometry), 36 papers, 2,902 points (27% digitised). All use `how_to_use`, checked=true.

## Lumbopelvic rhythm
Tafazzol 2014 (G06, IMU; flexion and return kept apart) · Ghasemi 2021 (Vicon; 9 normal / 9 obese) · Pries 2015 · Dreischarf 2014 · Consmüller 2012 (Epionics; three share subjects, count once) · Laird 2016 (IMU; LBP separate) · Lee 2002 · Pal 2007 (optical) · Zhou 2016 (phase timing only).
Cumulative L/P flexion by 10% interval group: Tafazzol, Ghasemi (normal weight), Narimani, Hajibozorgi. Pries 2015 is incremental by third → own group. Return-from-flexion kept apart from backward extension.

## Thoracic / lumbar / pelvis shares
Hajibozorgi 2016 (G07), Narimani 2018, Fujimori 2014, Willems 1996, Morita 2014 (K03, supine CT patients), Edmondston 2007/2012, Ignasiak 2017, Nairn 2014, Pan 2018 (review, own group).

## Rib motion
Beyer 2014/2016/2017 (CT, shared subjects) · Vergari 2022 (EOS; sleep-apnoea separate).

## Standing spinopelvic alignment
Hasegawa 2016 · Mac-Thiong 2011 (possible overlap with Vialle) · Vialle 2005.

## Anthropometry
Pearsall 1994 (MRI), 1996 (CT per level) · de Leva 1996 · Dumas 2007 (+ corrigendum) · Chambers 2010 (DXA, older) · Erdmann 1997, 2020 · Liu 2023 (model estimates) · Shi 2014 · Weaver 2014 (n=299 analysed).

## Missing
Granata & Sanford 2000 (rhythm), Wilson 1987 (rib motion).

## Open issues
1. Narimani 2018 lp_ratio unit "deg" → should be "ratio".
2. Uppercase group names (Fujimori, Morita, Ignasiak, Pan) → normalise and rebuild groups.
3. Mixed units in two groups: Liu/Pearsall 1996 per-level mass (% BM vs g); Erdmann 1997/2020 (kg vs % BM).
4. Corrected-not-printed values (Erdmann 2020 thorax 11.99, printed 1.99; Dumas minus signs) — printed value kept in record.
5. Printed oddities kept and flagged: Pearsall 1994 regressions, Vialle typos, Hasegawa C2-7, Chambers SDs ".076".
6. DOIs to verify: Pearsall 1994, 1996; de Leva 1996.
7. Spinopelvic alignment and rib-cage geometry need a SCHEMA slot.
