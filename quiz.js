/* Daily Quiz with streaks. A card at the top of the page opens a full-screen quiz.
   Needs notes-upload.js (Supabase) and the AI chat file (ram-doot-chat-v2.js) loaded BEFORE it. */
(function(){
  const GOAL = 10;
  const css = `
  .dq{position:relative;display:flex;align-items:center;gap:12px;margin:14px 14px 0;padding:14px;border-radius:20px;background:var(--card,#fff);color:var(--ink,#10243a);border:1px solid var(--line,#e8edf2);box-shadow:0 8px 22px rgba(0,0,0,.1)}
  .dq-fire{flex:0 0 auto;width:62px;height:62px;border-radius:18px;display:grid;place-items:center;text-align:center;line-height:1;font-size:26px;background:linear-gradient(135deg,#ffb020,#ff5c2b);color:#fff;box-shadow:0 4px 12px rgba(255,92,43,.4)}
  .dq-fire b{display:block;font-size:18px;margin-top:-2px}
  .dq-fire.on{animation:dqPop 2s infinite}
  @keyframes dqPop{0%,100%{transform:scale(1)}50%{transform:scale(1.08)}}
  .dq-mid{flex:1;min-width:0}
  .dq-mid strong{display:block;font-size:15px;line-height:1.25}
  .dq-bar{height:10px;border-radius:999px;background:rgba(127,127,127,.22);margin:7px 0 5px;overflow:hidden}
  .dq-bar i{display:block;height:100%;border-radius:999px;background:linear-gradient(90deg,#22c55e,#a3e635);transition:width .5s}
  .dq-mid small{font-size:11.5px;opacity:.75}
  .dq-go{flex:0 0 auto;border:0;padding:11px 14px;border-radius:12px;font:inherit;font-weight:800;font-size:13px;color:#fff;cursor:pointer;background:linear-gradient(135deg,var(--saffron,#f28a17),#e26d0b)}

  #dqSheet{position:fixed;inset:0;z-index:9700;display:none;flex-direction:column;background:var(--cream,#f5f8fb);color:var(--ink,#10243a)}
  #dqSheet.open{display:flex;animation:dqUp .25s ease}
  @keyframes dqUp{from{opacity:0;transform:translateY(24px)}to{opacity:1;transform:none}}
  .dq-in{width:100%;max-width:560px;margin:0 auto;display:flex;flex-direction:column;flex:1;min-height:0}
  .dq-top{display:flex;align-items:center;gap:8px;padding:calc(env(safe-area-inset-top,0px) + 12px) 12px 10px}
  .dq-top b{flex:1;font-size:17px}
  .dq-top button{border:0;width:36px;height:36px;border-radius:50%;background:rgba(127,127,127,.2);color:inherit;font-size:18px;cursor:pointer}
  .dq-tabs{display:flex;gap:8px;padding:0 12px 10px}
  .dq-tabs button{flex:1;border:1.5px solid var(--line,#d6dee8);background:var(--card,#fff);color:inherit;font:inherit;font-weight:800;font-size:13.5px;padding:10px;border-radius:12px;cursor:pointer}
  .dq-tabs button.on{border-color:var(--saffron,#f28a17);background:color-mix(in srgb,var(--saffron,#f28a17) 22%,transparent)}
  .dq-body{flex:1;overflow-y:auto;padding:4px 14px calc(env(safe-area-inset-bottom,0px) + 18px)}
  .dq-box{padding:16px;border-radius:18px;background:var(--card,#fff);border:1px solid var(--line,#e8edf2);margin-bottom:12px}
  .dq-box h3{margin:0 0 6px;font-size:18px}
  .dq-box p{margin:0 0 10px;font-size:13px;line-height:1.5;opacity:.8}
  .dq-box input,.dq-box select{width:100%;margin-bottom:10px;padding:12px;border-radius:12px;font:inherit;font-size:15px}
  .dq-btn{display:block;width:100%;border:0;padding:14px;border-radius:14px;font:inherit;font-weight:800;font-size:15px;color:#fff;cursor:pointer;background:linear-gradient(135deg,var(--saffron,#f28a17),#e26d0b)}
  .dq-btn.alt{background:transparent;color:inherit;border:1.5px solid var(--line,#cfd9e4);margin-top:8px}
  .dq-grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}
  .dq-sub{border:1.5px solid var(--line,#d6dee8);background:var(--card,#fff);color:inherit;font:inherit;font-weight:800;font-size:14px;padding:16px 8px;border-radius:16px;cursor:pointer;text-align:center}
  .dq-sub span{display:block;font-size:26px;margin-bottom:4px}
  .dq-prog{display:flex;align-items:center;gap:10px;font-size:12.5px;font-weight:800;margin-bottom:12px}
  .dq-prog .dq-bar{flex:1;margin:0}
  .dq-q{font-size:19px;font-weight:800;line-height:1.4;margin:6px 0 16px}
  .dq-opt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;border:2px solid var(--line,#d6dee8);background:var(--card,#fff);color:inherit;font:inherit;font-size:15px;font-weight:600;padding:13px;border-radius:14px;margin-bottom:10px;cursor:pointer}
  .dq-opt i{flex:0 0 auto;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-style:normal;font-weight:800;font-size:13px;background:rgba(127,127,127,.2)}
  .dq-opt.ok{border-color:#22c55e;background:color-mix(in srgb,#22c55e 22%,var(--card,#fff))}
  .dq-opt.ok i{background:#22c55e;color:#fff}
  .dq-opt.bad{border-color:#ef4444;background:color-mix(in srgb,#ef4444 20%,var(--card,#fff))}
  .dq-opt.bad i{background:#ef4444;color:#fff}
  .dq-opt.dim{opacity:.55}
  .dq-why{margin:4px 0 12px;padding:12px 14px;border-radius:14px;font-size:13.5px;line-height:1.5;background:color-mix(in srgb,var(--saffron,#f28a17) 14%,var(--card,#fff));border:1px solid var(--line,#e8edf2)}
  .dq-big{text-align:center;padding:10px 0}
  .dq-big .e{font-size:64px;display:block;animation:dqPop 1.6s infinite}
  .dq-big h2{margin:6px 0 4px;font-size:26px}
  .dq-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin:14px 0}
  .dq-stats div{padding:12px 4px;border-radius:14px;background:var(--card,#fff);border:1px solid var(--line,#e8edf2);text-align:center;font-size:11.5px;font-weight:700}
  .dq-stats b{display:block;font-size:22px}
  .dq-chips{display:flex;gap:8px;overflow-x:auto;padding-bottom:10px;scrollbar-width:none}
  .dq-chips button{flex:0 0 auto;border:1.5px solid var(--line,#d6dee8);background:var(--card,#fff);color:inherit;font:inherit;font-weight:700;font-size:13px;padding:7px 13px;border-radius:999px;cursor:pointer}
  .dq-chips button.on{border-color:var(--saffron,#f28a17);background:color-mix(in srgb,var(--saffron,#f28a17) 22%,transparent)}
  .dq-row{display:flex;align-items:center;gap:10px;padding:11px 12px;margin-bottom:8px;border-radius:14px;background:var(--card,#fff);border:1px solid var(--line,#e8edf2)}
  .dq-row.me{border:2px solid var(--saffron,#f28a17)}
  .dq-rk{flex:0 0 32px;text-align:center;font-weight:800;font-size:17px}
  .dq-nm{flex:1;min-width:0;font-weight:800;font-size:14.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .dq-nm small{display:block;font-weight:600;opacity:.65;font-size:11px}
  .dq-sc{font-weight:800;font-size:16px;white-space:nowrap}
  .dq-err{color:#ef4444;font-weight:700;font-size:13px;margin-top:8px}
  .dq-load{text-align:center;padding:60px 10px;font-weight:700}
  .dq-load i{display:block;font-style:normal;font-size:44px;animation:dqPop 1.1s infinite;margin-bottom:10px}
  .dq-note{font-size:11px;opacity:.55;text-align:center;margin-top:10px;line-height:1.4}
  .dq-conf{position:fixed;top:-30px;z-index:9800;font-size:24px;pointer-events:none;animation:dqFall linear forwards}
  @keyframes dqFall{to{transform:translateY(110vh) rotate(360deg);opacity:.9}}
  /* neo style */
  body.nb .dq,body.nb .dq-box,body.nb .dq-opt,body.nb .dq-sub,body.nb .dq-row,body.nb .dq-stats div,body.nb .dq-why{background:var(--nb-card);color:var(--nb-ink);border:3px solid var(--nb-ink);box-shadow:4px 4px 0 var(--nb-sh)}
  body.nb .dq-fire{border:3px solid var(--nb-ink);background:var(--nb-y);color:var(--nb-on);box-shadow:3px 3px 0 var(--nb-sh)}
  body.nb .dq-bar{background:var(--nb-card);border:3px solid var(--nb-ink);height:14px}
  body.nb .dq-bar i{background:var(--nb-g)}
  body.nb .dq-go,body.nb .dq-btn{background:var(--nb-btn);color:var(--nb-on);border:3px solid var(--nb-ink);box-shadow:4px 4px 0 var(--nb-sh)}
  body.nb .dq-btn.alt{background:var(--nb-card);color:var(--nb-ink)}
  body.nb #dqSheet{background:var(--nb-bg);color:var(--nb-ink)}
  body.nb .dq-tabs button,body.nb .dq-chips button{background:var(--nb-card);color:var(--nb-ink);border:2.5px solid var(--nb-ink)}
  body.nb .dq-tabs button.on,body.nb .dq-chips button.on{background:var(--nb-y);color:var(--nb-on)}
  body.nb .dq-opt.ok{background:var(--nb-g);color:#111}
  body.nb .dq-opt.bad{background:#ff6b6b;color:#111}
  body.nb .dq-row.me{background:var(--nb-y);color:var(--nb-on)}
  body.dark:not([data-theme]) .dq,body.dark:not([data-theme]) .dq-box,body.dark:not([data-theme]) .dq-opt,body.dark:not([data-theme]) .dq-sub,body.dark:not([data-theme]) .dq-row,body.dark:not([data-theme]) .dq-stats div,body.dark:not([data-theme]) .dq-tabs button,body.dark:not([data-theme]) .dq-chips button{background:#121c2d;border-color:#26364d;color:#e6edf5}
  body.dark:not([data-theme]) #dqSheet{background:#0b1220;color:#e6edf5}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  // ----- helpers -----
  const ls = (k, v) => { try{ if(v === undefined) return localStorage.getItem(k); if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} return null; };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const shuffle = a => { for(let i = a.length - 1; i > 0; i--){ const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
  let myKey = ls('dqKey');
  if(!myKey){ myKey = 'q' + Math.random().toString(36).slice(2) + Date.now().toString(36); ls('dqKey', myKey); }
  const profile = () => ({name: (ls('mbName') || ls('chatName') || '').trim(), cls: ls('mbCls') || ''});
  const SUBJECTS = {junior: [['📐','Mathematics'],['🔬','Science'],['🌍','Social Science'],['📖','English']],
                    senior: [['⚛️','Physics'],['🧪','Chemistry'],['📐','Mathematics'],['🧬','Biology'],['📖','English'],['💻','Computer Science']]};
  const subjectsFor = c => Number(c) >= 11 ? SUBJECTS.senior : SUBJECTS.junior;
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
  let view = 'subjects', tab = 'quiz', deck = [], qi = 0, subject = '', picked = -1, sess = {n:0, ok:0}, justMet = false, errMsg = '', boardMode = 'current', boardCls = 'all', board = null;

  const setStatus = r => { if(!r) return; status = {streak:r.streak || 0, best:r.best_streak || 0, today:r.today_count || 0, correct:r.today_correct || 0, met:!!r.goal_met, total:r.total_answered || status.total}; };
  async function loadStatus(){ try{ setStatus(await rpc('quiz_status', {p_key:myKey})); }catch(e){} drawCard(); }

  // ----- top card -----
  function drawCard(){
    if(!card) return;
    const pct = Math.min(100, Math.round(status.today / GOAL * 100));
    const left = Math.max(0, GOAL - status.today);
    card.innerHTML = `<div class="dq-fire${status.streak ? ' on' : ''}">🔥<b>${status.streak}</b></div>
      <div class="dq-mid"><strong>${status.streak ? status.streak + '-day streak! 🔥' : 'Start your streak! 🔥'}</strong>
        <div class="dq-bar"><i style="width:${pct}%"></i></div>
        <small>${status.met ? '✅ Daily goal done · best ' + status.best + ' 🏆' : left + ' more question' + (left === 1 ? '' : 's') + ' ' + (status.streak ? 'to keep your streak' : 'to start a streak') + ' · ' + Math.min(status.today, GOAL) + '/' + GOAL}</small></div>
      <button class="dq-go" type="button">${status.met ? 'Practice' : status.today ? 'Continue' : 'Start quiz'}</button>`;
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
    sheet.innerHTML = `<div class="dq-in"><div class="dq-top"><b>🔥 Daily Quiz</b><button data-a="close" aria-label="Close">✕</button></div>
      <div class="dq-tabs"><button data-a="tab-quiz" class="${tab === 'quiz' ? 'on' : ''}">📝 Quiz</button><button data-a="tab-board" class="${tab === 'board' ? 'on' : ''}">🏆 Top streaks</button></div>
      <div class="dq-body">${body}</div></div>`;
    const b = sheet.querySelector('.dq-body'); if(b && view === 'question' && picked < 0) b.scrollTop = 0;
  }

  function profileHTML(){
    const p = profile();
    return `<div class="dq-box"><h3>Who's playing? 🙏</h3><p>Questions are chosen for your class. Your name and streak can appear on the leaderboard.</p>
      <input id="dqName" type="text" maxlength="40" placeholder="Your name (e.g. Aarav S.)" value="${esc(p.name)}" autocomplete="off">
      <select id="dqCls"><option value="">Select your class</option>${[8,9,10,11,12].map(c => '<option' + (String(c) === p.cls ? ' selected' : '') + '>' + c + '</option>').join('')}</select>
      <button class="dq-btn" data-a="save-profile">Save and continue</button><div class="dq-err">${esc(errMsg)}</div></div>`;
  }
  function subjectsHTML(){
    const p = profile();
    return `<div class="dq-box"><h3>Hi ${esc(p.name)}! 👋</h3><p>Class ${esc(p.cls)} · Answer ${GOAL} questions every day to grow your streak. Pick a subject:</p>
      <div class="dq-grid">${subjectsFor(p.cls).map(s => '<button class="dq-sub" data-a="subject" data-s="' + esc(s[1]) + '"><span>' + s[0] + '</span>' + esc(s[1]) + '</button>').join('')}
      <button class="dq-sub" data-a="subject" data-s="Mixed"><span>🎲</span>Mixed</button></div>
      <button class="dq-btn alt" data-a="edit-profile">✎ Change name or class</button><div class="dq-err">${esc(errMsg)}</div></div>
      <div class="dq-note">Questions are made by AI for your class. If an answer looks wrong, ask your teacher. 🙏</div>`;
  }
  function loadingHTML(){ return '<div class="dq-load"><i>🧠</i>Preparing your questions…<br><small style="opacity:.6">This takes a few seconds</small></div>'; }
  function questionHTML(){
    const q = deck[qi]; if(!q) return loadingHTML();
    const done = picked >= 0;
    const pct = Math.min(100, Math.round(status.today / GOAL * 100));
    return `<div class="dq-prog"><span>Q ${qi + 1}/${deck.length}</span><div class="dq-bar"><i style="width:${pct}%"></i></div><span>🔥 ${Math.min(status.today, GOAL)}/${GOAL}</span></div>
      <div class="dq-q">${esc(q.q)}</div>
      ${q.options.map((o, i) => '<button class="dq-opt' + (done ? (i === q.answer ? ' ok' : i === picked ? ' bad' : ' dim') : '') + '" data-a="opt" data-i="' + i + '"><i>' + 'ABCD'[i] + '</i><span>' + esc(o) + '</span></button>').join('')}
      ${done ? '<div class="dq-why">' + (picked === q.answer ? '✅ <b>Correct!</b> ' : '❌ <b>Not quite.</b> ') + esc(q.why) + '</div><button class="dq-btn" data-a="next">' + (justMet ? '🎉 See my result' : 'Next ➜') + '</button>' : ''}
      <div class="dq-err">${esc(errMsg)}</div>`;
  }
  function resultHTML(){
    return `<div class="dq-big"><span class="e">${status.met ? '🔥' : '💪'}</span><h2>${status.met ? 'Daily goal done!' : 'Nice effort!'}</h2>
      <div>${status.streak ? '<b>' + status.streak + '-day streak</b> 🔥' : 'Keep going to start a streak!'}</div></div>
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
    if(a === 'subject'){ subject = b.dataset.s; sess = {n:0, ok:0}; return fetchDeck(); }
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
    picked = i; sess.n++; if(ok) sess.ok++;
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
    const subj = subject === 'Mixed' ? 'a mix of ' + subjectsFor(p.cls).map(s => s[1]).join(', ') : subject;
    const prompt = `Create 10 multiple-choice questions for Class ${p.cls} (CBSE/NCERT syllabus, India). Subject: ${subj}.
Rules: mix of easy and medium difficulty; simple clear English; exactly 4 options; exactly one correct answer; no "all of the above"; maths and science facts must be exactly correct; add a 1 to 2 sentence explanation.
${seen.length ? 'Do not repeat these questions: ' + seen.slice(-25).join(' | ') : ''}
Return ONLY a JSON array, no other text: [{"q":"question","options":["A","B","C","D"],"answer":0,"why":"short explanation"}] where "answer" is the index (0 to 3) of the correct option.`;
    const url = typeof AI_WORKER_URL !== 'undefined' ? AI_WORKER_URL : '';
    const headers = {'Content-Type':'application/json'};
    if(!url) headers.Authorization = 'Bearer ' + (typeof GROQ_API_KEY !== 'undefined' ? GROQ_API_KEY : '');
    for(let attempt = 0; attempt < 2; attempt++){
      const r = await fetch(url || 'https://api.groq.com/openai/v1/chat/completions', {method:'POST', headers,
        body:JSON.stringify({model: typeof TEXT_MODEL !== 'undefined' ? TEXT_MODEL : 'openai/gpt-oss-120b', max_tokens:3000,
          messages:[{role:'system', content:'You write accurate school quiz questions. Output valid JSON only.'}, {role:'user', content:prompt}]})});
      const d = await r.json();
      let t = d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || '';
      t = t.replace(/<think>[\s\S]*?<\/think>/g, '').replace(/```json|```/g, '');
      const a = t.indexOf('['), b = t.lastIndexOf(']');
      let arr = []; try{ arr = JSON.parse(t.slice(a, b + 1)); }catch(e){}
      const good = (Array.isArray(arr) ? arr : []).filter(x => x && typeof x.q === 'string' && Array.isArray(x.options) && x.options.length === 4 && x.options.every(o => typeof o === 'string' && o.trim())
        && new Set(x.options.map(o => o.trim().toLowerCase())).size === 4 && Number.isInteger(x.answer) && x.answer >= 0 && x.answer < 4)
        .map(x => { const opts = x.options.map((o, i) => ({o:o.trim(), c:i === x.answer})); shuffle(opts); return {q:x.q.trim(), options:opts.map(z => z.o), answer:opts.findIndex(z => z.c), why:String(x.why || '').trim()}; });
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
