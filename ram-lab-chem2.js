/* RAM LAB — Chemistry Lab, part 2 (load after ram-lab-chem.js):
   acids, bases & pH (with titration) · chemical reactions (reagents, solubility rules, reactivity series) · solutions & concentration.
   Every pH is computed by solving the exact charge-balance equation for the solution; every reaction product is chosen by explicit chemical rules
   (solubility rules, reactivity series, acid–carbonate rules) and its equation is balanced by the exact balancer in ram-lab-chem.js. */
(function () {
  'use strict';
  const RL = window.RamLab; if (!RL || !RL.chem) return;
  const { clamp, fmt } = RL.util, C = RL.chem, { sub, ion, balance, parseFormula, molarMass, L, TX, CIR } = C;

  /* ============================ ACIDS, BASES & pH ============================ */
  const KW = 1e-14;
  const SUB = {
    water: { name: 'Pure water', kind: 'neutral', f: 'H₂O', neg: () => 0, pos: () => 0 },
    hcl: { name: 'Hydrochloric acid', kind: 'strong acid', f: 'HCl', neg: c => c, pos: () => 0 },
    hno3: { name: 'Nitric acid', kind: 'strong acid', f: 'HNO₃', neg: c => c, pos: () => 0 },
    h2so4: { name: 'Sulfuric acid', kind: 'strong acid', f: 'H₂SO₄', neg: c => 2 * c, pos: () => 0, note: 'second dissociation treated as complete (simplified)' },
    ch3cooh: { name: 'Ethanoic (acetic) acid', kind: 'weak acid', f: 'CH₃COOH', Ka: 1.8e-5, weakAcid: c => c },
    naoh: { name: 'Sodium hydroxide', kind: 'strong base', f: 'NaOH', pos: c => c, neg: () => 0 },
    koh: { name: 'Potassium hydroxide', kind: 'strong base', f: 'KOH', pos: c => c, neg: () => 0 },
    caoh2: { name: 'Calcium hydroxide', kind: 'strong base', f: 'Ca(OH)₂', pos: c => 2 * c, neg: () => 0, note: 'treated as fully dissolved (really only slightly soluble)' },
    nh3: { name: 'Ammonia solution', kind: 'weak base', f: 'NH₃', Kb: 1.8e-5, weakBase: c => c },
    nacl: { name: 'Sodium chloride solution', kind: 'neutral salt', f: 'NaCl', pos: c => c, neg: c => c },
    nh4cl: { name: 'Ammonium chloride solution', kind: 'acidic salt', f: 'NH₄Cl', neg: c => c, cationAcid: c => c, Ka: 5.6e-10 },
    ch3coona: { name: 'Sodium ethanoate solution', kind: 'basic salt', f: 'CH₃COONa', pos: c => c, weakAcid: c => c, Ka: 1.8e-5 }
  };
  const SUB_OPTS = Object.keys(SUB).map(k => [k, SUB[k].name + ' (' + SUB[k].f + ')']);
  // charge balance residual, positive when too much positive charge → pH should be higher (h smaller)
  function resid(s, c, h) { const oh = KW / h; let pos = h + (s.pos ? s.pos(c) : 0), neg = oh + (s.neg ? s.neg(c) : 0); if (s.weakAcid) neg += s.weakAcid(c) * s.Ka / (s.Ka + h); if (s.weakBase) pos += s.weakBase(c) * s.Kb / (s.Kb + oh); if (s.cationAcid) pos += s.cationAcid(c) * h / (h + s.Ka); return pos - neg; }
  function solvepH(resf) { let lo = -2, hi = 16; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (resf(Math.pow(10, -m)) > 0) lo = m; else hi = m; } return (lo + hi) / 2; }   // residual decreases with pH? see below
  const pHof = (s, c) => { // bisection: as h↓ (pH↑) resid goes from positive(h large) to negative
    let lo = -2, hi = 16; for (let i = 0; i < 90; i++) { const m = (lo + hi) / 2; if (resid(s, c, Math.pow(10, -m)) > 0) lo = m; else hi = m; } return (lo + hi) / 2;
  };
  const STOPS = {
    uni: [[0, [214, 40, 40]], [2, [230, 70, 40]], [3.5, [244, 130, 40]], [5, [247, 205, 55]], [6.4, [170, 210, 70]], [7, [70, 180, 90]], [8, [60, 170, 150]], [9.5, [60, 120, 200]], [11, [90, 80, 190]], [14, [120, 50, 160]]],
    litmus: [[0, [220, 50, 60]], [4.5, [220, 50, 60]], [6.5, [150, 80, 170]], [8.3, [70, 80, 210]], [14, [70, 80, 210]]],
    phph: [[0, [235, 245, 250]], [8.2, [235, 245, 250]], [9.1, [245, 170, 210]], [10, [225, 40, 150]], [14, [225, 40, 150]]],
    mo: [[0, [225, 50, 40]], [3.1, [225, 50, 40]], [3.75, [245, 130, 40]], [4.4, [250, 205, 60]], [14, [250, 205, 60]]],
    btb: [[0, [245, 215, 50]], [6, [245, 215, 50]], [6.8, [100, 190, 110]], [7.6, [50, 110, 210]], [14, [50, 110, 210]]]
  };
  const IND = { none: ['No indicator', null, null], uni: ['Universal indicator', 'uni', [0, 14]], litmus: ['Litmus', 'litmus', [4.5, 8.3]], phph: ['Phenolphthalein', 'phph', [8.2, 10]], mo: ['Methyl orange', 'mo', [3.1, 4.4]], btb: ['Bromothymol blue', 'btb', [6.0, 7.6]] };
  const COLNAME = { uni: p => p < 3 ? 'red' : p < 5 ? 'orange' : p < 6.5 ? 'yellow' : p < 7.5 ? 'green' : p < 10 ? 'blue' : 'purple', litmus: p => p < 5 ? 'red' : p < 8 ? 'purple' : 'blue', phph: p => p < 8.2 ? 'colourless' : p < 9.5 ? 'pale pink' : 'pink', mo: p => p < 3.1 ? 'red' : p < 4.4 ? 'orange' : 'yellow', btb: p => p < 6 ? 'yellow' : p < 7.6 ? 'green' : 'blue' };
  function indCol(kind, pH) { if (!IND[kind] || !IND[kind][1]) return null; const st = STOPS[IND[kind][1]]; for (let i = 1; i < st.length; i++) if (pH <= st[i][0]) { const [a, ca] = st[i - 1], [b, cb] = st[i], t = (pH - a) / (b - a || 1); return `rgb(${ca.map((v, k) => Math.round(v + (cb[k] - v) * t)).join(',')})`; } return `rgb(${st[st.length - 1][1].join(',')})`; }
  const beakers = W => W.items.filter(i => i.type === 'beaker'), titr = W => W.find('titr')[0], indItem = W => W.find('indi')[0];
  const conc = it => Math.pow(10, it.p.logc);
  const bPH = it => it.p.sub === 'water' ? 7 : pHof(SUB[it.p.sub], conc(it));
  const bSel = W => (W.sel && W.sel.kind === 'item' && beakers(W).find(i => i.id === W.sel.id)) || beakers(W)[0];
  const phTxt = p => fmt(p, 2);
  const activeInd = W => { const i = indItem(W); return i ? i.p.kind : 'none'; };
  function beakerDraw(it, W) {
    const pH = bPH(it), ik = activeInd(W), col = indCol(ik, pH) || 'rgba(160,210,255,.35)';
    return `<path d="M-52 -80V80Q-52 92 -40 92H40Q52 92 52 80V-80" fill="rgba(255,255,255,.06)" stroke="#cfe3ff" stroke-width="3" stroke-linejoin="round"/><path d="M-50 -20V80Q-50 90 -40 90H40Q50 90 50 80V-20Z" fill="${col}" opacity=".92"/>` + TX(0, -92, SUB[it.p.sub].f + ' ' + fmt(conc(it), conc(it) < .01 ? 4 : 3) + ' M', { s: 12.5, c: '#ffe9a8' }) + `<rect x="-34" y="20" width="68" height="26" rx="8" fill="rgba(10,18,60,.82)" stroke="#9fb4ff" stroke-width="1.5"/>` + TX(0, 38, 'pH ' + phTxt(pH), { s: 14 }) + TX(0, 112, SUB[it.p.sub].kind, { s: 11, c: '#9fb4ff', w: 600 });
  }
  const VMAX = 60;
  function titrPH(it, Vb) {
    const p = it.p, weak = p.acid === 'ch3cooh', Va = p.Va, Ca = p.Ca, Cb = p.Cb, tot = Va + Vb, Ct = Ca * Va / tot, Nb = Cb * Vb / tot;
    const s = weak ? { weakAcid: c => Ct, Ka: 1.8e-5, pos: () => Nb } : { neg: () => Ct, pos: () => Nb };
    return pHof(s, 1);
  }
  const Veq = it => it.p.Ca * it.p.Va / it.p.Cb;
  function titrDraw(it, W) {
    const Vb = it.p.Vb, pH = titrPH(it, Vb), ik = it.p.ind, col = indCol(ik, pH) || 'rgba(160,210,255,.35)', fr = 1 - Vb / VMAX;
    let s = `<rect x="-9" y="-150" width="18" height="190" rx="4" fill="rgba(255,255,255,.08)" stroke="#cfe3ff" stroke-width="2.5"/><rect x="-7" y="${-148 + 186 * (1 - fr)}" width="14" height="${186 * fr}" fill="rgba(120,180,255,.7)"/><path d="M-14 40h28l-6 14h-16z" fill="#cfe3ff"/><rect x="-18" y="26" width="36" height="6" rx="3" fill="#ffd23f"/>`;
    for (let k = 0; k <= 6; k++) s += L(9, -148 + k * 31, k % 2 ? 14 : 18, -148 + k * 31, '#cfe3ff', 1.5);
    if (Vb > 0 && Vb < VMAX) s += CIR(0, 62 + ((W.t * 40) % 20), 2.2, '#9ecbff');
    s += `<path d="M-40 150L-18 100V82H18V100L40 150Q42 160 32 160H-32Q-42 160 -40 150Z" fill="rgba(255,255,255,.06)" stroke="#cfe3ff" stroke-width="3"/><path d="M-36 144L-24 114H24L36 144Q38 156 30 156H-30Q-38 156 -36 144Z" fill="${col}" opacity=".93"/>`;
    return s + TX(0, -166, 'NaOH ' + fmt(it.p.Cb, 2) + ' M', { s: 11.5, c: '#ffe9a8' }) + TX(0, 182, `${fmt(Vb, 1)} mL added · pH ${phTxt(pH)}`, { s: 12.5, c: '#fff' }) + TX(0, 198, `${fmt(it.p.Va, 0)} mL ${fmt(it.p.Ca, 2)} M ${SUB[it.p.acid].f}`, { s: 11, c: '#9fb4ff', w: 600 });
  }
  function phBg(W) {
    let s = ''; const x0 = 90, x1 = 910, y = 28; for (let i = 0; i < 82; i++) { const p = i / 82 * 14; s += `<rect x="${x0 + (x1 - x0) * i / 82}" y="${y}" width="${(x1 - x0) / 82 + 1}" height="14" fill="${indCol('uni', p)}"/>`; } for (let p = 0; p <= 14; p += 1) s += TX(x0 + (x1 - x0) * p / 14, y + 30, p, { s: 10, c: '#cfd8ff', w: 600 }); s += TX(x0 - 10, y + 12, 'pH', { s: 11, c: '#ffe9a8', a: 'end' }) + TX(x0 + 30, y - 6, 'acidic', { s: 10, c: '#ff9a9a', a: 'start' }) + TX((x0 + x1) / 2, y - 6, 'neutral', { s: 10, c: '#86efac' }) + TX(x1 - 20, y - 6, 'alkaline', { s: 10, c: '#a7b6ff', a: 'end' });
    beakers(W).forEach((b, i) => { const p = clamp(bPH(b), 0, 14), x = x0 + (x1 - x0) * p / 14; s += `<polygon points="${x},${y + 14} ${x - 6},${y + 24} ${x + 6},${y + 24}" fill="${['#fff', '#ffd23f', '#ff6b9d', '#4ade80'][i % 4]}"/>`; });
    const t = titr(W); if (t) {
      const X0 = 560, Y0 = 440, Wd = 380, Ht = 330, X = v => X0 + v / VMAX * Wd, Y = p => Y0 - p / 14 * Ht; s += `<rect x="${X0 - 40}" y="${Y0 - Ht - 20}" width="${Wd + 70}" height="${Ht + 64}" rx="12" fill="rgba(10,18,60,.55)" stroke="rgba(160,180,255,.3)"/>` + L(X0, Y0, X0 + Wd, Y0, '#e8eeff', 2) + L(X0, Y0, X0, Y0 - Ht, '#e8eeff', 2);
      [0, 7, 14].forEach(p => { s += TX(X0 - 8, Y(p) + 4, p, { s: 10.5, c: '#9fb4ff', a: 'end', w: 600 }) + L(X0, Y(p), X0 + Wd, Y(p), 'rgba(160,180,255,.15)', 1); }); [0, 10, 20, 30, 40, 50, 60].forEach(v => s += TX(X(v), Y0 + 15, v, { s: 10.5, c: '#9fb4ff', w: 600 }));
      s += TX(X0 + Wd / 2, Y0 + 34, 'Volume of NaOH added (mL)', { s: 11, c: '#9fb4ff', w: 600 }) + TX(X0 - 30, Y0 - Ht - 4, 'pH', { s: 11, c: '#ffe9a8' });
      const ir = IND[t.p.ind][2]; if (ir && t.p.ind !== 'uni') s += `<rect x="${X0}" y="${Y(ir[1])}" width="${Wd}" height="${Y(ir[0]) - Y(ir[1])}" fill="${indCol(t.p.ind, (ir[0] + ir[1]) / 2)}" opacity=".22"/>` + TX(X0 + Wd - 4, Y(ir[1]) + 12, IND[t.p.ind][0] + ' range', { s: 10, c: '#ffe9a8', a: 'end' });
      let d = ''; for (let v = 0; v <= VMAX; v += 0.5) d += (v ? 'L' : 'M') + X(v).toFixed(1) + ' ' + Y(titrPH(t, v)).toFixed(1); s += `<path d="${d}" fill="none" stroke="#4cc9f0" stroke-width="3.5"/>`; const ve = Veq(t); if (ve < VMAX) s += L(X(ve), Y0, X(ve), Y0 - Ht, '#ffd23f', 1.8, '6 5') + TX(X(ve), Y0 - Ht + 14, 'equivalence ' + fmt(ve, 1) + ' mL', { s: 10.5, c: '#ffe9a8' });
      s += CIR(X(t.p.Vb), Y(titrPH(t, t.p.Vb)), 7, '#ffd23f', '#fff', 2.5);
    }
    return s;
  }
  RL.register({
    id: 'ph', lab: 'chem', topic: 'Acids & Bases', title: 'Acids, Bases, pH & Titration', icon: '🧫', level: 'Intermediate', model: 'full',
    assumptions: 'pH is found by solving the exact charge-balance equation at 25 °C (Kw = 1.0×10⁻¹⁴) using concentrations rather than activities, so it is accurate for dilute to moderate solutions (activity effects above ~0.1 M are ignored). H₂SO₄’s second ionisation and Ca(OH)₂’s limited solubility are simplified. Weak-acid/base constants: Ka(CH₃COOH) = 1.8×10⁻⁵, Kb(NH₃) = 1.8×10⁻⁵, Ka(NH₄⁺) = 5.6×10⁻¹⁰. Indicator colours are approximate.',
    objective: 'Measure the pH of strong and weak acids and bases, see how indicators respond, and follow a titration curve.',
    theory: '<p><b>pH = −log₁₀[H⁺]</b>. At 25 °C pH + pOH = 14. A <b>strong</b> acid ionises completely, so [H⁺] = its concentration (×number of H⁺). A <b>weak</b> acid only partly ionises (Ka), so its pH is higher than a strong acid of the same concentration. Salts of weak acids/bases can make solutions slightly alkaline/acidic.</p><p>In a <b>titration</b> base is added from a burette to an acid until the <b>equivalence point</b> (moles OH⁻ = moles H⁺). For strong acid–strong base this is at pH 7; for a weak acid–strong base it is above 7. Choose an indicator whose colour change lies in the steep part of the curve.</p>',
    formulas: ['pH = −log₁₀[H⁺]', 'pOH = −log₁₀[OH⁻], pH + pOH = 14', 'Ka = [H⁺][A⁻] ÷ [HA]', 'n(acid) = n(base) at equivalence: C₁V₁ = C₂V₂ (1:1)'], fixedView: false, animated: true,
    params: [{ k: 'rate', label: 'Burette flow rate', type: 'select', options: [[0.5, 'slow — 0.5 mL/s'], [2, 'medium — 2 mL/s'], [6, 'fast — 6 mL/s']], val: 2 }],
    types: {
      beaker: { name: it => SUB[it.p.sub].name, icon: '🥛', w: 120, h: 220, defaults: { sub: 'hcl', logc: -1 }, props: [{ k: 'sub', label: 'Solution', type: 'select', options: SUB_OPTS, val: 'hcl' }, { k: 'logc', label: 'log₁₀(concentration in mol/L)', min: -4, max: 0, step: 0.1, dec: 1, val: -1 }], info: 'Concentration = 10^(slider) mol/L: −1 means 0.1 M, −2 means 0.01 M.', draw: beakerDraw, place: W => [120 + (beakers(W).length % 3) * 160, 440] },
      indi: { name: it => IND[it.p.kind][0], icon: '💧', w: 190, h: 46, fixed: true, defaults: { kind: 'uni' }, props: [{ k: 'kind', label: 'Indicator', type: 'select', options: Object.keys(IND).filter(k => k !== 'none').map(k => [k, IND[k][0]]), val: 'uni' }], info: 'Adds a few drops of this indicator to every beaker.', draw: it => `<rect x="-95" y="-23" width="190" height="46" rx="10" fill="rgba(20,30,80,.88)" stroke="#ff6b9d" stroke-width="2.5"/>` + TX(0, 5, '💧 ' + IND[it.p.kind][0], { s: 13 }), place: () => [100, 110] },
      titr: { name: () => 'Titration', icon: '🧪', w: 140, h: 390, defaults: { acid: 'hcl', Ca: 0.1, Va: 25, Cb: 0.1, Vb: 0, ind: 'phph' }, props: [{ k: 'acid', label: 'Acid in the flask', type: 'select', options: [['hcl', 'Hydrochloric acid (strong)'], ['ch3cooh', 'Ethanoic acid (weak)']], val: 'hcl' }, { k: 'Ca', label: 'Acid concentration', min: 0.05, max: 0.2, step: 0.01, unit: 'M', dec: 2, val: 0.1 }, { k: 'Va', label: 'Acid volume in flask', min: 10, max: 50, step: 1, unit: 'mL', dec: 0, val: 25 }, { k: 'Cb', label: 'NaOH concentration (burette)', min: 0.05, max: 0.2, step: 0.01, unit: 'M', dec: 2, val: 0.1 }, { k: 'ind', label: 'Indicator in flask', type: 'select', options: Object.keys(IND).map(k => [k, IND[k][0]]), val: 'phph' }, { k: 'Vb', label: 'NaOH added', min: 0, max: VMAX, step: 0.1, unit: 'mL', dec: 1, val: 0 }], info: 'Add NaOH with the slider, or press ▶ Run to open the tap.', draw: titrDraw, place: () => [320, 230] }
    },
    catalog: [{ type: 'beaker', name: 'Beaker of solution', icon: '🥛', desc: 'Acid, base, salt or water: choose and measure pH', tags: 'acid base ph measure hcl naoh ammonia vinegar' }, { type: 'indi', name: 'Indicator', icon: '💧', desc: 'Universal, litmus, phenolphthalein, methyl orange, bromothymol blue', max: 1, tags: 'colour litmus universal' }, { type: 'titr', name: 'Titration set-up', icon: '🧪', desc: 'Burette of NaOH + flask of acid; live titration curve', max: 1, tags: 'burette equivalence flask' }],
    init(W) { W.add('indi', 100, 110, { kind: 'uni' }); W.add('beaker', 120, 440, { sub: 'hcl', logc: -1 }); W.add('beaker', 280, 440, { sub: 'naoh', logc: -1 }); },
    onAdd(W, it) { if (it.type === 'beaker') { it.x = 120 + ((beakers(W).length - 1) % 4) * 160; it.y = 440; } if (it.type === 'titr') { it.x = 320; it.y = 230; } if (it.type === 'indi') { it.x = 100; it.y = 110; } },
    step(W, dt) { const t = titr(W); if (!t) return; t.p.Vb = Math.min(VMAX, t.p.Vb + dt * W.params.rate); if (t.p.Vb >= VMAX) W.running = false; },
    sim() { },
    reset(W) { const t = titr(W); if (t) t.p.Vb = 0; },
    bg: phBg,
    messages(W) {
      const r = [], b = beakers(W), t = titr(W); if (!b.length && !t) return [{ t: 'info', m: 'Add a beaker of solution or a titration set-up.' }];
      b.forEach(x => { const s = SUB[x.p.sub]; if (s.note) r.push({ t: 'info', m: `${s.f}: ${s.note}.` }); if (x.p.sub !== 'water' && conc(x) < 1e-6) r.push({ t: 'info', m: 'Very dilute solutions are dominated by the water’s own ions (pH → 7).' }); });
      if (t) { const ve = Veq(t), pj = [titrPH(t, Math.max(0, ve - 0.1)), titrPH(t, ve + 0.1)], ir = IND[t.p.ind][2]; if (t.p.ind !== 'none' && ir) { const lo = Math.max(ir[0], pj[0]), hi = Math.min(ir[1], pj[1]); const good = hi - lo >= 0.5 * (ir[1] - ir[0]) || t.p.ind === 'uni' ? t.p.ind !== 'uni' : false; if (t.p.ind === 'uni') r.push({ t: 'info', m: 'Universal indicator changes colour gradually — not sharp enough for an accurate end-point.' }); else r.push({ t: good ? 'info' : 'warn', m: good ? `${IND[t.p.ind][0]} changes colour (pH ${ir[0]}–${ir[1]}) within the steep part of this curve (pH ${fmt(pj[0], 1)}–${fmt(pj[1], 1)}): a <b>suitable</b> indicator.` : `${IND[t.p.ind][0]} changes colour at pH ${ir[0]}–${ir[1]}, which is <b>outside</b> the steep part of this curve (pH ${fmt(pj[0], 1)}–${fmt(pj[1], 1)}): a poor choice.` }); } if (t.p.Vb >= VMAX) r.push({ t: 'info', m: 'Burette empty (60 mL).' }); }
      return r.slice(0, 4);
    },
    readouts(W) {
      const o = [], b = bSel(W), t = titr(W);
      if (b) { const s = SUB[b.p.sub], c = conc(b), pH = bPH(b), h = Math.pow(10, -pH); o.push({ l: 'Solution', v: `${s.name} ${fmt(c, 4)} M` }, { l: 'Type', v: s.kind }, { l: '[H⁺]', v: h, u: 'mol/L', d: 3 }, { l: '[OH⁻]', v: KW / h, u: 'mol/L', d: 3 }, { l: 'pH', v: pH, d: 2 }, { l: 'pOH', v: 14 - pH, d: 2 }, { l: 'Reaction of solution', v: pH < 6.95 ? 'acidic' : pH > 7.05 ? 'alkaline' : 'neutral' }); const ik = activeInd(W); if (ik !== 'none') o.push({ l: IND[ik][0] + ' colour', v: COLNAME[ik](pH) }); if (s.kind === 'weak acid' || s.kind === 'weak base') { const strong = -Math.log10(c); o.push({ l: 'pH if it were a strong acid/base of same concentration', v: s.kind === 'weak acid' ? strong : 14 - strong, d: 2 }, { l: 'Fraction ionised', v: s.kind === 'weak acid' ? h / c : (KW / h) / c, d: 4 }); } }
      if (t) { const pH = titrPH(t, t.p.Vb), ve = Veq(t), ik = t.p.ind; o.push({ l: 'Titration: NaOH added', v: t.p.Vb, u: 'mL', d: 1 }, { l: 'Titration: pH', v: pH, d: 2 }, { l: 'Equivalence volume', v: ve, u: 'mL', d: 2 }, { l: 'pH at equivalence', v: titrPH(t, ve), d: 2 }, { l: 'Stage', v: Math.abs(t.p.Vb - ve) < 0.05 ? 'at equivalence' : t.p.Vb < ve ? 'before equivalence (acid in excess)' : 'after equivalence (NaOH in excess)' }); if (ik !== 'none') o.push({ l: 'Flask colour', v: COLNAME[ik](pH) }); }
      return o;
    },
    live(W) { const r = [], b = bSel(W), t = titr(W); if (b) { const s = SUB[b.p.sub], c = conc(b), pH = bPH(b); if (s.kind === 'strong acid') r.push(`strong acid: [H⁺] ≈ ${fmt(s.neg(c), 4)} → pH = −log₁₀(${fmt(s.neg(c), 4)}) = <b>${fmt(pH, 2)}</b>`); else if (s.kind === 'strong base') r.push(`strong base: [OH⁻] ≈ ${fmt(s.pos(c), 4)} → pOH = ${fmt(14 - pH, 2)}, pH = 14 − pOH = <b>${fmt(pH, 2)}</b>`); else r.push(`solved exactly from charge balance → pH = <b>${fmt(pH, 2)}</b>`); } if (t) r.push(`n(acid) = ${fmt(t.p.Ca, 2)} × ${fmt(t.p.Va, 0)}/1000 = ${fmt(t.p.Ca * t.p.Va / 1000, 5)} mol → V(NaOH) at equivalence = <b>${fmt(Veq(t), 2)} mL</b>`); return r; },
    graphs: [{ id: 'tc', title: 'pH against volume of NaOH added (▶ Run the burette)', x: 'V (NaOH) / mL', y: 'pH', series: [{ n: 'pH', c: '#4cc9f0' }], sampleEvery: 0.1, sample(W) { const t = titr(W); return t ? [Math.round(t.p.Vb * 10) / 10, titrPH(t, t.p.Vb)] : null; } }],
    guided: {
      objective: 'Compare strong and weak acids, then follow a titration and choose a good indicator.', setup: W => { W.add('indi', 100, 110, { kind: 'uni' }); W.add('beaker', 120, 440, { sub: 'hcl', logc: -1 }); W.add('beaker', 280, 440, { sub: 'ch3cooh', logc: -1 }); },
      steps: [{ t: 'Two beakers: 0.1 M hydrochloric acid and 0.1 M ethanoic acid. Predict which has the lower pH.', predict: { q: 'Which solution has the lower pH?', opts: ['0.1 M HCl (strong)', '0.1 M CH₃COOH (weak)', 'They are the same'], a: 0, why: 'HCl ionises fully ([H⁺] = 0.1, pH 1); ethanoic acid only about 1 % (pH ≈ 2.9).' }, ok: W => beakers(W).length >= 2 },
        { t: 'Select each beaker and read pH and the fraction ionised in Results.', ok: W => beakers(W).length >= 2 },
        { t: 'Add a titration set-up (Add Equipment). It starts with 25 mL 0.1 M HCl and phenolphthalein. Press ▶ Run and watch the curve.', ok: W => !!titr(W) && titr(W).p.Vb > 5 },
        { t: 'Let it pass 25 mL: the pH jumps from about 3 to 11 and the flask turns pink. Equivalence is at pH 7 for strong acid + strong base.', ok: W => !!titr(W) && titr(W).p.Vb > 26 },
        { t: 'Change the acid to ethanoic acid and Reset. Where is the equivalence pH now? Try methyl orange — is it suitable?', ok: W => !!titr(W) && titr(W).p.acid === 'ch3cooh' }],
      done: () => 'Strong acids give a lower pH than weak acids of the same concentration. In a titration the indicator must change colour in the steep part of the curve; for a weak acid that is above pH 7.'
    },
    quiz: [{ q: 'A solution has [H⁺] = 1×10⁻³ mol/L. Its pH is…', opts: ['3', '−3', '11'], a: 0, why: 'pH = −log₁₀(10⁻³) = 3.' }, { q: 'Which has the higher pH?', opts: ['0.1 M ethanoic acid', '0.1 M hydrochloric acid', 'both equal'], a: 0, why: 'Weak acid: fewer H⁺ ions.' }, { q: 'For 25 mL 0.1 M HCl titrated with 0.1 M NaOH the equivalence volume is…', opts: ['25 mL', '50 mL', '12.5 mL'], a: 0, why: 'Equal concentrations and 1:1 reaction → equal volumes.' }]
  });

  /* ============================ CHEMICAL REACTIONS ============================ */
  const CAT = { H: ['H', 1, false], Na: ['Na', 1, false], K: ['K', 1, false], Ag: ['Ag', 1, false], Ca: ['Ca', 2, false], Mg: ['Mg', 2, false], Ba: ['Ba', 2, false], Zn: ['Zn', 2, false], Cu: ['Cu', 2, false], Pb: ['Pb', 2, false], Fe: ['Fe', 3, false], Fe2: ['Fe', 2, false] };
  const AN = { Cl: ['Cl', -1, false], NO3: ['NO3', -1, true], SO4: ['SO4', -2, true], OH: ['OH', -1, true], CO3: ['CO3', -2, true], I: ['I', -1, false] };
  const SOLS = { none: null, hcl: ['H', 'Cl'], h2so4: ['H', 'SO4'], hno3: ['H', 'NO3'], naoh: ['Na', 'OH'], koh: ['K', 'OH'], nacl: ['Na', 'Cl'], kno3: ['K', 'NO3'], na2so4: ['Na', 'SO4'], bacl2: ['Ba', 'Cl'], agno3: ['Ag', 'NO3'], cuso4: ['Cu', 'SO4'], fecl3: ['Fe', 'Cl'], pbno3: ['Pb', 'NO3'], ki: ['K', 'I'], na2co3: ['Na', 'CO3'], cacl2: ['Ca', 'Cl'], znso4: ['Zn', 'SO4'], mgso4: ['Mg', 'SO4'], cuno3: ['Cu', 'NO3'] };
  const frm = (c, a) => { const [cs, qc] = CAT[c].slice(0, 2), [as, qa, pa] = AN[a]; const qa2 = Math.abs(qa), g = C.gcd(qc, qa2), nc = qa2 / g, na = qc / g; return cs + (nc > 1 ? nc : '') + (pa ? (na > 1 ? '(' + as + ')' + na : as) : as + (na > 1 ? na : '')); };
  const SNAME = k => SOLS[k] ? sub(frm(...SOLS[k])) + ' solution' : 'none';
  const SOL_OPTS = Object.keys(SOLS).map(k => [k, k === 'none' ? '— none —' : sub(frm(...SOLS[k])) + ' (aq)']);
  const METALS = { none: 'none', Mg: 'Magnesium ribbon', Zn: 'Zinc granules', Fe: 'Iron nail', Cu: 'Copper strip', Ag: 'Silver foil', CaCO3: 'Marble chip (CaCO₃)', CuCO3: 'Copper(II) carbonate (green powder)' };
  const RANK = { Mg: 5, Zn: 4, Fe: 3, Pb: 2.5, Cu: 2, Ag: 1, Na: 9, K: 9, Ca: 9, Ba: 9 };
  const MION = { Mg: 'Mg', Zn: 'Zn', Fe: 'Fe2', Cu: 'Cu', Ag: 'Ag' };
  const DEPCOL = { Cu: '#b4572b', Ag: '#d8dde6', Pb: '#6b7280', Zn: '#9aa3b2', Fe: '#7d8798', Mg: '#cfd4dc' };
  const PPT = { AgCl: ['#f4f4f4', 'white'], AgI: ['#f3e58a', 'pale yellow'], BaSO4: ['#f4f4f4', 'white'], PbSO4: ['#f4f4f4', 'white'], PbCl: ['#f4f4f4', 'white'], PbI: ['#f7d51d', 'bright yellow'], CuOH: ['#5aa8ff', 'pale blue'], FeOH: ['#b5532a', 'reddish-brown'], ZnOH: ['#f4f4f4', 'white'], MgOH: ['#f4f4f4', 'white'], CaCO3: ['#f4f4f4', 'white'], BaCO3: ['#f4f4f4', 'white'], CuCO3: ['#4cb5a0', 'green-blue'], ZnCO3: ['#f4f4f4', 'white'], MgCO3: ['#f4f4f4', 'white'], PbCO3: ['#f4f4f4', 'white'], AgCO3: ['#e9e4a8', 'pale yellow-white'], PbOH: ['#f4f4f4', 'white'], AgOH: ['#9b7b5a', 'brown (Ag₂O)'] };
  const insoluble = (c, a) => { if (['Na', 'K', 'H'].includes(c)) return false; if (a === 'NO3') return false; if (a === 'Cl') return ['Ag', 'Pb'].includes(c); if (a === 'I') return ['Ag', 'Pb'].includes(c); if (a === 'SO4') return ['Ba', 'Pb'].includes(c); if (a === 'OH') return !['Ba'].includes(c); if (a === 'CO3') return true; return false; };
  const SOLCOL = { Cu: 'rgba(40,150,240,.75)', FeIII: 'rgba(214,150,40,.72)', Fe2: 'rgba(160,210,150,.6)', none: 'rgba(190,225,255,.28)' };
  const solCol = (k) => { if (!SOLS[k]) return null; const c = SOLS[k][0]; return c === 'Cu' ? SOLCOL.Cu : c === 'Fe' ? SOLCOL.FeIII : SOLCOL.none; };
  function eqnString(sp, left, right) {   // sp: [{f, st}] ; left/right arrays of indices
    const all = left.map(i => sp[i].f).concat(right.map(i => sp[i].f)), b = balance(left.map(i => sp[i].f), right.map(i => sp[i].f)); if (!b.co) return { text: null };
    const t = (list, off) => list.map((i, j) => (b.co[off + j] > 1 ? b.co[off + j] : '') + sub(sp[i].f) + '(' + sp[i].st + ')').join(' + ');
    return { text: t(left, 0) + ' → ' + t(right, left.length), co: b.co };
  }
  const gasOf = { H2: ['H₂', 'colourless gas — burns with a squeaky “pop” with a lit splint'], CO2: ['CO₂', 'colourless gas — turns limewater milky'], O2: ['O₂', 'relights a glowing splint'] };
  function react(cfg) {
    const { solid, s1, s2, heat } = cfg; const out = { status: 'none', type: 'no reaction', obs: 'No visible change.', ppt: null, gas: null, rate: 0, deposit: null, final: null, eq: null, net: null, notes: [], flame: false, dissolve: false };
    const sols = [s1, s2].filter(k => k && k !== 'none'), mixInit = sols.length ? (sols.map(solCol).find(c => c && c !== SOLCOL.none) || SOLCOL.none) : null; out.init = mixInit; out.final = mixInit;
    const isAcid = k => SOLS[k] && SOLS[k][0] === 'H', isBase = k => SOLS[k] && SOLS[k][1] === 'OH' && ['Na', 'K'].includes(SOLS[k][0]);
    if (solid !== 'none' && solid !== 'CaCO3' && solid !== 'CuCO3') {   // metal
      const M = solid; const first = sols[0];
      if (!first) {
        if (heat) { if (M === 'Mg') return { ...out, status: 'react', type: 'combustion (reaction with oxygen)', obs: 'Burns with a dazzling white flame leaving white magnesium oxide powder.', flame: true, deposit: '#f4f4f4', rate: 1, eq: eqnString([{ f: 'Mg', st: 's' }, { f: 'O2', st: 'g' }, { f: 'MgO', st: 's' }], [0, 1], [2]).text, notes: ['Oxidation: Mg → Mg²⁺ + 2e⁻.'] }; if (M === 'Cu') return { ...out, status: 'react', type: 'oxidation (reaction with oxygen)', obs: 'The copper surface turns black (copper(II) oxide).', deposit: '#222', rate: .6, eq: eqnString([{ f: 'Cu', st: 's' }, { f: 'O2', st: 'g' }, { f: 'CuO', st: 's' }], [0, 1], [2]).text }; if (M === 'Fe') return { ...out, status: 'react', type: 'oxidation (reaction with oxygen)', obs: 'Iron glows and forms a dark oxide layer (Fe₃O₄/Fe₂O₃).', deposit: '#3a3a44', rate: .5, eq: eqnString([{ f: 'Fe', st: 's' }, { f: 'O2', st: 'g' }, { f: 'Fe2O3', st: 's' }], [0, 1], [2]).text, notes: ['Simplified to Fe₂O₃.'] }; if (M === 'Zn') return { ...out, status: 'react', type: 'oxidation (reaction with oxygen)', obs: 'Zinc burns with a bluish flame forming zinc oxide (yellow when hot, white when cool).', flame: true, deposit: '#f4f4f4', rate: .7, eq: eqnString([{ f: 'Zn', st: 's' }, { f: 'O2', st: 'g' }, { f: 'ZnO', st: 's' }], [0, 1], [2]).text }; return { ...out, obs: 'Silver does not react with oxygen, even when heated.', notes: ['Silver is very unreactive.'] }; }
        return { ...out, obs: 'A metal on its own in an empty tube: nothing happens. Add a solution (or heat it).' };
      }
      const [c1, a1] = SOLS[first];
      if (c1 === 'H') {
        if (a1 === 'NO3') return { ...out, status: 'special', type: 'oxidising acid', obs: 'Nitric acid is an oxidising acid: metals give nitrogen oxides (and no hydrogen). This simulator does not model it.', notes: ['Use hydrochloric or sulfuric acid to see metal + acid → salt + hydrogen.'] };
        if (RANK[M] >= 3) { const salt = frm(MION[M], a1), sp = [{ f: M, st: 's' }, { f: frm('H', a1), st: 'aq' }, { f: salt, st: 'aq' }, { f: 'H2', st: 'g' }]; return { ...out, status: 'react', type: 'metal + acid → salt + hydrogen', obs: `${METALS[M].split(' ')[0]} fizzes: bubbles of hydrogen${M === 'Fe' ? ' (slowly); solution turns pale green' : ''}.`, gas: 'H2', rate: { Mg: 1, Zn: .55, Fe: .25 }[M] * (heat ? 1.6 : 1), dissolve: true, final: M === 'Fe' ? SOLCOL.Fe2 : SOLCOL.none, eq: eqnString(sp, [0, 1], [2, 3]).text, net: `${M}(s) + 2H⁺(aq) → ${M === 'Fe' ? 'Fe²⁺' : M + '²⁺'}(aq) + H₂(g)`, notes: ['Metals above hydrogen in the reactivity series displace hydrogen from acids.'] }; }
        return { ...out, obs: `${METALS[M].split(' ')[0]} is below hydrogen in the reactivity series: no reaction with dilute acid.`, notes: ['Reactivity series: Mg > Zn > Fe > (H) > Cu > Ag'] };
      }
      if (['Zn', 'Cu', 'Mg', 'Ag', 'Pb', 'Na', 'K', 'Ca', 'Ba', 'Fe'].includes(c1) && SOLS[first]) {
        if (['Na', 'K', 'Ca', 'Ba'].includes(c1) || c1 === 'Fe') return { ...out, obs: c1 === 'Fe' ? 'Iron(III) ions react in a more complicated way (Fe³⁺ → Fe²⁺); not modelled.' : `${c1} is more reactive than ${M}: no displacement.`, notes: ['The metal can only displace ions of a less reactive metal.'] };
        if (RANK[M] > RANK[c1] && M !== c1) { const newSalt = frm(MION[M], a1), old = frm(c1, a1), dep = c1; const net = `${M}(s) + ${c1}${C.ion('', CAT[c1][1]).trim()}(aq) → ${M === 'Fe' ? 'Fe²⁺' : M + C.ion('', CAT[M][1]).trim()}(aq) + ${c1}(s)`; return { ...out, status: 'react', type: 'displacement (more reactive metal wins)', obs: `A ${{ Cu: 'reddish-brown', Ag: 'silvery-grey', Pb: 'grey-black', Zn: 'grey' }[dep]} deposit of ${dep} forms on the ${M}${c1 === 'Cu' ? '; the blue colour fades' : ''}${M === 'Fe' ? '; solution turns pale green' : ''}.`, deposit: DEPCOL[dep], dissolve: true, rate: (RANK[M] - RANK[c1]) / 3 * (heat ? 1.5 : 1), final: M === 'Fe' ? SOLCOL.Fe2 : SOLCOL.none, eq: eqnString([{ f: M, st: 's' }, { f: old, st: 'aq' }, { f: newSalt === old ? newSalt + ' ' : newSalt, st: 'aq' }, { f: dep, st: 's' }], [0, 1], [2, 3]).text, net, notes: [`Reactivity: ${M} (${RANK[M]}) is above ${c1} in the series, so ${M} displaces ${c1}.`] }; }
        return { ...out, obs: `${M} is ${M === c1 ? 'the same metal' : 'less reactive than ' + c1}: no displacement.`, notes: ['A less reactive metal cannot displace a more reactive one from solution.'] };
      }
      return { ...out, obs: 'No reaction expected.' };
    }
    if (solid === 'CaCO3') {
      const first = sols.find(isAcid); if (first) { const a = SOLS[first][1], salt = frm('Ca', a); return { ...out, status: 'react', type: 'acid + carbonate → salt + water + carbon dioxide', obs: 'Fizzing: colourless bubbles of carbon dioxide; the chip slowly shrinks.' + (a === 'SO4' ? ' (CaSO₄ coats the marble and slows the reaction.)' : ''), gas: 'CO2', rate: a === 'SO4' ? .3 : .7, dissolve: true, eq: eqnString([{ f: 'CaCO3', st: 's' }, { f: frm('H', a), st: 'aq' }, { f: salt, st: 'aq' }, { f: 'H2O', st: 'l' }, { f: 'CO2', st: 'g' }], [0, 1], [2, 3, 4]).text, net: 'CaCO₃(s) + 2H⁺(aq) → Ca²⁺(aq) + H₂O(l) + CO₂(g)' }; }
      if (heat && !sols.length) return { ...out, status: 'react', type: 'thermal decomposition', obs: 'On strong heating the white solid gives off CO₂ and leaves white calcium oxide (needs ~900 °C).', gas: 'CO2', rate: .35, eq: eqnString([{ f: 'CaCO3', st: 's' }, { f: 'CaO', st: 's' }, { f: 'CO2', st: 'g' }], [0], [1, 2]).text, notes: ['Needs a very hot flame.'] };
      return { ...out, obs: 'Marble does not react with water or neutral/alkaline solutions at room temperature.' };
    }
    if (solid === 'CuCO3') { if (heat && !sols.length) return { ...out, status: 'react', type: 'thermal decomposition', obs: 'The green powder turns black (copper(II) oxide) and CO₂ is given off.', gas: 'CO2', rate: .8, deposit: '#1b1b1b', eq: eqnString([{ f: 'CuCO3', st: 's' }, { f: 'CuO', st: 's' }, { f: 'CO2', st: 'g' }], [0], [1, 2]).text }; const first = sols.find(isAcid); if (first) { const a = SOLS[first][1]; return { ...out, status: 'react', type: 'acid + carbonate → salt + water + carbon dioxide', obs: 'Fizzes; the green solid dissolves to a blue solution.', gas: 'CO2', rate: .7, dissolve: true, final: SOLCOL.Cu, eq: eqnString([{ f: 'CuCO3', st: 's' }, { f: frm('H', a), st: 'aq' }, { f: frm('Cu', a), st: 'aq' }, { f: 'H2O', st: 'l' }, { f: 'CO2', st: 'g' }], [0, 1], [2, 3, 4]).text }; } return { ...out, obs: 'Heat the dry powder (no solution) to see it decompose.' }; }
    // two solutions
    if (sols.length < 2) return { ...out, obs: sols.length ? 'Only one solution in the tube: add a second solution (or a solid) to react it with.' : 'The tube is empty.' };
    const [A, B] = sols, [c1, a1] = SOLS[A], [c2, a2] = SOLS[B]; if (A === B) return { ...out, obs: 'The same solution twice: nothing to react.' };
    // neutralisation
    if ((isAcid(A) && isBase(B)) || (isAcid(B) && isBase(A))) { const ac = isAcid(A) ? A : B, ba = isAcid(A) ? B : A, salt = frm(SOLS[ba][0], SOLS[ac][1]); return { ...out, status: 'react', type: 'neutralisation', obs: 'No visible change (colourless solutions) but the mixture warms slightly. Test with indicator: the pH moves towards 7.', rate: .2, final: SOLCOL.none, eq: eqnString([{ f: frm('H', SOLS[ac][1]), st: 'aq' }, { f: frm(SOLS[ba][0], 'OH'), st: 'aq' }, { f: salt, st: 'aq' }, { f: 'H2O', st: 'l' }], [0, 1], [2, 3]).text, net: 'H⁺(aq) + OH⁻(aq) → H₂O(l)', notes: ['Exothermic.'] }; }
    // acid + carbonate
    if ((isAcid(A) && a2 === 'CO3') || (isAcid(B) && a1 === 'CO3')) { const ac = isAcid(A) ? A : B, cb = isAcid(A) ? B : A, salt = frm(SOLS[cb][0], SOLS[ac][1]); return { ...out, status: 'react', type: 'acid + carbonate → salt + water + carbon dioxide', obs: 'Vigorous fizzing: colourless bubbles of carbon dioxide.', gas: 'CO2', rate: 1, eq: eqnString([{ f: frm('H', SOLS[ac][1]), st: 'aq' }, { f: frm(SOLS[cb][0], 'CO3'), st: 'aq' }, { f: salt, st: 'aq' }, { f: 'H2O', st: 'l' }, { f: 'CO2', st: 'g' }], [0, 1], [2, 3, 4]).text, net: 'CO₃²⁻(aq) + 2H⁺(aq) → H₂O(l) + CO₂(g)' }; }
    // double displacement / precipitation
    const p1 = insoluble(c1, a2), p2 = insoluble(c2, a1); const x = [];
    if (p1) x.push([c1, a2]); if (p2) x.push([c2, a1]);
    if (!x.length) return { ...out, obs: 'No change: every possible new combination is soluble, so all ions stay dissolved (they are spectator ions).', notes: ['Solubility rules: nitrates all soluble; chlorides soluble except Ag, Pb; sulfates soluble except Ba, Pb; hydroxides and carbonates insoluble except Na, K.'], final: mixInit };
    const [pc, pa] = x[0], pf = frm(pc, pa), other = p1 ? [c2, a1] : [c1, a2], of = frm(...other), key = (['Fe', 'Cu', 'Zn', 'Mg', 'Pb', 'Ag'].includes(pc) && pa === 'OH' ? pc + 'OH' : pc + pa), pk = PPT[key] || PPT[pc + 'OH'] || ['#f4f4f4', 'white'];
    const ionNet = `${pc}${C.ion('', CAT[pc][1]).trim() === '⁺' ? '⁺' : C.ion('', CAT[pc][1]).trim()}(aq) + ${AN[pa][2] ? AN[pa][0] : AN[pa][0]}${C.ion('', AN[pa][1]).trim()}(aq) → ${sub(pf)}(s)`;
    const nn = (c, n) => (n > 1 ? n : '');
    const g = C.gcd(CAT[pc][1], Math.abs(AN[pa][1])), cn = Math.abs(AN[pa][1]) / g, an = CAT[pc][1] / g;
    const net = `${cn > 1 ? cn : ''}${pc}${C.ion('', CAT[pc][1]).trim()}(aq) + ${an > 1 ? an : ''}${AN[pa][0] === 'OH' || AN[pa][0] === 'CO3' || AN[pa][0] === 'SO4' || AN[pa][0] === 'NO3' ? sub(AN[pa][0]) : AN[pa][0]}${C.ion('', AN[pa][1]).trim()}(aq) → ${sub(pf)}(s)`;
    const lf = [A, B].map(k => frm(...SOLS[k])), rest = frm(...other);
    return { ...out, status: 'react', type: 'precipitation (double displacement)', obs: `A ${pk[1]} precipitate of ${sub(pf)} forms immediately.`, ppt: pk[0], pptName: sub(pf), rate: 1, final: pc === 'Cu' ? SOLCOL.none : mixInit === SOLCOL.Cu && !['Cu'].includes(pc) ? SOLCOL.Cu : SOLCOL.none, eq: eqnString([{ f: lf[0], st: 'aq' }, { f: lf[1], st: 'aq' }, { f: pf, st: 's' }, { f: rest, st: 'aq' }], [0, 1], [2, 3]).text, net, notes: x.length > 1 ? ['Both swapped pairs are insoluble: two precipitates form (only the first is shown).'] : [`The ${sub(rest)} stays dissolved; its ions are spectators.`] };
  }
  const tubes = W => W.items.filter(i => i.type === 'tube'), tSel = W => (W.sel && W.sel.kind === 'item' && tubes(W).find(i => i.id === W.sel.id)) || tubes(W)[0];
  const cfgOf = it => ({ solid: it.p.solid, s1: it.p.s1, s2: it.p.s2, heat: !!it.p.heat });
  function tubeDraw(it, W) {
    const r = react(cfgOf(it)), p = clamp(W.d.rp == null ? 0 : W.d.rp, 0, 1), done = W.d.rp != null, f = done ? p : 0; const t = W.t || 0;
    const liq = f > 0 && r.final ? mixRGBA(r.init || SOLCOL.none, r.final, f) : (r.init || SOLCOL.none), hasLiq = it.p.s1 !== 'none' || it.p.s2 !== 'none';
    let s = `<path d="M-30 -110V90A30 30 0 0 0 30 90V-110" fill="rgba(255,255,255,.05)" stroke="#cfe3ff" stroke-width="3.5" stroke-linecap="round"/>`;
    if (hasLiq) s += `<path d="M-28 -30V90A28 28 0 0 0 28 90V-30Z" fill="${liq}"/>` + `<path d="M-28 -30h56" stroke="rgba(255,255,255,.5)" stroke-width="2"/>`;
    if (r.ppt && f > 0) s += `<path d="M-27 ${88 - 38 * f}H27V90A27 27 0 0 1-27 90Z" fill="${r.ppt}" opacity=".95"/>` + (f < 1 && f > 0 ? Array.from({ length: 7 }, (_, i) => CIR(-20 + i * 7, -10 + ((i * 37 + t * 30) % 70), 2.2, r.ppt)).join('') : '');
    const sol = it.p.solid; if (sol !== 'none') { const dep = r.deposit && f > 0, shrink = r.dissolve ? 1 - .55 * f : 1; if (sol === 'CaCO3') s += `<ellipse cx="0" cy="${80}" rx="${14 * shrink}" ry="${9 * shrink}" fill="#f4f1ea" stroke="#bbb" stroke-width="1.5"/>`; else if (sol === 'CuCO3') s += `<ellipse cx="0" cy="82" rx="20" ry="7" fill="${dep ? '#1b1b1b' : '#3fa585'}"/>`; else s += `<rect x="-5" y="-60" width="10" height="${140 * shrink}" rx="3" fill="${dep && r.deposit ? r.deposit : DEPCOL[sol] || '#aab'}" stroke="#fff" stroke-width="1.5" opacity=".95"/>` + (sol === 'Cu' || sol === 'Mg' || sol === 'Zn' || sol === 'Fe' || sol === 'Ag' ? `<rect x="-5" y="-60" width="10" height="${140 * shrink}" rx="3" fill="${DEPCOL[sol]}" opacity="${dep ? 0 : .95}"/>` : ''); }
    if (r.gas && f > 0 && (f < 1 || r.rate > 0)) { const n = Math.round(6 + r.rate * 10); for (let i = 0; i < n; i++) { const ph = (t * (30 + r.rate * 50) + i * 53) % 140; s += CIR(-18 + (i * 31 % 36) + Math.sin(t * 3 + i) * 3, 85 - ph, 2 + (i % 3), 'rgba(255,255,255,.75)', 'rgba(255,255,255,.9)', .8); } }
    if (it.p.heat) { s += [-16, 0, 16].map((x, i) => `<path d="M${x} 130q${8 + (t * 20 + i * 4) % 6} -16 0 -34q-${6} -14 ${6} -28" fill="none" stroke="${r.flame ? '#fff' : '#ff9f1c'}" stroke-width="${r.flame ? 5 : 4}" stroke-linecap="round" opacity=".85"/>`).join(''); }
    if (r.flame && f > 0 && f < 1) s += CIR(0, 80, 26, 'rgba(255,255,255,.55)', '#fff', 2);
    return s + TX(0, -124, METALS[it.p.solid] === 'none' ? '' : METALS[it.p.solid].split(' ')[0], { s: 11, c: '#cfd8ff', w: 600 }) + TX(0, 158, hasLiq ? [it.p.s1, it.p.s2].filter(k => k !== 'none').map(k => SNAME(k).replace(' solution', '')).join(' + ') : (it.p.solid !== 'none' ? '' : 'empty tube'), { s: 10.5, c: '#ffe9a8' });
  }
  const mixRGBA = (a, b, t) => { const pa = a.match(/[\d.]+/g).map(Number), pb = b.match(/[\d.]+/g).map(Number); return `rgba(${pa.slice(0, 3).map((v, i) => Math.round(v + (pb[i] - v) * t)).join(',')},${((pa[3] == null ? 1 : pa[3]) + ((pb[3] == null ? 1 : pb[3]) - (pa[3] == null ? 1 : pa[3])) * t).toFixed(2)})`; };
  const PRE = [['Zinc + copper(II) sulfate', { solid: 'Zn', s1: 'cuso4' }], ['Iron + copper(II) sulfate', { solid: 'Fe', s1: 'cuso4' }], ['Copper + silver nitrate', { solid: 'Cu', s1: 'agno3' }], ['Copper + zinc sulfate (no reaction)', { solid: 'Cu', s1: 'znso4' }], ['Magnesium + hydrochloric acid', { solid: 'Mg', s1: 'hcl' }], ['Marble + hydrochloric acid', { solid: 'CaCO3', s1: 'hcl' }], ['Silver nitrate + sodium chloride', { s1: 'agno3', s2: 'nacl' }], ['Barium chloride + sodium sulfate', { s1: 'bacl2', s2: 'na2so4' }], ['Copper(II) sulfate + sodium hydroxide', { s1: 'cuso4', s2: 'naoh' }], ['Lead nitrate + potassium iodide', { s1: 'pbno3', s2: 'ki' }], ['Hydrochloric acid + sodium carbonate', { s1: 'hcl', s2: 'na2co3' }], ['Hydrochloric acid + sodium hydroxide', { s1: 'hcl', s2: 'naoh' }], ['Heating copper(II) carbonate', { solid: 'CuCO3', heat: true }], ['Burning magnesium', { solid: 'Mg', heat: true }]];
  RL.register({
    id: 'react', lab: 'chem', topic: 'Chemical Reactions', title: 'Reaction Lab: Predict & Observe', icon: '🧪', level: 'Intermediate', model: 'simplified',
    assumptions: 'A rules-based reaction engine for the school syllabus: the reactivity series (Mg > Zn > Fe > Pb > Cu > Ag), solubility rules (nitrates soluble; chlorides soluble except Ag/Pb; sulfates soluble except Ba/Pb; hydroxides and carbonates insoluble except Na/K), acid + base, acid + carbonate, thermal decomposition and combustion. Equations are balanced exactly by the balancer. Reaction rates and colours are qualitative; combinations outside these rules are reported as “not modelled” rather than guessed. Do not copy experiments with real chemicals without teacher supervision.',
    objective: 'Choose reagents, predict what will happen, then run the test tube and compare the observation and equation with your prediction.',
    theory: '<p>Reactions follow patterns. <b>Displacement:</b> a more reactive metal pushes a less reactive metal out of its salt solution. <b>Metal + acid → salt + hydrogen</b> (only metals above hydrogen). <b>Acid + carbonate → salt + water + carbon dioxide.</b> <b>Neutralisation:</b> acid + alkali → salt + water. <b>Precipitation:</b> two solutions swap partners and an insoluble solid forms. <b>Thermal decomposition:</b> a compound splits on heating. Use the <b>solubility rules</b> and the <b>reactivity series</b> to predict.</p>',
    formulas: ['Reactivity: K Na Ca Mg Al Zn Fe Pb (H) Cu Ag Au', 'metal + acid → salt + H₂', 'carbonate + acid → salt + H₂O + CO₂', 'acid + alkali → salt + H₂O', 'AB + CD → AD + CB (precipitation if insoluble)'], fixedView: false, animated: true,
    params: [],
    types: { tube: { name: () => 'Test tube', icon: '🧪', w: 90, h: 280, defaults: { solid: 'none', s1: 'cuso4', s2: 'none', heat: false }, props: [{ k: 'solid', label: 'Solid', type: 'select', options: Object.keys(METALS).map(k => [k, METALS[k]]), val: 'none' }, { k: 's1', label: 'Solution 1', type: 'select', options: SOL_OPTS, val: 'cuso4' }, { k: 's2', label: 'Solution 2', type: 'select', options: SOL_OPTS, val: 'none' }, { k: 'heat', label: 'Heat with a burner', type: 'toggle' }], info: 'Pick the contents, then press ▶ Run to mix and watch.', draw: tubeDraw, place: W => [150 + (tubes(W).length % 4) * 200, 250], onProp(it) { } } },
    catalog: PRE.map(([n, p]) => ({ type: 'tube', name: n, icon: '🧪', desc: 'Preset test tube', props: Object.assign({ solid: 'none', s1: 'none', s2: 'none', heat: false }, p), tags: 'reaction ' + n.toLowerCase() })).concat([{ type: 'tube', name: 'Empty test tube (choose reagents)', icon: '🧫', desc: 'Pick any solid and solutions yourself', props: { solid: 'none', s1: 'none', s2: 'none', heat: false }, tags: 'custom blank' }]),
    init(W) { W.add('tube', 220, 250, { solid: 'Zn', s1: 'cuso4', s2: 'none' }); },
    onAdd(W, it) { const n = tubes(W).length - 1; if (n >= 4) { W.remove(it.id); return; } it.x = 220 + n * 210; it.y = 250; W.d.rp = null; },
    step(W, dt) { W.d.rp = Math.min(1, (W.d.rp || 0) + dt / 4); if (W.d.rp >= 1) { /* keep running for bubbles */ } },
    onRun(W) { W.d.rp = 0; },
    sim() { }, reset(W) { W.d.rp = null; },
    onChange(W) { W.d.rp = null; },
    messages(W) { const t = tSel(W); if (!t) return [{ t: 'info', m: 'Add a test tube.' }]; const r = react(cfgOf(t)), o = []; if (r.status === 'special') o.push({ t: 'warn', m: r.obs }); else if (W.d.rp == null) o.push({ t: 'info', m: 'Predict the result, then press ▶ Run to mix the reagents.' }); if (r.status === 'none' && W.d.rp != null) o.push({ t: 'info', m: 'No reaction. ' + (r.notes[0] || '') }); return o.concat(r.notes.slice(0, 1).map(m => ({ t: 'info', m })).filter(() => r.status === 'react' && W.d.rp != null)); },
    readouts(W) { const t = tSel(W); if (!t) return []; const r = react(cfgOf(t)), shown = W.d.rp != null; const o = [{ l: 'Contents', v: [METALS[t.p.solid] !== 'none' ? METALS[t.p.solid] : null, ...[t.p.s1, t.p.s2].filter(k => k !== 'none').map(SNAME)].filter(Boolean).join(' + ') || 'empty' + (t.p.heat ? ' (heated)' : '') }]; if (!shown) return o.concat([{ l: 'Result', v: 'press ▶ Run to react' }]); o.push({ l: 'Reaction?', v: r.status === 'react' ? 'yes' : r.status === 'special' ? 'not modelled' : 'no' }, { l: 'Type', v: r.type }, { l: 'Observation', v: r.obs }); if (r.gas) o.push({ l: 'Gas', v: gasOf[r.gas][0] + ' — ' + gasOf[r.gas][1] }); if (r.eq) o.push({ l: 'Balanced equation', v: r.eq }); if (r.net) o.push({ l: 'Ionic / net equation', v: r.net }); return o; },
    live(W) { const t = tSel(W); if (!t) return []; const r = react(cfgOf(t)); return W.d.rp != null && r.eq ? [r.eq] : []; },
    graphs: [],
    guided: {
      objective: 'Predict and observe a displacement reaction, a gas-forming reaction and a precipitation.', setup: W => { W.add('tube', 220, 250, { solid: 'Zn', s1: 'cuso4', s2: 'none' }); },
      steps: [{ t: 'Zinc granules are in blue copper(II) sulfate solution. Predict what will happen.', predict: { q: 'Zinc is more reactive than copper. So…', opts: ['copper is displaced as a brown solid and the blue colour fades', 'nothing happens', 'zinc turns blue'], a: 0, why: 'Zn + CuSO₄ → ZnSO₄ + Cu: copper metal appears, colourless zinc sulfate forms.' }, ok: W => tubes(W).length >= 1 },
        { t: 'Press ▶ Run and compare with your prediction. Read the balanced equation in Results.', ok: W => W.d.rp != null && W.d.rp > 0.9 },
        { t: 'Add the preset “Copper + zinc sulfate (no reaction)” and run it. Why is there no reaction?', ok: W => tubes(W).some(t => t.p.solid === 'Cu' && t.p.s1 === 'znso4') },
        { t: 'Add “Silver nitrate + sodium chloride” and run it: a white precipitate forms. Compare with the net ionic equation.', ok: W => tubes(W).some(t => t.p.s1 === 'agno3' && t.p.s2 === 'nacl') },
        { t: 'Try “Marble + hydrochloric acid”: bubbles of CO₂. Which test confirms CO₂? (limewater turns milky)', ok: W => tubes(W).some(t => t.p.solid === 'CaCO3') }],
      done: () => 'Reactivity series and solubility rules let you predict the products of these reactions; always check by observing and writing a balanced equation.'
    },
    quiz: [{ q: 'Which metal will NOT react with dilute hydrochloric acid?', opts: ['Copper', 'Zinc', 'Magnesium'], a: 0, why: 'Copper is below hydrogen in the reactivity series.' }, { q: 'Silver nitrate + sodium chloride gives…', opts: ['a white precipitate of silver chloride', 'a blue solution', 'hydrogen gas'], a: 0, why: 'AgCl is insoluble.' }, { q: 'Acid + carbonate always gives salt + water + …', opts: ['carbon dioxide', 'hydrogen', 'oxygen'], a: 0, why: 'The carbonate ion releases CO₂.' }]
  });

  /* ============================ SOLUTIONS & CONCENTRATION ============================ */
  const SOLUTES = { nacl: ['Sodium chloride', 'NaCl', 36, null], glu: ['Glucose', 'C6H12O6', 90, null], suc: ['Sucrose', 'C12H22O11', 200, null], cuso4: ['Copper(II) sulfate pentahydrate', 'CuSO4.5H2O', 32, '#2e8be6'], kmno4: ['Potassium permanganate', 'KMnO4', 6.4, '#a020c0'], naoh: ['Sodium hydroxide', 'NaOH', 110, null], na2co3: ['Sodium carbonate', 'Na2CO3', 22, null], kno3: ['Potassium nitrate', 'KNO3', 38, null], nahco3: ['Sodium hydrogencarbonate', 'NaHCO3', 9.6, null] };
  const fl = W => W.items.filter(i => i.type === 'flask'), fSel = W => (W.sel && W.sel.kind === 'item' && fl(W).find(i => i.id === W.sel.id)) || fl(W)[0];
  const fcalc = it => { const s = SOLUTES[it.p.sol], M = molarMass(s[1]), V = it.p.V / 1000, lim = s[2] * it.p.V / 100, diss = Math.min(it.p.m, lim), n = diss / M; return { M, V, lim, diss, n, C: n / V, undissolved: Math.max(0, it.p.m - lim), sat: it.p.m > lim, gL: diss / V, pct: diss / it.p.V * 100, ppm: diss * 1000 / V, nTot: it.p.m / M }; };
  const intens = (col, C) => { if (!col) return 'rgba(190,225,255,.3)'; const a = clamp(1 - Math.exp(-C * 4), .08, .95); return col.replace('#', '').match(/../g) ? `rgba(${col.replace('#', '').match(/../g).map(h => parseInt(h, 16)).join(',')},${a.toFixed(2)})` : col; };
  function flaskDraw(it, W) {
    const c = fcalc(it), s = SOLUTES[it.p.sol], H = 90 + it.p.V / 1000 * 70; let o = `<path d="M-14 -${H} V-40 L-60 60 Q-66 85 -45 85 H45 Q66 85 60 60 L14 -40 V-${H}" fill="rgba(255,255,255,.05)" stroke="#cfe3ff" stroke-width="3" stroke-linejoin="round"/>`;
    o += `<path d="M-46 38 L-36 60 Q-45 80 -32 80 H32 Q45 80 36 60 L46 38 Z" fill="${intens(s[3], c.C)}" opacity=".95"/>`;
    if (c.sat) o += `<path d="M-40 70 Q0 58 40 70 L36 80 H-32 Z" fill="${s[3] ? s[3] : '#f4f1ea'}" opacity=".95"/>`;
    return o + TX(0, -H - 8, s[1] === 'CuSO4.5H2O' ? 'CuSO₄·5H₂O' : sub(s[1]), { s: 12.5, c: '#ffe9a8' }) + TX(0, 108, `${fmt(it.p.m, 1)} g in ${fmt(it.p.V, 0)} mL`, { s: 11.5, c: '#cfd8ff', w: 600 }) + TX(0, 126, `${fmt(c.C, 3)} mol/L`, { s: 14, c: '#fff' });
  }
  const dl = W => W.find('dil')[0];
  const dcalc = it => { const C2 = it.p.C1 * it.p.V1 / it.p.V2; return { C2, df: it.p.V2 / it.p.V1, water: it.p.V2 - it.p.V1, nTr: it.p.C1 * it.p.V1 / 1000 }; };
  function dilDraw(it, W) {
    const d = dcalc(it), col = SOLUTES[it.p.dye][3] || '#2e8be6'; return `<rect x="-115" y="-70" width="230" height="140" rx="14" fill="rgba(20,30,80,.7)" stroke="#4ade80" stroke-width="2.5"/><rect x="-86" y="-40" width="26" height="80" rx="6" fill="${intens(col, it.p.C1)}" stroke="#cfe3ff" stroke-width="2"/>` + TX(-73, 58, 'stock', { s: 10.5, c: '#cfd8ff' }) + TX(-73, -48, fmt(it.p.C1, 2) + ' M', { s: 11, c: '#ffe9a8' }) + `<path d="M-30 0H10" stroke="#ffd23f" stroke-width="3"/><polygon points="14,0 4,-6 4,6" fill="#ffd23f"/>` + TX(-10, -10, fmt(it.p.V1, 0) + ' mL', { s: 11, c: '#ffe9a8' }) + `<path d="M32 -42V-14L22 40Q20 54 32 54H70Q82 54 80 40L70 -14V-42" fill="rgba(255,255,255,.05)" stroke="#cfe3ff" stroke-width="2.5"/><path d="M26 18L22 40Q20 52 32 52H70Q82 52 80 40L76 18Z" fill="${intens(col, d.C2)}"/>` + TX(51, 70, fmt(d.C2, 4) + ' M', { s: 12, c: '#fff' }) + TX(51, -52, fmt(it.p.V2, 0) + ' mL', { s: 11, c: '#ffe9a8' });
  }
  RL.register({
    id: 'solution', lab: 'chem', topic: 'Solutions', title: 'Solutions, Concentration & Dilution', icon: '🥼', level: 'Intermediate', model: 'simplified',
    assumptions: 'Molar masses are computed from the formula and standard atomic masses. Solubilities are approximate values at 25 °C in g per 100 mL (they vary with temperature); the solution volume is assumed equal to the flask volume and the water’s volume — a good approximation for dilute solutions, rougher for very concentrated ones (e.g. sucrose, NaOH). Colour depth is a qualitative guide only.',
    objective: 'Calculate concentration in mol/L, g/L, % w/v and ppm, see when a solution becomes saturated, and plan a dilution with C₁V₁ = C₂V₂.',
    theory: '<p><b>Concentration</b> tells how much solute is in a given volume of solution. <b>Molarity (mol/L)</b> = moles of solute ÷ volume in litres, where moles = mass ÷ molar mass. A solution is <b>saturated</b> when no more solute can dissolve at that temperature; extra solid just sinks to the bottom.</p><p><b>Dilution:</b> adding solvent does not change the number of moles of solute, so <b>C₁V₁ = C₂V₂</b>. The dilution factor is V₂ ÷ V₁.</p>',
    formulas: ['n = m ÷ M', 'C = n ÷ V (V in litres)', 'g/L = m ÷ V', 'C₁V₁ = C₂V₂', 'ppm = mg of solute per litre'], fixedView: false, animated: false,
    params: [],
    types: {
      flask: { name: it => SOLUTES[it.p.sol][0] + ' solution', icon: '🧪', w: 150, h: 240, defaults: { sol: 'nacl', m: 5.844, V: 100 }, props: [{ k: 'sol', label: 'Solute', type: 'select', options: Object.keys(SOLUTES).map(k => [k, SOLUTES[k][0]]), val: 'nacl' }, { k: 'm', label: 'Mass of solute', min: 0.1, max: 250, step: 0.1, unit: 'g', dec: 1, val: 5.844 }, { k: 'V', label: 'Volume of solution', min: 50, max: 1000, step: 10, unit: 'mL', dec: 0, val: 100 }], info: 'Add solute until the solution is saturated.', draw: flaskDraw, place: W => [150 + (fl(W).length % 3) * 200, 300] },
      dil: { name: () => 'Dilution', icon: '💧', w: 230, h: 140, defaults: { dye: 'cuso4', C1: 1, V1: 10, V2: 100 }, props: [{ k: 'dye', label: 'Stock solution', type: 'select', options: [['cuso4', 'Copper(II) sulfate (blue)'], ['kmno4', 'Potassium permanganate (purple)']], val: 'cuso4' }, { k: 'C1', label: 'Stock concentration C₁', min: 0.05, max: 2, step: 0.05, unit: 'mol/L', dec: 2, val: 1 }, { k: 'V1', label: 'Volume taken V₁', min: 1, max: 100, step: 1, unit: 'mL', dec: 0, val: 10 }, { k: 'V2', label: 'Final volume V₂', min: 50, max: 1000, step: 10, unit: 'mL', dec: 0, val: 100 }], info: 'Pipette V₁ of stock into a volumetric flask and make up to V₂ with water.', draw: dilDraw, place: () => [700, 150] }
    },
    catalog: [{ type: 'flask', name: 'Flask of solution', icon: '🧪', desc: 'Dissolve a solute; get concentration', tags: 'dissolve solute molarity saturated' }, { type: 'dil', name: 'Dilution', icon: '💧', desc: 'Stock → diluted solution', max: 1, tags: 'c1v1 diluting pipette' }],
    init(W) { W.add('flask', 150, 300, { sol: 'nacl', m: 5.844, V: 100 }); W.add('dil', 700, 150); },
    onAdd(W, it) { if (it.type === 'flask') { it.x = 150 + ((fl(W).length - 1) % 3) * 200; it.y = 300; } else { it.x = 700; it.y = 150; } },
    sim() { },
    messages(W) { const r = [], f = fl(W); if (!f.length && !dl(W)) return [{ t: 'info', m: 'Add a flask or a dilution.' }]; f.forEach(x => { const c = fcalc(x); if (c.sat) r.push({ t: 'warn', m: `${SOLUTES[x.p.sol][0]}: <b>saturated</b>. Only ${fmt(c.lim, 1)} g can dissolve in ${fmt(x.p.V, 0)} mL at 25 °C; ${fmt(c.undissolved, 1)} g stays undissolved.` }); else if (c.diss > 0.85 * c.lim) r.push({ t: 'info', m: `${SOLUTES[x.p.sol][0]} is close to saturation (${fmt(c.diss / c.lim * 100, 0)} % of the limit).` }); if (x.p.sol === 'naoh') r.push({ t: 'info', m: 'Sodium hydroxide is corrosive: this is a simulation only.' }); }); const d = dl(W); if (d) { if (d.p.V1 > d.p.V2) r.push({ t: 'warn', m: 'V₁ is larger than V₂: you cannot make up to a smaller final volume.' }); } return r.slice(0, 4); },
    readouts(W) { const o = [], f = fSel(W), d = dl(W); if (f) { const c = fcalc(f), s = SOLUTES[f.p.sol]; o.push({ l: 'Solute', v: `${s[0]} (${sub(s[1].replace('.', '·'))})` }, { l: 'Molar mass', v: c.M, u: 'g/mol', d: 2 }, { l: 'Moles dissolved', v: c.n, u: 'mol', d: 4 }, { l: 'Molarity', v: c.C, u: 'mol/L', d: 4 }, { l: 'Mass concentration', v: c.gL, u: 'g/L', d: 2 }, { l: 'Percentage (w/v)', v: c.pct, u: '%', d: 2 }, { l: 'Parts per million', v: c.ppm, u: 'mg/L', d: 0 }, { l: 'Solubility limit (25 °C, approx.)', v: c.lim, u: 'g in this volume', d: 1 }, { l: 'State', v: c.sat ? 'saturated — ' + fmt(c.undissolved, 1) + ' g undissolved' : 'unsaturated (' + fmt(c.diss / c.lim * 100, 0) + ' % of the limit)' }); } if (d && d.p.V1 <= d.p.V2) { const q = dcalc(d); o.push({ l: 'Dilution: moles transferred', v: q.nTr, u: 'mol', d: 5 }, { l: 'Dilution: new concentration C₂', v: q.C2, u: 'mol/L', d: 4 }, { l: 'Dilution factor', v: q.df, d: 1 }, { l: 'Water to add', v: q.water, u: 'mL', d: 0 }); } return o; },
    live(W) { const r = [], f = fSel(W), d = dl(W); if (f) { const c = fcalc(f); r.push(`n = ${fmt(c.diss, 3)} g ÷ ${fmt(c.M, 2)} g/mol = ${fmt(c.n, 4)} mol → C = ${fmt(c.n, 4)} ÷ ${fmt(c.V, 3)} L = <b>${fmt(c.C, 3)} mol/L</b>`); } if (d && d.p.V1 <= d.p.V2) { const q = dcalc(d); r.push(`C₂ = C₁V₁ ÷ V₂ = ${fmt(d.p.C1, 2)} × ${fmt(d.p.V1, 0)} ÷ ${fmt(d.p.V2, 0)} = <b>${fmt(q.C2, 4)} mol/L</b>`); } return r; },
    graphs: [{ id: 'mc', title: 'Concentration against mass dissolved — press 📍 Record', x: 'mass (g)', y: 'molarity (mol/L)', manual: true, points: true, series: [{ n: 'C', c: '#4ade80' }], sample(W) { const f = fSel(W); if (!f) return null; const c = fcalc(f); return [Math.round(f.p.m * 10) / 10, c.C]; } }],
    guided: {
      objective: 'Make a 1.00 M solution of sodium chloride, then dilute it.', setup: W => { W.add('flask', 150, 300, { sol: 'nacl', m: 5.844, V: 100 }); W.add('dil', 700, 150, { dye: 'cuso4', C1: 1, V1: 10, V2: 100 }); },
      steps: [{ t: 'A flask has 5.844 g NaCl in 100 mL. Predict its molarity (M(NaCl) = 58.44 g/mol).', predict: { q: '5.844 g NaCl in 100 mL has a concentration of…', opts: ['1.00 mol/L', '0.10 mol/L', '10 mol/L'], a: 0, why: 'n = 5.844 ÷ 58.44 = 0.100 mol; C = 0.100 ÷ 0.100 L = 1.00 mol/L.' }, ok: W => fl(W).length >= 1 },
        { t: 'Change the mass to 11.7 g and Record; then 17.5 g and Record. Concentration is proportional to mass.', ok: W => (W.graph.mc || []).length >= 2 },
        { t: 'Increase the mass towards 40 g: at about 36 g per 100 mL the solution saturates.', ok: W => { const f = fSel(W); return f && fcalc(f).sat; } },
        { t: 'In the dilution, 10 mL of 1.00 M stock is made up to 100 mL. Predict the new concentration.', ok: W => !!dl(W) },
        { t: 'Change V₂ to 500 mL. What is the dilution factor and the new concentration?', ok: W => dl(W) && dl(W).p.V2 === 500 }],
      done: () => 'Concentration = moles ÷ volume. Diluting keeps the moles constant, so C₁V₁ = C₂V₂ and the colour fades.'
    },
    quiz: [{ q: '4.00 g of NaOH (M = 40.0 g/mol) is dissolved to make 500 mL of solution. Its molarity is…', opts: ['0.200 mol/L', '0.0100 mol/L', '2.00 mol/L'], a: 0, why: 'n = 4.00 ÷ 40.0 = 0.100 mol; C = 0.100 ÷ 0.500 L = 0.200 mol/L.' }, { q: '25 mL of 2.0 M acid is diluted to 100 mL. The new concentration is…', opts: ['0.50 M', '8.0 M', '0.25 M'], a: 0, why: 'C₂ = 2.0 × 25 ÷ 100 = 0.50 M.' }, { q: 'A solution that cannot dissolve any more solute at a given temperature is…', opts: ['saturated', 'dilute', 'concentrated but unsaturated'], a: 0, why: 'That is the definition of saturated.' }]
  });
})();
