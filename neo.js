/* Neo-brutalist style layer for the whole site (bold borders, hard shadows, vibrant colors).
   Works with every theme. Load it LAST in index.html. Turn it off any time from the 🎨 menu. */
(function(){
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Noto+Sans+Devanagari:wght@600;800&display=swap';
  document.head.appendChild(link);

  const css = `
  body.nb{--nb-bg:#FBF3E6;--nb-card:#fff;--nb-ink:#111;--nb-sh:#111;--nb-muted:#555;--nb-dot:rgba(0,0,0,.09);
    --nb-y:#FFD21F;--nb-p:#FF5C8A;--nb-v:#7B61FF;--nb-g:#3DDC4A;--nb-t:#19C6B4;--nb-btn:#FF5C8A;--nb-on:#111;--nb-on-p:#111;--nb-on-v:#fff}
  body.nb.dark{--nb-bg:#15131C;--nb-card:#1F1C29;--nb-ink:#F7F2E8;--nb-sh:#7B61FF;--nb-muted:#B9B4C6;--nb-dot:rgba(255,255,255,.07);--nb-btn:#FFD21F}
  body.nb[data-theme]{--nb-bg:var(--cream);--nb-card:var(--card);--nb-ink:var(--ink);--nb-sh:var(--saffron);--nb-muted:var(--muted);
    --nb-y:var(--saffron);--nb-p:var(--navy);--nb-v:var(--blue);--nb-g:var(--gold-light);--nb-t:var(--saffron);--nb-btn:var(--saffron)}

  body.nb{font-family:'Space Grotesk','Noto Sans Devanagari',system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;background-color:var(--nb-bg);color:var(--nb-ink);
    background-image:radial-gradient(var(--nb-dot) 1.3px,transparent 1.3px);background-size:22px 22px}
  body.nb h1,body.nb h2,body.nb h3{font-weight:700;letter-spacing:-.02em}

  /* top bar */
  body.nb .topbar{background:var(--nb-card);border-bottom:3px solid var(--nb-ink);backdrop-filter:none;box-shadow:0 4px 0 var(--nb-sh)}
  body.nb .brand h1{color:var(--nb-ink);font-weight:800}
  body.nb .brand p{color:var(--nb-muted)}
  body.nb .brand img{border:3px solid var(--nb-ink);box-shadow:3px 3px 0 var(--nb-sh)}
  body.nb .menu-btn,body.nb #chBtn{background:var(--nb-y);color:var(--nb-on);border:3px solid var(--nb-ink);border-radius:14px;box-shadow:3px 3px 0 var(--nb-sh)}
  body.nb #chBtn .ch-ic{color:var(--nb-on)}
  body.nb #chBtn:active{transform:translate(2px,2px);box-shadow:1px 1px 0 var(--nb-sh)}

  /* hero */
  body.nb .hero{background:var(--nb-y);color:var(--nb-ink);border:3px solid var(--nb-ink);box-shadow:6px 6px 0 var(--nb-sh);overflow:hidden;position:relative}
  body.nb[data-theme] .hero{background:var(--nb-y)}
  body.nb .hero::before{content:"";position:absolute;width:130px;height:130px;border-radius:50%;background:var(--nb-p);border:3px solid var(--nb-ink);left:-46px;top:-50px;z-index:0}
  body.nb .hero::after{content:"";position:absolute;width:90px;height:90px;background:var(--nb-v);border:3px solid var(--nb-ink);border-radius:18px;transform:rotate(22deg);right:34%;bottom:-48px;z-index:0}
  body.nb .hero-copy{z-index:2}
  body.nb .hero .eyebrow{display:inline-block;background:var(--nb-ink);color:var(--nb-bg);padding:4px 10px;border-radius:7px;transform:rotate(-2deg)}
  body.nb .hero h2{color:var(--nb-on);font-weight:800}
  body.nb .hero h2 span{display:inline-block;background:var(--nb-p);color:var(--nb-on-p);padding:0 12px;border:3px solid var(--nb-ink);border-radius:12px;transform:rotate(-2deg);box-shadow:4px 4px 0 var(--nb-sh)}
  body.nb .hero p{color:var(--nb-on);font-weight:600;opacity:.9}
  body.nb .hero-logo{border:3px solid var(--nb-ink);box-shadow:5px 5px 0 var(--nb-sh);z-index:1}

  /* buttons */
  body.nb .primary-btn,body.nb .download{background:var(--nb-btn)!important;color:var(--nb-on)!important;border:3px solid var(--nb-ink)!important;border-radius:14px!important;font-weight:800!important;box-shadow:4px 4px 0 var(--nb-sh)!important;transition:transform .08s,box-shadow .08s}
  body.nb .primary-btn:active,body.nb .download:active{transform:translate(3px,3px);box-shadow:1px 1px 0 var(--nb-sh)!important}
  body.nb .su-act .su-dl,body.nb .mb-form .download{background:var(--nb-card)!important;color:var(--nb-ink)!important}

  /* quick cards: folder-tab look */
  body.nb .quick-grid{gap:26px 14px;padding-top:30px}
  body.nb .quick-card{position:relative;background:var(--nb-card);border:3px solid var(--nb-ink);border-radius:18px;box-shadow:5px 5px 0 var(--nb-sh);transition:transform .1s,box-shadow .1s}
  body.nb .quick-card:active{transform:translate(4px,4px);box-shadow:1px 1px 0 var(--nb-sh)}
  body.nb .quick-card::before{content:"";position:absolute;top:-15px;left:16px;width:58px;height:15px;background:var(--tab);border:3px solid var(--nb-ink);border-bottom:0;border-radius:10px 10px 0 0}
  body.nb .quick-card:nth-child(1){--tab:var(--nb-g)}
  body.nb .quick-card:nth-child(2){--tab:var(--nb-y)}
  body.nb .quick-card:nth-child(3){--tab:var(--nb-p)}
  body.nb .quick-card .icon{width:46px;height:46px;display:grid;place-items:center;background:var(--tab);border:3px solid var(--nb-ink);border-radius:12px;margin-bottom:10px}
  body.nb .quick-card strong{font-weight:800}
  body.nb .quick-card small{color:var(--nb-muted)}

  /* section headings, pills */
  body.nb .section h2{color:var(--nb-ink);font-weight:800;font-size:28px}
  body.nb .eyebrow{display:inline-block;background:var(--nb-ink);color:var(--nb-bg);padding:3px 9px;border-radius:6px;transform:rotate(-1.5deg);letter-spacing:1.5px}
  body.nb .pill{background:var(--nb-y);color:var(--nb-on);border:2.5px solid var(--nb-ink);box-shadow:2px 2px 0 var(--nb-sh);font-weight:800}
  body.nb .pill.gold{background:var(--nb-p);color:var(--nb-on-p)}

  /* inputs */
  body.nb select,body.nb input:not([type=checkbox]):not([type=radio]):not([type=file]):not([type=range]){background:var(--nb-card);color:var(--nb-ink);border:3px solid var(--nb-ink);border-radius:12px;box-shadow:3px 3px 0 var(--nb-sh);font-weight:600;transition:box-shadow .1s,transform .1s}
  body.nb select:focus,body.nb input:focus{outline:none;transform:translate(-1px,-1px);box-shadow:5px 5px 0 var(--nb-sh)}
  body.nb input[type=file]{border:3px dashed var(--nb-ink);border-radius:12px;background:var(--nb-card);color:var(--nb-ink)}
  body.nb ::placeholder{color:var(--nb-muted);opacity:.8}

  /* cards & lists */
  body.nb .material,body.nb .notice,body.nb .table-wrap{background:var(--nb-card);color:var(--nb-ink);border:3px solid var(--nb-ink);border-radius:18px;box-shadow:5px 5px 0 var(--nb-sh)}
  body.nb .material-icon{background:var(--nb-y);border:3px solid var(--nb-ink);border-radius:12px}
  body.nb .material-main small,body.nb .notice p,body.nb .empty,body.nb .admin-intro{color:var(--nb-muted)}
  body.nb .notice-date{background:var(--nb-p);color:var(--nb-on-p);border:3px solid var(--nb-ink);border-radius:12px}
  body.nb th{background:var(--nb-y);color:var(--nb-on);border-bottom:3px solid var(--nb-ink)}
  body.nb th,body.nb td{border-color:var(--nb-ink)}
  body.nb .admin-section{border-top:3px dashed var(--nb-ink)}
  body.nb .upload-message{background:var(--nb-g);color:#111;border:3px solid var(--nb-ink);border-radius:12px;font-weight:700}

  /* footer */
  body.nb footer{background:var(--nb-ink);color:var(--nb-bg);border-top:3px solid var(--nb-ink)}
  body.nb footer p,body.nb footer small{color:var(--nb-bg);opacity:.75}
  body.nb .footer-logo{border:3px solid var(--nb-bg)}

  /* study material (study-ui.js) */
  body.nb .su-card{background:var(--nb-card);color:var(--nb-ink);border:3px solid var(--nb-ink);border-left:3px solid var(--nb-ink);border-radius:18px;box-shadow:5px 5px 0 var(--nb-sh)}
  body.nb .su-ico{border:3px solid var(--nb-ink);background:var(--c)}
  body.nb .su-meta span{border:2px solid var(--nb-ink);background:transparent}
  body.nb .su-meta span.c{background:var(--nb-y);color:var(--nb-on)}
  body.nb .su-tabs{background:transparent;padding:0;gap:8px}
  body.nb .su-tab{border:3px solid var(--nb-ink);background:var(--nb-card);color:var(--nb-ink);border-radius:12px;opacity:1;box-shadow:3px 3px 0 var(--nb-sh)}
  body.nb .su-tab.on{background:var(--nb-y);color:var(--nb-on);box-shadow:0 0 0 var(--nb-sh);transform:translate(3px,3px)}
  body.nb .su-chip,body.nb .mb-chip{border:2.5px solid var(--nb-ink);background:var(--nb-card);color:var(--nb-ink);box-shadow:2px 2px 0 var(--nb-sh)}
  body.nb .su-chip.on,body.nb .mb-chip.on{background:var(--nb-y);color:var(--nb-on);border-color:var(--nb-ink)}
  body.nb .su-new,body.nb .mb-new{background:var(--nb-p);color:var(--nb-on-p);border:2px solid var(--nb-ink)}
  body.nb .su-empty,body.nb .mb-empty{border:3px dashed var(--nb-ink);background:var(--nb-card)}

  /* members (members.js) */
  body.nb #members .mb-hero{background:var(--nb-v);color:var(--nb-on-v);border:3px solid var(--nb-ink);box-shadow:6px 6px 0 var(--nb-sh)}
  body.nb #members .mb-hero h2{color:var(--nb-on-v)!important}
  body.nb #members .mb-eyebrow{color:var(--nb-y)}
  body.nb #members .mb-stat{background:var(--nb-y);color:var(--nb-on);border:3px solid var(--nb-ink);box-shadow:3px 3px 0 var(--nb-sh);backdrop-filter:none}
  body.nb .mb-card{background:var(--nb-card);color:var(--nb-ink);border:3px solid var(--nb-ink);border-radius:18px;box-shadow:4px 4px 0 var(--nb-sh)}
  body.nb .mb-av{background:var(--nb-y);border:3px solid var(--nb-ink);padding:0;box-shadow:3px 3px 0 var(--nb-sh)}
  body.nb .mb-in{border:0;background:var(--nb-p);color:var(--nb-on-p)}
  body.nb .mb-cls{background:var(--nb-g);color:#111;border:2px solid var(--nb-ink)}
  body.nb .mb-form,body.nb .mb-allwrap,body.nb .mb-photo{background:var(--nb-card);color:var(--nb-ink);border:3px solid var(--nb-ink);box-shadow:4px 4px 0 var(--nb-sh)}
  body.nb .mb-done{background:var(--nb-g);color:#111;border:3px solid var(--nb-ink);box-shadow:3px 3px 0 var(--nb-sh)}

  /* header chat (chat.js) */
  body.nb #chPanel{background:var(--nb-bg);color:var(--nb-ink);border:3px solid var(--nb-ink);box-shadow:7px 7px 0 var(--nb-sh);border-radius:22px}
  body.nb .ch-hd{background:var(--nb-y);color:var(--nb-on);border-bottom:3px solid var(--nb-ink)}
  body.nb .ch-hd .ch-lg,body.nb .ch-hd button{background:var(--nb-card);color:var(--nb-ink);border:2.5px solid var(--nb-ink)}
  body.nb .ch-on,body.nb .ch-sug{background:var(--nb-card);border-color:var(--nb-ink)}
  body.nb .ch-chip{border:2.5px solid var(--nb-ink);background:var(--nb-card);color:var(--nb-ink)}
  body.nb .ch-b{background:var(--nb-card);color:var(--nb-ink);border:2.5px solid var(--nb-ink);box-shadow:3px 3px 0 var(--nb-sh)}
  body.nb .ch-r.me .ch-b{background:var(--nb-v);color:var(--nb-on-v);border:2.5px solid var(--nb-ink)}
  body.nb .ch-r.tch .ch-b{background:var(--nb-y);color:var(--nb-on)}
  body.nb .ch-av{border:2.5px solid var(--nb-ink)}
  body.nb .ch-day{background:var(--nb-ink);color:var(--nb-bg);opacity:1}
  body.nb .ch-fm{background:var(--nb-card);border:3px solid var(--nb-ink);box-shadow:4px 4px 0 var(--nb-sh)}
  body.nb .ch-fm .ch-sd{background:var(--nb-btn);color:var(--nb-on);border:2.5px solid var(--nb-ink)}
  body.nb .ch-fm .ch-atb{background:var(--nb-y);color:var(--nb-on);border:2.5px solid var(--nb-ink)}

  /* AI chat (ram-doot chat) */
  body.nb #aiPanel{background:var(--nb-bg);color:var(--nb-ink);border:3px solid var(--nb-ink);box-shadow:7px 7px 0 var(--nb-sh);border-radius:22px}
  body.nb .ai-head{background:var(--nb-y)!important;color:var(--nb-on)!important;border-bottom:3px solid var(--nb-ink)}
  body.nb .ai-x{background:var(--nb-card)!important;color:var(--nb-ink)!important;border:2.5px solid var(--nb-ink)}
  body.nb .ai-row.bot .ai-m{background:var(--nb-card)!important;color:var(--nb-ink)!important;border:2.5px solid var(--nb-ink)!important;box-shadow:3px 3px 0 var(--nb-sh)}
  body.nb .ai-row.me .ai-m{background:var(--nb-v)!important;color:var(--nb-on-v)!important;border:2.5px solid var(--nb-ink);box-shadow:3px 3px 0 var(--nb-sh)}
  body.nb .ai-form{background:var(--nb-card)!important;border:3px solid var(--nb-ink)!important;box-shadow:4px 4px 0 var(--nb-sh)!important}
  body.nb .ai-form .ai-send{background:var(--nb-btn)!important;color:var(--nb-on)!important;border:2.5px solid var(--nb-ink)!important}
  body.nb .ai-form .ai-ic{background:var(--nb-y)!important;color:var(--nb-on)!important;border:2.5px solid var(--nb-ink)!important}
  body.nb .ai-sug button,body.nb #aiMenu,body.nb .ai-chip{background:var(--nb-card)!important;color:var(--nb-ink)!important;border:2.5px solid var(--nb-ink)!important}
  body.nb #aiBtn{border:3px solid var(--nb-ink)!important;box-shadow:4px 4px 0 var(--nb-sh)!important}
  body.nb #aiTip{background:var(--nb-card)!important;color:var(--nb-ink)!important;border:3px solid var(--nb-ink)!important;box-shadow:4px 4px 0 var(--nb-sh)!important}

  /* theme picker */
  body.nb #thBtn,body.nb #thMenu{background:var(--nb-card)!important;color:var(--nb-ink)!important;border:3px solid var(--nb-ink)!important;box-shadow:4px 4px 0 var(--nb-sh)!important}
  body.nb #thMenu button{color:var(--nb-ink)!important}
  body.nb #thMenu button.on{background:var(--nb-y)!important;color:var(--nb-on)!important}
  #thMenu .nb-tg{border-top:2px dashed currentColor;margin-top:4px;padding-top:12px!important}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const body = document.body;
  let off = false;
  try{ off = localStorage.getItem('neoOff') === '1'; }catch(e){}

  function onColor(v){
    const raw = getComputedStyle(body).getPropertyValue(v).trim();
    let r, g, b, m;
    if((m = raw.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i))){
      let h = m[1]; if(h.length === 3) h = h.split('').map(c => c + c).join('');
      r = parseInt(h.slice(0, 2), 16); g = parseInt(h.slice(2, 4), 16); b = parseInt(h.slice(4, 6), 16);
    }else if((m = raw.match(/rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/))){ r = +m[1]; g = +m[2]; b = +m[3]; }
    else return '#111';
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255 > 0.56 ? '#111' : '#fff';
  }
  function sync(){
    const vars = {'--nb-on':'--saffron', '--nb-on-p':'--navy', '--nb-on-v':'--blue'};
    Object.keys(vars).forEach(k => {
      if(!off && body.hasAttribute('data-theme')) body.style.setProperty(k, onColor(vars[k])); else body.style.removeProperty(k);
    });
  }
  function apply(){ body.classList.toggle('nb', !off); sync(); }
  apply();
  new MutationObserver(sync).observe(body, {attributes:true, attributeFilter:['data-theme']});

  function addToggle(){
    const menu = document.getElementById('thMenu'); if(!menu || menu.querySelector('.nb-tg')) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'nb-tg';
    const label = () => { b.textContent = '🧱 Neo style: ' + (off ? 'Off' : 'On'); };
    label();
    b.addEventListener('click', e => {
      e.stopPropagation(); off = !off;
      try{ localStorage.setItem('neoOff', off ? '1' : '0'); }catch(x){}
      apply(); label(); menu.classList.remove('open');
    });
    menu.appendChild(b);
  }
  addToggle(); window.addEventListener('load', addToggle);
})();
