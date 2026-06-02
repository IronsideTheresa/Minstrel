/* ============================================================================
   Ironside Adventure Hub — admin editor (loaded ONLY on the protected /admin).
   Auth is enforced server-side; this just talks to the API.
   ============================================================================ */
(function(){
const E = window.AdventureEngine;
const ART_OPTIONS = E.ART_OPTIONS;
let STATE = null, ADMIN_TAB='story', rebuildTimer=null;

const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const el=(t,c,h)=>{const n=document.createElement(t);if(c)n.className=c;if(h!=null)n.innerHTML=h;return n;};
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function previewSoon(){ clearTimeout(rebuildTimer); rebuildTimer=setTimeout(()=>E.render(STATE,'#app'),180); }
function getByPath(p){ return p.split('.').reduce((o,k)=>o==null?o:o[k], STATE); }
function setByPath(p,v){ const ks=p.split('.'); let o=STATE; for(let i=0;i<ks.length-1;i++)o=o[ks[i]]; o[ks[ks.length-1]]=v; }

/* ---------- API ---------- */
async function api(path,opts){ const r=await fetch(path,Object.assign({headers:{'Content-Type':'application/json'}},opts)); let j={}; try{j=await r.json();}catch(e){} return {ok:r.ok,status:r.status,json:j}; }

/* ---------- image upload (Blob if available, else embed data URL) ---------- */
function fileToDataUrl(file){ return new Promise((res,rej)=>{ const r=new FileReader(); r.onload=()=>res(r.result); r.onerror=rej; r.readAsDataURL(file); }); }
async function uploadImage(file){
  const dataUrl=await fileToDataUrl(file);
  try{
    const r=await api('/api/upload',{method:'POST',body:JSON.stringify({filename:file.name,dataUrl})});
    if(r.ok && r.json.url) return r.json.url;
  }catch(e){}
  // fallback: embed directly (works without Blob; keep icons/images small)
  if(dataUrl.length>1500000) flash('Image embedded (large). Tip: add Blob storage for hosted uploads.');
  return dataUrl;
}

/* ---------- field helpers ---------- */
function fieldText(label,path,opts={}){
  const f=el('div','fld'); const id='f_'+path.replace(/\W/g,'_');
  const val=opts.value!=null?opts.value:(getByPath(path)||'');
  f.innerHTML=`<label for="${id}">${label}</label>`+(opts.area?`<textarea id="${id}">${esc(val)}</textarea>`:`<input id="${id}" type="${opts.type||'text'}" value="${esc(val)}">`)+(opts.hint?`<div class="hint">${opts.hint}</div>`:'');
  const inp=$('#'+id.replace(/([^\w-])/g,'\\$1'),f)||f.querySelector('input,textarea');
  inp.addEventListener('input',()=>{ opts.onInput?opts.onInput(inp.value):setByPath(path,inp.value); previewSoon(); });
  return f;
}
function fieldSelect(label,path,choices,opts={}){
  const f=el('div','fld'); const cur=getByPath(path);
  f.innerHTML=`<label>${label}</label><select>${choices.map(c=>`<option value="${esc(c.v)}" ${c.v===cur?'selected':''}>${esc(c.t)}</option>`).join('')}</select>`;
  f.querySelector('select').addEventListener('change',e=>{ opts.onChange?opts.onChange(e.target.value):(setByPath(path,e.target.value),previewSoon()); });
  return f;
}
function fieldColor(label,path){
  const f=el('div','fld'); const cur=getByPath(path)||'#000000';
  f.innerHTML=`<label>${label}</label><div class="swatch"><input type="color" value="${esc(cur)}"><input type="text" value="${esc(cur)}"></div>`;
  const [cp,tx]=$$('.swatch input',f);
  const upd=v=>{ setByPath(path,v); cp.value=v; tx.value=v; E.applyTheme(STATE.theme); previewSoon(); };
  cp.addEventListener('input',()=>upd(cp.value)); tx.addEventListener('input',()=>{ if(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(tx.value)) upd(tx.value); });
  return f;
}
function fieldImage(label,path,opts={}){
  const f=el('div','fld'); const cur=getByPath(path)||'';
  f.innerHTML=`<label>${label}</label><div class="img-field"><img class="img-thumb" alt="" src="${esc(cur)||'data:image/gif;base64,R0lGODlhAQABAAAAACwAAAAAAQABAAA='}"><input type="text" value="${esc(cur)}" placeholder="Paste URL or upload →"><button type="button" class="btn secondary" style="padding:9px 12px;font-size:12px">Upload</button><input type="file" accept="image/*" style="display:none"></div>${opts.hint?`<div class="hint">${opts.hint}</div>`:''}`;
  const [thumb]=$$('.img-thumb',f); const tx=f.querySelector('input[type=text]'); const btn=f.querySelector('button'); const file=f.querySelector('input[type=file]');
  const set=v=>{ setByPath(path,v); tx.value=v; thumb.src=v||thumb.src; previewSoon(); };
  tx.addEventListener('input',()=>set(tx.value));
  btn.addEventListener('click',()=>file.click());
  file.addEventListener('change',async()=>{ if(!file.files[0])return; btn.textContent='…'; const url=await uploadImage(file.files[0]); set(url); btn.textContent='Upload'; });
  return f;
}
function toggleBox(label,obj,key){ const t=el('label','toggle'); const c=el('input'); c.type='checkbox'; c.checked=obj[key]!==false; c.addEventListener('change',()=>{obj[key]=c.checked;previewSoon();}); t.appendChild(c); t.appendChild(document.createTextNode(label)); return t; }
function note(t){ return el('div','admin-note',t); }
function move(arr,i,d){ const j=i+d; if(j<0||j>=arr.length)return; [arr[i],arr[j]]=[arr[j],arr[i]]; E.render(STATE,'#app'); renderAdminBody(); }
function newChapter(n){ return { n, title:'New Chapter', art:'forest', image:'', icon:'', publish:{mode:'manual',live:false,unlockAt:''}, elements:{art:true,story:true,interactive:false,code:false,cta:true,reward:false}, story:['Write the chapter lore here.'], interactive:{type:'none'}, secretCode:'', cta:{label:'Enter the giveaway',url:'#giveaway'}, reward:null }; }

/* ---------- tabs ---------- */
function renderAdminBody(){
  const b=$('#admin-body'); if(!b) return; b.innerHTML='';
  if(ADMIN_TAB==='story'){
    b.appendChild(fieldText('Story title','story.title'));
    b.appendChild(fieldText('Tagline','story.tagline',{area:true}));
    b.appendChild(fieldText('Introduction','story.intro',{area:true}));
    b.appendChild(fieldText('Release status badge','story.releaseStatus'));
    b.appendChild(fieldText('Release sub-line','story.releaseSub'));
    b.appendChild(fieldSelect('Hero artwork (built-in)','story.art',ART_OPTIONS.map(a=>({v:a,t:a}))));
    b.appendChild(fieldImage('Hero image (upload or URL — overrides artwork)','story.image'));
    b.appendChild(fieldText('Story recap (“The Story So Far”)','recap',{area:true}));
  }
  else if(ADMIN_TAB==='chapters'){
    b.appendChild(note('Reorder with ▲▼. Set each chapter Live now or Schedule a date/time. Toggle which elements appear. Add an icon image to replace the number.'));
    STATE.chapters.forEach((ch,i)=>b.appendChild(chapterEditor(ch,i)));
    const add=el('button','add-btn','＋ Add chapter'); add.onclick=()=>{STATE.chapters.push(newChapter(STATE.chapters.length+1));E.render(STATE,'#app');renderAdminBody();}; b.appendChild(add);
  }
  else if(ADMIN_TAB==='giveaway'){
    b.appendChild(fieldText('Kicker line','giveaway.kicker',{area:true}));
    b.appendChild(fieldText('Logo word','giveaway.logo'));
    b.appendChild(fieldText('Logo sub-line','giveaway.logoSub'));
    b.appendChild(fieldText('Headline','giveaway.title',{area:true}));
    b.appendChild(fieldText('Description','giveaway.description',{area:true}));
    b.appendChild(fieldText('Closing tagline','giveaway.tagline'));
    b.appendChild(listEditor('Rewards','giveaway.rewards'));
    b.appendChild(fieldSelect('Prize artwork','giveaway.art',ART_OPTIONS.map(a=>({v:a,t:a}))));
    b.appendChild(fieldImage('Prize image','giveaway.image'));
    b.appendChild(fieldText('Gleam button label','giveaway.cta.label'));
    b.appendChild(fieldText('Gleam link URL','giveaway.cta.url',{type:'url',hint:'Your live Gleam campaign.'}));
  }
  else if(ADMIN_TAB==='faq'){
    STATE.faq.forEach((q,i)=>{ const c=el('div','ed-card'); c.innerHTML=`<div class="ed-tools" style="justify-content:flex-end"><button data-up>▲</button><button data-dn>▼</button><button data-del>✕</button></div>`; c.appendChild(fieldText('Question','faq.'+i+'.q')); c.appendChild(fieldText('Answer','faq.'+i+'.a',{area:true})); $('[data-up]',c).onclick=()=>move(STATE.faq,i,-1); $('[data-dn]',c).onclick=()=>move(STATE.faq,i,1); $('[data-del]',c).onclick=()=>{STATE.faq.splice(i,1);E.render(STATE,'#app');renderAdminBody();}; b.appendChild(c); });
    const add=el('button','add-btn','＋ Add question'); add.onclick=()=>{STATE.faq.push({q:'New question',a:'Answer'});E.render(STATE,'#app');renderAdminBody();}; b.appendChild(add);
  }
  else if(ADMIN_TAB==='archive'){
    b.appendChild(fieldText('Current adventure name','archive.current.name'));
    b.appendChild(fieldText('Current adventure blurb','archive.current.blurb',{area:true}));
    b.appendChild(arrEditor('Completed adventures','archive.past',['name','blurb','status']));
    b.appendChild(arrEditor('On the horizon','archive.upcoming',['name','blurb']));
  }
  else if(ADMIN_TAB==='colours'){
    b.appendChild(note('Page design. Background, buttons and text update instantly in the preview.'));
    [['Page background','theme.bgDark'],['Headings / titles','theme.heading'],['Body text (on dark)','theme.mint'],['Forest panels','theme.forest'],['Forest (soft)','theme.forestSoft'],['Gold','theme.gold'],['Gold (bright)','theme.goldBright'],['Button colour','theme.button'],['Button text','theme.buttonText'],['Moonlit blue','theme.moonlit'],['Moonlit (deep)','theme.moonlitDeep'],['Cream panels','theme.cream'],['Ink (text on cream)','theme.ink'],['Ember accent','theme.ember']].forEach(([l,p])=>b.appendChild(fieldColor(l,p)));
  }
  else if(ADMIN_TAB==='account'){
    b.appendChild(note('“Save & Publish” pushes your changes live to everyone instantly. Export a JSON backup any time.'));
    const w=el('div'); const mk=(t,c,fn)=>{const x=el('button','btn '+c,t);x.style.cssText='width:100%;margin-bottom:8px';x.onclick=fn;return x;};
    w.appendChild(mk('💾 Save & Publish','gold',saveContent));
    w.appendChild(mk('Export backup (.json)','secondary',exportJSON));
    const imp=el('label','btn ghost'); imp.style.cssText='display:block;width:100%;text-align:center;margin-bottom:8px;'; imp.textContent='Import backup (.json)…'; const fi=el('input');fi.type='file';fi.accept='.json';fi.style.display='none';fi.onchange=importJSON;imp.appendChild(fi); w.appendChild(imp);
    w.appendChild(mk('↻ Reload published version','ghost',()=>load(true)));
    w.appendChild(mk('Log out','ghost',logout));
    b.appendChild(w);
  }
}
function listEditor(label,path){
  const f=el('div','fld'); f.innerHTML=`<label>${label}</label>`; const arr=getByPath(path)||[];
  arr.forEach((v,i)=>{ const row=el('div','fld-row'); row.style.alignItems='center'; const inp=el('input');inp.type='text';inp.value=v;inp.style.flex='1'; inp.oninput=()=>{arr[i]=inp.value;previewSoon();}; const del=el('button',null,'✕');del.style.cssText='border:1px solid rgba(19,51,47,.25);background:#f4f1e8;border-radius:7px;width:34px;cursor:pointer';del.onclick=()=>{arr.splice(i,1);E.render(STATE,'#app');renderAdminBody();}; row.appendChild(inp);row.appendChild(del);f.appendChild(row); });
  const add=el('button','add-btn','＋ Add');add.style.marginTop='6px';add.onclick=()=>{arr.push('New reward');E.render(STATE,'#app');renderAdminBody();};f.appendChild(add); return f;
}
function arrEditor(label,path,keys){
  const f=el('div','fld'); f.innerHTML=`<label>${label}</label>`; const arr=getByPath(path)||[];
  arr.forEach((obj,i)=>{ const c=el('div','ed-card'); c.innerHTML=`<div class="ed-tools" style="justify-content:flex-end"><button data-up>▲</button><button data-dn>▼</button><button data-del>✕</button></div>`; keys.forEach(k=>c.appendChild(fieldText(k[0].toUpperCase()+k.slice(1),path+'.'+i+'.'+k))); $('[data-up]',c).onclick=()=>move(arr,i,-1); $('[data-dn]',c).onclick=()=>move(arr,i,1); $('[data-del]',c).onclick=()=>{arr.splice(i,1);E.render(STATE,'#app');renderAdminBody();}; f.appendChild(c); });
  const add=el('button','add-btn','＋ Add');add.onclick=()=>{const o={};keys.forEach(k=>o[k]='');arr.push(o);E.render(STATE,'#app');renderAdminBody();};f.appendChild(add); return f;
}
function chapterEditor(ch,i){
  const p=ch.publish||(ch.publish={mode:'manual',live:true,unlockAt:''});
  const elx=ch.elements||(ch.elements={art:true,story:true,interactive:true,code:true,cta:true,reward:true});
  const live=E.isLive(ch);
  const pill=live?'<span class="pill live">Live</span>':(p.mode==='scheduled'?'<span class="pill sched">Scheduled</span>':'<span class="pill off">Hidden</span>');
  const d=el('details','ed-card');
  d.innerHTML=`<summary><span class="ch-sum">Ch ${ch.n}: ${esc(ch.title)} ${pill}</span><span class="ed-tools"><button data-up>▲</button><button data-dn>▼</button><button data-del>✕</button></span></summary><div class="ed-inner"></div>`;
  const inner=$('.ed-inner',d);
  inner.appendChild(fieldText('Chapter #','chapters.'+i+'.n'));
  inner.appendChild(fieldText('Title','chapters.'+i+'.title',{onInput:v=>{setByPath('chapters.'+i+'.title',v);$('.ch-sum',d).innerHTML=`Ch ${ch.n}: ${esc(v)} ${pill}`;}}));
  const pub=el('div','fld'); pub.innerHTML='<label>Publishing</label>'; inner.appendChild(pub);
  pub.appendChild(fieldSelect('Mode','chapters.'+i+'.publish.mode',[{v:'manual',t:'Manual (toggle live)'},{v:'scheduled',t:'Scheduled (time gate)'}],{onChange:v=>{p.mode=v;E.render(STATE,'#app');renderAdminBody();}}));
  const man=el('div','man-when'+(p.mode==='manual'?' show':'')); const lab=el('label','toggle'); const cb=el('input');cb.type='checkbox';cb.checked=p.live!==false; cb.onchange=()=>{p.live=cb.checked;E.render(STATE,'#app');renderAdminBody();}; lab.appendChild(cb);lab.appendChild(document.createTextNode(' Chapter is LIVE now')); man.appendChild(lab); pub.appendChild(man);
  const sch=el('div','sched-when'+(p.mode==='scheduled'?' show':'')); sch.appendChild(fieldText('Unlock date & time','chapters.'+i+'.publish.unlockAt',{type:'datetime-local',hint:'Unlocks automatically at this time.'})); pub.appendChild(sch);
  const tg=el('div','fld'); tg.innerHTML='<label>Show these elements</label>'; const tgs=el('div','toggles'); [['Artwork','art'],['Story','story'],['Puzzle / interactive','interactive'],['Secret code','code'],['Button (CTA)','cta'],['Reward','reward']].forEach(([l,k])=>tgs.appendChild(toggleBox(l,elx,k))); tg.appendChild(tgs); inner.appendChild(tg);
  inner.appendChild(fieldImage('Chapter icon (replaces the number)','chapters.'+i+'.icon',{hint:'Small square image or logo. Leave blank to show the number.'}));
  inner.appendChild(fieldSelect('Artwork (built-in)','chapters.'+i+'.art',ART_OPTIONS.map(a=>({v:a,t:a}))));
  inner.appendChild(fieldImage('Chapter image (overrides artwork)','chapters.'+i+'.image'));
  inner.appendChild(fieldText('Story (one paragraph per line)','chapters.'+i+'.story',{area:true,value:(ch.story||[]).join('\n\n'),onInput:v=>{ch.story=v.split(/\n{2,}|\n/).map(s=>s.trim()).filter(Boolean);}}));
  const it=ch.interactive||(ch.interactive={type:'none'});
  inner.appendChild(fieldSelect('Interactive type','chapters.'+i+'.interactive.type',[{v:'none',t:'None'},{v:'riddle',t:'Riddle (typed answer)'},{v:'quiz',t:'Quiz (multiple choice)'},{v:'runes',t:'Rune mini-game (sequence)'}],{onChange:v=>{it.type=v; if(v==='riddle'&&it.answer==null){it.prompt='';it.answer='';it.hint='';it.success='';} if(v==='quiz'&&it.options==null){it.question='';it.options=['','',''];it.correct=0;it.success='';} if(v==='runes'&&it.sequence==null){it.prompt='';it.sequence=['ᚠ','ᚢ','ᚦ'];it.success='';} E.render(STATE,'#app');renderAdminBody();}}));
  if(it.type==='riddle'){ inner.appendChild(fieldText('Prompt','chapters.'+i+'.interactive.prompt',{area:true})); inner.appendChild(fieldText('Answer','chapters.'+i+'.interactive.answer')); inner.appendChild(fieldText('Hint','chapters.'+i+'.interactive.hint')); inner.appendChild(fieldText('Success message','chapters.'+i+'.interactive.success',{area:true})); }
  else if(it.type==='quiz'){ inner.appendChild(fieldText('Question','chapters.'+i+'.interactive.question',{area:true})); inner.appendChild(fieldText('Options (one per line)','x',{area:true,value:(it.options||[]).join('\n'),onInput:v=>{it.options=v.split('\n').map(s=>s.trim()).filter(Boolean);}})); inner.appendChild(fieldText('Correct option number (1,2,3…)','x',{value:(it.correct||0)+1,onInput:v=>{it.correct=Math.max(0,(parseInt(v,10)||1)-1);}})); inner.appendChild(fieldText('Success message','chapters.'+i+'.interactive.success',{area:true})); }
  else if(it.type==='runes'){ inner.appendChild(fieldText('Prompt','chapters.'+i+'.interactive.prompt',{area:true})); inner.appendChild(fieldText('Rune sequence (space-separated)','x',{value:(it.sequence||[]).join(' '),hint:'Tapped in this order.',onInput:v=>{it.sequence=v.split(/\s+/).filter(Boolean);}})); inner.appendChild(fieldText('Success message','chapters.'+i+'.interactive.success',{area:true})); }
  inner.appendChild(fieldText('Secret code','chapters.'+i+'.secretCode',{hint:'Revealed after the puzzle is solved (or directly if no puzzle).'}));
  inner.appendChild(fieldText('Button label','chapters.'+i+'.cta.label'));
  inner.appendChild(fieldText('Button link','chapters.'+i+'.cta.url',{hint:'Use #giveaway to jump to the Giveaway Hub, or a full URL.'}));
  if(!ch.reward) ch.reward={title:'',text:''};
  const rw=el('div','fld'); rw.innerHTML='<label>Reward (optional)</label>'; rw.appendChild(fieldText('Reward title','chapters.'+i+'.reward.title')); rw.appendChild(fieldText('Reward text','chapters.'+i+'.reward.text',{area:true})); inner.appendChild(rw);
  $('[data-up]',d).onclick=e=>{e.preventDefault();move(STATE.chapters,i,-1);}; $('[data-dn]',d).onclick=e=>{e.preventDefault();move(STATE.chapters,i,1);}; $('[data-del]',d).onclick=e=>{e.preventDefault();if(confirm('Delete this chapter?')){STATE.chapters.splice(i,1);E.render(STATE,'#app');renderAdminBody();}};
  return d;
}

/* ---------- save / export ---------- */
async function saveContent(){
  flash('Publishing…');
  const r=await api('/api/save',{method:'POST',body:JSON.stringify({content:STATE})});
  if(r.ok) flash('Saved & published live ✓');
  else if(r.status===401){ flash('Session expired — please log in.'); showLogin(); }
  else flash('Save failed: '+(r.json.error||r.status));
}
function download(name,text,type){ const b=new Blob([text],{type:type||'text/plain'}); const a=el('a'); a.href=URL.createObjectURL(b); a.download=name; document.body.appendChild(a); a.click(); setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500); }
function exportJSON(){ download('etroo-content-backup.json',JSON.stringify(STATE,null,2),'application/json'); }
function importJSON(e){ const f=e.target.files[0]; if(!f)return; const r=new FileReader(); r.onload=()=>{ try{ STATE=JSON.parse(r.result); E.render(STATE,'#app'); renderAdminBody(); flash('Imported ✓ (remember to Save & Publish)'); }catch(err){ alert('Invalid JSON file.'); } }; r.readAsText(f); }
async function logout(){ await api('/api/logout',{method:'POST'}); location.reload(); }
function flash(msg){ const f=$('#admin-flash'); if(!f)return; f.textContent=msg; f.style.opacity='1'; clearTimeout(f._t); f._t=setTimeout(()=>f.style.opacity='0',1700); }

/* ---------- shell ---------- */
function mountDrawer(){
  document.body.classList.add('is-editing');
  if(!$('.editing-banner')){ const ban=el('div','editing-banner','✎ Editor mode — changes are private until you Save & Publish'); document.body.prepend(ban); }
  if(!$('#admin-flash')){ const fl=el('div'); fl.id='admin-flash'; document.body.appendChild(fl); }
  const tabs=[['story','Story'],['chapters','Chapters'],['giveaway','Giveaway'],['faq','FAQ'],['archive','Archive'],['colours','Design'],['account','Publish']];
  const launch=el('button','admin-launch','✎ Edit'); const overlay=el('div','admin-overlay'); const drawer=el('aside','admin-drawer');
  drawer.innerHTML=`<div class="admin-hd"><h2>Adventure Editor</h2><button class="admin-close">×</button></div><div class="admin-tabs">${tabs.map(t=>`<button class="admin-tab${t[0]===ADMIN_TAB?' active':''}" data-tab="${t[0]}">${t[1]}</button>`).join('')}</div><div class="admin-body" id="admin-body"></div><div class="admin-foot"><button class="btn gold" id="admin-save">Save &amp; Publish</button><button class="btn ghost" id="admin-logout">Log out</button></div>`;
  document.body.appendChild(launch); document.body.appendChild(overlay); document.body.appendChild(drawer);
  const open=()=>{overlay.classList.add('open');drawer.classList.add('open');renderAdminBody();}; const close=()=>{overlay.classList.remove('open');drawer.classList.remove('open');};
  launch.onclick=open; overlay.onclick=close; $('.admin-close',drawer).onclick=close;
  $$('.admin-tab',drawer).forEach(t=>t.onclick=()=>{ADMIN_TAB=t.dataset.tab;$$('.admin-tab',drawer).forEach(x=>x.classList.toggle('active',x===t));renderAdminBody();});
  $('#admin-save',drawer).onclick=saveContent; $('#admin-logout',drawer).onclick=logout;
  open();
}

/* ---------- login ---------- */
function showLogin(passwordSet){
  if($('.login-wrap')) return;
  const wrap=el('div','login-wrap');
  wrap.innerHTML=`<div class="panel-cream login-card"><h1>Adventure Editor</h1><p>${passwordSet===false?'Set an ADMIN_PASSWORD in Vercel to enable login.':'Enter the admin password to continue.'}</p><div class="login-err" id="login-err"></div><input type="password" id="login-pw" placeholder="Password" autocomplete="current-password"><button class="btn gold" id="login-go" style="width:100%">Enter the workshop</button></div>`;
  document.body.appendChild(wrap);
  const go=async()=>{ const pw=$('#login-pw').value; const r=await api('/api/login',{method:'POST',body:JSON.stringify({password:pw})}); if(r.ok){ wrap.remove(); start(); } else { $('#login-err').textContent=r.json.error||'Incorrect password.'; } };
  $('#login-go',wrap).onclick=go; $('#login-pw',wrap).addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  setTimeout(()=>$('#login-pw').focus(),50);
}

/* ---------- boot ---------- */
async function load(reload){ const r=await api('/api/content'); STATE=r.json && r.json.chapters ? r.json : null; if(!STATE){ try{ STATE=await (await fetch('/content.default.json')).json(); }catch(e){ STATE={story:{},chapters:[],theme:{}}; } } E.render(STATE,'#app'); E.motes('#atmos'); if(reload) renderAdminBody(); }
async function start(){ await load(); mountDrawer(); }
(async function(){
  const me=await api('/api/me');
  if(me.json && me.json.authed){ start(); }
  else { await load(); showLogin(me.json && me.json.passwordSet); }
})();
})();
