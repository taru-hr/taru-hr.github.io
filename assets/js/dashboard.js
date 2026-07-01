'use strict';

/**
 * Interactive HR Analytics Dashboard (prototype)
 * ------------------------------------------------
 * A self-contained, dependency-free people-analytics dashboard. Charts are
 * drawn as inline SVG so there are no external libraries to load. All numbers
 * below are illustrative sample data.
 *
 * Interactions
 *   • Year filter        — switches the whole dataset (2023 / 2024 / 2025)
 *   • Department filter   — focuses the KPIs, trend line and table on one team
 *   • Click a bar         — selects that department (same as the dropdown)
 *   • Hover a data point  — shows a tooltip
 */

// ---------------------------------------------------------------------------
// Sample data
// ---------------------------------------------------------------------------

const DEPARTMENTS = [
  'Engineering', 'Sales', 'Marketing', 'Customer Support',
  'Finance', 'Operations', 'People & HR'
];

// Short labels used inside the compact charts.
const SHORT = {
  'Engineering': 'Eng',
  'Sales': 'Sales',
  'Marketing': 'Mktg',
  'Customer Support': 'Support',
  'Finance': 'Finance',
  'Operations': 'Ops',
  'People & HR': 'HR'
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DATA = {
  2025: {
    departments: {
      'Engineering':      { headcount: 132, hires: 36, exits: 19, openRoles: 12, engagement: 79, timeToHire: 42 },
      'Sales':            { headcount: 88,  hires: 41, exits: 30, openRoles: 9,  engagement: 70, timeToHire: 27 },
      'Marketing':        { headcount: 46,  hires: 12, exits: 8,  openRoles: 4,  engagement: 74, timeToHire: 33 },
      'Customer Support': { headcount: 64,  hires: 28, exits: 22, openRoles: 7,  engagement: 68, timeToHire: 21 },
      'Finance':          { headcount: 30,  hires: 6,  exits: 4,  openRoles: 2,  engagement: 77, timeToHire: 38 },
      'Operations':       { headcount: 52,  hires: 14, exits: 11, openRoles: 5,  engagement: 72, timeToHire: 30 },
      'People & HR':      { headcount: 18,  hires: 5,  exits: 3,  openRoles: 2,  engagement: 82, timeToHire: 35 }
    },
    monthlyExits: [7, 6, 9, 8, 9, 7, 6, 8, 10, 9, 9, 9],
    funnel: { Applied: 3400, Screened: 1020, Interviewed: 430, Offered: 180, Hired: 142 },
    workforce: { 'Full-time': 356, 'Part-time': 39, 'Contract': 24, 'Intern': 11 }
  },
  2024: {
    departments: {
      'Engineering':      { headcount: 118, hires: 30, exits: 22, openRoles: 8, engagement: 76, timeToHire: 45 },
      'Sales':            { headcount: 82,  hires: 38, exits: 34, openRoles: 7, engagement: 67, timeToHire: 30 },
      'Marketing':        { headcount: 42,  hires: 10, exits: 9,  openRoles: 3, engagement: 71, timeToHire: 36 },
      'Customer Support': { headcount: 58,  hires: 26, exits: 25, openRoles: 6, engagement: 65, timeToHire: 24 },
      'Finance':          { headcount: 28,  hires: 5,  exits: 5,  openRoles: 1, engagement: 75, timeToHire: 40 },
      'Operations':       { headcount: 48,  hires: 13, exits: 13, openRoles: 4, engagement: 70, timeToHire: 33 },
      'People & HR':      { headcount: 16,  hires: 4,  exits: 3,  openRoles: 1, engagement: 80, timeToHire: 37 }
    },
    monthlyExits: [9, 8, 10, 9, 10, 9, 8, 9, 11, 10, 9, 9],
    funnel: { Applied: 3000, Screened: 900, Interviewed: 380, Offered: 160, Hired: 126 },
    workforce: { 'Full-time': 322, 'Part-time': 36, 'Contract': 22, 'Intern': 12 }
  },
  2023: {
    departments: {
      'Engineering':      { headcount: 104, hires: 28, exits: 20, openRoles: 6, engagement: 74, timeToHire: 48 },
      'Sales':            { headcount: 76,  hires: 34, exits: 33, openRoles: 6, engagement: 65, timeToHire: 32 },
      'Marketing':        { headcount: 38,  hires: 9,  exits: 8,  openRoles: 2, engagement: 69, timeToHire: 38 },
      'Customer Support': { headcount: 52,  hires: 24, exits: 24, openRoles: 5, engagement: 63, timeToHire: 26 },
      'Finance':          { headcount: 26,  hires: 5,  exits: 4,  openRoles: 1, engagement: 73, timeToHire: 42 },
      'Operations':       { headcount: 44,  hires: 12, exits: 12, openRoles: 3, engagement: 68, timeToHire: 35 },
      'People & HR':      { headcount: 14,  hires: 3,  exits: 2,  openRoles: 1, engagement: 78, timeToHire: 39 }
    },
    monthlyExits: [8, 7, 9, 8, 9, 9, 8, 9, 10, 9, 9, 8],
    funnel: { Applied: 2700, Screened: 810, Interviewed: 340, Offered: 140, Hired: 115 },
    workforce: { 'Full-time': 290, 'Part-time': 34, 'Contract': 20, 'Intern': 10 }
  }
};

const SEGMENT_COLORS = ['#ffd15c', '#e0a458', '#9a7b4f', '#6d6d70'];

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------

const state = { year: 2025, dept: 'All' };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const SVGNS = 'http://www.w3.org/2000/svg';

function svg(tag, attrs, text) {
  const el = document.createElementNS(SVGNS, tag);
  if (attrs) for (const k in attrs) el.setAttribute(k, attrs[k]);
  if (text != null) el.textContent = text;
  return el;
}

function qs(sel) { return document.querySelector(sel); }

function fmt(n) { return Math.round(n).toLocaleString('en-US'); }

const tooltip = qs('[data-tooltip]');

function showTip(evt, html) {
  tooltip.innerHTML = html;
  tooltip.classList.add('visible');
  const pad = 14;
  let x = evt.clientX + pad;
  let y = evt.clientY + pad;
  // keep the tooltip inside the viewport
  const rect = tooltip.getBoundingClientRect();
  if (x + rect.width > window.innerWidth) x = evt.clientX - rect.width - pad;
  if (y + rect.height > window.innerHeight) y = evt.clientY - rect.height - pad;
  tooltip.style.left = x + 'px';
  tooltip.style.top = y + 'px';
}

function hideTip() { tooltip.classList.remove('visible'); }

// Aggregate the numbers for a given year + department scope.
function scopeFor(year, dept) {
  const depts = DATA[year].departments;
  if (dept !== 'All') {
    const v = depts[dept];
    return {
      headcount: v.headcount, hires: v.hires, exits: v.exits,
      openRoles: v.openRoles, engagement: v.engagement, timeToHire: v.timeToHire,
      turnover: (v.exits / v.headcount) * 100
    };
  }
  let hc = 0, hire = 0, exit = 0, open = 0, engW = 0, tthW = 0;
  DEPARTMENTS.forEach(function (d) {
    const v = depts[d];
    hc += v.headcount; hire += v.hires; exit += v.exits; open += v.openRoles;
    engW += v.engagement * v.headcount;
    tthW += v.timeToHire * v.headcount;
  });
  return {
    headcount: hc, hires: hire, exits: exit, openRoles: open,
    engagement: engW / hc, timeToHire: tthW / hc,
    turnover: (exit / hc) * 100
  };
}

// Monthly exits for the current scope (department scaled from the org shape).
function monthlyExitsFor(year, dept) {
  const org = DATA[year].monthlyExits;
  if (dept === 'All') return org.slice();
  const orgTotal = org.reduce(function (a, b) { return a + b; }, 0);
  const deptExits = DATA[year].departments[dept].exits;
  return org.map(function (m) { return Math.round((m / orgTotal) * deptExits); });
}

// ---------------------------------------------------------------------------
// KPI cards
// ---------------------------------------------------------------------------

function deltaMarkup(cur, prev, higherIsBetter, suffix) {
  if (prev == null || prev === 0) {
    return '<p class="kpi-delta flat">— no prior year</p>';
  }
  const pct = ((cur - prev) / prev) * 100;
  const better = higherIsBetter ? cur > prev : cur < prev;
  const cls = Math.abs(pct) < 0.05 ? 'flat' : (better ? 'up' : 'down');
  const arrow = pct > 0 ? 'arrow-up-outline' : (pct < 0 ? 'arrow-down-outline' : 'remove-outline');
  return '<p class="kpi-delta ' + cls + '">' +
    '<ion-icon name="' + arrow + '"></ion-icon>' +
    Math.abs(pct).toFixed(1) + '% vs ' + (state.year - 1) +
    (suffix || '') + '</p>';
}

function renderKpis() {
  const cur = scopeFor(state.year, state.dept);
  const prevYear = DATA[state.year - 1] ? state.year - 1 : null;
  const prev = prevYear ? scopeFor(prevYear, state.dept) : null;

  const cards = [
    {
      icon: 'people-outline', label: 'Total headcount',
      value: fmt(cur.headcount),
      delta: deltaMarkup(cur.headcount, prev && prev.headcount, true)
    },
    {
      icon: 'trending-down-outline', label: 'Turnover rate',
      value: cur.turnover.toFixed(1) + '%',
      delta: deltaMarkup(cur.turnover, prev && prev.turnover, false)
    },
    {
      icon: 'time-outline', label: 'Avg. time to hire',
      value: Math.round(cur.timeToHire) + ' days',
      delta: deltaMarkup(cur.timeToHire, prev && prev.timeToHire, false)
    },
    {
      icon: 'happy-outline', label: 'Engagement score',
      value: Math.round(cur.engagement) + '/100',
      delta: deltaMarkup(cur.engagement, prev && prev.engagement, true)
    }
  ];

  qs('[data-kpis]').innerHTML = cards.map(function (c) {
    return '' +
      '<div class="kpi-card">' +
        '<div class="kpi-icon"><ion-icon name="' + c.icon + '"></ion-icon></div>' +
        '<p class="kpi-label">' + c.label + '</p>' +
        '<p class="kpi-value">' + c.value + '</p>' +
        c.delta +
      '</div>';
  }).join('');
}

// ---------------------------------------------------------------------------
// Chart: headcount by department (horizontal bars, click to select)
// ---------------------------------------------------------------------------

function renderHeadcountChart() {
  const host = qs('[data-chart="headcount"]');
  host.innerHTML = '';

  const depts = DATA[state.year].departments;
  const W = 340, H = 232, top = 10, bottom = 10, labelW = 82, valueW = 30;
  const x0 = labelW, x1 = W - valueW;
  const n = DEPARTMENTS.length;
  const rowH = (H - top - bottom) / n;
  const barH = Math.min(20, rowH * 0.62);
  const maxVal = Math.max.apply(null, DEPARTMENTS.map(function (d) { return depts[d].headcount; }));
  const scale = (x1 - x0) / maxVal;

  const root = svg('svg', {
    viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg',
    preserveAspectRatio: 'xMidYMid meet', role: 'img',
    'aria-label': 'Headcount by department'
  });

  DEPARTMENTS.forEach(function (d, i) {
    const v = depts[d];
    const y = top + i * rowH + (rowH - barH) / 2;
    const len = Math.max(2, v.headcount * scale);
    const selected = state.dept === d;

    // baseline track
    root.appendChild(svg('rect', {
      x: x0, y: y, width: x1 - x0, height: barH, rx: 5, class: 'bar-track'
    }));

    // value bar
    const bar = svg('rect', {
      x: x0, y: y, width: len, height: barH, rx: 5,
      class: 'bar-rect' + (selected ? ' is-selected' : '')
    });
    bar.style.cursor = 'pointer';
    bar.addEventListener('mousemove', function (e) {
      showTip(e, '<strong>' + d + '</strong><br>' + v.headcount + ' employees · ' +
        v.openRoles + ' open roles');
    });
    bar.addEventListener('mouseleave', hideTip);
    bar.addEventListener('click', function () {
      setState({ dept: selected ? 'All' : d });
    });
    root.appendChild(bar);

    // department label
    root.appendChild(svg('text', {
      x: x0 - 8, y: y + barH / 2, class: 'chart-label',
      'text-anchor': 'end', 'dominant-baseline': 'central'
    }, SHORT[d]));

    // value
    root.appendChild(svg('text', {
      x: x0 + len + 6, y: y + barH / 2, class: 'chart-value',
      'dominant-baseline': 'central'
    }, v.headcount));
  });

  host.appendChild(root);
}

// ---------------------------------------------------------------------------
// Chart: employee exits by month (line + area)
// ---------------------------------------------------------------------------

function renderTurnoverChart() {
  const host = qs('[data-chart="turnover"]');
  host.innerHTML = '';

  const series = monthlyExitsFor(state.year, state.dept);
  const W = 360, H = 220, padL = 28, padR = 14, padT = 16, padB = 26;
  const x0 = padL, x1 = W - padR, y0 = padT, y1 = H - padB;
  const n = series.length;
  const rawMax = Math.max.apply(null, series);
  const maxY = Math.max(2, Math.ceil(rawMax / 2) * 2);
  const xAt = function (i) { return x0 + (i * (x1 - x0)) / (n - 1); };
  const yAt = function (v) { return y1 - (v / maxY) * (y1 - y0); };

  const root = svg('svg', {
    viewBox: '0 0 ' + W + ' ' + H, class: 'chart-svg',
    preserveAspectRatio: 'xMidYMid meet', role: 'img',
    'aria-label': 'Employee exits by month'
  });

  // gridlines + y labels
  [0, maxY / 2, maxY].forEach(function (gv) {
    const gy = yAt(gv);
    root.appendChild(svg('line', {
      x1: x0, y1: gy, x2: x1, y2: gy, class: 'grid-line'
    }));
    root.appendChild(svg('text', {
      x: x0 - 6, y: gy, class: 'axis-label', 'text-anchor': 'end',
      'dominant-baseline': 'central'
    }, gv));
  });

  // area + line paths
  let line = '', area = '';
  series.forEach(function (v, i) {
    const cmd = (i === 0 ? 'M' : 'L') + xAt(i) + ' ' + yAt(v);
    line += cmd + ' ';
  });
  area = 'M' + xAt(0) + ' ' + y1 + ' ' +
    series.map(function (v, i) { return 'L' + xAt(i) + ' ' + yAt(v); }).join(' ') +
    ' L' + xAt(n - 1) + ' ' + y1 + ' Z';

  root.appendChild(svg('path', { d: area, class: 'area-path' }));
  root.appendChild(svg('path', { d: line.trim(), class: 'line-path' }));

  // month labels + interactive dots
  series.forEach(function (v, i) {
    root.appendChild(svg('text', {
      x: xAt(i), y: H - 8, class: 'axis-label', 'text-anchor': 'middle'
    }, MONTHS[i]));

    const dot = svg('circle', { cx: xAt(i), cy: yAt(v), r: 4, class: 'line-dot' });
    dot.addEventListener('mousemove', function (e) {
      showTip(e, '<strong>' + MONTHS[i] + ' ' + state.year + '</strong><br>' +
        v + ' exit' + (v === 1 ? '' : 's'));
    });
    dot.addEventListener('mouseleave', hideTip);
    root.appendChild(dot);
  });

  host.appendChild(root);
}

// ---------------------------------------------------------------------------
// Chart: workforce composition (donut) — organisation-wide
// ---------------------------------------------------------------------------

function renderWorkforceChart() {
  const host = qs('[data-chart="workforce"]');
  host.innerHTML = '';

  const wf = DATA[state.year].workforce;
  const keys = Object.keys(wf);
  const total = keys.reduce(function (a, k) { return a + wf[k]; }, 0);

  const size = 200, cx = 100, cy = 100, r = 66, sw = 26;
  const circ = 2 * Math.PI * r;

  const wrap = document.createElement('div');
  wrap.className = 'donut-wrap';

  const root = svg('svg', {
    viewBox: '0 0 ' + size + ' ' + size, class: 'donut-svg', role: 'img',
    'aria-label': 'Workforce composition'
  });

  root.appendChild(svg('circle', {
    cx: cx, cy: cy, r: r, fill: 'none', 'stroke-width': sw, class: 'donut-track'
  }));

  let offset = 0;
  keys.forEach(function (k, i) {
    const frac = wf[k] / total;
    const seg = svg('circle', {
      cx: cx, cy: cy, r: r, fill: 'none',
      stroke: SEGMENT_COLORS[i % SEGMENT_COLORS.length],
      'stroke-width': sw,
      'stroke-dasharray': (frac * circ) + ' ' + (circ - frac * circ),
      'stroke-dashoffset': -offset,
      transform: 'rotate(-90 ' + cx + ' ' + cy + ')',
      class: 'donut-seg'
    });
    seg.addEventListener('mousemove', function (e) {
      showTip(e, '<strong>' + k + '</strong><br>' + wf[k] + ' employees · ' +
        Math.round(frac * 100) + '%');
    });
    seg.addEventListener('mouseleave', hideTip);
    root.appendChild(seg);
    offset += frac * circ;
  });

  // center total
  root.appendChild(svg('text', {
    x: cx, y: cy - 4, class: 'donut-total', 'text-anchor': 'middle'
  }, fmt(total)));
  root.appendChild(svg('text', {
    x: cx, y: cy + 16, class: 'donut-caption', 'text-anchor': 'middle'
  }, 'employees'));

  wrap.appendChild(root);

  // legend
  const legend = document.createElement('ul');
  legend.className = 'donut-legend';
  keys.forEach(function (k, i) {
    const li = document.createElement('li');
    li.innerHTML = '<span class="swatch" style="background:' +
      SEGMENT_COLORS[i % SEGMENT_COLORS.length] + '"></span>' +
      '<span class="legend-label">' + k + '</span>' +
      '<span class="legend-value">' + Math.round((wf[k] / total) * 100) + '%</span>';
    legend.appendChild(li);
  });
  wrap.appendChild(legend);

  host.appendChild(wrap);
}

// ---------------------------------------------------------------------------
// Chart: recruitment funnel — organisation-wide (HTML bars)
// ---------------------------------------------------------------------------

function renderFunnelChart() {
  const host = qs('[data-chart="funnel"]');
  const funnel = DATA[state.year].funnel;
  const stages = Object.keys(funnel);
  const max = funnel[stages[0]];

  host.innerHTML = '<ul class="funnel">' + stages.map(function (stage, i) {
    const val = funnel[stage];
    const width = Math.max(8, (val / max) * 100);
    const conv = i === 0 ? 100 : (val / funnel[stages[i - 1]]) * 100;
    return '' +
      '<li class="funnel-row">' +
        '<span class="funnel-stage">' + stage + '</span>' +
        '<span class="funnel-bar-wrap">' +
          '<span class="funnel-bar" style="width:' + width + '%">' + fmt(val) + '</span>' +
        '</span>' +
        '<span class="funnel-conv">' + Math.round(conv) + '%</span>' +
      '</li>';
  }).join('') + '</ul>';
}

// ---------------------------------------------------------------------------
// Department detail table
// ---------------------------------------------------------------------------

function renderTable() {
  const depts = DATA[state.year].departments;
  let hc = 0, hire = 0, exit = 0, open = 0;

  const rows = DEPARTMENTS.map(function (d) {
    const v = depts[d];
    hc += v.headcount; hire += v.hires; exit += v.exits; open += v.openRoles;
    const turnover = (v.exits / v.headcount) * 100;
    const selected = state.dept === d;
    return '' +
      '<tr class="' + (selected ? 'is-selected' : '') + '" data-row="' + d + '">' +
        '<td>' + d + '</td>' +
        '<td class="num">' + v.headcount + '</td>' +
        '<td class="num">' + v.hires + '</td>' +
        '<td class="num">' + v.exits + '</td>' +
        '<td class="num">' + turnover.toFixed(1) + '%</td>' +
        '<td class="num">' + v.openRoles + '</td>' +
      '</tr>';
  }).join('');

  const totalRow = '' +
    '<tr class="total-row">' +
      '<td>All departments</td>' +
      '<td class="num">' + hc + '</td>' +
      '<td class="num">' + hire + '</td>' +
      '<td class="num">' + exit + '</td>' +
      '<td class="num">' + ((exit / hc) * 100).toFixed(1) + '%</td>' +
      '<td class="num">' + open + '</td>' +
    '</tr>';

  qs('[data-table] tbody').innerHTML = rows + totalRow;

  // clicking a row selects the department too
  Array.prototype.forEach.call(document.querySelectorAll('[data-row]'), function (tr) {
    tr.addEventListener('click', function () {
      const d = tr.getAttribute('data-row');
      setState({ dept: state.dept === d ? 'All' : d });
    });
  });
}

// ---------------------------------------------------------------------------
// Orchestration
// ---------------------------------------------------------------------------

function renderAll() {
  renderKpis();
  renderHeadcountChart();
  renderTurnoverChart();
  renderWorkforceChart();
  renderFunnelChart();
  renderTable();

  // reflect the active department in the scope caption
  const caption = qs('[data-scope]');
  if (caption) {
    caption.textContent = state.dept === 'All'
      ? 'All departments · ' + state.year
      : state.dept + ' · ' + state.year;
  }
}

function setState(patch) {
  Object.assign(state, patch);
  const deptSelect = qs('[data-dept]');
  if (deptSelect && deptSelect.value !== state.dept) deptSelect.value = state.dept;
  renderAll();
}

function buildControls() {
  const yearSelect = qs('[data-year]');
  Object.keys(DATA)
    .map(Number)
    .sort(function (a, b) { return b - a; })
    .forEach(function (y) {
      const opt = document.createElement('option');
      opt.value = y; opt.textContent = y;
      if (y === state.year) opt.selected = true;
      yearSelect.appendChild(opt);
    });
  yearSelect.addEventListener('change', function () {
    setState({ year: Number(this.value) });
  });

  const deptSelect = qs('[data-dept]');
  ['All'].concat(DEPARTMENTS).forEach(function (d) {
    const opt = document.createElement('option');
    opt.value = d; opt.textContent = d === 'All' ? 'All departments' : d;
    deptSelect.appendChild(opt);
  });
  deptSelect.addEventListener('change', function () {
    setState({ dept: this.value });
  });
}

document.addEventListener('DOMContentLoaded', function () {
  buildControls();
  renderAll();
});
