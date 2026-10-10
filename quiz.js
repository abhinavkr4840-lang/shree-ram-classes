/* Daily Quiz with streaks. A card at the top of the page opens a full-screen quiz.
   Needs notes-upload.js (Supabase) and the AI chat file (ram-doot-chat-v2.js) loaded BEFORE it. */
(function(){
  const GOAL = 10;
  const LOGO = 'vedax-prime-logo.png';
  const css = `
  .dq,#dqSheet{--vx-navy:#0B1F4B;--vx-navy2:#16358A;--vx-gold:#FFB800;--vx-gold2:#FFD45C;--vx-cyan:#22C3F2;--vx-cream:#FBF7EC;--vx-ok:#2BC16B;--vx-bad:#F25B5B;font-family:'Nunito','Noto Sans Devanagari',system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  .vx-av{flex:0 0 auto;width:var(--s,44px);height:var(--s,44px);border-radius:50%;overflow:hidden;display:inline-grid;place-items:center;background:var(--vx-cream);border:3px solid var(--vx-gold);font-size:calc(var(--s,44px) * .5)}
  .vx-av img{width:100%;height:100%;object-fit:cover;transform:scale(2.15);transform-origin:49% 43%}

  /* top card */
  .dq{position:relative;display:flex;align-items:center;gap:12px;margin:16px 14px 6px;padding:14px;border-radius:22px;background:linear-gradient(135deg,var(--vx-navy),var(--vx-navy2));color:var(--vx-cream);border:3px solid var(--vx-navy);box-shadow:5px 5px 0 var(--vx-gold);cursor:pointer}
  .dq-avw{position:relative;flex:0 0 auto}
  .dq-badge{position:absolute;right:-8px;bottom:-6px;padding:2px 8px;border-radius:999px;background:var(--vx-gold);color:var(--vx-navy);border:2px solid var(--vx-navy);font-size:12px;font-weight:900}
  .dq-mid{flex:1;min-width:0}
  .dq-brand{display:block;font-size:11px;font-weight:900;letter-spacing:.16em;color:var(--vx-gold)}
  .dq-mid strong{display:block;font-size:16px;font-weight:900;line-height:1.25;margin-top:1px}
  .dq-bar{height:12px;border-radius:999px;background:rgba(255,255,255,.2);margin:8px 0 6px;overflow:hidden}
  .dq-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,var(--vx-gold),var(--vx-gold2));transition:width .5s}
  .dq-mid small{font-size:11.5px;opacity:.85;font-weight:700}
  .dq-go{flex:0 0 auto;border:3px solid var(--vx-navy);padding:10px 14px;border-radius:14px;font:inherit;font-weight:900;font-size:13px;color:var(--vx-navy);cursor:pointer;background:var(--vx-gold);box-shadow:3px 3px 0 var(--vx-cyan)}
  .dq-go:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--vx-cyan)}

  /* full-screen sheet */
  #dqSheet{position:fixed;inset:0;z-index:9700;display:none;flex-direction:column;background:var(--vx-cream);color:var(--vx-navy)}
  #dqSheet.open{display:flex;animation:dqUp .25s ease}
  @keyframes dqUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  @keyframes dqPop{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
  .dq-in{width:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;flex:1;min-height:0}
  .dq-top{display:flex;align-items:center;gap:10px;padding:calc(env(safe-area-inset-top,0px) + 10px) 12px 10px;background:var(--vx-navy);color:var(--vx-cream)}
  .dq-top .t{flex:1;line-height:1.15}
  .dq-top .t b{display:block;font-size:18px;font-weight:900;letter-spacing:.06em;color:var(--vx-gold)}
  .dq-top .t small{font-size:11.5px;opacity:.85;font-weight:700}
  .dq-top button{border:0;width:38px;height:38px;border-radius:50%;background:var(--vx-cream);color:var(--vx-navy);font-size:18px;font-weight:900;cursor:pointer}
  .dq-tabs{display:flex;gap:8px;padding:12px 12px 10px}
  .dq-tabs button{flex:1;border:3px solid var(--vx-navy);background:#fff;color:var(--vx-navy);font:inherit;font-weight:900;font-size:13.5px;padding:9px;border-radius:14px;cursor:pointer;box-shadow:3px 3px 0 var(--vx-navy)}
  .dq-tabs button.on{background:var(--vx-gold);box-shadow:0 0 0 var(--vx-navy);transform:translate(3px,3px)}
  .dq-body{flex:1;overflow-y:auto;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 22px)}
  .dq-box{padding:16px;border-radius:20px;background:#fff;border:3px solid var(--vx-navy);box-shadow:4px 4px 0 var(--vx-navy);margin-bottom:14px}
  .dq-box h3{margin:0 0 6px;font-size:19px;font-weight:900}
  .dq-box p{margin:0 0 12px;font-size:14px;line-height:1.5;font-weight:600;opacity:.85}
  .dq-box input,.dq-box select{width:100%;box-sizing:border-box;margin-bottom:10px;padding:12px;border-radius:12px;border:3px solid var(--vx-navy);background:#fff;color:var(--vx-navy);font:inherit;font-size:15px;font-weight:700}
  .dq-btn{display:block;width:100%;border:3px solid var(--vx-navy);padding:14px;border-radius:16px;font:inherit;font-weight:900;font-size:15.5px;color:var(--vx-navy);cursor:pointer;background:var(--vx-gold);box-shadow:4px 4px 0 var(--vx-navy);transition:transform .08s,box-shadow .08s}
  .dq-btn:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--vx-navy)}
  .dq-btn.alt{background:#fff;margin-top:12px}
  .dq-btn.ok{background:var(--vx-ok);color:#fff}
  .dq-btn.bad{background:var(--vx-bad);color:#fff}
  .dq-hero{display:flex;align-items:center;gap:14px;margin-bottom:14px}
  .dq-hero img{width:92px;height:auto;border-radius:18px;border:3px solid var(--vx-navy);box-shadow:3px 3px 0 var(--vx-gold);background:var(--vx-cream)}
  .dq-hero div{font-size:14px;font-weight:700;line-height:1.45}
  .dq-hero b{display:block;font-size:20px;font-weight:900;margin-bottom:2px}
  .dq-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}
  .dq-sub{border:3px solid var(--vx-navy);background:#fff;color:var(--vx-navy);font:inherit;font-weight:900;font-size:15px;padding:16px 8px;border-radius:18px;cursor:pointer;text-align:center;box-shadow:4px 4px 0 var(--vx-navy)}
  .dq-sub:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--vx-navy)}
  .dq-sub span{display:grid;place-items:center;width:52px;height:52px;margin:0 auto 6px;border-radius:16px;border:3px solid var(--vx-navy);font-size:26px;background:var(--bg)}
  .dq-prog{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:900;margin:2px 0 14px}
  .dq-prog .dq-bar{flex:1;margin:0;background:#E3DDCB;border:2px solid var(--vx-navy);height:14px}
  .dq-prog .dq-bar i{background:linear-gradient(90deg,var(--vx-cyan),#7DE3FF)}
  .dq-combo{display:inline-block;margin-bottom:10px;padding:3px 12px;border-radius:999px;background:var(--vx-navy);color:var(--vx-gold);font-size:12.5px;font-weight:900}
  .dq-q{font-size:20px;font-weight:900;line-height:1.45;margin:4px 0 18px;overflow-wrap:anywhere}
  .dq-opt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:3px solid var(--vx-navy);background:#fff;color:var(--vx-navy);font:inherit;font-size:16px;font-weight:800;padding:12px 13px;border-radius:16px;margin-bottom:12px;cursor:pointer;box-shadow:3px 3px 0 var(--vx-navy);overflow-wrap:anywhere}
  .dq-opt:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--vx-navy)}
  .dq-opt i{flex:0 0 auto;width:32px;height:32px;border-radius:10px;display:grid;place-items:center;font-style:normal;font-weight:900;font-size:14px;background:var(--vx-navy);color:var(--vx-cream)}
  .dq-opt.ok{background:#D9F8E4;border-color:var(--vx-ok)}
  .dq-opt.ok i{background:var(--vx-ok)}
  .dq-opt.bad{background:#FFE1E1;border-color:var(--vx-bad)}
  .dq-opt.bad i{background:var(--vx-bad)}
  .dq-opt.dim{opacity:.5;box-shadow:none}
  .dq-fb{display:flex;gap:12px;align-items:flex-start;margin:6px 0 14px;padding:14px;border-radius:18px;border:3px solid var(--vx-navy);font-size:14.5px;line-height:1.5;font-weight:700}
  .dq-fb.ok{background:#D9F8E4}.dq-fb.bad{background:#FFE1E1}
  .dq-fb b{display:block;font-size:17px;font-weight:900;margin-bottom:2px}
  .dq-big{text-align:center;padding:6px 0 4px}
  .dq-big .vx-av{animation:dqPop 1.6s infinite}
  .dq-big h2{margin:10px 0 4px;font-size:27px;font-weight:900}
  .dq-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin:16px 0}
  .dq-stats div{padding:12px 4px;border-radius:16px;background:#fff;border:3px solid var(--vx-navy);box-shadow:3px 3px 0 var(--vx-navy);text-align:center;font-size:11.5px;font-weight:800}
  .dq-stats b{display:block;font-size:22px;font-weight:900}
  .dq-chips{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 12px;scrollbar-width:none}
  .dq-chips button{flex:0 0 auto;border:3px solid var(--vx-navy);background:#fff;color:var(--vx-navy);font:inherit;font-weight:800;font-size:13px;padding:6px 13px;border-radius:999px;cursor:pointer}
  .dq-chips button.on{background:var(--vx-gold)}
  .dq-row{display:flex;align-items:center;gap:10px;padding:11px 12px;margin-bottom:10px;border-radius:16px;background:#fff;border:3px solid var(--vx-navy);box-shadow:3px 3px 0 var(--vx-navy)}
  .dq-row.me{background:var(--vx-gold2)}
  .dq-rk{flex:0 0 34px;text-align:center;font-weight:900;font-size:18px}
  .dq-nm{flex:1;min-width:0;font-weight:900;font-size:15px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dq-nm small{display:block;font-weight:700;opacity:.65;font-size:11px}
  .dq-sc{font-weight:900;font-size:17px;white-space:nowrap}
  .dq-err{color:#D63B3B;font-weight:800;font-size:13px;margin-top:8px}
  .dq-load{text-align:center;padding:50px 10px;font-weight:800}
  .dq-load .vx-av{animation:dqPop 1.1s infinite;margin-bottom:12px}
  .dq-note{font-size:11.5px;opacity:.6;text-align:center;margin-top:10px;line-height:1.4;font-weight:700}
  .dq-conf{position:fixed;top:-30px;z-index:9800;font-size:24px;pointer-events:none;animation:dqFall linear forwards}
  @keyframes dqFall{to{transform:translateY(110vh) rotate(360deg);opacity:.9}}
  `;
  const fl = document.createElement('link'); fl.rel = 'stylesheet'; fl.href = 'https://fonts.googleapis.com/css2?family=Nunito:wght@600;700;800;900&family=Noto+Sans+Devanagari:wght@600;800&display=swap'; document.head.appendChild(fl);
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ----- helpers -----
  const ls = (k, v) => { try{ if(v === undefined) return localStorage.getItem(k); if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} return null; };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let myKey = ls('dqKey');
  if(!myKey){ myKey = 'q' + Math.random().toString(36).slice(2) + Date.now().toString(36); ls('dqKey', myKey); }
  const profile = () => ({name: (ls('mbName') || ls('chatName') || '').trim(), cls: ls('mbCls') || ''});
  const SUBJECTS = [['⚛️','Physics','#BFEFFF'],['🧪','Chemistry','#FFE9A8'],['📐','Mathematics','#D6DEFF']];
  const subjectsFor = () => SUBJECTS;
  const av = size => '<span class="vx-av" style="--s:' + size + 'px"><img src="' + LOGO + '" alt="VEDAX" onerror="this.replaceWith(document.createTextNode(\'🧠\'))"></span>';
  const PRAISE = ['Brilliant! 🎉','Superb! ⭐','You nailed it! 🔥','Genius move! ⚡','Correct! 🌟','Smart thinking! 🧠'];
  const TRY = ['Almost there! 💪','Good try! Learn and move on 🌱','Not quite, see why 👇','Mistakes help you grow 🌱'];
  const pick = a => a[Math.floor(Math.random() * a.length)];

  // AI sometimes writes LaTeX. Turn it into clean, readable text (× ÷ √ ² ₂ π ≤ ...).
  const SUP = {'0':'⁰','1':'¹','2':'²','3':'³','4':'⁴','5':'⁵','6':'⁶','7':'⁷','8':'⁸','9':'⁹','+':'⁺','-':'⁻','−':'⁻','=':'⁼','(':'⁽',')':'⁾','n':'ⁿ','i':'ⁱ'};
  const SUB = {'0':'₀','1':'₁','2':'₂','3':'₃','4':'₄','5':'₅','6':'₆','7':'₇','8':'₈','9':'₉','+':'₊','-':'₋','−':'₋','=':'₌','(':'₍',')':'₎','a':'ₐ','e':'ₑ','o':'ₒ','x':'ₓ','n':'ₙ','m':'ₘ','i':'ᵢ','j':'ⱼ'};
  const GREEK = {times:'×',cdot:'·',div:'÷',pm:'±',mp:'∓',leq:'≤',le:'≤',geq:'≥',ge:'≥',neq:'≠',ne:'≠',approx:'≈',infty:'∞',rightarrow:'→',to:'→',leftarrow:'←',Rightarrow:'⇒',leftrightarrow:'↔',rightleftharpoons:'⇌',circ:'°',degree:'°',Delta:'Δ',delta:'δ',alpha:'α',beta:'β',gamma:'γ',theta:'θ',lambda:'λ',mu:'μ',pi:'π',sigma:'σ',omega:'ω',Omega:'Ω',rho:'ρ',epsilon:'ε',varepsilon:'ε',phi:'φ',tau:'τ',eta:'η',nu:'ν',perp:'⊥',angle:'∠',therefore:'∴',propto:'∝',ldots:'…',dots:'…',left:'',right:'',quad:' ',qquad:' ',displaystyle:'',cdots:'⋯',sum:'Σ',int:'∫',vec:'',hat:'',bar:'',overline:'',ohm:'Ω',Ohm:'Ω'};
  function scripts(t, re, map, mark){
    return t.replace(re, (m, a, b) => { const body = a !== undefined && a !== '' ? a : b; const r = [...body].map(c => map[c]); return r.every(Boolean) ? r.join('') : mark + '(' + body + ')'; });
  }
  function cleanMath(x){
    let t = String(x == null ? '' : x);
    t = t.replace(/\\\(|\\\)|\\\[|\\\]/g, '').replace(/\$+/g, '').replace(/\\\\/g, ' ').replace(/\\[,;:! ]/g, ' ');
    for(let k = 0; k < 5; k++){
      t = t.replace(/\\[dt]?frac\s*\{([^{}]*)\}\s*\{([^{}]*)\}/g, (m, a, b) => { const A = /^[\w.]+$/.test(a.trim()) ? a.trim() : '(' + a + ')', B = /^[\w.]+$/.test(b.trim()) ? b.trim() : '(' + b + ')'; const ab = A + '/' + B, FR = {'1/2':'½','1/3':'⅓','2/3':'⅔','1/4':'¼','3/4':'¾','1/5':'⅕','1/8':'⅛'}; return FR[ab] || ab; });
      t = t.replace(/\\sqrt\s*\[([^\]]*)\]\s*\{([^{}]*)\}/g, (m, n, a) => (n === '3' ? '∛' : n === '4' ? '∜' : n + '√') + '(' + a + ')');
      t = t.replace(/\\sqrt\s*\{([^{}]*)\}/g, (m, a) => '√(' + a + ')');
      t = t.replace(/\\(?:text|mathrm|mathbf|textbf|mathit|operatorname|mathrm|boldsymbol)\s*\{([^{}]*)\}/g, '$1');
    }
    t = t.replace(/\\sqrt\s*([A-Za-z0-9])/g, '√$1');
    const OPS = 'times cdot div pm mp leq le geq ge neq ne approx rightarrow to leftarrow Rightarrow leftrightarrow rightleftharpoons therefore propto ldots dots cdots quad qquad'.split(' ');
    t = t.replace(/\\([a-zA-Z]+)( ?)/g, (m, c, sp, off, str) => (GREEK[c] !== undefined ? GREEK[c] : '') + (OPS.indexOf(c) > -1 || !/[A-Za-z0-9(]/.test(str[off + m.length] || '') ? sp : ''));
    t = t.replace(/\^\s*\{\s*°\s*\}|\^\s*°/g, '°');
    t = scripts(t, /\^\s*\{([^{}]*)\}|\^\s*([0-9+\-−]+|[a-z])/gi, SUP, '^');
    t = scripts(t, /_\s*\{([^{}]*)\}|_\s*([0-9]+|[a-z])/gi, SUB, '_');
    t = t.replace(/[{}]/g, '').replace(/ {2,}/g, ' ').trim();
    return t;
  }
  const ERR = {slow_down:'Slow down a little 🙂', daily_limit:'You reached today\'s limit of 40 questions. Great work! Come back tomorrow 🔥', bad_input:'Please check your name and class.'};

  async function rpc(fn, body){
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {method:'POST', headers:{apikey:SUPABASE_KEY, 'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const d = await r.json().catch(() => null);
    if(!r.ok) throw new Error((d && d.message) || 'error');
    return Array.isArray(d) ? d[0] : d;
  }
  async function rpcAll(fn, body){
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {method:'POST', headers:{apikey:SUPABASE_KEY, 'Content-Type':'application/json'}, body:JSON.stringify(body)});
    const d = await r.json().catch(() => null);
    if(!r.ok) throw new Error((d && d.message) || 'error');
    return d || [];
  }

  // ----- state -----
  let card, sheet, status = {streak:0, best:0, today:0, correct:0, met:false, total:0};
  let view = 'subjects', tab = 'quiz', deck = [], qi = 0, subject = '', picked = -1, sess = {n:0, ok:0, combo:0}, fbMsg = '', justMet = false, errMsg = '', boardMode = 'current', boardCls = 'all', board = null;

  const setStatus = r => { if(!r) return; status = {streak:r.streak || 0, best:r.best_streak || 0, today:r.today_count || 0, correct:r.today_correct || 0, met:!!r.goal_met, total:r.total_answered || status.total}; };
  async function loadStatus(){ try{ setStatus(await rpc('quiz_status', {p_key:myKey})); }catch(e){} drawCard(); }

  // ----- top card -----
  function drawCard(){
    if(!card) return;
    const pct = Math.min(100, Math.round(status.today / GOAL * 100));
    const left = Math.max(0, GOAL - status.today);
    card.innerHTML = `<div class="dq-avw">${av(66)}<span class="dq-badge">🔥 ${status.streak}</span></div>
      <div class="dq-mid"><span class="dq-brand">VEDAX PRIME</span><strong>${status.streak ? status.streak + '-day streak!' : 'Start your streak!'}</strong>
        <div class="dq-bar"><i style="width:${pct}%"></i></div>
        <small>${status.met ? '✅ Daily goal done · best ' + status.best + ' 🏆' : left + ' more to ' + (status.streak ? 'keep your streak' : 'start a streak') + ' · ' + Math.min(status.today, GOAL) + '/' + GOAL}</small></div>
      <button class="dq-go" type="button">${status.met ? 'Practice' : status.today ? 'Continue' : 'Start'}</button>`;
  }

  // ----- sheet -----
  function build(){
    const hero = document.querySelector('.hero'), main = document.querySelector('main');
    card = document.createElement('div'); card.className = 'dq'; card.id = 'dqCard';
    if(hero) hero.parentNode.insertBefore(card, hero); else if(main) main.prepend(card); else document.body.prepend(card);
    sheet = document.createElement('div'); sheet.id = 'dqSheet';
    document.body.appendChild(sheet);
    ['touchstart','touchend'].forEach(ev => [card, sheet].forEach(el => el.addEventListener(ev, e => e.stopPropagation(), {passive:true})));
    card.addEventListener('click', openSheet);
    sheet.addEventListener('click', onClick);
    drawCard();
  }
  function openSheet(){
    sheet.classList.add('open'); tab = 'quiz'; errMsg = '';
    view = profile().name && profile().cls ? (deck.length && qi < deck.length ? 'question' : 'subjects') : 'profile';
    render(); loadStatus();
  }
  function closeSheet(){ sheet.classList.remove('open'); drawCard(); }

  function render(){
    const body = tab === 'board' ? boardHTML() : ({profile:profileHTML, subjects:subjectsHTML, loading:loadingHTML, question:questionHTML, result:resultHTML}[view] || subjectsHTML)();
    sheet.innerHTML = `<div class="dq-in"><div class="dq-top">${av(42)}<div class="t"><b>VEDAX PRIME</b><small>Physics · Chemistry · Maths</small></div><button data-a="close" aria-label="Close">✕</button></div>
      <div class="dq-tabs"><button data-a="tab-quiz" class="${tab === 'quiz' ? 'on' : ''}">📝 Practice</button><button data-a="tab-board" class="${tab === 'board' ? 'on' : ''}">🏆 Top streaks</button></div>
      <div class="dq-body">${body}</div></div>`;
    const b = sheet.querySelector('.dq-body'); if(b && view === 'question' && picked < 0) b.scrollTop = 0;
  }

  function profileHTML(){
    const p = profile();
    return `<div class="dq-hero"><img src="${LOGO}" alt="VEDAX PRIME" onerror="this.style.display='none'"><div><b>Namaste! 🙏</b>I'm VEDAX, your Physics, Chemistry and Maths buddy.</div></div>
      <div class="dq-box"><h3>Who's playing?</h3><p>Questions are picked for your class. Your name and streak can appear on the leaderboard.</p>
      <input id="dqName" type="text" maxlength="40" placeholder="Your name (e.g. Aarav S.)" value="${esc(p.name)}" autocomplete="off">
      <select id="dqCls"><option value="">Select your class</option>${[8,9,10,11,12].map(c => '<option' + (String(c) === p.cls ? ' selected' : '') + '>' + c + '</option>').join('')}</select>
      <button class="dq-btn" data-a="save-profile">Save and continue</button><div class="dq-err">${esc(errMsg)}</div></div>`;
  }
  function subjectsHTML(){
    const p = profile();
    return `<div class="dq-hero"><img src="${LOGO}" alt="VEDAX PRIME" onerror="this.style.display='none'"><div><b>Hi ${esc(p.name)}! 👋</b>Class ${esc(p.cls)} · Answer ${GOAL} questions every day to grow your streak.</div></div>
      <div class="dq-box"><h3>Pick a subject</h3>
      <div class="dq-grid">${SUBJECTS.map(s => '<button class="dq-sub" data-a="subject" data-s="' + esc(s[1]) + '"><span style="--bg:' + s[2] + '">' + s[0] + '</span>' + (s[1] === 'Mathematics' ? 'Maths' : esc(s[1])) + '</button>').join('')}
      <button class="dq-sub" data-a="subject" data-s="Mixed"><span style="--bg:#fff">🎲</span>Mixed PCM</button></div>
      <button class="dq-btn alt" data-a="edit-profile">✎ Change name or class</button><div class="dq-err">${esc(errMsg)}</div></div>
      <div class="dq-note">Questions are made by AI for your class. If an answer looks wrong, ask your teacher. 🙏</div>`;
  }
  function loadingHTML(){ return '<div class="dq-load">' + av(86) + '<br>VEDAX is preparing your questions…<br><small style="opacity:.6">This takes a few seconds</small></div>'; }
  function questionHTML(){
    const q = deck[qi]; if(!q) return loadingHTML();
    const done = picked >= 0, ok = picked === q.answer;
    const pct = Math.min(100, Math.round(status.today / GOAL * 100));
    return `<div class="dq-prog"><span>Q ${qi + 1}/${deck.length}</span><div class="dq-bar"><i style="width:${pct}%"></i></div><span>🔥 ${Math.min(status.today, GOAL)}/${GOAL}</span></div>
      ${sess.combo >= 2 ? '<span class="dq-combo">⚡ ' + sess.combo + ' in a row!</span>' : ''}
      <div class="dq-q">${esc(q.q)}</div>
      ${q.options.map((o, i) => '<button class="dq-opt' + (done ? (i === q.answer ? ' ok' : i === picked ? ' bad' : ' dim') : '') + '" data-a="opt" data-i="' + i + '"><i>' + 'ABCD'[i] + '</i><span>' + esc(o) + '</span></button>').join('')}
      ${done ? '<div class="dq-fb ' + (ok ? 'ok' : 'bad') + '">' + av(44) + '<div><b>' + esc(fbMsg) + '</b>' + esc(q.why) + '</div></div><button class="dq-btn ' + (ok ? 'ok' : 'bad') + '" data-a="next">' + (justMet ? '🎉 See my result' : 'Continue ➜') + '</button>' : ''}
      <div class="dq-err">${esc(errMsg)}</div>`;
  }
  function resultHTML(){
    return `<div class="dq-big">${av(110)}<h2>${status.met ? 'Daily goal done! 🎉' : 'Nice effort! 💪'}</h2>
      <div style="font-weight:800">${status.streak ? '<b>' + status.streak + '-day streak</b> 🔥' : 'Keep going to start a streak!'}</div></div>
      <div class="dq-stats"><div><b>${sess.ok}/${sess.n}</b>this round</div><div><b>${Math.min(status.today, GOAL)}/${GOAL}</b>today's goal</div><div><b>${status.best}</b>best streak</div></div>
      <button class="dq-btn" data-a="more">More questions (bonus) ⚡</button>
      <button class="dq-btn alt" data-a="tab-board">🏆 See leaderboard</button>
      <button class="dq-btn alt" data-a="close">Done for now</button><div class="dq-err">${esc(errMsg)}</div>`;
  }
  function boardHTML(){
    const chips = ['all','8','9','10','11','12'].map(c => '<button data-a="bcls" data-c="' + c + '" class="' + (boardCls === c ? 'on' : '') + '">' + (c === 'all' ? 'All classes' : 'Class ' + c) + '</button>').join('');
    const modes = `<div class="dq-tabs" style="padding:0 0 10px"><button data-a="bmode" data-m="current" class="${boardMode === 'current' ? 'on' : ''}">🔥 Current streak</button><button data-a="bmode" data-m="best" class="${boardMode === 'best' ? 'on' : ''}">🏆 Best streak</button></div>`;
    let list;
    if(board === null) list = '<div class="dq-load"><i>⏳</i>Loading…</div>';
    else if(board === 'err') list = '<div class="dq-err">Could not load the leaderboard. Please try again.</div>';
    else if(!board.length) list = '<div class="dq-box"><p style="margin:0;text-align:center">Nobody here yet. Be the first! 🔥</p></div>';
    else { const p = profile(); list = board.map((r, i) => {
      const me = r.name === p.name && String(r.cls) === p.cls, val = boardMode === 'best' ? r.best_streak : r.streak;
      return '<div class="dq-row' + (me ? ' me' : '') + '"><div class="dq-rk">' + (['🥇','🥈','🥉'][i] || '#' + (i + 1)) + '</div><div class="dq-nm">' + esc(r.name) + (me ? ' (you)' : '') + '<small>Class ' + esc(r.cls) + ' · ' + r.total_answered + ' answered' + (r.done_today ? ' · ✅ today' : '') + '</small></div><div class="dq-sc">' + (boardMode === 'best' ? '🏆 ' : '🔥 ') + val + '</div></div>'; }).join(''); }
    return modes + '<div class="dq-chips">' + chips + '</div>' + list + '<div class="dq-note">The more you practise every day, the longer your streak grows!</div>';
  }

  // ----- actions -----
  function onClick(e){
    const b = e.target.closest('[data-a]'); if(!b) return;
    const a = b.dataset.a;
    if(a === 'close') return closeSheet();
    if(a === 'tab-quiz'){ tab = 'quiz'; return render(); }
    if(a === 'tab-board'){ tab = 'board'; return loadBoard(); }
    if(a === 'bmode'){ boardMode = b.dataset.m; return loadBoard(); }
    if(a === 'bcls'){ boardCls = b.dataset.c; return loadBoard(); }
    if(a === 'edit-profile'){ view = 'profile'; return render(); }
    if(a === 'save-profile'){
      const nm = sheet.querySelector('#dqName').value.replace(/[<>@]/g, '').replace(/\s+/g, ' ').trim(), cl = sheet.querySelector('#dqCls').value;
      if(nm.length < 2 || !cl){ errMsg = 'Please enter your name and select your class.'; return render(); }
      ls('mbName', nm); ls('mbCls', cl); errMsg = ''; view = 'subjects'; deck = []; return render();
    }
    if(a === 'subject'){ subject = b.dataset.s; sess = {n:0, ok:0, combo:0}; return fetchDeck(); }
    if(a === 'more') return fetchDeck();
    if(a === 'opt') return answer(Number(b.dataset.i));
    if(a === 'next') return next();
  }

  async function fetchDeck(){
    view = 'loading'; errMsg = ''; picked = -1; justMet = false; render();
    try{ deck = await generate(); qi = 0; view = 'question'; }
    catch(e){ view = 'subjects'; errMsg = 'Could not prepare questions right now. Please try again in a moment.'; }
    render();
  }
  async function answer(i){
    if(picked >= 0) return;
    const q = deck[qi], ok = i === q.answer;
    picked = i; sess.n++; if(ok){ sess.ok++; sess.combo++; fbMsg = pick(PRAISE); } else { sess.combo = 0; fbMsg = pick(TRY); }
    const wasMet = status.met;
    status.today++; if(ok) status.correct++;
    render();
    try{
      const p = profile();
      const r = await rpc('quiz_answer', {p_key:myKey, p_name:p.name, p_cls:p.cls, p_correct:ok});
      const before = status.streak; setStatus(r);
      if(r.goal_met && !wasMet){ justMet = true; confetti(); render(); }
    }catch(e){ errMsg = ERR[String(e.message).trim()] || 'Could not save your progress (check internet).'; if(String(e.message).trim() === 'daily_limit') justMet = true; render(); }
  }
  function next(){
    picked = -1; errMsg = '';
    if(justMet){ justMet = false; view = 'result'; return render(); }
    qi++;
    if(qi >= deck.length) return fetchDeck();
    render();
  }
  async function loadBoard(){
    tab = 'board'; board = null; render();
    try{ board = await rpcAll('quiz_top', {p_mode:boardMode, p_cls:boardCls}); }catch(e){ board = 'err'; }
    if(tab === 'board') render();
  }
  function confetti(){
    const em = ['🎉','✨','🔥','⭐','🎊'];
    for(let i = 0; i < 26; i++){
      const s = document.createElement('span'); s.className = 'dq-conf'; s.textContent = em[i % em.length];
      s.style.left = Math.random() * 100 + 'vw'; s.style.animationDuration = (2 + Math.random() * 2) + 's'; s.style.animationDelay = Math.random() * .6 + 's';
      document.body.appendChild(s); setTimeout(() => s.remove(), 5000);
    }
  }

  // ----- question generation (AI) -----
  async function generate(){
    const p = profile(), seen = JSON.parse(ls('dqSeen') || '[]');
    const subj = subject === 'Mixed' ? 'a mix of Physics, Chemistry and Mathematics' : subject;
    const level = Number(p.cls) <= 10 ? 'Use the Class ' + p.cls + ' Science / Maths textbook topics.' : 'Use the Class ' + p.cls + ' CBSE syllabus.';
    const prompt = `Create 10 multiple-choice questions for Class ${p.cls} students in India. Subject: ${subj}. ${level}
Rules:
- Mix of easy and medium difficulty, short and clear questions.
- Exactly 4 options and exactly one correct answer. No "all of the above".
- Physics, chemistry and maths facts and calculations must be exactly correct. Keep numbers simple so they can be solved in the head or on paper.
- WRITE ALL MATHS IN PLAIN TEXT with Unicode symbols, like: 3x + 5 = 20, (3x − 5)/2 = 7, x², √16, 10⁻³, H₂O, v = u + at, 5 × 4, π, ≤. NEVER use LaTeX, backslashes, dollar signs or code.
- Add a 1 to 2 sentence explanation.
${seen.length ? 'Do not repeat these questions: ' + seen.slice(-25).join(' | ') : ''}
Return ONLY a JSON array, no other text: [{"q":"question","options":["A","B","C","D"],"answer":0,"why":"short explanation"}] where "answer" is the index (0 to 3) of the correct option.`;
    const url = typeof AI_WORKER_URL !== 'undefined' ? AI_WORKER_URL : '';
    const headers = {'Content-Type':'application/json'};
    if(!url) headers.Authorization = 'Bearer ' + (typeof GROQ_API_KEY !== 'undefined' ? GROQ_API_KEY : '');
    for(let attempt = 0; attempt < 2; attempt++){
      const r = await fetch(url || 'https://api.groq.com/openai/v1/chat/completions', {method:'POST', headers,
        body:JSON.stringify({model: typeof TEXT_MODEL !== 'undefined' ? TEXT_MODEL : 'openai/gpt-oss-120b', max_tokens:3000,
          messages:[{role:'system', content:'You write accurate school quiz questions. Output valid JSON only. Never use LaTeX.'}, {role:'user', content:prompt}]})});
      const d = await r.json();
      let t = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || '';
      t = t.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json|```/g, '');
      const a = t.indexOf('['), b = t.lastIndexOf(']');
      let arr = []; try{ arr = JSON.parse(t.slice(a, b + 1)); }catch(e){}
      const good = (Array.isArray(arr) ? arr : []).filter(x => x && typeof x.q === 'string' && Array.isArray(x.options) && x.options.length === 4 && x.options.every(o => typeof o === 'string' || typeof o === 'number') && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < 4)
        .map(x => ({q:cleanMath(x.q), why:cleanMath(x.why), opts:x.options.map((o, i) => ({o:cleanMath(String(o)), c:i === x.answer}))}))
        .filter(x => x.q && x.opts.every(z => z.o) && new Set(x.opts.map(z => z.o.toLowerCase())).size === 4)
        .map(x => { shuffle(x.opts); return {q:x.q, options:x.opts.map(z => z.o), answer:x.opts.findIndex(z => z.c), why:x.why}; });
      if(good.length >= 5){
        ls('dqSeen', JSON.stringify(seen.concat(good.map(g => g.q.slice(0, 70))).slice(-40)));
        return good;
      }
    }
    throw new Error('no questions');
  }

  function init(){
    if(typeof SUPABASE_URL === 'undefined') return;
    build(); loadStatus();
    document.addEventListener('visibilitychange', () => { if(!document.hidden) loadStatus(); });
  }
  if(document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
