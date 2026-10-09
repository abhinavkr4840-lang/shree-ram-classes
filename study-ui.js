/* Study Material page redesign: search, tabs, class & subject chips, richer cards.
   Load it AFTER notes-upload.js in index.html. */
(function(){
  const css = `
  #materials .filters,#materials #materialList,#materials #emptyState{display:none!important}
  .su-wrap{display:grid;gap:12px}
  .su-search{position:relative}
  .su-search input{width:100%;padding:13px 40px 13px 42px;border-radius:14px;font:inherit;font-size:15px;box-sizing:border-box}
  .su-search i{position:absolute;left:14px;top:50%;transform:translateY(-50%);font-style:normal;opacity:.6}
  .su-search button{position:absolute;right:8px;top:50%;transform:translateY(-50%);border:0;background:transparent;font-size:16px;cursor:pointer;color:inherit;opacity:.6;display:none}
  .su-tabs{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;padding:5px;border-radius:14px;background:rgba(127,127,127,.12)}
  .su-tab{border:0;background:transparent;font:inherit;font-weight:800;font-size:12.5px;padding:10px 4px;border-radius:10px;cursor:pointer;color:inherit;opacity:.75}
  .su-tab small{display:block;font-weight:700;font-size:10.5px;opacity:.8}
  .su-tab.on{background:var(--card,#fff);opacity:1;box-shadow:0 2px 8px rgba(0,0,0,.12);color:var(--ink,#10243a)}
  .su-row{display:flex;gap:8px;overflow-x:auto;padding:2px 2px 4px;scrollbar-width:none;scroll-snap-type:x proximity}
  .su-row::-webkit-scrollbar{display:none}
  .su-chip{flex:0 0 auto;scroll-snap-align:start;border:1.5px solid var(--line,#e8edf2);background:var(--card,#fff);color:inherit;font:inherit;font-weight:700;font-size:13px;padding:8px 14px;border-radius:999px;cursor:pointer;white-space:nowrap}
  .su-chip.on{border-color:var(--saffron,#f28a17);background:color-mix(in srgb,var(--saffron,#f28a17) 22%,transparent)}
  .su-label{font-size:11px;font-weight:800;letter-spacing:.08em;opacity:.6;margin:2px 2px -4px}
  .su-count{display:flex;justify-content:space-between;align-items:center;font-size:13px;opacity:.75;font-weight:700}
  .su-count button{border:0;background:transparent;color:inherit;font:inherit;font-weight:800;text-decoration:underline;cursor:pointer}
  .su-list{display:grid;gap:10px}
  .su-card{display:flex;gap:12px;align-items:center;background:var(--card,#fff);border:1px solid var(--line,#e8edf2);border-left:5px solid var(--c);border-radius:16px;padding:12px;box-shadow:0 4px 14px rgba(0,0,0,.05)}
  .su-ico{flex:0 0 auto;width:48px;height:48px;border-radius:14px;display:grid;place-items:center;font-size:24px;background:color-mix(in srgb,var(--c) 18%,transparent)}
  .su-body{flex:1;min-width:0}
  .su-title{font-weight:800;font-size:14.5px;line-height:1.3;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word}
  .su-meta{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
  .su-meta span{font-size:10.5px;font-weight:800;padding:3px 8px;border-radius:999px;background:rgba(127,127,127,.15)}
  .su-meta span.c{background:color-mix(in srgb,var(--c) 22%,transparent)}
  .su-foot{margin-top:6px;font-size:11px;opacity:.65;display:flex;gap:8px;align-items:center}
  .su-new{background:#16a34a;color:#fff;font-weight:800;font-size:9.5px;padding:2px 7px;border-radius:999px;opacity:1}
  .su-act{flex:0 0 auto;display:flex;flex-direction:column;gap:6px;align-items:stretch}
  .su-act .download{margin:0!important;text-align:center;text-decoration:none;font-size:12.5px;padding:9px 12px;border-radius:11px;border:0;cursor:pointer;font-weight:800}
  .su-act .su-dl{background:transparent!important;border:1.5px solid var(--line,#cfd9e4)!important;color:inherit!important}
  .su-skel{height:78px;border-radius:16px;background:linear-gradient(90deg,rgba(127,127,127,.12),rgba(127,127,127,.24),rgba(127,127,127,.12));background-size:200% 100%;animation:suSh 1.2s infinite}
  @keyframes suSh{0%{background-position:200% 0}100%{background-position:-200% 0}}
  .su-empty{text-align:center;padding:30px 16px;border:1.5px dashed var(--line,#cfd9e4);border-radius:16px;opacity:.85}
  .su-empty b{display:block;font-size:34px;margin-bottom:6px}
  body.dark:not([data-theme]) .su-card,body.dark:not([data-theme]) .su-chip,body.dark:not([data-theme]) .su-tab.on{background:#121c2d;border-color:#1f2c3f;color:#e6edf5}
  body.dark:not([data-theme]) .su-card{border-left-color:var(--c)}
  body.dark:not([data-theme]) .su-search input{background:#121c2d;border-color:#26364d;color:#e6edf5}
  @media(min-width:700px){.su-list{grid-template-columns:1fr 1fr}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const SUBJ = {physics:['⚛️','#3b82f6'], chemistry:['🧪','#10b981'], mathematics:['📐','#f59e0b'], maths:['📐','#f59e0b'], math:['📐','#f59e0b'],
    biology:['🧬','#ec4899'], english:['📖','#8b5cf6'], 'computer science':['💻','#06b6d4'], hindi:['📜','#ef4444'], 'social science':['🌍','#84cc16'], science:['🔬','#14b8a6']};
  const subj = s => SUBJ[String(s || '').toLowerCase()] || ['📚', '#64748b'];
  const esc = t => String(t == null ? '' : t).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  let items = [], loaded = false, failed = false;
  const f = {q:'', type:'all', cls:'all', subject:'all'};
  let root, timer;

  function session(){
    try{ const s = JSON.parse(localStorage.getItem('teacherSession') || 'null'); return s && Date.now() < s.expires_at ? s : null; }catch(e){ return null; }
  }

  function build(){
    const sec = document.getElementById('materials');
    if(!sec) return false;
    root = document.createElement('div'); root.className = 'su-wrap';
    root.innerHTML = `
      <div class="su-search"><i>🔍</i><input id="suQ" type="search" placeholder="Search notes, papers, subjects…" autocomplete="off"><button type="button" id="suClr" aria-label="Clear">✕</button></div>
      <div class="su-tabs" id="suTabs"></div>
      <div class="su-label">CLASS</div><div class="su-row" id="suCls"></div>
      <div class="su-label">SUBJECT</div><div class="su-row" id="suSub"></div>
      <div class="su-count" id="suCount"></div>
      <div class="su-list" id="suList"></div>`;
    sec.appendChild(root);
    const q = root.querySelector('#suQ');
    q.addEventListener('input', () => { f.q = q.value.trim().toLowerCase(); root.querySelector('#suClr').style.display = q.value ? 'block' : 'none'; draw(); });
    root.querySelector('#suClr').onclick = () => { q.value = ''; f.q = ''; root.querySelector('#suClr').style.display = 'none'; draw(); };
    root.addEventListener('click', e => {
      const t = e.target.closest('[data-k]');
      if(t){ f[t.dataset.k] = t.dataset.v; draw(); return; }
      if(e.target.id === 'suReset'){ f.q = ''; f.type = f.cls = f.subject = 'all'; q.value = ''; draw(); return; }
      if(e.target.id === 'suRetry'){ refresh(true); return; }
      const d = e.target.closest('[data-del]'); if(d) del(d.dataset.del);
    });
    return true;
  }

  function draw(){
    if(!root) return;
    const tabs = [['all','All'],['notes','📚 Notes'],['papers','📝 Papers']];
    const cnt = k => items.filter(m => k === 'all' || m.type === k).length;
    root.querySelector('#suTabs').innerHTML = tabs.map(t => `<button class="su-tab${f.type === t[0] ? ' on' : ''}" data-k="type" data-v="${t[0]}">${t[1]}<small>${cnt(t[0])}</small></button>`).join('');
    root.querySelector('#suCls').innerHTML = ['all','8','9','10','11','12'].map(c => `<button class="su-chip${f.cls === c ? ' on' : ''}" data-k="cls" data-v="${c}">${c === 'all' ? 'All classes' : 'Class ' + c}</button>`).join('');
    const subs = [...new Set(items.map(m => m.subject))].sort();
    root.querySelector('#suSub').innerHTML = [['all','All subjects']].concat(subs.map(s => [s, subj(s)[0] + ' ' + s])).map(s => `<button class="su-chip${f.subject === s[0] ? ' on' : ''}" data-k="subject" data-v="${esc(s[0])}">${esc(s[1])}</button>`).join('');

    const list = root.querySelector('#suList'), count = root.querySelector('#suCount');
    if(!loaded){ count.textContent = ''; list.innerHTML = '<div class="su-skel"></div><div class="su-skel"></div><div class="su-skel"></div>'; return; }
    if(failed){ count.textContent = ''; list.innerHTML = '<div class="su-empty"><b>📡</b>Could not load material.<br><button class="download" id="suRetry" style="margin-top:10px">Try again</button></div>'; return; }

    const res = items.filter(m =>
      (f.type === 'all' || m.type === f.type) && (f.cls === 'all' || m.cls === f.cls) && (f.subject === 'all' || m.subject === f.subject) &&
      (!f.q || (m.title + ' ' + m.subject + ' class ' + m.cls).toLowerCase().includes(f.q)));
    const filtered = f.q || f.type !== 'all' || f.cls !== 'all' || f.subject !== 'all';
    count.innerHTML = '<span>' + res.length + ' item' + (res.length === 1 ? '' : 's') + '</span>' + (filtered ? '<button id="suReset" type="button">Clear filters</button>' : '');
    if(!res.length){
      list.innerHTML = '<div class="su-empty"><b>' + (items.length ? '🔎' : '📭') + '</b>' + (items.length ? 'Nothing matches your search.' : 'No material uploaded yet. Check back soon!') + '</div>';
      return;
    }
    const teacher = !!session();
    list.innerHTML = res.map(m => {
      const [emo, col] = subj(m.subject);
      const ext = (m.path.split('.').pop() || '').toLowerCase();
      const kind = ext === 'pdf' ? '📄 PDF' : /^(jpg|jpeg|png|webp|gif)$/.test(ext) ? '🖼️ Image' : /^docx?$/.test(ext) ? '📝 Word' : '📎 ' + ext.toUpperCase();
      const date = new Date(m.created).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'});
      const isNew = Date.now() - new Date(m.created).getTime() < 7 * 864e5;
      const dl = m.file + '?download=' + encodeURIComponent((m.title || 'material') + '.' + ext);
      return `<article class="su-card" style="--c:${col}">
        <div class="su-ico">${emo}</div>
        <div class="su-body">
          <div class="su-title">${esc(m.title)}</div>
          <div class="su-meta"><span class="c">Class ${esc(m.cls)}</span><span class="c">${esc(m.subject)}</span><span>${m.type === 'notes' ? '📚 Notes' : '📝 Paper'}</span><span>${kind}</span></div>
          <div class="su-foot"><span>📅 ${date}</span>${isNew ? '<span class="su-new">NEW</span>' : ''}</div>
        </div>
        <div class="su-act">
          <a class="download" href="${esc(m.file)}" target="_blank" rel="noopener">Open</a>
          <a class="download su-dl" href="${esc(dl)}">⬇ Save</a>
          ${teacher ? '<button class="download" type="button" data-del="' + m.id + '">🗑</button>' : ''}
        </div></article>`;
    }).join('');
  }

  async function del(id){
    const m = items.find(x => String(x.id) === String(id)), s = session();
    if(!m) return;
    if(!s){ alert('Session expired. Please log in again in the Teacher Panel.'); return; }
    if(!confirm('Delete "' + m.title + '"?')) return;
    try{
      const h = {apikey:SUPABASE_KEY, Authorization:'Bearer ' + s.access_token};
      const r = await fetch(SUPABASE_URL + '/rest/v1/materials?id=eq.' + m.id, {method:'DELETE', headers:h});
      if(!r.ok) throw new Error('Delete failed (' + r.status + ')');
      await fetch(SUPABASE_URL + '/storage/v1/object/materials/' + m.path, {method:'DELETE', headers:h});
      refresh(true);
    }catch(e){ alert(e.message); }
  }

  async function load(){
    try{
      if(typeof SUPABASE_URL === 'undefined') throw new Error('no config');
      const r = await fetch(SUPABASE_URL + '/rest/v1/materials?select=*&order=created_at.desc', {headers:{apikey:SUPABASE_KEY}});
      if(!r.ok) throw new Error('load');
      items = (await r.json()).map(x => ({id:x.id, title:x.title, cls:String(x.cls), subject:x.subject, type:x.type, file:x.file_url, path:x.file_path || x.file_url, created:x.created_at}));
      failed = false;
    }catch(e){ failed = true; }
    loaded = true; draw();
  }
  function refresh(now){ clearTimeout(timer); timer = setTimeout(load, now ? 0 : 300); }

  function init(){
    if(!build()) return;
    draw(); load();
    window.renderMaterials = () => refresh();   // runs after an upload, login or logout
    window.filterMaterials = () => {};
  }
  if(document.readyState === 'complete') init(); else window.addEventListener('load', init);
})();
