const SUPABASE_URL = "PASTE_PROJECT_URL_HERE";
const SUPABASE_KEY = "PASTE_PUBLISHABLE_KEY_HERE";
const TEACHER_EMAIL = "PASTE_TEACHER_EMAIL_HERE"; // hidden login email, teachers only type the password

/* Live notes: everyone can view, only the logged-in teacher can upload/delete */
(function(){
  const BUCKET = 'materials';
  const H = extra => Object.assign({apikey: SUPABASE_KEY}, extra || {});
  let session = null;
  try{ session = JSON.parse(localStorage.getItem('teacherSession') || 'null'); }catch(e){}
  const saveSession = s => { session = s; try{ s ? localStorage.setItem('teacherSession', JSON.stringify(s)) : localStorage.removeItem('teacherSession'); }catch(e){} };

  async function tokenRequest(grant, body){
    const r = await fetch(SUPABASE_URL + '/auth/v1/token?grant_type=' + grant, {method:'POST', headers:H({'Content-Type':'application/json'}), body:JSON.stringify(body)});
    const d = await r.json();
    if(!r.ok) throw new Error(d.error_description || d.msg || 'Login failed');
    return {access_token:d.access_token, refresh_token:d.refresh_token, expires_at:Date.now() + (d.expires_in - 60) * 1000};
  }
  async function getToken(){
    if(!session) throw new Error('Please log in first.');
    if(Date.now() > session.expires_at){
      try{ saveSession(await tokenRequest('refresh_token', {refresh_token:session.refresh_token})); }
      catch(e){ saveSession(null); updateUI(); throw new Error('Session expired. Please log in again.'); }
    }
    return session.access_token;
  }

  // ----- teacher panel UI -----
  const admin = document.getElementById('admin');
  const oldForm = document.getElementById('uploadForm');
  const form = oldForm.cloneNode(true);      // drops the old demo handler
  oldForm.replaceWith(form);
  const intro = admin.querySelector('.admin-intro');
  const msg = document.getElementById('uploadMessage');
  const show = t => { msg.hidden = false; msg.textContent = t; };

  const box = document.createElement('div');
  box.className = 'upload-form';
  box.innerHTML = '<input id="tPass" type="password" placeholder="Teacher password" autocomplete="current-password"><button class="primary-btn" id="tLogin" type="button">Login</button>';
  form.before(box);
  const out = document.createElement('button');
  out.className = 'primary-btn'; out.type = 'button'; out.textContent = 'Log out'; out.style.marginTop = '10px';
  form.after(out);

  function updateUI(){
    const on = !!session;
    box.style.display = on ? 'none' : '';
    form.style.display = on ? '' : 'none';
    out.style.display = on ? '' : 'none';
    intro.textContent = on ? 'Logged in. Upload notes and question papers below. Students see them instantly.' : 'Enter the teacher password to upload material.';
    renderMaterials();
  }

  box.querySelector('#tLogin').onclick = async () => {
    try{
      saveSession(await tokenRequest('password', {email:TEACHER_EMAIL, password:box.querySelector('#tPass').value}));
      box.querySelector('#tPass').value = '';
      msg.hidden = true; updateUI();
    }catch(e){ show('❌ ' + e.message); }
  };
  out.onclick = () => { saveSession(null); updateUI(); };

  // ----- list (with delete buttons for the teacher) -----
  window.renderMaterials = function(){
    const cls = document.getElementById('classFilter').value;
    const type = document.getElementById('typeFilter').value;
    const list = document.getElementById('materialList');
    const empty = document.getElementById('emptyState');
    const filtered = materials.filter(m => (cls === 'all' || m.cls === cls) && (type === 'all' || m.type === type));
    list.innerHTML = filtered.map(m => `
      <article class="material">
        <div class="material-icon">${m.type === 'notes' ? '📚' : '📝'}</div>
        <div class="material-main">
          <strong>${escapeHtml(m.title)}</strong>
          <small>Class ${escapeHtml(m.cls)} • ${escapeHtml(m.subject)} • ${m.type === 'notes' ? 'Notes' : 'Question Paper'}</small>
        </div>
        ${m.file === '#' ? '<a class="download" href="#" onclick="return false;">Demo</a>' : '<a class="download" href="' + escapeHtml(m.file) + '" target="_blank" rel="noopener">Open</a>'}
        ${session && m.id ? '<button class="download" type="button" data-del="' + m.id + '" style="margin-left:6px">🗑</button>' : ''}
      </article>`).join('');
    empty.hidden = filtered.length !== 0;
  };

  async function load(){
    try{
      const r = await fetch(SUPABASE_URL + '/rest/v1/materials?select=*&order=created_at.desc', {headers:H()});
      if(!r.ok) throw new Error('load');
      const rows = await r.json();
      materials.length = 0;
      rows.forEach(x => materials.push({id:x.id, title:x.title, cls:x.cls, subject:x.subject, type:x.type, file:x.file_url, path:x.file_path}));
    }catch(e){}
    renderMaterials();
  }

  document.getElementById('materialList').addEventListener('click', async e => {
    const b = e.target.closest('[data-del]'); if(!b) return;
    const m = materials.find(x => String(x.id) === b.dataset.del); if(!m) return;
    if(!confirm('Delete "' + m.title + '"?')) return;
    try{
      const t = await getToken();
      const r = await fetch(SUPABASE_URL + '/rest/v1/materials?id=eq.' + m.id, {method:'DELETE', headers:H({Authorization:'Bearer ' + t})});
      if(!r.ok) throw new Error('Delete failed (' + r.status + ')');
      await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + m.path, {method:'DELETE', headers:H({Authorization:'Bearer ' + t})});
      await load();
    }catch(err){ alert(err.message); }
  });

  // ----- upload -----
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const title = form.querySelector('#title').value.trim();
    const cls = form.querySelector('#uploadClass').value;
    const subject = form.querySelector('#subject').value;
    const type = form.querySelector('#uploadType').value;
    const file = form.querySelector('#file').files[0];
    if(!file) return;
    const btn = form.querySelector('button[type=submit]');
    btn.disabled = true; btn.textContent = 'Uploading…';
    try{
      const t = await getToken();
      const path = Date.now() + '-' + file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      let r = await fetch(SUPABASE_URL + '/storage/v1/object/' + BUCKET + '/' + path, {method:'POST', headers:H({Authorization:'Bearer ' + t, 'Content-Type':file.type || 'application/octet-stream'}), body:file});
      if(!r.ok) throw new Error('File upload failed (' + r.status + ')');
      r = await fetch(SUPABASE_URL + '/rest/v1/materials', {method:'POST', headers:H({Authorization:'Bearer ' + t, 'Content-Type':'application/json', Prefer:'return=minimal'}),
        body:JSON.stringify({title, cls, subject, type, file_url:SUPABASE_URL + '/storage/v1/object/public/' + BUCKET + '/' + path, file_path:path})});
      if(!r.ok) throw new Error('Saving details failed (' + r.status + ')');
      form.reset();
      show('✅ Published! Students can see it now.');
      await load();
      document.getElementById('materials').scrollIntoView({behavior:'smooth'});
    }catch(err){ show('❌ ' + err.message); }
    btn.disabled = false; btn.textContent = 'Publish Material';
  });

  updateUI();
  load();
})();
