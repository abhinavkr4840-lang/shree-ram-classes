/* RAM LAB — Chemistry Lab, part 1 (load after ram-lab.js):
   atomic structure · periodic trends · chemical bonding · balancing equations.
   Also provides the shared chemistry core used by ram-lab-chem2.js: element data (Z = 1–20), formula parser, atomic masses, equation balancer.
   Data: relative atomic masses (IUPAC rounded), Pauling electronegativity, calculated atomic radii (pm), first ionisation energy (kJ/mol) — textbook values, rounded. */
(function () {
  'use strict';
  const RL = window.RamLab; if (!RL) return;
  const { clamp, fmt } = RL.util;
  const L = (x1, y1, x2, y2, c, w, d) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c || '#e8eeff'}" stroke-width="${w || 2}" stroke-linecap="round"${d ? ` stroke-dasharray="${d}"` : ''}/>`;
  const TX = (x, y, t, o) => `<text x="${x}" y="${y}" text-anchor="${(o && o.a) || 'middle'}" font-size="${(o && o.s) || 12}" font-weight="${(o && o.w) || 700}" fill="${(o && o.c) || '#fff'}" pointer-events="none">${t}</text>`;
  const CIR = (x, y, r, f, s, w) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${f || 'none'}" stroke="${s || 'none'}" stroke-width="${w || 2}"/>`;
  const SUBS = '₀₁₂₃₄₅₆₇₈₉', SUPS = { '+': '⁺', '-': '⁻', '2': '²', '3': '³', '1': '' };
  const sub = f => String(f).replace(/([A-Za-z)\]])(\d+)/g, (m, a, ds) => a + ds.replace(/\d/g, d => SUBS[+d]));
  const ion = (sym, q) => sub(sym) + (q === 0 ? '' : (Math.abs(q) > 1 ? ['', '', '²', '³', '⁴'][Math.abs(q)] : '') + (q > 0 ? '⁺' : '⁻'));
  const gcd = (a, b) => b ? gcd(b, a % b) : Math.abs(a);

  /* ------------------------- element data (Z = 1–20) ------------------------- */
  const EL = [null,
    ['H', 'Hydrogen', 1.008, 2.20, 53, 1312], ['He', 'Helium', 4.0026, null, 31, 2372], ['Li', 'Lithium', 6.94, 0.98, 167, 520], ['Be', 'Beryllium', 9.0122, 1.57, 112, 900],
    ['B', 'Boron', 10.81, 2.04, 87, 801], ['C', 'Carbon', 12.011, 2.55, 67, 1086], ['N', 'Nitrogen', 14.007, 3.04, 56, 1402], ['O', 'Oxygen', 15.999, 3.44, 48, 1314],
    ['F', 'Fluorine', 18.998, 3.98, 42, 1681], ['Ne', 'Neon', 20.180, null, 38, 2081], ['Na', 'Sodium', 22.990, 0.93, 190, 496], ['Mg', 'Magnesium', 24.305, 1.31, 145, 738],
    ['Al', 'Aluminium', 26.982, 1.61, 118, 578], ['Si', 'Silicon', 28.085, 1.90, 111, 787], ['P', 'Phosphorus', 30.974, 2.19, 98, 1012], ['S', 'Sulfur', 32.06, 2.58, 88, 1000],
    ['Cl', 'Chlorine', 35.45, 3.16, 79, 1251], ['Ar', 'Argon', 39.948, null, 71, 1521], ['K', 'Potassium', 39.098, 0.82, 243, 419], ['Ca', 'Calcium', 40.078, 1.00, 194, 590]];
  const E = z => { const a = EL[z]; return a ? { z, sym: a[0], name: a[1], mass: a[2], en: a[3], rad: a[4], ie: a[5] } : null; };
  const POS = z => { const per = z <= 2 ? 1 : z <= 10 ? 2 : z <= 18 ? 3 : 4; let g; if (z === 1) g = 1; else if (z === 2) g = 18; else { const k = z - (per === 2 ? 2 : per === 3 ? 10 : 18); g = per === 4 ? k : (k <= 2 ? k : k + 10); } return { per, g }; };
  const KIND = z => { const s = EL[z][0]; return ['He', 'Ne', 'Ar'].includes(s) ? 'noble' : ['Li', 'Be', 'Na', 'Mg', 'Al', 'K', 'Ca'].includes(s) ? 'metal' : ['B', 'Si'].includes(s) ? 'metalloid' : 'nonmetal'; };
  const SELECT_EL = Array.from({ length: 20 }, (_, i) => [i + 1, `${EL[i + 1][0]} — ${EL[i + 1][1]} (Z = ${i + 1})`]);
  const ALLSYM = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
  const MASS = { Sc: 44.956, Ti: 47.867, V: 50.942, Cr: 51.996, Mn: 54.938, Fe: 55.845, Co: 58.933, Ni: 58.693, Cu: 63.546, Zn: 65.38, Ga: 69.723, Ge: 72.630, As: 74.922, Se: 78.971, Br: 79.904, Kr: 83.798, Rb: 85.468, Sr: 87.62, Ag: 107.87, Cd: 112.41, Sn: 118.71, Sb: 121.76, I: 126.90, Ba: 137.33, W: 183.84, Pt: 195.08, Au: 196.97, Hg: 200.59, Pb: 207.2, U: 238.03 };
  for (let z = 1; z <= 20; z++) MASS[EL[z][0]] = EL[z][2];

  /* ------------------------- formula parser ------------------------- */
  function parseFormula(f) {
    f = String(f).replace(/\s+/g, '').replace(/[·.•]/g, '·'); if (!f) throw new Error('empty formula');
    const parts = f.split('·'), total = {};
    parts.forEach((part, pi) => {
      let m = 1; const mm = /^(\d+)(.*)$/.exec(part); if (pi > 0 && mm) { m = +mm[1]; part = mm[2]; }
      let i = 0; const stack = [{}];
      const num = () => { let s = ''; while (i < part.length && /\d/.test(part[i])) s += part[i++]; return s ? +s : 1; };
      while (i < part.length) {
        const ch = part[i];
        if (ch === '(' || ch === '[') { stack.push({}); i++; }
        else if (ch === ')' || ch === ']') { i++; const n = num(), top = stack.pop(); if (!stack.length) throw new Error('unmatched )'); Object.keys(top).forEach(k => stack[stack.length - 1][k] = (stack[stack.length - 1][k] || 0) + top[k] * n); }
        else if (/[A-Z]/.test(ch)) { let sym = ch; i++; if (i < part.length && /[a-z]/.test(part[i])) sym += part[i++]; if (!ALLSYM.includes(sym)) throw new Error('“' + sym + '” is not an element symbol'); const n = num(); stack[stack.length - 1][sym] = (stack[stack.length - 1][sym] || 0) + n; }
        else throw new Error('unexpected “' + ch + '” — use element symbols and numbers, e.g. Ca(OH)2');
      }
      if (stack.length !== 1) throw new Error('missing )'); Object.keys(stack[0]).forEach(k => total[k] = (total[k] || 0) + stack[0][k] * m);
    });
    return total;
  }
  function molarMass(f) { const c = parseFormula(f); let m = 0; Object.keys(c).forEach(k => { if (MASS[k] == null) throw new Error('no atomic mass stored for ' + k); m += MASS[k] * c[k]; }); return m; }

  /* ------------------------- equation balancer (exact rational null-space) ------------------------- */
  function balance(left, right) {
    const sp = left.map(f => [f, 1]).concat(right.map(f => [f, -1])); let comp; try { comp = sp.map(s => parseFormula(s[0])); } catch (e) { return { err: e.message }; }
    const els = [...new Set(comp.flatMap(c => Object.keys(c)))], n = sp.length;
    let A = els.map(e => comp.map((c, j) => [sp[j][1] * (c[e] || 0), 1]));
    const fr = { add: (a, b) => red([a[0] * b[1] + b[0] * a[1], a[1] * b[1]]), mul: (a, b) => red([a[0] * b[0], a[1] * b[1]]), inv: a => a[0] < 0 ? [-a[1], -a[0]] : [a[1], a[0]], neg: a => [-a[0], a[1]] }; function red(a) { const g = gcd(a[0], a[1]) || 1; return [a[0] / g, a[1] / g]; }
    let r = 0; const piv = [];
    for (let c = 0; c < n && r < A.length; c++) { let p = -1; for (let i = r; i < A.length; i++) if (A[i][c][0] !== 0) { p = i; break; } if (p < 0) continue;[A[r], A[p]] = [A[p], A[r]]; const iv = fr.inv(A[r][c]); A[r] = A[r].map(x => fr.mul(x, iv)); for (let i = 0; i < A.length; i++) if (i !== r && A[i][c][0] !== 0) { const f = A[i][c]; A[i] = A[i].map((x, j) => fr.add(x, fr.neg(fr.mul(f, A[r][j])))); } piv.push(c); r++; }
    const free = []; for (let c = 0; c < n; c++) if (!piv.includes(c)) free.push(c);
    if (!free.length) return { none: true, els };
    if (free.length > 1) return { multi: true, els };
    const fcol = free[0], x = Array(n).fill(null).map(() => [0, 1]); x[fcol] = [1, 1]; piv.forEach((c, ri) => { x[c] = fr.neg(A[ri][fcol]); });
    let l = 1; x.forEach(v => { l = l * v[1] / gcd(l, v[1]); }); const co = x.map(v => v[0] * l / v[1]);
    if (co.some(v => v === 0) || !(co.every(v => v > 0) || co.every(v => v < 0))) return { none: true, els, sign: true }; const s = co[0] < 0 ? -1 : 1, out = co.map(v => v * s), g = out.reduce((a, b) => gcd(a, b), 0); return { co: out.map(v => v / g), els };
  }
  RL.chem = { EL, E, POS, KIND, parseFormula, molarMass, balance, MASS, sub, ion, ALLSYM, gcd, L, TX, CIR };

  /* ============================ ATOMIC STRUCTURE ============================ */
  const CAPS = [2, 8, 8, 2];
  function shells(ne) { const o = []; let r = ne; for (const c of CAPS) { const t = Math.min(c, r); o.push(t); r -= t; if (r <= 0) break; } if (r > 0) o.push(r); return o; }
  const atoms = W => W.items.filter(i => i.type === 'atom');
  const defN = z => Math.round(EL[z][2]) - z + (z === 1 ? 0 : 0);
  const aSel = W => (W.sel && W.sel.kind === 'item' && atoms(W).find(i => i.id === W.sel.id)) || atoms(W)[0];
  function atomDraw(it, W) {
    const e = E(it.p.Z), ne = it.p.Z - it.p.q, sh = shells(Math.max(0, ne)), t = W.t || 0; let s = '';
    const Rn = 24, R0 = 42, dR = 24;
    sh.forEach((n, i) => { const r = R0 + i * dR; s += CIR(0, 0, r, 'none', 'rgba(160,180,255,.45)', 1.5); for (let k = 0; k < n; k++) { const a = (k / n) * 2 * Math.PI + t * (0.9 - i * 0.18) * (i % 2 ? -1 : 1); s += CIR(r * Math.cos(a), r * Math.sin(a), 4.6, '#4cc9f0', '#e8fbff', 1.2); } });
    s += CIR(0, 0, Rn, 'rgba(255,93,108,.35)', '#ff8a9a', 2.5);
    const P = it.p.Z, N = it.p.n; for (let k = 0; k < Math.min(P + N, 40); k++) { const a = k * 2.399, rr = 3 + Math.sqrt(k + 0.5) * 3.2; s += CIR(rr * Math.cos(a) * .98, rr * Math.sin(a) * .98, 3.3, k % 2 === 0 ? '#ff5d6c' : '#9aa6c8', 'rgba(0,0,0,.3)', .6); }
    const R = R0 + Math.max(0, sh.length - 1) * dR; s += TX(0, R + 30, `${e.sym}${it.p.q ? ' ' + ion('', it.p.q).trim() : ''} · ${e.name}${it.p.q ? (it.p.q > 0 ? ' cation' : ' anion') : ''}`, { s: 13, c: '#ffe9a8' }) + TX(0, R + 46, `${P} p⁺  ${N} n⁰  ${Math.max(0, ne)} e⁻`, { s: 11.5, c: '#cfd8ff', w: 600 });
    return s;
  }
  const aPlace = W => [190 + (atoms(W).length % 3) * 280, 280];
  RL.register({
    id: 'atom', lab: 'chem', topic: 'Atomic Structure', title: 'Atomic Structure & Electron Shells', icon: '⚛️', level: 'Beginner', model: 'simplified',
    assumptions: 'Bohr-style shell model for Z = 1–20 (shells hold 2, 8, 8, 2 electrons in order; correct for these elements). Real electrons are not on circular orbits — they occupy orbitals. The nucleus picture is schematic. Default neutron number is the most common isotope (nearest whole number to the atomic mass).',
    objective: 'Build atoms and ions by choosing protons, neutrons and electrons, and read off the electron arrangement, mass number and charge.',
    theory: '<p>An atom has a nucleus of <b>protons</b> (+) and <b>neutrons</b> (neutral), with <b>electrons</b> (−) in shells around it. The atomic number Z = number of protons identifies the element. <b>Mass number A = protons + neutrons.</b> In a neutral atom electrons = protons. Isotopes have the same Z but different numbers of neutrons.</p><p>Electrons fill shells from the inside: 2, then 8, then 8, then 2 (for Z up to 20). Atoms gain or lose electrons to form <b>ions</b>: losing electrons gives a positive ion (cation), gaining gives a negative ion (anion). Many ions have the stable electron arrangement of a noble gas.</p>',
    formulas: ['A = Z + N (protons + neutrons)', 'charge = protons − electrons', 'electrons = Z − charge'], fixedView: false, animated: true, params: [],
    types: { atom: { name: it => E(it.p.Z).name + (it.p.q ? ' ion' : ' atom'), icon: '⚛️', w: 260, h: 260, defaults: { Z: 11, n: 12, q: 0 }, props: [{ k: 'Z', label: 'Element (protons)', type: 'select', options: SELECT_EL, val: 11 }, { k: 'n', label: 'Neutrons', min: 0, max: 24, step: 1, val: 12 }, { k: 'q', label: 'Charge of ion', min: -3, max: 3, step: 1, val: 0 }], info: 'Pick an element, then change neutrons (isotope) or charge (ion).', onProp(it, k) { it.p.Z = +it.p.Z; if (k === 'Z') { it.p.n = defN(it.p.Z); it.p.q = 0; } }, draw: atomDraw, place: aPlace } },
    catalog: [{ type: 'atom', name: 'Hydrogen', icon: '⚛️', desc: 'Z = 1', props: { Z: 1, n: 0, q: 0 }, tags: 'H element' }, { type: 'atom', name: 'Carbon', icon: '⚛️', desc: 'Z = 6', props: { Z: 6, n: 6, q: 0 }, tags: 'C' }, { type: 'atom', name: 'Oxygen', icon: '⚛️', desc: 'Z = 8', props: { Z: 8, n: 8, q: 0 }, tags: 'O' }, { type: 'atom', name: 'Sodium', icon: '⚛️', desc: 'Z = 11', props: { Z: 11, n: 12, q: 0 }, tags: 'Na' }, { type: 'atom', name: 'Chlorine', icon: '⚛️', desc: 'Z = 17', props: { Z: 17, n: 18, q: 0 }, tags: 'Cl' }, { type: 'atom', name: 'Calcium', icon: '⚛️', desc: 'Z = 20', props: { Z: 20, n: 20, q: 0 }, tags: 'Ca' }, { type: 'atom', name: 'Any element…', icon: '🔬', desc: 'Choose the element yourself (Z = 1–20)', props: { Z: 3, n: 4, q: 0 }, tags: 'lithium neon argon potassium magnesium aluminium silicon phosphorus sulfur nitrogen fluorine helium boron beryllium' }],
    init(W) { W.add('atom', 220, 280, { Z: 11, n: 12, q: 0 }); },
    onAdd(W, it) { it.p.Z = +it.p.Z; const [x, y] = aPlace({ items: W.items.filter(i => i.type === 'atom' && i !== it), }); it.x = 220 + ((atoms(W).length - 1) % 3) * 290; it.y = 280; },
    sim() { },
    messages(W) { const r = [], a = atoms(W); if (!a.length) return [{ t: 'info', m: 'Add an atom from the equipment list.' }]; a.forEach(it => { const ne = it.p.Z - it.p.q; if (ne <= 0) r.push({ t: 'warn', m: `${E(it.p.Z).sym}: charge +${it.p.q} would remove all (or more than all) of its ${it.p.Z} electrons — not possible.` }); else if (it.p.q !== 0) { const nobles = [2, 10, 18]; if (nobles.includes(ne)) r.push({ t: 'info', m: `${E(it.p.Z).sym}${ion('', it.p.q)} has ${ne} electrons — the same arrangement as ${EL[ne][1]} (a stable noble-gas structure).` }); } if (it.p.n === 0 && it.p.Z > 1) r.push({ t: 'warn', m: `${E(it.p.Z).sym} with no neutrons is not a stable nucleus (only hydrogen-1 has none).` }); }); return r.slice(0, 4); },
    readouts(W) {
      const it = aSel(W); if (!it) return []; const e = E(it.p.Z), ne = Math.max(0, it.p.Z - it.p.q), sh = shells(ne), pg = POS(it.p.Z), val = shells(it.p.Z).slice(-1)[0], dn = defN(it.p.Z);
      return [{ l: 'Element', v: `${e.name} (${e.sym})` }, { l: 'Protons (Z)', v: it.p.Z }, { l: 'Neutrons', v: it.p.n }, { l: 'Electrons', v: ne }, { l: 'Mass number A = Z + N', v: it.p.Z + it.p.n }, { l: 'Isotope', v: `${e.name}-${it.p.Z + it.p.n}${it.p.n === dn ? ' (most common)' : ''}` }, { l: 'Charge', v: it.p.q === 0 ? '0 (neutral atom)' : (it.p.q > 0 ? '+' : '') + it.p.q }, { l: 'Electron arrangement', v: sh.join(', ') || '–' }, { l: 'Group / Period', v: `${pg.g} / ${pg.per}` }, { l: 'Outer electrons (neutral atom)', v: val }, { l: 'Relative atomic mass', v: e.mass, d: 3 }, { l: 'Class', v: { noble: 'noble gas', metal: 'metal', nonmetal: 'non-metal', metalloid: 'metalloid' }[KIND(it.p.Z)] }];
    },
    live(W) { const it = aSel(W); if (!it) return []; const ne = it.p.Z - it.p.q; return [`A = ${it.p.Z} + ${it.p.n} = <b>${it.p.Z + it.p.n}</b> · electrons = ${it.p.Z} − (${it.p.q}) = <b>${ne}</b>`, `arrangement: <b>${shells(Math.max(0, ne)).join(', ')}</b>`]; },
    graphs: [],
    guided: {
      objective: 'Build sodium, then turn it into the sodium ion and compare with neon.', setup: W => { W.add('atom', 220, 280, { Z: 11, n: 12, q: 0 }); },
      steps: [{ t: 'A sodium atom (Z = 11) is on the bench. Count its electrons in each shell.', predict: { q: 'Sodium (Z = 11) has the electron arrangement…', opts: ['2, 8, 1', '2, 8, 8', '2, 9'], a: 0, why: 'Fill 2 in shell 1, 8 in shell 2, and the last 1 electron goes in shell 3.' }, ok: W => atoms(W).some(a => a.p.Z === 11) },
        { t: 'Read A, neutrons and the outer-electron count in Results. Na-23 has 12 neutrons.', ok: W => atoms(W).some(a => a.p.Z === 11) },
        { t: 'Set the charge to +1 (sodium loses its outer electron). What is the new arrangement?', ok: W => atoms(W).some(a => a.p.Z === 11 && a.p.q === 1) },
        { t: 'Compare with neon (Z = 10): add Neon from “Any element”. Na⁺ and Ne have the same electron arrangement, 2, 8.', ok: W => atoms(W).some(a => a.p.Z === 10) },
        { t: 'Now try chlorine (Z = 17) with charge −1: it gains one electron to reach 2, 8, 8 like argon.', ok: W => atoms(W).some(a => a.p.Z === 17 && a.p.q === -1) }],
      done: () => 'Ions form by losing or gaining electrons so the outer shell is full, giving a noble-gas arrangement. The number of protons never changes.'
    },
    quiz: [{ q: 'An atom has 17 protons and 18 neutrons. Its mass number is…', opts: ['35', '17', '18'], a: 0, why: 'A = protons + neutrons = 35 (chlorine-35).' }, { q: 'Magnesium (Z = 12) forms Mg²⁺. How many electrons does the ion have?', opts: ['10', '12', '14'], a: 0, why: '12 − 2 = 10 electrons.' }, { q: 'Isotopes of an element differ in their number of…', opts: ['neutrons', 'protons', 'electrons in a neutral atom'], a: 0, why: 'Same Z, different N.' }]
  });

  /* ============================ PERIODIC TRENDS ============================ */
  const PROPS = { rad: ['Atomic radius', 'pm', 4, 'low', 'high'], en: ['Electronegativity', '(Pauling)', 3, 'low', 'high'], ie: ['First ionisation energy', 'kJ/mol', 5, 'low', 'high'], mass: ['Relative atomic mass', '', 2, 'low', 'high'] };
  const probes = W => W.items.filter(i => i.type === 'probe');
  const T0 = { x: 290, y: 52, cw: 38, ch: 42 };
  const cellXY = z => { const p = POS(z); return [T0.x + (p.g - 1) * T0.cw, T0.y + (p.per - 1) * T0.ch]; };
  const pval = (z, k) => EL[z][PROPS[k][2]];
  function heat(t) { t = clamp(t, 0, 1); const r = Math.round(40 + 215 * t), g = Math.round(100 + 120 * (1 - Math.abs(t - .5) * 2)), b = Math.round(230 - 200 * t); return `rgb(${r},${g},${b})`; }
  const trendText = (a, b, k, W) => {
    const A = E(a), B = E(b), pa = POS(a), pb = POS(b), va = pval(a, k), vb = pval(b, k); if (va == null || vb == null) return 'Noble gases have no standard electronegativity, so they cannot be compared.'; const hi = vb > va ? 'higher' : 'lower'; let why = '';
    if (pa.per === pb.per && pa.g !== pb.g) { const right = pb.g > pa.g, up = right ? vb > va : va > vb; const expect = { rad: false, en: true, ie: true, mass: true }[k]; why = `Same period (${pa.per}); ${B.sym} is ${right ? 'to the right of' : 'to the left of'} ${A.sym}. Across a period the nuclear charge increases while the electrons enter the same shell, so ${k === 'rad' ? 'atoms get <b>smaller</b>' : k === 'en' ? 'attraction for bonding electrons <b>increases</b>' : k === 'ie' ? 'electrons are held more tightly and ionisation energy generally <b>increases</b>' : 'mass increases'}.`; if (k === 'rad' ? (right && vb > va) || (!right && vb < va) : k !== 'mass' && ((right && vb < va) || (!right && vb > va))) why += ' (This pair is one of the small exceptions caused by sub-shell effects.)'; }
    else if (pa.g === pb.g && pa.per !== pb.per) { const down = pb.per > pa.per; why = `Same group (${pa.g}); ${B.sym} is ${down ? 'below' : 'above'} ${A.sym}. Going down a group adds electron shells, so ${k === 'rad' ? 'atoms get <b>larger</b>' : k === 'en' ? 'attraction for bonding electrons <b>decreases</b> (more shielding, larger distance)' : k === 'ie' ? 'the outer electron is further away and easier to remove: ionisation energy <b>decreases</b>' : 'mass increases'}.`; }
    else why = 'These two are in different groups and periods, so both trends act together. Compare elements in the same period or group to isolate each trend.';
    return `${B.sym} has a <b>${hi}</b> ${PROPS[k][0].toLowerCase()} than ${A.sym} (${fmt(vb, 2)} vs ${fmt(va, 2)} ${PROPS[k][1]}). ` + why;
  };
  RL.register({
    id: 'periodic', lab: 'chem', topic: 'Periodic Table', title: 'Periodic Trends (Elements 1–20)', icon: '🧬', level: 'Intermediate', model: 'full',
    assumptions: 'Values are standard textbook data for the first 20 elements (Pauling electronegativity; calculated atomic radii; first ionisation energies; relative atomic masses), rounded. The table shows only Z = 1–20. Noble gases have no Pauling electronegativity (shown grey).',
    objective: 'Use real data to discover how atomic radius, electronegativity and ionisation energy change across a period and down a group.',
    theory: '<p>Properties of elements repeat in a pattern — <b>periodicity</b>. <b>Across a period</b> (left → right) the nuclear charge increases but electrons go into the same shell, so atoms get smaller, hold their electrons more tightly (higher ionisation energy) and attract bonding electrons more strongly (higher electronegativity). <b>Down a group</b> there are more electron shells, so atoms get larger and the outer electron is easier to remove.</p>',
    formulas: ['Electronegativity: Pauling scale', 'ionisation energy: X(g) → X⁺(g) + e⁻', 'trend across period: radius ↓, IE ↑, EN ↑', 'trend down group: radius ↑, IE ↓, EN ↓'], fixedView: true, animated: false,
    params: [{ k: 'prop', label: 'Property shown', type: 'select', options: Object.keys(PROPS).map(k => [k, PROPS[k][0]]), val: 'rad' }],
    types: { probe: { name: it => 'Probe: ' + E(it.p.Z).sym, icon: '🎯', w: 200, h: 46, fixed: true, defaults: { Z: 11 }, props: [{ k: 'Z', label: 'Element', type: 'select', options: SELECT_EL, val: 11 }], onProp(it) { it.p.Z = +it.p.Z; }, info: 'Probes highlight an element in the table and the chart. Use two probes to compare.', draw: (it, W) => { const c = ['#ffd23f', '#4ade80', '#ff6b9d'][probes(W).indexOf(it) % 3]; return `<rect x="-100" y="-22" width="200" height="44" rx="10" fill="rgba(20,30,80,.88)" stroke="${c}" stroke-width="2.5"/>` + TX(0, 5, `${E(it.p.Z).name} (Z = ${it.p.Z})`, { s: 12.5, c }); }, place: null } },
    catalog: [{ type: 'probe', name: 'Element probe', icon: '🎯', desc: 'Highlight an element to read its data (up to 3)', tags: 'select compare element' }],
    init(W) { W.add('probe', 110, 70, { Z: 3 }); W.add('probe', 110, 130, { Z: 9 }); },
    onAdd(W, it) { it.p.Z = +it.p.Z; const n = probes(W).length - 1; if (n >= 3) { W.remove(it.id); return; } it.x = 110; it.y = 70 + n * 60; },
    sim() { },
    bg(W) {
      const k = W.params.prop, vals = EL.slice(1).map((a, i) => pval(i + 1, k)).filter(v => v != null), mn = Math.min(...vals), mx = Math.max(...vals); let s = '';
      s += TX(T0.x + 9 * T0.cw, T0.y - 14, `Heat map of ${PROPS[k][0].toLowerCase()}  ${PROPS[k][1]}   (blue = low, red = high)`, { s: 12, c: '#ffe9a8' });
      for (let z = 1; z <= 20; z++) { const [x, y] = cellXY(z), v = pval(z, k); s += `<rect x="${x + 1}" y="${y + 1}" width="${T0.cw - 2}" height="${T0.ch - 2}" rx="5" fill="${v == null ? 'rgba(120,130,170,.35)' : heat((v - mn) / (mx - mn))}" stroke="rgba(10,18,60,.6)" stroke-width="1"/>` + TX(x + T0.cw / 2, y + 17, EL[z][0], { s: 14, c: '#0b1445' }) + TX(x + T0.cw / 2, y + 33, v == null ? '–' : fmt(v, k === 'en' ? 2 : k === 'mass' ? 1 : 0), { s: 9.5, c: '#0b1445', w: 600 }); }
      const pc = ['#ffd23f', '#4ade80', '#ff6b9d']; probes(W).forEach((p, i) => { const [x, y] = cellXY(p.p.Z); s += `<rect x="${x - 1}" y="${y - 1}" width="${T0.cw + 2}" height="${T0.ch + 2}" rx="6" fill="none" stroke="${pc[i % 3]}" stroke-width="4"/>`; });
      // bar chart across Z
      const bx = 290, by = 500, bw = 650, bh = 230; s += `<rect x="${bx - 12}" y="${by - bh - 28}" width="${bw + 24}" height="${bh + 66}" rx="10" fill="rgba(10,18,60,.55)" stroke="rgba(160,180,255,.3)"/>` + L(bx, by, bx + bw, by, '#e8eeff', 1.8) + L(bx, by, bx, by - bh, '#e8eeff', 1.8); const step = bw / 20;
      for (let z = 1; z <= 20; z++) { const v = pval(z, k), h = v == null ? 0 : v / mx * bh * .95, pr = probes(W).findIndex(p => p.p.Z === z); s += `<rect x="${bx + (z - 1) * step + 3}" y="${by - h}" width="${step - 6}" height="${h}" rx="3" fill="${pr >= 0 ? pc[pr % 3] : (v == null ? 'transparent' : heat((v - mn) / (mx - mn)))}" opacity="${pr >= 0 ? 1 : .85}"/>` + TX(bx + (z - .5) * step, by + 15, EL[z][0], { s: 10.5, c: pr >= 0 ? pc[pr % 3] : '#cfd8ff' }); if (v == null) s += TX(bx + (z - .5) * step, by - 8, 'n/a', { s: 9, c: '#9fb4ff', w: 600 }); }
      s += TX(bx + bw / 2, by + 34, 'Atomic number Z →', { s: 11, c: '#9fb4ff', w: 600 }) + TX(bx, by - bh - 8, PROPS[k][0] + ' ' + PROPS[k][1], { s: 11.5, c: '#ffe9a8', a: 'start' });
      return s;
    },
    messages(W) { const r = [], p = probes(W); if (!p.length) return [{ t: 'info', m: 'Add an element probe (two probes let you compare).' }]; if (p.length === 1) r.push({ t: 'info', m: 'Add a second probe to compare two elements.' }); const k = W.params.prop; if (k === 'en' && p.some(x => EL[x.p.Z][3] == null)) r.push({ t: 'warn', m: 'Noble gases have no Pauling electronegativity value.' }); return r; },
    readouts(W) { const p = probes(W), k = W.params.prop, o = []; p.forEach(pr => { const e = E(pr.p.Z), g = POS(pr.p.Z); o.push({ l: `${e.sym} — ${PROPS[k][0]}`, v: pval(e.z, k) == null ? 'none' : pval(e.z, k), u: PROPS[k][1], d: 2 }); o.push({ l: `${e.sym} group / period`, v: `${g.g} / ${g.per}` }); }); return o; },
    live(W) { const p = probes(W); if (p.length < 2) return []; return ['<b>Comparison:</b> ' + trendText(p[0].p.Z, p[1].p.Z, W.params.prop, W)]; },
    graphs: [],
    guided: {
      objective: 'Discover the periodic trends by comparing lithium → fluorine (a period) and Li → Na → K (a group).', setup: W => { W.add('probe', 110, 70, { Z: 3 }); W.add('probe', 110, 130, { Z: 9 }); W.params.prop = 'rad'; },
      steps: [{ t: 'Probes are on lithium (Z = 3) and fluorine (Z = 9), the two ends of period 2. Look at the atomic radius.', predict: { q: 'Going from Li to F across period 2, the atomic radius…', opts: ['decreases', 'increases', 'stays the same'], a: 0, why: 'More protons pull the same shell of electrons in tighter.' }, ok: W => W.params.prop === 'rad' && probes(W).length >= 2 },
        { t: 'Switch the property to Electronegativity. Which element attracts bonding electrons most?', ok: W => W.params.prop === 'en' },
        { t: 'Switch to First ionisation energy. Compare Li and F again, then read the explanation under “Live calculation”.', ok: W => W.params.prop === 'ie' },
        { t: 'Change the first probe to sodium and the second to potassium (same group). Does the radius rise or fall going down?', ok: W => { const p = probes(W); return p.length >= 2 && p.some(x => x.p.Z === 11) && p.some(x => x.p.Z === 19); } }],
      done: () => 'Across a period: radius falls, IE and EN rise. Down a group: radius rises, IE and EN fall.'
    },
    quiz: [{ q: 'Which has the larger atomic radius?', opts: ['Sodium', 'Chlorine', 'They are equal'], a: 0, why: 'Same period: Na is at the left (largest), Cl is at the right.' }, { q: 'Which element is the most electronegative?', opts: ['Fluorine', 'Francium', 'Sodium'], a: 0, why: 'F: top-right of the table (3.98).' }, { q: 'Going down group 1 the first ionisation energy…', opts: ['decreases', 'increases', 'is unchanged'], a: 0, why: 'The outer electron is further from the nucleus and more shielded.' }]
  });

  /* ============================ CHEMICAL BONDING ============================ */
  const bEls = W => W.items.filter(i => i.type === 'bel');
  const cov = z => { if (z === 1) return 1; const g = POS(z).g; return Math.min(g - 10, 18 - g); };
  const valenceN = z => { const g = POS(z).g; return g <= 2 ? g : g - 10; };
  function bondInfo(a, b) {
    const A = E(a), B = E(b), ka = KIND(a), kb = KIND(b); const o = { A, B };
    if (ka === 'noble' || kb === 'noble') return { ...o, type: 'noble', who: ka === 'noble' ? A : B };
    const ma = ka === 'metal', mb = kb === 'metal'; const den = Math.abs(A.en - B.en); o.den = den;
    if (ma && mb) return { ...o, type: 'metallic' };
    if (ma !== mb) { const M = ma ? A : B, N = ma ? B : A, qc = KIND(M.z) === 'metal' ? valenceN(M.z) : 0, qa = cov(N.z), g = gcd(qc, qa), nc = qa / g, na = qc / g; return { ...o, type: 'ionic', M, N, qc, qa, nc, na, formula: sub(M.sym + (nc > 1 ? nc : '') + N.sym + (na > 1 ? na : '')), covChar: den < 1.7 }; }
    if (a === b) return { ...o, type: 'cov', same: true, order: cov(a), formula: sub(A.sym + '2'), polar: false };
    const ca = cov(a), cb = cov(b), g = gcd(ca, cb), nA = cb / g, nB = ca / g; let first = A.en <= B.en ? [A, nA, B, nB] : [B, nB, A, nA]; if (a === 6 || b === 6) first = a === 6 ? [A, nA, B, nB] : [B, nB, A, nA]; else if ((a === 1 && [7, 15].includes(b)) || (b === 1 && [7, 15].includes(a))) first = [7, 15].includes(a) ? [A, nA, B, nB] : [B, nB, A, nA]; return { ...o, type: 'cov', polar: den >= 0.4, den, cA: ca, cB: cb, nA, nB, formula: sub(first[0].sym + (first[1] > 1 ? first[1] : '') + first[2].sym + (first[3] > 1 ? first[3] : '')), first };
  }
  function bondScene(W) {
    const e = bEls(W); if (e.length < 2) return ''; const info = bondInfo(+e[0].p.Z, +e[1].p.Z), cx = 650, cy = 270; let s = `<rect x="${cx - 270}" y="60" width="540" height="${430}" rx="16" fill="rgba(10,18,60,.5)" stroke="rgba(160,180,255,.3)"/>`;
    const atom = (x, y, sym, col, r, extra) => CIR(x, y, r, col, '#fff', 2.5) + TX(x, y + 5, sym, { s: 15, c: '#0b1445' }) + (extra || '');
    const dots = (x, y, r, n, col, ang0) => Array.from({ length: n }, (_, i) => { const a = (ang0 || 0) + i * (2 * Math.PI / Math.max(n, 1)); return CIR(x + (r + 11) * Math.cos(a), y + (r + 11) * Math.sin(a), 3.6, col || '#fff', '#14205c', 1); }).join('');
    if (info.type === 'noble') return s + TX(cx, cy, `${info.who.name} is a noble gas`, { s: 18, c: '#ffe9a8' }) + TX(cx, cy + 28, 'Its outer shell is already full, so it does not form bonds.', { s: 13, c: '#cfd8ff', w: 600 });
    if (info.type === 'metallic') { for (let i = 0; i < 12; i++) { const x = cx - 150 + (i % 4) * 100, y = cy - 80 + Math.floor(i / 4) * 80; s += CIR(x, y, 20, i % 2 ? '#c8d6ff' : '#ffd9a0', '#fff', 2) + TX(x, y + 5, '+', { s: 15, c: '#0b1445' }); } for (let i = 0; i < 26; i++) { const t = W.t || 0, x = cx - 190 + ((i * 53 + t * 40 * (1 + i % 3)) % 380), y = cy - 100 + ((i * 37 + Math.sin(t + i) * 12) % 200); s += CIR(x, y, 3.2, '#4cc9f0'); } return s + TX(cx, 470, `Metallic bonding: positive ions in a “sea” of delocalised electrons (${info.A.sym}, ${info.B.sym})`, { s: 13, c: '#ffe9a8' }); }
    if (info.type === 'ionic') {
      const M = info.M, N = info.N, ions = []; for (let i = 0; i < info.nc; i++) ions.push(['c', i]); for (let i = 0; i < info.na; i++) ions.push(['a', i]);
      const nC = info.nc, nA = info.na, gap = 105; const cxs = -(nC - 1) / 2 * gap, axs = -(nA - 1) / 2 * gap;
      for (let i = 0; i < nC; i++) { const x = cx - 150 + (nC > 1 ? (i - (nC - 1) / 2) * 90 : 0) , y = cy - 50; s += atom(x, y, M.sym, '#ff9a8a', 34, TX(x + 26, y - 30, ion('', info.qc).trim(), { s: 15, c: '#ffd0c8' })); }
      for (let i = 0; i < nA; i++) { const x = cx + 150 + (nA > 1 ? (i - (nA - 1) / 2) * 90 : 0), y = cy - 50 + (nA > 2 ? (i % 2 ? 20 : -20) : 0); s += atom(x, y, N.sym, '#8ad7ff', 38, TX(x + 28, y - 34, ion('', -info.qa).trim(), { s: 15, c: '#c8ecff' })); }
      const t = (W.t || 0) % 2; s += L(cx - 70, cy - 50, cx + 70, cy - 50, '#ffd23f', 2.5, '6 5') + `<polygon points="${cx + 70},${cy - 50} ${cx + 58},${cy - 57} ${cx + 58},${cy - 43}" fill="#ffd23f"/>` + TX(cx, cy - 62, `${info.qc * info.nc} e⁻ transferred`, { s: 12, c: '#ffe9a8' });
      s += TX(cx, cy + 70, `${info.formula}`, { s: 30, c: '#fff' }) + TX(cx, cy + 100, `${M.name} loses ${info.qc} → ${ion(M.sym, info.qc)}   ·   ${N.name} gains ${info.qa} → ${ion(N.sym, -info.qa)}`, { s: 13, c: '#cfd8ff' }) + TX(cx, cy + 124, `Ratio ${M.sym}:${N.sym} = ${info.nc}:${info.na} so the charges cancel: ${info.nc}×(+${info.qc}) + ${info.na}×(−${info.qa}) = 0`, { s: 12.5, c: '#ffe9a8', w: 600 }); return s;
    }
    const f = info.formula;
    if (info.same) { const bo = info.order; for (let i = 0; i < bo; i++) s += L(cx - 28, cy - 50 - (bo - 1) * 5 + i * 10, cx + 28, cy - 50 - (bo - 1) * 5 + i * 10, '#ffd23f', 3.5); s += atom(cx - 70, cy - 50, info.A.sym, '#8ad7ff', 36) + atom(cx + 70, cy - 50, info.A.sym, '#8ad7ff', 36); return s + TX(cx, cy + 50, f, { s: 30 }) + TX(cx, cy + 82, `${bo === 1 ? 'single' : bo === 2 ? 'double' : 'triple'} covalent bond: ${bo} shared pair${bo > 1 ? 's' : ''} of electrons`, { s: 13, c: '#ffe9a8' }) + TX(cx, cy + 106, 'Non-polar (ΔEN = 0): the electrons are shared equally.', { s: 12.5, c: '#cfd8ff', w: 600 }); }
    const [F0, n0, F1, n1] = info.first; const central = n0 === 1 ? F0 : n1 === 1 ? F1 : null, terminal = central === F0 ? F1 : F0, nt = central === F0 ? n1 : n0;
    if (central && nt <= 4) { const ord = nt === 1 ? cov(terminal.z) : (central === F0 ? cov(F1.z) : cov(F0.z)); const order = Math.min(cov(terminal.z), cov(central.z)) === cov(terminal.z) ? cov(terminal.z) : 1; for (let i = 0; i < nt; i++) { const a = (nt === 1 ? 0 : nt === 2 ? (i ? Math.PI : 0) : (i / nt) * 2 * Math.PI - Math.PI / 2 + (nt === 3 ? 0 : Math.PI / 4)); const x = cx + 105 * Math.cos(a), y = cy - 40 + 105 * Math.sin(a); for (let k = 0; k < order; k++) { const off = (k - (order - 1) / 2) * 7, nx = -Math.sin(a) * off, ny = Math.cos(a) * off; s += L(cx + 34 * Math.cos(a) + nx, cy - 40 + 34 * Math.sin(a) + ny, x - 28 * Math.cos(a) + nx, y - 28 * Math.sin(a) + ny, '#ffd23f', 3.5); } s += atom(x, y, terminal.sym, '#8ad7ff', 26); } s += atom(cx, cy - 40, central.sym, '#ffb86b', 34); s += TX(cx, cy + 108, f, { s: 28 }) + TX(cx, cy + 132, `${order === 1 ? 'single' : order === 2 ? 'double' : 'triple'} bond${nt > 1 ? 's' : ''}: ${central.sym} makes ${cov(central.z)} bond${cov(central.z) > 1 ? 's' : ''} in total`, { s: 12.5, c: '#ffe9a8' }); }
    else s += atom(cx - 60, cy - 40, info.A.sym, '#ffb86b', 36) + atom(cx + 60, cy - 40, info.B.sym, '#8ad7ff', 36) + TX(cx, cy + 40, f, { s: 28 }) + TX(cx, cy + 68, 'A larger molecule: shown by its formula only', { s: 12.5, c: '#cfd8ff', w: 600 });
    if (info.polar) { const hi = info.A.en > info.B.en ? info.A : info.B, lo = hi === info.A ? info.B : info.A; s += TX(cx, 440, `Polar covalent: ${hi.sym} (EN ${hi.en}) pulls electrons harder than ${lo.sym} (EN ${lo.en}) → δ⁻ on ${hi.sym}, δ⁺ on ${lo.sym}`, { s: 12, c: '#ffc2d9', w: 600 }); } else s += TX(cx, 440, 'Almost non-polar: electronegativities are close (ΔEN < 0.4)', { s: 12, c: '#cfd8ff', w: 600 });
    return s;
  }
  RL.register({
    id: 'bond', lab: 'chem', topic: 'Chemical Bonding', title: 'Chemical Bonding: Ionic, Covalent & Metallic', icon: '🔗', level: 'Intermediate', model: 'simplified',
    assumptions: 'A simple rules-based model for elements 1–20: metal + non-metal → ionic (charges from the group number); non-metal + non-metal → covalent (number of bonds = 8 − group, or the group number for H/B/C); two metals → metallic. Real bonding is a continuum — the electronegativity difference is shown so you can see that. Be, B, Al and Si compounds often have covalent character; exceptions such as hypervalent compounds (SF₆, PCl₅) are not modelled.',
    objective: 'Choose any two elements and see what kind of bond they form, the resulting formula, and why.',
    theory: '<p><b>Ionic bonding</b>: a metal atom transfers electrons to a non-metal, forming oppositely charged ions held by electrostatic attraction. The formula balances the charges. <b>Covalent bonding</b>: non-metal atoms share pairs of electrons; the number of bonds an atom forms is the number of electrons it needs to complete its outer shell. <b>Metallic bonding</b>: positive metal ions in a sea of delocalised electrons.</p><p>The <b>electronegativity difference (ΔEN)</b> shows how unequal the sharing is: &lt; 0.4 almost non-polar, 0.4–1.7 polar covalent, &gt; 1.7 mostly ionic.</p>',
    formulas: ['ΔEN = |EN₁ − EN₂|', 'ionic charge: metals +group number, non-metals −(8 − group)', 'covalent bonds = 8 − group (or group for H, B, C)'], fixedView: true, animated: true, params: [],
    types: { bel: { name: it => E(it.p.Z).name, icon: '🔬', w: 200, h: 56, fixed: true, defaults: { Z: 11 }, props: [{ k: 'Z', label: 'Element', type: 'select', options: SELECT_EL, val: 11 }], onProp(it) { it.p.Z = +it.p.Z; }, info: 'Choose the element in the panel on the right.', draw: (it, W) => { const i = bEls(W).indexOf(it), e = E(it.p.Z), v = shells(it.p.Z).slice(-1)[0]; return `<rect x="-100" y="-28" width="200" height="56" rx="12" fill="rgba(20,30,80,.88)" stroke="${i ? '#4cc9f0' : '#ffd23f'}" stroke-width="2.5"/>` + TX(-62, 8, e.sym, { s: 26, c: i ? '#7dd3fc' : '#ffd23f' }) + TX(14, -4, e.name, { s: 12.5 }) + TX(14, 14, `Z=${it.p.Z} · outer e⁻: ${v} · EN ${e.en == null ? '–' : e.en}`, { s: 9.5, c: '#9fb4ff', w: 600 }); } } },
    catalog: [{ type: 'bel', name: 'Element', icon: '🔬', desc: 'Add up to two elements to bond', tags: 'atom choose' }],
    init(W) { W.add('bel', 120, 110, { Z: 11 }); W.add('bel', 120, 190, { Z: 17 }); },
    onAdd(W, it) { it.p.Z = +it.p.Z; const n = bEls(W).length - 1; if (n >= 2) { W.remove(it.id); return; } it.x = 120; it.y = 110 + n * 80; },
    sim() { },
    bg: bondScene,
    messages(W) { const e = bEls(W); if (e.length < 2) return [{ t: 'info', m: 'Add two elements to see how they bond.' }]; const i = bondInfo(+e[0].p.Z, +e[1].p.Z), r = []; if (i.type === 'noble') r.push({ t: 'warn', m: `${i.who.name} is a noble gas with a full outer shell: it does not normally form bonds.` }); if (i.type === 'ionic' && i.covChar) r.push({ t: 'info', m: `ΔEN = ${fmt(i.den, 2)} is below 1.7: ${i.formula} is predicted ionic by the group rules but really has <b>significant covalent character</b>.` }); if (i.type === 'cov' && !i.same && [15, 16, 17].some(z => z === i.A.z || z === i.B.z) && (i.A.z === 8 || i.B.z === 8 || i.A.z === 9 || i.B.z === 9)) r.push({ t: 'info', m: 'Third-period non-metals (P, S, Cl) can form more bonds than the octet rule suggests (SO₂, SO₃, PCl₅…). The model shows the simplest octet-rule compound only.' }); if (i.type === 'ionic' && (i.M.sym === 'Be')) r.push({ t: 'info', m: 'Beryllium compounds are mostly covalent in reality (simplified here).' }); return r; },
    readouts(W) { const e = bEls(W); if (e.length < 2) return []; const i = bondInfo(+e[0].p.Z, +e[1].p.Z), o = []; if (i.type === 'noble') return [{ l: 'Result', v: 'no bond (noble gas)' }]; o.push({ l: 'Elements', v: `${i.A.sym} (EN ${i.A.en}) + ${i.B.sym} (EN ${i.B.en})` }, { l: 'ΔEN', v: i.den == null ? '–' : i.den, d: 2 }); o.push({ l: 'Bond type', v: { ionic: 'ionic', cov: i.polar ? 'polar covalent' : 'covalent (non-polar)', metallic: 'metallic' }[i.type] }); if (i.formula) o.push({ l: 'Formula (simplest ratio)', v: i.formula }); if (i.type === 'ionic') o.push({ l: 'Ions', v: `${ion(i.M.sym, i.qc)} and ${ion(i.N.sym, -i.qa)}` }, { l: 'Typical properties', v: 'high melting point, brittle, conducts when molten/dissolved' }); if (i.type === 'cov') o.push({ l: 'Bonds per atom', v: i.same ? i.order : `${i.A.sym}: ${cov(i.A.z)}, ${i.B.sym}: ${cov(i.B.z)}` }, { l: 'Typical properties', v: 'low melting point (simple molecules), does not conduct' }); if (i.type === 'metallic') o.push({ l: 'Typical properties', v: 'conducts when solid, malleable, shiny' }); return o; },
    live(W) { const e = bEls(W); if (e.length < 2) return []; const i = bondInfo(+e[0].p.Z, +e[1].p.Z); if (i.type === 'ionic') return [`${i.M.sym}: group ${POS(i.M.z).g} → ${ion(i.M.sym, i.qc)} · ${i.N.sym}: group ${POS(i.N.z).g} → ${ion(i.N.sym, -i.qa)}`, `criss-cross: ${i.M.sym}${i.nc > 1 ? i.nc : ''}${i.N.sym}${i.na > 1 ? i.na : ''} = <b>${i.formula}</b>`]; if (i.type === 'cov' && !i.same) return [`${i.A.sym} forms ${cov(i.A.z)} bond(s), ${i.B.sym} forms ${cov(i.B.z)} → ratio ${i.nA}:${i.nB} → <b>${i.formula}</b>`]; return []; },
    graphs: [],
    guided: {
      objective: 'Compare sodium chloride (ionic), water (covalent) and a metal pair.', setup: W => { W.add('bel', 120, 110, { Z: 11 }); W.add('bel', 120, 190, { Z: 17 }); },
      steps: [{ t: 'Sodium + chlorine are on the bench. Predict the type of bond and the formula.', predict: { q: 'Sodium (metal) and chlorine (non-metal) form…', opts: ['an ionic compound NaCl', 'a covalent molecule NaCl₂', 'a metallic alloy'], a: 0, why: 'A metal and a non-metal: electron transfer gives Na⁺ and Cl⁻.' }, ok: W => bEls(W).length >= 2 },
        { t: 'Read ΔEN and the ions in Results. ΔEN = 2.23 is above 1.7, so the bond is ionic.', ok: W => bEls(W).length >= 2 },
        { t: 'Change the elements to magnesium and chlorine. How does the formula change, and why?', ok: W => { const e = bEls(W).map(x => +x.p.Z).sort((a, b) => a - b); return e.length === 2 && e[0] === 12 && e[1] === 17; } },
        { t: 'Now try hydrogen and oxygen: they share electrons, forming H₂O.', ok: W => { const e = bEls(W).map(x => +x.p.Z).sort((a, b) => a - b); return e.length === 2 && e[0] === 1 && e[1] === 8; } },
        { t: 'Try two metals (e.g. sodium and magnesium) and note that no compound forms: it is metallic bonding.', ok: W => { const e = bEls(W); return e.length === 2 && e.every(x => KIND(+x.p.Z) === 'metal'); } }],
      done: () => 'Metal + non-metal → ionic; non-metal + non-metal → covalent; metal + metal → metallic. ΔEN tells how polar the bond is.'
    },
    quiz: [{ q: 'Calcium (group 2) and oxygen (group 16) form…', opts: ['CaO', 'CaO₂', 'Ca₂O'], a: 0, why: 'Ca²⁺ and O²⁻: charges cancel in a 1:1 ratio.' }, { q: 'A bond between two non-metals with ΔEN = 0.9 is…', opts: ['polar covalent', 'ionic', 'metallic'], a: 0, why: '0.4–1.7 → polar covalent.' }, { q: 'Carbon forms four bonds. The simplest compound with hydrogen is…', opts: ['CH₄', 'CH₂', 'C₂H'], a: 0, why: 'C needs 4 bonds, each H gives 1: CH₄.' }]
  });

  /* ============================ BALANCING EQUATIONS ============================ */
  const RX = {
    h2o: ['H2 + O2 -> H2O', 'Formation of water'], nh3: ['N2 + H2 -> NH3', 'Haber process'], fe: ['Fe + O2 -> Fe2O3', 'Rusting of iron'], ch4: ['CH4 + O2 -> CO2 + H2O', 'Burning methane'], c3h8: ['C3H8 + O2 -> CO2 + H2O', 'Burning propane'], al: ['Al + O2 -> Al2O3', 'Aluminium burns'], kclo3: ['KClO3 -> KCl + O2', 'Heating potassium chlorate'], mg: ['Mg + HCl -> MgCl2 + H2', 'Magnesium + acid'], na: ['Na + H2O -> NaOH + H2', 'Sodium in water'], fe2o3: ['Fe2O3 + CO -> Fe + CO2', 'Blast furnace'], al2so4: ['Al + H2SO4 -> Al2(SO4)3 + H2', 'Aluminium + sulfuric acid'], caoh: ['Ca(OH)2 + HCl -> CaCl2 + H2O', 'Neutralisation'], glu: ['C6H12O6 + O2 -> CO2 + H2O', 'Respiration'], zns: ['ZnS + O2 -> ZnO + SO2', 'Roasting zinc blende'], nh3o: ['NH3 + O2 -> NO + H2O', 'Ostwald process'], mgn: ['Mg + N2 -> Mg3N2', 'Magnesium nitride'], caco3: ['CaCO3 + HCl -> CaCl2 + H2O + CO2', 'Marble + acid'], custom: ['', 'Type your own']
  };
  function splitEq(t) { const m = String(t).split(/->|→|=>|=/); if (m.length !== 2) return null; const sp = s => s.split('+').map(x => x.trim().replace(/^\d+\s*/, '')).filter(Boolean); return [sp(m[0]), sp(m[1])]; }
  const rxOf = it => it ? (it.p.pre === 'custom' ? it.p.eq : RX[it.p.pre][0]) : '';
  function rxData(it) {
    const sp = splitEq(rxOf(it)); if (!sp) return { err: 'Write the equation as  reactants -> products,  with + between species.' }; if (!sp[0].length || !sp[1].length) return { err: 'Both sides need at least one species.' }; if (sp[0].length + sp[1].length > 6) return { err: 'At most 6 species are supported.' };
    const all = sp[0].concat(sp[1]); let comp; try { comp = all.map(parseFormula); } catch (e) { return { err: e.message }; }
    const co = all.map((_, j) => +it.p['c' + j] || 1); const els = [...new Set(comp.flatMap(c => Object.keys(c)))]; const rows = els.map(e => ({ e, l: sp[0].reduce((s, f, j) => s + co[j] * (comp[j][e] || 0), 0), r: sp[1].reduce((s, f, j) => s + co[sp[0].length + j] * (comp[sp[0].length + j][e] || 0), 0) }));
    return { sp, all, co, rows, ok: rows.every(r => r.l === r.r), solve: balance(sp[0], sp[1]), nl: sp[0].length };
  }
  const bxs = W => W.find('rx')[0];
  function eqText(d, withCo) { const t = (list, off) => list.map((f, j) => (withCo && d.co[off + j] > 1 ? d.co[off + j] : '') + sub(f)).join(' + '); return t(d.sp[0], 0) + ' → ' + t(d.sp[1], d.nl); }
  RL.register({
    id: 'balance', lab: 'chem', topic: 'Chemical Equations', title: 'Balancing Chemical Equations', icon: '⚖️', level: 'Beginner', model: 'full',
    assumptions: 'Real calculation: your coefficients are checked by counting every atom on each side (formulas are parsed, including brackets and hydrates such as CuSO4.5H2O). The “auto-balance” answer is found by exact rational linear algebra, not a lookup table. Only atoms are balanced — charges/ionic equations are not handled. A reaction that is not chemically real can still be balanced by atoms alone.',
    objective: 'Balance an equation by choosing coefficients until the number of atoms of each element is equal on both sides.',
    theory: '<p>Atoms are never created or destroyed in a chemical reaction (<b>law of conservation of mass</b>), so each element must appear the same number of times on both sides. We balance by changing the <b>coefficients</b> (the big numbers in front of formulas), <i>never</i> the subscripts inside a formula. A coefficient multiplies every atom in the formula: 2 Ca(OH)₂ means 2 Ca, 4 O and 4 H.</p><p>Tip: balance elements that appear in only one compound on each side first, and leave O or H until last.</p>',
    formulas: ['atoms of X on left = atoms of X on right', 'coefficient × subscript = number of atoms', 'simplest whole-number ratio'], fixedView: true, animated: false,
    params: [],
    types: {
      rx: { name: it => RX[it.p.pre][1], icon: '⚖️', w: 330, h: 70, fixed: true, defaults: { pre: 'h2o', eq: 'Na + Cl2 -> NaCl', c0: 1, c1: 1, c2: 1, c3: 1, c4: 1, c5: 1, fill: false },
        props: [{ k: 'pre', label: 'Reaction', type: 'select', options: Object.keys(RX).map(k => [k, RX[k][1] + (RX[k][0] ? ' — ' + sub(RX[k][0]).replace('->', '→') : '')]), val: 'h2o' }, { k: 'eq', label: 'Your own equation (choose “Type your own”)', type: 'text', val: 'Na + Cl2 -> NaCl' }, ...[0, 1, 2, 3, 4, 5].map(j => ({ k: 'c' + j, label: 'Coefficient of species ' + (j + 1), min: 1, max: 12, step: 1, val: 1 })), { k: 'fill', label: 'Auto-balance for me (press)', type: 'toggle' }],
        info: 'Species are numbered left to right (1 is the first reactant). Use the sliders to set coefficients; unused sliders are ignored.',
        onProp(it, k) { if (k === 'pre' || k === 'eq') for (let j = 0; j < 6; j++) it.p['c' + j] = 1; if (k === 'fill') { it.p.fill = false; const d = rxData(it); if (d.solve && d.solve.co) d.solve.co.forEach((v, j) => it.p['c' + j] = Math.min(12, v)); } },
        draw: it => { const d = rxData(it); return `<rect x="-165" y="-35" width="330" height="70" rx="12" fill="rgba(20,30,80,.88)" stroke="${d.err ? '#ff5d6c' : d.ok ? '#4ade80' : '#ffd23f'}" stroke-width="3"/>` + (d.err ? TX(0, 5, 'check the equation', { s: 13, c: '#ff9aa6' }) : TX(0, -4, eqText(d, true), { s: Math.min(17, 330 / (eqText(d, true).length * .58)) }) + TX(0, 20, d.ok ? '✔ balanced' : 'not balanced yet', { s: 11.5, c: d.ok ? '#86efac' : '#ffe9a8' })); }, place: () => [200, 80] }
    },
    catalog: [{ type: 'rx', name: 'Chemical equation', icon: '⚖️', desc: '15 ready reactions, or type your own', max: 1, tags: 'balance coefficient reaction atoms' }],
    init(W) { W.add('rx', 200, 80, { pre: 'h2o' }); },
    onAdd(W, it) { it.x = 200; it.y = 80; },
    sim() { },
    bg(W) {
      const it = bxs(W); if (!it) return ''; const d = rxData(it); let s = ''; if (d.err) return TX(640, 200, d.err, { s: 15, c: '#ff9aa6' });
      const x0 = 380, y0 = 60, rowH = 74, bar = 22; s += `<rect x="${x0 - 20}" y="${y0 - 10}" width="620" height="${d.rows.length * rowH + 66}" rx="14" fill="rgba(10,18,60,.5)" stroke="rgba(160,180,255,.3)"/>` + TX(x0 + 120, y0 + 14, 'LEFT side atoms', { s: 12.5, c: '#7dd3fc' }) + TX(x0 + 480, y0 + 14, 'RIGHT side atoms', { s: 12.5, c: '#ffd23f' });
      d.rows.forEach((r, i) => { const y = y0 + 44 + i * rowH, ok = r.l === r.r; s += TX(x0 - 2, y + 28, r.e, { s: 20, c: '#fff' }); const dots = (n, x, c) => { let o = ''; for (let k = 0; k < Math.min(n, 36); k++) o += CIR(x + (k % 12) * bar * .9, y + 8 + Math.floor(k / 12) * bar * .9, 8, c, '#fff', 1.2); if (n > 36) o += TX(x + 12 * bar * .9 + 6, y + 30, '+' + (n - 36), { s: 11, a: 'start' }); return o; }; s += dots(r.l, x0 + 30, '#4cc9f0') + dots(r.r, x0 + 350, '#ffd23f') + TX(x0 + 305, y + 22, ok ? '=' : r.l > r.r ? '>' : '<', { s: 26, c: ok ? '#4ade80' : '#ff5d6c' }) + TX(x0 + 30, y + 62, r.l + ' atom' + (r.l === 1 ? '' : 's'), { s: 11, c: '#9fb4ff', a: 'start', w: 600 }) + TX(x0 + 350, y + 62, r.r + ' atom' + (r.r === 1 ? '' : 's'), { s: 11, c: '#9fb4ff', a: 'start', w: 600 }) + TX(x0 + 580, y + 24, ok ? '✔' : '✘', { s: 24, c: ok ? '#4ade80' : '#ff5d6c' }); });
      return s;
    },
    messages(W) { const it = bxs(W); if (!it) return [{ t: 'info', m: 'Add an equation to balance.' }]; const d = rxData(it), r = []; if (d.err) return [{ t: 'warn', m: d.err }]; if (d.ok) { const g = d.co.slice(0, d.all.length).reduce((a, b) => gcd(a, b), 0); r.push(g > 1 ? { t: 'warn', m: `Balanced, but every coefficient divides by ${g}: write it in the <b>simplest</b> whole-number ratio.` } : { t: 'info', m: '✔ Balanced in the simplest ratio.' }); } else { const bad = d.rows.filter(x => x.l !== x.r); r.push({ t: 'warn', m: 'Not balanced: ' + bad.map(b => `${b.e} (${b.l} ≠ ${b.r})`).join(', ') + '.' }); } if (d.solve.none) r.push({ t: 'warn', m: 'No whole-number coefficients can balance these formulas — check the formulas (a formula cannot be changed to balance).' }); if (d.solve.multi) r.push({ t: 'info', m: 'These species can be balanced in more than one independent way (the equation is really a combination of reactions).' }); return r.slice(0, 3); },
    readouts(W) { const it = bxs(W); if (!it) return []; const d = rxData(it); if (d.err) return [{ l: 'Problem', v: d.err }]; const o = [{ l: 'Equation', v: eqText(d, true) }, { l: 'Balanced?', v: d.ok ? 'yes ✔' : 'no' }]; d.rows.forEach(r => o.push({ l: `${r.e} atoms (left | right)`, v: `${r.l} | ${r.r}` })); if (d.solve.co) o.push({ l: 'Smallest whole-number solution', v: eqText({ ...d, co: d.solve.co }, true) }); return o; },
    live(W) { const it = bxs(W); if (!it) return []; const d = rxData(it); if (d.err) return []; return d.rows.map(r => `${r.e}: ${d.sp[0].map((f, j) => d.co[j] + '×' + (parseFormula(f)[r.e] || 0)).join(' + ')} = <b>${r.l}</b> | ${d.sp[1].map((f, j) => d.co[d.nl + j] + '×' + (parseFormula(f)[r.e] || 0)).join(' + ')} = <b>${r.r}</b>`); },
    graphs: [],
    guided: {
      objective: 'Balance the formation of water, 2H₂ + O₂ → 2H₂O, and then try harder ones.', setup: W => { W.add('rx', 200, 80, { pre: 'h2o' }); },
      steps: [{ t: 'The unbalanced equation H₂ + O₂ → H₂O is on the bench. Check the atom table: which element is unbalanced?', predict: { q: 'H₂ + O₂ → H₂O: oxygen is unbalanced (2 on the left, 1 on the right). What first?', opts: ['Put 2 in front of H₂O', 'Change H₂O to H₂O₂', 'Put 2 in front of O₂'], a: 0, why: 'Never change subscripts. 2H₂O gives 2 oxygen atoms, then hydrogen needs 2H₂.' }, ok: W => !!bxs(W) },
        { t: 'Set the coefficient of species 3 (H₂O) to 2, then species 1 (H₂) to 2.', ok: W => { const d = rxData(bxs(W)); return d.ok; } },
        { t: 'Change to “Burning methane” (CH₄ + O₂ → CO₂ + H₂O) and balance it. Balance C, then H, then O last.', ok: W => bxs(W) && bxs(W).p.pre === 'ch4' && rxData(bxs(W)).ok },
        { t: 'Try “Aluminium + sulfuric acid” — then press “Auto-balance for me” to check your answer.', ok: W => bxs(W) && bxs(W).p.pre === 'al2so4' },
        { t: 'Choose “Type your own” and enter  Fe + Cl2 -> FeCl3  and balance it.', ok: W => bxs(W) && bxs(W).p.pre === 'custom' && rxData(bxs(W)).ok }],
      done: () => 'A balanced equation obeys conservation of mass: same atoms in, same atoms out. Only coefficients change, never subscripts.'
    },
    quiz: [{ q: 'The balanced form of N₂ + H₂ → NH₃ is…', opts: ['N₂ + 3H₂ → 2NH₃', 'N₂ + H₂ → 2NH₃', '2N₂ + 3H₂ → 2NH₃'], a: 0, why: '2 N and 6 H on each side.' }, { q: 'In 3Ca(OH)₂ the number of oxygen atoms is…', opts: ['6', '3', '2'], a: 0, why: '3 × 2 O = 6.' }, { q: 'Which may you change to balance an equation?', opts: ['coefficients', 'subscripts', 'the elements'], a: 0, why: 'Changing a subscript changes the substance.' }]
  });
})();
