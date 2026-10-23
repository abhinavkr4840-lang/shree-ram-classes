/* Jeevlok art: original flat-style animal illustrations (7 species) and the park scene. Plain SVG strings, no images to download.
   Animals are drawn facing right in a 120x100 box; the ground line is y=96. Classes jv-eyes / jv-tail let the game animate them. */
(function(){
  'use strict';
  const eye = (x, y, r) => `<g class="jv-eyes"><circle cx="${x}" cy="${y}" r="${r}" fill="#fff"/><circle cx="${x + r * 0.2}" cy="${y}" r="${r * 0.62}" fill="#1b1b22"/><circle cx="${x + r * 0.4}" cy="${y - r * 0.3}" r="${r * 0.22}" fill="#fff"/></g>`;
  const shadow = (cx, rx) => `<ellipse cx="${cx}" cy="97" rx="${rx}" ry="3.6" fill="#000" opacity=".2"/>`;
  const A = {};

  A.parrot = () => shadow(58, 24) + `
    <path d="M18 98 H92" stroke="#7a4b24" stroke-width="5" stroke-linecap="round"/><path d="M30 98 l-6 -4 M80 98 l8 -5" stroke="#7a4b24" stroke-width="3" stroke-linecap="round"/>
    <g class="jv-tail"><path d="M50 72 Q38 88 36 100 L44 96 L48 104 L54 92 L60 100 L60 76 Z" fill="#1d6fdc"/><path d="M52 74 Q44 86 44 96 L50 90 L54 98 L58 80 Z" fill="#e63946"/></g>
    <ellipse cx="60" cy="60" rx="21" ry="32" transform="rotate(-6 60 60)" fill="#e63946"/>
    <path d="M50 44 Q36 64 48 90 Q62 76 62 54 Z" fill="#1d6fdc"/><path d="M47 62 Q44 74 49 84 Q56 72 56 62 Z" fill="#f6c915"/><path d="M42 54 Q39 66 44 76" stroke="#0e4ca8" stroke-width="2" fill="none"/>
    <circle cx="66" cy="30" r="17" fill="#e63946"/><ellipse cx="72" cy="31" rx="10" ry="8.5" fill="#fff"/>
    ${eye(73, 30, 3.8)}
    <path d="M80 22 Q101 22 98 42 Q94 34 82 36 Z" fill="#f4ead2"/><path d="M90 30 Q99 32 98 42 Q94 36 90 36 Z" fill="#2b2b33"/>
    <path d="M56 91 v6 m6 -6 v6" stroke="#f08a1c" stroke-width="3" stroke-linecap="round"/>`;

  A.rhino = () => shadow(60, 44) + `
    <g class="jv-tail"><path d="M20 56 Q10 58 12 70" stroke="#6f7a88" stroke-width="3" fill="none" stroke-linecap="round"/></g>
    <rect x="28" y="70" width="12" height="26" rx="4" fill="#78828f"/><rect x="74" y="70" width="12" height="26" rx="4" fill="#78828f"/>
    <rect x="22" y="38" width="76" height="46" rx="22" fill="#98a3b1"/><path d="M30 44 Q60 36 90 48" stroke="#aab4c0" stroke-width="3" fill="none" opacity=".7"/>
    <rect x="42" y="70" width="12" height="26" rx="4" fill="#8892a0"/><rect x="62" y="70" width="12" height="26" rx="4" fill="#8892a0"/>
    <path d="M30 60 Q36 58 40 62 M64 52 Q72 50 78 56" stroke="#7d8896" stroke-width="2" fill="none"/>
    <ellipse cx="98" cy="62" rx="20" ry="17" fill="#a4aebb"/><ellipse cx="112" cy="68" rx="7" ry="8" fill="#8c97a5"/>
    <path d="M104 52 Q112 34 118 30 Q116 44 112 54 Z" fill="#f1e6cf"/><path d="M96 48 Q99 40 104 46 Z" fill="#f1e6cf" opacity=".0"/>
    <path d="M86 44 Q84 34 92 38 Z" fill="#8c97a5"/><ellipse cx="90" cy="48" rx="6" ry="7" fill="#8c97a5"/>
    ${eye(100, 56, 3.2)}<circle cx="113" cy="66" r="1.4" fill="#4d5560"/>`;

  A.sheep = () => shadow(58, 34) + `
    <rect x="34" y="72" width="6" height="24" rx="3" fill="#35353d"/><rect x="48" y="74" width="6" height="22" rx="3" fill="#35353d"/><rect x="72" y="74" width="6" height="22" rx="3" fill="#35353d"/><rect x="84" y="72" width="6" height="24" rx="3" fill="#35353d"/>
    <g fill="#fbfbfb" stroke="#e1e1e6" stroke-width="1.2">
      <circle cx="40" cy="56" r="15"/><circle cx="56" cy="48" r="17"/><circle cx="74" cy="50" r="16"/><circle cx="84" cy="62" r="13"/><circle cx="62" cy="66" r="16"/><circle cx="46" cy="68" r="12"/><circle cx="32" cy="64" r="9"/>
    </g>
    <g class="jv-tail"><circle cx="24" cy="58" r="8" fill="#fbfbfb" stroke="#e1e1e6" stroke-width="1.2"/></g>
    <ellipse cx="100" cy="52" rx="14" ry="13" fill="#3b3b45"/><path d="M90 40 Q76 36 80 50 Q86 46 92 46 Z" fill="#2c2c34"/><circle cx="92" cy="42" r="7" fill="#fbfbfb" stroke="#e1e1e6"/><ellipse cx="88" cy="56" rx="4" ry="6" fill="#2c2c34"/>
    ${eye(100, 50, 3.1)}<ellipse cx="111" cy="56" rx="3" ry="2.4" fill="#f3a8b8"/>`;

  A.fox = () => shadow(58, 36) + `
    <g class="jv-tail"><path d="M30 70 Q6 72 8 42 Q10 28 20 34 Q18 50 40 60 Z" fill="#ef7d1a"/><path d="M8 42 Q10 28 20 34 Q16 38 14 46 Z" fill="#fff"/></g>
    <rect x="38" y="76" width="7" height="20" rx="3" fill="#3a2a22"/><rect x="50" y="78" width="7" height="18" rx="3" fill="#3a2a22"/><rect x="74" y="78" width="7" height="18" rx="3" fill="#3a2a22"/><rect x="86" y="76" width="7" height="20" rx="3" fill="#3a2a22"/>
    <ellipse cx="62" cy="64" rx="34" ry="20" fill="#ef7d1a"/><path d="M74 76 Q90 60 96 66 Q88 84 64 82 Z" fill="#fff4e6"/>
    <path d="M90 52 L88 28 L102 44 Z" fill="#ef7d1a"/><path d="M90 48 L89.5 34 L98 44 Z" fill="#2a2024"/>
    <path d="M96 62 Q94 44 108 40 L122 56 Q114 72 96 70 Z" fill="#ef7d1a"/><path d="M104 66 Q118 66 122 56 Q108 60 100 56 Z" fill="#fff4e6"/><circle cx="121" cy="56" r="3" fill="#2a2024"/>
    ${eye(106, 52, 3)}<path d="M92 44 L102 36 L106 46 Z" fill="#ef7d1a"/><path d="M96 42 L101 38 L103 44 Z" fill="#2a2024"/>`;

  A.deer = () => shadow(60, 32) + `
    <g class="jv-tail"><path d="M28 56 Q20 58 22 66 Q30 66 32 60 Z" fill="#fff"/></g>
    <rect x="36" y="74" width="5" height="23" rx="2.5" fill="#7c5230"/><rect x="48" y="76" width="5" height="21" rx="2.5" fill="#6d4628"/><rect x="72" y="76" width="5" height="21" rx="2.5" fill="#6d4628"/><rect x="84" y="74" width="5" height="23" rx="2.5" fill="#7c5230"/>
    <ellipse cx="60" cy="64" rx="32" ry="17" fill="#b9793e"/><path d="M34 70 Q60 84 88 70 Q60 78 34 70 Z" fill="#f1d9b4"/>
    <g fill="#f4e2c4"><circle cx="48" cy="58" r="2.4"/><circle cx="60" cy="54" r="2.4"/><circle cx="72" cy="58" r="2.4"/><circle cx="55" cy="64" r="2"/><circle cx="68" cy="65" r="2"/></g>
    <path d="M84 56 Q92 38 98 30 L108 34 Q100 46 94 62 Z" fill="#b9793e"/>
    <ellipse cx="104" cy="30" rx="12" ry="9" transform="rotate(-18 104 30)" fill="#c88649"/><ellipse cx="114" cy="33" rx="4.5" ry="4" fill="#3a2a22"/>
    <path d="M92 26 Q84 22 82 32 Q90 34 94 30 Z" fill="#a8672f"/>
    <path d="M98 22 Q94 10 90 6 M96 14 Q90 12 86 14 M100 22 Q104 10 110 6 M102 14 Q108 14 112 10" stroke="#6b4423" stroke-width="2.6" fill="none" stroke-linecap="round"/>
    ${eye(106, 27, 2.8)}`;

  A.duck = () => shadow(58, 30) + `
    <g class="jv-tail"><path d="M26 58 Q14 54 12 44 Q24 48 34 54 Z" fill="#7a5a3b"/></g>
    <ellipse cx="56" cy="66" rx="32" ry="22" fill="#9a7b58"/><path d="M30 70 Q56 90 84 68 Q56 82 30 70 Z" fill="#c9b48e"/>
    <path d="M44 56 Q60 46 78 58 Q62 70 44 62 Z" fill="#7a5a3b"/><path d="M50 58 Q62 52 74 60" stroke="#b8956a" stroke-width="2" fill="none"/>
    <rect x="48" y="84" width="4" height="12" fill="#f08a1c"/><rect x="64" y="84" width="4" height="12" fill="#f08a1c"/><path d="M44 97 h14 M60 97 h14" stroke="#f08a1c" stroke-width="3.4" stroke-linecap="round"/>
    <rect x="74" y="34" width="14" height="30" rx="7" fill="#1f8a4c"/><path d="M72 46 h18" stroke="#fff" stroke-width="3"/>
    <circle cx="86" cy="30" r="15" fill="#1f8a4c"/>
    <path d="M96 28 Q114 28 112 36 Q104 40 96 38 Z" fill="#f4c20d"/><path d="M96 33 Q106 34 112 34" stroke="#d29c00" stroke-width="1.2" fill="none"/>
    ${eye(88, 26, 3.4)}`;

  A.tiger = () => shadow(60, 42) + `
    <g class="jv-tail"><path d="M24 62 Q4 62 8 36 Q10 28 16 32 Q14 48 34 54 Z" fill="#f08a1c"/><path d="M10 40 h6 M10 48 h8 M14 56 h8" stroke="#1d1d24" stroke-width="3"/></g>
    <rect x="32" y="74" width="9" height="22" rx="4" fill="#e07c14"/><rect x="48" y="76" width="9" height="20" rx="4" fill="#e07c14"/><rect x="72" y="76" width="9" height="20" rx="4" fill="#e07c14"/><rect x="86" y="74" width="9" height="22" rx="4" fill="#e07c14"/>
    <path d="M32 90 h9 M86 90 h9" stroke="#fff4e6" stroke-width="5"/>
    <ellipse cx="62" cy="62" rx="38" ry="22" fill="#f59a23"/><path d="M34 72 Q62 88 90 72 Q62 80 34 72 Z" fill="#fff4e6"/>
    <g stroke="#1d1d24" stroke-width="4" stroke-linecap="round" fill="none"><path d="M40 44 Q44 54 40 62"/><path d="M52 41 Q57 54 52 66"/><path d="M64 40 Q69 54 64 66"/><path d="M76 42 Q80 54 76 64"/><path d="M88 46 Q90 54 88 60"/></g>
    <circle cx="96" cy="48" r="7" fill="#f59a23"/><circle cx="96" cy="48" r="3.6" fill="#1d1d24" opacity=".85"/><circle cx="112" cy="46" r="7" fill="#f59a23"/><circle cx="112" cy="46" r="3.6" fill="#1d1d24" opacity=".85"/>
    <ellipse cx="104" cy="62" rx="19" ry="17" fill="#f59a23"/><ellipse cx="108" cy="70" rx="11" ry="8" fill="#fff4e6"/><path d="M104 60 L110 60 L107 65 Z" fill="#e0627a"/><path d="M107 65 v4" stroke="#1d1d24" stroke-width="1.6"/>
    <path d="M93 52 l5 4 M91 60 l6 1 M117 52 l-5 4" stroke="#1d1d24" stroke-width="2.6" stroke-linecap="round"/><path d="M104 44 v7" stroke="#1d1d24" stroke-width="3" stroke-linecap="round"/>
    ${eye(100, 56, 2.9)}${eye(114, 55, 2.5)}`;

  const SPECIES = [
    {id:'parrot', name:'Parrot', emoji:'🦜', scale:0.9}, {id:'rhino', name:'Rhino', emoji:'🦏', scale:1.25}, {id:'sheep', name:'Sheep', emoji:'🐑', scale:1.0},
    {id:'fox', name:'Fox', emoji:'🦊', scale:1.0}, {id:'deer', name:'Deer', emoji:'🦌', scale:1.15}, {id:'duck', name:'Duck', emoji:'🦆', scale:0.85}, {id:'tiger', name:'Tiger', emoji:'🐅', scale:1.2}
  ];
  const animal = (id, cls) => `<svg class="${cls || ''}" viewBox="0 0 120 100" width="100%" height="100%" aria-hidden="true" focusable="false">${(A[id] || A.sheep)()}</svg>`;

  /* ---------- the park (1000 x 560) ---------- */
  function park(){
    const tree = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-7" y="-60" width="14" height="62" rx="4" fill="#7a4b24"/><circle cx="0" cy="-86" r="40" fill="${c}"/><circle cx="-28" cy="-66" r="28" fill="${c}"/><circle cx="28" cy="-68" r="29" fill="${c}"/><circle cx="-8" cy="-100" r="20" fill="#ffffff" opacity=".08"/></g>`;
    const flower = (x, y, c) => `<g transform="translate(${x} ${y})"><path d="M0 0 v10" stroke="#2e8b3a" stroke-width="1.6"/><circle r="3.2" fill="${c}"/><circle r="1.3" fill="#ffe27a"/></g>`;
    let flowers = '';
    const cs = ['#ff6fa5', '#ffd54a', '#ffffff', '#9f7bff', '#ff8a3d'];
    for(let i = 0; i < 46; i++){ const x = (i * 211 % 960) + 20, y = 330 + (i * 97 % 200); flowers += flower(x, y, cs[i % cs.length]); }
    return `<svg viewBox="0 0 1000 560" preserveAspectRatio="none" width="100%" height="100%" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="jvSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ec6ff"/><stop offset="1" stop-color="#d7f1ff"/></linearGradient>
        <linearGradient id="jvGrass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7ccf5a"/><stop offset="1" stop-color="#3f9b3a"/></linearGradient>
        <radialGradient id="jvSun"><stop offset="0" stop-color="#fff7b0"/><stop offset="1" stop-color="#ffd54a" stop-opacity="0"/></radialGradient>
        <linearGradient id="jvPond" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6fd0ff"/><stop offset="1" stop-color="#2f8fd0"/></linearGradient>
      </defs>
      <rect width="1000" height="560" fill="url(#jvSky)"/>
      <circle cx="840" cy="90" r="90" fill="url(#jvSun)"/><circle cx="840" cy="90" r="34" fill="#ffe27a"/>
      <g class="jv-cloud" opacity=".95"><g fill="#fff"><ellipse cx="170" cy="86" rx="60" ry="20"/><ellipse cx="206" cy="70" rx="40" ry="22"/><ellipse cx="136" cy="74" rx="34" ry="18"/></g></g>
      <g class="jv-cloud2" opacity=".9"><g fill="#fff"><ellipse cx="560" cy="60" rx="52" ry="16"/><ellipse cx="590" cy="48" rx="30" ry="16"/></g></g>
      <path d="M0 250 Q120 170 260 235 Q380 175 520 232 Q660 168 800 230 Q900 190 1000 236 V300 H0 Z" fill="#8fd18a"/>
      <path d="M0 270 Q150 225 300 262 Q460 215 620 262 Q780 220 1000 268 V320 H0 Z" fill="#6fbf6a"/>
      ${tree(70, 292, 0.8, '#2f9e4f')}${tree(330, 280, 0.6, '#3aa85a')}${tree(640, 286, 0.7, '#2f9e4f')}${tree(930, 296, 0.9, '#2a8f48')}${tree(210, 300, 0.5, '#46b566')}
      <rect y="292" width="1000" height="268" fill="url(#jvGrass)"/>
      <path d="M0 300 H1000" stroke="#2f7d33" stroke-width="2" opacity=".4"/>
      <g stroke="#e9d6b0" stroke-width="5" stroke-linecap="round"><path d="M0 318 H1000"/>${Array.from({length: 26}, (_, i) => `<path d="M${i * 40 + 10} 300 V332"/>`).join('')}</g>
      <path d="M-20 560 Q260 430 470 470 Q690 505 1020 390 L1020 440 Q700 560 470 520 Q250 490 120 560 Z" fill="#e8cf9c" opacity=".9"/>
      <ellipse cx="760" cy="470" rx="150" ry="46" fill="#bfe8ff"/><ellipse cx="760" cy="470" rx="134" ry="38" fill="url(#jvPond)"/>
      <g class="jv-ripple" fill="none" stroke="#fff" stroke-width="2" opacity=".6"><ellipse cx="730" cy="468" rx="30" ry="8"/><ellipse cx="800" cy="480" rx="22" ry="6"/></g>
      <g fill="#4aa84a"><ellipse cx="690" cy="488" rx="14" ry="5"/><ellipse cx="840" cy="456" rx="12" ry="4"/></g><circle cx="690" cy="484" r="3" fill="#ff8fb4"/>
      ${flowers}
      <g transform="translate(130 430)"><rect x="0" y="0" width="100" height="10" rx="4" fill="#8a5a2b"/><rect x="0" y="-20" width="100" height="8" rx="3" fill="#8a5a2b"/><rect x="8" y="10" width="8" height="26" fill="#5f3f1f"/><rect x="84" y="10" width="8" height="26" fill="#5f3f1f"/><rect x="8" y="-28" width="6" height="30" fill="#5f3f1f"/><rect x="86" y="-28" width="6" height="30" fill="#5f3f1f"/></g>
      <g transform="translate(500 300)"><rect x="-3" y="-56" width="6" height="58" fill="#3f4650"/><rect x="-12" y="-72" width="24" height="18" rx="5" fill="#ffe27a" stroke="#3f4650" stroke-width="3"/></g>
    </svg>`;
  }
  window.JeevlokArt = {SPECIES, animal, park};
})();
