/* श्री राम परिवार: anyone can join. The newest 10 show in a swipe row; "See all" opens a searchable, paged list.
   Load AFTER notes-upload.js in index.html (it provides SUPABASE_URL / SUPABASE_KEY). */
(function(){
  const css = `
  #members .mb-hero{position:relative;overflow:hidden;display:flex;align-items:center;justify-content:space-between;gap:14px;padding:20px 18px;margin-bottom:14px;border-radius:22px;color:#fff;background:linear-gradient(135deg,var(--navy2,#063b72),var(--blue,#0b6fae));box-shadow:0 10px 26px rgba(0,0,0,.18)}
  #members .mb-hero::before,#members .mb-hero::after{content:"";position:absolute;border-radius:50%;background:rgba(255,255,255,.09)}
  #members .mb-hero::before{width:150px;height:150px;right:-40px;top:-60px}
  #members .mb-hero::after{width:90px;height:90px;left:42%;bottom:-48px}
  #members .mb-hero>div:first-child{position:relative;z-index:1}
  #members .mb-eyebrow{display:block;font-size:11px;font-weight:800;letter-spacing:.14em;color:var(--gold-light,#f3d58a)}
  #members .mb-hero h2{margin:4px 0 4px;font-size:26px;line-height:1.15;color:#fff!important}
  #members .mb-hero p{margin:0;font-size:13px;opacity:.92}
  #members .mb-stat{position:relative;z-index:1;flex:0 0 auto;text-align:center;min-width:74px;padding:10px 12px;border-radius:16px;background:rgba(255,255,255,.16);backdrop-filter:blur(4px)}
  #members .mb-stat b{display:block;font-size:26px;line-height:1}
  #members .mb-stat span{font-size:11px;font-weight:700;opacity:.9}
  .mb-row{display:flex;gap:12px;overflow-x:auto;padding:4px 2px 12px;scroll-snap-type:x proximity;scrollbar-width:none}
  .mb-row::-webkit-scrollbar{display:none}
  .mb-card{flex:0 0 148px;scroll-snap-align:start;position:relative;text-align:center;background:var(--card,#fff);color:var(--ink,#10243a);border:1px solid var(--line,#e8edf2);border-radius:22px;padding:20px 10px 14px;box-shadow:0 6px 18px rgba(0,0,0,.07);animation:mbIn .5s ease both;transition:transform .2s}
  .mb-card:active{transform:scale(.97)}
  @keyframes mbIn{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  .mb-av{width:86px;height:86px;margin:0 auto 10px;padding:3px;border-radius:50%;background:linear-gradient(135deg,var(--saffron,#f28a17),var(--blue,#0b6fae));box-shadow:0 4px 14px rgba(0,0,0,.2)}
  .mb-in{width:100%;height:100%;border-radius:50%;overflow:hidden;display:grid;place-items:center;font-size:30px;font-weight:800;color:#fff;background:linear-gradient(135deg,var(--blue,#0b6fae),color-mix(in srgb,var(--blue,#0b6fae) 60%,#000));border:2px solid var(--card,#fff)}
  .mb-in img{width:100%;height:100%;object-fit:cover;display:block}
  .mb-name{font-weight:800;font-size:14.5px;line-height:1.25;word-break:break-word}
  .mb-cls{display:inline-block;margin-top:7px;font-size:11px;font-weight:800;padding:3px 11px;border-radius:999px;background:color-mix(in srgb,var(--saffron,#f28a17) 22%,transparent)}
  .mb-date{display:block;margin-top:7px;font-size:11px;opacity:.65}
  .mb-new{position:absolute;top:9px;right:9px;background:#16a34a;color:#fff;font-size:9.5px;font-weight:800;padding:2px 8px;border-radius:999px}
  .mb-del{position:absolute;top:7px;left:7px;z-index:2;border:0;background:rgba(127,127,127,.25);color:inherit;width:28px;height:28px;border-radius:50%;cursor:pointer}
  .mb-hint{text-align:center;font-size:11.5px;opacity:.55;margin-top:-2px}
  .mb-empty{padding:22px;text-align:center;border:1.5px dashed var(--line,#cfd9e4);border-radius:16px;opacity:.8;width:100%}
  .mb-form{display:grid;gap:10px;margin-bottom:16px;padding:16px;border:1.5px dashed var(--saffron,#f28a17);border-radius:18px;background:color-mix(in srgb,var(--saffron,#f28a17) 8%,var(--card,#fff))}
  .mb-form b{font-size:13.5px}
  .mb-photo{display:flex;align-items:center;gap:8px;padding:12px 14px;border:1px solid var(--line,#d6dee8);border-radius:12px;font-weight:700;cursor:pointer;background:var(--card,#fff)}
  .mb-consent{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;line-height:1.4}
  .mb-consent input{margin-top:3px;width:auto}
  #mbMsg{margin:0;font-size:13px;font-weight:700}
  body.dark:not([data-theme]) .mb-card,body.dark:not([data-theme]) .mb-photo{background:#121c2d;border-color:#1f2c3f;color:#e6edf5}
  body.dark:not([data-theme]) .mb-in{border-color:#121c2d}
  body.dark:not([data-theme]) .mb-form{background:#101a2b}
  @media(min-width:700px){.mb-card{flex-basis:170px}}
  .mb-join{width:100%;margin-bottom:12px;font-size:15px}
  .mb-done{display:block;text-align:center;margin-bottom:12px;padding:12px;border-radius:14px;font-weight:800;font-size:14px;background:color-mix(in srgb,var(--saffron,#f28a17) 18%,transparent)}
  .mb-note{font-size:11.5px;opacity:.7;line-height:1.4}
  .mb-pv{display:none;width:64px;height:64px;border-radius:50%;object-fit:cover;border:3px solid var(--saffron,#f28a17)}
  .mb-allbtn{width:100%;margin:2px 0 4px;padding:12px;font-size:14px}
  .mb-allwrap{margin-top:10px;padding:14px;border-radius:20px;border:1px solid var(--line,#e8edf2);background:var(--card,#fff);box-shadow:0 6px 18px rgba(0,0,0,.06)}
  .mb-allwrap input[type=search]{width:100%;box-sizing:border-box;padding:12px 14px;border-radius:14px;font:inherit;font-size:15px}
  .mb-chips{display:flex;gap:8px;overflow-x:auto;padding:10px 0 2px;scrollbar-width:none}
  .mb-chips::-webkit-scrollbar{display:none}
  .mb-chip{flex:0 0 auto;border:1.5px solid var(--line,#d6dee8);background:transparent;color:inherit;font:inherit;font-weight:700;font-size:13px;padding:7px 13px;border-radius:999px;cursor:pointer;white-space:nowrap}
  .mb-chip.on{border-color:var(--saffron,#f28a17);background:color-mix(in srgb,var(--saffron,#f28a17) 22%,transparent)}
  .mb-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin-top:12px}
  .mb-grid .mb-card{flex:none;padding:16px 8px 12px;animation:none}
  .mb-grid .mb-av{width:70px;height:70px}
  .mb-grid .mb-in{font-size:24px}
  .mb-count{margin-top:10px;font-size:12px;font-weight:700;opacity:.65}
  .mb-more{width:100%;margin-top:12px}
  @media(min-width:600px){.mb-grid{grid-template-columns:repeat(3,1fr)}}
  @media(min-width:900px){.mb-grid{grid-template-columns:repeat(4,1fr)}}
  body.dark:not([data-theme]) .mb-allwrap{background:#121c2d;border-color:#1f2c3f}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const LATEST = 10, PAGE = 24;
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const session = () => { try{ const s = JSON.parse(localStorage.getItem('teacherSession') || 'null'); return s && Date.now() < s.expires_at ? s : null; }catch(e){ return null; } };
  const joinedRecently = () => { try{ return Date.now() - Number(localStorage.getItem('mbJoined') || 0) < 864e5; }catch(e){ return false; } };
  const mapRow = x => ({id:x.id, name:x.name, cls:String(x.cls), photo:x.photo_url, path:x.photo_path, created:x.created_at});

  let sec, items = [], byId = {}, total = 0, monthN = 0, loaded = false, teacherOn = false, formOpen = false, timer;
  const all = {open:false, rows:[], q:'', cls:'all', offset:0, count:0, busy:false};

  async function query(params, store){
    const r = await fetch(SUPABASE_URL + '/rest/v1/members?' + params, {headers:{apikey:SUPABASE_KEY, Prefer:'count=exact'}});
    if(!r.ok) throw new Error('load');
    const n = parseInt((r.headers.get('Content-Range') || '').split('/')[1], 10);
    const raw = await r.json();
    const rows = store === false ? [] : raw.map(mapRow);
    rows.forEach(m => { byId[m.id] = m; });
    return {rows, count: isNaN(n) ? raw.length : n};
  }

  function build(){
    const before = document.getElementById('materials');
    sec = document.createElement('section');
    sec.id = 'members'; sec.className = 'section';
    sec.innerHTML = '<div class="mb-hero"><div><span class="mb-eyebrow">NEW MEMBERS</span><h2>श्री राम परिवार</h2><p id="mbSub">हमारे बढ़ते परिवार में आपका स्वागत है 🙏</p></div><div class="mb-stat"><b id="mbNum">0</b><span>members</span></div></div><div id="mbJoinBox"></div><div class="mb-row" id="mbRow"></div><div class="mb-hint" id="mbHint">Swipe to meet the newest members →</div><div id="mbAllBox"></div>';
    if(before) before.parentNode.insertBefore(sec, before); else document.body.appendChild(sec);
    sec.addEventListener('click', e => {
      const d = e.target.closest('[data-del]'); if(d){ del(d.dataset.del); return; }
      if(e.target.closest('#mbOpen')){ formOpen = !formOpen; drawJoin(); return; }
      if(e.target.closest('#mbAllBtn')){ all.open = !all.open; drawAllBox(); if(all.open) loadAll(true); return; }
      const c = e.target.closest('[data-cls]'); if(c){ all.cls = c.dataset.cls; loadAll(true); return; }
      if(e.target.closest('#mbMore')) loadAll(false);
    });
    sec.addEventListener('input', e => {
      if(e.target.id !== 'mbSearch') return;
      clearTimeout(timer); timer = setTimeout(() => { all.q = e.target.value; loadAll(true); }, 350);
    });
  }

  function drawJoin(){
    const box = sec.querySelector('#mbJoinBox');
    if(joinedRecently() && !formOpen){ box.innerHTML = '<span class="mb-done">✅ आप अब श्री राम परिवार का हिस्सा हैं! 🙏</span>'; return; }
    if(!formOpen){ box.innerHTML = '<button class="primary-btn mb-join" id="mbOpen" type="button">🙏 परिवार से जुड़ें (Join us)</button>'; return; }
    box.innerHTML = `<div class="mb-form">
      <b>🙏 Join श्री राम परिवार</b>
      <input id="mbName" type="text" maxlength="40" placeholder="Your name (e.g. Aarav S.)" autocomplete="off">
      <select id="mbCls"><option value="">Select your class</option><option>8</option><option>9</option><option>10</option><option>11</option><option>12</option></select>
      <label class="mb-photo">📷 Add a photo (optional) <span id="mbPhotoName"></span><input id="mbPhoto" type="file" accept="image/*" hidden></label>
      <img class="mb-pv" id="mbPv" alt="">
      <input id="mbWeb" type="text" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px;opacity:0" aria-hidden="true">
      <label class="mb-consent"><input id="mbOk" type="checkbox"> I am a student of Shree Ram Classes (or a parent/guardian), and I agree to show this name and photo on the website.</label>
      <p class="mb-note">Tip: use your first name and last initial. Your name, class and photo will be visible to everyone.</p>
      <button class="primary-btn" id="mbAdd" type="button">Join now</button>
      <button class="download" id="mbOpen" type="button" style="background:transparent!important;color:inherit!important;border:1.5px solid var(--line,#cfd9e4)!important">Cancel</button>
      <p id="mbMsg"></p></div>`;
    const ph = box.querySelector('#mbPhoto');
    ph.onchange = () => {
      const f = ph.files[0], pv = box.querySelector('#mbPv');
      box.querySelector('#mbPhotoName').textContent = f ? '✅' : '';
      if(f){ pv.src = URL.createObjectURL(f); pv.style.display = 'block'; } else pv.style.display = 'none';
    };
    box.querySelector('#mbAdd').onclick = join;
  }

  function cardHTML(m, i){
    const date = new Date(m.created).toLocaleDateString('en-IN', {day:'numeric', month:'short'});
    const isNew = Date.now() - new Date(m.created).getTime() < 14 * 864e5;
    const av = m.photo ? '<img src="' + esc(m.photo) + '" alt="" loading="lazy">' : esc((m.name.trim()[0] || '?').toUpperCase());
    return `<div class="mb-card" style="animation-delay:${Math.min(i, 8) * 0.06}s">
      ${teacherOn ? '<button class="mb-del" type="button" data-del="' + m.id + '" aria-label="Remove">🗑</button>' : ''}
      ${isNew ? '<span class="mb-new">NEW</span>' : ''}
      <div class="mb-av"><div class="mb-in">${av}</div></div>
      <div class="mb-name">${esc(m.name)}</div>
      <span class="mb-cls">Class ${esc(m.cls)}</span>
      <small class="mb-date">Joined ${date}</small></div>`;
  }

  function draw(){
    const row = sec.querySelector('#mbRow');
    sec.querySelector('#mbNum').textContent = total;
    sec.querySelector('#mbSub').textContent = monthN ? '🎉 ' + monthN + ' new ' + (monthN === 1 ? 'member' : 'members') + ' joined this month' : 'हमारे बढ़ते परिवार में आपका स्वागत है 🙏';
    sec.querySelector('#mbHint').style.display = items.length > 2 ? '' : 'none';
    if(!loaded){ row.innerHTML = ''; return; }
    row.innerHTML = items.length ? items.map(cardHTML).join('') : '<div class="mb-empty">Be the first to join श्री राम परिवार! 🙏</div>';
    drawAllBox();
  }

  function drawAllBox(){
    const box = sec.querySelector('#mbAllBox');
    if(total <= LATEST){ box.innerHTML = ''; all.open = false; return; }
    if(!all.open){ box.innerHTML = '<button class="primary-btn mb-allbtn" id="mbAllBtn" type="button">👥 See all ' + total + ' members</button>'; return; }
    if(!box.querySelector('#mbSearch')){
      box.innerHTML = `<button class="primary-btn mb-allbtn" id="mbAllBtn" type="button">✕ Close member list</button>
        <div class="mb-allwrap"><input id="mbSearch" type="search" placeholder="🔍 Search by name…" autocomplete="off" value="${esc(all.q)}">
        <div class="mb-chips" id="mbChips"></div><div class="mb-count" id="mbCnt"></div><div class="mb-grid" id="mbGrid"></div><div id="mbMoreBox"></div></div>`;
    }
    drawAll();
  }

  function drawAll(){
    if(!all.open || !sec.querySelector('#mbGrid')) return;
    sec.querySelector('#mbChips').innerHTML = ['all','8','9','10','11','12'].map(c => `<button class="mb-chip${all.cls === c ? ' on' : ''}" type="button" data-cls="${c}">${c === 'all' ? 'All classes' : 'Class ' + c}</button>`).join('');
    sec.querySelector('#mbCnt').textContent = all.busy && !all.rows.length ? 'Loading…' : all.count + (all.count === 1 ? ' member' : ' members') + (all.q || all.cls !== 'all' ? ' found' : '');
    sec.querySelector('#mbGrid').innerHTML = all.rows.length ? all.rows.map(cardHTML).join('') : (all.busy ? '' : '<div class="mb-empty" style="grid-column:1/-1">Nobody found. Try another name or class.</div>');
    sec.querySelector('#mbMoreBox').innerHTML = all.rows.length < all.count ? '<button class="download mb-more" id="mbMore" type="button">' + (all.busy ? 'Loading…' : 'Load more') + '</button>' : '';
  }

  async function loadAll(reset){
    if(all.busy) return;
    all.busy = true;
    if(reset){ all.rows = []; all.offset = 0; }
    drawAll();
    const q = all.q.replace(/[^\p{L}\p{N} .'-]/gu, '').trim();
    let p = 'select=*&order=created_at.desc&limit=' + PAGE + '&offset=' + all.offset;
    if(q) p += '&name=ilike.' + encodeURIComponent('*' + q + '*');
    if(all.cls !== 'all') p += '&cls=eq.' + all.cls;
    try{ const r = await query(p); all.rows = all.rows.concat(r.rows); all.offset += r.rows.length; all.count = r.count; }catch(e){}
    all.busy = false; drawAll();
  }

  function cropSquare(file){
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(file), im = new Image();
      im.onload = () => {
        const s = Math.min(im.width, im.height), c = document.createElement('canvas'); c.width = c.height = 320;
        c.getContext('2d').drawImage(im, (im.width - s) / 2, (im.height - s) / 2, s, s, 0, 0, 320, 320);
        URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('photo')), 'image/jpeg', 0.82);
      };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('Could not open that photo.')); };
      im.src = url;
    });
  }

  async function load(){
    try{
      if(typeof SUPABASE_URL === 'undefined') throw new Error('no config');
      const a = await query('select=*&order=created_at.desc&limit=' + LATEST);
      items = a.rows; total = a.count;
      try{ monthN = (await query('select=id&limit=1&created_at=gte.' + encodeURIComponent(new Date(Date.now() - 30 * 864e5).toISOString()), false)).count; }catch(e){ monthN = 0; }
    }catch(e){ items = []; total = 0; monthN = 0; }
    loaded = true; draw();
    if(all.open) loadAll(true);
  }

  async function join(){
    const box = sec.querySelector('#mbJoinBox'), msg = box.querySelector('#mbMsg'), btn = box.querySelector('#mbAdd');
    if(box.querySelector('#mbWeb').value) return;
    const name = box.querySelector('#mbName').value.replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim();
    const cls = box.querySelector('#mbCls').value, file = box.querySelector('#mbPhoto').files[0];
    if(name.length < 2 || name.length > 40){ msg.textContent = '❌ Please enter your name (2 to 40 letters).'; return; }
    if(!cls){ msg.textContent = '❌ Please select your class.'; return; }
    if(!box.querySelector('#mbOk').checked){ msg.textContent = '❌ Please tick the permission box.'; return; }
    if(joinedRecently()){ msg.textContent = '✅ You have already joined. Welcome! 🙏'; return; }
    btn.disabled = true; btn.textContent = 'Joining…'; msg.textContent = '';
    try{
      let photo_url = null, photo_path = null;
      if(file){
        photo_path = 'p-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8) + '.jpg';
        const up = await fetch(SUPABASE_URL + '/storage/v1/object/member-photos/' + photo_path, {method:'POST', headers:{apikey:SUPABASE_KEY, 'Content-Type':'image/jpeg'}, body:await cropSquare(file)});
        if(!up.ok) throw new Error('Photo upload failed (' + up.status + ')');
        photo_url = SUPABASE_URL + '/storage/v1/object/public/member-photos/' + photo_path;
      }
      const r = await fetch(SUPABASE_URL + '/rest/v1/members', {method:'POST', headers:{apikey:SUPABASE_KEY, 'Content-Type':'application/json', Prefer:'return=minimal'}, body:JSON.stringify({name, cls, photo_url, photo_path})});
      if(!r.ok) throw new Error('Could not join (' + r.status + ')');
      try{ localStorage.setItem('mbJoined', String(Date.now())); localStorage.setItem('mbName', name); localStorage.setItem('mbCls', cls); }catch(e){}
      formOpen = false; drawJoin();
      sec.querySelector('#mbJoinBox').insertAdjacentHTML('afterbegin', '<span class="mb-done">🎉 स्वागत है, ' + esc(name) + '! आप श्री राम परिवार का हिस्सा बन गए। 🙏</span>');
      await load();
      sec.querySelector('#mbRow').scrollTo({left:0, behavior:'smooth'});
    }catch(e){ msg.textContent = '❌ ' + e.message; btn.disabled = false; btn.textContent = 'Join now'; }
  }

  async function del(id){
    const m = byId[id], s = session();
    if(!m) return;
    if(!s){ alert('Session expired. Please log in again in the Teacher Panel.'); return; }
    if(!confirm('Remove ' + m.name + '?')) return;
    try{
      const H = {apikey:SUPABASE_KEY, Authorization:'Bearer ' + s.access_token};
      const r = await fetch(SUPABASE_URL + '/rest/v1/members?id=eq.' + m.id, {method:'DELETE', headers:H});
      if(!r.ok) throw new Error('Delete failed (' + r.status + ')');
      if(m.path) await fetch(SUPABASE_URL + '/storage/v1/object/member-photos/' + m.path, {method:'DELETE', headers:H});
      delete byId[id]; load();
    }catch(e){ alert(e.message); }
  }

  function init(){
    build(); teacherOn = !!session(); drawJoin(); draw(); load();
    setInterval(() => { const t = !!session(); if(t !== teacherOn){ teacherOn = t; draw(); drawAll(); } }, 1500);
  }
  if(document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
