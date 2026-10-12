/* RAM LAB — Physics Lab experiments (load after ram-lab.js).
   Add a new experiment by calling RamLab.register({...}) — see README-RAMLAB.md. */
(function () {
  'use strict';
  const RL = window.RamLab; if (!RL) { console.warn('ram-lab-physics.js: load ram-lab.js first'); return; }
  const { esc, clamp, fmt } = RL.util;
  const NOTE_SIM = 'Simplified educational model: ';

  /* =====================================================================
     1) ELECTRIC CIRCUITS — a real nodal-analysis solver (not decorative).
        Every wire you draw changes the equations that are solved.
     ===================================================================== */
  function solveLinear(A, b) {            // Gaussian elimination with partial pivoting
    const n = b.length; for (let i = 0; i < n; i++) A[i].push(b[i]);
    for (let c = 0; c < n; c++) {
      let p = c; for (let r = c + 1; r < n; r++) if (Math.abs(A[r][c]) > Math.abs(A[p][c])) p = r;
      if (Math.abs(A[p][c]) < 1e-18) continue; [A[c], A[p]] = [A[p], A[c]];
      for (let r = c + 1; r < n; r++) { const f = A[r][c] / A[c][c]; if (f) for (let k = c; k <= n; k++) A[r][k] -= f * A[c][k]; }
    }
    const x = new Array(n).fill(0);
    for (let i = n - 1; i >= 0; i--) { let s = A[i][n]; for (let k = i + 1; k < n; k++) s -= A[i][k] * x[k]; x[i] = Math.abs(A[i][i]) < 1e-18 ? 0 : s / A[i][i]; }
    return x;
  }
  const bulbR = p => (p.Vr * p.Vr) / p.Pr;
  function resistanceOf(it) {
    const p = it.p;
    switch (it.type) {
      case 'resistor': case 'rheostat': return Math.max(0.01, p.R);
      case 'bulb': return p.blown ? 1e9 : bulbR(p);
      case 'switch': return p.closed ? 0.01 : 1e9;
      case 'ammeter': return 0.02;
      case 'voltmeter': return 1e7;
    } return null;
  }
  function solveCircuit(W) {
    // union-find over terminals joined by wires
    const par = {}; const key = (id, t) => id + ':' + t; const f = k => (par[k] === undefined || par[k] === k) ? (par[k] = k) : (par[k] = f(par[k]));
    W.items.forEach(it => (circuitTypes[it.type].terminals || []).forEach((t, i) => f(key(it.id, i))));
    W.wires.forEach(w => { const a = f(key(w.a[0], w.a[1])), b = f(key(w.b[0], w.b[1])); if (a !== b) par[a] = b; });
    const names = {}; let n = 0; const node = (id, t) => { const r = f(key(id, t)); if (names[r] === undefined) names[r] = n++; return names[r]; };
    W.items.forEach(it => { it._n0 = node(it.id, 0); it._n1 = node(it.id, 1); });
    const sources = W.items.filter(i => i.type === 'battery' || i.type === 'psu');
    let gnd = sources.length ? sources[0]._n0 : 0; if (!n) { W.d.sol = { V: [], gnd: 0, shorted: false }; return; }
    const G = Array.from({ length: n }, () => new Array(n).fill(0)), I = new Array(n).fill(0);
    const stamp = (a, b, g) => { G[a][a] += g; G[b][b] += g; G[a][b] -= g; G[b][a] -= g; };
    W.items.forEach(it => {
      if (it.type === 'battery' || it.type === 'psu') { const E = it.type === 'psu' && !it.p.on ? 0 : it.p.V, r = Math.max(0.01, it.p.r == null ? 0.1 : it.p.r), g = 1 / r; stamp(it._n0, it._n1, g); I[it._n1] += E / r; I[it._n0] -= E / r; it._E = E; it._r = r; }
      else { const R = resistanceOf(it); if (R != null) stamp(it._n0, it._n1, 1 / R); }
    });
    for (let i = 0; i < n; i++) G[i][i] += 1e-9;      // tiny leak to ground so floating parts stay solvable
    // ground node: remove its row/column
    const idx = []; for (let i = 0; i < n; i++) if (i !== gnd) idx.push(i);
    const A = idx.map(r => idx.map(c => G[r][c])), b = idx.map(r => I[r]), x = solveLinear(A, b);
    const V = new Array(n).fill(0); idx.forEach((k, j) => V[k] = x[j]);
    let shorted = false; const outI = {};
    W.items.forEach(it => {
      const v0 = V[it._n0], v1 = V[it._n1];
      if (it.type === 'battery' || it.type === 'psu') { const Vt = v1 - v0, cur = (it._E - Vt) / it._r; it.sim = { V: Vt, I: cur, P: Vt * cur, E: it._E }; if (cur > 15) shorted = true; outI[it.id + ':0'] = -cur; outI[it.id + ':1'] = cur; }
      else { const R = resistanceOf(it); if (R == null) return; const v = v0 - v1, cur = v / R; it.sim = { V: v, I: cur, P: v * cur }; outI[it.id + ':0'] = -cur; outI[it.id + ':1'] = cur; }
    });
    // overload: bulbs burn out when power far above rating
    W.items.forEach(it => { if (it.type === 'bulb' && !it.p.blown && it.sim && it.sim.P > 2.2 * it.p.Pr) { it.p.blown = true; W.d.burn = it.id; } });
    W.d.sol = { V, gnd, shorted, outI };
  }
  const wireCount = (W, id, t) => W.wires.filter(w => (w.a[0] === id && w.a[1] === t) || (w.b[0] === id && w.b[1] === t)).length;

  const L = (x1, y1, x2, y2, c, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c || '#e8eeff'}" stroke-width="${w || 3}" stroke-linecap="round"/>`;
  const TX = (x, y, t, o) => `<text x="${x}" y="${y}" text-anchor="middle" font-size="${(o && o.s) || 12}" font-weight="${(o && o.w) || 700}" fill="${(o && o.c) || '#fff'}" pointer-events="none">${t}</text>`;
  const meter = (it, letter, col, val, unit) => `${L(-50, 0, -24, 0)}${L(24, 0, 50, 0)}<circle r="24" fill="#0d1a4a" stroke="${col}" stroke-width="3"/>${TX(0, 8, letter, { s: 24, c: col, w: 900 })}${TX(0, 40, val == null ? '–' : fmt(val, 2) + ' ' + unit, { s: 13, c: col })}`;

  const circuitTypes = {
    battery: { name: it => 'Battery ' + it.p.V + ' V', icon: '🔋', w: 100, h: 50, terminals: [[-50, 0, '−'], [50, 0, '+']], defaults: { V: 6, r: 0.1 },
      props: [{ k: 'V', label: 'EMF (voltage)', min: 1, max: 12, step: 0.5, unit: 'V', val: 6 }, { k: 'r', label: 'Internal resistance', min: 0.01, max: 3, step: 0.01, unit: 'Ω', val: 0.1 }],
      info: 'A real cell has a small internal resistance, so its terminal voltage drops a little when current flows.',
      draw: it => `${L(-50, 0, -8, 0)}${L(8, 0, 50, 0)}${L(-8, -10, -8, 10, '#e8eeff', 4)}${L(8, -20, 8, 20, '#ff8a8a', 4)}${TX(0, -28, it.p.V + ' V', { c: '#ffd23f', s: 13 })}` + (it.sim ? TX(0, 38, 'I = ' + fmt(it.sim.I, 2) + ' A', { s: 11, c: '#9fc4ff' }) : '') },
    psu: { name: () => 'Power supply', icon: '🔌', w: 100, h: 56, terminals: [[-50, 14, '−'], [50, 14, '+']], defaults: { V: 6, r: 0.1, on: true },
      props: [{ k: 'V', label: 'Output voltage', min: 0, max: 12, step: 0.5, unit: 'V', val: 6 }, { k: 'on', label: 'Output on', type: 'toggle' }],
      info: 'Variable DC power supply (0–12 V). Turn the knob to change the voltage.',
      draw: it => `<rect x="-42" y="-26" width="84" height="48" rx="8" fill="#26335e" stroke="#4cc9f0" stroke-width="2.5"/><rect x="-32" y="-20" width="64" height="20" rx="4" fill="#041021"/>${TX(0, -5, (it.p.on ? fmt(it.p.V, 1) : '0.0') + ' V', { c: it.p.on ? '#4ade80' : '#667', s: 15, w: 800 })}<circle cx="0" cy="12" r="7" fill="#ffd23f"/>${L(-50, 14, -42, 14)}${L(42, 14, 50, 14)}` },
    switch: { name: it => 'Switch (' + (it.p.closed ? 'closed' : 'open') + ')', icon: '🎚️', w: 100, h: 44, terminals: [[-50, 0], [50, 0]], defaults: { closed: false },
      props: [{ k: 'closed', label: 'Switch closed', type: 'toggle' }], info: 'Tap the switch (or use the toggle) to open or close the circuit.',
      onClick: it => { it.p.closed = !it.p.closed; },
      draw: it => `${L(-50, 0, -22, 0)}${L(22, 0, 50, 0)}<circle cx="-22" cy="0" r="5" fill="#ffd23f"/><circle cx="22" cy="0" r="5" fill="#ffd23f"/>${it.p.closed ? L(-22, 0, 22, 0, '#4ade80', 5) : L(-22, 0, 16, -22, '#ff8a8a', 5)}${TX(0, 26, it.p.closed ? 'ON' : 'OFF', { c: it.p.closed ? '#4ade80' : '#ff8a8a', s: 11 })}` },
    resistor: { name: it => 'Resistor ' + it.p.R + ' Ω', icon: '〰️', w: 100, h: 44, terminals: [[-50, 0], [50, 0]], defaults: { R: 10 },
      props: [{ k: 'R', label: 'Resistance', min: 1, max: 100, step: 1, unit: 'Ω', val: 10 }], info: 'A fixed resistor obeys Ohm’s law: V = IR.',
      draw: it => `${L(-50, 0, -32, 0)}<path d="M-32 0 l6 -14 l10 28 l10 -28 l10 28 l10 -28 l6 14" fill="none" stroke="#ffd23f" stroke-width="3.5" stroke-linejoin="round"/>${L(32, 0, 50, 0)}${TX(0, -22, it.p.R + ' Ω', { c: '#ffd23f' })}` + (it.sim ? TX(0, 36, fmt(it.sim.I, 2) + ' A · ' + fmt(it.sim.V, 2) + ' V', { s: 10.5, c: '#9fc4ff', w: 600 }) : '') },
    rheostat: { name: it => 'Rheostat ' + it.p.R + ' Ω', icon: '🎛️', w: 100, h: 50, terminals: [[-50, 0], [50, 0]], defaults: { R: 20 },
      props: [{ k: 'R', label: 'Resistance (slider)', min: 1, max: 50, step: 1, unit: 'Ω', val: 20 }], info: 'A variable resistor: slide it to change the current in the circuit.',
      draw: it => `${L(-50, 0, -36, 0)}<rect x="-36" y="-12" width="72" height="24" rx="5" fill="none" stroke="#ff9f1c" stroke-width="3.5"/>${L(-36 + 72 * it.p.R / 50, -26, -36 + 72 * it.p.R / 50, -12, '#fff', 3)}${L(36, 0, 50, 0)}${TX(0, 34, it.p.R + ' Ω', { c: '#ff9f1c' })}` },
    bulb: { name: it => it.p.blown ? 'Bulb (blown)' : 'Bulb', icon: '💡', w: 100, h: 56, terminals: [[-50, 0], [50, 0]], defaults: { Vr: 6, Pr: 3, blown: false },
      props: [{ k: 'Vr', label: 'Rated voltage', min: 2, max: 12, step: 1, unit: 'V', val: 6 }, { k: 'Pr', label: 'Rated power', min: 1, max: 12, step: 1, unit: 'W', val: 3 }],
      info: 'A bulb is treated as a fixed resistor R = V²/P at its rating. It glows brighter as its power rises and burns out if overloaded.',
      draw: it => { const P = it.sim ? it.sim.P : 0, br = it.p.blown ? 0 : clamp(P / it.p.Pr, 0, 1.2), g = Math.min(1, br);
        return `${L(-50, 0, -22, 0)}${L(22, 0, 50, 0)}<defs><radialGradient id="gl${it.id}"><stop offset="0" stop-color="#fff6b0" stop-opacity="${g}"/><stop offset="1" stop-color="#ffd23f" stop-opacity="0"/></radialGradient></defs><circle r="${22 + 24 * g}" fill="url(#gl${it.id})"/><circle r="22" fill="${it.p.blown ? '#2a2a2a' : `rgba(255,${200 + 55 * g | 0},${80 + 150 * g | 0},${0.25 + 0.75 * g})`}" stroke="#e8eeff" stroke-width="3"/>${it.p.blown ? L(-9, -9, 9, 9, '#ff5d6c', 3) + L(9, -9, -9, 9, '#ff5d6c', 3) : L(-10, 10, 10, -10, '#fff', 2.5) + L(10, 10, -10, -10, '#fff', 2.5)}${TX(0, 40, it.p.blown ? 'BLOWN' : (it.sim ? fmt(P, 2) + ' W' : it.p.Vr + 'V ' + it.p.Pr + 'W'), { s: 11, c: it.p.blown ? '#ff5d6c' : '#ffe9a8' })}`; } },
    ammeter: { name: () => 'Ammeter', icon: '🅰️', w: 100, h: 56, terminals: [[-50, 0], [50, 0]], defaults: {}, info: 'Connect an ammeter IN SERIES (in the path of the current). It has almost zero resistance.',
      draw: it => meter(it, 'A', '#4ade80', it.sim ? Math.abs(it.sim.I) : null, 'A') },
    voltmeter: { name: () => 'Voltmeter', icon: '🅥', w: 100, h: 56, terminals: [[-50, 0], [50, 0]], defaults: {}, info: 'Connect a voltmeter IN PARALLEL (across the part you want to measure). It has a very large resistance.',
      draw: it => meter(it, 'V', '#4cc9f0', it.sim ? Math.abs(it.sim.V) : null, 'V') }
  };
  const circuitCatalog = [
    { type: 'battery', name: 'Battery', icon: '🔋', desc: 'Cell with EMF and internal resistance', tags: 'cell power supply voltage source' },
    { type: 'psu', name: 'Power supply', icon: '🔌', desc: 'Variable 0–12 V DC supply', tags: 'variable voltage dc source', max: 1 },
    { type: 'switch', name: 'Switch', icon: '🎚️', desc: 'Opens or closes the circuit', tags: 'key on off' },
    { type: 'resistor', name: 'Resistor', icon: '〰️', desc: 'Fixed resistance 1–100 Ω', tags: 'ohm resistance' },
    { type: 'rheostat', name: 'Rheostat', icon: '🎛️', desc: 'Variable resistor (slider)', tags: 'variable resistance' },
    { type: 'bulb', name: 'Bulb', icon: '💡', desc: 'Glows with power; can burn out', tags: 'lamp light' },
    { type: 'ammeter', name: 'Ammeter', icon: '🅰️', desc: 'Measures current (in series)', tags: 'current meter ampere' },
    { type: 'voltmeter', name: 'Voltmeter', icon: '🅥', desc: 'Measures voltage (in parallel)', tags: 'potential difference meter volt' }
  ];
  const wiresInfo = 'Wires: tap one terminal (●) then another to connect. Tap a wire to select and remove it.';
  function P(W, type, x, y, p) { return W.add(type, x, y, p); }
  function chain(W, list) { for (let i = 0; i < list.length - 1; i++) W.wire(list[i].id, 1, list[i + 1].id, 0); }

  const circuitBase = {
    lab: 'physics', topic: 'Electricity', icon: '🔌', model: 'full', types: circuitTypes, catalog: circuitCatalog,
    assumptions: 'Ideal wires; resistors, bulbs and meters are solved with nodal analysis (Kirchhoff’s laws). Meter resistance and battery internal resistance are included. Temperature effects on resistance are ignored.',
    alwaysFlow: false,
    sim(W) { solveCircuit(W); },
    reset(W) { W.items.forEach(i => { if (i.type === 'bulb') i.p.blown = false; }); },
    wireCurrent(W, w) { const s = W.d.sol; if (!s || !s.outI) return 0; const a = w.a[0] + ':' + w.a[1], b = w.b[0] + ':' + w.b[1]; const na = wireCount(W, w.a[0], w.a[1]) || 1; return (s.outI[a] || 0) / na; },
    messages(W) {
      const m = [], src = W.items.filter(i => i.type === 'battery' || i.type === 'psu'), s = W.d.sol;
      if (!W.items.length) return [{ t: 'info', m: 'Tap <b>＋ Add Equipment</b> to start building a circuit.' }];
      if (!src.length) m.push({ t: 'warn', m: 'No power source yet: add a battery or power supply.' });
      else if (src.every(x => !x.sim || Math.abs(x.sim.I) < 1e-4)) { const sw = W.items.find(i => i.type === 'switch' && !i.p.closed); m.push({ t: 'warn', m: sw ? 'The switch is open, so no current flows. Close it.' : 'No current: complete the circuit by wiring + → components → − of the source.' }); }
      if (s && s.shorted) m.push({ t: 'bad', m: 'SHORT CIRCUIT! A huge current flows because nothing limits it. Add a resistor.' });
      if (W.items.some(i => i.type === 'bulb' && i.p.blown)) m.push({ t: 'bad', m: 'A bulb burned out (too much voltage). Press ↺ Reset to replace it.' });
      return m;
    },
    readouts(W) {
      const r = []; W.items.forEach(it => {
        if (!it.sim) return; const n = circuitTypes[it.type].name(it);
        if (it.type === 'ammeter') r.push({ l: n, v: Math.abs(it.sim.I), u: 'A', d: 3 });
        else if (it.type === 'voltmeter') r.push({ l: n, v: Math.abs(it.sim.V), u: 'V', d: 3 });
        else if (it.type === 'battery' || it.type === 'psu') { r.push({ l: 'Source voltage', v: it.sim.V, u: 'V', d: 3 }); r.push({ l: 'Source current', v: it.sim.I, u: 'A', d: 3 }); if (Math.abs(it.sim.I) > 1e-6) r.push({ l: 'Total resistance', n: 'V/I', v: it.sim.V / it.sim.I, u: 'Ω', d: 2 }); }
        else if (it.type === 'resistor' || it.type === 'rheostat' || it.type === 'bulb') r.push({ l: n, n: fmt(it.sim.P, 2) + ' W', v: Math.abs(it.sim.I), u: 'A  @ ' + fmt(Math.abs(it.sim.V), 2) + ' V', d: 3 });
      }); return r;
    },
    live(W) {
      const out = [], am = W.find('ammeter')[0], vm = W.find('voltmeter')[0];
      if (am && vm && am.sim && vm.sim && Math.abs(am.sim.I) > 1e-4) out.push(`R = V ÷ I = ${fmt(Math.abs(vm.sim.V), 2)} ÷ ${fmt(Math.abs(am.sim.I), 3)} = <b>${fmt(Math.abs(vm.sim.V / am.sim.I), 2)} Ω</b>`);
      const rs = W.items.filter(i => (i.type === 'resistor' || i.type === 'rheostat' || i.type === 'bulb') && i.sim && Math.abs(i.sim.I) > 1e-4);
      rs.slice(0, 3).forEach(i => out.push(`${circuitTypes[i.type].name(i).split(' ')[0]}: P = VI = ${fmt(Math.abs(i.sim.V), 2)} × ${fmt(Math.abs(i.sim.I), 3)} = <b>${fmt(i.sim.P, 2)} W</b>`));
      return out;
    },
    graphs: [{
      id: 'iv', title: 'Current I (A) against voltage V (V) — press 📍 Record', x: 'Voltage V (V)', y: 'Current I (A)', manual: true, points: true, series: [{ n: 'I', c: '#ffd23f' }],
      sample(W) { const am = W.find('ammeter')[0], vm = W.find('voltmeter')[0]; if (!am || !vm || !am.sim || !vm.sim) return null; return [Math.round(Math.abs(vm.sim.V) * 100) / 100, Math.abs(am.sim.I)]; },
      fit(d) { if (d.length < 2) return null; let sxy = 0, sxx = 0; d.forEach(r => { sxy += r[0] * r[1]; sxx += r[0] * r[0]; }); if (!sxx) return null; const k = sxy / sxx; return (X, Y, x0, x1) => `<line x1="${X(0)}" y1="${Y(0)}" x2="${X(x1)}" y2="${Y(k * x1)}" stroke="#4cc9f0" stroke-width="1.5" stroke-dasharray="4 3"/>`; }
    }],
    results(W) {
      const d = W.graph.iv || []; if (d.length < 2) return '<p style="opacity:.75">Record 3 or more points (change the battery voltage between points) to test Ohm’s law.</p>';
      let sxy = 0, sxx = 0; d.forEach(r => { sxy += r[0] * r[1]; sxx += r[0] * r[0]; }); const k = sxy / sxx;
      return `<div class="rl-note">Straight line through the origin → <b>I ∝ V</b>.<br>Gradient = 1/R = ${fmt(k, 4)} A/V → <b>R = ${fmt(1 / k, 2)} Ω</b></div>`;
    },
    quiz: [
      { q: 'An ammeter must be connected…', opts: ['in series with the component', 'in parallel across the component', 'only across the battery'], a: 0, why: 'The current has to flow THROUGH the ammeter, so it sits in the path (series).' },
      { q: 'A 6 V battery is connected across a 12 Ω resistor. What current flows (ignoring internal resistance)?', opts: ['0.5 A', '2 A', '72 A'], a: 0, why: 'I = V/R = 6 ÷ 12 = 0.5 A.' },
      { q: 'If two identical bulbs are connected in parallel to a battery, each bulb is…', opts: ['as bright as a single bulb', 'half as bright', 'twice as bright'], a: 0, why: 'In parallel each bulb gets the full battery voltage, so each glows normally.' }
    ]
  };

  RL.register(Object.assign({}, circuitBase, {
    id: 'ohm', title: 'Ohm’s Law & Current', level: 'Beginner',
    objective: 'Discover how current depends on voltage and resistance, and show that V = IR.',
    theory: '<p>Electric <b>current</b> (I) is the flow of charge, measured in amperes. <b>Voltage</b> (V) is the push from the source. <b>Resistance</b> (R) opposes the current.</p><p>For a resistor at steady temperature, the current is proportional to the voltage: <b>V = IR</b>.</p>',
    formulas: ['V = I R', 'I = V / R', 'P = V I'],
    presets: [{ name: 'Ohm’s law circuit', icon: '📋', build: ohmSetup }],
    guided: {
      objective: 'Build a series circuit, record current for several voltages and prove V = IR.', setup: ohmSetup,
      steps: [
        { t: 'Build: power supply → switch → ammeter → resistor, then back to the supply. Put the voltmeter ACROSS the resistor. (Or tap “Set up for me”.)', predict: { q: 'If you double the voltage across a resistor, the current will…', opts: ['double', 'halve', 'stay the same'], a: 0, why: 'V = IR: with R fixed, I is proportional to V.' }, ok: W => W.count('ammeter') && W.count('voltmeter') && (W.count('resistor') || W.count('rheostat')) && (W.count('psu') || W.count('battery')) },
        { t: 'Close the switch so that the ammeter reads a current. Check that the voltmeter reads the supply voltage.', ok: W => { const a = W.find('ammeter')[0]; return a && a.sim && Math.abs(a.sim.I) > 0.001; } },
        { t: 'Set the supply to 2 V and press <b>📍 Record</b>. Repeat for 4 V, 6 V, 8 V and 10 V (select the power supply to change it).', ok: W => (W.graph.iv || []).length >= 4 },
        { t: 'Open the <b>📊 Results</b> tab: the points lie on a straight line through the origin. The gradient is 1/R. Now change the resistor and repeat!', ok: W => (W.graph.iv || []).length >= 4 }
      ],
      done: W => { const d = W.graph.iv || []; if (d.length < 2) return 'Record at least 3 points to see the result.'; let sxy = 0, sxx = 0; d.forEach(r => { sxy += r[0] * r[1]; sxx += r[0] * r[0]; }); return `Your data give R = ${fmt(sxx / sxy, 2)} Ω. I ∝ V, so the resistor is <b>ohmic</b>.`; }
    }
  }));
  function ohmSetup(W) {
    const ps = P(W, 'psu', 150, 190, { V: 6 }), sw = P(W, 'switch', 320, 190, { closed: true }), am = P(W, 'ammeter', 490, 190), r = P(W, 'resistor', 660, 190, { R: 10 }), vm = P(W, 'voltmeter', 660, 400);
    W.wire(ps.id, 1, sw.id, 0); W.wire(sw.id, 1, am.id, 0); W.wire(am.id, 1, r.id, 0); W.wire(r.id, 1, ps.id, 0);
    W.wire(vm.id, 0, r.id, 0); W.wire(vm.id, 1, r.id, 1);
  }
  RL.register(Object.assign({}, circuitBase, {
    id: 'series', title: 'Series Circuits', level: 'Beginner',
    objective: 'See that in a series circuit the same current flows everywhere and the voltages add up.',
    theory: '<p>In a <b>series</b> circuit the components are in one loop. The same current passes through each. The source voltage is shared: V = V₁ + V₂ + …. Total resistance: R = R₁ + R₂ + ….</p>',
    formulas: ['R = R₁ + R₂ + R₃', 'I same everywhere', 'V = V₁ + V₂ + V₃'],
    presets: [{ name: '3 bulbs in series', icon: '💡', build: seriesSetup }],
    guided: {
      objective: 'Build a series circuit with 2–3 bulbs and investigate current and brightness.', setup: seriesSetup,
      steps: [
        { t: 'Connect a battery, a switch and two bulbs in one loop (or tap “Set up for me”).', predict: { q: 'Adding more bulbs in series makes each bulb…', opts: ['dimmer', 'brighter', 'the same'], a: 0, why: 'More resistance means less current, so each bulb gets less power.' }, ok: W => W.count('bulb') >= 2 && W.count('battery') + W.count('psu') >= 1 },
        { t: 'Close the switch. Look at the bulbs: they all share the same current. Read the total resistance in <b>📊 Results</b>.', ok: W => W.items.some(i => i.type === 'bulb' && i.sim && i.sim.P > 0.01) },
        { t: 'Add a third bulb into the loop (re-wire!). What happens to the brightness and to the current?', ok: W => W.count('bulb') >= 3 && W.items.some(i => i.type === 'bulb' && i.sim && i.sim.P > 0.01) }
      ],
      done: W => { const s = W.find('battery')[0] || W.find('psu')[0]; return s && s.sim ? `Total resistance = ${fmt(s.sim.V / s.sim.I, 2)} Ω; every bulb carries ${fmt(s.sim.I, 3)} A.` : 'Build the circuit to see the totals.'; }
    }
  }));
  function seriesSetup(W) {
    const b = P(W, 'battery', 150, 190, { V: 9 }), sw = P(W, 'switch', 300, 190, { closed: true }), b1 = P(W, 'bulb', 450, 190), b2 = P(W, 'bulb', 600, 190), b3 = P(W, 'bulb', 750, 190);
    W.wire(b.id, 1, sw.id, 0); W.wire(sw.id, 1, b1.id, 0); W.wire(b1.id, 1, b2.id, 0); W.wire(b2.id, 1, b3.id, 0); W.wire(b3.id, 1, b.id, 0);
  }
  RL.register(Object.assign({}, circuitBase, {
    id: 'parallel', title: 'Parallel Circuits', level: 'Intermediate',
    objective: 'See that each branch of a parallel circuit gets the full voltage and the branch currents add up.',
    theory: '<p>In a <b>parallel</b> circuit each component is on its own branch across the same two points. Every branch has the same voltage; the currents add: I = I₁ + I₂ + …. The total resistance is lower than the smallest branch: 1/R = 1/R₁ + 1/R₂ + ….</p>',
    formulas: ['1/R = 1/R₁ + 1/R₂', 'V same on each branch', 'I = I₁ + I₂'],
    presets: [{ name: '2 parallel resistors', icon: '📋', build: parallelSetup }],
    guided: {
      objective: 'Build two resistors in parallel and verify that the branch currents add up.', setup: parallelSetup,
      steps: [
        { t: 'Connect a source, then two resistors on separate branches between the same two nodes, with an ammeter in each branch (tap “Set up for me” to see an example).', predict: { q: 'Two 10 Ω resistors in parallel have a total resistance of…', opts: ['5 Ω', '20 Ω', '10 Ω'], a: 0, why: '1/R = 1/10 + 1/10 = 2/10 → R = 5 Ω.' }, ok: W => W.count('resistor') >= 2 && W.count('ammeter') >= 2 },
        { t: 'Read the two branch currents and the total source current in <b>📊 Results</b>. Do I₁ + I₂ equal the total?', ok: W => W.find('ammeter').length >= 2 && W.find('ammeter').every(a => a.sim && Math.abs(a.sim.I) > 0.001) },
        { t: 'Change one resistor’s value. The other branch current does not change. Why? (Same voltage across it.)', ok: W => true }
      ],
      done: W => { const s = W.find('battery')[0] || W.find('psu')[0], am = W.find('ammeter'); return s && s.sim ? `Total current ${fmt(s.sim.I, 3)} A = ${am.map(a => fmt(Math.abs(a.sim.I), 3)).join(' + ')} A. Total resistance ${fmt(s.sim.V / s.sim.I, 2)} Ω.` : 'Build the circuit to see the totals.'; }
    }
  }));
  function parallelSetup(W) {
    const b = P(W, 'battery', 120, 130, { V: 6 }), a1 = P(W, 'ammeter', 330, 130), r1 = P(W, 'resistor', 520, 130, { R: 10 }), a2 = P(W, 'ammeter', 330, 330), r2 = P(W, 'resistor', 520, 330, { R: 20 });
    W.wire(b.id, 1, a1.id, 0); W.wire(a1.id, 1, r1.id, 0); W.wire(b.id, 1, a2.id, 0); W.wire(a2.id, 1, r2.id, 0); W.wire(r1.id, 1, b.id, 0); W.wire(r2.id, 1, b.id, 0);
  }

  /* =====================================================================
     2) GAS LAWS — ideal gas PV = nRT with heater, piston weights, gauge
     ===================================================================== */
  const R_GAS = 8.314;
  const gasTypes = {
    container: { name: () => 'Gas cylinder', icon: '🧪', w: 200, h: 270, defaults: { n: 0.05, h0: 20 }, fixed: false,
      props: [{ k: 'n', label: 'Amount of gas', min: 0.01, max: 0.2, step: 0.01, unit: 'mol', val: 0.05 }],
      info: 'A cylinder with a movable piston. Add a heater, thermometer, pressure gauge and weights to it, then press Run.',
      place: () => [440, 300],
      draw: (it, W) => { const g = W.d.gas || {}, ph = pistonY(g); return `<rect x="-90" y="-120" width="180" height="250" rx="10" fill="rgba(125,211,252,.08)" stroke="#9fc4ff" stroke-width="4"/><rect x="-86" y="${ph}" width="172" height="${126 - ph + 2}" fill="rgba(255,${180 - clamp(((g.T || 300) - 300) / 5, 0, 130) | 0},90,${0.1 + clamp(((g.T || 300) - 280) / 500, 0, .5)})"/><rect x="-88" y="${ph - 14}" width="176" height="14" rx="3" fill="#8b93b8" stroke="#e8eeff" stroke-width="2"/>${L(0, ph - 14, 0, -150, '#8b93b8', 8)}<rect x="-30" y="-166" width="60" height="16" rx="4" fill="#8b93b8"/>` + gasDots(g, ph) + TX(0, 150, 'V = ' + fmt((g.V || 0) * 1000, 1) + ' L', { c: '#9fc4ff', s: 13 }); } },
    heater: { name: () => 'Heater', icon: '🔥', w: 150, h: 40, defaults: { P: 20, on: true }, fixed: false,
      props: [{ k: 'P', label: 'Heating power', min: 5, max: 100, step: 5, unit: 'W', val: 20 }, { k: 'on', label: 'Heater on', type: 'toggle' }], info: 'Place the heater under the cylinder. Heat raises the gas temperature.',
      draw: it => `<rect x="-70" y="-14" width="140" height="28" rx="8" fill="${it.p.on ? '#ff6b35' : '#4a3a3a'}" stroke="#ffd23f" stroke-width="2.5"/>${it.p.on ? '<path d="M-50 -18q6 -14 0 -24M-20 -18q6 -14 0 -24M10 -18q6 -14 0 -24M40 -18q6 -14 0 -24" fill="none" stroke="#ffb36b" stroke-width="3" stroke-linecap="round"/>' : ''}${TX(0, 5, it.p.P + ' W', { c: '#fff' })}` },
    thermo: { name: () => 'Thermometer', icon: '🌡️', w: 54, h: 130, defaults: {}, info: 'Place beside the cylinder to read the gas temperature.',
      draw: (it, W) => { const T = (W.d.gas && W.d.gas.T) || 300, h = clamp((T - 250) / 400, 0, 1) * 80; return `<rect x="-9" y="-60" width="18" height="100" rx="9" fill="#fff" stroke="#9fc4ff" stroke-width="2"/><circle cx="0" cy="48" r="14" fill="#ff4d5e" stroke="#9fc4ff" stroke-width="2"/><rect x="-4" y="${44 - h}" width="8" height="${h + 4}" fill="#ff4d5e"/>${TX(0, 82, fmt(T - 273.15, 1) + ' °C', { c: '#ffb3b3', s: 12 })}${TX(0, 96, fmt(T, 0) + ' K', { c: '#9fc4ff', s: 11 })}`; } },
    gauge: { name: () => 'Pressure gauge', icon: '🧭', w: 110, h: 120, defaults: {}, info: 'Place beside the cylinder to read the gas pressure.',
      draw: (it, W) => { const p = (W.d.gas && W.d.gas.P) || 0, a = -120 + clamp(p / 400000, 0, 1) * 240; return `<circle r="46" fill="#0d1a4a" stroke="#ffd23f" stroke-width="4"/><path d="M-32 28A40 40 0 1 1 32 28" fill="none" stroke="rgba(255,255,255,.3)" stroke-width="4"/>${L(0, 0, Math.sin(a * Math.PI / 180) * 36, -Math.cos(a * Math.PI / 180) * 36, '#ff5d6c', 4)}<circle r="5" fill="#fff"/>${TX(0, 66, fmt(p / 1000, 1) + ' kPa', { c: '#ffe9a8', s: 12 })}`; } },
    weight: { name: it => 'Weight ' + it.p.m + ' kg', icon: '🏋️', w: 90, h: 50, defaults: { m: 2 }, props: [{ k: 'm', label: 'Mass', min: 1, max: 20, step: 1, unit: 'kg', val: 2 }],
      info: 'Weights placed on the piston add pressure: P = P₀ + mg/A. Drop it above the cylinder.',
      draw: it => `<path d="M-40 22 L-30 -18 H30 L40 22 Z" fill="#6b7aa8" stroke="#e8eeff" stroke-width="2.5"/>${TX(0, 8, it.p.m + ' kg', { c: '#fff', s: 13 })}` }
  };
  const A_PISTON = 0.005;   // m² (50 cm²)
  function pistonY(g) { const frac = clamp((g.V || 0.001) / 0.0025, 0.1, 1); return 126 - 246 * frac; }
  function gasDots(g, ph) { let s = ''; const T = g.T || 300, n = 14, t = (typeof performance !== 'undefined' ? performance.now() : 0) / 1000; const sp = 0.6 + (T - 250) / 300;
    for (let i = 0; i < n; i++) { const wx = 160, wy = 126 - ph - 8, x = -80 + Math.abs(((i * 53 + t * 40 * sp * (1 + (i % 3) * .4)) % (2 * wx)) - wx), y = ph + 8 + Math.abs(((i * 97 + t * 33 * sp * (1 + (i % 4) * .3)) % (2 * wy)) - wy); s += `<circle cx="${x}" cy="${y}" r="3.5" fill="#7dd3fc" opacity=".85"/>`; } return s; }
  function gasState(W) {
    const c = W.find('container')[0]; if (!c) { W.d.gas = null; return null; }
    let g = W.d.gas; if (!g) g = W.d.gas = { T: 300, V: 0.002, P: 101325, T0: 300 };
    const near = (it, dx, dy) => Math.abs(it.x - c.x) <= dx && Math.abs(it.y - c.y) <= dy;
    g.heater = W.find('heater').find(h => h.p.on && h.x > c.x - 150 && h.x < c.x + 150 && h.y > c.y + 100 && h.y < c.y + 200);
    g.thermo = W.find('thermo').some(t => near(t, 200, 150) && !(Math.abs(t.x - c.x) < 100)); g.gauge = W.find('gauge').some(t => near(t, 240, 170) && !(Math.abs(t.x - c.x) < 100));
    g.mass = W.find('weight').filter(w => Math.abs(w.x - c.x) < 100 && w.y < c.y - 60).reduce((s, w) => s + w.p.m, 0);
    g.n = c.p.n; const P0 = 101325; g.Pnew = P0 + g.mass * 9.8 / A_PISTON;
    return g;
  }
  RL.register({
    id: 'gas', lab: 'physics', topic: 'Heat & Gases', title: 'Gas Pressure, Volume & Temperature', icon: '🎈', level: 'Intermediate', model: 'simplified',
    assumptions: 'Ideal gas (PV = nRT), a frictionless piston with 50 cm² area, no heat loss (the cylinder walls add 4 J/K of heat capacity), heated slowly so the gas stays in equilibrium. Real gases deviate at high pressure/low temperature.',
    objective: 'Investigate how pressure, volume and temperature of a gas are linked, and verify PV = nRT, Boyle’s and Charles’s laws.',
    theory: '<p>Gas particles move randomly and hit the walls: this is <b>pressure</b>. Heating makes particles faster. For a fixed amount of gas: <b>PV = nRT</b>. At constant temperature P ∝ 1/V (Boyle). At constant pressure V ∝ T (Charles). At constant volume P ∝ T (Gay-Lussac).</p>',
    formulas: ['PV = nRT', 'P₁V₁ = P₂V₂ (T const)', 'V₁/T₁ = V₂/T₂ (P const)', 'R = 8.314 J/(mol·K)'],
    types: gasTypes, catalog: [
      { type: 'container', name: 'Gas cylinder + piston', icon: '🧪', desc: 'Holds the gas; the piston moves freely', tags: 'gas container piston syringe', max: 1 },
      { type: 'heater', name: 'Heater', icon: '🔥', desc: 'Adds heat energy (place below the cylinder)', tags: 'burner hot' },
      { type: 'thermo', name: 'Thermometer', icon: '🌡️', desc: 'Reads the gas temperature', tags: 'temperature', max: 1 },
      { type: 'gauge', name: 'Pressure gauge', icon: '🧭', desc: 'Reads the gas pressure', tags: 'pressure meter', max: 1 },
      { type: 'weight', name: 'Piston weight', icon: '🏋️', desc: 'Mass on the piston adds pressure', tags: 'mass load' }],
    params: [{ k: 'pin', label: 'Pin the piston (constant volume)', type: 'toggle', val: false }],
    animated: true, sampleEvery: 0.2,
    init(W) { W.add('container', 440, 300); },
    presets: [{ name: 'Full set-up', icon: '📋', build: gasSetup }],
    sim(W, dt) {
      const g = gasState(W); if (!g) return; const T0 = 300;
      if (W.running && dt > 0) {
        const Cv = 1.5 * g.n * R_GAS, Cp = 2.5 * g.n * R_GAS;      // monatomic ideal gas: heating at constant pressure uses Cp, pinned piston uses Cv
        const Pw = g.heater ? g.heater.p.P : 0, C = W.params.pin ? Cv : Cp;
        g.T += (Pw / (C + 4)) * dt;                                  // +4 J/K: the cylinder walls also warm up
        g.T = clamp(g.T, 200, 900);
      }
      if (W.params.pin) { g.V = g.V; g.P = g.n * R_GAS * g.T / g.V; }
      else { g.P = g.Pnew; g.V = g.n * R_GAS * g.T / g.P; }
      if (g.V > 0.0025) { g.V = 0.0025; g.P = g.n * R_GAS * g.T / g.V; g.capped = true; } else g.capped = false;
    },
    reset(W) { W.d.gas = null; },
    messages(W) {
      const m = [], g = gasState(W), c = W.find('container')[0];
      if (!c) return [{ t: 'warn', m: 'Add a gas cylinder first: everything else needs it.' }];
      const hs = W.find('heater'); if (hs.length && !g.heater) m.push({ t: 'warn', m: 'The heater must be <b>below the cylinder</b> to heat the gas (and switched on).' });
      if (!W.find('thermo').length || !W.find('gauge').length) m.push({ t: 'info', m: 'Add a thermometer and a pressure gauge (beside the cylinder) to take readings.' });
      if (W.find('thermo').length && !g.thermo) m.push({ t: 'warn', m: 'Move the thermometer close to the cylinder so it can measure the gas.' });
      if (W.find('weight').length && !g.mass) m.push({ t: 'warn', m: 'Weights only count when they are <b>above the piston</b> (over the cylinder).' });
      if (g.capped) m.push({ t: 'warn', m: 'The piston reached the top of the cylinder (maximum volume).' });
      if (W.params.pin) m.push({ t: 'info', m: 'Piston pinned: the volume is constant, so pressure ∝ temperature.' });
      return m;
    },
    readouts(W) {
      const g = W.d.gas; if (!g) return []; const r = [{ l: 'Temperature', v: g.T - 273.15, u: '°C', d: 1 }, { l: 'Temperature', v: g.T, u: 'K', d: 0 }, { l: 'Pressure', v: g.P / 1000, u: 'kPa', d: 1 }, { l: 'Volume', v: g.V * 1000, u: 'L', d: 3 }];
      return r;
    },
    live(W) { const g = W.d.gas; if (!g) return []; return [`PV = ${fmt(g.P, 0)} × ${fmt(g.V, 5)} = <b>${fmt(g.P * g.V, 2)} J</b>`, `nRT = ${fmt(g.n, 2)} × 8.314 × ${fmt(g.T, 0)} = <b>${fmt(g.n * R_GAS * g.T, 2)} J</b>`]; },
    graphs: [{ id: 'tv', title: 'Volume (L) against temperature (K)', x: 'Temperature T (K)', y: 'Volume V (L)', series: [{ n: 'V', c: '#4cc9f0' }], sample(W) { const g = W.d.gas; return g ? [Math.round(g.T), g.V * 1000] : null; } },
      { id: 'tp', title: 'Pressure (kPa) against temperature (K)', x: 'Temperature T (K)', y: 'Pressure P (kPa)', series: [{ n: 'P', c: '#ff8a8a' }], sample(W) { const g = W.d.gas; return g ? [Math.round(g.T), g.P / 1000] : null; } }],
    results(W) { const g = W.d.gas; if (!g) return ''; return `<div class="rl-note">${W.params.pin ? 'Constant volume: P/T = ' + fmt(g.P / g.T, 3) + ' Pa/K (stays the same).' : 'Constant pressure ' + fmt(g.P / 1000, 1) + ' kPa: V/T = ' + fmt(g.V * 1000 / g.T, 4) + ' L/K (stays the same).'}</div>`; },
    guided: {
      objective: 'Heat a gas and observe how its volume and pressure respond.', setup: gasSetup,
      steps: [
        { t: 'Add a gas cylinder, a heater <b>below</b> it, a thermometer and a pressure gauge beside it (or “Set up for me”).', predict: { q: 'With a free piston (constant pressure), heating the gas will…', opts: ['expand it (volume increases)', 'raise the pressure only', 'do nothing to volume'], a: 0, why: 'Charles’s law: V ∝ T at constant pressure, so the piston rises.' }, ok: W => { const g = gasState(W); return !!(g && g.heater && g.thermo && g.gauge); } },
        { t: 'Press <b>▶ Run</b> and watch the temperature and volume rise. Open <b>📊 Results</b> to see the V–T graph is a straight line.', ok: W => W.t > 3 },
        { t: 'Now Reset, tick <b>Pin the piston</b> in Controls and run again: the volume stays fixed so the <b>pressure</b> rises with temperature instead.', ok: W => W.params.pin && W.t > 3 },
        { t: 'Reset and drop a weight on the piston: more pressure, less volume (Boyle’s law).', ok: W => { const g = gasState(W); return !!(g && g.mass > 0); } }
      ],
      done: W => 'PV/T stays constant (= nR) in every run: that is the ideal gas law.'
    },
    quiz: [{ q: 'A gas in a rigid (fixed-volume) container is heated. Its pressure will…', opts: ['increase', 'decrease', 'stay the same'], a: 0, why: 'P ∝ T at constant volume: faster particles hit the walls harder and more often.' },
      { q: 'The volume of a gas is halved at constant temperature. Its pressure becomes…', opts: ['double', 'half', 'the same'], a: 0, why: 'Boyle’s law: P₁V₁ = P₂V₂.' },
      { q: 'Temperatures in gas-law equations must be in…', opts: ['kelvin', '°C', '°F'], a: 0, why: 'Absolute temperature (K = °C + 273) is required, since 0 K is where P or V would extrapolate to zero.' }]
  });
  function gasSetup(W) { const c = W.add('container', 440, 280); W.add('heater', 440, 460, { P: 30 }); W.add('thermo', 740, 260); W.add('gauge', 740, 420); W.d.gas = null; }

  RL.physics = { solveCircuit, circuitTypes, helpers: { L, TX } };
})();
