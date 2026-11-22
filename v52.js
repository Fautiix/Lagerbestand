/* V52 – Für Monteure: „Mein Tag“, eigene Stundenübersicht, „Wie Vortag“, Großansicht */
(function(){
 if(document.getElementById('v52-style'))return;
 const st=document.createElement('style');st.id='v52-style';st.textContent=`
.v52-today{margin:0 0 16px;padding:16px;border-radius:16px;border:1px solid var(--line,#1F2A3C);background:var(--surface,#111926)}
.v52-head{display:flex;justify-content:space-between;align-items:baseline;gap:8px;flex-wrap:wrap}
.v52-head h3{margin:0;font-size:18px}.v52-head small{color:var(--muted,#9AA6B8)}
.v52-job{margin-top:12px;padding:12px 14px;border-radius:12px;border-left:5px solid var(--wp-color,#6E9BFF);background:var(--surface2,#162031)}
.v52-job b{font-size:17px;display:block}.v52-job p{margin:4px 0 0;font-size:14px;color:var(--muted,#9AA6B8)}
.v52-job ul{margin:6px 0 0;padding-left:18px;font-size:14px}
.v52-links{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}
.v52-links a,.v52-links button{min-height:44px;display:inline-flex;align-items:center;padding:0 14px;border-radius:10px;border:1px solid var(--line2,#2A3750);background:var(--surface,#111926);color:var(--text,#eef4fb);font-weight:600;font-size:14px;text-decoration:none;cursor:pointer}
.v52-quick{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:12px}
.v52-quick button{min-height:56px;border-radius:12px;border:1px solid var(--accent-strong,#3567E0);background:var(--accent-strong,#3567E0);color:#fff;font-weight:700;font-size:14px;cursor:pointer}
.v52-hours{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
.v52-hours div{flex:1;min-width:90px;padding:8px 12px;border-radius:12px;background:var(--surface2,#162031);border:1px solid var(--line,#1F2A3C);font-size:12.5px;color:var(--muted,#9AA6B8)}
.v52-hours b{display:block;font-size:19px;color:var(--text,#eef4fb)}
.v52-copy{margin:8px 0}
@media(max-width:560px){.v52-quick{grid-template-columns:1fr 1fr}}
`;document.head.append(st);
 try{localStorage.removeItem('mv_v52_gross');}catch(_){}
})();

const v52Esc=x=>typeof escapeHtml==='function'?escapeHtml(String(x??'')):String(x??'');
const v52Iso=d=>`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function v52Monday(d){d=new Date(d);d.setHours(12);d.setDate(d.getDate()-(d.getDay()+6)%7);return v52Iso(d);}
let v52Cache=null,v52Busy=false;

async function v52Load(force){
 const u=currentUserProfile?.user_id;if(!u||v52Busy)return;
 if(!force&&v52Cache?.u===u&&Date.now()-v52Cache.at<60000)return;
 v52Busy=true;
 const now=new Date(),week=v52Monday(now),next=v52Monday(new Date(now.getTime()+7*864e5));
 const res={u,at:Date.now(),plans:[],sheets:[],planError:false,sheetError:false};
 try{res.plans=(await Promise.all([rpc('app_v45_plan_get',{p_week:week}),rpc('app_v45_plan_get',{p_week:next})])).flatMap(p=>p?.published||[]);}catch(e){res.planError=true;}
 try{res.sheets=await supabase('weekly_timesheets?select=week_start,data&user_id=eq.'+encodeURIComponent(u)+'&order=week_start.desc&limit=8')||[];}catch(e){res.sheetError=true;}
 v52Cache=res;v52Busy=false;v52Paint();
}

function v52Hours(){
 const out={week:0,month:0,last:0,hasWeek:false,hasLast:false};if(!v52Cache)return out;
 const now=new Date(),week=v52Monday(now),lastWeek=v52Monday(new Date(now.getTime()-7*864e5)),mon=v52Iso(now).slice(0,7);
 for(const s of v52Cache.sheets){
  if(s.week_start===week)out.hasWeek=true;if(s.week_start===lastWeek)out.hasLast=true;
  (s.data?.days||[]).forEach((d,i)=>{
   const h=(d.entries||[]).reduce((v,e)=>v+(typeof tsNum==='function'?tsNum(e.hours):Number(String(e.hours||0).replace(',','.'))||0),0);
   if(!h)return;const day=new Date(s.week_start+'T12:00:00');day.setDate(day.getDate()+i);
   if(s.week_start===week)out.week+=h;if(s.week_start===lastWeek)out.last+=h;if(v52Iso(day).slice(0,7)===mon)out.month+=h;
  });
 }
 const wd=Math.min(5,(now.getDay()+6)%7+1);out.weekSoll=[8.5,8.5,8.5,8.5,6].slice(0,wd).reduce((a,b)=>a+b,0);out.weekDiff=out.week-out.weekSoll;out.lastDiff=out.last-40;
 return out;
}

function v52Job(a){
 const s=a.kind==='site'?sites.find(x=>String(x.id)===String(a.siteId)):null;
 const addr=s?.address?String(s.address).trim():'';
 const color=a.kind==='site'?'#6E9BFF':'#cca55c';
 const meta=[s?.order_number?'Auftrag '+s.order_number:'',s?.contact_person?'Ansprechpartner: '+s.contact_person:''].filter(Boolean).join(' · ');
 return `<div class="v52-job" style="--wp-color:${color}"><b>${v52Esc(a.label)}</b>${addr?`<p>📍 ${v52Esc(addr)}</p>`:''}${meta?`<p>${v52Esc(meta)}</p>`:''}${(a.tasks||[]).length?`<ul>${a.tasks.map(t=>`<li>${v52Esc(t.text)}</li>`).join('')}</ul>`:''}
 ${addr||s?.contact_email?`<div class="v52-links">${addr?`<a href="https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(addr)}" target="_blank" rel="noopener">🧭 Navigation starten</a>`:''}${s?.contact_email?`<a href="mailto:${encodeURIComponent(s.contact_email)}">✉ E-Mail</a>`:''}</div>`:''}</div>`;
}

function v52Html(){
 const u=currentUserProfile?.user_id,today=v52Iso(new Date());
 let body='<p class="muted">Wird geladen …</p>',title='Mein Tag',sub=new Date().toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'2-digit'});
 if(v52Cache){
  if(v52Cache.planError)body='<p class="muted">Wochenplan derzeit nicht erreichbar.</p>';
  else{
   const mine=v52Cache.plans.filter(a=>(a.employees||[]).includes(u));
   let items=mine.filter(a=>a.date===today);
   if(!items.length){const nd=mine.map(a=>a.date).filter(d=>d>today).sort()[0];
    if(nd){items=mine.filter(a=>a.date===nd);title='Nächster Einsatz';sub=new Date(nd+'T12:00:00').toLocaleDateString('de-DE',{weekday:'long',day:'2-digit',month:'2-digit'});}}
   body=items.length?items.map(v52Job).join(''):'<p class="muted">Für heute ist nichts eingeplant.</p>';
  }
 }
 const h=v52Hours(),f=n=>typeof tsNumFormat==='function'?tsNumFormat(n):n.toFixed(2);
 return `<div class="v52-head"><h3>${title}</h3><small>${v52Esc(sub)}</small></div>${body}
 <div class="v52-quick"><button type="button" data-v52="bericht">📄 Montagebericht</button><button type="button" data-v52="stunden">🕒 Stunden</button></div>
 ${v52Cache&&!v52Cache.sheetError?`<div class="v52-hours"><div><b>${f(h.week)} h</b>diese Woche</div><div><b>${f(h.last)} h</b>letzte Woche</div><div><b>${f(h.month)} h</b>dieser Monat</div></div>${h.hasWeek||h.hasLast?`<div class="v52-hours">${h.hasWeek?`<div><b style="color:${h.weekDiff<0?'var(--muted,#9AA6B8)':'var(--ok,#4CC994)'}">${h.weekDiff>0?'+':''}${f(h.weekDiff)} h</b>Überstunden diese Woche (Soll bis heute ${f(h.weekSoll)} h)</div>`:''}${h.hasLast?`<div><b style="color:${h.lastDiff<0?'#e47f7f':'var(--ok,#4CC994)'}">${h.lastDiff>0?'+':''}${f(h.lastDiff)} h</b>Überstunden letzte Woche (Soll 40 h)</div>`:''}</div>`:''}`:''}`;
}

function v52Paint(){
 const root=document.getElementById('startseite');if(!root||!currentUserProfile||(typeof v34Editing!=='undefined'&&v34Editing))return;
 let box=root.querySelector('.v52-today');
 if(!box){box=document.createElement('section');box.className='v52-today';const head=root.querySelector('.v34homehead');head?head.after(box):root.prepend(box);}
 box.innerHTML=v52Html();
 box.querySelectorAll('[data-v52]').forEach(b=>b.onclick=()=>{const k=b.dataset.v52;if(k==='bericht')openMontagebericht();else navigateApp('stundenzettel');});
}

/* „Wie Vortag“: Zeiten und Tätigkeiten des letzten ausgefüllten Tages übernehmen */
function v52CopyPrev(i){
 if(!tsData?.days?.[i])return;tsCapture();
 let src=-1;for(let k=i-1;k>=0;k--){if((tsData.days[k].entries||[]).some(e=>e.work||e.hours||e.siteId||e.templateId)){src=k;break;}}
 if(src<0)return v38Toast('Kein vorheriger Tag mit Einträgen in dieser Woche.',{kind:'err'});
 const cur=tsData.days[i],filled=(cur.entries||[]).some(e=>e.work||e.hours||e.siteId||e.templateId);
 const go=()=>{const s=tsData.days[src];cur.from=s.from;cur.to=s.to;if('pause' in s)cur.pause=s.pause;
  cur.entries=(s.entries||[]).map(e=>{const c=JSON.parse(JSON.stringify(e));delete c.importSource;delete c.importId;return c;});
  if(typeof tsSyncEntry==='function')cur.entries.forEach(e=>{try{tsSyncEntry(e);}catch(_){}});
  tsView='day';tsActiveDay=i;renderTimesheet();tsQueueSave();v38Toast('Vom '+['Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag','Sonntag'][src]+' übernommen.',{kind:'ok'});};
 if(filled&&typeof v38Confirm==='function')v38Confirm('Die Einträge dieses Tages werden ersetzt. Fortfahren?',{ok:'Übernehmen'}).then(ok=>ok&&go());else go();
}

window.addEventListener('load',()=>{
 const rs=window.renderStartseite;
 if(typeof rs==='function')window.renderStartseite=function(...a){const r=rs.apply(this,a);try{v52Paint();void v52Load();}catch(e){console.warn('V52:',e);}return r;};
 const rt=window.renderTimesheet;
 if(typeof rt==='function')window.renderTimesheet=function(...a){const r=rt.apply(this,a);try{
  if(tsView==='day'&&tsActiveDay>0){const el=document.getElementById('stundenzettel'),add=el?.querySelector('.tz-add');
   if(add&&!el.querySelector('.v52-copy')){const b=document.createElement('button');b.type='button';b.className='tz-add v52-copy';b.textContent='↻ Wie Vortag übernehmen';b.onclick=()=>v52CopyPrev(tsActiveDay);add.after(b);}}
 }catch(e){console.warn('V52:',e);}return r;};
 document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible'&&typeof currentAppPage!=='undefined'&&currentAppPage==='startseite')void v52Load(true);});
 if(typeof currentUserProfile!=='undefined'&&currentUserProfile&&currentAppPage==='startseite'){v52Paint();void v52Load();}
});

/* V52 Offline: Hinweisleiste und automatisches Nachladen/Hochladen, sobald wieder Internet da ist */
(function(){
 const bar=document.createElement('div');bar.id='v52Offline';bar.hidden=true;
 bar.style.cssText='position:fixed;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top,0px) + 6px);z-index:9999;background:#7a4b12;color:#fff;padding:7px 14px;border-radius:999px;font-size:13px;font-weight:600;box-shadow:0 4px 14px rgba(0,0,0,.35);max-width:92vw;text-align:center';
 bar.textContent='📴 Offline – Eingaben werden gespeichert und später übertragen';
 const set=()=>{bar.hidden=navigator.onLine;};
 document.addEventListener('DOMContentLoaded',()=>{document.body.append(bar);set();});
 if(document.body){document.body.append(bar);set();}
 window.addEventListener('offline',set);
 window.addEventListener('online',()=>{set();setTimeout(async()=>{
  if(typeof currentUserProfile==='undefined'||!currentUserProfile)return;
  try{if(typeof tsData!=='undefined'&&tsData&&typeof tsSave==='function')await tsSave(true);}catch(e){console.warn('V52 Nachsync Stunden:',e);}
  try{if(typeof loadAll==='function')await loadAll();}catch(e){console.warn(e);}
  try{void v52Load(true);}catch(_){}
  try{const f=document.getElementById('reportFrame')?.contentWindow;if(f&&typeof f.v52SyncPending==='function')f.v52SyncPending();}catch(_){}
  if(typeof v38Toast==='function')v38Toast('Wieder online – Daten abgeglichen.',{kind:'ok'});
 },1500);});
})();
