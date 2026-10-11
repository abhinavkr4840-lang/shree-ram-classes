/* Physics Fury — question bank (no DOM, no dependencies).
   Every template builds a fresh numerical problem with its own formula, hint, step-by-step solution
   and "slip" answers (the typical mistakes students make) so wrong fruits are meaningful.
   Tiers: 1 formula recall · 2 easy numerical · 3 two-step / units · 4 multi-step · 5 ISC-level (also used for bosses)
   Public API: window.PF_QUESTIONS = { make(opts), TOPICS, count(), fmt(n), templates }              */
(function (root) {
  'use strict';
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const rnd = v => Math.round(v * 100) / 100;
  const fmt = n => { const r = rnd(n); return (Object.is(r, -0) ? 0 : r).toString(); };

  const TOPICS = {
    kin: 'Kinematics', force: 'Laws of Motion', work: 'Work & Energy', grav: 'Gravitation',
    elec: 'Electricity', mag: 'Magnetism', optics: 'Optics', heat: 'Heat & Gases',
    wave: 'Waves & Sound', fluid: 'Fluids', modern: 'Modern Physics', shm: 'Oscillations'
  };
  const T = [];
  const add = (id, topic, tier, fn) => T.push({ id, topic, tier, fn });
  const G = 'g = 10 m/s²';

  /* ---------------- KINEMATICS ---------------- */
  add('kin-v', 'kin', 1, () => { const u = ri(0, 5) * 2, a = ri(2, 6), t = ri(2, 8), v = u + a * t;
    return { q: `A car moving at ${u} m/s accelerates at ${a} m/s² for ${t} s. Final speed?`, ans: v, unit: 'm/s',
      formula: 'v = u + at', hint: 'Add the speed gained (a × t) to the starting speed.',
      steps: ['v = u + at', `v = ${u} + ${a} × ${t}`, `v = ${u} + ${a * t} = ${v} m/s`],
      slips: [[a * t, 'You forgot the initial speed u.'], [u * t + a, 'Mixed up the terms of v = u + at.']] }; });
  add('kin-avg', 'kin', 1, () => { const v = ri(4, 20) * 5, t = ri(2, 9), d = v * t;
    return { q: `A cyclist covers ${d} m in ${t} s. Average speed?`, ans: v, unit: 'm/s',
      formula: 'speed = distance ÷ time', hint: 'Divide the distance by the time.',
      steps: ['speed = distance / time', `speed = ${d} / ${t}`, `speed = ${v} m/s`], slips: [[d * t, 'You multiplied instead of dividing.']] }; });
  add('kin-s', 'kin', 2, () => { const u = ri(1, 6), a = ri(1, 4) * 2, t = ri(2, 6), s = u * t + a * t * t / 2;
    return { q: `A body starts at ${u} m/s with acceleration ${a} m/s². Distance covered in ${t} s?`, ans: s, unit: 'm',
      formula: 's = ut + ½at²', hint: 'Use s = ut + ½at². Square the time first.',
      steps: ['s = ut + ½at²', `s = ${u}×${t} + ½×${a}×${t}²`, `s = ${u * t} + ${a * t * t / 2} = ${fmt(s)} m`],
      slips: [[u * t + a * t, 'You used at instead of ½at².'], [u * t + a * t * t, 'You forgot the ½.']] }; });
  add('kin-fall', 'kin', 2, () => { const t = ri(2, 6), h = 5 * t * t;
    return { q: `A stone is dropped from a ${h} m high tower. Time to reach the ground? (${G})`, ans: t, unit: 's',
      formula: 'h = ½gt²', hint: 'Starts from rest, so h = ½gt². Solve for t.',
      steps: ['h = ½gt²', `${h} = ½ × 10 × t² = 5t²`, `t² = ${t * t}`, `t = ${t} s`], slips: [[t * t, 'You stopped at t² — take the square root.'], [h / 10, 'You used t = h/g.']] }; });
  add('kin-v2', 'kin', 3, () => { const u = ri(1, 5) * 2, a = ri(1, 4) * 2, k = ri(2, 8), s = k * 2 * 5, v2 = u * u + 2 * a * s;
    const ans = Math.sqrt(v2); if (!Number.isInteger(ans)) return null;
    return { q: `A scooter at ${u} m/s accelerates uniformly at ${a} m/s² over ${s} m. Final speed?`, ans, unit: 'm/s',
      formula: 'v² = u² + 2as', hint: 'No time given — use v² = u² + 2as, then take the square root.',
      steps: ['v² = u² + 2as', `v² = ${u}² + 2×${a}×${s} = ${u * u} + ${2 * a * s}`, `v² = ${v2}`, `v = ${ans} m/s`], slips: [[v2, 'You did not take the square root.']] }; });
  add('kin-brake', 'kin', 3, () => { const a = ri(2, 5), v = a * ri(3, 8) * 2 / 2 * 2; const s = v * v / (2 * a);
    return { q: `A car moving at ${v} m/s brakes with a uniform retardation of ${a} m/s². Stopping distance?`, ans: s, unit: 'm',
      formula: 'v² = u² + 2as  (final v = 0)', hint: 'Final speed is 0, so s = u² ÷ 2a.',
      steps: ['0 = u² − 2as  →  s = u²/(2a)', `s = ${v}² / (2×${a}) = ${v * v}/${2 * a}`, `s = ${fmt(s)} m`], slips: [[v * v / a, 'You forgot the 2 in 2a.'], [v / a, 'That is the stopping time, not distance.']] }; });
  add('kin-kmh', 'kin', 3, () => { const k = ri(2, 10) * 18, t = ri(2, 6), v = k / 3.6, d = v * t;
    return { q: `A train runs at ${k} km/h for ${t} s. Distance in metres?`, ans: d, unit: 'm',
      formula: '1 km/h = 5/18 m/s', hint: 'Convert km/h to m/s first (multiply by 5/18).',
      steps: [`${k} km/h = ${k} × 5/18 = ${fmt(v)} m/s`, 'd = v × t', `d = ${fmt(v)} × ${t} = ${fmt(d)} m`], slips: [[k * t, 'You skipped the unit conversion.']] }; });
  add('kin-vt', 'kin', 3, () => { const v = ri(2, 8) * 5, t1 = ri(2, 6), t2 = ri(2, 6), s = v * t1 / 2 + v * t2;
    return { q: `A v–t graph shows speed rising uniformly 0 → ${v} m/s in ${t1} s, then constant for ${t2} s. Total distance?`, ans: s, unit: 'm',
      formula: 'distance = area under the v–t graph', hint: 'Triangle area (½ × base × height) plus rectangle area.',
      steps: [`Triangle = ½ × ${t1} × ${v} = ${v * t1 / 2}`, `Rectangle = ${v} × ${t2} = ${v * t2}`, `Total = ${fmt(s)} m`], slips: [[v * (t1 + t2), 'You treated the triangle as a rectangle.']] }; });
  add('kin-proj', 'kin', 4, () => { const t = ri(1, 4), h = 5 * t * t, u = ri(2, 10) * 5, R = u * t;
    return { q: `A ball is thrown horizontally at ${u} m/s from a ${h} m high cliff. Horizontal distance from the base? (${G})`, ans: R, unit: 'm',
      formula: 'h = ½gt²  and  R = u·t', hint: 'First find the fall time from the height, then multiply by horizontal speed.',
      steps: ['Fall time: h = ½gt²', `${h} = 5t² → t = ${t} s`, 'Horizontal speed stays constant: R = u × t', `R = ${u} × ${t} = ${R} m`], slips: [[h, 'That is the height, not the range.'], [u * t * 2, 'Time was doubled.']] }; });
  add('kin-up', 'kin', 4, () => { const u = ri(1, 6) * 10, H = u * u / 20, T2 = u / 5;
    return { q: `A ball is thrown vertically upward at ${u} m/s. Find its maximum height and give the answer for height. (${G})`, ans: H, unit: 'm',
      formula: 'v² = u² − 2gH  (v = 0 at top)', hint: 'At the top v = 0, so H = u² ÷ 2g.',
      steps: ['0 = u² − 2gH', `H = u²/(2g) = ${u * u}/20`, `H = ${fmt(H)} m`], slips: [[u * u / 10, 'You used g instead of 2g.'], [T2, 'That is the total time of flight.']] }; });
  add('kin-ang', 'kin', 5, () => { const u = ri(1, 5) * 8, H = (u * 0.5) ** 2 / 20;
    return { q: `A projectile is fired at ${u} m/s at 30° to the horizontal. Maximum height? (${G}, sin 30° = 0.5)`, ans: H, unit: 'm',
      formula: 'H = (u sinθ)² / 2g', hint: 'Only the vertical component u sin θ matters for height.',
      steps: [`Vertical component = ${u} × 0.5 = ${u / 2} m/s`, `H = (${u / 2})² / (2×10) = ${(u / 2) ** 2}/20`, `H = ${fmt(H)} m`], slips: [[u * u / 20, 'You used the full speed instead of u sin θ.']] }; });
  add('kin-two', 'kin', 5, () => { const a = ri(1, 3) * 2, t1 = ri(3, 6), t2 = ri(2, 5), v = a * t1, s = a * t1 * t1 / 2 + v * t2;
    return { q: `A car starts from rest at ${a} m/s² for ${t1} s, then moves at constant speed for ${t2} s. Total distance?`, ans: s, unit: 'm',
      formula: 's₁ = ½at²,  v = at,  s₂ = v·t', hint: 'Do it in two stages: accelerating, then constant speed.',
      steps: [`Stage 1: s₁ = ½×${a}×${t1}² = ${a * t1 * t1 / 2} m`, `Speed reached v = ${a}×${t1} = ${v} m/s`, `Stage 2: s₂ = ${v}×${t2} = ${v * t2} m`, `Total = ${fmt(s)} m`], slips: [[v * t2, 'You forgot stage 1.'], [a * t1 * t1 / 2, 'You forgot stage 2.']] }; });

  /* ---------------- LAWS OF MOTION ---------------- */
  add('f-ma', 'force', 1, () => { const m = ri(2, 12), a = ri(2, 9), F = m * a;
    return { q: `A ${m} kg block accelerates at ${a} m/s². Net force?`, ans: F, unit: 'N', formula: 'F = ma', hint: 'Multiply mass by acceleration.',
      steps: ['F = ma', `F = ${m} × ${a} = ${F} N`], slips: [[m + a, 'You added instead of multiplying.'], [m / a, 'You divided.']] }; });
  add('f-w', 'force', 1, () => { const m = ri(2, 15) * 5, W = m * 10;
    return { q: `Weight of a ${m} kg body? (${G})`, ans: W, unit: 'N', formula: 'W = mg', hint: 'Weight is mass × g.',
      steps: ['W = mg', `W = ${m} × 10 = ${W} N`], slips: [[m, 'That is the mass, not weight.']] }; });
  add('f-p', 'force', 1, () => { const m = ri(2, 10), v = ri(3, 12), p = m * v;
    return { q: `Momentum of a ${m} kg trolley moving at ${v} m/s?`, ans: p, unit: 'kg m/s', formula: 'p = mv', hint: 'Mass × velocity.',
      steps: ['p = mv', `p = ${m} × ${v} = ${p} kg m/s`], slips: [[m + v, 'You added.']] }; });
  add('f-imp', 'force', 3, () => { const m = ri(2, 5), dv = ri(2, 8), t = ri(2, 5), F = m * dv / t * 1; const Fi = m * dv * t; // F*t = m dv
    return { q: `A constant force of ${m * dv} N acts on a ${m} kg body for ${t} s from rest. Final speed?`, ans: dv * t, unit: 'm/s',
      formula: 'Ft = mv − mu  (impulse = change in momentum)', hint: 'Impulse F×t equals the change in momentum.',
      steps: ['Ft = m(v − u)', `${m * dv} × ${t} = ${m} × v`, `v = ${m * dv * t}/${m} = ${dv * t} m/s`], slips: [[m * dv, 'You forgot to multiply by time.']] }; });
  add('f-fric', 'force', 3, () => { const m = ri(2, 6) * 5, mu = pick([0.2, 0.25, 0.4, 0.5]), Fr = mu * m * 10, extra = ri(2, 6) * 5, F = Fr + extra, a = extra / m;
    return { q: `A ${m} kg block on a rough floor (μ = ${mu}) is pushed with ${fmt(F)} N. Acceleration? (${G})`, ans: a, unit: 'm/s²',
      formula: 'a = (F − μmg) / m', hint: 'Subtract friction μmg from the push, then divide by mass.',
      steps: [`Friction = μmg = ${mu}×${m}×10 = ${fmt(Fr)} N`, `Net force = ${fmt(F)} − ${fmt(Fr)} = ${extra} N`, `a = ${extra}/${m} = ${fmt(a)} m/s²`], slips: [[F / m, 'You ignored friction.']] }; });
  add('f-incl', 'force', 4, () => { const t = ri(2, 6), a = 5, v = a * t, s = a * t * t / 2;
    return { q: `A smooth 30° incline: a block is released from rest. Distance covered in ${t} s? (${G}, a = g sin30°)`, ans: s, unit: 'm',
      formula: 'a = g sinθ,  s = ½at²', hint: 'Acceleration down a smooth slope is g sinθ = 5 m/s².',
      steps: ['a = g sin30° = 10 × 0.5 = 5 m/s²', 's = ½at² = ½ × 5 × ' + t + '²', `s = ${fmt(s)} m`], slips: [[10 * t * t / 2, 'You used a = g (ignored the slope).'], [v, 'That is the final speed.']] }; });
  add('f-coll', 'force', 4, () => { const m1 = ri(2, 5), m2 = ri(1, 4), v = ri(2, 5), M = m1 + m2; const v1 = M * v / m1; if (!Number.isInteger(v1)) return null;
    return { q: `A ${m1} kg trolley at ${v1} m/s hits a ${m2} kg trolley at rest and they stick together. Speed after collision?`, ans: v, unit: 'm/s',
      formula: 'm₁u₁ + m₂u₂ = (m₁ + m₂)v', hint: 'Momentum is conserved. Total mass moves together.',
      steps: [`Momentum before = ${m1}×${v1} + 0 = ${m1 * v1}`, `Momentum after = (${m1}+${m2}) v`, `v = ${m1 * v1}/${M} = ${v} m/s`], slips: [[v1, 'You ignored the extra mass.']] }; });
  add('f-lift', 'force', 4, () => { const m = ri(4, 12) * 5, a = ri(1, 3), N = m * (10 + a);
    return { q: `A ${m} kg man stands in a lift accelerating upward at ${a} m/s². Normal force on him? (${G})`, ans: N, unit: 'N',
      formula: 'N − mg = ma', hint: 'Going up with acceleration, N = m(g + a).',
      steps: ['N − mg = ma', `N = m(g + a) = ${m} × (10 + ${a})`, `N = ${N} N`], slips: [[m * (10 - a), 'You used g − a (that is for a downward lift).'], [m * 10, 'That is the rest weight.']] }; });
  add('f-gun', 'force', 5, () => { const m = ri(1, 5) * 10, v = ri(2, 6) * 100, Mg = ri(2, 6) * 2, V = m * v / (Mg * 1000);
    return { q: `A ${m} g bullet leaves a ${Mg} kg rifle at ${v} m/s. Recoil speed of the rifle?`, ans: V, unit: 'm/s',
      formula: 'm v = M V  (momentum conservation)', hint: 'Convert grams to kg first. Total momentum stays zero.',
      steps: [`m = ${m} g = ${m / 1000} kg`, `0 = ${m / 1000}×${v} − ${Mg}×V`, `V = ${fmt(m * v / 1000)}/${Mg} = ${fmt(V)} m/s`], slips: [[m * v / Mg, 'You forgot to convert grams to kg.']] }; });
  add('f-circ', 'force', 5, () => { const m = ri(1, 4), v = ri(2, 6) * 2, r = ri(1, 4) * 2, F = m * v * v / r;
    return { q: `A ${m} kg stone is whirled in a circle of radius ${r} m at ${v} m/s. Tension in the string?`, ans: F, unit: 'N',
      formula: 'F = mv² / r', hint: 'Centripetal force: square the speed, then divide by radius.',
      steps: ['F = mv²/r', `F = ${m} × ${v}² / ${r} = ${m * v * v}/${r}`, `F = ${fmt(F)} N`], slips: [[m * v / r, 'You did not square v.']] }; });
  add('f-atw', 'force', 5, () => { const m1 = pick([3, 5, 7]), m2 = pick([1, 3]), a = (m1 - m2) * 10 / (m1 + m2), Tn = 2 * m1 * m2 * 10 / (m1 + m2);
    if (m1 <= m2) return null;
    return { q: `Two masses ${m1} kg and ${m2} kg hang over a light pulley (Atwood machine). Acceleration? (${G})`, ans: a, unit: 'm/s²',
      formula: 'a = (m₁ − m₂)g / (m₁ + m₂)', hint: 'Net driving force is the weight difference; it moves both masses.',
      steps: [`Driving force = (${m1}−${m2})×10 = ${(m1 - m2) * 10} N`, `Total mass = ${m1 + m2} kg`, `a = ${(m1 - m2) * 10}/${m1 + m2} = ${fmt(a)} m/s²`], slips: [[(m1 - m2) * 10 / m1, 'You divided by only one mass.'], [Tn, 'That is the tension.']] }; });

  /* ---------------- WORK & ENERGY ---------------- */
  add('w-fd', 'work', 1, () => { const F = ri(2, 20) * 5, d = ri(2, 10), W = F * d;
    return { q: `A force of ${F} N moves a box ${d} m along the force. Work done?`, ans: W, unit: 'J', formula: 'W = F × d', hint: 'Force × distance.',
      steps: ['W = Fd', `W = ${F} × ${d} = ${W} J`], slips: [[F + d, 'You added.']] }; });
  add('w-ke', 'work', 2, () => { const m = ri(1, 10) * 2, v = ri(2, 10), K = m * v * v / 2;
    return { q: `Kinetic energy of a ${m} kg object moving at ${v} m/s?`, ans: K, unit: 'J', formula: 'KE = ½mv²', hint: 'Square the speed first.',
      steps: ['KE = ½mv²', `KE = ½ × ${m} × ${v}²`, `KE = ${fmt(K)} J`], slips: [[m * v * v, 'You forgot the ½.'], [m * v / 2, 'You did not square v.']] }; });
  add('w-pe', 'work', 2, () => { const m = ri(2, 20), h = ri(2, 15), U = m * 10 * h;
    return { q: `Potential energy of a ${m} kg mass lifted ${h} m? (${G})`, ans: U, unit: 'J', formula: 'PE = mgh', hint: 'mass × g × height.',
      steps: ['PE = mgh', `PE = ${m} × 10 × ${h} = ${U} J`], slips: [[m * h, 'You forgot g.']] }; });
  add('w-pow', 'work', 2, () => { const t = ri(2, 10), P = ri(2, 20) * 10, W = P * t;
    return { q: `A machine does ${W} J of work in ${t} s. Power?`, ans: P, unit: 'W', formula: 'P = W / t', hint: 'Work ÷ time.',
      steps: ['P = W/t', `P = ${W}/${t} = ${P} W`], slips: [[W * t, 'You multiplied.']] }; });
  add('w-cons', 'work', 3, () => { const h = pick([5, 20, 45, 80]), v = Math.sqrt(20 * h);
    return { q: `A ball is dropped from ${h} m. Speed just before hitting the ground? (${G}, no air resistance)`, ans: v, unit: 'm/s',
      formula: 'mgh = ½mv²  →  v = √(2gh)', hint: 'Potential energy turns into kinetic energy. Mass cancels.',
      steps: ['mgh = ½mv²', `v² = 2gh = 2×10×${h} = ${20 * h}`, `v = ${fmt(v)} m/s`], slips: [[20 * h, 'You forgot the square root.'], [h, 'That is the height.']] }; });
  add('w-eff', 'work', 3, () => { const eta = pick([20, 25, 40, 50, 60, 80]), inp = ri(2, 10) * 100, out = inp * eta / 100;
    return { q: `A machine takes ${inp} J of input and delivers ${out} J of useful work. Efficiency (%)?`, ans: eta, unit: '%',
      formula: 'η = (output ÷ input) × 100', hint: 'Useful output over total input, as a percentage.',
      steps: ['η = out/in × 100', `η = ${out}/${inp} × 100`, `η = ${eta} %`], slips: [[inp / out * 100, 'You inverted the ratio.']] }; });
  add('w-spr', 'work', 4, () => { const k = ri(1, 5) * 100, xc = ri(2, 10), x = xc / 100, U = k * x * x / 2;
    return { q: `A spring (k = ${k} N/m) is stretched by ${xc} cm. Energy stored?`, ans: U, unit: 'J', formula: 'U = ½kx²  (x in metres)', hint: 'Convert cm to m before squaring.',
      steps: [`x = ${xc} cm = ${x} m`, `U = ½ × ${k} × ${x}²`, `U = ${fmt(U)} J`], slips: [[k * xc * xc / 2, 'You used cm instead of m.']] }; });
  add('w-brk', 'work', 4, () => { const m = ri(2, 8) * 250, v = ri(2, 5) * 5, d = ri(2, 6) * 5, F = m * v * v / 2 / d;
    return { q: `A ${m} kg car at ${v} m/s is brought to rest in ${d} m. Average braking force?`, ans: F, unit: 'N',
      formula: 'Work done by brakes = loss of KE:  F·d = ½mv²', hint: 'Equate F×d to the kinetic energy lost.',
      steps: [`KE = ½×${m}×${v}² = ${fmt(m * v * v / 2)} J`, `F × ${d} = ${fmt(m * v * v / 2)}`, `F = ${fmt(F)} N`], slips: [[m * v * v / 2, 'That is the energy, not the force.']] }; });
  add('w-pump', 'work', 5, () => { const V = ri(1, 5) * 100, h = ri(2, 6) * 5, t = ri(1, 5) * 10, eta = pick([50, 80]), m = V, P = m * 10 * h / t / (eta / 100);
    return { q: `A ${eta}%-efficient pump lifts ${V} L of water (1 L = 1 kg) through ${h} m in ${t} s. Input power? (${G})`, ans: P, unit: 'W',
      formula: 'P_in = (mgh / t) ÷ η', hint: 'Find the useful power first, then divide by the efficiency.',
      steps: [`Useful work = mgh = ${m}×10×${h} = ${m * 10 * h} J`, `Useful power = ${m * 10 * h}/${t} = ${fmt(m * 10 * h / t)} W`, `Input = ${fmt(m * 10 * h / t)} ÷ ${eta / 100} = ${fmt(P)} W`], slips: [[m * 10 * h / t, 'That is only the useful power.'], [m * 10 * h / t * eta / 100, 'You multiplied by η instead of dividing.']] }; });

  /* ---------------- GRAVITATION ---------------- */
  add('g-ratio', 'grav', 3, () => { const k = pick([2, 3, 4]), F = ri(2, 9) * k * k, ans = F / (k * k);
    return { q: `Gravitational force between two masses is ${F} N. If the distance between them is made ${k} times larger, new force?`, ans, unit: 'N',
      formula: 'F ∝ 1 / r²', hint: 'Inverse-square law: divide by the square of the factor.',
      steps: ['F ∝ 1/r²', `New F = ${F} / ${k}² = ${F}/${k * k}`, `New F = ${fmt(ans)} N`], slips: [[F / k, 'You used 1/r instead of 1/r².']] }; });
  add('g-h', 'grav', 4, () => { const m = ri(2, 10) * 10, W = m * 10 / 4;
    return { q: `A ${m} kg satellite is at a height equal to Earth's radius R. Its weight there? (surface g = 10 m/s²)`, ans: W, unit: 'N',
      formula: "g' = g R² / (R + h)²", hint: 'Distance from Earth’s centre becomes 2R.',
      steps: ['Distance = R + R = 2R', "g' = g/(2)² = 10/4 = 2.5 m/s²", `W = ${m} × 2.5 = ${fmt(W)} N`], slips: [[m * 10 / 2, 'You used 1/2 instead of 1/4.'], [m * 10, 'Weight does decrease with height.']] }; });
  add('g-planet', 'grav', 4, () => { const [M, R] = pick([[8, 2], [9, 3], [4, 2], [16, 4], [2, 1]]), gp = 10 * M / (R * R);
    return { q: `A planet has ${M}× Earth’s mass and ${R}× Earth’s radius. Its surface gravity? (Earth g = 10 m/s²)`, ans: gp, unit: 'm/s²',
      formula: 'g = GM / R²', hint: 'g ∝ M / R². Compare with Earth.',
      steps: ['g ∝ M/R²', `g_planet = 10 × ${M} / ${R}² = ${10 * M}/${R * R}`, `g_planet = ${fmt(gp)} m/s²`], slips: [[10 * M / R, 'You did not square R.'], [10 * M * R, 'Wrong direction for R.']] }; });
  add('g-orb', 'grav', 5, () => { const T1 = ri(1, 4), [k, f] = pick([[4, 8], [9, 27]]), ans = T1 * f;
    return { q: `A satellite orbits at radius r with period ${T1} h. A second satellite orbits at ${k}r. Its period?`, ans, unit: 'h',
      formula: "Kepler's 3rd law: T² ∝ r³", hint: 'T ∝ r^(3/2). Raise the radius ratio to the power 3/2.',
      steps: ['T² ∝ r³  →  T₂/T₁ = (r₂/r₁)^(3/2)', `T₂/T₁ = ${k}^(3/2) = ${f}`, `T₂ = ${T1} × ${f} = ${ans} h`], slips: [[T1 * k, 'You used T ∝ r.'], [T1 * k * k, 'You used T ∝ r².']] }; });
  add('g-v', 'grav', 5, () => { const v = ri(2, 6) * 2, k = pick([4, 9]), ans = v / Math.sqrt(k);
    return { q: `A satellite orbits at ${v} km/s. Another orbits at ${k} times the radius around the same planet. Its orbital speed?`, ans, unit: 'km/s',
      formula: 'v = √(GM / r)', hint: 'v ∝ 1/√r — bigger orbits are slower.',
      steps: ['v ∝ 1/√r', `v₂ = ${v} / √${k} = ${v}/${Math.sqrt(k)}`, `v₂ = ${fmt(ans)} km/s`], slips: [[v / k, 'You used v ∝ 1/r.'], [v * Math.sqrt(k), 'Larger orbits are slower, not faster.']] }; });

  /* ---------------- ELECTRICITY ---------------- */
  add('e-ohm', 'elec', 1, () => { const I = ri(1, 6), R = ri(2, 20), V = I * R;
    return { q: `A ${R} Ω resistor carries ${I} A. Voltage across it?`, ans: V, unit: 'V', formula: 'V = IR', hint: 'Current × resistance.',
      steps: ['V = IR', `V = ${I} × ${R} = ${V} V`], slips: [[R / I, 'You divided.']] }; });
  add('e-q', 'elec', 1, () => { const I = ri(2, 8), t = ri(3, 12), Q = I * t;
    return { q: `A current of ${I} A flows for ${t} s. Charge passed?`, ans: Q, unit: 'C', formula: 'Q = It', hint: 'Current × time.',
      steps: ['Q = It', `Q = ${I} × ${t} = ${Q} C`], slips: [[I + t, 'You added.']] }; });
  add('e-ser', 'elec', 2, () => { const r1 = ri(2, 8), r2 = ri(2, 8), r3 = ri(1, 6), V = ri(2, 6) * (r1 + r2 + r3), I = V / (r1 + r2 + r3);
    return { q: `Resistors ${r1} Ω, ${r2} Ω and ${r3} Ω are in series across ${V} V. Current?`, ans: I, unit: 'A', formula: 'R = R₁+R₂+R₃,  I = V/R', hint: 'Add the resistances, then use Ohm’s law.',
      steps: [`R = ${r1}+${r2}+${r3} = ${r1 + r2 + r3} Ω`, `I = V/R = ${V}/${r1 + r2 + r3}`, `I = ${fmt(I)} A`], slips: [[V / r1, 'You used only the first resistor.']] }; });
  add('e-par', 'elec', 3, () => { const [a, b, r] = pick([[6, 3, 2], [12, 4, 3], [20, 5, 4], [30, 15, 10], [10, 10, 5], [12, 6, 4], [15, 10, 6]]), V = ri(2, 6) * 6, I = V / r;
    return { q: `${a} Ω and ${b} Ω are in parallel across ${V} V. Total current drawn?`, ans: I, unit: 'A', formula: '1/R = 1/R₁ + 1/R₂', hint: 'Find the parallel resistance first (product ÷ sum works for two).',
      steps: [`R = (${a}×${b})/(${a}+${b}) = ${a * b}/${a + b} = ${r} Ω`, `I = V/R = ${V}/${r}`, `I = ${fmt(I)} A`], slips: [[V / (a + b), 'You added them (series).']] }; });
  add('e-pow', 'elec', 2, () => { const V = pick([12, 24, 110, 220]), I = ri(1, 5), P = V * I;
    return { q: `An appliance on ${V} V draws ${I} A. Power?`, ans: P, unit: 'W', formula: 'P = VI', hint: 'Voltage × current.',
      steps: ['P = VI', `P = ${V} × ${I} = ${P} W`], slips: [[V / I, 'You divided.']] }; });
  add('e-heat', 'elec', 3, () => { const I = ri(2, 5), R = ri(2, 10), t = ri(2, 10), H = I * I * R * t;
    return { q: `A heater coil of ${R} Ω carries ${I} A for ${t} s. Heat produced?`, ans: H, unit: 'J', formula: 'H = I²Rt', hint: 'Square the current.',
      steps: ['H = I²Rt', `H = ${I}² × ${R} × ${t} = ${I * I} × ${R} × ${t}`, `H = ${H} J`], slips: [[I * R * t, 'You did not square I.']] }; });
  add('e-bill', 'elec', 3, () => { const P = ri(2, 10) * 100, h = ri(2, 8), d = ri(10, 30), rate = ri(4, 8), kWh = P * h * d / 1000, cost = kWh * rate;
    return { q: `A ${P} W heater runs ${h} h a day for ${d} days at ₹${rate} per unit (kWh). Total cost (₹)?`, ans: cost, unit: '₹', formula: 'Energy (kWh) = P(kW) × hours', hint: 'Convert watts to kilowatts, multiply by total hours, then by the rate.',
      steps: [`Energy = ${P / 1000} kW × ${h * d} h = ${fmt(kWh)} kWh`, `Cost = ${fmt(kWh)} × ${rate}`, `Cost = ₹${fmt(cost)}`], slips: [[kWh, 'You forgot the rate.'], [P * h * d * rate, 'You did not convert W to kW.']] }; });
  add('e-res', 'elec', 4, () => { const R = ri(2, 10), f = pick([2, 3]), ans = R * f * f;
    return { q: `A wire has resistance ${R} Ω. It is stretched uniformly to ${f} times its length (volume constant). New resistance?`, ans, unit: 'Ω', formula: 'R = ρL/A, with L·A constant → R ∝ L²', hint: 'Length × f means area ÷ f, so R changes by f × f.',
      steps: ['L → fL and A → A/f', `R' = ρ(fL)/(A/f) = f² R`, `R' = ${f * f} × ${R} = ${ans} Ω`], slips: [[R * f, 'You forgot the area also shrinks.']] }; });
  add('e-comb', 'elec', 4, () => { const r0 = ri(1, 4), [a, b, rp] = pick([[6, 3, 2], [12, 4, 3], [20, 5, 4], [30, 15, 10]]), Rt = r0 + rp, V = ri(2, 5) * Rt, I = V / Rt;
    return { q: `A ${r0} Ω resistor is in series with a parallel pair of ${a} Ω and ${b} Ω, all across ${V} V. Total current?`, ans: I, unit: 'A', formula: 'R_total = R₀ + R_parallel', hint: 'Reduce the parallel pair first, then add the series resistor.',
      steps: [`Parallel: ${a}×${b}/(${a}+${b}) = ${rp} Ω`, `Total R = ${r0} + ${rp} = ${Rt} Ω`, `I = ${V}/${Rt} = ${fmt(I)} A`], slips: [[V / (r0 + a + b), 'You added all three in series.']] }; });
  add('e-emf', 'elec', 5, () => { const r = pick([0.5, 1, 2]), R = ri(2, 8), E = (R + r) * ri(1, 4) * 2, I = E / (R + r), Vt = I * R;
    return { q: `A cell of emf ${fmt(E)} V and internal resistance ${r} Ω drives a ${R} Ω resistor. Terminal voltage?`, ans: Vt, unit: 'V', formula: 'I = E/(R + r),  V = IR', hint: 'Current uses the TOTAL resistance; terminal voltage uses only the outside R.',
      steps: [`I = E/(R+r) = ${fmt(E)}/${fmt(R + r)} = ${fmt(I)} A`, `V = IR = ${fmt(I)} × ${R}`, `V = ${fmt(Vt)} V`], slips: [[E, 'You gave the emf — there is a drop across r.'], [E - I * R, 'That is the lost voltage across r.']] }; });
  add('e-cap', 'elec', 5, () => { const [a, b, c] = pick([[6, 3, 2], [12, 4, 3], [20, 5, 4], [30, 15, 10]]), V = ri(2, 10) * 10, E = 0.5 * c * V * V / 1000;
    return { q: `Capacitors ${a} μF and ${b} μF are in series, charged to ${V} V. Energy stored (mJ)?`, ans: E, unit: 'mJ', formula: 'C_s = C₁C₂/(C₁+C₂),  U = ½CV²', hint: 'Series capacitors combine like parallel resistors.',
      steps: [`C = ${a}×${b}/${a + b} = ${c} μF`, `U = ½ × ${c} × ${V}² μJ = ${fmt(0.5 * c * V * V)} μJ`, `U = ${fmt(E)} mJ`], slips: [[0.5 * (a + b) * V * V / 1000, 'You added the capacitances (that is for parallel).']] }; });

  /* ---------------- MAGNETISM ---------------- */
  add('m-f', 'mag', 3, () => { const B = pick([0.1, 0.2, 0.5, 1]), I = ri(2, 10), L = ri(2, 10) / 2, F = B * I * L;
    return { q: `A ${L} m wire carrying ${I} A is perpendicular to a ${B} T field. Force on it?`, ans: F, unit: 'N', formula: 'F = BIL sinθ  (θ = 90°)', hint: 'Perpendicular, so sin 90° = 1.',
      steps: ['F = BIL', `F = ${B} × ${I} × ${L}`, `F = ${fmt(F)} N`], slips: [[B * I, 'You forgot the length.']] }; });
  add('m-q', 'mag', 4, () => { const q = ri(1, 5), v = ri(1, 5) * 100, B = pick([0.2, 0.5, 1]), F = q * v * B / 1000;
    return { q: `A ${q} μC charge moves at ${v} m/s perpendicular to a ${B} T field. Magnetic force (in mN)?`, ans: F, unit: 'mN', formula: 'F = qvB', hint: '1 μC = 10⁻⁶ C, and 1 mN = 10⁻³ N.',
      steps: [`F = ${q}×10⁻⁶ × ${v} × ${B}`, `F = ${fmt(q * v * B)}×10⁻⁶ N`, `F = ${fmt(F)} mN`], slips: [[q * v * B, 'Unit slip: that is in μN.']] }; });
  add('m-tr', 'mag', 3, () => { const Np = ri(1, 5) * 100, k = pick([2, 3, 5, 10]), Vp = ri(2, 6) * 20, Vs = Vp * k;
    return { q: `A transformer has ${Np} primary turns and ${Np * k} secondary turns. Primary voltage is ${Vp} V. Secondary voltage?`, ans: Vs, unit: 'V', formula: 'Vs/Vp = Ns/Np', hint: 'Voltage scales with the turns ratio.',
      steps: ['Vs/Vp = Ns/Np', `Vs = ${Vp} × ${Np * k}/${Np}`, `Vs = ${Vs} V`], slips: [[Vp / k, 'You inverted the ratio.']] }; });
  add('m-emf', 'mag', 4, () => { const N = ri(1, 5) * 50, dphi = ri(2, 8), t = ri(1, 4), e = N * dphi / 1000 / t * 1;
    return { q: `A coil of ${N} turns sees its flux change by ${dphi} mWb in ${t} s. Magnitude of induced emf (V)?`, ans: e, unit: 'V', formula: 'ε = N ΔΦ / Δt', hint: '1 mWb = 10⁻³ Wb.',
      steps: [`ΔΦ = ${dphi} mWb = ${dphi / 1000} Wb`, `ε = ${N} × ${dphi / 1000} / ${t}`, `ε = ${fmt(e)} V`], slips: [[N * dphi / t, 'You forgot to convert mWb to Wb.']] }; });
  add('m-mot', 'mag', 5, () => { const B = pick([0.2, 0.5, 1]), L = ri(1, 5) / 2, v = ri(2, 10), R = ri(1, 5), e = B * L * v, I = e / R;
    return { q: `A ${L} m rod slides at ${v} m/s on rails in a ${B} T field. The circuit resistance is ${R} Ω. Induced current?`, ans: I, unit: 'A', formula: 'ε = BLv,  I = ε/R', hint: 'Motional emf first, then Ohm’s law.',
      steps: [`ε = BLv = ${B}×${L}×${v} = ${fmt(e)} V`, `I = ε/R = ${fmt(e)}/${R}`, `I = ${fmt(I)} A`], slips: [[e, 'That is the emf, not current.']] }; });
  add('m-sol', 'mag', 5, () => { const n = ri(1, 5) * 500, I = pick([0.5, 1, 2, 2.5, 4]), B = 12.56e-7 * n * I * 1000;
    return { q: `A solenoid has ${n} turns per metre and carries ${I} A. Field inside (mT)? (μ₀ = 4π×10⁻⁷, π = 3.14)`, ans: B, unit: 'mT', formula: 'B = μ₀ n I', hint: '4π × 10⁻⁷ = 12.56 × 10⁻⁷ T m/A.',
      steps: [`B = 12.56×10⁻⁷ × ${n} × ${I}`, `B = ${fmt(12.56e-7 * n * I)} T`, `B = ${fmt(B)} mT`], slips: [[12.56e-7 * n * I, 'Unit slip: that is in T, not mT.']] }; });

  /* ---------------- OPTICS ---------------- */
  const LENS = [[10, -30, 15], [10, -15, 30], [20, -30, 60], [15, -30, 30], [12, -20, 30], [20, -60, 30], [10, -20, 20]];
  add('o-snell', 'optics', 2, () => { const sr = pick([0.2, 0.3, 0.4, 0.5]), n = pick([1.5, 2, 1.25]), si = rnd(sr * n); if (si >= 1) return null;
    return { q: `Light enters glass from air with sin i = ${si} and sin r = ${sr}. Refractive index?`, ans: n, unit: '', formula: 'n = sin i / sin r', hint: 'Ratio of the sines.',
      steps: ['n = sin i / sin r', `n = ${si}/${sr}`, `n = ${fmt(n)}`], slips: [[sr / si, 'You inverted the ratio.']] }; });
  add('o-c', 'optics', 2, () => { const n = pick([1.5, 2, 1.2, 1.25]), v = 3 / n;
    return { q: `Refractive index of a medium is ${n}. Speed of light in it (×10⁸ m/s)? (c = 3 × 10⁸ m/s)`, ans: v, unit: '×10⁸ m/s', formula: 'n = c / v', hint: 'v = c ÷ n.',
      steps: ['v = c/n', `v = 3/${n}`, `v = ${fmt(v)} ×10⁸ m/s`], slips: [[3 * n, 'You multiplied.']] }; });
  add('o-pow', 'optics', 2, () => { const f = pick([20, 25, 40, 50]), P = 100 / f;
    return { q: `A lens has focal length ${f} cm. Its power (dioptres)?`, ans: P, unit: 'D', formula: 'P = 1/f (f in metres)', hint: 'Convert cm to m first.',
      steps: [`f = ${f / 100} m`, `P = 1/${f / 100}`, `P = ${fmt(P)} D`], slips: [[1 / f, 'You forgot to convert cm to m.']] }; });
  add('o-lens', 'optics', 3, () => { const [f, u, v] = pick(LENS);
    return { q: `A convex lens (f = +${f} cm) has an object ${-u} cm in front. Image distance? (1/v − 1/u = 1/f, u = ${u})`, ans: v, unit: 'cm', formula: '1/v − 1/u = 1/f', hint: 'Use 1/v = 1/f + 1/u with u negative.',
      steps: [`1/v = 1/${f} + 1/(${u})`, `1/v = ${(1 / f).toFixed(3)} − ${(1 / -u).toFixed(3)} = ${(1 / v).toFixed(3)}`, `v = ${v} cm`], slips: [[f + u, 'You added f and u instead of the reciprocals.']] }; });
  add('o-mag', 'optics', 4, () => { const [f, u, v] = pick(LENS), m = v / u;
    return { q: `A convex lens (f = ${f} cm) with the object at u = ${u} cm. Find the magnification (sign matters).`, ans: m, unit: '', formula: '1/v − 1/u = 1/f,  m = v/u', hint: 'Get v first, then divide by u.',
      steps: [`v from lens formula = ${v} cm`, 'm = v/u', `m = ${v}/(${u}) = ${fmt(m)}`], slips: [[-m, 'Check the sign: real images are inverted (negative).']] }; });
  add('o-comb', 'optics', 4, () => { const [p1, p2] = pick([[2, 2], [3, 1], [4, 1], [5, 5], [1, 1]]), P = p1 + p2, f = 100 / P;
    return { q: `Two thin lenses of power ${p1} D and ${p2} D are in contact. Focal length of the combination (cm)?`, ans: f, unit: 'cm', formula: 'P = P₁ + P₂,  f = 100/P', hint: 'Powers add for lenses in contact.',
      steps: [`P = ${p1} + ${p2} = ${P} D`, `f = 1/P = 1/${P} m`, `f = ${fmt(f)} cm`], slips: [[100 / p1 + 100 / p2, 'You added the focal lengths.']] }; });
  add('o-crit', 'optics', 4, () => { const C = pick([30, 45]), n = C === 30 ? 2 : 1.41;
    if (C === 45) return null;
    return { q: `The critical angle of a medium (relative to air) is 30°. Its refractive index? (sin 30° = 0.5)`, ans: 2, unit: '', formula: 'n = 1 / sin C', hint: 'At the critical angle, sin C = 1/n.',
      steps: ['sin C = 1/n', 'n = 1/sin 30° = 1/0.5', 'n = 2'], slips: [[0.5, 'You forgot to invert.']] }; });
  add('o-young', 'optics', 5, () => { const l = pick([500, 600, 400, 750]), D = pick([1, 1.5, 2]), d = pick([0.2, 0.3, 0.5]), b = l * D / d * 1e-3;
    return { q: `Young's double slit: λ = ${l} nm, slit separation ${d} mm, screen at ${D} m. Fringe width (mm)?`, ans: b, unit: 'mm', formula: 'β = λD / d', hint: 'Convert nm to m and mm to m — or use β(mm) = λ(nm)·D(m)/d(mm) × 10⁻³.',
      steps: [`λ = ${l}×10⁻⁹ m,  d = ${d}×10⁻³ m`, `β = (${l}×10⁻⁹ × ${D}) / (${d}×10⁻³)`, `β = ${fmt(b)} mm`], slips: [[b * 1000, 'Unit slip: that is in μm.']] }; });

  /* ---------------- HEAT & GASES ---------------- */
  add('h-q', 'heat', 2, () => { const m = ri(1, 5), dT = ri(5, 40), Q = m * 4.2 * dT;
    return { q: `Heat needed to warm ${m} kg of water by ${dT} °C? (c = 4.2 kJ/kg·°C)`, ans: Q, unit: 'kJ', formula: 'Q = mcΔT', hint: 'Mass × specific heat × temperature rise.',
      steps: ['Q = mcΔT', `Q = ${m} × 4.2 × ${dT}`, `Q = ${fmt(Q)} kJ`], slips: [[m * dT, 'You forgot c.']] }; });
  add('h-mix', 'heat', 4, () => { const m1 = ri(1, 4), m2 = ri(1, 4), t1 = ri(4, 9) * 10, t2 = ri(1, 3) * 10, T3 = (m1 * t1 + m2 * t2) / (m1 + m2);
    return { q: `${m1} kg of water at ${t1}°C is mixed with ${m2} kg at ${t2}°C. Final temperature?`, ans: T3, unit: '°C', formula: 'm₁(t₁ − T) = m₂(T − t₂)', hint: 'Heat lost by hot water = heat gained by cold water.',
      steps: [`${m1}(${t1} − T) = ${m2}(T − ${t2})`, `${m1 * t1} + ${m2 * t2} = (${m1}+${m2})T`, `T = ${m1 * t1 + m2 * t2}/${m1 + m2} = ${fmt(T3)} °C`], slips: [[(t1 + t2) / 2, 'You averaged without weighting by mass.']] }; });
  add('h-boyle', 'heat', 3, () => { const P1 = ri(1, 4) * 100, V1 = ri(2, 6) * 2, k = pick([2, 4]), V2 = V1 / k, P2 = P1 * k;
    return { q: `A gas at ${P1} kPa occupies ${V1} L. It is compressed isothermally to ${V2} L. New pressure?`, ans: P2, unit: 'kPa', formula: 'P₁V₁ = P₂V₂  (constant T)', hint: 'Boyle’s law: pressure and volume are inversely related.',
      steps: ['P₁V₁ = P₂V₂', `P₂ = ${P1} × ${V1}/${V2}`, `P₂ = ${P2} kPa`], slips: [[P1 / k, 'You inverted the relation.']] }; });
  add('h-comb', 'heat', 5, () => { const T1 = pick([27, 47, 127]), K1 = T1 + 273, K2 = K1 * 2, P1 = ri(1, 3) * 100, V1 = ri(2, 5) * 2, V2 = V1 * 2, P2 = P1 * V1 * K2 / (K1 * V2);
    return { q: `A gas at ${P1} kPa, ${V1} L and ${T1}°C is heated to ${K2 - 273}°C while its volume becomes ${V2} L. New pressure?`, ans: P2, unit: 'kPa', formula: 'P₁V₁/T₁ = P₂V₂/T₂  (T in kelvin)', hint: 'Convert both temperatures to kelvin (+273).',
      steps: [`T₁ = ${K1} K,  T₂ = ${K2} K`, `P₂ = ${P1} × ${V1} × ${K2} / (${K1} × ${V2})`, `P₂ = ${fmt(P2)} kPa`], slips: [[P1 * V1 * (K2 - 273) / ((K1 - 273) * V2), 'You used °C instead of kelvin.']] }; });
  add('h-exp', 'heat', 4, () => { const a = pick([12, 18, 24]), L = ri(1, 4), dT = ri(2, 10) * 10, d = a * L * dT / 1000;
    return { q: `A ${L} m steel rail (α = ${a}×10⁻⁶ /°C) warms by ${dT} °C. Increase in length (mm)?`, ans: d, unit: 'mm', formula: 'ΔL = αLΔT', hint: 'Compute in metres, then convert to mm.',
      steps: [`ΔL = ${a}×10⁻⁶ × ${L} × ${dT}`, `ΔL = ${fmt(a * L * dT)}×10⁻⁶ m`, `ΔL = ${fmt(d)} mm`], slips: [[a * L * dT / 1e6, 'Unit slip: that is metres.']] }; });
  add('h-car', 'heat', 5, () => { const [Th, Tc] = pick([[500, 300], [400, 300], [600, 300], [800, 400]]), eta = (1 - Tc / Th) * 100;
    return { q: `A Carnot engine works between ${Th} K and ${Tc} K. Efficiency (%)?`, ans: eta, unit: '%', formula: 'η = 1 − T_c / T_h', hint: 'Use kelvin, cold ÷ hot.',
      steps: ['η = 1 − Tc/Th', `η = 1 − ${Tc}/${Th} = ${fmt(1 - Tc / Th)}`, `η = ${fmt(eta)} %`], slips: [[Tc / Th * 100, 'That is the wasted fraction.']] }; });

  /* ---------------- WAVES & SOUND ---------------- */
  add('v-wave', 'wave', 1, () => { const f = ri(2, 20) * 5, l = ri(1, 8) / 2, v = f * l;
    return { q: `A wave has frequency ${f} Hz and wavelength ${l} m. Wave speed?`, ans: v, unit: 'm/s', formula: 'v = fλ', hint: 'Frequency × wavelength.',
      steps: ['v = fλ', `v = ${f} × ${l} = ${fmt(v)} m/s`], slips: [[f / l, 'You divided.']] }; });
  add('v-echo', 'wave', 3, () => { const t = ri(1, 6) / 2, d = 340 * t / 2;
    return { q: `An echo returns after ${t} s. Distance to the reflecting wall? (speed of sound 340 m/s)`, ans: d, unit: 'm', formula: '2d = vt', hint: 'Sound travels there AND back.',
      steps: ['2d = v t', `d = 340 × ${t}/2`, `d = ${fmt(d)} m`], slips: [[340 * t, 'You forgot the round trip (÷2).']] }; });
  add('v-beat', 'wave', 3, () => { const f1 = ri(20, 50) * 10, b = ri(2, 8), f2 = f1 + b;
    return { q: `Two tuning forks of ${f1} Hz and ${f2} Hz sound together. Beats per second?`, ans: b, unit: 'Hz', formula: 'beat frequency = |f₁ − f₂|', hint: 'Subtract the frequencies.',
      steps: ['beats = |f₁ − f₂|', `= |${f1} − ${f2}|`, `= ${b} Hz`], slips: [[f1 + f2, 'You added.']] }; });
  add('v-pipe', 'wave', 5, () => { const L = pick([0.25, 0.5, 0.75, 1]), v = 340, f = v / (4 * L);
    return { q: `Fundamental frequency of a closed pipe ${L} m long? (v = 340 m/s)`, ans: f, unit: 'Hz', formula: 'f = v / 4L  (closed pipe)', hint: 'A closed pipe fits a quarter wavelength.',
      steps: ['λ = 4L for the fundamental', `f = v/(4L) = 340/${4 * L}`, `f = ${fmt(f)} Hz`], slips: [[v / (2 * L), 'That is the open-pipe formula.']] }; });

  /* ---------------- FLUIDS ---------------- */
  add('fl-p', 'fluid', 1, () => { const A = ri(2, 10) / 10, p = ri(2, 10) * 100, F = A * p;
    return { q: `A force of ${fmt(F)} N acts on ${A} m². Pressure?`, ans: p, unit: 'Pa', formula: 'P = F / A', hint: 'Force ÷ area.',
      steps: ['P = F/A', `P = ${fmt(F)}/${A}`, `P = ${p} Pa`], slips: [[F * A, 'You multiplied.']] }; });
  add('fl-h', 'fluid', 3, () => { const h = ri(2, 20), P = 1000 * 10 * h / 1000;
    return { q: `Pressure due to water at a depth of ${h} m (in kPa)? (ρ = 1000 kg/m³, ${G})`, ans: P, unit: 'kPa', formula: 'P = ρgh', hint: 'ρ × g × h, then convert Pa to kPa.',
      steps: ['P = ρgh', `P = 1000 × 10 × ${h} = ${1000 * 10 * h} Pa`, `P = ${fmt(P)} kPa`], slips: [[1000 * 10 * h, 'Unit slip: that is in Pa.']] }; });
  add('fl-b', 'fluid', 4, () => { const V = ri(1, 6) * 100, Wt = ri(2, 8) * 2 + V / 100 * 0, U = V * 1e-6 * 1000 * 10, app = Wt - U;
    if (app <= 0) return null;
    return { q: `A ${V} cm³ metal block weighs ${Wt} N in air. Apparent weight fully submerged in water? (ρ = 1000 kg/m³, ${G})`, ans: app, unit: 'N', formula: 'Upthrust = ρVg;  apparent weight = W − U', hint: 'Convert cm³ to m³ (×10⁻⁶).',
      steps: [`V = ${V}×10⁻⁶ m³`, `U = 1000 × ${V}×10⁻⁶ × 10 = ${fmt(U)} N`, `Apparent = ${Wt} − ${fmt(U)} = ${fmt(app)} N`], slips: [[U, 'That is the upthrust itself.']] }; });
  add('fl-hyd', 'fluid', 5, () => { const A1 = ri(1, 4), k = pick([10, 20, 50]), F1 = ri(2, 10) * 10, F2 = F1 * k;
    return { q: `A hydraulic press: small piston ${A1} cm², large piston ${A1 * k} cm². A ${F1} N force on the small piston gives what force on the large one?`, ans: F2, unit: 'N', formula: 'F₁/A₁ = F₂/A₂', hint: 'Pressure is the same everywhere in the fluid.',
      steps: ['F₁/A₁ = F₂/A₂', `F₂ = ${F1} × ${A1 * k}/${A1}`, `F₂ = ${F2} N`], slips: [[F1 / k, 'You inverted the area ratio.']] }; });

  /* ---------------- MODERN PHYSICS ---------------- */
  add('mo-hl', 'modern', 4, () => { const n = ri(2, 4), N0 = ri(2, 8) * 16 * 4, T2 = ri(2, 6), N = N0 / Math.pow(2, n);
    return { q: `A sample has ${N0} g of a radioisotope of half-life ${T2} days. How many grams remain after ${n * T2} days?`, ans: N, unit: 'g', formula: 'N = N₀ / 2ⁿ,  n = t / T½', hint: 'Count how many half-lives have passed.',
      steps: [`n = ${n * T2}/${T2} = ${n} half-lives`, `N = ${N0} / 2^${n} = ${N0}/${2 ** n}`, `N = ${fmt(N)} g`], slips: [[N0 / n, 'You divided by n instead of 2ⁿ.']] }; });
  add('mo-pe', 'modern', 5, () => { const [l, E] = pick([[620, 2], [310, 4], [248, 5], [496, 2.5]]), phi = pick([1, 1.5, 2]), K = E - phi;
    if (K <= 0) return null;
    return { q: `Light of wavelength ${l} nm falls on a metal of work function ${phi} eV. Max kinetic energy of photoelectrons (eV)? (E = 1240/λ eV, λ in nm)`, ans: K, unit: 'eV', formula: 'K = hc/λ − φ', hint: 'Photon energy first, then subtract the work function.',
      steps: [`E = 1240/${l} = ${E} eV`, `K = E − φ = ${E} − ${phi}`, `K = ${fmt(K)} eV`], slips: [[E, 'You forgot to subtract φ.']] }; });
  add('mo-bohr', 'modern', 4, () => { const n = ri(2, 4), E = 13.6 / (n * n);
    return { q: `Energy of the electron in hydrogen's n = ${n} level (magnitude, eV)? (E₁ = 13.6 eV)`, ans: E, unit: 'eV', formula: 'Eₙ = 13.6 / n²', hint: 'Divide 13.6 by n squared.',
      steps: ['Eₙ = 13.6/n²', `E = 13.6/${n * n}`, `E = ${fmt(E)} eV`], slips: [[13.6 / n, 'You did not square n.']] }; });

  /* ---------------- OSCILLATIONS ---------------- */
  add('s-pen', 'shm', 4, () => { const x = pick([0.1, 0.2, 0.3, 0.5, 1]), L = 10 * x * x, Tm = 6.28 * x;
    return { q: `Time period of a simple pendulum of length ${fmt(L)} m? (g = 10 m/s², π = 3.14)`, ans: Tm, unit: 's', formula: 'T = 2π √(L/g)', hint: 'Find √(L/g) first.',
      steps: [`√(L/g) = √(${fmt(L)}/10) = ${x}`, `T = 2 × 3.14 × ${x}`, `T = ${fmt(Tm)} s`], slips: [[x, 'You forgot the 2π.']] }; });
  add('s-spr', 'shm', 5, () => { const x = pick([0.1, 0.2, 0.5]), k = ri(1, 4) * 100, m = k * x * x, Tm = 6.28 * x;
    return { q: `A ${fmt(m)} kg mass on a spring of constant ${k} N/m oscillates. Time period? (π = 3.14)`, ans: Tm, unit: 's', formula: 'T = 2π √(m/k)', hint: 'm/k first, then the square root.',
      steps: [`m/k = ${fmt(m)}/${k} = ${fmt(x * x)}`, `√(m/k) = ${x}`, `T = 2×3.14×${x} = ${fmt(Tm)} s`], slips: [[x, 'You forgot the 2π.']] }; });

  /* ---------------- ENGINE ---------------- */
  function buildOptions(p, n) {
    const real = fmt(p.ans), set = new Map([[real, null]]);
    const uniq = (v, why) => { if (!isFinite(v)) return; const k = fmt(v); if (set.has(k) || k === real) return; set.set(k, why); };
    (p.slips || []).forEach(s => uniq(s[0], s[1]));
    const base = Math.abs(p.ans) || 1;
    const facs = [2, 0.5, 1.5, 0.75, 1.25, 3, 0.25, 4, 0.8, 1.2, 10, 0.1];
    for (let i = 0; set.size < n && i < 60; i++) {
      const f = i < facs.length ? facs[i] : 1 + (Math.random() * 2 - 1) * 0.6;
      uniq(p.ans * f, null);
      if (set.size < n && Number.isInteger(p.ans)) uniq(p.ans + pick([-3, -2, -1, 1, 2, 3, 5, -5]) * Math.max(1, Math.round(base / 10)), null);
    }
    const slipKeys = [...set.keys()].filter(k => k !== real);
    const keys = slipKeys.slice(0, n - 1);
    const out = [{ v: real, ok: true }].concat(keys.map(k => ({ v: k, ok: false, why: set.get(k) })));
    for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    return out;
  }

  const recent = [];
  /* make({tier, tierMin, tierMax, topics:[…], avoid:id}) → question object */
  function make(o) {
    o = o || {};
    const lo = o.tierMin || o.tier || 1, hi = o.tierMax || o.tier || 5;
    let pool = T.filter(t => t.tier >= lo && t.tier <= hi && (!o.topics || !o.topics.length || o.topics.indexOf(t.topic) >= 0));
    if (!pool.length) pool = T.filter(t => t.tier >= Math.max(1, lo - 1) && t.tier <= Math.min(5, hi + 1));
    if (!pool.length) pool = T;
    const fresh = pool.filter(t => recent.indexOf(t.id) < 0);
    if (fresh.length) pool = fresh;
    for (let tries = 0; tries < 40; tries++) {
      const t = pick(pool); let p; try { p = t.fn(); } catch (e) { p = null; }
      if (!p || !isFinite(p.ans)) continue;
      const opts = buildOptions(p, o.options || 4);
      if (opts.length < 3) continue;
      recent.push(t.id); if (recent.length > 8) recent.shift();
      return { id: t.id, topic: t.topic, topicName: TOPICS[t.topic], tier: t.tier, q: p.q, unit: p.unit || '', ans: fmt(p.ans),
        formula: p.formula, hint: p.hint, steps: p.steps, options: opts };
    }
    return null;
  }

  root.PF_QUESTIONS = { make, fmt, TOPICS, templates: T, count: () => T.length };
  if (typeof module !== 'undefined') module.exports = root.PF_QUESTIONS;
})(typeof window !== 'undefined' ? window : globalThis);
