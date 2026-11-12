# REPORT: msk_emg_mvc (msk_emg_posture, msk_mvc_coupled)

105 tests, ~1,655 points, 21 papers (33 emg_posture, 72 mvc_coupled); 95 groups, 10 pool >1 study; ~84% of points digitised.
Only normalised EMG kept (%MVC/%MVE or stated reference). Dropped raw: Granata 2001 (mV), Lariviere 2024 (uV), Ng 2003 (mV), Lariviere 2014 Table 2 (uV).

## Studies
Ghezelbash 2018 (U03, 9F/10M: MVE primary + signed coupled moments about S1, 6 dirs x sex; EMG at MVE 14 sites) ·
Ghezelbash 2020 (IRSST; %MVC 7 sites, 14 kg holds, 4 heights x 0/30/60/90 deg left; same 19 subjects) ·
El Ouaaid 2013 (12 M, flex 151.1±37.3 / ext 242.4±64.2 Nm at L5-S1) · Lariviere 2001, 2009, 2014 · McGill 1991 · Ng 2001/2002 (+ chronic LBP) ·
Kumar 2001 · Thelen 1995 · Gravel 1997 · Daggfeldt 2003 · Burkhart 2018 (force at pad, N) · Lavender 1992 · Lariviere 2019 · Granata 2005 ·
Koopman 2019/2020a/2020b (no-exoskeleton only) · van Dieen 2003.

## Pooled groups
MVC L5-S1 semi-seated male flex/ext: Ghezelbash 2018 + El Ouaaid 2013 · MVC L5-S1 upright male ext: Lariviere 2001 + 2009 ·
EMG at MVC IRSST sites: Ghezelbash 2018 + El Ouaaid 2013 · Ng 2001 + 2002 controls (axial rotation) · Koopman 2019/2020a/2020b.

## Shared samples
Ghezelbash 2018 = 2020 (19 subjects) · Lariviere 2009 = 2014 (20 M) · Koopman 2019 = 2020a (11 M). Ng 2001 vs 2002 controls: unknown.

## Caveats for simulation
- Coupled-moment conventions differ (signed means / absolute / % of MVC in plane): never pooled across conventions.
- Moment reference: S1/L5-S1 (IRSST, Lariviere, Ng) vs vertical dynamometer axis (McGill 1991, Kumar 2001).
- EMG normalisation reference differs (max over all MVE dirs; best of 4 MVC strategies; larger rotation peak): normalise model activations the same way.
- Semi-seated (Ghezelbash, El Ouaaid) vs upright standing (Lariviere): not pooled.
- Ghezelbash 2018 electrode levels read from a schematic; El Ouaaid 2013 text gives exact placements.

## Uncertainties
Ghezelbash 2018 bars ±1.5 %MVC (re-digitised within 0.5); Lariviere 2009 ±0.3 %MVE (least-checked; overlapping antagonist panels skipped); El Ouaaid antagonists ±1 %MVC.

## Open
Lavender 1992 n=10 (Methods) vs 19 (Results), 10 used · Ghezelbash 2020 "upright" height assumed umbilicus · Koopman electrode levels not given · Granata 2005 DOI unverified · McGill cw = right rotation inferred.
