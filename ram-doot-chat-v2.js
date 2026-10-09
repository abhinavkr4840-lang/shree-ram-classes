const GROQ_API_KEY = "PASTE_YOUR_GROQ_KEY_HERE";  // used directly until you set up Vercel/Netlify
const AI_WORKER_URL = "";                           // later set to "/api/ai" (then the key above can be deleted)
const TEXT_MODEL = "openai/gpt-oss-120b";           // text-only doubts
const VISION_MODEL = "qwen/qwen3.8-27b";            // photos and scanned PDFs
const SYSTEM_PROMPT = `You are "राम दूत AI", a friendly doubt-solving tutor for students of Shree Ram Classes (Classes 8 to 12: Physics, Chemistry, Mathematics, Biology, English, Computer Science).
- Reply in the same language the student uses (English, Hindi or Hinglish).
- Explain step by step in simple words, with a short example when helpful.
- For maths and numericals, show each step and the final answer clearly.
- If the student sends a photo or file, read it carefully, say what the question is, then solve it step by step. If it is blurry or unreadable, ask for a clearer one.
- Keep answers short and clear, ideal for reading on a phone.
- If the question is not about studies, politely say you can only help with studies.
- If unsure, say so honestly. Encourage the student to ask their teacher for confirmation.
- Never help with cheating in exams.
- Write in plain text only. Never use markdown, asterisks, bold, tables or LaTeX. Write maths in plain text, like 5 × L × H, x², √16 or (a+b)/2.
- Ritik Sir (also called Ritik Bhaiya) is the teacher of Shree Ram Classes. At the end of EVERY answer, add one short, friendly, funny line reminding the student that Ritik Sir is there to help, with an emoji. Vary the line each time. Examples: "Don't worry, Ritik Sir will help you out 😄", "No fear, Ritik Bhaiya is there 💪", "Still confused? Ritik Sir has your back 🙌". If the student writes in Hindi or Hinglish, write the line in Hindi or Hinglish too.`;

(function(){
  const css = `
  #aiBtn{position:fixed;right:16px;bottom:16px;z-index:9000;width:68px;height:68px;padding:0;border:3px solid var(--saffron,#f28a17);border-radius:50%;background:#fffdf8;box-shadow:0 8px 24px rgba(0,0,0,.35);cursor:pointer;animation:aiFloat 3s ease-in-out infinite}
  #aiBtn img{width:100%;height:100%;object-fit:cover;display:block;border-radius:50%}
  #aiBtn::after{content:"";position:absolute;inset:-6px;border-radius:50%;border:2px solid var(--saffron,#f28a17);opacity:0;animation:aiRing 2.6s ease-out infinite}
  #aiBtn .dot{position:absolute;right:2px;bottom:4px;width:14px;height:14px;border-radius:50%;background:#22c55e;border:2px solid #fff}
  #aiTip{position:fixed;right:92px;bottom:30px;z-index:9000;max-width:210px;padding:10px 14px;border-radius:14px 14px 4px 14px;background:var(--card,#fff);color:var(--ink,#10243a);border:1px solid var(--line,#e8edf2);box-shadow:0 8px 24px rgba(0,0,0,.25);font-size:13px;font-weight:700;display:none;animation:aiUp .35s ease}
  @keyframes aiFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes aiRing{0%{transform:scale(.9);opacity:.7}100%{transform:scale(1.35);opacity:0}}
  @keyframes aiUp{from{opacity:0;transform:translateY(22px) scale(.97)}to{opacity:1;transform:none}}
  @keyframes aiDot{0%,80%,100%{transform:translateY(0);opacity:.4}40%{transform:translateY(-5px);opacity:1}}
  @keyframes aiPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.55)}50%{box-shadow:0 0 0 9px rgba(220,38,38,0)}}
  #aiBack{position:fixed;inset:0;z-index:8999;background:rgba(0,0,0,.4);backdrop-filter:blur(2px);display:none}
  #aiBack.open{display:block}
  #aiPanel{position:fixed;right:10px;left:10px;bottom:10px;max-width:430px;margin-left:auto;height:80vh;height:80dvh;max-height:680px;z-index:9001;display:none;flex-direction:column;background:var(--cream,#f5f8fb);color:var(--ink,#10243a);border:1px solid var(--line,#e8edf2);border-radius:24px;box-shadow:0 20px 60px rgba(0,0,0,.5);overflow:hidden;padding-bottom:env(safe-area-inset-bottom,0px)}
  #aiPanel.open{display:flex;animation:aiUp .3s ease}
  .ai-head{display:flex;align-items:center;gap:12px;padding:14px 14px 14px 16px;color:#fff;background:linear-gradient(135deg,var(--navy2,#063b72),var(--blue,#0b6fae))}
  .ai-av{position:relative;flex:0 0 auto;width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,.85);background:#fffdf8}
  .ai-av img{width:100%;height:100%;object-fit:cover;border-radius:50%;display:block}
  .ai-av i{position:absolute;right:-1px;bottom:0;width:12px;height:12px;border-radius:50%;background:#22c55e;border:2px solid #fff}
  .ai-ttl{flex:1;min-width:0;line-height:1.2}
  .ai-ttl b{display:block;font-size:17px;font-weight:800}
  .ai-ttl small{font-size:11.5px;opacity:.85}
  .ai-x{border:0;width:34px;height:34px;border-radius:50%;background:rgba(255,255,255,.18);color:#fff;font-size:20px;cursor:pointer;line-height:1}
  #aiMsgs{flex:1;overflow-y:auto;padding:14px 12px;display:flex;flex-direction:column;gap:12px;scroll-behavior:smooth;scrollbar-width:thin}
  .ai-row{display:flex;gap:8px;align-items:flex-end;max-width:92%}
  .ai-row.bot{align-self:flex-start}
  .ai-row.me{align-self:flex-end;flex-direction:row-reverse}
  .ai-mini{flex:0 0 auto;width:28px;height:28px;border-radius:50%;object-fit:cover;border:1.5px solid var(--saffron,#f28a17);background:#fffdf8}
  .ai-col{display:flex;flex-direction:column;min-width:0}
  .ai-row.me .ai-col{align-items:flex-end}
  .ai-m{padding:11px 14px;font-size:14.5px;line-height:1.5;white-space:pre-wrap;word-wrap:break-word;box-shadow:0 2px 8px rgba(0,0,0,.08)}
  .ai-m img{display:block;max-width:100%;max-height:150px;border-radius:12px;margin-bottom:6px}
  .ai-m .ai-doc{font-weight:700;margin-bottom:4px}
  .ai-row.bot .ai-m{background:var(--card,#fff);color:var(--ink,#10243a);border:1px solid var(--line,#e8edf2);border-radius:18px 18px 18px 5px}
  .ai-row.me .ai-m{color:#fff;background:linear-gradient(135deg,var(--blue,#0b6fae),color-mix(in srgb,var(--blue,#0b6fae) 65%,#000));border-radius:18px 18px 5px 18px}
  .ai-meta{display:flex;gap:10px;align-items:center;margin:3px 6px 0;font-size:10.5px;opacity:.6}
  .ai-meta button{border:0;background:transparent;color:inherit;font:inherit;font-weight:700;cursor:pointer;padding:0}
  .ai-dots{display:inline-flex;gap:4px;padding:3px 2px}
  .ai-dots span{width:7px;height:7px;border-radius:50%;background:currentColor;animation:aiDot 1.2s infinite}
  .ai-dots span:nth-child(2){animation-delay:.15s}.ai-dots span:nth-child(3){animation-delay:.3s}
  .ai-sug{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 0 36px}
  .ai-sug button{border:1.5px solid var(--line,#d6dee8);background:var(--card,#fff);color:inherit;font:inherit;font-weight:700;font-size:13px;padding:8px 13px;border-radius:999px;cursor:pointer}
  #aiPrev{display:none;flex-wrap:wrap;gap:8px;padding:8px 12px 0}
  .ai-chip{display:flex;align-items:center;gap:6px;background:var(--card,#fff);border:1px solid var(--line,#e8edf2);border-radius:12px;padding:4px 8px 4px 4px;max-width:100%;font-size:13px}
  .ai-chip img{height:40px;width:40px;object-fit:cover;border-radius:8px}
  .ai-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:170px;padding-left:4px}
  .ai-chip button{border:0;background:rgba(127,127,127,.25);color:inherit;border-radius:50%;width:22px;height:22px;cursor:pointer;line-height:1}
  #aiMenu{position:absolute;left:12px;bottom:74px;z-index:2;display:none;flex-direction:column;background:var(--card,#fff);color:var(--ink,#10243a);border:1px solid var(--line,#d6dee8);border-radius:16px;box-shadow:0 12px 32px rgba(0,0,0,.35);padding:6px;animation:aiUp .2s ease}
  #aiMenu.open{display:flex}
  #aiMenu button{border:0;background:transparent;color:inherit;text-align:left;font:inherit;font-weight:700;font-size:14px;padding:11px 14px;border-radius:10px;cursor:pointer;white-space:nowrap}
  .ai-form{display:flex;align-items:center;gap:6px;margin:10px 10px 12px;padding:5px;background:var(--card,#fff);border:1.5px solid var(--line,#d6dee8);border-radius:999px;box-shadow:0 4px 16px rgba(0,0,0,.1)}
  .ai-form input[type=text]{flex:1;min-width:0;border:0!important;background:transparent!important;box-shadow:none!important;outline:none;font:inherit;font-size:15px;color:inherit!important;padding:8px 4px}
  .ai-form button{flex:0 0 auto;width:40px;height:40px;border:0;border-radius:50%;font-size:18px;cursor:pointer;display:grid;place-items:center;padding:0}
  .ai-form .ai-ic{background:rgba(127,127,127,.15);color:inherit}
  .ai-form .ai-ic.rec{background:#dc2626;color:#fff;animation:aiPulse 1.2s infinite}
  .ai-form .ai-send{color:#fff;background:linear-gradient(135deg,var(--blue,#0b6fae),color-mix(in srgb,var(--blue,#0b6fae) 65%,#000));opacity:.45;transition:opacity .2s,transform .2s}
  .ai-form .ai-send.on{opacity:1;transform:scale(1.05)}
  body.dark:not([data-theme]) #aiPanel{background:#0b1220;color:#e6edf5;border-color:#1f2c3f}
  body.dark:not([data-theme]) .ai-row.bot .ai-m,body.dark:not([data-theme]) .ai-form,body.dark:not([data-theme]) .ai-chip,body.dark:not([data-theme]) .ai-sug button,body.dark:not([data-theme]) #aiMenu,body.dark:not([data-theme]) #aiTip{background:#121c2d;border-color:#26364d;color:#e6edf5}
  @media(min-width:700px){#aiPanel{right:20px;bottom:20px}}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const btn = document.createElement('button');
  btn.id = 'aiBtn'; btn.setAttribute('aria-label','राम दूत AI'); btn.innerHTML = '<img src="ram-doot.jpg" alt="राम दूत AI"><span class="dot"></span>';
  const tip = document.createElement('div'); tip.id = 'aiTip'; tip.textContent = 'कोई doubt है? मुझसे पूछो! 🙏';
  const back = document.createElement('div'); back.id = 'aiBack';
  const panel = document.createElement('div');
  panel.id = 'aiPanel';
  panel.innerHTML = `
    <div class="ai-head">
      <div class="ai-av"><img src="ram-doot.jpg" alt=""><i></i></div>
      <div class="ai-ttl"><b>राम दूत AI</b><small>Your study buddy • Online</small></div>
      <button class="ai-x" id="aiClose" aria-label="Close">✕</button>
    </div>
    <div id="aiMsgs"></div>
    <div id="aiPrev"></div>
    <div id="aiMenu">
      <button type="button" data-a="gallery">🖼️ Picture</button>
      <button type="button" data-a="camera">📷 Camera</button>
      <button type="button" data-a="file">📎 File (PDF / TXT)</button>
      <button type="button" data-a="lang">🌐 Voice: English</button>
    </div>
    <form class="ai-form" id="aiForm">
      <button type="button" class="ai-ic" id="aiPlus" aria-label="Attach">＋</button>
      <input id="aiInput" type="text" placeholder="Ask your doubt…" autocomplete="off">
      <button type="button" class="ai-ic" id="aiMic" aria-label="Speak">🎤</button>
      <button type="submit" class="ai-send" id="aiSend" aria-label="Send">➤</button>
    </form>
    <input id="aiGallery" type="file" accept="image/*" multiple style="display:none">
    <input id="aiCamera" type="file" accept="image/*" capture="environment" style="display:none">
    <input id="aiDoc" type="file" accept=".pdf,.txt,application/pdf,text/plain" style="display:none">`;
  document.body.append(back, btn, tip, panel);

  const $ = s => panel.querySelector(s);
  const msgs = $('#aiMsgs'), input = $('#aiInput'), prev = $('#aiPrev'), menu = $('#aiMenu'), sendBtn = $('#aiSend');
  const history = [];
  let waiting = false, att = {images:[], doc:null}, voiceLang = 'en-IN', opened = false;
  const nowT = () => new Date().toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
  const scrollDown = () => { msgs.scrollTop = msgs.scrollHeight; };

  // one chat message = row (avatar + bubble + time/copy)
  const add = (text, who, imgs, docName, typing) => {
    const row = document.createElement('div'); row.className = 'ai-row ' + who;
    if(who === 'bot'){ const a = document.createElement('img'); a.className = 'ai-mini'; a.src = 'ram-doot.jpg'; a.alt = ''; row.appendChild(a); }
    const col = document.createElement('div'); col.className = 'ai-col';
    const b = document.createElement('div'); b.className = 'ai-m';
    if(docName){ const x = document.createElement('div'); x.className = 'ai-doc'; x.textContent = '📎 ' + docName; b.appendChild(x); }
    (imgs || []).forEach(u => { const i = document.createElement('img'); i.src = u; b.appendChild(i); });
    const t = document.createElement('span'); t.className = 'ai-text'; t.textContent = text; b.appendChild(t);
    if(typing){ const d = document.createElement('span'); d.className = 'ai-dots'; d.innerHTML = '<span></span><span></span><span></span>'; b.appendChild(d); }
    col.appendChild(b);
    const meta = document.createElement('div'); meta.className = 'ai-meta'; meta.textContent = nowT();
    col.appendChild(meta);
    row.appendChild(col); msgs.appendChild(row); scrollDown();
    b._row = row; b._meta = meta;
    return b;
  };
  const setText = (b, text) => {
    const d = b.querySelector('.ai-dots'); if(d) d.remove();
    b.querySelector('.ai-text').textContent = text;
    if(b._row.classList.contains('bot') && !b._meta.querySelector('button')){
      const c = document.createElement('button'); c.type = 'button'; c.textContent = '📋 Copy';
      c.onclick = () => { try{ navigator.clipboard.writeText(text); c.textContent = '✅ Copied'; setTimeout(() => c.textContent = '📋 Copy', 1500); }catch(e){} };
      b._meta.appendChild(c);
    }
    scrollDown();
  };
  const rm = b => b._row.remove();

  // welcome + quick actions
  add('जय श्री राम! 🙏 मैं राम दूत AI हूँ, आपका study buddy। Doubt लिखिए, बोलिए या photo भेजिए, मैं step by step समझाऊँगा!', 'bot');
  const sug = document.createElement('div'); sug.className = 'ai-sug';
  [['📐 Solve a maths problem', () => { input.value = 'Solve this maths problem: '; input.focus(); }],
   ['⚛️ Explain a concept', () => { input.value = 'Explain this concept simply: '; input.focus(); }],
   ['📷 Scan a question', () => $('#aiCamera').click()],
   ['🎤 Ask by voice', () => $('#aiMic').click()]].forEach(([label, fn]) => {
    const b = document.createElement('button'); b.type = 'button'; b.textContent = label; b.onclick = () => { fn(); updateSend(); }; sug.appendChild(b);
  });
  msgs.appendChild(sug);

  const updateSend = () => sendBtn.classList.toggle('on', !!(input.value.trim() || att.images.length || att.doc));
  input.addEventListener('input', updateSend);

  const openChat = () => { opened = true; tip.style.display = 'none'; back.classList.add('open'); panel.classList.add('open'); btn.style.display = 'none'; setTimeout(() => input.focus(), 250); };
  const closeChat = () => { panel.classList.remove('open'); back.classList.remove('open'); menu.classList.remove('open'); btn.style.display = ''; };
  btn.onclick = openChat; $('#aiClose').onclick = closeChat; back.onclick = closeChat;
  ['touchstart','touchend'].forEach(ev => [panel, back, tip].forEach(el => el.addEventListener(ev, e => e.stopPropagation(), {passive:true})));
  tip.onclick = openChat;
  setTimeout(() => { if(!opened){ tip.style.display = 'block'; setTimeout(() => { tip.style.display = 'none'; }, 7000); } }, 2500);

  // ----- attachments -----
  function renderPrev(){
    prev.innerHTML = '';
    att.images.forEach((u, i) => {
      const c = document.createElement('div'); c.className = 'ai-chip';
      c.innerHTML = '<img alt=""><button type="button" aria-label="Remove">✕</button>';
      c.querySelector('img').src = u;
      c.querySelector('button').onclick = () => { att.images.splice(i, 1); renderPrev(); };
      prev.appendChild(c);
    });
    if(att.doc){
      const c = document.createElement('div'); c.className = 'ai-chip';
      c.innerHTML = '<span></span><button type="button" aria-label="Remove">✕</button>';
      c.querySelector('span').textContent = '📎 ' + att.doc.name;
      c.querySelector('button').onclick = () => { att.doc = null; att.images = att.images.filter(x => !att.docImgs || att.docImgs.indexOf(x) < 0); att.docImgs = null; renderPrev(); };
      prev.appendChild(c);
    }
    prev.style.display = (att.images.length || att.doc) ? 'flex' : 'none';
    updateSend();
  }
  const resizeToJpeg = (w, h, draw) => {
    const sc = Math.min(1, 1280 / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(h * sc);
    draw(c.getContext('2d'), c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  };
  function fileToJpeg(f){
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => { const d = resizeToJpeg(im.width, im.height, (g, w, h) => g.drawImage(im, 0, 0, w, h)); URL.revokeObjectURL(url); res(d); };
      im.onerror = () => { URL.revokeObjectURL(url); rej(new Error('image')); };
      im.src = url;
    });
  }
  async function addImages(files){
    for(const f of files){
      if(att.images.length >= 3){ add('You can attach up to 3 pictures at a time.', 'bot'); break; }
      try{ att.images.push(await fileToJpeg(f)); }catch(e){ add('Sorry, I could not open that picture.', 'bot'); }
    }
    renderPrev();
  }
  async function loadPdfJs(){
    if(window.pdfjsLib) return window.pdfjsLib;
    await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    return window.pdfjsLib;
  }
  async function addDoc(f){
    if(f.size > 15 * 1024 * 1024){ add('That file is too big (max 15 MB).', 'bot'); return; }
    const note = add('Reading ' + f.name + '…', 'bot', null, null, true);
    try{
      let text = '', imgs = [];
      if(/\.txt$/i.test(f.name) || f.type === 'text/plain'){
        text = (await f.text()).slice(0, 12000);
      }else{
        const lib = await loadPdfJs();
        const pdf = await lib.getDocument({data: await f.arrayBuffer()}).promise;
        for(let p = 1; p <= Math.min(pdf.numPages, 10); p++){
          const c = await (await pdf.getPage(p)).getTextContent();
          text += c.items.map(i => i.str).join(' ') + '\n';
        }
        if(text.replace(/\s/g, '').length < 60){
          text = '';
          for(let p = 1; p <= Math.min(pdf.numPages, 3 - att.images.length); p++){
            const page = await pdf.getPage(p), v0 = page.getViewport({scale:1});
            const v = page.getViewport({scale: 1280 / Math.max(v0.width, v0.height)});
            const cv = document.createElement('canvas'); cv.width = v.width; cv.height = v.height;
            await page.render({canvasContext: cv.getContext('2d'), viewport: v}).promise;
            imgs.push(cv.toDataURL('image/jpeg', 0.8));
          }
        }else text = text.slice(0, 12000);
      }
      att.doc = {name:f.name, text}; att.docImgs = imgs; att.images = att.images.concat(imgs);
      rm(note); renderPrev();
    }catch(e){ setText(note, 'Sorry, I could not read that file. Try a different PDF or a picture.'); }
  }

  $('#aiPlus').onclick = e => { e.stopPropagation(); menu.classList.toggle('open'); };
  panel.addEventListener('click', e => { if(!e.target.closest('#aiMenu') && !e.target.closest('#aiPlus')) menu.classList.remove('open'); });
  menu.addEventListener('click', e => {
    const b = e.target.closest('button'); if(!b) return;
    const a = b.dataset.a;
    if(a === 'lang'){ voiceLang = voiceLang === 'en-IN' ? 'hi-IN' : 'en-IN'; b.textContent = '🌐 Voice: ' + (voiceLang === 'en-IN' ? 'English' : 'हिन्दी'); return; }
    menu.classList.remove('open');
    $(a === 'gallery' ? '#aiGallery' : a === 'camera' ? '#aiCamera' : '#aiDoc').click();
  });
  $('#aiGallery').onchange = e => { addImages([...e.target.files]); e.target.value = ''; };
  $('#aiCamera').onchange = e => { addImages([...e.target.files]); e.target.value = ''; };
  $('#aiDoc').onchange = e => { if(e.target.files[0]) addDoc(e.target.files[0]); e.target.value = ''; };

  // ----- microphone (voice typing) -----
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  const mic = $('#aiMic'); let rec = null, listening = false;
  mic.onclick = () => {
    if(!SR){ add('Voice typing is not supported in this browser. Please open the site in Chrome.', 'bot'); return; }
    if(listening){ rec.stop(); return; }
    rec = new SR(); rec.lang = voiceLang; rec.interimResults = true; rec.continuous = false;
    const base = input.value ? input.value.trim() + ' ' : '';
    rec.onstart = () => { listening = true; mic.classList.add('rec'); };
    rec.onresult = e => { let t = ''; for(let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; input.value = base + t; updateSend(); };
    rec.onerror = e => {
      if(e.error === 'not-allowed' || e.error === 'service-not-allowed') add('Microphone is blocked. Allow the microphone for this site in Chrome (lock icon next to the address), and close any floating bubble apps.', 'bot');
      else if(e.error !== 'no-speech' && e.error !== 'aborted') add('Could not hear you (' + e.error + '). Please try again.', 'bot');
    };
    rec.onend = () => { listening = false; mic.classList.remove('rec'); };
    try{ rec.start(); }catch(e){}
  };

  // ----- sending -----
  function buildMessages(){
    const recent = history.slice(-10);
    let last = -1;
    recent.forEach((m, i) => { if((m.images && m.images.length) || (m.doc && m.doc.text)) last = i; });
    const out = recent.map((m, i) => {
      let text = m.content || '';
      if(m.doc) text += (i === last && m.doc.text) ? '\n\n[Attached file: ' + m.doc.name + ']\n' + m.doc.text : '\n\n[Student attached file: ' + m.doc.name + ']';
      if(m.images && m.images.length){
        if(i === last) return {role:'user', content:[{type:'text', text:text.trim() || 'Please solve the question in this picture.'}].concat(m.images.map(u => ({type:'image_url', image_url:{url:u}})))};
        text += '\n[Student sent ' + m.images.length + ' picture(s)]';
      }
      return {role:m.role, content:text.trim()};
    });
    return {list:[{role:'system', content:SYSTEM_PROMPT}].concat(out), hasImage: last > -1 && !!(recent[last].images && recent[last].images.length)};
  }

  $('#aiForm').addEventListener('submit', async e => {
    e.preventDefault();
    if(listening && rec) rec.stop();
    const q = input.value.trim();
    if((!q && !att.images.length && !att.doc) || waiting) return;
    const sent = {images:att.images.slice(), doc:att.doc};
    att = {images:[], doc:null}; input.value = ''; renderPrev();
    sug.remove();
    add(q, 'me', sent.images, sent.doc && sent.doc.name);
    history.push({role:'user', content:q, images:sent.images, doc:sent.doc});
    const typing = add((sent.images.length || sent.doc) ? 'Reading your attachment… ' : '', 'bot', null, null, true);
    waiting = true;
    try{
      const b = buildMessages();
      const headers = {'Content-Type':'application/json'};
      if(!AI_WORKER_URL) headers.Authorization = 'Bearer ' + GROQ_API_KEY;
      const r = await fetch(AI_WORKER_URL || 'https://api.groq.com/openai/v1/chat/completions', {
        method:'POST', headers,
        body: JSON.stringify({model: b.hasImage ? VISION_MODEL : TEXT_MODEL, max_tokens: b.hasImage ? 3000 : 1500, messages: b.list})
      });
      const data = await r.json();
      let reply = data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
      if(reply) reply = reply.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
      reply = reply || (data.error ? 'Error: ' + data.error.message : 'Sorry, something went wrong. Please try again.');
      setText(typing, reply); history.push({role:'assistant', content:reply});
    }catch(err){
      setText(typing, 'Could not connect. Please check your internet and try again.');
      history.pop();
    }
    waiting = false;
  });
})();
