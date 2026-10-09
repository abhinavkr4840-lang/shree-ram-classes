const GROQ_API_KEY = "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";  // used directly until you set up Vercel/Netlify
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
- Ritik Sir (also called Ritik Bhaiya) is the teacher of Shree Ram Classes. At the end of EVERY answer, add one short, friendly, funny line reminding the student that Ritik Sir is there to help, with an emoji. Vary the line each time. Examples: "Don't worry, Ritik Sir will help you out 😄", "No fear, Ritik Bhaiya is there 💪", "Still confused? Ritik Sir has your back 🙌". If the student writes in Hindi or Hinglish, write the line in Hindi or Hinglish too.
-Do not use ** or such trying to bold or italic your answers use () {} [] to indicate bold or italic accordingly, take your space and write the answer dont make it look dense.`;

(function(){
  const css = `
  #aiBtn{position:fixed;right:16px;bottom:16px;z-index:9000;width:68px;height:68px;padding:0;border:3px solid #f28a17;border-radius:50%;overflow:hidden;background:#fffdf8;box-shadow:0 8px 22px rgba(0,0,0,.3);cursor:pointer;animation:aiFloat 3s ease-in-out infinite}
  #aiBtn img{width:100%;height:100%;object-fit:cover;display:block}
  @keyframes aiFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  @keyframes aiPulse{0%,100%{box-shadow:0 0 0 0 rgba(220,38,38,.5)}50%{box-shadow:0 0 0 8px rgba(220,38,38,0)}}
  #aiPanel{position:fixed;right:12px;bottom:12px;left:12px;max-width:420px;margin-left:auto;height:72vh;max-height:580px;z-index:9001;display:none;flex-direction:column;background:#fff;color:#10243a;border:1px solid #e8edf2;border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.35);overflow:hidden}
  #aiPanel.open{display:flex}
  .ai-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#063b72;color:#fff;font-weight:800}
  .ai-head button{border:0;background:transparent;color:#fff;font-size:22px;cursor:pointer}
  #aiMsgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f5f8fb}
  .ai-m{max-width:85%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
  .ai-m img{display:block;max-width:100%;max-height:140px;border-radius:10px;margin-bottom:6px}
  .ai-m .ai-doc{font-weight:700;margin-bottom:4px}
  .ai-m.bot{align-self:flex-start;background:#fff;border:1px solid #e8edf2}
  .ai-m.me{align-self:flex-end;background:#0b6fae;color:#fff}
  #aiPrev{display:none;flex-wrap:wrap;gap:8px;padding:8px 10px;border-top:1px solid #e8edf2;background:#fff;font-size:13px}
  .ai-chip{position:relative;display:flex;align-items:center;gap:6px;background:#eef3f8;border-radius:10px;padding:4px 8px 4px 4px;max-width:100%}
  .ai-chip img{height:40px;width:40px;object-fit:cover;border-radius:8px}
  .ai-chip span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:160px;padding-left:4px}
  .ai-chip button{border:0;background:#cfd9e4;border-radius:50%;width:22px;height:22px;cursor:pointer;line-height:1}
  #aiMenu{position:absolute;left:10px;bottom:64px;z-index:2;display:none;flex-direction:column;background:#fff;border:1px solid #d6dee8;border-radius:14px;box-shadow:0 10px 28px rgba(0,0,0,.3);padding:6px}
  #aiMenu.open{display:flex}
  #aiMenu button{border:0;background:transparent;text-align:left;font:inherit;font-weight:700;font-size:14px;color:#10243a;padding:10px 14px;border-radius:9px;cursor:pointer;white-space:nowrap}
  .ai-form{display:flex;gap:6px;padding:10px;border-top:1px solid #e8edf2;background:#fff}
  .ai-form input[type=text]{flex:1;min-width:0}
  .ai-form button{border:0;border-radius:11px;padding:0 14px;font-weight:800;color:#fff;background:#063b72;cursor:pointer}
  .ai-form button.ai-ic{padding:0 11px;font-size:19px;background:#f28a17}
  .ai-form button.ai-ic.rec{background:#dc2626;animation:aiPulse 1.2s infinite}
  body.dark #aiPanel{background:#121c2d;color:#e6edf5;border-color:#1f2c3f}
  body.dark #aiMsgs{background:#0b1220}
  body.dark .ai-m.bot{background:#121c2d;border-color:#1f2c3f;color:#e6edf5}
  body.dark .ai-form,body.dark #aiPrev{background:#121c2d;border-color:#1f2c3f;color:#e6edf5}
  body.dark .ai-chip{background:#1a2840}body.dark .ai-chip button{background:#2a3b57;color:#fff}
  body.dark #aiMenu{background:#121c2d;border-color:#26364d}body.dark #aiMenu button{color:#e6edf5}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const btn = document.createElement('button');
  btn.id = 'aiBtn'; btn.setAttribute('aria-label','राम दूत AI'); btn.innerHTML = '<img src="ram-doot.jpg" alt="राम दूत AI">';
  const panel = document.createElement('div');
  panel.id = 'aiPanel';
  panel.innerHTML = `
    <div class="ai-head"><span>🙏 राम दूत AI — Doubt Solver</span><button id="aiClose" aria-label="Close">×</button></div>
    <div id="aiMsgs"></div>
    <div id="aiPrev"></div>
    <div id="aiMenu">
      <button type="button" data-a="gallery">🖼️ Picture</button>
      <button type="button" data-a="camera">📷 Camera</button>
      <button type="button" data-a="file">📎 File (PDF / TXT)</button>
      <button type="button" data-a="lang">🗣 Voice: English</button>
    </div>
    <form class="ai-form" id="aiForm">
      <button type="button" class="ai-ic" id="aiPlus" aria-label="Attach">＋</button>
      <input id="aiInput" type="text" placeholder="Type, speak or attach your doubt..." autocomplete="off">
      <button type="button" class="ai-ic" id="aiMic" aria-label="Speak">🎙</button>
      <button type="submit">Send</button>
    </form>
    <input id="aiGallery" type="file" accept="image/*" multiple style="display:none">
    <input id="aiCamera" type="file" accept="image/*" capture="environment" style="display:none">
    <input id="aiDoc" type="file" accept=".pdf,.txt,application/pdf,text/plain" style="display:none">`;
  document.body.append(btn, panel);

  const $ = s => panel.querySelector(s);
  const msgs = $('#aiMsgs'), input = $('#aiInput'), prev = $('#aiPrev'), menu = $('#aiMenu');
  const history = [];
  let waiting = false, att = {images:[], doc:null}, voiceLang = 'en-IN';

  const add = (text, who, imgs, docName) => {
    const d = document.createElement('div');
    d.className = 'ai-m ' + who;
    if(docName){ const x = document.createElement('div'); x.className = 'ai-doc'; x.textContent = '📎 ' + docName; d.appendChild(x); }
    (imgs || []).forEach(u => { const i = document.createElement('img'); i.src = u; d.appendChild(i); });
    d.appendChild(document.createTextNode(text));
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    return d;
  };
  const setText = (d, text) => { d.lastChild.textContent = text; };
  add('जय श्री राम! 🙏 मैं राम दूत AI हूँ। Doubt लिखिए, बोलिए 🎤 या photo / file भेजिए ＋ — Physics, Chemistry, Maths, Biology, English या Computer Science.', 'bot');

  btn.onclick = () => { panel.classList.add('open'); btn.style.display = 'none'; input.focus(); };
  $('#aiClose').onclick = () => { panel.classList.remove('open'); menu.classList.remove('open'); btn.style.display = ''; };
  ['touchstart','touchend'].forEach(ev => panel.addEventListener(ev, e => e.stopPropagation(), {passive:true}));

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
  }
  const resizeToJpeg = (src, w, h, draw) => {
    const sc = Math.min(1, 1280 / Math.max(w, h));
    const c = document.createElement('canvas'); c.width = Math.round(w * sc); c.height = Math.round(h * sc);
    draw(c.getContext('2d'), c.width, c.height);
    return c.toDataURL('image/jpeg', 0.8);
  };
  function fileToJpeg(f){
    return new Promise((res, rej) => {
      const url = URL.createObjectURL(f), im = new Image();
      im.onload = () => { const d = resizeToJpeg(im, im.width, im.height, (g, w, h) => g.drawImage(im, 0, 0, w, h)); URL.revokeObjectURL(url); res(d); };
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
    const note = add('Reading ' + f.name + '…', 'bot');
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
        if(text.replace(/\s/g, '').length < 60){          // scanned PDF: send the first pages as pictures
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
      note.remove(); renderPrev();
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
    rec.onresult = e => { let t = ''; for(let i = 0; i < e.results.length; i++) t += e.results[i][0].transcript; input.value = base + t; };
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
    add(q, 'me', sent.images, sent.doc && sent.doc.name);
    history.push({role:'user', content:q, images:sent.images, doc:sent.doc});
    const typing = add((sent.images.length || sent.doc) ? 'Reading your attachment…' : 'Thinking…', 'bot');
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
    waiting = false; msgs.scrollTop = msgs.scrollHeight;
  });
})();
