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
  function setTitle(t) { document.title = t ? t + ' · SpineBench' : 'SpineBench'; }
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
    card.studies.forEach(function (s, i) { card._study[s.key] = s; card._color[s.key] = i % 12 + 1; });
    card.inputs.forEach(function (x) { if (x && x.key) card._input[x.key] = x; });
    card.outputs.forEach(function (x) { if (x && x.key) card._output[x.key] = x; });
    card.tasks.forEach(function (t) {
      t.refs = Array.isArray(t.refs) ? t.refs : []; t.inputs = t.inputs || {}; card._task[t.id] = t;
      t.refs.forEach(function (r) { r._p = patientOf(card, r); });
    });
    // views as given, plus one "Other" view for tasks that no view lists
    var listed = {};
    card.views = card.views.filter(function (v) { return v && v.id; });
    card.views.forEach(function (v) {
      v.task_ids = (v.task_ids || []).filter(function (id) { return card._task[id] && !listed[id] && (listed[id] = 1); });
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
  var whiskers = {
    id: 'sbWhiskers',
    afterDatasetsDraw: function (chart, args, pluginOpts) {
      var ctx = chart.ctx, horiz = !!(pluginOpts && pluginOpts.horiz);
      var vs = horiz ? chart.scales.x : chart.scales.y, ink = cssVar('--ink');
      chart.data.datasets.forEach(function (ds, i) {
        if (!ds._vals || !chart.isDatasetVisible(i)) return;
        var meta = chart.getDatasetMeta(i);
        ctx.save();
        ctx.strokeStyle = ds._pooled ? cssVar('--pooled') : ds._color ? alpha(ds._color, 0.7) : alpha(ink, 0.65);
        ctx.lineWidth = ds._pooled ? 1.6 : 1.2;
        meta.data.forEach(function (el, j) {
          var v = ds._vals[j];
          if (!v || v.lo == null || v.hi == null || el.skip) return;
          var a = vs.getPixelForValue(v.lo), b = vs.getPixelForValue(v.hi);
          var size = horiz ? el.height : el.width;
          var cap = Math.max(2.5, Math.min(5, (size || 10) / 4));
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
        ctx.restore();
      });
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
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: cssVar('--surface'), titleColor: cssVar('--ink'), bodyColor: cssVar('--ink-2'),
          borderColor: cssVar('--line-2'), borderWidth: 1, padding: 10, boxPadding: 4, usePointStyle: true
        }
      }
    };
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
      return { label: studyLabel(card, k, false) + (noPool(card, k) ? ' (not pooled)' : ''), key: k, color: colorOf(card, k), hollow: noPool(card, k),
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
    var valueAxis = { beginAtZero: true, suggestedMax: hi > 0 ? hi * 1.04 : 0, suggestedMin: lo < 0 ? lo * 1.04 : 0,
      title: { display: true, text: yTitle, color: ink2 }, grid: { color: grid }, border: { display: false } };
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
          borderRadius: 3, borderSkipped: 'start', skipNull: true, maxBarThickness: 40,
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
      x: { beginAtZero: lo >= 0, title: { display: true, text: xTitle, color: ink2 }, grid: { color: grid }, border: { display: false } },
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
          pointStyle: d.pooled ? 'rectRot' : 'circle', pointRadius: d.pooled ? 5.5 : 4.5, pointHoverRadius: 7,
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
  function xAxisTitle(card, xKey) {
    var xd = card._input[xKey] || {}, lab = xd.label || upperFirst(human(xKey)), u = unitTxt(xd.unit);
    if (!u && /strain|^E\d\d$/i.test(xKey + ' ' + lab)) u = 'mm/mm';
    return lab + (u ? ' (' + u + ')' : '');
  }
  function shortVal(s) { var c = String(s).split(/,|\s\(/)[0].trim(); return c || String(s); }
  function seriesNamer(card, tasks, skeys) {
    var full = function (t) { return skeys.map(function (k) { return valueText(card, k, t.inputs[k]); }).join(' · '); };
    // drop keys whose short value is the same in every series (e.g. "uniaxial tension" twice)
    var kk = skeys.filter(function (k) { return uniq(tasks.map(function (t) { return shortVal(valueText(card, k, t.inputs[k])); })).length > 1; });
    if (!kk.length) kk = skeys;
    var short = function (t) { return kk.map(function (k) { return shortVal(valueText(card, k, t.inputs[k])); }).join(' · '); };
    // short names only if they still tell the series apart
    var ok = uniq(tasks.map(full)).length === uniq(tasks.map(short)).length;
    return ok ? short : full;
  }
  function drawCurves(box, card, tasks, xKey, unit, yTitle, seriesKeys) {
    if (typeof Chart === 'undefined') { chartMsg(box, 'The chart library did not load. The table below has every value.'); return null; }
    var split = splitInputs(card, tasks, [xKey]);
    var skeys = (seriesKeys && seriesKeys.length) ? seriesKeys.filter(function (k) { return split.vary.indexOf(k) >= 0; }) : split.vary;
    var sKey = seriesNamer(card, tasks, skeys);
    var series = uniq(tasks.map(sKey));
    var studies = viewStudies(card, tasks).filter(function (k) { return !S.off[k]; });
    var byStudyColor = studies.length > 1 || series.length === 1;
    var xOf = function (t) { return toNum(t.inputs[xKey]); };
    var lines = [];
    studies.forEach(function (k) {
      series.forEach(function (s, si) {
        var pts = tasks.filter(function (t) { return sKey(t) === s && xOf(t) != null; }).map(function (t) {
          var v = firstRef(card, t, k); if (!v) return null; v.x = xOf(t); v.task = t; return v;
        }).filter(Boolean).sort(function (a, b) { return a.x - b.x; });
        if (!pts.length) return;
        lines.push({ label: studyLabel(card, k, false) + (series.length > 1 ? ' · ' + s : ''), key: k, pts: pts, hollow: noPool(card, k),
          color: byStudyColor ? colorOf(card, k) : cssVar('--s' + (si % 12 + 1)), dash: byStudyColor ? DASHES[si % DASHES.length] : [] });
      });
    });
    if (!S.hidePooled) series.forEach(function (s, si) {
      var pts = tasks.filter(function (t) { return sKey(t) === s && xOf(t) != null; }).map(function (t) {
        var v = pooledValue(pooledFor(card, t)); if (!v) return null; v.x = xOf(t); v.task = t; return v;
      }).filter(Boolean).sort(function (a, b) { return a.x - b.x; });
      if (pts.length) lines.push({ label: 'Pooled' + (series.length > 1 ? ' · ' + s : ''), key: '_pooled', pooled: true, pts: pts,
        color: cssVar('--pooled'), dash: byStudyColor ? DASHES[si % DASHES.length] : [] });
    });
    if (!lines.length) { chartMsg(box, studies.length ? 'No plottable values. See the table.' : 'Nothing to show. Switch a study on above.'); return null; }
    box.style.height = '';
    var xTitle = xAxisTitle(card, xKey);
    var opts = chartBase(), ink2 = cssVar('--ink-2'), grid = cssVar('--grid'), surface = cssVar('--surface');
    opts.interaction = { mode: 'nearest', axis: 'x', intersect: false };
    opts.scales = {
      x: { type: 'linear', title: { display: true, text: xTitle, color: ink2 }, grid: { color: grid }, border: { display: false } },
      y: { title: { display: true, text: yTitle, color: ink2 }, grid: { color: grid }, border: { display: false } }
    };
    opts.plugins.tooltip.callbacks = {
      title: function (items) { return items.length ? xTitle + ' = ' + fmt(items[0].raw.x) : ''; },
      label: function (c) { return tipLabel(c, c.dataset._vals[c.dataIndex], unit); }
    };
    var chart = new Chart(canvasIn(box, yTitle + ' versus ' + xTitle), {
      type: 'line',
      data: { datasets: lines.map(function (l) {
        return { label: l.label, _key: l.key, _pooled: !!l.pooled, _color: l.pooled ? null : l.color, _vals: l.pts, data: l.pts.map(function (p) { return { x: p.x, y: p.y }; }),
          borderColor: l.color, backgroundColor: l.color, borderWidth: l.pooled ? 2.5 : 2, borderDash: l.dash,
          pointRadius: l.pooled ? 4.5 : 3.5, pointHoverRadius: 6, pointBorderColor: l.hollow ? l.color : surface, pointBorderWidth: 1.5,
          pointBackgroundColor: l.hollow ? surface : l.color,
          pointStyle: l.pooled ? 'rectRot' : 'circle', fill: false, tension: 0 };
      }) },
      options: opts, plugins: [whiskers]
    });
    S.charts.push(chart);
    return { kind: 'curves', series: series, colorBySeries: !byStudyColor, sets: lines };
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
    return '<p class="hero-stats">' + [[c.benchmarks, 'benchmarks'], [c.tasks, 'tasks'], [c.studies, 'studies'], [c.N, 'subjects and specimens']]
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
  function viewHome() {
    var I = S.index, c = I.counts || {};
    setTitle('');
    var html = '<section class="hero"><div class="hero-main"><h1>Put your spine model on the bench.</h1>' +
      '<p class="lede">Experimental outcomes every spine model should reproduce, from ' + esc(c.studies) + ' studies, each value traced to its table or figure.</p>' +
      heroStats(c) + '<p class="byline">By <a href="https://sites.google.com/view/farshidghezelbash/home" target="_blank" rel="noopener">Farshid Ghezelbash</a> · for research use only</p></div>' +
      '<ol class="how"><li><b>Pick a benchmark</b><span>one outcome, e.g. lumbar disc pressure</span></li>' +
      '<li><b>Simulate its tasks</b><span>subject, loads and boundary conditions are given</span></li>' +
      '<li><b>Compare</b><span>with every study (n, year) and the pooled mean, or <a href="#agents">give the tasks to an agent</a></span></li></ol></section>';
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
      if (S.card !== card) { S.off = {}; S.offP = {}; S.bw = false; S.hidePooled = false; }
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
      var many = card.views.length > 10; // a long row of tabs pushes the chart down: use a menu instead
      html += (many ? '' : '<div class="tabs" role="tablist" aria-label="Views">' + card.views.map(function (v) {
        var on = v.id === S.viewId;
        return '<button type="button" role="tab" class="tab' + (v.overview ? ' tab-ov' : '') + '" data-view="' + esc(v.id) + '" aria-selected="' + on + '" tabindex="' + (on ? 0 : -1) + '">' + esc(v.title || v.id) + '</button>';
      }).join('') + '</div>') +
        '<label class="view-select' + (many ? ' always' : '') + '"><span class="' + (many ? 'vs-h' : 'sr') + '">View <small>' + card.views.length + '</small></span><select id="view-select">' + card.views.map(function (v) {
          return '<option value="' + esc(v.id) + '"' + (v.id === S.viewId ? ' selected' : '') + '>' + esc(v.title || v.id) + '</option>';
        }).join('') + '</select></label>';
    }
    html += '<section id="view-body" class="viz" aria-live="polite"></section>';
    if (card.simulate.length || Object.keys(card.subjects).length || card.summary) {
      html += '<details class="panel how"><summary><h2>How to simulate this</h2></summary>' +
        (card.summary ? '<p class="lede">' + esc(card.summary) + '</p>' : '') +
        (card.simulate.length ? '<ol class="steps">' + card.simulate.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>' : '') +
        subjectTable(card) + '</details>';
    }
    html += '<section class="panel"><h2>Studies</h2>' + studiesTable(card) + '</section>';
    if (card.notes.length) html += '<section class="panel"><h2>Notes</h2><ul class="notes">' + card.notes.slice(0, 3).map(function (n) { return '<li>' + esc(n) + '</li>'; }).join('') + '</ul></section>';
    main.innerHTML = '<div class="stack">' + html + '</div>';

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
    return '<div class="table-wrap"><table class="compact"><thead><tr><th>Study</th><th class="r">Year</th><th class="r">n</th><th>Sample</th><th>DOI</th></tr></thead><tbody>' +
      rows.map(function (s) {
        return '<tr><td class="study"><span class="sw" style="background:' + swatch(card, s.key) + '"></span><b class="nowrap">' + esc(s.short || s.key) + '</b>' +
          (s.secondary ? ' <span class="tag" title="Value compiled in a review; the primary study is not in this benchmark">secondary</span>' : '') +
          (s.pool === false ? ' <span class="tag" title="Shown, but not part of the pooled value">not pooled</span>' : '') + '</td>' +
          '<td class="r num">' + esc(s.year || '') + '</td><td class="r num">' + esc(s.n == null ? '–' : s.n) + '</td>' +
          '<td class="wide">' + esc(s.sample || '') + '</td><td class="doi">' + doiLink(s.doi, card.example) + '</td></tr>';
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

  function chipsHtml(card, studies, anyPooled) {
    return '<div class="chips" role="group" aria-label="Show or hide studies">' + studies.map(function (k) {
      var np = noPool(card, k), s = card._study[k] || {};
      return '<button type="button" class="chip" data-study="' + esc(k) + '" aria-pressed="' + !S.off[k] + '" title="' + esc((s.sample || '') + (np ? ' · not pooled' : '')) + '">' +
        '<span class="sw' + (np ? ' hollow' : '') + '" style="--c:' + swatch(card, k) + ';background:' + swatch(card, k) + '"></span>' + esc(studyLabel(card, k, false)) +
        (s.n != null ? '<span class="cn">n=' + esc(s.n) + '</span>' : '') + '</button>';
    }).join('') + (anyPooled ? '<button type="button" class="chip chip-pooled" data-study="_pooled" aria-pressed="' + !S.hidePooled + '"><span class="sw sw-pooled"></span>Pooled</button>' : '') + '</div>';
  }
  function schemBlock(card, v) {
    var sc = schematicFor(card.id, v.id === '_activity' ? null : v.id);
    if (!sc) return '';
    var open = isWide();
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
    if (xKey && !tasks.some(function (t) { return toNum(t.inputs[xKey]) != null; })) xKey = null;
    var bwAble = !v.overview && outs.some(function (o) { return canBW(card, o); });
    var side = schemBlock(card, v) + patientTable(card, tasks);
    var main1;
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
      '<div class="viz-grid' + (side ? ' has-side' : '') + '"><div class="viz-main">' + main1 + '<p class="chart-cap" id="chart-cap"></p></div>' +
      (side ? '<aside class="viz-side">' + side + '</aside>' : '') + '</div>' +
      (v.overview ? '' : whatLine(card, tasks, outs, xKey)) + '<div id="task-table"></div>';
    wireSchemImgs(body);
    var flags = { kinds: {}, median: false, range: false, hollow: false, derived: false };
    if (v.overview) renderOverview(card, tasks, $('#overview', body), flags);
    else outs.forEach(function (o, i) {
      var ts = tasks.filter(function (t) { return (t.output || '') === o; });
      var unit = unitOf(card, o), yTitle = axisTitle(card, o);
      if (bwOn(card, o)) flags.derived = true;
      var box = $('#chart-' + i, body), info;
      if (xKey && ts.some(function (t) { return toNum(t.inputs[xKey]) != null; })) {
        info = drawCurves(box, card, ts, xKey, unit, yTitle, v.series);
        if (info && info.series.length > 1) $('#skey-' + i, body).innerHTML = info.series.map(function (s, si) {
          var d = info.colorBySeries ? [] : DASHES[si % DASHES.length];
          var col = info.colorBySeries ? 'var(--s' + (si % 12 + 1) + ')' : 'var(--ink-2)';
          return '<span><svg viewBox="0 0 28 6" aria-hidden="true"><line x1="1" y1="3" x2="27" y2="3" stroke="' + col + '" stroke-width="2" stroke-dasharray="' + d.join(' ') + '"/></svg>' + esc(s) + '</span>';
        }).join('');
      } else info = drawBars(box, card, ts, unit, yTitle);
      if (info) {
        flags.kinds[info.kind] = 1;
        info.sets.forEach(function (d) {
          if (d.hollow) flags.hollow = true;
          (d.vals || d.pts || []).forEach(function (x) { if (x) { if (x.kind === 'median') flags.median = true; if (x.err === 'range') flags.range = true; } });
        });
      }
    });
    $('#chart-cap', body).innerHTML = capText(flags, v.overview);
    if (!v.overview) {
      var tt = taskTable(card, tasks, studies, xKey);
      // curves: the chart already shows every point; keep the long table folded
      $('#task-table', body).innerHTML = xKey ? '<details class="fold values-fold"><summary>Show values (' + tasks.length + ' points)</summary>' + tt + '</details>' : tt;
    }
    $$('.chip', body).forEach(function (c) {
      c.addEventListener('click', function () {
        var k = c.getAttribute('data-study');
        if (k === '_pooled') S.hidePooled = !S.hidePooled; else S.off[k] = !S.off[k];
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
    else if (f.kinds.curves && !f.kinds.bars && !f.kinds.dots) bits.push('Each line = one study (mean ± SD at each point). ◇ = pooled mean of all studies (weighted by n).');
    else if (f.kinds.bars && !f.kinds.dots) bits.push('Each bar = one study’s mean (± SD). Outlined grey bar = pooled mean of all studies (weighted by n).');
    else bits.push('Each dot = one study’s mean (± SD). ◇ = pooled mean of all studies (weighted by n).');
    if (f.median || f.range) bits.push('[min–max] for medians and individual subjects; medians are not pooled.');
    if (f.hollow) bits.push('Hollow = shown, not pooled.');
    if (f.derived) bits.push('% body weight is derived: force ÷ (weight × 9.81), using each patient’s or cohort’s weight.');
    if (anyOn(S.off) || anyOn(S.offP)) bits.push('<b>Pooled recomputed for your selection.</b>');
    return bits.join(' ');
  }
  // one line: what is fixed, what changes, what to report
  function whatLine(card, tasks, outs, xKey) {
    var split = splitInputs(card, tasks, xKey ? [xKey] : []);
    var same = split.same.map(function (k) { return phrase(card, k, tasks[0].inputs[k]); }).filter(Boolean);
    var vary = split.vary.map(function (k) { return lowerFirst(inputLabel(card, k)); });
    var parts = [];
    if (same.length) parts.push('<span><b>Same for all:</b> ' + esc(same.join(', ')) + '</span>');
    if (xKey) {
      var xs = tasks.map(function (t) { return toNum(t.inputs[xKey]); }).filter(isNum);
      var xd = card._input[xKey] || {};
      parts.push('<span><b>Sweep:</b> ' + esc(lowerFirst(inputLabel(card, xKey)) + ' ' + withUnit(fmt(Math.min.apply(null, xs)), xd.unit) + ' to ' + withUnit(fmt(Math.max.apply(null, xs)), xd.unit)) + '</span>');
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
      rows.sort(function (a, b) { return order.indexOf(key(a)) - order.indexOf(key(b)) || (toNum(a.inputs[xKey]) || 0) - (toNum(b.inputs[xKey]) || 0); });
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
    setTitle('For agents');
    var ex = S.index.agent_example, exText = '{"id": "...", "agent_prompt": "...", "tasks": [{"id": "...", "inputs": {}}]}';
    if (ex) {
      var cut = function (x, n) { x = String(x || ''); return x.length > n ? x.slice(0, n) + '…' : x; };
      exText = JSON.stringify({ id: ex.id, title: ex.title, agent_prompt: cut(ex.agent_prompt, 150), answer_format: ex.answer_format,
        subjects: ex.subjects, tasks: ex.tasks, more: 'simulate, inputs, outputs, studies' }, function (k, v) {
        return typeof v === 'string' && k !== 'agent_prompt' ? cut(v, 60) : v;
      }, 1);
    }
    main.innerHTML = '<div class="stack prose"><div><h1>For agents</h1>' +
      '<p class="lede">Give an agent the tasks, keep the answers, then score its reply.</p></div>' +
      '<ul class="lines">' +
      '<li><b>agent_tasks.jsonl</b>: one line per benchmark with the prompt, subjects, task inputs and answer format. No reference values.</li>' +
      '<li><b>answers.json</b>: the hidden answers, <code>{benchmark id: {task id: {refs, pooled}}}</code>. Keep it away from the agent.</li>' +
      '<li><b>benchmark.json</b>: every card in one file, tasks and answers together, for analysis.</li>' +
      '<li>The agent replies <code>{task id: {output: value}}</code> as in <code>answer_format</code>, in the units given there.</li>' +
      '<li>Score each task against the pooled value (± SD) or each study; every value keeps its <code>test_id</code>.</li>' +
      '</ul>' +
      '<div class="btns">' + dlBtn('data/agent_tasks.jsonl', 'agent_tasks.jsonl', true) + dlBtn('data/answers.json', 'answers.json') + dlBtn('data/benchmark.json', 'benchmark.json') + '</div>' +
      '<div><h2>One line of agent_tasks.jsonl (shortened)</h2><pre class="code">' + esc(exText) + '</pre></div></div>';
  }
  function viewAbout() {
    setTitle('About');
    var c = S.index.counts || {};
    main.innerHTML = '<div class="stack prose"><div><img class="about-logo" src="assets/logo_full.svg" alt="SpineBench"><h1>About SpineBench</h1></div><ul class="lines">' +
      '<li>SpineBench collects published human measurements to validate thoracic and lumbar spine models: ' + esc(c.benchmarks) + ' outcome benchmarks, ' +
      esc(c.tasks) + ' tasks, ' + esc(c.studies) + ' studies.</li>' +
      '<li>A benchmark is one outcome (e.g. disc pressure, range of motion). A task is one condition a model can simulate; every study’s value for it is shown side by side.</li>' +
      '<li>Values come from tables and text, or were digitised from figures with the digitising uncertainty recorded. Each keeps a <code>test_id</code> that traces it to its table or figure.</li>' +
      '<li>An independent second pass re-checked values against the papers (<code>bench/VERIFICATION.md</code> in the repository).</li>' +
      '<li>Pooled value: n-weighted mean of studies that report a mean; SD combines within- and between-study spread; overlapping samples count once; medians are not pooled; at least two studies.</li>' +
      '<li>Created and maintained by <a href="https://sites.google.com/view/farshidghezelbash/home" target="_blank" rel="noopener">Farshid Ghezelbash</a>.</li>' +
      '<li>How to cite: Ghezelbash F. SpineBench: validation benchmarks for spine models. https://sites.google.com/view/farshidghezelbash/home. Please also cite the original studies behind the values you use.</li>' +
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
    ['No warranty', 'Values were extracted from published studies and may contain errors. They are provided as is, without any warranty. Check them against the original papers. Not for clinical decisions.'],
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
        var wide = isWide();
        if (wide !== S.lastWide) redrawCharts(); // layout and bar orientation depend on width
        S.lastWide = wide;
      }, 200);
    });
    window.addEventListener('hashchange', function () { route(); });
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
