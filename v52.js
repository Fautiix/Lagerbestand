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
 const root=document.getElementById('startseite');if(!root||!currentUserProfile)return;
 root.querySelectorAll('section.v52-today').forEach(x=>x.remove());
 let box=root.querySelector('[data-v52-today]');if(!box)return;
 box.innerHTML=v52Html();
 root.querySelector('.v52-statbox')?.remove();
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
  out.push({iso,week:s.week_start,h,status:d.status||'arbeit',soll:V52_SOLL[i]||0,entries:d.entries||[]});});}
 return out;
}
function v52Range(p){const n=new Date();if(p==='woche')return v52Monday(n);if(p==='monat')return v52Iso(n).slice(0,8)+'01';const d=new Date(n);d.setMonth(d.getMonth()-({m3:3,m6:6,m12:12}[p]));return v52Iso(d);}
let v52GradN=0;
function v52Ring(pct,label,sub,c1,c2){const id='v52g'+(++v52GradN),r=34,C=2*Math.PI*r,p=Math.max(0,Math.min(1,pct/100));
 return `<div class="v52-ring"><svg viewBox="0 0 84 84" width="84" height="84"><defs><linearGradient id="${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></linearGradient></defs>
 <circle cx="42" cy="42" r="${r}" fill="none" stroke="rgba(255,255,255,.08)" stroke-width="9"/><circle cx="42" cy="42" r="${r}" fill="none" stroke="url(#${id})" stroke-width="9" stroke-linecap="round" stroke-dasharray="${C*p} ${C}" transform="rotate(-90 42 42)"/>
 <text x="42" y="47" text-anchor="middle" font-size="17" font-weight="800" fill="currentColor">${Math.round(pct)}%</text></svg><b>${label}</b><small>${sub}</small></div>`;}
function v52Bars(items,unit){if(!items.length)return '';const W=320,H=150,max=Math.max(...items.map(x=>x.v),1),bw=Math.min(34,(W-10)/items.length-6),gap=(W-items.length*bw)/(items.length+1),id='v52b'+(++v52GradN);
 return `<svg class="v52-chart" viewBox="0 0 ${W} ${H+34}" preserveAspectRatio="xMidYMid meet"><defs><linearGradient id="${id}" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#7c3aed"/><stop offset=".55" stop-color="#ec4899"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs>
 ${items.map((x,i)=>{const h=Math.max(x.v?4:0,x.v/max*(H-22)),X=gap+i*(bw+gap),Y=H-h;return `<rect x="${X}" y="${Y}" width="${bw}" height="${h}" rx="${bw/2.6}" fill="url(#${id})" opacity="${x.dim?.35:1}"/>${x.v?`<text x="${X+bw/2}" y="${Y-5}" text-anchor="middle" font-size="10" font-weight="700" fill="currentColor">${String(Math.round(x.v*10)/10).replace('.',',')}</text>`:''}<text x="${X+bw/2}" y="${H+15}" text-anchor="middle" font-size="10" fill="currentColor" opacity=".6">${x.l}</text>`;}).join('')}</svg>`;}
function v52HBars(items){if(!items.length)return '';const max=Math.max(...items.map(x=>x.v),1),g=['#ec4899,#f59e0b','#8b5cf6,#3b82f6','#f97316,#facc15','#84cc16,#22d3ee','#06b6d4,#6366f1'];
 return `<div class="v52-hb">${items.map((x,i)=>`<div><span class="n">${String(i+1).padStart(2,'0')}</span><div class="t"><i style="width:${Math.max(6,x.v/max*100)}%;background:linear-gradient(90deg,${g[i%5]})"></i><em>${v52Esc(x.l)}</em></div><span class="v">${String(Math.round(x.v*10)/10).replace('.',',')} h</span></div>`).join('')}</div>`;}
function v52StatsHtml(){
 v52GradN=0;
 const from=v52Range(v52Period),days=v52Days().filter(d=>d.iso>=from);
 const f=n=>typeof tsNumFormat==='function'?tsNumFormat(n):n.toFixed(2);
 const work=days.filter(d=>d.h>0&&d.status==='arbeit'),total=work.reduce((a,d)=>a+d.h,0);
 const arb=days.filter(d=>d.status==='arbeit'&&d.h>0),soll=arb.reduce((a,d)=>a+d.soll,0);
 const ot=arb.reduce((a,d)=>a+Math.max(0,d.h-d.soll),0);
 const weeks=new Set(days.map(d=>d.week)).size;
 const sick=days.filter(d=>d.status==='krank').length,vac=days.filter(d=>d.status==='urlaub').length,sollDays=days.filter(d=>d.soll>0).length;
 const months=Math.max(1,{woche:.25,monat:1,m3:3,m6:6,m12:12}[v52Period]);
 const tabs=[['woche','Woche'],['monat','Monat'],['m3','3 Mon.'],['m6','6 Mon.'],['m12','12 Mon.']].map(([k,l])=>`<button type="button" data-v52p="${k}" class="${k===v52Period?'on':''}">${l}</button>`).join('');
 if(!days.length)return `<div class="v52-tabs">${tabs}</div><p class="muted" style="margin-top:10px">Für diesen Zeitraum gibt es noch keine Stundenzettel.</p>`;
 const avgDay=work.length?total/work.length:0;
 // Balken: Woche → pro Tag, Monat/3M → pro Woche, 6/12M → pro Monat
 let bars=[];
 if(v52Period==='woche'){const wd=['Mo','Di','Mi','Do','Fr','Sa','So'];const m=v52Monday(new Date());bars=wd.map((l,i)=>{const d=new Date(m+'T12:00:00');d.setDate(d.getDate()+i);const x=days.find(y=>y.iso===v52Iso(d));return {l,v:x?.h||0,dim:x&&x.status!=='arbeit'};}).filter((x,i)=>i<5||x.v);}
 else if(v52Period==='monat'||v52Period==='m3'){const m=new Map();days.forEach(d=>m.set(d.week,(m.get(d.week)||0)+d.h));bars=[...m].sort().map(([w,v])=>{const d=new Date(w+'T12:00:00');const kw=Math.ceil((((d-new Date(d.getFullYear(),0,1))/864e5)+new Date(d.getFullYear(),0,1).getDay()+1)/7);return {l:'KW'+kw,v};});}
 else{const m=new Map();days.forEach(d=>m.set(d.iso.slice(0,7),(m.get(d.iso.slice(0,7))||0)+d.h));bars=[...m].sort().map(([k,v])=>({l:['Jan','Feb','Mär','Apr','Mai','Jun','Jul','Aug','Sep','Okt','Nov','Dez'][+k.slice(5)-1],v}));}
 // Baustellen-Ranking
 const sm=new Map();days.forEach(d=>d.entries.forEach(e=>{const h=typeof tsNum==='function'?tsNum(e.hours):Number(String(e.hours||0).replace(',','.'))||0;if(!h)return;const site=(typeof sites!=='undefined'&&sites.find(s=>String(s.id)===String(e.siteId)))?.name||e.siteName||e.work||'Sonstiges';sm.set(site,(sm.get(site)||0)+h);}));
 const top=[...sm].sort((a,b)=>b[1]-a[1]).slice(0,5).map(([l,v])=>({l,v}));
 const otc=ot<-0.01?'#f87171':ot>0.01?'#4ade80':'inherit';
 return `<div class="v52-tabs">${tabs}</div>
 <div class="v52-kpi"><div><b>${f(total)}</b><small>Stunden gesamt</small></div><div><b style="color:${otc}">${ot>0?'+':''}${f(ot)}</b><small>Überstunden</small></div><div><b>${f(avgDay)}</b><small>Ø h / Tag</small></div><div><b>${f(weeks?total/weeks:0)}</b><small>Ø h / Woche</small></div></div>
 <div class="v52-rings">${v52Ring(soll?arb.reduce((a,d)=>a+d.h,0)/soll*100:0,'Soll erfüllt',f(soll)+' h Soll','#ec4899','#8b5cf6')}${v52Ring(avgDay/8.5*100,'Ø Tag',f(avgDay)+' von 8,5 h','#3b82f6','#22d3ee')}${v52Ring(sollDays?sick/sollDays*100:0,'Krank',sick+' Tage'+(v52Period!=='woche'?' · Ø '+f(sick/months)+'/Mon.':''),'#f97316','#facc15')}${v52Ring(sollDays?vac/sollDays*100:0,'Urlaub',vac+' Tage','#84cc16','#22d3ee')}</div>
 <h4 class="v52-sub">${v52Period==='woche'?'Stunden pro Tag':v52Period==='monat'||v52Period==='m3'?'Stunden pro Woche':'Stunden pro Monat'}</h4>${v52Bars(bars)}
 ${v52ActHtml(days,'Was du am meisten machst')}`;
}
(function(){const st=document.createElement('style');st.textContent=`
.v52-statbox{background:radial-gradient(120% 80% at 100% 0,rgba(139,92,246,.18),transparent 60%),radial-gradient(90% 70% at 0 100%,rgba(236,72,153,.12),transparent 60%),var(--surface,#111926)}
.v52-kpi{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:14px}.v52-kpi div{text-align:center;padding:10px 4px;border-radius:14px;background:rgba(255,255,255,.04);border:1px solid rgba(255,255,255,.07)}
.v52-kpi b{display:block;font-size:20px;font-weight:800;background:linear-gradient(90deg,#f472b6,#a78bfa);-webkit-background-clip:text;background-clip:text;color:transparent}.v52-kpi b[style]{-webkit-text-fill-color:currentColor;background:none}
.v52-kpi small,.v52-ring small{font-size:11.5px;color:var(--muted,#9AA6B8)}
.v52-rings{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:14px;text-align:center}.v52-ring svg{display:block;margin:0 auto;color:var(--text,#eef4fb);width:100%;max-width:84px;height:auto}.v52-ring b{display:block;font-size:13px;margin-top:2px}
.v52-sub{margin:18px 0 6px;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted,#9AA6B8)}
.v52-chart{width:100%;height:auto;color:var(--text,#eef4fb)}
.v52-hb>div{display:flex;align-items:center;gap:10px;margin:7px 0}.v52-hb .n{font-size:18px;font-weight:300;color:var(--muted,#9AA6B8);width:26px}.v52-hb .t{flex:1;position:relative;height:26px;border-radius:999px;background:rgba(255,255,255,.06);overflow:hidden}
.v52-hb i{position:absolute;inset:0 auto 0 0;border-radius:999px}.v52-hb em{position:relative;font-style:normal;font-size:12.5px;font-weight:700;line-height:26px;padding-left:12px;color:#fff;text-shadow:0 1px 2px rgba(0,0,0,.6);white-space:nowrap}.v52-hb .v{font-size:13px;font-weight:700;width:58px;text-align:right}
@media(max-width:560px){.v52-kpi{grid-template-columns:1fr 1fr}.v52-rings{grid-template-columns:1fr 1fr}}`;document.head.append(st);})();

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

/* V52: Dokumente → Statistik (alle Mitarbeiter, für Admin / E-Meister) */
function v52DaysOf(sheets){const keep=v52Cache;v52Cache={sheets};try{return v52Days();}finally{v52Cache=keep;}}
function v52Calc(days){
 const work=days.filter(d=>d.h>0&&d.status==='arbeit'),total=work.reduce((a,d)=>a+d.h,0),arb=days.filter(d=>d.status==='arbeit'&&d.h>0),soll=arb.reduce((a,d)=>a+d.soll,0);
 return {ist:arb.reduce((a,d)=>a+d.h,0),total,workDays:work.length,avg:work.length?total/work.length:0,weeks:new Set(days.map(d=>d.week)).size,soll,ot:arb.reduce((a,d)=>a+Math.max(0,d.h-d.soll),0),
  sick:days.filter(d=>d.status==='krank').length,vac:days.filter(d=>d.status==='urlaub').length,hol:days.filter(d=>d.status==='feiertag').length,sollDays:days.filter(d=>d.soll>0).length};
}
let v52TeamPeriod='monat',v52TeamRows=null,v52TeamFrom='';
function v52CanTeam(){return (typeof isAdmin!=='undefined'&&isAdmin)||(typeof isMeister!=='undefined'&&isMeister);}
function v52TeamMode(){if(!v52CanTeam())return false;try{return localStorage.getItem('mv_v52_teamview')!=='0';}catch(_){return true;}}
async function v52OpenTeamStats(){
 const root=document.getElementById('statistik');if(!root)return;
 const can=v52CanTeam(),team=v52TeamMode();
 root.innerHTML=`<div class="v52-team"><div class="v52-head"><h2 style="margin:0">📊 Statistik</h2>${can?`<label class="v52-switch"><input type="checkbox" id="v52TeamToggle" ${team?'checked':''}> Ganzes Team anzeigen</label>`:'<small>Deine eigenen Zahlen</small>'}</div><div id="v52TeamBody" class="${team?'':'v52-statbox v52-today'}"><p class="muted">Wird geladen …</p></div></div>`;
 const t=document.getElementById('v52TeamToggle');if(t)t.onchange=()=>{try{localStorage.setItem('mv_v52_teamview',t.checked?'1':'0');}catch(_){}v52OpenTeamStats();};
 if(!team){await v52Load(true);v52DrawOwnPage();return;}
 if(!(typeof isAdmin!=='undefined'&&isAdmin))return v52DrawMeister();
 const from=v52Range('m12');
 try{if(!v52TeamRows||v52TeamFrom!==from){v52TeamRows=await rpc('app_v52_team_sheets',{p_from:from});v52TeamFrom=from;}v52DrawTeam();}
 catch(e){document.getElementById('v52TeamBody').innerHTML='<p class="muted">Statistik nicht verfügbar: '+v52Esc(e.message)+'</p>';}
}
function v52DrawOwnPage(){const b=document.getElementById('v52TeamBody');if(!b||v52TeamMode())return;b.innerHTML=!v52Cache?'<p class="muted">Wird geladen …</p>':v52Cache.sheetError?'<p class="muted">Stundenzettel derzeit nicht erreichbar.</p>':v52StatsHtml();}
document.addEventListener('click',e=>{if(e.target.closest('#statistik [data-v52p]'))setTimeout(v52DrawOwnPage,0);});
function v52DrawTeam(){
 const body=document.getElementById('v52TeamBody');if(!body)return;v52GradN=0;
 const from=v52Range(v52TeamPeriod),f=n=>typeof tsNumFormat==='function'?tsNumFormat(n):n.toFixed(2);
 const people=new Map();for(const r of v52TeamRows||[]){if(!people.has(r.user_id))people.set(r.user_id,{uid:r.user_id,name:r.name||'Mitarbeiter',entry:r.entry_date,carry:r.carryover,sheets:[]});if(r.week_start)people.get(r.user_id).sheets.push({week_start:r.week_start,data:r.data});}
 const list=[...people.values()].map(p=>{const all=v52DaysOf(p.sheets),act=v52Activity(all.filter(d=>d.iso>=from));return {main:act.groups[0]?act.groups[0][0]+' ('+Math.round(act.groups[0][1]/act.total*100)+'%)':'–',uid:p.uid,name:p.name,entry:p.entry,carryRaw:p.carry,vacx:v52Vac(p.entry,p.carry,all),...v52Calc(all.filter(d=>d.iso>=from))};});
 const T=v52Calc([]);for(const k of ['ist','total','workDays','soll','ot','sick','vac','hol','sollDays'])T[k]=list.reduce((a,p)=>a+p[k],0);
 const tabs=[['woche','Woche'],['monat','Monat'],['m3','3 Mon.'],['m6','6 Mon.'],['m12','12 Mon.']].map(([k,l])=>`<button type="button" data-v52t="${k}" class="${k===v52TeamPeriod?'on':''}">${l}</button>`).join('');
 const months=Math.max(1,{woche:.25,monat:1,m3:3,m6:6,m12:12}[v52TeamPeriod]);
 const oc=v=>v<-0.01?'#f87171':v>0.01?'#4ade80':'inherit';
 body.innerHTML=`<div class="v52-tabs">${tabs}</div>
 <div class="v52-kpi"><div><b>${f(T.total)}</b><small>Team-Stunden</small></div><div><b style="color:${oc(T.ot)}">${T.ot>0?'+':''}${f(T.ot)}</b><small>Überstunden gesamt</small></div><div><b>${T.sick}</b><small>Krankentage</small></div><div><b>${T.vac}</b><small>Urlaubstage</small></div></div>
 <div class="v52-rings">${v52Ring(T.soll?T.ist/T.soll*100:0,'Soll erfüllt',f(T.soll)+' h Soll','#ec4899','#8b5cf6')}${v52Ring(T.workDays?T.total/T.workDays/8.5*100:0,'Ø Tag',f(T.workDays?T.total/T.workDays:0)+' h','#3b82f6','#22d3ee')}${v52Ring(T.sollDays?T.sick/T.sollDays*100:0,'Krankquote',f(T.sick/months)+' Tage/Mon.','#f97316','#facc15')}${v52Ring(T.sollDays?T.vac/T.sollDays*100:0,'Urlaub',T.vac+' Tage','#84cc16','#22d3ee')}</div>
 <h4 class="v52-sub">Stunden pro Mitarbeiter</h4>${v52HBars(list.filter(p=>p.total).sort((a,b)=>b.total-a.total).slice(0,10).map(p=>({l:p.name,v:p.total})))||'<p class="muted">Noch keine Stunden in diesem Zeitraum.</p>'}
 ${v52ActHtml([...people.values()].flatMap(p=>v52DaysOf(p.sheets).filter(d=>d.iso>=from)),'Tätigkeiten im Team')}<h4 class="v52-sub">Alle Mitarbeiter</h4>
 <div class="v52-tablewrap"><table class="v52-table"><thead><tr><th>Mitarbeiter</th><th>Meiste Tätigkeit</th><th>Stunden</th><th>Ø/Tag</th><th>Ø/Woche</th><th>Überst.</th><th>🤒 Krank</th><th>Ø Krank/Mon.</th><th>🌴 Urlaub</th><th>🎉 Feiert.</th><th>Urlaub verdient</th><th>Urlaub rest</th>${isAdmin?'<th></th>':''}</tr></thead><tbody>
 ${list.sort((a,b)=>a.name.localeCompare(b.name,'de')).map(p=>`<tr><td>${v52Esc(p.name)}</td><td>${v52Esc(p.main)}</td><td>${f(p.total)}</td><td>${f(p.avg)}</td><td>${f(p.weeks?p.total/p.weeks:0)}</td><td style="color:${oc(p.ot)};font-weight:700">${p.ot>0?'+':''}${f(p.ot)}</td><td>${p.sick}</td><td>${f(p.sick/months)}</td><td>${p.vac}</td><td>${p.hol}</td><td>${p.vacx.earned} / ${p.vacx.year}</td><td style="font-weight:700;color:${p.vacx.rest<0?'#f87171':'#4ade80'}">${String(p.vacx.rest).replace('.',',')}</td>${isAdmin?`<td><button type="button" class="v33btn" data-v52vac="${p.uid}" title="Eintritt / Resturlaub">✎</button></td>`:''}</tr>`).join('')}
 </tbody></table></div>`;
 body.querySelectorAll('[data-v52vac]').forEach(b=>b.onclick=()=>{const p=list.find(x=>x.uid===b.dataset.v52vac);if(p)v52EditVac(p.uid,p.name,p.entry,p.carryRaw);});
 body.querySelectorAll('[data-v52t]').forEach(b=>b.onclick=()=>{v52TeamPeriod=b.dataset.v52t;v52DrawTeam();});
}
(function(){const st=document.createElement('style');st.textContent=`.v52-team{padding:18px;max-width:1100px;margin:0 auto}.v52-team .v52-head{margin-bottom:4px}.v52-switch{display:flex;align-items:center;gap:8px;font-weight:600;font-size:14px;cursor:pointer}.v52-switch input{width:20px;height:20px}#v52TeamBody.v52-today{margin-top:12px}
.v52-tablewrap{overflow-x:auto;border-radius:14px;border:1px solid var(--line,#1F2A3C)}.v52-table{width:100%;border-collapse:collapse;font-size:14px;white-space:nowrap}
.v52-table th{text-align:left;padding:10px 12px;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--muted,#9AA6B8);background:rgba(255,255,255,.04)}
.v52-table td{padding:10px 12px;border-top:1px solid var(--line,#1F2A3C)}.v52-table td:first-child{font-weight:700}.v52-table tr:hover td{background:rgba(139,92,246,.08)}`;document.head.append(st);})();
/* Menüpunkt „Statistik“ für alle */
setTimeout(()=>{for(const id of ['v52DeskStats','v52MoreStats']){const el=document.getElementById(id);if(el)el.hidden=false;}},0);

/* V52: Urlaub nach BRTV Bau – je 12 Beschäftigungstage 1 Urlaubstag (volle Monate = 30 Tage) */
let v52VacInfo=null;
function v52Vac(entry,carry,days){
 const now=new Date(),y=now.getFullYear(),jan=new Date(y,0,1);
 let start=entry?new Date(entry+'T12:00:00'):jan;if(start<jan)start=jan;
 let bt=0;
 if(start<=now)for(let m=start.getMonth();m<=now.getMonth();m++){
  const first=m===start.getMonth()?start.getDate():1,last=m===now.getMonth()?now.getDate():new Date(y,m+1,0).getDate(),dim=new Date(y,m+1,0).getDate();
  bt+=(first===1&&last===dim)?30:Math.min(30,last-first+1);}
 let full=0;for(let m=start.getMonth();m<12;m++){const first=m===start.getMonth()?start.getDate():1,dim=new Date(y,m+1,0).getDate();full+=first===1?30:Math.min(30,dim-first+1);}
 const earned=Math.floor(bt/12),year=Math.min(30,Math.round(full/12)),taken=(days||[]).filter(d=>d.status==='urlaub'&&d.iso.startsWith(String(y))).length;
 const c=Number(carry)||0;return {bt,earned,year,taken,carry:c,rest:c+earned-taken};
}
function v52VacHtml(x){const f=n=>String(Math.round(n*10)/10).replace('.',',');
 return `<h4 class="v52-sub">Urlaub ${new Date().getFullYear()} · BRTV Bau</h4>
 <div class="v52-kpi"><div><b>${f(x.earned)}</b><small>verdient bisher</small></div><div><b>${f(x.taken)}</b><small>genommen</small></div><div><b style="color:${x.rest<0?'#f87171':'#4ade80'}">${f(x.rest)}</b><small>verfügbar${x.carry?' (inkl. '+f(x.carry)+' Rest)':''}</small></div><div><b>${f(x.year)}</b><small>Anspruch im Jahr</small></div></div>
 <div class="v52-hb"><div><span class="n">🌴</span><div class="t"><i style="width:${Math.min(100,x.earned/Math.max(1,x.year)*100)}%;background:linear-gradient(90deg,#84cc16,#22d3ee)"></i><em>${f(x.bt)} Beschäftigungstage → ${f(x.earned)} von ${f(x.year)} Tagen verdient</em></div></div></div>`;}
const v52StatsBase=v52StatsHtml;
v52StatsHtml=function(){let h=v52StatsBase();try{if(v52Cache&&!v52Cache.sheetError){if(!v52VacInfo){v52VacInfo={};rpc('app_v52_vacation_get',{}).then(r=>{v52VacInfo=r||{};v52Paint();v52DrawOwnPage();}).catch(()=>{});}
 h+=v52VacHtml(v52Vac(v52VacInfo.entry_date,v52VacInfo.carryover,v52Days()));}}catch(e){console.warn(e);}return h;};
async function v52EditVac(uid,name,entry,carry){
 const e=prompt('Eintrittsdatum von '+name+' (TT.MM.JJJJ, leer = schon länger dabei):',entry?entry.split('-').reverse().join('.'):'');if(e===null)return;
 let iso=null;if(e.trim()){const m=e.trim().match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);if(!m)return alert('Datum bitte als TT.MM.JJJJ');iso=`${m[3]}-${m[2].padStart(2,'0')}-${m[1].padStart(2,'0')}`;}
 const c=prompt('Resturlaub aus dem Vorjahr für '+name+' (Tage):',String(carry||0).replace('.',','));if(c===null)return;
 try{await rpc('app_v52_vacation_set',{p_user:uid,p_entry:iso,p_carry:Number(c.replace(',','.'))||0});v52TeamRows=null;v52OpenTeamStats();}catch(err){alert('Speichern fehlgeschlagen: '+err.message);}
}

/* V52: Tätigkeiten – Kreisdiagramm (Baustelle / Magazin / E-Verteiler …) und Ranking-Tabelle */
const V52_PIE=['#ec4899','#8b5cf6','#3b82f6','#22d3ee','#84cc16','#facc15','#f97316','#94a3b8'];
function v52Activity(days){
 const groups=new Map(),rows=new Map(),num=x=>typeof tsNum==='function'?tsNum(x):Number(String(x||0).replace(',','.'))||0;
 for(const d of days){if(d.status&&d.status!=='arbeit')continue;for(const e of d.entries||[]){const h=num(e.hours);if(!h)continue;
  let g,label;
  if(e.kind==='site'||e.siteId){g='Baustelle';label=(typeof sites!=='undefined'&&sites.find(s=>String(s.id)===String(e.siteId)))?.name||e.work||'Baustelle';}
  else if(e.kind==='template'||e.templateId){label=(typeof tsTemplates!=='undefined'&&tsTemplates.find(t=>String(t.id)===String(e.templateId)))?.name||e.work||'Vorlage';g=label;}
  else{label=String(e.work||'').trim()||'Sonstiges';g='Sonstiges';}
  groups.set(g,(groups.get(g)||0)+h);const k=g+'|'+label;const r=rows.get(k)||{label,group:g,h:0,days:new Set()};r.h+=h;r.days.add(d.iso);rows.set(k,r);}}
 const total=[...groups.values()].reduce((a,b)=>a+b,0);
 return {total,groups:[...groups].sort((a,b)=>b[1]-a[1]),rows:[...rows.values()].sort((a,b)=>b.h-a.h)};
}
function v52Pie(groups,total){if(!total)return '';const R=70,C=2*Math.PI*R;let off=0;const top=groups.slice(0,7),rest=groups.slice(7).reduce((a,g)=>a+g[1],0);const g=rest?[...top,['Weitere',rest]]:top;
 const f=n=>String(Math.round(n*10)/10).replace('.',',');
 return `<div class="v52-pie"><svg viewBox="0 0 180 180" width="180" height="180"><circle cx="90" cy="90" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="30"/>
 ${g.map(([n,v],i)=>{const len=v/total*C,s=`<circle cx="90" cy="90" r="${R}" fill="none" stroke="${V52_PIE[i%8]}" stroke-width="30" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 90 90)"/>`;off+=len;return s;}).join('')}
 <text x="90" y="86" text-anchor="middle" font-size="22" font-weight="800" fill="currentColor">${f(total)}</text><text x="90" y="104" text-anchor="middle" font-size="11" fill="currentColor" opacity=".6">Stunden</text></svg>
 <ul>${g.map(([n,v],i)=>`<li><i style="background:${V52_PIE[i%8]}"></i><span>${v52Esc(n)}</span><b>${Math.round(v/total*100)}%</b><small>${f(v)} h</small></li>`).join('')}</ul></div>`;}
function v52ActTable(rows,total){if(!rows.length)return '';const f=n=>String(Math.round(n*10)/10).replace('.',',');
 return `<div class="v52-tablewrap"><table class="v52-table"><thead><tr><th>#</th><th>Tätigkeit</th><th>Art</th><th>Stunden</th><th>Tage</th><th>Anteil</th></tr></thead><tbody>${rows.slice(0,15).map((r,i)=>`<tr><td>${i+1}</td><td>${v52Esc(r.label)}</td><td>${v52Esc(r.group===r.label?'Vorlage':r.group)}</td><td>${f(r.h)}</td><td>${r.days.size}</td><td><span class="v52-pct"><i style="width:${r.h/total*100}%"></i></span>${Math.round(r.h/total*100)}%</td></tr>`).join('')}</tbody></table></div>`;}
function v52ActHtml(days,title){const a=v52Activity(days);if(!a.total)return '';return `<h4 class="v52-sub">${title||'Tätigkeiten'}</h4>${v52Pie(a.groups,a.total)}<h4 class="v52-sub">Ranking Tätigkeiten</h4>${v52ActTable(a.rows,a.total)}`;}
(function(){const st=document.createElement('style');st.textContent=`.v52-pie{display:flex;gap:18px;align-items:center;flex-wrap:wrap;color:var(--text,#eef4fb)}.v52-pie svg{flex:none}.v52-pie ul{list-style:none;margin:0;padding:0;flex:1;min-width:180px}
.v52-pie li{display:grid;grid-template-columns:14px 1fr auto auto;gap:8px;align-items:center;padding:5px 0;font-size:14px;border-bottom:1px solid rgba(255,255,255,.05)}.v52-pie li i{width:12px;height:12px;border-radius:4px}.v52-pie li small{color:var(--muted,#9AA6B8);min-width:52px;text-align:right}
.v52-pct{display:inline-block;width:60px;height:6px;border-radius:9px;background:rgba(255,255,255,.08);margin-right:8px;vertical-align:middle;overflow:hidden}.v52-pct i{display:block;height:100%;background:linear-gradient(90deg,#ec4899,#8b5cf6)}`;document.head.append(st);})();

/* V52: Startcode (Admin) und Pflicht zum eigenen Passwort beim ersten Login */
async function v52SetStartcode(uid){
 const pnr=prompt('Personalnummer (leer lassen = unverändert):','');if(pnr===null)return;
 const code=prompt('Neuer Startcode (mindestens 4 Zeichen). Der Mitarbeiter muss danach ein eigenes Passwort festlegen:','');if(code===null)return;
 if(code.length<4)return alert('Der Startcode braucht mindestens 4 Zeichen.');
 try{await manageAccountRequest({action:'startcode',user_id:uid,code,pnr:pnr.trim()});alert('✓ Startcode gesetzt.');loadEmployeeAccounts();}catch(e){alert('Fehler: '+e.message);}
}
let v52PwShown=false;
async function v52CheckMustChange(){
 if(v52PwShown||typeof currentUserProfile==='undefined'||!currentUserProfile||!navigator.onLine)return;
 let must=false;try{must=await rpc('app_v52_must_change',{});}catch(_){return;}
 v52PwShown=true;if(!must)return;
 const o=document.createElement('div');o.id='v52PwGate';o.style.cssText='position:fixed;inset:0;z-index:10000;background:rgba(5,9,16,.92);display:grid;place-items:center;padding:18px';
 o.innerHTML=`<div class="account-card" style="max-width:420px;width:100%"><div class="account-logo">🔑</div><h2>Eigenes Passwort festlegen</h2>
 <p>Du hast dich mit dem Startcode angemeldet. Bitte lege jetzt dein eigenes Passwort fest (mindestens 8 Zeichen).</p>
 <label for="v52Pw1">Neues Passwort</label><input id="v52Pw1" type="password" autocomplete="new-password">
 <label for="v52Pw2">Passwort wiederholen</label><input id="v52Pw2" type="password" autocomplete="new-password">
 <button class="btn primary full" id="v52PwSave" type="button">Passwort speichern</button><p id="v52PwMsg" class="muted" role="alert"></p></div>`;
 document.body.append(o);
 const msg=o.querySelector('#v52PwMsg');
 o.querySelector('#v52PwSave').onclick=async()=>{
  const a=o.querySelector('#v52Pw1').value,b=o.querySelector('#v52Pw2').value;
  if(a.length<8)return msg.textContent='Mindestens 8 Zeichen.';if(a!==b)return msg.textContent='Die Passwörter stimmen nicht überein.';
  msg.textContent='Wird gespeichert …';
  try{const token=await getAuthToken();const r=await fetch(SUPABASE_URL+'/auth/v1/user',{method:'PUT',headers:{apikey:SUPABASE_KEY,Authorization:'Bearer '+token,'Content-Type':'application/json'},body:JSON.stringify({password:a})});
   if(!r.ok){const t=await r.json().catch(()=>({}));throw new Error(t.msg||t.error_description||t.message||('HTTP '+r.status));}
   await rpc('app_v52_pw_changed',{});o.remove();if(typeof v38Toast==='function')v38Toast('✓ Dein Passwort ist gespeichert.',{kind:'ok'});
  }catch(e){msg.textContent='Fehler: '+(/weak|short|length|characters/i.test(e.message)?'Passwort zu kurz oder zu einfach – bitte länger wählen.':e.message);}
 };
}
setInterval(()=>{if(typeof currentUserProfile!=='undefined'&&!currentUserProfile)v52PwShown=false;v52CheckMustChange();},2000);

/* V52: Obere Suchleiste am PC nur im Lager; sonst mehr Platz (z. B. ganzer blauer Zettel im Prüfplatz) */
(function(){const st=document.createElement('style');st.textContent=`@media(min-width:1100px){html:not(.v52-onlager) header.v38-top{display:none!important}html:not(.v52-onlager) .v33document iframe{height:calc(100dvh - 120px)!important}}`;document.head.append(st);
 const sync=()=>{const p=typeof currentAppPage!=='undefined'?currentAppPage:'';document.documentElement.classList.toggle('v52-onlager',p==='lager'||p==='');};
 setInterval(sync,400);sync();})();

/* V52: Drucken im Prüfplatz (Monteurbericht und Stundenzettel) */
function v52PrintBlob(blob,name){
 const url=URL.createObjectURL(blob);
 if(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)){window.open(url,'_blank');if(typeof v38Toast==='function')v38Toast('PDF geöffnet – dort über ⋮ oder Teilen → Drucken.',{kind:'ok'});}
 else{const f=document.createElement('iframe');f.style.cssText='position:fixed;right:0;bottom:0;width:1px;height:1px;border:0;opacity:0';f.src=url;f.onload=()=>setTimeout(()=>{try{f.contentWindow.focus();f.contentWindow.print();}catch(e){window.open(url,'_blank');}},300);document.body.append(f);setTimeout(()=>f.remove(),600000);}
 setTimeout(()=>URL.revokeObjectURL(url),600000);
}
async function v52ReviewPrint(){
 const r=typeof v33Current==='function'?v33Current():null;if(!r)return;const b=document.getElementById('v52PrintBtn');if(b){b.disabled=true;b.textContent='Wird vorbereitet …';}
 try{let blob;
  if(r.type==='week'){if(!v34WeekDraft)return;const copy=structuredClone(v34WeekDraft);if(v34WeekDirty||v33Status(r)!=='geprueft')delete copy.checkedBy;blob=await tsPDF('blob',{data:copy,week:r.id,signature:!v34WeekDirty&&v33Status(r)==='geprueft'?v34Signature:''});}
  else{const w=document.getElementById('v32ReviewFrame')?.contentWindow;if(!w?.v52ReviewPdf)throw new Error('Bericht ist noch nicht geladen.');blob=await w.v52ReviewPdf();}
  if(blob)v52PrintBlob(blob);
 }catch(e){alert('Drucken nicht möglich: '+e.message);}finally{if(b){b.disabled=false;b.textContent='🖨 Drucken';}}
}
window.addEventListener('load',()=>{const h=window.v33Header;if(typeof h!=='function')return;window.v33Header=function(...a){const r=h.apply(this,a);try{const box=document.getElementById('v33DocActions');if(box&&!document.getElementById('v52PrintBtn')){const b=document.createElement('button');b.className='v33btn';b.id='v52PrintBtn';b.textContent='🖨 Drucken';b.onclick=v52ReviewPrint;box.append(b);}}catch(e){console.warn(e);}return r;};});

/* V52: E-Meister/Admin trägt Krank/Urlaub/Feiertag für Mitarbeiter ein (legt Stundenzettel bei Bedarf an) */
function v52AbsenceDialog(){
 const uid=typeof v32SelectedOwner!=='undefined'?v32SelectedOwner:'';if(!uid)return alert('Bitte zuerst links einen Mitarbeiter auswählen.');
 const name=typeof v33Name==='function'?v33Name(uid):'Mitarbeiter';const wk=(typeof v34Week!=='undefined'&&/^\d{4}-\d{2}-\d{2}$/.test(v34Week))?v34Week:v52Monday(new Date());
 const days=['Mo','Di','Mi','Do','Fr','Sa','So'];
 const el=typeof v34Modal==='function'?v34Modal('Abwesenheit eintragen · '+name,`
  <label>Woche (Montag)</label><input type="date" id="v52AbsWeek" value="${wk}">
  <label style="margin-top:10px">Art</label><select id="v52AbsType"><option value="krank">🤒 Krank</option><option value="urlaub">🌴 Urlaub</option><option value="feiertag">🎉 Feiertag</option><option value="arbeit">Zurücksetzen (Arbeit)</option></select>
  <label style="margin-top:10px">Tage</label><div style="display:flex;gap:6px;flex-wrap:wrap">${days.map((d,i)=>`<label style="display:flex;align-items:center;gap:4px;padding:6px 10px;border:1px solid var(--line2,#2A3750);border-radius:10px"><input type="checkbox" data-absday="${i}" ${i<5?'checked':''}> ${d}</label>`).join('')}</div>
  <p class="muted" style="font-size:13px">Gibt es für die Woche noch keinen Stundenzettel, wird er angelegt. Krank/Urlaub zählen in der Statistik nicht als Minus.</p>
  <div class="v34modalactions"><button class="btn primary" data-v52abs>Eintragen</button></div>`):null;
 if(!el)return;
 el.querySelector('[data-v52abs]').onclick=async()=>{
  let w=el.querySelector('#v52AbsWeek').value;if(!w)return;w=v52Monday(new Date(w+'T12:00:00'));
  const sel=[...el.querySelectorAll('[data-absday]')].filter(x=>x.checked).map(x=>+x.dataset.absday);if(!sel.length)return alert('Bitte mindestens einen Tag wählen.');
  let pnr='';try{pnr=(await supabase('app_user_profiles?select=personnel_number&user_id=eq.'+encodeURIComponent(uid)))?.[0]?.personnel_number||'';}catch(_){}
  try{await rpc('app_v52_set_week_status',{target_user:uid,target_week:w,p_days:sel,p_status:el.querySelector('#v52AbsType').value,p_name:name,p_pnr:pnr});
   el.remove();if(typeof v38Toast==='function')v38Toast('✓ Eingetragen für '+name+' ('+tsWeekLabel(w)+')',{kind:'ok'});v52TeamRows=null;
   try{v34Week=w;v33Type='week';v32ReviewFilter='all';}catch(_){}
   if(typeof renderReviewCenter==='function')await renderReviewCenter();
  }catch(e){alert('Speichern fehlgeschlagen: '+e.message);}
 };
}
window.addEventListener('load',()=>{const d=window.v33DrawReports;if(typeof d!=='function')return;window.v33DrawReports=function(...a){const r=d.apply(this,a);try{const head=document.querySelector('#pruefbereich .v33reports .v33panehead');if(head&&!head.querySelector('#v52AbsBtn')){const b=document.createElement('button');b.className='v33btn';b.id='v52AbsBtn';b.textContent='🤒/🌴 Krank oder Urlaub eintragen';b.style.marginTop='8px';b.onclick=v52AbsenceDialog;head.append(b);}}catch(e){console.warn(e);}return r;};});

/* V52: Online-/Versionsstatus am PC immer unten links in der Seitenleiste */
(function(){const st=document.createElement('style');st.textContent=`.v52-sidefoot{margin-top:auto;padding:12px 10px 6px}.v52-sidefoot .version-box{display:flex;flex-direction:column;gap:6px;align-items:flex-start}.v52-sidefoot .version-status{width:100%;justify-content:flex-start}`;document.head.append(st);
 let home=null;
 const place=()=>{const box=document.querySelector('.version-box'),side=document.querySelector('aside.desk31-sidebar');if(!box||!side)return;
  if(!home)home=box.parentElement;
  if(innerWidth>=1100){let f=side.querySelector('.v52-sidefoot');if(!f){f=document.createElement('div');f.className='v52-sidefoot';side.append(f);}if(box.parentElement!==f)f.append(box);}
  else if(box.parentElement!==home)home.prepend(box);};
 window.addEventListener('resize',place);setInterval(place,1500);document.addEventListener('DOMContentLoaded',place);place();})();

/* V52: Prüfplatz – linke und mittlere Liste wachsen nicht mit dem geöffneten Zettel mit */
(function(){const st=document.createElement('style');st.textContent=`@media(min-width:900px){#pruefbereich .v33grid{align-items:start}#pruefbereich .v33staff,#pruefbereich .v33reports{position:sticky;top:12px;max-height:calc(100dvh - 140px)}#pruefbereich .v33staff .v33scroll,#pruefbereich .v33reports .v33scroll{flex:1 1 auto;min-height:0}}`;document.head.append(st);})();

/* V52: Feinschliff Statistik – Diagramm nicht riesig am PC, Zeitraum-Leiste ohne Scrollbalken */
(function(){const st=document.createElement('style');st.textContent=`.v52-chart{max-height:240px;max-width:640px;display:block;margin:0 auto}.v52-tabs{scrollbar-width:none}.v52-tabs::-webkit-scrollbar{display:none}`;document.head.append(st);})();

/* V52: Kleines Statistik-Widget auf der Startseite (Monat) */
function v52MiniStats(){
 const from=v52Range('monat'),days=v52Days().filter(d=>d.iso>=from),c=v52Calc(days),f=n=>typeof tsNumFormat==='function'?tsNumFormat(n):n.toFixed(2);
 let vac=null;try{vac=v52VacInfo?v52Vac(v52VacInfo.entry_date,v52VacInfo.carryover,v52Days()):null;if(!v52VacInfo){v52VacInfo={};rpc('app_v52_vacation_get',{}).then(r=>{v52VacInfo=r||{};v52Paint();}).catch(()=>{});}}catch(_){}
 return `<div class="v52-mini"><div><b>${f(c.total)}</b><small>Std. im ${new Date().toLocaleDateString('de-DE',{month:'long'})}</small></div><div><b style="color:${c.ot>0.01?'#4ade80':'inherit'}">${c.ot>0?'+':''}${f(c.ot)}</b><small>Überstunden</small></div><div><b>${c.sick}</b><small>Krankentage</small></div><div><b>${vac?String(vac.rest).replace('.',','):'–'}</b><small>Urlaub übrig</small></div></div>`;
}
(function(){const st=document.createElement('style');st.textContent=`.v52-statbox{padding:14px 16px}.v52-more{border:0;background:transparent;color:var(--accent,#6E9BFF);font-weight:700;font-size:13px;cursor:pointer;padding:4px 0}.v52-mini{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-top:10px}.v52-mini div{text-align:center;padding:8px 2px;border-radius:12px;background:rgba(255,255,255,.04)}.v52-mini b{display:block;font-size:18px;font-weight:800}.v52-mini small{font-size:11px;color:var(--muted,#9AA6B8)}@media(max-width:420px){.v52-mini b{font-size:16px}}`;document.head.append(st);})();

(function(){const st=document.createElement('style');st.textContent=`.v34w-meintag{padding:0!important;background:transparent!important;border:0!important;box-shadow:none!important}.v34w-meintag .v52-today{margin:0}`;document.head.append(st);})();

/* V52: Startseite wie iPhone/Android – lange drücken = Bearbeiten, Widgets frei mit Finger/Maus ziehen */
(function(){
 const st=document.createElement('style');st.textContent=`
@keyframes v52wig{0%{transform:rotate(-.6deg)}50%{transform:rotate(.6deg)}100%{transform:rotate(-.6deg)}}
.v52-editing .v34widgets .v34widget{touch-action:none;cursor:grab;user-select:none;-webkit-user-select:none;outline:2px dashed rgba(110,155,255,.55);outline-offset:2px}
.v52-editing .v34widgets .v34widget:nth-child(2n){animation-delay:-.16s}
.v34widget.v52-lift{animation:none!important;opacity:.35}
.v52-ghost{position:fixed;z-index:9999;pointer-events:none;transform:scale(1.05);box-shadow:0 18px 40px rgba(0,0,0,.55);border-radius:16px;opacity:.95;transition:none}
.v52-editing .v34widgets{-webkit-touch-callout:none}`;document.head.append(st);
 let drag=null,press=null,eatClick=0;
 const grid=()=>document.querySelector('#startseite .v34widgets');
 const editing=()=>typeof v34Editing!=='undefined'&&v34Editing;
 const sync=()=>{document.documentElement.classList.toggle('v52-editing',editing());document.querySelectorAll('#startseite .v34widget[draggable]').forEach(x=>x.removeAttribute('draggable'));};setInterval(sync,300);
 const flip=(fn)=>{const g=grid();if(!g)return fn();const els=[...g.children],r=new Map(els.map(e=>[e,e.getBoundingClientRect()]));fn();els.forEach(e=>{const a=r.get(e),b=e.getBoundingClientRect();if(!a)return;const dx=a.left-b.left,dy=a.top-b.top;if(dx||dy){e.animate([{transform:`translate(${dx}px,${dy}px)`},{transform:'none'}],{duration:180,easing:'ease-out'});}});};
 const finish=()=>{if(!drag)return;const g=grid();drag.ghost.remove();drag.el.classList.remove('v52-lift');
  try{const order=[...g.querySelectorAll('.v34widget[data-widget]')].map(e=>e.dataset.widget),p=v34Layout();p.widgets.sort((a,b)=>{const ia=order.indexOf(a.id),ib=order.indexOf(b.id);return (ia<0?999:ia)-(ib<0?999:ib);});v34Persist();renderStartseite();}catch(e){console.warn(e);}
  drag=null;};
 document.addEventListener('pointerdown',e=>{
  const w=e.target.closest('#startseite .v34widgets .v34widget');if(!w||e.button>0)return;
  if(e.target.closest('.v34widgettools,select,input,textarea'))return;
  const start=()=>{press=null;
   if(!editing()){const b=document.getElementById('v34EditHome');if(b){eatClick=Date.now();b.click();navigator.vibrate?.(15);}return;}
   const r=w.getBoundingClientRect(),ghost=w.cloneNode(true);ghost.classList.add('v52-ghost');ghost.style.width=r.width+'px';ghost.style.height=r.height+'px';ghost.style.left=r.left+'px';ghost.style.top=r.top+'px';document.body.append(ghost);
   w.classList.add('v52-lift');drag={el:w,ghost,dx:e.clientX-r.left,dy:e.clientY-r.top};navigator.vibrate?.(10);};
  press={x:e.clientX,y:e.clientY,t:setTimeout(start,editing()?160:550)};
 },{passive:true});
 document.addEventListener('pointermove',e=>{
  if(press&&!drag&&Math.hypot(e.clientX-press.x,e.clientY-press.y)>10){clearTimeout(press.t);press=null;}
  if(!drag)return;e.preventDefault();
  drag.ghost.style.left=(e.clientX-drag.dx)+'px';drag.ghost.style.top=(e.clientY-drag.dy)+'px';
  const over=document.elementFromPoint(e.clientX,e.clientY)?.closest('#startseite .v34widgets .v34widget');
  if(over&&over!==drag.el){const g=grid(),items=[...g.children],a=items.indexOf(drag.el),b=items.indexOf(over);flip(()=>{b>a?over.after(drag.el):over.before(drag.el);});}
  const y=e.clientY;if(y<70)scrollBy(0,-12);else if(y>innerHeight-110)scrollBy(0,12);
 },{passive:false});
 const up=()=>{if(press){clearTimeout(press.t);press=null;}finish();};
 document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up);
 document.addEventListener('contextmenu',e=>{if(e.target.closest('#startseite .v34widgets'))e.preventDefault();});
 document.addEventListener('click',e=>{if(drag||Date.now()-eatClick<800){e.preventDefault();e.stopPropagation();}},true);
})();

/* V52: Widget-Größe frei – „Ganze Reihe“ und Ziehgriff unten rechts */
(function(){
 const st=document.createElement('style');st.textContent=`.v34widgets .v34size-full{grid-column:1/-1!important;grid-row:auto!important}.v34widgets .v34size-fullbig{grid-column:1/-1!important;grid-row:span 2!important;min-height:260px}
.v52-rs{display:none;position:absolute;right:4px;bottom:4px;width:30px;height:30px;border-radius:10px;background:rgba(110,155,255,.9);color:#fff;font-size:15px;line-height:30px;text-align:center;touch-action:none;cursor:ew-resize;z-index:3;box-shadow:0 2px 8px rgba(0,0,0,.4)}
.v52-editing .v34widgets .v34widget{position:relative}.v52-editing .v52-rs{display:block}`;document.head.append(st);
 const SIZES=['small','medium','full'];
 setInterval(()=>{if(!document.documentElement.classList.contains('v52-editing'))return;document.querySelectorAll('#startseite .v34widgets .v34widget[data-widget]').forEach(w=>{if(!w.querySelector('.v52-rs')){const h=document.createElement('div');h.className='v52-rs';h.textContent='⤢';h.title='Ziehen oder antippen: Größe ändern';w.append(h);}});},400);
 let rs=null;
 document.addEventListener('pointerdown',e=>{const h=e.target.closest('.v52-rs');if(!h)return;e.stopPropagation();e.preventDefault();const w=h.closest('.v34widget');rs={w,x:e.clientX,moved:false};},true);
 document.addEventListener('pointermove',e=>{if(!rs)return;e.preventDefault();const g=rs.w.parentElement,col=g.getBoundingClientRect().width/Math.max(1,getComputedStyle(g).gridTemplateColumns.split(' ').length),steps=Math.round((e.clientX-rs.x)/(col*.8));if(steps){rs.moved=true;rs.x=e.clientX;set(rs.w,steps);}},{passive:false});
 document.addEventListener('pointerup',e=>{if(!rs)return;const r=rs;rs=null;if(!r.moved)set(r.w,1,true);save();},true);
 function set(w,steps,cycle){const p=v34Layout(),it=p.widgets.find(x=>x.id===w.dataset.widget);if(!it)return;let i=SIZES.indexOf(it.size==='large'?'medium':it.size==='fullbig'?'full':it.size);if(i<0)i=0;i=cycle?(i+1)%SIZES.length:Math.max(0,Math.min(SIZES.length-1,i+steps));it.size=SIZES[i];
  w.classList.remove('v34size-small','v34size-medium','v34size-large','v34size-full','v34size-fullbig');w.classList.add('v34size-'+it.size);navigator.vibrate?.(8);}
 function save(){try{v34Persist();renderStartseite();}catch(e){console.warn(e);}}
})();

/* V52: E-Meister – nur Anteile der Tätigkeiten im Team, keine Stunden, keine Personen */
let v52MeisterPeriod='monat';
async function v52DrawMeister(){
 const body=document.getElementById('v52TeamBody');if(!body)return;body.className='';
 const tabs=[['woche','Woche'],['monat','Monat'],['m3','3 Mon.'],['m6','6 Mon.'],['m12','12 Mon.']].map(([k,l])=>`<button type="button" data-v52m="${k}" class="${k===v52MeisterPeriod?'on':''}">${l}</button>`).join('');
 body.innerHTML=`<div class="v52-tabs">${tabs}</div><p class="muted">Wird geladen …</p>`;
 body.querySelectorAll('[data-v52m]').forEach(b=>b.onclick=()=>{v52MeisterPeriod=b.dataset.v52m;v52DrawMeister();});
 let rows=[];try{rows=await rpc('app_v52_team_activity',{p_from:v52Range(v52MeisterPeriod)})||[];}catch(e){body.innerHTML=`<div class="v52-tabs">${tabs}</div><p class="muted">Nicht verfügbar: ${v52Esc(e.message)}</p>`;return;}
 const p=x=>String(Math.round(Number(x)*10)/10).replace('.',',')+' %';
 const R=70,C=2*Math.PI*R;let off=0;const top=rows.slice(0,7),rest=rows.slice(7).reduce((a,r)=>a+Number(r.share),0),g=rest?[...top,{label:'Weitere',kind:'',share:rest}]:top;
 const pie=!rows.length?'<p class="muted" style="margin-top:12px">Für diesen Zeitraum gibt es noch keine Einträge.</p>':`<h4 class="v52-sub">Wo das Team gearbeitet hat</h4><div class="v52-pie"><svg viewBox="0 0 180 180" width="180" height="180"><circle cx="90" cy="90" r="${R}" fill="none" stroke="rgba(255,255,255,.06)" stroke-width="30"/>${g.map((r,i)=>{const len=Number(r.share)/100*C,s=`<circle cx="90" cy="90" r="${R}" fill="none" stroke="${V52_PIE[i%8]}" stroke-width="30" stroke-dasharray="${len} ${C-len}" stroke-dashoffset="${-off}" transform="rotate(-90 90 90)"/>`;off+=len;return s;}).join('')}<text x="90" y="96" text-anchor="middle" font-size="15" font-weight="800" fill="currentColor">Team</text></svg>
 <ul>${g.map((r,i)=>`<li><i style="background:${V52_PIE[i%8]}"></i><span>${v52Esc(r.label)}</span><b>${p(r.share)}</b><small>${v52Esc(r.kind||'')}</small></li>`).join('')}</ul></div>
 <h4 class="v52-sub">Ranking</h4><div class="v52-tablewrap"><table class="v52-table"><thead><tr><th>#</th><th>Baustelle / Tätigkeit</th><th>Art</th><th>Anteil</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${v52Esc(r.label)}</td><td>${v52Esc(r.kind)}</td><td><span class="v52-pct"><i style="width:${Number(r.share)}%"></i></span>${p(r.share)}</td></tr>`).join('')}</tbody></table></div>`;
 body.innerHTML=`<div class="v52-tabs">${tabs}</div><p class="muted" style="margin:10px 0 0">Anteile aller Mitarbeiter zusammen – ohne Stunden und ohne einzelne Personen.</p>${pie}`;
 body.querySelectorAll('[data-v52m]').forEach(b=>b.onclick=()=>{v52MeisterPeriod=b.dataset.v52m;v52DrawMeister();});
}

/* V52: Admin-Vorschau „Als E-Meister ansehen“ – nur für den echten Admin sichtbar */
let v52AsMeister=false,v52RealAdmin=false;
function v52ToggleAsMeister(on){
 v52AsMeister=on;
 if(on){isAdmin=false;try{adminViewEnabled=false;}catch(_){}isMeister=true;}
 else{isAdmin=true;}
 try{updateAdminUI();}catch(_){}
 v52TeamRows=null;
 try{const p=typeof currentAppPage!=='undefined'?currentAppPage:'startseite';navigateApp(p);}catch(_){}
 v52AsMeisterUI();
}
function v52AsMeisterUI(){
 let bar=document.getElementById('v52AsMeisterBar');
 if(v52AsMeister){if(!bar){bar=document.createElement('div');bar.id='v52AsMeisterBar';bar.style.cssText='position:fixed;left:50%;transform:translateX(-50%);bottom:calc(env(safe-area-inset-bottom,0px) + 86px);z-index:9998;background:#6d28d9;color:#fff;padding:9px 14px;border-radius:999px;font-weight:700;font-size:13px;box-shadow:0 6px 18px rgba(0,0,0,.45);display:flex;gap:10px;align-items:center';bar.innerHTML='👁 Ansicht als E-Meister <button type="button" style="border:0;border-radius:999px;padding:5px 10px;font-weight:700;cursor:pointer">Beenden</button>';bar.querySelector('button').onclick=()=>v52ToggleAsMeister(false);document.body.append(bar);}}
 else bar?.remove();
 document.querySelectorAll('.v52-asm-btn').forEach(b=>{b.hidden=!v52RealAdmin||v52AsMeister;});
}
setInterval(()=>{
 if(typeof isAdmin==='undefined')return;
 if(isAdmin&&!v52AsMeister)v52RealAdmin=true;
 if(typeof currentUserProfile!=='undefined'&&!currentUserProfile){v52RealAdmin=false;if(v52AsMeister){v52AsMeister=false;}}
 if(v52AsMeister&&isAdmin){isAdmin=false;try{updateAdminUI();}catch(_){}}
 if(v52RealAdmin){
  const side=document.querySelector('aside.desk31-sidebar .v52-sidefoot')||document.querySelector('aside.desk31-sidebar');
  if(side&&!side.querySelector('.v52-asm-btn')){const b=document.createElement('button');b.type='button';b.className='desk31-link v52-asm-btn';b.innerHTML='<span>👁 Als E-Meister ansehen</span>';b.onclick=()=>v52ToggleAsMeister(true);side.prepend(b);}
  const more=document.getElementById('v52MoreStats')?.parentElement;
  if(more&&!more.querySelector('.v52-asm-btn')){const b=document.createElement('button');b.type='button';b.className='v52-asm-btn';b.innerHTML='<span>👁 Als E-Meister ansehen</span>';b.onclick=()=>{try{document.querySelector('[data-close-more],.more-close')?.click();}catch(_){}v52ToggleAsMeister(true);};more.append(b);}
 }
 v52AsMeisterUI();
},800);
