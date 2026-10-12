/* RAM LAB — Maths Lab, part 1 (load after ram-lab.js):
   trigonometry (unit circle, waves, right triangles) · graphs of functions · coordinate geometry · algebraic equations.
   Part 2 (ram-lab-maths2.js): matrices, probability, statistics, scatter/regression, constructions.
   Every number shown is computed live from the values on the bench (no pre-recorded answers). */
(function () {
  'use strict';
  const RL = window.RamLab; if (!RL) return;
  const { clamp, fmt } = RL.util;
  const rad = d => d * Math.PI / 180, deg = r => r * 180 / Math.PI, z0 = v => Math.abs(v) < 1e-12 ? 0 : v;
  const L = (x1, y1, x2, y2, c, w, d) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c || '#e8eeff'}" stroke-width="${w || 2}" stroke-linecap="round"${d ? ` stroke-dasharray="${d}"` : ''}/>`;
  const TX = (x, y, t, o) => `<text x="${x}" y="${y}" text-anchor="${(o && o.a) || 'middle'}" font-size="${(o && o.s) || 12}" font-weight="${(o && o.w) || 700}" fill="${(o && o.c) || '#fff'}" pointer-events="none">${t}</text>`;
  const CIR = (x, y, r, f, s, w) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f || 'none'}" stroke="${s || 'none'}" stroke-width="${w || 2}"/>`;
  const sg = (v, d) => (v < 0 ? ' − ' : ' + ') + fmt(Math.abs(v), d == null ? 2 : d);               // " + 3" / " − 2.5"
  const lead = (v, d) => (v < 0 ? '−' : '') + fmt(Math.abs(v), d == null ? 2 : d);                  // "-3"
  const poly = (list, d) => { let o = ''; list.forEach(([v, t]) => { if (v === 0) return; const a = Math.abs(v), body = (a === 1 && t ? '' : fmt(a, d == null ? 2 : d)) + t; o += o === '' ? (v < 0 ? '−' : '') + body : (v < 0 ? ' − ' : ' + ') + body; }); return o || '0'; };
  const COL = ['#4cc9f0', '#ffd23f', '#ff6b9d', '#4ade80', '#b794f6', '#ff9f1c', '#7dd3fc', '#f87171'];
  const SHARED = {};
  RL.maths = SHARED; SHARED.poly = poly; SHARED.L = L; SHARED.TX = TX; SHARED.CIR = CIR; SHARED.sg = sg; SHARED.lead = lead; SHARED.COL = COL; SHARED.rad = rad; SHARED.deg = deg; SHARED.z0 = z0;

  /* ---------- a Cartesian plane drawn into the scene (world coords) ---------- */
  function plane(P, id) {   // P = {ox, oy, sx, sy, x0, x1, y0, y1}
    const X = x => P.ox + x * P.sx, Y = y => P.oy - y * P.sy; let s = `<clipPath id="${id}"><rect x="${X(P.x0)}" y="${Y(P.y1)}" width="${(P.x1 - P.x0) * P.sx}" height="${(P.y1 - P.y0) * P.sy}"/></clipPath>`;
    s += `<rect x="${X(P.x0)}" y="${Y(P.y1)}" width="${(P.x1 - P.x0) * P.sx}" height="${(P.y1 - P.y0) * P.sy}" fill="rgba(10,18,60,.55)" stroke="rgba(160,180,255,.35)" stroke-width="2" rx="4"/>`;
    for (let x = Math.ceil(P.x0); x <= P.x1; x++) s += L(X(x), Y(P.y0), X(x), Y(P.y1), x === 0 ? '#e8eeff' : 'rgba(160,180,255,.16)', x === 0 ? 2.4 : 1);
    for (let y = Math.ceil(P.y0); y <= P.y1; y++) s += L(X(P.x0), Y(y), X(P.x1), Y(y), y === 0 ? '#e8eeff' : 'rgba(160,180,255,.16)', y === 0 ? 2.4 : 1);
    const stx = (P.x1 - P.x0) > 14 ? 2 : 1;
    for (let x = Math.ceil(P.x0); x <= P.x1; x++) if (x !== 0 && x % stx === 0) s += TX(X(x), Y(0) + 14, x, { s: 10, c: '#9fb4ff', w: 600 });
    for (let y = Math.ceil(P.y0); y <= P.y1; y++) if (y !== 0 && y % stx === 0) s += TX(X(0) - 8, Y(y) + 4, y, { s: 10, c: '#9fb4ff', w: 600, a: 'end' });
    return s;
  }
  function curve(P, f, col, w, id, brk) {
    const X = x => P.ox + x * P.sx, Y = y => P.oy - y * P.sy; let d = '', pen = false, py = 0;
    for (let x = P.x0; x <= P.x1 + 1e-9; x += 0.04) { const y = f(x); if (!isFinite(y) || Math.abs(y) > 40 || (pen && brk && Math.abs(y - py) > 5)) { pen = false; if (isFinite(y) && Math.abs(y) <= 40) { d += `M${X(x).toFixed(1)} ${Y(y).toFixed(1)}`; pen = true; } py = y; continue; } d += (pen ? 'L' : 'M') + X(x).toFixed(1) + ' ' + Y(y).toFixed(1); pen = true; py = y; }
    return `<path d="${d}" fill="none" stroke="${col}" stroke-width="${w || 3.2}" stroke-linejoin="round" clip-path="url(#${id})"/>`;
  }
  SHARED.plane = plane; SHARED.curve = curve;
  function findRoots(f, a, b, brk) {   // sign-change scan + bisection, ignores poles
    const r = []; let x0 = a, y0 = f(a);
    for (let x = a + 0.02; x <= b + 1e-9; x += 0.02) {
      const y = f(x); if (isFinite(y0) && isFinite(y) && (y0 === 0 || y0 * y < 0) && !(brk && Math.abs(y - y0) > 3)) {
        let lo = x0, hi = x; for (let i = 0; i < 50; i++) { const m = (lo + hi) / 2, fm = f(m); if (f(lo) * fm <= 0) hi = m; else lo = m; }
        const rt = (lo + hi) / 2; if (Math.abs(f(rt)) < 1e-4 && !r.some(q => Math.abs(q - rt) < 1e-3)) r.push(rt);
      } x0 = x; y0 = y;
    } return r;
  }
  function extrema(f, a, b) {
    const r = [], N = 400, h = (b - a) / N; let ys = []; for (let i = 0; i <= N; i++) ys.push(f(a + i * h));
    for (let i = 1; i < N; i++) { const p = ys[i - 1], c = ys[i], n = ys[i + 1]; if (![p, c, n].every(isFinite)) continue; if ((c > p && c >= n) || (c < p && c <= n)) { if (Math.abs(c - p) < 1 && Math.abs(c - n) < 1) { let lo = a + (i - 1) * h, hi = a + (i + 1) * h; const mx = c > p; for (let k = 0; k < 60; k++) { const m1 = lo + (hi - lo) / 3, m2 = hi - (hi - lo) / 3; if ((f(m1) < f(m2)) === mx) lo = m1; else hi = m2; } const x = (lo + hi) / 2; if (!r.some(q => Math.abs(q.x - x) < 0.05)) r.push({ x, y: f(x), max: mx }); } } } return r.slice(0, 4);
  }
  SHARED.findRoots = findRoots; SHARED.extrema = extrema;

  /* ============================ TRIGONOMETRY ============================ */
  const R = 100;
  const trigAng = W => { const c = W.find('circle')[0]; return c ? c.p.ang : null; };
  function circDraw(it) {
    const a = rad(it.p.ang), c = Math.cos(a), s = Math.sin(a), X = R * c, Y = -R * s; let o = '';
    o += L(-R - 30, 0, R + 50, 0, '#e8eeff', 2) + L(0, -R - 25, 0, R + 25, '#e8eeff', 2) + CIR(0, 0, R, 'rgba(76,201,240,.06)', '#7dd3fc', 2.5);
    if (it.p.tan && Math.abs(c) > 0.05 && Math.abs(Math.tan(a)) <= 2.3) o += L(R, 0, R, -R * Math.tan(a), '#4ade80', 3.2) + L(0, 0, R, -R * Math.tan(a), '#4ade80', 1.4, '4 4');
    o += L(0, 0, X, 0, '#4cc9f0', 4.5) + L(X, 0, X, Y, '#ff5d6c', 4.5) + L(0, 0, X, Y, '#ffd23f', 3.5);
    const e = Math.max(0.01, Math.min(a, 2 * Math.PI)), ar = 24; o += `<path d="M${ar} 0A${ar} ${ar} 0 ${e > Math.PI ? 1 : 0} 0 ${ar * Math.cos(a)} ${-ar * Math.sin(a)}" fill="none" stroke="#ffd23f" stroke-width="2.5"/>`;
    o += CIR(X, Y, 7, '#ffd23f', '#fff', 2.5) + TX(R + 38, 15, 'x', { s: 11, c: '#9fb4ff', w: 600 }) + TX(10, -R - 10, 'y', { s: 11, c: '#9fb4ff', w: 600 });
    o += TX(X / 2, 17 * (s >= 0 ? 1 : -1) + (s >= 0 ? 0 : 4), 'cos', { s: 10.5, c: '#4cc9f0' }) + TX(X + (c >= 0 ? 22 : -22), Y / 2 + 4, 'sin', { s: 10.5, c: '#ff8a9a' });
    o += TX(0, R + 52, `θ = ${fmt(it.p.ang, 0)}°  (${fmt(it.p.ang / 180, 3)}π rad)`, { s: 12.5, c: '#ffe9a8' });
    return o;
  }
  const wx = d => -250 + d / 360 * 500, wy = v => -R * v;
  function waveDraw(it, W) {
    let o = L(-262, 0, 262, 0, '#e8eeff', 2) + L(-250, -R - 25, -250, R + 25, '#e8eeff', 2);
    [0, 90, 180, 270, 360].forEach(d => { o += L(wx(d), -4, wx(d), 4, '#e8eeff', 2) + TX(wx(d), 20, d + '°', { s: 10.5, c: '#9fb4ff', w: 600 }); });
    [-1, 1].forEach(v => { o += L(-254, wy(v), -246, wy(v), '#e8eeff', 2) + TX(-258, wy(v) + 4, v, { s: 10.5, c: '#9fb4ff', w: 600, a: 'end' }); });
    const path = f => { let d = '', pen = false; for (let g = 0; g <= 360; g += 2) { const y = f(rad(g)); if (!isFinite(y) || Math.abs(y) > 2.3) { pen = false; continue; } d += (pen ? 'L' : 'M') + wx(g).toFixed(1) + ' ' + wy(y).toFixed(1); pen = true; } return d; };
    const cur = trigAng(W);
    if (it.p.sin) o += `<path d="${path(Math.sin)}" fill="none" stroke="#ff5d6c" stroke-width="3"/>` + TX(wx(360) - 14, wy(1) - 6, 'sin θ', { s: 11.5, c: '#ff8a9a' });
    if (it.p.cos) o += `<path d="${path(Math.cos)}" fill="none" stroke="#4cc9f0" stroke-width="3"/>` + TX(wx(360) - 14, wy(0.35) - 4, 'cos θ', { s: 11.5, c: '#7dd3fc' });
    if (it.p.tan) o += `<path d="${path(Math.tan)}" fill="none" stroke="#4ade80" stroke-width="2.4" stroke-dasharray="6 3"/>` + TX(wx(360) - 10, wy(2.2), 'tan θ', { s: 11.5, c: '#86efac' });
    if (cur != null) { const a = rad(cur); o += L(wx(cur), -R - 18, wx(cur), R + 18, '#ffd23f', 1.5, '4 4'); if (it.p.sin) o += CIR(wx(cur), wy(Math.sin(a)), 6, '#ff5d6c', '#fff', 2); if (it.p.cos) o += CIR(wx(cur), wy(Math.cos(a)), 6, '#4cc9f0', '#fff', 2); if (it.p.tan && Math.abs(Math.tan(a)) < 2.3) o += CIR(wx(cur), wy(Math.tan(a)), 5, '#4ade80', '#fff', 2); }
    return o;
  }
  function rtGeom(it) { const o = it.p.opp, a = it.p.adj, h = Math.hypot(o, a); return { o, a, h, th: deg(Math.atan2(o, a)) }; }
  function rtDraw(it) {
    const g = rtGeom(it), sc = 130 / Math.max(g.o, g.a), w = g.a * sc, hh = g.o * sc, x0 = -w / 2, y0 = hh / 2;
    let s = `<polygon points="${x0},${y0} ${x0 + w},${y0} ${x0 + w},${y0 - hh}" fill="rgba(255,210,63,.12)" stroke="#ffd23f" stroke-width="3" stroke-linejoin="round"/>`;
    s += `<path d="M${x0 + w - 14} ${y0}v-14h14" fill="none" stroke="#e8eeff" stroke-width="2"/>`;
    s += `<path d="M${x0 + 30} ${y0}A30 30 0 0 0 ${x0 + 30 * Math.cos(rad(g.th))} ${y0 - 30 * Math.sin(rad(g.th))}" fill="none" stroke="#ff9f1c" stroke-width="2.5"/>` + TX(x0 + 44, y0 - 6, 'θ', { s: 13, c: '#ff9f1c' });
    s += TX(x0 + w / 2, y0 + 17, 'adjacent = ' + fmt(g.a, 1), { s: 11.5, c: '#7dd3fc' }) + TX(x0 + w + 8, y0 - hh / 2 + 4, 'opposite = ' + fmt(g.o, 1), { s: 11.5, c: '#ff8a9a', a: 'start' }) + TX(x0 + w / 2 - 6, y0 - hh / 2 - 8, 'hyp = ' + fmt(g.h, 2), { s: 11.5, c: '#ffe9a8', a: 'end' });
    return s;
  }
  const quad4 = a => { a = ((a % 360) + 360) % 360; return a === 0 || a === 90 || a === 180 || a === 270 ? 'on an axis' : a < 90 ? 'Quadrant I (all +)' : a < 180 ? 'Quadrant II (only sin +)' : a < 270 ? 'Quadrant III (only tan +)' : 'Quadrant IV (only cos +)'; };
  const refAng = a => { a = ((a % 360) + 360) % 360; return a <= 90 ? a : a <= 180 ? 180 - a : a <= 270 ? a - 180 : 360 - a; };
  RL.register({
    id: 'trig', lab: 'maths', topic: 'Trigonometry', title: 'Unit Circle, Sine & Cosine Waves', icon: '📐', level: 'Intermediate', model: 'full',
    assumptions: 'Exact trigonometric functions computed with JavaScript Math.sin/cos/tan. The tan curve is clipped at |tan θ| > 2.3 so it fits the picture.',
    objective: 'See how sin θ, cos θ and tan θ come from a point moving round the unit circle, and how that makes the sine and cosine waves.',
    theory: '<p>On a circle of radius 1, the point at angle θ has coordinates <b>(cos θ, sin θ)</b>. So cos θ is the horizontal distance and sin θ the vertical distance, while <b>tan θ = sin θ ÷ cos θ</b> (undefined when cos θ = 0). As θ increases, the heights trace the sine wave and the horizontal distances trace the cosine wave. In a right-angled triangle: sin θ = opposite/hypotenuse, cos θ = adjacent/hypotenuse, tan θ = opposite/adjacent.</p><p><b>ASTC</b> (All, Sin, Tan, Cos) tells which ratios are positive in quadrants I–IV.</p>',
    formulas: ['sin²θ + cos²θ = 1', 'tan θ = sin θ ÷ cos θ', 'sin θ = opp/hyp · cos θ = adj/hyp · tan θ = opp/adj', 'rad = deg × π/180'], fixedView: true, animated: false, params: [],
    types: {
      circle: { name: () => 'Unit circle', icon: '⭕', w: 300, h: 290, fixed: true, defaults: { ang: 30, tan: false }, props: [{ k: 'ang', label: 'Angle θ', min: 0, max: 360, step: 1, unit: '°', val: 30 }, { k: 'tan', label: 'Show tangent line', type: 'toggle' }], info: 'Slide θ or press ▶ Run to sweep the angle.', draw: circDraw },
      wave: { name: () => 'Wave graph', icon: '〰️', w: 560, h: 280, fixed: true, defaults: { sin: true, cos: true, tan: false }, props: [{ k: 'sin', label: 'Sine curve', type: 'toggle' }, { k: 'cos', label: 'Cosine curve', type: 'toggle' }, { k: 'tan', label: 'Tangent curve', type: 'toggle' }], info: 'Plots the three functions against θ, with a marker at the current angle.', draw: waveDraw },
      rt: { name: () => 'Right-angled triangle', icon: '📐', w: 330, h: 180, defaults: { opp: 3, adj: 4 }, props: [{ k: 'opp', label: 'Opposite side', min: 1, max: 12, step: 0.5, unit: '', val: 3 }, { k: 'adj', label: 'Adjacent side', min: 1, max: 12, step: 0.5, unit: '', val: 4 }], info: 'Drag it anywhere. The ratios are computed from the side lengths.', draw: rtDraw }
    },
    catalog: [{ type: 'circle', name: 'Unit circle', icon: '⭕', desc: 'Point on a circle of radius 1', max: 1, tags: 'angle sin cos tan radius' }, { type: 'wave', name: 'Sine / cosine wave', icon: '〰️', desc: 'Graph of the functions', max: 1, tags: 'graph curve periodic' }, { type: 'rt', name: 'Right-angled triangle', icon: '📐', desc: 'Find ratios from side lengths', max: 1, tags: 'opposite adjacent hypotenuse pythagoras soh cah toa' }],
    init(W) { W.add('circle', 190, 215, { ang: 30 }); W.add('wave', 690, 215); W.add('rt', 190, 450); },
    step(W, dt) { const c = W.find('circle')[0]; if (c) c.p.ang = (c.p.ang + dt * 36) % 360; },
    sim() { }, animated: false,
    messages(W) { const r = []; if (!W.find('circle')[0] && !W.find('rt')[0]) return [{ t: 'info', m: 'Add a unit circle or a right-angled triangle.' }]; if (W.find('wave')[0] && !W.find('circle')[0]) r.push({ t: 'info', m: 'Add the unit circle to see a marker move along the wave.' }); const c = W.find('circle')[0]; if (c && (c.p.ang === 90 || c.p.ang === 270)) r.push({ t: 'warn', m: `At ${c.p.ang}° cos θ = 0, so tan θ is <b>undefined</b> (the tangent line is parallel to the radius).` }); return r; },
    readouts(W) {
      const r = [], c = W.find('circle')[0], t = W.find('rt')[0];
      if (c) { const a = rad(c.p.ang), cs = z0(Math.cos(a)), sn = z0(Math.sin(a)), tn = Math.abs(cs) < 1e-9 ? Infinity : sn / cs; r.push({ l: 'Angle θ', v: c.p.ang, u: '°', d: 0 }, { l: 'In radians', v: a, u: 'rad', d: 3 }, { l: 'sin θ', v: sn, d: 4 }, { l: 'cos θ', v: cs, d: 4 }, { l: 'tan θ', v: tn, d: 4 }, { l: 'sin²θ + cos²θ', v: sn * sn + cs * cs, d: 4 }, { l: 'Reference angle', v: refAng(c.p.ang), u: '°', d: 0 }, { l: 'Position', v: quad4(c.p.ang) }); }
      if (t) { const g = rtGeom(t); r.push({ l: 'Hypotenuse (Pythagoras)', v: g.h, d: 3 }, { l: 'Angle θ = tan⁻¹(opp/adj)', v: g.th, u: '°', d: 2 }, { l: 'sin θ = opp/hyp', v: g.o / g.h, d: 4 }, { l: 'cos θ = adj/hyp', v: g.a / g.h, d: 4 }, { l: 'tan θ = opp/adj', v: g.o / g.a, d: 4 }); }
      return r;
    },
    live(W) { const r = [], c = W.find('circle')[0], t = W.find('rt')[0]; if (c) { const a = rad(c.p.ang); r.push(`(cos θ, sin θ) = (${fmt(z0(Math.cos(a)), 3)}, ${fmt(z0(Math.sin(a)), 3)})`); } if (t) { const g = rtGeom(t); r.push(`tan θ = ${fmt(g.o, 1)} ÷ ${fmt(g.a, 1)} = <b>${fmt(g.o / g.a, 3)}</b> → θ = <b>${fmt(g.th, 2)}°</b>`); } return r; },
    graphs: [{ id: 'sc', title: 'sin θ and cos θ against θ (press ▶ Run)', x: 'θ (°)', y: 'value', series: [{ n: 'sin', c: '#ff5d6c' }, { n: 'cos', c: '#4cc9f0' }], sample(W) { const a = trigAng(W); return a == null ? null : [Math.round(a), Math.sin(rad(a)), Math.cos(rad(a))]; } }],
    guided: {
      objective: 'Discover the values of sin, cos and tan for key angles and where each is positive or negative.', setup: W => { W.add('circle', 190, 215, { ang: 30 }); W.add('wave', 690, 215); },
      steps: [{ t: 'Place the unit circle and the wave graph (or tap “Set up for me”). Set θ = 30°.', predict: { q: 'What is sin 30°?', opts: ['0.5', '0.866', '1'], a: 0, why: 'In the 30°–60°–90° triangle the side opposite 30° is half the hypotenuse, so sin 30° = 0.5.' }, ok: W => { const a = trigAng(W); return a != null && Math.abs(a - 30) < 1.5; } },
        { t: 'Now set θ = 150°. Compare sin 150° with sin 30°. They are equal: the reference angle is the same.', ok: W => { const a = trigAng(W); return a != null && Math.abs(a - 150) < 1.5; } },
        { t: 'Move θ to about 210°. Which of sin, cos is negative? (Look at the Results panel.)', ok: W => { const a = trigAng(W); return a != null && Math.abs(a - 210) < 6; } },
        { t: 'Press ▶ Run and watch the marker travel round the circle and along both waves. Stop after one full turn.', ok: W => W.t > 4 },
        { t: 'Set θ = 90°: cos θ = 0, so tan θ is undefined. Check the Results panel and the warning.', ok: W => { const a = trigAng(W); return a != null && Math.abs(a - 90) < 1.5; } }],
      done: () => 'sin and cos are the y and x coordinates on the unit circle. They repeat every 360°, always satisfy sin²θ + cos²θ = 1, and their signs follow ASTC.'
    },
    quiz: [{ q: 'What is cos 60°?', opts: ['0.5', '0.866', '1'], a: 0, why: 'cos 60° = sin 30° = 0.5.' }, { q: 'In which quadrant are both sin θ and cos θ negative?', opts: ['Third (180°–270°)', 'Second', 'Fourth'], a: 0, why: 'In quadrant III both x and y are negative; only tan is positive there.' }, { q: 'A right-angled triangle has opposite 3 and adjacent 4. Its hypotenuse is…', opts: ['5', '7', '3.5'], a: 0, why: '√(3² + 4²) = √25 = 5.' }]
  });

  /* ============================ GRAPHS OF FUNCTIONS ============================ */
  const FP = { ox: 640, oy: 285, sx: 40, sy: 40, x0: -8.25, x1: 8.25, y0: -6.8, y1: 6.8 };
  const FK = {
    lin: ['Straight line', p => 'y = ' + poly([[p.a, 'x'], [p.b, '']]), (p, x) => p.a * x + p.b],
    quad: ['Quadratic', p => 'y = ' + poly([[p.a, 'x²'], [p.b, 'x'], [p.c, '']]), (p, x) => p.a * x * x + p.b * x + p.c],
    cub: ['Cubic', p => 'y = ' + poly([[p.a, 'x³'], [p.b, 'x²'], [p.c, 'x']]), (p, x) => p.a * x * x * x + p.b * x * x + p.c * x],
    sin: ['Sine wave', p => `y = ${lead(p.a)} sin(${fmt(p.b, 1)}x${sg(p.c, 1)})`, (p, x) => p.a * Math.sin(p.b * x + p.c)],
    cos: ['Cosine wave', p => `y = ${lead(p.a)} cos(${fmt(p.b, 1)}x${sg(p.c, 1)})`, (p, x) => p.a * Math.cos(p.b * x + p.c)],
    exp: ['Exponential', p => `y = ${lead(p.a)}e^(${fmt(p.b, 1)}x)${sg(p.c)}`, (p, x) => p.a * Math.exp(p.b * x) + p.c],
    abs: ['Modulus', p => `y = ${lead(p.a)}|x${sg(p.b)}|${sg(p.c)}`, (p, x) => p.a * Math.abs(x + p.b) + p.c],
    rec: ['Reciprocal', p => `y = ${lead(p.a)} ÷ (x${sg(p.b)})${sg(p.c)}`, (p, x) => Math.abs(x + p.b) < 1e-9 ? NaN : p.a / (x + p.b) + p.c],
    sqrt: ['Square root', p => `y = ${lead(p.a)}√(x${sg(p.b)})${sg(p.c)}`, (p, x) => x + p.b < 0 ? NaN : p.a * Math.sqrt(x + p.b) + p.c],
    log: ['Logarithm', p => `y = ${lead(p.a)} ln(x${sg(p.b)})${sg(p.c)}`, (p, x) => x + p.b <= 0 ? NaN : p.a * Math.log(x + p.b) + p.c]
  };
  const fnF = it => x => FK[it.p.kind][2](it.p, x);
  const fnIdx = (it, W) => W.items.filter(i => i.type === 'fn').indexOf(it);
  const fnSel = W => { const f = W.items.filter(i => i.type === 'fn'); return (W.sel && W.sel.kind === 'item' && f.find(i => i.id === W.sel.id)) || f[0] || null; };
  const FDEF = { lin: { a: 1, b: 0, c: 0 }, quad: { a: 1, b: 0, c: -4 }, cub: { a: 0.25, b: 0, c: -1 }, sin: { a: 2, b: 1, c: 0 }, cos: { a: 2, b: 1, c: 0 }, exp: { a: 1, b: 0.5, c: 0 }, abs: { a: 1, b: 0, c: 0 }, rec: { a: 2, b: 0, c: 0 }, sqrt: { a: 1, b: 4, c: 0 }, log: { a: 2, b: 0.5, c: 0 } };
  const DOMN = { rec: 'x ≠ −b (vertical asymptote at x = −b)', sqrt: 'x ≥ −b', log: 'x > −b' };
  RL.register({
    id: 'funcs', lab: 'maths', topic: 'Graphs & Functions', title: 'Graphs of Functions', icon: '📈', level: 'Intermediate', model: 'full',
    assumptions: 'Curves are plotted by evaluating the formula at many x-values. Roots, turning points and intersections are found numerically (sign changes + bisection / ternary search) over the visible window −8.25 ≤ x ≤ 8.25, so features outside the window are not reported.',
    objective: 'Plot several functions together, change their constants a, b, c, and see how the graph, roots, intercepts and turning points respond.',
    theory: '<p>A function assigns one output y to each input x. Changing the constants <b>stretches, shifts or reflects</b> its graph: in y = a·f(x+b) + c, <i>a</i> stretches vertically (negative flips), <i>b</i> shifts left/right and <i>c</i> shifts up/down (for the forms used here). <b>Roots</b> are where the graph crosses the x-axis (y = 0); the <b>y-intercept</b> is f(0). Where two graphs cross, f(x) = g(x).</p><p>The slope at a point is the gradient of the tangent line (the derivative).</p>',
    formulas: ['y = mx + c', 'y = ax² + bx + c', 'roots: x = [−b ± √(b² − 4ac)] ÷ 2a', 'gradient ≈ [f(x+h) − f(x−h)] ÷ 2h'], fixedView: true, animated: false,
    params: [{ k: 'xt', label: 'Trace point x', min: -8, max: 8, step: 0.1, unit: '', val: 1 }, { k: 'tan', label: 'Show tangent line at x', type: 'toggle', val: false }],
    types: {
      fn: { name: it => FK[it.p.kind][0], icon: '📈', w: 230, h: 46, fixed: true, defaults: { kind: 'lin', a: 1, b: 0, c: 0, on: true },
        props: [{ k: 'kind', label: 'Type of function', type: 'select', options: Object.keys(FK).map(k => [k, FK[k][0]]), val: 'lin' }, { k: 'a', label: 'a', min: -5, max: 5, step: 0.1, val: 1 }, { k: 'b', label: 'b', min: -5, max: 5, step: 0.1, val: 0 }, { k: 'c', label: 'c', min: -5, max: 5, step: 0.1, val: 0 }, { k: 'on', label: 'Visible', type: 'toggle' }],
        onProp(it, k) { if (k === 'kind') Object.assign(it.p, FDEF[it.p.kind]); },
        info: 'Tap to select; change its type and constants in the panel on the right.',
        draw: (it, W) => { const c = COL[fnIdx(it, W) % COL.length]; return `<rect x="-115" y="-22" width="230" height="44" rx="10" fill="rgba(20,30,80,.85)" stroke="${c}" stroke-width="2.5" opacity="${it.p.on ? 1 : .45}"/><circle cx="-98" cy="0" r="6" fill="${c}"/>` + TX(8, 5, FK[it.p.kind][1](it.p), { s: 12, c: '#fff' }); }, place: null }
    },
    catalog: Object.keys(FK).map(k => ({ type: 'fn', name: FK[k][0], icon: { lin: '📏', quad: '🥣', cub: '〰️', sin: '🌊', cos: '🌊', exp: '🚀', abs: '✔️', rec: '↔️', sqrt: '√', log: 'ln' }[k], desc: FK[k][1](Object.assign({ a: 1, b: 0, c: 0 }, FDEF[k])), props: Object.assign({ kind: k }, FDEF[k]), tags: 'graph function curve ' + FK[k][0] })),
    init(W) { W.add('fn', 120, 55, { kind: 'quad', a: 1, b: 0, c: -4 }); W.add('fn', 120, 115, { kind: 'lin', a: 1, b: 1, c: 0 }); },
    sim() { },
    onAdd(W, it) { Object.assign(it.p, Object.assign({ a: 1, b: 0, c: 0 }, FDEF[it.p.kind], it.p.a != null && it.p.kind ? {} : {})); const n = W.items.filter(i => i.type === 'fn').length; it.x = 120; it.y = 55 + ((n - 1) % 8) * 58; },
    bg(W) {
      let s = plane(FP, 'mfclip'); const fs = W.items.filter(i => i.type === 'fn' && i.p.on);
      fs.forEach(it => { s += curve(FP, fnF(it), COL[fnIdx(it, W) % COL.length], 3.4, 'mfclip', it.p.kind === 'rec'); });
      const sel = fnSel(W), X = x => FP.ox + x * FP.sx, Y = y => FP.oy - y * FP.sy;
      if (sel) { const f = fnF(sel), x = W.params.xt, y = f(x); if (isFinite(y) && Math.abs(y) < 7) { if (W.params.tan) { const h = 1e-5, m = (f(x + h) - f(x - h)) / (2 * h); if (isFinite(m)) s += `<g clip-path="url(#mfclip)">` + L(X(x - 10), Y(y - 10 * m), X(x + 10), Y(y + 10 * m), '#e8eeff', 2, '7 5') + '</g>'; } s += L(X(x), Y(0), X(x), Y(y), 'rgba(255,255,255,.5)', 1.5, '4 4') + L(X(0), Y(y), X(x), Y(y), 'rgba(255,255,255,.5)', 1.5, '4 4') + CIR(X(x), Y(y), 7, '#fff', COL[fnIdx(sel, W) % COL.length], 3); } }
      return s;
    },
    messages(W) {
      const r = [], fs = W.items.filter(i => i.type === 'fn'); if (!fs.length) return [{ t: 'info', m: 'Add a function from the equipment list.' }];
      fs.forEach(it => { const k = it.p.kind, lbl = FK[k][0]; if (it.p.a === 0) r.push({ t: 'warn', m: `${lbl}: a = 0, so the curve collapses to a constant/line — increase |a|.` }); if (DOMN[k]) r.push({ t: 'info', m: `${lbl} is defined only for ${DOMN[k]}.` }); });
      return r.slice(0, 4);
    },
    readouts(W) {
      const it = fnSel(W); if (!it) return []; const f = fnF(it), k = it.p.kind, o = [{ l: 'Selected', v: FK[k][0] }, { l: 'Equation', v: FK[k][1](it.p) }]; const x = W.params.xt, y = f(x), h = 1e-5, m = (f(x + h) - f(x - h)) / (2 * h);
      o.push({ l: 'f(x) at trace x = ' + fmt(x, 1), v: isFinite(y) ? y : 'undefined', d: 3 }, { l: 'Gradient at that x', v: isFinite(m) ? m : 'undefined', d: 3 });
      const y0 = f(0); o.push({ l: 'y-intercept f(0)', v: isFinite(y0) ? y0 : 'none', d: 3 });
      let roots = findRoots(f, FP.x0, FP.x1, k === 'rec'); if (k === 'quad' && it.p.a !== 0) { const D = it.p.b * it.p.b - 4 * it.p.a * it.p.c; roots = D < 0 ? [] : D === 0 ? [-it.p.b / (2 * it.p.a)] : [(-it.p.b - Math.sqrt(D)) / (2 * it.p.a), (-it.p.b + Math.sqrt(D)) / (2 * it.p.a)]; o.push({ l: 'Discriminant b² − 4ac', v: D, d: 2 }, { l: 'Vertex', v: `(${fmt(-it.p.b / (2 * it.p.a), 2)}, ${fmt(f(-it.p.b / (2 * it.p.a)), 2)})` }); }
      o.push({ l: 'Roots (x-axis crossings)', v: roots.length ? roots.map(q => fmt(q, 3)).join(', ') : 'none in view' });
      if (k !== 'quad' && k !== 'lin') { const e = extrema(f, FP.x0, FP.x1); if (e.length) o.push({ l: 'Turning points', v: e.map(q => `${q.max ? 'max' : 'min'} (${fmt(q.x, 2)}, ${fmt(q.y, 2)})`).join('; ') }); }
      const fs = W.items.filter(i => i.type === 'fn' && i.p.on); if (fs.length > 1) { const g = fnF(fs[1] === it ? fs[0] : fs[1]), f0 = fnF(it), xs = findRoots(x => f0(x) - g(x), FP.x0, FP.x1, true); o.push({ l: 'Meets another graph at x =', v: xs.length ? xs.map(q => fmt(q, 3)).join(', ') : 'never (in view)' }); }
      return o;
    },
    live(W) { const it = fnSel(W); if (!it) return []; const x = W.params.xt, y = fnF(it)(x); return [FK[it.p.kind][1](it.p), `at x = ${fmt(x, 1)}: y = <b>${isFinite(y) ? fmt(y, 3) : 'undefined'}</b>`]; },
    graphs: [{ id: 'tv', title: 'Table of values — press 📍 Record at different x', x: 'x', y: 'y = f(x)', manual: true, points: true, series: [{ n: 'f(x)', c: '#4cc9f0' }], sample(W) { const it = fnSel(W); if (!it) return null; const y = fnF(it)(W.params.xt); return isFinite(y) ? [Math.round(W.params.xt * 10) / 10, y] : null; } }],
    guided: {
      objective: 'Find how the constants a, b and c change a parabola, and where it crosses the x-axis.', setup: W => { W.add('fn', 120, 55, { kind: 'quad', a: 1, b: 0, c: -4 }); W.params.xt = 2; W.params.tan = false; },
      steps: [{ t: 'Place a quadratic y = x² − 4 (or tap “Set up for me”). Read its roots in Results.', predict: { q: 'Where does y = x² − 4 cross the x-axis?', opts: ['x = −2 and x = 2', 'x = 4 only', 'x = −4 and x = 4'], a: 0, why: 'x² − 4 = 0 → x² = 4 → x = ±2.' }, ok: W => W.items.some(i => i.type === 'fn' && i.p.kind === 'quad') },
        { t: 'Select the curve and change c to −1. The whole graph slides up. What are the new roots?', ok: W => { const f = W.items.find(i => i.type === 'fn' && i.p.kind === 'quad'); return f && Math.abs(f.p.c + 4) > 0.3; } },
        { t: 'Make a negative. The parabola flips upside down and the vertex becomes a maximum.', ok: W => { const f = W.items.find(i => i.type === 'fn' && i.p.kind === 'quad'); return f && f.p.a < 0; } },
        { t: 'Add a straight line from the equipment list. Where do the line and the parabola meet? (See “Meets another graph”.)', ok: W => W.items.filter(i => i.type === 'fn').length >= 2 },
        { t: 'Move the trace point and press 📍 Record three times to build a table of values.', ok: W => (W.graph.tv || []).length >= 3 }],
      done: () => 'Changing a, b, c transforms the graph in predictable ways, and roots/intersections are the solutions of f(x) = 0 or f(x) = g(x).'
    },
    quiz: [{ q: 'The roots of y = x² − 5x + 6 are…', opts: ['2 and 3', '−2 and −3', '1 and 6'], a: 0, why: 'x² − 5x + 6 = (x − 2)(x − 3).' }, { q: 'Replacing y = x² by y = x² + 3 …', opts: ['moves the graph up 3 units', 'moves it right 3 units', 'makes it narrower'], a: 0, why: 'Adding a constant to y shifts the graph vertically.' }, { q: 'The graph of y = 1/x has…', opts: ['a vertical asymptote at x = 0', 'a root at x = 1', 'a maximum at x = 0'], a: 0, why: '1/x is undefined at x = 0 and grows without bound near it.' }]
  });

  /* ============================ COORDINATE GEOMETRY ============================ */
  const CP = { ox: 500, oy: 290, sx: 40, sy: 40, x0: -12.4, x1: 12.4, y0: -6.9, y1: 6.9 };
  const pts = W => W.items.filter(i => i.type === 'pt').sort((a, b) => a.id - b.id);
  const ptLbl = (it, W) => 'ABCD'[pts(W).indexOf(it)] || '?';
  const ptXY = it => [it.p.gx, it.p.gy];
  const wxy = (gx, gy) => [CP.ox + gx * CP.sx, CP.oy - gy * CP.sy];
  const PSPOT = [[-4, -2], [3, 3], [5, -3], [-3, 4]];
  function sqrtText(n) { const r = Math.sqrt(n); if (Math.abs(r - Math.round(r)) < 1e-9) return String(Math.round(r)); let k = 1, m = n; for (let i = Math.floor(r); i > 1; i--) if (Number.isInteger(n / (i * i))) { k = i; m = n / (i * i); break; } return (k > 1 ? k : '') + '√' + m; }
  function lineEq(a, b) {
    const dx = b[0] - a[0], dy = b[1] - a[1]; if (dx === 0 && dy === 0) return null; if (dx === 0) return { vert: true, text: `x = ${a[0]}` };
    const m = dy / dx, c = a[1] - m * a[0]; return { m, c, text: `y = ${m === 1 ? '' : m === -1 ? '−' : lead(m, 3)}x${c === 0 ? '' : sg(c, 3)}` };
  }
  function triType(P) {
    const d = [[0, 1], [1, 2], [0, 2]].map(([i, j]) => (P[i][0] - P[j][0]) ** 2 + (P[i][1] - P[j][1]) ** 2).sort((a, b) => a - b); const area2 = Math.abs((P[1][0] - P[0][0]) * (P[2][1] - P[0][1]) - (P[2][0] - P[0][0]) * (P[1][1] - P[0][1]));
    if (area2 === 0) return 'collinear (not a triangle)'; const t = []; if (d[0] + d[1] === d[2]) t.push('right-angled'); if (d[0] === d[1] || d[1] === d[2]) t.push('isosceles'); if (d[0] === d[1] && d[1] === d[2]) t.push('equilateral'); return (t.length ? t.join(' & ') : 'scalene') + ' triangle';
  }
  RL.register({
    id: 'coord', lab: 'maths', topic: 'Coordinate Geometry', title: 'Coordinate Geometry Explorer', icon: '📍', level: 'Intermediate', model: 'full',
    assumptions: 'Points snap to whole-number coordinates so that the distance, gradient and area can be checked by hand. All formulas are exact (lengths shown in surd form).',
    objective: 'Place points on a grid and use the distance, midpoint, gradient and area formulas — then see the geometry confirm the numbers.',
    theory: '<p>For points A(x₁, y₁) and B(x₂, y₂): the <b>distance</b> is √[(x₂−x₁)² + (y₂−y₁)²], the <b>midpoint</b> is ((x₁+x₂)/2, (y₁+y₂)/2) and the <b>gradient</b> is (y₂−y₁)/(x₂−x₁). Perpendicular lines have gradients whose product is −1. The area of a triangle is ½|x₁(y₂−y₃) + x₂(y₃−y₁) + x₃(y₁−y₂)|.</p>',
    formulas: ['d = √[(x₂−x₁)² + (y₂−y₁)²]', 'M = ((x₁+x₂)/2, (y₁+y₂)/2)', 'm = (y₂−y₁)/(x₂−x₁)', 'y − y₁ = m(x − x₁)', 'm₁ × m₂ = −1 (perpendicular)'], fixedView: true, animated: false,
    params: [{ k: 'ext', label: 'Extend line AB', type: 'toggle', val: true }, { k: 'tri', label: 'Draw polygon through points', type: 'toggle', val: true }, { k: 'perp', label: 'Perpendicular bisector of AB', type: 'toggle', val: false }, { k: 'circ', label: 'Circle with diameter AB', type: 'toggle', val: false }],
    types: {
      pt: { name: (it) => 'Point', icon: '📍', w: 60, h: 60, defaults: { gx: 0, gy: 0 }, props: [{ k: 'gx', label: 'x-coordinate', min: -12, max: 12, step: 1, val: 0 }, { k: 'gy', label: 'y-coordinate', min: -6, max: 6, step: 1, val: 0 }], info: 'Drag it — it snaps to the grid — or use the sliders.',
        onProp(it) { const [x, y] = wxy(it.p.gx, it.p.gy); it.x = x; it.y = y; },
        onDrag(it) { const gx = clamp(Math.round((it.x - CP.ox) / CP.sx), -12, 12), gy = clamp(Math.round((CP.oy - it.y) / CP.sy), -6, 6); it.p.gx = gx; it.p.gy = gy; const [x, y] = wxy(gx, gy); it.x = x; it.y = y; },
        onDrop(it) { const [x, y] = wxy(it.p.gx, it.p.gy); it.x = x; it.y = y; },
        draw: (it, W) => `<circle r="9" fill="#ffd23f" stroke="#fff" stroke-width="3"/>` + TX(0, -16, ptLbl(it, W), { s: 15, c: '#ffd23f' }) + TX(16, 22, `(${it.p.gx}, ${it.p.gy})`, { s: 11, c: '#ffe9a8', a: 'start' }) }
    },
    catalog: [{ type: 'pt', name: 'Point', icon: '📍', desc: 'Up to four points: A, B, C, D', tags: 'coordinates vertex plot' }],
    init(W) { },
    onAdd(W, it) { const n = pts(W).length - 1, s = PSPOT[n % 4]; it.p.gx = s[0]; it.p.gy = s[1]; const [x, y] = wxy(s[0], s[1]); it.x = x; it.y = y; if (n >= 4) { W.remove(it.id); } },
    sim() { },
    bg(W) {
      let s = plane(CP, 'cgclip'); const P = pts(W), X = x => CP.ox + x * CP.sx, Y = y => CP.oy - y * CP.sy;
      if (P.length >= 2) { const A = ptXY(P[0]), B = ptXY(P[1]); const e = lineEq(A, B);
        if (e && W.params.ext) { const f = e.vert ? [X(A[0]), Y(-7), X(A[0]), Y(7)] : [X(-13), Y(e.m * -13 + e.c), X(13), Y(e.m * 13 + e.c)]; s += `<g clip-path="url(#cgclip)">` + L(f[0], f[1], f[2], f[3], 'rgba(76,201,240,.55)', 2.2, '8 6') + '</g>'; }
        s += L(X(A[0]), Y(A[1]), X(B[0]), Y(B[1]), '#4cc9f0', 4);
        if (W.params.perp && e) { const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], dx = B[0] - A[0], dy = B[1] - A[1]; s += `<g clip-path="url(#cgclip)">` + L(X(M[0] - dy * 12), Y(M[1] + dx * 12), X(M[0] + dy * 12), Y(M[1] - dx * 12), '#ff9f1c', 2.5, '6 5') + '</g>' + CIR(X(M[0]), Y(M[1]), 5, '#ff9f1c', '#fff', 2) + TX(X(M[0]) + 8, Y(M[1]) - 8, 'M', { s: 12, c: '#ff9f1c', a: 'start' }); }
        if (W.params.circ) { const M = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], r = Math.hypot(B[0] - A[0], B[1] - A[1]) / 2; s += `<g clip-path="url(#cgclip)">` + CIR(X(M[0]), Y(M[1]), r * CP.sx, 'rgba(183,148,246,.08)', '#b794f6', 2.5) + '</g>'; } }
      if (W.params.tri && P.length >= 3) s += `<polygon points="${P.map(p => X(p.p.gx) + ',' + Y(p.p.gy)).join(' ')}" fill="rgba(255,210,63,.12)" stroke="#ffd23f" stroke-width="3" stroke-linejoin="round"/>`;
      return s;
    },
    messages(W) { const P = pts(W), r = []; if (P.length < 2) return [{ t: 'info', m: 'Add at least two points (A and B) to measure.' }]; const A = ptXY(P[0]), B = ptXY(P[1]); if (A[0] === B[0] && A[1] === B[1]) r.push({ t: 'warn', m: 'A and B are the same point: the distance is 0 and there is no line.' }); else if (A[0] === B[0]) r.push({ t: 'info', m: 'AB is vertical: its gradient is undefined and its equation is x = constant.' }); if (P.length === 4 && W.params.tri) r.push({ t: 'info', m: 'The polygon follows the order A→B→C→D.' }); return r; },
    readouts(W) {
      const P = pts(W); if (P.length < 2) return []; const A = ptXY(P[0]), B = ptXY(P[1]), dx = B[0] - A[0], dy = B[1] - A[1], d2 = dx * dx + dy * dy, o = [];
      o.push({ l: 'A', v: `(${A[0]}, ${A[1]})` }, { l: 'B', v: `(${B[0]}, ${B[1]})` }, { l: 'Distance AB', v: `${sqrtText(d2)} ≈ ${fmt(Math.sqrt(d2), 3)}` }, { l: 'Midpoint of AB', v: `(${fmt((A[0] + B[0]) / 2, 1)}, ${fmt((A[1] + B[1]) / 2, 1)})` });
      const e = lineEq(A, B); if (e) { o.push({ l: 'Gradient of AB', v: e.vert ? 'undefined (vertical)' : fmt(e.m, 3) }, { l: 'Equation of AB', v: e.text }); if (!e.vert) o.push({ l: 'Perpendicular gradient', v: e.m === 0 ? 'undefined' : fmt(-1 / e.m, 3) }, { l: 'Angle with x-axis', v: fmt(deg(Math.atan(e.m)), 1) + '°' }); else o.push({ l: 'Perpendicular gradient', v: '0' }); }
      if (P.length >= 3) { const Q = P.map(ptXY), t = Q.slice(0, 3), area = Math.abs(t[0][0] * (t[1][1] - t[2][1]) + t[1][0] * (t[2][1] - t[0][1]) + t[2][0] * (t[0][1] - t[1][1])) / 2, per = [[0, 1], [1, 2], [2, 0]].reduce((s, [i, j]) => s + Math.hypot(t[i][0] - t[j][0], t[i][1] - t[j][1]), 0); o.push({ l: 'Triangle ABC', v: triType(t) }, { l: 'Area of ABC', v: area, u: 'sq units', d: 2 }, { l: 'Perimeter of ABC', v: per, u: 'units', d: 3 }); }
      if (P.length === 4) { const Q = P.map(ptXY); o.push({ l: 'ABCD a parallelogram?', v: (Q[1][0] - Q[0][0] === Q[2][0] - Q[3][0] && Q[1][1] - Q[0][1] === Q[2][1] - Q[3][1]) ? 'yes (AB ∥ DC and equal)' : 'no' }); }
      return o;
    },
    live(W) { const P = pts(W); if (P.length < 2) return []; const A = ptXY(P[0]), B = ptXY(P[1]), dx = B[0] - A[0], dy = B[1] - A[1]; return [`d = √[(${B[0]} − ${A[0]})² + (${B[1]} − ${A[1]})²] = √(${dx * dx} + ${dy * dy}) = <b>${sqrtText(dx * dx + dy * dy)}</b>`, dx === 0 ? 'gradient: dx = 0 → undefined' : `m = (${B[1]} − ${A[1]}) ÷ (${B[0]} − ${A[0]}) = <b>${fmt(dy / dx, 3)}</b>`]; },
    graphs: [],
    guided: {
      objective: 'Use the distance, midpoint and gradient formulas on a 3-4-5 triangle.', setup: W => { [[1, 1], [4, 5], [4, 1]].forEach(([x, y]) => { const it = W.add('pt', CP.ox + x * CP.sx, CP.oy - y * CP.sy, { gx: x, gy: y }); }); },
      steps: [{ t: 'Place points A(1, 1) and B(4, 5) (use “Set up for me”, or drag/slide them there).', predict: { q: 'The distance from (1, 1) to (4, 5) is…', opts: ['5', '7', '√7'], a: 0, why: '√(3² + 4²) = √25 = 5.' }, ok: W => { const P = pts(W); return P.length >= 2 && P[0].p.gx === 1 && P[0].p.gy === 1 && P[1].p.gx === 4 && P[1].p.gy === 5; } },
        { t: 'Read the distance, midpoint and gradient in Results. Compare with your hand calculation.', ok: W => pts(W).length >= 2 },
        { t: 'Switch on “Perpendicular bisector of AB”. Check that the product of the two gradients is −1.', ok: W => W.params.perp },
        { t: 'Make C = (4, 1). Triangle ABC is right-angled; read its area (6 sq units).', ok: W => { const P = pts(W); return P.length >= 3 && P[2].p.gx === 4 && P[2].p.gy === 1; } },
        { t: 'Drag C elsewhere and see how the triangle type and area change.', ok: W => { const P = pts(W); return P.length >= 3 && !(P[2].p.gx === 4 && P[2].p.gy === 1); } }],
      done: () => 'The formulas give exact answers that match what you see on the grid, whichever points you choose.'
    },
    quiz: [{ q: 'The midpoint of (2, 3) and (8, 7) is…', opts: ['(5, 5)', '(10, 10)', '(3, 2)'], a: 0, why: '((2+8)/2, (3+7)/2) = (5, 5).' }, { q: 'A line has gradient 2/3. A perpendicular line has gradient…', opts: ['−3/2', '3/2', '−2/3'], a: 0, why: 'm₁ × m₂ = −1 → m₂ = −3/2.' }, { q: 'The area of the triangle (0,0), (4,0), (0,3) is…', opts: ['6', '12', '7'], a: 0, why: '½ × base 4 × height 3 = 6.' }]
  });

  /* ============================ ALGEBRAIC EQUATIONS ============================ */
  const AP = FP;
  const aEq = W => W.find('eq')[0], aQd = W => W.find('qd')[0], aSy = W => W.find('sys')[0];
  const cardPlace = W => { const n = W.items.length; return [120, 62 + (n % 8) * 66]; };
  function solveEq(p) { const A = p.a - p.c, B = p.d - p.b; if (A === 0) return B === 0 ? { kind: 'all' } : { kind: 'none' }; return { kind: 'one', x: B / A }; }
  function solveQd(p) { if (p.a === 0) return { kind: 'lin', x: p.b === 0 ? null : -p.c / p.b }; const D = p.b * p.b - 4 * p.a * p.c; if (D > 0) { const s = Math.sqrt(D); return { kind: 'two', D, x1: (-p.b - s) / (2 * p.a), x2: (-p.b + s) / (2 * p.a) }; } if (D === 0) return { kind: 'one', D, x1: -p.b / (2 * p.a) }; return { kind: 'cx', D, re: -p.b / (2 * p.a), im: Math.sqrt(-D) / (2 * Math.abs(p.a)) }; }
  function solveSys(p) { const D = p.a1 * p.b2 - p.a2 * p.b1; if (D !== 0) return { kind: 'one', D, x: (p.c1 * p.b2 - p.c2 * p.b1) / D, y: (p.a1 * p.c2 - p.a2 * p.c1) / D }; const s = (p.a1 * p.c2 === p.a2 * p.c1 && p.b1 * p.c2 === p.b2 * p.c1); return { kind: s ? 'same' : 'par', D }; }
  const sysLine = (a, b, c) => b !== 0 ? x => (c - a * x) / b : null;
  RL.register({
    id: 'algebra', lab: 'maths', topic: 'Algebra', title: 'Equations: Linear, Quadratic & Simultaneous', icon: '🟰', level: 'Intermediate', model: 'full',
    assumptions: 'Exact solving formulas (linear, quadratic formula, Cramer’s rule). The graph shows each side of the equation as a curve so the solution is where they meet. Coefficients are whole numbers.',
    objective: 'Solve equations by algebra and see the same answer appear on a graph; test values by trial and improvement.',
    theory: '<p>Solving <b>ax + b = cx + d</b> means finding the x-value where both sides are equal — on a graph, where the two lines cross. Rearranging: (a−c)x = d−b, so x = (d−b)/(a−c). If a = c the lines are parallel: no solution (or infinitely many if also b = d).</p><p>A <b>quadratic</b> ax² + bx + c = 0 has roots given by the formula; the <b>discriminant</b> b²−4ac tells how many real roots: positive → 2, zero → 1, negative → none (complex). <b>Simultaneous equations</b> are two lines; their crossing point satisfies both.</p>',
    formulas: ['x = (d − b) ÷ (a − c)', 'x = [−b ± √(b² − 4ac)] ÷ 2a', 'Δ = b² − 4ac', 'x = (c₁b₂ − c₂b₁) ÷ D, y = (a₁c₂ − a₂c₁) ÷ D, D = a₁b₂ − a₂b₁'], fixedView: true, animated: false,
    params: [{ k: 'xt', label: 'Test value of x (trial & improvement)', min: -8, max: 8, step: 0.1, val: 0 }],
    types: {
      eq: { name: () => 'Linear equation', icon: '⚖️', w: 250, h: 46, fixed: true, defaults: { a: 2, b: 1, c: 1, d: 5 }, props: ['a', 'b', 'c', 'd'].map((k, i) => ({ k, label: ['a (x on left)', 'b (left constant)', 'c (x on right)', 'd (right constant)'][i], min: -9, max: 9, step: 1, val: 0 })), info: 'ax + b = cx + d. Its two sides are drawn as two lines.',
        draw: it => `<rect x="-125" y="-22" width="250" height="44" rx="10" fill="rgba(20,30,80,.85)" stroke="#4cc9f0" stroke-width="2.5"/>` + TX(0, 5, poly([[it.p.a, 'x'], [it.p.b, '']]) + ' = ' + poly([[it.p.c, 'x'], [it.p.d, '']]), { s: 13 }) },
      qd: { name: () => 'Quadratic equation', icon: '🥣', w: 250, h: 46, fixed: true, defaults: { a: 1, b: -3, c: -4 }, props: [{ k: 'a', label: 'a', min: -5, max: 5, step: 1, val: 1 }, { k: 'b', label: 'b', min: -9, max: 9, step: 1, val: -3 }, { k: 'c', label: 'c', min: -9, max: 9, step: 1, val: -4 }], info: 'ax² + bx + c = 0. The parabola crosses the x-axis at the roots.',
        draw: it => `<rect x="-125" y="-22" width="250" height="44" rx="10" fill="rgba(20,30,80,.85)" stroke="#4ade80" stroke-width="2.5"/>` + TX(0, 5, poly([[it.p.a, 'x²'], [it.p.b, 'x'], [it.p.c, '']]) + ' = 0', { s: 13 }) },
      sys: { name: () => 'Simultaneous equations', icon: '✖️', w: 250, h: 66, fixed: true, defaults: { a1: 1, b1: 1, c1: 5, a2: 1, b2: -1, c2: 1 }, props: ['a1', 'b1', 'c1', 'a2', 'b2', 'c2'].map(k => ({ k, label: k.replace(/(\d)/, '₍$1₎').replace('₍1₎', '₁').replace('₍2₎', '₂') + (k[0] === 'c' ? ' (right side)' : ''), min: -9, max: 9, step: 1, val: 1 })), info: 'a₁x + b₁y = c₁ and a₂x + b₂y = c₂.',
        draw: it => `<rect x="-125" y="-32" width="250" height="64" rx="10" fill="rgba(20,30,80,.85)" stroke="#ff9f1c" stroke-width="2.5"/>` + TX(0, -6, poly([[it.p.a1, 'x'], [it.p.b1, 'y']]) + ' = ' + it.p.c1, { s: 12.5, c: '#ffd9a0' }) + TX(0, 17, poly([[it.p.a2, 'x'], [it.p.b2, 'y']]) + ' = ' + it.p.c2, { s: 12.5, c: '#ffd9a0' }) }
    },
    catalog: [{ type: 'eq', name: 'Linear equation', icon: '⚖️', desc: 'ax + b = cx + d', max: 1, tags: 'solve unknown balance' }, { type: 'qd', name: 'Quadratic equation', icon: '🥣', desc: 'ax² + bx + c = 0', max: 1, tags: 'roots discriminant formula parabola' }, { type: 'sys', name: 'Simultaneous equations', icon: '✖️', desc: 'Two lines, one crossing point', max: 1, tags: 'system elimination substitution' }],
    init(W) { W.add('eq', 120, 62, { a: 2, b: 1, c: 1, d: 5 }); },
    onAdd(W, it) { const [x, y] = [120, 62 + ((W.items.length - 1) % 8) * 66]; it.x = x; it.y = y; },
    sim() { },
    bg(W) {
      let s = plane(AP, 'alclip'); const X = x => AP.ox + x * AP.sx, Y = y => AP.oy - y * AP.sy; const e = aEq(W), q = aQd(W), y = aSy(W);
      if (e) { const p = e.p; s += curve(AP, x => p.a * x + p.b, '#4cc9f0', 3.4, 'alclip') + curve(AP, x => p.c * x + p.d, '#ffd23f', 3.4, 'alclip'); const r = solveEq(p); if (r.kind === 'one' && Math.abs(r.x) < 8.2 && Math.abs(p.a * r.x + p.b) < 6.8) s += CIR(X(r.x), Y(p.a * r.x + p.b), 8, '#4ade80', '#fff', 3) + TX(X(r.x) + 12, Y(p.a * r.x + p.b) - 10, `x = ${fmt(r.x, 3)}`, { s: 12, c: '#86efac', a: 'start' }); const xt = W.params.xt; s += L(X(xt), Y(-6.8), X(xt), Y(6.8), 'rgba(255,255,255,.4)', 1.5, '5 5'); }
      if (q) { const p = q.p; s += curve(AP, x => p.a * x * x + p.b * x + p.c, '#4ade80', 3.4, 'alclip'); const r = solveQd(p); (r.kind === 'two' ? [r.x1, r.x2] : r.kind === 'one' ? [r.x1] : []).forEach(x => { if (Math.abs(x) < 8.2) s += CIR(X(x), Y(0), 7, '#ff5d6c', '#fff', 2.5) + TX(X(x), Y(0) + 24, fmt(x, 2), { s: 11.5, c: '#ff9aa6' }); }); }
      if (y) { const p = y.p; [[p.a1, p.b1, p.c1, '#ff9f1c'], [p.a2, p.b2, p.c2, '#ff6b9d']].forEach(([a, b, c, col]) => { if (b !== 0) s += curve(AP, x => (c - a * x) / b, col, 3.4, 'alclip'); else if (a !== 0) s += `<g clip-path="url(#alclip)">` + L(X(c / a), Y(-7), X(c / a), Y(7), col, 3.4) + '</g>'; }); const r = solveSys(p); if (r.kind === 'one' && Math.abs(r.x) < 8.2 && Math.abs(r.y) < 6.8) s += CIR(X(r.x), Y(r.y), 8, '#4ade80', '#fff', 3) + TX(X(r.x) + 12, Y(r.y) - 10, `(${fmt(r.x, 2)}, ${fmt(r.y, 2)})`, { s: 12, c: '#86efac', a: 'start' }); }
      return s;
    },
    messages(W) {
      const r = [], e = aEq(W), q = aQd(W), y = aSy(W); if (!e && !q && !y) return [{ t: 'info', m: 'Add an equation to solve.' }];
      if (e) { const s = solveEq(e.p); if (s.kind === 'none') r.push({ t: 'warn', m: 'Linear equation: the two lines are parallel — <b>no solution</b>.' }); if (s.kind === 'all') r.push({ t: 'info', m: 'Linear equation: both sides are identical — <b>every x</b> is a solution.' }); }
      if (q) { if (q.p.a === 0) r.push({ t: 'warn', m: 'Quadratic: a = 0, so it is not quadratic. It is a linear equation.' }); else { const s = solveQd(q.p); if (s.kind === 'cx') r.push({ t: 'info', m: 'Quadratic: Δ < 0, the parabola never touches the x-axis — roots are complex.' }); } }
      if (y) { const s = solveSys(y.p); if (s.kind === 'par') r.push({ t: 'warn', m: 'Simultaneous: the lines are parallel — <b>no solution</b>.' }); if (s.kind === 'same') r.push({ t: 'info', m: 'Simultaneous: the equations describe the same line — infinitely many solutions.' }); }
      return r;
    },
    readouts(W) {
      const o = [], e = aEq(W), q = aQd(W), y = aSy(W);
      if (e) { const s = solveEq(e.p), p = e.p, xt = W.params.xt, lhs = p.a * xt + p.b, rhs = p.c * xt + p.d; o.push({ l: 'Linear: solution', v: s.kind === 'one' ? 'x = ' + fmt(s.x, 4) : s.kind === 'all' ? 'all x' : 'none' }, { l: `Test x = ${fmt(xt, 1)}: left side`, v: lhs, d: 3 }, { l: 'Test: right side', v: rhs, d: 3 }, { l: 'Difference (left − right)', v: lhs - rhs, d: 3 }, { l: 'Balanced?', v: Math.abs(lhs - rhs) < 0.05 ? 'yes ✔' : 'no' }); }
      if (q) { const s = solveQd(q.p); o.push({ l: 'Quadratic: Δ = b² − 4ac', v: q.p.b * q.p.b - 4 * q.p.a * q.p.c }, { l: 'Quadratic: roots', v: s.kind === 'two' ? `${fmt(s.x1, 4)}, ${fmt(s.x2, 4)}` : s.kind === 'one' ? fmt(s.x1, 4) + ' (repeated)' : s.kind === 'cx' ? `${fmt(s.re, 3)} ± ${fmt(s.im, 3)}i` : s.kind === 'lin' ? (s.x == null ? 'none' : fmt(s.x, 3)) : '' }); if (q.p.a !== 0) o.push({ l: 'Vertex', v: `(${fmt(-q.p.b / (2 * q.p.a), 3)}, ${fmt(q.p.c - q.p.b * q.p.b / (4 * q.p.a), 3)})` }); }
      if (y) { const s = solveSys(y.p); o.push({ l: 'Simultaneous: D = a₁b₂ − a₂b₁', v: s.D }, { l: 'Simultaneous: solution', v: s.kind === 'one' ? `x = ${fmt(s.x, 4)}, y = ${fmt(s.y, 4)}` : s.kind === 'same' ? 'infinitely many' : 'none' }); }
      return o;
    },
    live(W) {
      const r = [], e = aEq(W), q = aQd(W), y = aSy(W);
      if (e) { const p = e.p, A = p.a - p.c, B = p.d - p.b; r.push(`<b>Linear</b>: ${poly([[p.a, 'x'], [p.b, '']])} = ${poly([[p.c, 'x'], [p.d, '']])}`, `collect x: (${p.a} − ${p.c})x = ${p.d} − ${p.b} → ${lead(A, 0)}x = ${lead(B, 0)}`, A === 0 ? (B === 0 ? '0 = 0: always true' : '0 = ' + B + ': impossible') : `x = ${lead(B, 0)} ÷ ${lead(A, 0)} = <b>${fmt(B / A, 4)}</b>`); }
      if (q && q.p.a !== 0) { const p = q.p, D = p.b * p.b - 4 * p.a * p.c; r.push(`<b>Quadratic</b>: Δ = (${p.b})² − 4(${p.a})(${p.c}) = <b>${D}</b>`, D >= 0 ? `x = [${-p.b} ± √${D}] ÷ ${2 * p.a}` : `Δ < 0 → no real roots`); }
      if (y) { const p = y.p, s = solveSys(p); r.push(`<b>Simultaneous</b>: D = ${p.a1}×${p.b2} − ${p.a2}×${p.b1} = ${s.D}`, s.kind === 'one' ? `x = ${fmt(s.x, 3)}, y = ${fmt(s.y, 3)}; check: ${fmt(p.a1 * s.x + p.b1 * s.y, 3)} = ${p.c1}, ${fmt(p.a2 * s.x + p.b2 * s.y, 3)} = ${p.c2}` : 'D = 0 → lines are parallel'); }
      return r;
    },
    graphs: [{ id: 'diff', title: 'Trial and improvement — Record (x, left − right)', x: 'test x', y: 'left − right', manual: true, points: true, series: [{ n: 'L−R', c: '#4cc9f0' }], sample(W) { const e = aEq(W); if (!e) return null; const x = W.params.xt, p = e.p; return [Math.round(x * 10) / 10, (p.a * x + p.b) - (p.c * x + p.d)]; } }],
    guided: {
      objective: 'Solve 2x + 1 = x + 5 by algebra and by graph, then try a quadratic.', setup: W => { W.add('eq', 120, 62, { a: 2, b: 1, c: 1, d: 5 }); },
      steps: [{ t: 'The equation 2x + 1 = x + 5 is on the bench. Predict the solution.', predict: { q: 'Solve 2x + 1 = x + 5.', opts: ['x = 4', 'x = 2', 'x = 6'], a: 0, why: 'Subtract x and 1 from both sides: x = 4.' }, ok: W => !!aEq(W) },
        { t: 'Move the Test value to 2, then 3, and press 📍 Record each time. The difference (left − right) shrinks.', ok: W => (W.graph.diff || []).length >= 2 },
        { t: 'Find the x for which the difference is 0 (balanced ✔). It is where the two lines cross.', ok: W => { const e = aEq(W); return e && Math.abs((e.p.a - e.p.c) * W.params.xt + (e.p.b - e.p.d)) < 0.05; } },
        { t: 'Add a quadratic equation. Change b and c to see the discriminant switch the number of roots between 2, 1 and 0.', ok: W => !!aQd(W) },
        { t: 'Add a simultaneous-equations pair and read the crossing point of the two lines.', ok: W => !!aSy(W) }],
      done: () => 'Algebra, graphs and trial-and-improvement all agree: a solution is where both sides (or both lines) meet.'
    },
    quiz: [{ q: 'The discriminant of x² − 6x + 9 is…', opts: ['0 (one repeated root)', '18', 'negative'], a: 0, why: 'Δ = 36 − 36 = 0, so x = 3 is a repeated root.' }, { q: 'If x + y = 7 and x − y = 1 then x =', opts: ['4', '3', '6'], a: 0, why: 'Adding: 2x = 8 → x = 4, y = 3.' }, { q: 'The equation 3x + 2 = 3x + 5 has…', opts: ['no solution', 'x = 3', 'infinitely many solutions'], a: 0, why: 'Subtracting 3x gives 2 = 5, which is never true.' }]
  });
})();
