/* Theme picker: Light, Dark, Ben 10, Death Star, Iron Man, Avengers */
(function(){
  const T = {
    ben10:{label:'🟢 Ben 10',logo:'theme-ben10.jpg',quote:"It's Hero Time!",bg:'#050805',card:'#0d150d',line:'#22381f',soft:'#12301a',top:'rgba(5,8,5,.95)',foot:'#020402',text:'#e6f2e6',muted:'#9db79d',accent:'#7dc02b',accent2:'#9be12f',btn1:'#7dc02b',btn2:'#3f9a2a',btnText:'#04100a',hero:['#020402','#0d2410','#2e7d32']},
    deathstar:{label:'⚫ Death Star',logo:'theme-deathstar.jpg',quote:'LONG LIVE THE EMPIRE!',bg:'#0a0b0f',card:'#14161d',line:'#2a2d38',soft:'#1c1f2a',top:'rgba(10,11,15,.95)',foot:'#05060a',text:'#e4e6ee',muted:'#9a9fb0',accent:'#c9ccd6',accent2:'#e6e8ef',btn1:'#aeb3c4',btn2:'#6a6f84',btnText:'#0d0f16',hero:['#05060a','#1a1c25','#4a4f63']},
    ironman:{label:'🔴 Iron Man',logo:'theme-ironman.jpg',quote:"Jarvis, let's rock and roll",bg:'#1a0709',card:'#2a0d10',line:'#5a1a1f',soft:'#3a1216',top:'rgba(26,7,9,.95)',foot:'#12040a',text:'#fbe9e4',muted:'#d2a39b',accent:'#f5c542',accent2:'#ffd36b',btn1:'#f5c542',btn2:'#d89c1b',btnText:'#3a0a0c',hero:['#4a0a0f','#8c1a1f','#c62828']},
    avengers:{label:'🔵 Avengers',logo:'theme-avengers.jpg',quote:'Avengers Assemble',bg:'#070b16',card:'#0f1730',line:'#1c2a52',soft:'#16224a',top:'rgba(7,11,22,.95)',foot:'#040816',text:'#e6edff',muted:'#98a8cf',accent:'#6ea8ff',accent2:'#bcd4ff',btn1:'#2f6bff',btn2:'#1a43b8',btnText:'#ffffff',hero:['#040816','#0b1a40','#1d3f91']}
  };
  const body = document.body;
  const ORIGINAL_QUOTE = 'Path to Academic Excellence';

  let css = `
  #thBtn{position:fixed;left:16px;bottom:16px;z-index:9000;width:46px;height:46px;border-radius:50%;border:1px solid #d6dee8;background:#fff;font-size:22px;display:flex;align-items:center;justify-content:center;padding:0;cursor:pointer;box-shadow:0 6px 18px rgba(0,0,0,.25)}
  #thMenu{position:fixed;left:16px;bottom:70px;z-index:9000;display:none;flex-direction:column;gap:2px;padding:6px;background:#fff;border:1px solid #d6dee8;border-radius:14px;box-shadow:0 10px 28px rgba(0,0,0,.3)}
  #thMenu.open{display:flex}
  #thMenu button{border:0;background:transparent;text-align:left;font:inherit;font-weight:700;font-size:14px;color:#10243a;padding:10px 14px;border-radius:9px;cursor:pointer}
  #thMenu button.on{background:#e8f0fa}
  body.dark #thBtn,body.dark #thMenu{background:#121c2d;border-color:#26364d}
  body.dark #thMenu button{color:#e6edf5}body.dark #thMenu button.on{background:#1f2f4a}
  body,.topbar,.quick-card,.material,.notice,.table-wrap,select,input,footer,.hero{transition:background-color .4s,color .4s,border-color .4s}
  body.dark{background:#0b1220;color:#e6edf5}
  .dark .topbar{background:rgba(11,18,32,.94)}
  .dark .brand h1,.dark .section h2{color:#f3d58a}
  .dark .brand p,.dark .material-main small,.dark .quick-card small,.dark .notice p,.dark .admin-intro,.dark .empty{color:#97a6b8}
  .dark #mobileNav{background:#101a2b;border-color:#1f2c3f}
  .dark .quick-card,.dark .material,.dark .notice,.dark .table-wrap{background:#121c2d;border-color:#1f2c3f;box-shadow:none}
  .dark .material-icon{background:#1a2840}
  .dark .pill{background:#1a2840;color:#9cc6ee}.dark .pill.gold{background:#3a2d0f;color:#f3d58a}
  .dark select,.dark input{background:#121c2d;border-color:#26364d;color:#e6edf5}
  .dark .notice-date{background:#3a2d0f;color:#f3d58a}
  .dark th{background:#16233a;color:#9cc6ee}.dark th,.dark td{border-color:#1f2c3f}
  .dark .download,.dark .menu-btn{background:#0b6fae}
  .dark .upload-message{background:#12301b;color:#9be0ab}
  .dark footer{background:#060b14}
  `;
  Object.keys(T).forEach(k => {
    const p = T[k], S = 'body[data-theme="' + k + '"]';
    css += `${S}{--navy:${p.accent};--navy2:${p.foot};--blue:${p.hero[2]};--gold-light:${p.accent2};--saffron:${p.btn1};--cream:${p.bg};--ink:${p.text};--muted:${p.muted};--line:${p.line};--card:${p.card};background:${p.bg};color:${p.text}}
    ${S} .topbar{background:${p.top}} ${S} #mobileNav,${S} .quick-card,${S} .material,${S} .notice,${S} .table-wrap,${S} select,${S} input{background:${p.card};border-color:${p.line};color:${p.text}}
    ${S} .material-icon,${S} .pill,${S} .pill.gold,${S} .notice-date,${S} th{background:${p.soft}} ${S} .pill.gold,${S} .notice-date{color:${p.accent2}}
    ${S} th,${S} td{border-color:${p.line}} ${S} .brand h1,${S} .section h2{color:${p.accent2}} ${S} .brand p{color:${p.muted}}
    ${S} .hero{background:linear-gradient(145deg,${p.hero[0]} 0%,${p.hero[1]} 62%,${p.hero[2]} 100%)} ${S} .hero h2 span{color:${p.accent2}}
    ${S} .menu-btn,${S} .download{background:${p.btn1};color:${p.btnText}} ${S} .primary-btn{background:linear-gradient(135deg,${p.btn1},${p.btn2});color:${p.btnText}}
    ${S} footer{background:${p.foot}} ${S} .hero-logo,${S} .footer-logo{border-color:${p.accent}}
    ${S} #thBtn,${S} #thMenu{background:${p.card};border-color:${p.line}} ${S} #thMenu button{color:${p.text}} ${S} #thMenu button.on{background:${p.soft}}
    `;
  });
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const logos = [...document.querySelectorAll('img')].filter(i => (i.getAttribute('src') || '').indexOf('logo.jpg') > -1 && (i.getAttribute('src') || '').indexOf('theme-') < 0);
  const quotes = [...document.querySelectorAll('.brand p, footer p')].filter(e => e.textContent.trim() === ORIGINAL_QUOTE);

  const opts = [['light','☀️ Light'],['dark','🌙 Dark']].concat(Object.keys(T).map(k => [k, T[k].label]));
  const btn = document.createElement('button'); btn.id = 'thBtn'; btn.type = 'button'; btn.textContent = '🎨'; btn.setAttribute('aria-label','Change theme');
  const menu = document.createElement('div'); menu.id = 'thMenu';
  opts.forEach(o => { const b = document.createElement('button'); b.type = 'button'; b.dataset.t = o[0]; b.textContent = o[1]; menu.appendChild(b); });
  body.append(btn, menu);

  let current = 'light', internal = false;
  function apply(name){
    current = name; internal = true;
    const char = T[name];
    if(char) body.setAttribute('data-theme', name); else body.removeAttribute('data-theme');
    body.classList.toggle('dark', name !== 'light');
    logos.forEach(i => i.setAttribute('src', char ? char.logo : 'logo.jpg'));
    quotes.forEach(e => { e.textContent = char ? char.quote : ORIGINAL_QUOTE; });
    menu.querySelectorAll('button').forEach(b => b.classList.toggle('on', b.dataset.t === name));
    try{ localStorage.setItem('siteTheme', name); localStorage.setItem('theme', name === 'light' ? 'light' : 'dark'); }catch(e){}
    setTimeout(() => { internal = false; }, 0);
  }

  btn.addEventListener('click', e => { e.stopPropagation(); menu.classList.toggle('open'); });
  menu.addEventListener('click', e => { const b = e.target.closest('button'); if(b){ apply(b.dataset.t); menu.classList.remove('open'); } e.stopPropagation(); });
  document.addEventListener('click', () => menu.classList.remove('open'));

  // triple-tap Easter egg flips the dark class: keep the picker in sync
  new MutationObserver(() => {
    if(internal) return;
    const dark = body.classList.contains('dark');
    if(dark !== (current !== 'light')) apply(dark ? 'dark' : 'light');
  }).observe(body, {attributes:true, attributeFilter:['class']});

  let saved = 'light';
  try{ saved = localStorage.getItem('siteTheme') || (localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'); }catch(e){}
  apply(opts.some(o => o[0] === saved) ? saved : 'light');
})();
