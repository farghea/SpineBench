/* SpineBench: outcome benchmarks. Plain JS, no build step.
   Data: data/outcomes.json (index) and data/outcomes/<id>.json (one card), written by site/build_index.py.
   Schematics: assets/schematics/index.json ("<card>" or "<card>/<view>" -> SVG file in assets/schematics/). */
(function () {
  'use strict';

  var S = { index: null, cache: {}, charts: [], off: {}, offP: {}, bw: false, hidePooled: false, card: null, viewId: null, lastWide: null, schem: {} };
  var main = document.getElementById('main');
  var DOMAINS = [
    { id: 'msk', label: 'Musculoskeletal', blurb: 'In vivo: postures, loads and muscle activity.' },
    { id: 'fe', label: 'Finite element', blurb: 'In vitro: segments and columns under moments and forces.' },
    { id: 'tissue', label: 'Tissue', blurb: 'Constitutive models: quasi-static stress–strain per test mode.' }
  ];
  var COMING = ['Kinematics', 'Anthropometry', 'Muscle geometry', 'In vivo trunk stiffness'];
  var WIDE_PX = 760; // two-column chart + schematic from here up (same as the CSS breakpoint)
  var G = 9.81;

  // ---------- helpers ----------
  function $(sel, el) { return (el || document).querySelector(sel); }
  function $$(sel, el) { return Array.prototype.slice.call((el || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function isNum(v) { return typeof v === 'number' && isFinite(v); }
  function toNum(v) {
    if (isNum(v)) return v;
    if (typeof v === 'string' && /^\s*-?\d+(\.\d+)?([eE][-+]?\d+)?\s*$/.test(v)) return parseFloat(v);
    return null;
  }
  function fmt(v) { return !isNum(v) ? '' : Math.abs(v) >= 1e4 ? String(Math.round(v)) : String(+v.toPrecision(5)); }
  function decs(v) { var a = Math.abs(v); return a >= 100 ? 0 : a >= 10 ? 1 : a >= 0.1 ? 2 : 3; }
  function fmtC(v, ref) { return isNum(v) ? v.toFixed(decs(isNum(ref) ? ref : v)) : ''; }
  function human(s) { return String(s == null ? '' : s).replace(/_/g, ' '); }
  function lowerFirst(s) { s = String(s); return s.length > 1 && /[a-z]/.test(s.charAt(1)) ? s.charAt(0).toLowerCase() + s.slice(1) : s; }
  function upperFirst(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function enc(s) { return encodeURIComponent(s); }
  function cssVar(n) { return getComputedStyle(document.documentElement).getPropertyValue(n).trim(); }
  function alpha(color, a) {
    var m = /^#([0-9a-f]{6})$/i.exec(color);
    if (!m) return color;
    var v = parseInt(m[1], 16);
    return 'rgba(' + (v >> 16 & 255) + ',' + (v >> 8 & 255) + ',' + (v & 255) + ',' + a + ')';
  }
  function uniq(a) { var seen = {}, out = []; a.forEach(function (x) { var k = String(x); if (!seen[k]) { seen[k] = 1; out.push(x); } }); return out; }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function yearsText(y) { return !y || !y.length ? '' : y[0] === y[1] ? String(y[0]) : y[0] + '–' + y[1]; }
  function setTitle(t) { document.title = t ? t + ' · SpineBench' : 'SpineBench · Benchmark for spine models and AI agents'; }
  function anyOn(o) { return Object.keys(o).some(function (k) { return o[k]; }); }
  function isWide() { return window.innerWidth >= WIDE_PX; }
  function fetchJSON(url) {
    if (S.cache[url]) return Promise.resolve(S.cache[url]);
    return fetch(url, { cache: 'no-cache' }).then(function (r) {
      if (!r.ok) throw new Error(r.status + ' ' + r.statusText + ' for ' + url);
      return r.json();
    }).then(function (j) { S.cache[url] = j; return j; });
  }
  function exTag(on) { return on ? ' <span class="tag ex" title="Placeholder card for development, not curated data">EXAMPLE</span>' : ''; }
  function doiLink(doi, isEx) {
    var d = String(doi || '').trim();
    if (!d) return '<span class="muted">–</span>';
    var url = /^https?:\/\//i.test(d) ? d : /^10\.\d{4,9}\//.test(d) ? 'https://doi.org/' + d : null;
    if (!url || isEx) return '<span class="mono">' + esc(d) + '</span>';
    return '<a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(d) + '</a>';
  }
  var ICON_DL = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4v11m0 0l-4-4m4 4l4-4M5 19h14"/></svg>';
  var ICON_COPY = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/></svg>';
  function dlBtn(href, label, primary) {
    return '<a class="btn' + (primary ? ' primary' : '') + '" href="' + esc(href) + '" download>' + ICON_DL + esc(label) + '</a>';
  }
  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text).catch(function () { return copyLegacy(text); });
    }
    return copyLegacy(text);
  }
  function copyLegacy(text) {
    return new Promise(function (res, rej) {
      var ta = document.createElement('textarea');
      ta.value = text; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { /* ignore */ }
      document.body.removeChild(ta);
      if (ok) res(); else rej(new Error('copy failed'));
    });
  }

  // ---------- schematics ----------
  function schemSrc(x) {
    var src = x && typeof x === 'object' ? (x.file || x.svg || x.src) : x;
    if (!src || typeof src !== 'string') return null;
    return { src: /^(https?:|\/|assets\/)/.test(src) ? src : 'assets/schematics/' + src, cap: x && typeof x === 'object' ? (x.caption || x.title || '') : '' };
  }
  function schematicFor(cardId, viewId) {
    var m = S.schem || {};
    var v = schemSrc(viewId && m[cardId + '/' + viewId]), c = schemSrc(m[cardId]);
    if (v && c && c.src !== v.src) v.fallback = c.src;
    return v || c;
  }
  // hide a schematic whose file is missing (other people may still be drawing it)
  function wireSchemImgs(root) {
    $$('img[data-schem]', root).forEach(function (img) {
      var gone = function () {
        var fb = img.getAttribute('data-fallback');
        if (fb) { img.removeAttribute('data-fallback'); img.src = fb; return; }
        var box = img.closest('[data-schem-box]');
        if (box) { var grid = box.closest('.viz-grid'); box.parentNode.removeChild(box); if (grid) grid.classList.remove('has-side'); }
        else img.parentNode.removeChild(img);
      };
      if (img.complete && !img.naturalWidth) gone(); else img.addEventListener('error', gone);
    });
  }

  // ---------- card model ----------
  function prep(card) {
    if (card._prepped) return card;
    card._prepped = true;
    ['levels', 'simulate', 'inputs', 'outputs', 'views', 'notes', 'shared', 'studies', 'tasks'].forEach(function (k) { if (!Array.isArray(card[k])) card[k] = []; });
    if (!card.subjects || typeof card.subjects !== 'object') card.subjects = {};
    if (!card.patients || typeof card.patients !== 'object' || Array.isArray(card.patients)) card.patients = {};
    card._pkeys = Object.keys(card.patients);
    card._study = {}; card._color = {}; card._input = {}; card._output = {}; card._task = {};
    var gc = (S.index && S.index.study_colors) || {}; // one colour per study across all benchmarks (site/build_index.py)
    card.studies.forEach(function (s, i) { card._study[s.key] = s; card._color[s.key] = gc[s.key] || i % 12 + 1; });
    card.inputs.forEach(function (x) { if (x && x.key) card._input[x.key] = x; });
    card.outputs.forEach(function (x) { if (x && x.key) card._output[x.key] = x; });
    card.tasks.forEach(function (t) {
      t.refs = Array.isArray(t.refs) ? t.refs : []; t.inputs = t.inputs || {}; card._task[t.id] = t;
      t.refs.forEach(function (r) { r._p = patientOf(card, r); });
    });
    // views as given, plus one "Other" view for tasks that no view lists
    var listed = {};
    card.views = card.views.filter(function (v) { return v && v.id; });
    card.views.forEach(function (v) { // a task may sit in several views (e.g. the 0 N point of a follower-load curve)
      var seen = {};
      v.task_ids = (v.task_ids || []).filter(function (id) { return card._task[id] && !seen[id] && (seen[id] = listed[id] = 1); });
    });
    card.tasks.forEach(function (t) {
      if (listed[t.id]) return;
      listed[t.id] = 1;
      var v = t.view && card.views.filter(function (x) { return x.id === t.view; })[0];
      if (v) { v.task_ids.push(t.id); return; }
      var other = card.views.filter(function (x) { return x.id === '_other'; })[0];
      if (!other) { other = { id: '_other', title: 'Other tasks', task_ids: [], x: 'task' }; card.views.push(other); }
      other.task_ids.push(t.id);
    });
    card.views = card.views.filter(function (v) { return v.task_ids.length; });
    card.views.forEach(function (v) { v._tview = v.task_ids.length && card._task[v.task_ids[0]].view; });
    // cards with a patient table: an activity overview comes first
    if (card._pkeys.length && card.views.length) card.views.unshift({ id: '_activity', title: 'By activity', task_ids: card.tasks.map(function (t) { return t.id; }), overview: true });
    return card;
  }
  function patientOf(card, r) {
    if (r.patient && card.patients[r.patient]) return r.patient;
    if (!card._pkeys.length) return null;
    var txt = String(r.note || '');
    for (var i = 0; i < card._pkeys.length; i++) {
      var k = card._pkeys[i];
      if (new RegExp('(^|[^A-Za-z0-9])' + k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '([^A-Za-z0-9]|$)').test(txt)) return k;
    }
    return null;
  }
  function studyLabel(card, key, withN) {
    var s = card._study[key] || { short: key };
    var name = s.short || key;
    if (s.year && String(name).indexOf(String(s.year)) < 0) name += ' ' + s.year;
    return name + (withN && s.n != null ? ' (n=' + s.n + ')' : '');
  }
  function noPool(card, key) { var s = card._study[key]; return !!(s && s.pool === false); }
  // secondary source (value read from a review): same figure, hollow markers / dashed line, "(secondary)" in the legend
  function isSec(card, key) { var s = card._study[key]; return !!(s && s.secondary); }
  function legendName(card, key) { return studyLabel(card, key, false) + (isSec(card, key) ? ' (secondary)' : ''); }
  function openMark(card, key) { return noPool(card, key) || isSec(card, key); }
  function swatch(card, key) { return 'var(--s' + (card._color[key] || 1) + ')'; }
  function colorOf(card, key) { return cssVar('--s' + (card._color[key] || 1)); }
  function unitTxt(u) { return !u || /^[-–(]?\s*[-–]?\s*\)?$/.test(u) ? '' : u === 'deg' ? '°' : u; }
  function withUnit(v, u) { u = unitTxt(u); return v + (u ? (u === '°' || u === '%' ? u : ' ' + u) : ''); }
  // unit of a task's values as shown (forces switch to % body weight when asked)
  function bwOn(card, outKey) { return S.bw && canBW(card, outKey); }
  function canBW(card, outKey) { var o = card._output[outKey]; return !!(o && o.unit === 'N' && card._pkeys.length); }
  function unitOf(card, outKey) { if (bwOn(card, outKey)) return '% BW'; var o = card._output[outKey]; return o ? unitTxt(o.unit) : ''; }
  function outLabel(card, outKey) { var o = card._output[outKey]; return (o && o.label) || upperFirst(human(outKey)) || 'Value'; }
  function axisTitle(card, outKey) { var u = unitOf(card, outKey); return outLabel(card, outKey) + (u ? ' (' + u + ')' : ''); }
  function inputLabel(card, key) { var d = card._input[key]; return (d && d.label) || upperFirst(human(key)); }
  var GENERIC = /^(yes|no|true|false|none|intact|removed|left|right|both|pooled|l\/r|l\/r mean|m|f)$/i;
  // one input as a short phrase: "7.5 Nm pure moment" style is too clever; keep "label value" for numbers, value alone for words
  function phrase(card, k, v) {
    if (v == null || v === '') return '';
    var d = card._input[k] || {}, lab = lowerFirst(d.label || human(k));
    if (typeof v === 'boolean') return v ? lab : 'no ' + lab;
    if (typeof v === 'object') return lab + ' ' + JSON.stringify(v);
    if (isNum(v)) return lab + ' ' + withUnit(fmt(v), d.unit);
    var s = human(v);
    if (/^-?\d/.test(s) && unitTxt(d.unit) && s.indexOf(unitTxt(d.unit)) < 0) return lab + ' ' + withUnit(s, d.unit);
    if (GENERIC.test(s) || s.length <= 2) return lab + ' ' + s;
    return s;
  }
  function valueText(card, k, v) { // value only, for legends
    var d = card._input[k] || {};
    if (isNum(v)) return withUnit(fmt(v), d.unit);
    return phrase(card, k, v);
  }

  // refs of a task as shown: patients switched off are dropped; forces become % body weight when asked
  function bwOf(card, r) {
    var w = r._p ? toNum((card.patients[r._p] || {}).weight_kg) : null;
    if (w == null) w = toNum((card.subjects[r.study] || {}).weight_kg);
    return w != null && w > 0 ? w * G : null;
  }
  function refsOf(card, t) {
    var rs = t.refs.filter(function (r) { return !(r._p && S.offP[r._p]); });
    if (!bwOn(card, t.output)) return rs;
    return rs.map(function (r) {
      var bw = bwOf(card, r);
      if (!bw) return null;
      var c = {};
      Object.keys(r).forEach(function (k) { c[k] = r[k]; });
      ['mean', 'sd', 'median', 'min', 'max'].forEach(function (k) { if (isNum(r[k])) c[k] = +(r[k] / bw * 100).toPrecision(3); });
      c._derived = true;
      return c;
    }).filter(Boolean);
  }
  // a ref as a plotted value: y, error extent, and how to describe it
  function refValue(r) {
    var m = toNum(r.mean), med = toNum(r.median), sd = toNum(r.sd), mn = toNum(r.min), mx = toNum(r.max);
    var isMed = r.stat === 'median' || (m == null && med != null);
    var y = isMed ? (med != null ? med : m) : (m != null ? m : med);
    if (y == null) return null;
    var v = { y: y, sd: null, lo: null, hi: null, kind: isMed ? 'median' : r.stat === 'value' ? 'value' : 'mean', n: toNum(r.n), ref: r };
    if (sd != null && !isMed) { v.sd = sd; v.lo = y - sd; v.hi = y + sd; v.err = 'sd'; }
    else if (mn != null && mx != null) { v.lo = mn; v.hi = mx; v.err = 'range'; }
    return v;
  }
  function describe(v, unit) {
    if (!v) return '';
    var u = unit ? ' ' + unit : '';
    if (v.pooled) return fmtC(v.y) + (v.sd != null ? ' ± ' + fmtC(v.sd, v.y) : '') + u;
    var s = (v.multi ? 'mean of ' + v.multi + ': ' : v.kind === 'median' ? 'median ' : '') + fmt(v.y);
    if (v.err === 'sd') s += ' ± ' + fmt(v.sd);
    s += u;
    if (v.err === 'range') s += ' [' + fmt(v.lo) + '–' + fmt(v.hi) + ']';
    return s;
  }
  function cellText(v) { // compact table text: mean ± SD or median [min–max]
    if (!v) return '';
    var s = (v.kind === 'median' ? 'med ' : '') + fmt(v.y);
    if (v.err === 'sd') s += ' ± ' + fmt(v.sd);
    if (v.err === 'range') s += ' [' + fmt(v.lo) + '–' + fmt(v.hi) + ']';
    return s;
  }
  // pooled value (same rule as tools/pool_outcomes.py), recomputed when studies/patients are switched off or units change
  function pooledFor(card, t) {
    if (!anyOn(S.off) && !anyOn(S.offP) && !bwOn(card, t.output)) return t.pooled || null;
    var shared = card.shared.filter(Array.isArray);
    var by = {}, order = [];
    refsOf(card, t).forEach(function (r) {
      if (S.off[r.study] || noPool(card, r.study) || r.exclude_from_pool || !(r.stat === 'mean' || r.stat === 'value') || !isNum(r.mean)) return;
      if (!by[r.study]) { by[r.study] = []; order.push(r.study); }
      by[r.study].push(r);
    });
    var refs = order.map(function (st) { // several refs of one study -> one study-level ref
      var rs = by[st];
      if (rs.length === 1) return rs[0];
      var mu = rs.reduce(function (a, r) { return a + r.mean; }, 0) / rs.length;
      var indiv = rs.every(function (r) { return (r.n == null || r.n === 1) && !isNum(r.sd); });
      if (indiv) {
        var ss0 = rs.reduce(function (a, r) { return a + (r.mean - mu) * (r.mean - mu); }, 0);
        return { study: st, mean: mu, sd: Math.sqrt(ss0 / (rs.length - 1)), n: rs.length };
      }
      var sds = rs.filter(function (r) { return isNum(r.sd); }).map(function (r) { return r.sd; });
      return { study: st, mean: mu, sd: sds.length ? sds.reduce(function (a, b) { return a + b; }, 0) / sds.length : null,
        n: Math.max.apply(null, rs.map(function (r) { return r.n || 1; })) };
    });
    var seen = {}, use = [];
    refs.forEach(function (r) {
      var s = r.study;
      if (seen[s]) return;
      var overlap = shared.some(function (p) { return p.indexOf(s) >= 0 && p.some(function (o) { return o !== s && seen[o]; }); });
      if (overlap) return;
      seen[s] = 1; use.push(r);
    });
    if (use.length < 2) return null;
    var N = 0, sm = 0;
    use.forEach(function (r) { var n = r.n || 1; N += n; sm += n * r.mean; });
    var M = sm / N, ss = 0;
    use.forEach(function (r) { var n = r.n || 1; if (isNum(r.sd)) ss += (n - 1) * r.sd * r.sd; ss += n * (r.mean - M) * (r.mean - M); });
    return { mean: M, sd: N > 1 ? Math.sqrt(ss / (N - 1)) : null, N: N, k: use.length, studies: use.map(function (r) { return r.study; }) };
  }
  function pooledValue(p) {
    if (!p || !isNum(p.mean)) return null;
    var sd = isNum(p.sd) ? p.sd : null;
    return { y: p.mean, sd: sd, lo: sd != null ? p.mean - sd : null, hi: sd != null ? p.mean + sd : null, pooled: true, N: p.N, k: p.k };
  }
  // one plotted value per study and task; several refs (e.g. individuals) -> their mean with [min–max]
  function firstRef(card, t, study) {
    var vs = refsOf(card, t).filter(function (r) { return r.study === study; }).map(refValue).filter(Boolean);
    if (vs.length <= 1) return vs[0] || null;
    var ys = vs.map(function (v) { return v.y; });
    var y = ys.reduce(function (a, b) { return a + b; }, 0) / ys.length;
    return { y: y, sd: null, lo: Math.min.apply(null, ys), hi: Math.max.apply(null, ys), err: 'range', kind: 'mean', multi: vs.length, ref: vs[0].ref };
  }
  function viewStudies(card, tasks) {
    var inView = {};
    tasks.forEach(function (t) { t.refs.forEach(function (r) { inView[r.study] = 1; }); });
    var keys = card.studies.map(function (s) { return s.key; }).filter(function (k) { return inView[k]; });
    Object.keys(inView).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); });
    return keys;
  }
  // inputs that vary across the given tasks, and the ones that are the same for all
  function splitInputs(card, tasks, skip) {
    var keys = [];
    card.inputs.forEach(function (d) { if (d && d.key) keys.push(d.key); });
    tasks.forEach(function (t) { Object.keys(t.inputs).forEach(function (k) { if (keys.indexOf(k) < 0) keys.push(k); }); });
    keys = keys.filter(function (k) { return (skip || []).indexOf(k) < 0 && tasks.some(function (t) { return t.inputs[k] != null && t.inputs[k] !== ''; }); });
    var vary = [], same = [];
    keys.forEach(function (k) {
      var vals = uniq(tasks.map(function (t) { return JSON.stringify(t.inputs[k] == null ? null : t.inputs[k]); }));
      (vals.length > 1 ? vary : same).push(k);
    });
    return { vary: vary, same: same };
  }

  // ---------- Chart.js ----------
  // one look for every chart: line and marker sizes, whiskers, axes
  var STY = { line: 2, linePooled: 2.5, point: 3.5, pointPooled: 5, hover: 6, whisker: 1.1, whiskerPooled: 1.5, cap: 4 };
  var whiskers = {
    id: 'sbWhiskers',
    afterDatasetsDraw: function (chart, args, pluginOpts) {
      var ctx = chart.ctx, horiz = !!(pluginOpts && pluginOpts.horiz), area = chart.chartArea;
      var vs = horiz ? chart.scales.x : chart.scales.y, ink = cssVar('--ink');
      ctx.save();
      ctx.beginPath(); ctx.rect(area.left - 8, area.top - 2, area.right - area.left + 16, area.bottom - area.top + 4); ctx.clip();
      chart.data.datasets.forEach(function (ds, i) {
        if (!ds._vals || ds._noWhisk || !chart.isDatasetVisible(i)) return;
        var meta = chart.getDatasetMeta(i);
        ctx.strokeStyle = ds._pooled ? cssVar('--pooled') : ds._color ? alpha(ds._color, ds._whiskA || 0.6) : alpha(ink, 0.6);
        ctx.lineWidth = ds._pooled ? STY.whiskerPooled : (ds._whiskW || STY.whisker);
        ctx.setLineDash([]);
        meta.data.forEach(function (el, j) {
          var v = ds._vals[j];
          if (!v || el.skip) return;
          if (v.xlo != null && v.xhi != null) { // transposed point (view "transpose"): the SD of the measured x is a horizontal bar
            var xa = chart.scales.x.getPixelForValue(v.xlo), xb = chart.scales.x.getPixelForValue(v.xhi), xc = ds._cap || STY.cap;
            ctx.beginPath();
            ctx.moveTo(xa, el.y); ctx.lineTo(xb, el.y);
            ctx.moveTo(xa, el.y - xc); ctx.lineTo(xa, el.y + xc);
            ctx.moveTo(xb, el.y - xc); ctx.lineTo(xb, el.y + xc);
            ctx.stroke();
          }
          if (v.lo == null || v.hi == null) return;
          var a = vs.getPixelForValue(v.lo), b = vs.getPixelForValue(v.hi);
          var size = horiz ? el.height : el.width;
          var cap = ds._cap || (size ? Math.max(2.5, Math.min(STY.cap + 1, size / 4)) : STY.cap);
          ctx.beginPath();
          if (horiz) {
            ctx.moveTo(a, el.y); ctx.lineTo(b, el.y);
            ctx.moveTo(a, el.y - cap); ctx.lineTo(a, el.y + cap);
            ctx.moveTo(b, el.y - cap); ctx.lineTo(b, el.y + cap);
          } else {
            ctx.moveTo(el.x, a); ctx.lineTo(el.x, b);
            ctx.moveTo(el.x - cap, a); ctx.lineTo(el.x + cap, a);
            ctx.moveTo(el.x - cap, b); ctx.lineTo(el.x + cap, b);
          }
          ctx.stroke();
        });
      });
      ctx.restore();
    }
  };
  function chartBase() {
    Chart.defaults.font.family = '"IBM Plex Sans", system-ui, sans-serif';
    Chart.defaults.font.size = 12;
    Chart.defaults.color = cssVar('--muted');
    Chart.defaults.borderColor = cssVar('--grid');
    return {
      responsive: true, maintainAspectRatio: false, animation: false, // charts are redrawn on every toggle; animating from a not-yet-laid-out size leaves stale points
      resizeDelay: 0,
      layout: { padding: { top: 6, right: 8 } },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar('--surface'), titleColor: cssVar('--ink'), bodyColor: cssVar('--ink-2'),
          borderColor: cssVar('--line-2'), borderWidth: 1, padding: 10, boxPadding: 4, usePointStyle: true,
          titleFont: { weight: '600' }
        }
      }
    };
  }
  // value axis and category axis, same look in every chart
  function valAxis(title, extra) {
    var ax = { title: { display: true, text: title, color: cssVar('--ink-2'), font: { size: 12, weight: '500' } },
      grid: { color: cssVar('--grid') }, border: { display: false }, ticks: { color: cssVar('--muted'), padding: 6 } };
    Object.keys(extra || {}).forEach(function (k) { ax[k] = extra[k]; });
    return ax;
  }
  function chartMsg(box, msg) { box.style.height = ''; box.innerHTML = '<div class="chart-msg">' + esc(msg) + '</div>'; }
  function canvasIn(box, label) {
    box.innerHTML = '<canvas role="img" aria-label="' + esc(label) + '"></canvas>';
    return box.querySelector('canvas');
  }
  function wrapLabel(s, width) {
    var words = String(s).split(' '), lines = [], cur = '';
    words.forEach(function (w) {
      if (cur && (cur + ' ' + w).length > width) { lines.push(cur); cur = w; } else cur = cur ? cur + ' ' + w : w;
    });
    if (cur) lines.push(cur);
    return lines.length > 1 ? lines : s;
  }
  // chart labels: drop " · "-separated parts that every task of the view shares (e.g. "7.5 Nm")
  function shortLabels(tasks) {
    var parts = tasks.map(function (t) { return String(t.label || t.id).split(' · '); });
    if (tasks.length < 2) return parts.map(function (p) { return p.join(' · '); });
    var common = parts[0].filter(function (x) { return parts.every(function (p) { return p.indexOf(x) >= 0; }); });
    return parts.map(function (p) {
      var keep = p.filter(function (x) { return common.indexOf(x) < 0; });
      return (keep.length ? keep : p).join(' · ');
    });
  }
  function destroyCharts() { S.charts.forEach(function (c) { try { c.destroy(); } catch (e) { /* ignore */ } }); S.charts = []; }
  function tipLabel(c, v, unit) { return ' ' + c.dataset.label + ': ' + describe(v, unit) + (v.pooled ? ' (pooled, ' + v.k + ' studies, n=' + v.N + ')' : ''); }

  // bars: x = task labels, one dataset per study, pooled as an outlined neutral bar
  function studySets(card, tasks) {
    var studies = viewStudies(card, tasks).filter(function (k) { return !S.off[k]; });
    var sets = studies.map(function (k) {
      return { label: legendName(card, k) + (noPool(card, k) ? ' (not pooled)' : ''), key: k, color: colorOf(card, k), hollow: openMark(card, k),
        vals: tasks.map(function (t) { return firstRef(card, t, k); }) };
    });
    var pooledVals = tasks.map(function (t) { return pooledValue(pooledFor(card, t)); });
    if (!S.hidePooled && pooledVals.some(Boolean)) sets.push({ label: 'Pooled', key: '_pooled', pooled: true, vals: pooledVals });
    return sets.filter(function (d) { return d.vals.some(Boolean); });
  }
  function drawBars(box, card, tasks, unit, yTitle) {
    if (typeof Chart === 'undefined') { chartMsg(box, 'The chart library did not load. The table below has every value.'); return null; }
    var sets = studySets(card, tasks);
    if (!sets.length) { chartMsg(box, 'Nothing to show. Switch a study or patient on above.'); return null; }
    if (tasks.length > 10 || tasks.length * sets.length > 40) return drawDots(box, card, tasks, unit, yTitle, sets);
    var wide = box.clientWidth >= 560;
    var horiz = !wide || tasks.length > 7;
    var maxPer = Math.max.apply(null, tasks.map(function (t, i) { return sets.filter(function (d) { return d.vals[i]; }).length; }).concat([1]));
    if (horiz) box.style.height = Math.max(220, tasks.length * (maxPer * 11 + 22) + 64) + 'px';
    else box.style.height = '';
    var all = [];
    sets.forEach(function (d) { d.vals.forEach(function (v) { if (v) { all.push(v.y); if (v.lo != null) all.push(v.lo); if (v.hi != null) all.push(v.hi); } }); });
    var hi = Math.max.apply(null, all), lo = Math.min.apply(null, all);
    var opts = chartBase(), ink2 = cssVar('--ink-2'), grid = cssVar('--grid');
    opts.indexAxis = horiz ? 'y' : 'x';
    opts.plugins.sbWhiskers = { horiz: horiz };
    opts.interaction = { mode: 'index', axis: horiz ? 'y' : 'x', intersect: false };
    var valueAxis = valAxis(yTitle, { beginAtZero: true, suggestedMax: hi > 0 ? hi * 1.04 : 0, suggestedMin: lo < 0 ? lo * 1.04 : 0 });
    var catAxis = { grid: { display: false }, ticks: { color: ink2, autoSkip: false, maxRotation: 0 } };
    opts.scales = horiz ? { y: catAxis, x: valueAxis } : { x: catAxis, y: valueAxis };
    opts.plugins.tooltip.filter = function (item) { return item.dataset._vals[item.dataIndex] != null; };
    opts.plugins.tooltip.callbacks = {
      title: function (items) { return items.length ? tasks[items[0].dataIndex].label : ''; },
      label: function (c) { var v = c.dataset._vals[c.dataIndex]; return v ? tipLabel(c, v, unit) : null; }
    };
    var pooledInk = cssVar('--pooled');
    var labels = shortLabels(tasks).map(function (l) { return horiz ? wrapLabel(l, wide ? 30 : 16) : wrapLabel(l, 14); });
    var chart = new Chart(canvasIn(box, yTitle + ' per task'), {
      type: 'bar',
      data: { labels: labels, datasets: sets.map(function (d) {
        return { label: d.label, _vals: d.vals, _key: d.key, _pooled: !!d.pooled,
          data: d.vals.map(function (v) { return v ? v.y : null; }),
          backgroundColor: d.pooled ? alpha(pooledInk, 0.12) : d.hollow ? alpha(d.color, 0.14) : d.color,
          borderColor: d.pooled ? pooledInk : d.color, borderWidth: d.pooled || d.hollow ? 1.5 : 0,
          borderRadius: 3, borderSkipped: 'start', skipNull: true, maxBarThickness: 36,
          categoryPercentage: 0.8, barPercentage: 0.9, pointStyle: 'rectRounded' };
      }) },
      options: opts, plugins: [whiskers]
    });
    S.charts.push(chart);
    return { kind: 'bars', sets: sets };
  }

  // dot plot for big views: one row per task, one dot per study (± whisker), pooled as a neutral diamond
  function drawDots(box, card, tasks, unit, xTitle, sets) {
    var wide = box.clientWidth >= 560, surface = cssVar('--surface'), ink2 = cssVar('--ink-2'), grid = cssVar('--grid');
    var labels = shortLabels(tasks).map(function (l) { return wrapLabel(l, wide ? 34 : 18); });
    var present = tasks.map(function (t, i) { return sets.filter(function (d) { return d.vals[i]; }); });
    var offs = tasks.map(function (t, i) { // spread the dots of one row vertically so they do not hide each other
      var o = {}, n = present[i].length, span = Math.min(0.6, 0.14 * (n - 1));
      present[i].forEach(function (d, j) { o[d.key] = n > 1 ? -span / 2 + span * j / (n - 1) : 0; });
      return o;
    });
    var rowH = function (i) { var l = Array.isArray(labels[i]) ? labels[i].length : 1; return Math.max(26, present[i].length * 7 + 12, l * 15 + 8); };
    var h = 0; tasks.forEach(function (t, i) { h += rowH(i); });
    box.style.height = Math.max(240, h + 70) + 'px';
    var all = [];
    sets.forEach(function (d) { d.vals.forEach(function (v) { if (v) { all.push(v.y); if (v.lo != null) all.push(v.lo); if (v.hi != null) all.push(v.hi); } }); });
    var lo = Math.min.apply(null, all), hi = Math.max.apply(null, all);
    var opts = chartBase();
    opts.animation = false; // many points; draw at once
    opts.plugins.sbWhiskers = { horiz: true };
    opts.interaction = { mode: 'nearest', intersect: false, axis: 'xy' };
    opts.scales = {
      x: valAxis(xTitle, { beginAtZero: lo >= 0 }),
      y: { type: 'linear', reverse: true, min: -0.5, max: tasks.length - 0.5, grid: { color: grid, drawTicks: false }, border: { display: false },
        afterBuildTicks: function (ax) { ax.ticks = tasks.map(function (t, i) { return { value: i }; }); },
        ticks: { color: ink2, autoSkip: false, padding: 8, callback: function (v) { return labels[v] != null ? labels[v] : ''; } } }
    };
    if (hi > lo && lo >= 0) opts.scales.x.suggestedMax = hi * 1.03;
    opts.plugins.tooltip.callbacks = {
      title: function (items) { return items.length ? tasks[items[0].raw.i].label : ''; },
      label: function (c) { return tipLabel(c, c.raw.v, unit); }
    };
    var chart = new Chart(canvasIn(box, xTitle + ' per task'), {
      type: 'scatter',
      data: { datasets: sets.map(function (d) {
        var pts = [], vals = [];
        d.vals.forEach(function (v, i) { if (v) { pts.push({ x: v.y, y: i + offs[i][d.key], i: i, v: v }); vals.push(v); } });
        var col = d.pooled ? cssVar('--pooled') : d.color;
        return { label: d.label, _key: d.key, _pooled: !!d.pooled, _vals: vals, data: pts, _color: d.pooled ? null : col,
          pointStyle: d.pooled ? 'rectRot' : 'circle', pointRadius: d.pooled ? STY.pointPooled : STY.point + 0.5, pointHoverRadius: STY.hover,
          backgroundColor: d.pooled || d.hollow ? surface : col, borderColor: d.pooled || d.hollow ? col : surface,
          pointBorderWidth: d.pooled || d.hollow ? 2 : 1.5 };
      }) },
      options: opts, plugins: [whiskers]
    });
    S.charts.push(chart);
    return { kind: 'dots', sets: sets };
  }

  // curves: x = a numeric input; one line per study and series (other varying inputs)
  var DASHES = [[], [6, 4], [2, 3], [10, 3, 2, 3], [1, 2], [12, 3, 3, 3, 3, 3], [16, 5]];
  var MARKS = ['circle', 'triangle', 'rect', 'star', 'crossRot', 'rectRounded', 'cross'];
  var BASELINE = /^(none|neutral|neutral \(upright\)|unloaded|-|–)?$/i; // a 0-load point shared by every direction
  // value of an input of a task; "level" etc. may sit on the task itself
  function sv(t, k) { return t.inputs[k] != null ? t.inputs[k] : t[k]; }
  // numeric x of a task: a number, or a string that starts with one ("86 N at upper body centre")
  function xNum(v) {
    var n = toNum(v);
    if (n != null) return n;
    var m = typeof v === 'string' && /^\s*(-?\d+(?:\.\d+)?)\s*(n|nm|n·m|mm|deg|°|%)?(?=[\s,;]|$)/i.exec(v);
    return m ? parseFloat(m[1]) : null;
  }
  function xAxisTitle(card, xKey, given) {
    if (given) return given;
    var xd = card._input[xKey] || {}, lab = xd.label || upperFirst(human(xKey)), u = unitTxt(xd.unit);
    if (!u && /strain|^E\d\d$/i.test(xKey + ' ' + lab)) u = 'mm/mm';
    return lab + (u ? ' (' + u + ')' : '');
  }
  function shortVal(s) { var c = String(s).split(/,|\s\(/)[0].trim(); return c || String(s); }
  function seriesNamer(card, tasks, skeys) {
    var vt = function (t, k) { var x = sv(t, k); return isNum(x) ? phrase(card, k, x) : valueText(card, k, x); }; // numbers keep their name ("axial preload 400 N")
    var full = function (t) { return skeys.map(function (k) { return vt(t, k); }).join(' · '); };
    // drop keys whose short value is the same in every series (e.g. "uniaxial tension" twice)
    var kk = skeys.filter(function (k) { return uniq(tasks.map(function (t) { return shortVal(vt(t, k)); })).length > 1; });
    if (!kk.length) kk = skeys;
    var short = function (t) { return kk.map(function (k) { return shortVal(vt(t, k)); }).join(' · '); };
    // short names only if they still tell the series apart
    var ok = uniq(tasks.map(full)).length === uniq(tasks.map(short)).length;
    return ok ? short : full;
  }
  // names of resection steps: x value -> "intact", "supraspinous lig.", ... (null if one x has two names)
  function stepNames(tasks, xKey) {
    if (!/step/i.test(xKey)) return null;
    var nameKey = Object.keys(tasks[0].inputs).filter(function (k) { return k !== xKey && /^step/i.test(k) && typeof tasks[0].inputs[k] === 'string'; })[0];
    if (!nameKey) return null;
    var m = {};
    for (var i = 0; i < tasks.length; i++) {
      var x = xNum(tasks[i].inputs[xKey]), n = String(tasks[i].inputs[nameKey] || '').replace(/^\+\s*/, '').trim();
      if (x == null) continue;
      if (/^none\b/i.test(n) || x === 0) n = 'intact';
      if (m[x] != null && m[x] !== n) return null;
      m[x] = n;
    }
    return m;
  }
  function drawCurves(box, card, tasks, xKey, unit, yTitle, seriesKeys, xTitleGiven) {
    if (typeof Chart === 'undefined') { chartMsg(box, 'The chart library did not load. The table below has every value.'); return null; }
    var xOf = function (t) { return xNum(t.inputs[xKey]); };
    var varies = function (k) { return uniq(tasks.map(function (t) { return JSON.stringify(sv(t, k) == null ? null : sv(t, k)); })).length > 1; };
    var skeys = (seriesKeys && seriesKeys.length) ? seriesKeys.filter(varies) : splitInputs(card, tasks, [xKey]).vary;
    // unloaded points (direction "none" at 0 Nm) start every line instead of forming a series of their own
    var isBase = function (t) { return skeys.length && xOf(t) === 0 && skeys.every(function (k) { return BASELINE.test(String(sv(t, k) == null ? '' : sv(t, k)).trim()); }); };
    var base = tasks.filter(isBase), rest = tasks.filter(function (t) { return !isBase(t); });
    if (!rest.length) { rest = tasks; base = []; }
    var sKey = seriesNamer(card, rest, skeys);
    var series = uniq(rest.map(sKey));
    var studies = viewStudies(card, tasks).filter(function (k) { return !S.off[k]; });
    // FE curves: colour = study (the same on every card), line style and marker = series.
    // Other domains with one study (e.g. stress-strain of four lamellae): colour by series reads better.
    var byStudyColor = card.domain === 'fe' || studies.length > 1 || series.length === 1;
    var steps = stepNames(tasks, xKey);
    var lineOf = function (pick, s) { // points of one series (plus the shared baseline) for one study / the pooled value
      var mine = rest.filter(function (t) { return sKey(t) === s && xOf(t) != null; });
      var pts = mine.map(function (t) { var v = pick(t); if (!v) return null; v.x = xOf(t); v.task = t; return v; }).filter(Boolean);
      if (pts.length && series.length > 1) base.forEach(function (t) {
        if (pts.some(function (p) { return p.x === xOf(t); })) return;
        var v = pick(t); if (v) { v.x = xOf(t); v.task = t; v.base = true; pts.push(v); }
      });
      else if (series.length === 1) base.forEach(function (t) { var v = pick(t); if (v) { v.x = xOf(t); v.task = t; pts.push(v); } });
      return pts.sort(function (a, b) { return a.x - b.x; });
    };
    var lines = [];
    studies.forEach(function (k) {
      series.forEach(function (s, si) {
        var pts = lineOf(function (t) { return firstRef(card, t, k); }, s);
        if (!pts.length) return;
        var dash = byStudyColor ? DASHES[si % DASHES.length] : [];
        lines.push({ label: legendName(card, k) + (series.length > 1 ? ' · ' + s : ''), key: k, pts: pts, hollow: openMark(card, k), si: si,
          color: byStudyColor ? colorOf(card, k) : cssVar('--s' + (si % 12 + 1)), dash: isSec(card, k) && !dash.length ? [5, 3] : dash });
      });
    });
    if (base.length && series.length > 1) studies.forEach(function (k) { // a study with only the unloaded point
      if (lines.some(function (l) { return l.key === k; })) return;
      var pts = base.map(function (t) { var v = firstRef(card, t, k); if (!v) return null; v.x = xOf(t); v.task = t; return v; }).filter(Boolean);
      if (pts.length) lines.push({ label: legendName(card, k) + ' · unloaded', key: k, pts: pts, hollow: openMark(card, k), si: 0, color: colorOf(card, k), dash: [] });
    });
    if (!S.hidePooled) series.forEach(function (s, si) {
      var pts = lineOf(function (t) { return pooledValue(pooledFor(card, t)); }, s);
      if (pts.length) lines.push({ label: 'Pooled' + (series.length > 1 ? ' · ' + s : ''), key: '_pooled', pooled: true, pts: pts, si: si,
        color: cssVar('--pooled'), dash: byStudyColor ? DASHES[si % DASHES.length] : [] });
    });
    if (!lines.length) { chartMsg(box, studies.length ? 'No plottable values. See the table.' : 'Nothing to show. Switch a study on above.'); return null; }
    box.style.height = '';
    var xs = [], ys = [];
    lines.forEach(function (l) { l.pts.forEach(function (p) { xs.push(p.x); ys.push(p.y); if (p.lo != null) ys.push(p.lo); if (p.hi != null) ys.push(p.hi); }); });
    var xlo = Math.min.apply(null, xs), xhi = Math.max.apply(null, xs);
    var yAllPos = lines.every(function (l) { return l.pts.every(function (p) { return p.y >= 0; }); });
    // dodge: lines that share an x value are shifted a few pixels apart so their whiskers stay readable
    var xmin = xlo >= 0 ? 0 : xlo, span = Math.max(xhi - xmin, 1e-9);
    var plotW = Math.max(200, box.clientWidth - 90), perPx = span / plotW;
    // one slot per study (lines of one study stay on the true x); lone points of one study are spread by series
    var slots = [];
    lines.forEach(function (l) {
      if (l.pooled) { l.slot = null; return; }
      var id = l.key + (l.pts.length === 1 && series.length > 1 ? '|' + l.si : '');
      if (slots.indexOf(id) < 0) slots.push(id);
      l.slot = slots.indexOf(id);
    });
    var shared = {};
    lines.forEach(function (l) { if (l.slot != null) l.pts.forEach(function (p) { (shared[p.x] = shared[p.x] || {})[l.slot] = 1; }); });
    var crowd = Object.keys(shared).some(function (k) { return Object.keys(shared[k]).length > 1; });
    var stepPx = crowd && slots.length > 1 ? Math.min(5, 24 / (slots.length - 1)) : 0;
    lines.forEach(function (l) { l.dx = l.slot == null ? 0 : (l.slot - (slots.length - 1) / 2) * stepPx * perPx; });
    var padX = (stepPx * (slots.length - 1) / 2 + 8) * perPx;
    var xTitle = xAxisTitle(card, xKey, xTitleGiven);
    var narrow = box.clientWidth < 560;
    var opts = chartBase(), surface = cssVar('--surface');
    opts.interaction = { mode: 'nearest', axis: 'x', intersect: false };
    var xTicks = { color: cssVar('--muted'), padding: 6, maxRotation: 0 };
    if (steps) {
      xTicks.stepSize = 1;
      xTicks.callback = function (v) {
        if (Math.abs(v - Math.round(v)) > 1e-6) return '';
        var n = steps[Math.round(v)];
        return narrow || n == null ? String(Math.round(v)) : wrapLabel(shortVal(n), 12);
      };
    }
    opts.scales = {
      x: valAxis(steps && !narrow ? 'Resection step (cumulative)' : xTitle, { type: 'linear', min: xmin - padX, max: xhi + padX, ticks: xTicks, offset: false }),
      y: valAxis(yTitle, yAllPos ? { beginAtZero: true, min: 0 } : {})
    };
    xTicks.includeBounds = false;
    if (steps) { opts.scales.x.min = xmin - 0.35; opts.scales.x.max = xhi + 0.35; opts.scales.x.afterBuildTicks = function (ax) { ax.ticks = Object.keys(steps).map(function (k) { return { value: +k }; }); }; }
    else if (xlo >= 0) opts.scales.x.afterBuildTicks = function (ax) { ax.ticks = ax.ticks.filter(function (t) { return t.value >= 0; }); };
    opts.plugins.tooltip.callbacks = {
      title: function (items) {
        if (!items.length) return '';
        var p = items[0].dataset._vals[items[0].dataIndex];
        return (steps ? 'Step ' + fmt(p.x) + (steps[p.x] ? ': ' + steps[p.x] : '') : xTitle + ' = ' + fmt(p.x));
      },
      label: function (c) { return tipLabel(c, c.dataset._vals[c.dataIndex], unit); }
    };
    var chart = new Chart(canvasIn(box, yTitle + ' versus ' + xTitle), {
      type: 'line',
      data: { datasets: lines.map(function (l) {
        var mark = l.pooled ? 'rectRot' : MARKS[l.si % MARKS.length];
        return { label: l.label, _key: l.key, _pooled: !!l.pooled, _color: l.pooled ? null : l.color, _vals: l.pts,
          data: l.pts.map(function (p) { return { x: p.x + l.dx, y: p.y }; }),
          borderColor: l.color, backgroundColor: l.color, borderWidth: l.pooled ? STY.linePooled : STY.line, borderDash: l.dash,
          pointRadius: l.pooled ? STY.pointPooled : l.pts.length > 10 ? 2 : (mark === 'star' || mark === 'triangle' ? STY.point + 1 : STY.point), pointHoverRadius: STY.hover,
          pointBorderColor: l.hollow || l.pooled || /^(star|cross)/.test(mark) ? l.color : surface, pointBorderWidth: l.hollow || l.pooled || /^(star|cross)/.test(mark) ? 1.6 : 1.2,
          pointBackgroundColor: l.hollow || l.pooled ? surface : l.color,
          pointStyle: mark, fill: false, tension: 0, clip: 8 };
      }) },
      options: opts, plugins: [whiskers]
    });
    S.charts.push(chart);
    return { kind: 'curves', series: series, colorBySeries: !byStudyColor, sets: lines, steps: narrow ? steps : null };
  }
  // legend for the line styles (series) under a curve chart
  function markSvg(mark, col, filled) {
    var f = filled ? col : 'none', st = 'stroke="' + col + '" stroke-width="1.4"';
    switch (mark) {
      case 'triangle': return '<path d="M14 0.6 L18 7.4 L10 7.4 Z" fill="' + f + '" ' + st + '/>';
      case 'rect': case 'rectRounded': return '<rect x="10.5" y="0.5" width="7" height="7" rx="' + (mark === 'rect' ? 0 : 2) + '" fill="' + f + '" ' + st + '/>';
      case 'star': return '<path d="M14 0.3 L15.2 3.4 L18.4 3.6 L16 5.6 L16.7 8 L14 6.5 L11.3 8 L12 5.6 L9.6 3.6 L12.8 3.4 Z" fill="' + f + '" ' + st + '/>';
      case 'crossRot': return '<path d="M11 1 L17 7 M17 1 L11 7" ' + st + '/>';
      case 'cross': return '<path d="M14 0 V8 M10 4 H18" ' + st + '/>';
      default: return '<circle cx="14" cy="4" r="3.4" fill="' + f + '" ' + st + '/>';
    }
  }
  function seriesKeyHtml(info) {
    var html = info.series.length > 1 ? info.series.map(function (s, si) {
      var d = info.colorBySeries ? [] : DASHES[si % DASHES.length];
      var col = info.colorBySeries ? cssVar('--s' + (si % 12 + 1)) : cssVar('--ink-2');
      return '<span><svg viewBox="0 0 28 8" aria-hidden="true"><line x1="1" y1="4" x2="27" y2="4" stroke="' + col + '" stroke-width="2" stroke-dasharray="' + d.join(' ') + '"/>' +
        markSvg(MARKS[si % MARKS.length], col, true) + '</svg>' + esc(s) + '</span>';
    }).join('') : '';
    if (info.steps) html += '<span class="steps-key">' + Object.keys(info.steps).sort(function (a, b) { return a - b; }).map(function (k) {
      return '<b>' + esc(k) + '</b> ' + esc(info.steps[k]);
    }).join(' · ') + '</span>';
    return html;
  }

  // ---------- small multiples: view {"layout": "panels", "panel_by": "<input key or level>"} ----------
  // One small chart per panel value (e.g. per level), a shared legend (the study chips) and shared axes.
  // How each study's spread is drawn (bench/OUTCOMES.md): mean ± SD -> marker + line + error bars;
  // min–max without SD (not a median) -> shaded corridor between min and max; median -> open marker + [min–max] bar;
  // no spread -> marker only. Optional "models": published model ranges as a grey band underneath, never pooled.
  var PANEL_GAP = 14;
  function panelCols(n, w, v) {
    var max = v && v.columns ? v.columns : 3;
    var c = w >= 860 ? max : w >= 300 ? Math.min(2, max) : 1;
    if (n === 4 && c === 3 && !(v && v.columns)) c = 2; // 2 × 2 reads better than 3 + 1
    return Math.max(1, Math.min(c, n));
  }
  function niceCeil(v) {
    if (!(v > 0)) return v < 0 ? -niceFloorAbs(-v) : 1;
    var p = Math.pow(10, Math.floor(Math.log10(v))), m = [1, 1.2, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10];
    for (var i = 0; i < m.length; i++) if (m[i] * p >= v - 1e-12) return +(m[i] * p).toPrecision(6);
    return 10 * p;
  }
  function niceFloorAbs(v) { // largest nice number <= v (for negative axis ends)
    var p = Math.pow(10, Math.floor(Math.log10(v))), m = [10, 8, 6, 5, 4, 3, 2.5, 2, 1.5, 1.2, 1];
    for (var i = 0; i < m.length; i++) if (m[i] * p <= v + 1e-12) return +(m[i] * p).toPrecision(6);
    return p;
  }
  // axis ends on whole tick steps (1, 2, 2.5, 5 × 10^k), about 4-6 ticks; starts at 0 for positive data
  function niceExtent(lo, hi, nt, tight) {
    nt = nt || 5;
    var a = Math.min(lo, 0) < 0 ? lo : 0, b = Math.max(hi, 0) > 0 ? hi : 0;
    if (a === b) b = a + 1;
    var raw = (b - a) * 1.03 / nt, p = Math.pow(10, Math.floor(Math.log10(raw))), step = p;
    [1, 2, 5, 10].some(function (m) { step = m * p; return m * p >= raw - 1e-12; });
    var r = [a < 0 ? -Math.ceil(-a / step - 1e-9) * step : 0, Math.ceil(b * (tight ? 1 : 1.02) / step - 1e-9) * step];
    if (r[1] <= b && !tight) r[1] += step;
    r[0] = +r[0].toPrecision(10); r[1] = +r[1].toPrecision(10); r.step = step;
    return r;
  }

  function levelKey(s) {
    s = String(s);
    var toks = (s.match(/\b[CTLS]\d{1,2}\b/g) || []).filter(function (t) { return VORD[t] != null; });
    if (!toks.length) return null;
    var o = toks.map(function (t) { return VORD[t]; });
    var span = Math.max.apply(null, o) - Math.min.apply(null, o);
    // whole specimens (several segments) first, then cranial to caudal; "levels pooled" last
    return (/pool/i.test(s) ? 2000 : span > 1 ? 0 : 1000) + Math.min.apply(null, o);
  }
  function panelValues(v, tasks, pvOf) {
    var vals = uniq(tasks.map(pvOf));
    if (Array.isArray(v.panels) && v.panels.length) {
      var given = v.panels.map(function (p) { return String(p && typeof p === 'object' ? p.value : p); });
      return given.filter(function (g) { return vals.indexOf(g) >= 0; }).concat(vals.filter(function (x) { return given.indexOf(x) < 0; }));
    }
    if (vals.length > 1 && vals.every(function (x) { return levelKey(x) != null; })) return vals.slice().sort(function (a, b) { return levelKey(a) - levelKey(b); });
    if (vals.every(function (x) { return xNum(x) != null; })) return vals.slice().sort(function (a, b) { return xNum(a) - xNum(b); });
    return vals;
  }
  function panelLabel(card, v, pk, val) {
    var m = v.panel_labels || {};
    if (m[val]) return m[val];
    var p = (v.panels || []).filter(function (x) { return x && typeof x === 'object' && String(x.value) === val; })[0];
    if (p && p.label) return p.label;
    if (val === '') return 'Other';
    var d = card._input[pk] || {};
    return isNum(toNum(val)) ? withUnit(fmt(toNum(val)), d.unit) : upperFirst(human(val));
  }
  // left/right etc.: several refs of one study in one task, told apart by the first word(s) of their notes
  function refTag(r) { var s = String(r.note || '').split(/[;,(]/)[0].trim(); return s.length && s.length <= 24 ? s : ''; }
  function encOf(pts) {
    if (pts.some(function (p) { return p.tr; })) return pts.some(function (p) { return p.err; }) ? 'sd' : 'point'; // transposed: horizontal bars, never a corridor
    if (pts.some(function (p) { return p.err === 'sd'; })) return 'sd';
    if (pts.every(function (p) { return p.kind === 'median'; })) return 'median';
    if (pts.length > 1 && pts.every(function (p) { return p.err === 'range' && !p.multi; })) return 'band';
    if (pts.some(function (p) { return p.err === 'range'; })) return p0kind(pts) === 'median' ? 'median' : 'range';
    return 'point';
  }
  function p0kind(pts) { return pts.some(function (p) { return p.kind === 'median'; }) ? 'median' : 'mean'; }
  // study -> how its values are drawn in this view (for the legend glyphs), from its refs
  function studyEnc(card, tasks, k) {
    var rs = [];
    tasks.forEach(function (t) { t.refs.forEach(function (r) { if (r.study === k) { var x = refValue(r); if (x) rs.push(x); } }); });
    if (!rs.length) return 'point';
    if (rs.some(function (p) { return p.err === 'sd'; })) return 'sd';
    if (rs.some(function (p) { return p.kind === 'median'; })) return 'median';
    if (rs.some(function (p) { return p.err === 'range'; })) return rs.length > 1 ? 'band' : 'range';
    return 'point';
  }
  function encGlyph(enc, col, w, open) { // open: hollow marker and dashed line (secondary or not-pooled study)
    w = w || 22;
    var m = w / 2, s = 'stroke="' + col + '"';
    if (open && (enc === 'sd' || enc === 'range' || enc === 'point')) {
      return '<svg class="eg" viewBox="0 0 ' + w + ' 12" width="' + w + '" height="12" aria-hidden="true"><path d="M1 8 L' + (w - 1) + ' 4" ' + s + ' stroke-width="1.4" stroke-dasharray="3 2"/>' +
        (enc === 'point' ? '' : '<path d="M' + m + ' 1 V11 M' + (m - 3) + ' 1 H' + (m + 3) + ' M' + (m - 3) + ' 11 H' + (m + 3) + '" ' + s + ' stroke-width="1.2"/>') +
        '<circle cx="' + m + '" cy="6" r="3" fill="var(--surface)" ' + s + ' stroke-width="1.5"/></svg>';
    }
    switch (enc) {
      case 'band': return '<svg class="eg" viewBox="0 0 ' + w + ' 12" width="' + w + '" height="12" aria-hidden="true"><path d="M1 9 L' + (w - 1) + ' 2 L' + (w - 1) + ' 7 L1 11 Z" fill="' + col + '" fill-opacity="0.28" ' + s + ' stroke-opacity="0.6" stroke-width="0.8"/><path d="M1 10 L' + (w - 1) + ' 4.5" ' + s + ' stroke-width="1.3" stroke-dasharray="2.5 2"/></svg>';
      case 'median': return '<svg class="eg" viewBox="0 0 ' + w + ' 12" width="' + w + '" height="12" aria-hidden="true"><path d="M' + m + ' 1 V11 M' + (m - 3) + ' 1 H' + (m + 3) + ' M' + (m - 3) + ' 11 H' + (m + 3) + '" ' + s + ' stroke-width="1.2"/><rect x="' + (m - 3) + '" y="3" width="6" height="6" fill="var(--surface)" ' + s + ' stroke-width="1.5"/></svg>';
      case 'range': case 'sd': return '<svg class="eg" viewBox="0 0 ' + w + ' 12" width="' + w + '" height="12" aria-hidden="true"><path d="M1 8 L' + (w - 1) + ' 4" ' + s + ' stroke-width="1.6"/><path d="M' + m + ' 1 V11 M' + (m - 3) + ' 1 H' + (m + 3) + ' M' + (m - 3) + ' 11 H' + (m + 3) + '" ' + s + ' stroke-width="1.2"/><circle cx="' + m + '" cy="6" r="3" fill="' + col + '" stroke="var(--surface)" stroke-width="1"/></svg>';
      case 'models': return '<svg class="eg" viewBox="0 0 ' + w + ' 12" width="' + w + '" height="12" aria-hidden="true"><path d="M1 8 L' + (w - 1) + ' 1 L' + (w - 1) + ' 8 L1 11 Z" fill="' + col + '" fill-opacity="0.35"/></svg>';
      case 'pooled': return '<svg class="eg" viewBox="0 0 ' + w + ' 12" width="' + w + '" height="12" aria-hidden="true"><path d="M' + m + ' 2 L' + (m + 4) + ' 6 L' + m + ' 10 L' + (m - 4) + ' 6 Z" fill="var(--surface)" ' + s + ' stroke-width="1.6"/></svg>';
      default: return '<svg class="eg" viewBox="0 0 ' + w + ' 12" width="' + w + '" height="12" aria-hidden="true"><circle cx="' + m + '" cy="6" r="3.4" fill="' + col + '" stroke="var(--surface)" stroke-width="1"/></svg>';
    }
  }
  // published model ranges (bench/tests, served as data/tests/<test_id>.json): [{label, panel, pts: [{x, lo, hi, y}]}]
  function loadModels(v) {
    var ms = Array.isArray(v.models) ? v.models : [];
    if (!ms.length) return Promise.resolve([]);
    return Promise.all(ms.map(function (m) {
      if (!m || !m.test_id) return null;
      return fetchJSON('data/tests/' + encodeURIComponent(m.test_id) + '.json').then(function (d) {
        var rows = (d.data || []).filter(function (r) {
          return Object.keys(m.where || {}).every(function (k) { return String(r[k]) === String(m.where[k]); });
        });
        var pts = rows.map(function (r) {
          var x = xNum(r[m.x || 'x']), lo = toNum(r.min), hi = toNum(r.max), y = toNum(r.median != null ? r.median : r.mean);
          return x == null || lo == null || hi == null ? null : { x: x, lo: lo, hi: hi, y: y };
        }).filter(Boolean).sort(function (a, b) { return a.x - b.x; });
        var src = d.source || {};
        return pts.length ? { label: m.label || 'Published models' + (src.short ? ' (' + src.short + ')' : ''), panel: m.panel == null ? null : String(m.panel), pts: pts,
          n: src.n, test_id: m.test_id } : null;
      }, function () { return null; });
    })).then(function (a) { return a.filter(Boolean); });
  }
  // e.g. "axial preload 100 N" next to a study whose tasks in this view all share a value the others do not
  function studySuffix(card, v, tasks, k) {
    var mine = tasks.filter(function (t) { return t.refs.some(function (r) { return r.study === k; }); });
    return (v.legend_inputs || []).map(function (x) {
      var vals = uniq(mine.map(function (t) { return JSON.stringify(sv(t, x) == null ? null : sv(t, x)); }));
      var val = mine.length ? sv(mine[0], x) : null;
      return vals.length === 1 && val != null && val !== '' && val !== 0 ? phrase(card, x, val) : '';
    }).filter(Boolean).concat(v.legend_notes && v.legend_notes[k] ? [v.legend_notes[k]] : []).join(', ');
  }
  // view "transpose" (same keys as agent_sims): {"output": "disp", "as": "force", "y_input": "compression_n" or ["compression_n", "load"],
  // "y_values": {"<task id>": 500}}. Tasks of that output were run force-controlled (a displacement measured at a set force): they are
  // drawn at x = measured value (SD as a horizontal bar), y = applied load (first numeric y_input, or y_values), on the same axes as the
  // displacement-controlled tasks (x = displacement input, y = the "as" output). "input" / "y_output" are accepted as aliases.
  function transposeOf(card, v, tasks) {
    var t = v.transpose;
    if (!t || !t.output) return null;
    var ins = [].concat(t.y_input || t.input || []);
    var other = uniq(tasks.filter(function (x) { return x.output !== t.output; }).map(function (x) { return x.output || ''; }));
    return { output: t.output, inputs: ins, vals: t.y_values || {}, y: t.as || t.y_output || other[0] || (ins.length ? 'in:' + ins[0] : t.output) };
  }
  function trY(tr, t) {
    if (tr.vals[t.id] != null) return toNum(tr.vals[t.id]);
    for (var i = 0; i < tr.inputs.length; i++) { var y = xNum(t.inputs[tr.inputs[i]]); if (y != null) return y; }
    return null;
  }
  function drawPanels(fig, card, v, tasks, xKey, models) {
    if (typeof Chart === 'undefined') { chartMsg(fig, 'The chart library did not load. The table below has every value.'); return null; }
    var pk = v.panel_by || (v.layout === 'panels' ? 'level' : ''), pmap = v.panel_map || {};
    var xOf = function (t) { return xNum(t.inputs[xKey]); };
    var pvOf = function (t) { if (!pk) return ''; var x = sv(t, pk); x = x == null ? '' : String(x); return pmap[x] != null ? String(pmap[x]) : x; };
    var tr = transposeOf(card, v, tasks), isTr = function (t) { return !!tr && t.output === tr.output; };
    var posOf = function (t) { return isTr(t) ? trY(tr, t) : xOf(t); }; // the controlled value: x input, or the transposed input
    var yOutOf = function (t) { return isTr(t) ? tr.y : t.output || ''; };
    var yLab = function (o) { return /^in:/.test(o) ? inputLabel(card, o.slice(3)) : outLabel(card, o); };
    var yAx = function (o) { return /^in:/.test(o) ? xAxisTitle(card, o.slice(3)) : axisTitle(card, o); };
    var yUn = function (o) { return /^in:/.test(o) ? unitTxt((card._input[o.slice(3)] || {}).unit) : unitOf(card, o); };
    var ptOf = function (val, t) { // a plotted point; transposed tasks swap axes and keep the original value for the tooltip
      var p = {}; Object.keys(val).forEach(function (q) { p[q] = val[q]; });
      p.task = t;
      if (isTr(t)) { p.orig = val; p.x = val.y; p.xlo = val.lo; p.xhi = val.hi; p.y = trY(tr, t); p.lo = null; p.hi = null; p.tr = true; }
      else p.x = xOf(t);
      return p;
    };
    var sortPts = function (pts) { var byY = pts.length && pts.every(function (q) { return q.tr; }); return pts.sort(function (a, b) { return byY ? a.y - b.y : a.x - b.x; }); };
    var all = tasks.filter(function (t) { return posOf(t) != null; });
    // unloaded points start the curves instead of forming a panel or a series of their own:
    // panel value "none"/"neutral" at 0 joins every panel; series values all "unloaded" at 0 join the curves of their own panel
    var sk0 = (v.series || []).filter(function (k) { return k !== pk && k !== xKey; });
    var panelBase = function (t) { return !!pk && BASELINE.test(pvOf(t).trim()); };
    var isBase = function (t) {
      return posOf(t) === 0 && (panelBase(t) || (sk0.length > 0 && sk0.every(function (k) { var s = sv(t, k); return /^unloaded$/i.test(String(s == null ? '' : s).trim()); })));
    };
    var base = all.filter(isBase), rest = all.filter(function (t) { return !isBase(t); });
    if (!rest.length) { rest = all; base = []; }
    var pvals = panelValues(v, rest, pvOf);
    var varies = function (k) { return uniq(rest.map(function (t) { return JSON.stringify(sv(t, k) == null ? null : sv(t, k)); })).length > 1; };
    var skeys = (v.series || []).filter(function (k) { return k !== pk && k !== xKey && varies(k); });
    var sName0 = skeys.length ? seriesNamer(card, rest, skeys) : function () { return ''; };
    var multiOut = uniq(all.map(yOutOf)).length > 1;
    var sName = function (t) { return isBase(t) ? '' : sName0(t); };
    var studies = viewStudies(card, all).filter(function (k) { return !S.off[k]; });
    // line styles (dash + marker) are numbered per study: the k-th curve of a study looks the same in every panel
    var styles = {}, styleOf = function (k, name) {
      var a = styles[k] || (styles[k] = []), i = a.indexOf(name);
      if (i < 0) { a.push(name); i = a.length - 1; }
      return i;
    };
    var steps = stepNames(all, xKey);
    var panels = pvals.map(function (pv) {
      var own = rest.filter(function (t) { return pvOf(t) === pv; });
      var pbase = base.filter(function (t) { return panelBase(t) || pvOf(t) === pv; });
      var ts = own.concat(pbase);
      var pOuts = uniq(own.map(yOutOf));
      var oName = function (t) { return multiOut && pOuts.length > 1 ? yLab(yOutOf(t)) : ''; };
      var lines = [];
      studies.forEach(function (k) {
        var groups = {}, order = [], baseOnly = [];
        own.forEach(function (t) {
          var refs = refsOf(card, t).filter(function (r) { return r.study === k; });
          if (!refs.length) return;
          var tags = refs.map(refTag);
          var split = refs.length > 1 && tags.every(Boolean) && uniq(tags).length === refs.length;
          var items = split ? refs.map(function (r, i) { return { tag: tags[i], v: refValue(r) }; }) : [{ tag: '', v: firstRef(card, t, k) }];
          items.forEach(function (it) {
            if (!it.v) return;
            var name = [oName(t), sName(t), it.tag].filter(Boolean).join(' · ');
            if (!groups[name]) { groups[name] = []; order.push(name); }
            groups[name].push(ptOf(it.v, t));
          });
        });
        pbase.forEach(function (t) { // the shared unloaded point joins every curve of the study (or stands alone)
          var bv0 = firstRef(card, t, k); if (!bv0) return;
          var bv = ptOf(bv0, t); bv.base = true;
          var same = function (q) { return q.tr || bv.tr ? q.x === bv.x && q.y === bv.y : q.x === bv.x; };
          if (order.length) order.forEach(function (name) { if (!groups[name].some(same)) groups[name].push(bv); });
          else baseOnly.push(bv);
        });
        if (baseOnly.length) { groups[''] = baseOnly; order.push(''); baseOnly.only = true; }
        order.forEach(function (name) {
          var pts = sortPts(groups[name]);
          lines.push({ key: k, name: name, pts: pts, si: styleOf(k, name), color: colorOf(card, k), hollow: openMark(card, k), sec: isSec(card, k), np: noPool(card, k),
            tr: pts.some(function (q) { return q.tr; }), enc: encOf(pts),
            label: legendName(card, k) + (name ? ' · ' + name : groups[name] === baseOnly ? ' · unloaded' : '') });
        });
      });
      if (!S.hidePooled) uniq(own.map(function (t) { return [oName(t), sName(t)].filter(Boolean).join(' · '); })).forEach(function (s) {
        var pts = sortPts(own.filter(function (t) { return [oName(t), sName(t)].filter(Boolean).join(' · ') === s; }).map(function (t) {
          var q = pooledValue(pooledFor(card, t)); return q ? ptOf(q, t) : null;
        }).filter(Boolean));
        if (pts.length) lines.push({ key: '_pooled', pooled: true, name: s, pts: pts, si: styleOf('_pooled', s), color: cssVar('--pooled'), enc: 'pooled',
          tr: pts.some(function (q) { return q.tr; }), label: 'Pooled' + (s ? ' · ' + s : '') });
      });
      var mods = S.hideModels ? [] : models.filter(function (m) { return m.panel == null || m.panel === pv; });
      return { value: pv, label: panelLabel(card, v, pk, pv), tasks: ts, lines: lines, models: mods, outs: pOuts.length ? pOuts : uniq(ts.map(yOutOf)) };
    });
    // curve names: parts shared by every curve of one study are dropped ("Disc unit No.1 · posterior elements removed" -> "Disc unit No.1")
    Object.keys(styles).forEach(function (k) {
      if (k === '_pooled') return;
      var names = styles[k].filter(Boolean);
      if (names.length < 2) return;
      var parts = names.map(function (n) { return n.split(' · '); });
      var common = parts[0].filter(function (x) { return parts.every(function (q) { return q.indexOf(x) >= 0; }); });
      if (!common.length) return;
      var map = {}, ok = true;
      styles[k].forEach(function (n) { var m = n ? n.split(' · ').filter(function (x) { return common.indexOf(x) < 0; }).join(' · ') : n; if (n && !m) ok = false; map[n] = m; });
      if (!ok) return;
      styles[k] = styles[k].map(function (n) { return map[n]; });
      panels.forEach(function (p) {
        p.lines.forEach(function (l) { if (l.key === k && map[l.name] != null) { l.name = map[l.name]; l.label = legendName(card, k) + (l.name ? ' · ' + l.name : ''); } });
      });
    });
    // panel titles: drop a lead-in every title shares ("Dead-weight load on rib-head pin, anterior" -> "Anterior")
    if (panels.length > 1) {
      var heads = panels.map(function (p) { var m = /^(.*[,:])\s+\S/.exec(p.label); return m ? m[1] : null; });
      var lead = heads[0];
      if (lead && heads.every(function (h) { return h === lead; })) panels.forEach(function (p) { p.label = upperFirst(p.label.slice(lead.length).trim()); });
    }
    // axes: x shared by all panels; y shared by panels of the same output unless "share_y": false
    var xsOf = function (p) { var xs = []; p.lines.forEach(function (l) { l.pts.forEach(function (q) { xs.push(q.x); }); }); p.models.forEach(function (m) { m.pts.forEach(function (q) { xs.push(q.x); }); }); return xs; };
    var xwOf = function (p) { var xs = []; p.lines.forEach(function (l) { l.pts.forEach(function (q) { if (q.xlo != null) xs.push(q.xlo); if (q.xhi != null) xs.push(q.xhi); }); }); return xs; };
    var xrange = function (xs, xw) { // xw: ends of horizontal SD bars (they widen the axis, but do not pull it below 0)
      var xlo = Math.min.apply(null, xs), xhi = Math.max.apply(null, xs);
      if (xw && xw.length) { var wlo = Math.min.apply(null, xw); xhi = Math.max(xhi, Math.max.apply(null, xw)); xlo = xlo >= 0 ? Math.max(0, Math.min(xlo, wlo)) : Math.min(xlo, wlo); }
      var r = steps ? [xlo - 0.4, xhi + 0.4] : niceExtent(Math.min(0, xlo), xhi, 6, true);
      if (!steps && xlo > 0 && xlo > (xhi - xlo)) { var st = niceExtent(0, xhi - xlo, 5, true).step; r = [Math.floor(xlo / st) * st, Math.ceil(xhi / st) * st]; r.step = st; } // data far from 0
      if (isNum(v.x_min)) r[0] = v.x_min;
      if (isNum(v.x_max)) r[1] = v.x_max;
      return r;
    };
    var xsAll = [], xwAll = [];
    panels.forEach(function (p) { p.xs = xsOf(p); p.xw = xwOf(p); xsAll = xsAll.concat(p.xs); xwAll = xwAll.concat(p.xw); });
    if (!xsAll.length) { chartMsg(fig, studies.length ? 'No plottable values. See the table.' : 'Nothing to show. Switch a study on above.'); return null; }
    var xrAll = xrange(xsAll, xwAll);
    panels.forEach(function (p) { p.xr = v.share_x === false && p.xs.length ? xrange(p.xs, p.xw) : xrAll; });
    var yr = {}, yc = {};
    panels.forEach(function (p) {
      var g = v.share_y === false ? 'p' + p.value : p.outs.join('|');
      var ys = yr[g] || (yr[g] = []);
      var cs = yc[g] || (yc[g] = []);
      p.lines.forEach(function (l) { l.pts.forEach(function (q) { ys.push(q.y); cs.push(q.y); if (q.lo != null) ys.push(q.lo); if (q.hi != null) ys.push(q.hi); }); });
      p.models.forEach(function (m) { m.pts.forEach(function (q) { ys.push(q.lo, q.hi); cs.push(q.lo); }); });
      p.ygroup = g;
    });
    // an SD bar that dips below 0 does not pull the axis below 0 when every value is positive
    Object.keys(yr).forEach(function (g) {
      var ys = yr[g], lo = Math.min.apply(null, ys);
      if (yc[g].length && Math.min.apply(null, yc[g]) >= 0) lo = Math.max(0, lo);
      yr[g] = ys.length ? niceExtent(lo, Math.max.apply(null, ys)) : [0, 1];
    });
    var w = fig.clientWidth || 600, n = panels.length, cols = panelCols(n, w, v);
    S.panelCols = cols;
    var cellW = (w - (cols - 1) * PANEL_GAP) / cols;
    // one panel = one plain figure: taller, and no panel title (the figure title says it) unless panel_labels names it
    var h = n === 1 ? Math.round(Math.max(260, Math.min(420, cellW * 0.5))) : Math.round(Math.max(150, Math.min(250, cellW * (cols === 1 ? 0.62 : 0.74))));
    var showPT = n > 1 || !!(v.panel_labels && v.panel_labels[panels[0].value]);
    fig.innerHTML = '<div class="pgrid" style="--cols:' + cols + '">' + panels.map(function (p, i) {
      return '<div class="pcell">' + (showPT ? '<div class="ptitle">' + esc(p.label) + '</div>' : '') + '<div class="pbox" id="pbox-' + i + '" style="height:' + h + 'px"></div></div>';
    }).join('') + '</div>';
    var allTr = !!tr && all.every(isTr);
    var xTitle = steps ? 'Resection step' : xAxisTitle(card, xKey, v.x_title || (allTr ? axisTitle(card, tr.output) : null));
    var trXU = tr ? unitOf(card, tr.output) : '', trYU = tr ? yUn(tr.y) : '', trYL = tr ? yLab(tr.y) : '';
    var grid = cssVar('--grid'), ink2 = cssVar('--ink-2'), muted = cssVar('--muted'), surface = cssVar('--surface'), axisLine = cssVar('--line-2'), modelInk = cssVar('--muted');
    var small = cellW < 230, tickFont = { size: small ? 9.5 : 10.5 }, titleFont = { size: small ? 10.5 : 11.5, weight: '500' };
    var mainY = v.y_title || null;
    var encs = {}, allLines = [];
    panels.forEach(function (p, i) {
      var box = $('#pbox-' + i, fig), col = i % cols, row = Math.floor(i / cols);
      var lastInCol = i + cols >= n; // nothing below this panel
      var unit = p.outs.length === 1 ? yUn(p.outs[0]) : '';
      var yTitle = mainY || (p.outs.length === 1 ? yAx(p.outs[0]) : yLab(p.outs[0]));
      var firstY = col === 0 ? null : panels[row * cols].ygroup;
      var showYTitle = col === 0 || firstY !== p.ygroup;
      if (!p.lines.length && !p.models.length) { box.innerHTML = '<div class="chart-msg">No values</div>'; return; }
      // dodge: lines whose whiskers share an x value move a few pixels apart
      var xr = p.xr, plotW = Math.max(80, cellW - (showYTitle ? 58 : 40)), perPx = (xr[1] - xr[0]) / plotW;
      var slotLines = p.lines.filter(function (l) { return l.enc !== 'band' && !l.tr; }); // transposed lines keep their true x
      var at = {};
      slotLines.forEach(function (l, j) { l.pts.forEach(function (q) { (at[q.x] = at[q.x] || {})[j] = 1; }); });
      var crowd = Object.keys(at).some(function (k) { return Object.keys(at[k]).length > 1; });
      var stepPx = crowd && slotLines.length > 1 ? Math.min(4, 14 / (slotLines.length - 1)) : 0;
      slotLines.forEach(function (l, j) { l.dx = (j - (slotLines.length - 1) / 2) * stepPx * perPx; });
      var ds = [];
      var band = function (pts, color, fillA, lineA, label, order, key) {
        var i0 = ds.length;
        ds.push({ label: label, _key: key, data: pts.map(function (q) { return { x: q.x, y: q.lo }; }), borderColor: alpha(color, lineA), borderWidth: 0.9,
          pointRadius: 0, pointHoverRadius: 0, fill: false, tension: 0, order: order, clip: 4 });
        ds.push({ label: label, _key: key, data: pts.map(function (q) { return { x: q.x, y: q.hi }; }), borderColor: alpha(color, lineA), borderWidth: 0.9,
          backgroundColor: alpha(color, fillA), pointRadius: 0, pointHoverRadius: 0, fill: i0, tension: 0, order: order, clip: 4 });
      };
      p.models.forEach(function (m) {
        encs.models = 1;
        if (m.pts.length > 1) band(m.pts, modelInk, 0.22, 0.45, m.label, 40, '_models');
        ds.push({ label: m.label, _key: '_models', _vals: m.pts.map(function (q) { return { x: q.x, y: q.y != null ? q.y : (q.lo + q.hi) / 2, lo: q.lo, hi: q.hi, err: 'range', kind: 'models', model: true }; }),
          _noWhisk: m.pts.length > 1, _color: modelInk, _whiskW: 6, _whiskA: 0.35, _cap: 0.01,
          data: m.pts.map(function (q) { return { x: q.x, y: q.y != null ? q.y : (q.lo + q.hi) / 2 }; }), showLine: false, pointRadius: 0, pointHoverRadius: 4,
          borderColor: modelInk, backgroundColor: modelInk, order: 39 });
      });
      p.lines.forEach(function (l) {
        allLines.push(l);
        encs[l.enc] = 1;
        if (l.enc === 'median' && l.pts.some(function (q) { return q.lo != null; })) encs.medR = 1;
        var mark = l.pooled ? 'rectRot' : MARKS[l.si % MARKS.length], dash = l.pooled ? [] : DASHES[l.si % DASHES.length];
        if (l.sec && !dash.length) dash = [5, 3];
        var open = l.hollow || l.pooled || l.enc === 'median';
        if (l.enc === 'band') band(l.pts, l.color, 0.2, 0.55, l.label, 20, l.key);
        ds.push({ label: l.label, _key: l.key, _pooled: !!l.pooled, _color: l.pooled ? null : l.color, _vals: l.pts, _noWhisk: l.enc === 'band', _cap: 3,
          data: l.pts.map(function (q) { return { x: q.x + (l.dx || 0), y: q.y }; }),
          borderColor: l.color, backgroundColor: l.color, borderWidth: l.enc === 'band' ? 1.2 : l.enc === 'median' ? 1.3 : 1.7,
          borderDash: l.enc === 'band' && !dash.length ? [3, 2] : dash, showLine: l.pts.length > 1,
          pointStyle: l.enc === 'median' && mark === 'circle' ? 'rect' : mark,
          pointRadius: l.enc === 'band' ? 2 : l.pooled ? 4.2 : l.pts.length > 10 ? 2 : 3.1, pointHoverRadius: 5.5,
          pointBorderColor: open || /^(star|cross)/.test(mark) ? l.color : surface, pointBorderWidth: open ? 1.5 : 1,
          pointBackgroundColor: open ? surface : l.color, fill: false, tension: 0, order: l.pooled ? 5 : 10, clip: 6 });
      });
      var yrr = yr[p.ygroup];
      var o = chartBase();
      o.layout = { padding: { top: 4, right: 8, left: 0, bottom: 0 } };
      o.interaction = { mode: 'nearest', intersect: false, axis: 'xy' };
      var xt = { color: muted, font: tickFont, padding: 3, maxRotation: 0, maxTicksLimit: 9, includeBounds: !steps };
      if (!steps && xr.step) xt.stepSize = small && (xr[1] - xr[0]) / xr.step > 6 ? xr.step * 2 : xr.step;
      if (steps) { xt.stepSize = 1; xt.maxTicksLimit = 40; xt.autoSkip = false; xt.callback = function (val) { return Math.abs(val - Math.round(val)) < 1e-6 ? String(Math.round(val)) : ''; }; }
      o.scales = {
        x: { type: 'linear', min: xr[0], max: xr[1], grid: { color: grid, drawTicks: false }, border: { display: true, color: axisLine },
          title: { display: lastInCol, text: xTitle, color: ink2, font: titleFont, padding: { top: 2 } }, ticks: xt },
        y: { min: yrr[0], max: yrr[1], grid: { color: grid, drawTicks: false }, border: { display: true, color: axisLine },
          title: { display: showYTitle, text: yTitle, color: ink2, font: titleFont, padding: { bottom: 2 } },
          ticks: { color: muted, font: tickFont, padding: 3, maxTicksLimit: 9, stepSize: yrr.step } }
      };
      if (steps) o.scales.x.afterBuildTicks = function (ax) { ax.ticks = Object.keys(steps).map(function (k) { return { value: +k }; }); };
      o.plugins.tooltip.filter = function (item) { return !!item.dataset._vals; };
      o.plugins.tooltip.callbacks = {
        title: function (items) {
          if (!items.length) return '';
          var q = items[0].dataset._vals[items[0].dataIndex];
          var head = showPT ? p.label + ' · ' : '';
          if (q.tr) return head + trYL + ' ' + withUnit(fmt(q.y), trYU) + ' (applied)';
          return head + (steps ? 'step ' + fmt(q.x) + (steps[q.x] ? ': ' + steps[q.x] : '') : xTitle.replace(/\s*\(([^)]*)\)$/, '') + ' ' + withUnit(fmt(q.x), (/\(([^)]*)\)$/.exec(xTitle) || [])[1]));
        },
        label: function (c) {
          var q = c.dataset._vals[c.dataIndex];
          if (q.model) return ' ' + c.dataset.label + ': ' + fmt(q.lo) + '–' + fmt(q.hi) + (unit ? ' ' + unit : '') + ' (range of models)';
          if (q.tr) return tipLabel(c, q.orig, trXU) + ' (measured)';
          return tipLabel(c, q, unit);
        }
      };
      var chart = new Chart(canvasIn(box, p.label + ': ' + yTitle + ' versus ' + xTitle), { type: 'line', data: { datasets: ds }, options: o, plugins: [whiskers] });
      S.charts.push(chart);
    });
    return { kind: 'panels', sets: allLines, styles: styles, encs: encs, steps: steps,
      tr: tr && allLines.some(function (l) { return l.tr; }) ? { x: lowerFirst(outLabel(card, tr.output)), y: lowerFirst(trYL) } : null };
  }
  // line styles under a panel figure: one row of names when every study uses the same ones, else per study
  function panelKeyHtml(info, card) {
    var ks = Object.keys(info.styles).filter(function (k) { return info.styles[k].length > 1 || (info.styles[k][0] && info.styles[k][0] !== 'unloaded'); });
    var html = '';
    var same = ks.length && ks.every(function (k) { return info.styles[k].join('|') === info.styles[ks[0]].join('|'); });
    var item = function (name, si, col) {
      return '<span><svg viewBox="0 0 28 8" aria-hidden="true"><line x1="1" y1="4" x2="27" y2="4" stroke="' + col + '" stroke-width="1.8" stroke-dasharray="' + DASHES[si % DASHES.length].join(' ') + '"/>' +
        markSvg(MARKS[si % MARKS.length], col, true) + '</svg>' + esc(name) + '</span>';
    };
    if (same && info.styles[ks[0]].length > 1) html = info.styles[ks[0]].map(function (n, i) { return item(n, i, cssVar('--ink-2')); }).join('');
    else if (ks.length) html = ks.filter(function (k) { return k !== '_pooled'; }).map(function (k) {
      var col = k === '_pooled' ? cssVar('--pooled') : colorOf(card, k);
      return '<span class="sk-row"><b>' + esc(studyLabel(card, k, false)) + '</b>' + info.styles[k].map(function (n, i) { return item(n || 'all', i, col); }).join('') + '</span>';
    }).join('');
    if (info.steps) html += '<span class="steps-key">' + Object.keys(info.steps).sort(function (a, b) { return a - b; }).map(function (k) {
      return '<b>' + esc(k) + '</b> ' + esc(info.steps[k]);
    }).join(' · ') + '</span>';
    return html;
  }
  // one short line under a figure: what each mark means
  function encLine(info, card) {
    var ink = cssVar('--ink-2'), e = info.encs, bits = [];
    if (e.sd || e.range && !e.median) bits.push(encGlyph('sd', ink) + 'mean ± SD' + (e.range ? ' (or [min–max])' : ''));
    if (e.band) bits.push(encGlyph('band', ink) + 'mean with min–max corridor (specimen range, no SD)');
    if (e.median) bits.push(encGlyph('median', ink) + (e.medR ? 'median [min–max]' : 'median'));
    if (e.point) bits.push(encGlyph('point', ink) + 'single value, no spread reported');
    if (e.pooled) bits.push(encGlyph('pooled', cssVar('--pooled')) + 'pooled mean ± SD (n-weighted)');
    if (e.models) bits.push(encGlyph('models', cssVar('--muted')) + 'published models: range across models (not data; never pooled or scored)');
    if (info.sets.some(function (l) { return l.sec; })) bits.push(encGlyph('sd', ink, null, true) + 'secondary source (values read from a review)');
    if (info.tr) bits.push('<b>↔</b>' + esc('force-controlled tests: ' + info.tr.x + ' measured at a set ' + info.tr.y + ', drawn transposed (SD as horizontal bar)'));
    return bits.map(function (b) { return '<span>' + b + '</span>'; }).join('');
  }

  // ---------- home ----------
  var VORD = (function () { var o = {}, i = 0; ['C', 'T', 'L', 'S'].forEach(function (r) { var n = r === 'C' ? 7 : r === 'T' ? 12 : r === 'L' ? 5 : 5; for (var k = 1; k <= n; k++) o[r + k] = i++; }); return o; })();
  // "L4-L5, L3-L4" -> "L3–L5"; falls back to the first level text
  function levelRange(levels) {
    var toks = [];
    (levels || []).forEach(function (l) { (String(l).match(/\b[CTLS]\d{1,2}\b/g) || []).forEach(function (t) { if (VORD[t] != null) toks.push(t); }); });
    if (!toks.length) return (levels || [])[0] || '';
    toks.sort(function (a, b) { return VORD[a] - VORD[b]; });
    var lo = toks[0], hi = toks[toks.length - 1];
    return lo === hi ? lo : lo + '–' + hi;
  }
  function shortTitle(t, domain) {
    return String(t).replace(/\s+in vivo$/i, '');
  }
  function heroStats(c) {
    return '<p class="hero-stats">' + [[c.benchmarks, 'benchmarks'], [c.tasks, 'tasks'], [c.studies, 'studies, selected from over 300 papers'], [c.N, 'subjects and specimens']]
      .map(function (x) { return '<span><b class="num">' + esc(x[0] == null ? '–' : Number(x[0]).toLocaleString('en')) + '</b> ' + x[1] + '</span>'; }).join('') + '</p>';
  }
  function benchTile(b) {
    var sc = schematicFor(b.id);
    if (!sc) {
      var vk = Object.keys(S.schem || {}).filter(function (k) { return k.indexOf(b.id + '/') === 0; })[0];
      if (vk) sc = schemSrc(S.schem[vk]);
    }
    var rg = levelRange(b.levels);
    return '<a class="tile" href="#b/' + enc(b.id) + '">' +
      '<span class="tile-pic" data-schem-box>' + (sc ? '<img data-schem src="' + esc(sc.src) + '" alt="" loading="lazy">' : '') + '</span>' +
      '<span class="tile-body">' +
        '<span class="tile-top"><b>' + esc(shortTitle(b.title, b.domain)) + exTag(b.example) + '</b>' + (rg ? '<span class="lvl">' + esc(rg) + '</span>' : '') + '</span>' +
        ((b.views && b.views.length) ? '<span class="tile-sum">' + esc(b.views.length > 4 ? b.views.slice(0, 4).join(' · ') + ' · +' + (b.views.length - 4) + ' more' : b.views.join(' · ')) + '</span>' : (b.summary ? '<span class="tile-sum">' + esc(b.summary) + '</span>' : '')) +
        '<span class="tile-meta num"><span>' + plural(b.studies, 'study', 'studies') + '</span><span>N ' + esc(b.N) + '</span>' +
          (b.years && b.years.length ? '<span>' + yearsText(b.years) + '</span>' : '') + '</span>' +
      '</span></a>';
  }
  var CITE = 'Ghezelbash F. SpineBench: validation benchmarks for spine models. 2026. https://farghea.github.io/SpineBench/';
  function citeHtml(cls) {
    return '<div class="cite' + (cls ? ' ' + cls : '') + '"><b>How to cite</b><span class="cite-text">' + esc(CITE) + '</span>' +
      '<button type="button" class="cite-copy" data-cite="1">Copy</button>' +
      '<span class="cite-note">Please also cite the original studies behind the values you use.</span></div>';
  }
  function viewHome() {
    var I = S.index, c = I.counts || {};
    setTitle('');
    var html = '<section class="hero"><div class="hero-main"><h1>Put your spine model on the bench.</h1>' +
      '<p class="lede">Experimental outcomes every spine model should reproduce, from ' + esc(c.studies) + ' studies, each value traced to its table or figure.</p>' +
      heroStats(c) + '<p class="byline">By <a href="https://sites.google.com/view/farshidghezelbash/home" target="_blank" rel="noopener">Farshid Ghezelbash</a> · for research use only</p>' + citeHtml('cite-hero') + '</div>' +
      '<ol class="how"><li><b>Pick a benchmark</b><span>one outcome, e.g. lumbar disc pressure</span></li>' +
      '<li><b>Simulate its tasks</b><span>subject, loads and boundary conditions are given</span></li>' +
      '<li><b>Or give it to your agent</b><span><a href="#agents">download the dataset</a> and let your agent simulate it</span></li></ol></section>';
    DOMAINS.forEach(function (d) {
      var items = I.benchmarks.filter(function (b) { return b.domain === d.id; });
      if (!items.length) return;
      html += '<section class="sec"><div class="sec-head"><h2>' + esc(d.label) + '</h2><span class="count">' + items.length + '</span><p>' + esc(d.blurb) + '</p></div><div class="tiles">' +
        items.map(benchTile).join('') + '</div></section>';
    });
    var other = I.benchmarks.filter(function (b) { return !DOMAINS.some(function (d) { return d.id === b.domain; }); });
    if (other.length) html += '<section class="sec"><div class="sec-head"><h2>Other</h2></div><div class="tiles">' + other.map(benchTile).join('') + '</div></section>';
    html += '<section class="sec soon"><div class="sec-head"><h2>Coming next</h2><p>Model inputs and properties</p></div><div class="soon-row">' +
      COMING.map(function (t) { return '<span class="soon-chip">' + esc(t) + '</span>'; }).join('') + '</div></section>';
    main.innerHTML = html;
    wireSchemImgs(main);
  }

  // ---------- benchmark page ----------
  function viewBench(id, viewId) {
    var meta = S.index.benchmarks.filter(function (b) { return b.id === id; })[0];
    if (!meta) return notFound('There is no benchmark "' + id + '".');
    main.innerHTML = '<p class="loading">Loading ' + esc(meta.title) + '</p>';
    return fetchJSON('data/outcomes/' + enc(meta.file) + '.json').then(function (card) {
      prep(card);
      if (S.card !== card) { S.off = {}; S.offP = {}; S.bw = false; S.hidePooled = false; S.hideModels = false; }
      S.card = card;
      S.viewId = card.views.some(function (v) { return v.id === viewId; }) ? viewId : (card.views[0] || {}).id;
      renderBench(card, meta);
    });
  }
  function renderBench(card, meta) {
    setTitle(card.title);
    var ex = !!card.example;
    var dom = (DOMAINS.filter(function (d) { return d.id === card.domain; })[0] || {}).label || card.domain;
    var lvTxt = card.levels.length > 4 ? card.levels[0] + ' … ' + card.levels[card.levels.length - 1] + ' (' + card.levels.length + ' levels)' : card.levels.join(', ');
    var line = [lvTxt, plural(card.studies.length, 'study', 'studies'), 'N ' + meta.N, yearsText(meta.years)].filter(Boolean);
    var html = '<div class="bhead"><nav class="crumbs" aria-label="Breadcrumb"><a href="#">Benchmarks</a><span aria-hidden="true">/</span><span>' + esc(dom) + '</span></nav>' +
      '<div class="bhead-row"><h1>' + esc(card.title) + exTag(ex) + ' <span class="bmeta num">' + line.map(esc).join(' · ') + '</span></h1>' +
      '<div class="btns">' +
      '<button class="btn primary" type="button" id="copy-prompt" title="Copy a prompt that asks an agent to run this benchmark">' + ICON_COPY + '<span>Copy agent prompt</span></button>' +
      dlBtn('data/outcomes/' + enc(meta.file) + '.json', 'JSON') + dlBtn('data/outcomes/' + enc(meta.file) + '.csv', 'CSV') +
      '</div></div></div>';
    if (card.views.length > 1) {
      // views may carry a "group" (e.g. "ROM vs moment, one direction"): tabs and menu are grouped under it
      var groups = [], byG = {};
      card.views.forEach(function (v) { var g = v.group || ''; if (!byG[g]) { byG[g] = []; groups.push(g); } byG[g].push(v); });
      var grouped = groups.some(Boolean);
      var many = card.views.length > (grouped ? 30 : 10); // a long row of tabs pushes the chart down: use a menu instead
      var tabBtn = function (v) {
        var on = v.id === S.viewId;
        return '<button type="button" role="tab" class="tab' + (v.overview ? ' tab-ov' : '') + (v.layout === 'panels' ? ' tab-fig' : '') + '" data-view="' + esc(v.id) + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' + esc(v.title || v.id) + '</button>';
      };
      var opt = function (v) { return '<option value="' + esc(v.id) + '"' + (v.id === S.viewId ? ' selected' : '') + '>' + esc(v.title || v.id) + '</option>'; };
      html += (many ? '' : grouped ? '<div class="tabs tabs-grouped" role="tablist" aria-label="Views">' + groups.map(function (g) {
          return '<div class="tab-group"><span class="tg-h">' + esc(g || 'Other') + '</span><span class="tg-tabs">' + byG[g].map(tabBtn).join('') + '</span></div>';
        }).join('') + '</div>' : '<div class="tabs" role="tablist" aria-label="Views">' + card.views.map(tabBtn).join('') + '</div>') +
        '<label class="view-select' + (many ? ' always' : '') + '"><span class="' + (many ? 'vs-h' : 'sr') + '">View <small>' + card.views.length + '</small></span><select id="view-select">' +
        (grouped ? groups.map(function (g) { return '<optgroup label="' + esc(g || 'Other') + '">' + byG[g].map(opt).join('') + '</optgroup>'; }).join('') : card.views.map(opt).join('')) +
        '</select></label>';
    }
    html += '<section id="view-body" class="viz" aria-live="polite"></section>';
    if (card.simulate.length || Object.keys(card.subjects).length || card.summary) {
      html += '<details class="panel fold-panel howto"><summary><h2>How to simulate this</h2></summary>' +
        (card.summary ? '<p class="lede">' + esc(card.summary) + '</p>' : '') +
        (card.simulate.length ? '<ol class="steps">' + card.simulate.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '') +
        subjectTable(card) + '</details>';
    }
    html += '<details class="panel fold-panel"' + (card.studies.length <= 8 ? ' open' : '') + '><summary><h2>Studies <span class="count">' + card.studies.length + '</span></h2></summary>' + studiesTable(card) + '</details>';
    if (card.notes.length) html += '<section class="panel"><h2>Notes</h2><ul class="notes">' + card.notes.slice(0, 3).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></section>';
    main.innerHTML = '<div class="stack">' + html + '</div>';
    // prefetch the full agent record (tasks, subjects, answer format; no answers) so the copy below is instant
    if (!card._agent) fetchJSON('data/agent/' + encodeURIComponent(card.id) + '.json').then(function (a) { card._agent = a; }, function () { /* fall back to the prompt only */ });

    $('#copy-prompt').addEventListener('click', function () {
      var label = $('span', this), btns = this.parentNode, text = agentPrompt(card);
      copyText(text).then(function () {
        label.textContent = 'Copied';
        setTimeout(function () { label.textContent = 'Copy agent prompt'; }, 1600);
      }, function () { // no clipboard access: show the prompt to copy by hand
        var box = $('#prompt-box');
        if (!box) {
          box = document.createElement('textarea');
          box.id = 'prompt-box'; box.className = 'prompt-box'; box.readOnly = true; box.rows = 6;
          box.setAttribute('aria-label', 'Agent prompt');
          btns.parentNode.parentNode.appendChild(box);
        }
        box.value = text; box.focus(); box.select();
        label.textContent = 'Select and copy below';
      });
    });
    var sel = $('#view-select');
    if (sel) sel.addEventListener('change', function () { selectView(card, sel.value); });
    $$('.tab', main).forEach(function (b) {
      b.addEventListener('click', function () { selectView(card, b.getAttribute('data-view')); });
      b.addEventListener('keydown', function (e) {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        var tabs = $$('.tab', main), i = tabs.indexOf(b) + (e.key === 'ArrowRight' ? 1 : -1);
        var t = tabs[(i + tabs.length) % tabs.length]; t.focus(); t.click();
      });
    });
    renderView(card);
  }
  function selectView(card, vid) {
    S.viewId = vid;
    $$('.tab', main).forEach(function (b) {
      var on = b.getAttribute('data-view') === vid;
      b.setAttribute('aria-selected', String(on)); b.setAttribute('tabindex', on ? '0' : '-1');
    });
    var sel = $('#view-select'); if (sel && sel.value !== vid) sel.value = vid;
    try { history.replaceState(null, '', '#b/' + enc(card.id) + '/' + enc(vid)); } catch (e) { /* ignore */ }
    renderView(card);
  }
  function agentPrompt(card) {
    var a = card._agent;
    if (a) { // the full benchmark record: prompt, simulate steps, subjects, studies, tasks, answer format (never the answers)
      return (a.agent_prompt || card.agent_prompt || '') + '\n\nBenchmark "' + (a.title || card.title) +
        '" as JSON (tasks, inputs, subjects and the answer format; return one JSON object following answer_format):\n' + JSON.stringify(a);
    }
    var p = card.agent_prompt || card.summary || '';
    if (card.answer_format && Object.keys(card.answer_format).length) p += '\n\nAnswer format (JSON, one entry per task):\n' + JSON.stringify(card.answer_format);
    return p;
  }
  function subjectTable(card) {
    var keys = Object.keys(card.subjects);
    if (!keys.length) return '';
    var std = [['sex', 'Sex'], ['age', 'Age (y)'], ['height_cm', 'Height (cm)'], ['weight_kg', 'Weight (kg)'], ['disc_area_mm2', 'Disc area (mm²)']];
    var extra = [];
    keys.forEach(function (k) {
      var s = card.subjects[k] || {};
      Object.keys(s).forEach(function (f) { if (!std.some(function (x) { return x[0] === f; }) && extra.indexOf(f) < 0 && !/^_/.test(f)) extra.push(f); });
    });
    var cols = std.filter(function (c) { return keys.some(function (k) { return (card.subjects[k] || {})[c[0]] != null; }); })
      .concat(extra.slice(0, 4).map(function (f) { return [f, upperFirst(human(f))]; }));
    var nStd = cols.length - Math.min(extra.length, 4);
    var UNITS = { age: ' y', height_cm: ' cm', weight_kg: ' kg', disc_area_mm2: ' mm²' };
    var val = function (v) {
      if (v == null || v === '') return '–';
      if (Array.isArray(v)) return esc(v.join(', '));
      if (typeof v === 'object') return esc(Object.keys(v).map(function (k) {
        var x = v[k], xs = isNum(x) ? fmt(x) : typeof x === 'object' ? JSON.stringify(x) : String(x);
        return UNITS[k] ? xs + UNITS[k] : human(k) + ' ' + xs;
      }).join(', '));
      return esc(isNum(v) ? fmt(v) : v);
    };
    var order = card.studies.map(function (s) { return s.key; }).filter(function (k) { return card.subjects[k]; });
    keys.forEach(function (k) { if (order.indexOf(k) < 0) order.push(k); });
    return '<h3 class="sub-h">Subjects</h3><div class="table-wrap"><table class="compact"><thead><tr><th>Study</th>' +
      cols.map(function (c, i) { return '<th class="' + (c[0] === 'sex' || i >= nStd ? '' : 'r') + '">' + esc(c[1]) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      order.map(function (k) {
        var s = card.subjects[k] || {};
        return '<tr><td class="nowrap"><span class="sw" style="background:' + swatch(card, k) + '"></span>' + esc(studyLabel(card, k, true)) + '</td>' +
          cols.map(function (c, i) { return '<td class="' + (c[0] === 'sex' ? '' : i >= nStd ? 'wide' : 'r num') + '">' + val(s[c[0]]) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table></div>';
  }
  function studiesTable(card) {
    var rows = card.studies.slice().sort(function (a, b) { return (a.year || 0) - (b.year || 0) || String(a.short).localeCompare(String(b.short)); });
    var anyLoad = rows.some(function (s) { return s.loading; });
    return '<div class="table-wrap"><table class="compact"><thead><tr><th>Study</th><th class="r">Year</th><th class="r">n</th><th>Sample</th>' + (anyLoad ? '<th>Loading</th>' : '') + '<th>DOI</th></tr></thead><tbody>' +
      rows.map(function (s) {
        return '<tr><td class="study"><span class="sw" style="background:' + swatch(card, s.key) + '"></span><b class="nowrap">' + esc(s.short || s.key) + '</b>' +
          (s.secondary ? ' <span class="tag" title="Value compiled in a review; the primary study is not in this benchmark">secondary</span>' : '') +
          (s.pool === false ? ' <span class="tag" title="Shown, but not part of the pooled value">not pooled</span>' : '') + '</td>' +
          '<td class="r num">' + esc(s.year || '') + '</td><td class="r num">' + esc(s.n == null ? '–' : s.n) + '</td>' +
          '<td class="wide">' + esc(s.sample || '') + '</td>' + (anyLoad ? '<td class="wide loading-td">' + esc(s.loading || '') + '</td>' : '') +
          '<td class="doi">' + doiLink(s.doi, card.example) + '</td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  // patient table: legend and filter for per-patient values (cards with "patients")
  function patientTable(card, tasks) {
    if (!card._pkeys.length) return '';
    var used = {};
    tasks.forEach(function (t) { t.refs.forEach(function (r) { if (r._p) used[r._p] = 1; }); });
    var cols = [['sex', 'Sex', ''], ['age', 'Age', ' y'], ['weight_kg', 'Weight', ' kg'], ['implant_level', 'Implant', '']].filter(function (c) {
      return card._pkeys.some(function (k) { return (card.patients[k] || {})[c[0]] != null; });
    });
    return '<div class="ptable"><h3 class="sub-h">Patients</h3><table class="compact"><thead><tr><th>Show</th>' + cols.map(function (c) { return '<th>' + c[1] + '</th>'; }).join('') + '</tr></thead><tbody>' +
      card._pkeys.map(function (k) {
        var p = card.patients[k] || {}, on = !S.offP[k];
        return '<tr class="' + (used[k] ? '' : 'unused') + '"><td><label class="pchk"><input type="checkbox" data-patient="' + esc(k) + '"' + (on ? ' checked' : '') + '> ' + esc(k) + '</label></td>' +
          cols.map(function (c) { var v = p[c[0]]; return '<td class="nowrap">' + (v == null ? '–' : esc(isNum(v) ? fmt(v) + c[2] : v)) + '</td>'; }).join('') + '</tr>';
      }).join('') + '</tbody></table>' +
      '<p class="hint">Per-patient values only. Untick to leave a patient out of the chart, table and pooled value.</p></div>';
  }

  // study chips = legend and filter; in panel figures each chip shows how that study's spread is drawn (opts.enc)
  function chipsHtml(card, studies, anyPooled, opts) {
    opts = opts || {};
    return '<div class="chips' + (opts.enc ? ' chips-fig' : '') + '" role="group" aria-label="Show or hide studies">' + studies.map(function (k) {
      var np = noPool(card, k), s = card._study[k] || {}, op = openMark(card, k);
      var sw = opts.enc ? encGlyph(opts.enc(k), swatch(card, k), null, op) :
        '<span class="sw' + (op ? ' hollow' : '') + '" style="--c:' + swatch(card, k) + ';background:' + swatch(card, k) + '"></span>';
      var extra = opts.suffix ? opts.suffix(k) : '';
      var tip = [s.loading ? 'Loading: ' + s.loading : '', s.sample || '', s.secondary ? 'secondary source (via a review)' : '', np ? 'not pooled' : ''].filter(Boolean).join('\n');
      return '<button type="button" class="chip" data-study="' + esc(k) + '" aria-pressed="' + !S.off[k] + '" title="' + esc(tip) + '">' +
        sw + esc(legendName(card, k)) + (extra ? '<span class="cx">' + esc(extra) + '</span>' : '') +
        (s.n != null ? '<span class="cn">n=' + esc(s.n) + '</span>' : '') + '</button>';
    }).join('') + (anyPooled ? '<button type="button" class="chip chip-pooled" data-study="_pooled" aria-pressed="' + !S.hidePooled + '">' +
      (opts.enc ? encGlyph('pooled', 'var(--pooled)') : '<span class="sw sw-pooled"></span>') + 'Pooled</button>' : '') +
      (opts.models ? '<button type="button" class="chip chip-models" data-study="_models" aria-pressed="' + !S.hideModels + '" title="Range across published models. Not experimental data; never pooled or scored.">' +
        encGlyph('models', 'var(--muted)') + esc(opts.models) + '</button>' : '') + '</div>';
  }
  // under each figure: what load each study applied (study "loading"); studies without it are left out
  function loadingHtml(card, studies) {
    var ks = studies.filter(function (k) { return card._study[k] && card._study[k].loading; });
    if (!ks.length) return '';
    return '<div class="loadlist"><span class="ll-h">Loading</span><ul>' + ks.map(function (k) {
      return '<li' + (S.off[k] ? ' class="off"' : '') + '><span class="sw' + (openMark(card, k) ? ' hollow' : '') + '" style="--c:' + swatch(card, k) + ';background:' + swatch(card, k) + '"></span>' +
        '<b>' + esc(studyLabel(card, k, false)) + '</b> ' + esc(card._study[k].loading) + '</li>';
    }).join('') + '</ul></div>';
  }
  function schemBlock(card, v) {
    var sc = schematicFor(card.id, v.id === '_activity' ? null : v.id);
    if (!sc) return '';
    var open = true; // the set-up schematic is always shown (owner request); it can still be folded by hand
    return '<details class="schem" data-schem-box' + (open ? ' open' : '') + '><summary>Schematic</summary>' +
      '<figure><img data-schem src="' + esc(sc.src) + '"' + (sc.fallback ? ' data-fallback="' + esc(sc.fallback) + '"' : '') + ' alt="Schematic of the test set-up' + (sc.cap ? ': ' + esc(sc.cap) : '') + '">' +
      (sc.cap ? '<figcaption>' + esc(sc.cap) + '</figcaption>' : '') + '</figure></details>';
  }

  function renderView(card) {
    destroyCharts();
    var body = $('#view-body');
    if (!body) return;
    var v = card.views.filter(function (x) { return x.id === S.viewId; })[0];
    if (!v) { body.innerHTML = '<p class="empty">This benchmark has no tasks yet.</p>'; return; }
    var tasks = v.task_ids.map(function (id) { return card._task[id]; });
    var studies = viewStudies(card, tasks);
    var anyPooled = tasks.some(function (t) { return t.pooled; });
    var outs = uniq(tasks.map(function (t) { return t.output || ''; }));
    var xKey = v.x && String(v.x).indexOf('input:') === 0 ? String(v.x).slice(6) : null;
    if (xKey && !v.transpose && !tasks.some(function (t) { return xNum(t.inputs[xKey]) != null; })) xKey = null;
    var panelMode = (v.layout === 'panels' || !!v.transpose) && !!xKey && !v.overview; // a transposed view is drawn as a (one-panel) figure
    var bwAble = !v.overview && !panelMode && outs.some(function (o) { return canBW(card, o); });
    var side = schemBlock(card, v) + patientTable(card, tasks);
    var main1;
    if (panelMode) return renderPanelView(card, v, tasks, studies, anyPooled, outs, xKey, body, side);
    if (v.overview) main1 = '<div id="overview"></div>';
    else main1 = outs.map(function (o, i) {
      var def = (card._output[o] || {}).definition, vnote = i === 0 ? v.note : '';
      if (vnote && def && (def.indexOf(vnote) >= 0 || vnote.indexOf(def) >= 0)) { if (vnote.length > def.length) def = vnote; vnote = ''; }
      return '<div class="chart-wrap"><div class="chart-head"><h2 class="chart-title">' + esc(outLabel(card, o)) +
        (unitOf(card, o) ? ' <span class="unit">' + esc(unitOf(card, o)) + '</span>' : '') + '</h2>' +
        (i === 0 && bwAble ? '<div class="seg" role="group" aria-label="Force units"><button type="button" data-bw="0" aria-pressed="' + !S.bw + '">N</button>' +
          '<button type="button" data-bw="1" aria-pressed="' + S.bw + '" title="Derived: force ÷ (body weight × 9.81)">% body weight</button></div>' : '') +
        '</div>' + (def ? '<p class="def">' + esc(def) + '</p>' : '') + (vnote ? '<p class="def">' + esc(vnote) + '</p>' : '') +
        '<div class="chart-box' + (outs.length > 1 ? ' short' : '') + '" id="chart-' + i + '"></div><div class="series-key" id="skey-' + i + '"></div></div>';
    }).join('');
    body.innerHTML = chipsHtml(card, studies, anyPooled) +
      '<div class="viz-grid' + (side ? ' has-side' : '') + '"><div class="viz-main">' + main1 + '<p class="chart-cap" id="chart-cap"></p>' + (v.overview ? '' : loadingHtml(card, studies)) + '</div>' +
      (side ? '<aside class="viz-side">' + side + '</aside>' : '') + '</div>' +
      (v.overview ? '' : whatLine(card, tasks, outs, xKey, v.x_title)) + '<div id="task-table"></div>';
    wireSchemImgs(body);
    var flags = { kinds: {}, median: false, range: false, hollow: false, derived: false };
    if (v.overview) renderOverview(card, tasks, $('#overview', body), flags);
    else outs.forEach(function (o, i) {
      var ts = tasks.filter(function (t) { return (t.output || '') === o; });
      var unit = unitOf(card, o), yTitle = axisTitle(card, o);
      if (bwOn(card, o)) flags.derived = true;
      var box = $('#chart-' + i, body), info;
      if (xKey && ts.some(function (t) { return xNum(t.inputs[xKey]) != null; })) {
        info = drawCurves(box, card, ts, xKey, unit, yTitle, v.series, v.x_title);
        if (info) $('#skey-' + i, body).innerHTML = seriesKeyHtml(info);
      } else info = drawBars(box, card, ts, unit, yTitle);
      if (info) {
        flags.kinds[info.kind] = 1;
        if (info.kind === 'curves') { if (info.colorBySeries && info.series.length > 1) flags.seriesColor = true; if (info.series.length > 1) flags.multiSeries = true; }
        info.sets.forEach(function (d) {
          if (d.hollow && noPool(card, d.key)) flags.hollow = true;
          if (d.key && isSec(card, d.key)) flags.sec = true;
          (d.vals || d.pts || []).forEach(function (x) { if (x) { if (x.kind === 'median') flags.median = true; if (x.err === 'range') flags.range = true; } });
        });
      }
    });
    $('#chart-cap', body).innerHTML = capText(flags, v.overview);
    if (!v.overview) {
      var tt = taskTable(card, tasks, studies, xKey);
      // curves: the chart already shows every point; keep the long table folded
      $('#task-table', body).innerHTML = xKey || tasks.length > 12 ? '<details class="fold values-fold"><summary>Values <span class="muted">(' + plural(tasks.length, xKey ? 'point' : 'task') + ')</span></summary>' + tt + '</details>' : tt;
    }
    wireView(card, body);
  }
  // small-multiple figure: caption title, shared legend (chips), panel grid, one line on the encoding
  function renderPanelView(card, v, tasks, studies, anyPooled, outs, xKey, body, side) {
    var encMap = {};
    studies.forEach(function (k) { encMap[k] = studyEnc(card, tasks, k); });
    var mods = Array.isArray(v.models) && v.models.length ? (v.models[0].label || 'Published models') : '';
    var defs = uniq(outs.map(function (o) { return (card._output[o] || {}).definition || ''; }).filter(Boolean));
    var note = v.note || (defs.length === 1 ? defs[0] : '');
    body.innerHTML = '<div class="fig-wrap"><div class="chart-head"><h2 class="chart-title fig-title">' + esc(v.title || v.id) + '</h2></div>' +
      (note ? '<p class="def">' + esc(note) + '</p>' : '') +
      chipsHtml(card, studies, anyPooled, { enc: function (k) { return encMap[k]; }, models: mods, suffix: function (k) { return studySuffix(card, v, tasks, k); } }) +
      '<div class="fig" id="fig"><p class="loading">Drawing</p></div><div class="series-key" id="skey-p"></div><p class="enc" id="enc"></p><p class="chart-cap" id="chart-cap"></p>' +
      loadingHtml(card, studies) + '</div>' +
      (side ? '<div class="fig-side">' + side + '</div>' : '') +
      whatLine(card, tasks, outs, xKey, v.x_title, v) + '<div id="task-table"></div>';
    wireSchemImgs(body);
    var tok = S.drawTok = (S.drawTok || 0) + 1;
    var draw = function (models) {
      if (tok !== S.drawTok || !document.body.contains(body)) return;
      var fig = $('#fig', body), info = drawPanels(fig, card, v, tasks, xKey, models);
      if (info) {
        $('#skey-p', body).innerHTML = panelKeyHtml(info, card);
        $('#enc', body).innerHTML = encLine(info, card);
        // legend glyphs: how each study was actually drawn (corridor only where it has a range over several x values)
        var rank = { sd: 5, band: 4, median: 3, range: 2, point: 1 }, best = {};
        info.sets.forEach(function (l) { if (!l.pooled && (!best[l.key] || rank[l.enc] > rank[best[l.key]])) best[l.key] = l.enc; });
        Object.keys(best).forEach(function (k) {
          var chip = $('.chip[data-study="' + k.replace(/"/g, '') + '"]', body), g = chip && $('.eg', chip);
          if (g && best[k] !== encMap[k]) g.outerHTML = encGlyph(best[k], swatch(card, k), null, openMark(card, k));
        });
        var bits = [];
        if (info.sets.some(function (l) { return l.np; })) bits.push('Open markers of a study marked “not pooled”: shown, not pooled.');
        if (anyOn(S.off) || anyOn(S.offP)) bits.push('<b>Pooled recomputed for your selection.</b>');
        $('#chart-cap', body).innerHTML = bits.join(' ');
      }
    };
    loadModels(v).then(draw, function () { draw([]); });
    var tt = taskTable(card, tasks, studies, xKey);
    $('#task-table', body).innerHTML = '<details class="fold values-fold"><summary>Values <span class="muted">(' + plural(tasks.length, 'point') + ')</span></summary>' + tt + '</details>';
    wireView(card, body);
  }
  function wireView(card, body) {
    $$('.chip', body).forEach(function (c) {
      c.addEventListener('click', function () {
        var k = c.getAttribute('data-study');
        if (k === '_pooled') S.hidePooled = !S.hidePooled; else if (k === '_models') S.hideModels = !S.hideModels; else S.off[k] = !S.off[k];
        rerender(card, '[data-study="' + k + '"]');
      });
    });
    $$('input[data-patient]', body).forEach(function (c) {
      c.addEventListener('change', function () { S.offP[c.getAttribute('data-patient')] = !c.checked; rerender(card, '[data-patient="' + c.getAttribute('data-patient') + '"]'); });
    });
    $$('.seg button', body).forEach(function (b) {
      b.addEventListener('click', function () { S.bw = b.getAttribute('data-bw') === '1'; rerender(card, '.seg [data-bw="' + b.getAttribute('data-bw') + '"]'); });
    });
    $$('[data-goto]', body).forEach(function (b) {
      b.addEventListener('click', function () { selectView(card, b.getAttribute('data-goto')); var t = $('.viz', main); if (t) t.scrollIntoView({ block: 'start' }); });
    });
  }
  function rerender(card, focusSel) {
    var y = window.scrollY;
    renderView(card);
    window.scrollTo(0, y);
    var again = $(focusSel, $('#view-body'));
    if (again) again.focus({ preventScroll: true });
  }
  function capText(f, overview) {
    var bits = [];
    if (overview) bits.push('Headline value per task: the pooled mean of all studies (weighted by n), else the middle of the study values. Click a task to see every study.');
    else if (f.kinds.curves && !f.kinds.bars && !f.kinds.dots) bits.push((f.seriesColor ? 'Colour and marker = series' : 'Colour = study' + (f.multiSeries ? ', line style and marker = series' : '')) +
      '; mean ± SD at each point. ◇ = pooled mean of all studies (weighted by n).');
    else if (f.kinds.bars && !f.kinds.dots) bits.push('Each bar = one study’s mean (± SD). Outlined grey bar = pooled mean of all studies (weighted by n).');
    else bits.push('Each dot = one study’s mean (± SD). ◇ = pooled mean of all studies (weighted by n).');
    if (f.median || f.range) bits.push('[min–max] for medians and individual subjects; medians are not pooled.');
    if (f.hollow) bits.push('Hollow = shown, not pooled.');
    if (f.sec) bits.push('Hollow / dashed = secondary source (values read from a review).');
    if (f.derived) bits.push('% body weight is derived: force ÷ (weight × 9.81), using each patient’s or cohort’s weight.');
    if (anyOn(S.off) || anyOn(S.offP)) bits.push('<b>Pooled recomputed for your selection.</b>');
    return bits.join(' ');
  }
  // one line: what is fixed, what changes, what to report
  function whatLine(card, tasks, outs, xKey, xTitle, v) {
    var split = splitInputs(card, tasks, xKey ? [xKey] : []);
    var same = split.same.map(function (k) { return phrase(card, k, tasks[0].inputs[k]); }).filter(Boolean);
    var vary = split.vary.map(function (k) { return lowerFirst(inputLabel(card, k)); });
    var parts = [];
    if (same.length) parts.push('<span><b>Same for all:</b> ' + esc(same.join(', ')) + '</span>');
    var tr = v ? transposeOf(card, v, tasks) : null;
    var rangeTxt = function (lab, vals, u) { return lowerFirst(lab) + ' ' + withUnit(fmt(Math.min.apply(null, vals)), u) + ' to ' + withUnit(fmt(Math.max.apply(null, vals)), u); };
    if (xKey) {
      var xs = tasks.filter(function (t) { return !(tr && t.output === tr.output); }).map(function (t) { return xNum(t.inputs[xKey]); }).filter(isNum);
      var xd = card._input[xKey] || {};
      var xu = xTitle ? (/\(([^)]+)\)\s*$/.exec(xTitle) || [])[1] : xd.unit, xl = xTitle ? xTitle.replace(/\s*\([^)]*\)\s*$/, '') : inputLabel(card, xKey);
      if (xs.length) parts.push('<span><b>Sweep:</b> ' + esc(rangeTxt(xl, xs, xu)) + '</span>');
    }
    if (tr) { // force-controlled tasks: the applied load is the sweep
      var ys = tasks.filter(function (t) { return t.output === tr.output; }).map(function (t) { return trY(tr, t); }).filter(isNum);
      var yt = v.y_title || (/^in:/.test(tr.y) ? xAxisTitle(card, tr.y.slice(3)) : axisTitle(card, tr.y));
      if (ys.length) parts.push('<span><b>Set load:</b> ' + esc(rangeTxt(yt.replace(/\s*\([^)]*\)\s*$/, ''), ys, (/\(([^)]+)\)\s*$/.exec(yt) || [])[1])) + ' (report ' + esc(lowerFirst(outLabel(card, tr.output))) + ')</span>');
    }
    if (vary.length) parts.push('<span><b>Changes per task:</b> ' + esc(vary.join(', ')) + '</span>');
    parts.push('<span><b>Report:</b> ' + esc(outs.map(function (o) { return lowerFirst(axisTitle(card, o)); }).join(', ')) + '</span>');
    return '<p class="what"><span class="what-h">What to simulate</span>' + parts.join('') + '</p>';
  }
  function taskTable(card, tasks, studies, xKey) {
    var split = splitInputs(card, tasks);
    var vis = studies.filter(function (k) { return !S.off[k]; });
    var units = uniq(tasks.map(function (t) { return unitOf(card, t.output); }));
    var oneUnit = units.length === 1 ? units[0] : null;
    var rows = tasks.slice();
    if (xKey) {
      var sk = splitInputs(card, tasks, [xKey]).vary;
      var key = function (t) { return sk.map(function (k) { return String(t.inputs[k]); }).join('|'); };
      var order = uniq(tasks.map(key));
      rows.sort(function (a, b) { return order.indexOf(key(a)) - order.indexOf(key(b)) || (xNum(a.inputs[xKey]) || 0) - (xNum(b.inputs[xKey]) || 0); });
    }
    // inputs that differ between rows, as short phrases; skip what the task label already says
    var inp = rows.map(function (t) {
      var lab = String(t.label || '').toLowerCase();
      return split.vary.map(function (k) {
        var v = t.inputs[k];
        if (v == null || v === '' || v === 0) return '';
        if (typeof v === 'string' && lab.indexOf(shortVal(human(v)).toLowerCase()) >= 0) return '';
        if (isNum(v) && new RegExp('(^|[^0-9.])' + String(fmt(v)).replace('.', '\\.') + '([^0-9.]|$)').test(lab)) return '';
        return typeof v === 'string' ? shortVal(phrase(card, k, v)) : phrase(card, k, v);
      }).filter(Boolean).join(', ');
    });
    var full = rows.map(function (t) { return split.vary.map(function (k) { return phrase(card, k, t.inputs[k]); }).filter(Boolean).join(' · '); });
    var labels = shortLabels(rows);
    var showInp = inp.some(Boolean);
    var pools = rows.map(function (t) { return pooledValue(pooledFor(card, t)); });
    var showPool = pools.some(Boolean);
    var head = '<tr><th>Task</th>' + (showInp ? '<th>Inputs</th>' : '') + (showPool ? '<th class="r pooled-h">Pooled</th>' : '') +
      vis.map(function (k) {
        var np = noPool(card, k);
        return '<th class="r"' + (np ? ' title="Not part of the pooled value"' : '') + '><span class="sw' + (np ? ' hollow' : '') + '" style="--c:' + swatch(card, k) + ';background:' + swatch(card, k) + '"></span>' +
          esc(studyLabel(card, k, false)) + '</th>';
      }).join('') + '</tr>';
    var body = rows.map(function (t, ri) {
      var u = oneUnit ? '' : unitOf(card, t.output);
      var p = pools[ri];
      var shown = refsOf(card, t);
      return '<tr><td class="task" title="' + esc((t.label || '') + ' · task id: ' + t.id) + '">' + esc(labels[ri]) + '</td>' +
        (showInp ? '<td class="inp" title="' + esc(full[ri]) + '">' + esc(inp[ri]) + '</td>' : '') +
        (!showPool ? '' : '<td class="r num pooled">' + (p ? '<span class="val" title="' + esc(p.k + ' studies, n=' + p.N) + '">' + esc(describe(p, u)) + '</span>' : '<span class="muted">–</span>') + '</td>') +
        vis.map(function (k) {
          var refs = shown.filter(function (r) { return r.study === k; }).map(refValue).filter(Boolean);
          if (!refs.length) return '<td class="r muted">–</td>';
          var perP = refs.every(function (x) { return x.ref._p; });
          if (refs.length > 3 && !perP) { // many individual values: one compact line, all values in the tooltip
            var mv = firstRef(card, t, k);
            var all = refs.map(function (x) { return fmt(x.y); }).join(', ');
            return '<td class="r num"><span class="val" title="' + esc(refs.length + ' values: ' + all) + '">' +
              esc(fmtC(mv.y) + ' [' + fmt(mv.lo) + '–' + fmt(mv.hi) + ']') + (u ? ' <small>' + esc(u) + '</small>' : '') + '</span><span class="sub">mean of ' + refs.length + '</span></td>';
          }
          return '<td class="r num">' + refs.map(function (x) {
            var r = x.ref;
            var tip = [r.note, x.n != null ? 'n=' + x.n : '', r.exclude_from_pool ? 'not pooled' : '', r.test_id].filter(Boolean).join(' · ');
            return '<span class="val' + (r.exclude_from_pool ? ' np' : '') + '" title="' + esc(tip) + '">' + (r._p ? '<i class="pid">' + esc(r._p) + '</i>' : '') + esc(cellText(x)) + (u ? ' <small>' + esc(u) + '</small>' : '') + '</span>';
          }).join('') + '</td>';
        }).join('') + '</tr>';
    }).join('');
    return '<div class="table-head"><h2>Values</h2>' + (oneUnit ? '<span class="muted small">in ' + esc(oneUnit) + ' · mean ± SD unless marked · hover a task for its id</span>' : '<span class="muted small">mean ± SD unless marked · hover a task for its id</span>') + '</div>' +
      '<div class="table-wrap' + (rows.length > 14 ? ' tall' : '') + '"><table class="tasks compact"><thead>' + head + '</thead><tbody>' + body + '</tbody></table></div>';
  }

  // activity overview: tasks grouped by activity, one headline value each
  var ACTS = [
    ['Walking', /\bwalk/i], ['Lifting and holding', /\b(lift|lifting|hold|holding|crate|backpack|carry|weight)/i],
    ['Sitting', /\b(sit|sitting|seated|chair|stool|office)/i], ['Standing and lying', /\b(stand|standing|upright|lying|lie|supine|prone)/i],
    ['Exercises', /./]
  ];
  var ACT_ORDER = ['Standing and lying', 'Sitting', 'Walking', 'Lifting and holding', 'Exercises'];
  function activityOf(t) {
    var txt = (t.label || '') + ' ' + Object.keys(t.inputs).map(function (k) { return typeof t.inputs[k] === 'string' && !/ref/i.test(k) ? t.inputs[k] : ''; }).join(' ');
    for (var i = 0; i < ACTS.length; i++) if (ACTS[i][1].test(t.label || '')) return ACTS[i][0];
    for (var j = 0; j < ACTS.length; j++) if (ACTS[j][1].test(txt)) return ACTS[j][0];
    return 'Exercises';
  }
  function headline(card, t) {
    var p = pooledValue(pooledFor(card, t));
    if (p && !S.hidePooled) return { y: p.y, how: 'pooled, ' + p.k + ' studies' };
    var ys = viewStudies(card, [t]).filter(function (k) { return !S.off[k]; }).map(function (k) { return firstRef(card, t, k); }).filter(Boolean).map(function (x) { return x.y; }).sort(function (a, b) { return a - b; });
    if (!ys.length) return null;
    var m = ys.length % 2 ? ys[(ys.length - 1) / 2] : (ys[ys.length / 2 - 1] + ys[ys.length / 2]) / 2;
    return { y: m, how: ys.length === 1 ? '1 study' : 'middle of ' + ys.length + ' studies' };
  }
  function renderOverview(card, tasks, el, flags) {
    var groups = {};
    tasks.forEach(function (t) { var a = activityOf(t); (groups[a] = groups[a] || []).push(t); });
    var multiOut = uniq(tasks.map(function (t) { return t.output; })).length > 1;
    var viewOf = function (t) { var v = card.views.filter(function (x) { return !x.overview && x.task_ids.indexOf(t.id) >= 0; })[0]; return v ? v.id : ''; };
    el.innerHTML = '<div class="acts">' + ACT_ORDER.filter(function (a) { return groups[a]; }).map(function (a) {
      return '<section class="act"><h3>' + esc(a) + '</h3><ul>' + groups[a].map(function (t) {
        var h = headline(card, t), u = unitOf(card, t.output);
        return '<li><button type="button" data-goto="' + esc(viewOf(t)) + '" title="' + esc(outLabel(card, t.output)) + ' · show all studies">' +
          '<span class="al">' + esc(t.label || t.id) + (multiOut ? '<small>' + esc(outLabel(card, t.output)) + '</small>' : '') + '</span>' +
          '<span class="av num">' + (h ? esc(fmtC(h.y)) + ' <small>' + esc(u) + '</small>' : '–') + '</span></button></li>';
      }).join('') + '</ul></section>';
    }).join('') + '</div>';
    flags.kinds.overview = 1;
  }

  function viewAgents() {
    setTitle('For agents & models');
    var cut = function (x, n) { x = String(x || ''); return x.length > n ? x.slice(0, n) + '…' : x; };
    var shortJson = function (o) { return JSON.stringify(o, function (k, v) { return typeof v === 'string' && k !== 'agent_prompt' ? cut(v, 60) : v; }, 1); };
    var ex = S.index.agent_example, exText = '{"id": "...", "agent_prompt": "...", "tasks": [{"id": "...", "inputs": {}}]}';
    if (ex) {
      exText = shortJson({ id: ex.id, title: ex.title, agent_prompt: cut(ex.agent_prompt, 150), answer_format: ex.answer_format,
        subjects: ex.subjects, tasks: ex.tasks, more: 'simulate, inputs, outputs, studies' });
    }
    var exs = S.index.agent_example_sim, exSimText = '';
    if (exs && exs.simulations && exs.simulations.length) {
      var sim = exs.simulations[0];
      exSimText = shortJson({ id: exs.id, title: exs.title, agent_prompt: cut(exs.agent_prompt, 150),
        simulations: [{ id: sim.id, title: sim.title, fixed: sim.fixed, sweep: sim.sweep, outputs: (sim.outputs || []).slice(0, 2),
          studies: sim.studies, answer: sim.answer }], more: 'simulate, inputs, outputs, studies, the other simulations' });
    }
    main.innerHTML = '<div class="stack prose"><div><h1>For agents &amp; models</h1>' +
      '<p class="lede">Give an agent the simulations and tasks, keep the answers, then score its reply.</p></div>' +
      '<ul class="lines">' +
      '<li><b>Simulations</b> (finite element and tissue benchmarks): one simulation is one test a modeller runs once, e.g. a moment sweep of one specimen in one direction, or one stress-strain test of a tissue. All studies of that test are combined. The agent returns one curve per output, <code>[[x, y], …]</code> over the sweep (one number where there is no sweep).</li>' +
      '<li><b>Tasks</b> (musculoskeletal benchmarks): independent conditions (posture, load, subject), one number each, <code>{task id: {output: value}}</code>.</li>' +
      '<li><b>agent_tasks.jsonl</b>: one line per benchmark with the prompt, subjects, simulations or tasks, and the answer format. No reference values.</li>' +
      '<li><b>answers.json</b>: the hidden answers, <code>{"answers": {benchmark: {task: {refs, pooled}}}, "simulations": {benchmark: {simulation: {band, studies}}}}</code>. Keep it away from the agent.</li>' +
      '<li><b>benchmark.json</b>: every card in one file, tasks and answers together, for analysis.</li>' +
      '<li>A simulation passes when its curves lie inside the range spanned by the studies (the hull of all measured curves with their SD or range and small floors: for responses that only rise or only fall the band rises or falls with them, other responses use the convex hull of all points) at ≥ 80 % of the points. Removal steps are scored as % of your own intact model. A task passes inside the pooled value ± SD, or inside the range of at least half of its studies. Score = share of simulations and tasks passed. Also reported: the same score within 2 SD, every band edge moved out by one more SD (mean ± 2 SD; a min-max range by an SD estimated from the range and n; ± 50 % instead of ± 25 % for a value without spread; floors doubled), and for EMG the correlation (Pearson r) between your values and the measured means over all muscles and conditions of each study. Report results <b>by study</b> as well as by card: for each study, how many of its own values your model hits inside that study&rsquo;s spread (± SD and ± 2 SD) and, for EMG, its r (<code>score_agent.py --by-study</code>). Every value keeps its <code>test_id</code>.</li>' +
      '</ul>' +
      '<div class="btns">' + dlBtn('data/agent_tasks.jsonl', 'agent_tasks.jsonl', true) + dlBtn('data/answers.json', 'answers.json') + dlBtn('data/benchmark.json', 'benchmark.json') + '</div>' +
      (exSimText ? '<div><h2>Example 1: finite element benchmark, the answer is a curve</h2><pre class="code">' + esc(exSimText) + '</pre></div>' : '') +
      '<div><h2>Example' + (exSimText ? ' 2' : '') + ': musculoskeletal benchmark, the answer is one number per task</h2><pre class="code">' + esc(exText) + '</pre></div></div>';
  }
  function viewAbout() {
    setTitle('About');
    var c = S.index.counts || {};
    main.innerHTML = '<div class="stack prose"><div><img class="about-logo" src="assets/logo_full.svg" alt="SpineBench"><h1>About SpineBench</h1></div><ul class="lines">' +
      '<li>SpineBench collects published human measurements to validate musculoskeletal and finite element models of the thoracic and lumbar spine, for AI agents and for modellers: ' + esc(c.benchmarks) + ' outcome benchmarks, ' +
      esc(c.tasks) + ' tasks, ' + esc(c.studies) + ' studies.</li>' +
      '<li>A benchmark is one outcome (e.g. disc pressure, range of motion). A task is one condition a model can simulate; every study’s value for it is shown side by side.</li>' +
      '<li>Values come from tables and text, or were digitised from figures with the digitising uncertainty recorded. Each keeps a <code>test_id</code> that traces it to its table or figure.</li>' +
      '<li>An independent second pass re-checked values against the papers (<code>bench/VERIFICATION.md</code> in the repository).</li>' +
      '<li>Pooled value: n-weighted mean of studies that report a mean; SD combines within- and between-study spread; overlapping samples count once; medians are not pooled; at least two studies.</li>' +
      '<li>Created and maintained by <a href="https://sites.google.com/view/farshidghezelbash/home" target="_blank" rel="noopener">Farshid Ghezelbash</a>.</li>' +
      '<li>Licence: research and education use only (<a href="https://creativecommons.org/licenses/by-nc/4.0/" target="_blank" rel="noopener">CC BY-NC 4.0</a>). <b>Commercial use is not allowed.</b> For any other use, please <a href="https://sites.google.com/view/farshidghezelbash/home" target="_blank" rel="noopener">contact the author</a>. Downloads require accepting the <a href="#terms">Terms of use</a>.</li></ul>' +
      '<p class="small muted">Build ' + esc(S.index.generated || '') + '</p></div>';
  }
  function notFound(msg) {
    setTitle('Not found');
    main.innerHTML = '<h1>Page not found</h1><p class="lede">' + esc(msg) + '</p><p class="note"><a href="#">All benchmarks</a></p>';
  }
  function oldLink(kind, arg) { // links from the retired study/test explorer
    setTitle('Moved');
    var file = kind === 'test' && arg ? 'data/tests/' + arg.replace(/[^A-Za-z0-9._-]+/g, '_') + '.json' : null;
    main.innerHTML = '<h1>This page moved</h1><p class="lede">SpineBench is now organised by outcome benchmark.' +
      (file ? ' The raw file of this test is still at <a href="' + esc(file) + '">' + esc(file) + '</a>.' : '') +
      '</p><p class="note"><a href="#">All benchmarks</a> · <a href="data/all.json">all.json</a> · <a href="data/all.csv">all.csv</a></p>';
  }

  // ---------- router ----------
  function parseHash() {
    var raw = (location.hash || '').replace(/^#\/?/, '');
    var parts = raw.split('/').map(function (p) { try { return decodeURIComponent(p); } catch (e) { return p; } });
    return { page: parts[0] || 'home', arg: parts[1] || '', sub: parts.slice(2).join('/') };
  }

  // ---------- terms of use (accepted with a tick before any data download) ----------
  var TERMS_VERSION = '2026-11-12';
  var TERMS = [
    ['Research and education only', 'You may use SpineBench data, benchmark cards, schematics and code only for non-commercial research and education.'],
    ['No commercial use', 'Commercial use is not allowed. This includes using the data in, or to build, train, validate or market, any product, software, service or model that is sold or used commercially, and selling or licensing the data.'],
    ['Cite', 'Cite SpineBench (Ghezelbash F., SpineBench) and the original studies behind the values you use.'],
    ['Sharing', 'You may share the data with others only for non-commercial research or education, with these terms attached and with attribution.'],
    ['No warranty', 'Values were extracted from published studies and may contain errors. They are provided as is, without any warranty. Check them against the original papers.'],
    ['Other uses', 'For any other use, contact the author.']
  ];
  function termsAccepted() { try { return localStorage.getItem('sb-terms') === TERMS_VERSION; } catch (e) { return !!S.termsOk; } }
  function acceptTerms() { S.termsOk = true; try { localStorage.setItem('sb-terms', TERMS_VERSION); } catch (e) { /* private mode: remember for this visit */ } }
  function termsList() {
    return '<ol class="terms">' + TERMS.map(function (t) { return '<li><b>' + esc(t[0]) + '.</b> ' + esc(t[1]) + '</li>'; }).join('') + '</ol>';
  }
  function viewTerms() {
    setTitle('Terms of use');
    main.innerHTML = '<div class="stack prose"><div><h1>Terms of use</h1><p class="lede">By downloading SpineBench data you agree to these terms (version ' + TERMS_VERSION + '). They apply in addition to the CC BY-NC 4.0 licence.</p></div>' +
      termsList() +
      '<p>Author: <a href="https://sites.google.com/view/farshidghezelbash/home" target="_blank" rel="noopener">Farshid Ghezelbash</a>.</p>' +
      '<p class="muted small">' + (termsAccepted() ? 'You accepted these terms in this browser.' : 'You will be asked to accept these terms before your first download.') + '</p></div>';
  }
  function termsGate(href, name) {
    var old = $('#terms-modal'); if (old) old.parentNode.removeChild(old);
    var box = document.createElement('div');
    box.id = 'terms-modal'; box.className = 'modal-back';
    box.innerHTML = '<div class="modal" role="dialog" aria-modal="true" aria-labelledby="tm-h"><h2 id="tm-h">Terms of use</h2>' +
      '<p class="muted small">Please read and accept before downloading.</p>' + termsList() +
      '<label class="tick"><input type="checkbox" id="tm-ok"> I have read and agree to the <a href="#terms" target="_blank" rel="noopener">Terms of use</a>.</label>' +
      '<div class="btns"><button type="button" class="btn" id="tm-no">Cancel</button><button type="button" class="btn primary" id="tm-go" disabled>Agree and download</button></div></div>';
    document.body.appendChild(box);
    var ok = $('#tm-ok', box), go = $('#tm-go', box);
    var close = function () { document.removeEventListener('keydown', esc_); if (box.parentNode) box.parentNode.removeChild(box); };
    var esc_ = function (e) { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', esc_);
    ok.addEventListener('change', function () { go.disabled = !ok.checked; });
    $('#tm-no', box).addEventListener('click', close);
    box.addEventListener('click', function (e) { if (e.target === box) close(); });
    go.addEventListener('click', function () {
      if (!ok.checked) return;
      acceptTerms(); close();
      var a = document.createElement('a'); a.href = href; a.setAttribute('download', name || ''); a.style.display = 'none';
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    });
    ok.focus();
  }
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest ? e.target.closest('a[download]') : null;
    if (!a || termsAccepted()) return;
    e.preventDefault(); e.stopPropagation();
    termsGate(a.getAttribute('href'), a.getAttribute('download'));
  }, true);

  function route(opts) {
    opts = opts || {};
    destroyCharts();
    var r = parseHash(), p;
    $$('.nav a').forEach(function (a) {
      var on = a.getAttribute('data-nav') === (r.page === 'b' ? 'home' : r.page);
      if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
    });
    try {
      switch (r.page) {
        case 'home': p = viewHome(); break;
        case 'b': p = viewBench(r.arg, r.sub); break;
        case 'agents': p = viewAgents(); break;
        case 'about': p = viewAbout(); break;
        case 'terms': p = viewTerms(); break;
        case 'test': case 'group': case 'category': case 'browse': case 'groups': case 'search': p = oldLink(r.page, r.arg); break;
        default: p = notFound('Unknown page "' + r.page + '".');
      }
    } catch (e) { showError(e); }
    Promise.resolve(p).then(function () {
      if (r.page !== 'home' && !$('.cite', main)) main.insertAdjacentHTML('beforeend', citeHtml('cite-page'));
      if (opts.initial) return;
      window.scrollTo(0, 0);
      var h1 = $('h1', main); if (h1) { h1.setAttribute('tabindex', '-1'); h1.focus({ preventScroll: true }); }
    }, showError);
  }
  function showError(e) {
    if (window.console) console.warn(e);
    main.innerHTML = '<h1>Could not load this page</h1><p class="lede">' + esc(e && e.message ? e.message : e) + '</p>' +
      '<p class="note">If you opened index.html from disk, serve the folder instead: <code>python3 -m http.server</code>.</p>';
  }
  function redrawCharts() {
    if (!S.card || parseHash().page !== 'b' || !$('#view-body')) return;
    var y = window.scrollY; renderView(S.card); window.scrollTo(0, y);
  }

  function boot() {
    $('#skip').addEventListener('click', function (e) { e.preventDefault(); main.focus(); });
    $('#theme-toggle').addEventListener('click', function () {
      var root = document.documentElement;
      var cur = root.getAttribute('data-theme') || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      var next = cur === 'dark' ? 'light' : 'dark';
      root.setAttribute('data-theme', next);
      try { localStorage.setItem('sb-theme', next); } catch (e) { /* ignore */ }
      redrawCharts();
    });
    if (window.matchMedia) {
      var mq = window.matchMedia('(prefers-color-scheme: dark)');
      if (mq.addEventListener) mq.addEventListener('change', redrawCharts);
    }
    var timer = null;
    S.lastWide = isWide();
    window.addEventListener('resize', function () {
      clearTimeout(timer);
      timer = setTimeout(function () {
        var wide = isWide(), fig = $('#fig'), pg = fig && $('.pgrid', fig);
        var cv = (S.card && S.card.views.filter(function (x) { return x.id === S.viewId; })[0]) || {};
        var cols = pg ? panelCols($$('.pcell', pg).length, fig.clientWidth, cv) : null;
        if (wide !== S.lastWide || (pg && cols !== S.panelCols)) redrawCharts(); // layout, bar orientation and panel columns depend on width
        S.lastWide = wide;
      }, 200);
    });
    window.addEventListener('hashchange', function () { route(); });
    // phones: the header slides away while scrolling down and comes back on any scroll up
    (function () {
      var top = $('.top'), lastY = window.scrollY, ticking = false;
      if (!top) return;
      window.addEventListener('scroll', function () {
        if (ticking) return; ticking = true;
        window.requestAnimationFrame(function () {
          var y = window.scrollY, small = window.innerWidth < 760;
          if (!small || y < 60 || y < lastY - 4) top.classList.remove('top-hidden');
          else if (y > lastY + 4) top.classList.add('top-hidden');
          lastY = y; ticking = false;
        });
      }, { passive: true });
    })();
    document.addEventListener('click', function (e) {
      var b = e.target.closest && e.target.closest('[data-cite]');
      if (!b) return;
      var done = function () { b.textContent = 'Copied'; setTimeout(function () { b.textContent = 'Copy'; }, 1500); };
      try { navigator.clipboard.writeText(CITE).then(done, function () {}); } catch (err) {}
    });
    fetchJSON('data/outcomes.json').then(function (I) {
      I.benchmarks = I.benchmarks || []; I.planned = I.planned || []; I.counts = I.counts || {};
      S.index = I;
      S.schem = I.schematics || {};
      $('#foot-build').textContent = 'Build ' + (I.generated || '');
      if (I.counts.examples) {
        var bar = $('#example-bar');
        bar.innerHTML = '<div>This build includes ' + plural(I.counts.examples, 'EXAMPLE card') + ' for development. They are not curated data.</div>';
        bar.hidden = false;
      }
      // newer schematics than the build: read the live index when the build saw one (no request, no 404, otherwise)
      var live = I.schematics_index ? fetch('assets/schematics/index.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : {}; }).catch(function () { return {}; }) : Promise.resolve({});
      return live.then(function (m) {
        if (m && typeof m === 'object') Object.keys(m).forEach(function (k) { S.schem[k] = m[k]; });
        route({ initial: true });
      });
    }).catch(showError);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
