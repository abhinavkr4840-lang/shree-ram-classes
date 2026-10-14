/* RAM LAB — Optical experiments: Refraction Lab + Prism Lab.
   Load after ram-lab.js and the existing Physics Lab experiment files.
   This is an additive module; it does not replace existing simulations. */
(function () {
  'use strict';
  const RL = window.RamLab;
  if (!RL) { console.warn('ram-lab-optics.js: load ram-lab.js first'); return; }
  const { clamp, fmt } = RL.util;
  const TX = (x, y, t, o) => `<text x="${x}" y="${y}" text-anchor="${(o && o.a) || 'middle'}" font-size="${(o && o.s) || 12}" font-weight="${(o && o.w) || 700}" fill="${(o && o.c) || '#fff'}" pointer-events="none">${t}</text>`;
  /* ============================ REFRACTION LAB ============================ */
  const REF_MEDIA = {
    air: { label: 'Air', n: 1.0003 }, water: { label: 'Water', n: 1.333 },
    glass: { label: 'Ordinary glass', n: 1.50 }, flint: { label: 'Flint glass', n: 1.62 },
    diamond: { label: 'Diamond', n: 2.42 }, custom: { label: 'Custom medium', n: 1.40 }
  };
  const refRad = d => d * Math.PI / 180;
  const refDeg = r => r * 180 / Math.PI;
  const refSnell = (n1, n2, i) => {
    const q = n1 * Math.sin(refRad(i)) / n2;
    return q <= 1 + 1e-10 ? refDeg(Math.asin(Math.max(-1, Math.min(1, q)))) : null;
  };
  const refCritical = (n1, n2) => n1 > n2 ? refDeg(Math.asin(n2 / n1)) : null;
  const refLabel = (k, n) => (REF_MEDIA[k] || REF_MEDIA.custom).label + ' (n ≈ ' + fmt(n, 3) + ')';
  function refLine(x1, y1, x2, y2, color, width, dash) {
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color || '#e8eeff'}" stroke-width="${width || 3}" stroke-linecap="round"${dash ? ` stroke-dasharray="${dash}"` : ''}/>`;
  }
  function refArc(cx, cy, r, a1, a2, color) {
    const p1 = [cx + r * Math.sin(refRad(a1)), cy - r * Math.cos(refRad(a1))];
    const p2 = [cx + r * Math.sin(refRad(a2)), cy - r * Math.cos(refRad(a2))];
    const delta = Math.abs(a2 - a1), large = delta > 180 ? 1 : 0;
    return `<path d="M${p1[0]} ${p1[1]} A${r} ${r} 0 ${large} 1 ${p2[0]} ${p2[1]}" fill="none" stroke="${color || '#ffd23f'}" stroke-width="2"/>`;
  }
  function refractionState(W) {
    const n1 = clamp(+W.params.n1 || 1, 1, 2.5), n2 = clamp(+W.params.n2 || 1.5, 1, 2.5);
    const i = clamp(+W.params.i || 0, 0, 80), r = refSnell(n1, n2, i), C = refCritical(n1, n2);
    return { n1, n2, i, r, C, tir: r == null, mode: W.params.mode || 'interface',
      t: clamp(+W.params.thickness || 4, 1, 10), depth: clamp(+W.params.depth || 8, 1, 20) };
  }
  function refractionSVG(W) {
    const s = refractionState(W), x = 500, y = 275, i = s.i, r = s.r;
    const m1 = (REF_MEDIA[W.params.medium1] || REF_MEDIA.custom).label;
    const m2 = (REF_MEDIA[W.params.medium2] || REF_MEDIA.custom).label;
    let out = `<defs><linearGradient id="rlRefM1" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#1d3f72" stop-opacity=".8"/><stop offset="1" stop-color="#13264c" stop-opacity=".65"/></linearGradient><linearGradient id="rlRefM2" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#155e75" stop-opacity=".7"/><stop offset="1" stop-color="#0c3448" stop-opacity=".8"/></linearGradient></defs>`;
    if (s.mode === 'depth') {
      const dpx = s.depth * 12, apx = dpx / s.n2, iy = 190, ox = 610;
      out += `<rect x="0" y="0" width="1000" height="${iy}" fill="#11213f"/><rect x="0" y="${iy}" width="1000" height="${560-iy}" fill="url(#rlRefM2)"/>`;
      out += refLine(0, iy, 1000, iy, '#9fb4ff', 3) + TX(170, iy - 15, 'Air (observer side)', {a:'start',s:13,c:'#9fc4ff'}) + TX(170, iy + 24, m2 + ' · n = ' + fmt(s.n2,3), {a:'start',s:13,c:'#9fc4ff'});
      out += `<circle cx="${ox}" cy="${iy+dpx}" r="9" fill="#ffd23f" stroke="#fff" stroke-width="2"/>` + TX(ox+25,iy+dpx+5,'Real object',{a:'start',s:13,c:'#ffe9a8'});
      out += `<circle cx="${ox}" cy="${iy+apx}" r="7" fill="none" stroke="#ff8a8a" stroke-width="2.5" stroke-dasharray="4 3"/>` + TX(ox+25,iy+apx-12,'Apparent image',{a:'start',s:13,c:'#ffb3b3'});
      out += refLine(ox,iy,ox,iy+dpx,'#ffd23f',2,'5 5') + refLine(ox+60,iy,ox+60,iy+apx,'#ff8a8a',2,'4 4');
      out += refLine(ox-18,iy+dpx,ox+18,iy+dpx,'#ffd23f',2) + refLine(ox+42,iy+apx,ox+78,iy+apx,'#ff8a8a',2);
      out += TX(500,505,'Apparent depth ≈ real depth / n  (near-normal viewing from air)',{s:15,c:'#ffe9a8'});
      return out;
    }
    if (s.mode === 'multiple') {
      const mirrorGap = 430, top = 105, bottom = 455, objX = clamp(+W.params.objectPosition || 50, 15, 85) * 10;
      const objKind = W.params.objectType || 'arrow';
      out += `<rect x="0" y="0" width="1000" height="560" fill="#10203e"/>`;
      out += refLine(270,top,270,bottom,'#b9d7ff',9) + refLine(700,top,700,bottom,'#b9d7ff',9);
      out += TX(270,top-18,'Plane mirror A',{s:13,c:'#cfe1ff'}) + TX(700,top-18,'Plane mirror B',{s:13,c:'#cfe1ff'});
      const ox = clamp(270 + (objX/100)*430, 320, 650), oy = 300;
      if (objKind === 'coin') out += `<circle cx="${ox}" cy="${oy}" r="13" fill="#ffd23f" stroke="#fff" stroke-width="2"/>`;
      else if (objKind === 'candle') out += `<rect x="${ox-5}" y="${oy-35}" width="10" height="40" rx="3" fill="#ffe9a8"/><path d="M${ox} ${oy-36} q-12 -15 0 -25 q12 12 0 25" fill="#ff8a35"/>`;
      else out += `<path d="M${ox} ${oy+18} L${ox} ${oy-20} M${ox} ${oy-20} l-9 12 M${ox} ${oy-20} l9 12" stroke="#ffd23f" stroke-width="5" stroke-linecap="round"/>`;
      out += TX(ox,oy+42,'Object',{s:13,c:'#ffe9a8'});
      [-2,-1,1,2].forEach((k,j)=>{ const ix=ox + (k<0 ? (ox-270)*2*k : (700-ox)*2*k); const x=clamp(ix,35,940); out += `<path d="M${x} ${oy+18} L${x} ${oy-20}" stroke="#ff8a8a" stroke-width="3" stroke-dasharray="5 4"/>`; out += TX(x,oy-31,'Image',{s:10,c:'#ffb3b3'}); });
      out += refLine(ox,oy,270,oy,'#ffd23f',1.5,'5 5') + refLine(ox,oy,700,oy,'#ffd23f',1.5,'5 5');
      out += TX(500,515,'Two parallel mirrors produce repeated images; ideal parallel mirrors form infinitely many images.',{s:14,c:'#ffe9a8'});
      out += TX(500,540,'Illustration: image positions are schematic, not a full mirror-ray solver.',{s:11,c:'#d7e4ff'});
      return out;
    }
    if (s.mode === 'slab') {
      const top = 160, T = s.t * 18, bottom = top + T, hit = 405;
      const ri = refSnell(s.n1, s.n2, i) == null ? 0 : refSnell(s.n1, s.n2, i);
      const xTop = hit, xBottom = hit + T * Math.tan(refRad(ri));
      const startY = top - 120, startX = hit - (top - startY) * Math.tan(refRad(i));
      const endX = xBottom + (480 - bottom) * Math.tan(refRad(i));
      const projS = (xBottom-hit)*Math.sin(refRad(i)) + T*Math.cos(refRad(i));
      const projX = hit + projS*Math.sin(refRad(i)), projY = top + projS*Math.cos(refRad(i));
      const dpx = T * Math.sin(refRad(i-ri)) / Math.max(0.01,Math.cos(refRad(ri)));
      const physicalD = s.t*10*Math.sin(refRad(i-ri))/Math.max(0.01,Math.cos(refRad(ri)));
      out += `<rect x="0" y="0" width="1000" height="${top}" fill="#10203e"/><rect x="0" y="${top}" width="1000" height="${T}" fill="rgba(76,201,240,.2)" stroke="#4cc9f0" stroke-width="2"/><rect x="0" y="${bottom}" width="1000" height="${560-bottom}" fill="#10203e"/>`;
      out += TX(760,top+T/2,m2+' · n = '+fmt(s.n2,3),{s:14,c:'#9be7ff'});
      if (refSnell(s.n1,s.n2,i) == null) {
        const reflectedEnd = [hit + 160*Math.sin(refRad(i)), top - 160*Math.cos(refRad(i))];
        out += refLine(hit,top-90,hit,top+T+85,'#9fb4ff',2,'6 5')
          + refLine(startX,startY,hit,top,'#ff6b6b',4)
          + refLine(hit,top,reflectedEnd[0],reflectedEnd[1],'#ffd23f',3)
          + TX(hit-25,top-28,'i = '+fmt(i,1)+'°',{a:'end',s:12,c:'#ffe9a8'})
          + TX(700,top+T+70,'TOTAL INTERNAL REFLECTION',{s:14,c:'#ffd23f'})
          + TX(700,top+T+92,'No transmitted ray through the first face',{s:11,c:'#ffe9a8'});
        return out;
      }
      out += refLine(hit,top-90,hit,top+T+85,'#9fb4ff',2,'6 5') + refLine(startX,startY,hit,top,'#ff6b6b',4) + refLine(hit,top,xBottom,bottom,'#4ade80',4) + refLine(xBottom,bottom,endX,480,'#ff6b6b',4);
      out += refLine(startX,startY,hit+T*Math.tan(refRad(i)),bottom,'#ff6b6b',2,'6 5');
      out += refLine(projX,projY,xBottom,bottom,'#ffd23f',2,'4 4') + TX((projX+xBottom)/2+18,(projY+bottom)/2,'d',{s:15,c:'#ffd23f'});
      out += refArc(hit,top,35,0,i,'#ffd23f') + TX(hit-40,top-24,'i = '+fmt(i,1)+'°',{s:12,c:'#ffe9a8'});
      out += refArc(hit,top,27,0,ri,'#4ade80') + TX(hit+45,top+45,'r = '+fmt(ri,1)+'°',{s:12,c:'#86efac'});
      out += refArc(xBottom,bottom,30,0,i,'#ffd23f') + TX(xBottom+55,bottom+36,'e ≈ '+fmt(i,1)+'°',{s:12,c:'#ffe9a8'});
      out += TX(165,510,'Parallel faces + same outside medium → emergent ray parallel to incident ray',{a:'start',s:13,c:'#d7e4ff'});
      out += TX(165,532,'Lateral displacement d = t sin(i − r) / cos r ≈ '+fmt(physicalD,2)+' mm',{a:'start',s:13,c:'#ffe9a8'});
      return out;
    }
    const isTIR = s.mode === 'tir' || s.tir;
    out += `<rect x="0" y="0" width="1000" height="${y}" fill="url(#rlRefM1)"/><rect x="0" y="${y}" width="1000" height="${560-y}" fill="url(#rlRefM2)"/>`;
    out += refLine(0,y,1000,y,'#9fb4ff',3) + TX(150,38,refLabel(W.params.medium1,s.n1),{a:'start',s:13,c:'#cfe1ff'}) + TX(150, y+28,refLabel(W.params.medium2,s.n2),{a:'start',s:13,c:'#9be7ff'});
    out += refLine(x,y-205,x,y+205,'#e8eeff',2,'7 6');
    const start = [x- Math.sin(refRad(i))*220, y-Math.cos(refRad(i))*220];
    const objectType = W.params.objectType || 'arrow';
    if (objectType === 'coin') out += `<circle cx="${start[0]-18}" cy="${start[1]}" r="8" fill="#ffd23f" stroke="#fff" stroke-width="1.5"/>`;
    else if (objectType === 'candle') out += `<rect x="${start[0]-22}" y="${start[1]-12}" width="7" height="24" rx="2" fill="#ffe9a8"/><path d="M${start[0]-18.5} ${start[1]-13} q-7 -8 0 -13 q7 7 0 13" fill="#ff8a35"/>`;
    else out += `<path d="M${start[0]-18} ${start[1]+10} L${start[0]-18} ${start[1]-10} M${start[0]-18} ${start[1]-10} l-5 6 M${start[0]-18} ${start[1]-10} l5 6" stroke="#ffd23f" stroke-width="3" stroke-linecap="round"/>`;
    out += TX(start[0]-18,start[1]+28,'Object',{s:10,c:'#ffe9a8'});
    out += refLine(start[0],start[1],x,y,'#ff6b6b',4) + TX(start[0]-8,start[1]-12,'Incident ray',{a:'start',s:12,c:'#ff9b9b'});
    out += refArc(x,y,48,0,i,'#ffd23f') + TX(x+42,y-47,'i = '+fmt(i,1)+'°',{s:12,c:'#ffe9a8'});
    const reflEnd = [x+Math.sin(refRad(i))*180, y-Math.cos(refRad(i))*180];
    out += refLine(x,y,reflEnd[0],reflEnd[1],'#ffd23f',2.5) + TX(reflEnd[0]+4,reflEnd[1]-10,'Reflected',{s:11,c:'#ffe9a8'});
    if (!s.tir) {
      const end = [x+Math.sin(refRad(r))*245, y+Math.cos(refRad(r))*245];
      out += refLine(x,y,end[0],end[1],'#4ade80',4) + TX(end[0]+5,end[1]-10,'Refracted ray',{s:12,c:'#86efac'});
      out += refArc(x,y,34,0,r,'#4ade80') + TX(x+40,y+46,'r = '+fmt(r,1)+'°',{s:12,c:'#86efac'});
    } else {
      out += TX(720, y+65, 'TOTAL INTERNAL REFLECTION',{s:15,c:'#ffd23f'}) + TX(720,y+88,'No transmitted ray',{s:12,c:'#ffe9a8'});
    }
    if (s.C != null) out += TX(720, y-28, 'Critical angle C = '+fmt(s.C,2)+'°',{s:13,c:'#ffe9a8'});
    out += TX(720, 525, s.tir ? 'n₁ sin i > n₂: transmission is impossible' : (s.n2>s.n1 ? 'Bends towards the normal' : s.n2<s.n1 ? 'Bends away from the normal' : 'No bending when indices match'),{s:12,c:'#d7e4ff'});
    return out;
  }
  RL.register({
    id: 'refraction-lab', lab: 'physics', topic: 'Light', title: 'Refraction Lab', icon: '🌊', level: 'Intermediate', model: 'full', fixedView: true, animated: false,
    assumptions: 'Ideal, plane interfaces; refractive-index presets are approximate values for visible light (roughly the sodium D line where commonly quoted). The slab model assumes parallel faces and the same surrounding medium on both sides. Apparent depth uses near-normal viewing from air.',
    objective: 'Investigate Snell’s law, refraction through a parallel-sided glass slab, critical angle and total internal reflection, and apparent depth.',
    theory: '<p><b>Snell’s law:</b> n₁ sin i = n₂ sin r, where angles are measured from the normal. Light bends towards the normal when it enters a higher-index medium, and away from the normal when it enters a lower-index medium.</p><p><b>Parallel-sided slab:</b> when the outside medium is the same on both sides, the emergent ray is parallel to the incident ray, but shifted sideways. The lateral displacement is d = t sin(i − r) / cos r.</p><p><b>Critical angle:</b> it exists only when light travels from higher n to lower n: C = sin⁻¹(n₂/n₁). Above C, total internal reflection occurs. <b>Apparent depth:</b> for near-normal viewing from air, apparent depth ≈ real depth/n.</p>',
    formulas: ['n₁ sin i = n₂ sin r', 'C = sin⁻¹(n₂/n₁), only if n₁ > n₂', 'd = t sin(i − r) / cos r', 'Apparent depth ≈ real depth / n'],
    params: [
      { k:'mode', label:'Experiment', type:'select', options:[['interface','Single interface / Snell’s law'],['slab','Rectangular glass slab'],['tir','Critical angle & total internal reflection'],['depth','Real and apparent depth'],['multiple','Multiple images (two plane mirrors)']], val:'interface' },
      { k:'equipment', label:'Add equipment', type:'select', options:[['none','None / basic setup'],['slab','Rectangular glass slab'],['water','Water tank'],['mirrors','Two plane mirrors']], val:'none' },
      { k:'objectType', label:'Add object', type:'select', options:[['arrow','Arrow object'],['candle','Candle'],['coin','Coin']], val:'arrow' },
      { k:'objectPosition', label:'Object position between mirrors', min:15, max:85, step:1, unit:'%', val:50 },
      { k:'medium1', label:'Medium 1 (incident side)', type:'select', options:[['air','Air'],['water','Water'],['glass','Ordinary glass'],['flint','Flint glass'],['diamond','Diamond'],['custom','Custom']], val:'air' },
      { k:'medium2', label:'Medium 2 / slab', type:'select', options:[['air','Air'],['water','Water'],['glass','Ordinary glass'],['flint','Flint glass'],['diamond','Diamond'],['custom','Custom']], val:'glass' },
      { k:'n1', label:'Refractive index n₁', min:1, max:2.5, step:0.01, unit:'', val:1.0003 },
      { k:'n2', label:'Refractive index n₂', min:1, max:2.5, step:0.01, unit:'', val:1.5 },
      { k:'i', label:'Angle of incidence i', min:0, max:80, step:1, unit:'°', val:35 },
      { k:'thickness', label:'Slab thickness', min:1, max:10, step:0.5, unit:'cm', val:4 },
      { k:'depth', label:'Real depth', min:1, max:20, step:1, unit:'cm', val:8 }
    ],
    onParam(W,k) {
      if (k==='medium1' && W.params.medium1!=='custom') W.params.n1=REF_MEDIA[W.params.medium1].n;
      if (k==='medium2' && W.params.medium2!=='custom') W.params.n2=REF_MEDIA[W.params.medium2].n;
      if (k==='n1') W.params.medium1='custom';
      if (k==='n2') W.params.medium2='custom';
      if (k==='equipment') {
        if (W.params.equipment==='slab') W.params.mode='slab';
        else if (W.params.equipment==='water') { W.params.mode='depth'; W.params.medium2='water'; W.params.n2=REF_MEDIA.water.n; }
        else if (W.params.equipment==='mirrors') W.params.mode='multiple';
        else if (W.params.equipment==='prism') W.params.mode='interface';
      }
    },
    bg(W) { return refractionSVG(W); },
    sim() {},
    reset(W) { W.params.mode='interface'; W.params.medium1='air'; W.params.medium2='glass'; W.params.n1=1.0003; W.params.n2=1.5; W.params.i=35; W.params.thickness=4; W.params.depth=8; W.params.equipment='none'; W.params.objectType='arrow'; W.params.objectPosition=50; },
    readouts(W) {
      const s=refractionState(W), vals=[{l:'Medium 1',v:refLabel(W.params.medium1,s.n1)},{l:'Medium 2',v:refLabel(W.params.medium2,s.n2)},{l:'Angle of incidence',v:s.i,u:'°'}];
      if(s.mode==='depth') { const a=s.depth/s.n2; vals.push({l:'Real depth',v:s.depth,u:'cm'},{l:'Apparent depth',v:a,u:'cm'},{l:'Depth difference',v:s.depth-a,u:'cm'}); }
      else if(s.mode==='slab') { const r=refSnell(s.n1,s.n2,s.i); if(r==null){vals.push({l:'Ray status',v:'Total internal reflection at first interface'});} else {vals.push({l:'Angle inside slab',v:r,u:'°'},{l:'Emergence angle',v:s.i,u:'°'},{l:'Lateral displacement',v:s.t*10*Math.sin(refRad(s.i-r))/Math.max(.01,Math.cos(refRad(r))),u:'mm'});} }
      else { vals.push({l:'Angle of refraction',v:s.r,u:'°'},{l:'Critical angle',v:s.C,u:'°'},{l:'Ray behaviour',v:s.tir?'Total internal reflection':s.n2>s.n1?'Towards normal':s.n2<s.n1?'Away from normal':'No bending'}); }
      return vals;
    },
    live(W) {
      const s=refractionState(W);
      if(s.mode==='depth') return [`Apparent depth ≈ real depth / n = ${fmt(s.depth,1)} / ${fmt(s.n2,3)} = <b>${fmt(s.depth/s.n2,2)} cm</b>`, 'Approximation: near-normal viewing from air; not exact for oblique viewing.'];
      if(s.mode==='slab') { const r=refSnell(s.n1,s.n2,s.i); if(r==null)return ['n₁ sin i > n₂ at the first interface.','<b>Total internal reflection:</b> no ray enters the slab, so no slab emergence or lateral displacement is calculated.']; const d=s.t*10*Math.sin(refRad(s.i-r))/Math.max(.01,Math.cos(refRad(r))); return [`n₁ sin i = n₂ sin r; sin r = (${fmt(s.n1,3)}/${fmt(s.n2,3)}) sin(${fmt(s.i,1)}°)`, `r = <b>${fmt(r,2)}°</b>; d = t sin(i − r)/cos r = <b>${fmt(d,2)} mm</b>`]; }
      if(s.tir) return [`n₁ sin i = ${fmt(s.n1,3)} × sin(${fmt(s.i,1)}°) = ${fmt(s.n1*Math.sin(refRad(s.i)),3)} > n₂ = ${fmt(s.n2,3)}`, '<b>Total internal reflection</b>: no transmitted ray exists at this angle.'];
      return [`n₁ sin i = n₂ sin r`, `${fmt(s.n1,3)} × sin(${fmt(s.i,1)}°) = ${fmt(s.n2,3)} × sin(${fmt(s.r,2)}°)`, s.C==null?'Critical angle is not defined for this direction.':`Critical angle C = sin⁻¹(${fmt(s.n2,3)} / ${fmt(s.n1,3)}) = <b>${fmt(s.C,2)}°</b>`];
    },
    guided: { objective:'Use controlled experiments to connect the ray diagram with Snell’s law and apparent depth.', setup(W){ W.params.mode='interface';W.params.medium1='air';W.params.medium2='glass';W.params.n1=1.0003;W.params.n2=1.5;W.params.i=35; },
      steps:[
        {t:'Keep air as Medium 1 and ordinary glass as Medium 2. Change the incidence angle and compare i with r.',predict:{q:'When light enters glass from air at an oblique angle, it usually bends…',opts:['towards the normal','away from the normal','along the interface at every angle','back along the incident path'],a:0,why:'Glass has a higher refractive index than air, so the refracted angle is smaller than the incidence angle.'},ok:W=>W.params.medium1==='air'&&W.params.medium2==='glass'},
        {t:'Switch Experiment to Rectangular glass slab. Change the slab thickness and angle; compare the lateral shift.',predict:{q:'For parallel slab faces with the same medium outside, the emergent ray is…',opts:['parallel to the incident ray','always perpendicular to it','always reflected backwards','parallel to the slab surface'],a:0,why:'The second refraction restores the original direction, producing a lateral shift rather than a net angular deviation.'},ok:W=>W.params.mode==='slab'},
        {t:'Select Critical angle & total internal reflection. Set n₁ greater than n₂, then increase i past C.',predict:{q:'Total internal reflection can occur when light travels…',opts:['from higher refractive index to lower, above C','from lower to higher index at any angle','only at normal incidence','only in a vacuum'],a:0,why:'Both conditions are required: travel from denser (higher-index) to rarer (lower-index) medium, and i greater than the critical angle.'},ok:W=>W.params.mode==='tir'},
        {t:'Choose Real and apparent depth and vary real depth or the refractive index.',predict:{q:'For near-normal viewing from air into water, the apparent depth is generally…',opts:['less than the real depth','greater than the real depth','exactly double the real depth','always zero'],a:0,why:'Apparent depth ≈ real depth/n, and n is greater than 1 for water.'},ok:W=>W.params.mode==='depth'}
      ], done:W=>'Snell’s law predicts the ray direction; a parallel slab shifts the ray, total internal reflection needs n₁ > n₂ and i > C, and apparent depth is smaller than real depth in the stated approximation.'
    },
    quiz:[
      {q:'A ray travels from air (n ≈ 1) into glass (n ≈ 1.5). At oblique incidence it bends…',opts:['towards the normal','away from the normal','without changing direction in every case','only along the surface'],a:0,why:'The refractive index increases, so r is smaller than i.'},
      {q:'The critical angle is defined for light travelling from…',opts:['higher n to lower n','lower n to higher n','air into any medium at any angle','a vacuum into air only'],a:0,why:'The ratio n₂/n₁ must be less than 1.'},
      {q:'For a parallel-sided slab surrounded by the same medium, the emergent ray is…',opts:['parallel to the incident ray','always perpendicular to the incident ray','always along the normal','always totally reflected'],a:0,why:'The two parallel interfaces produce equal and opposite angular changes.'},
      {q:'Under the near-normal approximation from air, apparent depth is…',opts:['real depth divided by refractive index','real depth multiplied by refractive index','always equal to real depth plus n','independent of refractive index'],a:0,why:'Apparent depth ≈ real depth/n.'}
    ]
  });

  /* ============================ PRISM LAB ============================ */
  const PRISM_MEDIA={water:{label:'Water (illustrative prism)',n:1.333},glass:{label:'Ordinary glass',n:1.50},flint:{label:'Flint glass',n:1.62},diamond:{label:'Diamond',n:2.42},custom:{label:'Custom material',n:1.5}};
  const PRISM_COLORS=[['Violet','#a78bfa',0.012],['Indigo','#6366f1',0.008],['Blue','#38bdf8',0.005],['Green','#4ade80',0.001],['Yellow','#fde047',-0.002],['Orange','#fb923c',-0.005],['Red','#f87171',-0.008]];
  function cross2(a,b){return a[0]*b[1]-a[1]*b[0];}
  function add2(a,b){return [a[0]+b[0],a[1]+b[1]];}
  function sub2(a,b){return [a[0]-b[0],a[1]-b[1]];}
  function mul2(a,k){return [a[0]*k,a[1]*k];}
  function lineHit(P,d,Q,e){const den=cross2(d,e);if(Math.abs(den)<1e-8)return null;const qp=sub2(Q,P),t=cross2(qp,e)/den,u=cross2(qp,d)/den;return t>1e-6&&u>=-1e-6&&u<=1+1e-6?add2(P,mul2(d,t)):null;}
  function prismTrace(Adeg,ideg,nrel, apex, left, right, frac) {
    const A=refRad(Adeg), i=refRad(ideg), h=right[1]-apex[1];
    const P=add2(apex,mul2(sub2(left,apex),frac));
    const r1q=Math.sin(i)/nrel;
    if(Math.abs(r1q)>1)return {P,invalid:'No first-face transmitted ray'};
    const r1=Math.asin(Math.max(-1,Math.min(1,r1q)));
    if(r1>A+1e-8)return {P,r1:refDeg(r1),invalid:'This ray reaches the prism base before the second face'};
    const thIn=A/2-r1, d1=[Math.cos(thIn),Math.sin(thIn)];
    const P2=lineHit(P,d1,apex,sub2(right,apex));
    if(!P2)return {P,r1:refDeg(r1),invalid:'Ray does not meet the second face in this configuration'};
    const r2=A-r1, q=nrel*Math.sin(r2);
    if(q>1+1e-9) {
      const faceAngle=Math.atan2(right[1]-apex[1],right[0]-apex[0]);
      const thRef=2*faceAngle-thIn, dRef=[Math.cos(thRef),Math.sin(thRef)];
      return {P,P2,r1:refDeg(r1),r2:refDeg(r2),tir:true,thIn,d1,dRef};
    }
    const e=Math.asin(Math.max(-1,Math.min(1,q))), delta=i+e-A, thOut=-A/2+e;
    return {P,P2,r1:refDeg(r1),r2:refDeg(r2),e:refDeg(e),delta:refDeg(delta),thIn,d1,dOut:[Math.cos(thOut),Math.sin(thOut)]};
  }
  function prismState(W){return {A:clamp(+W.params.A||60,20,75),i:clamp(+W.params.i||0,0,75),n:clamp(+W.params.n||1.5,1,2.5),mode:W.params.mode||'ray',material:W.params.material||'glass'};}
  function prismSVG(W) {
    const s=prismState(W), apex=[500,90], height=345, half=height*Math.tan(refRad(s.A/2)), left=[500-half,435], right=[500+half,435], frac=.57;
    let out=`<defs><linearGradient id="rlPrismFill" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9be7ff" stop-opacity=".26"/><stop offset="1" stop-color="#4cc9f0" stop-opacity=".08"/></linearGradient></defs>`;
    if (s.mode === 'newton') {
      const p1 = [[230,100],[115,340],[345,340]], p2 = [[735,100],[620,340],[850,340]];
      out += `<polygon points="${p1.map(p=>p.join(',')).join(' ')}" fill="url(#rlPrismFill)" stroke="#9be7ff" stroke-width="3"/>`;
      out += `<polygon points="${p2.map(p=>p.join(',')).join(' ')}" fill="url(#rlPrismFill)" stroke="#9be7ff" stroke-width="3"/>`;
      out += TX(230,365,PRISM_MEDIA[s.material]?.label||'First prism',{s:12,c:'#d7e4ff'});
      out += TX(735,365,PRISM_MEDIA[W.params.material2]?.label||'Second prism',{s:12,c:'#d7e4ff'});
      out += refLine(20,220,160,220,'#fff7d6',5);
      out += TX(80,202,'White light',{s:12,c:'#fff7d6'});
      const cols=[['#f87171',-24],['#fb923c',-16],['#fde047',-8],['#4ade80',0],['#38bdf8',8],['#6366f1',16],['#a78bfa',24]];
      cols.forEach(([c,dy])=>{out+=refLine(300,220,615,220+dy,c,2.5);});
      out += TX(455,178,'Dispersed spectrum',{s:12,c:'#ffe9a8'});
      cols.forEach(([c,dy])=>{out+=refLine(615,220+dy,790,220,c,2.5);});
      out += refLine(790,220,965,220,'#fff7d6',5);
      out += TX(890,202,'Recombined white light',{s:12,c:'#fff7d6'});
      out += TX(500,425,'Newton’s prism experiment: an inverted second prism recombines the spectrum.',{s:14,c:'#ffe9a8'});
      out += TX(500,452,'Conceptual demonstration; spectrum paths are schematic.',{s:11,c:'#d7e4ff'});
      return out;
    }
    out+=`<polygon points="${apex.join(',')} ${left.join(',')} ${right.join(',')}" fill="url(#rlPrismFill)" stroke="#9be7ff" stroke-width="3"/>`;
    out+=TX(500,465,'A = '+fmt(s.A,1)+'°',{s:14,c:'#9be7ff'})+TX(500,490,PRISM_MEDIA[s.material]?.label||'Custom material',{s:12,c:'#d7e4ff'});
    const normalLen=70;
    const drawTrace=(n,color,width,label)=>{
      const tr=prismTrace(s.A,s.i,n,apex,left,right,frac);
      if(!tr.P)return '';
      const P=tr.P, thIn=refRad(s.A/2-s.i), dIn=[Math.cos(thIn),Math.sin(thIn)], start=sub2(P,mul2(dIn,260));
      let z=refLine(start[0],start[1],P[0],P[1],color,width);
      const n1=[Math.cos(refRad(s.A/2)),Math.sin(refRad(s.A/2))];
      z+=refLine(P[0]-n1[0]*normalLen,P[1]-n1[1]*normalLen,P[0]+n1[0]*normalLen,P[1]+n1[1]*normalLen,'#e8eeff',1.5,'5 5');
      if(tr.invalid){z+=TX(P[0]+20,P[1]-20,tr.invalid,{a:'start',s:11,c:'#ffb3b3'});return z;}
      z+=refLine(P[0],P[1],tr.P2[0],tr.P2[1],color,width);
      if(tr.tir){z+=TX(tr.P2[0]+10,tr.P2[1]-12,'TIR at second face',{a:'start',s:12,c:'#ffd23f'});const end=add2(tr.P2,mul2(tr.dRef,100));z+=refLine(tr.P2[0],tr.P2[1],end[0],end[1],'#ffd23f',2.5,'4 3');return z;}
      const outEnd=add2(tr.P2,mul2(tr.dOut,220));
      z+=refLine(tr.P2[0],tr.P2[1],outEnd[0],outEnd[1],color,width);
      const nOut=[Math.cos(refRad(-s.A/2)),Math.sin(refRad(-s.A/2))];
      z+=refLine(tr.P2[0]-nOut[0]*normalLen,tr.P2[1]-nOut[1]*normalLen,tr.P2[0]+nOut[0]*normalLen,tr.P2[1]+nOut[1]*normalLen,'#e8eeff',1.5,'5 5');
      if(label)z+=TX(outEnd[0]+4,outEnd[1]-8,label,{a:'start',s:11,c:color});
      return z;
    };
    if(s.mode==='dispersion') {
      const P=add2(apex,mul2(sub2(left,apex),frac)), th=refRad(s.A/2-s.i), dir=[Math.cos(th),Math.sin(th)], start=sub2(P,mul2(dir,260));
      out+=refLine(start[0],start[1],P[0],P[1],'#fff7d6',5);
      PRISM_COLORS.forEach(c=>{const nc=clamp(s.n+c[2],1.001,2.8);out+=drawTrace(nc,c[1],2.2,c[0]);});
      out+=TX(160,520,'Illustrative visible-light dispersion: violet n is higher than red n',{a:'start',s:12,c:'#ffe9a8'});
    } else out+=drawTrace(s.n,'#ff6b6b',3,'Emergent ray');
    const tr=prismTrace(s.A,s.i,s.n,apex,left,right,frac);
    if(tr.P&&tr.P2&&!tr.invalid) {
      out+=TX(tr.P[0]-12,tr.P[1]-14,'i = '+fmt(s.i,1)+'°',{a:'end',s:12,c:'#ffe9a8'});
      if(tr.r1!=null)out+=TX((tr.P[0]+tr.P2[0])/2,(tr.P[1]+tr.P2[1])/2-12,'r₁ '+fmt(tr.r1,1)+'° · r₂ '+fmt(tr.r2,1)+'°',{s:11,c:'#d7e4ff'});
      if(!tr.tir&&tr.e!=null)out+=TX(tr.P2[0]+15,tr.P2[1]+24,'e = '+fmt(tr.e,1)+'°',{a:'start',s:12,c:'#ffe9a8'});
    }
    return out;
  }
  RL.register({
    id:'prism-lab',lab:'physics',topic:'Light',title:'Prism Lab',icon:'🔺',level:'Intermediate',model:'full',fixedView:true,animated:false,
    assumptions:'The surrounding medium is air (n ≈ 1). Prism ray geometry uses ideal plane faces. Preset indices are approximate for visible light. The dispersion mode uses an illustrative wavelength-dependent index offset, not precise spectral data.',
    objective:'Trace rays through a triangular prism, investigate angular deviation and minimum deviation, compare dispersion, and explore Newton’s two-prism recombination experiment.',
    theory:'<p>For a prism, <b>A = r₁ + r₂</b> and <b>δ = i + e − A</b>. Refraction at each face follows Snell’s law. At minimum deviation, the path is symmetric: i = e and r₁ = r₂ = A/2.</p><p>The refractive index relative to the surrounding medium can be found from <b>n = sin[(A + δₘ)/2] / sin(A/2)</b>. In ordinary glass, the refractive index is generally higher for violet than red light, so violet deviates more.</p>',
    formulas:['A = r₁ + r₂','δ = i + e − A','nrel = sin[(A + δm)/2] / sin(A/2)','Minimum deviation: i = e; r₁ = r₂ = A/2'],
    params:[
      {k:'mode',label:'Experiment',type:'select',options:[['ray','Ray tracing & deviation'],['minimum','Minimum deviation'],['dispersion','White-light dispersion'],['newton','Newton’s two-prism experiment']],val:'ray'}, 
      {k:'material2',label:'Second prism material',type:'select',options:[['water','Water (illustrative)'],['glass','Ordinary glass'],['flint','Flint glass'],['diamond','Diamond'],['custom','Custom']],val:'glass'},
      {k:'material',label:'Prism material',type:'select',options:[['water','Water (illustrative prism)'],['glass','Ordinary glass'],['flint','Flint glass'],['diamond','Diamond'],['custom','Custom']],val:'glass'},
      {k:'n',label:'Refractive index relative to air',min:1.01,max:2.5,step:0.01,unit:'',val:1.5},
      {k:'A',label:'Prism apex angle A',min:20,max:75,step:1,unit:'°',val:60},
      {k:'i',label:'Angle of incidence i',min:0,max:75,step:1,unit:'°',val:40}
    ],
    onParam(W,k){if(k==='material'&&W.params.material!=='custom')W.params.n=PRISM_MEDIA[W.params.material].n;if(k==='n')W.params.material='custom';
      if(k==='material2' && W.params.material2!=='custom') W.params.n2=PRISM_MEDIA[W.params.material2].n;
    },
    bg(W){return prismSVG(W);},
    sim(){},
    reset(W){W.params.mode='ray';W.params.material='glass';W.params.n=1.5;W.params.A=60;W.params.i=40;W.params.material2='glass';W.params.n2=1.5;},
    readouts(W){
      const s=prismState(W),apex=[500,90],h=345,half=h*Math.tan(refRad(s.A/2)),left=[500-half,435],right=[500+half,435],tr=prismTrace(s.A,s.i,s.n,apex,left,right,.57);
      const v=[{l:'Prism apex angle A',v:s.A,u:'°'},{l:'Incidence angle i',v:s.i,u:'°'},{l:'Refractive index (relative to air)',v:s.n,d:3}];
      if(tr.invalid)v.push({l:'Ray status',v:tr.invalid});
      else if(tr.tir)v.push({l:'First refraction r₁',v:tr.r1,u:'°'},{l:'Second-face incidence r₂',v:tr.r2,u:'°'},{l:'Ray status',v:'Total internal reflection'});
      else {v.push({l:'First refraction r₁',v:tr.r1,u:'°'},{l:'Second-face incidence r₂',v:tr.r2,u:'°'},{l:'Emergence angle e',v:tr.e,u:'°'},{l:'Deviation δ',v:tr.delta,u:'°'});}
      if(s.mode==='minimum'){
        const arg=Math.sin(refRad(s.A/2))*s.n;
        const im=arg<=1?refDeg(Math.asin(arg)):null;
        const dm=im==null?null:2*im-s.A;
        v.push({l:'Minimum deviation δₘ',v:dm,u:'°'});
      }
      if(s.mode==='dispersion') {
        const red=prismTrace(s.A,s.i,clamp(s.n-0.008,1.001,2.8),apex,left,right,.57);
        const violet=prismTrace(s.A,s.i,clamp(s.n+0.012,1.001,2.8),apex,left,right,.57);
        v.push({l:'Red index (illustrative)',v:clamp(s.n-0.008,1.001,2.8),d:3},{l:'Violet index (illustrative)',v:clamp(s.n+0.012,1.001,2.8),d:3});
        if(!red.invalid&&!red.tir&&!violet.invalid&&!violet.tir)v.push({l:'Red deviation',v:red.delta,u:'°'},{l:'Violet deviation',v:violet.delta,u:'°'});
      }
      return v;
    },
    live(W){
      const s=prismState(W),A=refRad(s.A),i=refRad(s.i),r1q=Math.sin(i)/s.n;
      if(r1q>1)return ['No real first-face refracted angle for these settings.','Choose a physically valid incidence angle and relative refractive index.'];
      const r1=Math.asin(Math.max(-1,Math.min(1,r1q))),r2=A-r1,q=s.n*Math.sin(r2);
      if(r1>A)return ['This incidence geometry would reach the prism base before the second face.','Increase the apex angle or reduce the incidence angle to trace the standard two-face path.'];
      if(q>1)return [`r₁ = sin⁻¹[sin(${fmt(s.i,1)}°)/${fmt(s.n,3)}] = ${fmt(refDeg(r1),2)}°`,`r₂ = A − r₁ = ${fmt(s.A,1)}° − ${fmt(refDeg(r1),2)}° = ${fmt(refDeg(r2),2)}°`,'At the second face, n sin r₂ > 1, so total internal reflection occurs and no emergent ray is drawn.'];
      const e=Math.asin(q),delta=refDeg(i+e-A),arg=Math.sin(A/2)*s.n,im=arg<=1?Math.asin(arg):null,dm=im==null?null:2*refDeg(im)-s.A;
      const out=[`A = r₁ + r₂ = ${fmt(s.A,1)}°; r₁ = ${fmt(refDeg(r1),2)}°, r₂ = ${fmt(refDeg(r2),2)}°`,`δ = i + e − A = ${fmt(s.i,1)}° + ${fmt(refDeg(e),2)}° − ${fmt(s.A,1)}° = <b>${fmt(delta,2)}°</b>`];
      if(s.mode==='minimum')out.push(dm==null?'Minimum-deviation formula has no real solution for this n and A.':`δₘ = 2 sin⁻¹[n sin(A/2)] − A = <b>${fmt(dm,2)}°</b>; symmetry occurs when i = e.`);
      if(s.mode==='dispersion')out.push('Illustrative model only: the violet index is set slightly higher than the red index, so violet bends more.');
      return out;
    },
    guided:{objective:'Trace the ray through both prism faces, explore deviation and compare colours in white light.',setup(W){W.params.mode='ray';W.params.material='glass';W.params.n=1.5;W.params.A=60;W.params.i=40;},
      steps:[
        {t:'Keep ordinary glass and vary the incidence angle. Follow the incident, internal and emergent rays.',predict:{q:'The angle of deviation of a prism is δ = …',opts:['i + e − A','i + e + A','A − i − e','i × e × A'],a:0,why:'Deviation is the angle between the original incident direction and the emergent direction: δ = i + e − A.'},ok:W=>W.params.mode==='ray'},
        {t:'Choose Minimum deviation and change the incidence angle. Look for the symmetric path where i and e are equal.',predict:{q:'At minimum deviation, the internal refraction angles are…',opts:['equal, each A/2','both zero for every prism','r₁ = A and r₂ = 0','unrelated to A'],a:0,why:'The path is symmetric at minimum deviation, so r₁ = r₂ = A/2.'},ok:W=>W.params.mode==='minimum'},
        {t:'Switch to White-light dispersion. Compare the red and violet rays.',predict:{q:'For ordinary transparent glass in visible light, which colour generally deviates more?',opts:['Violet','Red','Both always deviate equally','Neither colour refracts'],a:0,why:'Glass normally has a higher refractive index for violet than for red light.'},ok:W=>W.params.mode==='dispersion'}
      ],done:W=>'A prism changes ray direction at two faces. Minimum deviation is symmetric, and ordinary glass disperses white light because its refractive index depends on wavelength.'
    },
    quiz:[
      {q:'For a prism, the angle of deviation is…',opts:['δ = i + e − A','δ = i − e + A','δ = A + i + e','δ = i × e'],a:0,why:'This is the standard prism geometry relation.'},
      {q:'At minimum deviation, the ray path through the prism is…',opts:['symmetric, with i = e','always parallel to the base','always totally internally reflected','independent of the apex angle'],a:0,why:'The minimum-deviation path is symmetric.'},
      {q:'In ordinary glass, which visible colour generally has the larger refractive index?',opts:['Violet','Red','Yellow always has n = 1','All colours have exactly the same n'],a:0,why:'Normal dispersion means violet light has a higher refractive index than red light.'},
      {q:'The standard minimum-deviation formula gives the refractive index relative to…',opts:['the surrounding medium','the prism base length','the light-source brightness','the ray length inside the prism'],a:0,why:'The formula gives n of the prism relative to the medium surrounding it.'}
    ]
  });

})();
