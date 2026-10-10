/* Games: a "Games" button in the access cards, a game hub, and MANTRA MATH (with leaderboard).
   Needs notes-upload.js (SUPABASE_URL / SUPABASE_KEY). Load it AFTER quiz.js. Backend: games-setup.sql
   Logo: assets/mantra-math-logo.png */
(function(){
  const GAME = 'mantra_math';
  /* ---- easy-to-tune game settings ---- */
  const CYCLE = 15;        // normal questions before every boss
  const BOSS_STEP = 5;     // boss 1 needs 5 right answers, boss 2 needs 10, boss 3 needs 15 ...
  const T_START = 11;      // seconds for the very first question
  const T_MIN = 5;         // the time never drops below this (harder question types get a few extra seconds)
  const T_DROP = 0.09;     // seconds taken off per question answered
  const LOGO = (typeof window.MANTRA_LOGO === 'string' && window.MANTRA_LOGO) || new URL('assets/mantra-math-logo.png', document.baseURI).href;

  const css = `
  #gmSheet{--gm-bg:#fff6dc;--gm-card:#fff;--gm-text:#161226;--gm-line:#111;--gm-sh:#111;--gm-sky:#ffffff;--gm-dot:rgba(17,17,17,.1);
    --gm-y:#ffd23f;--gm-p:#7c4dff;--gm-o:#ff8a1f;--gm-t:#17b8a6;--gm-g:#7ac943;--gm-k:#ff5c8a;
    position:fixed;inset:0;z-index:9700;display:none;flex-direction:column;color:var(--gm-text);background-color:var(--gm-bg);
    background-image:radial-gradient(var(--gm-dot) 1.3px,transparent 1.6px);background-size:22px 22px;overscroll-behavior:contain;touch-action:manipulation;-webkit-tap-highlight-color:transparent}
  body.dark:not([data-theme]) #gmSheet{--gm-bg:#16132b;--gm-card:#231f47;--gm-text:#f6f2ff;--gm-line:#f6f2ff;--gm-sh:#000;--gm-sky:#0f0d22;--gm-dot:rgba(255,255,255,.07)}
  #gmSheet.open{display:flex;animation:gmUp .25s ease}
  @keyframes gmUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  @keyframes gmIn{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
  .gm-in{width:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;flex:1;min-height:0}
  .gm-top{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px 10px}
  .gm-top button{flex:0 0 auto;width:40px;height:40px;border-radius:50%;border:3px solid var(--gm-line);background:var(--gm-card);color:inherit;font-size:18px;font-weight:800;cursor:pointer;box-shadow:2px 2px 0 var(--gm-sh);transition:transform .12s ease,box-shadow .12s ease}
  .gm-top button:active{transform:translate(2px,2px);box-shadow:0 0 0 var(--gm-sh)}
  .gm-title{flex:1;min-width:0}
  .gm-title b{display:block;font-size:21px;font-weight:900;line-height:1.1}
  .gm-title small{display:block;font-size:12px;font-weight:700;opacity:.7;margin-top:2px}
  .gm-body{flex:1;overflow-y:auto;padding:6px 14px calc(env(safe-area-inset-bottom,0px) + 18px);min-height:0}
  .gm-body>*{animation:gmIn .3s ease both}
  .gm-body.gm-play{padding:0;overflow:hidden;display:flex;flex-direction:column}
  .gm-body.gm-play>*{animation:none}
  .gm-card{display:flex;align-items:center;gap:14px;padding:14px;margin-bottom:14px;border-radius:22px;background:var(--gm-card);border:3px solid var(--gm-line);box-shadow:5px 5px 0 var(--gm-sh)}
  .gm-game{cursor:pointer;transition:transform .15s ease,box-shadow .15s ease}
  .gm-game:active{transform:translate(4px,4px);box-shadow:1px 1px 0 var(--gm-sh)}
  .gm-glogo{flex:0 0 auto;width:78px;height:78px;border-radius:50%;border:3px solid var(--gm-line);background:#fff;object-fit:cover}
  .gm-glogo.missing,.gm-biglogo.missing{display:none}
  .gm-ginfo{flex:1;min-width:0}
  .gm-ginfo b{display:block;font-size:19px}
  .gm-ginfo p{margin:3px 0 7px;font-size:12.5px;line-height:1.4;opacity:.8}
  .gm-pill{display:inline-block;font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:999px;background:var(--gm-y);color:#111;border:2px solid var(--gm-line)}
  .gm-arrow{flex:0 0 auto;width:38px;height:38px;border-radius:50%;display:grid;place-items:center;background:var(--gm-p);color:#fff;font-weight:900;border:3px solid var(--gm-line)}
  .gm-soon{justify-content:center;text-align:center;border-style:dashed;box-shadow:none;font-weight:800;opacity:.75}
  .gm-btn{display:block;width:100%;box-sizing:border-box;border:3px solid var(--gm-line);padding:14px;border-radius:16px;font:inherit;font-weight:900;font-size:16px;color:#111;cursor:pointer;background:var(--gm-y);box-shadow:4px 4px 0 var(--gm-sh);transition:transform .12s ease,box-shadow .12s ease}
  .gm-btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--gm-sh)}
  .gm-btn.alt{background:var(--gm-card);color:inherit;margin-top:12px}
  .gm-btn.purple{background:var(--gm-p);color:#fff}
  .gm-box{padding:16px;border-radius:20px;background:var(--gm-card);border:3px solid var(--gm-line);box-shadow:4px 4px 0 var(--gm-sh);margin-bottom:14px}
  .gm-box h3{margin:0 0 8px;font-size:17px}
  .gm-box p{margin:0 0 10px;font-size:13px;line-height:1.5;opacity:.85}
  .gm-box input,.gm-box select{width:100%;box-sizing:border-box;margin-bottom:10px;padding:12px;border-radius:14px;border:3px solid var(--gm-line);background:var(--gm-bg);color:inherit;font:inherit;font-size:15px}
  .gm-how{margin:0;padding:0;list-style:none;font-size:13px;line-height:1.45}
  .gm-how li{padding:6px 0 6px 28px;position:relative}
  .gm-how li::before{content:attr(data-e);position:absolute;left:0;top:5px}
  .gm-center{text-align:center}
  .gm-biglogo{display:block;width:150px;height:150px;margin:2px auto 10px;border-radius:50%;border:3px solid var(--gm-line);background:#fff;object-fit:cover;box-shadow:5px 5px 0 var(--gm-sh)}
  .gm-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
  .gm-stats div{padding:11px 4px;border-radius:16px;background:var(--gm-card);border:3px solid var(--gm-line);text-align:center;font-size:11.5px;font-weight:800}
  .gm-stats b{display:block;font-size:21px}
  .gm-err{color:#ef4444;font-weight:800;font-size:13px;margin-top:8px}
  .gm-note{font-size:11.5px;opacity:.65;text-align:center;margin-top:10px;line-height:1.4}
  .gm-link{display:inline-block;margin-top:6px;font-size:12.5px;font-weight:800;text-decoration:underline;cursor:pointer;opacity:.85}
  .gm-final{text-align:center;margin:6px 0 4px}
  .gm-final b{display:block;font-size:56px;line-height:1;color:var(--gm-o);-webkit-text-stroke:2px var(--gm-line);paint-order:stroke fill}
  .gm-final span{font-weight:800;opacity:.75}
  .gm-newbest{margin:8px 0;padding:10px;border-radius:14px;text-align:center;font-weight:900;background:var(--gm-g);color:#111;border:3px solid var(--gm-line);animation:gmPop 1s ease infinite}
  @keyframes gmPop{0%,100%{transform:scale(1)}50%{transform:scale(1.04)}}
  .gm-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 12px;scrollbar-width:none}
  .gm-chips button{flex:0 0 auto;border:3px solid var(--gm-line);background:var(--gm-card);color:inherit;font:inherit;font-weight:800;font-size:13px;padding:6px 13px;border-radius:999px;cursor:pointer}
  .gm-chips button.on{background:var(--gm-y);color:#111}
  .gm-row{display:flex;align-items:center;gap:10px;padding:10px 12px;margin-bottom:9px;border-radius:16px;background:var(--gm-card);border:3px solid var(--gm-line)}
  .gm-row.me{background:var(--gm-y);color:#111}
  .gm-rk{flex:0 0 34px;text-align:center;font-weight:900;font-size:17px}
  .gm-nm{flex:1;min-width:0;font-weight:800;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .gm-nm small{display:block;font-weight:700;opacity:.65;font-size:11px}
  .gm-sc{font-weight:900;font-size:17px;white-space:nowrap}
  .gm-load{text-align:center;padding:50px 10px;font-weight:800}

  /* ----- the game screen ----- */
  .gm-hud{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:2px 14px 6px;font-weight:900;font-size:14px}
  .gm-hud .gm-score b{font-size:20px}
  .gm-wave{padding:3px 11px;border-radius:999px;background:var(--gm-p);color:#fff;border:2.5px solid var(--gm-line);font-size:12px}
  .gm-wave.boss{background:var(--gm-k);animation:gmPop .7s ease infinite}
  .gm-bossin{font-size:12px;opacity:.85}
  .gm-tbar{margin:0 14px 8px;height:12px;border-radius:999px;border:3px solid var(--gm-line);background:var(--gm-card);overflow:hidden}
  .gm-tbar i{display:block;height:100%;width:100%;background:var(--gm-g);transform-origin:left}
  .gm-tbar.low i{background:var(--gm-k)}
  .gm-hp{display:none;margin:0 14px 8px;font-size:12px;font-weight:900}
  .gm-hp.on{display:block}
  .gm-hp .bar{margin-top:3px;height:14px;border-radius:999px;border:3px solid var(--gm-line);background:var(--gm-card);overflow:hidden}
  .gm-hp .bar i{display:block;height:100%;background:var(--gm-k);transition:width .3s ease}
  .gm-sky{position:relative;flex:1;min-height:170px;margin:0 14px;border:3px solid var(--gm-line);border-radius:22px;background:var(--gm-sky);overflow:hidden;box-shadow:4px 4px 0 var(--gm-sh)}
  .gm-sky::before{content:"\\2726   \\2726      \\2726  \\2726";position:absolute;inset:8px 14px auto;display:flex;justify-content:space-between;color:var(--gm-y);font-size:14px;opacity:.9;pointer-events:none}
  .gm-sky.shake{animation:gmShake .45s ease}
  @keyframes gmShake{0%,100%{transform:none}20%{transform:translate(-6px,3px)}40%{transform:translate(6px,-3px)}60%{transform:translate(-4px,2px)}80%{transform:translate(4px,-2px)}}
  .gm-ship{--dome:#9be7ff;--hull:#ffd23f;--band:#ff5c8a;position:absolute;left:50%;top:0;width:92px;z-index:2;will-change:transform}
  .gm-ship.boss{--dome:#ff9aa8;--hull:#b79bff;--band:#ffd23f;width:150px}
  .gm-ship .in{animation:gmSway 2.4s ease-in-out infinite}
  .gm-ship svg{display:block;width:100%;height:auto;overflow:visible}
  .gm-ship.boss .in{animation:gmSway 1.6s ease-in-out infinite}
  @keyframes gmSway{0%,100%{transform:translateX(-12px) rotate(-3deg)}50%{transform:translateX(12px) rotate(3deg)}}
  .gm-beam{position:absolute;top:70%;left:50%;width:70%;height:700px;transform:translateX(-50%);background:linear-gradient(rgba(255,210,63,.45),rgba(255,210,63,0));clip-path:polygon(32% 0,68% 0,100% 100%,0 100%);pointer-events:none;z-index:-1}
  .gm-ship.hit .in{animation:gmFlash .3s steps(2) 2}
  @keyframes gmFlash{50%{filter:brightness(2.4) saturate(.2)}}
  .gm-ship.dead{animation:gmDead .45s ease forwards}
  @keyframes gmDead{to{opacity:0;transform:translate(var(--tx,-50%),var(--ty,0)) scale(.2) rotate(40deg)}}
  .gm-ship.crash .in{animation:none}
  .gm-boom{position:absolute;z-index:4;font-size:44px;transform:translate(-50%,-50%);animation:gmBoom .7s ease forwards;pointer-events:none}
  .gm-boom.big{font-size:84px}
  @keyframes gmBoom{0%{transform:translate(-50%,-50%) scale(.3);opacity:1}100%{transform:translate(-50%,-50%) scale(1.5);opacity:0}}
  .gm-laser{position:absolute;left:50%;bottom:50px;width:12px;height:0;margin-left:-6px;border:3px solid var(--gm-line);border-bottom:0;border-radius:8px 8px 0 0;background:#2fd9ff;opacity:0;z-index:1;pointer-events:none}
  .gm-laser.on{animation:gmLaser .28s ease-out}
  @keyframes gmLaser{0%{opacity:1}100%{opacity:0}}
  .gm-base{position:absolute;left:50%;bottom:-6px;transform:translateX(-50%);width:min(340px,92%);height:58px;border:3px solid var(--gm-line);border-radius:999px 999px 0 0;background:var(--gm-t);display:grid;place-items:center;z-index:3}
  .gm-base span{font-size:27px;margin-top:-2px;filter:drop-shadow(0 1px 0 rgba(255,255,255,.5))}
  .gm-banner{position:absolute;left:50%;top:36%;z-index:6;transform:translate(-50%,-50%) rotate(-2deg) scale(.6);opacity:0;min-width:70%;text-align:center;padding:10px 14px;background:var(--gm-y);color:#111;border:3px solid var(--gm-line);box-shadow:4px 4px 0 var(--gm-sh);pointer-events:none}
  .gm-banner b{display:block;font-size:19px;font-weight:900}
  .gm-banner small{display:block;font-size:12px;font-weight:800;margin-top:2px}
  .gm-banner.show{animation:gmBanner 1.7s ease both}
  @keyframes gmBanner{0%{opacity:0;transform:translate(-50%,-50%) rotate(-2deg) scale(.6)}12%,82%{opacity:1;transform:translate(-50%,-50%) rotate(-2deg) scale(1)}100%{opacity:0;transform:translate(-50%,-50%) rotate(-2deg) scale(1)}}
  .gm-banner.stay{animation:gmBannerStay .3s ease both}
  @keyframes gmBannerStay{from{opacity:0;transform:translate(-50%,-50%) rotate(-2deg) scale(.6)}to{opacity:1;transform:translate(-50%,-50%) rotate(-2deg) scale(1)}}
  .gm-q{padding:12px 14px 8px;text-align:center;font-size:clamp(23px,7vw,32px);font-weight:900;line-height:1.2;min-height:2.6em;display:grid;place-items:center}
  .gm-opts{display:grid;grid-template-columns:1fr 1fr;gap:10px;padding:0 14px calc(env(safe-area-inset-bottom,0px) + 14px)}
  .gm-opt{min-height:62px;border:3px solid var(--gm-line);border-radius:18px;background:var(--gm-card);color:inherit;font:inherit;font-size:clamp(20px,6vw,26px);font-weight:900;cursor:pointer;box-shadow:4px 4px 0 var(--gm-sh);transition:transform .1s ease,box-shadow .1s ease,background .15s ease}
  .gm-opt:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--gm-sh)}
  .gm-opt.ok{background:var(--gm-g);color:#111}
  .gm-opt.bad{background:var(--gm-k);color:#111}
  .gm-opt:disabled{cursor:default}
  @media(max-height:620px){.gm-q{padding:6px 14px 4px;min-height:2.2em}.gm-opt{min-height:52px}.gm-sky{min-height:130px}}
  @media(prefers-reduced-motion:reduce){.gm-ship .in,.gm-ship.boss .in,.gm-newbest,.gm-wave.boss{animation:none}.gm-body>*,#gmSheet.open{animation:none}}

  /* the cloned "Games" card inherits your card style; this is only for the fallback button */
  .gm-fallback{display:flex;align-items:center;gap:12px;width:calc(100% - 28px);box-sizing:border-box;margin:14px;padding:14px;border-radius:20px;border:3px solid #111;background:#ffd23f;color:#111;font:inherit;font-weight:900;font-size:16px;cursor:pointer;box-shadow:5px 5px 0 #111;text-align:left}
  .gm-fallback small{display:block;font-weight:700;opacity:.75;font-size:12.5px}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ----- helpers -----
  const ls = (k, v) => { try{ if(v === undefined) return localStorage.getItem(k); if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} return null; };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ri = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
  const pick = a => a[Math.floor(Math.random() * a.length)];
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  const logoImg = cls => '<img class="' + cls + '" src="' + esc(LOGO) + '" alt="Mantra Math logo" width="150" height="150" decoding="async">';
  let myKey = ls('dqKey');   // same id the quiz uses, so one student = one identity
  if(!myKey){ myKey = 'q' + Math.random().toString(36).slice(2) + Date.now().toString(36); ls('dqKey', myKey); }
  const profile = () => ({name: (ls('mbName') || ls('chatName') || '').trim(), cls: ls('mbCls') || ''});
  const hasProfile = () => { const p = profile(); return p.name.length >= 2 && /^(8|9|10|11|12)$/.test(p.cls); };
  const ERR = {slow_down:'Please wait a few seconds before saving again.', bad_score:'That score could not be verified.', bad_input:'Please check your name and class.', bad_game:'This game is not set up yet.'};

  async function rpc(fn, body, all){
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {method:'POST', headers:{apikey:SUPABASE_KEY, 'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const d = await r.json().catch(() => null);
    if(!r.ok) throw new Error((d && d.message) || 'error');
    return all ? (d || []) : (Array.isArray(d) ? d[0] : d);
  }

  // ===================== MANTRA MATH: questions =====================
  // normal questions: [first wave they can appear in, builder(level) -> {t:text, a:answer, w:extra seconds}]
  const NORMAL = [
    [0, l => { const m = 10 + l * 10, a = ri(1, m), b = ri(1, m); return {t:`${a} + ${b} = ?`, a:a + b, w:0}; }],
    [0, l => { const m = 20 + l * 15, a = ri(5, m), b = ri(1, a); return {t:`${a} − ${b} = ?`, a:a - b, w:0}; }],
    [1, l => { const m = Math.min(12, 4 + l), a = ri(2, m), b = ri(2, m); return {t:`${a} × ${b} = ?`, a:a * b, w:1}; }],
    [3, l => { const m = Math.min(12, l + 4), b = ri(2, m), c = ri(2, m); return {t:`${b * c} ÷ ${b} = ?`, a:c, w:1}; }],
    [4, l => { const x = ri(2, 20), a = ri(3, 40); return {t:`x + ${a} = ${x + a}, x = ?`, a:x, w:1}; }],
    [4, l => { const n = ri(3, Math.min(15, l + 8)); return {t:`${n}² = ?`, a:n * n, w:1}; }],
    [5, l => { const a = ri(11, 25), b = ri(3, 9); return {t:`${a} × ${b} = ?`, a:a * b, w:2}; }],
    [5, l => { const p = pick([10, 25, 50]), base = p === 10 ? 10 * ri(2, 30) : p === 25 ? 4 * ri(3, 40) : 2 * ri(5, 60); return {t:`${p}% of ${base} = ?`, a:base * p / 100, w:2}; }],
    [6, l => { const a = ri(2, 9), b = ri(2, 9), c = ri(2, 9); return {t:`${a} + ${b} × ${c} = ?`, a:a + b * c, w:2}; }],
    [6, l => { const x = ri(2, 12), a = ri(2, 6), b = ri(1, 20); return {t:`${a}x + ${b} = ${a * x + b}, x = ?`, a:x, w:2}; }],
    [7, l => { const n = ri(2, Math.min(20, l + 8)); return {t:`√${n * n} = ?`, a:n, w:1}; }],
    [7, l => { const a = ri(12, 99), b = ri(12, 99); return {t:`${a} + ${b} = ?`, a:a + b, w:1}; }],
    [8, l => { const n = ri(2, 9); return {t:`${n}³ = ?`, a:n * n * n, w:2}; }],
    [8, l => { const a = ri(2, 12), b = ri(2, 12), c = ri(2, 9); return {t:`(${a} + ${b}) × ${c} = ?`, a:(a + b) * c, w:3}; }]
  ];
  // boss questions: always hard; s grows with each boss
  const BOSS = [
    s => { const a = ri(12 + s * 3, 40 + s * 8), b = ri(11, 19); return {t:`${a} × ${b} = ?`, a:a * b, w:5}; },
    s => { const x = ri(5, 25), a = ri(3, 9), plus = Math.random() < .5, b = plus ? ri(5, 60) : ri(1, a * x - 1); return {t:`${a}x ${plus ? '+' : '−'} ${b} = ${plus ? a * x + b : a * x - b}, x = ?`, a:x, w:4}; },
    s => { const a = ri(4, 15), b = ri(4, 15), c = ri(3, 9), d = ri(1, Math.min(40, (a + b) * c - 1)); return {t:`(${a} + ${b}) × ${c} − ${d} = ?`, a:(a + b) * c - d, w:5}; },
    s => { const n = ri(13, 22 + s * 2); return {t:`${n}² = ?`, a:n * n, w:3}; },
    s => { const n = ri(4, 9 + Math.min(s, 3)); return {t:`${n}³ = ?`, a:n * n * n, w:3}; },
    s => { const p = pick([15, 20, 35, 40, 60, 75, 80]), k = ri(5, 40 + s * 4); return {t:`${p}% of ${20 * k} = ?`, a:p * k / 5, w:4}; },
    s => { const a = ri(12, 30), b = ri(5, a - 3); return {t:`${a}² − ${b}² = ?`, a:a * a - b * b, w:5}; },
    s => { const d = ri(6, 19), q = ri(12, 40 + s * 5), r = ri(1, d - 1); return {t:`${d * q + r} ÷ ${d}, remainder = ?`, a:r, w:4}; },
    s => { const n = ri(6, 10 + Math.min(s, 3)); return {t:`2^${n} = ?`, a:Math.pow(2, n), w:3}; },
    s => { const g = ri(2, 12); let a = ri(2, 9), b = ri(2, 9); if(a === b) b = a === 9 ? 8 : a + 1; return {t:`HCF of ${g * a} and ${g * b} = ?`, a:gcd(g * a, g * b), w:4}; }
  ];
  let lastText = '';
  function normalQ(lvl){
    const l = Math.min(lvl, 10), pool = NORMAL.filter(p => p[0] <= lvl);
    let q;
    for(let i = 0; i < 6; i++){
      const p = Math.random() < .6 ? pick(pool.slice(-5)) : pick(pool);   // newer skills show up more often
      q = p[1](l); if(q.t !== lastText) break;
    }
    lastText = q.t; return q;
  }
  function bossQ(no){ const s = Math.min(no, 8); let q; for(let i = 0; i < 6; i++){ q = pick(BOSS)(s); if(q.t !== lastText) break; } lastText = q.t; return q; }
  function makeOptions(a){
    const c = new Set(), add = v => { if(v >= 0 && v !== a) c.add(v); };
    [a + 1, a - 1, a + 2, a - 2, a + 10, a - 10, a + ri(3, 9), a - ri(3, 9)].forEach(add);
    for(let k = 3; c.size < 3; k++) add(a + k);
    return shuffle([a].concat(shuffle([...c]).slice(0, 3)));
  }

  // ===================== state =====================
  let sheet, el = {}, view = 'hub', errMsg = '', boardCls = 'all', board = null, me = null, g = null, raf = 0, seq = 0, opened = false;
  const bestLocal = () => Number(ls('mmBest') || 0);
  const myBest = () => Math.max(me ? me.best : 0, bestLocal());

  async function loadMe(){
    try{ const r = await rpc('game_me', {p_key:myKey, p_game:GAME}); me = {best:r.my_best || 0, bosses:r.my_bosses || 0, questions:r.my_questions || 0, rank:r.my_rank || 0, plays:r.my_plays || 0}; }catch(e){}
    if(opened && (view === 'hub' || view === 'mm')) render();
  }

  // ===================== screens =====================
  const TITLES = {hub:['Games', 'Play, learn and climb the leaderboard'], profile:['Who\'s playing?', ''], mm:['Mantra Math', 'Fast maths vs alien ships'], play:['Mantra Math', ''], over:['Game over', ''], board:['Leaderboard', 'Mantra Math']};
  function render(){
    const t = TITLES[view] || TITLES.hub;
    const body = ({hub:hubHTML, profile:profileHTML, mm:mmHTML, play:playHTML, over:overHTML, board:boardHTML}[view] || hubHTML)();
    sheet.innerHTML = `<div class="gm-in"><div class="gm-top">${view === 'hub' || view === 'play' ? '' : '<button data-a="back" aria-label="Back">‹</button>'}<div class="gm-title"><b>${esc(t[0])}</b>${t[1] ? '<small>' + esc(t[1]) + '</small>' : ''}</div><button data-a="close" aria-label="${view === 'play' ? 'Quit game' : 'Close'}">✕</button></div><div class="gm-body gm-${view}">${body}</div></div>`;
    if(view === 'play') cacheEls();
  }
  function hubHTML(){
    const best = myBest();
    return `<div class="gm-card gm-game" data-a="open-mm" role="button" tabindex="0">${logoImg('gm-glogo')}
        <div class="gm-ginfo"><b>Mantra Math</b><p>Zap alien ships with quick maths. Beat the bosses!</p>${best ? '<span class="gm-pill">🏆 Best: ' + best + '</span>' : '<span class="gm-pill">NEW</span>'}</div><div class="gm-arrow">▶</div></div>
      <div class="gm-card gm-soon">✨ More games coming soon…</div>`;
  }
  function profileHTML(){
    const p = profile();
    return `<div class="gm-box"><h3>Tell us who is playing 🙏</h3><p>Your name and class show on the leaderboard. Use your first name and last initial.</p>
      <input id="gmName" type="text" maxlength="40" placeholder="Your name (e.g. Aarav S.)" value="${esc(p.name)}" autocomplete="off">
      <select id="gmCls"><option value="">Select your class</option>${[8, 9, 10, 11, 12].map(c => '<option' + (String(c) === p.cls ? ' selected' : '') + '>' + c + '</option>').join('')}</select>
      <button class="gm-btn" data-a="save-profile">Save and continue</button><div class="gm-err">${esc(errMsg)}</div></div>`;
  }
  function mmHTML(){
    const p = profile(), best = myBest();
    return `<div class="gm-center">${logoImg('gm-biglogo')}</div>
      <div class="gm-stats"><div><b>${best || '–'}</b>best score</div><div><b>${me && me.rank ? '#' + me.rank : '–'}</b>rank</div><div><b>${me && me.best ? me.bosses : '–'}</b>bosses beaten</div></div>
      <button class="gm-btn" data-a="play">▶ Play</button>
      <button class="gm-btn alt" data-a="board">🏆 Leaderboard</button>
      <div class="gm-box" style="margin-top:16px"><h3>How to play</h3><ul class="gm-how">
        <li data-e="🛸">An alien ship is coming down. Tap the right answer before it lands!</li>
        <li data-e="💥">A wrong answer or running out of time ends the game.</li>
        <li data-e="👾">After every ${CYCLE} ships a hard BOSS appears. Beat it with ${BOSS_STEP} right answers. The next boss needs ${BOSS_STEP * 2}, then ${BOSS_STEP * 3}…</li>
        <li data-e="⏱️">The longer you survive, the harder and faster it gets.</li></ul></div>
      <div class="gm-note">Playing as <b>${esc(p.name)}</b> · Class ${esc(p.cls)} <span class="gm-link" data-a="edit-profile">change</span></div>`;
  }
  function playHTML(){
    const ship = `<svg viewBox="0 0 120 80" aria-hidden="true"><path d="M30 48C30 8 90 8 90 48Z" fill="var(--dome)" stroke="#111" stroke-width="4" stroke-linejoin="round"/><circle cx="60" cy="33" r="12" fill="#7ac943" stroke="#111" stroke-width="3"/><ellipse cx="55" cy="33" rx="2.6" ry="4.2" fill="#111"/><ellipse cx="65" cy="33" rx="2.6" ry="4.2" fill="#111"/><path d="M52 24L49 17M68 24L71 17" stroke="#111" stroke-width="3" stroke-linecap="round"/><ellipse cx="60" cy="54" rx="56" ry="16" fill="var(--hull)" stroke="#111" stroke-width="4"/><path d="M10 52Q60 70 110 52" fill="none" stroke="var(--band)" stroke-width="7" stroke-linecap="round"/><g fill="#3ac7ff" stroke="#111" stroke-width="2.5"><circle cx="28" cy="64" r="4.2"/><circle cx="48" cy="69" r="4.2"/><circle cx="72" cy="69" r="4.2"/><circle cx="92" cy="64" r="4.2"/></g></svg>`;
    return `<div class="gm-hud"><div class="gm-score">⭐ <b id="gmScore">0</b></div><div class="gm-wave" id="gmWave">Wave 1</div><div class="gm-bossin" id="gmBossIn">👾 Boss in ${CYCLE}</div></div>
      <div class="gm-tbar" id="gmTime"><i></i></div>
      <div class="gm-hp" id="gmHp"><span id="gmHpTxt"></span><div class="bar"><i></i></div></div>
      <div class="gm-sky" id="gmSky"><div class="gm-laser" id="gmLaser"></div>
        <div class="gm-ship" id="gmShip"><div class="gm-beam"></div><div class="in">${ship}</div></div>
        <div class="gm-banner" id="gmBanner"></div><div class="gm-base"><span>🕉️</span></div></div>
      <div class="gm-q" id="gmQ">Get ready…</div><div class="gm-opts" id="gmOpts"></div>`;
  }
  function overHTML(){
    const why = {time:'⏰ Time ran out. The ship landed!', wrong:'❌ Wrong answer!', quit:'You left the game.'}[g.why] || '';
    const rank = g.rank ? '#' + g.rank : me && me.rank ? '#' + me.rank : '–';
    return `<div class="gm-final"><b>${g.score}</b><span>points</span></div><div class="gm-center" style="font-weight:800;opacity:.8">${why}</div>
      <div class="gm-stats"><div><b>${g.q}</b>correct</div><div><b>${g.bosses}</b>bosses beaten</div><div><b>${rank}</b>rank</div></div>
      ${g.newBest ? '<div class="gm-newbest">🏆 New personal best!</div>' : ''}
      <div class="gm-note" style="margin:0 0 12px">${g.saving ? 'Saving your score…' : g.saveErr ? esc(g.saveErr) : g.score <= 0 ? '' : g.saved ? 'Score saved to the leaderboard ✅' : 'Your best score is ' + myBest()}</div>
      <button class="gm-btn" data-a="play">▶ Play again</button>
      <button class="gm-btn alt" data-a="board">🏆 Leaderboard</button>
      <button class="gm-btn alt" data-a="hub">All games</button>`;
  }
  function boardHTML(){
    const chips = ['all', '8', '9', '10', '11', '12'].map(c => '<button data-a="bcls" data-c="' + c + '" class="' + (boardCls === c ? 'on' : '') + '">' + (c === 'all' ? 'All classes' : 'Class ' + c) + '</button>').join('');
    let list;
    if(board === null) list = '<div class="gm-load">⏳ Loading…</div>';
    else if(board === 'err') list = '<div class="gm-err">Could not load the leaderboard. Please try again.</div>';
    else if(!board.length) list = '<div class="gm-box"><p style="margin:0;text-align:center">Nobody here yet. Be the first! 🛸</p></div>';
    else { const p = profile(); list = board.map((r, i) => {
      const you = r.name === p.name && String(r.cls) === p.cls;
      return '<div class="gm-row' + (you ? ' me' : '') + '"><div class="gm-rk">' + (['🥇', '🥈', '🥉'][i] || '#' + (i + 1)) + '</div><div class="gm-nm">' + esc(r.name) + (you ? ' (you)' : '') + '<small>Class ' + esc(r.cls) + ' · ' + r.best_bosses + ' boss' + (r.best_bosses === 1 ? '' : 'es') + ' · ' + r.best_questions + ' correct</small></div><div class="gm-sc">' + r.best_score + '</div></div>'; }).join(''); }
    return '<div class="gm-chips">' + chips + '</div>' + list + '<div class="gm-note">Top 20 by best score. Beat the bosses to climb!</div>';
  }
  async function loadBoard(){
    view = 'board'; board = null; render();
    try{ board = await rpc('game_top', {p_game:GAME, p_cls:boardCls}, true); }catch(e){ board = 'err'; }
    if(view === 'board') render();
  }

  // ===================== the game =====================
  function cacheEls(){
    ['Score', 'Wave', 'BossIn', 'Time', 'Hp', 'HpTxt', 'Sky', 'Laser', 'Ship', 'Banner', 'Q', 'Opts'].forEach(k => { el[k] = sheet.querySelector('#gm' + k); });
  }
  function startGame(){
    cancelAnimationFrame(raf);
    g = {id:++seq, score:0, q:0, n:0, cyc:0, bosses:0, boss:null, cur:null, limit:10, left:10, locked:true, over:false, y:0, t0:Date.now(), last:0};
    view = 'play'; errMsg = ''; lastText = ''; render(); hud();
    later(next, 700);
  }
  function later(fn, ms){ const id = g.id; setTimeout(() => { if(g && g.id === id && !g.over) fn(); }, ms); }
  function hud(){
    el.Score.textContent = g.score;
    const boss = !!g.boss;
    el.Wave.textContent = boss ? '⚠️ BOSS ' + g.boss.no : 'Wave ' + (Math.floor(g.n / 5) + 1); el.Wave.classList.toggle('boss', boss);
    el.BossIn.style.display = boss ? 'none' : ''; el.BossIn.textContent = '👾 Boss in ' + (CYCLE - g.cyc);
    el.Hp.classList.toggle('on', boss);
    if(boss){ el.HpTxt.textContent = 'BOSS ' + g.boss.no + ' · ' + g.boss.hp + ' / ' + g.boss.need + ' hits left'; el.Hp.querySelector('.bar i').style.width = (g.boss.hp / g.boss.need * 100) + '%'; }
  }
  function banner(text, sub, stay){
    el.Banner.innerHTML = '<b>' + esc(text) + '</b>' + (sub ? '<small>' + esc(sub) + '</small>' : '');
    el.Banner.className = 'gm-banner'; void el.Banner.offsetWidth; el.Banner.classList.add(stay ? 'stay' : 'show');
  }
  function rest(){ el.Q.textContent = 'Get ready…'; el.Opts.style.visibility = 'hidden'; }
  function travel(){ return Math.max(0, el.Sky.clientHeight - el.Ship.offsetHeight - 44); }
  function place(p){ g.y = p * travel(); el.Ship.style.transform = 'translate3d(-50%,' + g.y + 'px,0)'; }
  function next(){
    if(!g.boss && g.cyc >= CYCLE){
      const no = g.bosses + 1; g.boss = {no, need:BOSS_STEP * no, hp:BOSS_STEP * no}; g.cyc = 0;
      el.Ship.className = 'gm-ship boss'; place(0); hud(); rest();
      banner('⚠️ BOSS ' + no + ' INCOMING!', 'Answer ' + g.boss.need + ' correctly to defeat it');
      return later(ask, 1900);
    }
    ask();
  }
  function ask(){
    const boss = !!g.boss;
    const q = boss ? bossQ(g.boss.no) : normalQ(Math.floor(g.n / 5));
    q.opts = makeOptions(q.a); g.cur = q; el.Opts.style.visibility = '';
    g.limit = boss ? Math.max(12, 18 - g.boss.no * .5) + q.w : Math.max(T_MIN, T_START - T_DROP * g.n) + q.w;
    g.left = g.limit; g.locked = false; g.last = performance.now();
    el.Ship.className = 'gm-ship' + (boss ? ' boss' : ''); place(0);
    el.Q.textContent = q.t;
    el.Opts.innerHTML = q.opts.map((o, i) => '<button class="gm-opt" data-a="opt" data-i="' + i + '">' + o + '</button>').join('');
    el.Time.classList.remove('low'); el.Time.firstChild.style.transform = 'scaleX(1)';
    hud(); raf = requestAnimationFrame(tick);
  }
  function tick(now){
    if(!g || g.over || g.locked) return;
    const dt = Math.min(100, now - g.last); g.last = now;
    g.left -= dt / 1000;
    const f = Math.max(0, g.left / g.limit);
    place(1 - f); el.Time.firstChild.style.transform = 'scaleX(' + f + ')'; el.Time.classList.toggle('low', f < .3);
    if(g.left <= 0) return lose('time');
    raf = requestAnimationFrame(tick);
  }
  function mark(correctIdx, badIdx){
    el.Opts.querySelectorAll('.gm-opt').forEach((b, i) => { b.disabled = true; if(i === correctIdx) b.classList.add('ok'); else if(i === badIdx) b.classList.add('bad'); });
  }
  function zap(){
    const sy = g.y + el.Ship.offsetHeight / 2;
    el.Laser.style.height = Math.max(0, el.Sky.clientHeight - 50 - sy) + 'px';
    el.Laser.classList.remove('on'); void el.Laser.offsetWidth; el.Laser.classList.add('on');
  }
  function boom(big){
    const b = document.createElement('span'); b.className = 'gm-boom' + (big ? ' big' : ''); b.textContent = '💥';
    b.style.left = '50%'; b.style.top = (g.y + el.Ship.offsetHeight / 2) + 'px'; el.Sky.appendChild(b); setTimeout(() => b.remove(), 800);
  }
  function answer(i){
    if(!g || g.locked || g.over) return;
    g.locked = true; cancelAnimationFrame(raf);
    const q = g.cur, ci = q.opts.indexOf(q.a), ok = q.opts[i] === q.a;
    mark(ci, ok ? -1 : i);
    if(!ok) return lose('wrong');
    const bonus = Math.round(10 * Math.max(0, g.left) / g.limit);
    g.q++; zap();
    if(g.boss){
      g.score += 25 + bonus; g.boss.hp--;
      if(g.boss.hp <= 0){
        const no = g.boss.no, prize = 50 * no;
        g.score += prize; g.bosses = no; g.boss = null; g.cyc = 0;
        el.Ship.style.setProperty('--tx', '-50%'); el.Ship.style.setProperty('--ty', g.y + 'px'); el.Ship.classList.add('dead'); boom(true);
        hud(); rest(); banner('🎉 BOSS ' + no + ' DEFEATED!', '+' + prize + ' bonus points');
        return later(next, 1900);
      }
      el.Ship.classList.add('hit'); boom(false); hud(); return later(ask, 550);
    }
    g.score += 10 + bonus; g.n++; g.cyc++;
    el.Ship.style.setProperty('--tx', '-50%'); el.Ship.style.setProperty('--ty', g.y + 'px'); el.Ship.classList.add('dead'); boom(false);
    hud(); later(next, 500);
  }
  function lose(why){
    g.over = true; g.why = why; g.locked = true; cancelAnimationFrame(raf);
    if(why === 'time'){ mark(g.cur.opts.indexOf(g.cur.a), -1); }
    place(1); el.Ship.classList.add('crash'); el.Sky.classList.add('shake'); boom(true);
    banner('💥 GAME OVER', why === 'time' ? 'The ship landed!' : 'Wrong answer!', true);
    try{ if(navigator.vibrate) navigator.vibrate(200); }catch(e){}
    const id = g.id; setTimeout(() => { if(g && g.id === id) endGame(); }, 1700);
  }
  function quit(){ if(!g || g.over) return; g.over = true; g.why = 'quit'; g.locked = true; cancelAnimationFrame(raf); endGame(); }
  async function endGame(){
    view = 'over'; g.saving = false; g.saved = false; g.saveErr = ''; g.newBest = false;
    const fresh = g.score > myBest();
    if(g.score > bestLocal()) ls('mmBest', String(g.score));
    if(g.score > 0 && fresh && hasProfile()){ g.saving = true; }
    render();
    if(!g.saving) return;
    const gid = g.id, p = profile();
    try{
      const r = await rpc('game_submit', {p_key:myKey, p_game:GAME, p_name:p.name, p_cls:p.cls, p_score:g.score, p_questions:g.q, p_bosses:g.bosses, p_secs:Math.round((Date.now() - g.t0) / 1000)});
      me = {best:r.r_best, bosses:r.r_best_bosses, questions:r.r_best_questions, rank:r.r_rank, plays:(me ? me.plays : 0) + 1};
      if(g && g.id === gid){ g.saved = true; g.newBest = !!r.r_new_best; g.rank = r.r_rank; }
    }catch(e){ if(g && g.id === gid) g.saveErr = ERR[String(e.message).trim()] || 'Could not save your score. Check your internet connection.'; }
    if(g && g.id === gid){ g.saving = false; if(view === 'over') render(); }
  }

  // ===================== opening / clicks =====================
  function openSheet(){
    opened = true; sheet.classList.add('open'); document.body.style.overflow = 'hidden';
    view = 'hub'; errMsg = ''; render(); loadMe();
  }
  function closeSheet(){ opened = false; sheet.classList.remove('open'); document.body.style.overflow = ''; cancelAnimationFrame(raf); if(g && !g.over){ g.over = true; } }
  function goMM(){ if(!hasProfile()){ errMsg = ''; view = 'profile'; return render(); } view = 'mm'; render(); loadMe(); }
  function onClick(e){
    const b = e.target.closest('[data-a]'); if(!b) return;
    const a = b.dataset.a;
    if(a === 'close') return view === 'play' ? quit() : closeSheet();
    if(a === 'back') return view === 'board' ? goMM() : view === 'over' ? goMM() : (view = 'hub', render());
    if(a === 'hub'){ view = 'hub'; return render(); }
    if(a === 'open-mm') return goMM();
    if(a === 'edit-profile'){ view = 'profile'; return render(); }
    if(a === 'save-profile'){
      const nm = sheet.querySelector('#gmName').value.replace(/[<>@]/g, '').replace(/\s+/g, ' ').trim(), cl = sheet.querySelector('#gmCls').value;
      if(nm.length < 2 || !cl){ errMsg = 'Please enter your name and select your class.'; return render(); }
      ls('mbName', nm); ls('mbCls', cl); errMsg = ''; me = null; return goMM();
    }
    if(a === 'play') return hasProfile() ? startGame() : (view = 'profile', render());
    if(a === 'board') return loadBoard();
    if(a === 'bcls'){ boardCls = b.dataset.c; return loadBoard(); }
    if(a === 'opt') return answer(Number(b.dataset.i));
  }

  // ===================== the "Games" button in your access cards =====================
  function leafWithText(txt){
    const all = document.body.querySelectorAll('*');
    for(const n of all){ if(n.closest('#gmSheet')) continue; if(!n.children.length && n.textContent.trim() === txt) return n; }
    return null;
  }
  function findCard(){
    // The "Notices" card is the model: its subtitle is unique, so start there and climb to the whole card
    const leaf = leafWithText('Latest updates');
    if(!leaf) return null;
    let n = leaf;   // stop when the parent also holds the other two cards: n is then exactly one card
    while(n.parentElement && n.parentElement !== document.body){
      const t = n.parentElement.textContent;
      if(t.includes('Notes & resources') && t.includes('Practice & tests') && t.includes('Latest updates')) return n;
      n = n.parentElement;
    }
    return null;
  }
  function makeButton(card){
    const btn = card.cloneNode(true);
    [btn].concat([...btn.querySelectorAll('*')]).forEach(n => {
      [...n.attributes].forEach(a => { if(/^(id|href|onclick|target|name|for)$/i.test(a.name)) n.removeAttribute(a.name); });
    });
    btn.setAttribute('data-games-btn', '1'); btn.setAttribute('role', 'button'); btn.setAttribute('tabindex', '0');
    const w = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT); let t, emojiDone = false;
    while((t = w.nextNode())){
      const s = t.nodeValue.trim();
      if(s === 'Notices') t.nodeValue = 'Games';
      else if(s === 'Latest updates') t.nodeValue = 'Play & compete';
      else if(s && !emojiDone && s.length <= 4 && /[^\x00-\x7F]/.test(s)){ t.nodeValue = '🎮'; emojiDone = true; }
    }
    if(!emojiDone){ const img = btn.querySelector('img,svg'); if(img){ const sp = document.createElement('span'); sp.textContent = '🎮'; sp.style.fontSize = '30px'; img.replaceWith(sp); } }
    return btn;
  }
  function wireButton(btn){
    const go = e => { e.preventDefault(); e.stopPropagation(); openSheet(); };
    btn.addEventListener('click', go);
    btn.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') go(e); });
    ['touchstart', 'touchend'].forEach(ev => btn.addEventListener(ev, e => e.stopPropagation(), {passive:true}));
  }
  function addButton(){
    if(document.querySelector('[data-games-btn]')) return true;
    const slot = document.querySelector('[data-games-slot]');           // optional: you can mark your own element
    if(slot){ wireButton(slot); slot.setAttribute('data-games-btn', '1'); return true; }
    const card = findCard();
    if(!card) return false;
    const btn = makeButton(card); card.parentNode.insertBefore(btn, card.nextSibling); wireButton(btn); return true;
  }
  function fallbackButton(){
    if(document.querySelector('[data-games-btn]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'gm-fallback'; b.setAttribute('data-games-btn', '1');
    b.innerHTML = '<span style="font-size:30px">🎮</span><span>Games<small>Play & compete</small></span>';
    const before = document.getElementById('members') || document.getElementById('materials');
    if(before) before.parentNode.insertBefore(b, before); else (document.querySelector('main') || document.body).appendChild(b);
    wireButton(b);
  }

  function init(){
    if(typeof SUPABASE_URL === 'undefined') return;
    sheet = document.createElement('div'); sheet.id = 'gmSheet'; document.body.appendChild(sheet);
    sheet.addEventListener('click', onClick);
    sheet.addEventListener('error', e => { if(e.target.classList && /gm-(glogo|biglogo)/.test(e.target.className)) e.target.classList.add('missing'); }, true);
    ['touchstart', 'touchend'].forEach(ev => sheet.addEventListener(ev, e => e.stopPropagation(), {passive:true}));
    document.addEventListener('keydown', e => { if(opened && view === 'play' && /^[1-4]$/.test(e.key)) answer(Number(e.key) - 1); });
    document.addEventListener('click', e => { const t = e.target.closest('[data-games-open]'); if(t){ e.preventDefault(); openSheet(); } });
    window.openGames = openSheet;
    let tries = 0;
    (function find(){ if(addButton()) return; if(++tries < 20) setTimeout(find, 500); else fallbackButton(); })();
  }
  if(document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
