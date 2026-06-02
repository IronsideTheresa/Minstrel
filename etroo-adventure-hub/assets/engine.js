/* ============================================================================
   Ironside Adventure Hub — rendering engine (shared by public + admin)
   Exposes window.AdventureEngine. Pure rendering; no editing, no network.
   ============================================================================ */
(function(){
const ART = {
  forest:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Mystical forest glade"><defs><linearGradient id="f_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1810"/><stop offset=".55" stop-color="#163a24"/><stop offset="1" stop-color="#26543a"/></linearGradient><radialGradient id="f_glow" cx="50%" cy="36%" r="46%"><stop offset="0" stop-color="#e6c879" stop-opacity=".55"/><stop offset="1" stop-color="#e6c879" stop-opacity="0"/></radialGradient></defs><rect width="800" height="470" fill="url(#f_sky)"/><circle cx="400" cy="175" r="200" fill="url(#f_glow)"/><g opacity=".55" fill="#0e2417"><polygon points="120,470 170,120 220,470"/><polygon points="600,470 650,140 700,470"/><polygon points="40,470 80,200 120,470"/><polygon points="700,470 740,180 800,470"/></g><g fill="#0a160d"><polygon points="220,470 300,90 380,470"/><polygon points="430,470 510,70 590,470"/><polygon points="340,470 400,150 460,470"/></g><ellipse cx="400" cy="400" rx="150" ry="22" fill="#2e6440" opacity=".6"/><g fill="#e6c879" opacity=".9"><circle cx="300" cy="250" r="3"/><circle cx="520" cy="220" r="2.5"/><circle cx="360" cy="300" r="2"/><circle cx="470" cy="320" r="3"/><circle cx="250" cy="340" r="2.5"/><circle cx="560" cy="300" r="2"/></g></svg>`,
  river:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Silver river at dusk"><defs><linearGradient id="r_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e2438"/><stop offset="1" stop-color="#1d4a4a"/></linearGradient><linearGradient id="r_water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd4e6"/><stop offset="1" stop-color="#3f6f7a"/></linearGradient></defs><rect width="800" height="470" fill="url(#r_sky)"/><circle cx="400" cy="135" r="64" fill="#e9f0f5" opacity=".85"/><g fill="#0a160d" opacity=".9"><polygon points="0,300 120,140 240,300"/><polygon points="560,300 680,150 800,300"/></g><path d="M0,300 Q400,260 800,300 L800,470 L0,470 Z" fill="url(#r_water)"/><g stroke="#fff" stroke-opacity=".4" fill="none"><path d="M120,350 Q400,330 680,350"/><path d="M80,400 Q400,378 720,400"/></g><g fill="#13332f"><path d="M330,330 q70,-28 140,0 l-18,26 q-52,16 -104,0 z"/><rect x="395" y="296" width="6" height="40"/></g><ellipse cx="400" cy="316" rx="14" ry="20" fill="#26543a"/></svg>`,
  ember:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Forest aglow with embers"><defs><radialGradient id="e_fire" cx="50%" cy="82%" r="72%"><stop offset="0" stop-color="#e6c879"/><stop offset=".4" stop-color="#d8763a"/><stop offset="1" stop-color="#0c1810"/></radialGradient></defs><rect width="800" height="470" fill="url(#e_fire)"/><g fill="#0a160d" opacity=".9"><polygon points="180,470 260,120 340,470"/><polygon points="440,470 520,90 600,470"/><polygon points="320,470 390,170 460,470"/></g><g fill="#ffe9b0"><circle cx="250" cy="200" r="3"/><circle cx="520" cy="170" r="4"/><circle cx="400" cy="240" r="3"/><circle cx="600" cy="220" r="2.5"/><circle cx="180" cy="260" r="2.5"/><circle cx="470" cy="300" r="3.5"/><circle cx="330" cy="300" r="2"/></g><ellipse cx="400" cy="450" rx="220" ry="30" fill="#ffd27a" opacity=".45"/></svg>`,
  vine:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Silver thorn vine"><defs><linearGradient id="v_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a3f29"/><stop offset="1" stop-color="#0a160d"/></linearGradient></defs><rect width="800" height="470" fill="url(#v_bg)"/><circle cx="400" cy="215" r="170" fill="#2e6440" opacity=".25"/><path d="M400,470 C320,365 480,325 400,235 C330,155 470,125 400,32" fill="none" stroke="#cfe7d5" stroke-width="9" stroke-linecap="round"/><g fill="#cfe7d5"><path d="M400,305 l18,-12 -6,20z"/><path d="M400,205 l-18,-12 6,20z"/><path d="M400,385 l18,-10 -6,18z"/></g><circle cx="400" cy="120" r="22" fill="#d8763a"/><circle cx="400" cy="120" r="10" fill="#ffe9b0"/><g fill="#6f9ec4" opacity=".6"><circle cx="330" cy="150" r="16"/><circle cx="470" cy="150" r="16"/></g></svg>`,
  shrine:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Broken forest shrine"><defs><linearGradient id="s_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13324a"/><stop offset="1" stop-color="#26543a"/></linearGradient><radialGradient id="s_glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e6c879" stop-opacity=".85"/><stop offset="1" stop-color="#e6c879" stop-opacity="0"/></radialGradient></defs><rect width="800" height="470" fill="url(#s_sky)"/><circle cx="400" cy="235" r="170" fill="url(#s_glow)"/><g fill="#5c6b5c"><rect x="250" y="255" width="40" height="175"/><rect x="510" y="255" width="40" height="175"/><rect x="230" y="235" width="80" height="26"/><rect x="490" y="235" width="80" height="26"/></g><polygon points="300,255 400,182 500,255" fill="#475647"/><rect x="360" y="305" width="80" height="125" fill="#33402f"/><g fill="#e6c879" font-family="serif" font-size="30" text-anchor="middle"><text x="270" y="300">ᚠ</text><text x="335" y="342">ᚢ</text><text x="400" y="282">ᚦ</text><text x="465" y="342">ᚱ</text><text x="530" y="300">ᛟ</text></g><rect y="420" width="800" height="50" fill="#0a160d"/></svg>`,
  moon:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Moonlit night sky"><defs><linearGradient id="m_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1c2e"/><stop offset="1" stop-color="#13324a"/></linearGradient></defs><rect width="800" height="470" fill="url(#m_sky)"/><g fill="#bcd4e6" opacity=".55"><path d="M250,80 q140,30 300,10 q-120,60 -300,30z"/></g><circle cx="560" cy="140" r="58" fill="#e9f0f5" opacity=".92"/><circle cx="540" cy="130" r="54" fill="#13324a" opacity=".5"/><g fill="#e9f0f5" opacity=".85"><circle cx="120" cy="90" r="2"/><circle cx="250" cy="60" r="1.5"/><circle cx="360" cy="120" r="2"/><circle cx="680" cy="80" r="1.5"/><circle cx="430" cy="50" r="1.5"/><circle cx="200" cy="160" r="1.5"/><circle cx="620" cy="210" r="2"/></g><g fill="#06121f" opacity=".92"><polygon points="0,470 100,250 200,470"/><polygon points="560,470 660,230 760,470"/><polygon points="300,470 400,280 500,470"/></g></svg>`,
  prize:`<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Etroo Masterworks PC in a glade"><defs><linearGradient id="p_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1810"/><stop offset="1" stop-color="#163a24"/></linearGradient><linearGradient id="p_glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c3d28"/><stop offset="1" stop-color="#0a160d"/></linearGradient></defs><rect width="700" height="520" fill="url(#p_bg)"/><g fill="#0e2417" opacity=".8"><circle cx="90" cy="120" r="70"/><circle cx="620" cy="160" r="90"/><circle cx="120" cy="430" r="80"/></g><rect x="210" y="120" width="280" height="300" rx="14" fill="url(#p_glass)" stroke="#c9a24a" stroke-width="2"/><circle cx="280" cy="200" r="34" fill="none" stroke="#cfe7d5" stroke-width="6" opacity=".8"/><circle cx="280" cy="280" r="34" fill="none" stroke="#cfe7d5" stroke-width="6" opacity=".8"/><g stroke="#6f9ec4" stroke-width="5" fill="none" opacity=".8"><circle cx="410" cy="190" r="26"/><circle cx="410" cy="260" r="26"/><circle cx="410" cy="330" r="26"/></g><path d="M250,400 q40,-60 90,-40 q40,16 70,-10" fill="none" stroke="#2e6440" stroke-width="9" stroke-linecap="round"/><ellipse cx="350" cy="430" rx="170" ry="24" fill="#2e6440" opacity=".5"/></svg>`
};
const ORN = {
  clover:`<svg class="orn" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c0-4 1-6 3-6s3 2 3 4-1 3-3 3 6 1 6 3-2 3-4 3-3-1-3-3 1 6-1 6-3-2-3-4 1-3 3-3-6-1-6-3 2-3 4-3 3 1 3 3z"/></svg>`,
  leaf:`<svg class="orn" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z"/><path d="M5 19C9 15 13 11 17 8"/></svg>`,
  sprig:`<svg class="orn" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 21V8"/><path d="M12 12c-3 0-5-2-5-5 3 0 5 2 5 5z"/><path d="M12 10c3 0 5-2 5-5-3 0-5 2-5 5z"/></svg>`
};
/* angular chevron — matches Ironside's site indicators */
const CHEVRON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square" stroke-linejoin="miter" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>`;

const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const elm=(tag,cls,html)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(html!=null)n.innerHTML=html;return n;};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const artFor=o=>o&&o.image?`<img src="${esc(o.image)}" alt="">`:(ART[o&&o.art]||ART.forest);

function applyTheme(t){
  if(!t) return; const r=document.documentElement.style;
  const map={bgDark:'--bg-dark',forest:'--forest',forestSoft:'--forest-soft',mint:'--mint',gold:'--gold',goldBright:'--gold-bright',moonlit:'--moonlit',moonlitDeep:'--moonlit-deep',cream:'--cream',ink:'--ink',ember:'--ember',button:'--button',buttonText:'--button-text',heading:'--heading'};
  Object.keys(map).forEach(k=>{ if(t[k]) r.setProperty(map[k], t[k]); });
  if(t.cream){ r.setProperty('--cream-soft', t.cream); }
  if(t.button){ r.setProperty('--button-2', shade(t.button,-18)); }
}
function shade(hex,p){ try{ const n=parseInt(hex.slice(1),16); let r=(n>>16)+p*2,g=((n>>8)&255)+p*2,b=(n&255)+p*2; const c=v=>Math.max(0,Math.min(255,v)); return '#'+(c(r)<<16|c(g)<<8|c(b)).toString(16).padStart(6,'0'); }catch(e){ return hex; } }

function isLive(ch){ const p=ch.publish||{mode:'manual',live:true}; if(p.mode==='scheduled'){ if(!p.unlockAt) return false; return Date.now()>=new Date(p.unlockAt).getTime(); } return p.live!==false; }
function fmtCountdown(ms){ if(ms<=0) return 'now'; const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4); if(d>0) return d+'d '+h+'h'; if(h>0) return h+'h '+m+'m'; return m+'m'; }
function fmtDate(s){ try{ return new Date(s).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}); }catch(e){ return s; } }

let MOUNT='#app';
function render(content, mountSel){
  if(mountSel) MOUNT=mountSel;
  applyTheme(content.theme);
  const app=$(MOUNT); if(!app) return; app.innerHTML=''; const A=content;
  const liveChs=(A.chapters||[]).filter(isLive);
  const latestN = liveChs.length? Math.max(...liveChs.map(c=>c.n)) : null;

  const hero=elm('header','hero');
  hero.innerHTML=`<div class="hero-art">${artFor(A.story)}</div>
    <div class="panel-dark hero-plate">
      <p class="eyebrow">An Ironside Adventure</p>
      <h1 class="story-title">${esc(A.story.title)}</h1>
      <p class="story-tagline">${esc(A.story.tagline)}</p>
      <p class="story-intro">${esc(A.story.intro)}</p>
      ${A.story.releaseStatus?`<span class="release-badge">${ORN.clover} ${esc(A.story.releaseStatus)}</span>`:''}
      ${A.story.releaseSub?`<span class="release-sub">${esc(A.story.releaseSub)}</span>`:''}
    </div>`;
  app.appendChild(hero);

  if(A.recap){ const r=elm('section','section'); r.innerHTML=`<div class="panel-cream recap"><div class="label">The Story So Far</div><p>${esc(A.recap)}</p></div>`; app.appendChild(r); }

  const cs=elm('section','section');
  cs.innerHTML=`<p class="section-eyebrow">Open the book</p><h2 class="section-title">Chapters</h2><div class="rule">${ORN.leaf}</div>`;
  const list=elm('div','chapters');
  (A.chapters||[]).forEach(ch=>list.appendChild(chapterEl(ch, ch.n===latestN)));
  cs.appendChild(list); app.appendChild(cs);

  app.appendChild(giveawayEl(A.giveaway));
  app.appendChild(faqEl(A.faq||[]));
  app.appendChild(archiveEl(A.archive||{}));
}

function chapterEl(ch, isLatest){
  const live=isLive(ch);
  const elx=ch.elements||{art:true,story:true,interactive:true,code:true,cta:true,reward:true};
  const wrap=elm('article','notch panel-cream chapter'+(live?'':' locked'));
  wrap.dataset.open='false';
  const p=ch.publish||{};
  let statusText, statusCls='';
  if(live){ statusText=isLatest?'Latest chapter — just released':'Released'; statusCls=isLatest?'latest':''; }
  else if(p.mode==='scheduled'&&p.unlockAt){ statusText='Unlocks '+fmtDate(p.unlockAt); statusCls='scheduled'; }
  else { statusText='Coming soon'; }

  const mark = ch.icon ? `<span class="ch-mark icon"><img src="${esc(ch.icon)}" alt=""></span>`
    : `<span class="ch-mark">${live?ch.n:'🔒'}</span>`;
  const head=elm('button','chapter-head'); head.setAttribute('aria-expanded','false');
  head.innerHTML=`${mark}<span class="ch-meta"><span class="ch-title">Chapter ${ch.n}: ${esc(ch.title)}</span><span class="ch-status ${statusCls}">${statusText}</span></span><span class="ch-toggle">${CHEVRON}</span>`;
  wrap.appendChild(head);

  const body=elm('div','ch-body'), inner=elm('div','ch-body-inner'), content=elm('div','ch-content');
  if(!live){
    if(elx.art!==false) content.appendChild(elm('div','ch-art',artFor(ch)));
    const msg=(p.mode==='scheduled'&&p.unlockAt)
      ? `This chapter unlocks ${fmtDate(p.unlockAt)}. <span class="countdown" data-unlock="${esc(p.unlockAt)}">Unlocks in ${fmtCountdown(new Date(p.unlockAt)-Date.now())}</span>`
      : 'This chapter is still sealed. Return soon — the story continues.';
    content.appendChild(elm('p',null,`<span style="display:block;text-align:center;font-style:italic;color:var(--ink-soft);font-family:'Cormorant Garamond',serif">${msg}</span>`));
  } else {
    if(elx.art!==false) content.appendChild(elm('div','ch-art',artFor(ch)));
    if(elx.story!==false && ch.story && ch.story.length){ const sw=elm('div','ch-story'); ch.story.forEach((para,i)=>sw.appendChild(elm('p',i===0?'dropcap':null,esc(para)))); content.appendChild(sw); }
    const wantCode = elx.code!==false && ch.secretCode;
    const codeVault = wantCode ? buildCodeVault(ch.secretCode) : null;
    if(elx.interactive!==false && ch.interactive && ch.interactive.type!=='none'){ content.appendChild(buildInteractive(ch.interactive, ()=>codeVault&&codeVault.classList.add('unlocked'))); }
    else if(codeVault){ codeVault.classList.add('unlocked'); }
    if(codeVault) content.appendChild(codeVault);
    if(elx.reward!==false && ch.reward && (ch.reward.title||ch.reward.text)){ content.appendChild(elm('div','reward',`<span class="gift">🎁</span><div><div class="r-title">${esc(ch.reward.title)}</div><div>${esc(ch.reward.text)}</div></div>`)); }
    if(elx.cta!==false && ch.cta && ch.cta.label){ const a=elm('a','btn btn-cta',esc(ch.cta.label)); a.href=ch.cta.url||'#'; if(/^https?:/.test(ch.cta.url||'')){a.target='_blank';a.rel='noopener';} content.appendChild(a); }
  }
  inner.appendChild(content); body.appendChild(inner); wrap.appendChild(body);
  head.addEventListener('click',()=>{ if(!live) return; const o=wrap.dataset.open==='true'; wrap.dataset.open=o?'false':'true'; head.setAttribute('aria-expanded',o?'false':'true'); });
  if(isLatest){ wrap.dataset.open='true'; head.setAttribute('aria-expanded','true'); }
  return wrap;
}

function buildInteractive(it,onSolve){
  const m=elm('div','module');
  if(it.type==='riddle'){
    m.innerHTML=`<div class="module-label">✦ Riddle</div><p class="module-prompt">${esc(it.prompt)}</p><div class="field-row"><input type="text" placeholder="Your answer…" aria-label="Answer"><button class="btn">Answer</button></div>${it.hint?'<button class="btn secondary" style="margin-top:10px" data-hint>Need a hint?</button>':''}<div class="feedback" role="status"></div>`;
    const input=$('input',m), fb=$('.feedback',m);
    $('.btn',m).addEventListener('click',()=>{ if(input.value.trim().toLowerCase()===String(it.answer).toLowerCase()){fb.textContent=it.success||'Correct!';fb.className='feedback ok';onSolve();}else{fb.textContent='Not quite. Try again, traveller.';fb.className='feedback no';} });
    input.addEventListener('keydown',e=>{if(e.key==='Enter')$('.btn',m).click();});
    const hb=$('[data-hint]',m); if(hb) hb.addEventListener('click',()=>{fb.textContent='Hint: '+it.hint;fb.className='feedback';});
  } else if(it.type==='quiz'){
    m.innerHTML=`<div class="module-label">✦ Choose wisely</div><p class="module-prompt">${esc(it.question)}</p><div class="options"></div><div class="feedback" role="status"></div>`;
    const opts=$('.options',m), fb=$('.feedback',m);
    (it.options||[]).forEach((o,i)=>{ const b=elm('button','opt',esc(o)); b.addEventListener('click',()=>{ if(opts.dataset.done) return; if(i===it.correct){b.classList.add('correct');opts.dataset.done='1';fb.textContent=it.success||'Correct!';fb.className='feedback ok';onSolve();}else{b.classList.add('wrong');fb.textContent='That path fades into mist. Look again.';fb.className='feedback no';} }); opts.appendChild(b); });
  } else if(it.type==='runes'){
    m.innerHTML=`<div class="module-label">✦ Rune puzzle</div><p class="module-prompt">${esc(it.prompt)}</p><div class="runes"></div><div class="feedback" role="status"></div><button class="btn secondary" style="margin-top:6px" data-reset>Reset runes</button>`;
    const row=$('.runes',m), fb=$('.feedback',m); const seq=it.sequence||[]; const shuffled=[...seq].sort(()=>Math.random()-.5); let prog=0;
    const reset=()=>{prog=0;$$('.rune',row).forEach(r=>r.classList.remove('lit'));fb.textContent='';fb.className='feedback';};
    shuffled.forEach(sym=>{ const r=elm('div','rune',sym); r.setAttribute('role','button'); r.tabIndex=0; const press=()=>{ if(row.dataset.done) return; if(sym===seq[prog]){r.classList.add('lit');prog++; if(prog===seq.length){row.dataset.done='1';fb.textContent=it.success||'Solved!';fb.className='feedback ok';onSolve();}}else{fb.textContent='The melody falters. The runes dim — try again.';fb.className='feedback no';setTimeout(reset,700);} }; r.addEventListener('click',press); r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();press();}}); row.appendChild(r); });
    $('[data-reset]',m).addEventListener('click',()=>{delete row.dataset.done;reset();});
  }
  return m;
}
function buildCodeVault(code){
  const v=elm('div','code-vault');
  v.innerHTML=`<div class="vault-label">🗝 Secret Code</div><div class="code-locked">Solve this chapter's challenge to reveal the code.</div><div class="code-reveal"><div class="secret-code">${esc(code)}</div><button class="btn gold" data-copy>Copy code</button><div class="copy-note">Submit it on the giveaway page for entries.</div></div>`;
  v.addEventListener('click',e=>{ if(e.target.matches('[data-copy]')){ navigator.clipboard&&navigator.clipboard.writeText(code); e.target.textContent='Copied ✓'; setTimeout(()=>e.target.textContent='Copy code',1500); } });
  return v;
}
function giveawayEl(g){
  g=g||{cta:{}};
  const s=elm('section','section'); s.id='giveaway';
  s.innerHTML=`<p class="section-eyebrow">Join the quest</p><h2 class="section-title">Giveaway Hub</h2><div class="rule">${ORN.clover}</div>`;
  const card=elm('div','panel-dark giveaway');
  card.innerHTML=`<div class="g-top">${g.kicker?`<p class="g-kicker">${esc(g.kicker)}</p>`:''}<div class="g-logo">${esc(g.logo||'')}${g.logoSub?`<small>${esc(g.logoSub)}</small>`:''}</div><div class="g-arch">${artFor(g)}</div></div><div class="g-body">${g.title?`<p class="g-tagline">${esc(g.title)}</p>`:''}${g.description?`<p class="g-desc">${esc(g.description)}</p>`:''}${(g.rewards&&g.rewards.length)?`<ul class="rewards-list">${g.rewards.map(r=>`<li><span class="tick">${ORN.clover}</span>${esc(r)}</li>`).join('')}</ul>`:''}</div>`;
  if(g.cta&&g.cta.label){ const a=elm('a','btn btn-cta gold',esc(g.cta.label)); a.href=g.cta.url||'#'; a.target='_blank'; a.rel='noopener'; $('.g-body',card).appendChild(a); }
  if(g.tagline){ const t=elm('p','g-tagline serif',esc(g.tagline)); t.style.marginTop='22px'; $('.g-body',card).appendChild(t); }
  s.appendChild(card); return s;
}
function faqEl(faq){
  const s=elm('section','section');
  s.innerHTML=`<p class="section-eyebrow">Before you begin</p><h2 class="section-title">Questions &amp; Answers</h2><div class="rule">${ORN.sprig}</div>`;
  const card=elm('div','panel-cream');
  (faq||[]).forEach(item=>{ const it=elm('div','faq-item'); it.dataset.open='false'; it.innerHTML=`<button class="faq-q"><span class="qt">${esc(item.q)}</span><span class="qi">${CHEVRON}</span></button><div class="faq-a"><div class="faq-a-inner"><p>${esc(item.a)}</p></div></div>`; $('.faq-q',it).addEventListener('click',()=>{ it.dataset.open=it.dataset.open==='true'?'false':'true'; }); card.appendChild(it); });
  s.appendChild(card); return s;
}
function archiveEl(ar){
  const s=elm('section','section');
  s.innerHTML=`<p class="section-eyebrow">The shelf of tales</p><h2 class="section-title">Adventure Archive</h2><div class="rule">${ORN.leaf}</div>`;
  const card=elm('div','panel-cream archive'); let html='';
  if(ar.current){ html+=`<div class="arch-block"><div class="arch-label">Current Adventure</div><div class="arch-card current"><span class="seal">${ORN.clover}</span><span><span class="a-name">${esc(ar.current.name)}</span><br><span class="a-blurb">${esc(ar.current.blurb)}</span></span><span class="a-tag">Live</span></div></div>`; }
  if(ar.past&&ar.past.length){ html+=`<div class="arch-block"><div class="arch-label">Completed Adventures</div>`+ar.past.map(p=>`<div class="arch-card"><span class="seal">📖</span><span><span class="a-name">${esc(p.name)}</span><br><span class="a-blurb">${esc(p.blurb)}</span></span><span class="a-tag">${esc(p.status||'Archived')}</span></div>`).join('')+`</div>`; }
  if(ar.upcoming&&ar.upcoming.length){ html+=`<div class="arch-block"><div class="arch-label">On the Horizon</div>`+ar.upcoming.map(p=>`<div class="arch-card coming"><span class="seal">🔮</span><span><span class="a-name">${esc(p.name)}</span><br><span class="a-blurb">${esc(p.blurb)}</span></span><span class="a-tag">Soon</span></div>`).join('')+`</div>`; }
  card.innerHTML=html; s.appendChild(card); return s;
}
function motes(sel){ const c=$(sel||'#atmos'); if(!c) return; const n=window.innerWidth<600?9:16; for(let i=0;i<n;i++){ const m=elm('span','mote'); m.style.left=Math.random()*100+'%'; m.style.bottom=(-10-Math.random()*20)+'px'; const d=10+Math.random()*14; m.style.animationDuration=d+'s'; m.style.animationDelay=(-Math.random()*d)+'s'; m.style.transform='scale('+(.5+Math.random())+')'; c.appendChild(m); } }
function tickCountdowns(content){ $$('.countdown').forEach(c=>{ const t=new Date(c.dataset.unlock)-Date.now(); if(t<=0){ render(content); } else { c.textContent='Unlocks in '+fmtCountdown(t); } }); }

window.AdventureEngine = { render, applyTheme, motes, tickCountdowns, isLive, ART, ORN, CHEVRON, ART_OPTIONS:Object.keys(ART) };
})();
