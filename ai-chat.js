const GEMINI_API_KEY = "AQ.Ab8RN6J9DqeQWhoq3wv0-veCYRY1YIgU2DTMYPsQYykQg-pTJg";
const GEMINI_MODEL = "gemini-2.5-flash";
const SYSTEM_PROMPT = `You are "राम दूत AI", a friendly doubt-solving tutor for students of Shree Ram Classes (Classes 8 to 12: Physics, Chemistry, Mathematics, Biology, English, Computer Science).
- Reply in the same language the student uses (English, Hindi or Hinglish).
- Explain step by step in simple words, with a short example when helpful.
- For maths and numericals, show each step and the final answer clearly.
- Keep answers short and clear, ideal for reading on a phone.
- If the question is not about studies, politely say you can only help with studies.
- If unsure, say so honestly. Encourage the student to ask their teacher for confirmation.
- Never help with cheating in exams.`;

(function(){
  const css = `
  #aiBtn{position:fixed;right:16px;bottom:16px;z-index:9000;width:68px;height:68px;padding:0;border:3px solid #f28a17;border-radius:50%;overflow:hidden;background:#fffdf8;box-shadow:0 8px 22px rgba(0,0,0,.3);cursor:pointer;animation:aiFloat 3s ease-in-out infinite}
  #aiBtn img{width:100%;height:100%;object-fit:cover;display:block}
  @keyframes aiFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-6px)}}
  #aiPanel{position:fixed;right:12px;bottom:12px;left:12px;max-width:420px;margin-left:auto;height:70vh;max-height:560px;z-index:9001;display:none;flex-direction:column;background:#fff;color:#10243a;border:1px solid #e8edf2;border-radius:18px;box-shadow:0 14px 40px rgba(0,0,0,.35);overflow:hidden}
  #aiPanel.open{display:flex}
  .ai-head{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;background:#063b72;color:#fff;font-weight:800}
  .ai-head button{border:0;background:transparent;color:#fff;font-size:22px;cursor:pointer}
  #aiMsgs{flex:1;overflow-y:auto;padding:12px;display:flex;flex-direction:column;gap:8px;background:#f5f8fb}
  .ai-m{max-width:85%;padding:10px 12px;border-radius:14px;font-size:14px;line-height:1.45;white-space:pre-wrap;word-wrap:break-word}
  .ai-m.bot{align-self:flex-start;background:#fff;border:1px solid #e8edf2}
  .ai-m.me{align-self:flex-end;background:#0b6fae;color:#fff}
  .ai-form{display:flex;gap:8px;padding:10px;border-top:1px solid #e8edf2;background:#fff}
  .ai-form input{flex:1;min-width:0}
  .ai-form button{border:0;border-radius:11px;padding:0 16px;font-weight:800;color:#fff;background:#063b72;cursor:pointer}
  body.dark #aiPanel{background:#121c2d;color:#e6edf5;border-color:#1f2c3f}
  body.dark #aiMsgs{background:#0b1220}
  body.dark .ai-m.bot{background:#121c2d;border-color:#1f2c3f;color:#e6edf5}
  body.dark .ai-form{background:#121c2d;border-color:#1f2c3f}
  `;
  const st = document.createElement('style'); st.textContent = css; document.head.appendChild(st);

  const btn = document.createElement('button');
  btn.id = 'aiBtn'; btn.setAttribute('aria-label','राम दूत AI'); btn.innerHTML = '<img src="ram-doot.jpg" alt="राम दूत AI">';
  const panel = document.createElement('div');
  panel.id = 'aiPanel';
  panel.innerHTML = `
    <div class="ai-head"><span>🙏 राम दूत AI — Doubt Solver</span><button id="aiClose" aria-label="Close">×</button></div>
    <div id="aiMsgs"></div>
    <form class="ai-form" id="aiForm">
      <input id="aiInput" type="text" placeholder="Type your doubt..." autocomplete="off" required>
      <button type="submit">Send</button>
    </form>`;
  document.body.append(btn, panel);

  const msgs = panel.querySelector('#aiMsgs');
  const input = panel.querySelector('#aiInput');
  const history = [];
  let waiting = false;

  const add = (text, who) => {
    const d = document.createElement('div');
    d.className = 'ai-m ' + who; d.textContent = text;
    msgs.appendChild(d); msgs.scrollTop = msgs.scrollHeight;
    return d;
  };
  add('जय श्री राम! 🙏 मैं राम दूत AI हूँ। Class 8–12 का कोई भी doubt पूछिए — Physics, Chemistry, Maths, Biology, English या Computer Science.', 'bot');

  btn.onclick = () => { panel.classList.add('open'); btn.style.display = 'none'; input.focus(); };
  panel.querySelector('#aiClose').onclick = () => { panel.classList.remove('open'); btn.style.display = ''; };

  // keep taps inside the chat from triggering the triple-tap Easter egg
  ['touchstart','touchend'].forEach(ev => panel.addEventListener(ev, e => e.stopPropagation(), {passive:true}));

  panel.querySelector('#aiForm').addEventListener('submit', async e => {
    e.preventDefault();
    const q = input.value.trim();
    if(!q || waiting) return;
    input.value = ''; add(q, 'me'); history.push({role:'user', content:q});
    const typing = add('Thinking…', 'bot');
    waiting = true;
    try{
      const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/' + GEMINI_MODEL + ':generateContent', {
        method:'POST',
        headers:{'Content-Type':'application/json','x-goog-api-key':GEMINI_API_KEY},
        body: JSON.stringify({
          systemInstruction:{parts:[{text:SYSTEM_PROMPT}]},
          contents: history.slice(-10).map(m => ({role: m.role === 'assistant' ? 'model' : 'user', parts:[{text:m.content}]})),
          generationConfig:{maxOutputTokens:900, thinkingConfig:{thinkingBudget:0}}
        })
      });
      const data = await r.json();
      const reply = (data.candidates && data.candidates[0] && data.candidates[0].content &&
        data.candidates[0].content.parts.map(p => p.text || '').join('')) ||
        (data.error ? 'Error: ' + data.error.message : 'Sorry, something went wrong. Please try again.');
      typing.textContent = reply; history.push({role:'assistant', content:reply});
    }catch(err){
      typing.textContent = 'Could not connect. Please check your internet and try again.';
      history.pop();
    }
    waiting = false; msgs.scrollTop = msgs.scrollHeight;
  });
})();
