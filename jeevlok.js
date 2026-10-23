/* जीवलोक Jeevlok — the members' animal park for Shree Ram Classes.
   Needs: jeevlok-art.js (drawings), profiles-setup.sql + jeevlok-setup.sql (backend), members.js/profiles.js (identity). Load order: after ram-lab scripts.
   Members with a profile key adopt up to 6 animals (parrot, rhino, sheep, fox, deer, duck, tiger), name them, drag them around the park and
   record a short voice (max 4 s). Adopting needs the group-chat password. Tap an animal: name, owner, date added, voice. */
(function(){
  'use strict';
  const Art = window.JeevlokArt; if(!Art) return;
  const MAX = 6, REC_SECS = 4, RATE_HZ = 12000;
  const STYLES = [{k:'1', n:'Natural', r:1}, {k:'1.35', n:'Squeaky', r:1.35}, {k:'0.8', n:'Deep', r:0.8}];
  const ERR = {
    not_allowed:'Only the owner (from the phone that owns this profile) can do that.', bad_species:'Please pick an animal.', bad_name:'Names are 1 to 20 characters, with no links or phone numbers.',
    bad_position:'That spot is outside the park.', limit_reached:'You already have 6 animals. Release one to adopt another.', slow_down:'Please wait a few seconds and try again.',
    wrong_password:'That is not the group chat password.', gate_not_set:'Jeevlok is almost ready: the teacher still needs to set the group chat password (README step 2).', bad_audio:'That recording could not be used. Please record again.', audio_too_big:'That recording is too big. Please record again.', not_found:'That animal is not here any more.'
  };
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const ls = k => { try{ return localStorage.getItem(k); }catch(e){ return null; } };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const spOf = id => Art.SPECIES.find(s => s.id === id) || Art.SPECIES[2];
  const hash = s => { let h = 0; for(let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0; return h; };
  const session = () => { try{ const s = JSON.parse(ls('teacherSession') || 'null'); return s && Date.now() < s.expires_at ? s : null; }catch(e){ return null; } };
  const identity = () => { try{ const m = JSON.parse(ls('mbKeys') || '{}') || {}; const ids = Object.keys(m); return ids.length ? {id:ids[ids.length - 1], tok:m[ids[ids.length - 1]]} : null; }catch(e){ return null; } };

  const css = `
  #jv-root{position:fixed;inset:0;z-index:9950;display:none;flex-direction:column;background:#0c2418;color:#fff;font-family:system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-tap-highlight-color:transparent;touch-action:manipulation}
  #jv-root.on{display:flex}
  #jv-root *{box-sizing:border-box}
  .jv-bar{flex:0 0 auto;display:flex;align-items:center;gap:8px;padding:6px 10px;background:linear-gradient(#123a27,#0f2f20);border-bottom:2px solid #2a7a4f;min-height:46px}
  .jv-bar .jv-title{flex:1;text-align:center;font-weight:900;font-size:17px;letter-spacing:.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  .jv-bar .jv-title i{font-style:normal;color:#7dffb3}
  .jv-btn{border:0;border-radius:999px;padding:8px 14px;font:inherit;font-weight:800;font-size:13px;cursor:pointer;background:#3ddc84;color:#06301a;white-space:nowrap}
  .jv-btn.ghost{background:rgba(255,255,255,.12);color:#fff}.jv-btn.warn{background:#ff6b6b;color:#fff}.jv-btn.gold{background:#ffd24a;color:#3a2a00}
  .jv-btn[disabled]{opacity:.55;cursor:default}
  .jv-btn:focus-visible,.jv-an:focus-visible,.jv-sp:focus-visible{outline:3px solid #ffd24a;outline-offset:2px}
  .jv-wrap{flex:1 1 auto;min-height:0;display:flex;align-items:center;justify-content:center;background:#0c2418;position:relative;z-index:0}
  .jv-stage{position:relative;overflow:hidden;border-radius:12px;box-shadow:0 8px 30px rgba(0,0,0,.5);background:#9bd}
  .jv-bg{position:absolute;inset:0}.jv-bg svg{display:block}
  .jv-cloud{animation:jvCloud 60s linear infinite}.jv-cloud2{animation:jvCloud 90s linear infinite reverse}
  @keyframes jvCloud{0%{transform:translateX(-30px)}50%{transform:translateX(40px)}100%{transform:translateX(-30px)}}
  .jv-ripple{animation:jvRip 4s ease-in-out infinite}@keyframes jvRip{50%{opacity:.15}}
  .jv-animals{position:absolute;inset:0;z-index:1}
  .jv-an{position:absolute;transform:translate(-50%,-100%);cursor:pointer;outline:none;user-select:none;-webkit-user-select:none}
  .jv-an .jv-body{width:100%;aspect-ratio:1.2;animation:jvBob 2.8s ease-in-out infinite}
  .jv-an .jv-flip{width:100%;height:100%}.jv-an.flip .jv-flip{transform:scaleX(-1)}
  .jv-an svg{overflow:visible;filter:drop-shadow(0 2px 0 rgba(0,0,0,.08))}
  @keyframes jvBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3.5%)}}
  .jv-eyes{animation:jvBlink 4.5s infinite;transform-box:fill-box;transform-origin:center}
  @keyframes jvBlink{0%,92%,100%{transform:scaleY(1)}95%{transform:scaleY(.1)}}
  .jv-tail{animation:jvWag 1.6s ease-in-out infinite;transform-box:fill-box;transform-origin:85% 50%}
  @keyframes jvWag{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(6deg)}}
  .jv-an.talk .jv-body{animation:jvTalk .2s ease-in-out infinite alternate}
  @keyframes jvTalk{from{transform:translateY(0) rotate(-3deg) scale(1)}to{transform:translateY(-8%) rotate(3deg) scale(1.06)}}
  .jv-an.sel .jv-body{filter:drop-shadow(0 0 6px #ffd24a) drop-shadow(0 0 2px #fff)}
  .jv-an.mine::after{content:'';position:absolute;left:18%;right:18%;bottom:-2%;height:5px;border-radius:50%;background:rgba(255,210,74,.75)}
  .jv-an.dragging{cursor:grabbing;z-index:99999!important}.jv-an.dragging .jv-body{animation:none;transform:translateY(-6%) scale(1.06)}
  .jv-tag{position:absolute;left:50%;top:100%;transform:translateX(-50%);margin-top:calc(var(--u,8px) * .25);padding:1px calc(var(--u,8px) * .8);border-radius:999px;background:rgba(255,255,255,.9);color:#10301f;font-weight:800;font-size:max(9px,calc(var(--u,8px) * 1.35));white-space:nowrap;max-width:calc(var(--u,8px) * 16);overflow:hidden;text-overflow:ellipsis;box-shadow:0 1px 0 rgba(0,0,0,.2)}
  .jv-note{position:absolute;left:50%;top:0;pointer-events:none;font-size:max(14px,calc(var(--u,8px) * 2.2));animation:jvNote 1.4s ease-out forwards;color:#ffd24a;text-shadow:0 1px 0 #7a4b00}
  @keyframes jvNote{from{opacity:1;transform:translate(0,0)}to{opacity:0;transform:translate(var(--dx,20px),-90px)}}
  .jv-hint{position:absolute;left:50%;bottom:10px;transform:translateX(-50%);background:rgba(0,0,0,.55);color:#fff;padding:5px 12px;border-radius:999px;font-size:12px;font-weight:700;pointer-events:none;white-space:nowrap;max-width:94%;overflow:hidden;text-overflow:ellipsis}
  .jv-layer{position:absolute;inset:0;pointer-events:none;z-index:20}
  .jv-card{pointer-events:auto;position:absolute;right:10px;top:54px;width:min(330px,46vw);max-height:calc(100% - 64px);overflow:auto;background:#fffdf6;color:#1b2a21;border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.5);padding:14px;animation:jvPop .18s ease both}
  @keyframes jvPop{from{opacity:0;transform:translateY(10px) scale(.97)}to{opacity:1;transform:none}}
  .jv-card h3{margin:0;font-size:21px;line-height:1.15;word-break:break-word}
  .jv-card .jv-x{position:absolute;right:8px;top:8px;width:32px;height:32px;border:0;border-radius:50%;background:rgba(0,0,0,.08);cursor:pointer;font-size:15px}
  .jv-head{display:flex;gap:10px;align-items:center;padding-right:30px}
  .jv-ico{flex:0 0 64px;width:64px;height:54px}
  .jv-chip{display:inline-block;font-size:11.5px;font-weight:800;padding:3px 10px;border-radius:999px;background:#e2f6e9;color:#14532d;margin:6px 6px 0 0}
  .jv-chip.warn{background:#fff0cc;color:#7a4b00}.jv-chip.off{background:#eee;color:#555}.jv-chip.bad{background:#ffe1e1;color:#8a1c1c}
  .jv-owner{display:flex;align-items:center;gap:10px;margin-top:12px;padding:10px;border-radius:14px;background:#f1f6f2;cursor:pointer;border:0;width:100%;text-align:left;font:inherit;color:inherit}
  .jv-ownav{flex:0 0 40px;width:40px;height:40px;border-radius:50%;overflow:hidden;display:grid;place-items:center;font-weight:900;color:#fff;background:linear-gradient(135deg,#0b6fae,#0a4a78)}
  .jv-ownav img{width:100%;height:100%;object-fit:cover}
  .jv-owner small{display:block;opacity:.7;font-size:11.5px}
  .jv-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
  .jv-card .jv-btn.ghost{background:#e6efe9;color:#14391f}
  .jv-field{display:grid;gap:5px;margin-top:10px;font-weight:800;font-size:12px}
  .jv-field input{width:100%;padding:10px 12px;border-radius:12px;border:1.5px solid #c3d4c9;font:inherit;font-size:15px;font-weight:600;background:#fff;color:#10301f}
  .jv-msg{margin:8px 0 0;font-size:13px;font-weight:800;min-height:16px}.jv-msg.err{color:#c1272d}.jv-msg.ok{color:#15803d}
  .jv-modal{pointer-events:auto;position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:12px;background:rgba(3,15,9,.6)}
  .jv-box{position:relative;width:min(560px,96%);max-height:96%;overflow:auto;background:#fffdf6;color:#1b2a21;border-radius:20px;padding:16px;box-shadow:0 18px 50px rgba(0,0,0,.55);animation:jvPop .18s ease both}
  .jv-box h3{margin:0 0 4px;font-size:20px;padding-right:34px}.jv-box .jv-x{position:absolute;right:10px;top:10px;width:32px;height:32px;border:0;border-radius:50%;background:rgba(0,0,0,.08);cursor:pointer}
  .jv-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px}
  .jv-sp{border:2px solid #cfe3d6;background:#fff;border-radius:14px;padding:6px 4px;cursor:pointer;font:inherit;font-weight:800;font-size:12px;color:#14391f;display:grid;gap:2px;justify-items:center}
  .jv-sp.on{border-color:#1fa65a;background:#e2f6e9;box-shadow:0 0 0 3px rgba(31,166,90,.25)}
  .jv-sp .jv-spi{width:100%;aspect-ratio:1.3}
  .jv-meter{height:12px;border-radius:999px;background:#dfe9e2;overflow:hidden;margin-top:12px}.jv-meter b{display:block;height:100%;width:0;background:linear-gradient(90deg,#3ddc84,#ffd24a,#ff6b6b);transition:width .08s}
  .jv-big{font-size:34px;font-weight:900;text-align:center;margin-top:6px;font-variant-numeric:tabular-nums}
  .jv-styles{display:flex;gap:8px;margin-top:10px;flex-wrap:wrap}.jv-styles button{flex:1;min-width:80px}
  .jv-styles .on{background:#1fa65a;color:#fff}
  .jv-rv{display:flex;align-items:center;gap:8px;padding:9px 0;border-bottom:1px solid #e3ece6}.jv-rv>div:first-child{flex:1;min-width:0}
  .jv-toast{position:absolute;left:50%;bottom:54px;transform:translateX(-50%);z-index:30;max-width:92%;background:rgba(10,30,20,.92);color:#fff;padding:9px 16px;border-radius:999px;font-weight:800;font-size:13px;pointer-events:none;animation:jvPop .2s ease both;text-align:center}
  .jv-empty{position:absolute;inset:0;display:grid;place-items:center;text-align:center;padding:20px;font-weight:800;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6);pointer-events:none}
  #jv-orient{position:absolute;inset:0;z-index:100;display:none;flex-direction:column;align-items:center;justify-content:center;gap:14px;padding:24px;text-align:center;background:linear-gradient(#0f3b27,#07170f)}
  #jv-orient.on{display:flex}
  .jv-phone{width:54px;height:92px;border:4px solid #7dffb3;border-radius:12px;animation:jvRot 2.6s ease-in-out infinite;position:relative}.jv-phone::after{content:'';position:absolute;left:50%;bottom:6px;width:14px;height:4px;margin-left:-7px;border-radius:2px;background:#7dffb3}
  @keyframes jvRot{0%,15%{transform:rotate(0)}45%,80%{transform:rotate(-90deg)}100%{transform:rotate(0)}}
  #jv-orient p{margin:0;max-width:340px;font-weight:700;line-height:1.4}
  @media (max-height:460px){.jv-bar{min-height:40px;padding:4px 8px}.jv-bar .jv-title{font-size:15px}.jv-btn{padding:6px 11px;font-size:12px}.jv-card{top:46px;max-height:calc(100% - 54px);padding:11px}}
  @media (orientation:portrait){.jv-card{left:8px;right:8px;top:auto;bottom:8px;width:auto;max-height:62%}}
  @media(prefers-reduced-motion:reduce){.jv-an .jv-body,.jv-tail,.jv-eyes,.jv-cloud,.jv-cloud2,.jv-ripple{animation:none}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  let root, stage, layer, animalsEl, list = [], me = null, selId = null, mode = 'view', off = false, loaded = false, busy = false, opened = false;
  let audioCtx = null, voices = {}, poll = null, dragging = null, toastT = null, weFullscreen = false, orientSkipped = false;
  const mine = a => !!(me && String(a.owner_id) === String(me.id));
  const find = id => list.find(a => a.id === id);

  async function rpc(fn, body, headers){
    const r = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + fn, {method:'POST', headers:Object.assign({apikey:SUPABASE_KEY, 'Content-Type':'application/json'}, headers || {}), body:JSON.stringify(body || {})});
    const d = await r.json().catch(() => null);
    if(!r.ok){ const e = new Error(ERR[d && d.message] || (r.status === 404 ? 'Jeevlok is not switched on yet. The teacher needs to run jeevlok-setup.sql.' : 'Something went wrong (' + r.status + ').')); e.code = d && d.message; e.status = r.status; throw e; }
    return d;
  }
  const tAuth = () => { const s = session(); return s ? {Authorization:'Bearer ' + s.access_token} : null; };
  const own = () => ({p_member:String(me.id), p_token:me.tok});

  /* ---------- build ---------- */
  function build(){
    root = document.createElement('div'); root.id = 'jv-root'; root.setAttribute('role', 'dialog'); root.setAttribute('aria-label', 'Jeevlok animal park');
    root.innerHTML = `<div class="jv-bar"><button class="jv-btn ghost" data-a="exit" type="button">← Back</button><div class="jv-title">🌿 जीवलोक <i>Jeevlok</i></div><div id="jvBtns" style="display:flex;gap:6px"></div></div>
      <div class="jv-wrap" id="jvWrap"><div class="jv-stage" id="jvStage"><div class="jv-bg">${Art.park()}</div><div class="jv-animals" id="jvAnimals"></div><div class="jv-hint" id="jvHint"></div></div><div class="jv-layer" id="jvLayer"></div></div>
      <div id="jv-orient" role="alert"><div class="jv-phone"></div><p><b>Turn your phone sideways</b> to walk around the park. 🌳</p><div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:center"><button class="jv-btn" data-a="autorot" type="button">↻ Try auto-rotate</button><button class="jv-btn ghost" data-a="skiporient" type="button">Continue in portrait</button></div></div>`;
    document.body.appendChild(root);
    stage = root.querySelector('#jvStage'); layer = root.querySelector('#jvLayer'); animalsEl = root.querySelector('#jvAnimals');
    root.addEventListener('click', onClick);
    root.addEventListener('keydown', e => { if((e.key === 'Enter' || e.key === ' ') && e.target.classList && e.target.classList.contains('jv-an')){ e.preventDefault(); select(e.target.dataset.id); } });
    animalsEl.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove); window.addEventListener('pointerup', onUp); window.addEventListener('pointercancel', onUp);
    window.addEventListener('resize', layout); window.addEventListener('orientationchange', () => setTimeout(layout, 250));
    document.addEventListener('keydown', e => { if(!opened || e.key !== 'Escape') return; if(layer.firstChild){ closeLayer(); e.stopPropagation(); } else close(); }, true);
  }
  function layout(){
    if(!opened) return;
    const wrap = root.querySelector('#jvWrap'), aw = wrap.clientWidth - 8, ah = wrap.clientHeight - 8;
    let w = Math.min(aw, ah * 16 / 9), h = w * 9 / 16;
    stage.style.width = w + 'px'; stage.style.height = h + 'px'; stage.style.setProperty('--u', (w / 100) + 'px');
    const portrait = matchMedia('(pointer:coarse)').matches && innerHeight > innerWidth && !orientSkipped;
    root.querySelector('#jv-orient').classList.toggle('on', portrait);
  }
  const sizeOf = a => { const sp = spOf(a.species), p = 0.7 + 0.5 * clamp((a.y - 45) / 52, 0, 1); return 13 * sp.scale * p; };
  const flipOf = a => a.x > 50;

  function anHTML(a){
    const sp = spOf(a.species), w = sizeOf(a), isMine = mine(a);
    const tag = a.voice_status === 'approved' ? ' 🔊' : '';
    return `<div class="jv-an${flipOf(a) ? ' flip' : ''}${isMine ? ' mine' : ''}${selId === a.id ? ' sel' : ''}" data-id="${a.id}" role="button" tabindex="0" aria-label="${esc(a.name)} the ${sp.name}, owned by ${esc(a.owner_name)}" style="left:${a.x}%;top:${a.y}%;width:calc(var(--u) * ${w.toFixed(2)});z-index:${Math.round(a.y * 10)}">
      <div class="jv-body" style="animation-delay:-${(hash(a.id) % 28) / 10}s"><div class="jv-flip">${Art.animal(a.species)}</div></div><span class="jv-tag">${esc(a.name)}${tag}</span></div>`;
  }
  function drawAnimals(){
    if(dragging) return;
    animalsEl.innerHTML = list.map(anHTML).join('');
    const hint = root.querySelector('#jvHint');
    if(off) hint.textContent = '';
    else if(mode === 'move') hint.textContent = '✋ Drag your animal to a new spot, then tap Done';
    else hint.textContent = list.length ? 'Tap an animal to meet it' : (loaded ? 'The park is empty. Be the first to adopt an animal!' : 'Loading…');
    drawBtns();
  }
  function drawBtns(){
    const b = root.querySelector('#jvBtns'); let h = '';
    if(mode === 'move') h = '<button class="jv-btn gold" data-a="done" type="button">✔ Done</button>';
    else {
      const n = me ? list.filter(a => String(a.owner_id) === String(me.id)).length : 0;
      if(!off) h += `<button class="jv-btn" data-a="adopt" type="button">＋ Adopt${me ? ' (' + n + '/' + MAX + ')' : ''}</button>`;
    }
    b.innerHTML = h;
  }

  /* ---------- load ---------- */
  async function load(quiet){
    try{ list = await rpc('jeevlok_list') || []; off = false; }
    catch(e){ if(e.status === 404){ off = true; list = []; } else if(!quiet) toast('Could not load the park. ' + e.message); }
    loaded = true; me = identity();
    drawAnimals();
    if(off) layer.innerHTML = `<div class="jv-modal"><div class="jv-box"><h3>Jeevlok is not switched on yet</h3><p>The teacher needs to run <b>jeevlok-setup.sql</b> in Supabase once.</p><div class="jv-row"><button class="jv-btn" data-a="exit" type="button">Back</button></div></div></div>`;
    if(selId && !find(selId)){ selId = null; closeLayer(); }
  }

  /* ---------- toast / layer ---------- */
  function toast(t){ const old = root.querySelector('.jv-toast'); if(old) old.remove(); const d = document.createElement('div'); d.className = 'jv-toast'; d.textContent = t; root.querySelector('#jvWrap').appendChild(d); clearTimeout(toastT); toastT = setTimeout(() => d.remove(), 2600); }
  function closeLayer(){ layer.innerHTML = ''; if(selId){ selId = null; if(!dragging) drawAnimals(); } }
  const say = (t, cls) => { const e = layer.querySelector('.jv-msg'); if(e){ e.textContent = t || ''; e.className = 'jv-msg' + (cls ? ' ' + cls : ''); } };

  /* ---------- animal card ---------- */
  function select(id){
    const a = find(id); if(!a) return;
    if(mode === 'move') return;
    selId = id; drawAnimals(); card(a); speak(a, true);
  }
  function voiceChip(a){
    if(a.voice_status === 'approved') return '<span class="jv-chip">🔊 Has a voice</span>';
    return '<span class="jv-chip off">🔇 No voice yet</span>';
  }
  function card(a){
    const sp = spOf(a.species), isMine = mine(a), t = !!session();
    const date = new Date(a.created_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
    const av = a.owner_photo ? '<img src="' + esc(a.owner_photo) + '" alt="">' : esc((a.owner_name || '?').trim()[0] || '?').toUpperCase();
    const canHear = a.voice_status === 'approved';
    layer.innerHTML = `<div class="jv-card" role="dialog" aria-label="${esc(a.name)}"><button class="jv-x" data-a="close" type="button" aria-label="Close">✕</button>
      <div class="jv-head"><div class="jv-ico">${Art.animal(a.species)}</div><div><h3>${esc(a.name)}</h3><span class="jv-chip">${sp.emoji} ${sp.name}</span></div></div>
      <div>${voiceChip(a)}<span class="jv-chip off">📅 Added ${esc(date)}</span></div>
      <button class="jv-owner" data-a="owner" type="button" aria-label="Open owner's profile"><div class="jv-ownav">${av}</div><div><b>${isMine ? 'You own this animal' : 'Owned by ' + esc(a.owner_name)}</b><small>${isMine ? esc(a.owner_name) + ' · ' : ''}Class ${esc(a.owner_cls)}${a.owner_pronouns ? ' · ' + esc(a.owner_pronouns) : ''} · tap to see profile</small></div></button>
      <div class="jv-row"><button class="jv-btn" data-a="hear" type="button">${canHear ? '▶ Hear ' + esc(a.name) : '👆 Say hi'}</button></div>
      ${isMine ? `<div class="jv-field"><label for="jvRename">Name</label><div style="display:flex;gap:6px"><input id="jvRename" maxlength="20" value="${esc(a.name)}" autocomplete="off"><button class="jv-btn" data-a="rename" type="button">Save</button></div></div>
      <div class="jv-row"><button class="jv-btn ghost" data-a="record" type="button">🎙 ${a.voice_status === 'approved' ? 'Change voice' : 'Record voice'}</button><button class="jv-btn ghost" data-a="move" type="button">📍 Move</button><button class="jv-btn warn" data-a="release" type="button">Release</button></div>` : ''}
      ${t ? `<div class="jv-row"><button class="jv-btn warn" data-a="tremove" type="button">🛡 Remove animal</button></div>` : ''}
      <p class="jv-msg" role="status" aria-live="polite"></p></div>`;
  }

  /* ---------- sound ---------- */
  function ac(){ if(!audioCtx){ const C = window.AudioContext || window.webkitAudioContext; if(!C) return null; audioCtx = new C(); } if(audioCtx.state === 'suspended') audioCtx.resume(); return audioCtx; }
  const b64ToBuf = b64 => { const bin = atob(b64), n = bin.length, u = new Uint8Array(n); for(let i = 0; i < n; i++) u[i] = bin.charCodeAt(i); return u.buffer; };
  const decode = buf => new Promise((res, rej) => { const c = ac(); if(!c) return rej(new Error('no audio')); const p = c.decodeAudioData(buf, res, rej); if(p && p.then) p.then(res, rej); });
  async function voiceFor(a, force){
    const sig = a.voice_updated_at + '|' + a.voice_status;
    if(!force && voices[a.id] && voices[a.id].sig === sig) return voices[a.id];
    const rows = await rpc('jeevlok_voice', {p_animal:a.id});
    if(!rows || !rows[0]) return null;
    const v = {sig, buf:await decode(b64ToBuf(rows[0].b64)), rate:rows[0].rate || 1};
    voices[a.id] = v; return v;
  }
  function playBuf(buf, rate, el){
    const c = ac(); if(!c) return 0;
    const s = c.createBufferSource(); s.buffer = buf; s.playbackRate.value = rate; s.connect(c.destination); s.start();
    const dur = buf.duration / rate; if(el) talk(el, dur); return dur;
  }
  function talk(el, secs){
    el.classList.add('talk');
    const n = Math.min(6, Math.max(2, Math.round(secs * 2)));
    for(let i = 0; i < n; i++) setTimeout(() => { const d = document.createElement('span'); d.className = 'jv-note'; d.textContent = ['♪', '♫', '♬'][i % 3]; d.style.setProperty('--dx', (Math.random() * 60 - 30) + 'px'); d.style.marginLeft = (Math.random() * 30 - 15) + '%'; el.appendChild(d); setTimeout(() => d.remove(), 1500); }, i * (secs * 1000 / n));
    setTimeout(() => el.classList.remove('talk'), secs * 1000 + 100);
  }
  const anEl = id => animalsEl.querySelector('[data-id="' + id + '"]');
  async function speak(a, auto){
    const el = anEl(a.id);
    if(a.voice_status !== 'approved'){
      if(el){ el.classList.add('talk'); setTimeout(() => el.classList.remove('talk'), 450); }
      if(!auto) say('🔇 ' + a.name + ' has no voice yet.');
      return;
    }
    try{ ac(); const v = await voiceFor(a); if(!v){ say('🔇 No voice yet.'); return; } playBuf(v.buf, v.rate, anEl(a.id)); }
    catch(e){ say('❌ ' + (e.message || 'Could not play the voice.'), 'err'); }
  }

  /* ---------- actions ---------- */
  function onClick(e){
    const an = e.target.closest('.jv-an'); if(an && !e.target.closest('[data-a]')){ if(!dragMoved) select(an.dataset.id); return; }
    if(e.target.classList.contains('jv-modal') && e.target === e.target){ closeLayer(); return; }
    const b = e.target.closest('[data-a]'); if(!b) return;
    const a = b.dataset.a, an2 = selId ? find(selId) : null;
    if(a === 'exit') return close();
    if(a === 'close') return closeLayer();
    if(a === 'hear' && an2) return speak(an2);
    if(a === 'owner' && an2){ if(window.Profiles) window.Profiles.open(an2.owner_id); else toast('Owner: ' + an2.owner_name); return; }
    if(a === 'adopt') return openAdopt();
    if(a === 'pick'){ adoptSp = b.dataset.s; layer.querySelectorAll('.jv-sp').forEach(x => x.classList.toggle('on', x === b)); const n = layer.querySelector('#jvNewName'); if(n && !n.value) n.placeholder = spOf(adoptSp).name + ' name'; return; }
    if(a === 'doadopt') return doAdopt();
    if(a === 'rename' && an2) return doRename(an2);
    if(a === 'move' && an2){ closeLayerKeep(); mode = 'move'; moveId = an2.id; drawAnimals(); toast('Drag ' + an2.name + ' to a new spot'); return; }
    if(a === 'done'){ mode = 'view'; moveId = null; drawAnimals(); return; }
    if(a === 'release' && an2) return doRelease(an2);
    if(a === 'record' && an2) return openRecorder(an2);
    if(a === 'tremove' && an2) return teacherRemove(an2);
    if(a === 'autorot') return tryRotate();
    if(a === 'skiporient'){ orientSkipped = true; layout(); return; }
    if(a === 'rec-start') return recStart();
    if(a === 'rec-stop') return recStop(true);
    if(a === 'rec-again') return openRecorder(find(recFor));
    if(a === 'rec-play') return recPlay();
    if(a === 'rec-save') return recSave();
    if(a === 'style'){ recStyle = parseFloat(b.dataset.r); layer.querySelectorAll('[data-a=style]').forEach(x => x.classList.toggle('on', x === b)); return; }
    if(a === 'unlock') return doUnlock();
  }
  let adoptSp = '', moveId = null, dragMoved = false;
  const closeLayerKeep = () => { layer.innerHTML = ''; };
  const guardMember = () => { if(me) return true; layer.innerHTML = `<div class="jv-modal"><div class="jv-box"><button class="jv-x" data-a="close" type="button" aria-label="Close">✕</button><h3>You need a profile to adopt 🐾</h3><p>Join श्री राम परिवार (or tap <b>This is me</b> on your profile in the members list), then come back. Anyone can still visit the park and meet the animals.</p><div class="jv-row"><button class="jv-btn" data-a="gomembers" type="button">Go to members</button></div></div></div>`; layer.querySelector('[data-a=gomembers]').onclick = () => { close(); const m = document.getElementById('members'); if(m) m.scrollIntoView({behavior:'smooth'}); }; return false; };

  function openAdopt(){
    if(off) return; me = identity(); if(!guardMember()) return;
    const n = list.filter(a => String(a.owner_id) === String(me.id)).length;
    if(n >= MAX){ toast('You already have ' + MAX + ' animals. Release one to adopt another.'); return; }
    adoptSp = '';
    if(!getPass()) return openGate(openAdopt);
    layer.innerHTML = `<div class="jv-modal"><div class="jv-box" role="dialog" aria-label="Adopt an animal"><button class="jv-x" data-a="close" type="button" aria-label="Close">✕</button><h3>Adopt an animal 🐾</h3><div style="font-size:13px;opacity:.75">Pick one, give it a name, then drag it to its spot in the park. (${n}/${MAX} adopted)</div>
      <div class="jv-grid">${Art.SPECIES.map(s => `<button class="jv-sp" data-a="pick" data-s="${s.id}" type="button"><div class="jv-spi">${Art.animal(s.id)}</div>${s.emoji} ${s.name}</button>`).join('')}</div>
      <div class="jv-field"><label for="jvNewName">Name your animal</label><input id="jvNewName" maxlength="20" autocomplete="off" placeholder="e.g. Mitthu"></div>
      <div class="jv-row"><button class="jv-btn" data-a="doadopt" type="button" id="jvDoAdopt">Adopt & place</button></div><p class="jv-msg" role="status" aria-live="polite"></p></div></div>`;
  }
  const getPass = () => ls('jvPass') || '';
  let afterGate = null;
  function openGate(next){
    afterGate = next;
    layer.innerHTML = `<div class="jv-modal"><div class="jv-box" role="dialog" aria-label="Group chat password"><button class="jv-x" data-a="close" type="button" aria-label="Close">✕</button><h3>🔒 Group chat members only</h3><div style="font-size:13px;opacity:.8">Adopting animals is for people who are in the group chat. Type the group chat password once; this phone will remember it.</div>
      <div class="jv-field"><label for="jvPass">Group chat password</label><input id="jvPass" type="password" autocomplete="off" autocapitalize="off"></div>
      <div class="jv-row"><button class="jv-btn" data-a="unlock" type="button" id="jvUnlock">Unlock</button></div><p class="jv-msg" role="status" aria-live="polite"></p></div></div>`;
    const i = layer.querySelector('#jvPass'); i.addEventListener('keydown', e => { if(e.key === 'Enter') doUnlock(); }); setTimeout(() => i.focus(), 50);
  }
  async function doUnlock(){
    const v = (layer.querySelector('#jvPass').value || '').trim(); if(!v) return say('❌ Type the password.', 'err');
    const b = layer.querySelector('#jvUnlock'); b.disabled = true;
    try{
      const ok = await rpc('jeevlok_check_pass', {p_pass:v});
      if(!ok){ b.disabled = false; return say('❌ ' + ERR.wrong_password, 'err'); }
      try{ localStorage.setItem('jvPass', v); }catch(e){}
      const n = afterGate; afterGate = null; if(n) n();
    }catch(e){ b.disabled = false; say('❌ ' + e.message, 'err'); }
  }
  async function doAdopt(){
    if(busy) return; const name = (layer.querySelector('#jvNewName').value || '').trim();
    if(!adoptSp) return say('❌ Tap an animal first.', 'err'); if(!name) return say('❌ Give your animal a name.', 'err');
    busy = true; const btn = layer.querySelector('#jvDoAdopt'); btn.disabled = true; btn.textContent = 'Adopting…';
    try{
      const x = 30 + Math.round(Math.random() * 40), y = 62 + Math.round(Math.random() * 20);
      const id = await rpc('jeevlok_add', Object.assign(own(), {p_species:adoptSp, p_name:name, p_x:x, p_y:y, p_pass:getPass()}));
      await load(true); layer.innerHTML = ''; mode = 'move'; moveId = id; selId = null; drawAnimals(); toast('🎉 ' + name + ' is here! Drag it to its spot, then tap Done.');
    }catch(e){
      if(e.code === 'wrong_password'){ try{ localStorage.removeItem('jvPass'); }catch(x){} busy = false; return openGate(openAdopt); }
      say('❌ ' + e.message, 'err'); btn.disabled = false; btn.textContent = 'Adopt & place';
    }
    busy = false;
  }
  async function doRename(a){
    const v = (layer.querySelector('#jvRename').value || '').trim(); if(!v) return say('❌ Please type a name.', 'err');
    try{ await rpc('jeevlok_update', Object.assign(own(), {p_animal:a.id, p_name:v, p_x:a.x, p_y:a.y})); await load(true); const n = find(a.id); if(n){ card(n); say('✅ Renamed!', 'ok'); } }
    catch(e){ say('❌ ' + e.message, 'err'); }
  }
  async function doRelease(a){
    if(!confirm('Release ' + a.name + '? This also deletes its recorded voice for good.')) return;
    try{ await rpc('jeevlok_remove', Object.assign(own(), {p_animal:a.id})); delete voices[a.id]; selId = null; layer.innerHTML = ''; await load(true); toast(a.name + ' was released 🕊'); }
    catch(e){ say('❌ ' + e.message, 'err'); }
  }
  async function teacherRemove(a){
    if(!confirm('Remove ' + a.name + ' (owner ' + a.owner_name + ') from the park?')) return;
    try{ await rpc('jeevlok_teacher_remove', {p_animal:a.id}, tAuth()); selId = null; layer.innerHTML = ''; await load(true); toast('Removed.'); }
    catch(e){ say('❌ ' + e.message, 'err'); }
  }

  /* ---------- drag to place ---------- */
  function onDown(e){
    if(mode !== 'move') { dragMoved = false; return; }
    const el = e.target.closest('.jv-an'); if(!el || el.dataset.id !== moveId) return;
    e.preventDefault(); dragMoved = false;
    const a = find(moveId); dragging = {el, a, sx:e.clientX, sy:e.clientY}; el.classList.add('dragging');
    try{ el.setPointerCapture(e.pointerId); }catch(x){}
  }
  function onMove(e){
    if(!dragging) return; const r = stage.getBoundingClientRect();
    if(Math.abs(e.clientX - dragging.sx) + Math.abs(e.clientY - dragging.sy) > 4) dragMoved = true;
    const x = clamp((e.clientX - r.left) / r.width * 100, 4, 96), y = clamp((e.clientY - r.top) / r.height * 100, 46, 96);
    dragging.a.x = +x.toFixed(1); dragging.a.y = +y.toFixed(1);
    const el = dragging.el; el.style.left = dragging.a.x + '%'; el.style.top = dragging.a.y + '%'; el.style.zIndex = 99999;
    el.style.width = 'calc(var(--u) * ' + sizeOf(dragging.a).toFixed(2) + ')'; el.classList.toggle('flip', flipOf(dragging.a));
  }
  async function onUp(){
    if(!dragging) return; const d = dragging; dragging = null; d.el.classList.remove('dragging');
    const a = d.a; setTimeout(() => { dragMoved = false; }, 60);
    try{ await rpc('jeevlok_update', Object.assign(own(), {p_animal:a.id, p_name:a.name, p_x:a.x, p_y:a.y})); }
    catch(e){ toast('❌ ' + e.message); await load(true); }
    drawAnimals();
  }

  /* ---------- recorder ---------- */
  let recFor = '', rec = null, recData = null, recStyle = 1, recTimer = null, recPlaying = false;
  function recStopTracks(){ if(!rec) return; try{ rec.proc.disconnect(); rec.src.disconnect(); }catch(e){} try{ rec.stream.getTracks().forEach(t => t.stop()); }catch(e){} try{ rec.ctx.close(); }catch(e){} clearInterval(recTimer); }
  function openRecorder(a){
    if(!a) return; recFor = a.id; recData = null; recStyle = a.voice_rate && a.voice_status !== 'none' ? a.voice_rate : 1;
    layer.innerHTML = `<div class="jv-modal"><div class="jv-box" role="dialog" aria-label="Record a voice"><button class="jv-x" data-a="close" type="button" aria-label="Close">✕</button>
      <h3>🎙 ${esc(a.name)}'s voice</h3><div style="font-size:13px;opacity:.8">Record up to ${REC_SECS} seconds. Say anything: "Hello!" or a parrot squawk. Everyone who taps your animal hears it. A new recording replaces the old one for good.</div>
      <div id="jvRecBody"></div><p class="jv-msg" role="status" aria-live="polite"></p></div></div>`;
    recIdle();
  }
  const recBody = h => { const b = layer.querySelector('#jvRecBody'); if(b) b.innerHTML = h; };
  function recIdle(){ recBody(`<div class="jv-big" id="jvTime">0.0 s</div><div class="jv-meter"><b id="jvLvl"></b></div><div class="jv-row" style="justify-content:center"><button class="jv-btn" data-a="rec-start" type="button">● Start recording</button></div>`); }
  async function recStart(){
    say('');
    if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || !(window.AudioContext || window.webkitAudioContext)) return say('❌ This browser cannot record here. Try Chrome or Safari on the https website.', 'err');
    let stream; try{ stream = await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true, noiseSuppression:true, autoGainControl:true}}); }
    catch(e){ return say('❌ Microphone blocked. Allow the microphone for this website and try again.', 'err'); }
    const C = window.AudioContext || window.webkitAudioContext, ctx = new C(), src = ctx.createMediaStreamSource(stream), proc = ctx.createScriptProcessor(4096, 1, 1), mute = ctx.createGain(); mute.gain.value = 0;
    rec = {stream, ctx, src, proc, chunks:[], t0:performance.now(), peak:0};
    const R = rec; proc.onaudioprocess = e => { const d = e.inputBuffer.getChannelData(0), c = new Float32Array(d); R.chunks.push(c); let m = 0; for(let i = 0; i < c.length; i++){ const v = Math.abs(c[i]); if(v > m) m = v; } R.peak = m; };
    src.connect(proc); proc.connect(mute); mute.connect(ctx.destination);
    recBody(`<div class="jv-big" id="jvTime">0.0 s</div><div class="jv-meter"><b id="jvLvl"></b></div><div class="jv-row" style="justify-content:center"><button class="jv-btn warn" data-a="rec-stop" type="button">■ Stop</button></div>`);
    recTimer = setInterval(() => { if(!rec) return; const s = (performance.now() - rec.t0) / 1000, t = layer.querySelector('#jvTime'), l = layer.querySelector('#jvLvl'); if(t) t.textContent = Math.min(s, REC_SECS).toFixed(1) + ' s'; if(l) l.style.width = Math.min(100, rec.peak * 160) + '%'; if(s >= REC_SECS) recStop(true); }, 80);
  }
  function recStop(){
    if(!rec) return; const r = rec; rec = null; recStopTracks();
    const total = r.chunks.reduce((n, c) => n + c.length, 0), all = new Float32Array(total); let o = 0; r.chunks.forEach(c => { all.set(c, o); o += c.length; });
    const out = processPCM(all, r.ctx.sampleRate);
    if(!out){ say('❌ I could not hear anything. Speak closer to the microphone and try again.', 'err'); return recIdle(); }
    recData = out; recReview();
  }
  function processPCM(f, sr){
    let peak = 0; for(let i = 0; i < f.length; i++){ const v = Math.abs(f[i]); if(v > peak) peak = v; }
    if(peak < 0.02) return null;
    const th = peak * 0.12; let s = 0, e = f.length - 1; while(s < f.length && Math.abs(f[s]) < th) s++; while(e > s && Math.abs(f[e]) < th) e--;
    s = Math.max(0, s - Math.round(sr * 0.06)); e = Math.min(f.length - 1, e + Math.round(sr * 0.12));
    const seg = f.subarray(s, e + 1), n = Math.floor(seg.length * RATE_HZ / sr); if(n < RATE_HZ * 0.3) return null;
    const out = new Int16Array(n), k = sr / RATE_HZ, g = 0.92 / peak;
    for(let i = 0; i < n; i++){ const p = i * k, i0 = Math.floor(p), fr = p - i0, a0 = seg[i0] || 0, a1 = seg[Math.min(seg.length - 1, i0 + 1)] || 0; out[i] = Math.round(clamp((a0 + (a1 - a0) * fr) * g, -1, 1) * 32767); }
    return {pcm:out, secs:n / RATE_HZ};
  }
  function wavBytes(pcm){
    const n = pcm.length, b = new ArrayBuffer(44 + n * 2), v = new DataView(b), w = (o, s) => { for(let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };
    w(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); w(8, 'WAVE'); w(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, RATE_HZ, true); v.setUint32(28, RATE_HZ * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, n * 2, true);
    for(let i = 0; i < n; i++) v.setInt16(44 + i * 2, pcm[i], true); return new Uint8Array(b);
  }
  const toB64 = u8 => { let s = ''; for(let i = 0; i < u8.length; i += 0x8000) s += String.fromCharCode.apply(null, u8.subarray(i, i + 0x8000)); return btoa(s); };
  function recReview(){
    const a = find(recFor);
    recBody(`<div class="jv-big">${recData.secs.toFixed(1)} s ✔</div><div style="text-align:center;font-size:13px;opacity:.8">Pick how ${esc(a ? a.name : 'it')} sounds, then listen:</div>
      <div class="jv-styles">${STYLES.map(s => `<button class="jv-btn ghost${Math.abs(s.r - recStyle) < 0.01 ? ' on' : ''}" data-a="style" data-r="${s.r}" type="button">${s.n}</button>`).join('')}</div>
      <div class="jv-row" style="justify-content:center"><button class="jv-btn" data-a="rec-play" type="button">▶ Listen</button><button class="jv-btn ghost" data-a="rec-again" type="button">↺ Record again</button><button class="jv-btn gold" data-a="rec-save" type="button" id="jvRecSave">Save voice</button></div>`);
  }
  async function recPlay(){
    if(!recData) return; const c = ac(); if(!c) return;
    const buf = c.createBuffer(1, recData.pcm.length, RATE_HZ), ch = buf.getChannelData(0); for(let i = 0; i < ch.length; i++) ch[i] = recData.pcm[i] / 32768;
    playBuf(buf, recStyle, anEl(recFor));
  }
  async function recSave(){
    if(busy || !recData) return; busy = true; const btn = layer.querySelector('#jvRecSave'); btn.disabled = true; btn.textContent = 'Saving…';
    try{
      await rpc('jeevlok_set_voice', Object.assign(own(), {p_animal:recFor, p_b64:toB64(wavBytes(recData.pcm)), p_mime:'audio/wav', p_secs:+recData.secs.toFixed(2), p_rate:recStyle}));
      delete voices[recFor]; await load(true); const a = find(recFor);
      layer.innerHTML = ''; selId = recFor; drawAnimals(); if(a) card(a); say('✅ Saved! Everyone can hear it now. Tap Hear to try it.', 'ok');
    }catch(e){ say('❌ ' + e.message, 'err'); btn.disabled = false; btn.textContent = 'Save voice'; }
    busy = false;
  }

  /* ---------- open / close ---------- */
  async function tryRotate(){
    try{ if(root.requestFullscreen && !document.fullscreenElement){ await root.requestFullscreen(); weFullscreen = true; } }catch(e){}
    try{ if(screen.orientation && screen.orientation.lock) await screen.orientation.lock('landscape'); }catch(e){}
    setTimeout(layout, 300);
  }
  async function open(){
    if(!root) build();
    opened = true; orientSkipped = false; root.classList.add('on'); document.body.style.overflow = 'hidden';
    layout(); setTimeout(layout, 120);
    me = identity(); mode = 'view'; selId = null; layer.innerHTML = ''; loaded = false; drawAnimals();
    await load();
    clearInterval(poll); poll = setInterval(() => { if(opened && !dragging && mode === 'view' && !layer.firstChild && !document.hidden) load(true); }, 30000);
  }
  function close(){
    if(!root) return; recStopTracks(); rec = null; clearInterval(poll); opened = false; root.classList.remove('on'); document.body.style.overflow = ''; layer.innerHTML = ''; mode = 'view';
    try{ screen.orientation && screen.orientation.unlock && screen.orientation.unlock(); }catch(e){}
    try{ if(document.fullscreenElement && weFullscreen) document.exitFullscreen(); }catch(e){} weFullscreen = false;
  }

  /* ---------- entry button on the site (clones the RAM LAB / Games card so it matches) ---------- */
  function makeEntry(){
    if(document.querySelector('[data-jeevlok-btn]')) return true;
    const src = document.querySelector('[data-ramlab-btn]') || document.querySelector('[data-games-btn]'); if(!src) return false;
    const btn = src.cloneNode(true); ['data-ramlab-btn', 'data-games-btn'].forEach(a => btn.removeAttribute(a)); btn.setAttribute('data-jeevlok-btn', '1');
    btn.style.setProperty('--gm-accent', '#3ddc84');
    const rules = document.createElement('style'); rules.textContent = '[data-jeevlok-btn]::before,[data-jeevlok-btn]::after{background-color:#3ddc84!important;background-image:none!important}'; document.head.appendChild(rules);
    const w = document.createTreeWalker(btn, NodeFilter.SHOW_TEXT); let t;
    while((t = w.nextNode())){ const s = t.nodeValue.trim(); if(s === 'Games' || s === 'RAM LAB') t.nodeValue = 'Jeevlok'; else if(s === 'Play & compete' || s === 'Virtual science lab') t.nodeValue = 'Our animal park'; else if(s === '🎮' || s === '🔬') t.nodeValue = '🦜'; }
    const go = e => { e.preventDefault(); e.stopPropagation(); open(); };
    btn.addEventListener('click', go); btn.addEventListener('keydown', e => { if(e.key === 'Enter' || e.key === ' ') go(e); });
    ['touchstart', 'touchend'].forEach(ev => btn.addEventListener(ev, e => e.stopPropagation(), {passive:true}));
    src.parentNode.insertBefore(btn, src.nextSibling); return true;
  }
  function fallbackEntry(){
    if(document.querySelector('[data-jeevlok-btn]')) return;
    const b = document.createElement('button'); b.type = 'button'; b.setAttribute('data-jeevlok-btn', '1');
    b.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:9000;border:3px solid #111;border-radius:18px;background:#3ddc84;color:#111;font:800 14px system-ui;padding:12px 16px;box-shadow:4px 4px 0 #111';
    b.textContent = '🦜 Jeevlok'; b.addEventListener('click', () => open()); document.body.appendChild(b);
  }
  document.addEventListener('click', e => { const t = e.target.closest && e.target.closest('[data-jeevlok-open]'); if(t){ e.preventDefault(); open(); } });
  function init(){ let n = 0; (function f(){ if(makeEntry()) return; if(++n < 30) setTimeout(f, 500); else fallbackEntry(); })(); }
  if(document.readyState === 'complete') init(); else window.addEventListener('load', init);

  window.Jeevlok = {open, close, _state: () => ({list, me, mode, selId, off})};
  window.openJeevlok = open;
})();
