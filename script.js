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
