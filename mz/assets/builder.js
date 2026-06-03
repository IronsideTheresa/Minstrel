/* ============================================================================
   Minstrel builder — loaded ONLY on /admin. Talks to /api when deployed;
   falls back to localStorage "review mode" when no backend is present so the
   whole editor can be played with locally before launch.
   ============================================================================ */
(function(){
const E=window.Minstrel;
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const el=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!=null)n.innerHTML=h;return n;};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clone=o=>JSON.parse(JSON.stringify(o));
const uid=p=>(p||'id')+'_'+Math.random().toString(36).slice(2,8);

let SITE=null, MODE='local', curAdvId=null, sel={id:null,kind:null}, TAB='structure', device='desktop', asUser=false, dirty=false;
const past=[], future=[]; let snapPending=false;
const DRAFT_KEY='minstrel_draft', PUB_KEY='minstrel_published';

/* ----------------------------- boot ----------------------------- */
async function boot(){
  let me=null;
  try{ const r=await fetch('/api/me'); if(r.ok) me=await r.json(); }catch(e){}
  if(me===null){ MODE='local'; await loadLocal(); mountEditor(); return; }   // no backend → review mode
  MODE='server';
  if(me.authed){ await loadServer(); mountEditor(); }
  else showLogin(me.passwordSet);
}
async function loadLocal(){
  const draft=localStorage.getItem(DRAFT_KEY);
  if(draft){ try{ SITE=JSON.parse(draft); }catch(e){} }
  if(!SITE){ SITE=await (await fetch('content.default.json')).json(); }
  curAdvId=featuredId();
}
async function loadServer(){
  try{ const r=await fetch('/api/content?draft=1'); SITE=await r.json(); }catch(e){ SITE=await (await fetch('/content.default.json')).json(); }
  curAdvId=featuredId();
}
function featuredId(){ const f=(SITE.adventures||[]).find(a=>a.status==='featured'); return f?f.id:(SITE.adventures[0]&&SITE.adventures[0].id); }
function curAdv(){ return (SITE.adventures||[]).find(a=>a.id===curAdvId)||SITE.adventures[0]; }

/* ----------------------------- history ----------------------------- */
function snapshot(){ past.push(clone(SITE)); if(past.length>50)past.shift(); future.length=0; markDirty(); }
function softSnapshot(){ if(snapPending) return; snapPending=true; past.push(clone(SITE)); if(past.length>50)past.shift(); future.length=0; }
function commitSoft(){ snapPending=false; }
function undo(){ if(!past.length)return; future.push(clone(SITE)); SITE=past.pop(); markDirty(); renderAll(); }
function redo(){ if(!future.length)return; past.push(clone(SITE)); SITE=future.pop(); markDirty(); renderAll(); }
function markDirty(){ dirty=true; document.body.classList.add('is-dirty'); }
function clearDirty(){ dirty=false; document.body.classList.remove('is-dirty'); }
window.addEventListener('beforeunload',e=>{ if(dirty){ e.preventDefault(); e.returnValue=''; } });

/* ----------------------------- render ----------------------------- */
let previewTimer=null;
function previewSoon(){ clearTimeout(previewTimer); previewTimer=setTimeout(renderPreview,160); }
function renderAll(){ renderTop(); renderLeft(); renderPreview(); }
function renderPreview(){
  E.applyTheme(SITE.theme); E.applyDesign(SITE.design);
  E.render(SITE,{ mount:'#app', mode:asUser?'public':'editor', adventureId:curAdvId, device,
    selectedId:sel.id, onSelectBlock:(id)=>{ selectBlock(id); }, onSelectChapter:(id)=>{ selectChapter(id); } });
}
function selectBlock(id){ sel={id,kind:'block'}; TAB='structure'; renderLeft(); renderPreview(); }
function selectChapter(id){ sel={id,kind:'chapter'}; TAB='structure'; renderLeft(); renderPreview(); }

/* ----------------------------- top bar ----------------------------- */
function renderTop(){
  const top=$('#ed-top'); top.innerHTML='';
  top.appendChild(el('span','brand','✦ Minstrel'));
  const advSel=el('select'); (SITE.adventures||[]).forEach(a=>{ const o=el('option',null,esc(a.meta.name)+(a.status==='featured'?' (featured)':a.status==='hidden'?' (hidden)':' (archived)')); o.value=a.id; if(a.id===curAdvId)o.selected=true; advSel.appendChild(o); });
  advSel.onchange=()=>{ curAdvId=advSel.value; sel={id:null,kind:null}; renderAll(); };
  top.appendChild(advSel);
  top.appendChild(el('span','dirty-dot'));
  top.appendChild(el('span','grow'));
  const seg=el('div','seg'); const dt=el('button',device==='desktop'?'on':'','🖥 Desktop'); const mb=el('button',device==='mobile'?'on':'','📱 Mobile'); dt.onclick=()=>{device='desktop';$('#ed-preview').classList.remove('mobile');renderTop();}; mb.onclick=()=>{device='mobile';$('#ed-preview').classList.add('mobile');renderTop();}; seg.appendChild(dt);seg.appendChild(mb); top.appendChild(seg);
  const pv=el('button','top-btn'+(asUser?' primary':''), asUser?'👁 Viewing as user':'👁 Preview as user'); pv.onclick=()=>{asUser=!asUser;sel={id:null,kind:null};renderAll();}; top.appendChild(pv);
  const u=el('button','top-btn','↩ Undo'); u.onclick=undo; const r=el('button','top-btn','↪ Redo'); r.onclick=redo; top.appendChild(u);top.appendChild(r);
  const sv=el('button','top-btn','💾 Save draft'); sv.onclick=saveDraft; top.appendChild(sv);
  const pb=el('button','top-btn primary','🚀 Publish'); pb.onclick=publish; top.appendChild(pb);
  if(MODE==='server'){ const lo=el('button','top-btn','Log out'); lo.onclick=async()=>{await fetch('/api/logout',{method:'POST'});location.reload();}; top.appendChild(lo); }
}

/* ----------------------------- left panel ----------------------------- */
function renderLeft(){
  const tabs=$('#ed-tabs'), panel=$('#ed-panel');
  const defs=[['structure','Build'],['design','Design'],['game','Game setup'],['status','Status'],['publish','Publish']];
  tabs.innerHTML=''; defs.forEach(([k,l])=>{ const b=el('button','ed-tab'+(k===TAB?' on':''),l); b.onclick=()=>{TAB=k;renderLeft();}; tabs.appendChild(b); });
  panel.innerHTML='';
  if(TAB==='structure') buildTab(panel);
  else if(TAB==='design') designTab(panel);
  else if(TAB==='game') gameTab(panel);
  else if(TAB==='status') statusTab(panel);
  else if(TAB==='publish') publishTab(panel);
}

/* ---------- field helpers (mutate obj[key]) ---------- */
function bindInput(inp,obj,key,onLive){ inp.addEventListener('focus',softSnapshot); inp.addEventListener('input',()=>{ obj[key]=inp.type==='number'?(+inp.value||0):inp.value; if(onLive)onLive(); markDirty(); previewSoon(); }); inp.addEventListener('change',commitSoft); }
function fText(obj,key,label,opts={}){ const f=el('div','fld'); f.innerHTML=`<label>${esc(label)}</label>`+(opts.area?`<textarea></textarea>`:`<input type="${opts.type||'text'}">`); const inp=f.querySelector('input,textarea'); inp.value=obj[key]!=null?obj[key]:''; if(opts.hint)f.insertAdjacentHTML('beforeend',`<div class="hint">${opts.hint}</div>`); bindInput(inp,obj,key,opts.onLive); return f; }
function fSelect(obj,key,label,choices,opts={}){ const f=el('div','fld'); f.innerHTML=`<label>${esc(label)}</label><select>${choices.map(c=>`<option value="${esc(c.v)}" ${c.v===obj[key]?'selected':''}>${esc(c.t)}</option>`).join('')}</select>`; f.querySelector('select').onchange=e=>{ snapshot(); obj[key]=e.target.value; if(opts.onChange)opts.onChange(); renderLeft(); renderPreview(); }; return f; }
function fColor(obj,key,label,onLive){ const f=el('div','fld'); const cur=obj[key]||'#000000'; f.innerHTML=`<label>${esc(label)}</label><div class="swatch"><input type="color" value="${esc(cur)}"><input type="text" value="${esc(cur)}"></div>`; const [cp,tx]=$$('.swatch input',f); const set=v=>{obj[key]=v;cp.value=v;tx.value=v;markDirty();(onLive||(()=>{}))();previewSoon();}; cp.onfocus=softSnapshot; cp.oninput=()=>set(cp.value); tx.oninput=()=>{if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(tx.value))set(tx.value);}; return f; }
function fCheck(obj,key,label,opts={}){ const t=el('label','toggle'); const c=el('input');c.type='checkbox';c.checked=obj[key]!==false&&obj[key]!=null?!!obj[key]:!!obj[key]; c.checked=!!obj[key]; c.onchange=()=>{snapshot();obj[key]=c.checked;if(opts.onChange)opts.onChange();renderLeft();renderPreview();}; t.appendChild(c);t.appendChild(document.createTextNode(' '+label)); return t; }
function fImage(obj,key,label,opts={}){ const f=el('div','fld'); const cur=obj[key]||''; f.innerHTML=`<label>${esc(label)}</label><div class="img-field"><img class="img-thumb" src="${esc(cur)||'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='}"><input type="text" value="${esc(cur)}" placeholder="Paste URL or upload →"><button type="button" class="mini-btn">Upload</button><input type="file" accept="image/*" style="display:none"></div>${opts.hint?`<div class="hint">${opts.hint}</div>`:''}`; const thumb=f.querySelector('.img-thumb'),tx=f.querySelector('input[type=text]'),btn=f.querySelector('button'),file=f.querySelector('input[type=file]'); const set=v=>{obj[key]=v;tx.value=v;if(v)thumb.src=v;markDirty();previewSoon();}; tx.oninput=()=>set(tx.value); btn.onclick=()=>file.click(); file.onchange=async()=>{ if(!file.files[0])return; btn.textContent='…'; const url=await uploadImage(file.files[0]); snapshot(); set(url); btn.textContent='Upload'; }; return f; }
async function uploadImage(file){ const dataUrl=await new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=rej;r.readAsDataURL(file);}); if(MODE==='server'){ try{ const r=await fetch('/api/upload',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({filename:file.name,dataUrl})}); if(r.ok){const j=await r.json(); if(j.url)return j.url;} }catch(e){} } if(dataUrl.length>1500000) flash('Large image embedded — add Blob storage for hosted uploads when deployed.'); return dataUrl; }

/* ---------- BUILD tab: block list + inspector ---------- */
const BLOCK_LABELS={hero:'Hero',text:'Text',image:'Image',video:'Video',button:'Button',faq:'FAQ',chapterList:'Chapters',prize:'Prize / reward',social:'Social links',panel:'Container'};
function buildTab(panel){
  const adv=curAdv();
  panel.appendChild(el('div','sec-title','Page structure'));
  panel.appendChild(el('div','note','Click a block here or in the preview to edit it. Reorder with ▲▼ or drag. Duplicate ⧉, hide 👁, delete ✕.'));
  const list=el('div','struct-list');
  adv.blocks.forEach((b,i)=>list.appendChild(structItem(b,i,adv)));
  panel.appendChild(list);
  // palette
  panel.appendChild(el('div','sec-title','Add a block'));
  const pal=el('div','palette');
  ['text','image','video','button','panel','faq','prize','social','chapterList','hero'].forEach(type=>{ const b=el('button',null,'＋ '+BLOCK_LABELS[type]); b.onclick=()=>addBlock(type,adv); pal.appendChild(b); });
  panel.appendChild(pal);
  // inspector
  if(sel.kind==='block'){ const b=adv.blocks.find(x=>x.id===sel.id); if(b){ panel.appendChild(el('hr')); panel.appendChild(el('div','sec-title','Edit: '+(BLOCK_LABELS[b.type]||b.type))); blockInspector(panel,b,adv); } }
  if(sel.kind==='chapter'){ const ch=adv.chapters.find(x=>x.id===sel.id); if(ch){ panel.appendChild(el('hr')); panel.appendChild(el('div','sec-title','Edit chapter')); chapterInspector(panel,ch,adv); } }
}
function structItem(b,i,adv){
  const it=el('div','struct-item'+(sel.id===b.id&&sel.kind==='block'?' sel':'')); it.draggable=true;
  it.innerHTML=`<span class="grip">⠿</span><span class="si-name">${esc(BLOCK_LABELS[b.type]||b.type)}${b.hidden?' · hidden':''}</span><span class="si-type">${esc(b.type)}</span><span class="si-tools"></span>`;
  it.onclick=e=>{ if(e.target.closest('.si-tools'))return; selectBlock(b.id); };
  const tools=$('.si-tools',it);
  const mk=(t,fn,title)=>{const x=el('button',null,t);x.title=title||'';x.onclick=e=>{e.stopPropagation();fn();};tools.appendChild(x);};
  mk('▲',()=>moveBlock(adv,i,-1),'Move up'); mk('▼',()=>moveBlock(adv,i,1),'Move down');
  mk('⧉',()=>dupBlock(adv,i),'Duplicate'); mk(b.hidden?'🚫':'👁',()=>{snapshot();b.hidden=!b.hidden;renderAll();},'Show/Hide');
  mk('✕',()=>{ if(confirm('Delete this '+(BLOCK_LABELS[b.type]||b.type)+' block?')){snapshot();adv.blocks.splice(i,1);if(sel.id===b.id)sel={id:null,kind:null};renderAll();} },'Delete');
  // drag reorder
  it.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',i);});
  it.addEventListener('dragover',e=>{e.preventDefault();it.classList.add('dragover');});
  it.addEventListener('dragleave',()=>it.classList.remove('dragover'));
  it.addEventListener('drop',e=>{e.preventDefault();it.classList.remove('dragover');const from=+e.dataTransfer.getData('text/plain');if(from!==i){snapshot();const[m]=adv.blocks.splice(from,1);adv.blocks.splice(i,0,m);renderAll();}});
  return it;
}
function moveBlock(adv,i,d){ const j=i+d; if(j<0||j>=adv.blocks.length)return; snapshot(); [adv.blocks[i],adv.blocks[j]]=[adv.blocks[j],adv.blocks[i]]; renderAll(); }
function dupBlock(adv,i){ snapshot(); const c=clone(adv.blocks[i]); c.id=uid('b'); adv.blocks.splice(i+1,0,c); sel={id:c.id,kind:'block'}; renderAll(); }
function addBlock(type,adv){ snapshot(); const b=newBlock(type); adv.blocks.push(b); sel={id:b.id,kind:'block'}; renderAll(); }
function newBlock(type){
  const base={id:uid('b'),type,hidden:false,style:{}};
  const props={ text:{eyebrow:'',heading:'New heading',body:'Write something here.',italic:false},
    image:{src:'',alt:'',caption:'',link:''}, video:{url:''}, button:{label:'Button',url:'',newTab:true,variant:'gold',align:'center'},
    panel:{heading:'New section',subheading:'',body:'',buttonLabel:'',buttonUrl:'',newTab:true,media:{type:'image',src:''}},
    faq:{sectionEyebrow:'Before you begin',sectionTitle:'Questions & Answers',items:[{id:uid('q'),q:'New question',a:'Answer',hidden:false}]},
    prize:{sectionEyebrow:'Join the quest',sectionTitle:'Giveaway Hub',kicker:'',logo:'',logoSub:'',title:'',description:'',rewards:[],tagline:'',art:'prize',image:'',cta:{label:'Enter on Gleam',url:'',newTab:true}},
    social:{heading:'Join the community',links:[{platform:'discord',url:''}]},
    chapterList:{sectionEyebrow:'Open the book',sectionTitle:'Chapters'},
    hero:{eyebrow:'An Ironside Adventure',title:'New Adventure',tagline:'',intro:'',releaseStatus:'',releaseSub:'',art:'forest',image:''} };
  base.props=props[type]||{}; return base;
}

/* ---------- block inspector (content + style) ---------- */
function blockInspector(panel,b,adv){
  const p=b.props;
  if(b.type==='hero'){ panel.appendChild(fText(p,'eyebrow','Eyebrow')); panel.appendChild(fText(p,'title','Title')); panel.appendChild(fText(p,'tagline','Tagline',{area:true})); panel.appendChild(fText(p,'intro','Intro',{area:true})); panel.appendChild(fText(p,'releaseStatus','Release badge')); panel.appendChild(fText(p,'releaseSub','Release sub-line')); panel.appendChild(fSelect(p,'art','Artwork',E.ART_OPTIONS.map(a=>({v:a,t:a})))); panel.appendChild(fImage(p,'image','Image (overrides art)')); }
  else if(b.type==='text'){ panel.appendChild(fText(p,'eyebrow','Eyebrow / label')); panel.appendChild(fText(p,'heading','Heading')); panel.appendChild(fText(p,'body','Body',{area:true})); panel.appendChild(fCheck(p,'italic','Italic / quote style')); }
  else if(b.type==='image'){ panel.appendChild(fImage(p,'src','Image')); panel.appendChild(fText(p,'alt','Alt text')); panel.appendChild(fText(p,'caption','Caption')); panel.appendChild(fText(p,'link','Link URL (optional)')); }
  else if(b.type==='video'){ panel.appendChild(fText(p,'url','Video URL',{hint:'YouTube, Vimeo or direct MP4 link.'})); }
  else if(b.type==='button'){ panel.appendChild(fText(p,'label','Button text')); panel.appendChild(fText(p,'url','Link URL',{hint:'Gleam, Discord, product page, #giveaway, etc.'})); panel.appendChild(fSelect(p,'variant','Style',[{v:'gold',t:'Gold'},{v:'primary',t:'Ember'},{v:'ghost',t:'Outline'}])); panel.appendChild(fSelect(p,'align','Alignment',[{v:'center',t:'Center'},{v:'left',t:'Left'},{v:'right',t:'Right'}])); panel.appendChild(fCheck(p,'newTab','Open in new tab')); }
  else if(b.type==='panel'){ panel.appendChild(fText(p,'subheading','Subheading')); panel.appendChild(fText(p,'heading','Heading')); panel.appendChild(fText(p,'body','Body',{area:true})); panel.appendChild(fImage(p.media,'src','Image (optional)')); panel.appendChild(fText(p,'buttonLabel','Button text')); panel.appendChild(fText(p,'buttonUrl','Button URL')); panel.appendChild(fCheck(p,'newTab','Open in new tab')); }
  else if(b.type==='social'){ panel.appendChild(fText(p,'heading','Heading')); panel.appendChild(linksEditor(p.links)); }
  else if(b.type==='faq'){ panel.appendChild(fText(p,'sectionEyebrow','Section eyebrow')); panel.appendChild(fText(p,'sectionTitle','Section title')); panel.appendChild(faqItemsEditor(p.items)); }
  else if(b.type==='prize'){ panel.appendChild(fText(p,'sectionEyebrow','Section eyebrow')); panel.appendChild(fText(p,'sectionTitle','Section title')); panel.appendChild(fText(p,'kicker','Kicker',{area:true})); panel.appendChild(fText(p,'logo','Logo word')); panel.appendChild(fText(p,'logoSub','Logo sub-line')); panel.appendChild(fText(p,'title','Headline',{area:true})); panel.appendChild(fText(p,'description','Description',{area:true})); panel.appendChild(rewardsEditor(p.rewards)); panel.appendChild(fText(p,'tagline','Closing tagline')); panel.appendChild(fSelect(p,'art','Prize artwork',E.ART_OPTIONS.map(a=>({v:a,t:a})))); panel.appendChild(fImage(p,'image','Prize image')); panel.appendChild(fText(p.cta,'label','Gleam button label')); panel.appendChild(fText(p.cta,'url','Gleam URL')); }
  else if(b.type==='chapterList'){ panel.appendChild(fText(p,'sectionEyebrow','Section eyebrow')); panel.appendChild(fText(p,'sectionTitle','Section title')); panel.appendChild(el('div','note','Manage the chapters below. Click any chapter in the preview to edit it.')); panel.appendChild(chapterManager(adv)); }
  // style controls (not for chapterList/hero which are structural)
  if(['text','image','video','panel','prize'].indexOf(b.type)>=0){ panel.appendChild(el('hr')); panel.appendChild(el('div','sec-title','Block design')); styleControls(panel,b.style||(b.style={})); }
}
function styleControls(panel,st){
  panel.appendChild(fSelect(st,'surface','Surface',[{v:'',t:'Default'},{v:'cream',t:'Cream panel'},{v:'dark',t:'Dark panel'},{v:'none',t:'None / transparent'}]));
  // gradient
  if(!st.gradient) st.gradient={mode:'off'};
  panel.appendChild(fSelect(st.gradient,'mode','Background gradient',[{v:'off',t:'Off'},{v:'preset',t:'Preset'},{v:'custom',t:'Custom'}]));
  if(st.gradient.mode==='preset'){ panel.appendChild(fSelect(st.gradient,'preset','Gradient preset',Object.keys(E.GRADIENT_PRESETS).map(k=>({v:k,t:k})))); }
  if(st.gradient.mode==='custom'){ const row=el('div','fld-row'); row.appendChild(fColor(st.gradient,'from','From')); row.appendChild(fColor(st.gradient,'to','To')); panel.appendChild(row); panel.appendChild(fText(st.gradient,'angle','Angle (deg)',{type:'number'})); }
  if(st.gradient.mode==='off'&&!st.surface){ panel.appendChild(fColor(st,'bg','Background colour')); }
  panel.appendChild(fColor(st,'textColor','Text colour'));
  const row2=el('div','fld-row'); row2.appendChild(fText(st,'radius','Corner radius',{type:'number'})); row2.appendChild(fText(st,'padding','Padding',{type:'number'})); panel.appendChild(row2);
  panel.appendChild(fSelect(st,'width','Width',[{v:'',t:'Normal'},{v:'wide',t:'Wide'},{v:'full',t:'Full bleed'}]));
  panel.appendChild(fSelect(st,'align','Alignment',[{v:'',t:'Default'},{v:'left',t:'Left'},{v:'center',t:'Center'},{v:'right',t:'Right'}]));
}
function linksEditor(arr){ const f=el('div','fld'); f.innerHTML='<label>Links</label>'; arr.forEach((l,i)=>{ const row=el('div','fld-row'); row.style.alignItems='center'; const sel=el('select'); ['discord','twitch','instagram','youtube','twitter','tiktok','facebook'].forEach(pl=>{const o=el('option',null,pl);o.value=pl;if(pl===l.platform)o.selected=true;sel.appendChild(o);}); sel.style.flex='0 0 110px'; sel.onchange=()=>{softSnapshot();l.platform=sel.value;commitSoft();markDirty();previewSoon();}; const inp=el('input');inp.type='text';inp.value=l.url||'';inp.placeholder='https://…';inp.style.flex='1'; bindInput(inp,l,'url'); const del=el('button','mini-btn','✕');del.onclick=()=>{snapshot();arr.splice(i,1);renderLeft();renderPreview();}; row.appendChild(sel);row.appendChild(inp);row.appendChild(del); f.appendChild(row); }); const add=el('button','add-btn','＋ Add link');add.onclick=()=>{snapshot();arr.push({platform:'discord',url:''});renderLeft();renderPreview();};f.appendChild(add); return f; }
function rewardsEditor(arr){ const f=el('div','fld'); f.innerHTML='<label>Rewards</label>'; arr.forEach((v,i)=>{ const row=el('div','fld-row');row.style.alignItems='center'; const inp=el('input');inp.type='text';inp.value=v;inp.style.flex='1'; inp.onfocus=softSnapshot; inp.oninput=()=>{arr[i]=inp.value;markDirty();previewSoon();}; inp.onchange=commitSoft; const del=el('button','mini-btn','✕');del.onclick=()=>{snapshot();arr.splice(i,1);renderLeft();renderPreview();}; row.appendChild(inp);row.appendChild(del);f.appendChild(row); }); const add=el('button','add-btn','＋ Add reward');add.onclick=()=>{snapshot();arr.push('New reward');renderLeft();renderPreview();};f.appendChild(add); return f; }
function faqItemsEditor(items){ const f=el('div','fld'); f.innerHTML='<label>Questions</label>'; items.forEach((q,i)=>{ const c=el('div','struct-item');c.style.flexWrap='wrap'; c.innerHTML=`<span class="si-name">${esc(q.q)||'(question)'}</span><span class="si-tools"></span>`; const tools=$('.si-tools',c); const mk=(t,fn)=>{const x=el('button',null,t);x.onclick=e=>{e.stopPropagation();fn();};tools.appendChild(x);}; mk('▲',()=>{if(i>0){snapshot();[items[i-1],items[i]]=[items[i],items[i-1]];renderLeft();renderPreview();}}); mk('▼',()=>{if(i<items.length-1){snapshot();[items[i+1],items[i]]=[items[i],items[i+1]];renderLeft();renderPreview();}}); mk(q.hidden?'🚫':'👁',()=>{snapshot();q.hidden=!q.hidden;renderLeft();renderPreview();}); mk('✕',()=>{snapshot();items.splice(i,1);renderLeft();renderPreview();}); const qf=fText(q,'q','Question');const af=fText(q,'a','Answer',{area:true}); qf.style.flex='1 1 100%';af.style.flex='1 1 100%'; c.appendChild(qf);c.appendChild(af); f.appendChild(c); }); const add=el('button','add-btn','＋ Add question');add.onclick=()=>{snapshot();items.push({id:uid('q'),q:'New question',a:'Answer',hidden:false});renderLeft();renderPreview();};f.appendChild(add); return f; }

/* ---------- chapter manager + inspector ---------- */
function chapterManager(adv){
  const wrap=el('div'); adv.chapters=adv.chapters||[];
  adv.chapters.forEach((ch,i)=>{ const it=el('div','struct-item'+(sel.id===ch.id&&sel.kind==='chapter'?' sel':'')); it.draggable=true;
    it.innerHTML=`<span class="grip">⠿</span><span class="si-name">Ch ${ch.n}: ${esc(ch.title)}</span><span class="badge ${ch.status||'draft'}">${ch.status||'draft'}</span><span class="si-tools"></span>`;
    it.onclick=e=>{ if(e.target.closest('.si-tools'))return; selectChapter(ch.id); };
    const tools=$('.si-tools',it); const mk=(t,fn,ti)=>{const x=el('button',null,t);x.title=ti||'';x.onclick=e=>{e.stopPropagation();fn();};tools.appendChild(x);};
    mk('▲',()=>{if(i>0){snapshot();[adv.chapters[i-1],adv.chapters[i]]=[adv.chapters[i],adv.chapters[i-1]];renderAll();}}); mk('▼',()=>{if(i<adv.chapters.length-1){snapshot();[adv.chapters[i+1],adv.chapters[i]]=[adv.chapters[i],adv.chapters[i+1]];renderAll();}});
    mk('⧉',()=>{snapshot();const c=clone(ch);c.id=uid('ch');c.n=adv.chapters.length+1;c.title=ch.title+' (copy)';adv.chapters.splice(i+1,0,c);sel={id:c.id,kind:'chapter'};renderAll();},'Duplicate');
    mk('✕',()=>{if(confirm('Delete chapter '+ch.n+'?')){snapshot();adv.chapters.splice(i,1);if(sel.id===ch.id)sel={id:null,kind:null};renderAll();}},'Delete');
    it.addEventListener('dragstart',e=>e.dataTransfer.setData('text/plain',i)); it.addEventListener('dragover',e=>{e.preventDefault();it.classList.add('dragover');}); it.addEventListener('dragleave',()=>it.classList.remove('dragover')); it.addEventListener('drop',e=>{e.preventDefault();it.classList.remove('dragover');const from=+e.dataTransfer.getData('text/plain');if(from!==i){snapshot();const[m]=adv.chapters.splice(from,1);adv.chapters.splice(i,0,m);renderAll();}});
    wrap.appendChild(it); });
  const add=el('button','add-btn','＋ Add chapter'); add.onclick=()=>{snapshot();const n=adv.chapters.length+1;const ch={id:uid('ch'),n,title:'New Chapter',status:'draft',unlockAt:'',icon:'',art:'forest',image:'',story:['Write the chapter lore here.'],puzzle:{kind:'none'},code:{text:'',active:false,revealTiming:'onSolve'},cta:{label:'Enter the giveaway',url:'#giveaway',newTab:false},reward:null};adv.chapters.push(ch);sel={id:ch.id,kind:'chapter'};renderAll();}; wrap.appendChild(add);
  return wrap;
}
function chapterInspector(panel,ch,adv){
  const row=el('div','fld-row'); row.appendChild(fText(ch,'n','Chapter #',{type:'number'})); panel.appendChild(row);
  panel.appendChild(fText(ch,'title','Title'));
  panel.appendChild(fSelect(ch,'status','Status',[{v:'draft',t:'Draft (hidden)'},{v:'hidden',t:'Hidden'},{v:'scheduled',t:'Scheduled'},{v:'live',t:'Live'},{v:'archived',t:'Archived (playable)'}]));
  if(ch.status==='scheduled'){ panel.appendChild(fText(ch,'unlockAt','Unlock date & time',{type:'datetime-local',hint:'Unlocks automatically at this time.'})); }
  panel.appendChild(fImage(ch,'icon','Chapter icon (replaces the number)',{hint:'Small square image/logo. Blank = show number.'}));
  panel.appendChild(fSelect(ch,'art','Artwork',E.ART_OPTIONS.map(a=>({v:a,t:a}))));
  panel.appendChild(fImage(ch,'image','Chapter image (overrides artwork)'));
  // story as paragraphs
  const sf=el('div','fld'); sf.innerHTML='<label>Story (one paragraph per line)</label><textarea></textarea>'; const ta=sf.querySelector('textarea'); ta.value=(ch.story||[]).join('\n\n'); ta.onfocus=softSnapshot; ta.oninput=()=>{ch.story=ta.value.split(/\n{2,}|\n/).map(s=>s.trim()).filter(Boolean);markDirty();previewSoon();}; ta.onchange=commitSoft; panel.appendChild(sf);
  // puzzle
  const pz=ch.puzzle||(ch.puzzle={kind:'none'});
  panel.appendChild(fSelect(pz,'kind','Puzzle / game',[{v:'none',t:'None'},{v:'riddle',t:'Riddle'},{v:'quiz',t:'Quiz'},{v:'runes',t:'Rune sequence'}],{onChange:()=>{ if(pz.kind==='riddle'){pz.prompt=pz.prompt||'';pz.answer=pz.answer||'';pz.hint=pz.hint||'';pz.success=pz.success||'';} if(pz.kind==='quiz'){pz.question=pz.question||'';pz.options=pz.options||['','',''];pz.correct=pz.correct||0;pz.success=pz.success||'';} if(pz.kind==='runes'){pz.prompt=pz.prompt||'';pz.sequence=pz.sequence||['ᚠ','ᚢ','ᚦ'];pz.success=pz.success||'';} }}));
  if(pz.kind==='riddle'){ panel.appendChild(fText(pz,'prompt','Prompt',{area:true})); panel.appendChild(fText(pz,'answer','Answer')); panel.appendChild(fText(pz,'hint','Hint')); panel.appendChild(fText(pz,'success','Success message',{area:true})); }
  else if(pz.kind==='quiz'){ panel.appendChild(fText(pz,'question','Question',{area:true})); const of=el('div','fld');of.innerHTML='<label>Options (one per line)</label><textarea></textarea>';const ota=of.querySelector('textarea');ota.value=(pz.options||[]).join('\n');ota.onfocus=softSnapshot;ota.oninput=()=>{pz.options=ota.value.split('\n').map(s=>s.trim()).filter(Boolean);markDirty();previewSoon();};ota.onchange=commitSoft;panel.appendChild(of); panel.appendChild(fText(pz,'correctNum','Correct option # (1,2,3…)',{onLive:()=>{pz.correct=Math.max(0,(parseInt(pz.correctNum,10)||1)-1);}})); panel.appendChild(fText(pz,'success','Success message',{area:true})); }
  else if(pz.kind==='runes'){ panel.appendChild(fText(pz,'prompt','Prompt',{area:true})); const rf=el('div','fld');rf.innerHTML='<label>Rune sequence (space-separated)</label><input type="text">';const ri=rf.querySelector('input');ri.value=(pz.sequence||[]).join(' ');ri.onfocus=softSnapshot;ri.oninput=()=>{pz.sequence=ri.value.split(/\s+/).filter(Boolean);markDirty();previewSoon();};ri.onchange=commitSoft;panel.appendChild(rf); panel.appendChild(fText(pz,'success','Success message',{area:true})); }
  // code
  panel.appendChild(el('div','sec-title','Secret code'));
  const code=ch.code||(ch.code={text:'',active:true,revealTiming:'onSolve'});
  panel.appendChild(fText(code,'text','Code text',{hint:'Hidden from the public until released & revealed.'}));
  panel.appendChild(fCheck(code,'active','Code active'));
  panel.appendChild(fSelect(code,'revealTiming','Reveal timing',[{v:'onSolve',t:'After puzzle solved'},{v:'immediate',t:'Immediately when live'},{v:'manual',t:'Manual (keep hidden for now)'}]));
  // cta + reward
  panel.appendChild(el('div','sec-title','Button & reward'));
  if(!ch.cta) ch.cta={label:'',url:'',newTab:false};
  panel.appendChild(fText(ch.cta,'label','Button label')); panel.appendChild(fText(ch.cta,'url','Button URL',{hint:'#giveaway or a full URL'}));
  if(!ch.reward) ch.reward={title:'',text:''};
  panel.appendChild(fText(ch.reward,'title','Reward title')); panel.appendChild(fText(ch.reward,'text','Reward text',{area:true}));
}

/* ---------- DESIGN tab (global) ---------- */
function designTab(panel){
  panel.appendChild(el('div','note','Global look. Each block can also have its own background, colours and gradient in the Build tab.'));
  panel.appendChild(el('div','sec-title','Page background gradient'));
  const d=SITE.design||(SITE.design={pageGradient:{mode:'preset',preset:'forest-night'}}); const g=d.pageGradient||(d.pageGradient={mode:'preset',preset:'forest-night'});
  panel.appendChild(fSelect(g,'mode','Gradient',[{v:'off',t:'Off (solid background)'},{v:'preset',t:'Preset'},{v:'custom',t:'Custom'}]));
  if(g.mode==='preset') panel.appendChild(fSelect(g,'preset','Preset',Object.keys(E.GRADIENT_PRESETS).map(k=>({v:k,t:k}))));
  if(g.mode==='custom'){ const r=el('div','fld-row');r.appendChild(fColor(g,'from','From',()=>E.applyDesign(SITE.design)));r.appendChild(fColor(g,'to','To',()=>E.applyDesign(SITE.design)));panel.appendChild(r); panel.appendChild(fText(g,'angle','Angle (deg)',{type:'number',onLive:()=>E.applyDesign(SITE.design)})); }
  panel.appendChild(el('div','sec-title','Brand colours'));
  const t=SITE.theme||(SITE.theme={});
  [['Page background','bgDark'],['Headings','heading'],['Body text (on dark)','mint'],['Forest panels','forest'],['Gold','gold'],['Gold bright','goldBright'],['Button','button'],['Button text','buttonText'],['Moonlit','moonlit'],['Cream panels','cream'],['Ink (on cream)','ink'],['Ember','ember']].forEach(([l,k])=>panel.appendChild(fColor(t,k,l,()=>E.applyTheme(SITE.theme))));
}

/* ---------- GAME tab ---------- */
function gameTab(panel){
  const adv=curAdv(); const m=adv.meta||(adv.meta={});
  panel.appendChild(el('div','sec-title','Adventure'));
  panel.appendChild(fSelect(adv,'status','This adventure is',[{v:'featured',t:'Featured (homepage)'},{v:'archived',t:'Archived (still playable)'},{v:'hidden',t:'Hidden from public'}],{onChange:()=>{ if(adv.status==='featured'){ SITE.adventures.forEach(a=>{ if(a!==adv&&a.status==='featured')a.status='archived'; }); } }}));
  panel.appendChild(fText(m,'name','Adventure name')); panel.appendChild(fText(m,'description','Description',{area:true}));
  const r=el('div','fld-row'); r.appendChild(fText(m,'chaptersPlanned','# Chapters',{type:'number'})); r.appendChild(fText(m,'codesPlanned','# Codes',{type:'number'})); panel.appendChild(r);
  panel.appendChild(fText(m,'prize','Prize / reward'));
  const r2=el('div','fld-row'); r2.appendChild(fText(m,'startDate','Start date',{type:'text',hint:'YYYY-MM-DD'})); r2.appendChild(fText(m,'endDate','End date',{type:'text'})); panel.appendChild(r2);
  panel.appendChild(fSelect(m,'releaseMode','Chapter release',[{v:'scheduled',t:'On a schedule'},{v:'manual',t:'Manually'}]));
  panel.appendChild(fCheck(m,'archivedPlayable','Archived chapters stay playable'));
  panel.appendChild(fCheck(m,'keepInArchive','Keep this adventure in the public archive'));
  panel.appendChild(el('div','sec-title','All adventures'));
  const na=el('button','add-btn','+ New adventure');
  na.onclick=()=>{
    snapshot();
    const id=uid('adv');
    const meta={name:'New Adventure',description:'',chaptersPlanned:6,codesPlanned:6,prize:'',startDate:'',endDate:'',releaseMode:'scheduled',archivedPlayable:true,keepInArchive:true};
    SITE.adventures.push({ id:id, status:'hidden', meta:meta, blocks:[newBlock('hero'),newBlock('chapterList')], chapters:[] });
    curAdvId=id; sel={id:null,kind:null}; renderAll();
  };
  panel.appendChild(na);
  if(SITE.adventures.length>1){ const del=el('button','add-btn','✕ Delete this adventure'); del.style.borderColor='#b5482e';del.style.color='#7a2e10'; del.onclick=()=>{ if(confirm('Delete adventure "'+m.name+'"? This cannot be undone.')){ snapshot(); SITE.adventures=SITE.adventures.filter(a=>a.id!==adv.id); curAdvId=featuredId(); sel={id:null,kind:null}; renderAll(); } }; panel.appendChild(del); }
}

/* ---------- STATUS tab ---------- */
function statusTab(panel){
  const adv=curAdv();
  panel.appendChild(el('div','sec-title','What the public can see'));
  const tbl=el('table','status-table'); tbl.innerHTML='<thead><tr><th>Section</th><th>Status</th><th>Release</th></tr></thead>';
  const tb=el('tbody');
  const advBadge = adv.status==='featured'?'<span class="badge featured">Featured</span>':adv.status==='archived'?'<span class="badge archived">Archived</span>':'<span class="badge hidden">Hidden</span>';
  tb.appendChild(el('tr',null,`<td><strong>${esc(adv.meta.name)}</strong></td><td>${advBadge}</td><td>${adv.status==='hidden'?'Not public':'Now'}</td>`));
  adv.blocks.forEach(b=>{ tb.appendChild(el('tr',null,`<td>${esc(BLOCK_LABELS[b.type]||b.type)}</td><td>${b.hidden?'<span class="badge hidden">Hidden</span>':'<span class="badge live">Live</span>'}</td><td>${b.hidden?'—':'Now'}</td>`)); });
  (adv.chapters||[]).forEach(ch=>{ const s=ch.status||'draft'; const rel = s==='scheduled'?(ch.unlockAt?new Date(ch.unlockAt).toLocaleString([], {month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}):'No date set'):(s==='live'||s==='archived'?'Now':'—'); tb.appendChild(el('tr',null,`<td>Chapter ${ch.n}: ${esc(ch.title)}</td><td><span class="badge ${s}">${s}</span></td><td>${esc(rel)}</td>`)); });
  tbl.appendChild(tb); panel.appendChild(tbl);
}

/* ---------- PUBLISH tab ---------- */
function validate(){
  const w=[]; (SITE.adventures||[]).forEach(adv=>{ const tag=adv.meta.name+': ';
    const codes={};
    (adv.chapters||[]).forEach(ch=>{ if(!ch.title||!ch.title.trim()) w.push(tag+'a chapter has no title.'); if(ch.status==='scheduled'&&!ch.unlockAt) w.push(tag+'Chapter '+ch.n+' is Scheduled but has no date.'); if(ch.code&&ch.code.active&&ch.code.text){ const k=ch.code.text.trim().toUpperCase(); if(codes[k]) w.push(tag+'duplicate code "'+ch.code.text+'".'); codes[k]=1; } if(ch.cta&&ch.cta.label&&!ch.cta.url) w.push(tag+'Chapter '+ch.n+' button has no URL.'); });
    (adv.blocks||[]).forEach(b=>{ if(b.type==='button'&&b.props.label&&!b.props.url) w.push(tag+'a button block has no URL.'); if(b.type==='prize'&&b.props.cta&&b.props.cta.label&&!b.props.cta.url) w.push(tag+'prize block button has no URL.'); if(b.type==='video'&&!b.props.url) w.push(tag+'a video block has no URL.'); });
  });
  return w;
}
function publishTab(panel){
  panel.appendChild(el('div','note', MODE==='local'?'You are in local review mode — “Publish” saves a local preview only. When Bobby deploys this, Publish will push live to everyone.':'“Publish” pushes your changes live to the public instantly.'));
  const w=validate();
  if(w.length){ const box=el('div','fld'); box.innerHTML='<label>⚠ Check before publishing</label>'; const ul=el('ul','warn-list'); w.forEach(x=>ul.appendChild(el('li',null,esc(x)))); box.appendChild(ul); panel.appendChild(box); }
  else panel.appendChild(el('div','note','✓ No problems found — ready to publish.'));
  const mk=(t,fn,cls)=>{const b=el('button','add-btn',t);if(cls)b.style.cssText='border-color:#1f6b3c;color:#0c1810;background:#cfe7d5';b.onclick=fn;return b;};
  panel.appendChild(mk('🚀 Publish '+(w.length?'anyway':'now'),publish,'go'));
  panel.appendChild(mk('💾 Save draft',saveDraft));
  panel.appendChild(mk('⬇ Export backup (.json)',exportJSON));
  const imp=el('label','add-btn');imp.style.display='block';imp.style.textAlign='center';imp.textContent='⬆ Import backup (.json)…';const fi=el('input');fi.type='file';fi.accept='.json';fi.style.display='none';fi.onchange=importJSON;imp.appendChild(fi);panel.appendChild(imp);
  if(MODE==='local'){ panel.appendChild(mk('🗑 Reset local draft',()=>{ if(confirm('Discard local draft and reload starter content?')){localStorage.removeItem(DRAFT_KEY);location.reload();} })); }
}

/* ---------- save / publish / io ---------- */
function saveDraft(){ if(MODE==='local'){ localStorage.setItem(DRAFT_KEY,JSON.stringify(SITE)); clearDirty(); flash('Draft saved on this device ✓'); } else { postSave(false); } }
async function publish(){ const w=validate(); if(w.length && !confirm(w.length+' warning(s) found. Publish anyway?')) return; if(MODE==='local'){ localStorage.setItem(DRAFT_KEY,JSON.stringify(SITE)); localStorage.setItem(PUB_KEY,JSON.stringify(SITE)); clearDirty(); flash('Published to local preview ✓ (open index.html to see it)'); } else { postSave(true); } }
async function postSave(publishLive){ flash(publishLive?'Publishing…':'Saving…'); try{ const r=await fetch('/api/save',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({content:SITE,publish:publishLive})}); if(r.ok){ clearDirty(); flash(publishLive?'Published live ✓':'Draft saved ✓'); } else if(r.status===401){ flash('Session expired — log in again.'); showLogin(); } else { const j=await r.json().catch(()=>({})); flash('Failed: '+(j.error||r.status)); } }catch(e){ flash('Network error: '+e.message); } }
function download(name,text,type){const b=new Blob([text],{type:type||'text/plain'});const a=el('a');a.href=URL.createObjectURL(b);a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},400);}
function exportJSON(){ download('minstrel-backup.json',JSON.stringify(SITE,null,2),'application/json'); }
function importJSON(e){ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{ try{ snapshot(); SITE=JSON.parse(r.result); curAdvId=featuredId(); renderAll(); flash('Imported ✓ (remember to Publish)'); }catch(err){ alert('Invalid JSON file.'); } }; r.readAsText(f); }

/* ---------- login (server mode) ---------- */
function showLogin(passwordSet){ document.body.innerHTML=''; const wrap=el('div','login-wrap'); wrap.innerHTML=`<div class="login-card"><h1>Minstrel Editor</h1><p>${passwordSet===false?'Set ADMIN_PASSWORD in Vercel to enable login.':'Sign in to edit the adventure.'}</p><div class="login-err" id="lerr"></div><input id="lu" type="text" placeholder="Username" autocomplete="username"><input id="lp" type="password" placeholder="Password" autocomplete="current-password"><button class="add-btn" id="lgo" style="background:linear-gradient(180deg,#e6c879,#c9a24a);color:#0c1810">Enter the workshop</button></div>`; document.body.appendChild(wrap); const go=async()=>{ const r=await fetch('/api/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:$('#lu').value,password:$('#lp').value})}); if(r.ok){ location.reload(); } else { const j=await r.json().catch(()=>({})); $('#lerr').textContent=j.error||'Incorrect login.'; } }; $('#lgo').onclick=go; $('#lp').addEventListener('keydown',e=>{if(e.key==='Enter')go();}); setTimeout(()=>$('#lu').focus(),50); }

/* ---------- mount ---------- */
function flash(msg){ let f=$('#ed-flash'); if(!f){f=el('div');f.id='ed-flash';document.body.appendChild(f);} f.textContent=msg; f.style.opacity='1'; clearTimeout(f._t); f._t=setTimeout(()=>f.style.opacity='0',2000); }
function mountEditor(){
  const root=el('div'); root.id='editor-root';
  root.innerHTML=`<header id="ed-top"></header><div id="ed-main"><aside id="ed-left"><div class="ed-tabs" id="ed-tabs"></div><div class="ed-panel" id="ed-panel"></div></aside><section id="ed-preview"><div class="device-frame"><div class="atmos" id="atmos"></div><main class="wrap" id="app"></main></div></section></div>`;
  document.body.appendChild(root);
  renderAll();
  setInterval(()=>E.tickCountdowns(), 30000);
}
boot();
})();
