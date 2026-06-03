/* ============================================================================
   Minstrel — block-rendering engine (shared by public + builder)
   window.Minstrel.render(site, { mount, mode, adventureId, device, onSelectBlock,
                                  onSelectChapter, selectedId })
   mode: 'public' (hides drafts, guards codes, fires analytics) | 'editor' (shows all)
   ============================================================================ */
(function(){
/* ----------------------------- analytics ----------------------------- */
let DEBUG = false;
function track(event, props){
  const payload = Object.assign({ event: 'minstrel_' + event, ts: new Date().toISOString() }, props || {});
  try { (window.dataLayer = window.dataLayer || []).push(payload); } catch(e){}
  try { if (typeof window.gtag === 'function') window.gtag('event', 'minstrel_' + event, props || {}); } catch(e){}
  if (DEBUG) console.log('[track]', payload);
}

/* ------------------------------- art ------------------------------- */
const ART = {
  forest:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Forest glade"><defs><linearGradient id="f_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1810"/><stop offset=".55" stop-color="#163a24"/><stop offset="1" stop-color="#26543a"/></linearGradient><radialGradient id="f_glow" cx="50%" cy="36%" r="46%"><stop offset="0" stop-color="#e6c879" stop-opacity=".55"/><stop offset="1" stop-color="#e6c879" stop-opacity="0"/></radialGradient></defs><rect width="800" height="470" fill="url(#f_sky)"/><circle cx="400" cy="175" r="200" fill="url(#f_glow)"/><g opacity=".55" fill="#0e2417"><polygon points="120,470 170,120 220,470"/><polygon points="600,470 650,140 700,470"/><polygon points="40,470 80,200 120,470"/><polygon points="700,470 740,180 800,470"/></g><g fill="#0a160d"><polygon points="220,470 300,90 380,470"/><polygon points="430,470 510,70 590,470"/><polygon points="340,470 400,150 460,470"/></g><ellipse cx="400" cy="400" rx="150" ry="22" fill="#2e6440" opacity=".6"/><g fill="#e6c879" opacity=".9"><circle cx="300" cy="250" r="3"/><circle cx="520" cy="220" r="2.5"/><circle cx="360" cy="300" r="2"/><circle cx="470" cy="320" r="3"/><circle cx="250" cy="340" r="2.5"/><circle cx="560" cy="300" r="2"/></g></svg>`,
  river:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="River"><defs><linearGradient id="r_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e2438"/><stop offset="1" stop-color="#1d4a4a"/></linearGradient><linearGradient id="r_water" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#bcd4e6"/><stop offset="1" stop-color="#3f6f7a"/></linearGradient></defs><rect width="800" height="470" fill="url(#r_sky)"/><circle cx="400" cy="135" r="64" fill="#e9f0f5" opacity=".85"/><g fill="#0a160d" opacity=".9"><polygon points="0,300 120,140 240,300"/><polygon points="560,300 680,150 800,300"/></g><path d="M0,300 Q400,260 800,300 L800,470 L0,470 Z" fill="url(#r_water)"/><g stroke="#fff" stroke-opacity=".4" fill="none"><path d="M120,350 Q400,330 680,350"/><path d="M80,400 Q400,378 720,400"/></g><g fill="#13332f"><path d="M330,330 q70,-28 140,0 l-18,26 q-52,16 -104,0 z"/><rect x="395" y="296" width="6" height="40"/></g><ellipse cx="400" cy="316" rx="14" ry="20" fill="#26543a"/></svg>`,
  ember:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Embers"><defs><radialGradient id="e_fire" cx="50%" cy="82%" r="72%"><stop offset="0" stop-color="#e6c879"/><stop offset=".4" stop-color="#d8763a"/><stop offset="1" stop-color="#0c1810"/></radialGradient></defs><rect width="800" height="470" fill="url(#e_fire)"/><g fill="#0a160d" opacity=".9"><polygon points="180,470 260,120 340,470"/><polygon points="440,470 520,90 600,470"/><polygon points="320,470 390,170 460,470"/></g><g fill="#ffe9b0"><circle cx="250" cy="200" r="3"/><circle cx="520" cy="170" r="4"/><circle cx="400" cy="240" r="3"/><circle cx="600" cy="220" r="2.5"/><circle cx="180" cy="260" r="2.5"/><circle cx="470" cy="300" r="3.5"/></g><ellipse cx="400" cy="450" rx="220" ry="30" fill="#ffd27a" opacity=".45"/></svg>`,
  vine:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Vine"><defs><linearGradient id="v_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1a3f29"/><stop offset="1" stop-color="#0a160d"/></linearGradient></defs><rect width="800" height="470" fill="url(#v_bg)"/><circle cx="400" cy="215" r="170" fill="#2e6440" opacity=".25"/><path d="M400,470 C320,365 480,325 400,235 C330,155 470,125 400,32" fill="none" stroke="#cfe7d5" stroke-width="9" stroke-linecap="round"/><circle cx="400" cy="120" r="22" fill="#d8763a"/><circle cx="400" cy="120" r="10" fill="#ffe9b0"/></svg>`,
  shrine:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Shrine"><defs><linearGradient id="s_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13324a"/><stop offset="1" stop-color="#26543a"/></linearGradient><radialGradient id="s_glow" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#e6c879" stop-opacity=".85"/><stop offset="1" stop-color="#e6c879" stop-opacity="0"/></radialGradient></defs><rect width="800" height="470" fill="url(#s_sky)"/><circle cx="400" cy="235" r="170" fill="url(#s_glow)"/><g fill="#5c6b5c"><rect x="250" y="255" width="40" height="175"/><rect x="510" y="255" width="40" height="175"/><rect x="230" y="235" width="80" height="26"/><rect x="490" y="235" width="80" height="26"/></g><polygon points="300,255 400,182 500,255" fill="#475647"/><g fill="#e6c879" font-family="serif" font-size="30" text-anchor="middle"><text x="270" y="300">ᚠ</text><text x="335" y="342">ᚢ</text><text x="400" y="282">ᚦ</text><text x="465" y="342">ᚱ</text><text x="530" y="300">ᛟ</text></g><rect y="420" width="800" height="50" fill="#0a160d"/></svg>`,
  moon:`<svg viewBox="0 0 800 470" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Moon"><defs><linearGradient id="m_sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0a1c2e"/><stop offset="1" stop-color="#13324a"/></linearGradient></defs><rect width="800" height="470" fill="url(#m_sky)"/><circle cx="560" cy="140" r="58" fill="#e9f0f5" opacity=".92"/><circle cx="540" cy="130" r="54" fill="#13324a" opacity=".5"/><g fill="#e9f0f5" opacity=".85"><circle cx="120" cy="90" r="2"/><circle cx="360" cy="120" r="2"/><circle cx="680" cy="80" r="1.5"/><circle cx="430" cy="50" r="1.5"/></g><g fill="#06121f" opacity=".92"><polygon points="0,470 100,250 200,470"/><polygon points="560,470 660,230 760,470"/><polygon points="300,470 400,280 500,470"/></g></svg>`,
  prize:`<svg viewBox="0 0 700 520" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="Prize PC"><defs><linearGradient id="p_bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0c1810"/><stop offset="1" stop-color="#163a24"/></linearGradient><linearGradient id="p_glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#1c3d28"/><stop offset="1" stop-color="#0a160d"/></linearGradient></defs><rect width="700" height="520" fill="url(#p_bg)"/><g fill="#0e2417" opacity=".8"><circle cx="90" cy="120" r="70"/><circle cx="620" cy="160" r="90"/><circle cx="120" cy="430" r="80"/></g><rect x="210" y="120" width="280" height="300" rx="14" fill="url(#p_glass)" stroke="#c9a24a" stroke-width="2"/><circle cx="280" cy="200" r="34" fill="none" stroke="#cfe7d5" stroke-width="6" opacity=".8"/><circle cx="280" cy="280" r="34" fill="none" stroke="#cfe7d5" stroke-width="6" opacity=".8"/><g stroke="#6f9ec4" stroke-width="5" fill="none" opacity=".8"><circle cx="410" cy="190" r="26"/><circle cx="410" cy="260" r="26"/><circle cx="410" cy="330" r="26"/></g><ellipse cx="350" cy="430" rx="170" ry="24" fill="#2e6440" opacity=".5"/></svg>`
};
const ORN = {
  clover:`<svg class="orn" width="26" height="26" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 12c0-4 1-6 3-6s3 2 3 4-1 3-3 3 6 1 6 3-2 3-4 3-3-1-3-3 1 6-1 6-3-2-3-4 1-3 3-3-6-1-6-3 2-3 4-3 3 1 3 3z"/></svg>`,
  leaf:`<svg class="orn" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M5 19C5 11 11 5 19 5c0 8-6 14-14 14z"/><path d="M5 19C9 15 13 11 17 8"/></svg>`,
  sprig:`<svg class="orn" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M12 21V8"/><path d="M12 12c-3 0-5-2-5-5 3 0 5 2 5 5z"/><path d="M12 10c3 0 5-2 5-5-3 0-5 2-5 5z"/></svg>`
};
const CHEVRON = `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="square" aria-hidden="true"><path d="M5 9l7 7 7-7"/></svg>`;
const SOCIAL_ICON = {
  discord:'🎮', twitch:'📺', instagram:'📷', youtube:'▶', twitter:'𝕏', tiktok:'♪', facebook:'f', default:'★'
};

/* ----------------------------- helpers ----------------------------- */
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const elm=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!=null)n.innerHTML=h;return n;};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const artFor=o=>o&&o.image?`<img src="${esc(o.image)}" alt="">`:(ART[o&&o.art]||ART.forest);

const GRADIENT_PRESETS = {
  'forest-night': { from:'#0c1810', to:'#0a140d', angle:180 },
  'ember-glow':   { from:'#1a0f08', to:'#0c1810', angle:160 },
  'moonlit':      { from:'#0a1c2e', to:'#0c1810', angle:180 },
  'parchment':    { from:'#f4f1e8', to:'#e3d2a8', angle:180 }
};
function gradientCss(g){
  if(!g || g.mode==='off') return null;
  let from=g.from, to=g.to, angle=g.angle!=null?g.angle:180;
  if(g.mode==='preset' && GRADIENT_PRESETS[g.preset]){ const p=GRADIENT_PRESETS[g.preset]; from=g.from||p.from; to=g.to||p.to; angle=g.angle!=null?g.angle:p.angle; }
  return `linear-gradient(${angle}deg, ${from}, ${to})`;
}
function applyTheme(t){ if(!t) return; const r=document.documentElement.style; const map={bgDark:'--bg-dark',forest:'--forest',forestSoft:'--forest-soft',mint:'--mint',gold:'--gold',goldBright:'--gold-bright',moonlit:'--moonlit',moonlitDeep:'--moonlit-deep',cream:'--cream',ink:'--ink',ember:'--ember',button:'--button',buttonText:'--button-text',heading:'--heading'}; Object.keys(map).forEach(k=>{if(t[k])r.setProperty(map[k],t[k]);}); if(t.cream)r.setProperty('--cream-soft',t.cream); if(t.button)r.setProperty('--button-2',shade(t.button,-18)); }
function applyDesign(design){ const g=design&&design.pageGradient; const css=gradientCss(g); document.body.style.background = css ? css : 'var(--bg-dark)'; document.body.style.backgroundAttachment='fixed'; }
function shade(hex,p){ try{ const n=parseInt(hex.slice(1),16); const c=v=>Math.max(0,Math.min(255,v)); return '#'+(c((n>>16)+p*2)<<16|c(((n>>8)&255)+p*2)<<8|c((n&255)+p*2)).toString(16).padStart(6,'0'); }catch(e){ return hex; } }

/* per-block style -> {className extras, inline style} */
function blockStyle(style){
  style=style||{}; let css='';
  const g=gradientCss(style.gradient);
  if(g) css+=`background:${g};`;
  else if(style.bg) css+=`background:${style.bg};`;
  if(style.bgImage) css+=`background-image:url('${style.bgImage}');background-size:cover;background-position:center;`;
  if(style.textColor) css+=`color:${style.textColor};`;
  if(style.border) css+=`border:${style.border};`;
  if(style.radius!=null) css+=`border-radius:${style.radius}px;`;
  if(style.padding!=null) css+=`padding:${style.padding}px;`;
  if(style.align) css+=`text-align:${style.align};`;
  return css;
}
function widthClass(style){ return style&&style.width==='full'?'w-full':(style&&style.width==='wide'?'w-wide':''); }

function isChapterLive(ch){
  const s=ch.status||'live';
  if(s==='live'||s==='archived') return true;
  if(s==='scheduled') return ch.unlockAt ? Date.now()>=new Date(ch.unlockAt).getTime() : false;
  return false; // draft, hidden
}
function fmtCountdown(ms){ if(ms<=0) return 'now'; const d=Math.floor(ms/864e5),h=Math.floor(ms%864e5/36e5),m=Math.floor(ms%36e5/6e4); if(d>0) return d+'d '+h+'h'; if(h>0) return h+'h '+m+'m'; return m+'m'; }
function fmtDate(s){ try{ return new Date(s).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}); }catch(e){ return s; } }

/* ----------------------------- render ----------------------------- */
let CTX = {};
function render(site, opts){
  opts=opts||{}; CTX=opts; DEBUG=!!opts.debug;
  applyTheme(site.theme); applyDesign(site.design);
  const mount=$(opts.mount||'#app'); if(!mount) return; mount.innerHTML='';

  const visible = (site.adventures||[]).filter(a=> opts.mode==='editor' ? true : a.status!=='hidden');
  const adv = (opts.adventureId && (site.adventures||[]).find(a=>a.id===opts.adventureId))
            || (site.adventures||[]).find(a=>a.status==='featured')
            || visible[0];
  if(!adv){ mount.innerHTML='<p style="text-align:center;padding:80px 0;color:var(--mint)">No adventure to show.</p>'; return; }

  if(opts.mode==='public'){ track('adventure_viewed',{ adventure_id:adv.id, adventure_name:adv.meta&&adv.meta.name, status:adv.status }); }

  (adv.blocks||[]).forEach(b=>{ if(b.hidden && opts.mode!=='editor') return; mount.appendChild(renderBlock(b, adv, site)); });

  // archive switcher (only if >1 visible adventure)
  const archivable = visible.filter(a=>a.id!==adv.id);
  if(archivable.length){ mount.appendChild(archiveSwitcher(adv, visible)); }
}

function wrapSelectable(node, kind, id){
  if(CTX.mode!=='editor') return node;
  node.dataset.blockId=id; node.classList.add('editable-block');
  if(CTX.selectedId===id) node.classList.add('selected');
  node.addEventListener('click', e=>{ e.stopPropagation(); CTX.onSelectBlock&&CTX.onSelectBlock(id, kind); }, true);
  return node;
}

function renderBlock(b, adv, site){
  let node;
  switch(b.type){
    case 'hero': node=heroBlock(b); break;
    case 'text': node=textBlock(b); break;
    case 'image': node=imageBlock(b); break;
    case 'video': node=videoBlock(b, adv); break;
    case 'button': node=buttonBlock(b, adv); break;
    case 'faq': node=faqBlock(b, adv); break;
    case 'chapterList': node=chapterListBlock(b, adv, site); break;
    case 'prize': node=prizeBlock(b, adv); break;
    case 'social': node=socialBlock(b, adv); break;
    case 'panel': node=panelBlock(b, adv); break;
    default: node=elm('section','section', `<div class="panel-cream" style="padding:20px">Unknown block: ${esc(b.type)}</div>`);
  }
  if(b.hidden && CTX.mode==='editor') node.classList.add('blk-hidden');
  return wrapSelectable(node, 'block', b.id);
}

function heroBlock(b){
  const p=b.props||{}; const h=elm('header','hero');
  h.innerHTML=`<div class="hero-art">${artFor(p)}</div><div class="panel-dark hero-plate">
    ${p.eyebrow?`<p class="eyebrow">${esc(p.eyebrow)}</p>`:''}
    <h1 class="story-title">${esc(p.title)}</h1>
    ${p.tagline?`<p class="story-tagline">${esc(p.tagline)}</p>`:''}
    ${p.intro?`<p class="story-intro">${esc(p.intro)}</p>`:''}
    ${p.releaseStatus?`<span class="release-badge">${ORN.clover} ${esc(p.releaseStatus)}</span>`:''}
    ${p.releaseSub?`<span class="release-sub">${esc(p.releaseSub)}</span>`:''}</div>`;
  return h;
}
function textBlock(b){
  const p=b.props||{}, st=b.style||{}; const s=elm('section','section');
  const surface = st.surface==='dark'?'panel-dark':(st.surface==='none'?'':'panel-cream');
  const inner=elm('div',surface+' recap'); inner.style.cssText=blockStyle(st);
  inner.innerHTML=`${p.eyebrow?`<div class="label">${esc(p.eyebrow)}</div>`:''}${p.heading?`<h2 class="section-title" style="margin-top:0">${esc(p.heading)}</h2>`:''}<p${p.italic?' style="font-style:italic;font-family:\'Cormorant Garamond\',serif"':''}>${esc(p.body)}</p>`;
  s.appendChild(inner); return s;
}
function imageBlock(b){
  const p=b.props||{}, st=b.style||{}; const s=elm('section','section '+widthClass(st));
  const fig=elm('figure','blk-image'); fig.style.cssText='margin:0;border-radius:'+(st.radius!=null?st.radius:14)+'px;overflow:hidden;'+(blockStyle(st));
  const media = p.src?`<img src="${esc(p.src)}" alt="${esc(p.alt||'')}" style="display:block;width:100%;height:auto">`:`<div style="padding:60px;text-align:center;background:#26543a;color:#cfe7d5">Image block — add an image</div>`;
  fig.innerHTML = p.link?`<a href="${esc(p.link)}">${media}</a>`:media;
  if(p.caption) fig.innerHTML+=`<figcaption style="text-align:center;color:var(--mint-dim);font-size:13px;margin-top:8px">${esc(p.caption)}</figcaption>`;
  s.appendChild(fig); return s;
}
function videoBlock(b, adv){
  const p=b.props||{}, st=b.style||{}; const s=elm('section','section '+widthClass(st));
  let embed='';
  const url=p.url||'';
  const yt=url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/))([\w-]+)/);
  const vm=url.match(/vimeo\.com\/(\d+)/);
  if(yt) embed=`<iframe src="https://www.youtube.com/embed/${yt[1]}" allow="accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture" allowfullscreen></iframe>`;
  else if(vm) embed=`<iframe src="https://player.vimeo.com/video/${vm[1]}" allow="autoplay;fullscreen;picture-in-picture" allowfullscreen></iframe>`;
  else if(url) embed=`<video src="${esc(url)}" controls preload="metadata"></video>`;
  else embed=`<div style="padding:60px;text-align:center;color:var(--mint)">Video block — add a YouTube/Vimeo/MP4 URL</div>`;
  const frame=elm('div','blk-video'); frame.style.cssText='position:relative;border-radius:'+(st.radius!=null?st.radius:14)+'px;overflow:hidden;aspect-ratio:16/9;background:#0a160d;';
  frame.innerHTML=embed;
  $$('iframe,video',frame).forEach(v=>v.style.cssText='position:absolute;inset:0;width:100%;height:100%;border:0;');
  if(CTX.mode==='public'){ const target=$('video',frame)||$('iframe',frame); if(target&&target.tagName==='VIDEO'){ target.addEventListener('play',()=>track('video_played',{ adventure_id:adv.id, block_type:'video', url }),{once:true}); } }
  s.appendChild(frame); return s;
}
function buttonBlock(b, adv){
  const p=b.props||{}, st=b.style||{}; const s=elm('section','section'); s.style.textAlign=p.align||st.align||'center';
  if(!p.label){ s.innerHTML='<div style="text-align:center;color:var(--mint-dim);font-style:italic">Button — add a label & URL</div>'; return s; }
  const a=elm('a','btn btn-cta '+(p.variant==='gold'?'gold':p.variant==='ghost'?'ghost':''), esc(p.label));
  a.href=p.url||'#'; if(p.newTab){a.target='_blank';a.rel='noopener';}
  if(st.buttonColor){ a.style.background=st.buttonColor; }
  if(CTX.mode==='public'){ a.addEventListener('click',()=>track('cta_clicked',{ adventure_id:adv.id, cta_label:p.label, cta_url:p.url, block_type:'button' })); }
  s.appendChild(a); return s;
}
function socialBlock(b, adv){
  const p=b.props||{}, st=b.style||{}; const s=elm('section','section'); s.style.textAlign=st.align||'center';
  const wrap=elm('div','social-row');
  wrap.style.cssText='display:flex;gap:12px;justify-content:center;flex-wrap:wrap;align-items:center;';
  if(p.heading){ const hd=elm('div','section-eyebrow',esc(p.heading)); s.appendChild(hd); }
  (p.links||[]).forEach(l=>{ const a=elm('a','social-chip',SOCIAL_ICON[l.platform]||SOCIAL_ICON.default); a.href=l.url||'#'; a.target='_blank'; a.rel='noopener'; a.title=l.platform||'link'; a.setAttribute('aria-label',l.platform||'link');
    a.style.cssText='width:46px;height:46px;display:grid;place-items:center;border-radius:12px;border:1px solid var(--gold);color:var(--gold);text-decoration:none;font-size:20px;background:rgba(201,162,74,.08);';
    if(CTX.mode==='public'){ a.addEventListener('click',()=>track('social_clicked',{ adventure_id:adv.id, platform:l.platform, cta_url:l.url })); }
    wrap.appendChild(a); });
  s.appendChild(wrap); return s;
}
function panelBlock(b, adv){
  const p=b.props||{}, st=b.style||{}; const s=elm('section','section '+widthClass(st));
  const card=elm('div', (st.surface==='dark'?'panel-dark':'panel-cream')); card.style.cssText='padding:26px 22px;text-align:'+(st.align||'center')+';'+blockStyle(st);
  let media='';
  if(p.media&&p.media.type==='image'&&p.media.src) media=`<img src="${esc(p.media.src)}" alt="" style="display:block;max-width:100%;border-radius:12px;margin:0 auto 16px">`;
  card.innerHTML=`${media}${p.subheading?`<div class="section-eyebrow" style="margin-top:0">${esc(p.subheading)}</div>`:''}${p.heading?`<h2 class="section-title" style="margin-top:0">${esc(p.heading)}</h2>`:''}${p.body?`<p>${esc(p.body)}</p>`:''}`;
  if(p.buttonLabel){ const a=elm('a','btn btn-cta gold',esc(p.buttonLabel)); a.href=p.buttonUrl||'#'; if(p.newTab){a.target='_blank';a.rel='noopener';} if(CTX.mode==='public'){a.addEventListener('click',()=>track('cta_clicked',{adventure_id:adv.id,cta_label:p.buttonLabel,cta_url:p.buttonUrl,block_type:'panel'}));} card.appendChild(a); }
  s.appendChild(card); return s;
}
function faqBlock(b, adv){
  const p=b.props||{}; const s=elm('section','section');
  s.innerHTML=`<p class="section-eyebrow">${esc(p.sectionEyebrow||'')}</p><h2 class="section-title">${esc(p.sectionTitle||'Questions & Answers')}</h2><div class="rule">${ORN.sprig}</div>`;
  const card=elm('div','panel-cream');
  (p.items||[]).forEach(item=>{ if(item.hidden && CTX.mode!=='editor') return; const it=elm('div','faq-item'+(item.hidden&&CTX.mode==='editor'?' blk-hidden':'')); it.dataset.open='false';
    it.innerHTML=`<button class="faq-q"><span class="qt">${esc(item.q)}</span><span class="qi">${CHEVRON}</span></button><div class="faq-a"><div class="faq-a-inner"><p>${esc(item.a)}</p></div></div>`;
    $('.faq-q',it).addEventListener('click',()=>{ const open=it.dataset.open==='true'; it.dataset.open=open?'false':'true'; if(!open&&CTX.mode==='public') track('faq_expanded',{ adventure_id:adv.id, question:item.q }); });
    card.appendChild(it); });
  s.appendChild(card); return s;
}
function prizeBlock(b, adv){
  const p=b.props||{}; const s=elm('section','section'); s.id='giveaway';
  s.innerHTML=`<p class="section-eyebrow">${esc(p.sectionEyebrow||'Join the quest')}</p><h2 class="section-title">${esc(p.sectionTitle||'Giveaway Hub')}</h2><div class="rule">${ORN.clover}</div>`;
  const card=elm('div','panel-dark giveaway');
  card.innerHTML=`<div class="g-top">${p.kicker?`<p class="g-kicker">${esc(p.kicker)}</p>`:''}<div class="g-logo">${esc(p.logo||'')}${p.logoSub?`<small>${esc(p.logoSub)}</small>`:''}</div><div class="g-arch">${artFor(p)}</div></div><div class="g-body">${p.title?`<p class="g-tagline">${esc(p.title)}</p>`:''}${p.description?`<p class="g-desc">${esc(p.description)}</p>`:''}${(p.rewards&&p.rewards.length)?`<ul class="rewards-list">${p.rewards.map(r=>`<li><span class="tick">${ORN.clover}</span>${esc(r)}</li>`).join('')}</ul>`:''}</div>`;
  if(p.cta&&p.cta.label){ const a=elm('a','btn btn-cta gold',esc(p.cta.label)); a.href=p.cta.url||'#'; if(p.cta.newTab!==false){a.target='_blank';a.rel='noopener';} if(CTX.mode==='public'){a.addEventListener('click',()=>track('prize_cta_clicked',{adventure_id:adv.id,cta_label:p.cta.label,cta_url:p.cta.url}));} $('.g-body',card).appendChild(a); }
  if(p.tagline){ const t=elm('p','g-tagline',esc(p.tagline)); t.style.marginTop='22px'; $('.g-body',card).appendChild(t); }
  s.appendChild(card); return s;
}

function chapterListBlock(b, adv, site){
  const p=b.props||{}; const s=elm('section','section');
  s.innerHTML=`<p class="section-eyebrow">${esc(p.sectionEyebrow||'Open the book')}</p><h2 class="section-title">${esc(p.sectionTitle||'Chapters')}</h2><div class="rule">${ORN.leaf}</div>`;
  const list=elm('div','chapters');
  const chs=adv.chapters||[];
  const liveChs=chs.filter(isChapterLive);
  const latestN=liveChs.length?Math.max(...liveChs.filter(c=>c.status!=='archived').map(c=>c.n).concat([-1])):-1;
  chs.forEach(ch=>{ if((ch.status==='draft'||ch.status==='hidden') && CTX.mode!=='editor') return; list.appendChild(chapterCard(ch, ch.n===latestN, adv)); });
  s.appendChild(list); return s;
}
function chapterCard(ch, isLatest, adv){
  const live=isChapterLive(ch); const archived=ch.status==='archived';
  const wrap=elm('article','panel-cream chapter chapter-round'+(live?'':' locked'));
  wrap.dataset.open='false';
  if(CTX.mode==='editor'){ wrap.dataset.chapterId=ch.id; wrap.classList.add('editable-block'); if(CTX.selectedId===ch.id) wrap.classList.add('selected'); wrap.addEventListener('click',e=>{ if(e.target.closest('.chapter-head')&&!live){} e.stopPropagation(); CTX.onSelectChapter&&CTX.onSelectChapter(ch.id); },true); }
  let statusText, statusCls='';
  if(archived){ statusText='Archived — still playable'; statusCls='scheduled'; }
  else if(live){ statusText=isLatest?'Latest chapter — just released':'Released'; statusCls=isLatest?'latest':''; }
  else if(ch.status==='scheduled'&&ch.unlockAt){ statusText='Unlocks '+fmtDate(ch.unlockAt); statusCls='scheduled'; }
  else if(CTX.mode==='editor'){ statusText=(ch.status||'draft').toUpperCase()+' (hidden from public)'; }
  else { statusText='Coming soon'; }
  const mark = ch.icon ? `<span class="ch-mark icon"><img src="${esc(ch.icon)}" alt=""></span>` : `<span class="ch-mark">${live?ch.n:'🔒'}</span>`;
  const head=elm('button','chapter-head'); head.setAttribute('aria-expanded','false');
  head.innerHTML=`${mark}<span class="ch-meta"><span class="ch-title">Chapter ${ch.n}: ${esc(ch.title)}</span><span class="ch-status ${statusCls}">${statusText}</span></span><span class="ch-toggle">${CHEVRON}</span>`;
  wrap.appendChild(head);
  const body=elm('div','ch-body'), inner=elm('div','ch-body-inner'), content=elm('div','ch-content');

  // CODE PROTECTION: only render sensitive content for live/archived chapters.
  if(!live){
    content.appendChild(elm('div','ch-art',artFor(ch)));
    const msg=(ch.status==='scheduled'&&ch.unlockAt)?`This chapter unlocks ${fmtDate(ch.unlockAt)}. <span class="countdown" data-unlock="${esc(ch.unlockAt)}">Unlocks in ${fmtCountdown(new Date(ch.unlockAt)-Date.now())}</span>`:'This chapter is still sealed. Return soon — the story continues.';
    content.appendChild(elm('p',null,`<span style="display:block;text-align:center;font-style:italic;color:var(--ink-soft);font-family:'Cormorant Garamond',serif">${msg}</span>`));
  } else {
    content.appendChild(elm('div','ch-art',artFor(ch)));
    if(ch.story&&ch.story.length){ const sw=elm('div','ch-story'); ch.story.forEach((para,i)=>sw.appendChild(elm('p',i===0?'dropcap':null,esc(para)))); content.appendChild(sw); }
    const code=ch.code||{}; const wantCode = code.active!==false && code.text;
    const vault = wantCode ? codeVault(code.text, adv, ch) : null;
    const pz=ch.puzzle||{kind:'none'};
    if(pz.kind && pz.kind!=='none'){ content.appendChild(puzzle(pz, adv, ch, ()=>{ if(vault && (code.revealTiming!=='manual')) vault.classList.add('unlocked'); })); }
    else if(vault){ vault.classList.add('unlocked'); }
    if(vault && code.revealTiming==='immediate') vault.classList.add('unlocked');
    if(vault) content.appendChild(vault);
    if(ch.reward&&(ch.reward.title||ch.reward.text)) content.appendChild(elm('div','reward',`<span class="gift">🎁</span><div><div class="r-title">${esc(ch.reward.title)}</div><div>${esc(ch.reward.text)}</div></div>`));
    if(ch.cta&&ch.cta.label){ const a=elm('a','btn btn-cta',esc(ch.cta.label)); a.href=ch.cta.url||'#'; if(ch.cta.newTab||/^https?:/.test(ch.cta.url||'')){a.target='_blank';a.rel='noopener';} if(CTX.mode==='public'){a.addEventListener('click',()=>track('cta_clicked',{adventure_id:adv.id,chapter_number:ch.n,chapter_title:ch.title,cta_label:ch.cta.label,cta_url:ch.cta.url,block_type:'chapter'}));} content.appendChild(a); }
  }
  inner.appendChild(content); body.appendChild(inner); wrap.appendChild(body);
  let opened=false;
  head.addEventListener('click',()=>{ if(!live) return; const o=wrap.dataset.open==='true'; wrap.dataset.open=o?'false':'true'; head.setAttribute('aria-expanded',o?'false':'true'); if(!o&&CTX.mode==='public'&&!opened){ opened=true; track('chapter_viewed',{adventure_id:adv.id,chapter_number:ch.n,chapter_title:ch.title,status:ch.status}); } });
  if(isLatest&&live){ wrap.dataset.open='true'; head.setAttribute('aria-expanded','true'); }
  return wrap;
}
function puzzle(pz, adv, ch, onSolve){
  const m=elm('div','module'); let started=false;
  const fireStart=()=>{ if(!started&&CTX.mode==='public'){ started=true; track('puzzle_started',{adventure_id:adv.id,chapter_number:ch.n,kind:pz.kind}); } };
  const fireDone=()=>{ if(CTX.mode==='public') track('puzzle_completed',{adventure_id:adv.id,chapter_number:ch.n,kind:pz.kind}); };
  const solved=()=>{ fireDone(); onSolve(); if(CTX.mode==='public') track('code_revealed',{adventure_id:adv.id,chapter_number:ch.n}); };
  if(pz.kind==='riddle'){
    m.innerHTML=`<div class="module-label">✦ Riddle</div><p class="module-prompt">${esc(pz.prompt)}</p><div class="field-row"><input type="text" placeholder="Your answer…"><button class="btn">Answer</button></div>${pz.hint?'<button class="btn secondary" style="margin-top:10px" data-hint>Need a hint?</button>':''}<div class="feedback"></div>`;
    const inp=$('input',m),fb=$('.feedback',m); inp.addEventListener('focus',fireStart);
    $('.btn',m).addEventListener('click',()=>{ fireStart(); if(inp.value.trim().toLowerCase()===String(pz.answer).toLowerCase()){fb.textContent=pz.success||'Correct!';fb.className='feedback ok';solved();}else{fb.textContent='Not quite. Try again, traveller.';fb.className='feedback no';} });
    inp.addEventListener('keydown',e=>{if(e.key==='Enter')$('.btn',m).click();});
    const hb=$('[data-hint]',m); if(hb)hb.addEventListener('click',()=>{fb.textContent='Hint: '+pz.hint;fb.className='feedback';});
  } else if(pz.kind==='quiz'){
    m.innerHTML=`<div class="module-label">✦ Choose wisely</div><p class="module-prompt">${esc(pz.question)}</p><div class="options"></div><div class="feedback"></div>`;
    const opts=$('.options',m),fb=$('.feedback',m);
    (pz.options||[]).forEach((o,i)=>{ const btn=elm('button','opt',esc(o)); btn.addEventListener('click',()=>{ fireStart(); if(opts.dataset.done)return; if(i===pz.correct){btn.classList.add('correct');opts.dataset.done='1';fb.textContent=pz.success||'Correct!';fb.className='feedback ok';solved();}else{btn.classList.add('wrong');fb.textContent='That path fades into mist. Look again.';fb.className='feedback no';} }); opts.appendChild(btn); });
  } else if(pz.kind==='runes'){
    m.innerHTML=`<div class="module-label">✦ Rune puzzle</div><p class="module-prompt">${esc(pz.prompt)}</p><div class="runes"></div><div class="feedback"></div><button class="btn secondary" style="margin-top:6px" data-reset>Reset runes</button>`;
    const row=$('.runes',m),fb=$('.feedback',m); const seq=pz.sequence||[]; const shuf=[...seq].sort(()=>Math.random()-.5); let prog=0;
    const reset=()=>{prog=0;$$('.rune',row).forEach(r=>r.classList.remove('lit'));fb.textContent='';fb.className='feedback';};
    shuf.forEach(sym=>{ const r=elm('div','rune',sym); r.tabIndex=0; const press=()=>{ fireStart(); if(row.dataset.done)return; if(sym===seq[prog]){r.classList.add('lit');prog++; if(prog===seq.length){row.dataset.done='1';fb.textContent=pz.success||'Solved!';fb.className='feedback ok';solved();}}else{fb.textContent='The melody falters — try again.';fb.className='feedback no';setTimeout(reset,700);} }; r.addEventListener('click',press); r.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();press();}}); row.appendChild(r); });
    $('[data-reset]',m).addEventListener('click',()=>{delete row.dataset.done;reset();});
  }
  return m;
}
function codeVault(codeText, adv, ch){
  const v=elm('div','code-vault');
  v.innerHTML=`<div class="vault-label">🗝 Secret Code</div><div class="code-locked">Solve this chapter's challenge to reveal the code.</div><div class="code-reveal"><div class="secret-code">${esc(codeText)}</div><button class="btn gold" data-copy>Copy code</button><div class="copy-note">Submit it on the giveaway page for entries.</div></div>`;
  v.addEventListener('click',e=>{ if(e.target.matches('[data-copy]')){ navigator.clipboard&&navigator.clipboard.writeText(codeText); e.target.textContent='Copied ✓'; setTimeout(()=>e.target.textContent='Copy code',1500); } });
  return v;
}
function archiveSwitcher(current, visible){
  const s=elm('section','section'); s.id='archive';
  s.innerHTML=`<p class="section-eyebrow">The shelf of tales</p><h2 class="section-title">Adventure Archive</h2><div class="rule">${ORN.leaf}</div>`;
  const card=elm('div','panel-cream archive');
  visible.forEach(a=>{ const isCur=a.id===current.id; const row=elm('div','arch-card'+(isCur?' current':''));
    row.innerHTML=`<span class="seal">${a.status==='featured'?ORN.clover:'📖'}</span><span><span class="a-name">${esc(a.meta&&a.meta.name)}</span><br><span class="a-blurb">${esc(a.meta&&a.meta.description)}</span></span>`;
    const tag=elm('span','a-tag', isCur?'Viewing':(a.status==='featured'?'Current':'Play'));
    if(!isCur){ row.style.cursor='pointer'; row.addEventListener('click',()=>{ track('archived_adventure_selected',{adventure_id:a.id,adventure_name:a.meta&&a.meta.name}); render(SITE_REF,Object.assign({},CTX,{adventureId:a.id})); window.scrollTo({top:0,behavior:'smooth'}); }); }
    row.appendChild(tag); card.appendChild(row); });
  s.appendChild(card);
  if(CTX.mode==='public') track('archive_opened',{count:visible.length});
  return card._parent=s, s;
}

let SITE_REF=null;
function publicRender(site, mount){ SITE_REF=site; render(site,{mount:mount||'#app',mode:'public'}); motes('#atmos'); }
function motes(sel){ const c=$(sel); if(!c) return; const n=window.innerWidth<600?9:16; for(let i=0;i<n;i++){ const m=elm('span','mote'); m.style.left=Math.random()*100+'%'; m.style.bottom=(-10-Math.random()*20)+'px'; const d=10+Math.random()*14; m.style.animationDuration=d+'s'; m.style.animationDelay=(-Math.random()*d)+'s'; m.style.transform='scale('+(.5+Math.random())+')'; c.appendChild(m); } }
function tickCountdowns(){ $$('.countdown').forEach(c=>{ const t=new Date(c.dataset.unlock)-Date.now(); if(t<=0&&SITE_REF){ render(SITE_REF,CTX); } else c.textContent='Unlocks in '+fmtCountdown(t); }); }

window.Minstrel = {
  render:(site,opts)=>{ SITE_REF=site; render(site,opts); },
  publicRender, motes, tickCountdowns, track, isChapterLive,
  ART, ORN, CHEVRON, GRADIENT_PRESETS, gradientCss, applyTheme, applyDesign,
  ART_OPTIONS:Object.keys(ART), setDebug:v=>DEBUG=!!v
};
})();
