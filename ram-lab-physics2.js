/* RAM LAB — Physics Lab, part 2 (load after ram-lab-physics.js):
   motion & force, energy (pendulum), work & power, pressure & buoyancy, electromagnetic induction, electromagnets, heat & expansion, optics. */
(function () {
  'use strict';
  const RL = window.RamLab; if (!RL) return;
  const { clamp, fmt } = RL.util, G = 9.8;
  const L = (x1, y1, x2, y2, c, w, d) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${c || '#e8eeff'}" stroke-width="${w || 3}" stroke-linecap="round"${d ? ` stroke-dasharray="${d}"` : ''}/>`;
  const TX = (x, y, t, o) => `<text x="${x}" y="${y}" text-anchor="${(o && o.a) || 'middle'}" font-size="${(o && o.s) || 12}" font-weight="${(o && o.w) || 700}" fill="${(o && o.c) || '#fff'}" pointer-events="none">${t}</text>`;
  const rad = d => d * Math.PI / 180;

  /* ============================ MOTION, FORCE & ACCELERATION ============================ */
  const MV = { x0: 90, L: 8, px: 70 };
  function mvGeom(W) { const th = rad(W.params.theta), u = [Math.cos(th), -Math.sin(th)], y0 = 160 + Math.sin(th) * 650; return { th, u, p0: [MV.x0, y0], pul: [MV.x0 + u[0] * (MV.L * MV.px + 90), y0 + u[1] * (MV.L * MV.px + 90)] }; }
  RL.register({
    id: 'motion', lab: 'physics', topic: 'Mechanics', title: 'Force, Mass & Acceleration', icon: '🛒', level: 'Beginner', model: 'full',
    assumptions: 'Newton’s second law solved numerically (small time steps). Light string, frictionless pulley, constant friction coefficient (static = kinetic). Air resistance ignored.',
    objective: 'Find how acceleration depends on the pulling force and the mass, and include friction and slope.',
    theory: '<p><b>Newton’s second law</b>: the resultant force on an object equals mass × acceleration, F = ma. Here the hanging mass pulls the trolley along a track. Friction and the slope’s gravity component reduce the resultant force.</p>',
    formulas: ['F = m a', 'a = (m₂g − m₁g sinθ − μm₁g cosθ) / (m₁ + m₂)', 'v = u + at', 's = ut + ½at²'],
    fixedView: true, params: [{ k: 'theta', label: 'Slope angle', min: 0, max: 30, step: 1, unit: '°', val: 0 }, { k: 'mu', label: 'Friction coefficient μ', min: 0, max: 0.6, step: 0.02, unit: '', val: 0.1 }],
    types: {
      trolley: { name: () => 'Trolley', icon: '🛒', w: 76, h: 44, fixed: true, defaults: { m: 1 }, props: [{ k: 'm', label: 'Trolley mass', min: 0.2, max: 5, step: 0.1, unit: 'kg', val: 1 }], info: 'The trolley rides on the track. Change its mass here.',
        draw: (it, W) => `<g transform="rotate(${-W.params.theta})"><rect x="-34" y="-14" width="68" height="22" rx="5" fill="#4cc9f0" stroke="#e8eeff" stroke-width="2.5"/><circle cx="-20" cy="12" r="7" fill="#222" stroke="#e8eeff" stroke-width="2"/><circle cx="20" cy="12" r="7" fill="#222" stroke="#e8eeff" stroke-width="2"/>${TX(0, 2, fmt(it.p.m, 1) + ' kg', { c: '#06122e', s: 12 })}</g>` },
      hanger: { name: it => 'Hanging mass ' + fmt(it.p.m, 2) + ' kg', icon: '⚖️', w: 50, h: 56, fixed: true, defaults: { m: 0.3 }, props: [{ k: 'm', label: 'Hanging mass', min: 0.05, max: 2, step: 0.05, unit: 'kg', val: 0.3 }], info: 'Hangs over the pulley and pulls the trolley up the track.',
        draw: (it, W) => { const g = mvGeom(W); return `<line x1="0" y1="${-26}" x2="0" y2="${-(it.y - g.pul[1] - 14)}" stroke="#e8eeff" stroke-width="2"/><rect x="-20" y="-10" width="40" height="34" rx="4" fill="#ffd23f" stroke="#e8eeff" stroke-width="2.5"/>${TX(0, 13, fmt(it.p.m, 2) + ' kg', { c: '#2a1d00', s: 11 })}`; } }
    },
    catalog: [{ type: 'trolley', name: 'Trolley', icon: '🛒', desc: 'Mass on wheels', max: 1, tags: 'cart mass' }, { type: 'hanger', name: 'Hanging mass', icon: '⚖️', desc: 'Pulls the trolley over a pulley', max: 1, tags: 'weight force pulley' }],
    init(W) { W.add('trolley', 300, 400, { m: 1 }); W.add('hanger', 700, 300, { m: 0.3 }); },
    bg(W) {
      const g = mvGeom(W), e = [g.p0[0] + g.u[0] * MV.L * MV.px, g.p0[1] + g.u[1] * MV.L * MV.px], n = [-g.u[1], g.u[0]];
      let s = `<polygon points="${g.p0.join(',')} ${e.join(',')} ${e[0]},${Math.max(g.p0[1], e[1]) + 40} ${g.p0[0]},${Math.max(g.p0[1], e[1]) + 40}" fill="rgba(120,140,200,.18)" stroke="#8fa6e8" stroke-width="3"/>`;
      for (let i = 0; i <= MV.L; i++) { const px = g.p0[0] + g.u[0] * i * MV.px, py = g.p0[1] + g.u[1] * i * MV.px; s += L(px, py, px - n[0] * 10, py - n[1] * 10, '#9fb4ff', 2) + TX(px - n[0] * 24, py - n[1] * 24 + 4, i + ' m', { s: 10.5, c: '#9fb4ff' }); }
      s += `<circle cx="${g.pul[0]}" cy="${g.pul[1] - 14}" r="14" fill="#26335e" stroke="#e8eeff" stroke-width="3"/>` + L(e[0] + 20 * g.u[0], e[1] + 20 * g.u[1], g.pul[0], g.pul[1] - 28, '#e8eeff', 1.5, '3 4');
      const m = W.d.m; if (W.find('trolley')[0]) { const t = W.find('trolley')[0]; s += L(t.x, t.y - 14, g.pul[0] - 14, g.pul[1] - 14, '#e8eeff', 2); }
      return s;
    },
    sim(W, dt) {
      const m = W.d.m || (W.d.m = { s: 0, v: 0, a: 0, F: 0, Ff: 0, T: 0 }), g = mvGeom(W), tr = W.find('trolley')[0], hg = W.find('hanger')[0]; if (!tr) return;
      const m1 = tr.p.m, m2 = hg ? hg.p.m : 0, th = g.th, mu = W.params.mu, Fd = m2 * G - m1 * G * Math.sin(th), fk = mu * m1 * G * Math.cos(th);
      const step = (h) => { let a; if (m.v === 0) { a = Math.abs(Fd) <= fk ? 0 : (Fd - Math.sign(Fd) * fk) / (m1 + m2); } else a = (Fd - Math.sign(m.v) * fk) / (m1 + m2); const vn = m.v + a * h; if (m.v !== 0 && Math.sign(vn) !== Math.sign(m.v)) { m.v = 0; a = 0; } else m.v = vn; m.s += m.v * h; m.a = a; if (m.s >= MV.L) { m.s = MV.L; if (m.v > 0) m.v = 0; } if (m.s <= 0) { m.s = 0; if (m.v < 0) m.v = 0; } };
      if (W.running && dt > 0) { const n = Math.ceil(dt / 0.005); for (let i = 0; i < n; i++) step(dt / n); } else { if (m.v === 0) m.a = Math.abs(Fd) <= fk ? 0 : (Fd - Math.sign(Fd) * fk) / (m1 + m2); }
      m.F = Fd; m.Ff = fk; m.T = m2 ? m2 * (G - m.a) : 0;
      tr.x = g.p0[0] + g.u[0] * (m.s * MV.px + 50) + g.u[1] * 24; tr.y = g.p0[1] + g.u[1] * (m.s * MV.px + 50) - g.u[0] * 24;
      if (hg) { hg.x = g.pul[0]; hg.y = g.pul[1] + 40 + m.s * 34; }
    },
    reset(W) { W.d.m = null; },
    messages(W) { const r = []; if (!W.find('trolley')[0]) return [{ t: 'warn', m: 'Add a trolley.' }]; const m = W.d.m, hg = W.find('hanger')[0]; if (!hg && W.params.theta === 0) r.push({ t: 'info', m: 'Nothing pulls the trolley. Add a hanging mass or tilt the track.' }); if (m && m.a === 0 && m.v === 0 && W.running && W.t > 1) r.push({ t: 'warn', m: 'Friction is too large for the pulling force: the trolley does not move.' }); if (m && m.s >= MV.L - 1e-6) r.push({ t: 'ok', m: 'The trolley reached the end of the track.' }); return r; },
    readouts(W) { const m = W.d.m; if (!m) return []; return [{ l: 'Acceleration', v: m.a, u: 'm/s²', d: 3 }, { l: 'Speed', v: m.v, u: 'm/s', d: 2 }, { l: 'Distance', v: m.s, u: 'm', d: 2 }, { l: 'Driving force', v: m.F, u: 'N', d: 2 }, { l: 'Friction', v: m.Ff, u: 'N', d: 2 }, { l: 'String tension', v: m.T, u: 'N', d: 2 }]; },
    live(W) { const tr = W.find('trolley')[0], hg = W.find('hanger')[0], m = W.d.m; if (!tr || !m) return []; return [`F<sub>net</sub> = ${fmt(Math.max(0, Math.abs(m.F) - m.Ff) * Math.sign(m.F), 2)} N, m<sub>total</sub> = ${fmt(tr.p.m + (hg ? hg.p.m : 0), 2)} kg`, `a = F ÷ m = <b>${fmt(m.a, 3)} m/s²</b>`]; },
    graphs: [{ id: 'vt', title: 'Speed v against time t', x: 'Time t (s)', y: 'Speed v (m/s)', series: [{ n: 'v', c: '#4cc9f0' }], sample(W) { return W.d.m ? [W.t, W.d.m.v] : null; } }, { id: 'st', title: 'Distance s against time t', x: 'Time t (s)', y: 'Distance s (m)', series: [{ n: 's', c: '#ffd23f' }], sample(W) { return W.d.m ? [W.t, W.d.m.s] : null; } }],
    guided: {
      objective: 'Show that acceleration is proportional to the pulling force (for a fixed total mass).', setup: W => { W.add('trolley', 300, 400, { m: 1 }); W.add('hanger', 700, 300, { m: 0.2 }); W.params.theta = 0; W.params.mu = 0; },
      steps: [{ t: 'Place a trolley and a hanging mass. Set friction μ = 0 and slope 0° in Controls (or “Set up for me”).', predict: { q: 'If you double the hanging mass (trolley fixed), the acceleration will…', opts: ['more than double', 'exactly double', 'increase, but less than double'], a: 2, why: 'a = m₂g/(m₁+m₂): the extra hanging mass also has to be accelerated, so a rises by less than double.' }, ok: W => W.count('trolley') && W.count('hanger') },
        { t: 'Press ▶ Run. Watch speed grow steadily: a straight v–t graph means constant acceleration. Note a in Results.', ok: W => W.t > 2 },
        { t: 'Reset, make the hanging mass 0.4 kg and run again. Compare the accelerations.', ok: W => W.find('hanger')[0] && W.find('hanger')[0].p.m >= 0.35 && W.t > 1 },
        { t: 'Finally add friction (μ = 0.2) or tilt the track and see how a changes.', ok: W => W.params.mu >= 0.15 || W.params.theta > 0 }],
      done: W => 'a = m₂g/(m₁+m₂) when there is no friction. Force and acceleration go together; mass slows acceleration.'
    },
    quiz: [{ q: 'A resultant force of 12 N acts on a 3 kg trolley. Its acceleration is…', opts: ['4 m/s²', '36 m/s²', '0.25 m/s²'], a: 0, why: 'a = F/m = 12 ÷ 3.' }, { q: 'On a v–t graph, constant acceleration appears as…', opts: ['a straight sloping line', 'a horizontal line', 'a curve'], a: 0, why: 'v changes by equal amounts each second.' }]
  });

  /* ============================ PENDULUM — CONSERVATION OF ENERGY ============================ */
  const PD = { px: 140, ox: 500, oy: 70 };
  RL.register({
    id: 'pendulum', lab: 'physics', topic: 'Work, Energy & Power', title: 'Energy of a Pendulum', icon: '🕰️', level: 'Intermediate', model: 'full',
    assumptions: 'Full nonlinear pendulum equation θ″ = −(g/L) sinθ − cθ′ solved numerically (no small-angle approximation). Light string, point mass. “Air resistance” is a simple damping term.',
    objective: 'See kinetic and potential energy change into each other, with the total staying constant when there is no friction.',
    theory: '<p>At the highest point the bob has maximum <b>potential energy</b> and zero speed. At the lowest point the potential energy is smallest and the <b>kinetic energy</b> is maximum. Without friction the total <b>mechanical energy is conserved</b>.</p>',
    formulas: ['KE = ½mv²', 'PE = mgh = mgL(1 − cosθ)', 'E = KE + PE', 'T ≈ 2π√(L/g)'],
    fixedView: true, animated: false,
    params: [{ k: 'Ls', label: 'String length', min: 0.5, max: 3, step: 0.1, unit: 'm', val: 2 }, { k: 'th0', label: 'Release angle', min: 5, max: 85, step: 1, unit: '°', val: 40 }, { k: 'damp', label: 'Air resistance (damping)', min: 0, max: 0.3, step: 0.01, unit: '/s', val: 0 }],
    types: { bob: { name: it => 'Bob ' + fmt(it.p.m, 1) + ' kg', icon: '⚫', w: 50, h: 50, fixed: true, defaults: { m: 1 }, props: [{ k: 'm', label: 'Bob mass', min: 0.1, max: 5, step: 0.1, unit: 'kg', val: 1 }], info: 'Mass changes the energy values, but not the period or the speed (try it!).',
      draw: it => `<circle r="22" fill="#ff6b6b" stroke="#e8eeff" stroke-width="3"/><circle cx="-7" cy="-7" r="6" fill="rgba(255,255,255,.5)"/>` } },
    catalog: [{ type: 'bob', name: 'Pendulum bob', icon: '⚫', desc: 'Mass on a string', max: 1, tags: 'mass swing' }],
    init(W) { W.add('bob', 500, 300, { m: 1 }); },
    onParam(W) { W.d.pd = null; },
    bg(W) { const S = PD.px * W.params.Ls; return `<rect x="380" y="52" width="240" height="14" rx="6" fill="#6b7aa8" stroke="#e8eeff" stroke-width="2"/><path d="M${PD.ox - S * Math.sin(rad(W.params.th0))} ${PD.oy + S * Math.cos(rad(W.params.th0))} A${S} ${S} 0 0 0 ${PD.ox + S * Math.sin(rad(W.params.th0))} ${PD.oy + S * Math.cos(rad(W.params.th0))}" fill="none" stroke="rgba(255,255,255,.2)" stroke-dasharray="5 6"/><line x1="${PD.ox}" y1="${PD.oy}" x2="${PD.ox}" y2="${PD.oy + S + 40}" stroke="rgba(255,255,255,.25)" stroke-dasharray="3 5"/>`; },
    sim(W, dt) {
      const b = W.find('bob')[0]; if (!b) return; let p = W.d.pd; const Lm = W.params.Ls;
      if (!p) p = W.d.pd = { th: rad(W.params.th0), w: 0, cross: [], last: rad(W.params.th0) };
      if (W.running && dt > 0) { const n = Math.ceil(dt / 0.002), h = dt / n; for (let i = 0; i < n; i++) { const acc = -(G / Lm) * Math.sin(p.th) - W.params.damp * p.w; p.w += acc * h; p.th += p.w * h; } if (p.last > 0 && p.th <= 0) p.cross.push(W.t); p.last = p.th; }
      const S = PD.px * Lm; b.x = PD.ox + S * Math.sin(p.th); b.y = PD.oy + S * Math.cos(p.th);
      const v = Lm * p.w, m = b.p.m; p.KE = 0.5 * m * v * v; p.PE = m * G * Lm * (1 - Math.cos(p.th)); p.E = p.KE + p.PE; p.v = v;
      if (p.cross.length >= 2) p.T = p.cross[p.cross.length - 1] - p.cross[p.cross.length - 2];
    },
    over(W) {
      const p = W.d.pd; if (!p) return ''; const E0 = Math.max(p.E, 1e-6), bx = 800, by = 420, H = 200, mx = Math.max(p.E, W.find('bob')[0] ? 0.5 * W.find('bob')[0].p.m * 0 + W.find('bob')[0].p.m * G * W.params.Ls * (1 - Math.cos(rad(W.params.th0))) : 1, 1e-6);
      const bar = (i, val, c, n) => `<rect x="${bx + i * 62}" y="${by - H * val / mx}" width="44" height="${H * val / mx}" fill="${c}" stroke="#e8eeff" stroke-width="2"/>` + TX(bx + i * 62 + 22, by + 16, n, { s: 11 }) + TX(bx + i * 62 + 22, by - H * val / mx - 5, fmt(val, 1), { s: 10.5, c: '#ffe9a8' });
      return L(bx - 8, by, bx + 190, by, '#9fb4ff', 2) + bar(0, p.KE, '#4ade80', 'KE') + bar(1, p.PE, '#ffd23f', 'PE') + bar(2, p.E, '#4cc9f0', 'Total');
    },
    reset(W) { W.d.pd = null; },
    readouts(W) { const p = W.d.pd; if (!p) return []; const r = [{ l: 'Kinetic energy', v: p.KE, u: 'J', d: 2 }, { l: 'Potential energy', v: p.PE, u: 'J', d: 2 }, { l: 'Total energy', v: p.E, u: 'J', d: 2 }, { l: 'Speed', v: Math.abs(p.v), u: 'm/s', d: 2 }, { l: 'Height above lowest point', v: W.params.Ls * (1 - Math.cos(p.th)), u: 'm', d: 3 }]; if (p.T) r.push({ l: 'Measured period', v: p.T, u: 's', d: 3 }); r.push({ l: 'Small-angle T = 2π√(L/g)', v: 2 * Math.PI * Math.sqrt(W.params.Ls / G), u: 's', d: 3 }); return r; },
    live(W) { const p = W.d.pd, b = W.find('bob')[0]; if (!p || !b) return []; return [`KE + PE = ${fmt(p.KE, 2)} + ${fmt(p.PE, 2)} = <b>${fmt(p.E, 2)} J</b>`, `PE<sub>max</sub> = mgh = ${fmt(b.p.m, 1)}×9.8×${fmt(W.params.Ls * (1 - Math.cos(rad(W.params.th0))), 3)} = ${fmt(b.p.m * G * W.params.Ls * (1 - Math.cos(rad(W.params.th0))), 2)} J`]; },
    graphs: [{ id: 'en', title: 'Energies against time', x: 'Time t (s)', y: 'Energy (J)', series: [{ n: 'KE', c: '#4ade80' }, { n: 'PE', c: '#ffd23f' }, { n: 'Total', c: '#4cc9f0' }], sample(W) { const p = W.d.pd; return p ? [W.t, p.KE, p.PE, p.E] : null; } }],
    guided: { objective: 'Verify conservation of energy and see how damping removes mechanical energy.', setup: W => { W.add('bob', 500, 300, { m: 1 }); },
      steps: [{ t: 'Press ▶ Run. Watch KE and PE swap: where is KE biggest? (the bottom)', predict: { q: 'At the lowest point of the swing, the bob has…', opts: ['maximum KE, minimum PE', 'maximum PE, minimum KE', 'equal KE and PE'], a: 0, why: 'All the potential energy has been converted into kinetic energy.' }, ok: W => W.t > 3 }, { t: 'Look at the Total in the graph: it stays flat (no air resistance).', ok: W => W.t > 6 }, { t: 'Reset, then set Air resistance to 0.1 /s and run. The total now decays: mechanical energy is turned into heat.', ok: W => W.params.damp > 0 && W.t > 3 }],
      done: W => 'Without friction E = KE + PE is constant. With damping the energy is gradually transformed into heat in the air.' },
    quiz: [{ q: 'Doubling the mass of the bob (same length, same angle) changes the period…', opts: ['not at all', 'doubles it', 'halves it'], a: 0, why: 'T = 2π√(L/g) does not depend on mass.' }, { q: 'The total mechanical energy of a swinging pendulum without friction…', opts: ['stays constant', 'increases', 'decreases'], a: 0, why: 'Conservation of mechanical energy.' }]
  });

  /* ============================ WORK & POWER (motor lifting a crate) ============================ */
  RL.register({
    id: 'power', lab: 'physics', topic: 'Work, Energy & Power', title: 'Work, Power & Efficiency', icon: '🏗️', level: 'Beginner', model: 'simplified',
    assumptions: 'The motor lifts the crate at a constant speed v = (η × P) ÷ (mg) (steady speed, no acceleration phase, no rope mass). Efficiency η is the fraction of electrical input power that becomes useful lifting power.',
    objective: 'Calculate work done and power when lifting a load, and understand efficiency.',
    theory: '<p><b>Work</b> done lifting a load = force × distance = mgh. <b>Power</b> is the rate of doing work, P = W/t. No machine is 100% efficient: efficiency = useful output ÷ total input.</p>',
    formulas: ['W = F × d = mgh', 'P = W / t', 'η = useful output ÷ input × 100%'],
    fixedView: true, animated: false, params: [],
    types: { motor: { name: it => 'Motor ' + it.p.P + ' W', icon: '⚙️', w: 90, h: 70, defaults: { P: 500, eff: 80 }, props: [{ k: 'P', label: 'Input power', min: 100, max: 2000, step: 50, unit: 'W', val: 500 }, { k: 'eff', label: 'Efficiency', min: 20, max: 100, step: 5, unit: '%', val: 80 }], fixed: true, info: 'Electric motor at the top of the crane. Increase the power for faster lifting.',
      draw: it => `<rect x="-40" y="-30" width="80" height="60" rx="10" fill="#2a3a7a" stroke="#ffd23f" stroke-width="3"/><circle r="18" fill="#1a2550" stroke="#e8eeff" stroke-width="2.5"/><path d="M-14 0H14M0 -14V14M-10 -10L10 10M10 -10L-10 10" stroke="#ffd23f" stroke-width="2"/>${TX(0, 46, it.p.P + ' W · ' + it.p.eff + '%', { c: '#ffe9a8', s: 11.5 })}` },
      crate: { name: it => 'Crate ' + it.p.m + ' kg', icon: '📦', w: 70, h: 60, defaults: { m: 20 }, props: [{ k: 'm', label: 'Crate mass', min: 1, max: 100, step: 1, unit: 'kg', val: 20 }], fixed: true, info: 'The load being lifted.',
        draw: it => `<rect x="-28" y="-24" width="56" height="48" rx="3" fill="#c98a4b" stroke="#5a3a14" stroke-width="3"/><path d="M-28 -8H28M-28 8H28" stroke="#5a3a14" stroke-width="2"/>${TX(0, 5, it.p.m + ' kg', { c: '#2a1707', s: 13 })}` } },
    catalog: [{ type: 'motor', name: 'Electric motor', icon: '⚙️', desc: 'Lifts the crate (set power & efficiency)', max: 1, tags: 'crane engine' }, { type: 'crate', name: 'Crate', icon: '📦', desc: 'The load to lift', max: 1, tags: 'mass load box' }],
    init(W) { W.add('motor', 400, 70); W.add('crate', 400, 450, { m: 20 }); },
    bg() { return `<rect x="560" y="60" width="14" height="420" fill="#4a5a9a"/><rect x="320" y="52" width="260" height="12" fill="#4a5a9a"/><rect x="300" y="480" width="360" height="14" rx="4" fill="#26335e" stroke="#9fb4ff" stroke-width="2"/>` + [0, 2, 4, 6, 8, 10].map(h => L(600, 450 - h * 36, 616, 450 - h * 36, '#9fb4ff', 2) + TX(640, 454 - h * 36, h + ' m', { s: 10.5, c: '#9fb4ff' })).join(''); },
    sim(W, dt) {
      const mo = W.find('motor')[0], cr = W.find('crate')[0]; if (!cr) return; const p = W.d.pw || (W.d.pw = { h: 0, t: 0, Win: 0, v: 0 });
      if (mo) { const Pout = mo.p.P * mo.p.eff / 100, v = clamp(Pout / (cr.p.m * G), 0, 4); p.v = p.h >= 10 ? 0 : v; p.Pout = Pout; if (W.running && dt > 0 && p.h < 10) { p.h = Math.min(10, p.h + v * dt); p.t += dt; p.Win += mo.p.P * dt; } } else { p.v = 0; p.Pout = 0; }
      cr.x = 400; cr.y = 450 - p.h * 36;
    },
    over(W) { const cr = W.find('crate')[0]; return cr ? L(400, 70, 400, cr.y - 24, '#e8eeff', 2.5) : ''; },
    reset(W) { W.d.pw = null; },
    messages(W) { const r = []; if (!W.find('motor')[0]) r.push({ t: 'warn', m: 'Add a motor: nothing can lift the crate yet.' }); const p = W.d.pw; if (p && p.h >= 10) r.push({ t: 'ok', m: 'Lifted 10 m! Check the work and efficiency.' }); return r; },
    readouts(W) { const p = W.d.pw, cr = W.find('crate')[0]; if (!p || !cr) return []; const Wk = cr.p.m * G * p.h; return [{ l: 'Height lifted', v: p.h, u: 'm', d: 2 }, { l: 'Work done (useful)', v: Wk, u: 'J', d: 0 }, { l: 'Useful power', v: p.Pout || 0, u: 'W', d: 0 }, { l: 'Lifting speed', v: p.v, u: 'm/s', d: 2 }, { l: 'Energy input', v: p.Win, u: 'J', d: 0 }, { l: 'Efficiency (measured)', v: p.Win > 0 ? Wk / p.Win * 100 : 0, u: '%', d: 1 }]; },
    live(W) { const p = W.d.pw, cr = W.find('crate')[0]; if (!p || !cr) return []; return [`W = mgh = ${fmt(cr.p.m, 0)}×9.8×${fmt(p.h, 2)} = <b>${fmt(cr.p.m * G * p.h, 0)} J</b>`, p.t > 0 ? `P = W/t = ${fmt(cr.p.m * G * p.h, 0)} ÷ ${fmt(p.t, 1)} = <b>${fmt(cr.p.m * G * p.h / p.t, 0)} W</b>` : 'Run to measure the power.']; },
    graphs: [{ id: 'wt', title: 'Work done against time', x: 'Time t (s)', y: 'Work W (J)', series: [{ n: 'W', c: '#4ade80' }], sample(W) { const p = W.d.pw, cr = W.find('crate')[0]; return p && cr ? [W.t, cr.p.m * G * p.h] : null; } }],
    guided: { objective: 'Measure the work done and the power of a lifting motor.', setup: W => { W.add('motor', 400, 70); W.add('crate', 400, 450, { m: 20 }); },
      steps: [{ t: 'Keep the motor at 500 W, 80 % efficiency and the crate at 20 kg. Predict the lifting speed.', predict: { q: 'Useful power = 400 W, weight = 196 N. The lifting speed is about…', opts: ['2 m/s', '0.5 m/s', '8 m/s'], a: 0, why: 'v = P/(mg) = 400 ÷ 196 ≈ 2.04 m/s.' }, ok: W => W.count('motor') && W.count('crate') }, { t: 'Press ▶ Run and read work, power and efficiency.', ok: W => W.t > 1 }, { t: 'Reset: double the crate mass to 40 kg. The lifting is slower (same power), but the work done for 10 m is twice as big.', ok: W => W.find('crate')[0] && W.find('crate')[0].p.m >= 40 && W.t > 1 }],
      done: W => 'Work depends on the load and height; power tells you how quickly the work is done.' },
    quiz: [{ q: 'A 50 kg load is lifted 4 m. The work done against gravity (g = 10) is…', opts: ['2000 J', '200 J', '12.5 J'], a: 0, why: 'W = mgh = 50 × 10 × 4.' }, { q: 'A machine takes in 500 J and gives out 400 J of useful work. Efficiency is…', opts: ['80%', '125%', '20%'], a: 0, why: '400 ÷ 500 × 100.' }]
  });

  /* ============================ PRESSURE & BUOYANCY ============================ */
  const LIQ = { water: ['Water', 1000, '#3aa0ff'], oil: ['Vegetable oil', 920, '#e6c200'], brine: ['Salt water', 1200, '#5ad1d1'], mercury: ['Mercury', 13600, '#b8c0cc'] };
  const MAT = { wood: ['Wood (pine)', 600], ice: ['Ice', 917], alu: ['Aluminium', 2700], iron: ['Iron', 7870], cork: ['Cork', 240], lead: ['Lead', 11340] };
  const TK = { x0: 300, x1: 700, top: 130, bottom: 520, surf: 190, pxm: 500 };
  RL.register({
    id: 'buoy', lab: 'physics', topic: 'Pressure & Fluids', title: 'Pressure & Buoyancy (Upthrust)', icon: '🛟', level: 'Intermediate', model: 'full',
    assumptions: 'Archimedes’ principle with ideal liquids at rest: upthrust = ρ_liquid × V_submerged × g (g = 9.8). Pressure P = P₀ + ρgh (P₀ = 101 kPa). Block size is drawn exaggerated, not to scale.',
    objective: 'Predict whether an object floats or sinks, and find upthrust, apparent weight and pressure at depth.',
    theory: '<p><b>Pressure in a liquid</b> increases with depth: P = ρgh. <b>Upthrust</b> equals the weight of the liquid displaced (Archimedes). An object floats if its average density is less than the liquid’s.</p>',
    formulas: ['P = ρ g h', 'Upthrust U = ρ<sub>liq</sub> V<sub>sub</sub> g', 'Float if ρ<sub>obj</sub> < ρ<sub>liq</sub>', 'Apparent weight = W − U'],
    fixedView: true, animated: true,
    params: [{ k: 'liq', label: 'Liquid', type: 'select', options: Object.keys(LIQ).map(k => [k, LIQ[k][0] + ' (' + LIQ[k][1] + ' kg/m³)']), val: 'water' }, { k: 'hold', label: 'Hold block under the surface (spring balance)', type: 'toggle', val: false }],
    types: {
      block: { name: it => MAT[it.p.mat][0] + ' block', icon: '🧱', w: 60, h: 60, fixed: true, defaults: { mat: 'wood', V: 200 }, props: [{ k: 'mat', label: 'Material', type: 'select', options: Object.keys(MAT).map(k => [k, MAT[k][0] + ' (' + MAT[k][1] + ' kg/m³)']), val: 'wood' }, { k: 'V', label: 'Volume', min: 50, max: 500, step: 10, unit: 'cm³', val: 200 }], info: 'Change the material and volume, then release or hold the block.',
        draw: it => { const s = bsz(it) / 2; return `<rect x="${-s}" y="${-s}" width="${2 * s}" height="${2 * s}" rx="4" fill="${matCol(it.p.mat)}" stroke="#e8eeff" stroke-width="3"/>${TX(0, 4, MAT[it.p.mat][1], { s: 11, c: '#0a0a0a' })}`; } },
      pgauge: { name: () => 'Pressure gauge', icon: '🧭', w: 70, h: 56, defaults: {}, info: 'Drag the gauge up and down inside the liquid to measure pressure at different depths.', draw: (it, W) => { const m = pg(it, W); return `<circle r="24" fill="#0d1a4a" stroke="#ffd23f" stroke-width="3.5"/>${TX(0, -3, fmt(m.gauge / 1000, 2), { s: 14, c: '#ffe9a8' })}${TX(0, 11, 'kPa', { s: 10 })}${TX(0, 42, 'h = ' + fmt(m.h * 100, 0) + ' cm', { s: 11, c: '#9fc4ff' })}`; } } },
    catalog: [{ type: 'block', name: 'Solid block', icon: '🧱', desc: 'Choose its material and volume', max: 1, tags: 'object cube wood iron ice' }, { type: 'pgauge', name: 'Pressure gauge', icon: '🧭', desc: 'Measures pressure at depth', max: 1, tags: 'manometer depth' }],
    init(W) { W.add('block', 500, 150, { mat: 'wood', V: 200 }); W.add('pgauge', 620, 380); },
    bg(W) { const l = LIQ[W.params.liq]; return `<rect x="${TK.x0}" y="${TK.surf}" width="${TK.x1 - TK.x0}" height="${TK.bottom - TK.surf}" fill="${l[2]}" opacity=".35"/><path d="M${TK.x0} ${TK.top}V${TK.bottom}H${TK.x1}V${TK.top}" fill="none" stroke="#e8eeff" stroke-width="5" stroke-linejoin="round"/><path d="M${TK.x0} ${TK.surf}q25 -6 50 0t50 0t50 0t50 0t50 0t50 0t50 0t50 0" fill="none" stroke="#e8f4ff" stroke-width="3"/>` + [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6].map(h => L(TK.x1, TK.surf + h * TK.pxm, TK.x1 + 12, TK.surf + h * TK.pxm, '#9fb4ff', 2) + TX(TK.x1 + 38, TK.surf + h * TK.pxm + 4, (h * 100) + ' cm', { s: 10.5, c: '#9fb4ff' })).join(''); },
    sim(W, dt) {
      const b = W.find('block')[0]; if (!b) return; const l = LIQ[W.params.liq][1], rb = MAT[b.p.mat][1], s = bsz(b), st = W.d.b || (W.d.b = { y: b.y }), f = rb / l;
      let target; if (W.params.hold) target = TK.surf + s / 2 + 40; else if (f < 1) target = TK.surf + f * s - s / 2; else target = TK.bottom - s / 2;
      if (!W.d.released && !W.running && !W.params.hold) { /* waiting above the liquid */ target = TK.top - s / 2 - 10; }
      b.x = 500; st.y = dt > 0 ? st.y + (target - st.y) * Math.min(1, dt * 5) : st.y; if (dt === 0 && !W.d.init) { st.y = target; W.d.init = 1; } b.y = st.y;
      const sub = clamp((b.y + s / 2 - TK.surf) / s, 0, 1), V = b.p.V * 1e-6; st.sub = sub; st.W = rb * V * G; st.U = l * V * sub * G; st.state = W.params.hold ? 'held under the surface' : (b.y + s / 2 < TK.surf - 2 ? 'above the liquid' : (f < 1 ? 'floats' : 'sinks')); st.rb = rb; st.rl = l;
    },
    onRun(W) { W.d.released = true; }, onParam(W) { W.d.init = 0; },
    reset(W) { W.d.b = null; W.d.released = false; W.d.init = 0; },
    messages(W) { const b = W.find('block')[0], g = W.find('pgauge')[0], r = []; if (!b) r.push({ t: 'info', m: 'Add a solid block to test floating and sinking.' }); else { if (!W.d.released && !W.params.hold) r.push({ t: 'info', m: 'Press <b>▶ Run</b> to drop the block into the liquid.' }); } if (g) { const m = pg(g, W); if (!m.inLiq) r.push({ t: 'warn', m: 'The pressure gauge is not in the liquid. Drag it below the surface.' }); } return r; },
    readouts(W) { const s = W.d.b, g = W.find('pgauge')[0], r = []; if (s) { r.push({ l: 'Block density', v: s.rb, u: 'kg/m³', d: 0 }, { l: 'Liquid density', v: s.rl, u: 'kg/m³', d: 0 }, { l: 'Weight of block', v: s.W, u: 'N', d: 3 }, { l: 'Upthrust', v: s.U, u: 'N', d: 3 }, { l: 'Fraction submerged', v: s.sub * 100, u: '%', d: 0 }, { l: 'State', v: s.state }); if (W.params.hold) r.push({ l: 'Apparent weight', v: s.W - s.U, u: 'N', d: 3 }); } if (g) { const m = pg(g, W); r.push({ l: 'Depth of gauge', v: m.h * 100, u: 'cm', d: 1 }, { l: 'Gauge pressure ρgh', v: m.gauge / 1000, u: 'kPa', d: 2 }, { l: 'Absolute pressure', v: (m.gauge + 101325) / 1000, u: 'kPa', d: 1 }); } return r; },
    live(W) { const s = W.d.b, g = W.find('pgauge')[0], o = []; if (s) o.push(`U = ρVg = ${fmt(s.rl, 0)} × ${fmt(W.find('block')[0].p.V * 1e-6 * s.sub, 6)} × 9.8 = <b>${fmt(s.U, 3)} N</b>`); if (g) { const m = pg(g, W); o.push(`P = ρgh = ${fmt(s.rl || LIQ[W.params.liq][1], 0)} × 9.8 × ${fmt(m.h, 3)} = <b>${fmt(m.gauge, 0)} Pa</b>`); } return o; },
    graphs: [{ id: 'ph', title: 'Pressure against depth — press 📍 Record to plot', x: 'Depth h (cm)', y: 'Gauge pressure (kPa)', manual: true, points: true, series: [{ n: 'P', c: '#4cc9f0' }], sample(W) { const g = W.find('pgauge')[0]; if (!g) return null; const m = pg(g, W); return m.inLiq ? [Math.round(m.h * 1000) / 10, m.gauge / 1000] : null; } }],
    guided: { objective: 'Find out why objects float, and how pressure increases with depth.', setup: W => { W.add('block', 500, 150, { mat: 'wood', V: 200 }); W.add('pgauge', 620, 380); },
      steps: [{ t: 'With the wooden block and water, press ▶ Run and watch what happens.', predict: { q: 'Wood (600 kg/m³) is put in water (1000 kg/m³). It will…', opts: ['float, 60 % submerged', 'sink', 'float, 40 % submerged'], a: 0, why: 'Fraction submerged = ρ<sub>object</sub>/ρ<sub>liquid</sub> = 0.6.' }, ok: W => W.d.released }, { t: 'Change the material to iron: it sinks. Tick “Hold block under the surface” to read its apparent weight on the spring balance.', ok: W => W.find('block')[0] && W.find('block')[0].p.mat === 'iron' }, { t: 'Drag the pressure gauge to 3 different depths and press 📍 Record each time. The graph is a straight line: P ∝ h.', ok: W => (W.graph.ph || []).length >= 3 }],
      done: W => 'Pressure = ρgh grows evenly with depth. Floating happens when the average density is less than the liquid’s.' },
    quiz: [{ q: 'The pressure at 2 m depth in water (ρ = 1000, g = 10) due to the water is…', opts: ['20 kPa', '2 kPa', '200 kPa'], a: 0, why: 'ρgh = 1000 × 10 × 2 = 20 000 Pa.' }, { q: 'An object of density 800 kg/m³ is placed in water. The fraction submerged is…', opts: ['0.8', '1.25', '0.2'], a: 0, why: 'ρ<sub>obj</sub>/ρ<sub>liq</sub> = 800/1000.' }, { q: 'The upthrust on a floating object equals…', opts: ['its weight', 'half its weight', 'the weight of the liquid in the tank'], a: 0, why: 'Equilibrium: upthrust balances the weight.' }]
  });
  const bsz = it => 30 + Math.cbrt(it.p.V) * 3.6;
  const matCol = m => ({ wood: '#c98a4b', ice: '#bfe9ff', alu: '#c0c7d4', iron: '#6b7280', cork: '#d9a066', lead: '#4b5563' }[m] || '#ccc');
  function pg(it, W) { const l = LIQ[W.params.liq][1], inLiq = it.x > TK.x0 + 20 && it.x < TK.x1 - 20 && it.y > TK.surf && it.y < TK.bottom, h = inLiq ? (it.y - TK.surf) / TK.pxm : 0; return { inLiq, h, gauge: l * G * h }; }

  /* ============================ ELECTROMAGNETIC INDUCTION ============================ */
  const ph = (z, a, l) => { const g = x => x / Math.sqrt(x * x + a * a); return (g(z + l) - g(z - l)) / 2; };
  RL.register({
    id: 'induction', lab: 'physics', topic: 'Magnetism', title: 'Electromagnetic Induction', icon: '🧲', level: 'Intermediate', model: 'simplified',
    assumptions: 'The flux through the coil from a bar magnet on its axis is modelled with two point poles (flux ∝ [g(z+l) − g(z−l)]/2). The emf is calculated as ε = −N ΔΦ/Δt from the actual motion. Coil resistance and self-induction are ignored.',
    objective: 'Show that a changing magnetic flux induces an emf, and how its size depends on speed, strength and turns (Faraday’s and Lenz’s laws).',
    theory: '<p>When the magnetic flux linked with a coil changes, an <b>emf</b> is induced: <b>ε = −N dΦ/dt</b> (Faraday). The minus sign (Lenz’s law) means the induced current opposes the change that causes it. No motion → no emf.</p>',
    formulas: ['ε = −N ΔΦ/Δt', 'Φ = B A cosθ', 'Faster motion → bigger emf', 'More turns → bigger emf'],
    fixedView: true, animated: true,
    params: [{ k: 'auto', label: 'Move the magnet automatically', type: 'toggle', val: false }, { k: 'speed', label: 'Auto speed', min: 0.5, max: 5, step: 0.1, unit: 'rad/s', val: 2 }],
    types: {
      coil: { name: it => 'Coil ' + it.p.N + ' turns', icon: '🌀', w: 110, h: 130, fixed: false, defaults: { N: 100 }, terminals: [[-55, 62], [55, 62]], props: [{ k: 'N', label: 'Number of turns', min: 10, max: 500, step: 10, unit: '', val: 100 }], info: 'Connect both coil terminals to the galvanometer to form a closed circuit.',
        draw: it => { let s = `<ellipse cx="0" cy="0" rx="26" ry="52" fill="rgba(255,150,60,.12)" stroke="none"/>`; const n = Math.round(it.p.N / 25) + 2; for (let i = 0; i < n; i++) { const x = -34 + 68 * i / (n - 1); s += `<ellipse cx="${x}" cy="0" rx="10" ry="52" fill="none" stroke="#ff9f1c" stroke-width="4"/>`; } return s + L(-55, 62, -34, 40, '#ff9f1c', 3) + L(55, 62, 34, 40, '#ff9f1c', 3); } },
      magnet: { name: () => 'Bar magnet', icon: '🧲', w: 130, h: 34, defaults: { B: 1 }, props: [{ k: 'B', label: 'Magnet strength', min: 0.3, max: 3, step: 0.1, unit: '×', val: 1 }], info: 'Drag the magnet left and right through the coil. Faster movement gives a bigger emf.', onDrag: (it, W) => { it.y = 280; },
        draw: it => `<rect x="-65" y="-17" width="65" height="34" fill="#e74c3c" stroke="#e8eeff" stroke-width="2.5"/><rect x="0" y="-17" width="65" height="34" fill="#3b82f6" stroke="#e8eeff" stroke-width="2.5"/>${TX(-32, 6, 'N', { s: 18, c: '#fff' })}${TX(32, 6, 'S', { s: 18, c: '#fff' })}` },
      galv: { name: () => 'Galvanometer', icon: '🅶', w: 120, h: 90, terminals: [[-45, 40], [45, 40]], defaults: {}, info: 'Centre-zero meter: the needle deflects left or right with the direction of the induced current.', draw: (it, W) => { const d = (W.d.ind && W.d.ind.needle) || 0; return `<path d="M-50 36A50 50 0 0 1 50 36Z" fill="#0d1a4a" stroke="#ffd23f" stroke-width="3.5"/>` + [-40, -20, 0, 20, 40].map(a => L(Math.sin(rad(a)) * 40, 36 - Math.cos(rad(a)) * 40, Math.sin(rad(a)) * 46, 36 - Math.cos(rad(a)) * 46, '#9fb4ff', 2)).join('') + L(0, 36, Math.sin(rad(d)) * 42, 36 - Math.cos(rad(d)) * 42, '#ff5d6c', 4) + `<circle cx="0" cy="36" r="5" fill="#fff"/>${L(-45, 40, -45, 40)}` + TX(0, -4, 'G', { s: 15, c: '#ffd23f' }); } }
    },
    catalog: [{ type: 'coil', name: 'Coil', icon: '🌀', desc: 'Wire with N turns', max: 1, tags: 'solenoid wire' }, { type: 'magnet', name: 'Bar magnet', icon: '🧲', desc: 'Drag it through the coil', max: 1, tags: 'north south' }, { type: 'galv', name: 'Galvanometer', icon: '🅶', desc: 'Shows the induced current', max: 1, tags: 'meter current needle' }],
    presets: [{ name: 'Set up', icon: '📋', build: indSetup }],
    init(W) { indSetup(W); },
    bg() { return `<line x1="200" y1="280" x2="800" y2="280" stroke="rgba(255,255,255,.2)" stroke-dasharray="4 6"/>`; },
    sim(W, dt) {
      const c = W.find('coil')[0], m = W.find('magnet')[0], g = W.find('galv')[0], s = W.d.ind || (W.d.ind = { phi: 0, emf: 0, needle: 0, tp: performance.now() });
      if (!c || !m) { s.emf = 0; return; }
      if (W.params.auto && W.running && dt > 0) { m.x = c.x + 230 * Math.sin(W.t * W.params.speed); m.y = c.y; }
      const z = (m.x - c.x) / 10, phi = 1e-3 * m.p.B * ph(z, 2.5, 4) * 2, now = performance.now(), dtt = Math.max((now - s.tp) / 1000, 1e-3);
      if (s.phi !== null && dtt >= 0.012) { const raw = -c.p.N * (phi - s.phi) / dtt; s.emf = s.emf * 0.55 + raw * 0.45; s.phi = phi; s.tp = now; }
      s.phiNow = phi; if (s.phi === null) s.phi = phi;
      s.closed = closedLoop(W, c, g); const target = s.closed ? clamp(s.emf / 1.5, -1, 1) * 45 : 0; s.needle += (target - s.needle) * 0.3;
    },
    reset(W) { W.d.ind = null; },
    messages(W) { const r = [], c = W.find('coil')[0], m = W.find('magnet')[0], g = W.find('galv')[0], s = W.d.ind; if (!c || !m) return [{ t: 'info', m: 'Add a coil and a bar magnet.' }]; if (!g) r.push({ t: 'warn', m: 'Add a galvanometer to see the induced current.' }); else if (s && !s.closed) r.push({ t: 'warn', m: 'Connect BOTH coil terminals to the galvanometer terminals with wires (a closed circuit), or no current can flow.' }); if (s && Math.abs(s.emf) < 0.005) r.push({ t: 'info', m: 'No change of flux → no emf. Move the magnet!' }); return r; },
    readouts(W) { const s = W.d.ind, c = W.find('coil')[0]; if (!s || !c) return []; return [{ l: 'Induced emf', v: s.emf * 1000, u: 'mV', d: 0 }, { l: 'Flux through coil', v: (s.phiNow || 0) * 1000, u: 'mWb', d: 3 }, { l: 'Turns N', v: c.p.N }, { l: 'Circuit', v: s.closed ? 'closed' : 'open' }]; },
    live(W) { const s = W.d.ind, c = W.find('coil')[0]; if (!s || !c) return []; return [`ε = −N ΔΦ/Δt = −${c.p.N} × ΔΦ/Δt = <b>${fmt(s.emf * 1000, 0)} mV</b>`]; },
    graphs: [{ id: 'emf', title: 'Induced emf against time', x: 'Time t (s)', y: 'emf (mV)', series: [{ n: 'ε', c: '#ff5d6c' }], sample(W) { const s = W.d.ind; return s ? [W.t, s.emf * 1000] : null; } }],
    guided: { objective: 'Discover what makes an induced emf bigger or smaller.', setup: indSetup,
      steps: [{ t: 'Place a coil, magnet and galvanometer and wire the coil to the galvanometer (both terminals). Or tap “Set up for me”.', predict: { q: 'If you hold the magnet still inside the coil, the galvanometer will read…', opts: ['zero', 'a steady current', 'a large current'], a: 0, why: 'Flux is not changing, so no emf is induced.' }, ok: W => W.d.ind && W.d.ind.closed }, { t: 'Drag the magnet slowly into the coil, then quickly. Notice the needle and the emf in Results.', ok: W => W.d.ind && Math.abs(W.d.ind.emf) > 0.02 }, { t: 'Turn on “Move the magnet automatically”, press ▶ Run, and watch the alternating emf on the graph.', ok: W => W.params.auto && W.t > 2 }, { t: 'Select the coil and double the number of turns. The emf doubles.', ok: W => W.find('coil')[0] && W.find('coil')[0].p.N >= 200 }],
      done: W => 'A changing flux induces an emf: bigger when you move faster, use a stronger magnet or more turns. Reversing the motion reverses the sign (Lenz’s law).' },
    quiz: [{ q: 'Which action does NOT induce an emf in the coil?', opts: ['holding the magnet still inside the coil', 'pushing the magnet in', 'pulling the magnet out'], a: 0, why: 'Only a changing flux induces an emf.' }, { q: 'Doubling the number of turns (same motion) makes the emf…', opts: ['double', 'halve', 'stay the same'], a: 0, why: 'ε = −N ΔΦ/Δt.' }]
  });
  function indSetup(W) { const c = W.add('coil', 620, 280, { N: 100 }), m = W.add('magnet', 280, 280, { B: 1 }), g = W.add('galv', 620, 450); W.wire(c.id, 0, g.id, 0); W.wire(c.id, 1, g.id, 1); }
  function closedLoop(W, c, g) {
    if (!c || !g) return false; const par = {}, f = k => (par[k] === undefined || par[k] === k) ? (par[k] = k) : (par[k] = f(par[k]));
    W.wires.forEach(w => { const a = f(w.a[0] + ':' + w.a[1]), b = f(w.b[0] + ':' + w.b[1]); if (a !== b) par[a] = b; });
    const a0 = f(c.id + ':0'), a1 = f(c.id + ':1'), b0 = f(g.id + ':0'), b1 = f(g.id + ':1'); return (a0 === b0 && a1 === b1 && a0 !== a1) || (a0 === b1 && a1 === b0 && a0 !== a1);
  }

  /* ============================ ELECTROMAGNET ============================ */
  const MU0 = 4 * Math.PI * 1e-7;
  RL.register({
    id: 'em', lab: 'physics', topic: 'Magnetism', title: 'Electromagnets & Magnetic Fields', icon: '🧲', level: 'Beginner', model: 'simplified',
    assumptions: 'Long-solenoid formula B = μ₀ μᵣ N I / ℓ with ℓ = 0.10 m. The iron core uses an effective μᵣ = 200 (real iron saturates). Compass deflection uses a simple dipole fall-off with distance. Paper-clip count is an illustrative estimate of the pull.',
    objective: 'Investigate how the strength of an electromagnet depends on current, number of turns and an iron core.',
    theory: '<p>A current in a coil creates a magnetic field like a bar magnet. The field is <b>stronger</b> with a larger current, more turns, or a soft-iron core. Reversing the current reverses the poles. The field near the coil can be mapped with a <b>compass</b>.</p>',
    formulas: ['B = μ₀ μᵣ N I / ℓ', 'μ₀ = 4π × 10⁻⁷ T m/A'], fixedView: true, animated: false, params: [],
    types: {
      emag: { name: it => 'Electromagnet', icon: '🧲', w: 200, h: 90, defaults: { N: 50, I: 2, core: 'iron', rev: false }, props: [{ k: 'N', label: 'Turns', min: 10, max: 300, step: 10, unit: '', val: 50 }, { k: 'I', label: 'Current', min: 0, max: 5, step: 0.1, unit: 'A', val: 2 }, { k: 'core', label: 'Core', type: 'select', options: [['air', 'Air (no core)'], ['iron', 'Soft iron']], val: 'iron' }, { k: 'rev', label: 'Reverse the current', type: 'toggle' }], info: 'Solenoid with a core. Paper clips hang from the end that attracts them.',
        draw: it => { const B = emB(it), clips = emClips(B), n = Math.round(it.p.N / 20) + 2; let s = `<rect x="-90" y="-20" width="180" height="40" rx="6" fill="${it.p.core === 'iron' ? '#7b8296' : 'rgba(255,255,255,.05)'}" stroke="#9fb4ff" stroke-width="2"/>`; for (let i = 0; i < n; i++) { const x = -80 + 160 * i / (n - 1); s += `<path d="M${x} -26Q${x + 8} 0 ${x} 26" fill="none" stroke="#ff9f1c" stroke-width="4"/>`; } s += TX(-100, 5, it.p.rev ? 'S' : 'N', { s: 18, c: it.p.rev ? '#6ea8ff' : '#ff6b6b', a: 'end' }) + TX(100, 5, it.p.rev ? 'N' : 'S', { s: 18, c: it.p.rev ? '#ff6b6b' : '#6ea8ff', a: 'start' }); for (let i = 0; i < clips; i++) s += `<rect x="${-20 + (i % 6) * 8}" y="${28 + Math.floor(i / 6) * 8}" width="6" height="12" rx="2" fill="#cfd8ff" stroke="#667" stroke-width="1"/>`; return s + TX(0, -34, 'B = ' + fmt(B * 1000, 1) + ' mT', { c: '#ffe9a8' }); } },
      compass: { name: () => 'Compass', icon: '🧭', w: 70, h: 70, defaults: {}, info: 'Place near the electromagnet. The needle turns towards the field.', draw: (it, W) => { const e = W.find('emag')[0]; let ang = 0; if (e) { const d = Math.hypot(it.x - e.x, it.y - e.y) / 500, Bc = emB(e) * Math.pow(0.05 / (0.05 + d), 3), Be = 40e-6; ang = Math.atan2(Bc, Be) * 180 / Math.PI * (e.p.rev ? -1 : 1); it._ang = ang; it._Bc = Bc; } return `<circle r="30" fill="#0d1a4a" stroke="#ffd23f" stroke-width="3.5"/><g transform="rotate(${ang})"><path d="M0 -24L6 0L-6 0Z" fill="#ff5d6c"/><path d="M0 24L6 0L-6 0Z" fill="#cfd8ff"/></g><circle r="3" fill="#fff"/>` + TX(0, 48, fmt(Math.abs(ang), 0) + '° from north', { s: 10.5, c: '#9fc4ff' }); } }
    },
    catalog: [{ type: 'emag', name: 'Electromagnet', icon: '🧲', desc: 'Coil with a core; set turns and current', max: 1, tags: 'solenoid coil iron' }, { type: 'compass', name: 'Compass', icon: '🧭', desc: 'Shows field direction', max: 1, tags: 'needle direction' }],
    init(W) { W.add('emag', 440, 300); W.add('compass', 700, 200); },
    messages(W) { const e = W.find('emag')[0], r = []; if (!e) return [{ t: 'info', m: 'Add an electromagnet.' }]; if (e.p.I === 0) r.push({ t: 'warn', m: 'No current: no magnetic field. Increase the current.' }); const c = W.find('compass')[0]; if (c && e) { const d = Math.hypot(c.x - e.x, c.y - e.y); if (d > 330) r.push({ t: 'info', m: 'The compass is far away: the field is weak there. Move it closer.' }); } return r; },
    sim() { },
    readouts(W) { const e = W.find('emag')[0]; if (!e) return []; const B = emB(e), r = [{ l: 'Field inside coil', v: B * 1000, u: 'mT', d: 2 }, { l: 'Paper clips held (estimate)', v: emClips(B) }]; const c = W.find('compass')[0]; if (c && c._Bc != null) r.push({ l: 'Field at compass', v: c._Bc * 1e6, u: 'μT', d: 1 }, { l: 'Earth’s field', v: 40, u: 'μT' }); return r; },
    live(W) { const e = W.find('emag')[0]; if (!e) return []; return [`B = μ₀μᵣNI/ℓ = 4π×10⁻⁷ × ${e.p.core === 'iron' ? 200 : 1} × ${e.p.N} × ${fmt(e.p.I, 1)} ÷ 0.1 = <b>${fmt(emB(e) * 1000, 2)} mT</b>`]; },
    graphs: [{ id: 'bi', title: 'Field B against current I — press 📍 Record', x: 'Current I (A)', y: 'B (mT)', manual: true, points: true, series: [{ n: 'B', c: '#ff9f1c' }], sample(W) { const e = W.find('emag')[0]; return e && e.p.I > 0 ? [Math.round(e.p.I * 10) / 10, emB(e) * 1000] : null; } }],
    guided: { objective: 'Find three ways to make an electromagnet stronger.', setup: W => { W.add('emag', 440, 300, { N: 50, I: 1, core: 'air' }); W.add('compass', 700, 200); },
      steps: [{ t: 'Start with an air-core coil and 1 A. Look at the field and the paper clips.', predict: { q: 'Which change makes an electromagnet stronger?', opts: ['more turns, more current, an iron core', 'fewer turns', 'reversing the current'], a: 0, why: 'B = μ₀μᵣNI/ℓ increases with N, I and μᵣ. Reversing only swaps the poles.' }, ok: W => W.count('emag') }, { t: 'Increase the current and press 📍 Record at 1, 2, 3 A. Is B ∝ I?', ok: W => (W.graph.bi || []).length >= 3 }, { t: 'Switch the core to soft iron and double the turns. Compare B and the paper clips.', ok: W => W.find('emag')[0] && W.find('emag')[0].p.core === 'iron' && W.find('emag')[0].p.N >= 100 }, { t: 'Reverse the current: the compass needle flips because N and S swap.', ok: W => W.find('emag')[0] && W.find('emag')[0].p.rev }],
      done: W => 'Strength ∝ number of turns × current × core permeability; the polarity follows the current direction.' },
    quiz: [{ q: 'Doubling the current in an electromagnet makes its field…', opts: ['double', 'half', 'unchanged'], a: 0, why: 'B ∝ I.' }, { q: 'Reversing the current in the coil…', opts: ['swaps the N and S poles', 'removes the field', 'doubles the field'], a: 0, why: 'The field direction depends on the current direction (right-hand grip rule).' }]
  });
  function emB(e) { return MU0 * (e.p.core === 'iron' ? 200 : 1) * e.p.N * e.p.I / 0.1; }
  function emClips(B) { return clamp(Math.round(B * 150), 0, 24); }

  /* ============================ HEAT TRANSFER & THERMAL EXPANSION ============================ */
  const ROD = { alu: ['Aluminium', 23e-6, 2700, 900, '#c0c7d4'], cu: ['Copper', 17e-6, 8960, 385, '#d98a4b'], steel: ['Steel', 12e-6, 7850, 490, '#7b8296'], glass: ['Glass', 9e-6, 2500, 840, '#a8e0ff'], brass: ['Brass', 19e-6, 8500, 380, '#e6c35a'] };
  const AREA = 0.25e-4;
  RL.register({
    id: 'heat', lab: 'physics', topic: 'Heat & Gases', title: 'Heat Transfer & Thermal Expansion', icon: '🌡️', level: 'Intermediate', model: 'simplified',
    assumptions: 'Lumped model: the whole rod is at one temperature. Heating at power P, loss to the air at k(T − 25 °C), linear expansion ΔL = αL₀ΔT. Time runs 20× faster than real. The rod’s expansion is magnified on screen (not to scale).',
    objective: 'See how a rod expands when it is heated, which materials expand most, and how heat loss limits the temperature.',
    theory: '<p>Solids expand when heated. The change in length is ΔL = α L₀ ΔT, where α is the <b>linear expansivity</b> of the material. Heat is also lost to the surroundings (conduction, convection, radiation), so the temperature stops rising when the heater power equals the heat lost.</p>',
    formulas: ['ΔL = α L₀ ΔT', 'Q = m c ΔT', 'P<sub>heater</sub> = k (T − T<sub>air</sub>) at equilibrium'], fixedView: true, animated: false,
    params: [{ k: 'ins', label: 'Insulate the rod (no heat loss)', type: 'toggle', val: false }],
    types: {
      rod: { name: it => ROD[it.p.mat][0] + ' rod', icon: '📏', w: 460, h: 60, fixed: true, defaults: { mat: 'alu', L0: 1 }, props: [{ k: 'mat', label: 'Material', type: 'select', options: Object.keys(ROD).map(k => [k, ROD[k][0] + ' (α = ' + ROD[k][1] * 1e6 + '×10⁻⁶/°C)']), val: 'alu' }, { k: 'L0', label: 'Original length', min: 0.5, max: 2, step: 0.1, unit: 'm', val: 1 }], info: 'A metal rod fixed at the left end. It can expand to the right.',
        draw: (it, W) => { const h = W.d.th || { T: 25, dL: 0 }, ext = clamp(h.dL * 1000 * 28, 0, 150), c = ROD[it.p.mat][4], hot = clamp((h.T - 25) / 150, 0, 1); return `<rect x="-230" y="-40" width="14" height="80" fill="#4a5a9a" stroke="#e8eeff" stroke-width="2"/><rect x="-216" y="-14" width="${430 + ext}" height="28" rx="5" fill="${c}" stroke="#e8eeff" stroke-width="3"/><rect x="-216" y="-14" width="${430 + ext}" height="28" rx="5" fill="rgba(255,${120 - 80 * hot | 0},40,${hot * .75})"/>${L(214 + ext, -30, 214 + ext, -16, '#ffd23f', 3)}${TX(0, 56, fmt(it.p.L0, 1) + ' m rod · ΔL = ' + fmt(h.dL * 1000, 2) + ' mm (drawn magnified)', { s: 11.5, c: '#ffe9a8' })}${L(214, 22, 214, 36, '#9fb4ff', 2)}`; } },
      heater: { name: it => 'Burner ' + it.p.P + ' W', icon: '🔥', w: 140, h: 50, defaults: { P: 100, on: true }, props: [{ k: 'P', label: 'Heating power', min: 20, max: 300, step: 10, unit: 'W', val: 100 }, { k: 'on', label: 'Heater on', type: 'toggle' }], info: 'Put it directly under the rod.',
        draw: it => `<rect x="-60" y="-8" width="120" height="22" rx="6" fill="${it.p.on ? '#ff6b35' : '#4a3a3a'}" stroke="#ffd23f" stroke-width="2.5"/>${it.p.on ? [-40, -10, 20, 50].map(x => `<path d="M${x} -12q6 -12 0 -22" fill="none" stroke="#ffb36b" stroke-width="3" stroke-linecap="round"/>`).join('') : ''}${TX(0, 8, it.p.P + ' W', { s: 11 })}` },
      thermo: { name: () => 'Thermometer', icon: '🌡️', w: 54, h: 120, defaults: {}, info: 'Reads the rod temperature when it is near the rod.', draw: (it, W) => { const T = (W.d.th && W.d.th.T) || 25, h = clamp((T - 0) / 200, 0, 1) * 70; return `<rect x="-9" y="-56" width="18" height="90" rx="9" fill="#fff" stroke="#9fc4ff" stroke-width="2"/><circle cy="42" r="13" fill="#ff4d5e" stroke="#9fc4ff" stroke-width="2"/><rect x="-4" y="${38 - h}" width="8" height="${h + 4}" fill="#ff4d5e"/>${TX(0, 76, fmt(T, 1) + ' °C', { s: 12, c: '#ffb3b3' })}`; } }
    },
    catalog: [{ type: 'rod', name: 'Metal rod', icon: '📏', desc: 'Choose material and length', max: 1, tags: 'metal expansion bar' }, { type: 'heater', name: 'Burner / heater', icon: '🔥', desc: 'Heats the rod from below', tags: 'bunsen flame' }, { type: 'thermo', name: 'Thermometer', icon: '🌡️', desc: 'Reads temperature', max: 1, tags: 'temperature' }],
    init(W) { W.add('rod', 480, 250, { mat: 'alu', L0: 1 }); W.add('heater', 480, 330, { P: 100 }); W.add('thermo', 800, 400); },
    sim(W, dt) {
      const r = W.find('rod')[0]; if (!r) { W.d.th = null; return; } const h = W.d.th || (W.d.th = { T: 25, dL: 0 }), m = ROD[r.p.mat], hs = W.find('heater').find(x => x.p.on && Math.abs(x.x - r.x) < 230 && x.y > r.y && x.y < r.y + 160);
      h.heated = !!hs; const C = m[2] * AREA * r.p.L0 * m[3] + 5, k = W.params.ins ? 0 : 0.5;
      if (W.running && dt > 0) { const n = Math.ceil(dt * 20 / 0.5); for (let i = 0; i < n; i++) { const d = dt * 20 / n; h.T += ((hs ? hs.p.P : 0) - k * (h.T - 25)) / C * d; } }
      h.dL = m[1] * r.p.L0 * (h.T - 25); h.C = C; h.k = k; h.P = hs ? hs.p.P : 0;
    },
    reset(W) { W.d.th = null; },
    messages(W) { const r = [], h = W.d.th, rod = W.find('rod')[0]; if (!rod) return [{ t: 'info', m: 'Add a rod to heat.' }]; if (h && !h.heated) r.push({ t: 'warn', m: 'No heat reaches the rod: place a switched-on heater <b>directly below</b> it.' }); const t = W.find('thermo')[0]; if (t && Math.abs(t.x - rod.x) > 280) r.push({ t: 'warn', m: 'Move the thermometer closer to the rod.' }); return r; },
    readouts(W) { const h = W.d.th, r = W.find('rod')[0]; if (!h || !r) return []; const o = [{ l: 'Temperature', v: h.T, u: '°C', d: 1 }, { l: 'Temperature rise ΔT', v: h.T - 25, u: '°C', d: 1 }, { l: 'Expansion ΔL', v: h.dL * 1000, u: 'mm', d: 3 }, { l: 'Heat loss', v: h.k * (h.T - 25), u: 'W', d: 1 }]; if (h.P > 0 && h.k > 0) o.push({ l: 'Final temperature if left on', v: 25 + h.P / h.k, u: '°C', d: 0 }); return o; },
    live(W) { const h = W.d.th, r = W.find('rod')[0]; if (!h || !r) return []; const m = ROD[r.p.mat]; return [`ΔL = αL₀ΔT = ${m[1] * 1e6}×10⁻⁶ × ${fmt(r.p.L0, 1)} × ${fmt(h.T - 25, 1)} = <b>${fmt(h.dL * 1000, 3)} mm</b>`]; },
    graphs: [{ id: 'dl', title: 'Expansion against temperature', x: 'Temperature (°C)', y: 'ΔL (mm)', series: [{ n: 'ΔL', c: '#ffd23f' }], sample(W) { const h = W.d.th; return h ? [h.T, h.dL * 1000] : null; } }, { id: 'tt', title: 'Temperature against time', x: 'Time t (s)', y: 'T (°C)', series: [{ n: 'T', c: '#ff8a8a' }], sample(W) { const h = W.d.th; return h ? [W.t, h.T] : null; } }],
    guided: { objective: 'Measure thermal expansion and compare materials.', setup: W => { W.add('rod', 480, 250, { mat: 'alu', L0: 1 }); W.add('heater', 480, 330, { P: 100 }); W.add('thermo', 800, 400); },
      steps: [{ t: 'Place the rod, a burner directly below it and a thermometer. Press ▶ Run.', predict: { q: 'Which expands more for the same temperature rise and length?', opts: ['aluminium', 'glass', 'they are equal'], a: 0, why: 'Aluminium has α = 23×10⁻⁶ /°C, glass about 9×10⁻⁶ /°C.' }, ok: W => W.d.th && W.d.th.heated }, { t: 'Watch ΔL grow in a straight line against temperature in <b>📊 Results</b>.', ok: W => W.d.th && W.d.th.T > 60 }, { t: 'Reset and change the rod to glass. Run to the same temperature: the expansion is smaller.', ok: W => W.find('rod')[0] && W.find('rod')[0].p.mat !== 'alu' && W.d.th && W.d.th.T > 50 }, { t: 'Tick <b>Insulate the rod</b> and see how the temperature rises without heat loss.', ok: W => W.params.ins }],
      done: W => 'ΔL ∝ ΔT and ΔL ∝ L₀; each material has its own α. Heat loss limits the temperature to T = T_air + P/k.' },
    quiz: [{ q: 'A 2 m steel rail (α = 12×10⁻⁶ /°C) is heated by 50 °C. It expands by…', opts: ['1.2 mm', '12 mm', '0.12 mm'], a: 0, why: 'ΔL = 12×10⁻⁶ × 2 × 50 = 1.2×10⁻³ m.' }, { q: 'Railway tracks have small gaps so that…', opts: ['they can expand in hot weather', 'they can cool faster', 'trains run quieter'], a: 0, why: 'Expansion without a gap would buckle the rail.' }]
  });

  /* ============================ OPTICS: LENSES & MIRRORS ============================ */
  const OP = { x0: 500, y0: 290, S: 4 };
  const KINDS = { cvx: ['Convex lens', 'lens', 1], ccv: ['Concave lens', 'lens', -1], cmr: ['Concave mirror', 'mirror', -1], vmr: ['Convex mirror', 'mirror', 1] };
  function opt(W) {
    const o = W.find('optic')[0], ob = W.find('object')[0]; if (!o || !ob) return null; const k = KINDS[o.p.kind], isL = k[1] === 'lens', f = k[2] * o.p.f, u = -(OP.x0 - ob.x) / OP.S, h = ob.p.h; let v, m;
    if (isL) { const den = 1 / f + 1 / u; v = Math.abs(den) < 1e-9 ? Infinity : 1 / den; m = v / u; }
    else { const den = 1 / f - 1 / u; v = Math.abs(den) < 1e-9 ? Infinity : 1 / den; m = -v / u; }
    return { isL, f, u, v, m, h, himg: m * h, real: isFinite(v) && (isL ? v > 0 : v < 0), inf: !isFinite(v), kind: o.p.kind };
  }
  RL.register({
    id: 'optics', lab: 'physics', topic: 'Light', title: 'Lenses, Mirrors & Ray Diagrams', icon: '🔍', level: 'Intermediate', model: 'full',
    assumptions: 'Thin lenses and small-aperture spherical mirrors (paraxial rays), Cartesian sign convention (distances measured from the optic; light travels left → right). 1 cm = 4 px on screen.',
    objective: 'Draw ray diagrams, find the image position and magnification, and use 1/v − 1/u = 1/f.',
    theory: '<p>A convex lens converges light; a concave lens diverges it. Principal rays: (1) parallel to the axis → passes through the focus; (2) through the optical centre → undeviated; (3) through the focus → emerges parallel. A <b>real</b> image can be caught on a screen; a <b>virtual</b> image cannot.</p>',
    formulas: ['Lens: 1/v − 1/u = 1/f', 'Mirror: 1/v + 1/u = 1/f', 'm = v/u (lens), m = −v/u (mirror)', 'Power P = 1/f (f in m)'], fixedView: true, animated: false, params: [],
    types: {
      optic: { name: it => KINDS[it.p.kind][0], icon: '🔍', w: 40, h: 300, fixed: true, defaults: { kind: 'cvx', f: 15 }, props: [{ k: 'kind', label: 'Type', type: 'select', options: Object.keys(KINDS).map(k => [k, KINDS[k][0]]), val: 'cvx' }, { k: 'f', label: 'Focal length', min: 5, max: 40, step: 1, unit: 'cm', val: 15 }], info: 'The lens or mirror sits at the centre. Switch its type here.',
        draw: it => { const k = KINDS[it.p.kind], H = 140, f = it.p.f * OP.S; let s = ''; if (k[1] === 'lens') { s = it.p.kind === 'cvx' ? `<path d="M0 ${-H}Q26 0 0 ${H}Q-26 0 0 ${-H}Z" fill="rgba(125,211,252,.3)" stroke="#7dd3fc" stroke-width="3"/>` : `<path d="M-14 ${-H}Q4 0 -14 ${H}H14Q-4 0 14 ${-H}Z" fill="rgba(125,211,252,.3)" stroke="#7dd3fc" stroke-width="3"/>`; } else { const side = it.p.kind === 'cmr' ? -1 : 1; s = `<path d="M${side * 8} ${-H}Q${-side * 14} 0 ${side * 8} ${H}" fill="none" stroke="#e8eeff" stroke-width="6"/><path d="M${side * 14} ${-H}Q${-side * 8} 0 ${side * 14} ${H}" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="3" stroke-dasharray="4 4"/>`; } const sg = k[2] * 1, fx = k[1] === 'lens' ? [-f, f] : [it.p.kind === 'cmr' ? -f : f]; return s + fx.map(x => `<circle cx="${x}" cy="0" r="4" fill="#ffd23f"/>` + TX(x, 18, 'F', { s: 11, c: '#ffd23f' })).join('') + (k[1] === 'lens' && it.p.kind === 'cvx' ? [-2 * f, 2 * f].map(x => TX(x, 18, '2F', { s: 10, c: '#9fb4ff' }) + `<circle cx="${x}" cy="0" r="3" fill="#9fb4ff"/>`).join('') : '') + TX(0, -H - 8, KINDS[it.p.kind][0], { s: 11, c: '#9fc4ff' }); } },
      object: { name: it => 'Object (' + it.p.h + ' cm)', icon: '🕯️', w: 36, h: 80, defaults: { h: 8 }, props: [{ k: 'h', label: 'Object height', min: 2, max: 15, step: 1, unit: 'cm', val: 8 }], info: 'Drag the object along the axis to change the object distance u.', onDrag: (it, W) => { it.y = OP.y0 - it.p.h * OP.S / 2; it.x = Math.min(it.x, OP.x0 - 30); }, onProp: (it) => { it.y = OP.y0 - it.p.h * OP.S / 2; },
        draw: it => { const hp = it.p.h * OP.S; return `${L(0, hp / 2, 0, -hp / 2, '#ffd23f', 5)}<path d="M-8 ${-hp / 2 + 10}L0 ${-hp / 2}L8 ${-hp / 2 + 10}" fill="none" stroke="#ffd23f" stroke-width="4"/>`; } },
      screen: { name: () => 'Screen', icon: '🖼️', w: 20, h: 240, defaults: {}, info: 'Drag the screen along the axis to find where a real image is sharp.', onDrag: it => { it.y = OP.y0; }, draw: (it, W) => { const o = opt(W), sharp = o && o.real && Math.abs(it.x - (OP.x0 + o.v * OP.S)) < 10; return `<rect x="-5" y="-110" width="10" height="220" fill="${sharp ? '#d1fae5' : '#e8eeff'}" stroke="${sharp ? '#22c55e' : '#9fb4ff'}" stroke-width="3"/>` + (sharp ? TX(0, -120, 'SHARP!', { c: '#4ade80', s: 12 }) : ''); } }
    },
    catalog: [{ type: 'optic', name: 'Lens / mirror', icon: '🔍', desc: 'Convex, concave lens or mirror', max: 1, tags: 'convex concave focal glass' }, { type: 'object', name: 'Object (candle)', icon: '🕯️', desc: 'The thing you look at', max: 1, tags: 'arrow candle' }, { type: 'screen', name: 'Screen', icon: '🖼️', desc: 'Catches a real image', max: 1, tags: 'image catcher' }],
    init(W) { W.add('optic', OP.x0, OP.y0, { kind: 'cvx', f: 15 }); W.add('object', 380, OP.y0 - 16, { h: 8 }); },
    onAdd(W, it) { if (it.type === 'optic') { it.x = OP.x0; it.y = OP.y0; } if (it.type === 'object') { it.x = 380; it.y = OP.y0 - it.p.h * OP.S / 2; } if (it.type === 'screen') { it.y = OP.y0; it.x = 700; } },
    bg(W) { return `${L(30, OP.y0, 970, OP.y0, '#9fb4ff', 1.5, '8 5')}` + [-100, -80, -60, -40, -20, 20, 40, 60, 80, 100].map(c => L(OP.x0 + c * OP.S, OP.y0 - 5, OP.x0 + c * OP.S, OP.y0 + 5, '#9fb4ff', 1.5) + (c % 40 === 0 ? TX(OP.x0 + c * OP.S, OP.y0 + 20, c + '', { s: 10, c: '#9fb4ff' }) : '')).join('') + rays(W); },
    sim() { },
    messages(W) { const r = [], o = opt(W); if (!W.find('optic')[0]) return [{ t: 'info', m: 'Add a lens or mirror.' }]; if (!W.find('object')[0]) return [{ t: 'info', m: 'Add an object (candle) and drag it along the axis.' }]; if (o.inf) r.push({ t: 'info', m: 'The object is at the focus: the rays come out parallel, so the image is at infinity.' }); const s = W.find('screen')[0]; if (s && o.real && Math.abs(s.x - (OP.x0 + o.v * OP.S)) < 10) r.push({ t: 'ok', m: 'The image is sharp on the screen: it is a REAL image.' }); else if (s && !o.real) r.push({ t: 'warn', m: 'This image is virtual: it cannot be shown on a screen.' }); return r; },
    readouts(W) { const o = opt(W); if (!o) return []; const nat = o.inf ? 'at infinity' : (o.real ? 'real, ' : 'virtual, ') + (o.m < 0 ? 'inverted, ' : 'upright, ') + (Math.abs(o.m) > 1.001 ? 'magnified' : Math.abs(o.m) < 0.999 ? 'diminished' : 'same size'); return [{ l: 'Object distance u', v: o.u, u: 'cm', d: 1 }, { l: 'Image distance v', v: o.v, u: 'cm', d: 1 }, { l: 'Magnification m', v: o.m, d: 2 }, { l: 'Image height', v: o.himg, u: 'cm', d: 1 }, { l: 'Focal length f', v: o.f, u: 'cm', d: 1 }, { l: 'Power 1/f', v: 100 / o.f, u: 'D', d: 2 }, { l: 'Image', v: nat }]; },
    live(W) { const o = opt(W); if (!o || o.inf) return []; return o.isL ? [`1/v = 1/f + 1/u = 1/${fmt(o.f, 0)} + 1/(${fmt(o.u, 1)})`, `v = <b>${fmt(o.v, 1)} cm</b>, m = v/u = <b>${fmt(o.m, 2)}</b>`] : [`1/v = 1/f − 1/u = 1/(${fmt(o.f, 0)}) − 1/(${fmt(o.u, 1)})`, `v = <b>${fmt(o.v, 1)} cm</b>, m = −v/u = <b>${fmt(o.m, 2)}</b>`]; },
    graphs: [{ id: 'uv', title: '1/|v| against 1/|u| (real images) — press 📍 Record', x: '1/|u| (1/cm)', y: '1/|v| (1/cm)', manual: true, points: true, series: [{ n: '1/v', c: '#ffd23f' }], sample(W) { const o = opt(W); return o && o.real && !o.inf ? [Math.round(1000 / Math.abs(o.u)) / 1000, 1 / Math.abs(o.v)] : null; } }],
    results(W) { const d = W.graph.uv || []; if (d.length < 2) return '<p style="opacity:.75">Record 3 or more real images (move the object each time). The points fall on a straight line 1/v = 1/f − 1/u, whose intercept is 1/f.</p>'; const n = d.length, sx = d.reduce((a, r) => a + r[0], 0), sy = d.reduce((a, r) => a + r[1], 0), sxx = d.reduce((a, r) => a + r[0] * r[0], 0), sxy = d.reduce((a, r) => a + r[0] * r[1], 0), den = n * sxx - sx * sx; if (!den) return ''; const sl = (n * sxy - sx * sy) / den, ic = (sy - sl * sx) / n; return `<div class="rl-note">Best-fit line: slope ${fmt(sl, 2)}, intercept ${fmt(ic, 4)} → <b>f ≈ ${fmt(1 / ic, 1)} cm</b></div>`; },
    guided: { objective: 'Find how the image changes as the object moves towards a convex lens.', setup: W => { W.add('optic', OP.x0, OP.y0, { kind: 'cvx', f: 15 }); W.add('object', 380, OP.y0 - 16, { h: 8 }); W.add('screen', 750, OP.y0); },
      steps: [{ t: 'Use a convex lens (f = 15 cm) and put the object beyond 2F (further than 30 cm).', predict: { q: 'An object beyond 2F of a convex lens gives an image that is…', opts: ['real, inverted and smaller', 'virtual and upright', 'real, upright and larger'], a: 0, why: 'Beyond 2F the image forms between F and 2F, inverted and diminished.' }, ok: W => { const o = opt(W); return !!(o && o.u < -30); } }, { t: 'Drag the object to 2F (30 cm). The image is the same size as the object.', ok: W => { const o = opt(W); return !!(o && Math.abs(o.u + 30) < 4); } }, { t: 'Move it between F and 2F: the image becomes larger. Drag the screen to the image until it is SHARP.', ok: W => { const o = opt(W); return !!(o && o.u > -30 && o.u < -16); } }, { t: 'Move the object inside F (closer than 15 cm): the image is virtual, upright and magnified (a magnifying glass!).', ok: W => { const o = opt(W); return !!(o && o.u > -14); } }],
      done: W => 'Real images are inverted and can be caught on a screen; virtual images are upright and only seen by looking through the lens.' },
    quiz: [{ q: 'An object is 30 cm from a convex lens of f = 15 cm. The image distance is…', opts: ['30 cm', '15 cm', '45 cm'], a: 0, why: '1/v = 1/15 − 1/30 = 1/30.' }, { q: 'A virtual image formed by a convex lens occurs when the object is…', opts: ['closer than the focal length', 'beyond 2F', 'at 2F'], a: 0, why: 'Inside F, rays diverge after the lens; the eye traces them back to an upright, magnified virtual image.' }, { q: 'A concave lens always forms an image that is…', opts: ['virtual, upright and smaller', 'real and inverted', 'real and magnified'], a: 0, why: 'Diverging lens: the rays never meet.' }]
  });
  function rays(W) {
    const o = opt(W), ob = W.find('object')[0]; if (!o || !ob || o.inf) { if (o && o.inf && ob) { const tip = [ob.x, OP.y0 - o.h * OP.S]; return `<line x1="${tip[0]}" y1="${tip[1]}" x2="${OP.x0}" y2="${tip[1]}" stroke="#ff8a8a" stroke-width="2"/>`; } return ''; }
    const tip = [ob.x, OP.y0 - o.h * OP.S], I = [OP.x0 + o.v * OP.S, OP.y0 - o.himg * OP.S], side = o.isL ? 1 : -1, cols = ['#ff6b6b', '#4ade80', '#4cc9f0'];
    const out = (P, c, dashedBack) => { // ray leaving optic point P toward the image
      const dx = I[0] - P[0], dy = I[1] - P[1]; const realSide = (I[0] - OP.x0) * side > 0; let dir = realSide ? [dx, dy] : [-dx, -dy]; const len = Math.hypot(dir[0], dir[1]) || 1; dir = [dir[0] / len, dir[1] / len];
      const t = (OP.x0 + side * 440 - P[0]) / (dir[0] * (side) * side || 1) * 1; const T = Math.abs((OP.x0 + side * 440 - P[0]) / (dir[0] || 1e-9)); const E = [P[0] + dir[0] * T, P[1] + dir[1] * T];
      return `<line x1="${P[0]}" y1="${P[1]}" x2="${E[0]}" y2="${E[1]}" stroke="${c}" stroke-width="2.2"/>` + (!realSide ? `<line x1="${P[0]}" y1="${P[1]}" x2="${I[0]}" y2="${I[1]}" stroke="${c}" stroke-width="1.8" stroke-dasharray="5 5"/>` : '');
    };
    let s = `<line x1="${tip[0]}" y1="${tip[1]}" x2="${OP.x0}" y2="${tip[1]}" stroke="${cols[0]}" stroke-width="2.2"/>` + out([OP.x0, tip[1]], cols[0]);
    s += `<line x1="${tip[0]}" y1="${tip[1]}" x2="${OP.x0}" y2="${OP.y0}" stroke="${cols[1]}" stroke-width="2.2"/>` + out([OP.x0, OP.y0], cols[1]);
    s += `<line x1="${tip[0]}" y1="${tip[1]}" x2="${OP.x0}" y2="${I[1]}" stroke="${cols[2]}" stroke-width="2.2"/>` + out([OP.x0, I[1]], cols[2]);
    // image arrow
    s += `<g opacity="${o.real ? 1 : .75}">${L(I[0], OP.y0, I[0], I[1], o.real ? '#ffd23f' : '#ffd23f', 4, o.real ? '' : '6 4')}<path d="M${I[0] - 7} ${I[1] + (o.himg > 0 ? 10 : -10)}L${I[0]} ${I[1]}L${I[0] + 7} ${I[1] + (o.himg > 0 ? 10 : -10)}" fill="none" stroke="#ffd23f" stroke-width="3.5"/></g>` + TX(I[0], o.himg > 0 ? I[1] - 10 : I[1] + 20, o.real ? 'real image' : 'virtual image', { s: 11, c: '#ffe9a8' });
    return s;
  }
})();
