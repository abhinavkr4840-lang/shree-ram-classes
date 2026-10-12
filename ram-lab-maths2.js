/* RAM LAB — Maths Lab, part 2 (load after ram-lab-maths.js):
   matrices (linear transformations) · probability experiments · statistics & data visualisation · correlation & regression · geometric constructions.
   Randomness: probability trials use Math.random() (genuinely random, different every run). Statistics data uses a seeded generator so results are repeatable. */
(function () {
  'use strict';
  const RL = window.RamLab; if (!RL || !RL.maths) return;
  const { clamp, fmt } = RL.util, M = RL.maths, { L, TX, CIR, COL, rad, deg, z0, plane, curve, poly } = M;

  /* ============================ MATRICES / LINEAR TRANSFORMATIONS ============================ */
  const MP = { ox: 650, oy: 290, sx: 36, sy: 36, x0: -9.6, x1: 9.6, y0: -7.6, y1: 7.6 };
  const SHAPES = {
    F: [[0, 0], [.6, 0], [.6, 1.2], [1.5, 1.2], [1.5, 1.8], [.6, 1.8], [.6, 2.4], [2, 2.4], [2, 3], [0, 3]],
    sq: [[0, 0], [2, 0], [2, 2], [0, 2]], tri: [[0, 0], [3, 0], [0, 2]], flag: [[0, 0], [0, 3], [2.4, 2.2], [0, 1.4]]
  };
  const PRESETS = { custom: null, id: [1, 0, 0, 1], r90: [0, -1, 1, 0], r180: [-1, 0, 0, -1], r45: [Math.SQRT1_2, -Math.SQRT1_2, Math.SQRT1_2, Math.SQRT1_2], fx: [1, 0, 0, -1], fy: [-1, 0, 0, 1], diag: [0, 1, 1, 0], shear: [1, 1, 0, 1], sc2: [2, 0, 0, 2], stx: [2, 0, 0, 1], proj: [1, 0, 0, 0] };
  const PNAME = { custom: 'Custom (use the sliders)', id: 'Identity (no change)', r90: 'Rotate 90° anticlockwise', r180: 'Rotate 180°', r45: 'Rotate 45° anticlockwise', fx: 'Reflect in the x-axis', fy: 'Reflect in the y-axis', diag: 'Reflect in the line y = x', shear: 'Shear (x → x + y)', sc2: 'Enlarge × 2', stx: 'Stretch x × 2', proj: 'Project onto the x-axis (singular!)' };
  const mm = (A, B) => [A[0] * B[0] + A[1] * B[2], A[0] * B[1] + A[1] * B[3], A[2] * B[0] + A[3] * B[2], A[2] * B[1] + A[3] * B[3]];
  const mA = W => W.find('mA')[0], mB = W => W.find('mB')[0];
  const mat = it => it ? [it.p.a, it.p.b, it.p.c, it.p.d] : [1, 0, 0, 1];
  const comb = W => mm(mat(mA(W)), mat(mB(W)));                 // B first, then A
  const ap = (m, x, y) => [m[0] * x + m[1] * y, m[2] * x + m[3] * y];
  const area = P => Math.abs(P.reduce((s, p, i) => { const q = P[(i + 1) % P.length]; return s + p[0] * q[1] - q[0] * p[1]; }, 0)) / 2;
  const shapePts = W => W.params.shape === 'circ' ? Array.from({ length: 48 }, (_, i) => [2 * Math.cos(i / 48 * 2 * Math.PI), 2 * Math.sin(i / 48 * 2 * Math.PI)]) : SHAPES[W.params.shape];
  const eig = m => { const tr = m[0] + m[3], dt = m[0] * m[3] - m[1] * m[2], D = tr * tr - 4 * dt; return D >= 0 ? { re: true, l1: (tr + Math.sqrt(D)) / 2, l2: (tr - Math.sqrt(D)) / 2 } : { re: false, a: tr / 2, b: Math.sqrt(-D) / 2 }; };
  function matCard(col, nm) {
    return it => { const v = mat(it); const f = x => fmt(z0(x), 2); return `<rect x="-100" y="-46" width="200" height="92" rx="12" fill="rgba(20,30,80,.88)" stroke="${col}" stroke-width="2.5"/>` + TX(-86, -26, nm, { s: 14, c: col, a: 'start' }) +
      `<path d="M-28 -30h-8v62h8M44 -30h8v62h-8" fill="none" stroke="#e8eeff" stroke-width="2.5"/>` + [[-14, -8], [28, -8], [-14, 22], [28, 22]].map(([x, y], i) => TX(x, y + 4, f(v[i]), { s: 15 })).join(''); };
  }
  const matProps = [{ k: 'pre', label: 'Preset transformation', type: 'select', options: Object.keys(PNAME).map(k => [k, PNAME[k]]), val: 'custom' }, ...['a', 'b', 'c', 'd'].map((k, i) => ({ k, label: ['a (top-left)', 'b (top-right)', 'c (bottom-left)', 'd (bottom-right)'][i], min: -3, max: 3, step: 0.5, dec: 2, val: i === 0 || i === 3 ? 1 : 0 }))];
  const matProp = (it, k) => { if (k === 'pre' && PRESETS[it.p.pre]) { const v = PRESETS[it.p.pre]; [it.p.a, it.p.b, it.p.c, it.p.d] = v; } else if (['a', 'b', 'c', 'd'].includes(k)) it.p.pre = 'custom'; };
  const arrow = (x0, y0, x1, y1, c, w) => { const a = Math.atan2(y1 - y0, x1 - x0), h = 10; return L(x0, y0, x1, y1, c, w || 3.5) + `<polygon points="${x1},${y1} ${x1 - h * Math.cos(a - .4)},${y1 - h * Math.sin(a - .4)} ${x1 - h * Math.cos(a + .4)},${y1 - h * Math.sin(a + .4)}" fill="${c}"/>`; };
  RL.register({
    id: 'matrix', lab: 'maths', topic: 'Matrices', title: 'Matrices as Transformations', icon: '🔢', level: 'Advanced', model: 'full',
    assumptions: '2×2 matrices acting on points of the plane. All entries, products, determinants, inverses and eigenvalues are computed exactly from the matrix values. The “morph” animation shows a straight-line blend from the identity to the final matrix — the end position is exact, the in-between frames are only for display.',
    objective: 'See what a 2×2 matrix does to a shape, what the determinant means, and what happens when two matrices are multiplied.',
    theory: '<p>A 2×2 matrix <b>[[a, b],[c, d]]</b> sends the point (x, y) to (ax + by, cx + dy). Its columns tell where the basis vectors î = (1,0) and ĵ = (0,1) land. The <b>determinant ad − bc</b> is the factor by which areas change; a negative sign means the shape is flipped (reflected). If det = 0 the plane is squashed onto a line — the matrix has <b>no inverse</b>.</p><p>With two matrices, <b>AB</b> means “do B first, then A”. Usually AB ≠ BA.</p>',
    formulas: ['(x′, y′) = (ax + by, cx + dy)', 'det = ad − bc', 'A⁻¹ = (1/det) [[d, −b],[−c, a]]', 'area after = |det| × area before', 'λ² − (a + d)λ + det = 0 (eigenvalues)'], fixedView: true, animated: false,
    params: [{ k: 'shape', label: 'Shape', type: 'select', options: [['F', 'Letter F'], ['sq', 'Square'], ['tri', 'Triangle'], ['flag', 'Flag'], ['circ', 'Circle']], val: 'F' }, { k: 'morph', label: 'Morph (0 = start, 1 = end)', min: 0, max: 1, step: 0.01, val: 1 }],
    types: {
      mA: { name: () => 'Matrix A', icon: '🅰️', w: 200, h: 92, fixed: true, defaults: { pre: 'custom', a: 1, b: 0, c: 0, d: 1 }, props: matProps, onProp: matProp, info: 'Choose a preset or set the four entries.', draw: matCard('#4cc9f0', 'A'), place: () => [120, 80] },
      mB: { name: () => 'Matrix B', icon: '🅱️', w: 200, h: 92, fixed: true, defaults: { pre: 'custom', a: 1, b: 0, c: 0, d: 1 }, props: matProps, onProp: matProp, info: 'If both A and B are present the shape is transformed by AB (B first).', draw: matCard('#ffd23f', 'B'), place: () => [120, 190] },
      vec: { name: () => 'Vector v', icon: '➡️', w: 200, h: 70, fixed: true, defaults: { vx: 2, vy: 1 }, props: [{ k: 'vx', label: 'x', min: -5, max: 5, step: 0.5, val: 2 }, { k: 'vy', label: 'y', min: -5, max: 5, step: 0.5, val: 1 }], info: 'The matrix moves this arrow too.', draw: it => `<rect x="-100" y="-34" width="200" height="68" rx="12" fill="rgba(20,30,80,.88)" stroke="#ff6b9d" stroke-width="2.5"/>` + TX(0, 6, `v = (${fmt(it.p.vx, 1)}, ${fmt(it.p.vy, 1)})`, { s: 15, c: '#ffc2d9' }), place: () => [120, 290] }
    },
    catalog: [{ type: 'mA', name: 'Matrix A', icon: '🅰️', desc: '2×2 matrix (presets available)', max: 1, tags: 'matrix transformation rotate reflect' }, { type: 'mB', name: 'Matrix B', icon: '🅱️', desc: 'A second matrix — multiply them', max: 1, tags: 'matrix multiply product' }, { type: 'vec', name: 'Vector v', icon: '➡️', desc: 'An arrow to transform', max: 1, tags: 'vector' }],
    init(W) { W.add('mA', 120, 80, { pre: 'r90', a: 0, b: -1, c: 1, d: 0 }); W.add('vec', 120, 290, { vx: 2, vy: 1 }); },
    onAdd(W, it) { const t = { mA: [120, 80], mB: [120, 190], vec: [120, 290] }[it.type]; if (t) { it.x = t[0]; it.y = t[1]; } },
    step(W, dt) { W.params.morph = Math.min(1, W.params.morph + dt / 2.5); if (W.params.morph >= 1) W.running = false; },
    onRun(W) { W.params.morph = 0; },
    reset(W) { W.params.morph = 1; },
    sim() { },
    bg(W) {
      let s = plane(MP, 'mxclip'); const X = x => MP.ox + x * MP.sx, Y = y => MP.oy - y * MP.sy, T = comb(W), t = W.params.morph, Mt = [1 + t * (T[0] - 1), t * T[1], t * T[2], 1 + t * (T[3] - 1)], P = shapePts(W);
      const C = ([x, y]) => { const q = ap(Mt, x, y); return X(q[0]) + ',' + Y(q[1]); };
      s += `<polygon points="${P.map(([x, y]) => X(x) + ',' + Y(y)).join(' ')}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="2" stroke-dasharray="6 5"/>`;
      s += '<g clip-path="url(#mxclip)">'; for (let k = -10; k <= 10; k++) { const a = ap(Mt, k, -12), b = ap(Mt, k, 12), c = ap(Mt, -12, k), d = ap(Mt, 12, k); s += L(X(a[0]), Y(a[1]), X(b[0]), Y(b[1]), 'rgba(255,210,63,.28)', 1) + L(X(c[0]), Y(c[1]), X(d[0]), Y(d[1]), 'rgba(255,210,63,.28)', 1); } s += '</g>';
      s += `<polygon points="${P.map(C).join(' ')}" fill="rgba(76,201,240,.28)" stroke="#4cc9f0" stroke-width="3.5" stroke-linejoin="round"/>`;
      const i2 = ap(Mt, 1, 0), j2 = ap(Mt, 0, 1); s += arrow(X(0), Y(0), X(i2[0]), Y(i2[1]), '#ff5d6c') + arrow(X(0), Y(0), X(j2[0]), Y(j2[1]), '#4ade80') + TX(X(i2[0]) + 6, Y(i2[1]) - 8, 'î′', { s: 13, c: '#ff8a9a', a: 'start' }) + TX(X(j2[0]) + 6, Y(j2[1]) - 8, 'ĵ′', { s: 13, c: '#86efac', a: 'start' });
      const v = W.find('vec')[0]; if (v) { const q = ap(Mt, v.p.vx, v.p.vy); s += `<g opacity=".5">` + arrow(X(0), Y(0), X(v.p.vx), Y(v.p.vy), '#ff6b9d', 2.5) + '</g>' + arrow(X(0), Y(0), X(q[0]), Y(q[1]), '#ff6b9d', 4) + TX(X(q[0]) + 8, Y(q[1]) + 14, 'Mv', { s: 13, c: '#ffc2d9', a: 'start' }); }
      return s;
    },
    messages(W) { const r = [], T = comb(W), dt = T[0] * T[3] - T[1] * T[2]; if (!mA(W) && !mB(W)) return [{ t: 'info', m: 'Add a matrix to transform the shape.' }]; if (mA(W) && mB(W)) r.push({ t: 'info', m: 'Both matrices present: the shape is transformed by <b>AB</b> (B first, then A).' }); if (Math.abs(dt) < 1e-9) r.push({ t: 'warn', m: 'det = 0 — this matrix squashes the plane onto a line (or point). It has <b>no inverse</b> and the shape’s area becomes 0.' }); else if (dt < 0) r.push({ t: 'info', m: 'det < 0 — the shape is <b>flipped</b> (mirror image).' }); return r; },
    readouts(W) {
      const T = comb(W), dt = T[0] * T[3] - T[1] * T[2], f = x => fmt(z0(x), 3), o = [];
      o.push({ l: mA(W) && mB(W) ? 'Combined matrix AB' : 'Matrix', v: `[[${f(T[0])}, ${f(T[1])}], [${f(T[2])}, ${f(T[3])}]]` }, { l: 'Determinant', v: z0(dt), d: 3 }, { l: 'Trace (a + d)', v: T[0] + T[3], d: 3 });
      const P = shapePts(W), a0 = area(P), a1 = area(P.map(([x, y]) => ap(T, x, y))); o.push({ l: 'Shape area before', v: a0, d: 3 }, { l: 'Shape area after', v: a1, d: 3 }, { l: '|det| × area before', v: Math.abs(dt) * a0, d: 3 });
      if (Math.abs(dt) > 1e-9) o.push({ l: 'Inverse matrix', v: `[[${f(T[3] / dt)}, ${f(-T[1] / dt)}], [${f(-T[2] / dt)}, ${f(T[0] / dt)}]]` }); else o.push({ l: 'Inverse matrix', v: 'does not exist' });
      const e = eig(T); o.push({ l: 'Eigenvalues', v: e.re ? `${f(e.l1)}, ${f(e.l2)}` : `${f(e.a)} ± ${f(e.b)}i (no real eigenvector: a rotation)` });
      const v = W.find('vec')[0]; if (v) { const q = ap(T, v.p.vx, v.p.vy); o.push({ l: 'M v', v: `(${f(q[0])}, ${f(q[1])})` }); }
      if (mA(W) && mB(W)) { const BA = mm(mat(mB(W)), mat(mA(W))); o.push({ l: 'BA (for comparison)', v: `[[${f(BA[0])}, ${f(BA[1])}], [${f(BA[2])}, ${f(BA[3])}]]` }, { l: 'AB = BA ?', v: T.every((x, i) => Math.abs(x - BA[i]) < 1e-9) ? 'yes (they commute)' : 'no — order matters' }); }
      return o;
    },
    live(W) { const T = comb(W), v = W.find('vec')[0]; const r = [`(x, y) → (${poly([[z0(T[0]), 'x'], [z0(T[1]), 'y']])}, ${poly([[z0(T[2]), 'x'], [z0(T[3]), 'y']])})`, `det = (${fmt(T[0], 2)})(${fmt(T[3], 2)}) − (${fmt(T[1], 2)})(${fmt(T[2], 2)}) = <b>${fmt(z0(T[0] * T[3] - T[1] * T[2]), 3)}</b>`]; if (v) { const q = ap(T, v.p.vx, v.p.vy); r.push(`M(${fmt(v.p.vx, 1)}, ${fmt(v.p.vy, 1)}) = <b>(${fmt(z0(q[0]), 2)}, ${fmt(z0(q[1]), 2)})</b>`); } return r; },
    graphs: [],
    guided: {
      objective: 'Rotate, reflect and combine transformations, and connect the determinant with area.', setup: W => { W.add('mA', 120, 80, { pre: 'r90', a: 0, b: -1, c: 1, d: 0 }); W.add('vec', 120, 290, { vx: 2, vy: 1 }); W.params.shape = 'F'; },
      steps: [{ t: 'Matrix A is the preset “Rotate 90° anticlockwise”. Where does the vector v go? Predict, then press ▶ Run to watch.', predict: { q: 'The rotation [[0,−1],[1,0]] sends (2, 1) to…', opts: ['(−1, 2)', '(1, −2)', '(2, −1)'], a: 0, why: '(0·2 + (−1)·1, 1·2 + 0·1) = (−1, 2).' }, ok: W => !!mA(W) && W.params.morph >= 1 && W.t > 0 },
        { t: 'Change A to “Enlarge × 2”. Compare the area after with the area before. How is it related to the determinant?', ok: W => mA(W) && mA(W).p.pre === 'sc2' },
        { t: 'Choose “Reflect in the x-axis”. The determinant is negative — the F is flipped.', ok: W => mA(W) && mA(W).p.pre === 'fx' },
        { t: 'Add Matrix B (rotation) and compare AB with BA in Results. Do the order of reflection and rotation matter?', ok: W => !!mB(W) && mB(W).p.pre !== 'custom' && mB(W).p.pre !== 'id' },
        { t: 'Pick the “Project onto the x-axis” preset: det = 0 and there is no inverse.', ok: W => mA(W) && mA(W).p.pre === 'proj' }],
      done: () => 'Columns show where î and ĵ land, det gives the area scale factor (negative = flip), and matrix multiplication is not commutative.'
    },
    quiz: [{ q: 'det [[2, 3],[1, 4]] =', opts: ['5', '11', '8'], a: 0, why: '2×4 − 3×1 = 5.' }, { q: 'A matrix with determinant 0…', opts: ['has no inverse', 'doubles areas', 'is a rotation'], a: 0, why: 'The inverse formula divides by det.' }, { q: 'Which is usually true for two 2×2 matrices?', opts: ['AB ≠ BA', 'AB = BA', 'AB = A + B'], a: 0, why: 'Matrix multiplication depends on the order.' }]
  });

  /* ============================ PROBABILITY EXPERIMENTS ============================ */
  const DEV = ['coins', 'dice', 'bag', 'spin'];
  const devOf = W => W.items.find(i => DEV.includes(i.type));
  const choose = (n, k) => { let r = 1; for (let i = 1; i <= k; i++) r = r * (n - k + i) / i; return Math.round(r); };
  function outcomes(it) {
    const p = it.p; if (it.type === 'coins') return Array.from({ length: p.n + 1 }, (_, k) => ({ key: k, label: k + 'H', pr: choose(p.n, k) / 2 ** p.n }));
    if (it.type === 'dice') return p.n === 1 ? [1, 2, 3, 4, 5, 6].map(k => ({ key: k, label: '' + k, pr: 1 / 6 })) : Array.from({ length: 11 }, (_, i) => ({ key: i + 2, label: '' + (i + 2), pr: (6 - Math.abs(i + 2 - 7)) / 36 }));
    if (it.type === 'bag') { const t = p.r + p.b + p.g; return [['r', 'Red', p.r], ['b', 'Blue', p.b], ['g', 'Green', p.g]].map(([k, l, c]) => ({ key: k, label: l, pr: t ? c / t : 0 })); }
    return Array.from({ length: p.n }, (_, i) => ({ key: i + 1, label: '' + (i + 1), pr: 1 / p.n }));
  }
  const BCOL = { r: '#ff5d6c', b: '#4cc9f0', g: '#4ade80' };
  const sig = it => it ? it.type + JSON.stringify(it.p, Object.keys(it.p).filter(k => k !== 'tg').sort()) : '';
  let lastFaces = [];
  function trial(it) {
    const p = it.p; if (it.type === 'coins') { let h = 0; for (let i = 0; i < p.n; i++) if (Math.random() < 0.5) h++; return h; }
    if (it.type === 'dice') { let s = 0; lastFaces = []; for (let i = 0; i < p.n; i++) { const f = 1 + Math.floor(Math.random() * 6); lastFaces.push(f); s += f; } return s; }
    if (it.type === 'bag') { const t = p.r + p.b + p.g; if (!t) return null; const x = Math.random() * t; return x < p.r ? 'r' : x < p.r + p.b ? 'b' : 'g'; }
    return 1 + Math.floor(Math.random() * p.n);
  }
  function pdata(W) { const dv = devOf(W); if (!dv) return null; const s = sig(dv); let d = W.d.pr; if (!d || d.sig !== s) d = W.d.pr = { sig: s, n: 0, counts: {}, last: null, acc: 0 }; return d; }
  function doTrial(W) { const dv = devOf(W), d = pdata(W); if (!dv) return; const r = trial(dv); if (r == null) return; d.n++; d.counts[r] = (d.counts[r] || 0) + 1; d.last = r; d.faces = lastFaces.slice(); }
  const tgKey = it => { const o = outcomes(it); if (it.type === 'bag') return ['r', 'b', 'g'].includes(it.p.tg) ? it.p.tg : 'r'; const ks = o.map(x => x.key), v = +it.p.tg; return clamp(isNaN(v) ? ks[0] : v, ks[0], ks[ks.length - 1]); };
    function dieFace(v, x, y, s) { const D = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] }; return `<rect x="${x - s}" y="${y - s}" width="${2 * s}" height="${2 * s}" rx="7" fill="#fff" stroke="#9fb4ff" stroke-width="2"/>` + (D[v] || []).map(([a, b]) => CIR(x + a * s * .5, y + b * s * .5, s * .13, '#14205c')).join(''); }
  const devProps = (extra, tg) => [...extra, tg || { k: 'tg', label: 'Outcome to track (the event)', min: 0, max: 6, step: 1, val: 1 }];
  const devCommon = { onClick: (it, W) => { doTrial(W); }, };
  RL.register({
    id: 'prob', lab: 'maths', topic: 'Probability', title: 'Probability Experiments', icon: '🎲', level: 'Beginner', model: 'full',
    assumptions: 'Trials are generated with the browser’s Math.random() (a pseudo-random generator — fine for teaching, not for cryptography). Coins and dice are fair; bag draws are with replacement. Theoretical probabilities are exact.',
    objective: 'Run real random experiments, compare the relative frequency with the theoretical probability and watch it settle as the number of trials grows.',
    theory: '<p><b>Theoretical probability</b> = (number of favourable outcomes) ÷ (total equally likely outcomes). <b>Relative frequency</b> = (times the event happened) ÷ (number of trials). For few trials they can differ a lot, but by the <b>law of large numbers</b> the relative frequency gets closer to the theoretical probability as the number of trials increases.</p><p>With two dice there are 36 equally likely pairs, so a total of 7 (6 pairs) has probability 6/36 = 1/6.</p>',
    formulas: ['P(event) = favourable ÷ total', 'relative frequency = count ÷ trials', 'P(k heads in n coins) = C(n,k) ÷ 2ⁿ', 'E(X) = Σ x·P(x)'], fixedView: true, animated: false,
    params: [{ k: 'rate', label: 'Trials per second', type: 'select', options: [[1, '1 per second'], [5, '5 per second'], [20, '20 per second'], [100, '100 per second'], [500, '500 per second']], val: 20 }],
    types: {
      coins: { name: it => it.p.n + (it.p.n === 1 ? ' coin' : ' coins'), icon: '🪙', w: 220, h: 190, fixed: true, defaults: { n: 2, tg: 1 }, props: devProps([{ k: 'n', label: 'Number of coins', min: 1, max: 6, step: 1, val: 2 }], { k: 'tg', label: 'Track: number of heads', min: 0, max: 6, step: 1, val: 1 }), info: 'Tap the coins for one toss, or press ▶ Run for many.', ...devCommon,
        draw: (it, W) => { const d = W.d.pr, n = it.p.n; let s = `<rect x="-105" y="-90" width="210" height="180" rx="14" fill="rgba(20,30,80,.7)" stroke="#ffd23f" stroke-width="2.5"/>`; for (let i = 0; i < n; i++) { const x = (i - (n - 1) / 2) * 34; s += CIR(x, -20, 15, '#e6c35a', '#fff6c2', 2.5); } s += TX(0, 30, d && d.last != null ? d.last + ' head' + (d.last === 1 ? '' : 's') : 'tap to toss', { s: 14, c: '#ffe9a8' }) + TX(0, 62, 'tap = 1 toss', { s: 10.5, c: '#9fb4ff', w: 600 }); return s; } },
      dice: { name: it => it.p.n + (it.p.n === 1 ? ' die' : ' dice'), icon: '🎲', w: 220, h: 190, fixed: true, defaults: { n: 1, tg: 6 }, props: devProps([{ k: 'n', label: 'Number of dice', min: 1, max: 2, step: 1, val: 1 }], { k: 'tg', label: 'Track: face / total', min: 1, max: 12, step: 1, val: 6 }), info: 'Tap to roll once; with two dice the outcome is the total.', ...devCommon,
        draw: (it, W) => { const d = W.d.pr; let s = `<rect x="-105" y="-90" width="210" height="180" rx="14" fill="rgba(20,30,80,.7)" stroke="#ff6b9d" stroke-width="2.5"/>`; if (it.p.n === 1) s += dieFace(d && d.faces && d.faces[0] || 6, 0, -15, 32); else s += dieFace(d && d.faces && d.faces[0] || 3, -36, -15, 28) + dieFace(d && d.faces && d.faces[1] || 4, 36, -15, 28); s += TX(0, 50, d && d.last != null ? 'total ' + d.last : 'tap to roll', { s: 13, c: '#ffc2d9' }); return s; } },
      bag: { name: () => 'Bag of balls', icon: '👝', w: 220, h: 190, fixed: true, defaults: { r: 3, b: 2, g: 1, tg: 'r' }, props: devProps([{ k: 'r', label: 'Red balls', min: 0, max: 10, step: 1, val: 3 }, { k: 'b', label: 'Blue balls', min: 0, max: 10, step: 1, val: 2 }, { k: 'g', label: 'Green balls', min: 0, max: 10, step: 1, val: 1 }], { k: 'tg', label: 'Track colour', type: 'select', options: [['r', 'Red'], ['b', 'Blue'], ['g', 'Green']], val: 'r' }), info: 'A ball is drawn at random and replaced.', ...devCommon,
        draw: (it, W) => { const d = W.d.pr; let s = `<rect x="-105" y="-90" width="210" height="180" rx="14" fill="rgba(20,30,80,.7)" stroke="#4ade80" stroke-width="2.5"/>`; let k = 0; [['r', it.p.r], ['b', it.p.b], ['g', it.p.g]].forEach(([c, n]) => { for (let i = 0; i < n; i++, k++) s += CIR(-78 + (k % 8) * 22, -62 + Math.floor(k / 8) * 22, 9, BCOL[c], '#fff', 1.5); }); s += TX(0, 38, d && d.last ? 'drew ' + { r: 'red', b: 'blue', g: 'green' }[d.last] : 'tap to draw', { s: 13, c: '#bbf7d0' }); return s; } },
      spin: { name: it => it.p.n + '-sector spinner', icon: '🎡', w: 220, h: 190, fixed: true, defaults: { n: 4, tg: 1 }, props: devProps([{ k: 'n', label: 'Equal sectors', min: 2, max: 12, step: 1, val: 4 }], { k: 'tg', label: 'Track sector', min: 1, max: 12, step: 1, val: 1 }), info: 'Tap to spin; every sector is equally likely.', ...devCommon,
        draw: (it, W) => { const d = W.d.pr, n = it.p.n; let s = `<rect x="-105" y="-90" width="210" height="180" rx="14" fill="rgba(20,30,80,.7)" stroke="#b794f6" stroke-width="2.5"/>`; for (let i = 0; i < n; i++) { const a0 = i / n * 2 * Math.PI - Math.PI / 2, a1 = (i + 1) / n * 2 * Math.PI - Math.PI / 2, big = 1 / n > .5 ? 1 : 0; s += `<path d="M0 -15L${60 * Math.cos(a0)} ${-15 + 60 * Math.sin(a0)}A60 60 0 ${big} 1 ${60 * Math.cos(a1)} ${-15 + 60 * Math.sin(a1)}Z" fill="${COL[i % COL.length]}" opacity="${d && d.last === i + 1 ? 1 : .55}" stroke="#14205c" stroke-width="1.5"/>` + TX(40 * Math.cos((a0 + a1) / 2), -15 + 40 * Math.sin((a0 + a1) / 2) + 4, i + 1, { s: 11, c: '#14205c' }); } s += TX(0, 70, d && d.last != null ? 'landed on ' + d.last : 'tap to spin', { s: 13, c: '#e6d6ff' }); return s; } },
      chart: { name: () => 'Results chart', icon: '📊', w: 600, h: 300, fixed: true, defaults: {}, info: 'Bars: observed relative frequency. White ticks: theoretical probability. The gold bar is the tracked outcome.',
        draw: (it, W) => { const dv = devOf(W), d = W.d.pr; if (!dv) return TX(0, 0, 'Add a coin, dice, bag or spinner', { s: 15, c: '#9fb4ff' }); const o = outcomes(dv), n = o.length, bw = Math.min(46, 520 / n - 6), mx = Math.max(0.25, ...o.map(q => q.pr), ...(d && d.n ? o.map(q => (d.counts[q.key] || 0) / d.n) : [0])) * 1.1, H = 200, tg = String(tgKey(dv));
          let s = `<rect x="-300" y="-150" width="600" height="300" rx="14" fill="rgba(10,18,60,.6)" stroke="rgba(160,180,255,.35)" stroke-width="2"/>` + L(-270, 110, 270, 110, '#e8eeff', 2) + L(-270, 110, -270, -90, '#e8eeff', 2);
          for (let g = 0; g <= 4; g++) { const v = mx * g / 4; s += L(-274, 110 - v / mx * H * .95, -266, 110 - v / mx * H * .95, '#e8eeff', 1.5) + TX(-280, 110 - v / mx * H * .95 + 4, fmt(v, 2), { s: 9.5, c: '#9fb4ff', a: 'end', w: 600 }); }
          o.forEach((q, i) => { const x = -250 + (i + .5) * 520 / n, f = d && d.n ? (d.counts[q.key] || 0) / d.n : 0, h = f / mx * H * .95, ht = q.pr / mx * H * .95, c = String(q.key) === tg ? '#ffd23f' : (dv.type === 'bag' ? BCOL[q.key] : '#4cc9f0'); s += `<rect x="${x - bw / 2}" y="${110 - h}" width="${bw}" height="${h}" fill="${c}" opacity=".85" rx="3"/>` + L(x - bw / 2 - 3, 110 - ht, x + bw / 2 + 3, 110 - ht, '#fff', 3) + TX(x, 128, q.label, { s: 11, c: '#cfd8ff' }) + (d && d.n ? TX(x, 110 - h - 5, d.counts[q.key] || 0, { s: 9.5, c: '#fff', w: 600 }) : ''); });
          s += TX(0, -125, d && d.n ? `${d.n} trial${d.n === 1 ? '' : 's'}` : 'No trials yet — tap the device or press ▶ Run', { s: 13, c: '#ffe9a8' }); return s; } }
    },
    catalog: [{ type: 'coins', name: 'Coins', icon: '🪙', desc: 'Toss 1–6 fair coins; count heads', tags: 'coin toss heads tails binomial' }, { type: 'dice', name: 'Dice', icon: '🎲', desc: 'Roll one or two fair dice', tags: 'die roll sum' }, { type: 'bag', name: 'Bag of coloured balls', icon: '👝', desc: 'Draw with replacement', tags: 'balls colour urn' }, { type: 'spin', name: 'Spinner', icon: '🎡', desc: 'Equal sectors', tags: 'wheel sector' }, { type: 'chart', name: 'Results chart', icon: '📊', desc: 'Observed vs theoretical', max: 1, tags: 'bar chart histogram frequency' }],
    init(W) { W.add('coins', 120, 130, { n: 2, tg: 1 }); W.add('chart', 640, 270); },
    onAdd(W, it) { if (DEV.includes(it.type)) { W.items.filter(i => DEV.includes(i.type) && i !== it).forEach(i => W.remove(i.id)); it.x = 120; it.y = 130; it.p.tg = tgKey(it); } if (it.type === 'chart') { it.x = 640; it.y = 270; } },
    step(W, dt) { const d = pdata(W); if (!d) return; d.acc += W.params.rate * dt; let k = 0; while (d.acc >= 1 && k < 400) { doTrial(W); d.acc -= 1; k++; } if (d.acc > 5) d.acc = 0; },
    sim(W) { const dv = devOf(W); if (dv) { dv.p.tg = tgKey(dv); pdata(W); } },
    reset(W) { W.d.pr = null; },
    messages(W) { const dv = devOf(W), d = W.d.pr, r = []; if (!dv) return [{ t: 'info', m: 'Add a coin, dice, bag or spinner to start experimenting.' }]; if (dv.type === 'bag' && dv.p.r + dv.p.b + dv.p.g === 0) r.push({ t: 'warn', m: 'The bag is empty — add some balls first.' }); if (!W.find('chart')[0]) r.push({ t: 'info', m: 'Add the Results chart to see the bars.' }); if (d && d.n > 0 && d.n < 30) r.push({ t: 'info', m: 'Only ' + d.n + ' trials: small samples vary a lot. Run many more!' }); return r; },
    readouts(W) {
      const dv = devOf(W), d = W.d.pr; if (!dv) return []; const o = outcomes(dv), tg = tgKey(dv), q = o.find(x => String(x.key) === String(tg)) || o[0], c = d ? (d.counts[q.key] || 0) : 0, rf = d && d.n ? c / d.n : 0, r = [{ l: 'Tracking outcome', v: q.label }, { l: 'Trials so far', v: d ? d.n : 0 }, { l: 'Times it happened', v: c }, { l: 'Relative frequency', v: d && d.n ? rf : '–', d: 4 }, { l: 'Theoretical probability', v: q.pr, d: 4 }, { l: 'Difference', v: d && d.n ? Math.abs(rf - q.pr) : '–', d: 4 }];
      if (dv.type === 'coins' || dv.type === 'dice') { const ev = o.reduce((s, x) => s + x.key * x.pr, 0); r.push({ l: 'Expected value E(X)', v: ev, d: 3 }); if (d && d.n) r.push({ l: 'Observed mean', v: Object.keys(d.counts).reduce((s, k) => s + k * d.counts[k], 0) / d.n, d: 3 }); }
      return r;
    },
    live(W) { const dv = devOf(W); if (!dv) return []; const o = outcomes(dv), tg = tgKey(dv), q = o.find(x => String(x.key) === String(tg)) || o[0]; let f = ''; if (dv.type === 'coins') f = `P(${q.label}) = C(${dv.p.n},${q.key}) ÷ 2^${dv.p.n} = ${choose(dv.p.n, q.key)}/${2 ** dv.p.n}`; else if (dv.type === 'dice' && dv.p.n === 2) f = `P(total ${q.key}) = ${6 - Math.abs(q.key - 7)}/36`; else if (dv.type === 'dice') f = 'P(any face) = 1/6'; else if (dv.type === 'bag') f = `P(${q.label}) = ${dv.p[q.key]}/${dv.p.r + dv.p.b + dv.p.g}`; else f = `P(sector) = 1/${dv.p.n}`; return [f + ' = <b>' + fmt(q.pr, 4) + '</b>']; },
    graphs: [{ id: 'lln', title: 'Relative frequency settles towards the probability', x: 'Number of trials', y: 'Probability', series: [{ n: 'observed', c: '#ffd23f' }, { n: 'theory', c: '#4ade80' }], sample(W) { const dv = devOf(W), d = W.d.pr; if (!dv || !d || !d.n) return null; const o = outcomes(dv), q = o.find(x => String(x.key) === String(tgKey(dv))) || o[0]; return [d.n, (d.counts[q.key] || 0) / d.n, q.pr]; } }],
    guided: {
      objective: 'Toss two coins many times and compare the relative frequency of “exactly 1 head” with its theoretical probability.', setup: W => { W.add('coins', 120, 130, { n: 2, tg: 1 }); W.add('chart', 640, 270); W.params.rate = 20; },
      steps: [{ t: 'Two coins are on the bench and the tracked outcome is “1H” (exactly one head). Predict the probability.', predict: { q: 'P(exactly 1 head when tossing 2 coins) =', opts: ['1/2', '1/4', '1/3'], a: 0, why: 'Outcomes HH, HT, TH, TT: two of the four have exactly one head → 2/4 = 1/2.' }, ok: W => !!devOf(W) },
        { t: 'Tap the coins about 10 times. Note how the relative frequency jumps around.', ok: W => W.d.pr && W.d.pr.n >= 10 },
        { t: 'Press ▶ Run and let it reach 500+ trials. Watch the graph settle near 0.5.', ok: W => W.d.pr && W.d.pr.n >= 500 },
        { t: 'Switch to 2 dice and track the total 7 (theory 1/6 ≈ 0.1667). Run again.', ok: W => { const d = devOf(W); return d && d.type === 'dice' && W.d.pr && W.d.pr.n >= 100; } }],
      done: () => 'Small samples fluctuate; large samples settle close to the theoretical probability (law of large numbers) — but never match it exactly every time.'
    },
    quiz: [{ q: 'A fair die is rolled. P(a number greater than 4) =', opts: ['1/3', '1/6', '1/2'], a: 0, why: 'Favourable: 5 and 6 → 2/6 = 1/3.' }, { q: 'A bag has 3 red and 2 blue balls. P(blue) =', opts: ['2/5', '2/3', '1/2'], a: 0, why: '2 blue out of 5 balls.' }, { q: 'After 10 tosses of a fair coin you get 7 heads. The next toss…', opts: ['is still 50 % heads', 'is more likely tails', 'is more likely heads'], a: 0, why: 'Tosses are independent; past results do not change the chance.' }]
  });
  /* ============================ STATISTICS & DATA VISUALISATION ============================ */
  function rng(seed) { let a = (seed * 2654435761) >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const norm = r => { const u = Math.max(1e-12, r()), v = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); };
  const q2 = (s, p) => { const n = s.length, m = n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; return m; };
  function describe(v) {
    const s = v.slice().sort((a, b) => a - b), n = s.length; if (!n) return null; const sum = s.reduce((a, b) => a + b, 0), mean = sum / n, med = q2(s), lo = s.slice(0, Math.floor(n / 2)), hi = s.slice(Math.ceil(n / 2)), Q1 = lo.length ? q2(lo) : s[0], Q3 = hi.length ? q2(hi) : s[n - 1], iqr = Q3 - Q1;
    const ss = s.reduce((a, x) => a + (x - mean) ** 2, 0), cnt = {}; s.forEach(x => cnt[x] = (cnt[x] || 0) + 1); const mc = Math.max(...Object.values(cnt)), modes = mc > 1 ? Object.keys(cnt).filter(k => cnt[k] === mc).map(Number) : [];
    const lf = Q1 - 1.5 * iqr, uf = Q3 + 1.5 * iqr, out = s.filter(x => x < lf || x > uf), inn = s.filter(x => x >= lf && x <= uf);
    return { s, n, sum, mean, med, Q1, Q3, iqr, min: s[0], max: s[n - 1], range: s[n - 1] - s[0], varP: ss / n, sdP: Math.sqrt(ss / n), sdS: n > 1 ? Math.sqrt(ss / (n - 1)) : NaN, modes, lf, uf, out, wlo: inn[0], whi: inn[inn.length - 1] };
  }
  function parseVals(t) { const tok = String(t || '').split(/[\s,;]+/).filter(Boolean), v = [], bad = []; tok.forEach(x => { const n = +x; if (isFinite(n)) v.push(n); else bad.push(x); }); return { v: v.slice(0, 300), bad }; }
  function sData(W) {
    const d = W.find('data')[0], g = W.find('gen')[0]; if (d) { const p = parseVals(d.p.values); return { v: p.v, bad: p.bad, src: 'typed data' }; }
    if (g) { const r = rng(g.p.seed), v = []; for (let i = 0; i < g.p.n; i++) v.push(Math.round((g.p.mean + g.p.sd * norm(r)) * 10) / 10); for (let i = 0; i < g.p.out; i++) v.push(Math.round((g.p.mean + g.p.sd * 4.5 * (i % 2 ? -1 : 1) * (1 + i * .3)) * 10) / 10); return { v, bad: [], src: 'random sample (seed ' + g.p.seed + ')' }; }
    return null;
  }
  function chartDraw(it, W) {
    const D = sData(W), st = D && D.v.length ? describe(D.v) : null; let s = `<rect x="-310" y="-190" width="620" height="380" rx="14" fill="rgba(10,18,60,.6)" stroke="rgba(160,180,255,.35)" stroke-width="2"/>`; if (!st) return s + TX(0, 0, 'Add a data set (typed or random)', { s: 15, c: '#9fb4ff' });
    const pad = (st.range || 1) * .08, lo = st.min - pad, hi = st.max + pad, X = v => -270 + (v - lo) / (hi - lo) * 540, base = 130;
    s += L(-270, base, 270, base, '#e8eeff', 2); const ticks = 6; for (let i = 0; i <= ticks; i++) { const v = lo + (hi - lo) * i / ticks; s += L(X(v), base, X(v), base + 5, '#e8eeff', 1.5) + TX(X(v), base + 19, fmt(v, Math.abs(hi - lo) < 10 ? 1 : 0), { s: 10, c: '#9fb4ff', w: 600 }); }
    if (it.p.kind === 'hist' || it.p.kind === 'dot') {
      const nb = it.p.bins, bwid = (st.max - st.min || 1) / nb, cts = Array(nb).fill(0); st.s.forEach(x => cts[Math.min(nb - 1, Math.floor((x - st.min) / bwid))]++); const mx = Math.max(...cts);
      cts.forEach((c, i) => { const x0 = X(st.min + i * bwid), x1 = X(st.min + (i + 1) * bwid); if (it.p.kind === 'hist') s += `<rect x="${x0 + 1}" y="${base - c / mx * 230}" width="${x1 - x0 - 2}" height="${c / mx * 230}" fill="#4cc9f0" opacity=".8" stroke="#bfeaff" rx="2"/>` + (c ? TX((x0 + x1) / 2, base - c / mx * 230 - 5, c, { s: 11 }) : ''); else for (let k = 0; k < c; k++) s += CIR((x0 + x1) / 2, base - 10 - k * 15, 6, '#4cc9f0', '#fff', 1); });
      s += TX(-270, -160, it.p.kind === 'hist' ? 'Histogram (frequency)' : 'Dot plot', { s: 12, c: '#ffe9a8', a: 'start' });
    } else {
      const y = 20, h = 70; s += L(X(st.wlo), y, X(st.Q1), y, '#ffd23f', 3) + L(X(st.Q3), y, X(st.whi), y, '#ffd23f', 3) + L(X(st.wlo), y - 18, X(st.wlo), y + 18, '#ffd23f', 3) + L(X(st.whi), y - 18, X(st.whi), y + 18, '#ffd23f', 3) + `<rect x="${X(st.Q1)}" y="${y - h / 2}" width="${Math.max(2, X(st.Q3) - X(st.Q1))}" height="${h}" fill="rgba(76,201,240,.35)" stroke="#4cc9f0" stroke-width="3"/>` + L(X(st.med), y - h / 2, X(st.med), y + h / 2, '#4ade80', 4);
      st.out.forEach(o => { s += CIR(X(o), y, 6, '#ff5d6c', '#fff', 2); }); s += TX(X(st.Q1), y - h / 2 - 8, 'Q1', { s: 11, c: '#7dd3fc' }) + TX(X(st.Q3), y - h / 2 - 8, 'Q3', { s: 11, c: '#7dd3fc' }) + TX(X(st.med), y + h / 2 + 16, 'median', { s: 11, c: '#86efac' }) + TX(-270, -160, 'Box plot (1.5 × IQR rule for outliers)', { s: 12, c: '#ffe9a8', a: 'start' });
    }
    s += L(X(st.mean), base - 240, X(st.mean), base, '#ff9f1c', 2.5, '6 4') + TX(X(st.mean), -170 + 8, 'mean ' + fmt(st.mean, 2), { s: 11, c: '#ffc77a' }); if (it.p.kind !== 'box') s += L(X(st.med), base - 240, X(st.med), base, '#4ade80', 2.5, '2 4') + TX(X(st.med) + 4, -150, 'median ' + fmt(st.med, 2), { s: 10.5, c: '#86efac', a: 'start' }); return s;
  }
  RL.register({
    id: 'stats', lab: 'maths', topic: 'Statistics', title: 'Data Handling & Statistical Charts', icon: '📊', level: 'Intermediate', model: 'full',
    assumptions: 'All statistics are computed from the data on the bench. Quartiles use the “median of each half” method (the median is excluded from both halves when n is odd); other textbooks/calculators may differ slightly. The random sample uses a seeded Normal generator, so a given seed always gives the same data. Standard deviation is shown both for a population (÷n) and a sample (÷(n−1)).',
    objective: 'Type in or generate a data set, view it as a histogram, dot plot or box plot, and see how mean, median, spread and outliers behave.',
    theory: '<p>The <b>mean</b> is the sum ÷ n, the <b>median</b> is the middle value and the <b>mode</b> is the most frequent. Spread is measured by the <b>range</b>, the <b>interquartile range</b> (IQR = Q3 − Q1) and the <b>standard deviation</b>. A value is flagged as an <b>outlier</b> if it is below Q1 − 1.5·IQR or above Q3 + 1.5·IQR. The mean is pulled towards outliers; the median is resistant to them.</p>',
    formulas: ['mean = Σx ÷ n', 'σ = √[Σ(x − mean)² ÷ n]', 's = √[Σ(x − mean)² ÷ (n − 1)]', 'IQR = Q3 − Q1', 'outlier if x < Q1 − 1.5·IQR or x > Q3 + 1.5·IQR'], fixedView: true, animated: false, params: [],
    types: {
      data: { name: () => 'Typed data', icon: '⌨️', w: 220, h: 80, fixed: true, defaults: { values: '2, 4, 4, 4, 5, 5, 7, 9' }, props: [{ k: 'values', label: 'Values (separate by commas or spaces)', type: 'text', val: '2, 4, 4, 4, 5, 5, 7, 9' }], info: 'Edit the numbers in the panel on the right. Up to 300 values.', draw: it => `<rect x="-110" y="-40" width="220" height="80" rx="12" fill="rgba(20,30,80,.88)" stroke="#ffd23f" stroke-width="2.5"/>` + TX(0, -14, '⌨ Data', { s: 13, c: '#ffd23f' }) + TX(0, 8, String(it.p.values).slice(0, 26) + (String(it.p.values).length > 26 ? '…' : ''), { s: 12 }) + TX(0, 28, parseVals(it.p.values).v.length + ' values', { s: 11, c: '#9fb4ff' }), place: () => [130, 90] },
      gen: { name: () => 'Random sample', icon: '🎰', w: 220, h: 80, fixed: true, defaults: { n: 30, mean: 50, sd: 10, seed: 7, out: 0 }, props: [{ k: 'n', label: 'Sample size n', min: 5, max: 100, step: 1, val: 30 }, { k: 'mean', label: 'Mean', min: 0, max: 100, step: 1, val: 50 }, { k: 'sd', label: 'Standard deviation', min: 1, max: 30, step: 1, val: 10 }, { k: 'seed', label: 'Random seed', min: 1, max: 99, step: 1, val: 7 }, { k: 'out', label: 'Add outliers', min: 0, max: 3, step: 1, val: 0 }], info: 'Generates a bell-shaped sample. Typed data takes priority if both are present.', draw: it => `<rect x="-110" y="-40" width="220" height="80" rx="12" fill="rgba(20,30,80,.88)" stroke="#b794f6" stroke-width="2.5"/>` + TX(0, -14, '🎰 Random sample', { s: 13, c: '#d8c4ff' }) + TX(0, 8, `n = ${it.p.n}, mean ≈ ${it.p.mean}, sd ≈ ${it.p.sd}`, { s: 11.5 }) + TX(0, 28, `seed ${it.p.seed}${it.p.out ? ' + ' + it.p.out + ' outlier(s)' : ''}`, { s: 11, c: '#9fb4ff' }), place: () => [130, 190] },
      chart: { name: () => 'Chart', icon: '📊', w: 620, h: 380, fixed: true, defaults: { kind: 'hist', bins: 8 }, props: [{ k: 'kind', label: 'Chart type', type: 'select', options: [['hist', 'Histogram'], ['box', 'Box plot'], ['dot', 'Dot plot']], val: 'hist' }, { k: 'bins', label: 'Number of bars', min: 3, max: 20, step: 1, val: 8 }], info: 'Mean (orange dashes) and median (green) are marked.', draw: chartDraw, place: () => [660, 280] }
    },
    catalog: [{ type: 'data', name: 'Typed data set', icon: '⌨️', desc: 'Enter your own numbers', max: 1, tags: 'enter list values' }, { type: 'gen', name: 'Random sample', icon: '🎰', desc: 'Normal-like data with chosen mean and spread', max: 1, tags: 'generate simulate normal' }, { type: 'chart', name: 'Chart', icon: '📊', desc: 'Histogram / box plot / dot plot', max: 1, tags: 'histogram box plot dot' }],
    init(W) { W.add('data', 130, 90); W.add('chart', 660, 280); },
    onAdd(W, it) { const t = { data: [130, 90], gen: [130, 190], chart: [660, 280] }[it.type]; if (t) { it.x = t[0]; it.y = t[1]; } },
    sim() { },
    messages(W) { const D = sData(W), r = []; if (!D) return [{ t: 'info', m: 'Add a typed data set or a random sample.' }]; if (D.bad.length) r.push({ t: 'warn', m: 'Ignored non-numbers: ' + D.bad.slice(0, 4).join(', ') + (D.bad.length > 4 ? '…' : '') }); if (!D.v.length) r.push({ t: 'warn', m: 'No valid numbers yet — type some values separated by commas.' }); else if (D.v.length < 5) r.push({ t: 'info', m: 'Very few values: quartiles and outlier tests are not meaningful for tiny data sets.' }); if (!W.find('chart')[0]) r.push({ t: 'info', m: 'Add a chart to see the picture.' }); const st = D.v.length ? describe(D.v) : null; if (st && st.out.length) r.push({ t: 'info', m: 'Outlier(s) detected: <b>' + st.out.map(x => fmt(x, 1)).join(', ') + '</b>. Compare how the mean and median respond.' }); return r.slice(0, 4); },
    readouts(W) { const D = sData(W); if (!D || !D.v.length) return []; const s = describe(D.v), f = (v, d) => fmt(v, d == null ? 3 : d); return [{ l: 'Source', v: D.src }, { l: 'n', v: s.n }, { l: 'Sum', v: s.sum, d: 3 }, { l: 'Mean', v: s.mean, d: 3 }, { l: 'Median', v: s.med, d: 3 }, { l: 'Mode', v: s.modes.length ? s.modes.join(', ') : 'none (no repeats)' }, { l: 'Range', v: s.range, d: 3 }, { l: 'Q1 / Q3', v: f(s.Q1) + ' / ' + f(s.Q3) }, { l: 'IQR', v: s.iqr, d: 3 }, { l: 'Std deviation (population)', v: s.sdP, d: 3 }, { l: 'Std deviation (sample)', v: isNaN(s.sdS) ? '–' : s.sdS, d: 3 }, { l: 'Outlier fences', v: f(s.lf) + ' to ' + f(s.uf) }, { l: 'Outliers', v: s.out.length ? s.out.map(x => f(x, 1)).join(', ') : 'none' }]; },
    live(W) { const D = sData(W); if (!D || !D.v.length) return []; const s = describe(D.v); return [`mean = ${fmt(s.sum, 2)} ÷ ${s.n} = <b>${fmt(s.mean, 3)}</b>`, `IQR = ${fmt(s.Q3, 2)} − ${fmt(s.Q1, 2)} = <b>${fmt(s.iqr, 2)}</b>`]; },
    graphs: [],
    guided: {
      objective: 'See how one extreme value changes the mean but hardly the median.', setup: W => { W.add('data', 130, 90, { values: '2, 4, 4, 4, 5, 5, 7, 9' }); W.add('chart', 660, 280, { kind: 'hist', bins: 8 }); },
      steps: [{ t: 'The data set is 2, 4, 4, 4, 5, 5, 7, 9. Predict its mean.', predict: { q: 'The mean of 2, 4, 4, 4, 5, 5, 7, 9 is…', opts: ['5', '4.5', '4'], a: 0, why: 'Sum 40 ÷ 8 values = 5.' }, ok: W => !!W.find('data')[0] },
        { t: 'Read mean, median and mode in Results. Why is the mode 4?', ok: W => !!sData(W) },
        { t: 'Add the value 40 to the end of the data (edit the list in the right panel). What happens to the mean? And the median?', ok: W => { const d = W.find('data')[0]; return d && parseVals(d.p.values).v.some(x => x >= 30); } },
        { t: 'Switch the chart to a Box plot: the extreme value is flagged as an outlier (red dot).', ok: W => { const c = W.find('chart')[0]; return c && c.p.kind === 'box'; } }],
      done: () => 'The mean is pulled by extreme values; the median and IQR are resistant. Box plots flag outliers with the 1.5 × IQR rule.'
    },
    quiz: [{ q: 'The median of 3, 9, 4, 7, 5 is…', opts: ['5', '4', '9'], a: 0, why: 'Order: 3, 4, 5, 7, 9 → middle value 5.' }, { q: 'Adding one very large value to a data set mainly changes the…', opts: ['mean', 'median', 'mode'], a: 0, why: 'The mean uses every value, so it moves; the median barely moves.' }, { q: 'IQR is…', opts: ['Q3 − Q1', 'max − min', 'mean − median'], a: 0, why: 'It is the spread of the middle half of the data.' }]
  });

  /* ============================ CORRELATION & REGRESSION ============================ */
  function scData(W) {
    const d = W.find('sdata')[0]; if (!d) return null; const r = rng(d.p.seed), n = d.p.n, R = d.p.r, pts = []; for (let i = 0; i < n; i++) { const x = norm(r), z = norm(r), y = R * x + Math.sqrt(Math.max(0, 1 - R * R)) * z; pts.push([50 + 10 * x, 50 + 10 * y]); } if (d.p.out) pts.push([78, 22]);
    const N = pts.length, mx = pts.reduce((a, p) => a + p[0], 0) / N, my = pts.reduce((a, p) => a + p[1], 0) / N; let sxx = 0, syy = 0, sxy = 0; pts.forEach(p => { sxx += (p[0] - mx) ** 2; syy += (p[1] - my) ** 2; sxy += (p[0] - mx) * (p[1] - my); }); const b = sxy / sxx, a = my - b * mx, rr = sxy / Math.sqrt(sxx * syy); return { pts, N, mx, my, b, a, r: rr, r2: rr * rr };
  }
  function splotDraw(it, W) {
    const D = scData(W); let s = `<rect x="-300" y="-190" width="600" height="380" rx="14" fill="rgba(10,18,60,.6)" stroke="rgba(160,180,255,.35)" stroke-width="2"/>`; if (!D) return s + TX(0, 0, 'Add a data set (left)', { s: 15, c: '#9fb4ff' });
    const X = v => -250 + (v - 15) / 70 * 520, Y = v => 140 - (v - 15) / 70 * 300; s += L(-250, 140, 270, 140, '#e8eeff', 2) + L(-250, 140, -250, -160, '#e8eeff', 2); [20, 35, 50, 65, 80].forEach(v => { s += TX(X(v), 160, v, { s: 10, c: '#9fb4ff', w: 600 }) + TX(-258, Y(v) + 4, v, { s: 10, c: '#9fb4ff', w: 600, a: 'end' }); });
    s += TX(10, 180, 'x', { s: 12, c: '#9fb4ff' }) + TX(-285, -170, 'y', { s: 12, c: '#9fb4ff' });
    if (W.params.res) D.pts.forEach(p => { s += L(X(p[0]), Y(p[1]), X(p[0]), Y(D.a + D.b * p[0]), 'rgba(255,93,108,.55)', 1.5); });
    s += L(X(15), Y(D.a + D.b * 15), X(85), Y(D.a + D.b * 85), '#ffd23f', 3.5); D.pts.forEach((p, i) => { const o = W.find('sdata')[0].p.out && i === D.N - 1; s += CIR(X(p[0]), Y(p[1]), o ? 7 : 4.5, o ? '#ff5d6c' : '#4cc9f0', '#fff', 1.2); });
    s += CIR(X(D.mx), Y(D.my), 6, '#ff9f1c', '#fff', 2) + TX(X(D.mx) + 8, Y(D.my) - 8, '(x̄, ȳ)', { s: 10.5, c: '#ffc77a', a: 'start' }); const xp = W.params.xp, yp = D.a + D.b * xp; s += L(X(xp), 140, X(xp), Y(yp), 'rgba(255,255,255,.5)', 1.5, '5 4') + CIR(X(xp), Y(yp), 6, '#4ade80', '#fff', 2); return s;
  }
  RL.register({
    id: 'scatter', lab: 'maths', topic: 'Statistics', title: 'Scatter Graphs, Correlation & Line of Best Fit', icon: '📈', level: 'Advanced', model: 'full',
    assumptions: 'Points are generated from a seeded Normal model with a chosen target correlation; the sample correlation r is computed from the points and differs from the target (that is the lesson). Least-squares regression of y on x is calculated exactly.',
    objective: 'See how scatter graphs show correlation, how the least-squares line is found, how an outlier can distort r, and how to predict a value.',
    theory: '<p>The <b>Pearson correlation coefficient r</b> (between −1 and +1) measures how close points lie to a straight line. r near +1: strong positive; near −1: strong negative; near 0: little linear relationship. The <b>least-squares line</b> y = a + bx minimises the sum of squared vertical distances (residuals). It always passes through the mean point (x̄, ȳ). <b>Correlation does not prove causation</b>, and predicting outside the data range (extrapolation) is unreliable.</p>',
    formulas: ['r = Sxy ÷ √(Sxx·Syy)', 'b = Sxy ÷ Sxx', 'a = ȳ − b·x̄', 'R² = r²'], fixedView: true, animated: false,
    params: [{ k: 'xp', label: 'Predict y for x =', min: 20, max: 80, step: 1, val: 60 }, { k: 'res', label: 'Show residuals', type: 'toggle', val: false }],
    types: {
      sdata: { name: () => 'Scatter data', icon: '🔵', w: 220, h: 80, fixed: true, defaults: { n: 30, r: 0.8, seed: 5, out: false }, props: [{ k: 'n', label: 'Number of points', min: 8, max: 80, step: 1, val: 30 }, { k: 'r', label: 'Target correlation', min: -1, max: 1, step: 0.05, val: 0.8 }, { k: 'seed', label: 'Random seed', min: 1, max: 99, step: 1, val: 5 }, { k: 'out', label: 'Add an outlier (78, 22)', type: 'toggle' }], draw: it => `<rect x="-110" y="-40" width="220" height="80" rx="12" fill="rgba(20,30,80,.88)" stroke="#4cc9f0" stroke-width="2.5"/>` + TX(0, -12, '🔵 Scatter data', { s: 13, c: '#7dd3fc' }) + TX(0, 10, `n = ${it.p.n}, target r = ${fmt(it.p.r, 2)}`, { s: 12 }) + TX(0, 29, `seed ${it.p.seed}${it.p.out ? ' · outlier on' : ''}`, { s: 11, c: '#9fb4ff' }), place: () => [130, 110] },
      splot: { name: () => 'Scatter graph', icon: '📈', w: 600, h: 380, fixed: true, defaults: {}, info: 'Gold line: least-squares best fit. Orange point: the mean point.', draw: splotDraw, place: () => [660, 280] }
    },
    catalog: [{ type: 'sdata', name: 'Scatter data', icon: '🔵', desc: 'Generate paired data', max: 1, tags: 'correlation points pairs' }, { type: 'splot', name: 'Scatter graph', icon: '📈', desc: 'Plot with line of best fit', max: 1, tags: 'graph regression line' }],
    init(W) { W.add('sdata', 130, 110); W.add('splot', 660, 280); },
    onAdd(W, it) { const t = { sdata: [130, 110], splot: [660, 280] }[it.type]; it.x = t[0]; it.y = t[1]; },
    sim() { },
    messages(W) { const D = scData(W), r = []; if (!D) return [{ t: 'info', m: 'Add scatter data to plot.' }]; if (!W.find('splot')[0]) r.push({ t: 'info', m: 'Add the scatter graph.' }); const a = Math.abs(D.r); r.push({ t: 'info', m: `r = ${fmt(D.r, 3)}: ${a > .8 ? 'strong' : a > .5 ? 'moderate' : a > .25 ? 'weak' : 'very weak / no'} ${D.r > 0 ? 'positive' : 'negative'} linear correlation.` }); if (W.params.xp < 25 || W.params.xp > 75) r.push({ t: 'warn', m: 'x is near the edge of the data: predictions outside the range (extrapolation) are unreliable.' }); return r; },
    readouts(W) { const D = scData(W); if (!D) return []; return [{ l: 'Points', v: D.N }, { l: 'Correlation r', v: D.r, d: 4 }, { l: 'R² (variation explained)', v: D.r2, d: 4 }, { l: 'Gradient b', v: D.b, d: 4 }, { l: 'Intercept a', v: D.a, d: 3 }, { l: 'Line of best fit', v: `y = ${fmt(D.a, 2)} ${D.b < 0 ? '−' : '+'} ${fmt(Math.abs(D.b), 3)}x` }, { l: 'Mean point', v: `(${fmt(D.mx, 2)}, ${fmt(D.my, 2)})` }, { l: `Prediction at x = ${W.params.xp}`, v: D.a + D.b * W.params.xp, d: 2 }]; },
    live(W) { const D = scData(W); if (!D) return []; return [`ŷ = ${fmt(D.a, 2)} ${D.b < 0 ? '−' : '+'} ${fmt(Math.abs(D.b), 3)} × ${W.params.xp} = <b>${fmt(D.a + D.b * W.params.xp, 2)}</b>`]; },
    graphs: [{ id: 'rs', title: 'Correlation r against target — press 📍 Record after changing the target', x: 'target r', y: 'sample r', manual: true, points: true, series: [{ n: 'r', c: '#4cc9f0' }], sample(W) { const D = scData(W), d = W.find('sdata')[0]; return D ? [Math.round(d.p.r * 100) / 100, D.r] : null; } }],
    guided: {
      objective: 'Interpret correlation and see how a single outlier can change it.', setup: W => { W.add('sdata', 130, 110, { n: 30, r: 0.8, seed: 5, out: false }); W.add('splot', 660, 280); },
      steps: [{ t: 'Look at the scatter graph with a target correlation of 0.8. Predict the sign and strength of r.', predict: { q: 'Points rising from lower-left to upper-right, tightly clustered, mean…', opts: ['strong positive correlation', 'strong negative correlation', 'no correlation'], a: 0, why: 'Upward trend with little scatter → r close to +1.' }, ok: W => !!scData(W) },
        { t: 'Set the target correlation to −0.8, then to 0. How does the picture and the line of best fit change?', ok: W => { const d = W.find('sdata')[0]; return d && d.p.r <= 0.05; } },
        { t: 'Set the target back to 0.8 and switch on the outlier (78, 22). Watch r fall.', ok: W => { const d = W.find('sdata')[0]; return d && d.p.out; } },
        { t: 'Switch on “Show residuals” and move the prediction x to 60. Read the predicted y.', ok: W => W.params.res }],
      done: () => 'r summarises linear association; one outlier can change it a lot, and the least-squares line always passes through (x̄, ȳ).'
    },
    quiz: [{ q: 'r = −0.9 means…', opts: ['strong negative correlation', 'weak positive correlation', 'no relationship'], a: 0, why: 'Near −1: y falls as x rises, closely linear.' }, { q: 'A line of best fit always passes through…', opts: ['the mean point (x̄, ȳ)', 'the origin', 'the first data point'], a: 0, why: 'a = ȳ − b·x̄ guarantees this.' }, { q: 'Strong correlation between ice-cream sales and sunburn shows…', opts: ['they are associated, not necessarily that one causes the other', 'ice cream causes sunburn', 'sunburn causes ice-cream sales'], a: 0, why: 'A hidden factor (hot sunny weather) drives both.' }]
  });

  /* ============================ GEOMETRIC CONSTRUCTIONS ============================ */
  const PX = 25;   // 1 cm = 25 world px
  const cps = W => W.items.filter(i => i.type === 'cp').sort((a, b) => a.id - b.id);
  const cpos = W => cps(W).map(i => [i.x, i.y]);
  const dist = (p, q) => Math.hypot(p[0] - q[0], p[1] - q[1]);
  const ang = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]);
  function cc(c0, r0, c1, r1) {   // circle-circle intersections
    const d = dist(c0, c1); if (d < 1e-9 || d > r0 + r1 || d < Math.abs(r0 - r1)) return null; const a = (r0 * r0 - r1 * r1 + d * d) / (2 * d), h = Math.sqrt(Math.max(0, r0 * r0 - a * a)), ux = (c1[0] - c0[0]) / d, uy = (c1[1] - c0[1]) / d, mx = c0[0] + a * ux, my = c0[1] + a * uy;
    return [[mx - h * uy, my + h * ux], [mx + h * uy, my - h * ux]];
  }
  const arcPath = (c, r, a0, a1) => { let d = a1 - a0; while (d < 0) d += 2 * Math.PI; while (d > 2 * Math.PI) d -= 2 * Math.PI; const e = [c[0] + r * Math.cos(a1), c[1] + r * Math.sin(a1)]; return `<path d="M${c[0] + r * Math.cos(a0)} ${c[1] + r * Math.sin(a0)}A${r} ${r} 0 ${d > Math.PI ? 1 : 0} 1 ${e[0]} ${e[1]}" fill="none" stroke="#b794f6" stroke-width="2" stroke-dasharray="5 3"/>`; };
  const dotP = (p, lbl, c) => CIR(p[0], p[1], 4.5, c || '#fff', '#14205c', 1.5) + (lbl ? TX(p[0] + 8, p[1] - 8, lbl, { s: 12, c: c || '#e8eeff', a: 'start' }) : '');
  const ext = (p, q, k) => { const d = dist(p, q) || 1, ux = (q[0] - p[0]) / d, uy = (q[1] - p[1]) / d; return [p[0] - ux * k, p[1] - uy * k, q[0] + ux * k, q[1] + uy * k]; };
  const TASKS = {
    perp: { name: 'Perpendicular bisector of AB', need: 2, steps: ['Draw the line segment AB.', 'With the compass on A and a radius more than half of AB, draw an arc above and below AB.', 'Keep the same radius, put the compass on B and draw arcs that cross the first ones. Mark the crossing points P and Q.', 'Join P and Q with a ruler. This line is the perpendicular bisector.', 'Mark M where PQ crosses AB: M is the midpoint, and PQ ⟂ AB.'] },
    equi: { name: 'Equilateral triangle on AB', need: 2, steps: ['Draw the line segment AB.', 'With the compass on A and radius AB, draw an arc.', 'With the compass on B and the same radius AB, draw another arc. They cross at C.', 'Join AC and BC: triangle ABC has three equal sides (60° angles).'] },
    bisect: { name: 'Bisector of angle BAC', need: 3, steps: ['Draw the angle: rays AB and AC from the vertex A.', 'Compass on A: draw an arc that cuts AB at P and AC at Q.', 'Compass on P, then on Q, with the same radius, draw arcs that cross inside the angle at R.', 'Draw the ray from A through R: it bisects the angle.'] },
    circum: { name: 'Circumcircle of triangle ABC', need: 3, steps: ['Draw the triangle ABC.', 'Construct the perpendicular bisector of AB.', 'Construct the perpendicular bisector of BC. They cross at O.', 'With the compass at O and radius OA, draw the circle through A, B and C.'] }
  };
  function perpB(A, B, r, stage, s0) {   // returns svg for perp-bisector construction up to stage offsets, plus line endpoints
    const I = cc(A, r, B, r); if (!I) return { s: '', I: null }; let s = ''; const aA = ang(A, B), phi = Math.acos(clamp(dist(A, B) / (2 * r), -1, 1)), aB = ang(B, A);
    if (stage >= s0 + 1) s += arcPath(A, r, aA - phi - .35, aA + phi + .35); if (stage >= s0 + 2) s += arcPath(B, r, aB - phi - .35, aB + phi + .35); return { s, I };
  }
  function cdata(W) {
    const t = TASKS[W.params.task], P = cpos(W); if (!t || P.length < t.need) return null; const st = W.params.stage, A = P[0], B = P[1], C = P[2]; let s = '', v = [], note = null, ok = true;
    const tri = (a, b, c) => `<polygon points="${a} ${b} ${c}" fill="rgba(76,201,240,.10)" stroke="#4cc9f0" stroke-width="3" stroke-linejoin="round"/>`;
    if (dist(A, B) < 15) return { s: '', v: [], warn: 'A and B are too close together.' };
    if (W.params.task === 'perp') {
      const r = dist(A, B) * .7, pb = perpB(A, B, r, st, 1); s += L(A[0], A[1], B[0], B[1], '#e8eeff', 3.5) + pb.s; const [P0, Q0] = pb.I;
      if (st >= 3) s += dotP(P0, 'P', '#ffd23f') + dotP(Q0, 'Q', '#ffd23f'); if (st >= 4) { const e = ext(P0, Q0, 30); s += L(e[0], e[1], e[2], e[3], '#4ade80', 3); }
      if (st >= 5) { const Mp = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2]; s += dotP(Mp, 'M', '#ff9f1c'); const u = [B[0] - A[0], B[1] - A[1]], w = [Q0[0] - P0[0], Q0[1] - P0[1]]; v = [['MA', dist(Mp, A) / PX, 'cm'], ['MB', dist(Mp, B) / PX, 'cm'], ['Angle between PQ and AB', deg(Math.acos(Math.abs(u[0] * w[0] + u[1] * w[1]) / (Math.hypot(...u) * Math.hypot(...w)))), '°']]; }
    } else if (W.params.task === 'equi') {
      const r = dist(A, B), I = cc(A, r, B, r), C0 = I[0][1] < I[1][1] ? I[0] : I[1]; s += L(A[0], A[1], B[0], B[1], '#e8eeff', 3.5); const aA = ang(A, B), aB = ang(B, A);
      if (st >= 2) s += arcPath(A, r, aA - 1.3, aA - 0.6); if (st >= 3) s += arcPath(B, r, aB + 0.6, aB + 1.3) + dotP(C0, 'C', '#ffd23f'); if (st >= 4) { s += tri(A, B, C0); const sd = [dist(A, B), dist(B, C0), dist(C0, A)].map(x => x / PX); const an = k => { const [p, q, r2] = k; const a1 = ang(p, q) - ang(p, r2); return Math.abs(deg(Math.atan2(Math.sin(a1), Math.cos(a1)))); }; v = [['AB', sd[0], 'cm'], ['BC', sd[1], 'cm'], ['CA', sd[2], 'cm'], ['Angle at A', an([A, B, C0]), '°'], ['Angle at B', an([B, A, C0]), '°'], ['Angle at C', an([C0, A, B]), '°']]; }
      s = s.replace(/<polygon points="([^"]+) ([^"]+) ([^"]+)"/, (m, a, b, c) => `<polygon points="${a} ${b} ${c}"`);
    } else if (W.params.task === 'bisect') {
      const rays = (len) => L(A[0], A[1], A[0] + (B[0] - A[0]) / dist(A, B) * len, A[1] + (B[1] - A[1]) / dist(A, B) * len, '#e8eeff', 3.5) + L(A[0], A[1], A[0] + (C[0] - A[0]) / dist(A, C) * len, A[1] + (C[1] - A[1]) / dist(A, C) * len, '#e8eeff', 3.5); s += rays(300);
      const cr = Math.cross || null, area2 = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]); if (Math.abs(area2) < 200) return { s, v: [], warn: 'A, B and C are almost in a line — the angle is 180° (or 0°). Move C.' };
      const r = Math.min(dist(A, B), dist(A, C)) * .55, aB = ang(A, B), aC = ang(A, C); let da = aC - aB; da = Math.atan2(Math.sin(da), Math.cos(da)); const P0 = [A[0] + r * Math.cos(aB), A[1] + r * Math.sin(aB)], Q0 = [A[0] + r * Math.cos(aC), A[1] + r * Math.sin(aC)];
      if (st >= 2) s += `<path d="M${P0[0]} ${P0[1]}A${r} ${r} 0 0 ${da > 0 ? 1 : 0} ${Q0[0]} ${Q0[1]}" fill="none" stroke="#b794f6" stroke-width="2" stroke-dasharray="5 3"/>` + dotP(P0, 'P', '#ffd23f') + dotP(Q0, 'Q', '#ffd23f');
      const sR = r * .9, I = cc(P0, sR, Q0, sR); let R0 = null; if (I) R0 = dist(A, I[0]) > dist(A, I[1]) ? I[0] : I[1]; else return { s, v: [], warn: 'Angle too small for this arc radius.' };
      if (st >= 3) { const a1 = ang(P0, R0), a2 = ang(Q0, R0); s += arcPath(P0, sR, a1 - .35, a1 + .35) + arcPath(Q0, sR, a2 - .35, a2 + .35) + dotP(R0, 'R', '#ffd23f'); }
      if (st >= 4) { const e = ext(A, R0, 0), k = 320 / dist(A, R0); s += L(A[0], A[1], A[0] + (R0[0] - A[0]) * k, A[1] + (R0[1] - A[1]) * k, '#4ade80', 3); const aR = ang(A, R0), d1 = Math.abs(deg(Math.atan2(Math.sin(aR - aB), Math.cos(aR - aB)))), d2 = Math.abs(deg(Math.atan2(Math.sin(aC - aR), Math.cos(aC - aR)))); v = [['Angle BAC', Math.abs(deg(da)), '°'], ['Angle BAR', d1, '°'], ['Angle RAC', d2, '°']]; }
      s += dotP(A, null);
    } else {
      s += tri(A, B, C); const area2 = (B[0] - A[0]) * (C[1] - A[1]) - (C[0] - A[0]) * (B[1] - A[1]); if (Math.abs(area2) < 200) return { s, v: [], warn: 'A, B and C are almost in a line — no circle passes through them. Move C.' };
      const bis = (p, q, r, k) => { const pb = perpB(p, q, r, st, k); return pb; }; const rAB = dist(A, B) * .7, rBC = dist(B, C) * .7, p1 = bis(A, B, rAB, 0), p2 = bis(B, C, rBC, 1);
      if (st >= 2 && p1.I) { s += (st >= 2 ? arcPath(A, rAB, ang(A, B) - Math.acos(clamp(dist(A, B) / (2 * rAB), -1, 1)) - .3, ang(A, B) + Math.acos(clamp(dist(A, B) / (2 * rAB), -1, 1)) + .3) + arcPath(B, rAB, ang(B, A) - Math.acos(clamp(dist(A, B) / (2 * rAB), -1, 1)) - .3, ang(B, A) + Math.acos(clamp(dist(A, B) / (2 * rAB), -1, 1)) + .3) : ''); const e = ext(p1.I[0], p1.I[1], 700); s += L(e[0], e[1], e[2], e[3], '#4ade80', 2.5); }
      const O = [0, 0]; const mAB = [(A[0] + B[0]) / 2, (A[1] + B[1]) / 2], mBC = [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2], dAB = [B[0] - A[0], B[1] - A[1]], dBC = [C[0] - B[0], C[1] - B[1]];
      // solve dAB·(O − mAB) = 0, dBC·(O − mBC) = 0
      const c1 = dAB[0] * mAB[0] + dAB[1] * mAB[1], c2 = dBC[0] * mBC[0] + dBC[1] * mBC[1], det = dAB[0] * dBC[1] - dAB[1] * dBC[0]; O[0] = (c1 * dBC[1] - c2 * dAB[1]) / det; O[1] = (dAB[0] * c2 - dBC[0] * c1) / det;
      if (st >= 3 && p2.I) { const rr = rBC, a0 = Math.acos(clamp(dist(B, C) / (2 * rr), -1, 1)); s += arcPath(B, rr, ang(B, C) - a0 - .3, ang(B, C) + a0 + .3) + arcPath(C, rr, ang(C, B) - a0 - .3, ang(C, B) + a0 + .3); const e = ext(p2.I[0], p2.I[1], 700); s += L(e[0], e[1], e[2], e[3], '#4ade80', 2.5) + dotP(O, 'O', '#ff9f1c'); }
      if (st >= 4) { s += CIR(O[0], O[1], dist(O, A), 'rgba(183,148,246,.08)', '#b794f6', 3); v = [['OA', dist(O, A) / PX, 'cm'], ['OB', dist(O, B) / PX, 'cm'], ['OC', dist(O, C) / PX, 'cm']]; }
    }
    P.forEach(p => { s += dotP(p, null, '#ffd23f'); });
    return { s, v };
  }
  RL.register({
    id: 'construct', lab: 'maths', topic: 'Geometry', title: 'Geometric Constructions (Compass & Ruler)', icon: '📏', level: 'Intermediate', model: 'full',
    assumptions: 'The construction is done with exact coordinates (arcs are calculated from circle–circle intersections), then the measured lengths and angles are computed to verify it. The arcs are drawn only partly, like on paper. Drag A, B or C — the construction redraws and stays correct.',
    objective: 'Carry out classic compass-and-ruler constructions step by step, then check by measuring that the result really has the claimed property.',
    theory: '<p>A <b>perpendicular bisector</b> of AB is the set of points equally far from A and B, so every point on it is the same distance from both ends. It is built from two equal-radius arcs. An <b>equilateral triangle</b> uses radius AB from both ends. An <b>angle bisector</b> is built from equal arcs so that R is the same distance from both rays (the triangles APR and AQR are congruent). The <b>circumcentre</b> of a triangle is where the perpendicular bisectors meet; it is equally far (OA = OB = OC) from all three vertices.</p>',
    formulas: ['distance = √[(x₂−x₁)² + (y₂−y₁)²]', '1 cm = 25 px on screen (all measurements computed from coordinates)'], fixedView: true, animated: false,
    params: [{ k: 'task', label: 'Construction', type: 'select', options: Object.keys(TASKS).map(k => [k, TASKS[k].name]), val: 'perp' }, { k: 'stage', label: 'Construction step', min: 0, max: 5, step: 1, val: 5 }],
    types: { cp: { name: it => 'Point', icon: '📍', w: 50, h: 50, defaults: {}, info: 'Drag me — the construction updates.', draw: (it, W) => CIR(0, 0, 14, 'rgba(255,210,63,.18)', '#ffd23f', 2) + TX(0, -22, 'ABC'[cps(W).indexOf(it)] || '', { s: 14, c: '#ffd23f' }) } },
    catalog: [{ type: 'cp', name: 'Point', icon: '📍', desc: 'Points A, B and C', tags: 'vertex' }],
    init(W) { W.add('cp', 330, 400, {}); W.add('cp', 640, 400, {}); W.add('cp', 480, 160, {}); },
    onAdd(W, it) { const n = cps(W).length - 1; if (n >= 3) { W.remove(it.id); return; } const s = [[330, 400], [640, 400], [480, 160]][n]; it.x = s[0]; it.y = s[1]; },
    step(W, dt) { const mx = TASKS[W.params.task].steps.length; if (W.d.cs == null || W.d.cs >= mx) W.d.cs = 0; W.d.cs += dt / 1.3; W.params.stage = Math.min(mx, Math.floor(W.d.cs)); if (W.d.cs >= mx) { W.params.stage = mx; W.running = false; } },
    onRun(W) { W.d.cs = 0; W.params.stage = 0; },
    onParam(W, k) { if (k === 'task') W.params.stage = TASKS[W.params.task].steps.length; },
    sim() { },
    reset(W) { W.d.cs = null; W.params.stage = TASKS[W.params.task].steps.length; },
    bg(W) { const c = cdata(W); return c ? c.s : ''; },
    messages(W) { const t = TASKS[W.params.task], r = [], n = cps(W).length; if (n < t.need) return [{ t: 'warn', m: `“${t.name}” needs ${t.need} points (${'ABC'.slice(0, t.need).split('').join(', ')}). Add ${t.need - n} more.` }]; const c = cdata(W); if (c && c.warn) r.push({ t: 'warn', m: c.warn }); if (W.params.stage > t.steps.length) W.params.stage = t.steps.length; return r; },
    readouts(W) { const c = cdata(W), t = TASKS[W.params.task]; if (!c) return []; const o = [{ l: 'Construction', v: t.name }, { l: 'Step shown', v: Math.min(W.params.stage, t.steps.length) + ' / ' + t.steps.length }]; if (c.v.length) o.push(...c.v.map(([l, v, u]) => ({ l: l + ' (measured)', v, u, d: 2 }))); else o.push({ l: 'Measurements', v: 'appear when the construction is complete' }); return o; },
    live(W) { const t = TASKS[W.params.task], st = Math.min(W.params.stage, t.steps.length); return [st ? `<b>Step ${st}:</b> ${t.steps[st - 1]}` : 'Press ▶ Run or move the step slider to build it one step at a time.']; },
    graphs: [],
    guided: {
      objective: 'Construct a perpendicular bisector, then check it by measuring.', setup: W => { W.add('cp', 330, 400, {}); W.add('cp', 640, 400, {}); W.add('cp', 480, 160, {}); W.params.task = 'perp'; W.params.stage = 0; },
      steps: [{ t: 'Points A, B (and C) are placed. The task is the perpendicular bisector of AB. Step slider = 0.', predict: { q: 'Every point on the perpendicular bisector of AB is…', opts: ['the same distance from A and B', 'closer to A than to B', 'at right angles to A'], a: 0, why: 'That is the definition: equidistant from both ends.' }, ok: W => cps(W).length >= 2 },
        { t: 'Press ▶ Run (or move the step slider) to watch the arcs and the line appear one step at a time.', ok: W => W.params.stage >= 3 },
        { t: 'Complete all 5 steps. Compare MA and MB and the angle between PQ and AB in Results.', ok: W => W.params.stage >= 5 },
        { t: 'Drag point B somewhere else. The construction redraws and the measurements remain MA = MB and 90°.', ok: W => { const p = cpos(W); return p.length >= 2 && (Math.abs(p[1][0] - 640) > 20 || Math.abs(p[1][1] - 400) > 20); } },
        { t: 'Choose “Equilateral triangle on AB” in Experiment variables and check that all three sides are equal.', ok: W => W.params.task === 'equi' }],
      done: () => 'Constructions are exact: the measured lengths and angles confirm the geometric proof, for any position of the points.'
    },
    quiz: [{ q: 'In an equilateral triangle each angle is…', opts: ['60°', '90°', '45°'], a: 0, why: 'Angles sum to 180° and all three are equal.' }, { q: 'The circumcentre of a triangle is where the…', opts: ['perpendicular bisectors meet', 'angle bisectors meet', 'medians meet at the base'], a: 0, why: 'It is equally far from all three vertices.' }, { q: 'When constructing a perpendicular bisector the compass radius must be…', opts: ['more than half of AB', 'less than half of AB', 'exactly AB/4'], a: 0, why: 'Otherwise the two arcs would not cross.' }]
  });
})();
