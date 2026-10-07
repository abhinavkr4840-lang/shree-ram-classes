const materials = [
  {title:"Electromagnetic Induction — Notes", cls:"12", subject:"Physics", type:"notes", file:"#"},
  {title:"Electrochemistry — Revision Notes", cls:"12", subject:"Chemistry", type:"notes", file:"#"},
  {title:"Class 12 Physics Test Paper", cls:"12", subject:"Physics", type:"papers", file:"#"},
  {title:"Matrices — Practice Questions", cls:"12", subject:"Mathematics", type:"papers", file:"#"},
  {title:"Class 10 Science Revision", cls:"10", subject:"Science", type:"notes", file:"#"}
];

function renderMaterials() {
  const cls = document.getElementById("classFilter").value;
  const type = document.getElementById("typeFilter").value;
  const list = document.getElementById("materialList");
  const empty = document.getElementById("emptyState");
  const filtered = materials.filter(m => (cls==="all" || m.cls===cls) && (type==="all" || m.type===type));
  list.innerHTML = filtered.map(m => `
    <article class="material">
      <div class="material-icon">${m.type==="notes" ? "📚" : "📝"}</div>
      <div class="material-main">
        <strong>${escapeHtml(m.title)}</strong>
        <small>Class ${m.cls} • ${escapeHtml(m.subject)} • ${m.type==="notes"?"Notes":"Question Paper"}</small>
      </div>
      <a class="download" href="${m.file}" ${m.file==="#"?"onclick='return false;'":""}>${m.file==="#"?"Demo":"Open"}</a>
    </article>
  `).join("");
  empty.hidden = filtered.length !== 0;
}
function filterMaterials(){ renderMaterials(); }
function toggleMenu(){ document.getElementById("mobileNav").classList.toggle("open"); }

document.getElementById("uploadForm").addEventListener("submit", e => {
  e.preventDefault();
  const title = document.getElementById("title").value.trim();
  const cls = document.getElementById("uploadClass").value;
  const subject = document.getElementById("subject").value;
  const type = document.getElementById("uploadType").value;
  const file = document.getElementById("file").files[0];
  if(!file) return;
  const url = URL.createObjectURL(file);
  materials.unshift({title, cls, subject, type, file:url});
  renderMaterials();
  const msg = document.getElementById("uploadMessage");
  msg.hidden = false;
  msg.textContent = `"${file.name}" published in this browser session. For permanent online storage, connect Firebase or Supabase.`;
  e.target.reset();
  document.getElementById("materials").scrollIntoView({behavior:"smooth"});
});

function escapeHtml(s){
  return s.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}
renderMaterials();

/* ===== Three-finger swipe down: जय श्री राम + dark/light toggle (touch devices only) ===== */
(function(){
  if(!('ontouchstart' in window)) return;
  const body = document.body;
  try{ if(localStorage.getItem('theme')==='dark') body.classList.add('dark'); }catch(e){}

  const ov = document.createElement('div');
  ov.id = 'ramOverlay';
  ov.innerHTML = '<span>जय श्री राम</span>';
  body.appendChild(ov);
  const txt = ov.firstChild;

  const DIST = 160;      // pixels of swipe for full effect
  const TRIGGER = 0.6;   // how far (0-1) you must swipe for the switch to happen
  let active = false, startY = 0, progress = 0;

  const avgY = t => (t[0].clientY + t[1].clientY + t[2].clientY) / 3;
  const show = p => {
    ov.style.opacity = p;
    txt.style.opacity = p;
    txt.style.transform = 'scale(' + (0.9 + 0.1 * p) + ')';
  };

  document.addEventListener('touchstart', e => {
    if(e.touches.length === 3){
      active = true; progress = 0; startY = avgY(e.touches);
      ov.classList.toggle('to-light', body.classList.contains('dark'));
      ov.style.transition = 'none'; txt.style.transition = 'none';
      show(0);
    } else if(e.touches.length > 3){
      active = false; ov.style.opacity = 0;
    }
  }, {passive:true});

  document.addEventListener('touchmove', e => {
    if(!active || e.touches.length !== 3) return;
    e.preventDefault();
    progress = Math.min(1, Math.max(0, (avgY(e.touches) - startY) / DIST));
    show(progress);
  }, {passive:false});

  function finish(){
    if(!active) return;
    active = false;
    ov.style.transition = 'opacity .4s'; txt.style.transition = 'opacity .4s, transform .4s';
    if(progress >= TRIGGER){
      show(1);
      setTimeout(() => {
        const dark = body.classList.toggle('dark');
        try{ localStorage.setItem('theme', dark ? 'dark' : 'light'); }catch(e){}
      }, 400);
      setTimeout(() => { ov.style.transition = 'opacity .7s'; show(0); }, 1300);
    } else {
      show(0);
    }
  }
  document.addEventListener('touchend', finish);
  document.addEventListener('touchcancel', finish);
})();
