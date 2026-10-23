/* श्री राम परिवार: member profiles (Discord-style).
   Tap a member card -> profile opens. The owner can edit: banner (image or colour), picture, nickname, pronouns, bio.
   The name chosen when joining is permanent (shown with a lock). Load AFTER members.js. Backend: profiles-setup.sql
   Public hooks for a future cosmetics system:  Profiles.registerDecorator(fn)  ->  fn({member, mine, els:{card,banner,avatar,name,body,slot}}) runs after every render. */
(function(){
  'use strict';
  const BANNERS = {
    g1:'linear-gradient(135deg,#f28a17,#ffcf5c)', g2:'linear-gradient(135deg,#0b6fae,#43c6ac)', g3:'linear-gradient(135deg,#4b2c9b,#8e6cf0)',
    g4:'linear-gradient(135deg,#0f7a4a,#9be15d)', g5:'linear-gradient(135deg,#c2185b,#ff8ab4)', g6:'linear-gradient(135deg,#0f2027,#2c5364)',
    g7:'linear-gradient(135deg,#c31432,#f7971e)', g8:'linear-gradient(135deg,#2193b0,#6dd5ed)', g9:'linear-gradient(135deg,#00b09b,#96c93d)', g10:'linear-gradient(135deg,#485563,#9bb0c4)'
  };
  const DEFAULT_BANNER = 'linear-gradient(135deg,var(--saffron,#f28a17),var(--blue,#0b6fae))';
  const PRONOUNS = ['he/him', 'she/her', 'they/them'];
  const ERR = {
    nick_taken:'That nickname is already taken. Try another one.', nick_reserved:'That nickname is reserved. Please pick another.', bad_nick:'Nickname: 2 to 24 characters, no links or special symbols.',
    bad_bio:'Bio: up to 160 characters, and no links, emails or phone numbers.', bad_pronouns:'Please pick one of the listed pronouns.', bad_banner:'That banner could not be used.',
    bad_photo:'That picture could not be used.', bad_image:'That image could not be used.', not_allowed:'This profile can only be edited from the device that owns it.',
    slow_down:'You are saving too fast. Wait a few seconds and try again.', not_found:'This member no longer exists.', already_claimed:'Someone has already claimed this profile.', name_locked:'The joined name cannot be changed.'
  };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ls = (k, v) => { try{ if(v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); }catch(e){} return null; };
  const keys = () => { try{ return JSON.parse(ls('mbKeys') || '{}') || {}; }catch(e){ return {}; } };
  const keyFor = id => keys()[id] || '';
  const saveKey = (id, tok) => { const m = keys(); m[id] = tok; ls('mbKeys', JSON.stringify(m)); };
  const newToken = () => { const a = new Uint8Array(16); (window.crypto || window.msCrypto).getRandomValues(a); return Array.prototype.map.call(a, b => ('0' + b.toString(16)).slice(-2)).join(''); };
  const rand6 = () => (Math.random().toString(36) + '000000').slice(2, 8);
  const H = (extra) => Object.assign({apikey:SUPABASE_KEY, 'Content-Type':'application/json'}, extra || {});

  const css = `
  .pf-ov{position:fixed;inset:0;z-index:9990;display:flex;align-items:center;justify-content:center;padding:14px;background:rgba(4,10,20,.66);backdrop-filter:blur(3px);animation:pfFade .18s ease both}
  @keyframes pfFade{from{opacity:0}to{opacity:1}} @keyframes pfPop{from{opacity:0;transform:translateY(16px) scale(.97)}to{opacity:1;transform:none}}
  .pf-card{position:relative;width:100%;max-width:440px;max-height:calc(100dvh - 28px);overflow-y:auto;overscroll-behavior:contain;border-radius:22px;background:var(--card,#fff);color:var(--ink,#10243a);box-shadow:0 24px 60px rgba(0,0,0,.45);animation:pfPop .22s ease both}
  .pf-x{position:absolute;top:10px;right:10px;z-index:5;width:36px;height:36px;border:0;border-radius:50%;cursor:pointer;font-size:17px;line-height:1;background:rgba(0,0,0,.42);color:#fff}
  .pf-x:focus-visible,.pf-btn:focus-visible,.pf-sw:focus-visible{outline:3px solid #ffd24a;outline-offset:2px}
  .pf-banner{position:relative;height:128px;border-radius:22px 22px 0 0;background-size:cover;background-position:center}
  .pf-banner .pf-bedit{position:absolute;right:10px;bottom:10px;display:flex;gap:6px}
  .pf-body{padding:0 18px 18px;position:relative}
  .pf-avwrap{position:relative;width:96px;height:96px;margin-top:-48px;border-radius:50%;padding:4px;background:var(--card,#fff);box-shadow:0 4px 14px rgba(0,0,0,.25)}
  .pf-av{width:100%;height:100%;border-radius:50%;overflow:hidden;display:grid;place-items:center;font-size:38px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--blue,#0b6fae),color-mix(in srgb,var(--blue,#0b6fae) 60%,#000))}
  .pf-av img{width:100%;height:100%;object-fit:cover;display:block}
  .pf-avcam{position:absolute;right:-2px;bottom:-2px;width:32px;height:32px;border-radius:50%;border:2px solid var(--card,#fff);background:var(--saffron,#f28a17);color:#fff;cursor:pointer;font-size:15px}
  .pf-top{display:flex;justify-content:flex-end;gap:8px;margin-top:-40px;min-height:40px;flex-wrap:wrap}
  .pf-btn{border:0;border-radius:999px;padding:9px 15px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;background:var(--saffron,#f28a17);color:#fff}
  .pf-btn.ghost{background:transparent;color:inherit;border:1.5px solid var(--line,#cfd9e4)}
  .pf-btn.danger{background:#d1344b}
  .pf-btn[disabled]{opacity:.6;cursor:default}
  .pf-nick{margin:12px 0 2px;font-size:24px;line-height:1.15;font-weight:800;word-break:break-word}
  .pf-joined{font-size:12.5px;opacity:.75;display:flex;align-items:center;gap:6px;flex-wrap:wrap}
  .pf-chips{display:flex;gap:7px;flex-wrap:wrap;margin:12px 0 4px}
  .pf-chip{font-size:12px;font-weight:800;padding:4px 11px;border-radius:999px;background:color-mix(in srgb,var(--saffron,#f28a17) 22%,transparent)}
  .pf-chip.pr{background:color-mix(in srgb,var(--blue,#0b6fae) 20%,transparent)} .pf-chip.you{background:#16a34a;color:#fff}
  .pf-sec{margin-top:14px;padding:12px 14px;border-radius:14px;background:color-mix(in srgb,var(--ink,#10243a) 5%,transparent)}
  .pf-sec h4{margin:0 0 6px;font-size:11px;letter-spacing:.12em;opacity:.7}
  .pf-sec p{margin:0;font-size:14px;line-height:1.5;white-space:pre-wrap;word-break:break-word}
  .pf-sec p.mute{opacity:.55;font-style:italic}
  .pf-form{display:grid;gap:13px;margin-top:12px}
  .pf-form label{display:grid;gap:5px;font-size:12px;font-weight:800;letter-spacing:.03em}
  .pf-form input[type=text],.pf-form select,.pf-form textarea{width:100%;box-sizing:border-box;padding:11px 13px;border-radius:12px;border:1.5px solid var(--line,#cfd9e4);background:var(--card,#fff);color:inherit;font:inherit;font-size:15px;font-weight:600}
  .pf-form textarea{min-height:86px;resize:vertical}
  .pf-hint{font-size:11.5px;font-weight:600;opacity:.7;line-height:1.4}
  .pf-count{justify-self:end;font-size:11px;opacity:.65;font-weight:700}
  .pf-swatches{display:flex;gap:8px;flex-wrap:wrap}
  .pf-sw{width:32px;height:32px;border-radius:50%;border:3px solid transparent;cursor:pointer;box-shadow:0 0 0 1px rgba(0,0,0,.25)}
  .pf-sw.on{border-color:var(--card,#fff);box-shadow:0 0 0 3px var(--saffron,#f28a17)}
  .pf-row{display:flex;gap:8px;flex-wrap:wrap}
  .pf-msg{margin:0;font-size:13px;font-weight:800;min-height:18px}
  .pf-msg.err{color:#d1344b}.pf-msg.ok{color:#16a34a}
  .pf-key{font-family:ui-monospace,Menlo,monospace;font-size:12px;word-break:break-all;padding:9px 11px;border-radius:10px;background:color-mix(in srgb,var(--ink,#10243a) 8%,transparent);user-select:all}
  .pf-link{background:none;border:0;padding:0;color:var(--blue,#0b6fae);font:inherit;font-size:12.5px;font-weight:800;cursor:pointer;text-decoration:underline}
  .pf-load{padding:40px;text-align:center;font-weight:800;opacity:.7}
  body.pf-lock{overflow:hidden}
  body.dark:not([data-theme]) .pf-card{background:#121c2d;color:#e6edf5} body.dark:not([data-theme]) .pf-avwrap,body.dark:not([data-theme]) .pf-avcam{background:#121c2d;border-color:#121c2d}
  body.dark:not([data-theme]) .pf-form input,body.dark:not([data-theme]) .pf-form select,body.dark:not([data-theme]) .pf-form textarea{background:#0e1726;border-color:#243349}
  @media(prefers-reduced-motion:reduce){.pf-ov,.pf-card{animation:none}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const decorators = [];
  let ov = null, lastMsg = null, cur = null, mode = 'view', draft = null, lastFocus = null, installed = null, busy = false, revealKey = false, keyBox = false;

  const rpc = async (fn, body, extraHeaders) => {
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {method:'POST', headers:H(extraHeaders), body:JSON.stringify(body)});
    const d = await r.json().catch(() => null);
    if(!r.ok){ const e = new Error(ERR[d && d.message] || (r.status === 404 ? 'Profiles are not switched on yet (the teacher needs to run profiles-setup.sql).' : 'Something went wrong (' + r.status + ').')); e.code = d && d.message; e.status = r.status; throw e; }
    return d;
  };
  async function checkInstalled(){
    if(installed !== null) return installed;
    try{ const r = await fetch(SUPABASE_URL + '/rest/v1/members?select=id,claimed&limit=1', {headers:{apikey:SUPABASE_KEY}}); installed = r.ok; }catch(e){ installed = false; }
    return installed;
  }
  const API = () => window.MembersAPI;
  const M = () => API() && API().get(cur);
  const mine = m => !!(m && keyFor(m.id));
  const canClaim = m => !!(m && installed && !m.claimed && !keyFor(m.id) && ls('mbName') === m.name && ls('mbCls') === m.cls);

  function bannerStyle(m, d){
    const url = d ? d.bannerPreview : (m.bannerUrl || '');
    if(url) return 'background-image:url(' + esc(url) + ')';
    const c = d ? d.bannerColor : m.bannerColor;
    return 'background:' + (BANNERS[c] || DEFAULT_BANNER);
  }

  function viewHTML(m){
    const shown = m.nickname || m.name, own = mine(m);
    const date = new Date(m.created).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
    const av = m.photo ? '<img src="' + esc(m.photo) + '" alt="">' : esc((shown.trim()[0] || '?').toUpperCase());
    let btns = '';
    if(own && installed) btns += '<button class="pf-btn" data-a="edit" type="button">✏️ Edit profile</button>';
    if(canClaim(m)) btns += '<button class="pf-btn" data-a="claim" type="button">🙋 This is me</button>';
    if(API().teacher() && installed) btns += '<button class="pf-btn danger" data-a="reset" type="button">🛡 Reset profile</button>';
    let extra = '';
    if(installed && !own && m.claimed) extra = '<div class="pf-hint" style="margin-top:10px">Is this your profile on a new phone? <button class="pf-link" data-a="keybox" type="button">Use your profile key</button></div>' + (keyBox ? keyForm() : '');
    if(installed && !own && !m.claimed && !canClaim(m)) extra = '<div class="pf-hint" style="margin-top:10px">This profile has not been claimed yet. Only the member who joined with this name can claim it.</div>';
    return `<div class="pf-banner" id="pfBanner" style="${bannerStyle(m)}"></div>
      <div class="pf-body">
        <div class="pf-top">${btns}</div>
        <div class="pf-avwrap" id="pfAvwrap"><div class="pf-av" id="pfAv">${av}</div></div>
        <h2 class="pf-nick" id="pfName">${esc(shown)}</h2>
        <div class="pf-joined">🔒 Joined as <b>${esc(m.name)}</b></div>
        <div class="pf-chips"><span class="pf-chip">Class ${esc(m.cls)}</span>${m.pronouns ? '<span class="pf-chip pr">' + esc(m.pronouns) + '</span>' : ''}<span class="pf-chip">Joined ${esc(date)}</span>${own ? '<span class="pf-chip you">You</span>' : ''}</div>
        <div class="pf-sec"><h4>ABOUT ME</h4>${m.bio ? '<p>' + esc(m.bio) + '</p>' : '<p class="mute">' + (own ? 'Tell everyone a little about yourself — tap Edit profile.' : 'No bio yet.') + '</p>'}</div>
        <div id="pfSlot"></div>
        ${extra}<p class="pf-msg" id="pfMsg" role="status" aria-live="polite"></p>
      </div>`;
  }
  const keyForm = () => `<div class="pf-form" style="margin-top:8px"><label>Profile key<input id="pfKeyIn" type="text" autocomplete="off" spellcheck="false" placeholder="Paste the key you saved"></label><div class="pf-row"><button class="pf-btn" data-a="usekey" type="button">Unlock editing</button></div></div>`;

  function editHTML(m){
    const d = draft, shown = d.nick || m.name;
    const avSrc = d.avRemove ? '' : (d.avPreview || m.photo || '');
    const av = avSrc ? '<img src="' + esc(avSrc) + '" alt="">' : esc((shown.trim()[0] || '?').toUpperCase());
    const sw = Object.keys(BANNERS).map(k => `<button type="button" class="pf-sw${!d.bannerPreview && d.bannerColor === k ? ' on' : ''}" data-a="color" data-c="${k}" style="background:${BANNERS[k]}" aria-label="Banner colour ${k.slice(1)}"></button>`).join('');
    return `<div class="pf-banner" id="pfBanner" style="${bannerStyle(m, d)}"><div class="pf-bedit"><button class="pf-btn" data-a="bannerpick" type="button">📷 Banner</button>${(d.bannerPreview || m.bannerUrl) && !d.bannerRemove ? '<button class="pf-btn ghost" style="background:rgba(0,0,0,.45);color:#fff;border-color:transparent" data-a="bannerrm" type="button">Remove</button>' : ''}</div></div>
      <div class="pf-body">
        <div class="pf-avwrap" id="pfAvwrap" style="margin-top:-48px"><div class="pf-av" id="pfAv">${av}</div><button class="pf-avcam" data-a="avpick" type="button" aria-label="Change profile picture">📷</button></div>
        <div class="pf-form">
          <div><div class="pf-hint" style="margin-bottom:6px">Banner colour</div><div class="pf-swatches">${sw}</div></div>
          <label>Nickname<input id="pfNick" type="text" maxlength="24" autocomplete="off" value="${esc(d.nick)}" placeholder="${esc(m.name)}"><span class="pf-hint">🔒 Your joined name <b>${esc(m.name)}</b> can never be changed. Your nickname is what everyone sees first. Leave empty to use your joined name.</span></label>
          <label>Pronouns<select id="pfPron"><option value="">Prefer not to say</option>${PRONOUNS.map(p => '<option' + (d.pron === p ? ' selected' : '') + '>' + p + '</option>').join('')}</select></label>
          <label>About me<textarea id="pfBio" maxlength="160" placeholder="A few words about you (no links or phone numbers)">${esc(d.bio)}</textarea><span class="pf-count" id="pfCnt">${d.bio.length}/160</span></label>
          <div class="pf-sec" style="margin:0"><h4>🔑 YOUR PROFILE KEY</h4><div class="pf-hint">This secret key proves the profile is yours. Save it somewhere private if you want to edit from another phone. Never share it.</div>${revealKey ? '<div class="pf-key" style="margin-top:8px">' + esc(keyFor(m.id)) + '</div>' : '<button class="pf-link" data-a="showkey" type="button" style="margin-top:6px">Show my key</button>'}</div>
          <div class="pf-row"><button class="pf-btn" data-a="save" type="button" id="pfSave">Save profile</button><button class="pf-btn ghost" data-a="cancel" type="button">Cancel</button></div>
          <p class="pf-msg" id="pfMsg" role="status" aria-live="polite"></p>
        </div>
        <input type="file" id="pfFileB" accept="image/*" hidden><input type="file" id="pfFileA" accept="image/*" hidden>
      </div>`;
  }

  function render(){
    if(!ov) return;
    const card = ov.querySelector('.pf-card'), m = M();
    if(!m){ card.innerHTML = '<button class="pf-x" data-a="close" aria-label="Close">✕</button><div class="pf-load">Member not found.</div>'; return; }
    const scroll = card.scrollTop;
    card.innerHTML = '<button class="pf-x" data-a="close" type="button" aria-label="Close profile">✕</button>' + (mode === 'edit' ? editHTML(m) : viewHTML(m));
    card.scrollTop = scroll;
    card.setAttribute('aria-label', (m.nickname || m.name) + ' profile');
    if(lastMsg){ const e = card.querySelector('#pfMsg'); if(e){ e.textContent = lastMsg.t; e.className = 'pf-msg' + (lastMsg.cls ? ' ' + lastMsg.cls : ''); } }
    const ctx = {member:m, mine:mine(m), mode, els:{card, banner:card.querySelector('#pfBanner'), avatar:card.querySelector('#pfAv'), name:card.querySelector('#pfName'), body:card.querySelector('.pf-body'), slot:card.querySelector('#pfSlot')}};
    decorators.forEach(fn => { try{ fn(ctx); }catch(e){} });
  }

  async function open(id, keepMsg){
    if(!API()) return;
    close(true); if(!keepMsg) lastMsg = null;
    cur = String(id); mode = 'view'; draft = null; revealKey = false; keyBox = false;
    lastFocus = document.activeElement;
    ov = document.createElement('div'); ov.className = 'pf-ov';
    ov.innerHTML = '<div class="pf-card" role="dialog" aria-modal="true" aria-label="Member profile"><button class="pf-x" data-a="close" type="button" aria-label="Close">✕</button><div class="pf-load">Loading…</div></div>';
    document.body.appendChild(ov); document.body.classList.add('pf-lock');
    ov.addEventListener('click', onClick);
    ov.addEventListener('input', onInput);
    ov.addEventListener('change', onChange);
    ov.querySelector('.pf-x').focus();
    await checkInstalled();
    if(!M()){ try{ const r = await fetch(SUPABASE_URL + '/rest/v1/members?id=eq.' + encodeURIComponent(cur) + '&select=*', {headers:{apikey:SUPABASE_KEY}}); const a = await r.json(); if(a[0]) API().put(a[0]); }catch(e){} }
    render();
    // fresh copy in the background (nickname/bio may have changed on another device)
    try{ const r = await fetch(SUPABASE_URL + '/rest/v1/members?id=eq.' + encodeURIComponent(cur) + '&select=*', {headers:{apikey:SUPABASE_KEY}}); const a = await r.json(); if(a[0] && ov && mode === 'view'){ API().put(a[0]); render(); } }catch(e){}
  }
  function close(silent){
    if(!ov) return;
    ov.remove(); ov = null; document.body.classList.remove('pf-lock');
    if(draft){ ['bannerPreview', 'avPreview'].forEach(k => { if(draft[k]) URL.revokeObjectURL(draft[k]); }); }
    draft = null; mode = 'view';
    if(!silent && lastFocus && lastFocus.focus){ try{ lastFocus.focus(); }catch(e){} }
  }
  const say = (t, cls) => { lastMsg = t ? {t, cls} : null; const e = ov && ov.querySelector('#pfMsg'); if(e){ e.textContent = t || ''; e.className = 'pf-msg' + (cls ? ' ' + cls : ''); } };

  function cropTo(file, w, h){
    return new Promise((res, rej) => {
      if(!file || !/^image\//.test(file.type)) return rej(new Error('Please choose an image file.'));
      if(file.size > 15 * 1048576) return rej(new Error('That image is too large (max 15 MB).'));
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const c = document.createElement('canvas'); c.width = w; c.height = h;
        const k = Math.max(w / im.width, h / im.height), sw = w / k, sh = h / k;
        c.getContext('2d').drawImage(im, (im.width - sw) / 2, (im.height - sh) / 2, sw, sh, 0, 0, w, h);
        URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('Could not read that image.')), 'image/jpeg', 0.82);
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not open that image.')); };
      im.src = url;
    });
  }
  async function upload(blob, prefix){
    const path = prefix + '-' + Date.now() + '-' + rand6() + '.jpg';
    const r = await fetch(SUPABASE_URL + '/storage/v1/object/member-photos/' + path, {method:'POST', headers:{apikey:SUPABASE_KEY, 'Content-Type':'image/jpeg'}, body:blob});
    if(!r.ok) throw new Error('Image upload failed (' + r.status + ').');
    return {path, url:SUPABASE_URL + '/storage/v1/object/public/member-photos/' + path};
  }

  function startEdit(){
    const m = M(); if(!m) return;
    draft = {nick:m.nickname, bio:m.bio, pron:m.pronouns, bannerColor:m.bannerColor || '', bannerBlob:null, bannerPreview:'', bannerRemove:false, avBlob:null, avPreview:'', avRemove:false};
    lastMsg = null; mode = 'edit'; render(); const n = ov.querySelector('#pfNick'); if(n) n.focus();
  }

  async function save(){
    if(busy) return; const m = M(); if(!m || !draft) return;
    draft.nick = ov.querySelector('#pfNick').value; draft.bio = ov.querySelector('#pfBio').value; draft.pron = ov.querySelector('#pfPron').value;
    const btn = ov.querySelector('#pfSave'); busy = true; btn.disabled = true; btn.textContent = 'Saving…'; say('');
    try{
      let bUrl = m.bannerUrl || null, bPath = m.bannerPath || null, bCol = m.bannerColor || null, pUrl = m.photo || null, pPath = m.path || null;
      if(draft.bannerBlob){ const u = await upload(draft.bannerBlob, 'b'); bUrl = u.url; bPath = u.path; bCol = null; }
      else if(draft.bannerRemove){ bUrl = null; bPath = null; bCol = draft.bannerColor || null; }
      else if(draft.bannerColor && draft.bannerColor !== m.bannerColor){ bUrl = null; bPath = null; bCol = draft.bannerColor; }
      if(draft.avBlob){ const u = await upload(draft.avBlob, 'p'); pUrl = u.url; pPath = u.path; }
      else if(draft.avRemove){ pUrl = null; pPath = null; }
      const rows = await rpc('member_update_profile', {p_id:String(m.id), p_token:keyFor(m.id), p_nick:draft.nick.trim() || null, p_bio:draft.bio.trim() || null, p_pron:draft.pron || null,
        p_banner_color:bCol, p_banner_url:bUrl, p_banner_path:bPath, p_photo_url:pUrl, p_photo_path:pPath});
      if(rows && rows[0]) API().put(rows[0]);
      close(true); await open(m.id, true); say('✅ Profile saved!', 'ok');
    }catch(e){ say('❌ ' + e.message, 'err'); const b = ov && ov.querySelector('#pfSave'); if(b){ b.disabled = false; b.textContent = 'Save profile'; } }
    busy = false;
  }

  async function claim(){
    const m = M(); if(!m || busy) return;
    if(!confirm('Claim "' + m.name + '" as your profile? Only do this if this is really you. The first person to claim a profile owns it.')) return;
    busy = true;
    try{ const tok = newToken(); await rpc('member_claim', {p_id:String(m.id), p_token:tok}); saveKey(m.id, tok); const r = await fetch(SUPABASE_URL + '/rest/v1/members?id=eq.' + encodeURIComponent(m.id) + '&select=*', {headers:{apikey:SUPABASE_KEY}}); const a = await r.json(); if(a[0]) API().put(a[0]); render(); say('✅ Profile claimed! Tap Edit profile.', 'ok'); }
    catch(e){ say('❌ ' + e.message, 'err'); }
    busy = false;
  }
  async function useKey(){
    const m = M(), k = (ov.querySelector('#pfKeyIn') || {}).value; if(!m) return;
    const key = String(k || '').trim().toLowerCase();
    if(!/^[0-9a-f]{32,64}$/.test(key)){ say('❌ That does not look like a profile key.', 'err'); return; }
    try{ const ok = await rpc('member_verify', {p_id:String(m.id), p_token:key}); if(ok === true){ saveKey(m.id, key); keyBox = false; render(); say('✅ Key accepted. You can edit this profile on this device now.', 'ok'); } else say('❌ That key does not match this profile.', 'err'); }
    catch(e){ say('❌ ' + e.message, 'err'); }
  }
  async function teacherReset(){
    const m = M(), s = API().session(); if(!m) return;
    if(!s){ alert('Session expired. Please log in again in the Teacher Panel.'); return; }
    if(!confirm('Reset ' + m.name + "'s profile? This clears nickname, bio, pronouns, banner and picture.")) return;
    const unclaim = confirm('Also release ownership so the member (or someone else) can claim it again? OK = release, Cancel = keep owner.');
    try{ await rpc('member_teacher_reset', {p_id:String(m.id), p_unclaim:unclaim}, {Authorization:'Bearer ' + s.access_token});
      const r = await fetch(SUPABASE_URL + '/rest/v1/members?id=eq.' + encodeURIComponent(m.id) + '&select=*', {headers:{apikey:SUPABASE_KEY}}); const a = await r.json(); if(a[0]) API().put(a[0]); render(); say('✅ Profile reset.', 'ok'); }
    catch(e){ say('❌ ' + e.message, 'err'); }
  }

  function onClick(e){
    if(e.target === ov){ close(); return; }
    const b = e.target.closest('[data-a]'); if(!b) return;
    const a = b.dataset.a, m = M();
    if(a === 'close') return close();
    if(a === 'edit') return startEdit();
    if(a === 'cancel'){ mode = 'view'; draft && ['bannerPreview', 'avPreview'].forEach(k => draft[k] && URL.revokeObjectURL(draft[k])); draft = null; revealKey = false; return render(); }
    if(a === 'save') return save();
    if(a === 'claim') return claim();
    if(a === 'reset') return teacherReset();
    if(a === 'keybox'){ keyBox = !keyBox; return render(); }
    if(a === 'usekey') return useKey();
    if(a === 'showkey'){ syncDraft(); revealKey = true; return render(); }
    if(a === 'bannerpick') return ov.querySelector('#pfFileB').click();
    if(a === 'avpick') return ov.querySelector('#pfFileA').click();
    if(a === 'bannerrm'){ syncDraft(); if(draft.bannerPreview) URL.revokeObjectURL(draft.bannerPreview); draft.bannerBlob = null; draft.bannerPreview = ''; draft.bannerRemove = true; return render(); }
    if(a === 'color'){ syncDraft(); if(draft.bannerPreview) URL.revokeObjectURL(draft.bannerPreview); draft.bannerBlob = null; draft.bannerPreview = ''; draft.bannerRemove = true; draft.bannerColor = b.dataset.c; return render(); }
  }
  function syncDraft(){ if(!draft || !ov) return; const n = ov.querySelector('#pfNick'), bi = ov.querySelector('#pfBio'), p = ov.querySelector('#pfPron'); if(n) draft.nick = n.value; if(bi) draft.bio = bi.value; if(p) draft.pron = p.value; }
  function onInput(e){
    if(e.target.id === 'pfBio'){ ov.querySelector('#pfCnt').textContent = e.target.value.length + '/160'; }
    if(e.target.id === 'pfNick' && draft){ draft.nick = e.target.value; const av = ov.querySelector('#pfAv'); if(av && !av.querySelector('img')) av.textContent = ((e.target.value || (M() || {}).name || '?').trim()[0] || '?').toUpperCase(); }
  }
  async function onChange(e){
    const t = e.target; if(!draft || !t.files || !t.files[0]) return;
    try{
      if(t.id === 'pfFileB'){ const blob = await cropTo(t.files[0], 960, 320); syncDraft(); if(draft.bannerPreview) URL.revokeObjectURL(draft.bannerPreview); draft.bannerBlob = blob; draft.bannerPreview = URL.createObjectURL(blob); draft.bannerRemove = false; render(); }
      if(t.id === 'pfFileA'){ const blob = await cropTo(t.files[0], 320, 320); syncDraft(); if(draft.avPreview) URL.revokeObjectURL(draft.avPreview); draft.avBlob = blob; draft.avPreview = URL.createObjectURL(blob); draft.avRemove = false; render(); }
    }catch(err){ say('❌ ' + err.message, 'err'); }
    t.value = '';
  }
  document.addEventListener('keydown', e => {
    if(!ov) return;
    if(e.key === 'Escape'){ e.stopPropagation(); close(); return; }
    if(e.key === 'Tab'){   // keep focus inside the dialog
      const f = ov.querySelectorAll('button:not([disabled]),input:not([type=hidden]):not([hidden]),select,textarea,[tabindex="0"]'); if(!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if(e.shiftKey && document.activeElement === first){ e.preventDefault(); last.focus(); } else if(!e.shiftKey && document.activeElement === last){ e.preventDefault(); first.focus(); }
    }
  }, true);

  window.Profiles = {open, close, registerDecorator: fn => { if(typeof fn === 'function') decorators.push(fn); }, keyFor, _state: () => ({cur, mode, draft, installed})};
})();
