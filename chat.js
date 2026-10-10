/* श्री राम परिवार Chat: opens from the ✉ button in the header (replaces the hamburger).
   Class-code protected, shows who is online, supports @mentions. Load AFTER notes-upload.js. */
(function(){
  const css = `
  #chBtn{position:relative!important;overflow:visible!important}
  #chBtn .ch-ic{font-style:normal;font-size:26px;line-height:1;color:#fff;display:block}
  #chBtn .ch-dot{position:absolute;top:-7px;right:-7px;min-width:22px;height:22px;padding:0 5px;box-sizing:border-box;border-radius:11px;background:#94a3b8;color:#fff;font:800 11px/18px system-ui,sans-serif;border:2px solid var(--cream,#fff);text-align:center}
  #chBtn .ch-dot.on{background:#22c55e;animation:chPulse 2s infinite}
  #chBtn .ch-flag{position:absolute;top:-7px;left:-7px;width:22px;height:22px;border-radius:50%;background:#ef4444;color:#fff;font:800 12px/18px system-ui,sans-serif;border:2px solid var(--cream,#fff);text-align:center;display:none}
  @keyframes chPulse{0%,100%{box-shadow:0 0 0 0 rgba(34,197,94,.55)}50%{box-shadow:0 0 0 7px rgba(34,197,94,0)}}
  @keyframes chIn{from{opacity:0;transform:translateY(-14px) scale(.97)}to{opacity:1;transform:none}}
  #chBack{position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.45);backdrop-filter:blur(2px);display:none}
  #chBack.open{display:block}
  #chPanel{position:fixed;z-index:9501;top:calc(env(safe-area-inset-top,0px) + 74px);bottom:10px;left:10px;right:10px;max-width:440px;margin-left:auto;display:none;flex-direction:column;overflow:hidden;border-radius:24px;background:var(--cream,#f5f8fb);color:var(--ink,#10243a);border:1px solid var(--line,#e8edf2);box-shadow:0 20px 60px rgba(0,0,0,.5)}
  #chPanel.open{display:flex;animation:chIn .28s ease}
  .ch-hd{display:flex;align-items:center;gap:12px;padding:14px 14px 14px 16px;color:#fff;background:linear-gradient(135deg,var(--navy2,#063b72),var(--blue,#0b6fae))}
  .ch-hd .ch-lg{width:42px;height:42px;border-radius:50%;display:grid;place-items:center;font-size:22px;background:rgba(255,255,255,.18)}
  .ch-hd .ch-tt{flex:1;min-width:0;line-height:1.2}
  .ch-hd .ch-tt b{display:block;font-size:17px}
  .ch-hd .ch-tt small{font-size:12px;opacity:.92;display:flex;align-items:center;gap:6px}
  .ch-hd .ch-tt small i{width:9px;height:9px;border-radius:50%;background:#22c55e;box-shadow:0 0 0 3px rgba(34,197,94,.3)}
  .ch-hd button{border:0;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.18);color:#fff;font-size:18px;cursor:pointer;line-height:1}
  .ch-on{display:flex;gap:8px;overflow-x:auto;padding:10px 12px;border-bottom:1px solid var(--line,#e8edf2);background:var(--card,#fff);scrollbar-width:none}
  .ch-on::-webkit-scrollbar{display:none}
  .ch-on:empty{display:none}
  .ch-chip{flex:0 0 auto;display:flex;align-items:center;gap:6px;border:1px solid var(--line,#d6dee8);background:transparent;color:inherit;font:inherit;font-weight:700;font-size:12.5px;padding:5px 11px 5px 8px;border-radius:999px;cursor:pointer}
  .ch-chip i{width:8px;height:8px;border-radius:50%;background:#22c55e}
  .ch-ms{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:3px;scrollbar-width:thin}
  .ch-day{align-self:center;margin:10px 0 6px;font-size:11px;font-weight:800;padding:4px 12px;border-radius:999px;background:rgba(127,127,127,.18);opacity:.8}
  .ch-r{display:flex;gap:8px;align-items:flex-end;max-width:90%;margin-top:6px}
  .ch-r.grp{margin-top:0}
  .ch-r.me{align-self:flex-end;flex-direction:row-reverse}
  .ch-av{flex:0 0 auto;width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:800;color:#fff}
  .ch-sp{flex:0 0 auto;width:30px}
  .ch-c{display:flex;flex-direction:column;min-width:0}
  .ch-r.me .ch-c{align-items:flex-end}
  .ch-n{font-size:11.5px;font-weight:800;margin:0 8px 3px}
  .ch-n em{font-style:normal;font-size:10px;margin-left:5px;padding:1px 7px;border-radius:999px;background:var(--saffron,#f28a17);color:#fff}
  .ch-b{padding:9px 13px;font-size:14.5px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word;background:var(--card,#fff);border:1px solid var(--line,#e8edf2);border-radius:18px 18px 18px 6px;box-shadow:0 2px 8px rgba(0,0,0,.07)}
  .ch-r.grp .ch-b{border-top-left-radius:6px}
  .ch-r.me .ch-b{color:#fff;border:0;background:linear-gradient(135deg,var(--blue,#0b6fae),color-mix(in srgb,var(--blue,#0b6fae) 62%,#000));border-radius:18px 18px 6px 18px}
  .ch-r.tch .ch-b{border:1.5px solid var(--saffron,#f28a17);background:color-mix(in srgb,var(--saffron,#f28a17) 14%,var(--card,#fff))}
  .ch-r.ment .ch-b{box-shadow:0 0 0 2px #ef4444,0 4px 14px rgba(239,68,68,.35)}
  .ch-at{font-weight:800;padding:0 5px;border-radius:7px;background:color-mix(in srgb,var(--saffron,#f28a17) 25%,transparent);color:inherit}
  .ch-r.me .ch-at{background:rgba(255,255,255,.25)}
  .ch-at.you{background:#ef4444;color:#fff}
  .ch-t{font-size:10px;opacity:.55;margin:3px 8px 0}
  .ch-t button{border:0;background:transparent;color:inherit;cursor:pointer;margin-left:6px}
  .ch-empty{margin:auto;text-align:center;opacity:.65;font-size:14px;line-height:1.6}
  .ch-sug{display:none;gap:6px;flex-wrap:wrap;padding:8px 12px;border-top:1px solid var(--line,#e8edf2);background:var(--card,#fff)}
  .ch-sug.open{display:flex}
  .ch-sug button{border:0;background:color-mix(in srgb,var(--saffron,#f28a17) 22%,transparent);color:inherit;font:inherit;font-weight:700;font-size:13px;padding:6px 12px;border-radius:999px;cursor:pointer}
  .ch-fm{display:flex;align-items:center;gap:6px;margin:8px 10px 6px;padding:5px;background:var(--card,#fff);border:1.5px solid var(--line,#d6dee8);border-radius:999px;box-shadow:0 4px 16px rgba(0,0,0,.08)}
  .ch-fm input{flex:1;min-width:0;border:0!important;background:transparent!important;box-shadow:none!important;outline:none;font:inherit;font-size:15px;color:inherit!important;padding:8px 6px}
  .ch-fm button{flex:0 0 auto;width:40px;height:40px;border:0;border-radius:50%;font-size:18px;cursor:pointer;display:grid;place-items:center;padding:0;font-weight:800}
  .ch-fm .ch-atb{background:rgba(127,127,127,.18);color:inherit}
  .ch-fm .ch-sd{color:#fff;background:linear-gradient(135deg,var(--blue,#0b6fae),color-mix(in srgb,var(--blue,#0b6fae) 62%,#000));opacity:.5;transition:opacity .2s}
  .ch-fm .ch-sd.on{opacity:1}
  .ch-er{min-height:16px;padding:0 16px;font-size:12px;font-weight:700;color:#ef4444}
  .ch-rl{padding:0 16px 10px;font-size:10.5px;opacity:.55;line-height:1.4}
  .ch-gt{display:grid;gap:10px;padding:20px 18px;overflow-y:auto}
  .ch-gt h3{margin:0;font-size:18px}
  .ch-gt p{margin:0;font-size:13px;line-height:1.5;opacity:.85}
  .ch-gt input{padding:13px 14px;border-radius:14px;font:inherit;font-size:15px}
  body.dark:not([data-theme]) #chPanel{background:#0b1220;color:#e6edf5;border-color:#1f2c3f}
  body.dark:not([data-theme]) .ch-b,body.dark:not([data-theme]) .ch-on,body.dark:not([data-theme]) .ch-fm,body.dark:not([data-theme]) .ch-sug{background:#121c2d;border-color:#26364d;color:#e6edf5}
  body.dark:not([data-theme]) .ch-r.me .ch-b{color:#fff;background:linear-gradient(135deg,#0b6fae,#08507f)}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const escRe = t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const ls = (k, v) => { try{ if(v === undefined) return localStorage.getItem(k); if(v === null) localStorage.removeItem(k); else localStorage.setItem(k, v); }catch(e){} return null; };
  const session = () => { try{ const s = JSON.parse(localStorage.getItem('teacherSession') || 'null'); return s && Date.now() < s.expires_at ? s : null; }catch(e){ return null; } };
  const COLORS = ['#3b82f6','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#ef4444','#14b8a6'];
  const colorOf = n => COLORS[[...n].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  const ERR = {bad_code:'Wrong class code. Please ask your teacher for the code.', blocked:'Links, phone numbers and emails are not allowed here.', slow_down:'Please slow down a little 🙂', bad_name:'Please use a different name (2 to 30 letters, no "teacher" or "sir").', bad_message:'Message must be 1 to 300 characters.'};
  const friendly = m => ERR[String(m).trim()] || 'Something went wrong. Please try again.';

  let myId = ls('chatAuthor');
  if(!myId){ myId = 'u' + Math.random().toString(36).slice(2) + Date.now().toString(36); ls('chatAuthor', myId); }
  let stick = true, btn, back, panel, teacherOn = false, isOpen = false, rows = [], online = [], activeN = 0, lastKey = '';
  const $ = s => panel.querySelector(s);
  const hdr = () => ({apikey:SUPABASE_KEY, 'Content-Type':'application/json'});
  const tHdr = s => Object.assign(hdr(), {Authorization:'Bearer ' + s.access_token});
  const myName = () => teacherOn ? 'Ritik Sir' : (ls('chatName') || '');
  const joined = () => teacherOn || !!(ls('chatCode') && ls('chatName'));

  async function rpc(fn, body){
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {method:'POST', headers:hdr(), body:JSON.stringify(body || {})});
    const d = await r.json().catch(() => null);
    if(!r.ok) throw new Error((d && d.message) || 'error');
    return d;
  }

  // ----- header ✉ button (replaces the hamburger) -----
  function setupButton(){
    const old = document.querySelector('.menu-btn');
    btn = old ? old.cloneNode(false) : document.createElement('button');
    btn.id = 'chBtn'; btn.type = 'button'; btn.removeAttribute('aria-expanded'); btn.setAttribute('aria-label', 'Chat');
    btn.innerHTML = '<i class="ch-ic">✉</i><b class="ch-dot" id="chDot">0</b><b class="ch-flag" id="chFlag">@</b>';
    if(old) old.replaceWith(btn); else { btn.style.cssText = 'position:fixed;top:14px;right:14px;z-index:9000;width:52px;height:52px;border-radius:16px;border:0;background:var(--blue,#0b6fae)'; document.body.appendChild(btn); }
    const nav = document.getElementById('mobileNav'); if(nav) nav.style.display = 'none';
    btn.onclick = () => isOpen ? closeChat() : openChat();
  }
  function updateBadge(){
    const d = document.getElementById('chDot'); if(!d) return;
    d.textContent = activeN; d.classList.toggle('on', activeN > 0);
    const f = document.getElementById('chFlag'); if(f) f.style.display = ls('chatMention') === '1' ? 'block' : 'none';
  }

  // ----- panel -----
  function build(){
    back = document.createElement('div'); back.id = 'chBack';
    panel = document.createElement('div'); panel.id = 'chPanel';
    document.body.append(back, panel);
    ['touchstart','touchend'].forEach(ev => [panel, back].forEach(el => el.addEventListener(ev, e => e.stopPropagation(), {passive:true})));
    back.onclick = closeChat;
  }
  function openChat(){
    isOpen = true; back.classList.add('open'); panel.classList.add('open');
    ls('chatMention', null); updateBadge();
    if(joined()) drawRoom(); else drawGate();
  }
  function closeChat(){ isOpen = false; back.classList.remove('open'); panel.classList.remove('open'); }

  function drawGate(msg){
    panel.innerHTML = `<div class="ch-hd"><div class="ch-lg">🔒</div><div class="ch-tt"><b>परिवार Chat</b><small>Members only</small></div><button id="chX" aria-label="Close">✕</button></div>
      <div class="ch-gt"><h3>Join the chat 🙏</h3><p>This chat is only for students of Shree Ram Classes. Ask your teacher for the class code.</p>
        <input id="chNm" type="text" maxlength="30" placeholder="Your name (e.g. Aarav S.)" value="${esc(ls('chatName') || '')}" autocomplete="off">
        <input id="chCd" type="password" placeholder="Class code" autocomplete="off">
        <button class="primary-btn" id="chGo" type="button">Enter chat</button>
        <div class="ch-er" id="chEr">${esc(msg || '')}</div></div>`;
    $('#chX').onclick = closeChat;
    $('#chGo').onclick = async () => {
      const nm = $('#chNm').value.replace(/\s+/g, ' ').replace(/@/g, '').trim(), code = $('#chCd').value.trim();
      if(nm.length < 2){ $('#chEr').textContent = 'Please enter your name.'; return; }
      if(!code){ $('#chEr').textContent = 'Please enter the class code.'; return; }
      $('#chGo').disabled = true;
      try{ const r = await rpc('chat_ping', {p_code:code, p_author:myId, p_name:nm}); ls('chatName', nm); ls('chatCode', code); online = r.map(x => x.name); drawRoom(); }
      catch(e){ $('#chGo').disabled = false; $('#chEr').textContent = friendly(e.message); }
    };
  }

  function drawRoom(){
    panel.innerHTML = `<div class="ch-hd"><div class="ch-lg">🙏</div><div class="ch-tt"><b>श्री राम परिवार Chat</b><small><i></i><span id="chSub">0 online</span></small></div><button id="chX" aria-label="Close">✕</button></div>
      <div class="ch-on" id="chOn"></div>
      <div class="ch-ms" id="chMs"><div class="ch-empty">Loading…</div></div>
      <div class="ch-sug" id="chSug"></div>
      <form class="ch-fm" id="chFm"><button type="button" class="ch-atb" id="chAt" aria-label="Mention">@</button><input id="chIn" type="text" maxlength="300" placeholder="Message as ${esc(myName())}…" autocomplete="off"><button type="submit" class="ch-sd" id="chSd" aria-label="Send">➤</button></form>
      <div class="ch-er" id="chEr"></div>
      <div class="ch-rl">Be kind and respectful. No links, phone numbers or personal details. Messages are deleted after 14 days.</div>`;
    $('#chX').onclick = closeChat;
    $('#chFm').onsubmit = send;
    const inp = $('#chIn');
    inp.addEventListener('input', () => { $('#chSd').classList.toggle('on', !!inp.value.trim()); suggest(); });
    $('#chAt').onclick = () => { const p = inp.selectionStart || inp.value.length; inp.value = inp.value.slice(0, p) + (p && !/\s$/.test(inp.value.slice(0, p)) ? ' @' : '@') + inp.value.slice(p); inp.focus(); suggest(); };
    $('#chSug').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if(b) insertMention(b.dataset.n); });
    $('#chOn').addEventListener('click', e => { const b = e.target.closest('[data-n]'); if(b) insertMention(b.dataset.n); });
    lastKey = ''; stick = true; renderOnline(); fetchMsgs(true); ping();
  }

  // ----- online + mentions -----
  function names(){
    const set = new Set(online);
    rows.forEach(m => set.add(m.name));
    set.add('Ritik Sir');
    return [...set].filter(n => n && n.toLowerCase() !== myName().toLowerCase()).slice(0, 40);
  }
  function renderOnline(){
    const sub = $('#chSub'); if(sub) sub.textContent = activeN + ' online';
    const box = $('#chOn'); if(!box) return;
    const others = online.filter(n => n.toLowerCase() !== myName().toLowerCase());
    box.innerHTML = others.map(n => '<button type="button" class="ch-chip" data-n="' + esc(n) + '"><i></i>' + esc(n) + '</button>').join('');
  }
  function suggest(){
    const inp = $('#chIn'), box = $('#chSug'); if(!inp || !box) return;
    const before = inp.value.slice(0, inp.selectionStart || inp.value.length);
    const m = before.match(/(^|\s)@([^\s@]{0,20})$/);
    if(!m){ box.classList.remove('open'); box.innerHTML = ''; return; }
    const q = m[2].toLowerCase();
    const list = names().filter(n => n.toLowerCase().includes(q)).slice(0, 6);
    box.innerHTML = list.map(n => '<button type="button" data-n="' + esc(n) + '">@' + esc(n) + '</button>').join('');
    box.classList.toggle('open', list.length > 0);
  }
  function insertMention(n){
    const inp = $('#chIn'), p = inp.selectionStart || inp.value.length;
    const before = inp.value.slice(0, p).replace(/(^|\s)@[^\s@]{0,20}$/, '$1') + '@' + n + ' ';
    inp.value = before + inp.value.slice(p); inp.focus(); inp.setSelectionRange(before.length, before.length);
    $('#chSd').classList.add('on'); $('#chSug').classList.remove('open');
  }
  function fmt(body){
    const ns = [...new Set([...names(), myName()])].filter(Boolean).sort((a, b) => b.length - a.length);
    let h = esc(body);
    if(!ns.length) return h;
    const re = new RegExp('@(' + ns.map(n => escRe(esc(n))).join('|') + ')', 'gi');
    return h.replace(re, (m, n) => '<span class="ch-at' + (n.toLowerCase() === myName().toLowerCase() ? ' you' : '') + '">' + m + '</span>');
  }
  const mentionsMe = body => !!myName() && body.toLowerCase().includes('@' + myName().toLowerCase());

  // ----- messages -----
  const dayLabel = d => { const t = new Date(), y = new Date(Date.now() - 864e5), x = new Date(d);
    return x.toDateString() === t.toDateString() ? 'Today' : x.toDateString() === y.toDateString() ? 'Yesterday' : x.toLocaleDateString('en-IN', {day:'numeric', month:'short'}); };

  async function fetchMsgs(force){
    try{
      let data; const s = session();
      if(teacherOn && s){
        const r = await fetch(SUPABASE_URL + '/rest/v1/chat_messages?select=*&order=id.desc&limit=80', {headers:tHdr(s)});
        if(!r.ok) throw new Error('error'); data = (await r.json()).reverse();
      }else data = await rpc('chat_get', {p_code: ls('chatCode') || ''});
      rows = data;
      const maxId = rows.length ? rows[rows.length - 1].id : 0;
      let seen = Number(ls('chatSeen') || 0);
      if(!seen && maxId){ seen = maxId; ls('chatSeen', String(seen)); }
      if(isOpen){ ls('chatSeen', String(maxId)); ls('chatMention', null); }
      else if(rows.some(m => m.id > seen && m.author_id !== myId && mentionsMe(m.body))) ls('chatMention', '1');
      updateBadge();
      if(!isOpen || !$('#chMs')) return;
      const key = rows.map(m => m.id).join(',') + '|' + online.join(',');
      if(key === lastKey && !force) return;
      lastKey = key; renderMsgs(); renderOnline();
    }catch(e){
      if(String(e.message).trim() === 'bad_code'){ ls('chatCode', null); if(isOpen) drawGate(ERR.bad_code); }
    }
  }
  function renderMsgs(){
    const box = $('#chMs'); if(!box) return;
    const near = box.scrollHeight - box.scrollTop - box.clientHeight < 90;
    let html = '', prevDay = '', prev = null;
    rows.forEach(m => {
      const day = new Date(m.created_at).toDateString();
      if(day !== prevDay){ html += '<div class="ch-day">' + dayLabel(m.created_at) + '</div>'; prevDay = day; prev = null; }
      const mine = m.author_id === myId || (teacherOn && m.author_id === 'teacher'), tch = m.author_id === 'teacher';
      const grp = prev && prev.author_id === m.author_id && (new Date(m.created_at) - new Date(prev.created_at)) < 5 * 60000;
      const time = new Date(m.created_at).toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
      const ment = !mine && mentionsMe(m.body);
      const col = tch ? 'var(--saffron,#f28a17)' : colorOf(m.name);
      html += '<div class="ch-r' + (mine ? ' me' : '') + (tch ? ' tch' : '') + (grp ? ' grp' : '') + (ment ? ' ment' : '') + '">'
        + (mine ? '' : (grp ? '<div class="ch-sp"></div>' : '<div class="ch-av" style="background:' + col + '">' + esc((m.name.trim()[0] || '?').toUpperCase()) + '</div>'))
        + '<div class="ch-c">' + (mine || grp ? '' : '<div class="ch-n" style="color:' + col + '">' + esc(m.name) + (tch ? '<em>Teacher</em>' : '') + '</div>')
        + '<div class="ch-b">' + fmt(m.body) + '</div>'
        + '<div class="ch-t">' + time + (ment ? ' · mentioned you' : '') + (teacherOn ? '<button type="button" data-del="' + m.id + '" aria-label="Delete">🗑</button>' : '') + '</div></div></div>';
      prev = m;
    });
    box.innerHTML = html || '<div class="ch-empty">No messages yet.<br>Say जय श्री राम! 🙏</div>';
    if(near || stick){ box.scrollTop = box.scrollHeight; stick = false; }
    box.querySelectorAll('[data-del]').forEach(b => b.onclick = async () => {
      const s = session(); if(!s){ alert('Session expired. Log in again in the Teacher Panel.'); return; }
      if(confirm('Delete this message?')){ await fetch(SUPABASE_URL + '/rest/v1/chat_messages?id=eq.' + b.dataset.del, {method:'DELETE', headers:tHdr(s)}); fetchMsgs(true); }
    });
  }

  async function send(e){
    e.preventDefault();
    const inp = $('#chIn'), err = $('#chEr'), body = inp.value.trim();
    if(!body) return;
    err.textContent = '';
    try{
      const s = session();
      if(teacherOn && s){
        const r = await fetch(SUPABASE_URL + '/rest/v1/chat_messages', {method:'POST', headers:Object.assign({Prefer:'return=minimal'}, tHdr(s)), body:JSON.stringify({author_id:'teacher', name:'Ritik Sir', body:body.slice(0, 300)})});
        if(!r.ok) throw new Error('error');
      }else await rpc('chat_post', {p_code: ls('chatCode') || '', p_author: myId, p_name: ls('chatName') || '', p_body: body});
      inp.value = ''; $('#chSd').classList.remove('on'); $('#chSug').classList.remove('open');
      lastKey = ''; stick = true; fetchMsgs(true);
    }catch(x){
      if(String(x.message).trim() === 'bad_code'){ ls('chatCode', null); drawGate(ERR.bad_code); return; }
      err.textContent = friendly(x.message);
    }
  }

  // ----- presence (green dot) -----
  async function ping(){
    try{
      const s = session();
      if(teacherOn && s){
        await fetch(SUPABASE_URL + '/rest/v1/chat_presence', {method:'POST', headers:Object.assign({Prefer:'resolution=merge-duplicates,return=minimal'}, tHdr(s)), body:JSON.stringify({author_id:'teacher', name:'Ritik Sir', last_seen:new Date().toISOString()})});
        const r = await fetch(SUPABASE_URL + '/rest/v1/chat_presence?select=name&last_seen=gte.' + encodeURIComponent(new Date(Date.now() - 60000).toISOString()), {headers:tHdr(s)});
        online = r.ok ? [...new Set((await r.json()).map(x => x.name))] : [];
      }else if(joined()){
        online = (await rpc('chat_ping', {p_code: ls('chatCode'), p_author: myId, p_name: ls('chatName')})).map(x => x.name);
      }else return;
      activeN = online.length; updateBadge(); renderOnline();
    }catch(e){ if(String(e.message).trim() === 'bad_code'){ ls('chatCode', null); if(isOpen) drawGate(ERR.bad_code); } }
  }
  async function countOnly(){
    try{ activeN = Number(await rpc('chat_active')) || 0; updateBadge(); const sub = panel && $('#chSub'); if(sub) sub.textContent = activeN + ' online'; }catch(e){}
  }

  function init(){
    if(typeof SUPABASE_URL === 'undefined') return;
    teacherOn = !!session(); setupButton(); build(); updateBadge();
    countOnly(); if(joined()) ping();
    setInterval(() => { if(document.hidden) return; joined() ? ping() : countOnly(); }, 25000);
    setInterval(() => { if(document.hidden || !joined()) return; if(isOpen) fetchMsgs(); }, 4000);
    setInterval(() => { if(document.hidden || !joined() || isOpen) return; fetchMsgs(); }, 15000);
    setInterval(() => { const t = !!session(); if(t !== teacherOn){ teacherOn = t; if(isOpen){ joined() ? drawRoom() : drawGate(); } ping(); } }, 1500);
    if(joined()) fetchMsgs();
  }
  if(document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
