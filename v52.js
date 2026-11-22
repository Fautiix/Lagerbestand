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
 try{res.sheets=await supabase('weekly_timesheets?select=week_start,data&user_id=eq.'+encodeURIComponent(u)+'&order=week_start.desc&limit=56')||[];}catch(e){res.sheetError=true;}
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
 `;
}

function v52Paint(){
 const root=document.getElementById('startseite');if(!root||!currentUserProfile||(typeof v34Editing!=='undefined'&&v34Editing))return;
 let box=root.querySelector('.v52-today');
 if(!box){box=document.createElement('section');box.className='v52-today';const head=root.querySelector('.v34homehead');head?head.after(box):root.prepend(box);}
 box.innerHTML=v52Html();
 let sb=root.querySelector('.v52-statbox');if(!sb){sb=document.createElement('section');sb.className='v52-today v52-statbox';box.after(sb);}
 sb.innerHTML=`<div class="v52-head"><h3>📈 Meine Statistik</h3><small>Arbeitszeit · Überstunden · Fehltage</small></div>${!v52Cache?'<p class="muted">Wird geladen …</p>':v52Cache.sheetError?'<p class="muted">Stundenzettel derzeit nicht erreichbar.</p>':v52StatsHtml()}`;
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

/* V52: „Zuletzt online“ – Lebenszeichen alle 5 Minuten, solange die App offen ist */
(function(){
 let last=0;
 const ping=()=>{if(document.visibilityState!=='visible'||!navigator.onLine||typeof currentUserProfile==='undefined'||!currentUserProfile)return;
  if(Date.now()-last<240000)return;last=Date.now();rpc('app_v52_touch',{}).catch(()=>{last=0;});};
 setInterval(ping,60000);document.addEventListener('visibilitychange',ping);window.addEventListener('online',ping);setTimeout(ping,5000);
})();


/* V52: Persönliche Statistik – Woche, Monat, 3/6/12 Monate */
const V52_SOLL=[8.5,8.5,8.5,8.5,6,0,0];
const V52_STATUS={arbeit:'Arbeit',krank:'🤒 Krank',urlaub:'🌴 Urlaub',feiertag:'🎉 Feiertag'};
let v52Period='woche';
function v52Days(){
 const out=[];if(!v52Cache)return out;const today=v52Iso(new Date());
 for(const s of v52Cache.sheets){(s.data?.days||[]).forEach((d,i)=>{const day=new Date(s.week_start+'T12:00:00');day.setDate(day.getDate()+i);const iso=v52Iso(day);if(iso>today)return;
  const h=(d.entries||[]).reduce((v,e)=>v+(typeof tsNum==='function'?tsNum(e.hours):Number(String(e.hours||0).replace(',','.'))||0),0);
  out.push({iso,week:s.week_start,h,status:d.status||'arbeit',soll:V52_SOLL[i]||0});});}
 return out;
}
function v52Range(p){const n=new Date();if(p==='woche')return v52Monday(n);if(p==='monat')return v52Iso(n).slice(0,8)+'01';const d=new Date(n);d.setMonth(d.getMonth()-({m3:3,m6:6,m12:12}[p]));return v52Iso(d);}
function v52StatsHtml(){
 const from=v52Range(v52Period),days=v52Days().filter(d=>d.iso>=from);
 const f=n=>typeof tsNumFormat==='function'?tsNumFormat(n):n.toFixed(2);
 const work=days.filter(d=>d.h>0),total=work.reduce((a,d)=>a+d.h,0);
 const soll=days.filter(d=>d.status==='arbeit').reduce((a,d)=>a+d.soll,0);
 const ot=days.filter(d=>d.status==='arbeit').reduce((a,d)=>a+d.h,0)-soll;
 const weeks=new Set(days.map(d=>d.week)).size;
 const sick=days.filter(d=>d.status==='krank').length,vac=days.filter(d=>d.status==='urlaub').length;
 const months=Math.max(1,{woche:.25,monat:1,m3:3,m6:6,m12:12}[v52Period]);
 const tabs=[['woche','Woche'],['monat','Monat'],['m3','3 Mon.'],['m6','6 Mon.'],['m12','12 Mon.']].map(([k,l])=>`<button type="button" data-v52p="${k}" class="${k===v52Period?'on':''}">${l}</button>`).join('');
 const otc=ot<-0.01?'#e47f7f':ot>0.01?'var(--ok,#4CC994)':'inherit';
 return `<div class="v52-tabs">${tabs}</div>${!days.length?'<p class="muted" style="margin-top:10px">Für diesen Zeitraum gibt es noch keine Stundenzettel.</p>':`
 <div class="v52-hours"><div><b>${f(total)} h</b>Stunden gesamt</div><div><b>${f(work.length?total/work.length:0)} h</b>Ø pro Arbeitstag</div><div><b>${f(weeks?total/weeks:0)} h</b>Ø pro Woche</div></div>
 <div class="v52-hours"><div><b style="color:${otc}">${ot>0?'+':''}${f(ot)} h</b>Überstunden (Soll ${f(soll)} h)</div><div><b>${sick}</b>Krankentage${v52Period!=='woche'?` · Ø ${f(sick/months)}/Monat`:''}</div><div><b>${vac}</b>Urlaubstage</div></div>`}`;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-v52p]');if(!b)return;v52Period=b.dataset.v52p;v52Paint();});
(function(){const st=document.createElement('style');st.textContent=`.v52-tabs{display:flex;gap:6px;margin-top:14px;overflow-x:auto}.v52-tabs button{flex:1;min-height:38px;padding:0 10px;border-radius:999px;border:1px solid var(--line2,#2A3750);background:transparent;color:var(--muted,#9AA6B8);font-weight:600;font-size:13px;white-space:nowrap;cursor:pointer}.v52-tabs button.on{background:var(--accent-strong,#3567E0);border-color:var(--accent-strong,#3567E0);color:#fff}.v52-status{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0}.v52-status button{min-height:40px;padding:0 12px;border-radius:10px;border:1px solid var(--line2,#2A3750);background:transparent;color:var(--text,#eef4fb);font-weight:600;cursor:pointer}.v52-status button.on{background:var(--accent-strong,#3567E0);border-color:var(--accent-strong,#3567E0);color:#fff}`;document.head.append(st);})();
/* Tagesstatus im Stundenzettel: Arbeit / Krank / Urlaub / Feiertag */
window.addEventListener('load',()=>{const rt=window.renderTimesheet;if(typeof rt!=='function')return;
 window.renderTimesheet=function(...a){const r=rt.apply(this,a);try{
  if(tsView==='day'&&tsData?.days?.[tsActiveDay]){const el=document.getElementById('stundenzettel'),add=el?.querySelector('.tz-add');
   if(add&&!el.querySelector('.v52-status')){const cur=tsData.days[tsActiveDay].status||'arbeit',w=document.createElement('div');w.className='v52-status';
    w.innerHTML=Object.entries(V52_STATUS).map(([k,l])=>`<button type="button" data-s="${k}" class="${k===cur?'on':''}">${l}</button>`).join('');
    w.onclick=ev=>{const b=ev.target.closest('[data-s]');if(!b)return;tsCapture();const d=tsData.days[tsActiveDay];if(b.dataset.s==='arbeit')delete d.status;else d.status=b.dataset.s;renderTimesheet();tsQueueSave();v52Cache=null;};
    const host=add.parentElement;host.insertBefore(w,host.firstChild);}}
 }catch(e){console.warn('V52 Status:',e);}return r;};});
