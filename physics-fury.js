/* Physics Fury — slice the fruit that holds the right answer.
   Needs: physics-fury-questions.js (load it BEFORE this file). Optional: games.js hub (auto-registers), Supabase (leaderboard).
   Everything is self-contained: injects its own CSS, builds its own full-screen overlay, saves to localStorage ('pfSave').
   Public API: window.openPhysicsFury() · window.PhysicsFury.open()/close()
   Logo: assets/physics-fury-logo.png (override with window.PF_LOGO). Works on GitHub Pages sub-paths (no leading "/").   */
(function () {
  'use strict';
  if (window.__pfLoaded) return; window.__pfLoaded = true;
  const Q = window.PF_QUESTIONS;
  if (!Q) { console.warn('Physics Fury: physics-fury-questions.js must be loaded first'); }

  /* ===================== config ===================== */
  const GAME = 'physics_fury';
  const LOGO = (typeof window.PF_LOGO === 'string' && window.PF_LOGO) || new URL('assets/physics-fury-logo.png', document.baseURI).href;
  const STAGES = [
    { name: 'Warm-up: Speed & Force', tiers: [1, 1], topics: ['kin', 'force', 'work', 'elec', 'wave', 'fluid'], goal: 8, aid: 'full' },
    { name: 'Circuits & Waves', tiers: [1, 2], topics: ['elec', 'wave', 'fluid', 'optics'], goal: 10, aid: 'full' },
    { name: 'Motion in a Line', tiers: [2, 2], topics: ['kin', 'force', 'work'], goal: 10, aid: 'full' },
    { name: 'Energy & Electricity', tiers: [2, 3], topics: ['work', 'elec', 'heat'], goal: 12, aid: 'hint' },
    { name: 'Light, Heat & Sound', tiers: [2, 3], topics: ['optics', 'heat', 'wave', 'elec'], goal: 12, aid: 'hint' },
    { name: 'Forces at Work', tiers: [3, 3], topics: null, goal: 14, aid: 'none' },
    { name: 'Gravity & Magnetism', tiers: [3, 4], topics: ['grav', 'mag', 'force', 'elec', 'work'], goal: 14, aid: 'none' },
    { name: 'Multi-step Mastery', tiers: [4, 4], topics: null, goal: 15, aid: 'none' },
    { name: 'ISC Challenge', tiers: [4, 5], topics: null, goal: 16, aid: 'none' },
    { name: 'Physics Fury Master', tiers: [5, 5], topics: null, goal: 18, aid: 'none' }
  ];
  const CHALLENGE_UNLOCK = 3;           // stages to clear before Challenge opens
  const BOSS_NAMES = ['Giga Melon', 'Captain Apple', 'Orange Overlord', 'Plum Titan'];
  const KINDS = ['apple', 'orange', 'melon', 'lemon', 'plum', 'kiwi'];
  const PAL = {
    apple: { body: '#ff5468', flesh: '#fff1c9', dark: '#c9283c' }, orange: { body: '#ffa22b', flesh: '#ffd982', dark: '#d9741a' },
    melon: { body: '#3fc46e', flesh: '#ff5d7c', dark: '#1f8f48' }, lemon: { body: '#ffe14a', flesh: '#fff8b0', dark: '#d9b800' },
    plum: { body: '#9461e6', flesh: '#d2bcff', dark: '#6a3cc0' }, kiwi: { body: '#a98355', flesh: '#98e04f', dark: '#7a5a35' }
  };
  const INK = '#1f2142';

  /* ===================== tiny helpers ===================== */
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const rand = (a, b) => a + Math.random() * (b - a);
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const dayStr = d => d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate();

  /* ===================== save data ===================== */
  const DEF = { xp: 0, cleared: 0, stars: {}, best: { campaign: 0, practice: 0, challenge: 0 }, bestCombo: 0, daily: 0, lastDay: '', sound: true, helped: false,
    totals: { correct: 0, wrong: 0, bosses: 0, games: 0 }, topics: {}, chBest: 0 };
  let save = (() => { try { const s = JSON.parse(ls('pfSave') || 'null'); return Object.assign({}, DEF, s || {}, { totals: Object.assign({}, DEF.totals, (s || {}).totals), best: Object.assign({}, DEF.best, (s || {}).best) }); } catch (e) { return JSON.parse(JSON.stringify(DEF)); } })();
  const persist = () => ls('pfSave', JSON.stringify(save));
  const levelOf = xp => Math.floor(Math.sqrt(xp / 60)) + 1;
  const levelFloor = L => 60 * (L - 1) * (L - 1);
  const maxTier = () => clamp(save.cleared >= 9 ? 5 : save.cleared >= 7 ? 4 : save.cleared >= 5 ? 3 : save.cleared >= 2 ? 2 : 1, 1, 5);

  /* identity (shared with the other games/quiz) */
  let myKey = ls('dqKey'); if (!myKey) { myKey = 'q' + Math.random().toString(36).slice(2) + Date.now().toString(36); ls('dqKey', myKey); }
  const profile = () => ({ name: (ls('mbName') || ls('chatName') || '').trim(), cls: ls('mbCls') || '' });
  async function rpc(fn, body) {
    if (typeof SUPABASE_URL === 'undefined') throw new Error('offline');
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: SUPABASE_KEY, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => null);
    if (!r.ok) throw new Error((j && (j.message || j.hint)) || 'error');
    return Array.isArray(j) ? j[0] || null : j;
  }

  /* ===================== sound (WebAudio, no files) ===================== */
  let AC = null;
  function ac() { if (!save.sound) return null; if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (AC && AC.state === 'suspended') AC.resume(); return AC; }
  function tone(f, d, type, vol, delay, slideTo) {
    const a = ac(); if (!a) return; const t = a.currentTime + (delay || 0), o = a.createOscillator(), g = a.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t); if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + d);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.15, t + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(a.destination); o.start(t); o.stop(t + d + 0.05);
  }
  function noise(d, vol, f0, f1, delay) {
    const a = ac(); if (!a) return; const t = a.currentTime + (delay || 0), n = Math.floor(a.sampleRate * d), buf = a.createBuffer(1, n, a.sampleRate), ch = buf.getChannelData(0);
    for (let i = 0; i < n; i++) ch[i] = (Math.random() * 2 - 1) * (1 - i / n);
    const s = a.createBufferSource(), fl = a.createBiquadFilter(), g = a.createGain(); s.buffer = buf; fl.type = 'bandpass'; fl.Q.value = 1.2;
    fl.frequency.setValueAtTime(f0, t); fl.frequency.exponentialRampToValueAtTime(f1, t + d); g.gain.value = vol;
    s.connect(fl); fl.connect(g); g.connect(a.destination); s.start(t);
  }
  const SFX = {
    swish() { noise(0.14, 0.12, 900, 3200); },
    slice() { noise(0.18, 0.28, 1400, 5200); tone(620, 0.12, 'triangle', 0.1, 0, 300); },
    correct(c) { const b = 520 + Math.min(c, 10) * 28; tone(b, 0.12, 'triangle', 0.16); tone(b * 1.25, 0.12, 'triangle', 0.14, 0.07); tone(b * 1.5, 0.2, 'triangle', 0.14, 0.14); },
    wrong() { tone(190, 0.32, 'sawtooth', 0.14, 0, 90); tone(140, 0.4, 'square', 0.08, 0.05, 70); },
    life() { tone(330, 0.15, 'square', 0.1); tone(220, 0.3, 'square', 0.1, 0.12); },
    boss() { tone(70, 1.1, 'sawtooth', 0.2, 0, 55); tone(105, 1.1, 'square', 0.1, 0, 80); [0, 0.35, 0.7].forEach(d => tone(440, 0.22, 'square', 0.1, d, 880)); },
    bossHit() { noise(0.2, 0.35, 300, 90); tone(120, 0.25, 'sawtooth', 0.2, 0, 50); tone(900, 0.1, 'triangle', 0.12); },
    clank() { tone(1300, 0.08, 'square', 0.07); tone(900, 0.12, 'square', 0.05, 0.03); },
    vuln() { tone(600, 0.1, 'triangle', 0.12); tone(900, 0.16, 'triangle', 0.12, 0.08); },
    win() { [523, 659, 784, 1047, 1319].forEach((f, i) => tone(f, 0.28, 'triangle', 0.16, i * 0.11)); },
    lose() { [392, 330, 262, 196].forEach((f, i) => tone(f, 0.35, 'sawtooth', 0.1, i * 0.18)); },
    tap() { tone(700, 0.05, 'triangle', 0.08); },
    level() { [660, 880, 1100, 1320].forEach((f, i) => tone(f, 0.18, 'sine', 0.14, i * 0.08)); }
  };
  const sfx = (n, a) => { try { SFX[n] && SFX[n](a); } catch (e) { } };
  const buzz = ms => { try { if (save.sound && navigator.vibrate) navigator.vibrate(ms); } catch (e) { } };

  /* ===================== CSS ===================== */
  const css = `
  #pf-root{position:fixed;inset:0;z-index:9800;display:none;flex-direction:column;color:${INK};
    font-family:'Segoe Print','Chalkboard SE','Comic Sans MS','Marker Felt',ui-rounded,system-ui,sans-serif;
    background-color:#fff6e0;background-image:radial-gradient(circle at 12% 18%,rgba(255,120,150,.18) 0 90px,transparent 91px),radial-gradient(circle at 90% 78%,rgba(70,190,255,.2) 0 120px,transparent 121px);
    -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;touch-action:manipulation;overscroll-behavior:contain}
  #pf-root.open{display:flex}
  #pf-root *{box-sizing:border-box}
  #pf-root button{font-family:inherit;color:inherit;cursor:pointer}
  .pf-scr{flex:1;min-height:0;overflow-y:auto;padding:14px 16px calc(env(safe-area-inset-bottom,0px) + 22px);display:flex;flex-direction:column;align-items:center;gap:12px}
  .pf-top{display:flex;align-items:center;gap:8px;width:100%;max-width:560px}
  .pf-top h2{margin:0;flex:1;font-size:21px;letter-spacing:.2px}
  .pf-ib{width:44px;height:44px;border:3px solid ${INK};border-radius:14px;background:#fff;font-size:19px;box-shadow:3px 3px 0 ${INK};display:grid;place-items:center;flex:none}
  .pf-ib:active{transform:translate(2px,2px);box-shadow:1px 1px 0 ${INK}}
  .pf-logo{width:min(46vw,210px);max-height:30vh;object-fit:contain;filter:drop-shadow(3px 4px 0 rgba(31,33,66,.18));animation:pfBob 3.2s ease-in-out infinite}
  @keyframes pfBob{50%{transform:translateY(-6px) rotate(-1.5deg)}}
  .pf-card{width:100%;max-width:560px;background:#fff;border:3px solid ${INK};border-radius:20px;padding:12px 14px;box-shadow:4px 4px 0 ${INK}}
  .pf-player{display:flex;align-items:center;gap:12px}
  .pf-lvl{width:54px;height:54px;border-radius:50%;border:3px solid ${INK};background:#ffd23f;display:grid;place-items:center;font-weight:900;font-size:20px;flex:none;box-shadow:2px 2px 0 ${INK}}
  .pf-pinfo{flex:1;min-width:0;font-size:13px;font-weight:700}
  .pf-pinfo b{display:block;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .pf-bar{height:12px;border:2.5px solid ${INK};border-radius:99px;background:#fff;overflow:hidden;margin-top:5px}
  .pf-bar i{display:block;height:100%;width:0;background:linear-gradient(90deg,#2fd9ff,#7a5cff);transition:width .4s}
  .pf-chipr{display:flex;gap:8px;flex-wrap:wrap;justify-content:center;font-size:12.5px;font-weight:800}
  .pf-chipr span{background:#fff;border:2.5px solid ${INK};border-radius:99px;padding:3px 10px}
  .pf-btn{width:100%;max-width:560px;min-height:58px;border:3px solid ${INK};border-radius:18px;background:#ffd23f;font-weight:900;font-size:18px;padding:10px 16px;box-shadow:4px 4px 0 ${INK};display:flex;align-items:center;gap:12px;text-align:left}
  .pf-btn small{display:block;font-weight:700;font-size:12.5px;opacity:.75;margin-top:1px}
  .pf-btn .em{font-size:28px;flex:none;width:36px;text-align:center}
  .pf-btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 ${INK}}
  .pf-btn.b{background:#7fe0ff}.pf-btn.g{background:#9af0a8}.pf-btn.p{background:#ffb3d1}.pf-btn.w{background:#fff}
  .pf-btn[disabled],.pf-btn.lock{background:#e6e0d0;color:#777;box-shadow:2px 2px 0 #9b9585;border-color:#9b9585}
  .pf-btn.c{justify-content:center;text-align:center}
  .pf-row2{display:flex;gap:10px;width:100%;max-width:560px}.pf-row2 .pf-btn{min-height:50px;font-size:15px;justify-content:center;text-align:center;padding:8px}
  .pf-link{background:none;border:0;text-decoration:underline;font-weight:800;font-size:14px;padding:8px}
  .pf-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;width:100%;max-width:560px}
  .pf-st{border:3px solid ${INK};border-radius:16px;background:#fff;padding:10px 8px;text-align:center;box-shadow:3px 3px 0 ${INK};font-weight:800;font-size:12.5px;min-height:96px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}
  .pf-st b{font-size:24px}.pf-st.lock{background:#e6e0d0;color:#888;box-shadow:none;border-color:#9b9585}
  .pf-st.cur{background:#ffd23f}.pf-st .stars{font-size:15px;letter-spacing:2px}
  .pf-chips{display:flex;gap:8px;flex-wrap:wrap;width:100%;max-width:560px}
  .pf-chip{border:2.5px solid ${INK};border-radius:99px;background:#fff;padding:7px 13px;font-weight:800;font-size:13.5px}
  .pf-chip.on{background:#ffd23f;box-shadow:2px 2px 0 ${INK}}.pf-chip.lock{opacity:.45}
  .pf-h{width:100%;max-width:560px;font-weight:900;font-size:15px;margin:2px 0 -4px}
  .pf-how{margin:0;padding:0;list-style:none;font-size:14.5px;font-weight:600;line-height:1.35}
  .pf-how li{padding:6px 0 6px 38px;position:relative}.pf-how li::before{content:attr(data-e);position:absolute;left:0;top:3px;font-size:22px}
  .pf-in{width:100%;border:3px solid ${INK};border-radius:14px;padding:12px;font:inherit;font-size:16px;margin:5px 0;background:#fff}
  .pf-err{color:#c1121f;font-weight:800;font-size:14px;min-height:18px;text-align:center}
  .pf-rows{width:100%;max-width:560px;display:flex;flex-direction:column;gap:7px}
  .pf-rw{display:flex;align-items:center;gap:10px;background:#fff;border:2.5px solid ${INK};border-radius:14px;padding:8px 10px;font-weight:800;font-size:14px}
  .pf-rw.me{background:#ffd23f}.pf-rw .n{width:30px;text-align:center;font-size:16px}.pf-rw .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .pf-rw small{display:block;font-weight:600;opacity:.7;font-size:11.5px}
  .pf-big{font-size:46px;font-weight:900;text-align:center;line-height:1}
  .pf-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%;max-width:560px}
  .pf-stats div{background:#fff;border:2.5px solid ${INK};border-radius:14px;padding:8px 4px;text-align:center;font-size:11.5px;font-weight:800}
  .pf-stats b{display:block;font-size:20px}

  /* ---- play screen ---- */
  .pf-game{flex:1;min-height:0;display:none;flex-direction:column}
  #pf-root.playing .pf-game{display:flex}#pf-root.playing .pf-scr{display:none}
  .pf-hud{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 8px) 10px 4px}
  .pf-hud .pf-ib{width:40px;height:40px;font-size:17px;border-radius:12px}
  .pf-lives{font-size:21px;letter-spacing:1px;min-width:74px;white-space:nowrap}
  .pf-lives.inf{font-size:15px;font-weight:900}
  .pf-score{flex:1;text-align:center;font-weight:900;font-size:21px;line-height:1}.pf-score small{display:block;font-size:11px;opacity:.7;margin-top:2px}
  .pf-combo{min-width:78px;text-align:right;font-weight:900;font-size:15px;line-height:1.1}.pf-combo small{display:block;font-size:11px;opacity:.75}
  .pf-combo.hot b{color:#e6341c;animation:pfPulse .5s ease infinite alternate}
  @keyframes pfPulse{to{transform:scale(1.18)}}
  .pf-xp{height:7px;margin:0 12px;border:2px solid ${INK};border-radius:9px;background:#fff;overflow:hidden}.pf-xp i{display:block;height:100%;width:0;background:#7a5cff;transition:width .3s}
  .pf-q{margin:7px 10px 4px;background:#fff;border:3px solid ${INK};border-radius:18px;padding:8px 12px 9px;box-shadow:3px 3px 0 ${INK};position:relative}
  .pf-q.boss{background:#fff0f0;border-color:#c1121f;box-shadow:3px 3px 0 #c1121f;animation:pfBossQ 1s ease-in-out infinite alternate}
  @keyframes pfBossQ{to{box-shadow:3px 3px 12px 2px rgba(255,60,60,.7)}}
  .pf-qt{display:flex;gap:6px;align-items:center;font-size:11.5px;font-weight:900;margin-bottom:3px;flex-wrap:wrap}
  .pf-qt span{border:2px solid ${INK};border-radius:99px;padding:1px 8px;background:#e8f6ff}.pf-qt .bs{background:#ff5d5d;color:#fff;border-color:#8a0f0f}
  .pf-qx{font-size:clamp(14px,3.9vw,18px);font-weight:800;line-height:1.28}
  .pf-qa{margin-top:5px;font-size:12.5px;font-weight:700;display:flex;flex-direction:column;gap:3px}
  .pf-qa .fm{background:#fff7c2;border:2px dashed ${INK};border-radius:9px;padding:2px 8px;align-self:flex-start}
  .pf-qa .ht{opacity:.85}
  .pf-hintbtn{align-self:flex-start;border:2px solid ${INK};border-radius:99px;background:#fff;padding:2px 10px;font-weight:800;font-size:12px}
  .pf-prog{height:9px;margin:2px 12px 6px;border:2px solid ${INK};border-radius:9px;background:#fff;overflow:hidden}
  .pf-prog i{display:block;height:100%;width:0;background:#3fc46e;transition:width .25s linear}.pf-prog.time i{background:#ff9f1c;transition:none}.pf-prog.low i{background:#e63946}
  .pf-stage{position:relative;flex:1;min-height:150px;margin:0 8px calc(env(safe-area-inset-bottom,0px) + 8px);border:3px solid ${INK};border-radius:22px;overflow:hidden;background:#bfe9ff;touch-action:none;cursor:crosshair}
  .pf-stage canvas{position:absolute;inset:0;width:100%;height:100%;display:block;touch-action:none}
  .pf-banner{position:absolute;left:50%;top:38%;transform:translate(-50%,-50%) scale(.4) rotate(-4deg);opacity:0;z-index:5;pointer-events:none;text-align:center;width:92%;
    font-weight:900;font-size:clamp(22px,7.2vw,40px);line-height:1.05;color:#fff;-webkit-text-stroke:2px ${INK};paint-order:stroke fill;text-shadow:4px 4px 0 ${INK};letter-spacing:1px}
  .pf-banner small{display:block;font-size:.4em;-webkit-text-stroke:0;text-shadow:2px 2px 0 ${INK};margin-top:6px;letter-spacing:.3px}
  .pf-banner.show{animation:pfBan 1.9s cubic-bezier(.2,1.4,.4,1) forwards}
  .pf-banner.boss{color:#ffe14a;text-shadow:4px 4px 0 #c1121f,0 0 22px #ff3b3b;animation-duration:2.4s}
  @keyframes pfBan{0%{transform:translate(-50%,-50%) scale(.3) rotate(-8deg);opacity:0}14%{transform:translate(-50%,-50%) scale(1.15) rotate(-3deg);opacity:1}24%{transform:translate(-50%,-50%) scale(1) rotate(-3deg)}82%{opacity:1;transform:translate(-50%,-50%) scale(1) rotate(-3deg)}100%{opacity:0;transform:translate(-50%,-62%) scale(1.1) rotate(-3deg)}}
  .pf-flash{position:absolute;inset:0;pointer-events:none;z-index:4;opacity:0;background:#ff3b3b}.pf-flash.go{animation:pfFl .6s ease-out}
  @keyframes pfFl{0%{opacity:.55}100%{opacity:0}}
  .pf-toast{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);z-index:5;background:#fff;border:3px solid ${INK};border-radius:99px;padding:5px 14px;font-weight:900;font-size:13.5px;white-space:nowrap;box-shadow:3px 3px 0 ${INK};opacity:0;pointer-events:none}
  .pf-toast.go{animation:pfToast 1.5s ease forwards}
  @keyframes pfToast{0%{opacity:0;transform:translate(-50%,10px)}12%,80%{opacity:1;transform:translate(-50%,0)}100%{opacity:0;transform:translate(-50%,-6px)}}
  .pf-ov{position:absolute;inset:0;z-index:20;background:rgba(31,33,66,.62);display:none;align-items:center;justify-content:center;padding:14px;overflow-y:auto}
  .pf-ov.on{display:flex}
  .pf-sol{width:100%;max-width:480px;max-height:100%;overflow-y:auto;background:#fff;border:3px solid ${INK};border-radius:22px;padding:14px;box-shadow:5px 5px 0 ${INK};animation:pfPop .35s cubic-bezier(.2,1.4,.4,1)}
  @keyframes pfPop{from{transform:scale(.8);opacity:0}}
  .pf-sol h3{margin:0 0 6px;font-size:20px}.pf-sol .ans{display:flex;gap:8px;flex-wrap:wrap;margin:6px 0;font-weight:900;font-size:14.5px}
  .pf-sol .ans span{border:2.5px solid ${INK};border-radius:12px;padding:4px 10px}.pf-sol .no{background:#ffd6d6}.pf-sol .yes{background:#c9f7d2}
  .pf-sol .why{font-size:13.5px;font-weight:800;background:#fff3c4;border-radius:10px;padding:6px 10px;margin:6px 0}
  .pf-sol .fm{font-weight:900;font-size:15px;background:#e8f6ff;border:2px dashed ${INK};border-radius:10px;padding:5px 10px;margin:6px 0}
  .pf-sol ol{margin:6px 0 10px;padding-left:22px;font-size:14.5px;font-weight:700;line-height:1.45}
  .pf-sol li{opacity:0;animation:pfIn .4s forwards}@keyframes pfIn{from{transform:translateX(-10px)}to{opacity:1;transform:none}}
  .pf-pause{display:flex;flex-direction:column;gap:10px;align-items:center;width:100%;max-width:340px}
  .pf-pause h3{margin:0;color:#fff;font-size:30px;text-shadow:3px 3px 0 ${INK}}
  .pf-sw{display:flex;gap:6px;align-items:center;justify-content:center}.pf-sw i{width:16px;height:16px;border-radius:50%;border:2.5px solid ${INK};display:inline-block}
  @media (max-height:520px){
    .pf-hud{padding-top:4px}.pf-hud .pf-ib{width:34px;height:34px;font-size:15px}.pf-q{margin:3px 8px 3px;padding:4px 10px}.pf-qx{font-size:14px}.pf-qa{margin-top:2px;font-size:11.5px}
    .pf-score{font-size:17px}.pf-prog{margin:1px 12px 3px}.pf-stage{min-height:110px;margin-bottom:6px}.pf-logo{max-height:22vh}.pf-qt{display:none}
  }
  @media (prefers-reduced-motion:reduce){.pf-logo,.pf-q.boss,.pf-combo.hot b{animation:none}}
  `;
  const style = document.createElement('style'); style.textContent = css; document.head.appendChild(style);

  /* ===================== DOM root ===================== */
  const root = document.createElement('div'); root.id = 'pf-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Physics Fury');
  root.innerHTML = '<div class="pf-scr" id="pfScr"></div><div class="pf-game" id="pfGame"></div>';
  document.body.appendChild(root);
  const scr = root.querySelector('#pfScr'), gameEl = root.querySelector('#pfGame');
  ['touchstart', 'touchend', 'touchmove'].forEach(t => root.addEventListener(t, e => e.stopPropagation(), { passive: true }));
  let opened = false, prevOverflow = '', scene = 'menu', errMsg = '', board = { cls: 'all', rows: null, loading: false, err: '' }, me = null;
  let setup = { topic: 'all', tier: 'auto' }, gotoAfterProfile = null;

  const logoImg = (cls) => `<img class="${cls}" src="${LOGO}" alt="Physics Fury" onerror="this.style.display='none'">`;

  /* ===================== menu screens ===================== */
  function xpBlock() {
    const L = levelOf(save.xp), a = levelFloor(L), b = levelFloor(L + 1), pc = clamp((save.xp - a) / (b - a) * 100, 0, 100);
    const p = profile();
    return `<div class="pf-card pf-player"><div class="pf-lvl">${L}</div><div class="pf-pinfo"><b>${esc(p.name || 'Player')}</b>Level ${L} · ${save.xp - a}/${b - a} XP<div class="pf-bar"><i style="width:${pc}%"></i></div></div></div>`;
  }
  function menuHTML() {
    const acc = save.totals.correct + save.totals.wrong ? Math.round(save.totals.correct * 100 / (save.totals.correct + save.totals.wrong)) : 0;
    const chOpen = save.cleared >= CHALLENGE_UNLOCK;
    return `<div class="pf-top"><button class="pf-ib" data-a="close" aria-label="Close">✕</button><h2></h2><button class="pf-ib" data-a="snd" aria-label="Sound">${save.sound ? '🔊' : '🔇'}</button><button class="pf-ib" data-a="help" aria-label="How to play">?</button></div>
      ${logoImg('pf-logo')}
      ${xpBlock()}
      <div class="pf-chipr"><span>🔥 ${save.daily || 0}-day streak</span><span>⚡ Best combo ${save.bestCombo || 0}</span><span>🎯 ${acc}% accuracy</span><span>👑 ${save.totals.bosses} bosses</span></div>
      <button class="pf-btn" data-a="campaign"><span class="em">🗺️</span><span>Campaign<small>10 stages · formulas first, then you're on your own</small></span></button>
      <button class="pf-btn b" data-a="practice"><span class="em">🧪</span><span>Practice<small>No lives · pick a topic and level</small></span></button>
      <button class="pf-btn ${chOpen ? 'p' : 'lock'}" data-a="challenge"><span class="em">${chOpen ? '⚔️' : '🔒'}</span><span>Challenge<small>${chOpen ? 'Endless · 3 lives · timer · leaderboard' : 'Clear stage ' + CHALLENGE_UNLOCK + ' in Campaign to unlock'}</small></span></button>
      <div class="pf-row2"><button class="pf-btn w" data-a="board">🏆 Leaderboard</button><button class="pf-btn w" data-a="help">📖 How to play</button></div>`;
  }
  function stagesHTML() {
    const cells = STAGES.map((s, i) => {
      const open = i <= save.cleared, st = save.stars[i] || 0, cur = i === save.cleared;
      return `<button class="pf-st ${open ? '' : 'lock'} ${cur ? 'cur' : ''}" ${open ? `data-a="stage" data-i="${i}"` : 'disabled'}><b>${open ? i + 1 : '🔒'}</b>${esc(s.name)}<span class="stars">${[1, 2, 3].map(n => n <= st ? '★' : '☆').join('')}</span></button>`;
    }).join('');
    return `<div class="pf-top"><button class="pf-ib" data-a="menu" aria-label="Back">‹</button><h2>Campaign</h2></div>
      <div class="pf-card" style="font-weight:700;font-size:13.5px">Clear each stage by slicing the right answers, and beat the Boss Fruit that appears. Early stages show formulas and hints; later stages take them away.</div>
      <div class="pf-grid">${cells}</div>`;
  }
  function practiceHTML() {
    const tp = ['all'].concat(Object.keys(Q.TOPICS));
    const mt = maxTier();
    const chips = tp.map(k => `<button class="pf-chip ${setup.topic === k ? 'on' : ''}" data-a="ptopic" data-k="${k}">${k === 'all' ? '🌈 All topics' : esc(Q.TOPICS[k])}</button>`).join('');
    const tiers = ['auto', 1, 2, 3, 4, 5].map(t => { const lk = t !== 'auto' && t > mt; return `<button class="pf-chip ${setup.tier === t ? 'on' : ''} ${lk ? 'lock' : ''}" data-a="ptier" data-k="${t}">${t === 'auto' ? '🤖 Auto' : (lk ? '🔒 ' : '') + ['', 'Basic', 'Easy', 'Medium', 'Hard', 'ISC'][t]}</button>`; }).join('');
    return `<div class="pf-top"><button class="pf-ib" data-a="menu" aria-label="Back">‹</button><h2>Practice</h2></div>
      <div class="pf-h">Topic</div><div class="pf-chips">${chips}</div>
      <div class="pf-h">Level <small style="font-weight:600">(harder levels unlock as you clear Campaign stages)</small></div><div class="pf-chips">${tiers}</div>
      <div class="pf-card" style="font-weight:700;font-size:13.5px">No lives and no pressure. Wrong slices show the full worked solution. <b>Auto</b> raises the difficulty when you keep getting it right.</div>
      <button class="pf-btn g c" data-a="startpractice">▶ Start practising</button>`;
  }
  function helpHTML() {
    return `<div class="pf-top"><button class="pf-ib" data-a="menu" aria-label="Back">‹</button><h2>How to play</h2></div>
      <div class="pf-card"><ul class="pf-how">
        <li data-e="❓">Read the physics question at the top. Fruits fly up, each showing a possible answer.</li>
        <li data-e="⚔️">Swipe your finger (or drag the mouse) through the fruit with the <b>correct</b> answer.</li>
        <li data-e="✅">Right slice: XP, points and a combo. Longer combos multiply your points!</li>
        <li data-e="❌">Wrong slice: you lose a life, your combo breaks, and the full step-by-step solution is shown.</li>
        <li data-e="📐">Early stages show the formula and a hint. Later you must remember them (a hint button costs points).</li>
        <li data-e="👑">A <b>Boss Fruit</b> can appear at any time! Tougher questions start. Each right answer makes the boss <b>vulnerable</b> for a moment: slash it quickly to damage it. Beat it for huge bonuses and a ×score fury.</li>
        <li data-e="🔓">Clear stages to unlock harder levels and the Challenge mode.</li></ul></div>
      <button class="pf-btn c" data-a="menu">Got it!</button>`;
  }
  function profileHTML() {
    const p = profile();
    return `<div class="pf-top"><button class="pf-ib" data-a="menu" aria-label="Back">‹</button><h2>Who's playing?</h2></div>
      <div class="pf-card"><p style="margin:0 0 6px;font-weight:700;font-size:14px">Your name and class show on the leaderboard. Use your first name and last initial.</p>
      <input id="pfName" class="pf-in" maxlength="40" placeholder="Your name (e.g. Aarav S.)" value="${esc(p.name)}" autocomplete="off">
      <select id="pfCls" class="pf-in"><option value="">Select your class</option>${[8, 9, 10, 11, 12].map(c => `<option${String(c) === p.cls ? ' selected' : ''}>${c}</option>`).join('')}</select>
      <div class="pf-err">${esc(errMsg)}</div><button class="pf-btn g c" data-a="saveprofile">Save and continue</button>
      <button class="pf-link" data-a="skipprofile">Play without the leaderboard</button></div>`;
  }
  function boardHTML() {
    const tabs = ['all', '8', '9', '10', '11', '12'].map(c => `<button class="pf-chip ${board.cls === c ? 'on' : ''}" data-a="bcls" data-k="${c}">${c === 'all' ? 'All' : 'Class ' + c}</button>`).join('');
    let body;
    if (board.loading) body = '<div class="pf-card" style="text-align:center;font-weight:800">Loading…</div>';
    else if (board.err) body = `<div class="pf-card" style="text-align:center;font-weight:800">${esc(board.err)}</div>`;
    else if (!board.rows || !board.rows.length) body = '<div class="pf-card" style="text-align:center;font-weight:800">No scores yet. Be the first in Challenge mode! ⚔️</div>';
    else {
      const p = profile();
      body = '<div class="pf-rows">' + board.rows.map((r, i) => `<div class="pf-rw ${p.name && r.name === p.name && String(r.cls) === p.cls ? 'me' : ''}"><span class="n">${['🥇', '🥈', '🥉'][i] || i + 1}</span><span class="nm">${esc(r.name)}<small>Class ${esc(r.cls)} · ${r.best_bosses} boss${r.best_bosses === 1 ? '' : 'es'} · ${r.best_questions} correct</small></span><b>${r.best_score}</b></div>`).join('') + '</div>';
    }
    return `<div class="pf-top"><button class="pf-ib" data-a="menu" aria-label="Back">‹</button><h2>Leaderboard</h2></div><div class="pf-chips">${tabs}</div>${body}
      <div class="pf-card" style="font-size:12.5px;font-weight:700">Only <b>Challenge</b> scores are ranked. ${me && me.best ? 'Your best: <b>' + me.best + '</b>' + (me.rank ? ' · rank #' + me.rank : '') : ''}</div>`;
  }
  async function loadBoard() {
    board.loading = true; board.err = ''; if (scene === 'board') draw();
    try { const rows = await rpc('game_top', { p_game: GAME, p_cls: board.cls }); board.rows = rows ? (Array.isArray(rows) ? rows : [rows]) : []; }
    catch (e) { board.rows = null; board.err = 'Could not load the leaderboard. Check your connection.'; }
    board.loading = false; if (scene === 'board') draw();
  }
  async function loadMe() { try { const r = await rpc('game_me', { p_key: myKey, p_game: GAME }); me = { best: r.my_best || 0, rank: r.my_rank || 0 }; } catch (e) { } }

  function draw() {
    root.classList.remove('playing');
    const h = { menu: menuHTML, stages: stagesHTML, practice: practiceHTML, help: helpHTML, profile: profileHTML, board: boardHTML, result: resultHTML }[scene] || menuHTML;
    scr.innerHTML = h(); scr.scrollTop = 0;
  }
  function go(s) { scene = s; errMsg = ''; if (s === 'board') { draw(); loadBoard(); loadMe(); } else draw(); }

  /* ===================== game state ===================== */
  let G = null, cv, c, W = 0, H = 0, dpr = 1, raf = 0, lastT = 0, bgCache = null;
  let fruits = [], halves = [], parts = [], floats = [], pending = [], trail = [], pointerDown = false, swipeUsed = false, shake = 0;
  const el = {};

  const hearts = n => n === Infinity ? '' : '❤️'.repeat(Math.max(0, n)) + '🖤'.repeat(Math.max(0, 3 - n));

  function tierRange() {
    if (G.mode === 'campaign') return STAGES[G.stage].tiers;
    if (G.mode === 'practice') { const t = setup.tier === 'auto' ? G.autoTier : setup.tier; return [t, t]; }
    const t = Math.min(5, 2 + Math.floor(G.correct / 7)); return [Math.max(1, t - 1), t];
  }
  function topicList() {
    if (G.mode === 'campaign') return STAGES[G.stage].topics;
    if (G.mode === 'practice') return setup.topic === 'all' ? null : [setup.topic];
    return null;
  }
  function aidLevel() {
    if (G.mode === 'campaign') return STAGES[G.stage].aid;
    if (G.mode === 'practice') { const t = tierRange()[1]; return t <= 1 ? 'full' : t === 2 ? 'hint' : 'none'; }
    return 'none';
  }
  function bossHP() {
    if (G.mode === 'campaign') return Math.min(12, 3 + Math.floor(G.stage / 2) + Math.floor(save.totals.bosses / 4));
    return Math.min(12, 3 + G.bosses + Math.floor(save.totals.bosses / 5));
  }

  function startGame(mode, stage) {
    // daily streak
    const now = new Date(), today = dayStr(now), y = new Date(now.getTime() - 864e5);
    if (save.lastDay !== today) { save.daily = save.lastDay === dayStr(y) ? (save.daily || 0) + 1 : 1; save.lastDay = today; }
    save.totals.games++; persist();
    G = { mode, stage: stage | 0, lives: mode === 'practice' ? Infinity : 3, score: 0, xpGain: 0, correct: 0, wrong: 0, combo: 0, bestCombo: 0, fury: 0, bosses: 0, bossDone: false,
      active: 0, q: null, qt: 0, qmax: 0, boss: null, nextBossAt: 0, state: 'play', hint: false, waitWave: 0, relaunch: 0, autoTier: Math.min(maxTier(), 1), recent: [], over: false, usedHint: false, topicsSeen: {}, lvStart: levelOf(save.xp) };
    if (mode === 'campaign') G.nextBossAt = ri(3, Math.max(3, STAGES[G.stage].goal - 3));
    else G.nextBossAt = ri(6, 9);
    fruits = []; halves = []; parts = []; floats = []; pending = []; trail = []; shake = 0; swipeUsed = false;
    buildGame(); root.classList.add('playing'); scene = 'play';
    resize(); nextQuestion(); hud();
    cancelAnimationFrame(raf); lastT = performance.now(); raf = requestAnimationFrame(loop);
    if (mode === 'campaign') banner('STAGE ' + (G.stage + 1), STAGES[G.stage].name);
    else if (mode === 'challenge') banner('CHALLENGE!', 'Endless · 3 lives · beat the clock');
    else banner('PRACTICE', 'No lives · learn at your pace');
  }

  function buildGame() {
    gameEl.innerHTML = `<div class="pf-hud"><button class="pf-ib" data-a="pause" aria-label="Pause">⏸</button><div class="pf-lives" id="pfLives"></div>
      <div class="pf-score"><span id="pfScore">0</span><small id="pfSub"></small></div><div class="pf-combo" id="pfCombo"></div></div>
      <div class="pf-xp"><i id="pfXp"></i></div>
      <div class="pf-q" id="pfQ"></div>
      <div class="pf-prog" id="pfProg"><i></i></div>
      <div class="pf-stage" id="pfStage"><canvas id="pfCv"></canvas><div class="pf-flash" id="pfFlash"></div><div class="pf-banner" id="pfBan"></div><div class="pf-toast" id="pfToast"></div></div>
      <div class="pf-ov" id="pfOv"></div>`;
    ['pfLives', 'pfScore', 'pfSub', 'pfCombo', 'pfXp', 'pfQ', 'pfProg', 'pfStage', 'pfFlash', 'pfBan', 'pfToast', 'pfOv'].forEach(i => el[i] = gameEl.querySelector('#' + i));
    cv = gameEl.querySelector('#pfCv'); c = cv.getContext('2d');
    cv.addEventListener('pointerdown', onDown); cv.addEventListener('pointermove', onMove);
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(t => cv.addEventListener(t, onUp));
    cv.addEventListener('contextmenu', e => e.preventDefault());
  }
  function resize() {
    if (!cv || !el.pfStage) return;
    const r = el.pfStage.getBoundingClientRect(); W = Math.max(100, r.width); H = Math.max(100, r.height);
    dpr = Math.min(2, window.devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; c.setTransform(dpr, 0, 0, dpr, 0, 0); bgCache = null;
  }
  window.addEventListener('resize', () => { if (opened && G) setTimeout(resize, 60); });
  window.addEventListener('orientationchange', () => { if (opened && G) setTimeout(resize, 250); });

  /* ---------- HUD ---------- */
  function hud() {
    if (!G) return;
    const L = levelOf(save.xp), a = levelFloor(L), b = levelFloor(L + 1);
    el.pfLives.className = 'pf-lives' + (G.lives === Infinity ? ' inf' : ''); el.pfLives.textContent = G.lives === Infinity ? '∞ practice' : hearts(G.lives);
    el.pfScore.textContent = G.score;
    el.pfSub.textContent = G.mode === 'campaign' ? 'Stage ' + (G.stage + 1) + ' · Lv ' + L : (G.mode === 'challenge' ? 'Challenge · Lv ' + L : 'Practice · Lv ' + L);
    const m = mult();
    el.pfCombo.className = 'pf-combo' + (G.combo >= 4 ? ' hot' : '');
    el.pfCombo.innerHTML = G.combo ? `<b>🔥${G.combo}</b><small>×${m}${G.fury ? ' · FURY' : ''}</small>` : (G.fury ? '<small>FURY ×' + m + '</small>' : '<small>combo ×1</small>');
    el.pfXp.style.width = clamp((save.xp - a) / (b - a) * 100, 0, 100) + '%';
    if (G.mode === 'campaign') { const st = STAGES[G.stage]; el.pfProg.className = 'pf-prog'; el.pfProg.firstChild.style.width = clamp(G.correct / st.goal * 100, 0, 100) + '%'; }
    else if (G.mode === 'practice') { el.pfProg.className = 'pf-prog'; el.pfProg.firstChild.style.width = clamp(G.correct % 10 * 10, 0, 100) + '%'; }
  }
  function mult() { const base = Math.min(4, 1 + Math.floor(G.combo / 4) * 0.5); return base + (G.fury > 0 ? 1 : 0); }

  function showQ() {
    const q = G.q, aid = aidLevel(), boss = !!G.boss;
    let a = '';
    if (aid === 'full') a = `<div class="fm">📐 ${esc(q.formula)}</div><div class="ht">💡 ${esc(q.hint)}</div>`;
    else if (aid === 'hint') a = `<div class="ht">💡 ${esc(q.hint)}</div>`;
    else if (G.hint) a = `<div class="fm">💡 ${esc(q.hint)}</div>`;
    else a = `<button class="pf-hintbtn" data-a="hint">💡 Hint${G.mode === 'practice' ? '' : ' (−20 pts)'}</button>`;
    el.pfQ.className = 'pf-q' + (boss ? ' boss' : '');
    el.pfQ.innerHTML = `<div class="pf-qt"><span>${esc(q.topicName)}</span><span>${['', 'Basic', 'Easy', 'Medium', 'Hard', 'ISC'][q.tier]}</span>${boss ? '<span class="bs">👑 BOSS: ' + G.boss.hp + '/' + G.boss.max + ' HP</span>' : ''}</div><div class="pf-qx">${esc(q.q)}</div><div class="pf-qa">${a}</div>`;
  }

  /* ---------- questions & waves ---------- */
  function nextQuestion() {
    let [lo, hi] = tierRange(); const tp = topicList();
    if (G.boss) { hi = Math.min(5, hi + 2); lo = Math.min(hi, Math.max(2, tierRange()[1] + 1)); }
    G.q = Q.make({ tierMin: lo, tierMax: hi, topics: tp }); G.hint = false; G.relaunch = 0;
    G.qmax = G.qt = G.mode === 'challenge' ? Math.max(14, 32 - G.correct * 0.5) + (G.boss ? 12 : 0) : 0;
    G.topicsSeen[G.q.topic] = 1; showQ();
    fruits.forEach(f => poof(f)); fruits = []; pending = [];
    G.waitWave = G.boss && G.boss.enter > 0 ? 1.8 : 0.35; G.waveLive = false;
  }
  function launchWave() {
    const q = G.q, n = q.options.length, tier = q.tier, order = q.options.map((o, i) => i).sort(() => Math.random() - 0.5);
    const r = clamp(Math.min(W * 0.1, H * 0.15), 34, 54);
    order.forEach((oi, k) => { pending.push({ t: k * rand(0.22, 0.4) + rand(0, 0.15), opt: q.options[oi], slot: oi, n, r, tier }); });
    G.waveLive = true; pending.sort((a, b) => a.t - b.t);
  }
  function spawnFruit(p) {
    const slots = p.n, x0 = W * (p.slot + 0.5) / slots + rand(-0.04, 0.04) * W, g = H * (1.1 + 0.07 * p.tier) * rand(0.95, 1.05);
    const apex = H * rand(0.6, 0.84), vy = -Math.sqrt(2 * g * apex);
    const dir = x0 < W / 2 ? 1 : -1, vx = dir * W * rand(0.02, 0.1) * (Math.random() < 0.25 ? -1 : 1);
    fruits.push({ x: clamp(x0, p.r, W - p.r), y: H + p.r + 4, vx, vy, g, r: p.r, rot: rand(0, 6.28), vr: rand(-2.2, 2.2), kind: pick(KINDS), label: p.opt.v, ok: p.opt.ok, why: p.opt.why, wob: Array.from({ length: 12 }, () => 1 + (Math.random() - 0.5) * 0.1), age: 0, hl: false });
    sfx('swish');
  }

  /* ---------- input ---------- */
  function pt(e) { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * (W / r.width), y: (e.clientY - r.top) * (H / r.height), t: performance.now() }; }
  function onDown(e) {
    if (!G || G.state !== 'play') return; e.preventDefault(); ac();
    try { cv.setPointerCapture(e.pointerId); } catch (x) { }
    pointerDown = true; swipeUsed = false; const p = pt(e); trail = [p]; hitTest(p, p);
  }
  function onMove(e) {
    if (!pointerDown || !G || G.state !== 'play') return; e.preventDefault();
    const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : null, list = evs && evs.length ? evs : [e];
    list.forEach(ev => { const p = pt(ev), last = trail[trail.length - 1]; if (last && Math.hypot(p.x - last.x, p.y - last.y) < 1.5) return; trail.push(p); if (last) hitTest(last, p); });
    if (trail.length > 40) trail.splice(0, trail.length - 40);
  }
  function onUp() { pointerDown = false; swipeUsed = false; }
  function segDist(p0, p1, cx, cy) {
    const dx = p1.x - p0.x, dy = p1.y - p0.y, l2 = dx * dx + dy * dy; let t = l2 ? ((cx - p0.x) * dx + (cy - p0.y) * dy) / l2 : 0; t = clamp(t, 0, 1);
    return Math.hypot(cx - (p0.x + t * dx), cy - (p0.y + t * dy));
  }
  function hitTest(p0, p1) {
    if (!G || G.state !== 'play') return;
    const ang = Math.atan2(p1.y - p0.y, p1.x - p0.x) || rand(0, 6.28);
    // Boss first (it is behind the fruit, but its hit never conflicts with an answer)
    const b = G.boss;
    if (b && b.enter <= 0 && b.hurt <= 0 && segDist(p0, p1, b.x, b.y) <= b.r * 0.95) { hitBoss(p1, ang); }
    if (swipeUsed) return;
    for (let i = 0; i < fruits.length; i++) {
      const f = fruits[i]; if (f.cut) continue;
      if (segDist(p0, p1, f.x, f.y) <= f.r * 0.92) { swipeUsed = true; sliceFruit(f, ang, p1); return; }
    }
  }

  /* ---------- slice results ---------- */
  function sliceFruit(f, ang, p) {
    f.cut = true; sfx('slice'); splitFruit(f, ang);
    if (f.ok) correct(f); else wrong(f, false);
  }
  function splitFruit(f, ang) {
    const pal = PAL[f.kind], px = Math.cos(ang + Math.PI / 2), py = Math.sin(ang + Math.PI / 2);
    [1, -1].forEach(s => halves.push({ x: f.x, y: f.y, vx: f.vx * 0.5 + px * s * 110, vy: f.vy * 0.3 + py * s * 110 - 60, g: f.g, r: f.r, rot: ang, vr: s * rand(1.5, 4), kind: f.kind, wob: f.wob, side: s, age: 0 }));
    for (let i = 0; i < 16; i++) { const a = rand(0, 6.28), sp = rand(60, 260); parts.push({ x: f.x, y: f.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60, life: rand(0.4, 0.8), max: 0.8, s: rand(2, 5.5), col: Math.random() < 0.6 ? pal.flesh : pal.body, g: 700 }); }
    // juice streak along the cut
    for (let i = -4; i <= 4; i++) parts.push({ x: f.x + Math.cos(ang) * i * f.r * 0.22, y: f.y + Math.sin(ang) * i * f.r * 0.22, vx: rand(-30, 30), vy: rand(-40, 20), life: 0.5, max: 0.5, s: 4, col: '#fff', g: 300 });
  }
  function poof(f) { if (f.cut) return; for (let i = 0; i < 6; i++) parts.push({ x: f.x, y: f.y, vx: rand(-60, 60), vy: rand(-60, 20), life: 0.4, max: 0.4, s: rand(3, 7), col: 'rgba(255,255,255,.8)', g: 0 }); }
  function floatText(x, y, text, col, size) { floats.push({ x, y, text, col: col || '#fff', size: size || 22, life: 1.1, max: 1.1 }); }
  function toast(t) { el.pfToast.textContent = t; el.pfToast.classList.remove('go'); void el.pfToast.offsetWidth; el.pfToast.classList.add('go'); }
  function banner(t, sub, cls) { const b = el.pfBan; b.className = 'pf-banner' + (cls ? ' ' + cls : ''); b.innerHTML = esc(t) + (sub ? '<small>' + esc(sub) + '</small>' : ''); void b.offsetWidth; b.classList.add('show'); }
  function flash() { el.pfFlash.classList.remove('go'); void el.pfFlash.offsetWidth; el.pfFlash.classList.add('go'); }

  function addXp(n) {
    const before = levelOf(save.xp); save.xp += n; G.xpGain += n;
    if (levelOf(save.xp) > before) { sfx('level'); toast('⭐ LEVEL UP! Level ' + levelOf(save.xp)); }
  }
  function stat(topic, ok) { const t = save.topics[topic] || (save.topics[topic] = { c: 0, w: 0 }); ok ? t.c++ : t.w++; }

  function correct(f) {
    const q = G.q; G.combo++; G.bestCombo = Math.max(G.bestCombo, G.combo); if (G.combo > save.bestCombo) save.bestCombo = G.combo;
    const m = mult(), pts = Math.round((100 + 40 * q.tier) * m), xpv = Math.round((8 + 4 * q.tier) * (1 + Math.min(G.combo, 10) * 0.1) * (G.mode === 'practice' ? 0.5 : 1) * (G.fury ? 1.5 : 1));
    G.score += pts; G.correct++; save.totals.correct++; stat(q.topic, true); addXp(xpv); if (G.fury > 0) G.fury--;
    G.recent.push(1); if (G.recent.length > 8) G.recent.shift();
    floatText(f.x, f.y - f.r, '+' + pts, '#fff35c', 26); floatText(f.x, f.y - f.r + 24, '+' + xpv + ' XP', '#9bf6ff', 15);
    if (G.combo >= 3) floatText(W / 2, H * 0.3, G.combo + ' COMBO!', '#ffb703', 28 + Math.min(14, G.combo));
    sfx('correct', G.combo); buzz(18);
    if (G.mode === 'practice' && setup.tier === 'auto' && G.recent.length >= 5) { const acc = G.recent.reduce((a, b) => a + b, 0) / G.recent.length; if (acc >= 0.85 && G.autoTier < maxTier()) { G.autoTier++; G.recent = []; toast('📈 Level up: tougher questions!'); } }
    if (G.boss) { G.boss.vuln = 3.4; sfx('vuln'); toast('⚡ BOSS IS WEAK! SLASH IT!'); }
    persist();
    // stage / boss flow
    if (!G.boss && !G.bossDone && G.mode === 'campaign' ? G.correct >= G.nextBossAt : (!G.boss && G.mode !== 'campaign' && G.correct >= G.nextBossAt)) spawnBoss();
    if (G.mode === 'campaign' && G.correct >= STAGES[G.stage].goal && G.bossDone && !G.boss) { hud(); return finish('clear'); }
    hud(); nextQuestion();
  }
  function wrong(f, timeout) {
    const q = G.q; G.wrong++; save.totals.wrong++; stat(q.topic, false); G.combo = 0; G.recent.push(0); if (G.recent.length > 8) G.recent.shift();
    if (G.mode === 'practice' && setup.tier === 'auto' && G.recent.length >= 4 && G.recent.filter(x => !x).length >= 2 && G.autoTier > 1) { G.autoTier--; G.recent = []; }
    if (G.lives !== Infinity) G.lives--;
    sfx('wrong'); if (G.lives !== Infinity) setTimeout(() => sfx('life'), 250); buzz(70); shake = 0.5; persist();
    fruits.forEach(x => { if (x.ok) x.hl = true; });
    G.state = 'solution'; hud(); showSolution(f, timeout);
  }

  function showSolution(f, timeout) {
    const q = G.q, why = f && !f.ok && f.why ? f.why : '', last = G.lives === 0;
    const sliced = timeout ? "⏱️ Time's up!" : `✂️ You sliced: ${esc(f.label)} ${esc(q.unit)}`;
    el.pfOv.innerHTML = `<div class="pf-sol"><h3>${timeout ? "⏱️ Time's up!" : '😅 Not quite!'} ${last ? '' : (G.lives === Infinity ? '' : '(−1 ❤️)')}</h3>
      <div class="ans">${timeout ? '' : `<span class="no">${sliced}</span>`}<span class="yes">✅ Answer: ${esc(q.ans)} ${esc(q.unit)}</span></div>
      ${why ? `<div class="why">🧠 ${esc(why)}</div>` : ''}<div class="fm">📐 ${esc(q.formula)}</div>
      <ol>${q.steps.map((s, i) => `<li style="animation-delay:${0.15 + i * 0.35}s">${esc(s)}</li>`).join('')}</ol>
      <button class="pf-btn c" data-a="cont">${last ? 'See results' : 'Continue ▶'}</button></div>`;
    el.pfOv.classList.add('on');
  }

  /* ---------- boss ---------- */
  function spawnBoss() {
    const hp = bossHP(); const b = G.boss = { hp, max: hp, kind: ['melon', 'apple', 'orange', 'plum'][(save.totals.bosses) % 4], name: BOSS_NAMES[(save.totals.bosses) % 4], x: W / 2, y: H * 0.42, r: clamp(Math.min(W * 0.2, H * 0.27), 54, 100), t: 0, vuln: 0, hurt: 0, flashT: 0, enter: 2.2, wob: Array.from({ length: 12 }, () => 1 + (Math.random() - 0.5) * 0.06) };
    banner('BOSS FRUIT APPEARED!', b.name + ' · ' + hp + ' slashes to win · tougher physics!', 'boss'); flash(); sfx('boss'); buzz([80, 40, 80]); shake = 1;
    fruits.forEach(f => poof(f)); fruits = []; pending = [];
  }
  function hitBoss(p, ang) {
    const b = G.boss;
    if (b.vuln > 0) {
      b.vuln = 0; b.hp--; b.hurt = 0.35; b.flashT = 0.35; shake = 0.7; sfx('bossHit'); buzz(40);
      const pts = Math.round(200 * mult()); G.score += pts; addXp(6);
      floatText(b.x, b.y - b.r * 0.9, '-1 HP', '#ff5252', 30); floatText(b.x, b.y - b.r * 0.9 + 28, '+' + pts, '#fff35c', 20);
      for (let i = 0; i < 26; i++) { const a = rand(0, 6.28), sp = rand(100, 360); parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rand(0.5, 1), max: 1, s: rand(3, 8), col: pick(['#ffe14a', '#fff', PAL[b.kind].flesh, PAL[b.kind].body]), g: 500 }); }
      showQ(); hud();
      if (b.hp <= 0) defeatBoss();
    } else if (!b.clank || performance.now() - b.clank > 400) {
      b.clank = performance.now(); b.flashT = 0.12; sfx('clank'); floatText(p.x, p.y - 10, 'CLANK! answer first', '#fff', 14);
    }
  }
  function defeatBoss() {
    const b = G.boss, n = G.bosses + 1, pts = 1000 + 250 * G.bosses, xpv = 60 + 20 * G.bosses;
    G.score += pts; addXp(xpv); G.bosses++; save.totals.bosses++; G.bossDone = true; G.fury = 10; G.boss = null;
    for (let i = 0; i < 60; i++) { const a = rand(0, 6.28), sp = rand(120, 520); parts.push({ x: b.x, y: b.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 100, life: rand(0.7, 1.4), max: 1.4, s: rand(3, 9), col: pick(['#ffe14a', '#ff5d7c', '#7fe0ff', '#9af0a8', '#fff']), g: 600 }); }
    splitFruit({ x: b.x, y: b.y, vx: 0, vy: -100, g: H, r: b.r, kind: b.kind, wob: b.wob }, rand(0, 3));
    banner('BOSS DEFEATED!', '+' + pts + ' pts · +' + xpv + ' XP · FURY ×' + mult() + ' for 10 answers', ''); flash(); sfx('win'); buzz([40, 30, 40, 30, 120]); shake = 1;
    G.nextBossAt = G.correct + ri(8, 12); persist(); showQ(); hud();
    if (G.mode === 'campaign' && G.correct >= STAGES[G.stage].goal) { setTimeout(() => { if (G && G.state === 'play') finish('clear'); }, 1300); }
  }

  /* ---------- end of game ---------- */
  function finish(kind) {
    if (!G || G.over) return; G.over = true; G.state = 'end'; cancelAnimationFrame(raf);
    const r = { kind, mode: G.mode, stage: G.stage, score: G.score, correct: G.correct, wrong: G.wrong, bosses: G.bosses, bestCombo: G.bestCombo, xp: G.xpGain, secs: Math.round(G.active), stars: 0, newBest: false, lvUp: levelOf(save.xp) > G.lvStart, submit: null };
    if (kind === 'clear') {
      const lost = 3 - G.lives; r.stars = lost <= 0 ? 3 : lost === 1 ? 2 : 1;
      const bonus = 50 + 10 * G.stage + 20 * r.stars; addXp(bonus); r.xp += bonus;
      save.stars[G.stage] = Math.max(save.stars[G.stage] || 0, r.stars); if (G.stage + 1 > save.cleared) save.cleared = Math.min(STAGES.length, G.stage + 1);
      sfx('win');
    } else sfx('lose');
    if (G.score > (save.best[G.mode] || 0)) { save.best[G.mode] = G.score; r.newBest = true; }
    persist(); lastResult = r; scene = 'result'; el.pfOv && el.pfOv.classList.remove('on'); draw();
    if (G.mode === 'challenge') submitScore(r);
  }
  let lastResult = null;
  async function submitScore(r) {
    const p = profile(); if (!p.name || !/^(8|9|10|11|12)$/.test(p.cls) || noBoard) { r.submit = 'skip'; return redrawResult(); }
    if (r.score <= 0 || r.score <= Math.max(save.chBest || 0, me ? me.best : 0)) { r.submit = 'nobest'; return redrawResult(); }
    r.submit = 'wait'; redrawResult();
    try {
      const res = await rpc('game_submit', { p_key: myKey, p_game: GAME, p_name: p.name, p_cls: p.cls, p_score: r.score, p_questions: r.correct, p_bosses: r.bosses, p_secs: Math.max(r.secs, 1) });
      save.chBest = Math.max(save.chBest || 0, r.score); persist(); me = { best: res.r_best, rank: res.r_rank }; r.submit = 'ok'; r.rank = res.r_rank;
    } catch (e) { r.submit = /slow_down/.test(e.message) ? 'slow' : 'fail'; }
    redrawResult();
  }
  let noBoard = false;
  function redrawResult() { if (scene === 'result') draw(); }
  function resultHTML() {
    const r = lastResult; if (!r) return menuHTML();
    const clear = r.kind === 'clear', title = clear ? '🎉 Stage cleared!' : r.mode === 'challenge' ? '💥 Game over' : r.mode === 'campaign' ? '😵 Stage failed' : 'Nice practice!';
    let sub = '';
    if (r.mode === 'challenge') {
      sub = { wait: '<div class="pf-card">Saving your score…</div>', ok: `<div class="pf-card" style="font-weight:800">🏆 Saved to the leaderboard${r.rank ? ' · rank #' + r.rank : ''}!</div>`,
        nobest: '<div class="pf-card" style="font-weight:700">Not above your best on the leaderboard yet. Keep going!</div>',
        fail: '<div class="pf-card" style="font-weight:700">Could not save the score. <button class="pf-link" data-a="retrysubmit">Try again</button></div>',
        slow: '<div class="pf-card" style="font-weight:700">Please wait a few seconds, then <button class="pf-link" data-a="retrysubmit">save again</button>.</div>',
        skip: '<div class="pf-card" style="font-weight:700">Playing without the leaderboard. <button class="pf-link" data-a="editprofile">Add your name</button></div>' }[r.submit] || '';
    }
    const nextOk = clear && r.stage + 1 < STAGES.length;
    return `<div class="pf-top"><h2 style="text-align:center">${title}</h2></div>
      ${clear ? `<div class="pf-big" style="font-size:54px;letter-spacing:6px">${[1, 2, 3].map(n => n <= r.stars ? '⭐' : '☆').join('')}</div>` : ''}
      <div class="pf-big">${r.score}</div><div style="font-weight:800;margin-top:-6px">points${r.newBest ? ' · 🆕 NEW BEST!' : ''}</div>
      <div class="pf-stats"><div><b>${r.correct}</b>correct</div><div><b>${r.wrong}</b>wrong</div><div><b>${r.bosses}</b>bosses</div><div><b>${r.bestCombo}</b>best combo</div><div><b>+${r.xp}</b>XP earned</div><div><b>${r.secs}s</b>time</div></div>
      ${r.lvUp ? `<div class="pf-card" style="font-weight:900;text-align:center">⭐ You reached Level ${levelOf(save.xp)}!</div>` : ''}
      ${clear && r.stage + 1 === save.cleared && save.cleared === CHALLENGE_UNLOCK ? '<div class="pf-card" style="font-weight:900;text-align:center">⚔️ Challenge mode unlocked!</div>' : ''}
      ${sub}${nextOk ? `<button class="pf-btn g c" data-a="stage" data-i="${r.stage + 1}">Next stage ▶</button>` : ''}
      <button class="pf-btn c ${nextOk ? 'w' : ''}" data-a="again">${r.mode === 'campaign' ? '↻ ' + (clear ? 'Replay stage' : 'Try again') : '↻ Play again'}</button>
      <div class="pf-row2"><button class="pf-btn w" data-a="menu">Menu</button>${r.mode === 'challenge' ? '<button class="pf-btn w" data-a="board">🏆 Board</button>' : ''}</div>`;
  }

  /* ===================== main loop ===================== */
  function loop(t) {
    raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    if (!G) return;
    if (G.state === 'play') update(dt);
    else { shake = Math.max(0, shake - dt * 2); }
    render(dt);
  }
  function update(dt) {
    G.active += dt; shake = Math.max(0, shake - dt * 2.2);
    const b = G.boss;
    if (b) { b.t += dt; if (b.enter > 0) b.enter -= dt; b.vuln = Math.max(0, b.vuln - dt); b.hurt = Math.max(0, b.hurt - dt); b.flashT = Math.max(0, b.flashT - dt);
      b.x = W / 2 + Math.sin(b.t * 0.55) * (W / 2 - b.r - 6) * 0.8; b.y = H * 0.4 + Math.sin(b.t * 0.9) * H * 0.07; if (b.enter > 0) { b.y = H * 0.4 - b.enter * 120 * (b.enter > 1.6 ? 1 : 0.3); } }
    // wave spawning
    if (!G.waveLive) { G.waitWave -= dt; if (G.waitWave <= 0) launchWave(); }
    else { for (let i = pending.length - 1; i >= 0; i--) { pending[i].t -= dt; if (pending[i].t <= 0) { spawnFruit(pending[i]); pending.splice(i, 1); } } }
    for (let i = fruits.length - 1; i >= 0; i--) {
      const f = fruits[i]; f.age += dt; f.vy += f.g * dt; f.x += f.vx * dt; f.y += f.vy * dt; f.rot += f.vr * dt;
      if (f.x < f.r && f.vx < 0 || f.x > W - f.r && f.vx > 0) f.vx *= -0.7;
      if (f.y > H + f.r * 1.6 && f.vy > 0 || f.cut) fruits.splice(i, 1);
    }
    for (let i = halves.length - 1; i >= 0; i--) { const h = halves[i]; h.age += dt; h.vy += h.g * dt; h.x += h.vx * dt; h.y += h.vy * dt; h.rot += h.vr * dt; if (h.y > H + h.r * 2) halves.splice(i, 1); }
    for (let i = parts.length - 1; i >= 0; i--) { const p = parts[i]; p.life -= dt; p.vy += p.g * dt; p.x += p.vx * dt; p.y += p.vy * dt; if (p.life <= 0) parts.splice(i, 1); }
    if (parts.length > 320) parts.splice(0, parts.length - 320);
    for (let i = floats.length - 1; i >= 0; i--) { const f = floats[i]; f.life -= dt; f.y -= 34 * dt; if (f.life <= 0) floats.splice(i, 1); }
    // wave finished without a slice → relaunch same question
    if (G.waveLive && !pending.length && !fruits.length && !G.boss?.enter > 0) { G.waveLive = false; G.waitWave = 0.5; G.relaunch++; }
    // challenge timer
    if (G.mode === 'challenge' && G.waveLive !== undefined && !(G.boss && G.boss.enter > 0)) {
      G.qt -= dt; const pc = clamp(G.qt / G.qmax * 100, 0, 100); el.pfProg.className = 'pf-prog time' + (pc < 25 ? ' low' : ''); el.pfProg.firstChild.style.width = pc + '%';
      if (G.qt <= 0) { wrong(null, true); }
    }
    // trail fade
    const now = performance.now(); while (trail.length && now - trail[0].t > 230) trail.shift();
  }

  /* ===================== drawing ===================== */
  function bodyPath(r, wob, kind) {
    const n = wob.length, sx = kind === 'lemon' ? 1.1 : 1, sy = kind === 'lemon' ? 0.9 : 1, pts = [];
    for (let i = 0; i < n; i++) { const a = i / n * 6.2832 - 1.5708, rr = r * wob[i]; pts.push([Math.cos(a) * rr * sx, Math.sin(a) * rr * sy]); }
    c.beginPath(); c.moveTo((pts[0][0] + pts[n - 1][0]) / 2, (pts[0][1] + pts[n - 1][1]) / 2);
    for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; c.quadraticCurveTo(p[0], p[1], (p[0] + q[0]) / 2, (p[1] + q[1]) / 2); }
    c.closePath();
  }
  function drawBody(kind, r, wob, hl) {
    const pal = PAL[kind]; bodyPath(r, wob, kind); c.fillStyle = pal.body; c.fill();
    c.save(); c.clip();
    if (kind === 'melon') { c.strokeStyle = pal.dark; c.lineWidth = r * 0.14; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * r * 0.36, -r); c.quadraticCurveTo(i * r * 0.5, 0, i * r * 0.36, r); c.stroke(); } }
    else if (kind === 'orange' || kind === 'lemon') { c.fillStyle = 'rgba(255,255,255,.22)'; for (let i = 0; i < 9; i++) { c.beginPath(); c.arc(((i * 37) % 11 - 5) * r * 0.16, ((i * 53) % 9 - 4) * r * 0.2, r * 0.045, 0, 6.28); c.fill(); } }
    else if (kind === 'plum') { c.fillStyle = 'rgba(255,255,255,.16)'; c.beginPath(); c.ellipse(r * 0.1, r * 0.2, r * 0.7, r * 0.5, 0.3, 0, 6.28); c.fill(); }
    else if (kind === 'kiwi') { c.fillStyle = 'rgba(70,45,20,.35)'; for (let i = 0; i < 14; i++) c.fillRect(((i * 41) % 15 - 7) * r * 0.12, ((i * 29) % 13 - 6) * r * 0.14, 2.4, 2.4); }
    // shading
    const g = c.createRadialGradient(-r * 0.35, -r * 0.4, r * 0.1, 0, 0, r * 1.1); g.addColorStop(0, 'rgba(255,255,255,.4)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,.22)');
    c.fillStyle = g; c.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4); c.restore();
    bodyPath(r, wob, kind); c.lineJoin = 'round'; c.lineWidth = Math.max(3, r * 0.075); c.strokeStyle = INK; c.stroke();
    // stem + leaf
    c.strokeStyle = INK; c.lineWidth = Math.max(3, r * 0.07); c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -r * 0.92); c.quadraticCurveTo(r * 0.06, -r * 1.15, r * 0.16, -r * 1.22); c.stroke();
    if (kind !== 'melon' && kind !== 'kiwi') { c.fillStyle = '#4cd964'; c.beginPath(); c.ellipse(r * 0.34, -r * 1.12, r * 0.22, r * 0.1, -0.5, 0, 6.28); c.fill(); c.lineWidth = 2.5; c.stroke(); }
    c.fillStyle = 'rgba(255,255,255,.75)'; c.beginPath(); c.ellipse(-r * 0.42, -r * 0.45, r * 0.13, r * 0.07, -0.7, 0, 6.28); c.fill();
  }
  function drawLabel(f) {
    const txt = String(f.label), unit = G && G.q && G.q.unit ? G.q.unit : '', r = f.r;
    let fs = r * 0.62; c.font = `900 ${fs}px 'Segoe Print','Comic Sans MS',system-ui,sans-serif`;
    const maxW = r * 1.72; let w = c.measureText(txt).width; if (w > maxW) { fs *= maxW / w; c.font = `900 ${fs}px 'Segoe Print','Comic Sans MS',system-ui,sans-serif`; w = maxW; }
    const us = Math.max(10, Math.min(fs * 0.5, r * 0.3)), two = unit && unit.length <= 9, th = fs * 1.05 + (two ? us * 1.1 : 0), tw = Math.max(w, two ? us * unit.length * 0.62 : 0) + r * 0.3;
    c.fillStyle = 'rgba(255,255,255,.93)'; c.strokeStyle = INK; c.lineWidth = 2.5; rr(-tw / 2, -th / 2, tw, th, th * 0.3); c.fill(); c.stroke();
    c.fillStyle = INK; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(txt, 0, two ? -us * 0.52 : 0);
    if (two) { c.font = `800 ${us}px system-ui,sans-serif`; c.fillText(unit, 0, fs * 0.5 + us * 0.1 - us * 0.3); }
  }
  function rr(x, y, w, h, r) { c.beginPath(); c.moveTo(x + r, y); c.arcTo(x + w, y, x + w, y + h, r); c.arcTo(x + w, y + h, x, y + h, r); c.arcTo(x, y + h, x, y, r); c.arcTo(x, y, x + w, y, r); c.closePath(); }

  function background() {
    if (bgCache && bgCache.w === W && bgCache.h === H) return bgCache.cv;
    const o = document.createElement('canvas'); o.width = W * dpr; o.height = H * dpr; const x = o.getContext('2d'); x.scale(dpr, dpr);
    const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, '#9fdcff'); g.addColorStop(0.65, '#e8f7ff'); g.addColorStop(1, '#fff1c4'); x.fillStyle = g; x.fillRect(0, 0, W, H);
    x.strokeStyle = 'rgba(31,33,66,.16)'; x.lineWidth = 2; x.lineCap = 'round'; x.fillStyle = 'rgba(31,33,66,.12)';
    const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
    for (let i = 0; i < 12; i++) { // doodles: atoms, waves, arrows, stars
      const px = rnd() * W, py = rnd() * H, k = i % 4, s = 14 + rnd() * 14;
      x.save(); x.translate(px, py); x.rotate(rnd() * 3);
      if (k === 0) { for (let j = 0; j < 3; j++) { x.rotate(1.05); x.beginPath(); x.ellipse(0, 0, s, s * 0.4, 0, 0, 6.28); x.stroke(); } x.beginPath(); x.arc(0, 0, 3, 0, 6.28); x.fill(); }
      else if (k === 1) { x.beginPath(); for (let j = 0; j <= 20; j++) x.lineTo(j * 3 - 30, Math.sin(j * 0.9) * s * 0.4); x.stroke(); }
      else if (k === 2) { x.beginPath(); x.moveTo(-s, 0); x.lineTo(s, 0); x.lineTo(s - 6, -5); x.moveTo(s, 0); x.lineTo(s - 6, 5); x.stroke(); }
      else { x.beginPath(); for (let j = 0; j < 5; j++) { const a = j * 2.513 - 1.57; x.lineTo(Math.cos(a) * s * 0.6, Math.sin(a) * s * 0.6); x.lineTo(Math.cos(a + 1.256) * s * 0.25, Math.sin(a + 1.256) * s * 0.25); } x.closePath(); x.stroke(); }
      x.restore();
    }
    x.fillStyle = 'rgba(255,255,255,.7)'; for (let i = 0; i < 3; i++) { const cx = (i + 0.5) / 3 * W + rnd() * 30, cy = H * (0.1 + rnd() * 0.5); x.beginPath(); x.arc(cx, cy, 20, 0, 6.28); x.arc(cx + 22, cy + 4, 16, 0, 6.28); x.arc(cx - 22, cy + 5, 15, 0, 6.28); x.fill(); }
    bgCache = { w: W, h: H, cv: o }; return o;
  }

  function drawBoss(b, t) {
    const pal = PAL[b.kind], pulse = 0.5 + 0.5 * Math.sin(b.t * 5);
    c.save(); c.translate(b.x, b.y);
    // glow aura
    const gr = b.r * (1.7 + pulse * 0.25), gg = c.createRadialGradient(0, 0, b.r * 0.6, 0, 0, gr);
    const gc = b.vuln > 0 ? '255,70,70' : '255,220,60'; gg.addColorStop(0, `rgba(${gc},.75)`); gg.addColorStop(1, `rgba(${gc},0)`); c.fillStyle = gg; c.beginPath(); c.arc(0, 0, gr, 0, 6.28); c.fill();
    // orbiting sparkles
    for (let i = 0; i < 6; i++) { const a = b.t * 1.4 + i * 1.047, d = b.r * 1.28; c.fillStyle = i % 2 ? '#fff' : '#ffe14a'; c.beginPath(); c.arc(Math.cos(a) * d, Math.sin(a) * d * 0.9, 3.5 + pulse * 2, 0, 6.28); c.fill(); }
    const sc = 1 + (b.hurt > 0 ? 0.07 * Math.sin(b.hurt * 50) : 0) + pulse * 0.025; c.scale(sc, sc);
    if (b.flashT > 0) c.globalAlpha = 0.65 + 0.35 * Math.sin(b.flashT * 90);
    c.rotate(Math.sin(b.t * 1.7) * 0.07); drawBody(b.kind, b.r, b.wob);
    // flesh belly + angry face
    c.fillStyle = 'rgba(255,255,255,.85)'; c.strokeStyle = INK; c.lineWidth = 3.5;
    [-1, 1].forEach(s => { c.beginPath(); c.ellipse(s * b.r * 0.34, -b.r * 0.08, b.r * 0.2, b.r * 0.24, 0, 0, 6.28); c.fill(); c.stroke(); c.fillStyle = INK; c.beginPath(); c.arc(s * b.r * 0.3, -b.r * 0.04, b.r * 0.085, 0, 6.28); c.fill(); c.fillStyle = 'rgba(255,255,255,.85)'; });
    c.lineWidth = 5; c.lineCap = 'round'; c.strokeStyle = INK; c.beginPath(); c.moveTo(-b.r * 0.6, -b.r * 0.42); c.lineTo(-b.r * 0.14, -b.r * 0.22); c.moveTo(b.r * 0.6, -b.r * 0.42); c.lineTo(b.r * 0.14, -b.r * 0.22); c.stroke();
    c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-b.r * 0.4, b.r * 0.32); c.quadraticCurveTo(0, b.r * (0.2 + 0.1 * pulse), b.r * 0.4, b.r * 0.32); c.quadraticCurveTo(0, b.r * 0.72, -b.r * 0.4, b.r * 0.32); c.fill(); c.lineWidth = 3.5; c.stroke();
    c.lineWidth = 2.5; for (let i = -2; i <= 2; i++) { c.beginPath(); c.moveTo(i * b.r * 0.15, b.r * 0.3); c.lineTo(i * b.r * 0.15, b.r * 0.5); c.stroke(); }
    // crown
    c.fillStyle = '#ffd23f'; c.lineWidth = 3.5; c.beginPath(); c.moveTo(-b.r * 0.42, -b.r * 0.98); c.lineTo(-b.r * 0.46, -b.r * 1.38); c.lineTo(-b.r * 0.22, -b.r * 1.15); c.lineTo(0, -b.r * 1.5); c.lineTo(b.r * 0.22, -b.r * 1.15); c.lineTo(b.r * 0.46, -b.r * 1.38); c.lineTo(b.r * 0.42, -b.r * 0.98); c.closePath(); c.fill(); c.stroke();
    c.globalAlpha = 1; c.restore();
    // vulnerable ring
    if (b.vuln > 0) {
      c.save(); c.translate(b.x, b.y); c.strokeStyle = '#ff2d2d'; c.lineWidth = 6; c.setLineDash([14, 10]); c.lineDashOffset = -b.t * 60; c.beginPath(); c.arc(0, 0, b.r * 1.12, 0, 6.28); c.stroke(); c.setLineDash([]);
      c.font = `900 ${Math.max(16, b.r * 0.28)}px system-ui,sans-serif`; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = INK; c.fillStyle = '#fff'; const ty = b.r * 1.45 + 8; c.strokeText('⚔ SLASH IT! ⚔', 0, ty); c.fillText('⚔ SLASH IT! ⚔', 0, ty); c.restore();
    }
    // HP bar
    const bw = Math.min(W * 0.7, b.r * 3), bx = b.x - bw / 2, by = Math.max(6, b.y - b.r * 1.55 - 18);
    c.save(); c.fillStyle = '#fff'; c.strokeStyle = INK; c.lineWidth = 3.5; rr(bx, by, bw, 15, 8); c.fill(); c.stroke();
    c.save(); rr(bx + 2, by + 2, bw - 4, 11, 6); c.clip(); const hpw = (bw - 4) * Math.max(0, b.hp) / b.max; const lg = c.createLinearGradient(bx, 0, bx + bw, 0); lg.addColorStop(0, '#ff3b3b'); lg.addColorStop(1, '#ff9f1c'); c.fillStyle = lg; c.fillRect(bx + 2, by + 2, hpw, 11);
    c.strokeStyle = 'rgba(31,33,66,.45)'; c.lineWidth = 1.5; for (let i = 1; i < b.max; i++) { const x = bx + 2 + (bw - 4) * i / b.max; c.beginPath(); c.moveTo(x, by + 2); c.lineTo(x, by + 13); c.stroke(); } c.restore();
    c.font = '900 11px system-ui,sans-serif'; c.fillStyle = INK; c.textAlign = 'center'; c.fillText('👑 ' + b.name + '  ' + b.hp + '/' + b.max, b.x, by - 4); c.restore();
  }

  function render() {
    if (!c) return;
    c.save(); c.setTransform(dpr, 0, 0, dpr, 0, 0); c.clearRect(0, 0, W, H);
    if (shake > 0) c.translate(rand(-1, 1) * shake * 9, rand(-1, 1) * shake * 9);
    c.drawImage(background(), 0, 0, W, H);
    if (G && G.boss && G.boss.enter < 2.0) drawBoss(G.boss);
    fruits.forEach(f => {
      c.save(); c.translate(f.x, f.y);
      if (f.hl) { c.shadowColor = '#22d16a'; c.shadowBlur = 28; c.strokeStyle = '#22d16a'; c.lineWidth = 6; c.beginPath(); c.arc(0, 0, f.r * 1.2, 0, 6.28); c.stroke(); c.shadowBlur = 0; }
      c.save(); c.rotate(f.rot); drawBody(f.kind, f.r, f.wob); c.restore(); drawLabel(f); c.restore();
    });
    halves.forEach(h => {
      c.save(); c.translate(h.x, h.y); c.rotate(h.rot); const off = Math.min(7, h.age * 40); c.translate(0, h.side > 0 ? -off : off);
      c.beginPath(); c.rect(-h.r * 2, h.side > 0 ? -h.r * 2 : 0, h.r * 4, h.r * 2); c.clip(); drawBody(h.kind, h.r, h.wob);
      c.strokeStyle = PAL[h.kind].flesh; c.lineWidth = 9; c.lineCap = 'round'; c.beginPath(); c.moveTo(-h.r * 0.9, 0); c.lineTo(h.r * 0.9, 0); c.stroke(); c.restore();
    });
    parts.forEach(p => { c.globalAlpha = clamp(p.life / p.max, 0, 1); c.fillStyle = p.col; c.beginPath(); c.arc(p.x, p.y, p.s, 0, 6.28); c.fill(); }); c.globalAlpha = 1;
    // trail
    if (trail.length > 1) {
      const now = performance.now();
      for (let pass = 0; pass < 2; pass++) { c.lineCap = 'round'; c.lineJoin = 'round';
        for (let i = 1; i < trail.length; i++) { const a = trail[i - 1], b = trail[i], age = clamp(1 - (now - b.t) / 230, 0, 1), k = i / trail.length;
          c.strokeStyle = pass === 0 ? `rgba(60,200,255,${age * 0.55})` : `rgba(255,255,255,${age})`; c.lineWidth = (pass === 0 ? 15 : 6) * k * age + 1; c.beginPath(); c.moveTo(a.x, a.y); c.lineTo(b.x, b.y); c.stroke(); } }
    }
    floats.forEach(f => { c.globalAlpha = clamp(f.life / 0.5, 0, 1); c.font = `900 ${f.size}px 'Segoe Print','Comic Sans MS',system-ui,sans-serif`; c.textAlign = 'center'; c.lineWidth = 5; c.strokeStyle = INK; c.strokeText(f.text, f.x, f.y); c.fillStyle = f.col; c.fillText(f.text, f.x, f.y); }); c.globalAlpha = 1;
    c.restore();
  }

  /* ===================== controls / events ===================== */
  function openPF() {
    if (!Q) return; opened = true; prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    root.classList.add('open'); if (G && !G.over && G.state !== 'end') { /* returning mid-game: keep paused */ }
    G = null; scene = 'menu'; draw(); loadMe();
    if (!save.helped) { save.helped = true; persist(); scene = 'help'; draw(); }
  }
  function closePF() { opened = false; cancelAnimationFrame(raf); G = null; root.classList.remove('open', 'playing'); document.body.style.overflow = prevOverflow; }
  function pauseGame() { if (!G || G.state !== 'play') return; G.state = 'pause'; pointerDown = false; el.pfOv.innerHTML = `<div class="pf-pause"><h3>⏸ Paused</h3><button class="pf-btn g c" data-a="resume">▶ Resume</button><button class="pf-btn w c" data-a="snd">${save.sound ? '🔊 Sound on' : '🔇 Sound off'}</button><button class="pf-btn p c" data-a="quit">Quit to menu</button></div>`; el.pfOv.classList.add('on'); }

  root.addEventListener('click', e => {
    const b = e.target.closest('[data-a]'); if (!b || !root.contains(b)) return; const a = b.dataset.a; sfx('tap'); ac();
    switch (a) {
      case 'close': return closePF();
      case 'menu': G = null; cancelAnimationFrame(raf); return go('menu');
      case 'snd': save.sound = !save.sound; persist(); if (G && G.state === 'pause') return pauseGame2(); return draw();
      case 'help': return go('help');
      case 'campaign': return go('stages');
      case 'practice': return go('practice');
      case 'ptopic': setup.topic = b.dataset.k; return draw();
      case 'ptier': { const t = b.dataset.k === 'auto' ? 'auto' : +b.dataset.k; if (t !== 'auto' && t > maxTier()) return toastMenu('Clear more Campaign stages to unlock this level'); setup.tier = t; return draw(); }
      case 'startpractice': return startGame('practice');
      case 'stage': return startGame('campaign', +b.dataset.i);
      case 'challenge': if (save.cleared < CHALLENGE_UNLOCK) return toastMenu('Clear stage ' + CHALLENGE_UNLOCK + ' in Campaign first'); { const p = profile(); if ((!p.name || !p.cls) && !noBoard) { gotoAfterProfile = () => startGame('challenge'); return go('profile'); } } return startGame('challenge');
      case 'board': return go('board');
      case 'bcls': board.cls = b.dataset.k; return go('board');
      case 'saveprofile': {
        const n = (document.getElementById('pfName').value || '').trim(), cl = document.getElementById('pfCls').value;
        if (n.length < 2) { errMsg = 'Please enter your name (at least 2 letters).'; return draw(); } if (/(https?:\/\/|www\.|@)/i.test(n)) { errMsg = 'Names cannot contain links or @.'; return draw(); } if (!cl) { errMsg = 'Please choose your class.'; return draw(); }
        ls('mbName', n); ls('mbCls', cl); noBoard = false; me = null; const f = gotoAfterProfile; gotoAfterProfile = null; return f ? f() : go('menu'); }
      case 'skipprofile': noBoard = true; { const f = gotoAfterProfile; gotoAfterProfile = null; return f ? f() : go('menu'); }
      case 'editprofile': gotoAfterProfile = null; return go('profile');
      case 'again': return lastResult && lastResult.mode === 'campaign' ? startGame('campaign', lastResult.stage) : startGame(lastResult ? lastResult.mode : 'practice');
      case 'retrysubmit': if (lastResult) { lastResult.submit = null; submitScore(lastResult); } return;
      case 'pause': return pauseGame();
      case 'resume': G.state = 'play'; el.pfOv.classList.remove('on'); lastT = performance.now(); return;
      case 'quit': cancelAnimationFrame(raf); G = null; return go('menu');
      case 'hint': if (G && G.state === 'play') { G.hint = true; if (G.mode !== 'practice') { G.score = Math.max(0, G.score - 20); } showQ(); hud(); } return;
      case 'cont': el.pfOv.classList.remove('on'); fruits = []; pending = []; if (G.lives === 0) return finish('fail'); G.state = 'play'; lastT = performance.now(); nextQuestion(); return;
    }
  });
  function pauseGame2() { G.state = 'play'; pauseGame(); }
  function toastMenu(msg) { errMsg = msg; const d = document.createElement('div'); d.className = 'pf-card'; d.style.cssText = 'font-weight:800;text-align:center;background:#fff3c4'; d.textContent = msg; scr.prepend(d); setTimeout(() => d.remove(), 2200); }
  document.addEventListener('keydown', e => { if (!opened) return; if (e.key === 'Escape') { if (G && G.state === 'play') pauseGame(); else if (G && G.state === 'pause') { G.state = 'play'; el.pfOv.classList.remove('on'); lastT = performance.now(); } else if (!G) closePF(); } });
  document.addEventListener('visibilitychange', () => { if (document.hidden && G && G.state === 'play') pauseGame(); });

  /* ===================== public API + hub registration ===================== */
  window.openPhysicsFury = openPF;
  window.PhysicsFury = { open: openPF, close: closePF, stages: STAGES, _state: () => ({ G, save, fruits, scene, W, H }) };
  (window.GAME_HUB = window.GAME_HUB || []).push({
    id: GAME, title: 'Physics Fury', logo: LOGO, desc: 'Slice the fruit with the right answer! Physics numericals, combos and Boss Fruits.',
    pill: () => save.best.challenge || save.best.campaign ? '🏆 Best: ' + Math.max(save.best.challenge, save.best.campaign) : 'NEW', open: openPF
  });
})();
