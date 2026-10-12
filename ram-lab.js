/* RAM LAB — interactive 2D science laboratory for Shree Ram Classes.
   Core file: landscape-first shell, orientation overlay, experiment workbench (add equipment, drag/touch, wires, undo),
   graphs, guided + free modes. Experiments live in separate files and register themselves:
       ram-lab-physics.js · ram-lab-maths.js · ram-lab-chem.js     (load them AFTER this file)
   Public API: window.RamLab = { register(exp), open(expId?), close(), util }  ·  window.openRamLab()
   Logos (assets/): ram-lab-logo.png, physics-lab-logo.png, maths-lab-logo.png, chemistry-lab-logo.png (window.RAMLAB_LOGOS can override)
   No dependencies, no network, works on GitHub Pages sub-paths (all paths relative to document.baseURI).        */
(function () {
  'use strict';
  if (window.RamLab) return;

  /* ===================== utilities ===================== */
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fmt = (v, d) => {
    if (v == null || isNaN(v)) return '–'; if (!isFinite(v)) return '∞'; d = d == null ? 2 : d; const a = Math.abs(v);
    if (a !== 0 && (a >= 1e5 || a < 1e-3)) return v.toExponential(2).replace('e+', '×10^').replace('e-', '×10^-');
    return String(+v.toFixed(d));
  };
  const ls = (k, v) => { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { } return null; };
  const asset = n => new URL('assets/' + n, document.baseURI).href;
  const LOGOS = Object.assign({ ram: asset('ram-lab-logo.png'), physics: asset('physics-lab-logo.png'), maths: asset('maths-lab-logo.png'), chem: asset('chemistry-lab-logo.png') }, window.RAMLAB_LOGOS || {});
  const LABS = {
    physics: { name: 'Physics Lab', short: 'Physics', icon: '⚛️', color: '#4cc9f0' },
    maths: { name: 'Maths Lab', short: 'Maths', icon: '📐', color: '#ffd23f' },
    chem: { name: 'Chemistry Lab', short: 'Chemistry', icon: '🧪', color: '#b794f6' }
  };
  const VW = 1000, VH = 560;
  const EXPS = [], EXP = {};

  function register(e) {
    if (!e || !e.id || !LABS[e.lab]) { console.warn('RamLab.register: bad experiment', e); return; }
    e.types = e.types || {}; e.catalog = e.catalog || []; e.params = e.params || []; e.graphs = e.graphs || [];
    /* spread the position of the correct answer (deterministic, so it is stable between visits) */
    const rot = (q, k) => { if (!q || !q.opts || q._rot) return; const n = q.opts.length, o = new Array(n); q.opts.forEach((t, j) => o[(j + k) % n] = t); q.opts = o; q.a = (q.a + k) % n; q._rot = 1; };
    let rk = (e.id || '').length; (e.quiz || []).forEach((q, i) => rot(q, (rk + i * 2 + 1) % q.opts.length)); ((e.guided && e.guided.steps) || []).forEach((st, i) => { if (st.predict) rot(st.predict, (rk + i + 2) % st.predict.opts.length); });
    if (EXP[e.id]) EXPS.splice(EXPS.indexOf(EXP[e.id]), 1);
    EXP[e.id] = e; EXPS.push(e); if (root && root.classList.contains('open')) renderLeft();
  }

  /* ===================== CSS ===================== */
  const css = `
  #rl-root{position:fixed;inset:0;z-index:9900;display:none;flex-direction:column;background:#070d24;color:#e8eeff;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
    -webkit-user-select:none;user-select:none;-webkit-tap-highlight-color:transparent;overscroll-behavior:contain;touch-action:manipulation}
  #rl-root.open{display:flex}#rl-root *{box-sizing:border-box}
  #rl-root button{font-family:inherit;color:inherit;cursor:pointer}
  .rl-app{flex:1;min-height:0;display:flex;flex-direction:column;opacity:0;transform:scale(.97);transition:opacity .6s ease,transform .6s ease;background:
     linear-gradient(rgba(76,201,240,.05) 1px,transparent 1px) 0 0/28px 28px,linear-gradient(90deg,rgba(76,201,240,.05) 1px,transparent 1px) 0 0/28px 28px,radial-gradient(ellipse at 50% 0,#14245c 0,#070d24 70%)}
  #rl-root.ready .rl-app{opacity:1;transform:none}
  .rl-top{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 5px) calc(env(safe-area-inset-right,0px) + 10px) 5px calc(env(safe-area-inset-left,0px) + 10px);background:rgba(8,16,48,.85);border-bottom:1px solid rgba(255,255,255,.12);backdrop-filter:blur(6px)}
  .rl-brand{display:flex;align-items:center;gap:8px;min-width:0}.rl-brand img{width:36px;height:36px;border-radius:50%;object-fit:cover;background:#fff;flex:none}
  .rl-brand b{font-size:15px;letter-spacing:1.5px;white-space:nowrap}.rl-brand b i{color:#ffd23f;font-style:normal}
  .rl-cur{flex:1;min-width:0;text-align:center;font-weight:700;font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.rl-cur small{display:block;font-weight:500;opacity:.65;font-size:11px}
  .rl-ib{min-width:40px;height:40px;border:1px solid rgba(255,255,255,.25);border-radius:12px;background:rgba(255,255,255,.08);font-size:16px;display:inline-flex;align-items:center;justify-content:center;gap:5px;padding:0 10px;font-weight:700;flex:none}
  .rl-ib:active{transform:scale(.95)}.rl-ib.on{background:#ffd23f;color:#111;border-color:#ffd23f}.rl-ib.x{background:rgba(255,80,100,.2);border-color:rgba(255,100,110,.6)}
  .rl-seg{display:inline-flex;border:1px solid rgba(255,255,255,.25);border-radius:12px;overflow:hidden;flex:none}.rl-seg button{border:0;background:transparent;padding:0 12px;height:38px;font-weight:700;font-size:13px}.rl-seg button.on{background:#4cc9f0;color:#06122e}
  .rl-main{flex:1;min-height:0;display:grid;grid-template-columns:clamp(190px,21vw,250px) minmax(0,1fr) clamp(230px,27vw,310px);position:relative}
  .rl-left,.rl-right{background:rgba(9,18,52,.92);overflow-y:auto;min-height:0;transition:transform .25s ease;scrollbar-width:thin}
  .rl-left{border-right:1px solid rgba(255,255,255,.12);padding-bottom:20px}.rl-right{border-left:1px solid rgba(255,255,255,.12);display:flex;flex-direction:column}
  .rl-labs{display:flex;gap:4px;padding:8px;position:sticky;top:0;background:#0a1236;z-index:2}.rl-lab{flex:1;border:1px solid rgba(255,255,255,.2);border-radius:12px;background:rgba(255,255,255,.05);padding:5px 2px 4px;font-size:11px;font-weight:700;display:flex;flex-direction:column;align-items:center;gap:2px}
  .rl-lab img{width:34px;height:34px;border-radius:50%;object-fit:cover;background:#fff}.rl-lab.on{border-color:var(--c);box-shadow:0 0 0 1px var(--c),0 0 14px -2px var(--c);background:rgba(255,255,255,.12)}
  .rl-grp{padding:8px 12px 2px;font-size:10.5px;letter-spacing:1.2px;text-transform:uppercase;opacity:.6;font-weight:800}
  .rl-ex{display:flex;align-items:center;gap:9px;width:100%;text-align:left;padding:9px 12px;border:0;background:transparent;border-left:3px solid transparent;font-size:13px;font-weight:600;min-height:44px}
  .rl-ex .ic{font-size:20px;flex:none;width:26px;text-align:center}.rl-ex small{display:block;font-weight:500;opacity:.6;font-size:10.5px}
  .rl-ex.on{background:rgba(76,201,240,.15);border-left-color:var(--c)}.rl-ex:active{background:rgba(255,255,255,.1)}
  .rl-center{position:relative;min-width:0;min-height:0;display:flex;flex-direction:column}
  .rl-stage{position:relative;flex:1;min-height:0;overflow:hidden}
  .rl-svg{position:absolute;inset:0;width:100%;height:100%;touch-action:none;display:block}
  .rl-it{cursor:grab}.rl-it:active{cursor:grabbing}.rl-it.fixed{cursor:default}
  .rl-term{fill:#fff;stroke:#ffd23f;stroke-width:2.5;cursor:crosshair}.rl-term.pend{fill:#ffd23f;animation:rlBlink .5s infinite alternate}.rl-term.used{fill:#4cc9f0}
  @keyframes rlBlink{to{r:11}}
  .rl-wire{fill:none;stroke:#e8eeff;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.rl-wire.sel{stroke:#ffd23f;stroke-width:6}
  .rl-flow{fill:none;stroke:#ffd23f;stroke-width:4;stroke-dasharray:3 14;stroke-linecap:round;animation:rlFlow 1s linear infinite;pointer-events:none}@keyframes rlFlow{to{stroke-dashoffset:-34}}
  .rl-whit{fill:none;stroke:transparent;stroke-width:22;cursor:pointer}
  .rl-sel{fill:none;stroke:#ffd23f;stroke-width:2;stroke-dasharray:6 5;pointer-events:none}
  .rl-fab{position:absolute;left:12px;bottom:12px;z-index:5;height:50px;border:0;border-radius:26px;padding:0 20px 0 14px;background:linear-gradient(135deg,#ffd23f,#ff9f1c);color:#1a1200!important;font-weight:900;font-size:15px;box-shadow:0 6px 18px rgba(255,170,0,.45);display:flex;align-items:center;gap:8px}
  .rl-fab b{font-size:24px;line-height:1}.rl-fab:active{transform:scale(.96)}
  .rl-zoom{position:absolute;right:10px;top:8px;z-index:5;display:flex;flex-direction:column;gap:6px}.rl-zoom button{width:40px;height:40px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(8,16,48,.85);font-size:18px;font-weight:800}
  .rl-tray{position:absolute;left:200px;right:0;bottom:0;display:flex;gap:6px;justify-content:flex-start;padding:0 10px 12px 0;pointer-events:none;overflow-x:auto;z-index:4;scrollbar-width:none}
  .rl-chip{pointer-events:auto;flex:none;border:1px solid rgba(255,255,255,.3);border-radius:20px;background:rgba(8,16,48,.85);font-size:12px;font-weight:700;padding:6px 11px;min-height:36px;display:flex;align-items:center;gap:5px}.rl-chip.on{background:#ffd23f;color:#111;border-color:#ffd23f}
  .rl-msgs{position:absolute;left:10px;top:8px;z-index:4;max-width:min(46%,420px);display:flex;flex-direction:column;gap:5px;pointer-events:none}
  .rl-msg{font-size:12px;font-weight:600;padding:6px 10px;border-radius:10px;background:rgba(8,16,48,.88);border:1px solid rgba(255,255,255,.2);line-height:1.3}.rl-msg.warn{border-color:#ff9f1c;color:#ffd9a0}.rl-msg.ok{border-color:#4ade80;color:#b8f5cc}.rl-msg.bad{border-color:#ff5d6c;color:#ffc2c8}
  .rl-guide{position:relative;z-index:6;margin:6px 8px 0;border:1px solid rgba(255,210,63,.6);background:rgba(30,26,5,.9);border-radius:14px;padding:8px 10px;font-size:13px;display:none}
  .rl-guide.on{display:block;max-height:46%;overflow-y:auto}.rl-guide.min p.x{display:none}.rl-gt{margin-left:auto;border:0;background:transparent;font-size:15px;padding:0 6px;min-height:24px}.rl-guide h4{margin:0 0 3px;font-size:12px;color:#ffd23f;display:flex;gap:8px;align-items:center;letter-spacing:.5px}.rl-guide h4 span{margin-left:auto;font-weight:600;opacity:.8}
  .rl-guide p{margin:0 0 6px;line-height:1.35}.rl-guide .row{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
  .rl-gb{border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);border-radius:10px;padding:6px 12px;font-weight:700;font-size:12.5px;min-height:34px}.rl-gb.p{background:#ffd23f;color:#111;border-color:#ffd23f}.rl-gb.ok{background:#22c55e;color:#04210f;border-color:#22c55e}
  .rl-pred{display:flex;flex-direction:column;gap:5px;margin:4px 0}.rl-pred button{text-align:left;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);border-radius:10px;padding:7px 10px;font-size:12.5px;font-weight:600}
  .rl-pred button.right{background:#16a34a;border-color:#4ade80}.rl-pred button.wrong{background:#b91c1c;border-color:#ff8a8a}
  .rl-bar{display:flex;gap:6px;align-items:center;padding:6px 10px calc(env(safe-area-inset-bottom,0px) + 6px);background:rgba(8,16,48,.9);border-top:1px solid rgba(255,255,255,.12);overflow-x:auto;scrollbar-width:none}
  .rl-bar .rl-ib{height:42px}.rl-bar .sp{flex:1}.rl-bar .tt{font-size:12px;opacity:.75;white-space:nowrap;padding:0 6px;font-variant-numeric:tabular-nums}
  .rl-tabs{display:flex;border-bottom:1px solid rgba(255,255,255,.12);position:sticky;top:0;background:#0a1236;z-index:2}.rl-tabs button{flex:1;border:0;background:transparent;padding:10px 4px;font-size:12px;font-weight:800;border-bottom:3px solid transparent;letter-spacing:.4px}.rl-tabs button.on{border-bottom-color:#ffd23f;color:#ffd23f}
  .rl-pane{padding:10px 12px 18px;font-size:13px;line-height:1.45}.rl-pane h3{margin:2px 0 6px;font-size:14px;color:#ffd23f}.rl-pane h5{margin:12px 0 4px;font-size:11px;letter-spacing:1px;text-transform:uppercase;opacity:.65}
  .rl-field{margin:8px 0}.rl-field label{display:flex;justify-content:space-between;font-size:12px;font-weight:700;margin-bottom:3px}.rl-field label span{color:#4cc9f0;font-variant-numeric:tabular-nums}
  .rl-field input[type=range]{width:100%;height:34px;accent-color:#ffd23f}.rl-field select,.rl-field input[type=number],.rl-field input[type=text]{width:100%;min-height:40px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;padding:6px 10px;font-size:14px;user-select:text;-webkit-user-select:text}
  .rl-field select option{color:#111}.rl-tog{display:flex;align-items:center;justify-content:space-between;min-height:40px;font-weight:700;font-size:13px}
  .rl-sw{width:52px;height:28px;border-radius:15px;background:#475070;position:relative;border:0;transition:background .2s}.rl-sw::after{content:'';position:absolute;top:3px;left:3px;width:22px;height:22px;border-radius:50%;background:#fff;transition:left .2s}.rl-sw.on{background:#22c55e}.rl-sw.on::after{left:27px}
  .rl-ro{display:flex;justify-content:space-between;align-items:baseline;padding:6px 10px;border-radius:10px;background:rgba(255,255,255,.07);margin:4px 0;font-size:13px}.rl-ro b{font-size:16px;color:#7dd3fc;font-variant-numeric:tabular-nums}.rl-ro small{opacity:.7}
  .rl-live{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;background:rgba(255,210,63,.1);border:1px dashed rgba(255,210,63,.5);border-radius:8px;padding:5px 8px;margin:4px 0;color:#ffe9a8}
  .rl-del{width:100%;margin-top:10px;min-height:42px;border-radius:10px;border:1px solid #ff5d6c;background:rgba(255,93,108,.15);font-weight:800}
  .rl-graph{margin:8px 0;background:rgba(0,0,0,.3);border-radius:12px;border:1px solid rgba(255,255,255,.15);padding:4px}.rl-graph svg{display:block;width:100%;height:auto}
  .rl-graph h6{margin:2px 6px;font-size:11px;opacity:.8;font-weight:700}
  .rl-note{font-size:11.5px;padding:7px 10px;border-radius:10px;background:rgba(76,201,240,.1);border:1px solid rgba(76,201,240,.35);margin:8px 0}.rl-note.simp{background:rgba(255,159,28,.1);border-color:rgba(255,159,28,.5)}
  .rl-fm{display:flex;flex-wrap:wrap;gap:5px;margin:4px 0}.rl-fm span{background:rgba(255,255,255,.1);border-radius:8px;padding:3px 8px;font-family:ui-monospace,Menlo,monospace;font-size:12px}
  .rl-q{margin:10px 0;padding:8px 10px;border-radius:12px;background:rgba(255,255,255,.06)}.rl-q b{display:block;margin-bottom:5px}.rl-q button{display:block;width:100%;text-align:left;margin:4px 0;padding:8px 10px;border-radius:9px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.07);font-size:12.5px;font-weight:600}
  .rl-q button.right{background:#16a34a}.rl-q button.wrong{background:#b91c1c}.rl-q p{margin:4px 0 0;font-size:12px;opacity:.9}
  .rl-hyp{width:100%;min-height:64px;border-radius:10px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.08);color:#fff;padding:8px;font:inherit;font-size:13px;user-select:text;-webkit-user-select:text}
  .rl-add{position:absolute;inset:0;z-index:20;background:rgba(3,6,20,.72);backdrop-filter:blur(3px);display:none;align-items:flex-end;justify-content:center}.rl-add.on{display:flex}
  .rl-sheet{width:min(760px,100%);max-height:92%;background:#0d1a4a;border:1px solid rgba(255,255,255,.25);border-radius:20px 20px 0 0;display:flex;flex-direction:column;animation:rlUp .25s ease}@keyframes rlUp{from{transform:translateY(40px);opacity:0}}
  .rl-sheet header{display:flex;gap:8px;align-items:center;padding:10px 12px;border-bottom:1px solid rgba(255,255,255,.15)}.rl-sheet header h3{margin:0;font-size:15px;white-space:nowrap}
  .rl-sheet input{flex:1;min-width:0;height:42px;border-radius:12px;border:1px solid rgba(255,255,255,.3);background:rgba(255,255,255,.1);color:#fff;padding:0 12px;font-size:15px;user-select:text;-webkit-user-select:text}
  .rl-cat{overflow-y:auto;padding:10px;display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px}
  .rl-card{text-align:left;border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.07);border-radius:14px;padding:10px;display:flex;flex-direction:column;gap:3px;min-height:92px}.rl-card:active{background:rgba(255,210,63,.2)}
  .rl-card .ic{font-size:28px}.rl-card b{font-size:13.5px}.rl-card small{font-size:11px;opacity:.7;line-height:1.3}.rl-card[disabled]{opacity:.4}
  .rl-empty{grid-column:1/-1;text-align:center;opacity:.7;padding:30px 0;font-size:13px}
  .rl-toast{position:absolute;left:50%;top:14px;transform:translateX(-50%);z-index:30;background:#ffd23f;color:#111;font-weight:800;font-size:13px;padding:7px 14px;border-radius:20px;opacity:0;pointer-events:none;transition:opacity .25s}.rl-toast.on{opacity:1}
  .rl-scrim{display:none}
  /* ---------- compact landscape phones / small screens: panels become drawers ---------- */
  @media (max-width:920px),(max-height:520px){
    .rl-main{grid-template-columns:minmax(0,1fr)}
    .rl-left,.rl-right{position:absolute;top:0;bottom:0;z-index:12;width:min(78vw,300px);box-shadow:0 0 30px rgba(0,0,0,.6)}
    .rl-left{left:0;transform:translateX(-105%)}.rl-right{right:0;transform:translateX(105%)}
    .rl-main.ol .rl-left,.rl-main.or .rl-right{transform:none}
    .rl-main.ol .rl-scrim,.rl-main.or .rl-scrim{display:block;position:absolute;inset:0;z-index:11;background:rgba(0,0,0,.45)}
    .rl-brand b{display:none}.rl-top{gap:5px}.rl-ib{min-width:38px;height:38px}
    .rl-tray{left:160px}.rl-fab{height:44px;font-size:13px;padding:0 14px 0 10px}
  }
  @media (min-width:921px) and (min-height:521px){.rl-dr{display:none!important}}
  @media (max-height:430px){.rl-bar{padding-top:3px;padding-bottom:3px}.rl-bar .rl-ib{height:36px}.rl-top{padding-top:2px;padding-bottom:2px}.rl-guide{padding:5px 8px}.rl-guide p{margin-bottom:3px;font-size:12px}}
  /* ---------- orientation overlay ---------- */
  #rl-orient{position:absolute;inset:0;z-index:50;display:none;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:24px;overflow:hidden;
    background:radial-gradient(ellipse at 50% 30%,rgba(40,70,170,.9),rgba(5,9,30,.97) 72%);backdrop-filter:blur(10px);transition:opacity .5s ease}
  #rl-orient::before{content:'';position:absolute;inset:-50%;background:linear-gradient(rgba(76,201,240,.12) 1px,transparent 1px) 0 0/34px 34px,linear-gradient(90deg,rgba(76,201,240,.12) 1px,transparent 1px) 0 0/34px 34px;transform:perspective(500px) rotateX(58deg) translateY(0);animation:rlGrid 6s linear infinite}
  @keyframes rlGrid{to{background-position:0 34px,34px 0}}
  #rl-root.rot #rl-orient{display:flex}#rl-root.rot.leaving #rl-orient{opacity:0}
  #rl-orient>*{position:relative;z-index:1}
  .rl-o-logo{width:84px;height:84px;border-radius:50%;object-fit:cover;background:#fff;border:3px solid #ffd23f;box-shadow:0 0 30px rgba(255,210,63,.5);animation:rlGlow 2.4s ease-in-out infinite alternate}
  @keyframes rlGlow{to{box-shadow:0 0 52px rgba(255,210,63,.95)}}
  .rl-phone-wrap{width:190px;height:190px;display:grid;place-items:center;margin:8px 0 2px;position:relative}
  .rl-phone{width:70px;height:128px;border:6px solid #fff;border-radius:18px;background:linear-gradient(160deg,#1c2f7a,#0a1236);position:relative;box-shadow:0 0 28px rgba(76,201,240,.7),inset 0 0 18px rgba(76,201,240,.4);animation:rlRot 3.6s cubic-bezier(.6,0,.3,1) infinite}
  .rl-phone::before{content:'';position:absolute;top:6px;left:50%;width:22px;height:4px;margin-left:-11px;border-radius:3px;background:#fff;opacity:.7}
  .rl-phone i{position:absolute;inset:14px 8px 10px;border-radius:6px;background:linear-gradient(transparent 49%,rgba(255,210,63,.7) 50%,transparent 51%),radial-gradient(circle,#4cc9f0 0 3px,transparent 4px) 0 0/16px 16px;opacity:.85}
  @keyframes rlRot{0%,15%{transform:rotate(0)}45%,80%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
  .rl-arrow{position:absolute;width:190px;height:190px;border-radius:50%;border:4px dashed rgba(255,210,63,.55);border-color:rgba(255,210,63,.7) transparent transparent transparent;animation:rlSpin 3.6s linear infinite}
  @keyframes rlSpin{to{transform:rotate(360deg)}}
  #rl-orient h2{margin:6px 0 4px;font-size:clamp(22px,6.4vw,34px);letter-spacing:.5px}#rl-orient h2 i{color:#ffd23f;font-style:normal}
  #rl-orient p{margin:3px 0;max-width:420px;font-size:clamp(13.5px,3.8vw,16px);opacity:.92;line-height:1.4}
  .rl-o-sub{color:#7dd3fc;font-weight:700}.rl-o-help{margin-top:14px;font-size:12px;opacity:.75;max-width:340px;line-height:1.4}
  .rl-o-btns{display:flex;gap:10px;flex-wrap:wrap;justify-content:center;margin-top:12px}.rl-o-btns button{border-radius:22px;padding:10px 18px;font-weight:800;font-size:13.5px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.12);min-height:42px}.rl-o-btns button.p{background:#ffd23f;color:#111;border-color:#ffd23f}
  .rl-o-skip{opacity:0;pointer-events:none;transition:opacity .6s}.rl-o-skip.on{opacity:1;pointer-events:auto}
  .rl-part{position:absolute;border-radius:50%;background:#4cc9f0;opacity:.0;animation:rlFloat 7s linear infinite;z-index:0}
  @keyframes rlFloat{0%{opacity:0;transform:translateY(40px)}15%{opacity:.7}100%{opacity:0;transform:translateY(-260px) translateX(30px)}}
  #rl-root.rot .rl-app{filter:blur(6px)}
  @media (orientation:landscape) and (max-height:440px){#rl-orient{padding:10px}.rl-phone-wrap{display:none}}
  @media (prefers-reduced-motion:reduce){.rl-phone,.rl-arrow,#rl-orient::before,.rl-o-logo,.rl-flow{animation:none}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  /* ===================== state ===================== */
  let root, el = {}, opened = false, prevOverflow = '';
  let curLab = ls('rlLab') || 'physics', curId = null, mode = ls('rlMode') || 'free', tab = 'props';
  const store = {};            // experiment id -> workspace (kept while the page is open, survives mode switches)
  let W = null, E = null;      // current workspace / experiment
  let pendingWire = null, drag = null, paintQ = 0, panelQ = 0, lastT = 0, raf = 0, forced = false, skipTimer = 0, lastGraphT = 0;

  function newWorkspace(e) {
    const w = { items: [], wires: [], nextId: 1, sel: null, running: false, t: 0, undo: [], redo: [], d: {}, params: {}, graph: {}, step: 0, pred: {}, hyp: '', quiz: {}, msgs: [] };
    e.params.forEach(p => w.params[p.k] = p.val);
    e.graphs.forEach(g => w.graph[g.id] = []);
    return decorate(w, e);
  }
  function decorate(w, e) {   // the bench API that experiments use
    w.add = (type, x, y, p) => {
      const ty = e.types[type]; if (!ty) return null;
      const it = { id: w.nextId++, type, x: x == null ? 500 : x, y: y == null ? 280 : y, p: Object.assign({}, ty.defaults || {}, p || {}) };
      w.items.push(it); return it;
    };
    w.get = id => w.items.find(i => i.id === id);
    w.find = type => w.items.filter(i => i.type === type);
    w.count = type => w.items.filter(i => i.type === type).length;
    w.remove = id => { w.items = w.items.filter(i => i.id !== id); w.wires = w.wires.filter(x => x.a[0] !== id && x.b[0] !== id); if (w.sel && w.sel.kind === 'item' && w.sel.id === id) w.sel = null; };
    w.wire = (a, ta, b, tb) => { if (!w.wires.some(x => (x.a[0] === a && x.a[1] === ta && x.b[0] === b && x.b[1] === tb) || (x.a[0] === b && x.a[1] === tb && x.b[0] === a && x.b[1] === ta))) w.wires.push({ a: [a, ta], b: [b, tb] }); };
    w.termPos = (id, ti) => { const it = w.get(id); if (!it) return [0, 0]; const t = e.types[it.type].terminals[ti]; return [it.x + t[0], it.y + t[1]]; };
    w.toast = toast;
    w.changed = () => { schedulePaint(); schedulePanels(); };
    return w;
  }
  const snapshot = () => JSON.stringify({ items: W.items, wires: W.wires, nextId: W.nextId, params: W.params });
  function pushUndo() { W.undo.push(snapshot()); if (W.undo.length > 50) W.undo.shift(); W.redo = []; }
  function restore(s) { const o = JSON.parse(s); W.items = o.items; W.wires = o.wires; W.nextId = o.nextId; W.params = o.params; W.sel = null; resetDynamic(); }
  function resetDynamic() { W.t = 0; W.running = false; W.d = {}; E.graphs.forEach(g => W.graph[g.id] = []); if (E.reset) E.reset(W); }

  /* ===================== shell ===================== */
  function build() {
    root = document.createElement('div'); root.id = 'rl-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'RAM LAB');
    root.innerHTML = `
    <div class="rl-app" id="rlApp">
      <div class="rl-top">
        <button class="rl-ib rl-dr" data-a="dl" aria-label="Experiments">☰</button>
        <div class="rl-brand"><img src="${LOGOS.ram}" alt="" onerror="this.style.display='none'"><b>RAM <i>LAB</i></b></div>
        <div class="rl-cur" id="rlCur"></div>
        <div class="rl-seg" role="group" aria-label="Mode"><button data-a="mode" data-m="guided">Guided</button><button data-a="mode" data-m="free">Free</button></div>
        <button class="rl-ib rl-dr" data-a="dr" aria-label="Panel">ℹ️</button>
        <button class="rl-ib x" data-a="exit" aria-label="Exit lab">✕</button>
      </div>
      <div class="rl-main" id="rlMain">
        <div class="rl-scrim" data-a="scrim"></div>
        <aside class="rl-left" id="rlLeft"></aside>
        <section class="rl-center">
          <div class="rl-guide" id="rlGuide"></div>
          <div class="rl-stage" id="rlStage">
            <svg class="rl-svg" id="rlSvg" viewBox="0 0 ${VW} ${VH}" preserveAspectRatio="xMidYMid meet">
              <defs><pattern id="rlg" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M40 0H0V40" fill="none" stroke="rgba(120,170,255,.13)" stroke-width="1"/></pattern></defs>
              <rect x="-3000" y="-3000" width="7000" height="7000" fill="url(#rlg)" data-bg="1"/>
              <g id="rlScene"></g><g id="rlWires"></g><g id="rlItems"></g><g id="rlOver"></g>
            </svg>
            <div class="rl-msgs" id="rlMsgs"></div><div class="rl-zoom"><button data-a="zin" aria-label="Zoom in">＋</button><button data-a="zout" aria-label="Zoom out">−</button><button data-a="zfit" aria-label="Fit to screen">⤢</button></div>
            <div class="rl-tray" id="rlTray"></div>
            <button class="rl-fab" data-a="addopen"><b>+</b><span>Add Equipment</span></button>
            <div class="rl-add" id="rlAdd"><div class="rl-sheet"><header><h3 id="rlAddT">Equipment</h3><input id="rlAddQ" type="search" placeholder="Search equipment…" autocomplete="off"><button class="rl-ib" data-a="addclose" aria-label="Close">✕</button></header><div class="rl-cat" id="rlCat"></div></div></div>
            <div class="rl-toast" id="rlToast"></div>
          </div>
          <div class="rl-bar" id="rlBar"></div>
        </section>
        <aside class="rl-right" id="rlRight"></aside>
      </div>
    </div>
    <div id="rl-orient" aria-live="polite">
      <img class="rl-o-logo" src="${LOGOS.ram}" alt="" onerror="this.style.display='none'">
      <h2>Welcome to <i>RAM LAB</i></h2>
      <div class="rl-phone-wrap"><div class="rl-arrow"></div><div class="rl-phone"><i></i></div></div>
      <p><b>Please rotate your device to landscape mode to enter the laboratory.</b></p>
      <p class="rl-o-sub">Rotate your screen to unlock the full experimental workspace.</p>
      <div class="rl-o-btns"><button class="p" data-a="autorot">↻ Try auto-rotate</button><button data-a="exit">Leave lab</button></div>
      <div class="rl-o-help" id="rlHelp">Nothing happens? Turn off “Auto-rotate lock” in your phone’s quick settings, then turn the phone sideways.<br>
        <button class="rl-o-skip" id="rlSkip" data-a="force" style="margin-top:10px;border-radius:18px;padding:8px 16px;border:1px solid rgba(255,255,255,.5);background:rgba(255,255,255,.1);font-weight:700;font-size:12.5px">Enter anyway (compact view)</button></div>
    </div>`;
    document.body.appendChild(root);
    ['rlCur', 'rlMain', 'rlLeft', 'rlRight', 'rlGuide', 'rlStage', 'rlSvg', 'rlScene', 'rlWires', 'rlItems', 'rlOver', 'rlMsgs', 'rlTray', 'rlAdd', 'rlAddQ', 'rlCat', 'rlAddT', 'rlToast', 'rlBar', 'rlSkip'].forEach(i => el[i] = root.querySelector('#' + i));
    for (let i = 0; i < 16; i++) { const p = document.createElement('span'); p.className = 'rl-part'; const s = 4 + Math.random() * 7; p.style.cssText = `left:${Math.random() * 100}%;bottom:${Math.random() * 40}%;width:${s}px;height:${s}px;animation-delay:${Math.random() * 7}s;animation-duration:${5 + Math.random() * 5}s`; root.querySelector('#rl-orient').appendChild(p); }
    ['touchstart', 'touchmove', 'touchend'].forEach(t => root.addEventListener(t, e => e.stopPropagation(), { passive: true }));
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput); root.addEventListener('change', onChange);
    root.addEventListener('pointerdown', e => { if (e.target.closest('.rl-field input[type=range]')) W && (W._snap = snapshot()); }, true);
    el.rlAddQ.addEventListener('input', renderCatalog);
    const svg = el.rlSvg;
    svg.addEventListener('wheel', e => { if (!W) return; e.preventDefault(); const p = svgPt(e); zoomBy(e.deltaY > 0 ? 1.12 : 1 / 1.12, p.x, p.y); }, { passive: false });
    svg.addEventListener('pointerdown', onDown); svg.addEventListener('pointermove', onMove); svg.addEventListener('pointerup', onUp); svg.addEventListener('pointercancel', onUp);
  }

  /* ===================== orientation ===================== */
  const isTouch = () => (matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 1) && Math.min(screen.width, screen.height) < 900;
  const isPortrait = () => window.innerHeight > window.innerWidth * 1.02;
  const needRotate = () => opened && !forced && isTouch() && isPortrait();
  function checkOrient() {
    if (!root || !opened) return;
    const rot = needRotate(), was = root.classList.contains('rot');
    if (rot && !was) { root.classList.remove('leaving'); root.classList.add('rot'); pauseSim(); clearTimeout(skipTimer); el.rlSkip.classList.remove('on'); skipTimer = setTimeout(() => el.rlSkip.classList.add('on'), 6000); }
    else if (!rot && was) { root.classList.add('leaving'); setTimeout(() => { root.classList.remove('rot', 'leaving'); }, 520); clearTimeout(skipTimer); }
    if (!rot) root.classList.add('ready');
    else root.classList.remove('ready');
  }
  const orientSoon = () => { checkOrient(); setTimeout(checkOrient, 250); setTimeout(checkOrient, 700); };
  window.addEventListener('resize', orientSoon); window.addEventListener('orientationchange', orientSoon);
  if (screen.orientation && screen.orientation.addEventListener) screen.orientation.addEventListener('change', orientSoon);
  async function tryLandscapeLock() {
    try { if (!document.fullscreenElement && root.requestFullscreen) await root.requestFullscreen({ navigationUI: 'hide' }); } catch (e) { }
    try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); } catch (e) { }
    orientSoon();
  }
  function releaseLock() { try { screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); } catch (e) { } try { if (document.fullscreenElement && document.exitFullscreen) document.exitFullscreen(); } catch (e) { } }
  const pauseSim = () => { if (W) W.running = false; renderBar(); };

  /* ===================== open / close ===================== */
  function open(id) {
    if (!root) build();
    opened = true; forced = false; prevOverflow = document.body.style.overflow; document.body.style.overflow = 'hidden';
    root.classList.add('open'); root.classList.remove('ready', 'rot', 'leaving');
    if (isTouch()) tryLandscapeLock();
    const startId = id || ls('rlExp'); const first = EXP[startId] || EXPS.find(e => e.lab === curLab) || EXPS[0];
    if (!first) { toast('No experiments are installed yet'); }
    else { curLab = first.lab; selectExp(first.id, true); }
    renderLeft(); orientSoon(); setTimeout(checkOrient, 50);
    cancelAnimationFrame(raf); lastT = performance.now(); raf = requestAnimationFrame(loop);
  }
  function close() {
    if (!root) return; opened = false; cancelAnimationFrame(raf); clearTimeout(skipTimer);
    root.classList.remove('open', 'ready', 'rot'); document.body.style.overflow = prevOverflow; releaseLock();
  }

  /* ===================== experiments list ===================== */
  function renderLeft() {
    const labs = Object.keys(LABS).map(k => `<button class="rl-lab ${k === curLab ? 'on' : ''}" style="--c:${LABS[k].color}" data-a="lab" data-k="${k}"><img src="${LOGOS[k]}" alt="" onerror="this.outerHTML='<span style=&quot;font-size:26px&quot;>${LABS[k].icon}</span>'">${LABS[k].short}</button>`).join('');
    const list = EXPS.filter(e => e.lab === curLab); const groups = {}; list.forEach(e => (groups[e.topic] = groups[e.topic] || []).push(e));
    const body = list.length ? Object.keys(groups).map(t => `<div class="rl-grp">${esc(t)}</div>` + groups[t].map(e => `<button class="rl-ex ${E && e.id === E.id ? 'on' : ''}" style="--c:${LABS[curLab].color}" data-a="exp" data-id="${e.id}"><span class="ic">${e.icon || '🔬'}</span><span>${esc(e.title)}<small>${esc(e.level || 'Beginner')}${e.model === 'simplified' ? ' · simplified' : ''}</small></span></button>`).join('')).join('') : '<div class="rl-pane">Experiments for this lab are not installed.</div>';
    el.rlLeft.innerHTML = `<div class="rl-labs">${labs}</div>${body}`;
  }

  function selectExp(id, silent) {
    const e = EXP[id]; if (!e) return; E = e; curLab = e.lab; ls('rlExp', id); ls('rlLab', curLab);
    if (!store[id]) { W = store[id] = newWorkspace(e); if (e.init) e.init(W); W.undo = []; if (e.sim) e.sim(W, 0); } else W = store[id];
    pendingWire = null; drag = null; tab = 'props'; if (!silent) closeDrawers();
    el.rlCur.innerHTML = `${esc(e.title)}<small>${esc(LABS[e.lab].name)} · ${esc(e.topic)} · ${esc(e.level || 'Beginner')}</small>`;
    el.rlAddT.textContent = 'Add Equipment · ' + e.title;
    fitView(); renderLeft(); applyMode(); paint(); renderPanels();
  }
  function applyMode() {
    root.querySelectorAll('[data-a="mode"]').forEach(b => b.classList.toggle('on', b.dataset.m === mode)); ls('rlMode', mode);
    renderGuide();
  }

  /* ===================== catalog / add equipment ===================== */
  function renderCatalog() {
    if (!E) return; const q = (el.rlAddQ.value || '').toLowerCase().trim();
    const list = E.catalog.filter(c => !q || (c.name + ' ' + (c.tags || '') + ' ' + (c.desc || '')).toLowerCase().includes(q));
    el.rlCat.innerHTML = list.length ? list.map(c => { const full = c.max && W.count(c.type) >= c.max; return `<button class="rl-card" data-a="add" data-t="${c.type}" data-i="${E.catalog.indexOf(c)}" ${full ? 'disabled' : ''}><span class="ic">${c.icon || '🔧'}</span><b>${esc(c.name)}</b><small>${esc(c.desc || '')}${full ? ' (already on the bench)' : ''}</small></button>`; }).join('') : '<div class="rl-empty">No equipment matches “' + esc(q) + '”. Try another word.</div>';
  }
  function freeSpot(type) {
    const ty = E.types[type]; if (ty && ty.place) { const p = ty.place(W); if (p) return p; }
    const sx = 170, sy = 130, dx = 150, dy = 120;
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) { const x = sx + c * dx, y = sy + r * dy; if (!W.items.some(i => Math.abs(i.x - x) < 100 && Math.abs(i.y - y) < 80)) return [x, y]; }
    return [300 + Math.random() * 400, 200 + Math.random() * 200];
  }
  function addEquipment(type, idx) {
    const c = (idx != null && idx >= 0 && E.catalog[idx] && E.catalog[idx].type === type) ? E.catalog[idx] : E.catalog.find(x => x.type === type); if (!c) return;
    if (c.max && W.count(type) >= c.max) return toast('Only ' + c.max + ' allowed on this bench');
    pushUndo(); const [x, y] = freeSpot(type); const it = W.add(type, x, y, c.props);
    if (E.onAdd) E.onAdd(W, it); W.sel = { kind: 'item', id: it.id };
    el.rlAdd.classList.remove('on'); toast((c.name || 'Item') + ' added'); tab = 'props'; fitView(); afterChange();
  }

  /* ===================== view: auto-fit, zoom, pan ===================== */
  function stageAsp() { const r = el.rlSvg.getBoundingClientRect(); return r.width && r.height ? r.width / r.height : 1.8; }
  function fitView() {
    const asp = stageAsp(); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    if (E.fixedView || !W.items.length) { W.view = { cx: VW / 2, cy: VH / 2, w: Math.max(VW, VH * asp) }; return; }
    W.items.forEach(i => { const t = E.types[i.type] || {}, w = t.w || 80, h = t.h || 60; x0 = Math.min(x0, i.x - w / 2); x1 = Math.max(x1, i.x + w / 2); y0 = Math.min(y0, i.y - h / 2); y1 = Math.max(y1, i.y + h / 2 + (W.wires.length ? 80 : 20)); });
    if (E.sceneBox) { x0 = Math.min(x0, E.sceneBox[0]); y0 = Math.min(y0, E.sceneBox[1]); x1 = Math.max(x1, E.sceneBox[2]); y1 = Math.max(y1, E.sceneBox[3]); }
    const pad = 60, bw = x1 - x0 + 2 * pad, bh = y1 - y0 + 2 * pad; W.view = { cx: (x0 + x1) / 2, cy: (y0 + y1) / 2, w: clamp(Math.max(bw, bh * asp, 480), 480, 1500) };
  }
  function applyView() {
    if (!W.view) fitView(); const asp = stageAsp(), v = W.view, h = v.w / asp;
    el.rlSvg.setAttribute('viewBox', `${v.cx - v.w / 2} ${v.cy - h / 2} ${v.w} ${h}`);
  }
  function curBox() { const v = W.view, h = v.w / stageAsp(); return [v.cx - v.w / 2, v.cy - h / 2, v.cx + v.w / 2, v.cy + h / 2]; }
  function zoomBy(k, fx, fy) { const v = W.view || (fitView(), W.view); const nw = clamp(v.w * k, 260, 2200); if (fx != null) { v.cx = fx + (v.cx - fx) * (nw / v.w); v.cy = fy + (v.cy - fy) * (nw / v.w); } v.w = nw; paint(); }
  window.addEventListener('resize', () => { if (opened && W && E) setTimeout(() => { if (!E.keepView) fitView(); paint(); }, 120); });

  /* ===================== painting the bench ===================== */
  const schedulePaint = () => { if (!paintQ) paintQ = requestAnimationFrame(() => { paintQ = 0; paint(); }); };
  const schedulePanels = () => { if (!panelQ) panelQ = setTimeout(() => { panelQ = 0; renderPanels(); }, 60); };
  function afterChange() { if (E.sim) E.sim(W, 0); if (E.onChange) E.onChange(W); paint(); renderPanels(); }

  function paint() {
    if (!E || !W) return; applyView();
    el.rlScene.innerHTML = E.bg ? E.bg(W) : '';
    // wires
    let wh = '';
    W.wires.forEach((w, i) => {
      const a = W.termPos(w.a[0], w.a[1]), b = W.termPos(w.b[0], w.b[1]), sel = W.sel && W.sel.kind === 'wire' && W.sel.i === i;
      const ta = E.types[W.get(w.a[0]).type].terminals[w.a[1]], tb = E.types[W.get(w.b[0]).type].terminals[w.b[1]];
      const pts = route(a, b, ta[0] < 0 ? -1 : 1, tb[0] < 0 ? -1 : 1), d = 'M' + pts.map(p => p[0] + ' ' + p[1]).join(' L'), dr = 'M' + pts.slice().reverse().map(p => p[0] + ' ' + p[1]).join(' L'), cur = E.wireCurrent ? E.wireCurrent(W, w) : 0;
      wh += `<path class="rl-wire ${sel ? 'sel' : ''}" d="${d}"/>`;
      if ((W.running || E.alwaysFlow) && Math.abs(cur) > 1e-4) wh += `<path class="rl-flow" d="${cur > 0 ? d : dr}" style="animation-duration:${clamp(1.6 / (0.3 + Math.abs(cur) * 2), .25, 3)}s"/>`;
      wh += `<path class="rl-whit" d="${d}" data-w="${i}"/>`;
    });
    el.rlWires.innerHTML = wh;
    // items
    let ih = '';
    W.items.forEach(it => {
      const ty = E.types[it.type]; if (!ty) return; const w = ty.w || 80, h = ty.h || 60, sel = W.sel && W.sel.kind === 'item' && W.sel.id === it.id;
      let inner = ty.draw ? ty.draw(it, W) : '';
      let terms = '';
      (ty.terminals || []).forEach((t, ti) => {
        const used = W.wires.some(x => (x.a[0] === it.id && x.a[1] === ti) || (x.b[0] === it.id && x.b[1] === ti)), pend = pendingWire && pendingWire[0] === it.id && pendingWire[1] === ti;
        terms += `<circle class="rl-term ${used ? 'used' : ''} ${pend ? 'pend' : ''}" cx="${t[0]}" cy="${t[1]}" r="7" data-t="${it.id}:${ti}"/><circle cx="${t[0]}" cy="${t[1]}" r="17" fill="transparent" data-t="${it.id}:${ti}"/>` + (t[2] ? `<text x="${t[0]}" y="${t[1] - 11}" text-anchor="middle" font-size="12" font-weight="800" fill="${t[2] === '+' ? '#ff8a8a' : '#9fc4ff'}" pointer-events="none">${esc(t[2])}</text>` : '');
      });
      ih += `<g class="rl-it ${ty.fixed ? 'fixed' : ''}" data-id="${it.id}" transform="translate(${it.x} ${it.y})"><rect x="${-w / 2 - 6}" y="${-h / 2 - 6}" width="${w + 12}" height="${h + 12}" fill="transparent"/>${inner}${sel ? `<rect class="rl-sel" x="${-w / 2 - 8}" y="${-h / 2 - 8}" width="${w + 16}" height="${h + 16}" rx="10"/>` : ''}${terms}</g>`;
    });
    el.rlItems.innerHTML = ih;
    el.rlOver.innerHTML = E.over ? E.over(W) : '';
    renderTray(); renderMsgs();
  }
  function route(a, b, sa, sb) {   // neat wire path: leaves each terminal sideways, goes round via a lane when needed
    const xa = a[0] + sa * 22, xb = b[0] + sb * 22;
    if (sa === sb) { const xv = sa > 0 ? Math.max(xa, xb) : Math.min(xa, xb); return [a, [xv, a[1]], [xv, b[1]], b]; }
    if ((sa > 0 && xa <= xb) || (sa < 0 && xa >= xb)) { const xm = (xa + xb) / 2; return [a, [xm, a[1]], [xm, b[1]], b]; }
    const yl = clamp(Math.max(a[1], b[1]) + 75, 30, VH - 24); return [a, [xa, a[1]], [xa, yl], [xb, yl], [xb, b[1]], b];
  }
  function renderTray() {
    el.rlTray.innerHTML = W.items.filter(i => E.types[i.type]).map(i => { const ty = E.types[i.type], on = W.sel && W.sel.kind === 'item' && W.sel.id === i.id; return `<button class="rl-chip ${on ? 'on' : ''}" data-a="pick" data-id="${i.id}">${esc(ty.icon || '')} ${esc(ty.name ? ty.name(i) : i.type)}</button>`; }).join('');
  }
  function renderMsgs() {
    const m = E.messages ? E.messages(W) : []; el.rlMsgs.innerHTML = (m || []).slice(0, 3).map(x => `<div class="rl-msg ${x.t || ''}">${x.t === 'ok' ? '✔ ' : x.t === 'warn' || x.t === 'bad' ? '⚠ ' : 'ℹ '}${x.m}</div>`).join('');
  }

  /* ===================== right panel ===================== */
  function renderPanels() { renderRight(); renderBar(); renderGuide(); renderTray(); }
  function fieldHTML(p, val, id) {
    const v = val == null ? p.val : val;
    if (p.type === 'toggle') return `<div class="rl-tog"><span>${esc(p.label)}</span><button class="rl-sw ${v ? 'on' : ''}" data-a="tog" data-k="${p.k}" data-id="${id}" aria-pressed="${!!v}" aria-label="${esc(p.label)}"></button></div>`;
    if (p.type === 'select') return `<div class="rl-field"><label>${esc(p.label)}</label><select data-k="${p.k}" data-id="${id}">${p.options.map(o => `<option value="${esc(o[0])}" ${String(o[0]) === String(v) ? 'selected' : ''}>${esc(o[1])}</option>`).join('')}</select></div>`;
    if (p.type === 'number') return `<div class="rl-field"><label>${esc(p.label)} <span>${esc(p.unit || '')}</span></label><input type="number" inputmode="decimal" data-k="${p.k}" data-id="${id}" value="${v}" min="${p.min == null ? '' : p.min}" max="${p.max == null ? '' : p.max}" step="${p.step || 'any'}"></div>`;
    if (p.type === 'text') return `<div class="rl-field"><label>${esc(p.label)}</label><input type="text" data-k="${p.k}" data-id="${id}" value="${esc(v)}" autocomplete="off"></div>`;
    return `<div class="rl-field"><label>${esc(p.label)} <span id="rlv-${id}-${p.k}">${fmt(v, p.dec == null ? (p.step < 1 ? 2 : 0) : p.dec)} ${esc(p.unit || '')}</span></label><input type="range" data-k="${p.k}" data-id="${id}" min="${p.min}" max="${p.max}" step="${p.step || 1}" value="${v}"></div>`;
  }
  function renderRight() {
    const tabs = ['props', 'data', 'learn'], names = { props: '🎛 Controls', data: '📊 Results', learn: '📖 Learn' };
    let body = '';
    if (tab === 'props') {
      if (W.sel && W.sel.kind === 'item' && W.get(W.sel.id)) {
        const it = W.get(W.sel.id), ty = E.types[it.type], nm = ty.name ? ty.name(it) : it.type;
        body += `<h3>${esc(ty.icon || '')} ${esc(nm)}</h3>` + (ty.info ? `<div class="rl-note">${ty.info}</div>` : '') + (ty.props || []).map(p => fieldHTML(p, it.p[p.k], it.id)).join('') + (ty.extra ? ty.extra(it, W) : '');
        body += `<button class="rl-del" data-a="del" data-id="${it.id}">🗑 Remove ${esc(nm)}</button>`;
      } else if (W.sel && W.sel.kind === 'wire') body += `<h3>🔗 Wire</h3><p>Connects two terminals.</p><button class="rl-del" data-a="delwire">🗑 Remove wire</button>`;
      else body += `<h3>🎛 Experiment variables</h3>` + (E.params.length ? E.params.map(p => fieldHTML(p, W.params[p.k], '_')).join('') : '<p style="opacity:.7">Tap an item on the bench to change its properties.</p>') + `<p style="opacity:.65;font-size:12px;margin-top:10px">Tip: tap <b>＋ Add Equipment</b> to put more items on the bench. Drag items to move them.${(E.types && Object.values(E.types).some(t => t.terminals)) ? ' Tap one terminal (●) then another to connect a wire.' : ''}</p>`;
      if (E.params.length && W.sel) body += `<h5>Experiment variables</h5>` + E.params.map(p => fieldHTML(p, W.params[p.k], '_')).join('');
    } else if (tab === 'data') body = dataHTML();
    else body = learnHTML();
    el.rlRight.innerHTML = `<div class="rl-tabs">${tabs.map(t => `<button class="${t === tab ? 'on' : ''}" data-a="tab" data-t="${t}">${names[t]}</button>`).join('')}</div><div class="rl-pane" id="rlPane">${body}</div>`;
    if (tab === 'data') drawGraphs();
  }
  function dataHTML() {
    const ro = E.readouts ? E.readouts(W) : [], lv = E.live ? E.live(W) : [];
    let h = '<h3>Live measurements</h3>' + (ro.length ? ro.map(r => `<div class="rl-ro"><span>${esc(r.l)}${r.n ? '<small> ' + esc(r.n) + '</small>' : ''}</span><b>${typeof r.v === 'number' ? fmt(r.v, r.d) : esc(r.v)}${r.u ? ' <small>' + esc(r.u) + '</small>' : ''}</b></div>`).join('') : '<p style="opacity:.7">Add equipment to see measurements.</p>');
    if (lv.length) h += '<h5>Live calculation</h5>' + lv.map(x => `<div class="rl-live">${x}</div>`).join('');
    if (E.graphs.length) h += '<h5>Graphs</h5>' + E.graphs.map(g => `<div class="rl-graph"><h6>${esc(g.title)}</h6><svg id="rlg-${g.id}" viewBox="0 0 300 190"></svg></div>`).join('') + (E.graphs.some(g => g.manual) ? '<p style="font-size:12px;opacity:.75">Press <b>📍 Record</b> in the toolbar to add a data point.</p>' : '');
    if (E.results) h += '<h5>Results</h5>' + E.results(W);
    if (W.hyp) h += `<h5>Your hypothesis</h5><div class="rl-note">“${esc(W.hyp)}”</div>`;
    return h;
  }
  function learnHTML() {
    let h = `<h3>${esc(E.icon || '')} ${esc(E.title)}</h3><div class="rl-note ${E.model === 'simplified' ? 'simp' : ''}">${E.model === 'simplified' ? '⚠ <b>Simplified educational model.</b> ' : '✔ <b>Real calculation.</b> '}${E.assumptions || ''}</div>`;
    if (E.objective) h += `<h5>Learning objective</h5><p>${E.objective}</p>`;
    if (E.theory) h += `<h5>Theory</h5><div>${E.theory}</div>`;
    if (E.formulas && E.formulas.length) h += `<h5>Formulas</h5><div class="rl-fm">${E.formulas.map(f => `<span>${f}</span>`).join('')}</div>`;
    h += `<h5>💭 Predict first</h5><textarea class="rl-hyp" id="rlHyp" placeholder="Write your hypothesis: what do you think will happen?">${esc(W.hyp)}</textarea>`;
    if (E.quiz && E.quiz.length) {
      h += `<h5>Quick quiz</h5>` + E.quiz.map((q, i) => { const a = W.quiz[i]; return `<div class="rl-q"><b>${i + 1}. ${q.q}</b>${q.opts.map((o, j) => `<button data-a="quiz" data-q="${i}" data-o="${j}" class="${a == null ? '' : j === q.a ? 'right' : j === a ? 'wrong' : ''}">${o}</button>`).join('')}${a != null ? `<p>${a === q.a ? '✔ Correct. ' : '✘ Not quite. '}${q.why || ''}</p>` : ''}</div>`; }).join('');
    }
    return h;
  }

  /* ---- graphs ---- */
  function drawGraphs() {
    E.graphs.forEach(g => {
      const svg = root.querySelector('#rlg-' + g.id); if (!svg) return; const data = W.graph[g.id] || [], cols = (g.series || []).map(s => s.c);
      const L = 40, R = 292, T = 10, B = 156; let h = '';
      let xs = data.map(d => d[0]), minx = Math.min(...xs, 0), maxx = Math.max(...xs, 1e-9);
      let ys = []; data.forEach(d => { for (let k = 1; k < d.length; k++) ys.push(d[k]); });
      let miny = Math.min(...ys, 0), maxy = Math.max(...ys, 1e-9); if (g.ymin != null) miny = g.ymin; if (g.ymax != null) maxy = Math.max(maxy, g.ymax); if (maxx === minx) maxx = minx + 1; if (maxy === miny) maxy = miny + 1;
      const nice = (a, b) => { const r = b - a, p = Math.pow(10, Math.floor(Math.log10(r))), f = r / p, n = f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10; return [a, a + Math.ceil(r / (n * p / 5)) * (n * p / 5)]; };
      [minx, maxx] = [minx, nice(minx, maxx)[1]]; [miny, maxy] = [miny, nice(miny, maxy)[1]];
      const X = x => L + (x - minx) / (maxx - minx) * (R - L), Y = y => B - (y - miny) / (maxy - miny) * (B - T);
      h += `<rect x="${L}" y="${T}" width="${R - L}" height="${B - T}" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.25)"/>`;
      for (let i = 0; i <= 5; i++) { const gx = L + (R - L) * i / 5, gy = B - (B - T) * i / 5; h += `<line x1="${gx}" y1="${T}" x2="${gx}" y2="${B}" stroke="rgba(255,255,255,.08)"/><line x1="${L}" y1="${gy}" x2="${R}" y2="${gy}" stroke="rgba(255,255,255,.08)"/><text x="${gx}" y="${B + 12}" font-size="9" fill="#9fb4ff" text-anchor="middle">${fmt(minx + (maxx - minx) * i / 5, 1)}</text><text x="${L - 4}" y="${gy + 3}" font-size="9" fill="#9fb4ff" text-anchor="end">${fmt(miny + (maxy - miny) * i / 5, 1)}</text>`; }
      h += `<text x="${(L + R) / 2}" y="186" font-size="10" fill="#cfd8ff" text-anchor="middle">${esc(g.x)}</text><text x="9" y="${(T + B) / 2}" font-size="10" fill="#cfd8ff" text-anchor="middle" transform="rotate(-90 9 ${(T + B) / 2})">${esc(g.y)}</text>`;
      const ns = Math.max(0, ...data.map(d => d.length - 1));
      for (let k = 1; k <= ns; k++) {
        const pts = data.filter(d => d[k] != null && isFinite(d[k])).map(d => [X(d[0]), Y(d[k])]), c = cols[k - 1] || '#ffd23f';
        if (pts.length > 1 && !g.points) h += `<polyline fill="none" stroke="${c}" stroke-width="2" points="${pts.map(p => p.join(',')).join(' ')}"/>`;
        if (g.points || pts.length < 80) pts.forEach(p => h += `<circle cx="${p[0]}" cy="${p[1]}" r="3" fill="${c}"/>`);
      }
      if (g.fit && data.length > 1) { const f = g.fit(data); if (f) h += f(X, Y, minx, maxx); }
      if (!data.length) h += `<text x="${(L + R) / 2}" y="${(T + B) / 2}" font-size="11" fill="#9fb4ff" text-anchor="middle">${g.manual ? 'Press 📍 Record to plot points' : 'Press ▶ Run to start recording'}</text>`;
      if (g.series && g.series.length > 1) h += g.series.map((s, i) => `<circle cx="${L + 8 + i * 70}" cy="${T + 8}" r="3" fill="${s.c}"/><text x="${L + 14 + i * 70}" y="${T + 11}" font-size="9" fill="#fff">${esc(s.n)}</text>`).join('');
      svg.innerHTML = h;
    });
  }

  /* ===================== guided mode ===================== */
  function renderGuide() {
    const g = E && E.guided, box = el.rlGuide;
    if (mode !== 'guided' || !g) { box.classList.remove('on'); if (mode === 'guided' && !g) { box.classList.add('on'); box.innerHTML = '<h4>GUIDED MODE</h4><p>No step-by-step guide for this experiment yet. Switch to Free mode, or read the Learn tab.</p>'; } return; }
    const steps = g.steps, i = clamp(W.step, 0, steps.length - 1), s = steps[i], ok = s.ok ? s.ok(W) : false;
    const mn = !!W.gMin; box.classList.toggle('min', mn);
    let h = `<h4>🎯 GUIDED · STEP ${i + 1} / ${steps.length}<span>${ok ? '✔ done' : ''}</span><button class="rl-gt" data-a="gmin" aria-label="Collapse">${mn ? '▾' : '▴'}</button></h4>`;
    if (i === 0 && g.objective && !mn) h += `<p class="x"><b>Goal:</b> ${g.objective}</p>`;
    if (s.predict && !mn) { const pr = W.pred[i]; h += `<p><b>Predict:</b> ${s.predict.q}</p><div class="rl-pred">${s.predict.opts.map((o, j) => `<button data-a="pred" data-s="${i}" data-o="${j}" class="${pr == null ? '' : j === s.predict.a ? 'right' : j === pr ? 'wrong' : ''}">${o}</button>`).join('')}</div>` + (pr != null ? `<p>${pr === s.predict.a ? '✔ ' : '✘ '}${s.predict.why || ''}</p>` : ''); }
    h += `<p>${s.t}</p>`;
    if (i === steps.length - 1 && g.done && !mn) h += `<div class="rl-note">${g.done(W)}</div>`;
    h += `<div class="row"><button class="rl-gb" data-a="gprev" ${i === 0 ? 'disabled style="opacity:.4"' : ''}>‹ Back</button>`;
    h += i < steps.length - 1 ? `<button class="rl-gb ${ok ? 'ok' : 'p'}" data-a="gnext">${ok ? '✔ Next step' : 'Next ›'}</button>` : `<button class="rl-gb p" data-a="gdone">Finish</button>`;
    if (g.setup) h += `<button class="rl-gb" data-a="gsetup">⚙ Set up for me</button>`;
    h += '</div>'; box.innerHTML = h; box.classList.add('on');
  }

  /* ===================== bottom bar ===================== */
  function renderBar() {
    if (!E || !W) return; const man = E.graphs.some(g => g.manual), canRun = E.step || E.graphs.some(g => g.sample && !g.manual) || E.animated;
    el.rlBar.innerHTML = (canRun ? `<button class="rl-ib ${W.running ? 'on' : ''}" data-a="run">${W.running ? '⏸ Pause' : '▶ Run'}</button>` : '') +
      `<button class="rl-ib" data-a="reset">↺ Reset</button><button class="rl-ib" data-a="clear">🧹 Clear</button><button class="rl-ib" data-a="undo" ${W.undo.length ? '' : 'disabled style="opacity:.45"'}>↶ Undo</button><button class="rl-ib" data-a="redo" ${W.redo.length ? '' : 'disabled style="opacity:.45"'}>↷</button>` +
      (E.presets && E.presets.length ? E.presets.map((p, i) => `<button class="rl-ib" data-a="preset" data-i="${i}">${esc(p.icon || '📋')} ${esc(p.name)}</button>`).join('') : '') +
      (man ? `<button class="rl-ib" data-a="record">📍 Record</button>` : '') + `<button class="rl-ib" data-a="tabdata">📊 Graph</button><span class="sp"></span><span class="tt" id="rlTT">${canRun ? 't = ' + fmt(W.t, 1) + ' s' : ''}</span>`;
  }

  /* ===================== simulation loop ===================== */
  function loop(t) {
    raf = requestAnimationFrame(loop); const dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    if (!opened || !E || !W || root.classList.contains('rot')) return;
    if (W.running) {
      W.t += dt; if (E.step) E.step(W, dt); if (E.sim) E.sim(W, dt);
      lastGraphT += dt; if (lastGraphT >= (E.sampleEvery || 0.15)) { lastGraphT = 0; E.graphs.forEach(g => { if (g.sample && !g.manual) pushSample(g); }); }
      paint(); const tt = root.querySelector('#rlTT'); if (tt) tt.textContent = 't = ' + fmt(W.t, 1) + ' s';
      if (tab === 'data') { W._pt = (W._pt || 0) + dt; if (W._pt > 0.15) { W._pt = 0; const sc = el.rlRight.querySelector('.rl-pane'), top = sc ? sc.scrollTop : 0; renderRight(); const sc2 = el.rlRight.querySelector('.rl-pane'); if (sc2) sc2.scrollTop = top; } }
    } else if (E.animated) { if (E.sim) E.sim(W, dt); paint(); }
  }
  function pushSample(g) {
    const s = g.sample(W); if (!s) return; const d = W.graph[g.id];
    if (g.manual) { const k = d.findIndex(r => Math.abs(r[0] - s[0]) < 1e-9); if (k >= 0) d[k] = s; else { d.push(s); d.sort((a, b) => a[0] - b[0]); } }
    else { d.push(s); if (d.length > 700) { const nd = []; for (let i = 0; i < d.length; i += 2) nd.push(d[i]); W.graph[g.id] = nd; } }
  }

  /* ===================== pointer interaction on the bench ===================== */
  function svgPt(e) { const s = el.rlSvg, p = s.createSVGPoint(); p.x = e.clientX; p.y = e.clientY; const m = s.getScreenCTM(); return m ? p.matrixTransform(m.inverse()) : { x: 0, y: 0 }; }
  function onDown(e) {
    if (!W) return; const tgt = e.target;
    const term = tgt.closest && tgt.closest('[data-t]');
    if (term) { e.preventDefault(); const [id, ti] = term.dataset.t.split(':').map(Number); return tapTerminal(id, ti); }
    const wi = tgt.closest && tgt.closest('[data-w]'); if (wi) { e.preventDefault(); W.sel = { kind: 'wire', i: +wi.dataset.w }; pendingWire = null; tab = 'props'; paint(); renderPanels(); return; }
    const g = tgt.closest && tgt.closest('.rl-it');
    if (g) {
      e.preventDefault(); const id = +g.dataset.id, it = W.get(id), ty = E.types[it.type]; pendingWire = null;
      W.sel = { kind: 'item', id }; tab = 'props';
      if (ty.onTap) { ty.onTap(it, W, svgPt(e)); afterChange(); }
      if (!ty.fixed) { const p = svgPt(e); drag = { id, dx: it.x - p.x, dy: it.y - p.y, moved: false, snap: snapshot(), pid: e.pointerId }; try { el.rlSvg.setPointerCapture(e.pointerId); } catch (x) { } }
      paint(); renderPanels(); return;
    }
    pendingWire = null; W.sel = null; if (E.onCanvas) { E.onCanvas(W, svgPt(e), e); afterChange(); }
    if (tgt.closest && tgt.closest('[data-bg]') && !E.noPan) { const p = svgPt(e); drag = { pan: true, sx: e.clientX, sy: e.clientY, cx: W.view.cx, cy: W.view.cy, pid: e.pointerId }; try { el.rlSvg.setPointerCapture(e.pointerId); } catch (x) { } }
    paint(); renderPanels();
  }
  function onMove(e) {
    if (drag && drag.pan) { const r = el.rlSvg.getBoundingClientRect(), k = W.view.w / r.width; W.view.cx = drag.cx - (e.clientX - drag.sx) * k; W.view.cy = drag.cy - (e.clientY - drag.sy) * k; schedulePaint(); return; }
    if (!drag) return; const it = W.get(drag.id); if (!it) return; const p = svgPt(e), ty = E.types[it.type], w = ty.w || 80, h = ty.h || 60;
    const bx = curBox(); let nx = clamp(Math.round((p.x + drag.dx) / 10) * 10, bx[0] + w / 2 + 4, bx[2] - w / 2 - 4), ny = clamp(Math.round((p.y + drag.dy) / 10) * 10, bx[1] + h / 2 + 4, bx[3] - h / 2 - 4);
    if (nx !== it.x || ny !== it.y) { if (!drag.moved) { drag.moved = true; W.undo.push(drag.snap); if (W.undo.length > 50) W.undo.shift(); W.redo = []; } it.x = nx; it.y = ny; if (ty.onDrag) ty.onDrag(it, W); if (E.sim) E.sim(W, 0); schedulePaint(); }
  }
  function onUp() { if (drag && drag.pan) { drag = null; return; } if (drag) { const it = W.get(drag.id); if (!drag.moved && it && E.types[it.type].onClick) { E.types[it.type].onClick(it, W); afterChange(); } if (drag.moved && it) { const ty = E.types[it.type]; if (ty.onDrop) ty.onDrop(it, W); if (E.onChange) E.onChange(W); renderPanels(); } drag = null; paint(); } }
  function tapTerminal(id, ti) {
    if (!pendingWire) { pendingWire = [id, ti]; toast('Now tap another terminal to connect'); }
    else if (pendingWire[0] === id && pendingWire[1] === ti) pendingWire = null;
    else if (pendingWire[0] === id) { toast('Connect to a different component'); pendingWire = null; }
    else { pushUndo(); W.wire(pendingWire[0], pendingWire[1], id, ti); pendingWire = null; toast('Wire connected'); afterChange(); return; }
    paint();
  }

  /* ===================== UI events ===================== */
  function toast(m) { if (!el.rlToast) return; el.rlToast.textContent = m; el.rlToast.classList.add('on'); clearTimeout(toast._t); toast._t = setTimeout(() => el.rlToast.classList.remove('on'), 1700); }
  function closeDrawers() { el.rlMain.classList.remove('ol', 'or'); }
  function onClick(e) {
    const b = e.target.closest('[data-a]'); if (!b || !root.contains(b)) return; const a = b.dataset.a;
    switch (a) {
      case 'exit': return close();
      case 'autorot': return tryLandscapeLock();
      case 'force': forced = true; root.classList.remove('rot'); root.classList.add('ready'); return;
      case 'dl': el.rlMain.classList.toggle('ol'); el.rlMain.classList.remove('or'); return;
      case 'dr': el.rlMain.classList.toggle('or'); el.rlMain.classList.remove('ol'); return;
      case 'scrim': return closeDrawers();
      case 'lab': curLab = b.dataset.k; ls('rlLab', curLab); return renderLeft();
      case 'exp': return selectExp(b.dataset.id);
      case 'mode': mode = b.dataset.m; applyMode(); if (mode === 'guided') { W.step = W.step || 0; renderGuide(); } return;
      case 'addopen': el.rlAddQ.value = ''; renderCatalog(); el.rlAdd.classList.add('on'); setTimeout(() => { if (!isTouch()) el.rlAddQ.focus(); }, 60); return;
      case 'addclose': return el.rlAdd.classList.remove('on');
      case 'add': return addEquipment(b.dataset.t, b.dataset.i == null ? null : +b.dataset.i);
      case 'pick': W.sel = { kind: 'item', id: +b.dataset.id }; tab = 'props'; paint(); renderPanels(); el.rlMain.classList.add('or'); return;
      case 'del': pushUndo(); W.remove(+b.dataset.id); return afterChange();
      case 'delwire': pushUndo(); W.wires.splice(W.sel.i, 1); W.sel = null; return afterChange();
      case 'tab': tab = b.dataset.t; return renderRight();
      case 'tabdata': tab = 'data'; el.rlMain.classList.add('or'); return renderRight();
      case 'tog': { const k = b.dataset.k, id = b.dataset.id; pushUndo(); if (id === '_') W.params[k] = !W.params[k]; else { const it = W.get(+id); it.p[k] = !it.p[k]; if (E.types[it.type].onProp) E.types[it.type].onProp(it, k, W); } return afterChange(); }
      case 'run': W.running = !W.running; if (W.running && E.onRun) E.onRun(W); if (W.running && innerHeight < 520 && mode === 'guided' && !W.gMin) { W.gMin = true; renderGuide(); } lastT = performance.now(); return renderPanels() || paint();
      case 'reset': pushUndo(); resetDynamic(); if (E.sim) E.sim(W, 0); toast('Reset'); return afterChange();
      case 'clear': if (!W.items.length) return; pushUndo(); W.items = []; W.wires = []; W.sel = null; resetDynamic(); toast('Workbench cleared · tap Undo to bring it back'); return afterChange();
      case 'undo': if (W.undo.length) { W.redo.push(snapshot()); restore(W.undo.pop()); fitView(); afterChange(); } return;
      case 'redo': if (W.redo.length) { W.undo.push(snapshot()); restore(W.redo.pop()); fitView(); afterChange(); } return;
      case 'preset': { const p = E.presets[+b.dataset.i]; pushUndo(); W.items = []; W.wires = []; W.sel = null; resetDynamic(); p.build(W); toast(p.name + ' loaded'); fitView(); return afterChange(); }
      case 'record': E.graphs.forEach(g => g.manual && pushSample(g)); toast('Data point recorded'); tab = 'data'; return renderRight();
      case 'quiz': W.quiz[+b.dataset.q] = +b.dataset.o; return renderRight();
      case 'pred': W.pred[+b.dataset.s] = +b.dataset.o; return renderGuide();
      case 'gmin': W.gMin = !W.gMin; return renderGuide();
      case 'zin': zoomBy(1 / 1.3); return;
      case 'zout': zoomBy(1.3); return;
      case 'zfit': fitView(); return paint();
      case 'gprev': W.step = Math.max(0, W.step - 1); return renderGuide();
      case 'gnext': W.step = Math.min(E.guided.steps.length - 1, W.step + 1); return renderGuide();
      case 'gdone': mode = 'free'; applyMode(); tab = 'data'; renderRight(); return toast('Nice work! Keep experimenting in Free mode');
      case 'gsetup': pushUndo(); W.items = []; W.wires = []; W.sel = null; resetDynamic(); E.guided.setup(W); fitView(); return afterChange();
    }
  }
  function onInput(e) {
    const t = e.target; if (t.id === 'rlHyp') { W.hyp = t.value; return; } if (t.id === 'rlAddQ') return;
    if (!t.dataset || !t.dataset.k || !W) return; applyField(t, false);
  }
  function onChange(e) {
    const t = e.target; if (!t.dataset || !t.dataset.k || !W) return;
    if (t.type === 'range' && W._snap) { W.undo.push(W._snap); if (W.undo.length > 50) W.undo.shift(); W.redo = []; W._snap = null; renderBar(); return; }
    if (t.type !== 'range') { pushUndo(); applyField(t, true); }
  }
  function applyField(t, rebuild) {
    const k = t.dataset.k, id = t.dataset.id; let v = t.type === 'range' || t.type === 'number' ? parseFloat(t.value) : t.value;
    if (t.type === 'number' && isNaN(v)) return; if (t.tagName === 'SELECT' && /^-?\d+(\.\d+)?$/.test(v) && t.dataset.num !== undefined) v = parseFloat(v);
    let spec;
    if (id === '_') { spec = E.params.find(p => p.k === k); W.params[k] = (spec && (spec.type === 'select')) ? (isNaN(+v) ? v : +v) : v; if (E.onParam) E.onParam(W, k); }
    else { const it = W.get(+id); if (!it) return; const ty = E.types[it.type]; spec = (ty.props || []).find(p => p.k === k); if (spec && spec.type === 'select' && !isNaN(+v) && spec.options.every(o => typeof o[0] === 'number')) v = +v; it.p[k] = v; if (ty.onProp) ty.onProp(it, k, W); }
    const lbl = root.querySelector('#rlv-' + id + '-' + k); if (lbl && spec) lbl.textContent = fmt(v, spec.dec == null ? (spec.step < 1 ? 2 : 0) : spec.dec) + ' ' + (spec.unit || '');
    if (E.sim) E.sim(W, 0); if (E.onChange) E.onChange(W); schedulePaint(); if (rebuild || t.tagName === 'SELECT') schedulePanels(); else { liveRefresh(); }
  }
  function liveRefresh() {   // update readouts without rebuilding the controls (keeps slider focus)
    if (tab === 'data') { renderRight(); return; } renderGuide(); renderMsgs();
  }

  /* ===================== exports ===================== */
  window.RamLab = { register, open, close, util: { esc, clamp, fmt, VW, VH, ls }, experiments: EXPS, _state: () => ({ W, E, tab, mode }) };
  window.openRamLab = open;

  /* ===================== entry button on the site ===================== */
  // Clones the Games card (made by games.js) so it matches your cards and themes; falls back to a floating button.
  function makeEntry() {
    if (document.querySelector('[data-ramlab-btn]')) return true;
    const src = document.querySelector('[data-games-btn]'); if (!src) return false;
    const btn = src.cloneNode(true); btn.removeAttribute('data-games-btn'); btn.setAttribute('data-ramlab-btn', '1');
    btn.style.setProperty('--gm-accent', '#f2b705');
    const rules = document.createElement('style'); rules.textContent = '[data-ramlab-btn]::before,[data-ramlab-btn]::after{background-color:#f2b705!important;background-image:none!important}'; document.head.appendChild(rules);
    const w = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT); let t;
    while ((t = w.nextNode())) { const s = t.nodeValue.trim(); if (s === 'Games') t.nodeValue = 'RAM LAB'; else if (s === 'Play & compete') t.nodeValue = 'Virtual science lab'; else if (s === '🎮') t.nodeValue = '🔬'; }
    const go = e => { e.preventDefault(); e.stopPropagation(); open(); };
    btn.addEventListener('click', go); btn.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') go(e); });
    ['touchstart', 'touchend'].forEach(ev => btn.addEventListener(ev, e => e.stopPropagation(), { passive: true }));
    src.parentNode.insertBefore(btn, src.nextSibling); return true;
  }
  function fallbackEntry() {
    if (document.querySelector('[data-ramlab-btn]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-ramlab-btn', '1');
    b.style.cssText = 'position:fixed;right:14px;bottom:14px;z-index:9000;border:3px solid #111;border-radius:18px;background:#f2b705;color:#111;font:800 14px system-ui;padding:12px 16px;box-shadow:4px 4px 0 #111';
    b.textContent = '🔬 RAM LAB'; b.addEventListener('click', () => open()); document.body.appendChild(b);
  }
  document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('[data-ramlab-open]'); if (t) { e.preventDefault(); open(); } });
  function init() { let n = 0; (function f() { if (makeEntry()) return; if (++n < 30) setTimeout(f, 500); else fallbackEntry(); })(); }
  if (document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
