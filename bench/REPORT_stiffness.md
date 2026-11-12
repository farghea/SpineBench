# REPORT: stiffness (segment_stiffness, trunk_passive_invivo)

46 tests (26 FSU in vitro, 20 in vivo trunk), 46 groups, 960 points (15% digitised at 300 dpi; 72 derived from Brown & McGill fit coefficients). Values script-checked against PDF text; mismatches (SD from SE/CI, dropped minus signs, unit conversions, Tencer T5 circled cells) confirmed on page images.

## FSU in vitro
Gardner-Morse & Stokes 2004 (6x6 at 0/250/500 N, L2-3 & L4-5; SD = SE·√n) · Gardner-Morse & Stokes 2003 (**porcine**, tagged animal) · Janevic 1991 · Edwards 1987 · Panjabi 1976 (thoracic 6x6 from inverted flexibility) · Tencer 1982 · Amin 2016a/b (same 14 specimens) · Berkson 1979 · Costi 2008 (0.001–1 Hz) · Cripton 2000 (4 preload methods) · Yamamoto 2022 · Lopez-Valdes 2011 · Adams & Dolan 1991.
FSU matrices kept per study (origins differ: upper body centre / disc centre / upper inferior endplate).

## In vivo trunk
Passive: Watt 2022 (meta-analysis, separate `__meta_analysis` groups, linked to Voinier, Gombatto, Kosmopoulos, Shojaei 2018) · Voinier 2020 · Brown & McGill 2008 relaxed · Drake & Callaghan 2008 · Beach 2005 · Parkinson 2004 · Ning 2015 (model-derived) · Toosizadeh 2012 · Shojaei 2016 · Kosmopoulos 2012 · Gombatto 2008.
Active (groups start `active`, never pooled with passive): Cholewicki 2000 · Gardner-Morse & Stokes 2001 · Lariviere 2015 · Brown & McGill braced · Shojaei 2018 load-holding.
how_to_simulate: posture, fixed segment, activation (zero for passive), moment reference joint.

## Open
1. Tencer 1982 T4 lower bound .47 > mean .182 (lost minus?) — kept as printed.
2. Watt 2022 pooling weights not reproducible from per-study totals.
3. Shojaei 2018 baseline quasi-passive (no EMG check) — own group, though Watt pooled it.
4. Missing PDFs from Watt's synthesis: **McGill 1994 (Spine 19:696)**, De Carvalho 2011, Gruevski 2019, Tennant 2020, Lee & McGill 2017.
5. DOIs blank (not printed): Edwards, Tencer, Berkson, Cripton, Adams & Dolan, Cholewicki, Gardner-Morse & Stokes 2001, Lopez-Valdes.
6. Parkinson 2004 height SD 0.38 m (likely 0.038) kept as printed.
